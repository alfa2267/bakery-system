import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { bakeryApi } from '../api/bakeryApi';
import Select, { MultiValue, ActionMeta } from 'react-select';
import { 
  ScheduledTask,
  Order,
  extendGanttViewModes, 
  FrappeViewMode,
  PRODUCTION_STEPS, 
  STEP_COLORS,
  TaskStatus,
  GanttTask,
  ProductionStep,
  GroupingMode,
  GanttViewProps
} from '../types';
import Gantt from 'frappe-gantt';
import '../../node_modules/frappe-gantt/dist/frappe-gantt.css';
import { Alert } from '../ui/Alert';
import GanttErrorBoundary from './GanttErrorBoundary';

// Separate GanttChart component that receives props
const GanttChart: React.FC<GanttViewProps> = ({ 
  tasks, 
  orders,
  viewMode, 
  filteredSteps, 
  groupingMode,
  onDateChange, 
  onProgressChange 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<any>(null);

  const transformToGanttTasks = useCallback((tasks: ScheduledTask[], orders: Order[]): GanttTask[] => {
    // If tasks is empty, return placeholder tasks for all filtered steps
    if (tasks.length === 0) {
      return Array.from(filteredSteps).map((step) => ({
        id: 0,
        name: `Placeholder ${step}`,
        start: new Date().toISOString(),
        end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        progress: 0,
        dependencies: '',
        custom_class: `step-${step}`,
        y: 0,
        _data: { 
          originalTask: {
            id: 0,
            orderId: 0,
            step,
            startTime: new Date(),
            endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
            resources: [],
            batchSize: 0,
            dependencies: '',
            status: 'pending' as TaskStatus,
          },
          groupName: step
        }
      }));
    }

    // Filter tasks by filtered steps
    const filteredTasks = tasks.filter(task => filteredSteps.has(task.step));
    
    // Create a map of orders for quick lookup
    const orderMap = orders.reduce<Record<string, Order>>((acc, order) => {
      acc[order.id] = order;
      return acc;
    }, {});

    if (groupingMode === 'product') {
      // Group tasks by product
      const productGroups = filteredTasks.reduce<Record<string, ScheduledTask[]>>((acc, task) => {
        const productName = task.product?.name || 'Unnamed Product';
        if (!acc[productName]) {
          acc[productName] = [];
        }
        acc[productName].push(task);
        return acc;
      }, {});

      return Object.entries(productGroups).map(([productName, productTasks]) => {
        const earliestStart = new Date(Math.min(...productTasks.map(t => new Date(t.startTime).getTime())));
        const latestEnd = new Date(Math.max(...productTasks.map(t => new Date(t.endTime).getTime())));
        const pid = Number(productTasks.map(t => t.id));
        
        const totalProgress = productTasks.reduce((sum, task) => {
          const taskProgress = task.status === 'completed' ? 100 : 
                             task.status === 'in-progress' ? 50 : 0;
          return sum + taskProgress;
        }, 0);
        const avgProgress = totalProgress / productTasks.length;

        const allDependencies = productTasks
          .flatMap(task => task.dependencies ? [task.dependencies] : [])
          .filter((dep, index, self) => self.indexOf(dep) === index)
          .join(',');

        const stepDetails = productTasks
          .map(task => `${task.step} (${task.batchSize})`)
          .join(', ');

        const representativeTask = productTasks[0];
        const order = orderMap[representativeTask.orderId];

        return {
          id: pid,
          name: order 
            ? `${productName} (${order.customerName}) - ${stepDetails}`
            : `${productName}: ${stepDetails}`,
          start: earliestStart.toISOString(),
          end: latestEnd.toISOString(),
          progress: avgProgress,
          dependencies: allDependencies,
          custom_class: productTasks.map(task => `step-${task.step}`).join(' '),
          y: 0,
          _data: { 
            originalTask: representativeTask,
            groupName: productName
          }
        };
      });
    } else {
      // Group tasks by step
      const stepGroups = filteredTasks.reduce<Record<ProductionStep, ScheduledTask[]>>((acc, task) => {
        if (!acc[task.step]) {
          acc[task.step] = [];
        }
        acc[task.step].push(task);
        return acc;
      }, {} as Record<ProductionStep, ScheduledTask[]>);

      return Object.entries(stepGroups).map(([step, stepTasks]) => {

        const earliestStart = new Date(Math.min(...stepTasks.map(t => new Date(t.startTime).getTime())));
        const latestEnd = new Date(Math.max(...stepTasks.map(t => new Date(t.endTime).getTime())));
        
        const totalProgress = stepTasks.reduce((sum, task) => {
          const taskProgress = task.status === 'completed' ? 100 : 
                             task.status === 'in-progress' ? 50 : 0;
          return sum + taskProgress;
        }, 0);
        const avgProgress = totalProgress / stepTasks.length;

        const allDependencies = stepTasks
          .flatMap(task => task.dependencies ? [task.dependencies] : [])
          .filter((dep, index, self) => self.indexOf(dep) === index)
          .join(',');

        const productDetails = stepTasks
          .map(task => {
            const order = orderMap[task.orderId];
            return `${task.product?.name || 'Unnamed'} (${order?.customerName || 'N/A'}, ${task.batchSize})`;
          })
          .join(', ');

        const representativeTask = stepTasks[0];

        return {
          id: representativeTask.id ,
          name: `${step}: ${productDetails}`,
          start: earliestStart.toISOString(),
          end: latestEnd.toISOString(),
          progress: avgProgress,
          dependencies: allDependencies,
          custom_class: `step-${step}`,
          y: 0,
          _data: { 
            originalTask: representativeTask,
            groupName: step as ProductionStep
          }
        };
      });
    }
  }, [filteredSteps, groupingMode]);

  const ganttTasks = useMemo(() => 
    transformToGanttTasks(tasks, orders), 
    [tasks, orders, transformToGanttTasks]
  );

  useEffect(() => {
    if (!containerRef.current || !ganttTasks || ganttTasks.length === 0) return;

    // Clean up any existing chart
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Reset the gantt reference
    if (ganttRef.current?.events?.removeAllListeners) {
      try {
        ganttRef.current.events.removeAllListeners();
      } catch (error) {
        console.error('Error removing old event listeners:', error);
      }
    }
    ganttRef.current = null;

    // Initialize new chart
    try {
      if (!Gantt) {
        console.error('Frappe Gantt library not loaded');
        return;
      }

      const ExtendedGantt = extendGanttViewModes(Gantt);
      
      // Create new instance
      ganttRef.current = new ExtendedGantt(
      containerRef.current, 
      ganttTasks, 
      {
        view_mode: viewMode,
        custom_popup_html: (task: GanttTask) => {
          const originalTask = task._data.originalTask;
          return `
            <div class="details-container">
              <h3 class="font-bold text-sm mb-2">${task.name}</h3>
              <p>Status: ${originalTask.status}</p>
              <p>Start: ${new Date(task.start).toLocaleString()}</p>
              <p>End: ${new Date(task.end).toLocaleString()}</p>
              <p>Progress: ${task.progress}%</p>
            </div>
          `;
        }
      }
    );

    // Attach event listeners if the events object exists
    if (ganttRef.current && ganttRef.current.events) {
      // Date change event
      ganttRef.current.events.on('date_change', (task: GanttTask, start: Date, end: Date) => {
        if (onDateChange && task._data?.originalTask) {
          onDateChange(task._data.originalTask, start, end);
        }
      });

      // Progress change event
      ganttRef.current.events.on('progress_change', (task: GanttTask, progress: number) => {
        if (onProgressChange && task._data?.originalTask) {
          onProgressChange(task._data.originalTask, progress);
        }
      });
    } else {
      console.warn('Gantt events object not initialized properly');
    }

    // Cleanup function
    return () => {
      if (ganttRef.current?.events?.removeAllListeners) {
        try {
          ganttRef.current.events.removeAllListeners();
        } catch (error) {
          console.error('Error removing Gantt event listeners:', error);
        }
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      ganttRef.current = null;
    };
    } catch (error) {
      console.error('Error initializing Gantt chart:', error);
    }
  }, [ganttTasks, viewMode, onDateChange, onProgressChange]);

  useEffect(() => {
    if (ganttRef.current) {
      ganttRef.current.change_view_mode(viewMode);
    }
  }, [viewMode]);

  return (
    <div ref={containerRef} className="h-full w-full relative">
      {/* Frappe Gantt will be initialized here */}
    </div>
  );
};

// Main GanttView component that manages state
const GanttView: React.FC<GanttViewProps> = ({ 
  tasks,
  orders,
  viewMode,
  filteredSteps,
  groupingMode,
  onDateChange,
  onProgressChange
}) => {
  return (
    <div className="flex-1 overflow-hidden relative">
      <div className="absolute inset-0">
        <GanttErrorBoundary>
          <GanttChart
          tasks={tasks}
          orders={orders}
          viewMode={viewMode}
          filteredSteps={filteredSteps}
          groupingMode={groupingMode}
          onDateChange={onDateChange}
          onProgressChange={onProgressChange}
        />
        </GanttErrorBoundary>
      </div>
    </div>
  );
};

export default GanttView;