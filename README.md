# Bakery Management System

A comprehensive bakery management system with modern React frontend, Python FastAPI backend, and advanced delivery management modules.

## 🏗️ System Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **UI Library**: shadcn/ui components with Tailwind CSS
- **State Management**: React hooks and local storage
- **Build Tool**: Create React App with custom configuration

### Backend (Python + FastAPI)
- **Framework**: FastAPI with async support
- **Database**: SQLite with SQLAlchemy ORM
- **API**: RESTful endpoints with automatic documentation
- **Validation**: Pydantic models with comprehensive validation

### Delivery Modules (Python)
- **Source**: Extracted from Delivery-Carriers repository
- **License**: AGPL-3.0 (adapted for educational use)
- **Purpose**: Specialized bakery delivery management

## 🚀 Quick Start

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python init_db.py
uvicorn app.main:app --reload
```

### Cake Configurator Setup
```bash
cd backend
curl -X POST http://localhost:8000/cake-configurator/initialize-data
```

## 📋 Core Features

### 1. Order Management
- **Enhanced Order Form**: Customizable order creation with presets
- **Order Tracking**: Real-time status updates and history
- **Customer Management**: Contact information and preferences
- **Delivery Scheduling**: Time slot selection and route optimization

### 2. Production Scheduling
- **Gantt Chart View**: Visual production timeline
- **Resource Utilization**: Equipment and staff allocation
- **Baker Task Management**: Individual baker workflows
- **Workstation Management**: Equipment-specific task assignment

### 3. Cake Configurator
- **Custom Cake Design**: Interactive cake customization
- **Real-time Pricing**: Dynamic price calculation
- **Visual Preview**: Cake appearance simulation
- **Order Integration**: Seamless order creation

### 4. Delivery Management
- **Geographic Zones**: Route optimization and pricing
- **Time Windows**: Customer-specific delivery schedules
- **Multi-location**: Complex order splitting
- **Freshness Tracking**: Batch/lot management for perishables

### 5. Recipe Management
- **Recipe Creation**: Ingredient and instruction management
- **Cost Calculation**: Recipe pricing and profitability
- **Inventory Integration**: Ingredient availability tracking
- **Version Control**: Recipe updates and history

## 🎨 UI Components (shadcn/ui)

### Available Components
- **Button**: Multiple variants (default, destructive, outline, secondary, ghost, link)
- **Input**: Styled form inputs with proper accessibility
- **Card**: Structured content containers with header, content, and footer
- **Label**: Proper form labeling with Radix UI primitives
- **Tabs**: Tabbed interface components
- **Badge**: Status and category indicators
- **Alert**: Notification and warning components

### Usage Examples
```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

// Using the cn() utility
import { cn } from '@/lib/utils';
const className = cn("base-classes", condition && "conditional-classes");
```

### Custom Hooks
```tsx
import { useLocalStorage, useMediaQuery } from '@/hooks';

const [value, setValue] = useLocalStorage('key', initialValue);
const isMobile = useMediaQuery('(max-width: 768px)');
```

## 🍰 Cake Configurator Features

### Customization Options
- **Cake Bases**: The Classic, Chocolate Delight, Strawberry Dreams, Rainbow Fantasy
- **Flavors**: Vanilla, Chocolate, Strawberry, Lemon, Caramel, Red Velvet, Coconut, Coffee
- **Icing Types**: Buttercream, Fondant, Cream Cheese, Royal Icing, Ganache
- **Shapes**: Round, Square, Heart, Number, Letter, Custom
- **Sizes**: Small, Medium, Large, Extra Large, Tiered
- **Color Schemes**: Pink & Gold, Blue & Silver, Rainbow, Pastel, Elegant, Sunset
- **Toppings**: Fruits, nuts, decorations, custom elements

### API Endpoints
- `GET /cake-configurator/options` - Available customization options
- `POST /cake-configurator/calculate-price` - Real-time pricing
- `POST /cake-configurator/validate` - Configuration validation
- `POST /cake-configurator/estimate-delivery` - Delivery time estimation
- `POST /cake-configurator/recommendations` - Personalized suggestions
- `POST /cake-configurator/orders` - Order creation

### Price Calculation Logic
```
Total = Base Price + Flavor Additions + Icing Addition + 
        Filling Addition + Topping Additions + Shape Addition + 
        Size Addition + Delivery Fee
```

## 🚚 Delivery Management Modules

### 1. Partner Delivery Schedule ⭐ ESSENTIAL
**Perfect for**: Fresh bakery delivery time windows
- Customer-specific delivery schedules (7:00-9:00 AM for fresh bread)
- Day-of-week preferences (weekdays only, weekends, etc.)
- Time validation and formatting
- Multiple delivery windows support

### 2. Partner Delivery Zone ⭐ ESSENTIAL
**Perfect for**: Local bakery delivery route management
- Geographic zone management with radius/coordinates
- Zone-specific delivery fees and minimums
- Priority-based zone ordering
- Customer zone assignment
- Distance estimation between zones

### 3. Stock Lot Tracking ⭐ CRITICAL
**Perfect for**: Perishable goods tracking and freshness management
- Automatic batch/lot creation for fresh products
- Expiration date tracking and freshness levels
- FIFO (First In, First Out) allocation
- Production traceability (baker, shift, ingredients)
- Inventory management with expiry warnings

### 4. Stock Multishipping ⭐ HIGH VALUE
**Perfect for**: Complex orders with multiple delivery locations
- Single order split across multiple delivery addresses
- Product allocation management
- Individual delivery slips per location
- Address-specific delivery preferences
- Inventory validation across shipments

### 5. Website Extension ⭐ HIGH VALUE
**Perfect for**: Customer delivery preferences and special instructions
- Delivery date selection by customers
- Special delivery instructions ("Leave at side door")
- Customer order comments ("No nuts - allergy")
- Freshness and temperature preferences
- Contact preferences (call/text on arrival)

## 📊 File Consolidation Summary

### Consolidated Components
- **API Layer**: All API functionality consolidated into `frontend/src/api/api.ts`
- **Schedule Components**: Gantt and resource views merged into `ConsolidatedScheduleView.tsx`
- **Library Functions**: All utilities consolidated into `frontend/src/lib/utils.ts`

### Benefits
- **66% file reduction** (9 files → 3 files)
- **Single source of truth** for related functionality
- **Consistent patterns** across the codebase
- **Improved maintainability** and developer experience

## 🛠️ Development

### Available Scripts
```bash
# Frontend
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run eject      # Eject from Create React App (not recommended)

# Backend
uvicorn app.main:app --reload  # Start development server
python init_db.py              # Initialize database
```

### Configuration Files
- `components.json`: shadcn/ui configuration
- `tailwind.config.js`: Tailwind CSS with design system
- `tsconfig.json`: TypeScript with path mappings
- `postcss.config.js`: PostCSS configuration for Tailwind v4
- `requirements.txt`: Python dependencies

## 🎯 Implementation Priority

### Phase 1 - Core Delivery (Essential)
1. `partner_delivery_schedule_adapted.py` - Time windows
2. `partner_delivery_zone_adapted.py` - Geographic zones
3. `stock_lot_tracking_adapted.py` - Freshness tracking

### Phase 2 - Enhanced Experience (High Value)
4. `website_extension_adapted.py` - Customer preferences
5. `stock_multishipping_adapted.py` - Complex deliveries

## 🔧 Technical Architecture

### Frontend Architecture
- **Component-based**: Modular, reusable components
- **Type-safe**: Full TypeScript integration
- **Responsive**: Mobile-first design approach
- **Accessible**: WCAG compliance with Radix UI primitives

### Backend Architecture
- **Async-first**: FastAPI with async/await patterns
- **Validation**: Pydantic models with comprehensive validation
- **Documentation**: Automatic OpenAPI/Swagger documentation
- **Database**: SQLAlchemy ORM with migration support

### Delivery Modules Architecture
- **Standalone Python classes** - No external dependencies
- **Dataclass-based models** - Clean, typed data structures
- **Enum-driven configurations** - Clear status and option management
- **Validation built-in** - Data integrity and business rules
- **Extensible design** - Easy to adapt and extend

## 🚀 Next Steps

1. **Choose Priority Modules**: Start with Phase 1 essentials
2. **Integrate with Existing System**: Adapt to your current bakery management system
3. **Configure for Your Business**: Set up zones, schedules, and product types
4. **Test with Real Scenarios**: Corporate orders, family deliveries, daily routes
5. **Extend as Needed**: Add bakery-specific features and business rules

## 📝 License

- **Frontend/Backend**: Custom implementation
- **Delivery Modules**: Extracted from Delivery-Carriers repository under AGPL-3.0 license
- **Adaptations**: Created for educational and business use

---

*Perfect foundation for building a comprehensive bakery management system with professional-grade features specifically designed for fresh goods, local delivery, and excellent customer service.*
