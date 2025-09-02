import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Calendar, 
  BarChart2, 
  AlertCircle,
  CheckCircle,
  Play,
  Pause,
  Factory,
  ChefHat,
  Package,
  Truck,
  User,
  TrendingUp,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { bakeryApi } from '../api/api';
import { ScheduledTask, PRODUCTION_STEPS, VIEW_MODES, STEP_COLORS, STEP_HOVER_COLORS } from '../types';

type TimelineScale = "hours" | "halfDay" | "day" | "week" | "month" | "quarter" | "year";
type ViewMode = "workCenter" | "task" | "salesOrder" | "customer" | "deliveryDate" | "orderDate" | "manufacturingOrder" | "ingredients" | "products" | "workstations" | "assignees" | "recipeSteps";

interface TaskInstance {
  id: string;
  taskName: string;
  category: "baking" | "prep" | "delivery";
  startTime: number;
  duration: number;
  assignee: string;
  priority: "high" | "medium" | "low";
  workCenter: string;
  instanceId: string;
  salesOrder: string;
  customer: string;
  deliveryDate: string;
  orderDate: string;
  manufacturingOrder: string;
  ingredients: string[];
  product: string;
  workstation: string;
  recipeStep: string;
  orderId?: string;
  taskId?: string;
  status?: "pending" | "in_progress" | "completed" | "delayed";
  estimatedDuration?: number;
  actualDuration?: number;
  resourceId?: string;
  recipeId?: string;
  quantity?: number;
  notes?: string;
}

interface ResourceUtilization {
  resource: string;
  utilization_percentage: number;
  busy_minutes: number;
  total_minutes: number;
}

interface DailyScheduleSummary {
  date: string;
  total_orders: number;
  total_tasks: number;
  resource_utilization: ResourceUtilization[];
  start_time?: Date;
  end_time?: Date;
}

const ConsolidatedScheduleView: React.FC = () => {
  // State for schedule data
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentView, setCurrentView] = useState<keyof typeof VIEW_MODES>('Day');
  const [schedule, setSchedule] = useState<ScheduledTask[]>([]);
  const [scheduleSummary, setScheduleSummary] = useState<DailyScheduleSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for Gantt chart
  const [timelineScale, setTimelineScale] = useState<TimelineScale>("day");
  const [viewMode, setViewMode] = useState<ViewMode>("workCenter");
  const [selectedTask, setSelectedTask] = useState<TaskInstance | null>(null);
  const [taskInstances, setTaskInstances] = useState<TaskInstance[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [bakerTasks, setBakerTasks] = useState<any[]>([]);

  // Refs
  const timelineRef = useRef<HTMLDivElement>(null);

  // Load schedule data
  useEffect(() => {
    const fetchScheduleData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await bakeryApi.getSchedule(selectedDate, true);
        if (response && response.schedule) {
          const validatedSchedule = response.schedule.map((task, index) => ({
            id: task.id || task.orderId || `task-${index}`,
            orderId: task.orderId || `unknown-${index}`,
            step: task.step || '',
            startTime: task.startTime instanceof Date 
              ? task.startTime 
              : new Date(task.startTime || Date.now()),
            endTime: task.endTime instanceof Date 
              ? task.endTime 
              : new Date(task.endTime || Date.now()),
            resources: Array.isArray(task.resources) ? task.resources : [],
            batchSize: task.batchSize || 0,
            status: task.status || 'pending'
          }));
          setSchedule(validatedSchedule);
          
          // Set schedule summary if available
          if (response.summary) {
            setScheduleSummary({
              date: selectedDate,
              total_orders: response.summary.total_orders,
              total_tasks: response.summary.total_tasks,
              resource_utilization: response.summary.resource_utilization,
              start_time: new Date(`${selectedDate}T06:00:00`),
              end_time: new Date(`${selectedDate}T18:00:00`)
            });
          }
        } else {
          setSchedule([]);
          setScheduleSummary(null);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load schedule. Please try again later.');
        setSchedule([]);
        setScheduleSummary(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScheduleData();
  }, [selectedDate, currentView]);

  // Load Gantt data
  useEffect(() => {
    const fetchGanttData = async () => {
      try {
        const [ordersData, scheduleData, tasksData] = await Promise.all([
          bakeryApi.getOrders(),
          bakeryApi.getSchedule(selectedDate),
          bakeryApi.getBakerTasks('all')
        ]);

        setOrders(ordersData || []);
        setScheduledTasks(scheduleData.schedule || scheduleData);
        setBakerTasks(tasksData.items || []);
        
        // Generate task instances from scheduled tasks
        const instances: TaskInstance[] = scheduleData.schedule?.map((task, index) => {
          const duration = task.duration || Math.round((task.endTime.getTime() - task.startTime.getTime()) / (1000 * 60));
          
          return {
            id: task.id || `task-${index}`,
            taskName: task.step || 'Unknown Task',
            category: 'baking',
            startTime: new Date(task.startTime).getHours(),
            duration: duration,
            assignee: task.resources?.[0] || 'Unassigned',
            priority: 'medium',
            workCenter: task.resources?.[0] || 'Unknown',
            instanceId: `${task.id}-${index}`,
            salesOrder: task.orderId || 'Unknown',
            customer: 'Customer',
            deliveryDate: selectedDate,
            orderDate: selectedDate,
            manufacturingOrder: task.orderId || 'Unknown',
            ingredients: [],
            product: task.step || 'Unknown',
            workstation: task.resources?.[0] || 'Unknown',
            recipeStep: task.step || 'Unknown',
            orderId: task.orderId,
            taskId: task.id,
            status: task.status as any,
            estimatedDuration: duration,
            actualDuration: duration,
            resourceId: task.resources?.[0],
            quantity: task.batchSize
          };
        }) || [];

        setTaskInstances(instances);
      } catch (error) {
        console.error('Error loading Gantt data:', error);
        setTaskInstances([]);
        setScheduledTasks([]);
        setOrders([]);
        setBakerTasks([]);
      }
    };

    fetchGanttData();
  }, [selectedDate]);

  // Navigation functions
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

  // Utility functions
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

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-orange-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUtilizationStatus = (percentage: number) => {
    if (percentage >= 90) return { icon: AlertTriangle, text: 'Critical', color: 'text-red-600' };
    if (percentage >= 75) return { icon: TrendingUp, text: 'High', color: 'text-orange-600' };
    if (percentage >= 60) return { icon: Activity, text: 'Moderate', color: 'text-yellow-600' };
    return { icon: CheckCircle, text: 'Optimal', color: 'text-green-600' };
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <Play className="w-4 h-4 text-blue-600" />;
      case 'delayed': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resource Utilization Summary */}
      {scheduleSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{scheduleSummary.total_orders}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <Factory className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{scheduleSummary.total_tasks}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {scheduleSummary.resource_utilization.length > 0
                  ? Math.round(
                      scheduleSummary.resource_utilization.reduce(
                        (sum, resource) => sum + resource.utilization_percentage,
                        0
                      ) / scheduleSummary.resource_utilization.length
                    )
                  : 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Work Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {scheduleSummary.start_time && scheduleSummary.end_time
                  ? `${scheduleSummary.start_time} - ${scheduleSummary.end_time}`
                  : 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resource Utilization Details */}
      {scheduleSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Resource Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scheduleSummary.resource_utilization.map((resource) => {
                const status = getUtilizationStatus(resource.utilization_percentage);
                const StatusIcon = status.icon;
                
                return (
                  <div key={resource.resource} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <StatusIcon className={`w-5 h-5 ${status.color}`} />
                      <div>
                        <p className="font-medium">{resource.resource}</p>
                                                 <p className="text-sm text-gray-500">
                           {formatDuration(resource.busy_minutes)} / {formatDuration(resource.total_minutes)}
                         </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Progress 
                        value={resource.utilization_percentage} 
                        className="w-32"
                      />
                      <span className={`font-medium ${getUtilizationColor(resource.utilization_percentage)}`}>
                        {Math.round(resource.utilization_percentage)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline View */}
      <Card>
        <CardHeader>
          <CardTitle>Production Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-96 overflow-x-auto">
            {/* Time markers */}
            <div className="flex border-b border-gray-200 mb-4">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="flex-1 text-center text-xs text-gray-500 py-2 border-r border-gray-100">
                  {i.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Production steps */}
            <div className="space-y-2">
              {PRODUCTION_STEPS.map((step) => (
                <div key={step} className="flex items-center space-x-4">
                  <div className="w-32 text-sm font-medium">{step}</div>
                  <div className="flex-1 relative h-8 bg-gray-100 rounded">
                    {schedule.filter(task => task.step === step).map((task, taskIndex) => {
                      const startPos = timeToPosition(task.startTime);
                      const endPos = timeToPosition(task.endTime);
                      const width = endPos - startPos;
                      
                      return (
                        <div
                          key={`${task.id}-${taskIndex}`}
                          className={`absolute h-6 top-1 rounded px-2 text-xs text-white flex items-center justify-center cursor-pointer transition-all hover:scale-105 ${
                            STEP_COLORS[step] || 'bg-blue-500'
                          }`}
                          style={{
                            left: `${startPos}%`,
                            width: `${width}%`,
                            minWidth: '60px'
                          }}
                          title={`${task.step} - ${formatTime(task.startTime)} to ${formatTime(task.endTime)}`}
                        >
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(task.status)}
                            <span className="truncate">{task.orderId}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {schedule.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(task.status)}
                  <div>
                    <p className="font-medium">{task.step}</p>
                    <p className="text-sm text-gray-500">Order: {task.orderId}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge className={getStatusColor(task.status)}>
                    {task.status}
                  </Badge>
                  <div className="text-sm text-gray-500">
                    {formatTime(task.startTime)} - {formatTime(task.endTime)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Batch: {task.batchSize}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsolidatedScheduleView;
