import React, { useState, useEffect, useMemo } from 'react';
import { bakeryApi } from '../api/bakeryApi';
import { ScheduledTask } from '../types';
import { AlertCircle, ChevronLeft, ChevronRight, Clock, BarChart2, Calendar } from 'lucide-react';

// View modes with their corresponding time ranges and column widths
const VIEW_MODES = {
  'Minute': { 
    hours: Array.from({ length: 1440 }, (_, i) => Math.floor(i / 60)), 
    columnWidth: 50 
  },
  'Hour': { 
    hours: Array.from({ length: 24 }, (_, i) => i), 
    columnWidth: 100 
  },
  'Quarter Day': { 
    hours: [0, 6, 12, 18], 
    columnWidth: 200 
  },
  'Half Day': { 
    hours: [0, 12], 
    columnWidth: 300 
  },
  'Day': { 
    hours: Array.from({ length: 24 }, (_, i) => i), 
    columnWidth: 100 
  },
  'Week': { 
    hours: [0, 6, 12, 18], 
    columnWidth: 200 
  },
  'Month': { 
    hours: [1], 
    columnWidth: 400 
  }
};

const PRODUCTION_STEPS = ['mixing', 'chilling', 'shaping', 'baking', 'cooling'] as const;

const STEP_COLORS = {
  mixing: 'bg-blue-500',
  chilling: 'bg-purple-500',
  shaping: 'bg-orange-500',
  baking: 'bg-red-500',
  cooling: 'bg-green-500',
} as const;

const STEP_HOVER_COLORS = {
  mixing: 'group-hover:bg-blue-600',
  chilling: 'group-hover:bg-purple-600',
  shaping: 'group-hover:bg-orange-600',
  baking: 'group-hover:bg-red-600',
  cooling: 'group-hover:bg-green-600',
} as const;

const GanttView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentView, setCurrentView] = useState<keyof typeof VIEW_MODES>('Day');
  const [schedule, setSchedule] = useState<ScheduledTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch schedule based on selected date and view
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await bakeryApi.getSchedule(selectedDate);
        setSchedule(response.schedule || []);
      } catch (error) {
        console.error('Error fetching schedule:', error);
        setError('Failed to load schedule. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [selectedDate, currentView]);

  // Dynamic calculation of time positioning based on current view
  const timeToPosition = (date: Date) => {
    switch(currentView) {
      case 'Minute':
        return ((date.getHours() * 60 + date.getMinutes()) / 1440) * 100;
      case 'Hour':
      case 'Day':
        return ((date.getHours()) / 24) * 100;
      case 'Quarter Day':
        return ((date.getHours() / 6) % 1) * 100;
      case 'Half Day':
        return ((date.getHours() / 12) % 1) * 100;
      case 'Week':
        return ((date.getHours() / 6) % 1) * 100;
      case 'Month':
        return 0; // Placeholder for month view
      default:
        return 0;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Date navigation handlers
  const handlePrevPeriod = () => {
    const date = new Date(selectedDate);
    switch(currentView) {
      case 'Minute':
        date.setMinutes(date.getMinutes() - 1);
        break;
      case 'Hour':
        date.setHours(date.getHours() - 1);
        break;
      case 'Day':
        date.setDate(date.getDate() - 1);
        break;
      case 'Week':
        date.setDate(date.getDate() - 7);
        break;
      case 'Month':
        date.setMonth(date.getMonth() - 1);
        break;
      default:
        date.setDate(date.getDate() - 1);
    }
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextPeriod = () => {
    const date = new Date(selectedDate);
    switch(currentView) {
      case 'Minute':
        date.setMinutes(date.getMinutes() + 1);
        break;
      case 'Hour':
        date.setHours(date.getHours() + 1);
        break;
      case 'Day':
        date.setDate(date.getDate() + 1);
        break;
      case 'Week':
        date.setDate(date.getDate() + 7);
        break;
      case 'Month':
        date.setMonth(date.getMonth() + 1);
        break;
      default:
        date.setDate(date.getDate() + 1);
    }
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex items-center bg-red-50 border border-red-200 text-red-800 p-4 rounded">
        <AlertCircle className="w-5 h-5 mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header with Navigation and View Modes */}
      <div className="mb-6 flex items-center justify-between">
        {/* Date Navigation */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePrevPeriod}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleNextPeriod}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          {(Object.keys(VIEW_MODES) as Array<keyof typeof VIEW_MODES>).map((mode) => (
            <button
              key={mode}
              onClick={() => setCurrentView(mode)}
              className={`
                flex items-center space-x-2 px-3 py-1 rounded-md transition-colors 
                ${currentView === mode 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {mode === 'Minute' && <Clock className="w-4 h-4" />}
              {mode === 'Hour' && <Clock className="w-4 h-4" />}
              {mode === 'Day' && <Calendar className="w-4 h-4" />}
              {(mode === 'Week' || mode === 'Month') && <BarChart2 className="w-4 h-4" />}
              <span>{mode}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Gantt Chart Container */}
      <div className="relative overflow-x-auto border rounded-lg shadow-sm">
        <div 
          className="min-w-full relative"
          style={{ 
            width: `${VIEW_MODES[currentView].hours.length * VIEW_MODES[currentView].columnWidth}px` 
          }}
        >
          {/* Timeline Header - Sticky */}
          <div className="sticky top-0 z-20 bg-white flex h-12 border-b">
            <div className="w-48 border-r flex items-center px-4 font-medium text-gray-700 bg-gray-50 sticky left-0 z-30">
              Process Step
            </div>
            <div className="flex-1 flex">
              {VIEW_MODES[currentView].hours.map(hour => (
                <div
                  key={hour}
                  className="border-l flex flex-col justify-center items-center relative"
                  style={{ width: `${VIEW_MODES[currentView].columnWidth}px` }}
                >
                  <div className="text-sm text-gray-600">
                    {`${hour.toString().padStart(2, '0')}:00`}
                  </div>
                  {/* Vertical Grid Lines */}
                  <div 
                    className="absolute top-12 bottom-0 border-r border-dashed border-gray-200 opacity-50"
                    style={{ left: 0 }}
                  ></div>
                </div>
              ))}
            </div>
          </div>

          {/* Process Steps and Tasks */}
          <div className="relative bg-white">
            {PRODUCTION_STEPS.map((step, stepIndex) => (
              <div
                key={stepIndex}
                className="flex hover:bg-gray-50 transition-colors border-b relative"
                style={{ height: '60px' }}
              >
                {/* Sticky Step Name */}
                <div 
                  className="w-48 border-r flex items-center px-4 text-sm font-medium text-gray-700 
                    capitalize sticky left-0 bg-white z-10"
                >
                  {step}
                </div>
                
                {/* Tasks Container with Horizontal Grid Lines */}
                <div 
                  className="flex-1 relative"
                  style={{ 
                    width: `${VIEW_MODES[currentView].hours.length * VIEW_MODES[currentView].columnWidth}px` 
                  }}
                >
                  {/* Horizontal Grid Lines */}
                  <div 
                    className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none"
                    style={{
                      backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)',
                      backgroundSize: '100% 60px'
                    }}
                  ></div>

                  {/* Background grid for full day */}
                  <div 
                    className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, 
                          rgba(0,0,0,0.05) 1px, 
                          transparent 1px
                        )
                      `,
                      backgroundSize: `${VIEW_MODES[currentView].columnWidth}px 100%`
                    }}
                  ></div>

                  {schedule
                    .filter(task => task.step === step)
                    .map((task, taskIndex) => {
                      const barWidth = timeToPosition(task.endTime) - timeToPosition(task.startTime);
                      const barLeft = timeToPosition(task.startTime);

                      return (
                        <div
                          key={taskIndex}
                          className={`absolute h-10 top-3 ${STEP_COLORS[step as keyof typeof STEP_COLORS]} 
                            ${STEP_HOVER_COLORS[step as keyof typeof STEP_HOVER_COLORS]} 
                            rounded-md cursor-pointer group transition-colors shadow-sm z-10`}
                          style={{
                            left: `${barLeft}%`,
                            width: `${barWidth}%`,
                            zIndex: 15 // Ensure bars are above grid lines
                          }}
                        >
                          <div className="px-2 py-1 text-white text-sm truncate">
                            {`Order ${task.orderId.slice(0, 8)}`}
                          </div>
                          
                          {/* Tooltip */}
                          <div className="hidden group-hover:block absolute top-full left-0 mt-2 p-3 bg-gray-800 
                            text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-20">
                            <div className="font-semibold mb-2 border-b pb-1">Order Details</div>
                            <div className="space-y-1">
                              <div>Order ID: {task.orderId}</div>
                              <div>Batch Size: {task.batchSize}</div>
                              <div>Resources: {task.resources.join(', ')}</div>
                              <div>Start: {formatTime(task.startTime)}</div>
                              <div>End: {formatTime(task.endTime)}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* No Tasks Indicator */}
      {schedule.length === 0 && (
        <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg mt-4">
          No scheduled tasks for {new Date(selectedDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default GanttView;
