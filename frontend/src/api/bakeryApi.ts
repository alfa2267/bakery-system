import { 
  Order, 
  ValidationResponse, 
  ScheduledTask,
  Resource,
  Recipe,
  BaseTask,
  TaskStatus
} from '../types';

const API_BASE_URL = (() => {
  if (window.location.hostname.includes('.app.github.dev')) {
    return 'https://fluffy-cod-wr6xg46jp9429j6j-8000.app.github.dev';
  }
  return 'http://localhost:8000';
})();

interface ScheduleResponse {
  schedule: ScheduledTask[];
  summary?: {
    total_orders: number;
    total_tasks: number;
    resource_utilization: Array<{
      resource: string;
      utilization_percentage: number;
      busy_minutes: number;
      total_minutes: number;
    }>;
  };
}

interface ConfigResponse {
  delivery_slots: Array<{ id: string, time: string }>;
  business_hours: {
    store: { open: string, close: string };
    kitchen: { open: string, close: string };
  };
  resources: {
    bakers: number;
    ovens: number;
    mixers: number;
  };
}

interface RecipesResponse {
  recipes: Recipe[];
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
    } catch {
      throw new Error(`HTTP error! status: ${response.status}, ${response.statusText}`);
    }
  }
  try {
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error parsing response:', error);
    throw new Error('Invalid response format');
  }
}

export const bakeryApi = {
  validateOrder: async (order: Partial<Order>): Promise<ValidationResponse> => {
    const transformedOrder = {
      id: order.id,
      customer_name: order.customerName,
      status: order.status || 'new',
      created_at: order.created_at || new Date().toISOString(),
      updated_at: order.updated_at || new Date().toISOString(),
      delivery_date: order.deliveryDate,
      delivery_slot: order.deliverySlot,
      location: order.location,
      estimated_travel_time: order.estimatedTravelTime,
      items: order.items?.map(item => ({
        product: {
          name: item.product.name, 
          id: item.product.id
        },
        quantity: item.quantity
      })) || []
    };

    const response = await fetch(`${API_BASE_URL}/orders/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transformedOrder),
    });
    return handleResponse<ValidationResponse>(response);
  },

  createOrder: async (order: Order): Promise<{
    status: number; 
    orderId: string;
    tasks: ScheduledTask[];
  }> => {
    const transformedOrder = {
      id: order.id,
      customer_name: order.customerName,
      status: order.status || 'new',
      created_at: order.created_at || new Date().toISOString(),
      updated_at: order.updated_at || new Date().toISOString(),
      delivery_date: order.deliveryDate,
      delivery_slot: order.deliverySlot,
      location: order.location,
      estimated_travel_time: order.estimatedTravelTime,
      items: order.items.map(item => ({
        product: {
          name: item.product.name, 
          id: item.product.id
        },
        quantity: item.quantity
      }))
    };

    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transformedOrder),
    });
    
    const result = await handleResponse<{ orderId: string; tasks: ScheduledTask[] }>(response);
    return {
      orderId: result.orderId,
      status: response.status,
      tasks: result.tasks
    };
  },

  getOrders: async (): Promise<Order[]> => {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    const result = await handleResponse<{ orders: Order[] }>(response);
    return result.orders;
  },

  getSchedule: async (date: string, includeDetails: boolean = false): Promise<ScheduleResponse> => {
    const url = new URL(`${API_BASE_URL}/schedule/${date}`);
    if (includeDetails) url.searchParams.append('include_details', 'true');
    const response = await fetch(url.toString());
    return handleResponse<ScheduleResponse>(response);
  },

  updateTaskTiming: async (taskId: string, start: Date, end: Date): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/timing`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start: start.toISOString(),
        end: end.toISOString()
      }),
    });
    await handleResponse<void>(response);
  },

  updateTaskStatus: async (taskId: string, status: TaskStatus): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await handleResponse<void>(response);
  },

  getConfig: async (): Promise<ConfigResponse> => {
    const response = await fetch(`${API_BASE_URL}/config`);
    return handleResponse<ConfigResponse>(response);
  },

  getResources: async (
    date?: string, 
    filterName?: string, 
    filterType?: 'staff' | 'equipment'
  ): Promise<{
    staff: any[];
    equipment: any[];
    task_resources?: ScheduledTask[];

  }> => {
    const url = new URL(`${API_BASE_URL}/resources`);
    if (date) url.searchParams.append('date', date);
    if (filterName) url.searchParams.append('filter_name', filterName);
    if (filterType) url.searchParams.append('filter_type', filterType);
  
    const response = await fetch(url.toString());
    return handleResponse<{
      staff: any[];
      equipment: any[];
      task_resources?: ScheduledTask[];
    }>(response);
  },

  getTasks: async (date: string, resource: string): Promise<{ tasks: BaseTask[] }> => {
    const url = new URL(`${API_BASE_URL}/resources`);
    url.searchParams.append('date', date);
    url.searchParams.append('baker_name', resource);

    const response = await fetch(url.toString());
    const result = await handleResponse<{
      staff: any[];
      equipment: any[];
      tasks?: BaseTask[];
    }>(response);

    return { tasks: result.tasks || [] };
  },

  getAvailableRecipes: async (): Promise<Recipe[]> => {
    const response = await fetch(`${API_BASE_URL}/recipes`);
    const data = await handleResponse<RecipesResponse>(response);
    
    if (data && Array.isArray(data.recipes)) {
      return data.recipes;
    }
    
    if (Array.isArray(data)) {
      return data;
    }
    
    throw new Error('Invalid recipes data structure');
  }
};