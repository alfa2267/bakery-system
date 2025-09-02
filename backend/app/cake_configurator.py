from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from .models import (
    CakeBaseDB, FlavorDB, IcingTypeDB, FillingTypeDB, ShapeDB, SizeDB,
    ColorSchemeDB, ToppingDB, DeliverySlotDB, PaymentMethodDB,
    CakeBase, Flavor, IcingType, FillingType, Shape, Size, ColorScheme,
    Topping, DeliverySlot, PaymentMethod, CakeConfiguration, PriceCalculation,
    CakeConfiguratorOptions, CakeConfiguratorResponse
)
from .database import get_db
import uuid
from datetime import datetime, timedelta

class CakeConfiguratorService:
    def __init__(self, db: Session):
        self.db = db

    def get_all_options(self) -> CakeConfiguratorOptions:
        """Get all available options for the cake configurator"""
        return CakeConfiguratorOptions(
            cake_bases=[CakeBase.from_orm(cb) for cb in self.db.query(CakeBaseDB).filter(CakeBaseDB.is_active == True).all()],
            flavors=[Flavor.from_orm(f) for f in self.db.query(FlavorDB).filter(FlavorDB.is_active == True).all()],
            icing_types=[IcingType.from_orm(it) for it in self.db.query(IcingTypeDB).filter(IcingTypeDB.is_active == True).all()],
            filling_types=[FillingType.from_orm(ft) for ft in self.db.query(FillingTypeDB).filter(FillingTypeDB.is_active == True).all()],
            shapes=[Shape.from_orm(s) for s in self.db.query(ShapeDB).filter(ShapeDB.is_active == True).all()],
            sizes=[Size.from_orm(s) for s in self.db.query(SizeDB).filter(SizeDB.is_active == True).all()],
            color_schemes=[ColorScheme.from_orm(cs) for cs in self.db.query(ColorSchemeDB).filter(ColorSchemeDB.is_active == True).all()],
            toppings=[Topping.from_orm(t) for t in self.db.query(ToppingDB).filter(ToppingDB.is_active == True).all()],
            delivery_slots=[DeliverySlot.from_orm(ds) for ds in self.db.query(DeliverySlotDB).filter(DeliverySlotDB.is_active == True).all()],
            payment_methods=[PaymentMethod.from_orm(pm) for pm in self.db.query(PaymentMethodDB).filter(PaymentMethodDB.is_active == True).all()]
        )

    def calculate_price(self, configuration: CakeConfiguration, delivery_slot_id: Optional[str] = None) -> PriceCalculation:
        """Calculate the total price for a cake configuration"""
        base_price = 0.0
        flavor_additions = 0.0
        icing_addition = 0.0
        filling_addition = 0.0
        topping_additions = 0.0
        shape_addition = 0.0
        size_addition = 0.0
        delivery_addition = 0.0

        # Base price from cake base
        if configuration.cake_base_id:
            cake_base = self.db.query(CakeBaseDB).filter(CakeBaseDB.id == configuration.cake_base_id).first()
            if cake_base:
                base_price = cake_base.base_price

        # Flavor additions
        for flavor_id in configuration.flavors:
            flavor = self.db.query(FlavorDB).filter(FlavorDB.id == flavor_id).first()
            if flavor:
                flavor_additions += flavor.price_modifier

        # Icing addition
        if configuration.icing_type:
            icing = self.db.query(IcingTypeDB).filter(IcingTypeDB.id == configuration.icing_type).first()
            if icing:
                icing_addition = icing.price_modifier

        # Filling addition
        if configuration.filling_type:
            filling = self.db.query(FillingTypeDB).filter(FillingTypeDB.id == configuration.filling_type).first()
            if filling:
                filling_addition = filling.price_modifier

        # Topping additions
        for topping_id in configuration.toppings:
            topping = self.db.query(ToppingDB).filter(ToppingDB.id == topping_id).first()
            if topping:
                topping_additions += topping.price_modifier

        # Shape addition
        if configuration.shape_id:
            shape = self.db.query(ShapeDB).filter(ShapeDB.id == configuration.shape_id).first()
            if shape:
                shape_addition = shape.price_modifier

        # Size addition
        if configuration.size_id:
            size = self.db.query(SizeDB).filter(SizeDB.id == configuration.size_id).first()
            if size:
                size_addition = size.price_modifier

        # Delivery addition
        if delivery_slot_id:
            delivery_slot = self.db.query(DeliverySlotDB).filter(DeliverySlotDB.id == delivery_slot_id).first()
            if delivery_slot:
                delivery_addition = delivery_slot.price_modifier

        subtotal = base_price + flavor_additions + icing_addition + filling_addition + topping_additions + shape_addition + size_addition
        total = subtotal + delivery_addition

        return PriceCalculation(
            base_price=base_price,
            flavor_additions=flavor_additions,
            icing_addition=icing_addition,
            filling_addition=filling_addition,
            topping_additions=topping_additions,
            shape_addition=shape_addition,
            size_addition=size_addition,
            delivery_addition=delivery_addition,
            subtotal=subtotal,
            total=total
        )

    def validate_configuration(self, configuration: CakeConfiguration) -> Dict[str, Any]:
        """Validate a cake configuration"""
        errors = []
        warnings = []

        # Check if cake base is selected
        if not configuration.cake_base_id:
            errors.append("Cake base must be selected")

        # Check flavors
        if len(configuration.flavors) > 3:
            errors.append("Maximum 3 flavors allowed")
        elif len(configuration.flavors) == 0:
            warnings.append("No flavors selected - vanilla will be used as default")

        # Check if size is selected
        if not configuration.size_id:
            errors.append("Cake size must be selected")

        # Check custom colors
        for color in configuration.custom_colors:
            if not color.startswith('#') or len(color) != 7:
                errors.append(f"Invalid color format: {color}. Use hex format (e.g., #FF0000)")

        # Check if delivery date is reasonable (at least 24 hours in advance for custom cakes)
        # This would be validated in the order creation process

        return {
            "is_valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }

    def estimate_delivery_time(self, configuration: CakeConfiguration, delivery_date: str) -> Optional[str]:
        """Estimate delivery time based on cake complexity"""
        complexity_score = 0

        # Base complexity
        complexity_score += 1

        # Add complexity for custom elements
        if configuration.shape_id and configuration.shape_id not in ['round', 'square']:
            complexity_score += 1

        if configuration.color_scheme_id or configuration.custom_colors:
            complexity_score += 1

        if configuration.custom_message:
            complexity_score += 0.5

        if configuration.inspiration_images:
            complexity_score += 1

        if len(configuration.flavors) > 1:
            complexity_score += 0.5

        # Estimate production time (in hours)
        if complexity_score <= 2:
            production_time = 4  # 4 hours for simple cakes
        elif complexity_score <= 4:
            production_time = 6  # 6 hours for medium complexity
        else:
            production_time = 8  # 8 hours for complex cakes

        # Add delivery time
        total_time = production_time + 1  # 1 hour for delivery

        # Calculate estimated ready time
        try:
            delivery_dt = datetime.strptime(delivery_date, '%Y-%m-%d')
            ready_time = delivery_dt - timedelta(hours=total_time)
            
            if ready_time < datetime.now():
                return None  # Not enough time
            
            return ready_time.strftime('%Y-%m-%d %H:%M')
        except ValueError:
            return None

    def get_recommendations(self, configuration: CakeConfiguration) -> List[Dict[str, Any]]:
        """Get personalized recommendations based on current configuration"""
        recommendations = []

        # If no flavors selected, recommend popular combinations
        if not configuration.flavors:
            popular_flavors = self.db.query(FlavorDB).filter(
                FlavorDB.is_active == True
            ).limit(3).all()
            
            recommendations.append({
                "type": "flavor_suggestion",
                "title": "Popular Flavor Combinations",
                "description": "Try these crowd favorites:",
                "items": [{"id": f.id, "name": f.name, "price": f.price_modifier} for f in popular_flavors]
            })

        # If no size selected, recommend based on typical usage
        if not configuration.size_id:
            recommendations.append({
                "type": "size_suggestion",
                "title": "Size Recommendations",
                "description": "Choose based on your celebration:",
                "items": [
                    {"id": "small", "name": "Small (6-8 people)", "description": "Perfect for intimate gatherings"},
                    {"id": "medium", "name": "Medium (16 people)", "description": "Great for family celebrations"},
                    {"id": "large", "name": "Large (24 people)", "description": "Ideal for parties and events"}
                ]
            })

        # If no color scheme, suggest based on popular themes
        if not configuration.color_scheme_id and not configuration.custom_colors:
            popular_schemes = self.db.query(ColorSchemeDB).filter(
                ColorSchemeDB.is_active == True
            ).limit(3).all()
            
            recommendations.append({
                "type": "color_suggestion",
                "title": "Popular Color Schemes",
                "description": "These combinations are always a hit:",
                "items": [{"id": cs.id, "name": cs.name, "colors": cs.colors} for cs in popular_schemes]
            })

        return recommendations

    def save_inspiration_images(self, images: List[str]) -> List[str]:
        """Save uploaded inspiration images and return URLs"""
        # In a real implementation, you would:
        # 1. Save images to cloud storage (AWS S3, Google Cloud Storage, etc.)
        # 2. Generate unique URLs for each image
        # 3. Store metadata about the images
        
        # For now, we'll just return the original URLs
        # In production, you'd want to implement proper image storage
        return images

    def create_sample_data(self):
        """Create sample data for the cake configurator"""
        # Cake Bases
        cake_bases = [
            CakeBaseDB(
                name="The Classic",
                description="Traditional vanilla sponge with buttercream",
                base_price=35000.0,
                image_emoji="🎂",
                is_popular=False,
                is_active=True
            ),
            CakeBaseDB(
                name="Chocolate Delight",
                description="Rich chocolate layers with ganache",
                base_price=42000.0,
                image_emoji="🍫",
                is_popular=True,
                is_active=True
            ),
            CakeBaseDB(
                name="Strawberry Dreams",
                description="Fresh strawberry sponge with cream",
                base_price=45000.0,
                image_emoji="🍓",
                is_popular=False,
                is_active=True
            ),
            CakeBaseDB(
                name="Rainbow Fantasy",
                description="Multi-colored layers with buttercream",
                base_price=55000.0,
                image_emoji="🌈",
                is_popular=True,
                is_active=True
            )
        ]

        # Flavors
        flavors = [
            FlavorDB(id="vanilla", name="Vanilla Bean", price_modifier=0.0, category="cake"),
            FlavorDB(id="chocolate", name="Rich Chocolate", price_modifier=3000.0, category="cake"),
            FlavorDB(id="strawberry", name="Fresh Strawberry", price_modifier=4000.0, category="cake"),
            FlavorDB(id="lemon", name="Zesty Lemon", price_modifier=3500.0, category="cake"),
            FlavorDB(id="caramel", name="Salted Caramel", price_modifier=5000.0, category="cake"),
            FlavorDB(id="red-velvet", name="Red Velvet", price_modifier=4500.0, category="cake"),
            FlavorDB(id="coconut", name="Tropical Coconut", price_modifier=4000.0, category="cake"),
            FlavorDB(id="coffee", name="Espresso Mocha", price_modifier=5000.0, category="cake")
        ]

        # Icing Types
        icing_types = [
            IcingTypeDB(id="buttercream", name="Buttercream", price_modifier=0.0),
            IcingTypeDB(id="fondant", name="Fondant", price_modifier=12000.0),
            IcingTypeDB(id="cream-cheese", name="Cream Cheese", price_modifier=8000.0),
            IcingTypeDB(id="royal", name="Royal Icing", price_modifier=10000.0),
            IcingTypeDB(id="ganache", name="Chocolate Ganache", price_modifier=9000.0)
        ]

        # Shapes
        shapes = [
            ShapeDB(id="round", name="Round", price_modifier=0.0),
            ShapeDB(id="square", name="Square", price_modifier=5000.0),
            ShapeDB(id="heart", name="Heart", price_modifier=12000.0),
            ShapeDB(id="number", name="Number Shape", price_modifier=18000.0),
            ShapeDB(id="letter", name="Letter Shape", price_modifier=18000.0),
            ShapeDB(id="custom", name="Custom Shape", price_modifier=25000.0)
        ]

        # Sizes
        sizes = [
            SizeDB(id="small", name="Small (6\" - 8 servings)", servings=8, price_modifier=0.0),
            SizeDB(id="medium", name="Medium (8\" - 16 servings)", servings=16, price_modifier=15000.0),
            SizeDB(id="large", name="Large (10\" - 24 servings)", servings=24, price_modifier=28000.0),
            SizeDB(id="xl", name="Extra Large (12\" - 36 servings)", servings=36, price_modifier=45000.0),
            SizeDB(id="tiered", name="Two Tier (50+ servings)", servings=54, price_modifier=75000.0)
        ]

        # Color Schemes
        color_schemes = [
            ColorSchemeDB(id="pink-gold", name="Pink & Gold", colors=["#FFB6C1", "#FFD700"]),
            ColorSchemeDB(id="blue-silver", name="Blue & Silver", colors=["#87CEEB", "#C0C0C0"]),
            ColorSchemeDB(id="rainbow", name="Rainbow", colors=["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#8B00FF"]),
            ColorSchemeDB(id="pastel", name="Pastel Mix", colors=["#FFB3E6", "#E6B3FF", "#B3E6FF", "#B3FFB3"]),
            ColorSchemeDB(id="elegant", name="Black & White", colors=["#000000", "#FFFFFF"]),
            ColorSchemeDB(id="sunset", name="Sunset", colors=["#FF6B35", "#F7931E", "#FFD23F"])
        ]

        # Delivery Slots
        delivery_slots = [
            DeliverySlotDB(id="morning", name="9:00 AM - 12:00 PM", start_time="09:00", end_time="12:00", price_modifier=0.0),
            DeliverySlotDB(id="afternoon", name="12:00 PM - 4:00 PM", start_time="12:00", end_time="16:00", price_modifier=0.0),
            DeliverySlotDB(id="evening", name="4:00 PM - 7:00 PM", start_time="16:00", end_time="19:00", price_modifier=2000.0),
            DeliverySlotDB(id="express", name="Express (Within 2 hours)", start_time="", end_time="", price_modifier=8000.0, is_available=False),
            DeliverySlotDB(id="next-day", name="Next Day Delivery", start_time="", end_time="", price_modifier=3000.0)
        ]

        # Payment Methods
        payment_methods = [
            PaymentMethodDB(id="card", name="Debit/Credit Card", icon="💳", processing_fee=0.0),
            PaymentMethodDB(id="transfer", name="Bank Transfer", icon="🏦", processing_fee=0.0),
            PaymentMethodDB(id="ussd", name="USSD", icon="📱", processing_fee=100.0),
            PaymentMethodDB(id="wallet", name="Digital Wallet", icon="💰", processing_fee=50.0)
        ]

        # Add all to database
        for item in cake_bases + flavors + icing_types + shapes + sizes + color_schemes + delivery_slots + payment_methods:
            self.db.add(item)
        
        self.db.commit()
