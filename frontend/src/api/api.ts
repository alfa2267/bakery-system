// Consolidated API Client
// This file consolidates all API functionality for the bakery system

// Import existing types
import { 
  Order, 
  ValidationResponse, 
  ScheduledTask,
  BakerTask,
  parseDateString,
  transformScheduledTask
} from '../types';

const API_BASE_URL = (() => {
  // If running in Codespaces, use the forwarded URL
  if (window.location.hostname.includes('.app.github.dev')) {
    return 'https://fluffy-cod-wr6xg46jp9429j6j-8000.app.github.dev';
  }
  // Fallback to localhost for local development
  return process.env.REACT_APP_API_URL || 'http://localhost:8001';
})();

// Utility function for handling API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
    } catch {
      throw new Error(`HTTP error! status: ${response.status}, ${response.statusText}`);
    }
  }
  return response.json();
}

// ============================================================================
// TYPES
// ============================================================================

export interface CakeBase {
  id: number;
  name: string;
  description?: string;
  base_price: number;
  image_emoji?: string;
  image_url?: string;
  is_popular: boolean;
  is_active: boolean;
}

export interface Flavor {
  id: string;
  name: string;
  price_modifier: number;
  category: string;
  description?: string;
  is_active: boolean;
}

export interface IcingType {
  id: string;
  name: string;
  price_modifier: number;
  description?: string;
  is_active: boolean;
}

export interface FillingType {
  id: string;
  name: string;
  price_modifier: number;
  description?: string;
  is_active: boolean;
}

export interface Shape {
  id: string;
  name: string;
  price_modifier: number;
  description?: string;
  is_active: boolean;
}

export interface Size {
  id: string;
  name: string;
  description?: string;
  servings: number;
  price_modifier: number;
  is_active: boolean;
}

export interface ColorScheme {
  id: string;
  name: string;
  colors: string[];
  description?: string;
  is_active: boolean;
}

export interface Topping {
  id: string;
  name: string;
  price_modifier: number;
  description?: string;
  category: string;
  is_active: boolean;
}

export interface DeliverySlot {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  price_modifier: number;
  is_active: boolean;
  is_available: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon?: string;
  is_active: boolean;
  processing_fee: number;
}

export interface CakeConfiguration {
  cake_base_id?: number;
  flavors: string[];
  icing_type?: string;
  icing_flavor?: string;
  filling_type?: string;
  filling_flavor?: string;
  toppings: string[];
  shape_id?: string;
  size_id?: string;
  color_scheme_id?: string;
  custom_colors: string[];
  custom_message?: string;
  special_requests?: string;
  inspiration_images: string[];
}

export interface PriceCalculation {
  base_price: number;
  flavor_additions: number;
  icing_addition: number;
  filling_addition: number;
  topping_additions: number;
  shape_addition: number;
  size_addition: number;
  delivery_addition: number;
  subtotal: number;
  total: number;
}

export interface CakeConfiguratorOptions {
  cake_bases: CakeBase[];
  flavors: Flavor[];
  icing_types: IcingType[];
  filling_types: FillingType[];
  shapes: Shape[];
  sizes: Size[];
  color_schemes: ColorScheme[];
  toppings: Topping[];
  delivery_slots: DeliverySlot[];
  payment_methods: PaymentMethod[];
}

export interface CustomerAddress {
  street: string;
  city: string;
  state: string;
  country: string;
}

export interface Customer {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: CustomerAddress;
}

export interface OrderItem {
  product_id?: number;
  cake_base_id?: number;
  cake_configuration?: CakeConfiguration;
  quantity: number;
}

export interface OrderCreate {
  customer: Customer;
  items: OrderItem[];
  is_delivery: boolean;
  delivery_date: string;
  delivery_slot_id: string;
  payment_method_id: string;
  terms_accepted: boolean;
  delivery_address?: string;
}

// ============================================================================
// CAKE CONFIGURATOR API
// ============================================================================

export const cakeConfiguratorAPI = {
  // Get all available options
  async getOptions(): Promise<CakeConfiguratorOptions> {
    const response = await fetch(`${API_BASE_URL}/cake-configurator/options`);
    return handleResponse<CakeConfiguratorOptions>(response);
  },

  // Calculate price for a configuration
  async calculatePrice(
    configuration: CakeConfiguration,
    delivery_slot_id?: string
  ): Promise<PriceCalculation> {
    const response = await fetch(`${API_BASE_URL}/cake-configurator/calculate-price`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        configuration,
        delivery_slot_id,
      }),
    });
    return handleResponse<PriceCalculation>(response);
  },

  // Validate a configuration
  async validateConfiguration(configuration: CakeConfiguration): Promise<{
    is_valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const response = await fetch(`${API_BASE_URL}/cake-configurator/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(configuration),
    });
    return handleResponse<{
      is_valid: boolean;
      errors: string[];
      warnings: string[];
    }>(response);
  },

  // Estimate delivery time
  async estimateDeliveryTime(
    configuration: CakeConfiguration,
    delivery_date: string
  ): Promise<{ estimated_delivery_time?: string }> {
    const response = await fetch(`${API_BASE_URL}/cake-configurator/estimate-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        configuration,
        delivery_date,
      }),
    });
    return handleResponse<{ estimated_delivery_time?: string }>(response);
  },

  // Get recommendations
  async getRecommendations(configuration: CakeConfiguration): Promise<{
    recommendations: any[];
  }> {
    const response = await fetch(`${API_BASE_URL}/cake-configurator/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(configuration),
    });
    return handleResponse<{ recommendations: any[] }>(response);
  },

  // Create a cake order
  async createOrder(orderData: OrderCreate): Promise<{
    orderId: string;
    tasks: any[];
  }> {
    const response = await fetch(`${API_BASE_URL}/cake-configurator/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    return handleResponse<{
      orderId: string;
      tasks: any[];
    }>(response);
  },

  // Initialize sample data (for development)
  async initializeSampleData(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/cake-configurator/initialize-data`, {
      method: 'POST',
    });
    return handleResponse<{ message: string }>(response);
  },
};

// ============================================================================
// BAKERY API
// ============================================================================

export const bakeryApi = {
  validateOrder: async (order: Partial<Order>): Promise<ValidationResponse> => {
    // Transform the order to match the server's expected format
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
        product: item.product,
        quantity: item.quantity,
        customizations: item.customizations,
        base_price: item.basePrice,
        total_price: item.totalPrice,
        design_notes: item.designNotes,
        inspiration_image: item.inspirationImage ? 'base64-encoded-image' : undefined
      }))
    };

    console.log('Validating order:', transformedOrder);

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
      status: order.status || 'new',
      created_at: order.created_at || new Date().toISOString(),
      updated_at: order.updated_at || new Date().toISOString(),
      delivery_date: order.deliveryDate,
      delivery_slot: order.deliverySlot,
      location: order.location,
      estimated_travel_time: order.estimatedTravelTime,
      items: order.items?.map(item => ({
        product: item.product,
        quantity: item.quantity,
        customizations: item.customizations,
        base_price: item.basePrice,
        total_price: item.totalPrice,
        design_notes: item.designNotes,
        inspiration_image: item.inspirationImage ? 'base64-encoded-image' : undefined
      }))
    };

    console.log('Creating order:', transformedOrder);

    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transformedOrder),
    });
    return handleResponse<{
      orderId: string;
      tasks: ScheduledTask[];
    }>(response);
  },

  getOrders: async (): Promise<Order[]> => {
    const response = await fetch(`${API_BASE_URL}/orders`);
    return handleResponse<Order[]>(response);
  },

  getSchedule: async (date: string, includeDetails: boolean = false): Promise<{
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
      start_time?: string;
      end_time?: string;
    };
  }> => {
    const params = new URLSearchParams();
    if (includeDetails) {
      params.append('include_details', 'true');
    }

    const response = await fetch(`${API_BASE_URL}/schedule/${date}?${params.toString()}`);
    return handleResponse<{
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
    }>(response);
  },

  getBakerTasks: async (bakerName?: string): Promise<{ tasks: any[] }> => {
    const url = bakerName ? `${API_BASE_URL}/baker/${bakerName}` : `${API_BASE_URL}/baker/tasks`;
    const response = await fetch(url);
    return handleResponse<{ tasks: any[] }>(response);
  },

  updateTaskStatus: async (bakerName: string, taskId: string, status: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/baker/${bakerName}/task/${taskId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    return handleResponse<void>(response);
  },

  getAvailableRecipes: async (): Promise<{ recipes: any[] }> => {
    const response = await fetch(`${API_BASE_URL}/debug/recipes`);
    return handleResponse<{ recipes: any[] }>(response);
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(price);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Nigerian phone number validation (basic)
  const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
  return phoneRegex.test(phone);
};

export const validateDeliveryDate = (date: string): boolean => {
  const selectedDate = new Date(date);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return selectedDate >= tomorrow;
};

// Export everything as default for backward compatibility
export default {
  cakeConfiguratorAPI,
  bakeryApi,
  formatPrice,
  validateEmail,
  validatePhone,
  validateDeliveryDate,
};
