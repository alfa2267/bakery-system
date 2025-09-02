from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import uuid
import logging

from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from .models import OrderDB, CustomerDB
from .database import Base

logger = logging.getLogger(__name__)

class DeliveryZone(Base):
    """Integrated delivery zone model from partner_delivery_zone module"""
    __tablename__ = "delivery_zones"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String, nullable=True)  # Hex color for zone visualization
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Zone boundaries (could be stored as GeoJSON or simple coordinates)
    boundaries = Column(JSON, nullable=True)
    
    # Delivery schedule for this zone
    delivery_schedules = relationship("DeliverySchedule", back_populates="zone")

class DeliverySchedule(Base):
    """Integrated delivery schedule model from partner_delivery_schedule module"""
    __tablename__ = "delivery_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("delivery_zones.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(String, nullable=False)  # HH:MM format
    end_time = Column(String, nullable=False)  # HH:MM format
    is_active = Column(Boolean, default=True)
    max_orders_per_slot = Column(Integer, nullable=False, default=10)
    
    zone = relationship("DeliveryZone", back_populates="delivery_schedules")

class DeliveryAgent(Base):
    """Delivery agent management"""
    __tablename__ = "delivery_agents"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=True)
    vehicle_id = Column(Integer, ForeignKey("delivery_vehicles.id"), nullable=True)
    zone_id = Column(Integer, ForeignKey("delivery_zones.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    current_location = Column(JSON, nullable=True)  # GPS coordinates
    status = Column(String, default="available")  # available, busy, offline
    
    vehicle = relationship("DeliveryVehicle")
    zone = relationship("DeliveryZone")

class DeliveryVehicle(Base):
    """Vehicle management for deliveries"""
    __tablename__ = "delivery_vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # van, car, motorcycle, bicycle
    capacity = Column(Integer, nullable=False)  # Max orders per trip
    is_refrigerated = Column(Boolean, default=False)
    license_plate = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

class DeliveryRoute(Base):
    """Route optimization and planning"""
    __tablename__ = "delivery_routes"
    
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("delivery_agents.id"), nullable=False)
    date = Column(String, nullable=False)  # YYYY-MM-DD format
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    route_data = Column(JSON, nullable=False)  # Optimized route with stops
    total_distance = Column(Float, nullable=True)
    estimated_duration = Column(Integer, nullable=True)  # minutes
    
    agent = relationship("DeliveryAgent")

class DeliveryTracking(Base):
    """Real-time delivery tracking"""
    __tablename__ = "delivery_tracking"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    agent_id = Column(Integer, ForeignKey("delivery_agents.id"), nullable=True)
    route_id = Column(Integer, ForeignKey("delivery_routes.id"), nullable=True)
    status = Column(String, default="pending")  # pending, picked_up, in_transit, delivered
    current_location = Column(JSON, nullable=True)
    estimated_arrival = Column(DateTime, nullable=True)
    actual_arrival = Column(DateTime, nullable=True)
    tracking_code = Column(String, nullable=True)
    
    order = relationship("OrderDB")
    agent = relationship("DeliveryAgent")
    route = relationship("DeliveryRoute")

class DeliveryService:
    """Integrated delivery service combining functionality from Odoo modules"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_delivery_zone(self, name: str, description: str = None, 
                           color: str = None, boundaries: Dict = None) -> DeliveryZone:
        """Create a new delivery zone"""
        zone = DeliveryZone(
            name=name,
            description=description,
            color=color,
            boundaries=boundaries
        )
        self.db.add(zone)
        self.db.commit()
        self.db.refresh(zone)
        return zone
    
    def assign_customer_to_zone(self, customer_id: int, zone_id: int) -> bool:
        """Assign a customer to a delivery zone"""
        customer = self.db.query(CustomerDB).filter(CustomerDB.id == customer_id).first()
        if customer:
            customer.zone_id = zone_id
            self.db.commit()
            return True
        return False
    
    def create_delivery_schedule(self, zone_id: int, day_of_week: int, 
                               start_time: str, end_time: str, 
                               max_orders: int = 10) -> DeliverySchedule:
        """Create delivery schedule for a zone"""
        schedule = DeliverySchedule(
            zone_id=zone_id,
            day_of_week=day_of_week,
            start_time=start_time,
            end_time=end_time,
            max_orders_per_slot=max_orders
        )
        self.db.add(schedule)
        self.db.commit()
        self.db.refresh(schedule)
        return schedule
    
    def get_available_delivery_slots(self, delivery_date: str, zone_id: int = None) -> List[Dict]:
        """Get available delivery slots for a specific date"""
        # Parse the delivery date to get day of week
        date_obj = datetime.strptime(delivery_date, "%Y-%m-%d")
        day_of_week = date_obj.weekday()
        
        query = self.db.query(DeliverySchedule).filter(
            and_(
                DeliverySchedule.day_of_week == day_of_week,
                DeliverySchedule.is_active == True
            )
        )
        
        if zone_id:
            query = query.filter(DeliverySchedule.zone_id == zone_id)
        
        schedules = query.all()
        
        available_slots = []
        for schedule in schedules:
            # Check how many orders are already scheduled for this slot
            existing_orders = self.db.query(OrderDB).filter(
                and_(
                    OrderDB.delivery_date == delivery_date,
                    OrderDB.delivery_slot_id == schedule.id
                )
            ).count()
            
            if existing_orders < schedule.max_orders_per_slot:
                available_slots.append({
                    "id": schedule.id,
                    "start_time": schedule.start_time,
                    "end_time": schedule.end_time,
                    "zone_id": schedule.zone_id,
                    "available_capacity": schedule.max_orders_per_slot - existing_orders
                })
        
        return available_slots
    
    def create_delivery_route(self, agent_id: int, date: str, 
                            orders: List[str]) -> DeliveryRoute:
        """Create an optimized delivery route for an agent"""
        # This would integrate with a route optimization service
        # For now, we'll create a simple route
        route_data = {
            "stops": [{"order_id": order_id, "sequence": idx} for idx, order_id in enumerate(orders)],
            "optimized": False
        }
        
        route = DeliveryRoute(
            agent_id=agent_id,
            date=date,
            start_time="08:00",  # Default start time
            end_time="18:00",    # Default end time
            route_data=route_data
        )
        
        self.db.add(route)
        self.db.commit()
        self.db.refresh(route)
        return route
    
    def track_delivery(self, order_id: str) -> Dict:
        """Get real-time tracking information for an order"""
        tracking = self.db.query(DeliveryTracking).filter(
            DeliveryTracking.order_id == order_id
        ).first()
        
        if not tracking:
            return {"status": "not_found"}
        
        order = self.db.query(OrderDB).filter(OrderDB.id == order_id).first()
        
        return {
            "order_id": order_id,
            "status": tracking.status,
            "current_location": tracking.current_location,
            "estimated_arrival": tracking.estimated_arrival.isoformat() if tracking.estimated_arrival else None,
            "actual_arrival": tracking.actual_arrival.isoformat() if tracking.actual_arrival else None,
            "tracking_code": tracking.tracking_code,
            "agent": {
                "name": tracking.agent.name if tracking.agent else None,
                "phone": tracking.agent.phone if tracking.agent else None
            } if tracking.agent else None,
            "customer": {
                "name": f"{order.customer.first_name} {order.customer.last_name}",
                "address": order.delivery_address or f"{order.customer.street}, {order.customer.city}",
                "phone": order.customer.phone
            } if order and order.customer else None
        }
    
    def update_delivery_status(self, order_id: str, status: str, 
                             location: Dict = None) -> bool:
        """Update delivery status and location"""
        tracking = self.db.query(DeliveryTracking).filter(
            DeliveryTracking.order_id == order_id
        ).first()
        
        if not tracking:
            # Create tracking record if it doesn't exist
            tracking = DeliveryTracking(
                order_id=order_id,
                status=status,
                current_location=location,
                tracking_code=str(uuid.uuid4())[:8].upper()
            )
            self.db.add(tracking)
        else:
            tracking.status = status
            if location:
                tracking.current_location = location
            if status == "delivered":
                tracking.actual_arrival = datetime.utcnow()
        
        self.db.commit()
        return True
    
    def get_delivery_analytics(self, start_date: str, end_date: str) -> Dict:
        """Get delivery analytics and performance metrics"""
        # Query delivery data for the date range
        deliveries = self.db.query(DeliveryTracking).filter(
            and_(
                DeliveryTracking.actual_arrival >= start_date,
                DeliveryTracking.actual_arrival <= end_date
            )
        ).all()
        
        total_deliveries = len(deliveries)
        successful_deliveries = len([d for d in deliveries if d.status == "delivered"])
        on_time_deliveries = 0  # Would need to compare with estimated arrival
        
        return {
            "total_deliveries": total_deliveries,
            "successful_deliveries": successful_deliveries,
            "success_rate": (successful_deliveries / total_deliveries * 100) if total_deliveries > 0 else 0,
            "on_time_rate": (on_time_deliveries / total_deliveries * 100) if total_deliveries > 0 else 0,
            "average_delivery_time": 0,  # Would need to calculate from route data
            "zone_performance": {}  # Would aggregate by zone
        }
