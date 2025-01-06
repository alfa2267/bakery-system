import React, { useState, useEffect } from 'react';
import { ChefHat, Calendar, User, PlusCircle, AlertCircle, Clock, CalendarCheck, ArrowRight } from 'lucide-react';

// OrderForm Component
const OrderForm = () => {
  // ... [Previous OrderForm implementation remains the same]
};

// GanttView Component
const GanttView = () => {
  const [selectedDate, setSelectedDate] = useState('2025-01-06');
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const GANTT_DATA = {
    '2025-01-06': [
      {
        name: 'Mixing',
        tasks: [
          {
            name: 'Mix Cookie Dough (ORD001+002)',
            start: new Date('2025-01-06T08:00'),
            end: new Date('2025-01-06T08:30'),
            details: '16 cookies total',
            resources: 'Baker1, Mixer1',
            type: 'active'
          }
        ]
      },
      {
        name: 'Baking',
        tasks: [
          {
            name: 'Bake Cookies (ORD001+002)',
            start: new Date('2025-01-06T08:30'),
            end: new Date('2025-01-06T09:15'),
            details: '16 cookies',
            resources: 'Baker1, Oven1',
            type: 'active'
          }
        ]
      }
    ]
  };

  const timeToPosition = (time) => {
    const hours = time.getHours() + (time.getMinutes() / 60);
    return hours * 100;
  };

  return (
    <div className="p-4">
      <div className="overflow-x-auto">
        <div style={{ minWidth: '1440px' }}>
          {/* Timeline Header */}
          <div className="sticky top-0 bg-gray-50 flex h-12">
            <div className="w-48 border-r bg-gray-50 flex items-center px-4 font-medium">
              Process Step
            </div>
            <div className="flex-1 flex">
              {hours.map(hour => (
                <div
                  key={hour}
                  className="border-l flex flex-col justify-center items-center"
                  style={{ width: '100px' }}
                >
                  <div className="text-sm text-gray-600">
                    {`${hour.toString().padStart(2, '0')}:00`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Process Steps and Tasks */}
          <div className="relative">
            {GANTT_DATA[selectedDate]?.map((step, stepIndex) => (
              <div
                key={stepIndex}
                className="flex hover:bg-gray-50"
                style={{ height: '50px' }}
              >
                <div className="w-48 border-r flex items-center px-4 text-sm font-medium">
                  {step.name}
                </div>
                <div className="flex-1 relative">
                  {step.tasks.map((task, taskIndex) => (
                    <div
                      key={taskIndex}
                      className="absolute h-8 top-2 bg-blue-500 rounded cursor-pointer group"
                      style={{
                        left: timeToPosition(task.start),
                        width: timeToPosition(task.end) - timeToPosition(task.start),
                      }}
                    >
                      <div className="px-2 text-white text-sm truncate">
                        {task.name}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 absolute top-full left-0 mt-2 p-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
                        <div className="font-medium">{task.name}</div>
                        <div>Time: {task.start.toLocaleTimeString()} - {task.end.toLocaleTimeString()}</div>
                        <div>Details: {task.details}</div>
                        <div>Resources: {task.resources}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// BakerView Component
const BakerView = ({ selectedBaker }) => {
  const [selectedDate, setSelectedDate] = useState('2025-01-06');

  const BAKER_TASKS = {
    'Baker1': {
      '2025-01-06': [
        {
          time: '08:00-08:30',
          action: 'Mix Cookie Dough',
          details: '16 cookies total',
          equipment: 'Mixer1',
          status: 'pending',
          dependencies: [
            {
              from: 'Baker2',
              what: 'Coordinate oven use at 8:30',
              urgent: true
            }
          ]
        }
      ]
    }
  };

  return (
    <div className="p-4">
      <div className="space-y-4">
        {BAKER_TASKS[selectedBaker]?.[selectedDate]?.map((task, index) => (
          <div
            key={index}
            className="border-l-4 border-gray-300 rounded-lg p-4 bg-gray-50"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="font-medium">{task.time}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <ChefHat className="w-4 h-4" />
                <span>{task.equipment}</span>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mb-1">{task.action}</h3>
            <p className="text-gray-600 mb-2">{task.details}</p>

            {task.dependencies?.map((dep, i) => (
              <div
                key={i}
                className="flex items-center space-x-2 text-sm p-2 bg-yellow-50 rounded mt-2"
              >
                <ArrowRight className="w-4 h-4" />
                <span>{dep.what}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Dashboard Component
const BakeryDashboard = () => {
  const [viewMode, setViewMode] = useState('manager');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Bakery Production Dashboard</h1>
            </div>
            
            <div className="flex space-x-2 items-center">
              <button
                onClick={() => setViewMode('new-order')}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  viewMode === 'new-order' ? 'bg-blue-500 text-white' : 'bg-gray-100'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Order</span>
              </button>
              <button
                onClick={() => setViewMode('manager')}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  viewMode === 'manager' ? 'bg-blue-500 text-white' : 'bg-gray-100'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule</span>
              </button>
              <button
                onClick={() => setViewMode('baker1')}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  viewMode === 'baker1' ? 'bg-blue-500 text-white' : 'bg-gray-100'
                }`}
              >
                <ChefHat className="w-4 h-4" />
                <span>Baker 1</span>
              </button>
              <button
                onClick={() => setViewMode('baker2')}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  viewMode === 'baker2' ? 'bg-blue-500 text-white' : 'bg-gray-100'
                }`}
              >
                <ChefHat className="w-4 h-4" />
                <span>Baker 2</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {viewMode === 'new-order' ? (
          <OrderForm />
        ) : viewMode === 'manager' ? (
          <GanttView />
        ) : (
          <BakerView selectedBaker={viewMode === 'baker1' ? 'Baker1' : 'Baker2'} />
        )}
      </div>

      {/* Status Bar */}
      <div className="fixed bottom-0 w-full bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Logged in as: {viewMode === 'manager' ? 'Manager' : viewMode === 'baker1' ? 'Baker 1' : 'Baker 2'}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BakeryDashboard;
