from datetime import datetime, timedelta
from typing import List, Dict, Optional, Set, Tuple
from collections import defaultdict
from pydantic import BaseModel, Field
import heapq

class BakeryScheduler:
    def __init__(self, recipes: List[Recipe], max_look_ahead_days: int = 7):
        self.recipes = {r.productType: r for r in recipes}
        self.max_look_ahead_days = max_look_ahead_days
        self.resource_cache: Dict[str, Set[datetime]] = defaultdict(set)

    def schedule_orders(self, orders: List[Order]) -> List[ScheduledTask]:
        """
        Main scheduling function that creates an optimized production schedule
        """
        # Sort orders by delivery date/time
        sorted_orders = sorted(orders, 
                             key=lambda o: (o.delivery_date, o.delivery_slot))

        all_tasks = []
        self.resource_cache.clear()

        # Group orders by product type for batching
        order_batches = self._group_orders_for_batching(sorted_orders)

        # Schedule each batch
        for product_type, batch_orders in order_batches.items():
            recipe = self.recipes[product_type]
            batch_tasks = self._schedule_batch(batch_orders, recipe)
            all_tasks.extend(batch_tasks)

        # Sort final schedule by start time
        return sorted(all_tasks, key=lambda t: t.startTime)

    def _group_orders_for_batching(self, orders: List[Order]) -> Dict[str, List[Order]]:
        """Groups orders by product type that can be batched together"""
        order_groups = defaultdict(list)
        
        for order in orders:
            for item in order.items:
                order_groups[item.product].append(order)
                
        return order_groups

    def _schedule_batch(self, orders: List[Order], recipe: Recipe) -> List[ScheduledTask]:
        """Schedules a batch of orders for the same product type"""
        tasks = []
        total_quantity = sum(sum(item.quantity for item in order.items) for order in orders)
        
        # Calculate optimal batch sizes
        batch_sizes = self._calculate_batch_sizes(total_quantity, recipe)
        
        for batch_size in batch_sizes:
            batch_tasks = self._schedule_single_batch(orders, recipe, batch_size)
            tasks.extend(batch_tasks)
            
        return tasks

    def _calculate_batch_sizes(self, total_quantity: int, recipe: Recipe) -> List[int]:
        """Calculates optimal batch sizes given total quantity and recipe constraints"""
        batch_sizes = []
        remaining = total_quantity

        while remaining > 0:
            if remaining >= recipe.maxBatchSize:
                batch_sizes.append(recipe.maxBatchSize)
                remaining -= recipe.maxBatchSize
            else:
                if remaining >= recipe.minBatchSize:
                    batch_sizes.append(remaining)
                    remaining = 0
                else:
                    # If remaining is less than minBatchSize, add to last batch or create min batch
                    if batch_sizes:
                        batch_sizes[-1] += remaining
                    else:
                        batch_sizes.append(recipe.minBatchSize)
                    remaining = 0

        return batch_sizes

    def _schedule_single_batch(self, orders: List[Order], recipe: Recipe, batch_size: int) -> List[ScheduledTask]:
        """Schedules a single batch of production"""
        tasks = []
        latest_delivery = max(datetime.fromisoformat(order.delivery_date) for order in orders)
        
        # Calculate backward from delivery time
        current_end_time = latest_delivery
        last_task = None
        
        # Schedule steps in reverse order
        for step in reversed(recipe.steps):
            # Calculate duration with scaling factor
            duration_mins = int(step.duration * step.scalingFactor * (batch_size / recipe.maxBatchSize))
            
            # Find suitable start time considering resource constraints
            if step.mustFollowImmediately and last_task:
                start_time = last_task.startTime - timedelta(minutes=duration_mins)
            else:
                start_time = self._find_latest_available_slot(
                    step,
                    current_end_time - timedelta(minutes=duration_mins),
                    current_end_time,
                    orders[0].id
                )

            # Create scheduled task
            task = ScheduledTask(
                orderId=orders[0].id,  # Use first order as reference
                step=step.name,
                startTime=start_time,
                endTime=start_time + timedelta(minutes=duration_mins),
                resources=self._get_required_resources(step),
                batchSize=batch_size,
                status='pending'
            )
            
            # Update resource cache
            self._update_resource_cache(task)
            
            tasks.append(task)
            current_end_time = start_time
            last_task = task

        return tasks

    def _find_latest_available_slot(
        self, 
        step: ProductionStep, 
        start_time: datetime,
        end_time: datetime,
        order_id: str
    ) -> datetime:
        """Finds the latest available time slot for a step"""
        required_resources = self._get_required_resources(step)
        current_time = start_time
        
        while current_time < end_time:
            conflicts = False
            for resource in required_resources:
                # Check resource cache for conflicts
                resource_times = self.resource_cache[resource]
                task_times = set(t for t in range(
                    int(current_time.timestamp()),
                    int((current_time + timedelta(minutes=step.duration)).timestamp()),
                    60
                ))
                
                if resource_times & task_times:
                    conflicts = True
                    break
            
            if not conflicts:
                return current_time
                
            current_time += timedelta(minutes=1)
        
        return current_time

    def _get_required_resources(self, step: ProductionStep) -> List[str]:
        """Returns list of required resources for a step"""
        resources = []
        if step.requiresOven:
            resources.append('oven')
        if step.requiresMixer:
            resources.append('mixer')
        if step.requiresHuman:
            resources.append('worker')
        return resources

    def _update_resource_cache(self, task: ScheduledTask):
        """Updates resource cache with newly scheduled task times"""
        task_times = set(t for t in range(
            int(task.startTime.timestamp()),
            int(task.endTime.timestamp()),
            60
        ))
        
        for resource in task.resources:
            self.resource_cache[resource].update(task_times)

    def get_daily_summary(self, tasks: List[ScheduledTask], date: datetime) -> DailyScheduleSummary:
        """Generates summary of scheduled tasks for a specific date"""
        # Filter tasks for given date
        day_start = datetime.combine(date, datetime.min.time())
        day_end = datetime.combine(date, datetime.max.time())
        
        day_tasks = [t for t in tasks if day_start <= t.startTime <= day_end]
        
        if not day_tasks:
            return DailyScheduleSummary(
                date=date.isoformat(),
                total_orders=0,
                total_tasks=0,
                resource_utilization=[],
                start_time=None,
                end_time=None
            )

        # Calculate resource utilization
        resource_usage = defaultdict(int)
        for task in day_tasks:
            duration = task.duration
            for resource in task.resources:
                resource_usage[resource] += duration

        # Create utilization stats
        total_minutes = (day_end - day_start).total_seconds() / 60
        resource_utilization = [
            ResourceUtilization(
                resource=resource,
                utilization_percentage=(minutes / total_minutes) * 100,
                busy_minutes=minutes,
                total_minutes=int(total_minutes)
            )
            for resource, minutes in resource_usage.items()
        ]

        return DailyScheduleSummary(
            date=date.isoformat(),
            total_orders=len(set(t.orderId for t in day_tasks)),
            total_tasks=len(day_tasks),
            resource_utilization=resource_utilization,
            start_time=min(t.startTime for t in day_tasks),
            end_time=max(t.endTime for t in day_tasks)
        )
