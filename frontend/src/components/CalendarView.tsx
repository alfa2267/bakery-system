import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import { ScheduledTask, FrappeViewMode } from '../types';

interface CalendarViewProps {
  tasks: ScheduledTask[];
  viewMode: FrappeViewMode;
  onEventClick?: (task: ScheduledTask) => void;
  onDateSelect?: (date: Date) => void;
  onEventDrop?: (task: ScheduledTask, newStart: Date, newEnd: Date) => void;
}

interface ViewSettings {
  view: string;
  slotDuration: string;
  slotMinTime: string;
  slotMaxTime: string;
  scrollTime?: string;
}

const getViewSettings = (viewMode: FrappeViewMode): ViewSettings => {
  const baseSettings: ViewSettings = {
    view: 'timeGridDay',
    slotDuration: '01:00:00',
    slotMinTime: '00:00:00',
    slotMaxTime: '24:00:00',
    scrollTime: '06:00:00'
  };

  switch (viewMode) {
    case 'Minute':
      return {
        ...baseSettings,
        slotDuration: '00:01:00',
        scrollTime: '00:00:00'
      };
    case 'Hour':
      return {
        ...baseSettings,
        slotDuration: '00:05:00',
        scrollTime: '00:00:00'
      };
    case 'Quarter Day':
      return {
        ...baseSettings,
        slotDuration: '00:15:00'
      };
    case 'Half Day':
      return {
        ...baseSettings,
        slotDuration: '00:30:00'
      };
    case 'Day':
      return baseSettings;
    case 'Week':
      return {
        view: 'timeGridWeek',
        slotDuration: '01:00:00',
        slotMinTime: '06:00:00',
        slotMaxTime: '22:00:00',
        scrollTime: '06:00:00'
      };
    case 'Month':
      return {
        view: 'dayGridMonth',
        slotDuration: '24:00:00',
        slotMinTime: '00:00:00',
        slotMaxTime: '24:00:00',
        scrollTime: '06:00:00'
      };
    case 'Quarter':
      return {
        view: 'multiMonthYear',
        slotDuration: '24:00:00',
        slotMinTime: '00:00:00',
        slotMaxTime: '24:00:00',
        scrollTime: '06:00:00'
      };
    case 'Year':
      return {
        view: 'multiMonthYear',
        slotDuration: '24:00:00',
        slotMinTime: '00:00:00',
        slotMaxTime: '24:00:00',
        scrollTime: '06:00:00'
      };
  }
};

const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  viewMode,
  onEventClick,
  onDateSelect,
  onEventDrop,
}) => {
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const settings = getViewSettings(viewMode);
      calendarApi.changeView(settings.view);
      
      // Update slot settings
      calendarApi.setOption('slotDuration', settings.slotDuration);
      calendarApi.setOption('slotMinTime', settings.slotMinTime);
      calendarApi.setOption('slotMaxTime', settings.slotMaxTime);
      if (settings.scrollTime) {
        calendarApi.setOption('scrollTime', settings.scrollTime);
      }
    }
  }, [viewMode]);

  const handleEventClick = useCallback((eventInfo: any) => {
    if (onEventClick) {
      const task = tasks.find(t => t.id === eventInfo.event.id);
      if (task) {
        onEventClick(task);
      }
    }
  }, [tasks, onEventClick]);

  const handleDateSelect = useCallback((dateInfo: any) => {
    if (onDateSelect) {
      onDateSelect(dateInfo.date);
    }
  }, [onDateSelect]);

  const handleEventDrop = useCallback((eventDropInfo: any) => {
    if (onEventDrop) {
      const task = tasks.find(t => t.id === eventDropInfo.event.id);
      if (task) {
        onEventDrop(
          task,
          eventDropInfo.event.start,
          eventDropInfo.event.end || eventDropInfo.event.start
        );
      }
    }
  }, [tasks, onEventDrop]);

  const events = useMemo(() => {
    return tasks.map(task => ({
      id: str(task.id),
      title: `${task.product?.name || 'Unnamed'} (${task.orderId})`,
      start: task.startTime,
      end: task.endTime,
      className: `step-${task.step}`,
      backgroundColor: task.status === 'completed' ? '#10B981' : // green
                      task.status === 'in-progress' ? '#3B82F6' : // blue
                      task.status === 'blocked' ? '#EF4444' : // red
                      '#6B7280', // gray for pending
      borderColor: 'transparent',
      textColor: 'white',
      extendedProps: {
        status: task.status,
        step: task.step,
      }
    }));
  }, [tasks]);

  const settings = getViewSettings(viewMode);

  return (
    <div className="h-full">
      <div className="h-full p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, multiMonthPlugin]}
          initialView={settings.view}
          headerToolbar={{
            left: '',
            center: '',
            right: '',
          }}
          events={events}
          eventClick={handleEventClick}
          dateClick={handleDateSelect}
          eventDrop={handleEventDrop}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekNumbers={true}
          height="100%"
          slotDuration={settings.slotDuration}
          slotMinTime={settings.slotMinTime}
          slotMaxTime={settings.slotMaxTime}
          scrollTime={settings.scrollTime}
          allDaySlot={false}
          nowIndicator={true}
          slotEventOverlap={false}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          displayEventTime={true}
          displayEventEnd={true}
          eventDisplay="block"
          eventMinHeight={25}
          stickyHeaderDates={true}
          expandRows={true}
        />
      </div>
    </div>
  );
};

export default CalendarView;

function str(id: number): any {
  throw new Error('Function not implemented.');
}
