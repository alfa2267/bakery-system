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

    def _load_recipes(self) -> Dict[str, Recipe]:
        """Load recipes from JSON file"""
        try:
            logger.info(f"Loading recipes from {self.recipes_path}")
            with open(self.recipes_path, 'r') as f:
                recipe_data = json.load(f)
            logger.info("Recipes loaded successfully")
        except FileNotFoundError:
            logger.error(f"Recipe file not found at {self.recipes_path}")
            raise FileNotFoundError(f"Recipe file not found at {self.recipes_path}")
        except json.JSONDecodeError:
            logger.error("Invalid JSON format in recipe file")
            raise ValueError("Invalid JSON format in recipe file")

        recipes = {}
        for product_type, recipe_info in recipe_data.items():
            try:
                steps = [
                    ProductionStep(
                        name=step['name'],
                        duration=step['duration'],
                        requiresHuman=step['requiresHuman'],
                        requiresOven=step['requiresOven'],
                        requiresMixer=step['requiresMixer'],
                        mustFollowImmediately=step['mustFollowImmediately'],
                        scalingFactor=step.get('scalingFactor', 1.0)
                    )
                    for step in recipe_info['steps']
                ]
            except KeyError as e:
                logger.error(f"Missing required key {e} in recipe for {product_type}")
                raise

            recipes[product_type] = Recipe(
                productType=recipe_info['productType'],
                steps=steps,
                requiresChilling=recipe_info['requiresChilling'],
                maxChillTime=recipe_info['maxChillTime'],
                minBatchSize=recipe_info['minBatchSize'],
                maxBatchSize=recipe_info['maxBatchSize']
            )

        return recipes

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
        available_products = [
            {
                "product": product_type,
                "minBatchSize": recipe.minBatchSize,
                "maxBatchSize": recipe.maxBatchSize,
                "requiresChilling": recipe.requiresChilling,
                "totalProductionTime": sum(step.duration for step in recipe.steps)
            }
            for product_type, recipe in self.recipes.items()
        ]
        logger.info(f"Available products: {', '.join([prod['product'] for prod in available_products])}")
        return available_products
        

    def schedule_order(self, order: Order) -> List[ScheduledTask]:
        tasks = []
        current_time = datetime.now()  # Start scheduling from now

        for item in order.items:
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
                    batchSize=item.quantity,  # Use item.quantity for the batch size
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

    def _schedule_batches(
        self,
        batches: List[int],
        recipe: Recipe,
        delivery_time: datetime,
        order_id: str
    ) -> List[ScheduledTask]:
        tasks = []
        current_time = delivery_time

        for batch_size in batches:
            batch_tasks = []

            for step in reversed(recipe.steps):
                end_time = current_time
                start_time = end_time - timedelta(minutes=step.duration)

                task = ScheduledTask(
                    orderId=order_id,
                    step=step.name,
                    startTime=start_time,
                    endTime=end_time,
                    resources=self._get_required_resources(step),
                    batchSize=batch_size,
                    productName=recipe.productType
                )
                batch_tasks.append(task)

                if step.mustFollowImmediately and len(recipe.steps) > 1:
                    current_time = start_time
                else:
                    current_time = self._find_available_time(
                        start_time,
                        step,
                        batch_size
                    )

            tasks.extend(reversed(batch_tasks))

        logger.debug(f"Scheduled {len(tasks)} tasks for order {order_id}")
        return tasks

    def _find_available_time(
        self,
        desired_time: datetime,
        step: ProductionStep,
        batch_size: int
    ) -> datetime:
        return desired_time

    def get_recipe_steps(self, product_type: str) -> List[ProductionStep]:
        """Retrieve the recipe steps for a specific product."""
        recipe = self.recipes.get(product_type)
        if not recipe:
            logger.error(f"Recipe for product {product_type} not found.")
            raise ValueError(f"Recipe for product {product_type} not found.")
        return recipe.steps