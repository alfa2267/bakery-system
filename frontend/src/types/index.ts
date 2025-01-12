// src/types/index.ts

// Define the base task interface that matches Frappe Gantt's structure
export interface BaseTask {
  id: string;
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

// Type definitions
export type OrderStatus = 'new' | 'pending' | 'in-progress' | 'completed' | 'cancelled';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'blocked';
export type ProductionStep = 'mixing' | 'chilling' | 'shaping' | 'baking' | 'cooling' | 'proofing';
export type ViewMode = FrappeViewMode


export interface ScheduledTask {
  id: string;
  orderId: string;
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
  id: string;
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
  return task && '_data' in task && task._data?.originalTask !== undefined;
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
  'mixing', 'chilling', 'shaping', 'baking', 'cooling', 'proofing'
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

// Utility functions
export const formatDateToISO = (date: Date): string => {
  return date.toISOString();
};


// Extended Frappe Gantt View Modes
export type FrappeViewMode = 'Minute' | 'Hour' | 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month';


// Extend Frappe Gantt prototype to add custom view mode functionality
export function extendGanttViewModes(Gantt: any) {
  // Store original methods
  const originalInitGrid = Gantt.prototype.init_grid;
  const originalDateFromString = Gantt.prototype.date_from_string;

  // Extend Gantt prototype with new view modes
  Gantt.prototype.init_grid = function(mode: FrappeViewMode) {
    // Add support for Minute and Hour view modes
    if (mode === 'Minute') {
      this.gantt_width = this.gantt_width || this.container.clientWidth;
      this.options.step = 15; // 15-minute steps
      this.options.column_width = 20; // Adjust column width for minute view
      this.options.date_unit = this.minute; // Use custom minute logic
      this.options.date_formatter = this.dateFormatter('minute');
    } else if (mode === 'Hour') {
      this.gantt_width = this.gantt_width || this.container.clientWidth;
      this.options.step = 1; // 1-hour steps
      this.options.column_width = 60; // Adjust column width for hour view
      this.options.date_unit = this.hour;
      this.options.date_formatter = this.dateFormatter('hour');
    }
  
    // Call original method for other view modes
    const result = originalInitGrid.call(this, mode);
  
    // Adjust grid rendering to use new row height
    if (this.gantt_rows) {
      this.gantt_rows.forEach((row: any, i: number) => {
        const y_pos = this.options.header_height + (i * this.options.row_height);
        row.setAttribute('y', y_pos.toString());
        row.setAttribute('height', this.options.row_height.toString());
      });
  
      // Update grid background height
      const grid = this.gantt_container.querySelector('.grid');
      if (grid) {
        const backgroundRect = grid.querySelector('.grid-background');
        if (backgroundRect) {
          const totalGridHeight = this.options.header_height + 
            (this.gantt_rows.length * this.options.row_height);
          backgroundRect.setAttribute('height', totalGridHeight.toString());
        }
      }
    }
  
    return result;
  };
  

  // Custom date formatters
  Gantt.prototype.dateFormatter = function(granularity: 'minute' | 'hour') {
    return (date: Date, format: string) => {
      const formatters: {[key: string]: (date: Date) => string} = {
        minute: (date: Date) => date.toLocaleString('default', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        hour: (date: Date) => date.toLocaleString('default', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit' 
        })
      };
      
      return formatters[granularity](date);
    };
  };
  

  // Extend date parsing methods if necessary
  Gantt.prototype.date_from_string = function(date_string: string, date_format?: string) {
    // Add custom parsing for minute/hour views if needed
    return originalDateFromString.call(this, date_string, date_format);
  };

  // Add minute and hour as date units
  Gantt.prototype.minute = function(date: Date): Date {
    const newDate = new Date(date);
    const minutes = Math.floor(newDate.getMinutes() / 15) * 15; // Round down to nearest 15-minute mark
    newDate.setMinutes(minutes, 0, 0);
    return newDate;
  };
  
  Gantt.prototype.hour = function(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours(), 0, 0, 0);
    return newDate;
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
  filteredSteps: Set<string>;
  onTasksUpdate?: (tasks: ScheduledTask[]) => void;
  onDateChange?: (task: ScheduledTask, start: Date, end: Date) => void;
  onProgressChange?: (task: ScheduledTask, progress: number) => void;
}
