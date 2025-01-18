from typing import List, Tuple, Dict, Optional
from datetime import datetime, timedelta
import logging
from sqlalchemy.orm import Session
from .models import Order, ScheduledTask, Recipe, Product
from .repository import OrderRepository, RecipeRepository
from .config import settings

logger = logging.getLogger(__name__)

class BakeryScheduler:
    def __init__(self, repository: Optional[Session] = None):
        self.repository = repository
        self.order_repo = OrderRepository(repository) if repository else None
        self.recipe_repo = RecipeRepository(repository) if repository else None
        
        # Parse business hours
        self.kitchen_open = datetime.strptime(settings.kitchen_open_time, "%H:%M").time()
        self.kitchen_close = datetime.strptime(settings.kitchen_close_time, "%H:%M").time()
        self.store_open = datetime.strptime(settings.store_open_time, "%H:%M").time()
        self.store_close = datetime.strptime(settings.store_close_time, "%H:%M").time()

    def validate_order(self, order: Order) -> Tuple[bool, List[str]]:
        """Validate an order against scheduling constraints."""
        warnings = []
        is_valid = True

        try:
            # Check delivery date/time
            delivery_date = datetime.strptime(order.delivery_date, "%Y-%m-%d")
            current_date = datetime.now()
            
            # Validate delivery slot
            valid_slots = [slot.id for slot in settings.delivery_slots]
            if order.delivery_slot not in valid_slots:
                is_valid = False
                warnings.append(f"Invalid delivery slot. Must be one of: {', '.join(valid_slots)}")

            # Check lead time (at least next day delivery)
            if delivery_date.date() <= current_date.date():
                is_valid = False
                warnings.append("Delivery must be scheduled for future dates")

            # Storage constraints validation
            for item in order.items:
                if not item.product:
                    is_valid = False
                    warnings.append("Each order item must have a product")
                    continue

                if self.recipe_repo:
                    recipe = self.recipe_repo.get_recipe_by_product(item.product.id)
                    if not recipe:
                        is_valid = False
                        warnings.append(f"No recipe found for product {item.product.name}")
                    elif recipe.requires_chilling:
                        # Check if we exceed storage limits
                        if recipe.max_chill_time > settings.freezer_storage_days * 24:
                            is_valid = False
                            warnings.append(f"Product {item.product.name} exceeds maximum storage time")

            # Validate batch sizes
            for item in order.items:
                recipe = self.recipe_repo.get_recipe_by_product(item.product.id) if self.recipe_repo else None
                if recipe:
                    if item.quantity < recipe.min_batch_size:
                        is_valid = False
                        warnings.append(f"Minimum batch size for {item.product.name} is {recipe.min_batch_size}")
                    if item.quantity > recipe.max_batch_size:
                        is_valid = False
                        warnings.append(f"Maximum batch size for {item.product.name} is {recipe.max_batch_size}")

            return is_valid, warnings

        except ValueError as e:
            return False, [f"Invalid date format: {str(e)}"]
        except Exception as e:
            logger.error(f"Error validating order: {str(e)}")
            return False, [f"Validation error: {str(e)}"]

    def schedule_order(self, order: Order) -> List[ScheduledTask]:
        """Schedule a new order."""
        logger.info(f"Scheduling order {order.id}")
        tasks = []

        try:
            delivery_date = datetime.strptime(order.delivery_date, "%Y-%m-%d")
            
            # Get delivery slot time
            delivery_slot = next(slot for slot in settings.delivery_slots if slot.id == order.delivery_slot)
            delivery_start = delivery_slot.time.split("-")[0]
            delivery_time = datetime.strptime(delivery_start, "%H:%M").time()
            delivery_datetime = datetime.combine(delivery_date.date(), delivery_time)

            # Get existing tasks for the delivery date
            existing_tasks = []
            if self.order_repo:
                existing_tasks = self.order_repo.get_tasks_by_date(order.delivery_date)

            # Schedule tasks for each order item
            for item in order.items:
                recipe = self.recipe_repo.get_recipe_by_product(item.product.id) if self.recipe_repo else None
                if not recipe:
                    raise ValueError(f"No recipe found for product {item.product.name}")

                # Calculate backward from delivery time
                current_time = delivery_datetime - timedelta(hours=1)  # Buffer hour before delivery

                # Schedule each step in reverse
                for step in reversed(recipe.steps):
                    # Find suitable time slot
                    start_time, end_time = self._find_time_slot(
                        current_time,
                        step.duration,
                        step.requires_human,
                        step.requires_oven,
                        step.requires_mixer,
                        existing_tasks,
                        recipe.requires_chilling
                    )

                    task = ScheduledTask(
                        orderId=order.id,
                        step=step.name,
                        startTime=start_time,
                        endTime=end_time,
                        resources=self._get_required_resources(step),
                        batchSize=item.quantity,
                        product=item.product
                    )
                    tasks.append(task)
                    existing_tasks.append(task)

                    # Update time for next step
                    current_time = start_time - timedelta(minutes=15)  # 15-minute gap between steps

            # Sort tasks by start time
            tasks.sort(key=lambda x: x.startTime)
            return tasks

        except Exception as e:
            logger.error(f"Error scheduling order: {str(e)}")
            raise

    def _find_time_slot(
        self,
        target_end_time: datetime,
        duration: int,
        needs_baker: bool,
        needs_oven: bool,
        needs_mixer: bool,
        existing_tasks: List[ScheduledTask],
        requires_chilling: bool
    ) -> Tuple[datetime, datetime]:
        """Find suitable time slot for a task working backward from target end time."""
        start_time = target_end_time - timedelta(minutes=duration)
        
        # Keep trying earlier slots until we find one that works
        while not self._is_slot_available(
            start_time,
            target_end_time,
            needs_baker,
            needs_oven,
            needs_mixer,
            existing_tasks,
            requires_chilling
        ):
            target_end_time -= timedelta(minutes=15)
            start_time = target_end_time - timedelta(minutes=duration)

        return start_time, target_end_time

    def _is_slot_available(
        self,
        start_time: datetime,
        end_time: datetime,
        needs_baker: bool,
        needs_oven: bool,
        needs_mixer: bool,
        existing_tasks: List[ScheduledTask],
        requires_chilling: bool
    ) -> bool:
        """Check if a time slot is available considering all constraints."""
        
        # Check kitchen hours
        if not (self.kitchen_open <= start_time.time() <= self.kitchen_close and
                self.kitchen_open <= end_time.time() <= self.kitchen_close):
            return False

        # Check storage constraints for items requiring chilling
        if requires_chilling:
            time_until_delivery = (end_time - datetime.now()).total_seconds() / 3600
            if time_until_delivery > settings.freezer_storage_days * 24:
                return False

        # Count concurrent resource usage
        concurrent_bakers = 0
        concurrent_ovens = 0
        concurrent_mixers = 0

        for task in existing_tasks:
            if self._tasks_overlap(start_time, end_time, task.startTime, task.endTime):
                if 'baker' in task.resources:
                    concurrent_bakers += 1
                if 'oven' in task.resources:
                    concurrent_ovens += 1
                if 'mixer' in task.resources:
                    concurrent_mixers += 1

        # Check resource constraints
        if needs_baker and concurrent_bakers >= settings.num_bakers:
            return False
        if needs_oven and concurrent_ovens >= settings.num_ovens:
            return False
        if needs_mixer and concurrent_mixers >= settings.num_mixers:
            return False

        return True

    def _tasks_overlap(
        self,
        start1: datetime,
        end1: datetime,
        start2: datetime,
        end2: datetime
    ) -> bool:
        """Check if two time periods overlap."""
        return start1 < end2 and end1 > start2

    def _get_required_resources(self, step: 'RecipeStepDB') -> List[str]:
        """Get list of required resources for a step."""
        resources = []
        if step.requires_human:
            resources.append('baker')
        if step.requires_oven:
            resources.append('oven')
        if step.requires_mixer:
            resources.append('mixer')
        return resources

    def get_available_resources(self, date: str) -> Dict[str, List[Dict]]:
        """Get available resources for a given date."""
        if not self.order_repo:
            return {
                'staff': [],
                'equipment': []
            }

        try:
            tasks = self.order_repo.get_tasks_by_date(date)
            
            # Calculate current resource usage
            bakers_free = settings.num_bakers
            ovens_free = settings.num_ovens
            mixers_free = settings.num_mixers

            for task in tasks:
                if task.status != 'completed':
                    if 'baker' in task.resources:
                        bakers_free -= 1
                    if 'oven' in task.resources:
                        ovens_free -= 1
                    if 'mixer' in task.resources:
                        mixers_free -= 1

            return {
                'staff': [
                    {'name': f'Baker {i+1}', 'available': i < bakers_free}
                    for i in range(settings.num_bakers)
                ],
                'equipment': [
                    {'name': f'Oven {i+1}', 'available': i < ovens_free}
                    for i in range(settings.num_ovens)
                ] + [
                    {'name': f'Mixer {i+1}', 'available': i < mixers_free}
                    for i in range(settings.num_mixers)
                ]
            }

        except Exception as e:
            logger.error(f"Error getting resource availability: {str(e)}")
            raise