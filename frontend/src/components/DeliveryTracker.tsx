import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { MapPin, Clock, User, Phone, MessageCircle, FileText, AlertCircle, RefreshCw } from "lucide-react"
import { bakeryApi } from "../api/api"

// Simple API function for delivery tracking
const deliveryApi = {
  async getDeliveryTracking(orderId: string) {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8001'}/delivery/tracking/${orderId}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  }
}

interface DeliveryData {
  order_id: string
  status: "pending" | "picked_up" | "in_transit" | "delivered"
  current_location?: {
    lat: number
    lng: number
  }
  estimated_arrival?: string
  actual_arrival?: string
  tracking_code?: string
  agent?: {
    name: string
    phone: string
  }
  customer?: {
    name: string
    address: string
    phone: string
  }
}

interface DeliveryTrackerProps {
  selectedDelivery?: string | null
}

const statusSteps = [
  { key: "pending", label: "Order Placed", icon: "📋" },
  { key: "picked_up", label: "Picked Up", icon: "📦" },
  { key: "in_transit", label: "In Transit", icon: "🚚" },
  { key: "delivered", label: "Delivered", icon: "✅" },
]

export function DeliveryTracker({ selectedDelivery }: DeliveryTrackerProps) {
  const [deliveryData, setDeliveryData] = useState<DeliveryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDeliveryData = async () => {
    if (!selectedDelivery) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await deliveryApi.getDeliveryTracking(selectedDelivery)
      setDeliveryData(response)
    } catch (err) {
      setError("Failed to fetch delivery data")
      console.error("Error fetching delivery data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeliveryData()
  }, [selectedDelivery])

  const getStatusIndex = (status: string) => {
    return statusSteps.findIndex((step) => step.key === status)
  }

  const currentStatusIndex = deliveryData ? getStatusIndex(deliveryData.status) : -1

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-500"
      case "in_transit":
        return "bg-blue-500"
      case "picked_up":
        return "bg-yellow-500"
      case "pending":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  if (!selectedDelivery) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Select a delivery to track</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !deliveryData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">{error || "No delivery data found"}</p>
          <Button onClick={fetchDeliveryData} variant="outline" className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            {statusSteps.map((step, index) => (
              <div key={step.key} className="flex flex-col items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg mb-2 ${
                    index <= currentStatusIndex ? getStatusColor(deliveryData.status) : "bg-gray-300"
                  }`}
                >
                  {step.icon}
                </div>
                <span
                  className={`text-sm font-medium text-center ${
                    index <= currentStatusIndex ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
                {index < statusSteps.length - 1 && (
                  <div
                    className={`h-1 w-full mt-2 ${
                      index < currentStatusIndex ? getStatusColor(deliveryData.status) : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map and Support Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map Placeholder */}
          <Card>
            <CardContent className="p-6">
              <div className="bg-teal-100 rounded-lg h-80 flex items-center justify-center mb-6">
                <div className="text-center">
                  <MapPin className="h-16 w-16 text-teal-600 mx-auto mb-4" />
                  <p className="text-teal-800 font-medium">Live GPS Tracking</p>
                  <p className="text-teal-600 text-sm">
                    {deliveryData.current_location 
                      ? `Current location: ${deliveryData.current_location.lat.toFixed(4)}, ${deliveryData.current_location.lng.toFixed(4)}`
                      : "Delivery route and real-time location"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support Links and Delivery Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Help with this order
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Start a chat
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <FileText className="h-4 w-4 mr-2" />
                  View invoice
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <FileText className="h-4 w-4 mr-2" />
                  Terms & Conditions
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Delivery Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {deliveryData.agent && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery Agent</span>
                      <span className="font-medium">{deliveryData.agent.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contact</span>
                      <span className="font-medium">{deliveryData.agent.phone}</span>
                    </div>
                  </>
                )}
                {deliveryData.tracking_code && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tracking Code</span>
                    <span className="font-medium font-mono">{deliveryData.tracking_code}</span>
                  </div>
                )}
                {deliveryData.customer && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer Contact</span>
                    <span className="font-medium">{deliveryData.customer.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Order Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>#{deliveryData.order_id}</CardTitle>
                <Badge className={getStatusColor(deliveryData.status)}>
                  {deliveryData.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {deliveryData.customer && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{deliveryData.customer.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{deliveryData.customer.address}</p>
                </div>
              )}

              <div className="space-y-3">
                {deliveryData.estimated_arrival && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      ETA
                    </span>
                    <span className="font-medium">
                      {new Date(deliveryData.estimated_arrival).toLocaleTimeString()}
                    </span>
                  </div>
                )}
                {deliveryData.actual_arrival && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivered At</span>
                    <span className="font-medium">
                      {new Date(deliveryData.actual_arrival).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>

              <Button 
                onClick={fetchDeliveryData} 
                className="w-full mt-6 bg-transparent" 
                variant="outline"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Status
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
