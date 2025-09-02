import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { MapPin, Clock, User, Phone, MessageCircle, FileText, AlertCircle } from "lucide-react"

interface DeliveryData {
  orderId: string
  status: "order_placed" | "confirmed" | "preparation" | "dispatched" | "delivered"
  customer: {
    name: string
    address: string
    phone: string
    notes: string
  }
  delivery: {
    agent: string
    carrier: string
    vehicle: string
    estimatedArrival: string
    requestedDate: string
  }
  items: Array<{
    name: string
    quantity: number
    notes?: string
  }>
}

interface DeliveryTrackerProps {
  selectedDelivery?: string | null
}

const sampleDeliveryData: DeliveryData = {
  orderId: "SO-2024-001",
  status: "dispatched",
  customer: {
    name: "Downtown Cafe",
    address: "123 Main Street, Downtown District, City Center",
    phone: "+1 (555) 123-4567",
    notes:
      "Please use the back entrance for deliveries. Contact manager Sarah if main door is locked. Delivery window: 8AM-10AM preferred.",
  },
  delivery: {
    agent: "Pierre Martin",
    carrier: "Bakery Express",
    vehicle: "Van #001 (Refrigerated)",
    estimatedArrival: "09:30",
    requestedDate: "15/01/2024",
  },
  items: [
    { name: "Artisan Sourdough Loaf", quantity: 12 },
    { name: "Butter Croissants", quantity: 24 },
    { name: "Pain au Chocolat", quantity: 18, notes: "Extra chocolate requested" },
  ],
}

const statusSteps = [
  { key: "order_placed", label: "Order Placed", icon: "📋" },
  { key: "confirmed", label: "Confirmed", icon: "✅" },
  { key: "preparation", label: "Preparation", icon: "👨‍🍳" },
  { key: "dispatched", label: "Dispatched", icon: "🚚" },
  { key: "delivered", label: "Delivered", icon: "📦" },
]

export function DeliveryTracker({ selectedDelivery }: DeliveryTrackerProps) {
  const [deliveryData] = useState<DeliveryData>(() => {
    // In a real app, you would fetch delivery data based on selectedDelivery
    return sampleDeliveryData
  })

  const getStatusIndex = (status: string) => {
    return statusSteps.findIndex((step) => step.key === status)
  }

  const currentStatusIndex = getStatusIndex(deliveryData.status)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-500"
      case "dispatched":
        return "bg-blue-500"
      case "preparation":
        return "bg-yellow-500"
      case "confirmed":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
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
                  <p className="text-teal-600 text-sm">Delivery route and real-time location</p>
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Agent</span>
                  <span className="font-medium">{deliveryData.delivery.agent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Carrier</span>
                  <span className="font-medium">{deliveryData.delivery.carrier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle</span>
                  <span className="font-medium">{deliveryData.delivery.vehicle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contact</span>
                  <span className="font-medium">{deliveryData.customer.phone}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Order Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>#{deliveryData.orderId}</CardTitle>
                <Badge className={getStatusColor(deliveryData.status)}>
                  {deliveryData.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{deliveryData.customer.name}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{deliveryData.customer.address}</p>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Delivery Notes:</p>
                  <p className="text-sm text-muted-foreground">{deliveryData.customer.notes}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Requested Date</span>
                  <span className="font-medium">{deliveryData.delivery.requestedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    ETA
                  </span>
                  <span className="font-medium">{deliveryData.delivery.estimatedArrival}</span>
                </div>
              </div>

              <div className="pt-4">
                <h4 className="font-medium mb-3">Order Items</h4>
                <div className="space-y-2">
                  {deliveryData.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start text-sm">
                      <div className="flex-1">
                        <span className="font-medium">{item.name}</span>
                        {item.notes && <p className="text-muted-foreground text-xs mt-1">{item.notes}</p>}
                      </div>
                      <span className="text-muted-foreground ml-2">×{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full mt-6 bg-transparent" variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Reschedule Delivery
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
