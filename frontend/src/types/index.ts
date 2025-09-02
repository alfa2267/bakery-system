// src/types/index.ts

// Order-related interfaces
export interface Order {
  id: string
  customerName: string
  status: "new" | "confirmed" | "in_progress" | "completed" | "pending"
  created_at: string
  updated_at: string
  deliveryDate: string
  deliverySlot: string
  location: string
  estimatedTravelTime: number
  items: OrderItem[]
}

export interface OrderItem {
  product: string
  quantity: number
  notes?: string
  customizations?: {
    size?: string
    flavor?: string[]
    icing?: { type: string; flavor: string; message?: string }
    toppings?: string[]
    specialInstructions?: string
  }
  basePrice: number
  totalPrice: number
  inspirationImage?: File
  designNotes?: string
}

// Explicit type for order statuses to ensure type safety
export type OrderStatus = 'new' | 'pending' | 'in-progress' | 'completed' | 'cancelled';

// Component Props Interfaces
export interface BakerViewProps {
  selectedBaker: 'Baker1' | 'Baker2';
}

export interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  onImageRemove?: () => void;
  currentImage?: File | string;
  accept?: string;
  maxSizeInMB?: number;
  className?: string;
  disabled?: boolean;
}

export interface PresetSelectorProps {
  presets: OrderPreset[];
  onSelectPreset: (preset: OrderPreset) => void;
  selectedPreset?: string;
  className?: string;
}

export interface GlobalHeaderProps {
  currentPage: "gantt" | "delivery" | "baker" | "orders" | "order-form" | "workstation-kot" | "manager-kot";
  onNavigate: (
    page: "gantt" | "delivery" | "baker" | "orders" | "order-form" | "workstation-kot" | "manager-kot",
  ) => void;
}

export interface CustomizationFormProps {
  item: OrderItem;
  itemIndex: number;
  onChange: (updatedItem: OrderItem) => void;
  onRemove: () => void;
}

export interface OrderViewProps {
  onNewOrder?: () => void;
}

export interface UnifiedKOTProps {
  defaultView?: 'manager' | 'workstation';
  workstation?: string;
  selectedDate?: string;
}

export interface DeliveryTrackerProps {
  onDeliveryClick: (deliveryId: string) => void;
}

// Schedule and Resource Interfaces
export interface TaskInstance {
  id: string;
  taskName: string;
  category: string;
  startTime: number;
  duration: number;
  assignee: string;
  priority: string;
  workCenter: string;
  instanceId: string;
  salesOrder: string;
  customer: string;
  deliveryDate: string;
  orderDate: string;
  manufacturingOrder: string;
  ingredients: string[];
  product: string;
  workstation: string;
  recipeStep: string;
  orderId: string;
  taskId: string;
  status: string;
  estimatedDuration: number;
  actualDuration: number;
  resourceId: string;
  quantity: number;
}

export interface ResourceUtilization {
  resource: string;
  utilization_percentage: number;
  busy_minutes: number;
  total_minutes: number;
}

export interface DailyScheduleSummary {
  date: string;
  total_orders: number;
  total_tasks: number;
  resource_utilization: ResourceUtilization[];
  start_time: Date;
  end_time: Date;
}

// Recipe-related interfaces
export interface Recipe {
  id: string;
  productType: string;
  steps: RecipeStep[];
  requiresChilling: boolean;
  maxChillTime: number;
  minBatchSize: number;
  maxBatchSize: number;
}

export interface RecipeStep {
  id: string;
  name: string;
  duration: number;
  requiresHuman: boolean;
  requiresOven: boolean;
  requiresMixer: boolean;
  mustFollowImmediately: boolean;
  scalingFactor: number;
}

// Production and Scheduling Types
export type ProductionStep = 'mixing' | 'chilling' | 'shaping' | 'baking' | 'cooling';

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

export interface ScheduledTask {
  id: string
  orderId: string
  step: string
  startTime: Date
  endTime: Date
  status: "pending" | "in_progress" | "completed" | "blocked"
  batchSize: number
  resources: string[]
  duration?: number
}

// Explicit type for task statuses
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';

export interface BakerTask {
  id: string
  action: string
  details: string
  equipment: string
  time: Date
  status: "pending" | "in_progress" | "completed" | "blocked"
  dependencies?: Array<{
    from: string
    what: string
    urgent: boolean
  }>
}

export interface DeliverySlot {
  id: string;
  time: string;
}

export interface ValidationResponse {
  isValid: boolean;
  warnings: string[];
}

// Product Configuration Interfaces
export interface ProductOption {
  id: string
  name: string
  multiplier?: number
  additionalCost?: number
}

export interface ProductConfig {
  id: string
  name: string
  basePrice: number
  availableSizes: ProductOption[]
  availableFlavors: ProductOption[]
  availableIcings: ProductOption[]
  availableToppings: ProductOption[]
  flavorMultipliers: { [count: number]: number }
  minimumQuantity: number
  leadTimeDays: number
}

export interface OrderPreset {
  id: string
  name: string
  description: string
  image?: string
  items: Partial<OrderItem>[]
  totalPrice: number
  category?: string
}

export interface PricingCalculation {
  basePrice: number
  sizeMultiplier: number
  flavorSurcharge: number
  toppingSurcharge: number
  totalPrice: number
  breakdown: Array<{
    description: string
    amount: number
  }>
}

export interface DeliveryZone {
  id: string
  name: string
  surcharge: number
  estimatedTime: number
}

export interface FormErrors {
  [key: string]: string[]
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

// Utility Functions
export function parseDateString(dateString: string): Date {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  
  return date;
}

export function formatDateToISO(date: Date): string {
  return date.toISOString();
}

export function isValidDate(date: any): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

export function transformScheduledTask(task: any): ScheduledTask {
  // Add more robust type checking and transformation
  if (!task) {
    throw new Error('Cannot transform undefined or null task');
  }

  return {
    id: task.id || '',
    orderId: task.orderId || task.order_id || '',
    step: (task.step || 'mixing') as ProductionStep,
    startTime: task.startTime 
      ? (task.startTime instanceof Date 
          ? task.startTime 
          : parseDateString(task.startTime || task.start_time))
      : new Date(),
    endTime: task.endTime
      ? (task.endTime instanceof Date 
          ? task.endTime 
          : parseDateString(task.endTime || task.end_time))
      : new Date(),
    resources: Array.isArray(task.resources) ? task.resources : [],
    batchSize: task.batchSize || task.batch_size || 0,
    status: task.status as TaskStatus || 'pending',
  };
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

export const PRODUCTION_STEPS: ProductionStep[] = ['mixing', 'chilling', 'shaping', 'baking', 'cooling'];

export const STEP_COLORS: Record<ProductionStep, string> = {
  mixing: 'bg-blue-500',
  chilling: 'bg-purple-500',
  shaping: 'bg-orange-500',
  baking: 'bg-red-500',
  cooling: 'bg-green-500',
};

export const STEP_HOVER_COLORS: Record<ProductionStep, string> = {
  mixing: 'group-hover:bg-blue-600',
  chilling: 'group-hover:bg-purple-600',
  shaping: 'group-hover:bg-orange-600',
  baking: 'group-hover:bg-red-600',
  cooling: 'group-hover:bg-green-600',
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