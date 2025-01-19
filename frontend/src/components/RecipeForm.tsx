import React, { useState, useEffect } from 'react';
import { Options, Recipe, Step, Ingredient, ProductionStep, PRODUCTION_STEPS, Product, ValidationError, RecipeFormProps } from '../types';
import { Plus, X, Minus } from 'lucide-react';
import { Alert, AlertDialogDescription, AlertDialogTitle } from '../ui/Alert';
import { bakeryApi } from '../api/bakeryApi';
import Select from 'react-select/dist/declarations/src/Select';

// Error Handler Component
interface RecipeErrorHandlerProps {
  error: ValidationError | string | null;
  onDismiss: () => void;
}
const RecipeErrorHandler: React.FC<RecipeErrorHandlerProps> = ({ error, onDismiss }) => {
  if (!error) return null;
  const errorMessage = typeof error === 'string' 
    ? error 
    : error.detail?.[0]?.msg || error.message || 'An unexpected error occurred';
  return (
    <Alert variant="error" className="mb-4">
      <AlertDialogTitle className="flex items-center justify-between">
        Error
        <button onClick={onDismiss} className="text-gray-500 hover:text-gray-700">
          <X className="h-4 w-4" />
        </button>
      </AlertDialogTitle>
      <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
    </Alert>
  );
};

const emptyStep: Step = {
  id: 0,
  name: '' as ProductionStep,
  duration: 0,
  requiresHuman: false,
  requiresOven: false,
  requiresMixer: false,
  mustFollowImmediately: false,
  scalingFactor: 1.0
};

const emptyIngredient: Ingredient = {
  product: { name: '', id: 0 },
  unit: '',
  qty: 0
};

const emptyProduct: Product = {
  name: '',
  id: 0
};

// Available equipment options
const equipmentOptions = [
  { value: 'mixer', label: 'Mixer' },
  { value: 'oven', label: 'Oven' }
];

const RecipeForm: React.FC<RecipeFormProps> = ({
  initialRecipe,
  onSubmit,
  onCancel
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ValidationError | string | null>(null);
  const [formData, setFormData] = useState<Recipe>(() => {
    if (initialRecipe) {
      return { ...initialRecipe };
    }
    return {
      id: 0,
      product: { ...emptyProduct },
      ingredients: [{ ...emptyIngredient }],
      steps: [{ ...emptyStep }],
      requiresChilling: false,
      maxChillTime: 0,
      minBatchSize: 1,
      maxBatchSize: 50,
      unit: 'pieces'
    };
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await bakeryApi.getProducts();
      setProducts(response);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      onSubmit(formData as Recipe);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  const handleEquipmentChange = (index: number, equipment: string[]) => {
    const newSteps = [...formData.steps];
    newSteps[index] = {
      ...newSteps[index],
      requiresOven: equipment.includes('oven'),
      requiresMixer: equipment.includes('mixer')
    };
    setFormData({ ...formData, steps: newSteps });
  };

  const getSelectedEquipment = (step: Step): string[] => {
    const equipment: string[] = [];
    if (step.requiresOven) equipment.push('oven');
    if (step.requiresMixer) equipment.push('mixer');
    return equipment;
  };

  const renderEquipmentSelect = (step: Step, index: number) => (
    <div className="col-span-2">
      <label className="block text-sm font-medium mb-1">Required Equipment</label>
      <div className="flex gap-2">
        {equipmentOptions.map(option => (
          <label key={option.value} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={getSelectedEquipment(step).includes(option.value)}
              onChange={(e) => {
                const currentEquipment = getSelectedEquipment(step);
                const newEquipment = e.target.checked
                  ? [...currentEquipment, option.value]
                  : currentEquipment.filter(eq => eq !== option.value);
                handleEquipmentChange(index, newEquipment);
              }}
              className="mr-2"
            />
            <span className="text-sm">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedProductId = parseInt(e.target.value);
    const selectedProduct = products.find(p => p.id === selectedProductId);
    setFormData(prev => ({
      ...prev,
      product: selectedProduct || emptyProduct
    }));
  };

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: any) => {
    const newIngredients = [...formData.ingredients];
    if (field === 'product') {
      const selectedProductId = parseInt(value);
      const selectedProduct = products.find(p => p.id === selectedProductId);
      newIngredients[index] = {
        ...newIngredients[index],
        product: selectedProduct || emptyProduct
      };
    } else {
      newIngredients[index] = {
        ...newIngredients[index],
        [field]: value
      };
    }
    setFormData(prev => ({ ...prev, ingredients: newIngredients }));
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { ...emptyIngredient }]
    }));
  };

  const removeIngredient = (index: number) => {
    if (formData.ingredients.length > 1) {
      const newIngredients = formData.ingredients.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, ingredients: newIngredients }));
    }
  };

  const handleStepChange = (index: number, field: keyof Step, value: any) => {
    const newSteps = [...formData.steps];
    newSteps[index] = {
      ...newSteps[index],
      [field]: value
    };
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, { ...emptyStep }]
    }));
  };

  const removeStep = (index: number) => {
    if (formData.steps.length > 1) {
      const newSteps = formData.steps.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, steps: newSteps }));
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      {/* Error Handler */}
      {error && <RecipeErrorHandler error={error} onDismiss={() => setError(null)} />}

     
     
      {/* Product Selection */}
      <div>
        <label htmlFor="product" className="block text-sm font-medium mb-1">
          Product
        </label>
        <Select
          id="product"
          options={products.map((product) => ({
            value: product.id,
            label: product.name,
          }))}
          value={
            formData.product
              ? { value: formData.product.id, label: formData.product.name }
              : null
          }
          onChange={handleProductChange}
          placeholder="Search or select a product"
          className="w-full"
        />
      </div>





      {/* Chilling Options */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="requiresChilling"
            checked={formData.requiresChilling}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              requiresChilling: e.target.checked 
            }))}
            className="mr-2"
          />
          <label htmlFor="requiresChilling" className="text-sm">Requires Chilling</label>
        </div>
        {formData.requiresChilling && (
          <div>
            <label htmlFor="maxChillTime" className="block text-xs mb-1">Max Chill Time (minutes)</label>
            <input
              type="number"
              id="maxChillTime"
              value={formData.maxChillTime}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                maxChillTime: parseInt(e.target.value) 
              }))}
              min="0"
              className="w-full border rounded px-2 py-1"
            />
          </div>
        )}
      </div>

      {/* Ingredients Section */}
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2 flex items-center justify-between">
          Ingredients
          <button 
            type="button" 
            onClick={addIngredient} 
            className="text-green-600 hover:text-green-800"
          >
            <Plus className="h-5 w-5" />
          </button>
        </h3>
        {formData.ingredients.map((ingredient, index) => (
          <div key={index} className="grid grid-cols-4 gap-2 mb-2 items-center">
            <select
              value={ingredient.product.id}
              onChange={(e) => handleIngredientChange(index, 'product', e.target.value)}
              className="border rounded px-2 py-1"
              required
            >
              <option value="">Select Product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Unit"
              value={ingredient.unit}
              onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
              className="border rounded px-2 py-1"
              required
            />
            <input
              type="number"
              placeholder="Quantity"
              value={ingredient.qty}
              onChange={(e) => handleIngredientChange(index, 'qty', parseFloat(e.target.value))}
              step="0.01"
              className="border rounded px-2 py-1"
              required
            />
            <button 
              type="button" 
              onClick={() => removeIngredient(index)}
              disabled={formData.ingredients.length <= 1}
              className="text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              <Minus className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Steps Section */}
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2 flex items-center justify-between">
          Production Steps
          <button 
            type="button" 
            onClick={addStep} 
            className="text-green-600 hover:text-green-800"
          >
            <Plus className="h-5 w-5" />
          </button>
        </h3>
        {formData.steps.map((step, index) => (
          <div key={index} className="border rounded p-4 mb-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Step Name</label>
                <select
                  value={step.name}
                  onChange={(e) => handleStepChange(index, 'name', e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  required
                >
                  <option value="">Select Step</option>
                  {PRODUCTION_STEPS.map(prodStep => (
                    <option key={prodStep} value={prodStep}>
                      {prodStep}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={step.duration}
                  onChange={(e) => handleStepChange(index, 'duration', parseInt(e.target.value))}
                  className="w-full border rounded px-2 py-1"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={step.requiresHuman}
                  onChange={e => {
                    const newSteps = [...formData.steps];
                    newSteps[index] = { ...step, requiresHuman: e.target.checked };
                    setFormData({ ...formData, steps: newSteps });
                  }}
                  className="mr-2"
                />
                <label className="text-sm">Requires Staff</label>
              </div>
              {renderEquipmentSelect(step, index)}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={step.mustFollowImmediately}
                  onChange={e => {
                    const newSteps = [...formData.steps];
                    newSteps[index] = {
                      ...step,
                      mustFollowImmediately: e.target.checked
                    };
                    setFormData({ ...formData, steps: newSteps });
                  }}
                  className="mr-2"
                />
                <label className="text-sm">Must Follow Immediately</label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Scaling Factor</label>
                <input
                  type="number"
                  value={step.scalingFactor}
                  onChange={(e) => handleStepChange(index, 'scalingFactor', parseFloat(e.target.value))}
                  step="0.1"
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <button 
                type="button" 
                onClick={() => removeStep(index)}
                disabled={formData.steps.length <= 1}
                className="text-red-600 hover:text-red-800 disabled:opacity-50 self-end"
              >
                <Minus className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Form Actions */}
      <div className="flex justify-between mt-6">
        <button 
          type="button" 
          onClick={onCancel} 
          className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {initialRecipe ? 'Update Recipe' : 'Create Recipe'}
        </button>
      </div>
    </form>
  );
};

export default RecipeForm;