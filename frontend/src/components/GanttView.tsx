import React, { useState, useEffect, useRef, useCallback } from 'react';
import { bakeryApi } from '../api/bakeryApi';
import Select, { ActionMeta, MultiValue } from 'react-select';
import { 
  ChevronLeft, 
  ChevronRight, 
  BarChart2
} from 'lucide-react';
import { Alert } from '../ui/Alert';
import Gantt from 'frappe-gantt';
import '../../node_modules/frappe-gantt/dist/frappe-gantt.css';
import { 
  ScheduledTask,
  extendGanttViewModes, 
  FrappeViewMode,
  PRODUCTION_STEPS, 
  STEP_COLORS,
  TaskStatus,
  GanttTask,
  BaseTask,
  GANTT_CONFIG,
  isGanttTask,
  GanttChartProps,
  ProductionStep
} from '../types/index';

type GroupingMode = 'step' | 'product';

interface ExtendedGanttChartProps extends GanttChartProps {
  groupingMode: GroupingMode;
}

// Define StepOption interface for Select component
interface StepOption {
  value: ProductionStep;
  label: string;
}

const GanttChart: React.FC<ExtendedGanttChartProps> = ({ 
  tasks, 
  viewMode, 
  filteredSteps, 
  groupingMode,
  onTasksUpdate, 
  onDateChange, 
  onProgressChange 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<any>(null);

  const transformToGanttTasks = useCallback((tasks: ScheduledTask[]): GanttTask[] => {
    // If tasks is empty, return placeholder tasks for all filtered steps
    if (tasks.length === 0) {
      return PRODUCTION_STEPS
        .filter(step => filteredSteps.has(step))
        .map((step) => ({
          id: `placeholder-${step}`,
          name: `Placeholder ${step}`,
          start: new Date().toISOString(),
          end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          progress: 0,
          dependencies: '',
          custom_class: `step-${step}`,
          y: 0,
          _data: { 
            originalTask: {
              id: `placeholder-${step}`,
              orderId: 'placeholder',
              step,
              startTime: new Date(),
              endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
              resources: [],
              batchSize: 0,
              dependencies: '',
              status: 'pending' as const,
            },
            groupName: step
          }
        }));
    }

    // Filter tasks by filtered steps
    const filteredTasks = tasks.filter(task => filteredSteps.has(task.step));
    
    // If no tasks match the filtered steps, return an empty array
    if (filteredTasks.length === 0) {
      return [];
    }

    if (groupingMode === 'product') {
      // Group tasks by product
      const productGroups = filteredTasks.reduce((acc, task) => {
        const productName = task.product?.name || 'Unnamed Product';
        if (!acc[productName]) {
          acc[productName] = [];
        }
        acc[productName].push(task);
        return acc;
      }, {} as Record<string, ScheduledTask[]>);

      return Object.entries(productGroups).map(([productName, productTasks]) => {
        // Combine all tasks for this product
        const earliestStart = new Date(Math.min(...productTasks.map(t => new Date(t.startTime).getTime())));
        const latestEnd = new Date(Math.max(...productTasks.map(t => new Date(t.endTime).getTime())));
        
        // Calculate overall progress
        const totalProgress = productTasks.reduce((sum, task) => {
          const taskProgress = task.status === 'completed' ? 100 : 
                               task.status === 'in-progress' ? 50 : 0;
          return sum + taskProgress;
        }, 0);
        const avgProgress = totalProgress / productTasks.length;

        // Combine dependencies
        const allDependencies = productTasks
          .flatMap(task => Array.isArray(task.dependencies) ? task.dependencies : [])
          .filter((dep, index, self) => self.indexOf(dep) === index)
          .join(',');

        // Collect all steps and batch sizes
        const stepDetails = productTasks
          .map(task => `${task.step} (${task.batchSize})`)
          .join(', ');

        // Use the first task as the original task for type compatibility
        const representativeTask = productTasks[0];

        return {
          id: `product-${productName}`,
          name: `${productName}: ${stepDetails}`,
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
      const stepGroups = filteredTasks.reduce((acc, task) => {
        if (!acc[task.step]) {
          acc[task.step] = [];
        }
        acc[task.step].push(task);
        return acc;
      }, {} as Record<ProductionStep, ScheduledTask[]>);

      return Object.entries(stepGroups).map(([step, stepTasks]) => {
        // Combine all tasks for this step
        const earliestStart = new Date(Math.min(...stepTasks.map(t => new Date(t.startTime).getTime())));
        const latestEnd = new Date(Math.max(...stepTasks.map(t => new Date(t.endTime).getTime())));
        
        // Calculate overall progress
        const totalProgress = stepTasks.reduce((sum, task) => {
          const taskProgress = task.status === 'completed' ? 100 : 
                               task.status === 'in-progress' ? 50 : 0;
          return sum + taskProgress;
        }, 0);
        const avgProgress = totalProgress / stepTasks.length;

        // Combine dependencies
        const allDependencies = stepTasks
          .flatMap(task => Array.isArray(task.dependencies) ? task.dependencies : [])
          .filter((dep, index, self) => self.indexOf(dep) === index)
          .join(',');

        // Collect all product names and batch sizes
        const productDetails = stepTasks
          .map(task => `${task.product?.name || 'Unnamed'} (${task.batchSize})`)
          .join(', ');

        // Use the first task as the original task for type compatibility
        const representativeTask = stepTasks[0];

        return {
          id: `step-${step}`,
          name: `${step}: ${productDetails}`,
          start: earliestStart.toISOString(),
          end: latestEnd.toISOString(),
          progress: avgProgress,
          dependencies: allDependencies,
          custom_class: `step-${step}`,
          y: 0,
          _data: { 
            originalTask: representativeTask,
            groupName: step
          }
        };
      });
    }
  }, [filteredSteps, groupingMode]);

  useEffect(() => {
    if (!containerRef.current || tasks.length === 0) return;

    containerRef.current.innerHTML = '';

    const ExtendedGantt = extendGanttViewModes(Gantt);

    const wrapper = document.createElement('div');
    wrapper.className = 'gantt-wrapper flex w-full h-full';
    containerRef.current.appendChild(wrapper);

    const sidebar = document.createElement('div');
    sidebar.className = 'sticky left-0 z-10 w-48 bg-white border-r shadow-sm overflow-hidden';
    
    const sidebarHeader = document.createElement('div');
    sidebarHeader.className = `border-b flex items-center justify-center px-4 font-medium text-gray-700 bg-gray-50`;

    const ganttContainer = document.createElement('div');
    ganttContainer.className = 'gantt-container flex-1 overflow-x-auto';

    const style = document.createElement('style');
    style.textContent = `
      .gantt-wrapper {
        height: 100%;
        position: relative;
      }
      .gantt-wrapper .sidebar-content {
        height: calc(100% - ${GANTT_CONFIG.headerHeight}px);
        overflow-y: auto;
      }
      .gantt .grid-header {
        fill: ${GANTT_CONFIG.colors.gridBackground};
        height: ${GANTT_CONFIG.headerHeight}px;
      }
      .gantt .grid-row {
        height: ${GANTT_CONFIG.rowHeight}px;
      }
      .gantt .lower-text, .gantt .upper-text {
        font-size: 12px;
        font-weight: 500;
      }
      .gantt .bar-wrapper:hover .bar {
        fill: ${GANTT_CONFIG.colors.barHover};
      }
      .gantt .bar {
        transition: fill 0.3s ease;
      }
      .gantt .bar-label {
        fill: white;
        font-size: 12px;
        font-weight: 500;
      }
      .gantt-container {
        height: 100%;
        overflow: auto;
      }
      .timeline-body {
        overflow-x: auto !important;
      }
      .grid-body {
        overflow-x: hidden !important;
      }
      .details-container {
        background: white;
        padding: 12px;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        font-size: 12px;
      }
      ${PRODUCTION_STEPS.map(step => {
        const stepColor = STEP_COLORS[step].replace('bg-', '');
        const colorMap: Record<string, string> = {
          'blue-500': '#3B82F6',
          'green-500': '#22C55E',
          'yellow-500': '#EAB308',
          'red-500': '#EF4444',
          'purple-500': '#A855F7',
          'pink-500': '#EC4899',
          'indigo-500': '#6366F1',
        };
        const color = colorMap[stepColor] || '#3B82F6';
        return `
          .gantt .bar-wrapper.step-${step} .bar {
            fill: ${color};
          }
          .gantt .bar-wrapper.step-${step} .bar-progress {
            fill: ${color}cc;
          }
          .gantt .bar-wrapper.step-${step}:hover .bar {
            fill: ${color}dd;
          }
        `;
      }).join('\n')}
    `;
    document.head.appendChild(style);

    // Rest of the existing code...

    return () => {
      style.remove();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [tasks, viewMode, filteredSteps, groupingMode, onDateChange, onProgressChange, transformToGanttTasks]);

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

const GanttView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentView, setCurrentView] = useState<FrappeViewMode>('Day');
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('step');
  const [schedule, setSchedule] = useState<ScheduledTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResourceUtilization, setShowResourceUtilization] = useState(false);
  const [filteredSteps, setFilteredSteps] = useState<Set<ProductionStep>>(new Set(PRODUCTION_STEPS));
  const [utilization, setUtilization] = useState<any>(null);
  

  const stepOptions: StepOption[] = PRODUCTION_STEPS.map(step => ({
    value: step,
    label: step.charAt(0).toUpperCase() + step.slice(1),
  }));

  const handleStepFilterChange = (
    selectedOptions: MultiValue<StepOption>,
    actionMeta: ActionMeta<StepOption>
  ) => {
    const selectedSteps = new Set<ProductionStep>(
      selectedOptions ? selectedOptions.map((option) => option.value) : []
    );
    setFilteredSteps(selectedSteps);
  };

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await bakeryApi.getSchedules(true);
        if (response && response.schedule) {
          setSchedule(response.schedule);
          if (response.summary) {
            setUtilization(response.summary.resource_utilization);
          }
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load schedule');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const handleDateChange = async (task: ScheduledTask, start: Date, end: Date) => {
    try {
      await bakeryApi.updateTaskTiming(task.id, start, end);
      const response = await bakeryApi.getSchedule(selectedDate, true);
      if (response && response.schedule) {
        setSchedule(response.schedule);
      }
    } catch (error) {
      setError('Failed to update task timing');
    }
  };

  const handleProgressChange = async (task: ScheduledTask, progress: number) => {
    try {
      const status = progress === 100 ? 'completed' as TaskStatus : 
                     progress > 0 ? 'in-progress' as TaskStatus : 
                     'pending' as TaskStatus;
      await bakeryApi.updateTaskStatus(task.id, status);
      const response = await bakeryApi.getSchedule(selectedDate, true);
      if (response && response.schedule) {
        setSchedule(response.schedule);
      }
    } catch (error) {
      setError('Failed to update task status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) return (
    <Alert variant="error" title="Error">
      {error}
    </Alert>
  );


return (
  <div className="h-screen flex flex-col bg-gray-50">
    {/* Header */}
    <div className="bg-white border-b py-3">
      {/* Top Row - View Modes and Core Controls */}
      <div className="px-4 flex justify-between items-center mb-3">
        {/* View Mode Selector */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {(['Hour', 'Day', 'Week', 'Month', 'Quarter Day', 'Half Day'] as FrappeViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setCurrentView(mode)}
              className={`px-2.5 py-1 text-sm rounded-md transition-colors ${
                currentView === mode ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Core Controls */}
        <div className="flex items-center space-x-3">
          {/* Grouping Mode Selector */}
          <div className="flex items-center space-x-2">
            <select
              id="grouping-mode"
              value={groupingMode}
              onChange={(e) => setGroupingMode(e.target.value as GroupingMode)}
              className="px-2.5 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="step">Group by Step</option>
              <option value="product">Group by Product</option>
            </select>
          </div>

          {/* Resource Utilization Toggle */}
          <button
            onClick={() => setShowResourceUtilization(!showResourceUtilization)}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-sm ${
              showResourceUtilization ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Utilization</span>
          </button>
        </div>
      </div>

      {/* Bottom Row - Date and Filters */}
      <div className="px-4 flex justify-between items-start border-t pt-3">
        {/* Date Navigation */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => {
              const date = new Date(selectedDate);
              date.setDate(date.getDate() - 1);
              setSelectedDate(date.toISOString().split('T')[0]);
            }}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                const selectedElement = document.querySelector(`.date_${e.target.value.replace(/-/g, '-')}`);
                if (selectedElement) {
                  selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                }
              }}
              className="px-3 py-1.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            />
            <span className="text-xs text-gray-500 mt-0.5">
              {new Date(selectedDate).toLocaleDateString(undefined, { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
          <button 
            onClick={() => {
              const date = new Date(selectedDate);
              date.setDate(date.getDate() + 1);
              setSelectedDate(date.toISOString().split('T')[0]);
            }}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Step Filters */}
        <div className="w-2/3">
          <Select<StepOption, true>
            id="step-filter"
            isMulti
            options={stepOptions}
            value={stepOptions.filter(option => filteredSteps.has(option.value))}
            onChange={handleStepFilterChange}
            className="text-sm"
            classNamePrefix="react-select"
            placeholder="Filter steps..."
            isSearchable={false}
            styles={{
              container: (base) => ({
                ...base,
                zIndex: 999
              }),
              control: (base) => ({
                ...base,
                minHeight: '32px',
                zIndex: 999
              }),
              menu: (base) => ({
                ...base,
                zIndex: 999
              }),
              menuPortal: (base) => ({
                ...base,
                zIndex: 999
              }),
              // ... (existing styles remain the same)
            }}
          />
        </div>
      </div>
    </div>

    {/* Main Content */}
    <div className="flex-1 overflow-hidden relative">
      <div className="absolute inset-0">
        <GanttChart
          tasks={schedule}
          viewMode={currentView}
          filteredSteps={filteredSteps}
          groupingMode={groupingMode}
          onDateChange={handleDateChange}
          onProgressChange={handleProgressChange}
        />
      </div>
    </div>

    {/* Resource Utilization Modal */}
    {showResourceUtilization && utilization && (
      <div className="fixed top-4 right-4 bg-white rounded-lg shadow-xl p-6 w-96 z-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">Resource Utilization</h3>
          <button 
            onClick={() => setShowResourceUtilization(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4">
          {utilization.map((resource: any) => (
            <div key={resource.resource} className="flex flex-col">
              <div className="flex justify-between text-sm mb-1">
                <span>{resource.resource}</span>
                <span>{Math.round(resource.utilization_percentage)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div 
                  className={`rounded-full h-2.5 transition-all duration-300 ${
                    resource.utilization_percentage > 90 ? 'bg-red-500' :
                    resource.utilization_percentage > 70 ? 'bg-orange-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${resource.utilization_percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);
};

export default GanttView;