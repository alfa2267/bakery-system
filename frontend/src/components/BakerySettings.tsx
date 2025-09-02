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

interface BakeryInfo {
  id?: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  website?: string;
  tax_id?: string;
  business_hours?: string;
  notes?: string;
}

interface DeliveryProvider {
  id?: number;
  name: string;
  type: 'courier' | 'delivery_service' | 'own_vehicle';
  contact_person: string;
  phone: string;
  email: string;
  service_area: string;
  delivery_fee: number;
  is_active: boolean;
  notes?: string;
}

interface SystemUser {
  id?: number;
  username: string;
  full_name: string;
  email: string;
  role: 'admin' | 'manager' | 'baker' | 'assistant' | 'delivery';
  is_active: boolean;
  last_login?: string;
  permissions: string[];
  notes?: string;
}

interface Workstation {
  id?: number;
  name: string;
  type: 'prep' | 'baking' | 'packaging' | 'delivery_prep';
  location: string;
  capacity: number;
  assigned_staff: number[];
  is_active: boolean;
  equipment: number[];
  notes?: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const EQUIPMENT_TYPES = ['oven', 'mixer', 'prep_station', 'packaging'];
const STAFF_ROLES = ['baker', 'manager', 'assistant'];
const DELIVERY_PROVIDER_TYPES = ['courier', 'delivery_service', 'own_vehicle'];
const USER_ROLES = ['admin', 'manager', 'baker', 'assistant', 'delivery'];
const WORKSTATION_TYPES = ['prep', 'baking', 'packaging', 'delivery_prep'];

interface BakerySettingsProps {
  onSave?: () => void;
  saving?: boolean;
  activeTab?: string;
}

export function BakerySettings({ onSave, saving = false, activeTab = "equipment" }: BakerySettingsProps) {
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
  
  // Bakery info state
  const [bakeryInfo, setBakeryInfo] = useState<BakeryInfo>({
    name: 'Sweet Dreams Bakery',
    address: '123 Main Street',
    city: 'Bakery City',
    state: 'BC',
    zip_code: '12345',
    phone: '(555) 123-4567',
    email: 'info@sweetdreamsbakery.com'
  });
  const [editingBakeryInfo, setEditingBakeryInfo] = useState<BakeryInfo | null>(null);
  
  // Delivery Providers state
  const [deliveryProviders, setDeliveryProviders] = useState<DeliveryProvider[]>([]);
  const [editingDeliveryProvider, setEditingDeliveryProvider] = useState<DeliveryProvider | null>(null);

  // System Users state
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [editingSystemUser, setEditingSystemUser] = useState<SystemUser | null>(null);

  // Workstations state
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [editingWorkstation, setEditingWorkstation] = useState<Workstation | null>(null);
  
  // Loading state
  const [loading, setLoading] = useState(false);

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

      setDeliveryProviders([
        {
          id: 1,
          name: 'Fast Delivery Co.',
          type: 'delivery_service',
          contact_person: 'John Smith',
          phone: '(555) 987-6543',
          email: 'john@fastdelivery.com',
          service_area: 'City Center',
          delivery_fee: 5.00,
          is_active: true
        },
        {
          id: 2,
          name: 'Own Vehicle',
          type: 'own_vehicle',
          contact_person: 'Bakery Staff',
          phone: '(555) 123-4567',
          email: 'delivery@sweetdreamsbakery.com',
          service_area: 'Local Area',
          delivery_fee: 0.00,
          is_active: true
        }
      ]);

      setSystemUsers([
        {
          id: 1,
          username: 'admin',
          full_name: 'Admin User',
          email: 'admin@sweetdreamsbakery.com',
          role: 'admin',
          is_active: true,
          permissions: ['all'],
          last_login: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          username: 'manager',
          full_name: 'Manager User',
          email: 'manager@sweetdreamsbakery.com',
          role: 'manager',
          is_active: true,
          permissions: ['orders', 'schedule', 'reports'],
          last_login: '2024-01-15T09:15:00Z'
        }
      ]);

      setWorkstations([
        {
          id: 1,
          name: 'Main Prep Station',
          type: 'prep',
          location: 'Kitchen A',
          capacity: 4,
          assigned_staff: [1, 2],
          is_active: true,
          equipment: [1, 2]
        },
        {
          id: 2,
          name: 'Baking Station',
          type: 'baking',
          location: 'Kitchen B',
          capacity: 2,
          assigned_staff: [1],
          is_active: true,
          equipment: [1]
        }
      ]);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (onSave) {
      onSave();
      return;
    }
    
    // This function is now primarily for fallback - the main save is handled by parent
    console.log('Saving settings:', {
      equipment,
      operatingHours,
      staffSchedules,
      productionCapacity
    });
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

  // Delivery Provider functions
  const addDeliveryProvider = () => {
    const newProvider: DeliveryProvider = {
      name: '',
      type: 'delivery_service',
      contact_person: '',
      phone: '',
      email: '',
      service_area: '',
      delivery_fee: 0,
      is_active: true
    };
    setEditingDeliveryProvider(newProvider);
  };

  const saveDeliveryProvider = () => {
    if (!editingDeliveryProvider) return;
    
    if (editingDeliveryProvider.id) {
      setDeliveryProviders(prev => prev.map(provider => provider.id === editingDeliveryProvider.id ? editingDeliveryProvider : provider));
    } else {
      const newProvider = { ...editingDeliveryProvider, id: Date.now() };
      setDeliveryProviders(prev => [...prev, newProvider]);
    }
    setEditingDeliveryProvider(null);
  };

  const deleteDeliveryProvider = (id: number) => {
    setDeliveryProviders(prev => prev.filter(provider => provider.id !== id));
  };

  // System User functions
  const addSystemUser = () => {
    const newUser: SystemUser = {
      username: '',
      full_name: '',
      email: '',
      role: 'baker',
      is_active: true,
      permissions: []
    };
    setEditingSystemUser(newUser);
  };

  const saveSystemUser = () => {
    if (!editingSystemUser) return;
    
    if (editingSystemUser.id) {
      setSystemUsers(prev => prev.map(user => user.id === editingSystemUser.id ? editingSystemUser : user));
    } else {
      const newUser = { ...editingSystemUser, id: Date.now() };
      setSystemUsers(prev => [...prev, newUser]);
    }
    setEditingSystemUser(null);
  };

  const deleteSystemUser = (id: number) => {
    setSystemUsers(prev => prev.filter(user => user.id !== id));
  };

  // Workstation functions
  const addWorkstation = () => {
    const newWorkstation: Workstation = {
      name: '',
      type: 'prep',
      location: '',
      capacity: 1,
      assigned_staff: [],
      is_active: true,
      equipment: []
    };
    setEditingWorkstation(newWorkstation);
  };

  const saveWorkstation = () => {
    if (!editingWorkstation) return;
    
    if (editingWorkstation.id) {
      setWorkstations(prev => prev.map(ws => ws.id === editingWorkstation.id ? editingWorkstation : ws));
    } else {
      const newWorkstation = { ...editingWorkstation, id: Date.now() };
      setWorkstations(prev => [...prev, newWorkstation]);
    }
    setEditingWorkstation(null);
  };

  const deleteWorkstation = (id: number) => {
    setWorkstations(prev => prev.filter(ws => ws.id !== id));
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
      {/* Removed the save button from here */}

      <Tabs value={activeTab} className="space-y-6">
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

        {/* Workstations Tab */}
        <TabsContent value="workstations" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Workstations</h2>
            <Button onClick={addWorkstation} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Workstation
            </Button>
          </div>

          <div className="space-y-4">
            {workstations.map((ws) => (
              <Card key={ws.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{ws.name}</h3>
                      <p className="text-sm text-gray-600">
                        Type: {WORKSTATION_TYPES.find(type => type === ws.type)?.replace('_', ' ')} • Location: {ws.location}
                      </p>
                      <p className="text-sm text-gray-600">
                        Capacity: {ws.capacity} • Active: {ws.is_active ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setEditingWorkstation(ws)} 
                        size="sm" 
                        variant="outline"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={() => deleteWorkstation(ws.id!)}
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

          {/* Workstation Edit Modal */}
          {editingWorkstation && (
            <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <CardContent className="bg-white p-6 rounded-lg w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Edit Workstation</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="workstation_name">Name</Label>
                    <Input
                      id="workstation_name"
                      value={editingWorkstation.name}
                      onChange={(e) => setEditingWorkstation({...editingWorkstation, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="workstation_type">Type</Label>
                    <select
                      id="workstation_type"
                      value={editingWorkstation.type}
                      onChange={(e) => setEditingWorkstation({...editingWorkstation, type: e.target.value as any})}
                      className="w-full p-2 border rounded"
                    >
                      {WORKSTATION_TYPES.map(type => (
                        <option key={type} value={type}>{type.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="workstation_location">Location</Label>
                    <Input
                      id="workstation_location"
                      value={editingWorkstation.location}
                      onChange={(e) => setEditingWorkstation({...editingWorkstation, location: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="workstation_capacity">Capacity</Label>
                    <Input
                      id="workstation_capacity"
                      type="number"
                      value={editingWorkstation.capacity}
                      onChange={(e) => setEditingWorkstation({...editingWorkstation, capacity: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="is_active">Active</Label>
                    <input
                      type="checkbox"
                      checked={editingWorkstation.is_active}
                      onChange={(e) => setEditingWorkstation({...editingWorkstation, is_active: e.target.checked})}
                      className="h-4 w-4"
                    />
                  </div>
                  <div>
                    <Label htmlFor="assigned_staff">Assigned Staff</Label>
                    <select
                      id="assigned_staff"
                      multiple
                      value={editingWorkstation.assigned_staff.map(id => id.toString())}
                      onChange={(e) => setEditingWorkstation({...editingWorkstation, assigned_staff: Array.from(e.target.selectedOptions).map(opt => parseInt(opt.value))})}
                      className="w-full p-2 border rounded"
                    >
                      {staffSchedules.map(staff => (
                        <option key={staff.id} value={staff.id}>{staff.staff_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="equipment">Equipment</Label>
                    <select
                      id="equipment"
                      multiple
                      value={editingWorkstation.equipment.map(id => id.toString())}
                      onChange={(e) => setEditingWorkstation({...editingWorkstation, equipment: Array.from(e.target.selectedOptions).map(opt => parseInt(opt.value))})}
                      className="w-full p-2 border rounded"
                    >
                      {equipment.map(eq => (
                        <option key={eq.id} value={eq.id}>{eq.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveWorkstation} className="flex-1">Save</Button>
                    <Button onClick={() => setEditingWorkstation(null)} variant="outline" className="flex-1">Cancel</Button>
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

        {/* Bakery Info Tab */}
        <TabsContent value="bakery_info" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Bakery Information</h2>
            <Button onClick={() => setEditingBakeryInfo(bakeryInfo)} size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Info
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{bakeryInfo.name}</h3>
                  <div className="space-y-2">
                    <p><strong>Address:</strong> {bakeryInfo.address}</p>
                    <p><strong>City:</strong> {bakeryInfo.city}, {bakeryInfo.state} {bakeryInfo.zip_code}</p>
                    <p><strong>Phone:</strong> {bakeryInfo.phone}</p>
                    <p><strong>Email:</strong> {bakeryInfo.email}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Additional Information</h4>
                  <div className="space-y-2">
                    {bakeryInfo.website && <p><strong>Website:</strong> {bakeryInfo.website}</p>}
                    {bakeryInfo.tax_id && <p><strong>Tax ID:</strong> {bakeryInfo.tax_id}</p>}
                    {bakeryInfo.business_hours && <p><strong>Business Hours:</strong> {bakeryInfo.business_hours}</p>}
                    {bakeryInfo.notes && <p><strong>Notes:</strong> {bakeryInfo.notes}</p>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bakery Info Edit Modal */}
          {editingBakeryInfo && (
            <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <CardContent className="bg-white p-6 rounded-lg w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Edit Bakery Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bakery_name">Bakery Name</Label>
                    <Input
                      id="bakery_name"
                      value={editingBakeryInfo.name}
                      onChange={(e) => setEditingBakeryInfo({...editingBakeryInfo, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={editingBakeryInfo.address}
                      onChange={(e) => setEditingBakeryInfo({...editingBakeryInfo, address: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={editingBakeryInfo.city}
                        onChange={(e) => setEditingBakeryInfo({...editingBakeryInfo, city: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={editingBakeryInfo.state}
                        onChange={(e) => setEditingBakeryInfo({...editingBakeryInfo, state: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="zip_code">ZIP Code</Label>
                      <Input
                        id="zip_code"
                        value={editingBakeryInfo.zip_code}
                        onChange={(e) => setEditingBakeryInfo({...editingBakeryInfo, zip_code: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={editingBakeryInfo.phone}
                      onChange={(e) => setEditingBakeryInfo({...editingBakeryInfo, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={editingBakeryInfo.email}
                      onChange={(e) => setEditingBakeryInfo({...editingBakeryInfo, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website (optional)</Label>
                    <Input
                      id="website"
                      value={editingBakeryInfo.website || ''}
                      onChange={(e) => setEditingBakeryInfo({...editingBakeryInfo, website: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax_id">Tax ID (optional)</Label>
                    <Input
                      id="tax_id"
                      value={editingBakeryInfo.tax_id || ''}
                      onChange={(e) => setEditingBakeryInfo({...editingBakeryInfo, tax_id: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="business_hours">Business Hours (optional)</Label>
                    <Input
                      id="business_hours"
                      value={editingBakeryInfo.business_hours || ''}
                      onChange={(e) => setEditingBakeryInfo({...editingBakeryInfo, business_hours: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <textarea
                      id="notes"
                      value={editingBakeryInfo.notes || ''}
                      onChange={(e) => setEditingBakeryInfo({...editingBakeryInfo, notes: e.target.value})}
                      className="w-full p-2 border rounded"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => {
                      setBakeryInfo(editingBakeryInfo);
                      setEditingBakeryInfo(null);
                    }} className="flex-1">Save</Button>
                    <Button onClick={() => setEditingBakeryInfo(null)} variant="outline" className="flex-1">Cancel</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Delivery Providers Tab */}
        <TabsContent value="delivery_providers" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Delivery Providers</h2>
            <Button onClick={addDeliveryProvider} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Provider
            </Button>
          </div>

          <div className="space-y-4">
            {deliveryProviders.map((provider) => (
              <Card key={provider.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{provider.name}</h3>
                      <p className="text-sm text-gray-600">
                        Type: {provider.type.replace('_', ' ')} • Contact: {provider.contact_person}
                      </p>
                      <p className="text-sm text-gray-600">
                        Phone: {provider.phone} • Email: {provider.email}
                      </p>
                      <p className="text-sm text-gray-600">
                        Service Area: {provider.service_area} • Fee: ${provider.delivery_fee.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setEditingDeliveryProvider(provider)} 
                        size="sm" 
                        variant="outline"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={() => deleteDeliveryProvider(provider.id!)}
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

          {/* Delivery Provider Edit Modal */}
          {editingDeliveryProvider && (
            <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <CardContent className="bg-white p-6 rounded-lg w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Edit Delivery Provider</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="provider_name">Name</Label>
                    <Input
                      id="provider_name"
                      value={editingDeliveryProvider.name}
                      onChange={(e) => setEditingDeliveryProvider({...editingDeliveryProvider, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="provider_type">Type</Label>
                    <select
                      id="provider_type"
                      value={editingDeliveryProvider.type}
                      onChange={(e) => setEditingDeliveryProvider({...editingDeliveryProvider, type: e.target.value as any})}
                      className="w-full p-2 border rounded"
                    >
                      {DELIVERY_PROVIDER_TYPES.map(type => (
                        <option key={type} value={type}>{type.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="contact_person">Contact Person</Label>
                    <Input
                      id="contact_person"
                      value={editingDeliveryProvider.contact_person}
                      onChange={(e) => setEditingDeliveryProvider({...editingDeliveryProvider, contact_person: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={editingDeliveryProvider.phone}
                      onChange={(e) => setEditingDeliveryProvider({...editingDeliveryProvider, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={editingDeliveryProvider.email}
                      onChange={(e) => setEditingDeliveryProvider({...editingDeliveryProvider, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="service_area">Service Area</Label>
                    <Input
                      id="service_area"
                      value={editingDeliveryProvider.service_area}
                      onChange={(e) => setEditingDeliveryProvider({...editingDeliveryProvider, service_area: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="delivery_fee">Delivery Fee ($)</Label>
                    <Input
                      id="delivery_fee"
                      type="number"
                      step="0.01"
                      value={editingDeliveryProvider.delivery_fee}
                      onChange={(e) => setEditingDeliveryProvider({...editingDeliveryProvider, delivery_fee: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveDeliveryProvider} className="flex-1">Save</Button>
                    <Button onClick={() => setEditingDeliveryProvider(null)} variant="outline" className="flex-1">Cancel</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* System Users Tab */}
        <TabsContent value="system_users" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">System Users</h2>
            <Button onClick={addSystemUser} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>

          <div className="space-y-4">
            {systemUsers.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{user.full_name}</h3>
                      <p className="text-sm text-gray-600">
                        Username: {user.username} • Role: {USER_ROLES.find(r => r === user.role)?.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-600">
                        Email: {user.email} • Active: {user.is_active ? 'Yes' : 'No'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Last Login: {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setEditingSystemUser(user)} 
                        size="sm" 
                        variant="outline"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={() => deleteSystemUser(user.id!)}
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

          {/* System User Edit Modal */}
          {editingSystemUser && (
            <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <CardContent className="bg-white p-6 rounded-lg w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Edit System User</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={editingSystemUser.username}
                      onChange={(e) => setEditingSystemUser({...editingSystemUser, username: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={editingSystemUser.full_name}
                      onChange={(e) => setEditingSystemUser({...editingSystemUser, full_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={editingSystemUser.email}
                      onChange={(e) => setEditingSystemUser({...editingSystemUser, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <select
                      id="role"
                      value={editingSystemUser.role}
                      onChange={(e) => setEditingSystemUser({...editingSystemUser, role: e.target.value as any})}
                      className="w-full p-2 border rounded"
                    >
                      {USER_ROLES.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="is_active">Active</Label>
                    <input
                      type="checkbox"
                      checked={editingSystemUser.is_active}
                      onChange={(e) => setEditingSystemUser({...editingSystemUser, is_active: e.target.checked})}
                      className="h-4 w-4"
                    />
                  </div>
                  <div>
                    <Label htmlFor="permissions">Permissions</Label>
                    <select
                      id="permissions"
                      multiple
                      value={editingSystemUser.permissions}
                      onChange={(e) => setEditingSystemUser({...editingSystemUser, permissions: Array.from(e.target.selectedOptions).map(opt => opt.value)})}
                      className="w-full p-2 border rounded"
                    >
                      {['all', 'orders', 'schedule', 'reports', 'inventory', 'finance', 'settings'].map(perm => (
                        <option key={perm} value={perm}>{perm.replace('_', ' ').replace('reports', 'Reports')}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveSystemUser} className="flex-1">Save</Button>
                    <Button onClick={() => setEditingSystemUser(null)} variant="outline" className="flex-1">Cancel</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Workstations Tab */}
        <TabsContent value="workstations" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Workstations</h2>
            <Button onClick={addWorkstation} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Workstation
            </Button>
          </div>

          <div className="space-y-4">
            {workstations.map((ws) => (
              <Card key={ws.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{ws.name}</h3>
                      <p className="text-sm text-gray-600">
                        Type: {WORKSTATION_TYPES.find(type => type === ws.type)?.replace('_', ' ')} • Location: {ws.location}
                      </p>
                      <p className="text-sm text-gray-600">
                        Capacity: {ws.capacity} • Active: {ws.is_active ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setEditingWorkstation(ws)} 
                        size="sm" 
                        variant="outline"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={() => deleteWorkstation(ws.id!)}
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

          {/* Workstation Edit Modal */}
          {editingWorkstation && (
            <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <CardContent className="bg-white p-6 rounded-lg w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Edit Workstation</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="workstation_name">Name</Label>
                    <Input
                      id="workstation_name"
                      value={editingWorkstation.name}
                      onChange={(e) => setEditingWorkstation({...editingWorkstation, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="workstation_type">Type</Label>
                    <select
                      id="workstation_type"
                      value={editingWorkstation.type}
                      onChange={(e) => setEditingWorkstation({...editingWorkstation, type: e.target.value as any})}
                      className="w-full p-2 border rounded"
                    >
                      {WORKSTATION_TYPES.map(type => (
                        <option key={type} value={type}>{type.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="workstation_location">Location</Label>
                    <Input
                      id="workstation_location"
                      value={editingWorkstation.location}
                      onChange={(e) => setEditingWorkstation({...editingWorkstation, location: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="workstation_capacity">Capacity</Label>
                    <Input
                      id="workstation_capacity"
                      type="number"
                      value={editingWorkstation.capacity}
                      onChange={(e) => setEditingWorkstation({...editingWorkstation, capacity: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="is_active">Active</Label>
                    <input
                      type="checkbox"
                      checked={editingWorkstation.is_active}
                      onChange={(e) => setEditingWorkstation({...editingWorkstation, is_active: e.target.checked})}
                      className="h-4 w-4"
                    />
                  </div>
                  <div>
                    <Label htmlFor="assigned_staff">Assigned Staff</Label>
                    <select
                      id="assigned_staff"
                      multiple
                      value={editingWorkstation.assigned_staff.map(id => id.toString())}
                      onChange={(e) => setEditingWorkstation({...editingWorkstation, assigned_staff: Array.from(e.target.selectedOptions).map(opt => parseInt(opt.value))})}
                      className="w-full p-2 border rounded"
                    >
                      {staffSchedules.map(staff => (
                        <option key={staff.id} value={staff.id}>{staff.staff_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="equipment">Equipment</Label>
                    <select
                      id="equipment"
                      multiple
                      value={editingWorkstation.equipment.map(id => id.toString())}
                      onChange={(e) => setEditingWorkstation({...editingWorkstation, equipment: Array.from(e.target.selectedOptions).map(opt => parseInt(opt.value))})}
                      className="w-full p-2 border rounded"
                    >
                      {equipment.map(eq => (
                        <option key={eq.id} value={eq.id}>{eq.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveWorkstation} className="flex-1">Save</Button>
                    <Button onClick={() => setEditingWorkstation(null)} variant="outline" className="flex-1">Cancel</Button>
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
