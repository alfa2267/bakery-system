import { 
  Order, 
  ValidationResponse, 
  ScheduledTask,
  BakerTask,
  transformScheduledTask,
  Recipe
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
    console.log('API Response:', data); // Debug log
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
      }))
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
      status: order.status,
      created_at: order.created_at,
      updated_at: order.updated_at,
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
    const result = await handleResponse<{ orders: any[] }>(response);
    return result.orders.map((order: any) => ({
      id: order.id,
      customerName: order.customer_name,
      status: order.status,
      created_at: order.created_at,
      updated_at: order.updated_at,
      deliveryDate: order.delivery_date,
      deliverySlot: order.delivery_slot,
      location: order.location,
      estimatedTravelTime: order.estimated_travel_time,
      items: order.items.map((item: any) => ({
        product: {
          name: item.product.name, 
          id: item.product.id
        },
        quantity: item.quantity
      }))
    }));
  },

  getSchedule: async (date: string, includeDetails: boolean = false): Promise<ScheduleResponse> => {
    const url = new URL(`${API_BASE_URL}/schedule/${date}`);
    if (includeDetails) url.searchParams.append('include_details', 'true');
    const response = await fetch(url.toString());
    return handleResponse<ScheduleResponse>(response);
  },

  getConfig: async (): Promise<ConfigResponse> => {
    const response = await fetch(`${API_BASE_URL}/config`);
    return handleResponse<ConfigResponse>(response);
  },

  getBakerTasks: async (date: string, baker: string): Promise<{ tasks: BakerTask[] }> => {
    const response = await fetch(`${API_BASE_URL}/baker/${baker}?date=${date}`);
    const result = await handleResponse<{ tasks: any[] }>(response);
    return {
      tasks: result.tasks.map(task => ({
        id: task.id,
        time: new Date(task.time),
        action: task.action,
        details: task.details,
        equipment: task.equipment,
        status: task.status,
        dependencies: task.dependencies?.map((dep: any) => ({
          from: dep.from,
          what: dep.what,
          urgent: dep.urgent
        }))
      }))
    };
  },

  updateTaskStatus: async (
    baker: string,
    taskId: string,
    status: BakerTask['status']
  ): Promise<BakerTask> => {
    const response = await fetch(`${API_BASE_URL}/baker/${baker}/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const result = await handleResponse<BakerTask>(response);
    return result;
  },

  getAvailableRecipes: async (): Promise<Recipe[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/recipes`);
      const data = await handleResponse<RecipesResponse>(response);
      
      console.log(data.recipes)

      // Check if we have recipes array and return it
      if (data && Array.isArray(data.recipes)) {
        console.log('Recipes fetched:', data.recipes);
        return data.recipes;
      }
      
      // If data is an array directly (fallback)
      if (Array.isArray(data)) {
        console.log('Recipes fetched (direct array):', data);
        return data;
      }
      
      console.error('Invalid recipes data structure:', data);
      throw new Error('Invalid recipes data structure');
    } catch (error) {
      console.error('Error fetching recipes:', error);
      throw error;
    }
  }
};