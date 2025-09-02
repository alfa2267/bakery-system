import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Settings, 
  Clock, 
  Users, 
  Factory, 
  Calendar,
  Plus,
  Trash2,
  Save,
  Edit,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface Equipment {
  id?: number;
  name: string;
  type: 'oven' | 'mixer' | 'prep_station' | 'packaging';
  capacity: number;
  efficiency_rating: number;
  maintenance_interval_hours: number;
  last_maintenance?: string;
  is_active: boolean;
  location?: string;
  notes?: string;
}

interface OperatingHours {
  id?: number;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_open: boolean;
  notes?: string;
}

interface StaffSchedule {
  id?: number;
  staff_name: string;
  role: 'baker' | 'manager' | 'assistant';
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  skills?: string[];
  notes?: string;
}

interface ProductionCapacity {
  id?: number;
  product_type: string;
  max_daily_capacity: number;
  batch_size: number;
  processing_time_minutes: number;
  required_equipment: number[];
  priority_level: number;
  is_active: boolean;
  notes?: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const EQUIPMENT_TYPES = ['oven', 'mixer', 'prep_station', 'packaging'];
const STAFF_ROLES = ['baker', 'manager', 'assistant'];

export function BakerySettings() {
  // Equipment state
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  
  // Operating hours state
  const [operatingHours, setOperatingHours] = useState<OperatingHours[]>([]);
  const [editingHours, setEditingHours] = useState<OperatingHours | null>(null);
  
  // Staff schedules state
  const [staffSchedules, setStaffSchedules] = useState<StaffSchedule[]>([]);
  const [editingStaff, setEditingStaff] = useState<StaffSchedule | null>(null);
  
  // Production capacity state
  const [productionCapacity, setProductionCapacity] = useState<ProductionCapacity[]>([]);
  const [editingCapacity, setEditingCapacity] = useState<ProductionCapacity | null>(null);
  
  // Loading state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // In a real app, you would load from API
      // For now, we'll use sample data
      setEquipment([
        {
          id: 1,
          name: 'Main Oven',
          type: 'oven',
          capacity: 50,
          efficiency_rating: 0.95,
          maintenance_interval_hours: 168,
          is_active: true,
          location: 'Kitchen A'
        },
        {
          id: 2,
          name: 'Industrial Mixer',
          type: 'mixer',
          capacity: 100,
          efficiency_rating: 0.90,
          maintenance_interval_hours: 336,
          is_active: true,
          location: 'Prep Area'
        }
      ]);

      setOperatingHours([
        { day_of_week: 0, open_time: '06:00', close_time: '18:00', is_open: true },
        { day_of_week: 1, open_time: '06:00', close_time: '18:00', is_open: true },
        { day_of_week: 2, open_time: '06:00', close_time: '18:00', is_open: true },
        { day_of_week: 3, open_time: '06:00', close_time: '18:00', is_open: true },
        { day_of_week: 4, open_time: '06:00', close_time: '18:00', is_open: true },
        { day_of_week: 5, open_time: '07:00', close_time: '16:00', is_open: true },
        { day_of_week: 6, open_time: '08:00', close_time: '14:00', is_open: true }
      ]);

      setStaffSchedules([
        {
          id: 1,
          staff_name: 'Baker 1',
          role: 'baker',
          day_of_week: 0,
          start_time: '06:00',
          end_time: '14:00',
          is_available: true,
          skills: ['oven', 'mixer']
        }
      ]);

      setProductionCapacity([
        {
          id: 1,
          product_type: 'Cake',
          max_daily_capacity: 100,
          batch_size: 10,
          processing_time_minutes: 120,
          required_equipment: [1, 2],
          priority_level: 3,
          is_active: true
        }
      ]);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // In a real app, you would save to API
      console.log('Saving settings:', {
        equipment,
        operatingHours,
        staffSchedules,
        productionCapacity
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Equipment functions
  const addEquipment = () => {
    const newEquipment: Equipment = {
      name: '',
      type: 'oven',
      capacity: 1,
      efficiency_rating: 1.0,
      maintenance_interval_hours: 168,
      is_active: true
    };
    setEditingEquipment(newEquipment);
  };

  const saveEquipment = () => {
    if (!editingEquipment) return;
    
    if (editingEquipment.id) {
      setEquipment(prev => prev.map(eq => eq.id === editingEquipment.id ? editingEquipment : eq));
    } else {
      const newEquipment = { ...editingEquipment, id: Date.now() };
      setEquipment(prev => [...prev, newEquipment]);
    }
    setEditingEquipment(null);
  };

  const deleteEquipment = (id: number) => {
    setEquipment(prev => prev.filter(eq => eq.id !== id));
  };

  // Operating hours functions
  const updateOperatingHours = (dayOfWeek: number, field: keyof OperatingHours, value: any) => {
    setOperatingHours(prev => prev.map(hours => 
      hours.day_of_week === dayOfWeek ? { ...hours, [field]: value } : hours
    ));
  };

  // Staff functions
  const addStaff = () => {
    const newStaff: StaffSchedule = {
      staff_name: '',
      role: 'baker',
      day_of_week: 0,
      start_time: '08:00',
      end_time: '16:00',
      is_available: true
    };
    setEditingStaff(newStaff);
  };

  const saveStaff = () => {
    if (!editingStaff) return;
    
    if (editingStaff.id) {
      setStaffSchedules(prev => prev.map(staff => staff.id === editingStaff.id ? editingStaff : staff));
    } else {
      const newStaff = { ...editingStaff, id: Date.now() };
      setStaffSchedules(prev => [...prev, newStaff]);
    }
    setEditingStaff(null);
  };

  const deleteStaff = (id: number) => {
    setStaffSchedules(prev => prev.filter(staff => staff.id !== id));
  };

  // Production capacity functions
  const addCapacity = () => {
    const newCapacity: ProductionCapacity = {
      product_type: '',
      max_daily_capacity: 1,
      batch_size: 1,
      processing_time_minutes: 60,
      required_equipment: [],
      priority_level: 1,
      is_active: true
    };
    setEditingCapacity(newCapacity);
  };

  const saveCapacity = () => {
    if (!editingCapacity) return;
    
    if (editingCapacity.id) {
      setProductionCapacity(prev => prev.map(cap => cap.id === editingCapacity.id ? editingCapacity : cap));
    } else {
      const newCapacity = { ...editingCapacity, id: Date.now() };
      setProductionCapacity(prev => [...prev, newCapacity]);
    }
    setEditingCapacity(null);
  };

  const deleteCapacity = (id: number) => {
    setProductionCapacity(prev => prev.filter(cap => cap.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Bakery Settings</h1>
          <p className="text-muted-foreground">Configure operational parameters and equipment</p>
        </div>
        <Button onClick={saveSettings} disabled={saving} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>

      <Tabs defaultValue="equipment" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Factory className="h-4 w-4" />
            Equipment
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Operating Hours
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Staff Schedules
          </TabsTrigger>
          <TabsTrigger value="capacity" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Production Capacity
          </TabsTrigger>
        </TabsList>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Equipment Management</h2>
            <Button onClick={addEquipment} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipment.map((eq) => (
              <Card key={eq.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{eq.name}</span>
                    <Badge variant={eq.is_active ? "default" : "secondary"}>
                      {eq.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <p><strong>Type:</strong> {eq.type.replace('_', ' ')}</p>
                    <p><strong>Capacity:</strong> {eq.capacity} units</p>
                    <p><strong>Efficiency:</strong> {Math.round(eq.efficiency_rating * 100)}%</p>
                    <p><strong>Location:</strong> {eq.location || 'Not specified'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setEditingEquipment(eq)} 
                      size="sm" 
                      variant="outline"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={() => deleteEquipment(eq.id!)}
                      size="sm" 
                      variant="outline"
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Equipment Edit Modal */}
          {editingEquipment && (
            <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <CardContent className="bg-white p-6 rounded-lg w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Edit Equipment</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editingEquipment.name}
                      onChange={(e) => setEditingEquipment({...editingEquipment, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <select
                      id="type"
                      value={editingEquipment.type}
                      onChange={(e) => setEditingEquipment({...editingEquipment, type: e.target.value as any})}
                      className="w-full p-2 border rounded"
                    >
                      {EQUIPMENT_TYPES.map(type => (
                        <option key={type} value={type}>{type.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={editingEquipment.capacity}
                      onChange={(e) => setEditingEquipment({...editingEquipment, capacity: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="efficiency">Efficiency Rating (0-1)</Label>
                    <Input
                      id="efficiency"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={editingEquipment.efficiency_rating}
                      onChange={(e) => setEditingEquipment({...editingEquipment, efficiency_rating: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={editingEquipment.location || ''}
                      onChange={(e) => setEditingEquipment({...editingEquipment, location: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveEquipment} className="flex-1">Save</Button>
                    <Button onClick={() => setEditingEquipment(null)} variant="outline" className="flex-1">Cancel</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Operating Hours Tab */}
        <TabsContent value="hours" className="space-y-6">
          <h2 className="text-xl font-semibold">Operating Hours</h2>
          
          <div className="space-y-4">
            {operatingHours.map((hours) => (
              <Card key={hours.day_of_week}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="font-medium">{DAYS_OF_WEEK[hours.day_of_week]}</h3>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={hours.open_time}
                          onChange={(e) => updateOperatingHours(hours.day_of_week, 'open_time', e.target.value)}
                          className="p-1 border rounded"
                        />
                        <span>to</span>
                        <input
                          type="time"
                          value={hours.close_time}
                          onChange={(e) => updateOperatingHours(hours.day_of_week, 'close_time', e.target.value)}
                          className="p-1 border rounded"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={hours.is_open}
                        onChange={(e) => updateOperatingHours(hours.day_of_week, 'is_open', e.target.checked)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Open</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Staff Schedules Tab */}
        <TabsContent value="staff" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Staff Schedules</h2>
            <Button onClick={addStaff} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </div>

          <div className="space-y-4">
            {staffSchedules.map((staff) => (
              <Card key={staff.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{staff.staff_name}</h3>
                      <p className="text-sm text-gray-600">
                        {STAFF_ROLES.find(r => r === staff.role)?.replace('_', ' ')} • {DAYS_OF_WEEK[staff.day_of_week]}
                      </p>
                      <p className="text-sm text-gray-600">
                        {staff.start_time} - {staff.end_time}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setEditingStaff(staff)} 
                        size="sm" 
                        variant="outline"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={() => deleteStaff(staff.id!)}
                        size="sm" 
                        variant="outline"
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Staff Edit Modal */}
          {editingStaff && (
            <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <CardContent className="bg-white p-6 rounded-lg w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Edit Staff Schedule</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="staff_name">Staff Name</Label>
                    <Input
                      id="staff_name"
                      value={editingStaff.staff_name}
                      onChange={(e) => setEditingStaff({...editingStaff, staff_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <select
                      id="role"
                      value={editingStaff.role}
                      onChange={(e) => setEditingStaff({...editingStaff, role: e.target.value as any})}
                      className="w-full p-2 border rounded"
                    >
                      {STAFF_ROLES.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="day">Day</Label>
                    <select
                      id="day"
                      value={editingStaff.day_of_week}
                      onChange={(e) => setEditingStaff({...editingStaff, day_of_week: parseInt(e.target.value)})}
                      className="w-full p-2 border rounded"
                    >
                      {DAYS_OF_WEEK.map((day, index) => (
                        <option key={index} value={index}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="start_time">Start Time</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={editingStaff.start_time}
                        onChange={(e) => setEditingStaff({...editingStaff, start_time: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_time">End Time</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={editingStaff.end_time}
                        onChange={(e) => setEditingStaff({...editingStaff, end_time: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveStaff} className="flex-1">Save</Button>
                    <Button onClick={() => setEditingStaff(null)} variant="outline" className="flex-1">Cancel</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Production Capacity Tab */}
        <TabsContent value="capacity" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Production Capacity</h2>
            <Button onClick={addCapacity} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Capacity
            </Button>
          </div>

          <div className="space-y-4">
            {productionCapacity.map((cap) => (
              <Card key={cap.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{cap.product_type}</h3>
                      <p className="text-sm text-gray-600">
                        Max Daily: {cap.max_daily_capacity} • Batch Size: {cap.batch_size} • 
                        Processing Time: {cap.processing_time_minutes}min • Priority: {cap.priority_level}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setEditingCapacity(cap)} 
                        size="sm" 
                        variant="outline"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={() => deleteCapacity(cap.id!)}
                        size="sm" 
                        variant="outline"
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Capacity Edit Modal */}
          {editingCapacity && (
            <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <CardContent className="bg-white p-6 rounded-lg w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Edit Production Capacity</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="product_type">Product Type</Label>
                    <Input
                      id="product_type"
                      value={editingCapacity.product_type}
                      onChange={(e) => setEditingCapacity({...editingCapacity, product_type: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="max_capacity">Max Daily Capacity</Label>
                      <Input
                        id="max_capacity"
                        type="number"
                        value={editingCapacity.max_daily_capacity}
                        onChange={(e) => setEditingCapacity({...editingCapacity, max_daily_capacity: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="batch_size">Batch Size</Label>
                      <Input
                        id="batch_size"
                        type="number"
                        value={editingCapacity.batch_size}
                        onChange={(e) => setEditingCapacity({...editingCapacity, batch_size: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="processing_time">Processing Time (min)</Label>
                      <Input
                        id="processing_time"
                        type="number"
                        value={editingCapacity.processing_time_minutes}
                        onChange={(e) => setEditingCapacity({...editingCapacity, processing_time_minutes: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority Level (1-5)</Label>
                      <Input
                        id="priority"
                        type="number"
                        min="1"
                        max="5"
                        value={editingCapacity.priority_level}
                        onChange={(e) => setEditingCapacity({...editingCapacity, priority_level: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveCapacity} className="flex-1">Save</Button>
                    <Button onClick={() => setEditingCapacity(null)} variant="outline" className="flex-1">Cancel</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
