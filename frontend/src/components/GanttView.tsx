import React, { useState, useEffect, useRef, useCallback } from 'react';
import { bakeryApi } from '../api/bakeryApi';
import Select, { ActionMeta, MultiValue } from 'react-select';

import { 
  ChevronLeft, 
  ChevronRight, 
  BarChart2,
  LayersIcon
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
  GanttChartProps
} from '../types/index';

type GroupingMode = 'step' | 'product';

interface ExtendedGanttChartProps extends GanttChartProps {
  groupingMode: GroupingMode;
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
    if (tasks.length === 0) {
      return PRODUCTION_STEPS
        .filter(step => filteredSteps.has(step))
        .map(step => ({
          id: `placeholder-${step}`,
          name: `Placeholder ${step}`,
          start: new Date().toISOString(),
          end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          progress: 0,
          dependencies: '',
          custom_class: `step-${step}`,
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
              status: 'pending',
            } 
          }
        }));
    }

    const filteredTasks = tasks.filter(task => filteredSteps.has(task.step));

    if (groupingMode === 'product') {
      // Group by product first
      const tasksByProduct = new Map<string, ScheduledTask[]>();
      filteredTasks.forEach(task => {
        const productName = task.product?.name || 'Unnamed Product';
        if (!tasksByProduct.has(productName)) {
          tasksByProduct.set(productName, []);
        }
        tasksByProduct.get(productName)?.push(task);
      });

      // Convert to Gantt tasks maintaining product grouping
      return Array.from(tasksByProduct.entries()).flatMap(([productName, productTasks]) => {
        return productTasks.map(task => ({
          id: task.orderId + '-' + task.step,
          name: `${task.step} (${task.batchSize})`,
          start: new Date(task.startTime).toISOString(),
          end: new Date(task.endTime).toISOString(),
          progress: task.status === 'completed' ? 100 : 
                   task.status === 'in-progress' ? 50 : 0,
          dependencies: Array.isArray(task.dependencies) ? task.dependencies.join(',') : '',
          custom_class: `step-${task.step}`,
          _data: { 
            originalTask: task,
            groupName: productName
          }
        }));
      });
    } else {
      // Original step-based grouping
      return filteredTasks.map(task => ({
        id: task.orderId + '-' + task.step,
        name: `${task.product?.name || 'Unnamed'} (${task.batchSize})`,
        start: new Date(task.startTime).toISOString(),
        end: new Date(task.endTime).toISOString(),
        progress: task.status === 'completed' ? 100 : 
                 task.status === 'in-progress' ? 50 : 0,
        dependencies: Array.isArray(task.dependencies) ? task.dependencies.join(',') : '',
        custom_class: `step-${task.step}`,
        _data: { 
          originalTask: task,
          groupName: task.step
        }
      }));
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
    sidebarHeader.style.height = '88px'; // Matches combined height of upper and lower headers
    sidebarHeader.className = `border-b flex items-center justify-center px-4 font-medium text-gray-700 bg-gray-50`;
    sidebarHeader.textContent = groupingMode === 'product' ? 'Products' : 'Process Steps';
    sidebar.appendChild(sidebarHeader);

    const sidebarContent = document.createElement('div');
    sidebarContent.className = 'sidebar-content overflow-y-auto';
    
    // Get unique groups based on grouping mode
    const getGroups = () => {
      if (groupingMode === 'product') {
        return new Set(tasks
          .filter(task => filteredSteps.has(task.step))
          .map(task => task.product?.name || 'Unnamed Product')
        );
      } else {
        return new Set(tasks
          .filter(task => filteredSteps.has(task.step))
          .map(task => task.step)
        );
      }
    };

    const groups = getGroups();
    
    groups.forEach(group => {
      const groupDiv = document.createElement('div');
      groupDiv.style.height = `${GANTT_CONFIG.rowHeight}px`;
      groupDiv.className = `flex items-center px-4 border-b text-sm text-gray-700 capitalize`;
      groupDiv.textContent = group || '';
      sidebarContent.appendChild(groupDiv);
    });

    sidebar.appendChild(sidebarContent);
    wrapper.appendChild(sidebar);

    const ganttContainer = document.createElement('div');
    ganttContainer.className = 'gantt-container flex-1 overflow-x-auto';
    wrapper.appendChild(ganttContainer);

    const ganttTasks = transformToGanttTasks(tasks);

    try {
      ganttRef.current = new ExtendedGantt(ganttContainer, ganttTasks, {
        view_modes: [
          Gantt.VIEW_MODE.MINUTE,
          Gantt.VIEW_MODE.HOUR,
          Gantt.VIEW_MODE.QUARTER_DAY,
          Gantt.VIEW_MODE.HALF_DAY,
          Gantt.VIEW_MODE.DAY,
          Gantt.VIEW_MODE.WEEK,
          Gantt.VIEW_MODE.MONTH
        ],
        view_mode: viewMode,
        date_format: 'YYYY-MM-DD HH:mm:ss',
        row_height: GANTT_CONFIG.rowHeight,
        bar_height: GANTT_CONFIG.rowHeight - 18,
        start: (task: BaseTask) => { return task.start; },
        end: (task: BaseTask) => { return task.end; },
        popup: (task: any) => {
          task = task.task;
          const tod = task._data.originalTask;
          
          return `
            <div class="details-container bg-yellow p-4 rounded shadow-lg border">
              <h5 class="font-bold mb-2">${task.name}</h5>
              <p>Product: ${tod.product?.name || 'Unnamed'}</p>
              <p>Step: ${tod.step}</p>
              <p>Status: ${tod.status || 'Pending'}</p>
              <p>Progress: ${task.progress}%</p>
              <p>Start: ${new Date(task.start).toLocaleString()}</p>
              <p>End: ${new Date(task.end).toLocaleString()}</p>
              <p>Batch Size: ${tod.batchSize}</p>
              <p>Dependencies: ${tod.dependencies || 'None'}</p>
            </div>
          `;
        },
        popup_on: 'click',
        on_click: (task: BaseTask) => {
          if (!isGanttTask(task)) return;
          console.log('Task clicked:', task._data.originalTask);
        },
        on_date_change: (task: BaseTask, start: Date, end: Date) => {
          if (!isGanttTask(task)) return;
          if (onDateChange) {
            onDateChange(task._data.originalTask, start, end);
          }
        },
        on_progress_change: (task: BaseTask, progress: number) => {
          if (!isGanttTask(task)) return;
          if (onProgressChange) {
            onProgressChange(task._data.originalTask, progress);
          }
        }
      });
    } catch (error) {
      console.error('Error creating Gantt chart:', error);
    }

    const style = document.createElement('style');
    style.textContent = `
      .gantt-wrapper .sidebar-content {
        max-height: calc(100vh - 16rem);
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

    const gridBody = ganttContainer.querySelector('.grid-body');
    const timelineBody = ganttContainer.querySelector('.timeline-body');
    
    if (gridBody && timelineBody) {
      gridBody.addEventListener('scroll', () => {
        timelineBody.scrollTop = gridBody.scrollTop;
      });
      
      timelineBody.addEventListener('scroll', () => {
        gridBody.scrollTop = timelineBody.scrollTop;
      });
    }

    const currentContainer = containerRef.current;
    return () => {
      style.remove();
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, [tasks, viewMode, filteredSteps, groupingMode, onDateChange, onProgressChange, transformToGanttTasks]);

  useEffect(() => {
    if (ganttRef.current) {
      ganttRef.current.change_view_mode(viewMode);
    }
  }, [viewMode]);

  return (
    <div ref={containerRef} className="h-full w-full">
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
  const [filteredSteps, setFilteredSteps] = useState<Set<string>>(new Set(PRODUCTION_STEPS));
  const [utilization, setUtilization] = useState<any>(null);

  const stepOptions = PRODUCTION_STEPS.map(step => ({
    value: step,
    label: step.charAt(0).toUpperCase() + step.slice(1),
  }));

  const handleStepFilterChange = (
    selectedOptions: MultiValue<{ value: string; label: string }>, 
    actionMeta: ActionMeta<{ value: string; label: string }>
  ) => {
    const selectedSteps = new Set<string>(
      selectedOptions ? selectedOptions.map((option) => option.value) : []
    );
    setFilteredSteps(selectedSteps);
  };

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await bakeryApi.getSchedule(selectedDate, true);
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
  }, [selectedDate]);

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

  if (error) {
    return (
      <Alert variant="error" title="Error">
        {error}
      </Alert>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b py-3">
        {/* Top Row - View Modes and Core Controls */}
        <div className="px-4 flex justify-between items-center mb-3">
          {/* View Mode Selector */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {(['Day', 'Week', 'Month', 'Quarter Day', 'Half Day'] as FrappeViewMode[]).map((mode) => (
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
                onChange={(e) => setSelectedDate(e.target.value)}
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
            <Select
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
                control: (base) => ({
                  ...base,
                  minHeight: '32px',
                }),
                option: (base, { data, isSelected }) => {
                  const stepColor = STEP_COLORS[data.value].replace('bg-', '');
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
                  return {
                    ...base,
                    backgroundColor: isSelected ? color : base.backgroundColor,
                    color: isSelected ? 'white' : base.color,
                    borderLeft: `4px solid ${color}`,
                    ':hover': {
                      backgroundColor: isSelected ? color : `${color}20`,
                    },
                    padding: '8px 12px',
                  };
                },
                dropdownIndicator: (base) => ({
                  ...base,
                  padding: '4px',
                }),
                clearIndicator: (base) => ({
                  ...base,
                  padding: '4px',
                }),
                multiValue: (base, { data }) => {
                  const stepColor = STEP_COLORS[data.value].replace('bg-', '');
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
                  return {
                    ...base,
                    backgroundColor: `${color}20`,
                    border: `1px solid ${color}40`,
                  };
                },
                multiValueLabel: (base, { data }) => {
                  const stepColor = STEP_COLORS[data.value].replace('bg-', '');
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
                  return {
                    ...base,
                    fontSize: '0.875rem',
                    padding: '2px 6px',
                    color: color,
                  };
                },
                multiValueRemove: (base, { data }) => {
                  const stepColor = STEP_COLORS[data.value].replace('bg-', '');
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
                  return {
                    ...base,
                    padding: '0 4px',
                    color: color,
                    ':hover': {
                      backgroundColor: `${color}30`,
                      color: color,
                    },
                  };
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full">
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