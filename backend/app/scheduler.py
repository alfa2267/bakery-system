import numpy as np
from typing import List, Dict, Set, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import heapq
import random
from collections import defaultdict
import math
import bisect

# Constants for optimization
MAX_GENERATIONS = 100
POPULATION_SIZE = 5  # μ-GA uses small population
CROSSOVER_RATE = 1.0  # μ-GA uses 100% crossover 
MUTATION_RATE = 0.0   # μ-GA omits mutation
CONVERGENCE_THRESHOLD = 0.05  # 5% convergence threshold

@dataclass
class ScheduledTask:
    orderId: str 
    step: str
    startTime: datetime
    endTime: datetime
    resources: List[str]
    batchSize: int
    status: str = 'pending'

    @property
    def duration(self) -> int:
        return int((self.endTime - self.startTime).total_seconds() / 60)

@dataclass
class OptimizationState:
    """Tracks the state of optimization across generations"""
    best_fitness: float = float('-inf')
    generations_without_improvement: int = 0
    convergence_count: int = 0
    elite_solution: Optional[List[ScheduledTask]] = None

class BakeryScheduler:
    """Enhanced scheduler using micro-genetic algorithm with P-systems"""
    def __init__(self, recipes: List[Recipe], max_look_ahead_days: int = 7):
        self.recipes = {r.productType: r for r in recipes}
        self.max_look_ahead_days = max_look_ahead_days
        self.resource_cache = defaultdict(set)
        
        # Optimization parameters
        self.population_size = 128
        self.max_iterations = 50
        self.mutation_rate = 0.2
        self.crossover_rate = 0.8
        self.local_search_iters = 20
        
        # Caching and memory management
        self._setup_caches()
        
    def _setup_caches(self):
        """Initialize optimization caches"""
        self.dependency_cache = {}
        self.resource_usage_cache = defaultdict(dict)
        self.batch_size_cache = {}
        self.critical_path_cache = {}
        
    def _initialize_population(self, orders: List[Order], recipe: Recipe) -> List[List[ScheduledTask]]:
        """Initialize population using heuristic-based generation"""
        population = []
        for _ in range(POPULATION_SIZE):
            # Generate schedule with randomized priorities but guided by heuristics
            schedule = self._generate_heuristic_schedule(orders, recipe)
            population.append(schedule)
        return population

    def _generate_heuristic_schedule(self, orders: List[Order], recipe: Recipe) -> List[ScheduledTask]:
        """Generate a single schedule using priority-based heuristics"""
        tasks = []
        resource_timeline = defaultdict(list)  # Track resource usage intervals
        
        # Sort orders by due date and priority
        sorted_orders = sorted(orders, key=lambda o: (o.delivery_date, o.delivery_slot))
        
        for order in sorted_orders:
            # Calculate earliest possible start times considering dependencies
            start_times = self._calculate_earliest_starts(order, recipe, resource_timeline)
            
            # Schedule each step of the recipe
            for step_idx, step in enumerate(recipe.steps):
                # Find available time slot
                start_time = self._find_next_available_slot(
                    start_times[step_idx],
                    step.duration,
                    step.resources,
                    resource_timeline
                )
                
                task = ScheduledTask(
                    orderId=order.id,
                    step=step.name,
                    startTime=start_time,
                    endTime=start_time + timedelta(minutes=step.duration),
                    resources=step.resources,
                    batchSize=order.items[0].quantity,  # Simplified for example
                    status='pending'
                )
                
                # Update resource timeline
                for resource in step.resources:
                    bisect.insort(resource_timeline[resource], (start_time, task.endTime))
                
                tasks.append(task)
                
        return tasks

    @dataclass
class PartialOrderInfo:
    """Tracks partial ordering information between tasks"""
    before: Set[str] = field(default_factory=set)  # Tasks that must come before 
    after: Set[str] = field(default_factory=set)   # Tasks that must come after
    concurrent: Set[str] = field(default_factory=set)  # Tasks that can run concurrently

class BakeryScheduler:
    def _check_dependencies(self, task1: ScheduledTask, task2: ScheduledTask) -> bool:
        """Check if two tasks have dependencies requiring ordering"""
        # Resource conflicts require ordering
        if set(task1.resources) & set(task2.resources):
            return True
            
        # Same order dependencies require ordering
        if task1.orderId == task2.orderId:
            return True
            
        # Recipe-specific dependencies require ordering 
        recipe = self.recipes.get(task1.step.split('_')[0])
        if recipe and recipe.steps:
            task1_idx = next((i for i,s in enumerate(recipe.steps) if s.name == task1.step), -1)
            task2_idx = next((i for i,s in enumerate(recipe.steps) if s.name == task2.step), -1)
            if task1_idx >= 0 and task2_idx >= 0 and task1_idx < task2_idx:
                return True
                
        return False

    def _build_partial_order(self, tasks: List[ScheduledTask]) -> Dict[str, PartialOrderInfo]:
        """Build partial order relations between tasks"""
        order_info = defaultdict(PartialOrderInfo)
        
        for i, task1 in enumerate(tasks):
            for task2 in tasks[i+1:]:
                if self._check_dependencies(task1, task2):
                    # Add ordering constraints
                    order_info[task1.orderId].after.add(task2.orderId)
                    order_info[task2.orderId].before.add(task1.orderId)
                else:
                    # Tasks can run concurrently
                    order_info[task1.orderId].concurrent.add(task2.orderId)
                    order_info[task2.orderId].concurrent.add(task1.orderId)
                    
        return order_info

    def _calculate_ets_score(self, schedule: List[ScheduledTask]) -> float:
        """Calculate equitable threat score with numpy vectorization"""
        if not self._is_feasible(schedule):
            return float('-inf')
            
        thresholds = np.array([10, 20, 30, 40, 50, 60])
        durations = np.array([task.duration for task in schedule])
        optimal_timings = np.array([self._is_optimal_timing(task) for task in schedule])
        
        total_ets = 0
        for threshold in thresholds:
            pred_pos = durations >= threshold
            true_pos = optimal_timings
            
            hits = np.sum(pred_pos & true_pos)
            misses = np.sum(~pred_pos & true_pos) 
            false_alarms = np.sum(pred_pos & ~true_pos)
            
            # Calculate ETS score
            total = len(schedule)
            chance = ((hits + misses) * (hits + false_alarms)) / total
            if hits + misses + false_alarms - chance > 0:
                ets = (hits - chance) / (hits + misses + false_alarms - chance)
                total_ets += ets
                
        return total_ets / len(thresholds)

    def _identify_critical_path(self, tasks: List[ScheduledTask]) -> List[ScheduledTask]:
        """Identifies critical path using improved dynamic programming approach"""
        # Check cache first
        cache_key = tuple((t.orderId, t.startTime, t.endTime) for t in sorted(tasks, key=lambda x: x.startTime))
        if cache_key in self.critical_path_cache:
            return self.critical_path_cache[cache_key]
            
        # Build dependency graph using numpy for efficiency
        n = len(tasks)
        dep_matrix = np.zeros((n, n), dtype=bool)
        task_indices = {task: i for i, task in enumerate(tasks)}
        
        for i, task1 in enumerate(tasks):
            for j, task2 in enumerate(tasks[i+1:], i+1):
                if task2.startTime >= task1.endTime and (
                    task2.orderId == task1.orderId or 
                    set(task2.resources) & set(task1.resources)
                ):
                    dep_matrix[i,j] = True
                    
        # Find longest path using vectorized operations
        distances = np.zeros(n)
        for i in reversed(range(n)):
            successors = np.where(dep_matrix[i])[0]
            if len(successors) > 0:
                distances[i] = tasks[i].duration + np.max(distances[successors])
            else:
                distances[i] = tasks[i].duration
                
        # Reconstruct critical path
        critical_path = []
        curr_idx = np.argmax(distances)
        while curr_idx is not None:
            critical_path.append(tasks[curr_idx])
            successors = np.where(dep_matrix[curr_idx])[0]
            curr_idx = successors[np.argmax(distances[successors])] if len(successors) > 0 else None
            
        # Cache result
        self.critical_path_cache[cache_key] = critical_path
        return critical_path

    def _schedule_batch(self, orders: List[Order], recipe: Recipe) -> List[ScheduledTask]:
        """Schedule a batch using hybrid optimization"""
        # Generate initial population
        population = self._generate_initial_population(orders, recipe)
        
        best_schedule = None
        best_score = float('-inf')
        
        for iteration in range(self.max_iterations):
            # Apply genetic operators
            new_population = []
            elite = sorted(population, key=self._calculate_ets_score)[-2:]
            
            while len(new_population) < self.population_size:
                if random.random() < self.crossover_rate:
                    parent1, parent2 = self._tournament_select(population)
                    child1, child2 = self._crossover(parent1, parent2)
                    
                    if random.random() < self.mutation_rate:
                        child1 = self._mutate(child1)
                    if random.random() < self.mutation_rate:
                        child2 = self._mutate(child2)
                        
                    new_population.extend([child1, child2])
                    
            # Add elite solutions
            new_population.extend(elite)
            
            # Local search on best solution
            best_candidate = max(new_population, key=self._calculate_ets_score)
            improved = self._local_search(best_candidate)
            
            score = self._calculate_ets_score(improved)
            if score > best_score:
                best_score = score
                best_schedule = improved
                
            population = new_population
            
        return best_schedule

    def _local_search(self, schedule: List[ScheduledTask]) -> List[ScheduledTask]:
        """Local search with tabu elements"""
        current = schedule
        tabu_list = set()
        
        for _ in range(self.local_search_iters):
            # Get neighborhood excluding tabu moves
            neighbors = self._get_neighbors(current)
            valid_neighbors = [n for n in neighbors if self._get_move_hash(n) not in tabu_list]
            
            if not valid_neighbors:
                continue
                
            # Select best non-tabu neighbor
            best_neighbor = max(valid_neighbors, key=self._calculate_ets_score)
            move_hash = self._get_move_hash(best_neighbor)
            
            # Update tabu list
            tabu_list.add(move_hash)
            if len(tabu_list) > 10:  # Keep tabu list size bounded
                tabu_list.pop()
                
            current = best_neighbor
            
        return current

    def _get_move_hash(self, schedule: List[ScheduledTask]) -> int:
        """Generate hash for tabu list"""
        return hash(tuple((t.orderId, t.startTime, t.endTime) for t in schedule))

    def _is_feasible(self, schedule: List[ScheduledTask]) -> bool:
        """Check schedule feasibility with caching"""
        # Check resource conflicts using vectorized operations
        resources = defaultdict(list)
        for task in schedule:
            for resource in task.resources:
                resources[resource].append((task.startTime, task.endTime))
                
        for resource, intervals in resources.items():
            if resource in self.resource_usage_cache:
                cached = self.resource_usage_cache[resource]
                if any(i1[1] > i2[0] for i1, i2 in zip(intervals[:-1], intervals[1:])):
                    return False
            else:
                # Cache resource usage pattern
                self.resource_usage_cache[resource] = sorted(intervals)
                
        # Check precedence constraints
        for order_id in {task.orderId for task in schedule}:
            if order_id in self.dependency_cache:
                continue
                
            order_tasks = sorted(
                [t for t in schedule if t.orderId == order_id],
                key=lambda t: t.startTime
            )
            
            recipe = self.recipes[order_tasks[0].step.split('_')[0]]
            expected_steps = [s.name for s in recipe.steps]
            actual_steps = [t.step.split('_')[1] for t in order_tasks]
            
            if actual_steps != expected_steps:
                return False
                
            # Cache valid dependency chain
            self.dependency_cache[order_id] = True
            
        return True

    def schedule_orders(self, orders: List[Order]) -> List[ScheduledTask]:
        """Main scheduling function"""
        sorted_orders = sorted(orders, key=lambda o: (o.delivery_date, o.delivery_slot))
        all_tasks = []
        
        # Clear caches
        self._setup_caches()
        
        # Group orders optimally for batching
        order_batches = self._group_orders_for_batching(sorted_orders)
        
        # Schedule each batch
        for product_type, batch_orders in order_batches.items():
            recipe = self.recipes[product_type]
            batch_tasks = self._schedule_batch(batch_orders, recipe)
            all_tasks.extend(batch_tasks)
            
        return sorted(all_tasks, key=lambda t: t.startTime)
