from typing import List, Dict
from pydantic import BaseModel
import os
from pathlib import Path

# Get project root directory (one level up from current file)
BASE_DIR = Path(os.path.dirname(os.path.abspath(__file__))).parent
DATABASE_DIR = BASE_DIR / "data"  # Store database in a data directory
DATABASE_PATH = DATABASE_DIR / "bakery.db"

# Create data directory if it doesn't exist
DATABASE_DIR.mkdir(parents=True, exist_ok=True)

# Convert to string for SQLAlchemy
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"


class DeliverySlot(BaseModel):
    id: str
    time: str

class Settings(BaseModel):
    app_name: str = "Bakery Scheduler"
    admin_email: str = "admin@example.com"
    
    # Business hours
    store_open_time: str = "09:00"
    store_close_time: str = "18:00"
    kitchen_open_time: str = "08:00"
    kitchen_close_time: str = "19:00"
    
    # Resources
    num_bakers: int = 2
    num_ovens: int = 1
    num_mixers: int = 2
    
    # Delivery slots
    delivery_slots: List[DeliverySlot] = [
        DeliverySlot(id="1", time="10:00-12:00"),
        DeliverySlot(id="2", time="12:00-14:00"),
        DeliverySlot(id="3", time="14:00-16:00"),
        DeliverySlot(id="4", time="16:00-17:30")
    ]
    
    # Storage constraints
    room_temp_storage_hours: int = 4
    freezer_storage_days: int = 2

    class Config:
        json_encoders = {
            Path: str  # Handle Path objects in JSON serialization
        }

# Create a single instance to be used across the app
settings = Settings()

# Log configuration for debugging
import logging
logger = logging.getLogger(__name__)
logger.info(f"Database URL: {DATABASE_URL}")
logger.info(f"Database Path: {DATABASE_PATH}")
logger.info(f"Base Directory: {BASE_DIR}")