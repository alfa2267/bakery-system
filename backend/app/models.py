from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import uuid

# Instead, ensure you're importing Base from database
from .database import Base

# SQLAlchemy Database Models
class ProductDB(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    
    # Optional: Add relationships to order items and recipes if needed
    order_items = relationship("OrderItemDB", back_populates="product")
    recipes = relationship("RecipeDB", back_populates="product")

class OrderItemDB(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    
    # Foreign key to ProductDB
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Relationship to ProductDB
    product = relationship("ProductDB", back_populates="order_items")
    
    quantity = Column(Integer, nullable=False)
    
    order = relationship("OrderDB", back_populates="items")
    tasks = relationship("ScheduledTaskDB", back_populates="order_item", cascade="all, delete-orphan")

class RecipeDB(Base):
    __tablename__ = "recipes"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key to ProductDB
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Relationship to ProductDB
    product = relationship("ProductDB", back_populates="recipes")
    
    ingredients = Column(JSON, nullable=False)
    steps = Column(JSON, nullable=False)
    requires_chilling = Column(Boolean, nullable=False)
    max_chill_time = Column(Integer, nullable=False)
    min_batch_size = Column(Integer, nullable=False)
    max_batch_size = Column(Integer, nullable=False)
    unit = Column(String, nullable=False)

class OrderDB(Base):
    __tablename__ = "orders"
    
    id = Column(String, primary_key=True, index=True)
    customer_name = Column(String, nullable=False)
    delivery_date = Column(String, nullable=False)
    delivery_slot = Column(String, nullable=False)
    location = Column(String, nullable=False)
    estimated_travel_time = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String, nullable=False, default='new')
    
    items = relationship("OrderItemDB", back_populates="order", cascade="all, delete-orphan")
    tasks = relationship("ScheduledTaskDB", back_populates="order", cascade="all, delete-orphan")

class ScheduledTaskDB(Base):
    __tablename__ = "scheduled_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    step = Column(String, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    resources = Column(JSON, nullable=False)
    batch_size = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default='pending')
    
    # New field to associate task with a specific product/item
    order_item_id = Column(Integer, ForeignKey("order_items.id", ondelete="CASCADE"), nullable=False)
    
    order = relationship("OrderDB", back_populates="tasks")
    order_item = relationship("OrderItemDB", back_populates="tasks")

# Pydantic Models for Validation and Serialization
class Product(BaseModel):
    id: int
    name: str

class ProductionStep(BaseModel):
    id: Optional[str] = None
    name: str
    duration: int = Field(gt=0)
    requiresHuman: bool
    requiresOven: bool
    requiresMixer: bool
    mustFollowImmediately: bool
    scalingFactor: Optional[float] = Field(gt=0.0, default=1.0)

class Ingredient(BaseModel):
    name: str
    unit: str
    qty: str

class Recipe(BaseModel):
    id: int
    product: Product
    ingredients: List[Ingredient]
    steps: List[ProductionStep]
    requiresChilling: bool
    maxChillTime: int = Field(ge=0)
    minBatchSize: int = Field(gt=0)
    maxBatchSize: int = Field(gt=0)
    unit: str

    @property
    def total_duration(self) -> int:
        return sum(step.duration for step in self.steps)

    class Config:
        from_attributes = True

class OrderItem(BaseModel):
    product: Product
    quantity: int = Field(gt=0)

    class Config:
        from_attributes = True

class Order(BaseModel):
    id: Optional[str] = None
    customer_name: str
    delivery_date: str
    delivery_slot: str
    location: str
    estimated_travel_time: int
    items: List[OrderItem]
    status: Optional[str] = 'new'
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True
        alias_generator = lambda field: ''.join(word.capitalize() if i > 0 else word for i, word in enumerate(field.split('_')))

    def __init__(self, **data):
        # Handle ID generation
        if 'id' not in data or not data['id']:
            data['id'] = str(uuid.uuid4())
        
        # Handle timestamps
        now = datetime.utcnow().isoformat()
        if 'created_at' not in data:
            data['created_at'] = now
        if 'updated_at' not in data:
            data['updated_at'] = now

        # Set default status if not provided
        if 'status' not in data:
            data['status'] = 'new'

        super().__init__(**data)



class ScheduledTask(BaseModel):
    orderId: str
    step: str
    startTime: datetime
    endTime: datetime
    resources: List[str]
    batchSize: int = Field(gt=0)  # Must be positive
    status: Optional[str] = 'pending'
    orderItemId: Optional[str] = None  # Make this optional
    orderItemName: str
    product: Optional[Product] = None  # Make product optional if not always needed

    class Config:
        from_attributes = True
        
    @property
    def duration(self) -> int:
        return int((self.endTime - self.startTime).total_seconds() / 60)  # Duration in minutes


class ValidationResponse(BaseModel):
    isValid: bool
    warnings: List[str] = Field(default_factory=list)

class ScheduleResponse(BaseModel):
    orderId: str
    tasks: List[ScheduledTask]

    @property
    def total_duration(self) -> int:
        if not self.tasks:
            return 0
        return int((max(t.endTime for t in self.tasks) - min(t.startTime for t in self.tasks)).total_seconds() / 60)

# Additional helper models
class ResourceUtilization(BaseModel):
    resource: str
    utilization_percentage: float = Field(ge=0.0, le=100.0)
    busy_minutes: int = Field(ge=0)
    total_minutes: int = Field(gt=0)

class DailyScheduleSummary(BaseModel):
    date: str
    total_orders: int = Field(ge=0)
    total_tasks: int = Field(ge=0)
    resource_utilization: List[ResourceUtilization]
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None