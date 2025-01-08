import React, { useState, useEffect } from 'react';
import { bakeryApi } from '../api/bakeryApi';
import { ScheduledTask, PRODUCTION_STEPS, VIEW_MODES, STEP_COLORS, STEP_HOVER_COLORS } from '../types';
import { AlertCircle, ChevronLeft, ChevronRight, Clock, BarChart2, Calendar } from 'lucide-react';

const GanttView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentView, setCurrentView] = useState<keyof typeof VIEW_MODES>('Day');
  const [schedule, setSchedule] = useState<ScheduledTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await bakeryApi.getSchedule(selectedDate);
        if (response && response.schedule) {


  console.log(response.schedule)

          const validatedSchedule = response.schedule.map((task, index) => ({
            ...task,
             startTime: task.startTime instanceof Date 
              ? task.startTime 
              : new Date(task.startTime || Date.now()),
            endTime: task.endTime instanceof Date 
              ? task.endTime 
              : new Date(task.endTime || Date.now())
          }));

          
          setSchedule(validatedSchedule);
        } else {
          setSchedule([]);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load schedule. Please try again later.');
        setSchedule([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [selectedDate, currentView]);

  const timeToPosition = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    switch(currentView) {
      case 'Minute':
        return ((hours * 60 + minutes) / 1440) * 100;
      case 'Hour':
      case 'Day':
        return ((hours + minutes / 60) / 24) * 100;
      case 'Quarter Day':
        if (hours < 6) return 0;
        if (hours < 12) return 25;
        if (hours < 18) return 50;
        return 75;
      case 'Half Day':
        return hours < 12 ? 0 : 50;
      case 'Week':
        const quarterHour = Math.floor(hours / 6);
        return quarterHour * 25;
      case 'Month':
        return 0;
      default:
        return 0;
    }
  };

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handlePrevPeriod = () => {
    const date = new Date(selectedDate);
    switch(currentView) {
      case 'Minute': date.setMinutes(date.getMinutes() - 1); break;
      case 'Hour': date.setHours(date.getHours() - 1); break;
      case 'Day': date.setDate(date.getDate() - 1); break;
      case 'Week': date.setDate(date.getDate() - 7); break;
      case 'Month': date.setMonth(date.getMonth() - 1); break;
      default: date.setDate(date.getDate() - 1);
    }
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextPeriod = () => {
    const date = new Date(selectedDate);
    switch(currentView) {
      case 'Minute': date.setMinutes(date.getMinutes() + 1); break;
      case 'Hour': date.setHours(date.getHours() + 1); break;
      case 'Day': date.setDate(date.getDate() + 1); break;
      case 'Week': date.setDate(date.getDate() + 7); break;
      case 'Month': date.setMonth(date.getMonth() + 1); break;
      default: date.setDate(date.getDate() + 1);
    }
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={handlePrevPeriod} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={handleNextPeriod} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          {(Object.keys(VIEW_MODES) as Array<keyof typeof VIEW_MODES>).map((mode) => (
            <button
              key={mode}
              onClick={() => setCurrentView(mode)}
              className={`flex items-center px-3 py-1 rounded-md transition-colors 
                ${currentView === mode ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
      <div className="relative overflow-x-auto border rounded-lg shadow-sm">
        <div className="min-w-full relative" style={{ width: `${VIEW_MODES[currentView].hours.length * VIEW_MODES[currentView].columnWidth}px` }}>
          <div className="sticky top-0 z-20 bg-white flex h-12 border-b">
            <div className="w-48 border-r flex items-center px-4 font-medium text-gray-700 bg-gray-50 sticky left-0 z-30">
              Process Step
            </div>
            <div className="flex-1 flex">
              {VIEW_MODES[currentView].hours.map(hour => (
                <div key={hour} className="border-l flex justify-center items-center relative" style={{ width: `${VIEW_MODES[currentView].columnWidth}px` }}>
                  {`${hour.toString().padStart(2, '0')}:00`}
                </div>
              ))}
            </div>
          </div>
          <div className="relative bg-white">
            {PRODUCTION_STEPS.map((step, stepIndex) => (
              <div key={stepIndex} className="flex hover:bg-gray-50 border-b relative" style={{ height: '60px' }}>
                <div className="w-48 border-r px-4 text-sm font-medium text-gray-700 capitalize sticky left-0 bg-white z-10">
                  {step}
                </div>
                <div className="flex-1 relative">
                  {schedule.filter(task => task.step === step).map((task, taskIndex) => {
                    const barLeft = timeToPosition(task.startTime);
                    const barWidth = timeToPosition(task.endTime) - barLeft;
                    return (
                      <div
                        key={taskIndex}
                        className={`absolute h-10 top-3 ${STEP_COLORS[task.step as keyof typeof STEP_COLORS]} 
                          ${STEP_HOVER_COLORS[task.step as keyof typeof STEP_HOVER_COLORS]} rounded-md`}
                        style={{ left: `${barLeft}%`, width: `${barWidth}%` }} >
                        <div className="px-2 text-sm text-white truncate">{`${task.product?.name}`}</div>

                      </div>
                      
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttView;
