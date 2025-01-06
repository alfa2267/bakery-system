# __init__.py
__version__ = "0.1.0"
from .database import init_db

# Just export necessary items, don't initialize here
from .database import Base, engine, SessionLocal, get_db
from .models import OrderDB, OrderItemDB, ScheduledTaskDB