from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional, Dict, Tuple
from datetime import datetime
import uuid
from fastapi import HTTPException
import logging
from . import models

logger = logging.getLogger(__name__)

class OrderRepository:
    def __init__(self, db: Session):
        self.db = db



    def create_order(self, order: models.Order, tasks: List[models.ScheduledTask]) -> models.OrderDB:
        try:
            logger.info("Creating new order")

            # Create order without ID (let database auto-generate it)
            db_order = models.OrderDB(
                customer_name=order.customer_name,
                delivery_date=order.delivery_date,
                delivery_slot=order.delivery_slot,
                location=order.location,
                estimated_travel_time=order.estimated_travel_time,
                created_at=datetime.utcnow(),
                status=order.status or 'new'
            )

            # Add and flush to get the auto-generated ID
            self.db.add(db_order)
            self.db.flush()
            
            logger.info(f"Created order with ID: {db_order.id}")

            # Create order items with the newly generated order ID
            db_items = []
            for item in order.items:
                db_product = self._get(item.product)
                db_item = models.OrderItemDB(
                    order_id=db_order.id,  # Use the auto-generated order ID
                    product_id=db_product.id,
                    quantity=item.quantity
                )
                db_items.append(db_item)

            logger.info("Adding order items to the session")
            self.db.add_all(db_items)
            self.db.flush()  # Flush to get item IDs
            
            # Create scheduled tasks with the correct order and item IDs
            db_tasks = [
                models.ScheduledTaskDB(
                    order_id=db_order.id,  # Use the auto-generated order ID
                    order_item_id=item.id,
                    step=task.step,
                    startTime=task.startTime,
                    endTime=task.endTime,
                    resources=task.resources,
                    batch_size=task.batchSize,
                    status=task.status or 'pending'
                )
                for item, task in zip(db_items, tasks)
            ]

            logger.info("Adding scheduled tasks to the session")
            self.db.add_all(db_tasks)
            
            # Commit all changes
            self.db.commit()
            logger.info("Order, items, and tasks committed successfully")

            # Refresh to get all relationships loaded
            self.db.refresh(db_order)
            return db_order

        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating order: {str(e)}")
            raise HTTPException(status_code=500, detail="Database error occurred while creating the order.")


    def update_task_status(self, task_id: str, new_status: str) -> models.ScheduledTaskDB:
        """Update the status of a specific task"""
        try:
            task = self.db.query(models.ScheduledTaskDB)\
                .filter(models.ScheduledTaskDB.id == task_id)\
                .first()
            
            if not task:
                logger.error(f"Task {task_id} not found")
                raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
            
            task.status = new_status
            self.db.commit()
            self.db.refresh(task)
            logger.info(f"Task {task_id} status updated to {new_status}")
            return task
        
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating task status: {str(e)}")
            raise HTTPException(status_code=500, detail="Error updating task status")

    def get_order(self, order_id: str) -> Optional[models.OrderDB]:
        """Fetch a specific order by its ID"""
        return self.db.query(models.OrderDB)\
            .options(
                joinedload(models.OrderDB.items)\
                .joinedload(models.OrderItemDB.product)
            )\
            .filter(models.OrderDB.id == order_id)\
            .first()

    def get_orders(self) -> List[models.OrderDB]:
        """Fetch all orders with their items"""
        return self.db.query(models.OrderDB)\
            .options(
                joinedload(models.OrderDB.items)\
                .joinedload(models.OrderItemDB.product)
            )\
            .all()

    def get_orders_by_date(self, date: str) -> List[models.OrderDB]:
        """Fetch all orders for a specific delivery date"""
        return self.db.query(models.OrderDB)\
            .options(
                joinedload(models.OrderDB.items)\
                .joinedload(models.OrderItemDB.product)
            )\
            .filter(models.OrderDB.delivery_date == date)\
            .all()

    def get_tasks(self) -> List[models.ScheduledTaskDB]:
        """Fetch all tasks"""
        return self.db.query(models.ScheduledTaskDB)\
            .join(models.OrderDB)\
            .options(
                joinedload(models.ScheduledTaskDB.order_item)\
                .joinedload(models.OrderItemDB.product)
            )\
            .all()

    def get_tasks_by_date(self, date: str) -> List[models.ScheduledTaskDB]:
        """Fetch all tasks for a specific delivery date"""
        return self.db.query(models.ScheduledTaskDB)\
            .join(models.OrderDB)\
            .options(
                joinedload(models.ScheduledTaskDB.order_item)\
                .joinedload(models.OrderItemDB.product)
            )\
            .filter(models.OrderDB.delivery_date == date)\
            .all()

    def get_tasks_by_date_and_resource(self, date: str, resource: str) -> List[models.ScheduledTaskDB]:
        """Get all tasks for a specific date that require a specific resource"""
        return self.db.query(models.ScheduledTaskDB)\
            .join(models.OrderDB)\
            .options(
                joinedload(models.ScheduledTaskDB.order_item)\
                .joinedload(models.OrderItemDB.product)
            )\
            .filter(
                models.OrderDB.delivery_date == date,
                models.ScheduledTaskDB.resources.contains([resource])
            )\
            .all()

    def get_utilization_by_date(self, date: str) -> Dict[str, List[models.ScheduledTaskDB]]:
        """Get resource utilization for a specific date"""
        tasks = self.get_tasks_by_date(date)
        utilization = {
            'baker': [],
            'oven': [],
            'mixer': []
        }
        
        for task in tasks:
            for resource in task.resources:
                if resource in utilization:
                    utilization[resource].append(task)
        
        return utilization


class EquipmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_equipment(self, equipment_id: int) -> Optional[models.EquipmentDB]:
        """Get specific equipment by ID"""
        try:
            return self.db.query(models.EquipmentDB)\
                .filter(models.EquipmentDB.id == equipment_id)\
                .first()
        except SQLAlchemyError as e:
            logger.error(f"Error fetching equipment: {str(e)}")
            raise HTTPException(status_code=500, detail="Error fetching equipment")

    def get_all_equipment(self) -> List[models.EquipmentDB]:
        """Get all equipment"""
        try:
            return self.db.query(models.EquipmentDB).all()
        except SQLAlchemyError as e:
            logger.error(f"Error fetching all equipment: {str(e)}")
            raise HTTPException(status_code=500, detail="Error fetching equipment")

    def get_equipment_by_name(self, name: str) -> Optional[models.EquipmentDB]:
        """Get equipment by name"""
        try:
            return self.db.query(models.EquipmentDB)\
                .filter(models.EquipmentDB.name == name)\
                .first()
        except SQLAlchemyError as e:
            logger.error(f"Error fetching equipment by name: {str(e)}")
            raise HTTPException(status_code=500, detail="Error fetching equipment")

    def get_available_equipment(self, name: str) -> int:
        """Get number of available units for specific equipment"""
        try:
            equipment = self.get_equipment_by_name(name)
            if not equipment:
                raise HTTPException(status_code=404, detail=f"Equipment {name} not found")
            return equipment.quantity
        except SQLAlchemyError as e:
            logger.error(f"Error fetching equipment availability: {str(e)}")
            raise HTTPException(status_code=500, detail="Error fetching equipment availability")


class ResourceRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_resource(self, resource_id: str) -> Optional[models.ResourceDB]:
        """Get specific resource by ID"""
        try:
            return self.db.query(models.ResourceDB)\
                .filter(models.ResourceDB.id == resource_id)\
                .first()
        except SQLAlchemyError as e:
            logger.error(f"Error fetching resource: {str(e)}")
            raise HTTPException(status_code=500, detail="Error fetching resource")

    def get_all_resources(self) -> List[models.ResourceDB]:
        """Get all resources"""
        try:
            return self.db.query(models.ResourceDB).all()
        except SQLAlchemyError as e:
            logger.error(f"Error fetching all resources: {str(e)}")
            raise HTTPException(status_code=500, detail="Error fetching resources")

    def get_resource_by_name(self, name: str) -> Optional[models.ResourceDB]:
        """Get resource by name"""
        try:
            return self.db.query(models.ResourceDB)\
                .filter(models.ResourceDB.name == name)\
                .first()
        except SQLAlchemyError as e:
            logger.error(f"Error fetching resource by name: {str(e)}")
            raise HTTPException(status_code=500, detail="Error fetching resource")

    def get_resources_by_skill(self, skill: str) -> List[models.ResourceDB]:
        """Get all resources that have a specific skill"""
        try:
            return self.db.query(models.ResourceDB)\
                .filter(models.ResourceDB.skills.contains([skill]))\
                .all()
        except SQLAlchemyError as e:
            logger.error(f"Error fetching resources by skill: {str(e)}")
            raise HTTPException(status_code=500, detail="Error fetching resources")

    def get_resource_availability(self, resource_id: str, date: str) -> Dict:
        """Get resource availability for a specific date"""
        try:
            resource = self.get_resource(resource_id)
            if not resource:
                raise HTTPException(status_code=404, detail=f"Resource {resource_id} not found")
            
            # Convert date string to day of week
            date_obj = datetime.strptime(date, '%Y-%m-%d')
            day_of_week = date_obj.strftime('%A').lower()
            
            # Get availability for that day
            if day_of_week in resource.availability:
                return resource.availability[day_of_week]
            else:
                return None
                
        except SQLAlchemyError as e:
            logger.error(f"Error fetching resource availability: {str(e)}")
            raise HTTPException(status_code=500, detail="Error fetching resource availability")


class ProductRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_product(self, product_id: int) -> Optional[models.ProductDB]:
        """Get product"""
        
        try:
                db_product = self.db.query(models.ProductDB)\
                    .filter(
                        (models.ProductDB.id == product.id) | 
                        (models.ProductDB.name == product.name)
                    )\
                    .first()

        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating product: {str(e)}")
            raise

        return db_product


    def get_products(self) -> List[models.ProductDB]:
        """Get all products"""
        
        try:
            return self.db.query(models.ProductDB).all()

        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating product: {str(e)}")
            raise


    def create_product(self, product: Dict) -> models.ProductDB:
        """Create a new product"""
        try:
            db_product = models.ProductDB(name=product.name)
            self.db.add(db_product)
            self.db.commit()
            self.db.refresh(db_product)
            return db_product

        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating product: {str(e)}")
            raise


    def update_product(self, product_id: int, product: Dict) -> models.ProductDB:
        """Update an existing product"""
        try:
            db_product = self.db.query(models.ProductDB).filter(models.ProductDB.id == product_id).first()
            if not db_product:
                return None
                
            db_product.name = product.name
            self.db.commit()
            self.db.refresh(db_product)
            return db_product
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating product: {str(e)}")
            raise

    def delete_product(self, product_id: int) -> bool:
        """Delete a product"""
        try:
            # First, check if the product is referenced in any recipes
            existing_recipes = self.db.query(models.RecipeDB)\
                .filter(models.RecipeDB.product_id == product_id)\
                .all()
            
            if existing_recipes:
                # If recipes exist, you have a few options:
                # 1. Raise an exception
                raise HTTPException(
                    status_code=400, 
                    detail=f"Cannot delete product. It is used in {len(existing_recipes)} recipe(s)."
                )
                
                # 2. Optional alternative: delete related recipes
                # for recipe in existing_recipes:
                #     self.db.delete(recipe)
            
            # Find and delete the product
            db_product = self.db.query(models.ProductDB).filter(models.ProductDB.id == product_id).first()
            if not db_product:
                return False
            
            self.db.delete(db_product)
            self.db.commit()
            return True
            
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting product: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Could not delete product: {str(e)}")


class RecipeRepository:
    def __init__(self, db: Session):
        self.db = db

    # Also update get_recipe_by_id to follow the same convention
    def get_recipe_by_id(self, id: int) -> Optional[models.RecipeDB]:
        """Get a specific recipe by ID with all its relationships loaded"""
        try:
            # First do a simple check if recipe exists
            logger.debug(f"Checking existence of recipe with ID: {id}")
            recipe_exists = self.db.query(models.RecipeDB.id)\
                .filter(models.RecipeDB.id == id)\
                .scalar()
                
            if not recipe_exists:
                logger.error(f"Recipe with ID {id} not found")
                raise HTTPException(status_code=404, detail=f"Recipe with ID {id} not found")
            
            # If recipe exists, fetch with all relationships
            logger.debug(f"Fetching complete recipe data for ID: {id}")
            recipe = self.db.query(models.RecipeDB)\
                .options(
                    joinedload(models.RecipeDB.product),
                    joinedload(models.RecipeDB.steps),
                    joinedload(models.RecipeDB.ingredients).joinedload(models.RecipeIngredientDB.product)
                )\
                .filter(models.RecipeDB.id == id)\
                .first()
                
            return recipe

        except HTTPException:
            raise
        except SQLAlchemyError as e:
            logger.error(f"Database error fetching recipe with ID {id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")




    def get_recipe_by_product(self, product_id: int) -> Optional[models.RecipeDB]:
        """Get recipe for a specific product"""
        return self.db.query(models.RecipeDB)\
            .options(
                joinedload(models.RecipeDB.product),
                joinedload(models.RecipeDB.steps),
                joinedload(models.RecipeDB.ingredients)
            )\
            .filter(models.RecipeDB.product_id == product_id)\
            .first()

    def get_all_recipes(self) -> List[models.RecipeDB]:
        return self.db.query(models.RecipeDB)\
            .options(
                joinedload(models.RecipeDB.product),
                joinedload(models.RecipeDB.steps),
                joinedload(models.RecipeDB.ingredients).joinedload(models.RecipeIngredientDB.product)
            )\
            .all()


    def create_recipe(self, recipe_data: models.Recipe) -> models.RecipeDB:
        try:
            # Validate the product
            existing_product = self.db.query(models.ProductDB)\
                .filter(models.ProductDB.id == recipe_data.product.id)\
                .first()
            
            if not existing_product:
                logger.error(f"Invalid product ID: {recipe_data.product.id}")
                raise HTTPException(
                    status_code=400, 
                    detail=f"Product with ID {recipe_data.product.id} does not exist"
                )

            # Validate ingredients
            for ing_data in recipe_data.ingredients:
                existing_ingredient_product = self.db.query(models.ProductDB)\
                    .filter(models.ProductDB.id == ing_data.product.id)\
                    .first()
                
                if not existing_ingredient_product:
                    logger.error(f"Invalid ingredient product ID: {ing_data.product.id}")
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Ingredient product with ID {ing_data.product.id} does not exist"
                    )

            # Create recipe first
            recipe = models.RecipeDB(
                product_id=recipe_data.product.id,
                requires_chilling=recipe_data.requiresChilling,
                max_chill_time=recipe_data.maxChillTime,
                min_batch_size=recipe_data.minBatchSize,
                max_batch_size=recipe_data.maxBatchSize,
                unit=recipe_data.unit
            )
            self.db.add(recipe)
            self.db.flush()  # Ensure recipe gets an ID

            # Validate that the recipe was actually created
            if not recipe or not recipe.id:
                logger.error("Failed to create recipe - no ID generated")
                raise HTTPException(
                    status_code=500, 
                    detail="Failed to create recipe"
                )

            # Create ingredients
            for ing_data in recipe_data.ingredients:
                ingredient = models.RecipeIngredientDB(
                    recipe_id=recipe.id,
                    product_id=ing_data.product.id,
                    quantity=ing_data.qty,
                    unit=ing_data.unit
                )
                self.db.add(ingredient)
                self.db.flush()  # Add this line to ensure proper ID generation

            # Create steps
            for index, step_data in enumerate(recipe_data.steps):
                step = models.RecipeStepDB(
                    recipe_id=recipe.id,
                    name=step_data.name,
                    duration=max(step_data.duration, 1),  # Ensure duration is at least 1
                    order=index,
                    requires_human=step_data.requiresHuman,
                    requires_oven=step_data.requiresOven,
                    requires_mixer=step_data.requiresMixer,
                    must_follow_immediately=step_data.mustFollowImmediately,
                    scaling_factor=step_data.scalingFactor or 1.0
                )
                self.db.add(step)

            self.db.commit()
            self.db.refresh(recipe)

            # Final validation
            if not recipe:
                logger.error("Recipe creation failed - returned None after commit")
                raise HTTPException(
                    status_code=500, 
                    detail="Failed to create recipe"
                )

            return recipe

        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"SQLAlchemy error creating recipe: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error creating recipe: {str(e)}")
        except Exception as e:
            self.db.rollback()
            logger.error(f"Unexpected error creating recipe: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Unexpected error creating recipe: {str(e)}")
    

    def update_recipe(self, id: int, recipe_data: models.Recipe) -> models.RecipeDB:
        """Update an existing recipe"""
        try:
            recipe = self.get_recipe_by_id(id)
            if not recipe:
                raise HTTPException(status_code=404, detail="Recipe not found")

            # Update basic recipe fields
            recipe.requires_chilling = recipe_data.requiresChilling
            recipe.max_chill_time = recipe_data.maxChillTime
            recipe.min_batch_size = recipe_data.minBatchSize
            recipe.max_batch_size = recipe_data.maxBatchSize
            recipe.unit = recipe_data.unit
            recipe.product_id = recipe_data.product.id

            # Update steps
            # First, remove existing steps
            self.db.query(models.RecipeStepDB)\
                .filter(models.RecipeStepDB.recipe_id == id)\
                .delete(synchronize_session=False)
            
            # Add new steps
            for step_data in recipe_data.steps:
                step = models.RecipeStepDB(
                    recipe_id=id,
                    name=step_data.name,
                    duration=step_data.duration,
                    order=0,  # You might want to set this based on the order in the list
                    requires_human=step_data.requiresHuman,
                    requires_oven=step_data.requiresOven,
                    requires_mixer=step_data.requiresMixer,
                    must_follow_immediately=step_data.mustFollowImmediately,
                    scaling_factor=step_data.scalingFactor
                )
                self.db.add(step)

            # Update ingredients
            # First, remove existing ingredients
            self.db.query(models.RecipeIngredientDB)\
                .filter(models.RecipeIngredientDB.recipe_id == id)\
                .delete(synchronize_session=False)
            
            # Add new ingredients
            for ing_data in recipe_data.ingredients:
                ingredient = models.RecipeIngredientDB(
                    recipe_id=id,
                    product_id=ing_data.product.id,
                    quantity=ing_data.qty,
                    unit=ing_data.unit
                )
                self.db.add(ingredient)

            self.db.commit()
            self.db.refresh(recipe)
            return recipe

        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating recipe: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))






    def delete_recipe(self, recipe_id: int) -> bool:
        """Delete a recipe"""
        try:
            logger.debug(f"Attempting to delete recipe with ID: {recipe_id}")
            
            # First check if recipe exists
            recipe_exists = self.db.query(models.RecipeDB.id)\
                .filter(models.RecipeDB.id == recipe_id)\
                .scalar()
                
            if not recipe_exists:
                logger.error(f"Cannot delete - recipe with ID {recipe_id} not found")
                raise HTTPException(status_code=404, detail=f"Recipe with ID {recipe_id} not found")

            # Delete related records first
            logger.debug(f"Deleting related records for recipe {recipe_id}")
            
            # Delete ingredients
            self.db.query(models.RecipeIngredientDB)\
                .filter(models.RecipeIngredientDB.recipe_id == recipe_id)\
                .delete(synchronize_session=False)
                
            # Delete steps
            self.db.query(models.RecipeStepDB)\
                .filter(models.RecipeStepDB.recipe_id == recipe_id)\
                .delete(synchronize_session=False)
                
            # Delete the recipe itself
            deleted = self.db.query(models.RecipeDB)\
                .filter(models.RecipeDB.id == recipe_id)\
                .delete(synchronize_session=False)
                
            self.db.commit()
            
            logger.info(f"Successfully deleted recipe {recipe_id} and all related records")
            return True

        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Database error deleting recipe {recipe_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Database error while deleting recipe: {str(e)}")