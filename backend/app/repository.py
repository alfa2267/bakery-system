from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional, Dict
from datetime import datetime
from . import models
import logging
from fastapi import HTTPException
from sqlalchemy.orm import joinedload

logger = logging.getLogger(__name__)

class OrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def _get_or_create_product(self, product: models.Product) -> models.ProductDB:
        """
        Find an existing product or create a new one
        """
        try:
            # Try to find existing product
            existing_product = self.db.query(models.ProductDB)\
                .filter(
                    (models.ProductDB.id == product.id) | 
                    (models.ProductDB.name == product.name)
                )\
                .first()

            if existing_product:
                return existing_product

            # Create new product if not exists
            new_product = models.ProductDB(
                id=product.id,
                name=product.name
            )
            self.db.add(new_product)
            self.db.flush()  # This will generate an ID if not provided
            return new_product

        except SQLAlchemyError as e:
            logger.error(f"Error getting/creating product: {str(e)}")
            raise HTTPException(status_code=500, detail="Error processing product")

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
                created_at=datetime.utcnow(),
                status=order.status or 'new'
            )

            # Create order items with associated products
            db_items = []
            for item in order.items:
                # Get or create the product
                db_product = self._get_or_create_product(item.product)
                
                # Create order item
                db_item = models.OrderItemDB(
                    order_id=order.id,
                    product_id=db_product.id,
                    quantity=item.quantity
                )
                db_items.append(db_item)

            # Add order and items to the session
            logger.info("Adding order and items to the session")
            self.db.add(db_order)
            self.db.add_all(db_items)

            # Commit to get IDs for order items
            self.db.commit()
            logger.info("Order and items committed successfully")

            # Refresh the items to get their IDs
            for db_item in db_items:
                self.db.refresh(db_item)

            # Create scheduled tasks with associated order_item_id
            db_tasks = [
                models.ScheduledTaskDB(
                    order_id=order.id,
                    order_item_id=item.id,
                    step=task.step,
                    start_time=task.startTime,
                    end_time=task.endTime,
                    resources=task.resources,
                    batch_size=task.batchSize,
                    status=task.status or 'pending'
                )
                for item, task in zip(db_items, tasks)
            ]

            # Add tasks to the session
            self.db.add_all(db_tasks)

            # Commit the transaction
            self.db.commit()
            logger.info("Order and associated items and tasks committed successfully")

            # Refresh the order to get relationships
            self.db.refresh(db_order)
            logger.info("Order with ID %s refreshed", db_order.id)
            
            return db_order

        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error("Error creating order with ID %s: %s", order.id, str(e))
            raise HTTPException(status_code=500, detail="Database error occurred while creating the order.")

    def get_order(self, order_id: str) -> Optional[models.OrderDB]:
        """Fetch a specific order by its ID"""
        logger.info("Fetching order with ID: %s", order_id)
        order = self.db.query(models.OrderDB)\
            .options(
                # Eager load related items and their products
                joinedload(models.OrderDB.items)\
                .joinedload(models.OrderItemDB.product)
            )\
            .filter(models.OrderDB.id == order_id)\
            .first()

        if not order:
            logger.warning("No order found with ID: %s", order_id)
        
        return order

    def get_orders(self) -> List[models.OrderDB]:
        """Fetch all orders with their items"""
        logger.info("Fetching all orders with their items")
        orders = self.db.query(models.OrderDB)\
            .options(
                joinedload(models.OrderDB.items)\
                .joinedload(models.OrderItemDB.product)
            )\
            .all()

        if not orders:
            logger.warning("No orders found")
        
        return orders

    def get_orders_by_date(self, date: str) -> List[models.OrderDB]:
        """Fetch all orders for a specific delivery date"""
        logger.info("Fetching orders for date: %s", date)
        orders = self.db.query(models.OrderDB)\
            .options(
                joinedload(models.OrderDB.items)\
                .joinedload(models.OrderItemDB.product)
            )\
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
            .options(
                joinedload(models.ScheduledTaskDB.order_item)\
                .joinedload(models.OrderItemDB.product)
            )\
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
            .options(
                joinedload(models.ScheduledTaskDB.order_item)\
                .joinedload(models.OrderItemDB.product)
            )\
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