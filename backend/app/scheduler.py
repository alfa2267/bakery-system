import json
import logging
import traceback
from datetime import datetime, timedelta
from typing import List, Tuple, Dict, Optional  # Add Optional here
from pathlib import Path
from .models import Order, Recipe, ProductionStep, ScheduledTask
import uuid


# Set up logging configuration
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class BakeryScheduler:
    def __init__(self, 
                 recipes_path: str = None, 
                 resources_path: str = None,
                 equipment_path: str = None,
                 repository: Optional[object] = None):
        # Paths for different configuration files
        self.recipes_path = recipes_path or Path(__file__).parent / 'recipes.json'
        self.resources_path = resources_path or Path(__file__).parent / 'resources.json'
        self.equipment_path = equipment_path or Path(__file__).parent / 'equipment.json'
        
        # Load configurations
        self.recipes = self._load_recipes()
        self.human_resources = self._load_human_resources()
        self.equipment = self._load_equipment()
        
        # Repository for task retrieval
        self.repository = repository
        
        self.orders = []
        self.schedule = []

    def _load_recipes(self) -> Dict[int, Recipe]:
        """Load recipes from JSON file"""
        try:
            logger.info(f"Loading recipes from {self.recipes_path}")
            with open(self.recipes_path, 'r') as f:
                recipes_data = json.load(f)
                
            # Convert list to dictionary with product ID as key
            recipes = {}
            for recipe_data in recipes_data:
                recipe = Recipe(**recipe_data)
                recipes[recipe.product.id] = recipe
                
            logger.info("Recipes loaded successfully")
            return recipes
        except Exception as e:
            logger.error(f"Error loading recipes: {str(e)}")
            raise

    def _load_human_resources(self) -> List[Dict]:
        """Load human resources from JSON file"""
        try:
            logger.info(f"Loading human resources from {self.resources_path}")
            with open(self.resources_path, 'r') as f:
                human_resources = json.load(f)
            
            logger.info(f"Loaded {len(human_resources)} human resources")
            for resource in human_resources:
                logger.debug(f"Loaded resource: {resource['name']} (ID: {resource['id']})")
            
            return human_resources
        except Exception as e:
            logger.error(f"Error loading human resources: {str(e)}")
            return []

    def _load_equipment(self) -> List[Dict]:
        """Load equipment from JSON file"""
        try:
            logger.info(f"Loading equipment from {self.equipment_path}")
            with open(self.equipment_path, 'r') as f:
                equipment_data = json.load(f)
            
            # Extract equipment list (assuming it's nested under 'equipment' key)
            equipment = equipment_data.get('equipment', [])
            
            logger.info(f"Loaded {len(equipment)} equipment items")
            for item in equipment:
                logger.debug(f"Loaded equipment: {item['name']} (ID: {item['id']})")
            
            return equipment
        except Exception as e:
            logger.error(f"Error loading equipment: {str(e)}")
            return []

    def get_available_resources(self, date: str = None) -> Dict:
        """
        Get available resources and equipment for a specific date
        
        :param date: Date to check availability (defaults to current date)
        :return: Dictionary of available resources
        """
        try:
            # If no date provided, use current date
            if not date:
                date = datetime.now().strftime("%Y-%m-%d")
            
            # Get the day of the week
            day = datetime.strptime(date, "%Y-%m-%d").strftime("%A").lower()

            # Check human resources availability
            available_humans = [
                baker for baker in self.human_resources 
                if baker['availability'].get(day)
            ]

            # Prepare equipment availability
            available_equipment = [
                {
                    'name': item['name'],
                    'quantity': item['quantity'],
                    'can_be_shared': item['can_be_shared']
                }
                for item in self.equipment
            ]

            return {
                'human_resources': available_humans,
                'equipment': available_equipment
            }

        except Exception as e:
            logger.error(f"Error retrieving available resources: {str(e)}")
            return {'human_resources': [], 'equipment': []}

    def get_items_for_baker(self, baker_name: str, date: str = None) -> List[Dict]:
        """
        Retrieve tasks for a specific baker
        
        :param baker_name: Name or ID of the baker
        :param date: Optional date to filter tasks (defaults to current date)
        :return: List of tasks for the baker
        """
        try:
            # Check if repository is available
            if not self.repository:
                logger.warning("No repository available to retrieve tasks")
                return []

            # If no date provided, use current date
            if not date:
                date = datetime.now().strftime("%Y-%m-%d")

            # Retrieve tasks for the baker on the specified date
            baker_tasks = self.repository.get_tasks_by_date_and_resource(date, baker_name)
            
            # Transform tasks to match frontend expectations
            tasks = []
            for task in baker_tasks:
                task_details = {
                    "id": str(task.id),
                    "time": task.start_time.isoformat(),
                    "action": task.step,
                    "details": f"{task.step} for Order {task.order_id}",
                    "equipment": task.resources,
                    "status": task.status or 'pending',
                    "dependencies": [],
                    "productName": task.order_item.product.name if task.order_item and task.order_item.product else "Unknown"
                }
                tasks.append(task_details)

            logger.info(f"Retrieved {len(tasks)} tasks for baker {baker_name}")
            return tasks

        except Exception as e:
            logger.error(f"Error retrieving items for baker {baker_name}: {str(e)}")
            logger.error(traceback.format_exc())
            return []



    def validate_order(self, order: Order) -> tuple[bool, list[str]]:
        """
        Validate an order against constraints
        Returns (is_valid, warnings)
        """
        logger.info(f"Validating order: {order}")
        warnings = []
        
        try:
            # Validate each item in the order
            for item in order.items:
                # Find the recipe for this product
                recipe = self.recipes.get(item.product.id)
                
                if not recipe:
                    warnings.append(f"No recipe found for product {item.product.name}")
                    continue
                
                # Check batch size constraints
                if item.quantity < recipe.minBatchSize:
                    warnings.append(
                        f"Order quantity {item.quantity} for {item.product.name} "
                        f"is below minimum batch size of {recipe.minBatchSize}"
                    )
                
                if item.quantity > recipe.maxBatchSize:
                    warnings.append(
                        f"Order quantity {item.quantity} for {item.product.name} "
                        f"exceeds maximum batch size of {recipe.maxBatchSize}"
                    )
            
            # Format delivery date
            try:
                delivery_date = datetime.strptime(order.delivery_date, "%Y-%m-%d")
                if delivery_date.date() < datetime.now().date():
                    warnings.append("Delivery date cannot be in the past")
            except ValueError:
                warnings.append("Invalid delivery date format")
            
            logger.info(f"Validation complete. Warnings: {warnings}")
            return len(warnings) == 0, warnings
            
        except Exception as e:
            logger.error(f"Error during order validation: {str(e)}")
            logger.error(traceback.format_exc())
            warnings.append(f"Validation error: {str(e)}")
            return False, warnings

    def get_available_products(self) -> List[Dict]:
        """Return list of available products and their constraints"""
        available_products = []
        
        for recipe in self.recipes.values():
            try:
                product_info = {
                    "product": {
                        "id": recipe.product.id,
                        "name": recipe.product.name
                    },
                    "minBatchSize": recipe.minBatchSize,
                    "maxBatchSize": recipe.maxBatchSize,
                    "requiresChilling": recipe.requiresChilling,
                    "totalProductionTime": sum(step.duration for step in recipe.steps)
                }
                available_products.append(product_info)
            except Exception as e:
                logger.error(f"Error processing recipe {recipe}: {str(e)}")
                continue
        
        # Log available products by name
        product_names = [f"{prod['product']['name']} (ID: {prod['product']['id']})" 
                        for prod in available_products]
        logger.info(f"Available products: {', '.join(product_names)}")
        
        return available_products



    def schedule_order(self, order: Order) -> List[ScheduledTask]:
        tasks = []
        current_time = datetime.now()  # Start scheduling from now

        for item in order.items:
            # Find the matching recipe
            matching_recipe = self.recipes.get(item.product.id)
            
            if not matching_recipe:
                logger.error(f"No recipe found for product {item.product.name}")
                continue

            batches = self._calculate_batches(item.quantity, matching_recipe)

            for batch_size in batches:
                for step in matching_recipe.steps:
                    # Get the required resources dynamically
                    resources = self._get_required_resources(step)

                    # Calculate start_time and end_time for the step
                    end_time = current_time + timedelta(minutes=step.duration)
                    start_time = current_time

                    # Generate a unique ID for the order item if not present
                    order_item_id = str(uuid.uuid4()) if not hasattr(item, 'id') or item.id is None else str(item.id)

                    task = ScheduledTask(
                        orderId=order.id,
                        orderItemId=order_item_id,
                        orderItemName=item.product.name,
                        step=step.name,
                        startTime=start_time,
                        endTime=end_time,
                        resources=resources,
                        batchSize=batch_size,
                        status="pending",
                        product=item.product
                    )
                    tasks.append(task)

                    # Update current_time for the next step in the batch
                    current_time = end_time

        return tasks




    def _calculate_batches(self, quantity: int, recipe: Recipe) -> List[int]:
        """Calculate optimal batch sizes"""
        batches = []
        remaining = quantity

        while remaining > 0:
            if remaining > recipe.maxBatchSize:
                batches.append(recipe.maxBatchSize)
                remaining -= recipe.maxBatchSize
            else:
                if remaining < recipe.minBatchSize:
                    batches.append(recipe.minBatchSize)
                    remaining = 0
                else:
                    batches.append(remaining)
                    remaining = 0

        logger.debug(f"Batches calculated: {batches}")
        return batches

    def _get_required_resources(self, step: ProductionStep) -> List[str]:
        resources = []
        if step.requiresHuman:
            resources.append("baker")
        if step.requiresOven:
            resources.append("oven")
        if step.requiresMixer:
            resources.append("mixer")
        return resources

    def get_recipe_steps(self, product_id: int) -> List[ProductionStep]:
        """Retrieve the recipe steps for a specific product."""
        recipe = self.recipes.get(product_id)
        if not recipe:
            logger.error(f"Recipe for product ID {product_id} not found.")
            raise ValueError(f"Recipe for product ID {product_id} not found.")
        return recipe.steps