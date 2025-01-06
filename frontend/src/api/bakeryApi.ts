import { 
  Order, 
  ValidationResponse, 
  ScheduledTask, 
  BakerTask, 
  parseDateString 
} from '../types';

const API_BASE_URL = 'http://localhost:8000';

interface ScheduleResponse {
  schedule: ScheduledTask[];
  summary?: {
    total_orders: number;
    total_tasks: number;
    // Add other summary fields as needed
  };
}

interface ConfigResponse {
  // Define based on your backend config
  delivery_slots: Array<{id: string, time: string}>;
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

// Transform raw API data to typed objects
function transformScheduledTask(task: any): ScheduledTask {
  return {
    ...task,
    startTime: parseDateString(task.startTime),
    endTime: parseDateString(task.endTime)
  };
}

function transformBakerTask(task: any): BakerTask {
  return {
    ...task,
    time: parseDateString(task.time)
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
    } catch {
      // If JSON parsing fails, use status text
      throw new Error(`HTTP error! status: ${response.status}, ${response.statusText}`);
    }
  }
  return response.json();
}

export const bakeryApi = {


  validateOrder: async (order: Partial<Order>): Promise<ValidationResponse> => {
    // Transform the order to match the server's expected format
    const transformedOrder = {
      // Convert frontend camelCase to backend snake_case
      id: order.id || crypto.randomUUID(),
      customer_name: order.customerName || '',
      status: order.status || 'pending',
      created_at: order.created_at || new Date().toISOString(),
      updated_at: order.updated_at || new Date().toISOString(),
      delivery_date: order.deliveryDate || '',
      delivery_slot: order.deliverySlot || '',
      location: order.location || '',
      estimated_travel_time: order.estimatedTravelTime || 30,
      items: order.items || []
    };

    console.log('Sending order for validation:', transformedOrder);

    const response = await fetch(`${API_BASE_URL}/orders/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transformedOrder),
    });
    return handleResponse<ValidationResponse>(response);
  },

  
  
 createOrder: async (order: Order): Promise<{
    orderId: string;
    tasks: ScheduledTask[];
  }> => {
    // Transform the order to match the server's expected format
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
        product: item.product,
        quantity: item.quantity
      }))
    };
    
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transformedOrder),
    });
    
    const result = await handleResponse<{
      orderId: string;
      tasks: any[];
    }>(response);
    
    // Transform tasks to use Date objects
    return {
      orderId: result.orderId,
      tasks: result.tasks.map(task => ({
        orderId: task.order_id,
        step: task.step,
        startTime: new Date(task.start_time),
        endTime: new Date(task.end_time),
        resources: task.resources,
        batchSize: task.batch_size,
        status: task.status
      }))
    };
  }



getOrders: async (status?: string): Promise<Order[]> => {
    const url = new URL(`${API_BASE_URL}/orders`);
    /* if (status) {
      url.searchParams.append('status', status); // Optional status filter
    } */

    const response = await fetch(url.toString());
    const result = await handleResponse<{ orders: any[] }>(response);

    // Return the orders after transforming them into the correct type
    return result.orders.map((order) => ({
      ...order,
      // You can transform the order data here if needed
    }));
  },

  getSchedule: async (date: string, includeDetails: boolean = false): Promise<ScheduleResponse> => {
    const url = new URL(`${API_BASE_URL}/schedule/${date}`);
    if (includeDetails) {
      url.searchParams.append('include_details', 'true');
    }

    const response = await fetch(url.toString());
    const result = await handleResponse<{
      schedule: any[];
      summary?: any;
    }>(response);

    return {
      schedule: result.schedule.map(transformScheduledTask),
      summary: result.summary
    };
  },

  getConfig: async (): Promise<ConfigResponse> => {
    const response = await fetch(`${API_BASE_URL}/config`);
    return handleResponse<ConfigResponse>(response);
  },

  getBakerTasks: async (date: string, baker: 'Baker1' | 'Baker2'): Promise<{ tasks: BakerTask[] }> => {
    const response = await fetch(`${API_BASE_URL}/baker/${baker}`);
    const result = await handleResponse<{ tasks: any[] }>(response);
    
    return {
      tasks: result.tasks.map(transformBakerTask)
    };
  },

  updateTaskStatus: async (
    baker: 'Baker1' | 'Baker2',
    taskId: string,
    status: BakerTask['status']
  ): Promise<BakerTask> => {
    const response = await fetch(`${API_BASE_URL}/baker/${baker}/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
    const result = await handleResponse<any>(response);
    return transformBakerTask(result);
  },

  // Debug method to fetch available recipes
  getAvailableRecipes: async (): Promise<Array<{
    product: string;
    minBatchSize: number;
    maxBatchSize: number;
    requiresChilling: boolean;
    totalProductionTime: number;
  }>> => {
    const response = await fetch(`${API_BASE_URL}/debug/recipes`);
    return handleResponse<any[]>(response);
  }
};
