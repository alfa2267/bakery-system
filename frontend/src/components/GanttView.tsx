import React, { useState, useEffect, useRef } from 'react';
import { bakeryApi } from '../api/bakeryApi';


import { 
  ChevronLeft, 
  ChevronRight, 
  BarChart2,
  Calendar
} from 'lucide-react';
import { Alert } from '../ui/Alert';
import Gantt from 'frappe-gantt';
import 'frappe-gantt/dist/frappe-gantt.css';


import { 
  ScheduledTask, 
  PRODUCTION_STEPS, 
  VIEW_MODES, 
  STEP_COLORS, 
  STEP_HOVER_COLORS,
  ViewMode,
  TaskStatus,
  Product,
  Task,
  EnrichedTask,
} from '../types/index';


const GanttChart: React.FC<{
    tasks: ScheduledTask[];
    viewMode: ViewMode;
    filteredSteps: Set<string>; // add this prop
    onTasksUpdate?: (tasks: ScheduledTask[]) => void;
    onDateChange?: (task: ScheduledTask, start: Date, end: Date) => void;
    onProgressChange?: (task: ScheduledTask, progress: number) => void;
  }> = ({ tasks, viewMode, filteredSteps, onTasksUpdate, onDateChange, onProgressChange }) => {
   


  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<any>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Transform ScheduledTask to Task
  const transformToGanttTasks = (tasks: ScheduledTask[]): Task[] => {
    return tasks
      .filter(task => filteredSteps.has(task.step))
      .map(task => ({
        id: task.orderId + '-' + task.step,
        name: `${task.product?.name} (${task.batchSize})`,
        start: task.startTime,
        end: task.endTime,
        progress: task.status === 'completed' ? 100 : 
                 task.status === 'in-progress' ? 50 : 0,
        dependencies: Array.isArray(task.dependencies) ? task.dependencies.join(',') : '',
        custom_class: `step-${task.step}`,
        originalTask: task
      }));
  };

  useEffect(() => {
    if (containerRef.current && tasks.length > 0) {
      if (ganttRef.current) {
        containerRef.current.querySelector('.gantt-container')?.remove();
      }

      // Create wrapper structure
      const wrapper = document.createElement('div');
      wrapper.className = 'gantt-wrapper';
      wrapper.style.display = 'flex';
      wrapper.style.width = '100%';
      wrapper.style.height = '100%';
      containerRef.current.appendChild(wrapper);

      // Create Gantt container
      const ganttContainer = document.createElement('div');
      ganttContainer.className = 'gantt-container';
      ganttContainer.style.flexGrow = '1';
      ganttContainer.style.overflow = 'auto';
      wrapper.appendChild(ganttContainer);

      const ganttTasks = transformToGanttTasks(tasks);
      ganttRef.current = new Gantt(ganttContainer, ganttTasks, {
        view_modes: ['Quarter Day', 'Half Day', 'Day', 'Week', 'Month'],
        view_mode: viewMode,
        date_format: 'YYYY-MM-DD HH:mm:ss',
        custom_popup_html: (task: Task) => {
          const originalTask = task. ._data.originalTask;
          return `
            <div class="details-container bg-white p-4 rounded shadow-lg border">
              <h5 class="font-bold mb-2">${originalTask.product?.name}</h5>
              <p>Status: ${originalTask.status || 'Pending'}</p>
              <p>Progress: ${task.progress}%</p>
              <p>Start: ${originalTask.startTime.toLocaleString()}</p>
              <p>End: ${originalTask.endTime.toLocaleString()}</p>
              <p>Batch Size: ${originalTask.batchSize}</p>
              <p>Dependencies: ${originalTask.dependencies}</p>
            </div>
          `;
        },
        on_click: (task: Task) => {
          console.log('Task clicked:', task.originalTask);
        },
        on_date_change: (task: Task, start: Date, end: Date) => {
          onDateChange?.(task._data.originalTask, start, end);
        },
        on_progress_change: (task: Task, progress: number) => {
          onProgressChange?.(task._data.originalTask, progress);
        }
      });
      });

      // Add custom styling
      const style = document.createElement('style');
      style.textContent = `
        .gantt .grid-header {
          fill: #f3f4f6;
        }
        .gantt .lower-text, .gantt .upper-text {
          font-size: 12px;
          font-weight: 500;
        }
        .gantt .bar-wrapper:hover .bar {
          fill: #2563eb;
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
        ${PRODUCTION_STEPS.map(step => `
          .gantt .bar-wrapper.step-${step} .bar {
            fill: ${STEP_COLORS[step].replace('bg-', '#')};
          }
          .gantt .bar-wrapper.step-${step} .bar-progress {
            fill: ${STEP_COLORS[step].replace('bg-', '#')}cc;
          }
        `).join('\n')}
      `;
      document.head.appendChild(style);

      // Sync scroll between grid and timeline
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
    }
  }, [tasks, viewMode]);

  useEffect(() => {
    if (ganttRef.current) {
      ganttRef.current.change_view_mode(viewMode);
    }
  }, [viewMode]);

  return (
    <div className="gantt-wrapper flex h-full">
      {/* Sticky sidebar */}
      <div className="sticky left-0 z-10 w-48 bg-white border-r shadow-sm">
        <div className="h-16 border-b flex items-center px-4 font-medium text-gray-700">
          Process Step
        </div>
        <div ref={sidebarRef} className="sidebar-content">
          {tasks.map(task => (
            <div 
              key={task.id}
              className="h-12 flex items-center px-4 border-b text-sm text-gray-700 capitalize"
            >
              {task.step}
            </div>
          ))}
        </div>
      </div>
      
      {/* Gantt container */}
      <div ref={containerRef} className="flex-1 overflow-x-auto">
        {/* Frappe Gantt will be initialized here */}
      </div>
    </div>
  );
}; = ({ tasks, viewMode, onTasksUpdate, onDateChange, onProgressChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<any>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && tasks.length > 0) {
      if (ganttRef.current) {
        containerRef.current.querySelector('.gantt-container')?.remove();
      }

      // Create wrapper structure
      const wrapper = document.createElement('div');
      wrapper.className = 'gantt-wrapper';
      wrapper.style.display = 'flex';
      wrapper.style.width = '100%';
      wrapper.style.height = '100%';
      containerRef.current.appendChild(wrapper);

      // Create Gantt container
      const ganttContainer = document.createElement('div');
      ganttContainer.className = 'gantt-container';
      ganttContainer.style.flexGrow = '1';
      ganttContainer.style.overflow = 'auto';
      wrapper.appendChild(ganttContainer);

      ganttRef.current = new Gantt(ganttContainer, tasks, {
        view_modes: ['Quarter Day', 'Half Day', 'Day', 'Week', 'Month'],
        view_mode: viewMode,
        date_format: 'YYYY-MM-DD HH:mm:ss',
        custom_popup_html: (task) => {
          return `
            <div class="details-container bg-white p-4 rounded shadow-lg border">
              <h5 class="font-bold mb-2">${task.name}</h5>
              <p>Status: ${task.status || 'Pending'}</p>
              <p>Progress: ${task.progress}%</p>
              <p>Start: ${task.start.toLocaleString()}</p>
              <p>End: ${task.end.toLocaleString()}</p>
              ${task.dependencies ? `<p>Dependencies: ${task.dependencies}</p>` : ''}
            </div>
          `;
        },
        on_click: (task) => {
          console.log('Task clicked:', task);
        },
        on_date_change: onDateChange,
        on_progress_change: onProgressChange
      });

      // Add custom styling
      const style = document.createElement('style');
      style.textContent = `
        .gantt .grid-header {
          fill: #f3f4f6;
        }
        .gantt .lower-text, .gantt .upper-text {
          font-size: 12px;
          font-weight: 500;
        }
        .gantt .bar-wrapper:hover .bar {
          fill: #2563eb;
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
        ${PRODUCTION_STEPS.map(step => `
          .gantt .bar-wrapper.step-${step} .bar {
            fill: ${STEP_COLORS[step].replace('bg-', '#')};
          }
          .gantt .bar-wrapper.step-${step} .bar-progress {
            fill: ${STEP_COLORS[step].replace('bg-', '#')}cc;
          }
        `).join('\n')}
      `;
      document.head.appendChild(style);

      // Sync scroll between grid and timeline
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
    }
  }, [tasks, viewMode]);

  useEffect(() => {
    if (ganttRef.current) {
      ganttRef.current.change_view_mode(viewMode);
    }
  }, [viewMode]);

  return (
    <div className="gantt-wrapper flex h-full">
      {/* Sticky sidebar */}
      <div className="sticky left-0 z-10 w-48 bg-white border-r shadow-sm">
        <div className="h-16 border-b flex items-center px-4 font-medium text-gray-700">
          Process Step
        </div>
        <div ref={sidebarRef} className="sidebar-content">
          {tasks.map(task => (
            <div 
              key={task.id}
              className="h-12 flex items-center px-4 border-b text-sm text-gray-700 capitalize"
            >
              {task.step}
            </div>
          ))}
        </div>
      </div>
      
      {/* Gantt container */}
      <div ref={containerRef} className="flex-1 overflow-x-auto">
        {/* Frappe Gantt will be initialized here */}
      </div>
    </div>
  );
};

const GanttView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentView, setCurrentView] = useState<ViewMode>('Day');
  const [schedule, setSchedule] = useState<ScheduledTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResourceUtilization, setShowResourceUtilization] = useState(false);
  const [filteredSteps, setFilteredSteps] = useState<Set<string>>(new Set(PRODUCTION_STEPS));
  const [utilization, setUtilization] = useState<any>(null);

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

  const transformToGanttTasks = (tasks: ScheduledTask[]): Task[] => {
    return tasks
      .filter(task => filteredSteps.has(task.step))
      .map(task => ({
        id: task.orderId + '-' + task.step,
        name: `${task.product?.name} (${task.batchSize})`,
        start: task.startTime,
        end: task.endTime,
        progress: task.status === 'completed' ? 100 : 
                 task.status === 'in-progress' ? 50 : 0,
        dependencies: Array.isArray(task.dependencies) ? task.dependencies.join(',') : '',
        custom_class: `step-${task.step}`,
        status: task.status,
        step: task.step,
        product: task.product,
        batchSize: task.batchSize
      }));
  };

  const handleDateChange = (task: any, start: Date, end: Date) => {
    console.log('Date changed:', task, start, end);
    // Here you would update the backend
  };

  const handleProgressChange = (task: any, progress: number) => {
    console.log('Progress changed:', task, progress);
    // Here you would update the backend
  };

  const toggleStep = (step: string) => {
    setFilteredSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(step)) {
        newSet.delete(step);
      } else {
        newSet.add(step);
      }
      return newSet;
    });
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
      <div className="bg-white border-b py-4 px-6">
        <div className="flex justify-between items-center">
          {/* Date Navigation */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => {
                const date = new Date(selectedDate);
                date.setDate(date.getDate() - 1);
                setSelectedDate(date.toISOString().split('T')[0]);
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500 mt-1">
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
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {/* View Mode Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['Quarter Day', 'Half Day', 'Day', 'Week', 'Month'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setCurrentView(mode)}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    currentView === mode ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Step Filters */}
            <div className="flex items-center space-x-2">
              {PRODUCTION_STEPS.map(step => (
                <button
                  key={step}
                  onClick={() => toggleStep(step)}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    filteredSteps.has(step) 
                      ? `${STEP_COLORS[step]} text-white` 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {step}
                </button>
              ))}
            </div>

            {/* Resource Utilization Toggle */}
            <button
              onClick={() => setShowResourceUtilization(!showResourceUtilization)}
              className={`flex items-center space-x-2 px-3 py-1 rounded-md ${
                showResourceUtilization ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Utilization</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full">
        <GanttChart
  tasks={schedule}
  viewMode={currentView}
  filteredSteps={filteredSteps} // pass filteredSteps here
  onTasksUpdate={setSchedule}
  onDateChange={handleDateChange}
  onProgressChange={handleProgressChange}
/>

        </div>
      </div>

      {/* Resource Utilization Modal */}
      {showResourceUtilization && (
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
            {utilization?.map((resource: any) => (
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