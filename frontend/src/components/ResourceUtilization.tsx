import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Clock, Activity, TrendingUp, AlertTriangle, CheckCircle, Factory, Users } from 'lucide-react';
import { bakeryApi } from '../api/api';

interface ResourceUtilization {
  resource: string;
  resource_type: 'equipment' | 'staff';
  utilization_percentage: number;
  busy_minutes: number;
  total_minutes: number;
  role?: string; // For staff resources
  equipment_type?: string; // For equipment resources
}

interface DailyScheduleSummary {
  date: string;
  total_orders: number;
  total_tasks: number;
  resource_utilization: ResourceUtilization[];
  start_time?: Date;
  end_time?: Date;
}

interface ResourceUtilizationDashboardProps {
  selectedDate?: string;
}

export function ResourceUtilizationDashboard({ selectedDate: propSelectedDate }: ResourceUtilizationDashboardProps) {
  const [scheduleSummary, setScheduleSummary] = useState<DailyScheduleSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState(propSelectedDate || new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    loadResourceData();
  }, [selectedDate, timeRange]);

    const loadResourceData = async () => {
    setLoading(true);
    try {
      // Fetch real data from the API
      const scheduleResponse = await bakeryApi.getSchedule(selectedDate, true);
      
      if (scheduleResponse.summary) {
        // Transform API data to match our interface
        const transformedData: DailyScheduleSummary = {
          date: selectedDate,
          total_orders: scheduleResponse.summary.total_orders,
          total_tasks: scheduleResponse.summary.total_tasks,
          start_time: scheduleResponse.summary.start_time ? new Date(scheduleResponse.summary.start_time) : undefined,
          end_time: scheduleResponse.summary.end_time ? new Date(scheduleResponse.summary.end_time) : undefined,
          resource_utilization: scheduleResponse.summary.resource_utilization.map(resource => ({
            resource: resource.resource,
            resource_type: resource.resource.includes('Oven') || resource.resource.includes('Mixer') || 
                          resource.resource.includes('Station') || resource.resource.includes('Room') ? 'equipment' : 'staff',
            utilization_percentage: resource.utilization_percentage,
            busy_minutes: resource.busy_minutes,
            total_minutes: resource.total_minutes,
            role: resource.resource.includes('Oven') || resource.resource.includes('Mixer') || 
                  resource.resource.includes('Station') || resource.resource.includes('Room') ? undefined : 'Baker',
            equipment_type: resource.resource.includes('Oven') ? 'Oven' : 
                           resource.resource.includes('Mixer') ? 'Mixer' : 
                           resource.resource.includes('Station') ? 'Work Station' : 
                           resource.resource.includes('Room') ? 'Storage' : undefined
          }))
        };
        setScheduleSummary(transformedData);
      } else {
        // Fallback to sample data if no real data available
        const sampleData: DailyScheduleSummary = {
          date: selectedDate,
          total_orders: 12,
          total_tasks: 48,
          start_time: new Date(`${selectedDate}T06:00:00`),
          end_time: new Date(`${selectedDate}T18:00:00`),
          resource_utilization: [
            {
              resource: 'Main Oven',
              resource_type: 'equipment',
              utilization_percentage: 85.5,
              busy_minutes: 513,
              total_minutes: 600
            },
            {
              resource: 'Mixer 1',
              resource_type: 'equipment',
              utilization_percentage: 72.3,
              busy_minutes: 434,
              total_minutes: 600
            },
            {
              resource: 'Prep Station Alpha',
              resource_type: 'equipment',
              utilization_percentage: 91.2,
              busy_minutes: 547,
              total_minutes: 600
            },
            {
              resource: 'Packaging Station',
              resource_type: 'equipment',
              utilization_percentage: 45.8,
              busy_minutes: 275,
              total_minutes: 600
            },
            {
              resource: 'Cold Room',
              resource_type: 'equipment',
              utilization_percentage: 33.3,
              busy_minutes: 200,
              total_minutes: 600
            },
            {
              resource: 'John Doe',
              resource_type: 'staff',
              utilization_percentage: 70.0,
              busy_minutes: 420,
              total_minutes: 600,
              role: 'Baker'
            },
            {
              resource: 'Jane Smith',
              resource_type: 'staff',
              utilization_percentage: 65.0,
              busy_minutes: 390,
              total_minutes: 600,
              role: 'Packager'
            }
          ]
        };
        setScheduleSummary(sampleData);
      }
    } catch (error) {
      console.error('Failed to load resource data:', error);
      // Use sample data as fallback
      const sampleData: DailyScheduleSummary = {
        date: selectedDate,
        total_orders: 12,
        total_tasks: 48,
        start_time: new Date(`${selectedDate}T06:00:00`),
        end_time: new Date(`${selectedDate}T18:00:00`),
        resource_utilization: [
          {
            resource: 'Main Oven',
            resource_type: 'equipment',
            utilization_percentage: 85.5,
            busy_minutes: 513,
            total_minutes: 600
          },
          {
            resource: 'Mixer 1',
            resource_type: 'equipment',
            utilization_percentage: 72.3,
            busy_minutes: 434,
            total_minutes: 600
          },
          {
            resource: 'Prep Station Alpha',
            resource_type: 'equipment',
            utilization_percentage: 91.2,
            busy_minutes: 547,
            total_minutes: 600
          },
          {
            resource: 'Packaging Station',
            resource_type: 'equipment',
            utilization_percentage: 45.8,
            busy_minutes: 275,
            total_minutes: 600
          },
          {
            resource: 'Cold Room',
            resource_type: 'equipment',
            utilization_percentage: 33.3,
            busy_minutes: 200,
            total_minutes: 600
          },
          {
            resource: 'John Doe',
            resource_type: 'staff',
            utilization_percentage: 70.0,
            busy_minutes: 420,
            total_minutes: 600,
            role: 'Baker'
          },
          {
            resource: 'Jane Smith',
            resource_type: 'staff',
            utilization_percentage: 65.0,
            busy_minutes: 390,
            total_minutes: 600,
            role: 'Packager'
          }
        ]
      };
      setScheduleSummary(sampleData);
    } finally {
      setLoading(false);
    }
  };

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

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getEfficiencyScore = () => {
    if (!scheduleSummary) return 0;
    const avgUtilization = scheduleSummary.resource_utilization.reduce(
      (sum, resource) => sum + resource.utilization_percentage, 0
    ) / scheduleSummary.resource_utilization.length;
    return Math.round(avgUtilization);
  };

  const getBottleneckResources = () => {
    if (!scheduleSummary) return [];
    return scheduleSummary.resource_utilization
      .filter(resource => resource.utilization_percentage >= 90)
      .sort((a, b) => b.utilization_percentage - a.utilization_percentage);
  };

  const getUnderutilizedResources = () => {
    if (!scheduleSummary) return [];
    return scheduleSummary.resource_utilization
      .filter(resource => resource.utilization_percentage < 50)
      .sort((a, b) => a.utilization_percentage - b.utilization_percentage);
  };

  const getEquipmentResources = () => {
    if (!scheduleSummary) return [];
    return scheduleSummary.resource_utilization
      .filter(resource => resource.resource_type === 'equipment')
      .sort((a, b) => b.utilization_percentage - a.utilization_percentage);
  };

  const getStaffResources = () => {
    if (!scheduleSummary) return [];
    return scheduleSummary.resource_utilization
      .filter(resource => resource.resource_type === 'staff')
      .sort((a, b) => b.utilization_percentage - a.utilization_percentage);
  };

  const getBottleneckEquipment = () => {
    return getEquipmentResources().filter(resource => resource.utilization_percentage >= 90);
  };

  const getBottleneckStaff = () => {
    return getStaffResources().filter(resource => resource.utilization_percentage >= 90);
  };

  const getUnderutilizedEquipment = () => {
    return getEquipmentResources().filter(resource => resource.utilization_percentage < 50);
  };

  const getUnderutilizedStaff = () => {
    return getStaffResources().filter(resource => resource.utilization_percentage < 50);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading resource data...</p>
        </div>
      </div>
    );
  }

  if (!scheduleSummary) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No resource data available</p>
      </div>
    );
  }

  const efficiencyScore = getEfficiencyScore();
  const bottlenecks = getBottleneckResources();
  const underutilized = getUnderutilizedResources();
  const equipmentResources = getEquipmentResources();
  const staffResources = getStaffResources();
  const bottleneckEquipment = getBottleneckEquipment();
  const bottleneckStaff = getBottleneckStaff();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Efficiency Score</p>
                <p className="text-2xl font-bold">{efficiencyScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{scheduleSummary.total_orders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold">{scheduleSummary.total_tasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Equipment Bottlenecks</p>
                <p className="text-2xl font-bold">{bottleneckEquipment.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-sm text-gray-600">Staff Bottlenecks</p>
                <p className="text-2xl font-bold">{bottleneckStaff.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Total Bottlenecks</p>
                <p className="text-2xl font-bold">{bottlenecks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" />
              Equipment Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {equipmentResources.map((resource) => {
                const status = getUtilizationStatus(resource.utilization_percentage);
                const StatusIcon = status.icon;
                
                return (
                  <div key={resource.resource} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{resource.resource}</span>
                        <Badge variant="outline" className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.text}
                        </Badge>
                      </div>
                      <span className={`font-semibold ${getUtilizationColor(resource.utilization_percentage)}`}>
                        {resource.utilization_percentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={resource.utilization_percentage} className="h-2" />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Busy: {formatTime(resource.busy_minutes)}</span>
                      <span>Total: {formatTime(resource.total_minutes)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Staff Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {staffResources.map((resource) => {
                const status = getUtilizationStatus(resource.utilization_percentage);
                const StatusIcon = status.icon;
                
                return (
                  <div key={resource.resource} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{resource.resource}</span>
                        <Badge variant="outline" className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.text}
                        </Badge>
                      </div>
                      <span className={`font-semibold ${getUtilizationColor(resource.utilization_percentage)}`}>
                        {resource.utilization_percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Role:</span> {resource.role}
                    </div>
                    <Progress value={resource.utilization_percentage} className="h-2" />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Busy: {formatTime(resource.busy_minutes)}</span>
                      <span>Total: {formatTime(resource.total_minutes)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Recommendations */}
      <div className="space-y-6">
        {/* Equipment Bottlenecks */}
        {bottleneckEquipment.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Factory className="h-5 w-5" />
                Equipment Bottlenecks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bottleneckEquipment.map((resource) => (
                  <div key={resource.resource} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{resource.resource}</span>
                      <span className="text-red-600 font-semibold">
                        {resource.utilization_percentage.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      Equipment is at critical capacity. Consider adding equipment or optimizing scheduling.
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Staff Bottlenecks */}
        {bottleneckStaff.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Users className="h-5 w-5" />
                Staff Bottlenecks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bottleneckStaff.map((resource) => (
                  <div key={resource.resource} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{resource.resource}</span>
                      <span className="text-red-600 font-semibold">
                        {resource.utilization_percentage.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      Staff member is overworked. Consider adding staff or redistributing workload.
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Underutilized Equipment */}
        {getUnderutilizedEquipment().length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <Factory className="h-5 w-5" />
                Underutilized Equipment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getUnderutilizedEquipment().map((resource) => (
                  <div key={resource.resource} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{resource.resource}</span>
                      <span className="text-yellow-600 font-semibold">
                        {resource.utilization_percentage.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Equipment is underutilized. Consider consolidating tasks or reducing capacity.
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Underutilized Staff */}
        {getUnderutilizedStaff().length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <Users className="h-5 w-5" />
                Underutilized Staff
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getUnderutilizedStaff().map((resource) => (
                  <div key={resource.resource} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{resource.resource}</span>
                      <span className="text-yellow-600 font-semibold">
                        {resource.utilization_percentage.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Staff member has low utilization. Consider redistributing tasks or reducing hours.
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {efficiencyScore < 70 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Overall efficiency is below target. Consider reviewing task scheduling and resource allocation.
                  </p>
                </div>
              )}
              {bottlenecks.length === 0 && underutilized.length === 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    Excellent resource utilization! All resources are operating within optimal ranges.
                  </p>
                </div>
              )}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  Next scheduled maintenance: {scheduleSummary.start_time?.toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
