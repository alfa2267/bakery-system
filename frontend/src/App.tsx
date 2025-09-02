// src/App.tsx
import React from 'react';
import { useState } from 'react';
import { ChefHat, Calendar, User, PlusCircle, ClipboardList, Truck, Monitor, Users, BookOpen, BarChart3, Settings } from 'lucide-react';
import { Button } from './components/ui/button';
import EnhancedOrderForm from './components/EnhancedOrderForm';
import BakerView from './components/BakerView';
import OrdersView from './components/OrdersView';

// Import the new components we'll create
import { DeliveryTracker } from './components/DeliveryTracker';
import { UnifiedKOT } from './components/UnifiedKOT';
import { GlobalHeader } from './components/GlobalHeader';
import { RecipeManager } from './components/RecipeManager';
import { ResourceUtilizationDashboard } from './components/ResourceUtilization';
import { BakerySettings } from './components/BakerySettings';
import ConsolidatedScheduleView from './components/ScheduleView';

type ViewMode = 'new-order' | 'manager' | 'baker' | 'orders' | 'gantt' | 'delivery' | 'kot' | 'recipes' | 'resources' | 'settings';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('manager');
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);
  const [selectedBaker, setSelectedBaker] = useState<"Baker1" | "Baker2">("Baker1");
  const [selectedWorkstation, setSelectedWorkstation] = useState<string>("oven_main");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const NavButton: React.FC<{
    mode: ViewMode;
    icon: React.ReactNode;
    label: string;
  }> = ({ mode, icon, label }) => (
    <Button
      onClick={() => setViewMode(mode)}
      variant={viewMode === mode ? "default" : "outline"}
      className="flex items-center space-x-2"
    >
      {icon}
      <span>{label}</span>
    </Button>
  );

  const handleDeliveryClick = (deliveryId: string) => {
    setSelectedDelivery(deliveryId);
    setViewMode('delivery');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
            </div>
            
            <div className="flex space-x-2 items-center overflow-x-auto">
              <NavButton
                mode="gantt"
                icon={<Calendar className="w-4 h-4" />}
                label="Gantt"
              />
              <NavButton
                mode="delivery"
                icon={<Truck className="w-4 h-4" />}
                label="Delivery"
              />
              <NavButton
                mode="manager"
                icon={<Calendar className="w-4 h-4" />}
                label="Schedule"
              />
              <NavButton
                mode="baker"
                icon={<ChefHat className="w-4 h-4" />}
                label="Baker View"
              />
              <NavButton
                mode="kot"
                icon={<Monitor className="w-4 h-4" />}
                label="Kitchen Orders"
              />
              <NavButton
                mode="orders"
                icon={<ClipboardList className="w-4 h-4" />}
                label="Orders"
              />
              <NavButton
                mode="recipes"
                icon={<BookOpen className="w-4 h-4" />}
                label="Recipes"
              />
              <NavButton
                mode="resources"
                icon={<BarChart3 className="w-4 h-4" />}
                label="Resources"
              />
              <NavButton
                mode="settings"
                icon={<Settings className="w-4 h-4" />}
                label="Settings"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 view-container">
            {viewMode === 'gantt' ? (
              <>
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-foreground mb-2">Bakery Production Schedule</h1>
                  <p className="text-muted-foreground">Daily baking and delivery timeline</p>
                </div>
                <ConsolidatedScheduleView />
              </>
            ) : viewMode === 'delivery' ? (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Delivery Tracking</h1>
                    <p className="text-muted-foreground">Real-time delivery status and location</p>
                  </div>
                </div>
                <DeliveryTracker selectedDelivery={selectedDelivery} />
              </>
            ) : viewMode === 'kot' ? (
              <>
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
                  </div>
                </div>
                <UnifiedKOT defaultView="manager" workstation={selectedWorkstation} selectedDate={selectedDate} />
              </>
            ) : viewMode === 'new-order' ? (
              <EnhancedOrderForm />
            ) : viewMode === 'manager' ? (
              <ConsolidatedScheduleView />
            ) : viewMode === 'orders' ? (
              <OrdersView onNewOrder={() => setViewMode('new-order')} />
            ) : viewMode === 'baker' ? (
              <>
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
              </>
            ) : viewMode === 'recipes' ? (
              <>
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
              </>
            ) : viewMode === 'resources' ? (
              <>
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
              </>
            ) : viewMode === 'settings' ? (
              <BakerySettings />
            ) : null}
      </div>

      {/* Status Bar */}
      <div className="fixed bottom-0 w-full bg-card border-t">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
                            Logged in as: {
                viewMode === 'manager' 
                  ? 'Manager' 
                  : viewMode === 'baker' 
                    ? selectedBaker 
                    : viewMode === 'gantt'
                      ? 'Gantt View'
                      : viewMode === 'delivery'
                        ? 'Delivery Tracker'
                        : viewMode === 'kot'
                          ? 'Kitchen Orders'
                          : viewMode === 'recipes'
                              ? 'Recipe Manager'
                                                        : viewMode === 'resources'
                            ? 'Resource Dashboard'
                            : viewMode === 'settings'
                              ? 'Settings'
                              : 'Staff'
              }
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;