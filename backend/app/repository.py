from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional, Dict
from datetime import datetime
from . import models
import logging

logger = logging.getLogger(__name__)

class OrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_order(self, order: models.Order, tasks: List[models.ScheduledTask]) -> models.OrderDB:
        try:
            logger.info("Creating order with ID: %s", order.id)

            # Create order DB instance
            db_order = models.OrderDB(
                id=order.id,
                customer_name=order.customer_name,
                delivery_date=order.delivery_date,
                delivery_slot=order.delivery_slot,
                location=order.location,
                estimated_travel_time=order.estimated_travel_time,
                created_at=datetime.utcnow()
            )

            # Create order items
            db_items = [
                models.OrderItemDB(
                    order_id=order.id,
                    product=item.product,
                    quantity=item.quantity
                )
                for item in order.items
            ]

            # Create scheduled tasks
            db_tasks = [
                models.ScheduledTaskDB(
                    order_id=order.id,
                    step=task.step,
                    start_time=task.startTime,
                    end_time=task.endTime,
                    resources=task.resources,
                    batch_size=task.batchSize,
                    status=task.status or 'pending'  # Default status is pending
                )
                for task in tasks
            ]

            # Add everything to the session
            logger.info("Adding order, items, and tasks to the session")
            self.db.add(db_order)
            self.db.add_all(db_items)
            self.db.add_all(db_tasks)

            # Commit the transaction
            self.db.commit()
            logger.info("Order and associated items and tasks committed successfully")

            # Refresh to get the complete order with relationships
            self.db.refresh(db_order)
            logger.info("Order with ID %s refreshed", db_order.id)
            
            return db_order
            
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error("Error creating order with ID %s: %s", order.id, str(e))
            raise e


    def get_order(self, order_id: str) -> Optional[models.OrderDB]:
        """Fetch a specific order by its ID"""
        logger.info("Fetching order with ID: %s", order_id)
        order = self.db.query(models.OrderDB)\
            .filter(models.OrderDB.id == order_id)\
            .first()

        if not order:
            logger.warning("No order found with ID: %s", order_id)
        
        return order

    def get_orders(self) -> List[models.OrderDB]:
        """Fetch all orders with their items"""
        logger.info("Fetching all orders with their items")
        orders = self.db.query(models.OrderDB).all()

        if not orders:
            logger.warning("No orders found")
        
        # Directly return OrderDB objects
        return orders

    def get_orders_by_date(self, date: str) -> List[models.OrderDB]:
        """Fetch all orders for a specific delivery date"""
        logger.info("Fetching orders for date: %s", date)
        orders = self.db.query(models.OrderDB)\
            .filter(models.OrderDB.delivery_date == date)\
            .all()

        if not orders:
            logger.warning("No orders found for date: %s", date)
        
        return orders

    def get_tasks_by_date(self, date: str) -> List[models.ScheduledTaskDB]:
        """Fetch all tasks for a specific delivery date"""
        logger.info("Fetching tasks for date: %s", date)
        tasks = self.db.query(models.ScheduledTaskDB)\
            .join(models.OrderDB)\
            .filter(models.OrderDB.delivery_date == date)\
            .all()

        if not tasks:
            logger.warning("No tasks found for date: %s", date)
        
        return tasks

    def get_tasks_by_date_and_resource(
        self, 
        date: str, 
        resource: str
    ) -> List[models.ScheduledTaskDB]:
        """Get all tasks for a specific date that require a specific resource"""
        logger.info("Fetching tasks for date: %s requiring resource: %s", date, resource)
        tasks = self.db.query(models.ScheduledTaskDB)\
            .join(models.OrderDB)\
            .filter(
                models.OrderDB.delivery_date == date,
                models.ScheduledTaskDB.resources.contains([resource])
            )\
            .all()

        if not tasks:
            logger.warning("No tasks found for date: %s with resource: %s", date, resource)
        
        return tasks

    def get_utilization_by_date(self, date: str) -> Dict[str, List[models.ScheduledTaskDB]]:
        """Get resource utilization for a specific date"""
        logger.info("Fetching resource utilization for date: %s", date)
        tasks = self.get_tasks_by_date(date)
        utilization = {
            'baker': [],
            'oven': [],
            'mixer': []
        }
        
        for task in tasks:
            for resource in task.resources:
                if resource in utilization:
                    utilization[resource].append(task)
                    
        if not any(utilization.values()):
            logger.warning("No resource utilization found for date: %s", date)
        
        return utilization
