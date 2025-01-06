
import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { bakeryApi } from '../api/bakeryApi';
import { Order, OrderItem } from '../types';
import Alert from '../ui/Alert';

const OrderForm: React.FC = () => {
  const defaultItems: OrderItem[] = [
    { product: 'cookies', quantity: 0 },
    { product: 'brownies', quantity: 0 }
  ];

  const [formData, setFormData] = useState<Partial<Order>>({
    customerName: '',
    deliveryDate: '',
    deliverySlot: '',
    location: '',
    items: defaultItems,
    estimatedTravelTime: 30,
  });

  const [warnings, setWarnings] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeSlotMapping: { [key: string]: string } = {
    '1': '10:00-12:00',
    '2': '12:00-14:00',
    '3': '14:00-16:00',
    '4': '16:00-17:30',
  };

  const handleItemChange = (index: number, quantity: number) => {
    if (!formData.items) return;
    
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: Math.max(0, quantity)
    };

    setFormData({ ...formData, items: updatedItems });
  };

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

      // Prepare data for validation
      const orderData: Partial<Order> = {
        id: crypto.randomUUID(),
        customerName: formData.customerName,
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deliveryDate: formData.deliveryDate,
        deliverySlot: timeSlotMapping[formData.deliverySlot] || '',
        location: formData.location,
        estimatedTravelTime: formData.estimatedTravelTime,
        items: validItems
      };

      const response = await bakeryApi.validateOrder(orderData);
      setWarnings(response.warnings || []);
      setIsValid(response.isValid);
    } catch (error) {
      console.error('Validation error:', error);
      setWarnings(['Error validating order. Please check your input and try again.']);
      setIsValid(false);
    }
  };

  // Only validate when form data changes and we have all required fields
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
        items: defaultItems,
        estimatedTravelTime: 30,
      });
      setWarnings([]);
      setIsValid(false);

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
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Place New Order</h2>

      {submitSuccess && (
          <Alert 
            variant="success"
            title="Success"
            className="mb-4"
          >
            Order created successfully!
          </Alert>
        )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Info */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            placeholder="Enter customer name"
          />
        </div>

        {/* Delivery Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date</label>
            <input
              type="date"
              value={formData.deliveryDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Slot</label>
            <select
              value={formData.deliverySlot}
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

        {/* Delivery Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter delivery address"
            required
          />
        </div>

        {/* Order Items */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Order Items</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cookies (min 6)</label>
              <input
                type="number"
                min="6"
                value={formData.items?.[0]?.quantity ?? 0}
                onChange={(e) => handleItemChange(0, parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brownies (min 12)</label>
              <input
                type="number"
                min="12"
                value={formData.items?.[1]?.quantity ?? 0}
                onChange={(e) => handleItemChange(1, parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((warning, index) => (
              <Alert
                key={index}
                variant="warning"
                className="flex items-center"
              >
                {warning}
              </Alert>
            ))}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={`w-full py-2 px-4 rounded-md font-semibold transition-colors duration-200 ${
            isValid && !isSubmitting
              ? 'bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Creating Order...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
};

export default OrderForm;
