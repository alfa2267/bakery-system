from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON

# Instead, ensure you're importing Base from database
from .database import Base

# SQLAlchemy Models
class CustomerDB(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    phone = Column(String, nullable=False)
    street = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=False, default="Nigeria")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    orders = relationship("OrderDB", back_populates="customer")

class CakeBaseDB(Base):
    __tablename__ = "cake_bases"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    base_price = Column(Float, nullable=False)
    image_emoji = Column(String, nullable=True)  # For emoji representation
    image_url = Column(String, nullable=True)   # For actual image URLs
    is_popular = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    category = Column(String, nullable=False, default="cake")
    
    order_items = relationship("OrderItemDB", back_populates="cake_base")

class FlavorDB(Base):
    __tablename__ = "flavors"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price_modifier = Column(Float, nullable=False, default=0.0)
    category = Column(String, nullable=False)  # cake, icing, filling
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

class IcingTypeDB(Base):
    __tablename__ = "icing_types"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price_modifier = Column(Float, nullable=False, default=0.0)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

class FillingTypeDB(Base):
    __tablename__ = "filling_types"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price_modifier = Column(Float, nullable=False, default=0.0)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

class ShapeDB(Base):
    __tablename__ = "shapes"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price_modifier = Column(Float, nullable=False, default=0.0)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

class SizeDB(Base):
    __tablename__ = "sizes"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    servings = Column(Integer, nullable=False)
    price_modifier = Column(Float, nullable=False, default=0.0)
    is_active = Column(Boolean, default=True)

class ColorSchemeDB(Base):
    __tablename__ = "color_schemes"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    colors = Column(JSON, nullable=False)  # List of hex color codes
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

class ToppingDB(Base):
    __tablename__ = "toppings"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price_modifier = Column(Float, nullable=False, default=0.0)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=False)  # fruits, nuts, decorations, etc.
    is_active = Column(Boolean, default=True)

class ProductDB(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    base_price = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    is_popular = Column(Boolean, default=False)
    image_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    
    order_items = relationship("OrderItemDB", back_populates="product")

class OrderItemDB(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)  # Made optional for custom cakes
    cake_base_id = Column(Integer, ForeignKey("cake_bases.id"), nullable=True)  # For custom cakes
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    
    # Cake Configuration
    flavors = Column(JSON, nullable=True)  # List of flavor IDs
    icing_type = Column(String, ForeignKey("icing_types.id"), nullable=True)
    icing_flavor = Column(String, nullable=True)
    filling_type = Column(String, ForeignKey("filling_types.id"), nullable=True)
    filling_flavor = Column(String, nullable=True)
    toppings = Column(JSON, nullable=True)  # List of topping IDs
    shape_id = Column(String, ForeignKey("shapes.id"), nullable=True)
    size_id = Column(String, ForeignKey("sizes.id"), nullable=True)
    color_scheme_id = Column(String, ForeignKey("color_schemes.id"), nullable=True)
    custom_colors = Column(JSON, nullable=True)  # List of custom hex colors
    custom_message = Column(String, nullable=True)
    special_requests = Column(Text, nullable=True)
    inspiration_images = Column(JSON, nullable=True)  # URLs to uploaded images
    
    # Relationships
    order = relationship("OrderDB", back_populates="items")
    product = relationship("ProductDB", back_populates="order_items")
    cake_base = relationship("CakeBaseDB", back_populates="order_items")
    shape = relationship("ShapeDB")
    size = relationship("SizeDB")
    icing_type_rel = relationship("IcingTypeDB")
    filling_type_rel = relationship("FillingTypeDB")
    color_scheme = relationship("ColorSchemeDB")

class DeliverySlotDB(Base):
    __tablename__ = "delivery_slots"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    price_modifier = Column(Float, nullable=False, default=0.0)
    is_active = Column(Boolean, default=True)
    is_available = Column(Boolean, default=True)
    
    orders = relationship("OrderDB", back_populates="delivery_slot")

class PaymentMethodDB(Base):
    __tablename__ = "payment_methods"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    icon = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    processing_fee = Column(Float, nullable=False, default=0.0)
    
    orders = relationship("OrderDB", back_populates="payment_method")

class OrderDB(Base):
    __tablename__ = "orders"
    
    id = Column(String, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    
    # Order Details
    status = Column(String, nullable=False, default="pending")  # pending, confirmed, in_production, ready, delivered, cancelled
    total_amount = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    delivery_fee = Column(Float, nullable=False, default=0.0)
    payment_fee = Column(Float, nullable=False, default=0.0)
    
    # Delivery Information
    is_delivery = Column(Boolean, nullable=False, default=True)
    delivery_date = Column(String, nullable=False)
    delivery_slot_id = Column(String, ForeignKey("delivery_slots.id"), nullable=False)
    delivery_address = Column(String, nullable=True)  # Only if different from customer address
    estimated_travel_time = Column(Integer, nullable=False, default=0)
    
    # Payment Information
    payment_method_id = Column(String, ForeignKey("payment_methods.id"), nullable=False)
    payment_status = Column(String, nullable=False, default="pending")  # pending, processing, completed, failed, refunded
    payment_reference = Column(String, nullable=True)
    
    # Terms and Conditions
    terms_accepted = Column(Boolean, nullable=False, default=False)
    terms_accepted_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    confirmed_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    
    # Relationships
    customer = relationship("CustomerDB", back_populates="orders")
    items = relationship("OrderItemDB", back_populates="order", cascade="all, delete-orphan")
    tasks = relationship("ScheduledTaskDB", back_populates="order", cascade="all, delete-orphan")
    delivery_slot = relationship("DeliverySlotDB", back_populates="orders")
    payment_method = relationship("PaymentMethodDB", back_populates="orders")

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
    
    order = relationship("OrderDB", back_populates="tasks")

# Operational Configuration Models
class BakerySettingsDB(Base):
    __tablename__ = "bakery_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    setting_key = Column(String, nullable=False, unique=True)
    setting_value = Column(JSON, nullable=False)
    description = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class EquipmentDB(Base):
    __tablename__ = "equipment"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # oven, mixer, prep_station, packaging
    capacity = Column(Integer, nullable=False)  # Maximum batch size
    efficiency_rating = Column(Float, nullable=False, default=1.0)  # 0.0 to 1.0
    maintenance_interval_hours = Column(Integer, nullable=False, default=168)  # Weekly by default
    last_maintenance = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    location = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    
    scheduled_tasks = relationship("ScheduledTaskDB", back_populates="equipment")

class OperatingHoursDB(Base):
    __tablename__ = "operating_hours"
    
    id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    open_time = Column(String, nullable=False)  # HH:MM format
    close_time = Column(String, nullable=False)  # HH:MM format
    is_open = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)

class StaffScheduleDB(Base):
    __tablename__ = "staff_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    staff_name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # baker, manager, assistant
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(String, nullable=False)  # HH:MM format
    end_time = Column(String, nullable=False)  # HH:MM format
    is_available = Column(Boolean, default=True)
    skills = Column(JSON, nullable=True)  # List of equipment they can operate
    notes = Column(Text, nullable=True)

class ProductionCapacityDB(Base):
    __tablename__ = "production_capacity"
    
    id = Column(Integer, primary_key=True, index=True)
    product_type = Column(String, nullable=False)  # cake, bread, pastry
    max_daily_capacity = Column(Integer, nullable=False)
    batch_size = Column(Integer, nullable=False)
    processing_time_minutes = Column(Integer, nullable=False)
    required_equipment = Column(JSON, nullable=False)  # List of equipment IDs
    priority_level = Column(Integer, default=1)  # 1=low, 5=high
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)

# Pydantic Models for API
class CustomerAddress(BaseModel):
    street: str
    city: str
    state: str
    country: str = "Nigeria"

class Customer(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    email: str = Field(..., regex=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    phone: str = Field(..., min_length=10)
    address: CustomerAddress

    class Config:
        from_attributes = True

class CakeBase(BaseModel):
    id: int
    name: str
    description: Optional[str]
    base_price: float
    image_emoji: Optional[str]
    image_url: Optional[str]
    is_popular: bool
    is_active: bool

    class Config:
        from_attributes = True

class Flavor(BaseModel):
    id: str
    name: str
    price_modifier: float
    category: str
    description: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True

class IcingType(BaseModel):
    id: str
    name: str
    price_modifier: float
    description: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True

class FillingType(BaseModel):
    id: str
    name: str
    price_modifier: float
    description: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True

class Shape(BaseModel):
    id: str
    name: str
    price_modifier: float
    description: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True

class Size(BaseModel):
    id: str
    name: str
    description: Optional[str]
    servings: int
    price_modifier: float
    is_active: bool

    class Config:
        from_attributes = True

class ColorScheme(BaseModel):
    id: str
    name: str
    colors: List[str]
    description: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True

class Topping(BaseModel):
    id: str
    name: str
    price_modifier: float
    description: Optional[str]
    category: str
    is_active: bool

    class Config:
        from_attributes = True

class DeliverySlot(BaseModel):
    id: str
    name: str
    start_time: str
    end_time: str
    price_modifier: float
    is_active: bool
    is_available: bool

    class Config:
        from_attributes = True

class PaymentMethod(BaseModel):
    id: str
    name: str
    icon: Optional[str]
    is_active: bool
    processing_fee: float

    class Config:
        from_attributes = True

class CakeConfiguration(BaseModel):
    cake_base_id: Optional[int] = None
    flavors: List[str] = Field(default_factory=list)
    icing_type: Optional[str] = None
    icing_flavor: Optional[str] = None
    filling_type: Optional[str] = None
    filling_flavor: Optional[str] = None
    toppings: List[str] = Field(default_factory=list)
    shape_id: Optional[str] = None
    size_id: Optional[str] = None
    color_scheme_id: Optional[str] = None
    custom_colors: List[str] = Field(default_factory=list)
    custom_message: Optional[str] = None
    special_requests: Optional[str] = None
    inspiration_images: List[str] = Field(default_factory=list)

    @validator('flavors')
    def validate_flavors(cls, v):
        if len(v) > 3:
            raise ValueError('Maximum 3 flavors allowed')
        return v

    @validator('custom_colors')
    def validate_custom_colors(cls, v):
        for color in v:
            if not color.startswith('#') or len(color) != 7:
                raise ValueError('Custom colors must be valid hex codes')
        return v

class OrderItem(BaseModel):
    product_id: Optional[int] = None
    cake_base_id: Optional[int] = None
    cake_configuration: Optional[CakeConfiguration] = None
    quantity: int = Field(gt=0)

    @validator('quantity')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be greater than 0')
        return v

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    customer: Customer
    items: List[OrderItem]
    is_delivery: bool = True
    delivery_date: str
    delivery_slot_id: str
    payment_method_id: str
    terms_accepted: bool = False
    delivery_address: Optional[str] = None

    @validator('terms_accepted')
    def validate_terms_accepted(cls, v):
        if not v:
            raise ValueError('Terms and conditions must be accepted')
        return v

    @validator('delivery_date')
    def validate_delivery_date(cls, v):
        try:
            delivery_date = datetime.strptime(v, '%Y-%m-%d')
            if delivery_date.date() < datetime.now().date():
                raise ValueError('Delivery date cannot be in the past')
        except ValueError:
            raise ValueError('Invalid delivery date format. Use YYYY-MM-DD')
        return v

class Order(BaseModel):
    id: str
    customer_name: str
    status: Optional[str] = 'pending'
    created_at: str
    updated_at: Optional[str]
    delivery_date: str
    delivery_slot: str
    location: str
    estimated_travel_time: int
    items: List[OrderItem]
    total_amount: float
    subtotal: float
    delivery_fee: float
    payment_fee: float

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

# Cake Configurator specific models
class CakeConfiguratorOptions(BaseModel):
    cake_bases: List[CakeBase]
    flavors: List[Flavor]
    icing_types: List[IcingType]
    filling_types: List[FillingType]
    shapes: List[Shape]
    sizes: List[Size]
    color_schemes: List[ColorScheme]
    toppings: List[Topping]
    delivery_slots: List[DeliverySlot]
    payment_methods: List[PaymentMethod]

class PriceCalculation(BaseModel):
    base_price: float
    flavor_additions: float
    icing_addition: float
    filling_addition: float
    topping_additions: float
    shape_addition: float
    size_addition: float
    delivery_addition: float
    subtotal: float
    total: float

class CakeConfiguratorResponse(BaseModel):
    configuration: CakeConfiguration
    price_calculation: PriceCalculation
    estimated_delivery_time: Optional[str] = None

# Operational Configuration Pydantic Models
class Equipment(BaseModel):
    id: Optional[int] = None
    name: str = Field(..., min_length=1)
    type: str = Field(..., regex="^(oven|mixer|prep_station|packaging)$")
    capacity: int = Field(..., gt=0)
    efficiency_rating: float = Field(..., ge=0.0, le=1.0)
    maintenance_interval_hours: int = Field(..., gt=0)
    last_maintenance: Optional[datetime] = None
    is_active: bool = True
    location: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class OperatingHours(BaseModel):
    id: Optional[int] = None
    day_of_week: int = Field(..., ge=0, le=6)
    open_time: str = Field(..., regex="^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    close_time: str = Field(..., regex="^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    is_open: bool = True
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class StaffSchedule(BaseModel):
    id: Optional[int] = None
    staff_name: str = Field(..., min_length=1)
    role: str = Field(..., regex="^(baker|manager|assistant)$")
    day_of_week: int = Field(..., ge=0, le=6)
    start_time: str = Field(..., regex="^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    end_time: str = Field(..., regex="^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    is_available: bool = True
    skills: Optional[List[str]] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class ProductionCapacity(BaseModel):
    id: Optional[int] = None
    product_type: str = Field(..., min_length=1)
    max_daily_capacity: int = Field(..., gt=0)
    batch_size: int = Field(..., gt=0)
    processing_time_minutes: int = Field(..., gt=0)
    required_equipment: List[int] = Field(default_factory=list)
    priority_level: int = Field(..., ge=1, le=5)
    is_active: bool = True
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class BakerySettings(BaseModel):
    id: Optional[int] = None
    setting_key: str = Field(..., min_length=1)
    setting_value: Dict[str, Any]
    description: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BakeryConfiguration(BaseModel):
    equipment: List[Equipment]
    operating_hours: List[OperatingHours]
    staff_schedules: List[StaffSchedule]
    production_capacity: List[ProductionCapacity]
    settings: List[BakerySettings]
