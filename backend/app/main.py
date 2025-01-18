from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, Query, Body, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from pydantic import BaseModel
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
from .repository import OrderRepository, RecipeRepository, ProductRepository

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Define TaskTimingUpdate model
class TaskTimingUpdate(BaseModel):
    start: datetime
    end: datetime

@asynccontextmanager
async def lifespan(app: FastAPI):
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
        logger.info("Shutting down application...")

# Create FastAPI app instance
app = FastAPI(title=settings.app_name, lifespan=lifespan)

# CORS configuration
origins = [
    "http://localhost:3000",
    "https://localhost:3000",
    "http://localhost:8000",
    "https://localhost:8000",
    "https://*.app.github.dev",
    "wss://*.app.github.dev",
    "https://fluffy-cod-wr6xg46jp9429j6j-3000.app.github.dev",
    "wss://fluffy-cod-wr6xg46jp9429j6j-3000.app.github.dev"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

def get_scheduler(db: Session = Depends(get_db)) -> BakeryScheduler:
    """Dependency to get configured scheduler instance"""
    return BakeryScheduler(repository=db)

@app.get("/manifest.json")
async def get_manifest():
    return FileResponse("./frontend/public/manifest.json")

@app.get("/recipes")
async def get_recipes(db: Session = Depends(get_db)):
    """Get all available recipes"""
    try:
        recipe_repo = RecipeRepository(db)
        db_recipes = recipe_repo.get_all_recipes()
        
        recipes = []
        for db_recipe in db_recipes:
            recipe = {
                "id": db_recipe.id,
                "product": {
                    "id": db_recipe.product.id,
                    "name": db_recipe.product.name
                },
                "ingredients": [
                    {
                        "product": {
                            "name": ing.product.name, 
                            "id": ing.product.id
                            },
                        "unit": ing.unit,
                        "qty": int(ing.quantity),
                        "id": ing.id
                    }
                    for ing in db_recipe.ingredients
                ],
                "steps": [
                    {
                        "id": step.id,
                        "name": step.name,
                        "duration": step.duration,
                        "requiresHuman": step.requires_human,
                        "requiresOven": step.requires_oven,
                        "requiresMixer": step.requires_mixer,
                        "mustFollowImmediately": step.must_follow_immediately,
                        "scalingFactor": float(step.scaling_factor)
                    }
                    for step in sorted(db_recipe.steps, key=lambda x: x.order)
                ],
                "requiresChilling": db_recipe.requires_chilling,
                "maxChillTime": db_recipe.max_chill_time,
                "minBatchSize": db_recipe.min_batch_size,
                "maxBatchSize": db_recipe.max_batch_size,
                "unit": db_recipe.unit
            }
            recipes.append(recipe)
        
        return {"recipes": recipes}
        
    except Exception as e:
        logger.error(f"Error fetching recipes: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recipes")
async def create_recipe(
    recipe: Recipe,
    db: Session = Depends(get_db),
):
    try:
        # Remove any pre-existing ids before creating
        for ingredient in recipe.ingredients:
            ingredient.id = None

        repository = RecipeRepository(db)

        # Save to database
        db_recipe = repository.create_recipe(recipe)
        logger.info(f"Recipe saved to database with ID: {db_recipe.id}")
        
        return {"id": db_recipe.id}
    except HTTPException as http_err:
        logger.error(f"HTTP Error creating recipes: {http_err.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating recipes: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))




@app.put("/recipes/{recipes_id}", response_model=Recipe)
async def update_recipe(
    recipe_id: int,
    recipe: Recipe,
    db: Session = Depends(get_db)
):
    """Update an existing recipe"""
    try:
        repository = RecipeRepository(db)
        db_recipe = repository.update_recipe(recipe_id, recipe)
        if not db_recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        return db_recipe
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating recipe: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Could not update recipe: {str(e)}"
        )


@app.delete("/recipes/{recipe_id}")
async def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    """Delete a recipe"""
    try:
        repository = RecipeRepository(db)
        success = repository.delete_recipe(recipe_id)
        if not success:
            raise HTTPException(status_code=404, detail="Recipe not found")
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting recipe: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Could not delete recipe: {str(e)}"
        )


@app.post("/orders/validate")
async def validate_order(
    order: Order,
    scheduler: BakeryScheduler = Depends(get_scheduler)
) -> ValidationResponse:
    """Validate an order against constraints"""
    logger.info(f"Validating order: {order}")
    try:
        is_valid, warnings = scheduler.validate_order(order)
        return ValidationResponse(isValid=is_valid, warnings=warnings)
    except Exception as e:
        logger.error(f"Error during order validation: {str(e)}")
        logger.error(traceback.format_exc())
        return ValidationResponse(isValid=False, warnings=[f"Validation error: {str(e)}"])


@app.post("/orders")
async def create_order(
    order: Order,
    db: Session = Depends(get_db),
    scheduler: BakeryScheduler = Depends(get_scheduler)
) -> ScheduleResponse:
    logger.info(f"Received order creation request: {order}")
    try:
        # Validate first
        is_valid, warnings = scheduler.validate_order(order)
        if not is_valid:
            logger.warning(f"Order validation failed: {warnings}")
            raise HTTPException(status_code=400, detail=warnings)

        try:
            # Schedule the order
            scheduled_tasks = scheduler.schedule_order(order)
            logger.info(f"Scheduled {len(scheduled_tasks)} tasks for order {order.id}")
            
            # Save to database
            repository = OrderRepository(db)
            db_order = repository.create_order(order, scheduled_tasks)
            logger.info(f"Order {db_order.id} saved to database")
            
            return ScheduleResponse(orderId=db_order.id, tasks=scheduled_tasks)
            
        except Exception as scheduling_error:
            logger.error(f"Error during order scheduling: {str(scheduling_error)}")
            logger.error(traceback.format_exc())
            raise HTTPException(
                status_code=500,
                detail=f"Scheduling error: {str(scheduling_error)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in order creation: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during order processing"
        )



@app.get("/orders")
async def get_orders(db: Session = Depends(get_db)):
    """Retrieve all orders"""
    try:
        repository = OrderRepository(db)
        db_orders = repository.get_orders()
        
        if not db_orders:
            return {"orders": []}
        
        orders = []
        for db_order in db_orders:
            order = Order(
                id=db_order.id,
                customerName=db_order.customer_name,
                deliveryDate=db_order.delivery_date,
                deliverySlot=db_order.delivery_slot,
                location=db_order.location,
                estimatedTravelTime=db_order.estimated_travel_time,
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
        
    except Exception as e:
        logger.error(f"Error fetching orders: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/config")
async def get_config():
    """Get application configuration"""
    return {
        "delivery_slots": [
            {"id": slot.id, "time": slot.time}
            for slot in settings.delivery_slots
        ],
        "business_hours": {
            "store": {
                "open": settings.store_open_time,
                "close": settings.store_close_time
            },
            "kitchen": {
                "open": settings.kitchen_open_time,
                "close": settings.kitchen_close_time
            }
        },
        "resources": {
            "bakers": settings.num_bakers,
            "ovens": settings.num_ovens,
            "mixers": settings.num_mixers
        }
    }

@app.put("/tasks/{task_id}/timing")
async def update_task_timing(
    task_id: str,
    timing: TaskTimingUpdate,
    db: Session = Depends(get_db)
):
    """Update task timing"""
    try:
        repository = OrderRepository(db)
        updated_task = repository.update_task_timing(task_id, timing.start, timing.end)
        
        return {
            "id":int(updated_task.id),
            "time": updated_task.start_time.isoformat(),
            "action": updated_task.step,
            "details": f"{updated_task.step} for Order {updated_task.order_id}",
            "equipment": updated_task.resources,
            "status": updated_task.status,
            "start": updated_task.start_time.isoformat(),
            "end": updated_task.end_time.isoformat()
        }
    except Exception as e:
        logger.error(f"Error updating task timing: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/tasks/{task_id}/status")
async def update_task_status(
    task_id: str,
    status: str = Body(...),
    db: Session = Depends(get_db)
):
    """Update task status"""
    try:
        repository = OrderRepository(db)
        updated_task = repository.update_task_status(task_id, status)
        
        return {
            "id": int(updated_task.id),
            "time": updated_task.start_time.isoformat(),
            "action": updated_task.step,
            "details": f"{updated_task.step} for Order {updated_task.order_id}",
            "equipment": updated_task.resources,
            "status": updated_task.status
        }
    except Exception as e:
        logger.error(f"Error updating task status: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Message received: {data}")
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await websocket.close()

@app.get("/resources")
async def get_resources(
    id: Optional[int] = Query(None, description="ID of resource"),
    date: Optional[str] = Query(None, description="Date to check resources availability"),
    filter_name: Optional[str] = Query(None, description="Specific staff or equipment to filter"),
    filter_type: Optional[str] = Query(None, description="Type of resource to filter (staff/equipment)"),
    baker_name: Optional[str] = Query(None, description="Baker name for task filtering"),
    db: Session = Depends(get_db)
):
    """Endpoint to retrieve available resources"""
    try:
        if not date:
            date = datetime.now().strftime("%Y-%m-%d")
        
        repository = OrderRepository(db)
        scheduler = BakeryScheduler(repository=db)
        resources = scheduler.get_available_resources(date)
        
        if baker_name:
            tasks = repository.get_tasks_by_date_and_resource(date, baker_name)
            resources['tasks'] = [
                {
                    "id": int(task.id),
                    "time": task.start_time.isoformat(),
                    "action": task.step,
                    "details": f"{task.step} for Order {task.order_id}",
                    "equipment": task.resources,
                    "status": task.status
                }
                for task in tasks
            ]
        
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
        
        return resources
    except Exception as e:
        logger.error(f"Error fetching available resources: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# Add these schedule endpoints to the main.py file

@app.get("/schedule")
async def get_schedules(
    include_details: bool = Query(False, description="Include order details with tasks"),
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"Fetching all schedules")
        repository = OrderRepository(db)
        db_tasks = repository.get_tasks()
        
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
        
        response_data = {"schedule": tasks}
        
        if include_details and tasks:
            resource_util = _calculate_resource_utilization(tasks)
            summary = DailyScheduleSummary(
                date="01/01/2025",
                total_orders=len(set(task.orderId for task in tasks)),
                total_tasks=len(tasks),
                resource_utilization=resource_util,
                start_time=min(task.startTime for task in tasks),
                end_time=max(task.endTime for task in tasks)
            )
            response_data["summary"] = summary
        
        return response_data
        
    except Exception as e:
        logger.error(f"Error fetching schedules: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while fetching the schedule"
        )

@app.get("/schedule/{date}")
async def get_schedule(
    date: str,
    include_details: bool = Query(False, description="Include order details with tasks"),
    db: Session = Depends(get_db)
):
    try:
        parsed_date = datetime.strptime(date, "%Y-%m-%d").date()
        logger.info(f"Fetching schedule for date: {parsed_date}")
        
        repository = OrderRepository(db)
        db_tasks = repository.get_tasks_by_date(date)
        
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
        
        response_data = {"schedule": tasks}
        
        if include_details and tasks:
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
        
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    except Exception as e:
        logger.error(f"Error fetching schedule: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while fetching the schedule"
        )


def _calculate_resource_utilization(tasks: List[ScheduledTask]) -> List[ResourceUtilization]:
    """Calculate resource utilization based on scheduled tasks"""
    all_resources = set()
    for task in tasks:
        all_resources.update(task.resources)
    
    resource_utilization = []
    total_minutes = 24 * 60
    
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


# Add these endpoints to your main.py
@app.get("/products", response_model=List[Product])
async def get_products(db: Session = Depends(get_db)):
    """Get all products"""
    try:
        repository = ProductRepository(db)
        products = repository.get_products()
        return products
    except Exception as e:
        logger.error(f"Error fetching products: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Could not fetch products: {str(e)}"
        )

@app.post("/products", response_model=Product)
async def create_product(
    product: Product,
    db: Session = Depends(get_db)
):
    """Create a new product"""
    try:
        repository = ProductRepository(db)
        db_product = repository.create_product(product)
        return db_product
    except Exception as e:
        logger.error(f"Error creating product: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Could not create product: {str(e)}"
        )

@app.put("/products/{product_id}", response_model=Product)
async def update_product(
    product_id: int,
    product: Product,
    db: Session = Depends(get_db)
):
    """Update an existing product"""
    try:
        repository = ProductRepository(db)
        db_product = repository.update_product(product_id, product)
        if not db_product:
            raise HTTPException(status_code=404, detail="Product not found")
        return db_product
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating product: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Could not update product: {str(e)}"
        )

@app.delete("/products/{product_id}")
async def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Delete a product"""
    try:
        repository = ProductRepository(db)
        success = repository.delete_product(product_id)
        if not success:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting product: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Could not delete product: {str(e)}"
        )