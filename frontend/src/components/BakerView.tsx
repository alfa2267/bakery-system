import React, { useState, useEffect } from 'react';
import { Clock, ChefHat, ArrowRight } from 'lucide-react';
import { bakeryApi } from '../api/bakeryApi';
import { ScheduledTask, TaskStatus } from '../types';

interface BakerViewProps {
  selectedBaker: 'Baker1' | 'Baker2';
}

const BakerView: React.FC<BakerViewProps> = ({ selectedBaker }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleString().split('T')[0]);
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await bakeryApi.getResources(selectedDate, selectedBaker);
        
        // Ensure tasks is an array, default to empty array if undefined
        const tasksData = response?.task_resources || [];
        setTasks(tasksData);
      } catch (err) {
        console.error('Error fetching baker tasks:', err);
        
        const errorMessage = err instanceof Error 
          ? `Failed to load baker tasks: ${err.message}` 
          : 'Failed to load baker tasks due to an unknown error';
        
        setError(errorMessage);
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [selectedDate, selectedBaker]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      // Optimistic update
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      );
      
      setTasks(updatedTasks);

      // API call to update status
      await bakeryApi.updateTaskStatus(taskId, newStatus);
    } catch (err) {
      console.error('Error updating task status:', err);
      
      // Revert optimistic update if API call fails
      try {
        const response = await bakeryApi.getResources(selectedDate, selectedBaker);
        const tasksData = response?.task_resources || [];
        setTasks(tasksData);
      } catch (fetchErr) {
        console.error('Error refetching tasks:', fetchErr);
        setTasks([]);
      }
    }
  };

  const getStatusColor = (status: TaskStatus | undefined) => {
    switch(status) {
      case 'completed': return 'bg-green-100 border-green-500';
      case 'in-progress': return 'bg-blue-100 border-blue-500';
      case 'blocked': return 'bg-red-100 border-red-500';
      default: return 'bg-gray-50 border-gray-300';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
        <p>{error}</p>
        <p>Please check your backend connection and try again.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Date Selection */}
      <div className="mb-6 flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Select Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          No tasks scheduled for {selectedBaker} on {selectedDate}
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className={`border rounded-lg p-4 ${getStatusColor(task.status)} relative`}
            >
              {/* Task Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <ChefHat size={20} className="text-gray-600" />
                  <h3 className="font-semibold text-lg">{task.name || task.step}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-600">{formatTime(task.startTime)}</span>
                </div>
              </div>

              {/* Task Details */}
              <div className="mb-2">
                <p className="text-sm text-gray-700">Batch Size: {task.batchSize}</p>
                <p className="text-sm text-gray-700">Product: {task.product?.name}</p>
                <p className="text-sm text-gray-500">Step: {task.step}</p>
                {task.resources.length > 0 && (
                  <p className="text-sm text-gray-500">Equipment: {task.resources.join(', ')}</p>
                )}
              </div>

              {/* Dependencies */}
              {task.dependencies && (
                <div className="mt-2 border-t pt-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <ArrowRight size={16} className="mr-2" />
                    <span>Dependencies: {task.dependencies}</span>
                  </div>
                </div>
              )}

              {/* Status Selector */}
              <div className="mt-2">
                <select 
                  value={task.status || 'pending'}
                  onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                  className="w-full p-1 border rounded text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BakerView;