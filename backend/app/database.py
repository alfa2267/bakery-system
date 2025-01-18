from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.exc import SQLAlchemyError
import logging
from pathlib import Path
from .config import DATABASE_URL
import traceback
import uuid
import json
from sqlalchemy import func

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
    from .models import ProductDB, RecipeDB, RecipeStepDB, RecipeIngredientDB
    
    # Check if products already exist
    if session.query(ProductDB).first():
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

        # Create products
        for product_info in products_data:
            product = ProductDB(
                id=product_info['id'], 
                name=product_info['name']
            )
            session.add(product)
        session.flush()

        # Recipes with predefined data
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
            },
            # Similar structure for Brownies and Cake recipes...
        ]

        # Create recipes
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

        session.commit()
        logger.info("Default data created successfully")
        
    except Exception as e:
        session.rollback()
        logger.error(f"Error creating default data: {str(e)}")
        logger.error(traceback.format_exc())
        raise

# Rest of the file remains the same as in the previous version
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
            'scheduled_tasks'
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