from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
import uuid

from .database import Base

# SQLAlchemy Database Models
class ProductDB(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    
    order_items = relationship("OrderItemDB", back_populates="product")
    recipes = relationship("RecipeDB", back_populates="product")
    recipe_ingredients = relationship("RecipeIngredientDB", back_populates="product")  # Add this line

class ResourceDB(Base):
    __tablename__ = 'resources'
    
    id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    name = Column(String, nullable=False)
    skills = Column(JSON, nullable=False)
    availability = Column(JSON, nullable=False)

# Add Equipment model definition

class EquipmentDB(Base):
    __tablename__ = 'equipment'
    
    id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    can_be_shared = Column(Boolean, nullable=False)


class OrderItemDB(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    
    product = relationship("ProductDB", back_populates="order_items")
    order = relationship("OrderDB", back_populates="items")
    tasks = relationship("ScheduledTaskDB", back_populates="order_item", cascade="all, delete-orphan")

class RecipeStepDB(Base):
    __tablename__ = "recipe_steps"
    
    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    name = Column(String, nullable=False)
    duration = Column(Integer, nullable=False)
    order = Column(Integer, nullable=False)
    requires_human = Column(Boolean, default=False)
    requires_oven = Column(Boolean, default=False)
    requires_mixer = Column(Boolean, default=False)
    must_follow_immediately = Column(Boolean, default=False)
    scaling_factor = Column(Float, default=1.0)
    
    recipe = relationship("RecipeDB", back_populates="steps")

class RecipeIngredientDB(Base):
    __tablename__ = "recipe_ingredients"
    
    id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    
    product = relationship("ProductDB")  # Simplified relationship
    recipe = relationship("RecipeDB", back_populates="ingredients")

class RecipeDB(Base):
    __tablename__ = "recipes"
    
    id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    requires_chilling = Column(Boolean, nullable=False)
    max_chill_time = Column(Integer, nullable=False)
    min_batch_size = Column(Integer, nullable=False)
    max_batch_size = Column(Integer, nullable=False)
    unit = Column(String, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)  # Add this line
    product = relationship("ProductDB", back_populates="recipes")
    steps = relationship("RecipeStepDB", back_populates="recipe", cascade="all, delete-orphan")
    ingredients = relationship("RecipeIngredientDB", back_populates="recipe", cascade="all, delete-orphan")
    

class OrderDB(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
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
    order_item_id = Column(Integer, ForeignKey("order_items.id", ondelete="CASCADE"), nullable=False)
    step = Column(String, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    resources = Column(JSON, nullable=False)
    batch_size = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default='pending')
    
    order = relationship("OrderDB", back_populates="tasks")
    order_item = relationship("OrderItemDB", back_populates="tasks")

# Pydantic Models
class Product(BaseModel):
    id: Optional[int] = None  # Make ingredient id optional
    name: str

    class Config:
        from_attributes = True

class ProductionStep(BaseModel):
    id: Optional[int] = None  # Change to integer
    name: str
    duration: int = Field(gt=0)
    requiresHuman: bool
    requiresOven: bool
    requiresMixer: bool
    mustFollowImmediately: bool
    scalingFactor: Optional[float] = Field(gt=0.0, default=1.0)

    class Config:
        from_attributes = True

class Ingredient(BaseModel):
    id: Optional[int] = None  # Make ingredient id optional
    product: Product  # Add this line
    unit: str
    qty: float

    class Config:
        from_attributes = True

class Recipe(BaseModel):
    id: Optional[int] = None  # Make id optional
    ingredients: List[Ingredient]
    product: Product
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
    id: Optional[int] = None
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
        if 'created_at' not in data:
            data['created_at'] = datetime.utcnow().isoformat()
        if 'updated_at' not in data:
            data['updated_at'] = datetime.utcnow().isoformat()
        if 'status' not in data:
            data['status'] = 'new'
        super().__init__(**data)


class ScheduledTask(BaseModel):
    orderId: str
    step: str
    startTime: datetime
    endTime: datetime
    resources: List[str]
    batchSize: int = Field(gt=0)
    status: Optional[str] = 'pending'
    product: Optional[Product] = None

    class Config:
        from_attributes = True
        
    @property
    def duration(self) -> int:
        return int((self.endTime - self.startTime).total_seconds() / 60)

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

    class Config:
        from_attributes = True