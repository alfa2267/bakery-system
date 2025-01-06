from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON
import uuid

# Instead, ensure you're importing Base from database
from .database import Base

# SQLAlchemy Models
class OrderItemDB(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    
    order = relationship("OrderDB", back_populates="items")
    tasks = relationship("ScheduledTaskDB", back_populates="order_item", cascade="all, delete-orphan")  # Added reverse relationship

class OrderDB(Base):
    __tablename__ = "orders"
    
    id = Column(String, primary_key=True, index=True)
    customer_name = Column(String, nullable=False)
    delivery_date = Column(String, nullable=False)
    delivery_slot = Column(String, nullable=False)
    location = Column(String, nullable=False)
    estimated_travel_time = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
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
    status = Column(String, nullable=False, default='pending')  # pending, in-progress, completed, blocked
    
    # New field to associate task with a specific product/item
    order_item_id = Column(Integer, ForeignKey("order_items.id", ondelete="CASCADE"), nullable=False)
    
    order = relationship("OrderDB", back_populates="tasks")
    order_item = relationship("OrderItemDB", back_populates="tasks")  # Add the reverse relationship

# Pydantic Models for API
class OrderItem(BaseModel):
    id: str = str(uuid.uuid4()) 
    product: str
    quantity: int = Field(gt=0)  # Ensure quantity is greater than 0

    class Config:
        from_attributes = True

class Order(BaseModel):
    id: str
    customer_name: str
    status: Optional[str] = 'pending'
    created_at: str
    updated_at: Optional[str]
    delivery_date: str  # Changed from Optional
    delivery_slot: str  # Changed from Optional
    location: str  # Changed from Optional
    estimated_travel_time: int  # Changed from Optional
    items: List[OrderItem]

    class Config:
       from_attributes = True
       
class ProductionStep(BaseModel):
    name: str
    duration: int = Field(gt=0)  # Must be positive
    requiresHuman: bool
    requiresOven: bool
    requiresMixer: bool
    mustFollowImmediately: bool
    scalingFactor: float = Field(gt=0.0, default=1.0)  # Must be positive

class Recipe(BaseModel):
    productType: str
    steps: List[ProductionStep] = Field(min_items=1)  # Must have at least one step
    requiresChilling: bool
    maxChillTime: int = Field(ge=0)  # Non-negative
    minBatchSize: int = Field(gt=0)  # Must be positive
    maxBatchSize: int = Field(gt=0)  # Must be positive

    @property
    def total_duration(self) -> int:
        return sum(step.duration for step in self.steps)

class ScheduledTask(BaseModel):
    orderId: str
    step: str
    startTime: datetime
    endTime: datetime
    resources: List[str]
    batchSize: int = Field(gt=0)  # Must be positive
    status: Optional[str] = 'pending'
    orderItemId: str
    orderItemName: str

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
