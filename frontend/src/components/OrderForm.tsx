import React, { useState, useEffect } from 'react';
import { Order, OrderItem, Recipe, Product } from '../types';
import Alert from '../ui/Alert';
import { bakeryApi } from '../api/bakeryApi';

const OrderForm: React.FC = () => {
  const [formData, setFormData] = useState<Partial<Order>>({
    customerName: '',
    deliveryDate: '',
    deliverySlot: '',
    location: '',
    items: [],
    estimatedTravelTime: 30,
    status: 'new'  // Adding default status based on OrderStatus type
  });

  const [recipesData, setRecipesData] = useState<Recipe[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate form data
  useEffect(() => {
    const isFormValid = Boolean(
      formData.customerName &&
      formData.deliveryDate &&
      formData.deliverySlot &&
      formData.location &&
      formData.items?.some(item => item.quantity > 0)
    );
    
    setWarnings(prev => isFormValid ? [] : prev);
    setIsValid(isFormValid);
  }, [formData]);
  


  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoading(true);
      try {
        const response = await bakeryApi.getAvailableRecipes();
        console.log('Raw API response:', response); // Debug log
        
        // Ensure we have an array of recipes
        if (!response || !Array.isArray(response)) {
          console.error('Invalid recipes response:', response);
          throw new Error('Invalid recipes data received');
        }

        console.log('Number of recipes received:', response.length); // Debug log
        
        setRecipesData(response);
        
        // Set default items based on fetched recipes
        const defaultItems: OrderItem[] = response.map((recipe: Recipe) => {
          console.log('Creating default item for recipe:', recipe.product.name); // Debug individual recipes
          return {
            product: {
              id: recipe.product.id,
              name: recipe.product.name
            },
            quantity: recipe.minBatchSize || 0,
          };
        });

        console.log('Default items created:', defaultItems); // Debug log

        setFormData(prevData => {
          const newData = { ...prevData, items: defaultItems };
          console.log('Updated form data:', newData); // Debug log
          return newData;
        });
      } catch (error) {
        console.error('Error fetching recipes:', error);
        setWarnings(prev => [...prev, 'Failed to load recipes. Please try again.']);
        setRecipesData([]); // Set empty array instead of null on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipes();
  }, [])



  const handleItemChange = (productId: number, quantity: number) => {
    const updatedItems = formData.items?.map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    );
    setFormData((prevData) => ({
      ...prevData,
      items: updatedItems,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setWarnings(['Please fill out all required fields.']);
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData: Order = {
        ...formData as Required<Omit<Order, 'id' | 'created_at' | 'updated_at'>>,
        status: 'new',
        id: ''
      };

      console.log(recipesData);

      const response = await bakeryApi.createOrder(orderData);
      if (response.status === 200) {
        setSubmitSuccess(true);
        // Reset form after successful submission
        setFormData({
          customerName: '',
          deliveryDate: '',
          deliverySlot: '',
          location: '',
          items: recipesData?.map(recipe => ({
            product: {
              id: recipe.product.id,
              name: recipe.product.name
            },
            quantity: recipe.minBatchSize || 0,
          })) || [],
          estimatedTravelTime: 30,
          status: 'new'
        });
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      setWarnings(['Failed to submit order. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p>Loading recipes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Place New Order</h2>

      {submitSuccess && (
        <Alert variant="success" title="Success" className="mb-4">
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
          
          {/* Debug output */}
  
          <div className="grid grid-cols-1 gap-4">
            {recipesData.map((recipe) => {
              // Debug log for each recipe

              const currentQuantity = formData.items?.find(
                item => item.product.id === recipe.product.id
              )?.quantity || 0;

              return (
                <div key={recipe.product.id} className="border p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <label className="block text-lg font-medium text-gray-700 mb-1">
                        {recipe.product.name}
                      </label>
                    
                    </div>
                    <div className="w-1/3">
                      <input
                        type="number"
                        //value=""
                        placeholder= {recipe.minBatchSize.toString()}
                        onChange={(e) => handleItemChange(recipe.product.id, parseInt(e.target.value, 10))}
                        min={recipe.minBatchSize || 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  {recipe.ingredients && (
                    <div className="text-xs text-gray-500 mt-1">
                      Ingredients: {recipe.ingredients.map(ing => ing.name).join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>



        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((warning, index) => (
              <Alert key={index} variant="warning" className="flex items-center">
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