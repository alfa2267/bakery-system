from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.exc import SQLAlchemyError
import logging
from pathlib import Path
from .config import DATABASE_URL, settings
import traceback
import uuid
import json
from sqlalchemy import func
from datetime import datetime, timedelta
import random

# Create Base only once
Base = declarative_base()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database directory if it doesn't exist
db_path = Path(DATABASE_URL.replace('sqlite:///', '')).parent
db_path.mkdir(parents=True, exist_ok=True)

# Initialize the database engine with SQLite-specific settings
try:
    engine = create_engine(
        DATABASE_URL,
        # SQLite-specific: allow multiple threads to access the database
        connect_args={"check_same_thread": False}
    )
    logger.info(f"Database engine created successfully")
except Exception as e:
    logger.error(f"Failed to create database engine: {str(e)}")
    raise

# Create a session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



def create_default_data(session):
    """Create default products and recipes in the database"""
    from .models import ProductDB, RecipeDB, RecipeStepDB, RecipeIngredientDB, ResourceDB, EquipmentDB, OrderDB, OrderItemDB, ScheduledTaskDB
    
    # Check if data already exists
    if session.query(ProductDB).first() or session.query(ResourceDB).first() or session.query(EquipmentDB).first() or session.query(OrderDB).first():
        logger.info("Default data already exists in database")
        return

    logger.info("Creating default entries")
    
    try:
        # Products data with predefined IDs
        products_data = [
            {
                "id": 23,
                "name": "cookies",
                "shelf_life": "7 days",
                "price": [{"amount": 30, "unit": "kg", "qty": 3}]
            },
            {
                "id": 24,
                "name": "brownies",
                "shelf_life": "5 days",
                "price": [{"amount": 35, "unit": "kg", "qty": 2.5}]
            },
            {
                "id": 25,
                "name": "cake",
                "shelf_life": "3 days",
                "price": [{"amount": 40, "unit": "kg", "qty": 2}]
            },
            {
                "id": 26,
                "name": "cinnamon rolls",
                "shelf_life": "4 days",
                "price": [{"amount": 25, "unit": "kg", "qty": 4}]
            },
            # Ingredient products
            {"id": 27, "name": "Eggs"},
            {"id": 28, "name": "Flour"},
            {"id": 29, "name": "Butter"},
            {"id": 30, "name": "Sugar"},
            {"id": 31, "name": "Cocoa Powder"},
            {"id": 32, "name": "Baking Powder"}
        ]

        # Create products first as they are referenced by other entities
        for product_info in products_data:
            product = ProductDB(
                id=product_info['id'], 
                name=product_info['name']
            )
            session.add(product)
        session.flush()

        # Add equipment data
        equipment_data = [
            {
                "id": 1,
                "name": "oven",
                "quantity": 2,
                "can_be_shared": True
            },
            {
                "id": 2,
                "name": "mixer",
                "quantity": 3,
                "can_be_shared": False
            },
            {
                "id": 3,
                "name": "proofer",
                "quantity": 1,
                "can_be_shared": True
            },
            {
                "id": 4,
                "name": "refrigerator",
                "quantity": 2,
                "can_be_shared": True
            },
            {
                "id": 5,
                "name": "freezer",
                "quantity": 1,
                "can_be_shared": True
            },
            {
                "id": 6,
                "name": "work_station",
                "quantity": 4,
                "can_be_shared": True
            }
        ]

        # Create equipment
        for equipment_info in equipment_data:
            equipment = EquipmentDB(
                id=equipment_info['id'],
                name=equipment_info['name'],
                quantity=equipment_info['quantity'],
                can_be_shared=equipment_info['can_be_shared']
            )
            session.add(equipment)
        session.flush()

        # Add resources data
        resources_data = [
            {
                "id": 1,  # Changed to integer
                "name": "Crubby",
                "skills": ["all"],  # Use native Python list, column type is JSON
                "availability": {  # Use native Python dict, column type is JSON
                    "monday": {"start": "07:00", "end": "19:00"},
                    "tuesday": {"start": "07:00", "end": "19:00"},
                    "wednesday": {"start": "07:00", "end": "19:00"},
                    "thursday": {"start": "07:00", "end": "19:00"},
                    "friday": {"start": "07:00", "end": "19:00"},
                    "saturday": {"start": "07:00", "end": "19:00"},
                    "sunday": {"start": "07:00", "end": "19:00"}
                }
            }
        ]

        # Create resources
        for resource_info in resources_data:
            resource = ResourceDB(
                id=resource_info['id'],
                name=resource_info['name'],
                skills=resource_info['skills'],  # SQLAlchemy will handle JSON conversion
                availability=resource_info['availability']  # SQLAlchemy will handle JSON conversion
            )
            session.add(resource)
        session.flush()

        # Create recipes
        recipes_data = [
            {
                "id": 1001,
                "product_id": 23,
                "requires_chilling": True,
                "max_chill_time": 240,
                "min_batch_size": 3,
                "max_batch_size": 12,
                "unit": "whole",
                "ingredients": [
                    {"product_id": 27, "quantity": 0.3, "unit": "kg"},
                    {"product_id": 28, "quantity": 0.5, "unit": "kg"},
                    {"product_id": 29, "quantity": 0.2, "unit": "kg"},
                    {"product_id": 30, "quantity": 0.4, "unit": "kg"},
                ],
                "steps": [
                    {"id": 14, "name": "Mixing", "duration": 25, "order": 1, 
                     "requires_human": True, "requires_mixer": True, "requires_oven": False, 
                     "must_follow_immediately": False, "scaling_factor": 0.7},
                    {"id": 15, "name": "Chilling", "duration": 240, "order": 2, 
                     "requires_human": False, "requires_mixer": False, "requires_oven": False, 
                     "must_follow_immediately": False, "scaling_factor": 1.0},
                    {"id": 16, "name": "Shaping", "duration": 30, "order": 3, 
                     "requires_human": True, "requires_mixer": False, "requires_oven": False, 
                     "must_follow_immediately": True, "scaling_factor": 1.0},
                    {"id": 17, "name": "Baking", "duration": 15, "order": 4, 
                     "requires_human": False, "requires_mixer": False, "requires_oven": True, 
                     "must_follow_immediately": True, "scaling_factor": 1.0},
                ],
            }
        ]

        for recipe_data in recipes_data:
            recipe = RecipeDB(
                id=recipe_data['id'],
                product_id=recipe_data['product_id'],
                requires_chilling=recipe_data['requires_chilling'],
                max_chill_time=recipe_data['max_chill_time'],
                min_batch_size=recipe_data['min_batch_size'],
                max_batch_size=recipe_data['max_batch_size'],
                unit=recipe_data['unit']
            )
            session.add(recipe)
            session.flush()

            # Add ingredients
            for ing_data in recipe_data['ingredients']:
                ingredient = RecipeIngredientDB(
                    recipe_id=recipe.id,
                    product_id=ing_data['product_id'],
                    quantity=ing_data['quantity'],
                    unit=ing_data['unit']
                )
                session.add(ingredient)

            # Add steps
            for step_data in recipe_data['steps']:
                step = RecipeStepDB(
                    id=step_data['id'],
                    recipe_id=recipe.id,
                    name=step_data['name'],
                    duration=step_data['duration'],
                    order=step_data['order'],
                    requires_human=step_data['requires_human'],
                    requires_oven=step_data['requires_oven'],
                    requires_mixer=step_data['requires_mixer'],
                    must_follow_immediately=step_data['must_follow_immediately'],
                    scaling_factor=step_data['scaling_factor']
                )
                session.add(step)
        session.flush()

        # Sample customer data
        customers = [
            ("John Smith", "123 Baker Street", 15),
            ("Emma Wilson", "456 Pine Avenue", 20),
            ("Michael Brown", "789 Oak Road", 25),
            ("Sarah Davis", "321 Maple Lane", 30),
            ("James Johnson", "654 Cedar Drive", 18),
            ("Lisa Anderson", "987 Elm Street", 22),
            ("Robert Taylor", "147 Birch Boulevard", 28),
            ("Jennifer White", "258 Spruce Way", 17),
            ("David Miller", "369 Willow Path", 23),
            ("Mary Thompson", "741 Ash Court", 19)
        ]

        # Define delivery slots
        delivery_slots = [
            "10:00-12:00",
            "12:00-14:00",
            "14:00-16:00",
            "16:00-17:30"
        ]

        # Product selection options for orders
        product_options = [
            (23, 2, 5),  # cookies (id, min_qty, max_qty)
            (24, 1, 3),  # brownies
            (25, 1, 2),  # cake
            (26, 2, 4)   # cinnamon rolls
        ]

        # Generate 10 orders between Jan 18-24, 2025
        start_date = datetime(2025, 1, 18)
        
        for i in range(10):
            customer = random.choice(customers)
            days_offset = random.randint(0, 6)
            delivery_date = (start_date + timedelta(days=days_offset)).strftime("%Y-%m-%d")
            delivery_slot = random.choice(delivery_slots)
            
            order = OrderDB(
                customer_name=customer[0],
                delivery_date=delivery_date,
                delivery_slot=delivery_slot,
                location=customer[1],
                estimated_travel_time=customer[2],
                created_at=datetime.utcnow(),
                status='new'
            )
            session.add(order)
            session.flush()

            # Add 1-3 random products to each order
            num_products = random.randint(1, 3)
            selected_products = random.sample(product_options, num_products)
            
            for product_id, min_qty, max_qty in selected_products:
                quantity = random.randint(min_qty, max_qty)
                order_item = OrderItemDB(
                    order_id=order.id,
                    product_id=product_id,
                    quantity=quantity
                )
                session.add(order_item)

        
        # After creating orders and order items, add scheduled tasks
        orders = session.query(OrderDB).all()
        
        # Sort orders by delivery date and time
        orders.sort(key=lambda x: f"{x.delivery_date} {x.delivery_slot.split('-')[0]}")
        
        # Track resource utilization
        resource_schedule = []  # List of (start_time, end_time) tuples
        
        for order in orders:
            order_items = session.query(OrderItemDB).filter(OrderItemDB.order_id == order.id).all()
            
            for order_item in order_items:
                recipe = session.query(RecipeDB).filter(RecipeDB.product_id == order_item.product_id).first()
                if recipe:
                    steps = session.query(RecipeStepDB).filter(RecipeStepDB.recipe_id == recipe.id).order_by(RecipeStepDB.order).all()
                    
                    # Calculate delivery datetime
                    delivery_slot_start = order.delivery_slot.split('-')[0]
                    delivery_datetime = datetime.strptime(f"{order.delivery_date} {delivery_slot_start}", "%Y-%m-%d %H:%M")
                    
                    # Calculate total time needed
                    total_duration = sum(step.duration for step in steps)
                    buffer_time = (len(steps) - 1) * 15  # 15-minute buffer between steps
                    
                    # Find a suitable starting time
                    latest_start = delivery_datetime - timedelta(minutes=total_duration + buffer_time)
                    current_time = latest_start - timedelta(hours=12)  # Start trying from 12 hours before deadline
                    
                    def find_available_slot(start_time, duration):
                        """Find the next available time slot that doesn't overlap with existing tasks"""
                        current = start_time
                        while True:
                            end_time = current + timedelta(minutes=duration)
                            # Check for overlaps
                            overlaps = False
                            for scheduled_start, scheduled_end in resource_schedule:
                                if not (end_time <= scheduled_start or current >= scheduled_end):
                                    overlaps = True
                                    current = scheduled_end + timedelta(minutes=15)  # Try after this task
                                    break
                            if not overlaps:
                                return current
                    
                    # Schedule each step
                    for step in steps:
                        # Find the next available time slot
                        start_time = find_available_slot(current_time, step.duration)
                        end_time = start_time + timedelta(minutes=step.duration)
                        
                        # Create the task
                        scheduled_task = ScheduledTaskDB(
                            order_id=order.id,
                            order_item_id=order_item.id,
                            step=step.name.lower(),
                            start_time=start_time,
                            end_time=end_time,
                            resources=["Crubby"],
                            batch_size=min(order_item.quantity, recipe.max_batch_size),
                            status='pending'
                        )
                        session.add(scheduled_task)
                        
                        # Add to resource schedule
                        resource_schedule.append((start_time, end_time))
                        resource_schedule.sort(key=lambda x: x[0])  # Keep schedule sorted
                        
                        # Update current_time for next step
                        current_time = end_time + timedelta(minutes=15)  # 15-minute buffer
                                                
            session.flush()
        
        
        
        session.commit()
        logger.info("Default data created successfully")
        
    except Exception as e:
        session.rollback()
        logger.error(f"Error creating default data: {str(e)}")
        logger.error(traceback.format_exc())
        raise




def check_tables_exist() -> bool:
    """Check if all required tables exist in the database"""
    try:
        logger.info("Checking if required tables exist in the database...")
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        required_tables = [
            'products',
            'recipes',
            'recipe_steps',
            'recipe_ingredients',
            'orders',
            'order_items',
            'scheduled_tasks',
            'resources',
            'equipment'
        ]
        
        missing_tables = [table for table in required_tables if table not in existing_tables]
        
        if missing_tables:
            logger.warning(f"Missing tables: {', '.join(missing_tables)}")
            logger.info(f"Existing tables: {existing_tables}")
            return False
        
        # Additional verification: Check table structure
        session = SessionLocal()
        try:
            for table in required_tables:
                logger.info(f"Verifying table structure for {table}")
                session.execute(text(f"SELECT * FROM {table} LIMIT 1"))
            session.commit()
        except Exception as struct_error:
            logger.error(f"Table structure verification failed for {table}: {str(struct_error)}")
            return False
        finally:
            session.close()
        
        logger.info("All required tables exist and have valid structure")
        return True
    except Exception as e:
        logger.error(f"Error checking tables: {str(e)}")
        return False

def verify_db_connection():
    """Verify database connection"""
    try:
        with engine.connect() as conn:
            logger.info("Verifying database connection...")
            conn.execute(text("SELECT 1"))
            conn.commit()
        logger.info("Database connection verified")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        return False

def init_db():
    """Initialize database with comprehensive error handling"""
    try:
        logger.info("Starting database initialization...")
        
        # Import models to ensure they're loaded
        from . import models
        
        logger.info("Loaded models:")
        for model in Base.__subclasses__():
            logger.info(f"  - {model.__name__} (Table: {getattr(model, '__tablename__', 'N/A')})")
        
        # Verify database connection
        if not verify_db_connection():
            raise Exception("Could not establish database connection")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        # Create default data
        session = SessionLocal()
        try:
            create_default_data(session)
        finally:
            session.close()
        
        logger.info("Database initialization completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        logger.error(traceback.format_exc())
        raise