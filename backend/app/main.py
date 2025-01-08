from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, Query, Body
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import uuid
import logging
import traceback
from typing import List, Optional, Dict

from .models import (
    Order, 
    OrderItem,
    ValidationResponse, 
    ScheduleResponse,
    DailyScheduleSummary, 
    ResourceUtilization, 
    ScheduledTask,
    Recipe, 
    Product, 
    ProductionStep, 
    Ingredient
)

from .scheduler import BakeryScheduler
from .config import settings
from .database import get_db, verify_db_connection, init_db
from .repository import OrderRepository

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
    Validate an order against constraints
    Returns ValidationResponse with isValid and warnings
    """
    logger.info(f"Validating order: {order}")
    
    try:
        # Use scheduler's validate_order method
        is_valid, warnings = scheduler.validate_order(order)
        
        return ValidationResponse(
            isValid=is_valid,
            warnings=warnings
        )
        
    except Exception as e:
        logger.error(f"Error during order validation: {str(e)}")
        logger.error(traceback.format_exc())
        return ValidationResponse(
            isValid=False,
            warnings=[f"Validation error: {str(e)}"]
        )

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
async def get_orders(db: Session = Depends(get_db)):
    """Retrieve all orders"""
    try:
        repository = OrderRepository(db)
        
        # Fetch all orders
        db_orders = repository.get_orders()
        
        if not db_orders:
            return {"orders": []}
        
        # Convert to list of orders with their items
        orders = []
        for db_order in db_orders:
            order = Order(
                id=db_order.id,
                customer_name=db_order.customer_name,
                delivery_date=db_order.delivery_date,
                delivery_slot=db_order.delivery_slot,
                location=db_order.location,
                estimated_travel_time=db_order.estimated_travel_time,
                items=[
                    OrderItem(
                        product=Product(
                            id=item.product.id, 
                            name=item.product.name
                        ),
                        quantity=item.quantity
                    ) for item in db_order.items
                ],
                status=db_order.status,
                created_at=db_order.created_at.isoformat() if db_order.created_at else None,
                updated_at=db_order.created_at.isoformat() if db_order.created_at else None
            )
            orders.append(order)
        
        return {"orders": orders}
        
    except SQLAlchemyError as db_error:
        logger.error(f"Database error fetching orders: {str(db_error)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Database error: {str(db_error)}")
    except Exception as unexpected_error:
        logger.error(f"Unexpected error fetching orders: {str(unexpected_error)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="An unexpected error occurred while fetching the orders")

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
                    status=task.status or 'pending',
                    product=Product(
                    id=task.order_item.product.id,
                    name=task.order_item.product.name
                ) if task.order_item and task.order_item.product else None
            
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
    """Calculate resource utilization based on scheduled tasks"""
    all_resources = set()
    for task in tasks:
        all_resources.update(task.resources)
    
    resource_utilization = []
    total_minutes = 24 * 60  # Total minutes in a day
    
    for resource in all_resources:
        resource_tasks = [task for task in tasks if resource in task.resources]
        
        if resource_tasks:
            busy_minutes = sum(
                (task.endTime - task.startTime).total_seconds() / 60 
                for task in resource_tasks
            )
            
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

@app.get("/recipes")
async def get_available_recipes():
    """Endpoint to list available recipes"""
    try:
        # Get recipes from scheduler
        available_products = scheduler.get_available_products()
        logger.debug(f"Found {len(available_products)} recipes")
        
        return {"recipes": available_products}
        
    except Exception as e:
        logger.error(f"Error fetching recipes: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Could not fetch recipes: {str(e)}"
        )




@app.get("/resources")
async def get_available_resources(
    date: Optional[str] = Query(None, description="Date to check resources availability"),
    filter_name: Optional[str] = Query(None, description="Specific staff or equipment to filter"),
    filter_type: Optional[str] = Query(None, description="Type of resource to filter (staff/equipment)"),
    db: Session = Depends(get_db)
):
    """Endpoint to retrieve available resources"""
    try:
        # If no date provided, use current date
        if not date:
            date = datetime.now().strftime("%Y-%m-%d")
        
        # Pass repository to scheduler to enable resource retrieval
        repository = OrderRepository(db)
        scheduler_with_repo = BakeryScheduler(repository=repository)
        
        # Get available resources
        resources = scheduler_with_repo.get_available_resources(date)
        
        # Apply filtering if specified
        if filter_name and filter_type:
            if filter_type == 'staff':
                resources['staff'] = [
                    staff for staff in resources['staff'] 
                    if staff['name'].lower() == filter_name.lower()
                ]
            elif filter_type == 'equipment':
                resources['equipment'] = [
                    equipment for equipment in resources['equipment']
                    if equipment['name'].lower() == filter_name.lower()
                ]
        
        # If a specific task retrieval is needed
        if filter_name:
            try:
                task_resources = scheduler_with_repo.get_resources_for_task(filter_name, date)
                resources['task_resources'] = task_resources
            except Exception as task_error:
                logger.warning(f"Could not retrieve task resources: {str(task_error)}")
        
        return resources
    except Exception as e:
        logger.error(f"Error fetching available resources: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching available resources")







@app.patch("/resources/tasks/{task_id}/status")
async def update_task_status(
    task_id: str, 
    status: str = Body(...),
    db: Session = Depends(get_db)
):
    """Endpoint to update the status of a specific task"""
    try:
        logger.info(f"Updating task {task_id} to status {status}")
        
        repository = OrderRepository(db)
        
        # Update task status
        updated_task = repository.update_task_status(task_id, status)
        
        # Transform task to match frontend expectations
        task_response = {
            "id": str(updated_task.id),
            "time": updated_task.start_time.isoformat(),
            "action": updated_task.step,
            "details": f"{updated_task.step} for Order {updated_task.order_id}",
            "equipment": updated_task.resources,
            "status": updated_task.status,
            "dependencies": []
        }
        
        return task_response
        
    except SQLAlchemyError as db_error:
        logger.error(f"Database error updating task status: {str(db_error)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Database error: {str(db_error)}")
    except Exception as unexpected_error:
        logger.error(f"Unexpected error updating task status: {str(unexpected_error)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="An unexpected error occurred while updating task status")
    """Endpoint to update the status of a specific task"""
    try:
        logger.info(f"Updating task {task_id} for baker {baker_name} to status {status}")
        
        repository = OrderRepository(db)
        
        # Update task status
        updated_task = repository.update_task_status(task_id, status)
        
        # Transform task to match frontend expectations
        task_response = {
            "id": str(updated_task.id),
            "time": updated_task.start_time.isoformat(),
            "action": updated_task.step,
            "details": f"{updated_task.step} for Order {updated_task.order_id}",
            "equipment": updated_task.resources,
            "status": updated_task.status,
            "dependencies": []
        }
        
        return task_response
        
    except SQLAlchemyError as db_error:
        logger.error(f"Database error updating task status: {str(db_error)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Database error: {str(db_error)}")
    except Exception as unexpected_error:
        logger.error(f"Unexpected error updating task status: {str(unexpected_error)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="An unexpected error occurred while updating task status")