// src/components/EnhancedOrderForm.tsx

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { bakeryApi } from '../api/api';
import { Order, OrderItem, OrderPreset } from '../types';
import { pricingEngine, orderValidator } from '../lib/utils';
import { DEFAULT_PRESETS } from '../data/presets';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import PresetSelector from './PresetSelector';
import CustomizationForm from './CustomizationForm';

const EnhancedOrderForm: React.FC = () => {
  const [formData, setFormData] = useState<Partial<Order>>({
    customerName: '',
    deliveryDate: '',
    deliverySlot: '',
    location: '',
    items: [],
    estimatedTravelTime: 30,
  });

  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [showPresets, setShowPresets] = useState(true);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);

  const timeSlotMapping: { [key: string]: string } = {
    '1': '10:00-12:00',
    '2': '12:00-14:00',
    '3': '14:00-16:00',
    '4': '16:00-17:30',
  };

  // Calculate order total when items change
  useEffect(() => {
    if (formData.items && formData.items.length > 0) {
      try {
        const total = pricingEngine.calculateOrderTotal(formData.items.filter(item => item.quantity > 0));
        setOrderTotal(total);
      } catch (error) {
        console.error('Error calculating total:', error);
        setOrderTotal(0);
      }
    } else {
      setOrderTotal(0);
    }
  }, [formData.items]);

  const validateOrder = async () => {
    try {
      // Check if we have all required fields
      if (!formData.customerName || !formData.deliveryDate || !formData.deliverySlot || !formData.location) {
        setIsValid(false);
        return;
      }

      // Filter out items with 0 quantity
      const validItems = formData.items?.filter(item => item.quantity > 0) || [];
      
      // Don't validate if no items are selected
      if (validItems.length === 0) {
        setWarnings(['Please select at least one item']);
        setIsValid(false);
        return;
      }

      // Use the enhanced validator
      const orderToValidate: Partial<Order> = {
        ...formData,
        items: validItems
      };

      const validation = orderValidator.validateOrder(orderToValidate);
      setWarnings(validation.warnings);
      setIsValid(validation.isValid);
    } catch (error) {
      console.error('Validation error:', error);
      setWarnings(['Error validating order. Please check your input and try again.']);
      setIsValid(false);
    }
  };

  // Validate when form data changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.customerName && 
          formData.deliveryDate && 
          formData.deliverySlot && 
          formData.location && 
          formData.items?.some(item => item.quantity > 0)) {
        validateOrder();
      }
    }, 500); // Add debounce

    return () => clearTimeout(timer);
  }, [formData]);

  const handlePresetSelect = (preset: OrderPreset) => {
    setSelectedPreset(preset.id);
    setShowPresets(false);
    
    // Transform preset items to include required fields
    const presetItems = preset.items.map(item => ({
      ...item,
      basePrice: item.basePrice || 0,
      totalPrice: item.totalPrice || 0
    })) as OrderItem[];

    setFormData({
      ...formData,
      items: presetItems
    });
  };

  const addCustomItem = () => {
    const newItem: OrderItem = {
      product: 'cookies', // Default to cookies
      quantity: 6, // Minimum quantity
      basePrice: 2.50,
      totalPrice: 15.00, // Will be recalculated
      customizations: {
        size: 'medium',
        flavor: ['chocolate'],
        icing: { type: 'none', flavor: '' }
      }
    };

    setFormData({
      ...formData,
      items: [...(formData.items || []), newItem]
    });
    setSelectedPreset(''); // Clear preset selection
    setShowPresets(false);
  };

  const updateItem = (index: number, updatedItem: OrderItem) => {
    if (!formData.items) return;
    
    const updatedItems = [...formData.items];
    updatedItems[index] = updatedItem;
    
    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  const removeItem = (index: number) => {
    if (!formData.items) return;
    
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      items: updatedItems
    });

    // Show presets again if no items left
    if (updatedItems.length === 0) {
      setShowPresets(true);
      setSelectedPreset('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !formData.items) return;

    try {
      setIsSubmitting(true);
      const validItems = formData.items.filter(item => item.quantity > 0);
      
      if (validItems.length === 0) {
        setWarnings(['Please select at least one item']);
        return;
      }

      const orderData: Order = {
        id: crypto.randomUUID(),
        customerName: formData.customerName!,
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deliveryDate: formData.deliveryDate!,
        deliverySlot: timeSlotMapping[formData.deliverySlot!]!,
        location: formData.location!,
        estimatedTravelTime: formData.estimatedTravelTime!,
        items: validItems
      };

      const response = await bakeryApi.createOrder(orderData);
      console.log('Order created:', response);
      
      // Show success message
      setSubmitSuccess(true);
      
      // Reset form
      setFormData({
        customerName: '',
        deliveryDate: '',
        deliverySlot: '',
        location: '',
        items: [],
        estimatedTravelTime: 30,
      });
      setWarnings([]);
      setIsValid(false);
      setSelectedPreset('');
      setShowPresets(true);
      setOrderTotal(0);

      // Hide success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error('Error creating order:', error);
      setWarnings(['Error creating order. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Place New Order</h2>

      {submitSuccess && (
        <Alert className="mb-4">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            Order created successfully! Your custom items are being scheduled for production.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                type="text"
                value={formData.customerName || ''}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Enter customer name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deliveryDate">Delivery Date *</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={formData.deliveryDate || ''}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="deliverySlot">Delivery Time *</Label>
                <select
                  id="deliverySlot"
                  value={formData.deliverySlot || ''}
                  onChange={(e) => setFormData({ ...formData, deliverySlot: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select time slot</option>
                  <option value="1">10:00-12:00</option>
                  <option value="2">12:00-14:00</option>
                  <option value="3">14:00-16:00</option>
                  <option value="4">16:00-17:30</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="location">Delivery Address *</Label>
              <Input
                id="location"
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter complete delivery address"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Order Items</CardTitle>
                <CardDescription>
                  Choose from preset combinations or create custom items
                </CardDescription>
              </div>
              {orderTotal > 0 && (
                <div className="text-right">
                  <div className="text-sm text-gray-600">Order Total</div>
                  <div className="text-2xl font-bold text-green-600">${orderTotal.toFixed(2)}</div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Preset Selector */}
            {showPresets && (
              <PresetSelector
                presets={DEFAULT_PRESETS}
                selectedPreset={selectedPreset}
                onSelectPreset={handlePresetSelect}
                className="mb-6"
              />
            )}

            {/* Custom Items */}
            {formData.items && formData.items.length > 0 && (
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <CustomizationForm
                    key={index}
                    item={item}
                    itemIndex={index}
                    onChange={(updatedItem) => updateItem(index, updatedItem)}
                    onRemove={() => removeItem(index)}
                  />
                ))}
              </div>
            )}

            {/* Add Custom Item Button */}
            <div className="flex flex-col items-center py-6">
              <Button
                type="button"
                variant="outline"
                onClick={addCustomItem}
                className="mb-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Item
              </Button>
              {formData.items && formData.items.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowPresets(true);
                    setSelectedPreset('');
                  }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Browse Presets Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((warning, index) => (
              <Alert
                key={index}
                variant="destructive"
                className="flex items-center"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                {warning}
              </Alert>
            ))}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center pt-6">
          <Button
            type="submit"
            disabled={!isValid || isSubmitting || orderTotal === 0}
            size="lg"
            className={`min-w-48 ${
              isValid && !isSubmitting && orderTotal > 0
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              'Creating Order...'
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Place Order - ${orderTotal.toFixed(2)}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedOrderForm;