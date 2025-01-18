// src/App.tsx
import React, { useState } from 'react';
import { ChefHat, Calendar, User, PlusCircle, ClipboardList, VeganIcon, BookAIcon } from 'lucide-react';
import GanttView from './components/GanttView';
import BakerView from './components/BakerView';
import OrdersView from './components/OrdersView';
import RecipesView from './components/RecipesView';
import ProductsView from './components/ProductsView';


type ViewMode =  'manager' | 'baker1' | 'baker2' | 'orders' | 'recipes' | 'products';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('manager');

  const NavButton: React.FC<{
    mode: ViewMode;
    icon: React.ReactNode;
    label: string;
  }> = ({ mode, icon, label }) => (
    <button
      onClick={() => setViewMode(mode)}
      className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
        viewMode === mode 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-100 hover:bg-gray-200'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Bakery Production Dashboard</h1>
            </div>
            
            <div className="flex space-x-2 items-center">
              <NavButton
                mode="orders"
                icon={<ClipboardList className="w-4 h-4" />}
                label="Orders"
              />
              <NavButton
                mode="manager"
                icon={<Calendar className="w-4 h-4" />}
                label="Schedule"
              />
              <NavButton
                mode="baker1"
                icon={<ChefHat className="w-4 h-4" />}
                label="Baker 1"
              />
              <NavButton
                mode="baker2"
                icon={<ChefHat className="w-4 h-4" />}
                label="Baker 2"
              />
                <NavButton
                mode="recipes"
                icon={<VeganIcon className="w-4 h-4" />}
                label="Recipes"
              />
                  <NavButton
                mode="products"
                icon={<VeganIcon className="w-4 h-4" />}
                label="Products"
              />
               
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {viewMode === 'manager' ? (
          <GanttView />
        ) : viewMode === 'orders' ? (
          <OrdersView />
        ) : viewMode === 'recipes' ? (
          <RecipesView />
        ) : viewMode === 'products' ? (
          <ProductsView />
        ) : (
          <BakerView selectedBaker={viewMode === 'baker1' ? 'Baker1' : 'Baker2'} />
        )}
      </div>

      {/* Status Bar */}
      <div className="fixed bottom-0 w-full bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Logged in as: {
                viewMode === 'manager' 
                  ? 'Manager' 
                  : viewMode === 'baker1' 
                    ? 'Baker 1' 
                    : viewMode === 'baker2' 
                      ? 'Baker 2' 
                      : 'Staff'
              }
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;