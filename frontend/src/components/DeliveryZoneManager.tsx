import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { MapPin, Plus, Edit, Trash2, Calendar, Clock } from "lucide-react"

interface DeliveryZone {
  id: number
  name: string
  description?: string
  color?: string
  is_active: boolean
  created_at: string
}

interface DeliverySlot {
  id: number
  start_time: string
  end_time: string
  zone_id: number
  available_capacity: number
}

const deliveryApi = {
  async getDeliveryZones() {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8001'}/delivery/zones`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  async createDeliveryZone(zoneData: Partial<DeliveryZone>) {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8001'}/delivery/zones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(zoneData),
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  async getDeliverySlots(date: string, zoneId?: number) {
    const url = new URL(`${process.env.REACT_APP_API_URL || 'http://localhost:8001'}/delivery/slots/${date}`)
    if (zoneId) {
      url.searchParams.append('zone_id', zoneId.toString())
    }
    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  }
}

export function DeliveryZoneManager() {
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [slots, setSlots] = useState<DeliverySlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const [newZone, setNewZone] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  })

  const fetchZones = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await deliveryApi.getDeliveryZones()
      setZones(response.zones || [])
    } catch (err) {
      setError("Failed to fetch delivery zones")
      console.error("Error fetching zones:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSlots = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await deliveryApi.getDeliverySlots(selectedDate)
      setSlots(response.slots || [])
    } catch (err) {
      setError("Failed to fetch delivery slots")
      console.error("Error fetching slots:", err)
    } finally {
      setLoading(false)
    }
  }

  const createZone = async () => {
    if (!newZone.name.trim()) return

    setLoading(true)
    setError(null)
    try {
      await deliveryApi.createDeliveryZone(newZone)
      setNewZone({ name: '', description: '', color: '#3B82F6' })
      setShowCreateForm(false)
      fetchZones()
    } catch (err) {
      setError("Failed to create delivery zone")
      console.error("Error creating zone:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchZones()
  }, [])

  useEffect(() => {
    fetchSlots()
  }, [selectedDate])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Delivery Zone Management</h2>
          <p className="text-muted-foreground">Manage delivery zones and schedules</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Zone
        </Button>
      </div>

      {/* Create Zone Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Delivery Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="zone-name">Zone Name</Label>
              <Input
                id="zone-name"
                value={newZone.name}
                onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                placeholder="Enter zone name"
              />
            </div>
            <div>
              <Label htmlFor="zone-description">Description</Label>
              <Textarea
                id="zone-description"
                value={newZone.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewZone({ ...newZone, description: e.target.value })}
                placeholder="Enter zone description"
              />
            </div>
            <div>
              <Label htmlFor="zone-color">Zone Color</Label>
              <Input
                id="zone-color"
                type="color"
                value={newZone.color}
                onChange={(e) => setNewZone({ ...newZone, color: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={createZone} disabled={loading}>
                Create Zone
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {zones.map((zone) => (
          <Card key={zone.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: zone.color }}
                  />
                  {zone.name}
                </CardTitle>
                <Badge variant={zone.is_active ? "default" : "secondary"}>
                  {zone.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {zone.description || "No description"}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-1" />
                  Schedule
                </Button>
                <Button variant="outline" size="sm" className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delivery Slots */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Delivery Slots</CardTitle>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
        </CardHeader>
        <CardContent>
          {slots.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No delivery slots available for this date
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {slots.map((slot) => (
                <div key={slot.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">
                        {slot.start_time} - {slot.end_time}
                      </span>
                    </div>
                    <Badge variant="outline">
                      {slot.available_capacity} available
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Zone ID: {slot.zone_id}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </div>
  )
}
