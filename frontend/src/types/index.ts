// src/types/index.ts

// Basic interfaces
export interface Product {
  id: number;
  name: string;
}

export interface Ingredient {
  name: string;
  unit: string;
  qty: string;
}

// Step interface matching JSON structure
export interface Step {
  id: string;
  name: 'mixing' | 'chilling' | 'shaping' | 'baking' | 'cooling' | 'proofing';
  duration: number;
  requiresHuman: boolean;
  requiresOven: boolean;
  requiresMixer: boolean;
  mustFollowImmediately: boolean;
  scalingFactor?: number;
}

// Recipe interface matching JSON structure
export interface Recipe {
  id: number;
  product: Product;
  ingredients: Ingredient[];
  steps: Step[];
  requiresChilling: boolean;
  maxChillTime: number;
  minBatchSize: number;
  maxBatchSize: number;
  unit: string;
}

// Order-related interfaces
export interface OrderItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  deliveryDate: string;
  deliverySlot: string;
  location: string;
  items: OrderItem[];
  estimatedTravelTime: number;
  status?: OrderStatus;
  created_at?: string;
  updated_at?: string;
}

export type OrderStatus = 'new' | 'pending' | 'in-progress' | 'completed' | 'cancelled';

export type ProductionStep = 'mixing' | 'chilling' | 'shaping' | 'baking' | 'cooling' | 'proofing';

// Scheduling and Task-related Interfaces
export interface ScheduledTask {
  orderId: string;
  step: ProductionStep;
  startTime: Date;
  endTime: Date;
  resources: string[];
  batchSize: number;
  status?: TaskStatus;
  name?: string;
  dependencies?: string[];
  progress?: number;
  product?: Product;
}

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'blocked';

export interface StepTask {
  id: string;
  time: Date;
  action: string;
  details: string;
  equipment: string;
  status: TaskStatus;
  dependencies?: {
    from: string;
    what: string;
    urgent: boolean;
  }[];
}

export interface DeliverySlot {
  id: string;
  time: string;
}

export interface ValidationResponse {
  isValid: boolean;
  warnings: string[];
}

// Gantt-related Interfaces and Configurations
export interface GanttOptions {
  viewMode?: ViewMode;
  barHeight?: number;
  headerHeight?: number;
  padding?: number;
  highlightWeekends?: boolean;
  readonly?: boolean;
  workHours?: {
    start: number;
    end: number;
  };
}

export type ViewMode = 
  | 'Minute' 
  | 'Hour' 
  | 'Quarter Day' 
  | 'Half Day' 
  | 'Day' 
  | 'Week' 
  | 'Month';

export interface ViewModeConfig {
  hours: number[];
  columnWidth: number;
  label: (date: Date) => string;
}

// Default Configuration Constants
export const DEFAULT_OPTIONS: GanttOptions = {
  viewMode: 'Day',
  barHeight: 30,
  headerHeight: 65,
  padding: 18,
  highlightWeekends: true,
  readonly: false,
  workHours: {
    start: 8,
    end: 18
  }
};

export const PRODUCTION_STEPS: ProductionStep[] = ['mixing', 'chilling', 'shaping', 'baking', 'cooling', 'proofing'];

export const STEP_COLORS: Record<ProductionStep, string> = {
  mixing: 'bg-blue-500',
  chilling: 'bg-purple-500',
  shaping: 'bg-orange-500',
  baking: 'bg-red-500',
  cooling: 'bg-green-500',
  proofing: 'bg-yellow-500'
};

export const STEP_HOVER_COLORS: Record<ProductionStep, string> = {
  mixing: 'group-hover:bg-blue-600',
  chilling: 'group-hover:bg-purple-600',
  shaping: 'group-hover:bg-orange-600',
  baking: 'group-hover:bg-red-600',
  cooling: 'group-hover:bg-green-600',
  proofing: 'group-hover:bg-yellow-600'
};

export const VIEW_MODES: Record<ViewMode, ViewModeConfig> = {
  'Minute': { 
    hours: Array.from({ length: 1440 }, (_, i) => Math.floor(i / 60)), 
    columnWidth: 50,
    label: (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  },
  'Hour': { 
    hours: Array.from({ length: 24 }, (_, i) => i), 
    columnWidth: 100,
    label: (date: Date) => `${date.getHours()}:00`
  },
  'Quarter Day': { 
    hours: [0, 6, 12, 18], 
    columnWidth: 200,
    label: (date: Date) => {
      const hours = date.getHours();
      if (hours === 0) return '00:00';
      if (hours === 6) return '06:00';
      if (hours === 12) return '12:00';
      if (hours === 18) return '18:00';
      return '';
    }
  },
  'Half Day': { 
    hours: [0, 12], 
    columnWidth: 300,
    label: (date: Date) => date.getHours() === 0 ? '00:00' : '12:00'
  },
  'Day': { 
    hours: Array.from({ length: 24 }, (_, i) => i), 
    columnWidth: 100,
    label: (date: Date) => `${date.getHours()}:00`
  },
  'Week': { 
    hours: [0, 6, 12, 18], 
    columnWidth: 200,
    label: (date: Date) => {
      const hours = date.getHours();
      if (hours === 0) return 'Mon';
      if (hours === 6) return 'Wed';
      if (hours === 12) return 'Fri';
      if (hours === 18) return 'Sun';
      return '';
    }
  },
  'Month': { 
    hours: [1], 
    columnWidth: 400,
    label: (date: Date) => date.toLocaleDateString([], { month: 'short' })
  }
};

export const formatDateToISO = (date: Date): string => {
  return date.toISOString();
};
