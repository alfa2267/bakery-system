import json
import logging
from datetime import datetime, timedelta
from typing import List, Tuple, Dict
from pathlib import Path
from .models import Order, Recipe, ProductionStep, ScheduledTask

# Set up logging configuration
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class BakeryScheduler:
    def __init__(self, recipes_path: str = None):
        self.recipes_path = recipes_path or Path(__file__).parent / 'recipes.json'
        self.recipes = self._load_recipes()
        self.orders = []
        self.schedule = []



    def _load_recipes(self) -> Dict[int, Recipe]:
        """Load recipes from JSON file"""
        try:
            logger.info(f"Loading recipes from {self.recipes_path}")
            with open(self.recipes_path, 'r') as f:
                recipes_data = json.load(f)
                
            # Convert list to dictionary with recipe ID as key
            recipes = {}
            for recipe_data in recipes_data:
                recipe = Recipe(**recipe_data)
                recipes[recipe.id] = recipe
                
            logger.info("Recipes loaded successfully")
            return recipes
        except Exception as e:
            logger.error(f"Error loading recipes: {str(e)}")
            raise



    def validate_order(self, order: Order) -> Tuple[bool, List[str]]:
        warnings = []
        is_valid = True

        if not order.items:
            logger.warning(f"Order {order.id} has no items")
            is_valid = False
            warnings.append("Order has no items")

        try:
            delivery_date = datetime.strptime(order.delivery_date, "%Y-%m-%d").date()
            if delivery_date < datetime.now().date():
                logger.warning(f"Order {order.id} has an invalid delivery date: {order.delivery_date}")
                is_valid = False
                warnings.append("Delivery date must be in the future")
        except ValueError:
            logger.error(f"Invalid delivery date format for order {order.id}: {order.delivery_date}")
            is_valid = False
            warnings.append("Invalid delivery date format")

        for item in order.items:
            recipe = self.recipes.get(item.product)
            if not recipe:
                logger.error(f"Unknown product {item.product} in order {order.id}")
                is_valid = False
                warnings.append(f"Unknown product: {item.product}. Available products: {', '.join(self.recipes.keys())}")
                continue

            if item.quantity < recipe.minBatchSize:
                logger.warning(f"Order {order.id}: Item {item.product} has a quantity lower than minimum batch size")
                warnings.append(
                    f"Minimum batch size for {item.product} is {recipe.minBatchSize}. Order will be rounded up."
                )

            batches = (item.quantity + recipe.maxBatchSize - 1) // recipe.maxBatchSize
            if batches > 1:
                logger.info(f"Order {order.id}: Item {item.product} requires {batches} batches")
                warnings.append(f"Order requires {batches} batches of {item.product}")

        return is_valid, warnings



    def get_available_products(self) -> List[Dict]:
        """Return list of available products and their constraints"""
        try:
            available_products = [
                {
                    "product": {
                        "id": recipe.product.id,
                        "name": recipe.product.name
                    },
                    "minBatchSize": recipe.minBatchSize,
                    "maxBatchSize": recipe.maxBatchSize,
                    "requiresChilling": recipe.requiresChilling,
                    "totalProductionTime": sum(step.duration for step in recipe.steps)
                }
                for recipe in self.recipes.values()
            ]
            
            # Log product names properly by accessing the nested name field
            product_names = [prod['product']['name'] for prod in available_products]
            logger.info(f"Available products: {', '.join(product_names)}")
            
            return available_products
            
        except Exception as e:
            logger.error(f"Error getting available products: {str(e)}")
            logger.error(traceback.format_exc())
            raise




    def schedule_order(self, order: Order) -> List[ScheduledTask]:
        tasks = []
        current_time = datetime.now()  # Start scheduling from now

        for item in order.items:
            batches = self._calculate_batches(item.quantity, self.recipes[item.product])

            for batch_size in batches:
                for step in self.get_recipe_steps(item.product):  # Iterate through each product's steps
                    # Get the required resources dynamically
                    resources = self._get_required_resources(step)

                    # Calculate start_time and end_time for the step
                    end_time = current_time + timedelta(minutes=step.duration)
                    start_time = current_time

                    task = ScheduledTask(
                        orderId=order.id,
                        orderItemId=item.id,  # Add the item ID here
                        orderItemName=item.product,  # Add the item name here
                        step=step.name,
                        startTime=start_time,
                        endTime=end_time,
                        resources=resources,  # Assign the resources
                        batchSize=batch_size,  # Use calculated batch size
                        status="pending",
                        product=item.product  # Use the product from the item
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
