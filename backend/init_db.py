#!/usr/bin/env python3
"""
Database initialization script for the bakery system
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
from app.models import (
    CustomerDB, ProductDB, FlavorDB, IcingTypeDB, FillingTypeDB, ShapeDB, SizeDB,
    ColorSchemeDB, ToppingDB, OrderItemDB, DeliverySlotDB, PaymentMethodDB,
    OrderDB, ScheduledTaskDB, CakeBaseDB
)
from app.cake_configurator import CakeConfiguratorService
from app.database import get_db

def init_database():
    """Initialize the database with all tables"""
    print("Creating database tables...")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

def init_sample_data():
    """Initialize sample data for the cake configurator"""
    print("Initializing sample data...")
    
    # Get database session
    db = next(get_db())
    
    try:
        # Create sample data using the service
        service = CakeConfiguratorService(db)
        service.create_sample_data()
        print("Sample data created successfully!")
        
    except Exception as e:
        print(f"Error creating sample data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("Starting database initialization...")
    
    # Initialize database tables
    init_database()
    
    # Initialize sample data
    init_sample_data()
    
    print("Database initialization complete!")
