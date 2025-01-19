// src/types/index.ts

// Define the base task interface that matches Frappe Gantt's structure
export interface BaseTask {
  id: number;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies: string;
  custom_class?: string;
}

// Our custom task interface
export interface GanttTask extends BaseTask {
  custom_class: string;
  _data: {
    originalTask: ScheduledTask;
    groupName: string;
  };
}

// Validation Response interface
export interface ValidationResponse {
  isValid: boolean;
  warnings: string[];
  errors?: string[];
  conflicts?: {
    type: string;
    message: string;
    details?: any;
  }[];
}

// Basic interfaces
export interface Product {
  id: number;
  name: string;
}

export interface Ingredient {
  product: Product;
  unit: string;
  qty: number;
}

// Step interface matching JSON structure
export interface Step {
  id: number;
  name: ProductionStep;
  duration: number;
  requiresHuman: boolean;
  equipment: Resource[]
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
  maxStorageTime?: number; // Days products can be stored

  unit: string;
}

// Order-related interfaces
export interface OrderItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: number;
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

// Type definitions
export type OrderStatus = 'new' | 'pending' | 'in-progress' | 'completed' | 'cancelled';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'blocked';
export type ProductionStep = 'mixing' | 'chilling' | 'shaping' | 'baking' | 'cooling' | 'proofing';
export type ViewMode = FrappeViewMode;

export interface ScheduledTask {
  id: number;
  orderId: number;
  step: ProductionStep;
  startTime: Date;
  endTime: Date;
  resources: Resource[];
  batchSize: number;
  dependencies: string | '';
  status?: TaskStatus;
  name?: string;
  product?: Product;
}

export interface Resource {
  id: number;
  name: string;
}

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

export interface ViewModeConfig {
  hours: number[];
  columnWidth: number;
  label: (date: Date) => string;
}

// Type guard for runtime checking
export function isGanttTask(task: any): task is GanttTask {
  return task && 
         '_data' in task && 
         task._data?.originalTask !== undefined &&
         task._data?.groupName !== undefined;
}

// Optional: Add helper type for Gantt popup
export interface GanttPopupData {
  task: GanttTask;
}

// Constants
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

export const PRODUCTION_STEPS: ProductionStep[] = [
  'mixing', 
  'chilling', 
  'shaping', 
  'baking', 'cooling', 'proofing'
];

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

// Update FrappeViewMode type to match the actual strings used
export type FrappeViewMode = 'Minute' | 'Hour' | 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year';

export const VIEW_MODES: Record<FrappeViewMode, ViewModeConfig> = {
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
  },
  'Quarter': {
    hours: [24*30*4],
    columnWidth: 200,
    label: (date: Date) => date.toLocaleDateString([], { year: 'numeric' })
  },
  'Year': {
    hours: [24*30*12],
    columnWidth: 200,
    label: (date: Date) => date.toLocaleDateString([], { year: 'numeric' })
  }
};

export function extendGanttViewModes(Gantt: any) {
  Gantt.VIEW_MODE.MINUTE = {
    name: 'Minute',
    step: '15min',
    column_width: 50,
    padding: ['1d', '1d'],
    upper_text: (date: Date) => date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    }),
    lower_text: (date: Date) => date.toLocaleString()
  };
  return Gantt;
}

// Gantt Configuration
export const GANTT_CONFIG = {
  headerHeight: 60,
  rowHeight: 60,
  colors: {
    gridBackground: '#f3f4f6',
    barHover: '#2563eb'
  }
};

// Gantt Chart Props Interface
export interface GanttChartProps {
  tasks: ScheduledTask[];
  viewMode: FrappeViewMode;
  filteredSteps: Set<ProductionStep>;
  onTasksUpdate?: (tasks: ScheduledTask[]) => void;
  onDateChange?: (task: ScheduledTask, start: Date, end: Date) => void;
  onProgressChange?: (task: ScheduledTask, progress: number) => void;
}


export type SortField = 'id' | 'customerName' | 'deliveryDate' | 'deliverySlot' | 'location';
export type SortDirection = 'asc' | 'desc';
export type ScreenViewMode =  'manager' | 'baker1' | 'baker2' | 'orders' | 'recipes' | 'products' | 'list' | 'calendar' | 'gantt';

export type GroupingMode = 'step' | 'product';


export interface GanttViewProps {
  tasks: ScheduledTask[];
  orders: Order[];
  viewMode: FrappeViewMode;
  filteredSteps: Set<ProductionStep>;
  groupingMode: GroupingMode;
  onDateChange: (task: ScheduledTask, start: Date, end: Date) => Promise<void>;
  onProgressChange: (task: ScheduledTask, progress: number) => Promise<void>;
}

export interface ValidationError {
  detail?: Array<{
    type?: string;
    loc?: string[];
    msg?: string;
    input?: any;
  }>;
  message?: string;
}

export interface RecipeFormProps {
  initialRecipe?: Recipe;
  onSubmit: (recipe: Recipe) => void;
  onCancel: () => void;
}

export interface Option {
  value: number;
  label: string;
}
// Error Handler Component Props
export interface RecipeErrorHandlerProps {
  error: ValidationError | string | null;
  onDismiss: () => void;
}
