import React, { useState, useEffect, useRef, useCallback } from 'react';
import { bakeryApi } from '../api/bakeryApi';
import Select, { ActionMeta, MultiValue } from 'react-select';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ScheduledTask, Order, FrappeViewMode, ProductionStep, PRODUCTION_STEPS } from '../types';
import { Alert } from '../ui/Alert';

const CalendarView: React.FC = () => {
  const [schedule, setSchedule] = useState<ScheduledTask[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredSteps, setFilteredSteps] = useState<Set<ProductionStep>>(new Set());

  const stepOptions = React.useMemo(() => (
    PRODUCTION_STEPS.map((step: ProductionStep) => ({
      value: step,
      label: step.charAt(0).toUpperCase() + step.slice(1),
    }))
  ), []);

  const handleStepFilterChange = useCallback((
    selectedOptions: MultiValue<{ value: ProductionStep, label: string }>,
    actionMeta: ActionMeta<{ value: ProductionStep, label: string }>
  ) => {
    const selectedSteps = new Set<ProductionStep>(
      selectedOptions ? selectedOptions.map((option) => option.value) : []
    );
    setFilteredSteps(selectedSteps);
  }, []);

  const handleEventClick = useCallback((eventInfo: any) => {
    // Handle event click
    console.log('Event clicked:', eventInfo);
  }, []);

  const handleDateSelect = useCallback((dateInfo: any) => {
    // Handle date selection
    console.log('Date selected:', dateInfo);
  }, []);

  const handleEventDrop = useCallback((eventDropInfo: any) => {
    // Handle event drop
    console.log('Event dropped:', eventDropInfo);
  }, []);

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

          // Fetch orders
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
  }, []);

  const filteredTasks = React.useMemo(() => {
    return schedule.filter(task => filteredSteps.has(task.step));
  }, [schedule, filteredSteps]);

  const events = React.useMemo(() => {
    return filteredTasks.map(task => ({
      id: task.id,
      title: `${task.product?.name || 'Unnamed'} (${task.orderId})`,
      start: task.startTime,
      end: task.endTime,
      className: `step-${task.step}`,
    }));
  }, [filteredTasks]);

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
    <div className="h-full">
      <div className="px-4 py-3">
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
        />
      </div>
      <div className="h-full">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={events}
          eventClick={handleEventClick}
          dateClick={handleDateSelect}
          eventDrop={handleEventDrop}
          editable={true}
          selectable={true}
        />
      </div>
    </div>
  );
};

export default CalendarView;