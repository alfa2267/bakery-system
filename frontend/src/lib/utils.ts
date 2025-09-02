// Consolidated Library Functions
// This file consolidates all utility functions for the bakery system

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { OrderItem, ProductConfig, PricingCalculation, ProductOption, Order, ValidationResponse, FormErrors } from '../types';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

// ============================================================================
// PRICING ENGINE
// ============================================================================

export class PricingEngine {
  private productConfigs: Map<string, ProductConfig> = new Map();

  constructor(configs: ProductConfig[] = []) {
    this.loadConfigs(configs);
  }

  loadConfigs(configs: ProductConfig[]): void {
    this.productConfigs.clear();
    configs.forEach(config => {
      this.productConfigs.set(config.id, config);
    });
  }

  calculateItemPrice(item: OrderItem): PricingCalculation {
    const config = this.productConfigs.get(item.product);
    if (!config) {
      throw new Error(`Product configuration not found for: ${item.product}`);
    }

    const breakdown: Array<{ description: string; amount: number }> = [];
    let basePrice = config.basePrice;
    let sizeMultiplier = 1;
    let flavorSurcharge = 0;
    let toppingSurcharge = 0;

    breakdown.push({
      description: `Base price for ${config.name}`,
      amount: basePrice
    });

    // Size multiplier
    if (item.customizations?.size) {
      const sizeOption = config.availableSizes.find(s => s.id === item.customizations?.size);
      if (sizeOption && sizeOption.multiplier) {
        sizeMultiplier = sizeOption.multiplier;
        breakdown.push({
          description: `Size: ${sizeOption.name} (${sizeMultiplier}x)`,
          amount: basePrice * (sizeMultiplier - 1)
        });
      }
    }

    // Flavor multiplier (like CakeOrders fl2, fl3, fl4)
    const flavorCount = item.customizations?.flavor?.length || 1;
    if (flavorCount > 1 && config.flavorMultipliers[flavorCount]) {
      flavorSurcharge = config.flavorMultipliers[flavorCount];
      breakdown.push({
        description: `${flavorCount} flavors surcharge`,
        amount: flavorSurcharge
      });
    }

    // Icing customization
    if (item.customizations?.icing) {
      const icingOption = config.availableIcings.find(i => 
        i.id === item.customizations?.icing?.type
      );
      if (icingOption && icingOption.additionalCost) {
        breakdown.push({
          description: `Custom icing: ${icingOption.name}`,
          amount: icingOption.additionalCost
        });
        toppingSurcharge += icingOption.additionalCost;
      }
    }

    // Topping additions
    if (item.customizations?.toppings) {
      item.customizations.toppings.forEach(toppingId => {
        const toppingOption = config.availableToppings.find(t => t.id === toppingId);
        if (toppingOption && toppingOption.additionalCost) {
          breakdown.push({
            description: `Topping: ${toppingOption.name}`,
            amount: toppingOption.additionalCost
          });
          toppingSurcharge += toppingOption.additionalCost;
        }
      });
    }

    const itemPrice = (basePrice * sizeMultiplier) + flavorSurcharge + toppingSurcharge;
    const totalPrice = itemPrice * item.quantity;

    breakdown.push({
      description: `Quantity: ${item.quantity}`,
      amount: totalPrice - itemPrice
    });

    return {
      basePrice,
      sizeMultiplier,
      flavorSurcharge,
      toppingSurcharge,
      totalPrice,
      breakdown
    };
  }

  calculateOrderTotal(items: OrderItem[]): number {
    return items.reduce((total, item) => {
      try {
        const calculation = this.calculateItemPrice(item);
        return total + calculation.totalPrice;
      } catch (error) {
        console.warn(`Error calculating price for item ${item.product}:`, error);
        return total + (item.basePrice * item.quantity);
      }
    }, 0);
  }

  getProductOptions(productId: string): ProductOption[] {
    const config = this.productConfigs.get(productId);
    if (!config) return [];

    return [
      ...config.availableSizes.map(size => ({
        id: size.id,
        name: size.name,
        type: 'size' as const,
        additionalCost: size.multiplier ? (config.basePrice * (size.multiplier - 1)) : 0
      })),
      ...config.availableIcings.map(icing => ({
        id: icing.id,
        name: icing.name,
        type: 'icing' as const,
        additionalCost: icing.additionalCost || 0
      })),
      ...config.availableToppings.map(topping => ({
        id: topping.id,
        name: topping.name,
        type: 'topping' as const,
        additionalCost: topping.additionalCost || 0
      }))
    ];
  }

  getAvailableOptions(productId: string): ProductOption[] {
    return this.getProductOptions(productId);
  }
}

// ============================================================================
// VALIDATION ENGINE
// ============================================================================

export class AdvancedOrderValidator {
  validateOrder(order: Partial<Order>): ValidationResponse {
    const warnings: string[] = [];
    let isValid = true;

    // Basic required field validation
    const basicValidation = this.validateBasicFields(order);
    warnings.push(...basicValidation.warnings);
    isValid = isValid && basicValidation.isValid;

    // Delivery date validation
    const dateValidation = this.validateDeliveryDate(order.deliveryDate);
    warnings.push(...dateValidation.warnings);
    isValid = isValid && dateValidation.isValid;

    // Items validation
    if (order.items && order.items.length > 0) {
      const itemsValidation = this.validateItems(order.items, order.deliveryDate);
      warnings.push(...itemsValidation.warnings);
      isValid = isValid && itemsValidation.isValid;
    } else {
      warnings.push('Please select at least one item');
      isValid = false;
    }

    return { isValid, warnings };
  }

  validateBasicFields(order: Partial<Order>): ValidationResponse {
    const warnings: string[] = [];
    let isValid = true;

    if (!order.customerName?.trim()) {
      warnings.push('Customer name is required');
      isValid = false;
    }

    if (!order.deliveryDate) {
      warnings.push('Delivery date is required');
      isValid = false;
    }

    if (!order.deliverySlot) {
      warnings.push('Delivery time slot is required');
      isValid = false;
    }

    if (!order.location?.trim()) {
      warnings.push('Delivery location is required');
      isValid = false;
    }

    return { isValid, warnings };
  }

  validateDeliveryDate(deliveryDate?: string): ValidationResponse {
    const warnings: string[] = [];
    let isValid = true;

    if (!deliveryDate) {
      return { isValid: false, warnings: ['Delivery date is required'] };
    }

    const delivery = new Date(deliveryDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const deliveryDay = new Date(delivery.getFullYear(), delivery.getMonth(), delivery.getDate());

    // Check if date is in the past
    if (deliveryDay < today) {
      warnings.push('Delivery date cannot be in the past');
      isValid = false;
    }

    // Check minimum lead time (inspired by CakeOrders 3-day rule)
    const daysDifference = Math.ceil((deliveryDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference < 1) {
      warnings.push('Same-day orders require special arrangements and incur rush fees. Please call to confirm availability.');
    } else if (daysDifference < 3) {
      warnings.push(`Orders placed less than 3 days in advance incur a 25% rush fee.`);
    }

    // Check maximum advance booking (optional business rule)
    if (daysDifference > 30) {
      warnings.push('Orders can only be placed up to 30 days in advance');
      isValid = false;
    }

    // Weekend delivery warning
    const dayOfWeek = delivery.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      warnings.push('Weekend deliveries may have limited time slots available');
    }

    return { isValid, warnings };
  }

  validateItems(items: OrderItem[], deliveryDate?: string): ValidationResponse {
    const warnings: string[] = [];
    let isValid = true;

    // Check if any items have quantity > 0
    const validItems = items.filter(item => item.quantity > 0);
    if (validItems.length === 0) {
      warnings.push('Please select at least one item');
      isValid = false;
    }

    // Validate individual items
    validItems.forEach((item, index) => {
      const itemValidation = this.validateItem(item, deliveryDate);
      if (!itemValidation.isValid) {
        warnings.push(`Item ${index + 1}: ${itemValidation.warnings.join(', ')}`);
        isValid = false;
      }
    });

    return { isValid, warnings };
  }

  validateItem(item: OrderItem, deliveryDate?: string): ValidationResponse {
    const warnings: string[] = [];
    let isValid = true;

    if (item.quantity <= 0) {
      warnings.push('Quantity must be greater than 0');
      isValid = false;
    }

    if (item.quantity > 100) {
      warnings.push('Quantity cannot exceed 100 items');
      isValid = false;
    }

    // Validate customizations if present
    if (item.customizations) {
      const customizationValidation = this.validateCustomizations(item.customizations);
      warnings.push(...customizationValidation.warnings);
      isValid = isValid && customizationValidation.isValid;
    }

    return { isValid, warnings };
  }

  validateCustomizations(customizations: any): ValidationResponse {
    const warnings: string[] = [];
    let isValid = true;

    // Validate flavor selections
    if (customizations.flavor && Array.isArray(customizations.flavor)) {
      if (customizations.flavor.length > 3) {
        warnings.push('Maximum 3 flavors allowed');
        isValid = false;
      }
    }

    // Validate size selection
    if (customizations.size && typeof customizations.size !== 'string') {
      warnings.push('Invalid size selection');
      isValid = false;
    }

    // Validate icing selection
    if (customizations.icing && typeof customizations.icing !== 'object') {
      warnings.push('Invalid icing selection');
      isValid = false;
    }

    // Validate toppings
    if (customizations.toppings && Array.isArray(customizations.toppings)) {
      if (customizations.toppings.length > 5) {
        warnings.push('Maximum 5 toppings allowed');
        isValid = false;
      }
    }

    return { isValid, warnings };
  }

  validateFormData(formData: any): FormErrors {
    const errors: FormErrors = {};

    // Customer information validation
    if (!formData.customerName?.trim()) {
      errors.customerName = ['Customer name is required'];
    }

    if (!formData.deliveryDate) {
      errors.deliveryDate = ['Delivery date is required'];
    } else {
      const deliveryDate = new Date(formData.deliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deliveryDate < today) {
        errors.deliveryDate = ['Delivery date cannot be in the past'];
      }
    }

    if (!formData.deliverySlot) {
      errors.deliverySlot = ['Delivery time slot is required'];
    }

    if (!formData.location?.trim()) {
      errors.location = ['Delivery location is required'];
    }

    // Items validation
    if (!formData.items || formData.items.length === 0) {
      errors.items = ['Please select at least one item'];
    } else {
      const hasValidItems = formData.items.some((item: OrderItem) => item.quantity > 0);
      if (!hasValidItems) {
        errors.items = ['Please select at least one item'];
      }
    }

    return errors;
  }
}

// ============================================================================
// INSTANCES
// ============================================================================

export const pricingEngine = new PricingEngine();
export const orderValidator = new AdvancedOrderValidator();

// Export everything as default for backward compatibility
export default {
  cn,
  formatPrice,
  validateEmail,
  validatePhone,
  validateDeliveryDate,
  PricingEngine,
  AdvancedOrderValidator,
  pricingEngine,
  orderValidator
};
