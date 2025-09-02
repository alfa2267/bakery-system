// src/data/presets.ts

import { OrderPreset } from '../types';

export const DEFAULT_PRESETS: OrderPreset[] = [
  {
    id: 'party-pack-cookies',
    name: 'Party Pack Cookies',
    description: 'Perfect for birthday parties and celebrations. Mix of chocolate chip and vanilla sugar cookies with colorful royal icing.',
    category: 'Party',
    totalPrice: 45.00,
    items: [
      {
        product: 'cookies',
        quantity: 12,
        customizations: {
          size: 'medium',
          flavor: ['chocolate', 'vanilla'],
          icing: { type: 'royal', flavor: 'vanilla' }
        },
        basePrice: 2.50,
        totalPrice: 25.50
      },
      {
        product: 'cookies',
        quantity: 8,
        customizations: {
          size: 'medium',
          flavor: ['vanilla'],
          icing: { type: 'royal', flavor: 'chocolate' },
          toppings: ['sprinkles']
        },
        basePrice: 2.50,
        totalPrice: 19.50
      }
    ]
  },
  {
    id: 'gourmet-brownie-box',
    name: 'Gourmet Brownie Box',
    description: 'Indulgent assortment of our premium brownies with rich toppings. Perfect for gifts or special occasions.',
    category: 'Premium',
    totalPrice: 68.00,
    items: [
      {
        product: 'brownies',
        quantity: 8,
        customizations: {
          size: 'large',
          flavor: ['caramel', 'walnut'],
          icing: { type: 'ganache', flavor: 'dark-chocolate' },
          toppings: ['pecans', 'sea-salt']
        },
        basePrice: 4.00,
        totalPrice: 42.00
      },
      {
        product: 'brownies',
        quantity: 4,
        customizations: {
          size: 'large',
          flavor: ['espresso'],
          icing: { type: 'cream-cheese', flavor: 'vanilla' },
          toppings: ['caramel-sauce']
        },
        basePrice: 4.00,
        totalPrice: 26.00
      }
    ]
  },
  {
    id: 'office-treat-combo',
    name: 'Office Treat Combo',
    description: 'Great for office meetings and team celebrations. Simple, delicious, and easy to share.',
    category: 'Corporate',
    totalPrice: 52.00,
    items: [
      {
        product: 'cookies',
        quantity: 18,
        customizations: {
          size: 'small',
          flavor: ['chocolate'],
          icing: { type: 'none', flavor: '' }
        },
        basePrice: 2.50,
        totalPrice: 26.00
      },
      {
        product: 'brownies',
        quantity: 12,
        customizations: {
          size: 'regular',
          flavor: ['classic'],
          icing: { type: 'none', flavor: '' }
        },
        basePrice: 4.00,
        totalPrice: 26.00
      }
    ]
  },
  {
    id: 'kids-birthday-special',
    name: 'Kids Birthday Special',
    description: 'Colorful and fun treats designed for children\'s parties. Bright decorations and kid-friendly flavors.',
    category: 'Kids',
    totalPrice: 38.00,
    items: [
      {
        product: 'cookies',
        quantity: 15,
        customizations: {
          size: 'small',
          flavor: ['vanilla'],
          icing: { type: 'royal', flavor: 'vanilla', message: 'Happy Birthday!' },
          toppings: ['sprinkles']
        },
        basePrice: 2.50,
        totalPrice: 38.00
      }
    ]
  },
  {
    id: 'elegant-dessert-tray',
    name: 'Elegant Dessert Tray',
    description: 'Sophisticated selection perfect for dinner parties, weddings, or upscale events.',
    category: 'Elegant',
    totalPrice: 95.00,
    items: [
      {
        product: 'cookies',
        quantity: 12,
        customizations: {
          size: 'large',
          flavor: ['vanilla', 'oatmeal'],
          icing: { type: 'buttercream', flavor: 'vanilla' },
          toppings: ['nuts']
        },
        basePrice: 2.50,
        totalPrice: 45.00
      },
      {
        product: 'brownies',
        quantity: 8,
        customizations: {
          size: 'large',
          flavor: ['espresso', 'caramel'],
          icing: { type: 'ganache', flavor: 'dark-chocolate' },
          toppings: ['pecans', 'sea-salt']
        },
        basePrice: 4.00,
        totalPrice: 50.00
      }
    ]
  },
  {
    id: 'custom-message-cookies',
    name: 'Custom Message Cookies',
    description: 'Personalized cookies with your custom message. Great for announcements, thank you gifts, or special messages.',
    category: 'Custom',
    totalPrice: 36.00,
    items: [
      {
        product: 'cookies',
        quantity: 12,
        customizations: {
          size: 'large',
          flavor: ['vanilla'],
          icing: { type: 'royal', flavor: 'white', message: 'Your Message Here' }
        },
        basePrice: 2.50,
        totalPrice: 36.00,
        designNotes: 'Custom message will be piped in contrasting color icing'
      }
    ]
  }
];

// Preset categories for filtering
export const PRESET_CATEGORIES = [
  { id: 'all', name: 'All Presets' },
  { id: 'party', name: 'Party' },
  { id: 'premium', name: 'Premium' },
  { id: 'corporate', name: 'Corporate' },
  { id: 'kids', name: 'Kids' },
  { id: 'elegant', name: 'Elegant' },
  { id: 'custom', name: 'Custom' }
];

// Helper function to get presets by category
export function getPresetsByCategory(category: string): OrderPreset[] {
  if (category === 'all') {
    return DEFAULT_PRESETS;
  }
  return DEFAULT_PRESETS.filter(preset => 
    preset.category?.toLowerCase() === category.toLowerCase()
  );
}

// Helper function to find preset by id
export function getPresetById(id: string): OrderPreset | undefined {
  return DEFAULT_PRESETS.find(preset => preset.id === id);
}