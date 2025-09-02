// src/App.tsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { ChefHat, Calendar, User, PlusCircle, ClipboardList, Truck, Monitor, Users, BookOpen, BarChart3, Settings, ChevronLeft, ChevronRight, Factory, Clock, Plus, Trash2, Save, Edit, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from './components/ui/button';
import EnhancedOrderForm from './components/EnhancedOrderForm';
import BakerView from './components/BakerView';
import OrdersView from './components/OrdersView';
import { DeliveryTracker } from './components/DeliveryTracker';
import { UnifiedKOT } from './components/UnifiedKOT';
import { GlobalHeader } from './components/GlobalHeader';
import { RecipeManager } from './components/RecipeManager';
import { ResourceUtilizationDashboard } from './components/ResourceUtilization';
import { BakerySettings } from './components/BakerySettings';
import ConsolidatedScheduleView from './components/ScheduleView';

// Navigation Component
const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const NavButton: React.FC<{
    path: string;
    icon: React.ReactNode;
    label: string;
  }> = ({ path, icon, label }) => (
    <Button
      onClick={() => navigate(path)}
      variant={location.pathname === path ? "default" : "outline"}
      className="flex items-center space-x-2"
    >
      {icon}
      <span>{label}</span>
    </Button>
  );

  return (
    <div className="bg-card border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
          </div>
          
          <div className="flex space-x-2 items-center overflow-x-auto">
            <NavButton
              path="/schedule"
              icon={<Calendar className="w-4 h-4" />}
              label="Schedule"
            />
            <NavButton
              path="/delivery"
              icon={<Truck className="w-4 h-4" />}
              label="Delivery"
            />
            <NavButton
              path="/baker"
              icon={<ChefHat className="w-4 h-4" />}
              label="Baker View"
            />
            <NavButton
              path="/kot"
              icon={<Monitor className="w-4 h-4" />}
              label="Kitchen Orders"
            />
            <NavButton
              path="/orders"
              icon={<ClipboardList className="w-4 h-4" />}
              label="Orders"
            />
            <NavButton
              path="/recipes"
              icon={<BookOpen className="w-4 h-4" />}
              label="Recipes"
            />
            <NavButton
              path="/resources"
              icon={<BarChart3 className="w-4 h-4" />}
              label="Resources"
            />
            <NavButton
              path="/settings"
              icon={<Settings className="w-4 h-4" />}
              label="Settings"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Status Bar Component
const StatusBar: React.FC = () => {
  const location = useLocation();
  
  const getCurrentUser = () => {
    const path = location.pathname;
    if (path === '/schedule') return 'Manager';
    if (path === '/baker') return 'Baker';
    if (path === '/delivery') return 'Delivery Tracker';
    if (path === '/kot') return 'Kitchen Orders';
    if (path === '/recipes') return 'Recipe Manager';
    if (path === '/resources') return 'Resource Dashboard';
    if (path === '/settings') return 'Settings';
    if (path === '/orders') return 'Orders Manager';
    return 'Staff';
  };

  return (
    <div className="fixed bottom-0 w-full bg-card border-t">
      <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Logged in as: {getCurrentUser()}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
};

// Page Components
const SchedulePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="px-5 view-container">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Bakery Production Schedule</h1>
          <p className="text-muted-foreground">Daily baking and delivery timeline</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">{selectedDate}</span>
            <Button variant="outline" size="sm">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>
      <ConsolidatedScheduleView />
    </div>
  );
};

const DeliveryPage: React.FC = () => {
  const [selectedDelivery, setSelectedDelivery] = React.useState<string | null>(null);

  return (
    <div className="px-5 view-container">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Delivery Tracking</h1>
          <p className="text-muted-foreground">Real-time delivery status and location</p>
        </div>
      </div>
      <DeliveryTracker selectedDelivery={selectedDelivery} />
    </div>
  );
};

const KotPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [selectedWorkstation, setSelectedWorkstation] = React.useState<string>("oven_main");
  const [kotViewMode, setKotViewMode] = React.useState<'manager' | 'workstation'>('manager');

  return (
    <div className="px-5 view-container">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Kitchen Order Tickets</h1>
          <p className="text-muted-foreground">Unified view for workstation and manager operations</p>
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          />
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
            Refresh
          </Button>
          <div className="flex items-center space-x-2">
            <Button 
              variant={kotViewMode === 'manager' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setKotViewMode('manager')}
              className="flex items-center gap-1 text-xs"
            >
              <Users className="h-3 w-3" />
              Manager
            </Button>
            <Button 
              variant={kotViewMode === 'workstation' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setKotViewMode('workstation')}
              className="flex items-center gap-1 text-xs"
            >
              <Factory className="h-3 w-3" />
              Workstation
            </Button>
          </div>
        </div>
      </div>
      <UnifiedKOT defaultView={kotViewMode} workstation={selectedWorkstation} selectedDate={selectedDate} />
    </div>
  );
};

const NewOrderPage: React.FC = () => {
  return (
    <div className="px-5 view-container">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Place New Order</h1>
          <p className="text-muted-foreground">Create and customize bakery orders</p>
        </div>
      </div>
      <EnhancedOrderForm />
    </div>
  );
};

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="px-5 view-container">
      <OrdersView onNewOrder={() => navigate('/new-order')} />
    </div>
  );
};

const BakerPage: React.FC = () => {
  const [selectedBaker, setSelectedBaker] = React.useState<"Baker1" | "Baker2">("Baker1");

  return (
    <div className="px-5 view-container">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Baker Tasks</h1>
          <p className="text-muted-foreground">Daily task list and status updates</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Baker:</label>
          <select
            value={selectedBaker}
            onChange={(e) => setSelectedBaker(e.target.value as "Baker1" | "Baker2")}
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Baker1">Baker 1</option>
            <option value="Baker2">Baker 2</option>
          </select>
        </div>
      </div>
      <BakerView selectedBaker={selectedBaker} />
    </div>
  );
};

const RecipesPage: React.FC = () => {
  return (
    <div className="px-5 view-container">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Recipe Manager</h1>
          <p className="text-muted-foreground">Create and manage production recipes</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline" size="sm">
          Refresh
        </Button>
      </div>
      <RecipeManager />
    </div>
  );
};

const ResourcesPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="px-5 view-container">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Resource Utilization</h1>
          <p className="text-muted-foreground">Monitor equipment efficiency and bottlenecks</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1 border rounded text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Range:</label>
            <select
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>
      <ResourceUtilizationDashboard />
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("bakery_info");

  const handleSave = async () => {
    setSaving(true);
    try {
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

  return (
    <div className="px-5 view-container">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Bakery Settings</h1>
          <p className="text-muted-foreground">Configure operational parameters and equipment</p>
        </div>
        <div className="flex items-center space-x-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
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
          </Tabs>
          <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>
      <BakerySettings activeTab={activeTab} onSave={handleSave} saving={saving} />
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <Routes>
          <Route path="/" element={<Navigate to="/schedule" replace />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/delivery" element={<DeliveryPage />} />
          <Route path="/kot" element={<KotPage />} />
          <Route path="/new-order" element={<NewOrderPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/baker" element={<BakerPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        
        <StatusBar />
      </div>
    </Router>
  );
};

export default App;