import React, { useState, useEffect } from 'react';
import { Order, OrderItem, Recipe } from '../types';
import Alert from '../ui/Alert';

// Import recipes from bakeryApi
import { bakeryApi } from '../api/bakeryApi';

const OrderForm: React.FC = () => {
  const [formData, setFormData] = useState<Partial<Order>>({
    customerName: '',
    deliveryDate: '',
    deliverySlot: '',
    location: '',
    items: [],
    estimatedTravelTime: 30,
  });

  const [recipesData, setRecipesData] = useState<Recipe[] | null>(null);
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

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const fetchedRecipes = await bakeryApi.getAvailableRecipes();
        console.log('Fetched Recipes:', fetchedRecipes); // Log the API response
        if (Array.isArray(fetchedRecipes)) {
          setRecipesData(fetchedRecipes);
          const defaultItems: Recipe[] = fetchedRecipes.map(item => ({
            product: item.product,
            quantity: 0,
          }));
          setFormData((prevData) => ({ ...prevData, items: defaultItems }));
        } else {
          setWarnings(['Invalid data format received from recipes.']);
        }
      } catch (error) {
        setWarnings(['Error fetching recipes. Please try again.']);
      }
    };
    

    fetchRecipes();
  }, []);

  const handleItemChange = (index: number, quantity: number) => {
    if (!formData.items || !recipesData) return;

    const updatedItems = [...formData.items];
    const recipe = recipesData[index];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: Math.max(0, Math.min(quantity, recipe.maxBatchSize)),
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
        items: validItems,
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
        items: validItems,
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

          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Product</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {recipesData?.map((recipe, index) => (
                <tr key={recipe.id}>
                  <td className="px-4 py-2 text-sm text-gray-700">{recipe.product}</td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={formData.items?.[index]?.quantity || 0}
                      min={0}
                      max={recipe.maxBatchSize}
                      onChange={(e) => handleItemChange(index, parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded-md">
            <ul>
              {warnings.map((warning, index) => (
                <li key={index} className="text-sm">{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Order'}
        </button>
      </form>
    </div>
  );
};

export default OrderForm;
