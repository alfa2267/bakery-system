import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { bakeryApi } from '../api/bakeryApi';
import Select, { ActionMeta, MultiValue } from 'react-select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Alert } from '../ui/Alert';
import { 
  ScheduledTask, 
  Order,
  FrappeViewMode, 
  PRODUCTION_STEPS, 
  ScreenViewMode, 
  ProductionStep, 
  STEP_COLORS, 
  TaskStatus, 
  GanttViewProps
} from '../types/index';
import GanttView from './GanttView';
import CalendarView from './CalendarView';
import ListView from './ListView';


const ScheduleView: React.FC = () => {
  const [viewMode, setViewMode] = useState<ScreenViewMode>('list');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentView, setCurrentView] = useState<FrappeViewMode>('Day');
  const [groupingMode, setGroupingMode] = useState<'step' | 'product'>('step');
  
  // State for schedule and orders
  const [schedule, setSchedule] = useState<ScheduledTask[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredSteps, setFilteredSteps] = useState<Set<ProductionStep>>(new Set(PRODUCTION_STEPS));

  // Step options for the filter
  const stepOptions = PRODUCTION_STEPS.map(step => ({
    value: step,
    label: step.charAt(0).toUpperCase() + step.slice(1),
  }));

  // Memoized and wrapped functions to prevent unnecessary re-renders
  const handleDateChange = useCallback(async (task: ScheduledTask, start: Date, end: Date) => {
    try {
      await bakeryApi.updateTaskTiming(task.id, start, end);
      const response = await bakeryApi.getSchedules(true);
      if (response && response.schedule) {
        setSchedule(response.schedule);
      }
    } catch (error) {
      setError('Failed to update task timing');
    }
  }, []);

  const handleProgressChange = useCallback(async (task: ScheduledTask, progress: number) => {
    try {
      const status = progress === 100 ? 'completed' as TaskStatus : 
                     progress > 0 ? 'in-progress' as TaskStatus : 
                     'pending' as TaskStatus;
      await bakeryApi.updateTaskStatus(task.id, status);
      const response = await bakeryApi.getSchedules(true);
      if (response && response.schedule) {
        setSchedule(response.schedule);
      }
    } catch (error) {
      setError('Failed to update task status');
    }
  }, []);

  // Fetch schedule and orders on component mount
  useEffect(() => {
    const fetchScheduleAndOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch schedule
        const scheduleResponse = await bakeryApi.getSchedules(true);
        if (scheduleResponse && scheduleResponse.schedule) {
          setSchedule(scheduleResponse.schedule);
          
          // Extract order IDs from the schedule
          const orderIds = Array.from(
            new Set(scheduleResponse.schedule.map(task => task.orderId))
          );
          
          // Fetch orders based on the order IDs in the schedule
          const ordersResponse = await bakeryApi.getOrders();
          
          if (Array.isArray(ordersResponse)) {
            setOrders(ordersResponse);
          }
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load schedule and orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchScheduleAndOrders();
  }, [selectedDate]); // Refetch when selected date changes

  // Handle step filter change
  const handleStepFilterChange = useCallback((
    selectedOptions: MultiValue<{ value: ProductionStep, label: string }>,
    actionMeta: ActionMeta<{ value: ProductionStep, label: string }>
  ) => {
    const selectedSteps = new Set<ProductionStep>(
      selectedOptions ? selectedOptions.map((option) => option.value) : []
    );
    setFilteredSteps(selectedSteps);
  }, []);

  // Filtering tasks based on selected steps
  const filteredTasks = useMemo(() => {
    return schedule.filter(task => filteredSteps.has(task.step));
  }, [schedule, filteredSteps]);


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
        {/* View Mode and Core Controls */}
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
            <div className="flex items-center space-x-2">
              <select
                id="grouping-mode"
                value={groupingMode}
                onChange={(e) => setGroupingMode(e.target.value as 'step' | 'product')}
                className="px-2.5 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="step">Group by Step</option>
                <option value="product">Group by Product</option>
              </select>
            </div>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="px-4 flex justify-between items-start border-t pt-3">
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
                container: (base) => ({ ...base, zIndex: 999 }),
                control: (base) => ({ ...base, minHeight: '32px', zIndex: 999 }),
                menu: (base) => ({ ...base, zIndex: 999 }),
                menuPortal: (base) => ({ ...base, zIndex: 999 }),
                option: (base, { data, isSelected }) => {
                  const stepColor = STEP_COLORS[data.value].replace('bg-', '');
                  const colorMap: Record<string, string> = {
                    white: '#000',
                    blue: '#2b60f7',
                    red: '#f74d2b',
                    yellow: '#f7b600',
                    green: '#29a929',
                  };

                  return {
                    ...base,
                    backgroundColor: isSelected ? colorMap[stepColor] : base.backgroundColor,
                    color: isSelected ? 'white' : base.color,
                  };
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Views */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'list' && <ListView tasks={filteredTasks} orders={orders} />}
        {viewMode === 'calendar' && <CalendarView />}
        <GanttView 
          tasks={filteredTasks} 
          orders={orders}
          viewMode={currentView}
          filteredSteps={filteredSteps}
          groupingMode={groupingMode}
          onProgressChange={handleProgressChange}
          onDateChange={handleDateChange}
        />
      </div>
    </div>
  );
};

export default ScheduleView;