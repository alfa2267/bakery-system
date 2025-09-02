from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.exc import SQLAlchemyError
import logging
from pathlib import Path
from .config import DATABASE_URL
import traceback

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

def check_tables_exist() -> bool:
    """Check if all required tables exist in the database"""
    try:
        logger.info("Checking if required tables exist in the database...")
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        required_tables = ['orders', 'order_items', 'scheduled_tasks']
        
        missing_tables = [table for table in required_tables if table not in existing_tables]
        
        if missing_tables:
            logger.warning(f"Missing tables: {', '.join(missing_tables)}")
            logger.info(f"Existing tables: {existing_tables}")
            return False
        
        # Additional verification: Check table structure
        session = SessionLocal()
        try:
            for table in required_tables:
                # Attempt to query each table to verify its structure
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

def create_tables():
    """Create database tables with detailed logging"""
    try:
        # Import models here to avoid circular imports
        from .models import OrderDB, OrderItemDB, ScheduledTaskDB
        
        logger.info("Creating database tables...")
        
        # Drop existing tables (optional, remove if you want to preserve data)
        Base.metadata.drop_all(bind=engine)
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        
        # Verify table creation
        inspector = inspect(engine)
        created_tables = inspector.get_table_names()
        required_tables = ['orders', 'order_items', 'scheduled_tasks']
        
        for table in required_tables:
            if table not in created_tables:
                logger.error(f"Failed to create table: {table}")
                return False
        
        logger.info("Table creation verified")
        return True
    except Exception as e:
        logger.error(f"Error creating tables: {str(e)}")
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
        
        # Attempt to create tables
        Base.metadata.create_all(bind=engine)
        
        logger.info("Database initialization completed successfully")
        return True
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        logger.error(traceback.format_exc())
        raise

    """Initialize database with comprehensive error handling"""
    try:    
        # Verify connection
        if not verify_db_connection():
            raise Exception("Could not connect to database")

        # Create tables if they don't exist
        if not check_tables_exist():
            logger.info("Attempting to create missing tables...")
            if not create_tables():
                raise Exception("Failed to create tables")

            # Comprehensive verification after table creation
            session = SessionLocal()
            try:
                # Verify each table can be queried
                from .models import OrderDB, OrderItemDB, ScheduledTaskDB
                
                # Test querying each table model
                session.query(OrderDB).first()
                session.query(OrderItemDB).first()
                session.query(ScheduledTaskDB).first()
                
                session.commit()
            except Exception as query_error:
                logger.error(f"Table query verification failed: {str(query_error)}")
                raise Exception("Tables verification failed after creation")
            finally:
                session.close()

        logger.info("Database initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        logger.error(traceback.format_exc())
        raise
