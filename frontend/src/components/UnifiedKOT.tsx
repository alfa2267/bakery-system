import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Circle, 
  Play, 
  Users, 
  Activity,
  Factory,
  ChefHat,
  Package,
  Truck
} from "lucide-react"
import { bakeryApi } from "../api/api"
import type { ScheduledTask, BakerTask, Order } from "../types"

interface UnifiedKOTProps {
  defaultView?: 'manager' | 'workstation';
  workstation?: string;
  selectedDate?: string;
}

export function UnifiedKOT({ defaultView = 'manager', workstation = 'oven_main', selectedDate: propSelectedDate }: UnifiedKOTProps) {
  // Shared state
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [bakerTasks, setBakerTasks] = useState<BakerTask[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(propSelectedDate || new Date().toISOString().split('T')[0])
  const [currentWorkstation, setCurrentWorkstation] = useState(workstation)
  const [activeView, setActiveView] = useState(defaultView)

  useEffect(() => {
    loadAllData()
  }, [selectedDate, currentWorkstation])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [scheduleData, bakerData, ordersData] = await Promise.all([
        bakeryApi.getSchedule(selectedDate),
        bakeryApi.getBakerTasks(),
        bakeryApi.getOrders(),
      ])

      setTasks(scheduleData.schedule)
      setBakerTasks(bakerData.tasks)
      setOrders(ordersData)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Workstation-specific filtering
  const getWorkstationTasks = () => {
    return tasks.filter((task) =>
      task.resources.some((resource) => resource.includes(currentWorkstation.toLowerCase()))
    )
  }

  const getWorkstationBakerTasks = () => {
    return bakerTasks.filter((task) =>
      task.equipment?.includes(currentWorkstation.toLowerCase())
    )
  }

  // Manager-specific functions
  const getWorkstations = () => {
    const workstations = new Set<string>()
    tasks.forEach((task) => {
      task.resources.forEach((resource: string) => {
        if (resource.includes("oven") || resource.includes("mixer") || resource.includes("prep")) {
          workstations.add(resource)
        }
      })
    })
    return Array.from(workstations)
  }

  const getTasksForWorkstation = (workstation: string) => {
    return tasks.filter((task) => task.resources.some((resource: string) => resource === workstation))
  }

  // Shared utility functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in_progress":
        return <Play className="h-4 w-4 text-blue-500" />
      case "pending":
        return <Circle className="h-4 w-4 text-gray-400" />
      case "blocked":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-gray-100 text-gray-800"
      case "blocked":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getOrderStatusCounts = () => {
    const counts = { confirmed: 0, in_progress: 0, completed: 0, pending: 0 }
    orders.forEach((order) => {
      if (counts.hasOwnProperty(order.status)) {
        counts[order.status as keyof typeof counts]++
      }
    })
    return counts
  }

  const getTaskStatusCounts = () => {
    const counts = { completed: 0, in_progress: 0, pending: 0, blocked: 0 }
    tasks.forEach((task) => {
      if (counts.hasOwnProperty(task.status)) {
        counts[task.status as keyof typeof counts]++
      }
    })
    return counts
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading data...</p>
        </div>
      </div>
    )
  }

  const workstations = getWorkstations()
  const orderCounts = getOrderStatusCounts()
  const taskCounts = getTaskStatusCounts()

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{orders.length}</p>
            <div className="text-xs text-muted-foreground">
              {orderCounts.confirmed} confirmed, {orderCounts.in_progress} in progress
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{tasks.length}</p>
            <div className="text-xs text-muted-foreground">
              {taskCounts.completed} completed, {taskCounts.in_progress} in progress
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Baker Tasks</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{bakerTasks.length}</p>
            <div className="text-xs text-muted-foreground">
              Active tasks for bakers
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workstations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{workstations.length}</p>
            <div className="text-xs text-muted-foreground">
              Active workstations
            </div>
          </CardContent>
        </Card>
      </div>

      {activeView === 'manager' ? (
        <div className="space-y-6">
          {/* Manager View */}
          {/* Workstation Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Workstation Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workstations.map((workstation) => {
                  const workstationTasks = getTasksForWorkstation(workstation)
                  const activeTasks = workstationTasks.filter(task => task.status === 'in_progress')
                  const completedTasks = workstationTasks.filter(task => task.status === 'completed')
                  
                  return (
                    <div key={workstation} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{workstation}</h3>
                        <Badge variant="outline">{workstationTasks.length} tasks</Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Active:</span>
                          <span className="text-blue-600">{activeTasks.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Completed:</span>
                          <span className="text-green-600">{completedTasks.length}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.slice(0, 10).map((task, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(task.status)}
                      <div>
                        <div className="font-medium">{task.step}</div>
                        <div className="text-sm text-gray-500">
                          Order: {task.orderId} • {formatTime(task.startTime)}
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Workstation View */}
          {/* Workstation Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Workstation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {workstations.map((ws) => (
                  <Button
                    key={ws}
                    variant={currentWorkstation === ws ? "default" : "outline"}
                    onClick={() => setCurrentWorkstation(ws)}
                    size="sm"
                  >
                    {ws}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Current Tasks for Selected Workstation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Current Production Tasks - {currentWorkstation}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getWorkstationTasks().length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No tasks scheduled for this workstation</p>
                ) : (
                  getWorkstationTasks().map((task, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(task.status)}
                          <span className="font-medium">Order #{task.orderId}</span>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTime(task.startTime)} - {formatTime(task.endTime)}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p><strong>Step:</strong> {task.step}</p>
                        <p><strong>Batch Size:</strong> {task.batchSize}</p>
                        <p><strong>Resources:</strong> {task.resources.join(", ")}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Baker Tasks for Selected Workstation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Baker Tasks - {currentWorkstation}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getWorkstationBakerTasks().length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No baker tasks for this workstation</p>
                ) : (
                  getWorkstationBakerTasks().map((task, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(task.status)}
                          <span className="font-medium">{task.action}</span>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTime(task.time)}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p><strong>Details:</strong> {task.details}</p>
                        <p><strong>Equipment:</strong> {task.equipment}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
