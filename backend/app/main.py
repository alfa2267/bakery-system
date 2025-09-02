from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import uuid
import logging
import traceback
from typing import List, Optional

from .models import (
    Order, ValidationResponse, ScheduleResponse,
    DailyScheduleSummary, ResourceUtilization, ScheduledTask,
    CakeConfiguration, CakeConfiguratorOptions, PriceCalculation,
    CakeConfiguratorResponse, OrderCreate, Customer
)
from .scheduler import BakeryScheduler
from .config import settings
from .database import get_db, verify_db_connection, init_db
from .repository import OrderRepository
from .cake_configurator import CakeConfiguratorService

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        logger.info("Starting up application...")
        if not verify_db_connection():
            raise Exception("Could not connect to database")
            
        init_db()
        logger.info("Application startup complete")
        yield
    except Exception as e:
        logger.error(f"Application startup failed: {str(e)}")
        logger.error(traceback.format_exc())
        raise
    finally:
        # Cleanup (if needed)
        logger.info("Shutting down application...")

app = FastAPI(title=settings.app_name, lifespan=lifespan)

origins = [
        "*",  # Be careful in production
        "https://localhost:3000",
        "https://*.app.github.dev",
        "https://fluffy-cod-wr6xg46jp9429j6j-3000.app.github.dev"
        ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize scheduler
scheduler = BakeryScheduler()


@app.get("/manifest.json")
async def get_manifest():
    return FileResponse("./frontend/public/manifest.json")

@app.post("/orders/validate")
async def validate_order(order: Order) -> ValidationResponse:
    """
    Validate an order before creation
    """
    try:
        logger.info(f"Validating order: {order}")
        
        # Use the scheduler to validate the order
        is_valid, warnings = scheduler.validate_order(order)
        
        logger.info(f"Validation result: valid={is_valid}, warnings={warnings}")
        
        return ValidationResponse(
            isValid=is_valid, 
            warnings=warnings
        )
    except Exception as e:
        logger.error(f"Error during order validation: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Validation error: {str(e)}")

@app.post("/orders")
async def create_order(order: Order, db: Session = Depends(get_db)) -> ScheduleResponse:
    logger.info(f"Received order creation request: {order}")
    
    try:
        # Validate first
        is_valid, warnings = scheduler.validate_order(order)
        if not is_valid:
            logger.warning(f"Order validation failed: {warnings}")
            raise HTTPException(status_code=400, detail=warnings)

        # Generate order ID if not provided
        if not order.id:
            order.id = str(uuid.uuid4())
            logger.info(f"Generated order ID: {order.id}")

        try:
            # Schedule the order
            scheduled_tasks = scheduler.schedule_order(order)
            logger.info(f"Scheduled {len(scheduled_tasks)} tasks for order {order.id}")
            
            # Save to database
            repository = OrderRepository(db)
            try:
                db_order = repository.create_order(order, scheduled_tasks)
                logger.info(f"Order {order.id} saved to database")
            except SQLAlchemyError as e:
                logger.error(f"Database error while saving order: {str(e)}")
                logger.error(traceback.format_exc())
                raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
            
            return ScheduleResponse(
                orderId=db_order.id,
                tasks=scheduled_tasks
            )
        except Exception as scheduling_error:
            logger.error(f"Error during order scheduling: {str(scheduling_error)}")
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Scheduling error: {str(scheduling_error)}")
            
    except HTTPException:
        raise
    except Exception as unexpected_error:
        logger.error(f"Unexpected error in order creation: {str(unexpected_error)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="An unexpected error occurred during order processing")

@app.get("/orders")
async def list_orders(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """
    Retrieve a list of orders with optional pagination
    """
    try:
        logger.info(f"Fetching orders")
        repository = OrderRepository(db)
        
        # Fetch orders from the database
        orders = repository.get_orders()
        
        return {
            "orders": orders,
            "total": len(orders)
        }
    except SQLAlchemyError as db_error:
        logger.error(f"Database error fetching orders: {str(db_error)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Database error: {str(db_error)}")
    except Exception as unexpected_error:
        logger.error(f"Unexpected error fetching orders: {str(unexpected_error)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="An unexpected error occurred while fetching orders")

@app.get("/schedule/{date}")
async def get_schedule(
    date: str, 
    include_details: bool = Query(False, description="Include order details with tasks"),
    db: Session = Depends(get_db)
):
    try:
        # Validate and parse date
        try:
            parsed_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            logger.warning(f"Invalid date format: {date}")
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
        logger.info(f"Fetching schedule for date: {parsed_date}")
        repository = OrderRepository(db)
        
        try:
            # Fetch tasks for the date
            db_tasks = repository.get_tasks_by_date(date)
            
            # Convert DB tasks to ScheduleResponse tasks
            tasks = [
                ScheduledTask(
                    orderId=task.order_id,
                    step=task.step,
                    startTime=task.start_time,
                    endTime=task.end_time,
                    resources=task.resources,
                    batchSize=task.batch_size,
                    status=task.status or 'pending'
                )
                for task in db_tasks
            ]
            
            # Prepare response
            response_data = {"schedule": tasks}
            
            if include_details and tasks:
                # Calculate resource utilization
                resource_util = _calculate_resource_utilization(tasks)
                
                summary = DailyScheduleSummary(
                    date=date,
                    total_orders=len(set(task.orderId for task in tasks)),
                    total_tasks=len(tasks),
                    resource_utilization=resource_util,
                    start_time=min(task.startTime for task in tasks),
                    end_time=max(task.endTime for task in tasks)
                )
                response_data["summary"] = summary
            
            return response_data
        
        except SQLAlchemyError as db_error:
            logger.error(f"Database error fetching schedule: {str(db_error)}")
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Database error: {str(db_error)}")
    
    except HTTPException:
        raise
    except Exception as unexpected_error:
        logger.error(f"Unexpected error fetching schedule: {str(unexpected_error)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="An unexpected error occurred while fetching the schedule")

def _calculate_resource_utilization(tasks: List[ScheduledTask]) -> List[ResourceUtilization]:
    """
    Calculate resource utilization based on scheduled tasks
    """
    # Aggregate resources from all tasks
    all_resources = set()
    for task in tasks:
        all_resources.update(task.resources)
    
    resource_utilization = []
    total_minutes = 24 * 60  # Total minutes in a day
    
    for resource in all_resources:
        # Find tasks using this resource
        resource_tasks = [task for task in tasks if resource in task.resources]
        
        if resource_tasks:
            # Calculate total busy time for this resource
            busy_minutes = sum(
                (task.endTime - task.startTime).total_seconds() / 60 
                for task in resource_tasks
            )
            
            # Calculate utilization percentage
            utilization_percentage = (busy_minutes / total_minutes) * 100
            
            resource_utilization.append(
                ResourceUtilization(
                    resource=resource,
                    utilization_percentage=round(utilization_percentage, 2),
                    busy_minutes=round(busy_minutes),
                    total_minutes=total_minutes
                )
            )
    
    return resource_utilization

# Optional debug endpoint to list available recipes
@app.get("/debug/recipes")
async def get_available_recipes():
    """Endpoint to list available recipes for debugging"""
    try:
        recipes = scheduler.get_available_products()
        return {"recipes": recipes}
    except Exception as e:
        logger.error(f"Error fetching recipes: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not fetch recipes")
    
@app.get("/baker/{baker_name}")
async def get_items_for_baker(baker_name: str):
    """Endpoint to retrieve all items associated with a specific baker"""
    try:
        items = scheduler.get_items_for_baker(baker_name)
        return {"baker": baker_name, "items": items}
    except Exception as e:
        logger.error(f"Error fetching baker items: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching items for the baker")

# Cake Configurator Endpoints
@app.get("/cake-configurator/options")
async def get_cake_configurator_options(db: Session = Depends(get_db)) -> CakeConfiguratorOptions:
    """Get all available options for the cake configurator"""
    try:
        service = CakeConfiguratorService(db)
        return service.get_all_options()
    except Exception as e:
        logger.error(f"Error fetching cake configurator options: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not fetch configurator options")

@app.post("/cake-configurator/calculate-price")
async def calculate_cake_price(
    configuration: CakeConfiguration,
    delivery_slot_id: Optional[str] = None,
    db: Session = Depends(get_db)
) -> PriceCalculation:
    """Calculate the total price for a cake configuration"""
    try:
        service = CakeConfiguratorService(db)
        return service.calculate_price(configuration, delivery_slot_id)
    except Exception as e:
        logger.error(f"Error calculating cake price: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not calculate price")

@app.post("/cake-configurator/validate")
async def validate_cake_configuration(
    configuration: CakeConfiguration,
    db: Session = Depends(get_db)
):
    """Validate a cake configuration"""
    try:
        service = CakeConfiguratorService(db)
        return service.validate_configuration(configuration)
    except Exception as e:
        logger.error(f"Error validating cake configuration: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not validate configuration")

@app.post("/cake-configurator/estimate-delivery")
async def estimate_delivery_time(
    configuration: CakeConfiguration,
    delivery_date: str,
    db: Session = Depends(get_db)
):
    """Estimate delivery time based on cake complexity"""
    try:
        service = CakeConfiguratorService(db)
        estimated_time = service.estimate_delivery_time(configuration, delivery_date)
        return {"estimated_delivery_time": estimated_time}
    except Exception as e:
        logger.error(f"Error estimating delivery time: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not estimate delivery time")

@app.post("/cake-configurator/recommendations")
async def get_cake_recommendations(
    configuration: CakeConfiguration,
    db: Session = Depends(get_db)
):
    """Get personalized recommendations based on current configuration"""
    try:
        service = CakeConfiguratorService(db)
        return {"recommendations": service.get_recommendations(configuration)}
    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not get recommendations")

@app.post("/cake-configurator/orders")
async def create_cake_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db)
) -> ScheduleResponse:
    """Create a new cake order with configuration"""
    try:
        logger.info(f"Creating cake order: {order_data}")
        
        # Validate the cake configuration
        service = CakeConfiguratorService(db)
        validation = service.validate_configuration(order_data.items[0].cake_configuration)
        if not validation["is_valid"]:
            raise HTTPException(status_code=400, detail=validation["errors"])
        
        # Calculate total price
        total_price = 0
        for item in order_data.items:
            if item.cake_configuration:
                price_calc = service.calculate_price(item.cake_configuration, order_data.delivery_slot_id)
                total_price += price_calc.total * item.quantity
        
        # Create the order using existing order creation logic
        # This would need to be adapted to handle cake configurations
        # For now, we'll return a simplified response
        
        order_id = str(uuid.uuid4())
        
        return ScheduleResponse(
            orderId=order_id,
            tasks=[]  # Would be populated by scheduler
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating cake order: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not create cake order")

@app.post("/cake-configurator/initialize-data")
async def initialize_cake_configurator_data(db: Session = Depends(get_db)):
    """Initialize sample data for the cake configurator"""
    try:
        service = CakeConfiguratorService(db)
        service.create_sample_data()
        return {"message": "Sample data created successfully"}
    except Exception as e:
        logger.error(f"Error initializing sample data: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not initialize sample data")
