// RecipesView.tsx
// Remove unused imports and fix type definitions
import React, { useState, useEffect } from 'react';
import { bakeryApi } from '../api/bakeryApi';
import { Recipe, Step, Ingredient, ProductionStep, PRODUCTION_STEPS, Product } from '../types';
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, X, Minus } from 'lucide-react';

// UI Components
const Card = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>{children}</div>
);

const CardTitle = ({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props}>{children}</h3>
);

const CardContent = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 pt-0 ${className}`} {...props}>{children}</div>
);

const Button = ({
  children,
  variant = 'default',
  size = 'default',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'ghost' | 'destructive',
  size?: 'default' | 'sm' | 'lg'
}) => {
  const variants = {
    default: 'bg-blue-500 text-white hover:bg-blue-600',
    ghost: 'hover:bg-gray-100',
    destructive: 'bg-red-500 text-white hover:bg-red-600',
  };

  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 py-1 text-sm',
    lg: 'h-12 px-6 py-3',
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors 
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 
        disabled:pointer-events-none disabled:opacity-50 
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Recipe Card Component
const RecipeCard: React.FC<{
  recipe: Recipe;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipeId: number) => void;
}> = ({ recipe, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mb-4">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
          <p className="text-lg font-semibold">{recipe.id}</p>
            <h3 className="text-lg font-semibold">{recipe.product.name}</h3>
            <p className="text-sm text-gray-500">
              Batch size: {recipe.minBatchSize} - {recipe.maxBatchSize} {recipe.unit}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(recipe)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(recipe.id)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-4">
            <div>
              <h4 className="font-medium mb-2">Ingredients:</h4>
              <ul className="list-disc list-inside space-y-1">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="text-sm">
                    {ingredient.product.name}: {ingredient.qty} {ingredient.unit}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Production Steps:</h4>
              <div className="space-y-2">
                {recipe.steps.map((step, index) => (
                  <div key={index} className="bg-gray-50 p-2 rounded">
                    <div className="font-medium">{index + 1}. {step.name}</div>
                    <div className="text-sm text-gray-600">
                      Duration: {step.duration} minutes
                      {step.requiresHuman && " • Requires staff"}
                      {step.requiresOven && " • Requires oven"}
                      {step.requiresMixer && " • Requires mixer"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {recipe.requiresChilling && (
              <div className="text-sm text-gray-600">
                Requires chilling for up to {recipe.maxChillTime} hours
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};


const emptyStep: Step = {
  id: 0,
  name: 'mixing' as ProductionStep,  // Use your enum type
  duration: 0,
  requiresHuman: false,
  requiresOven: false,
  requiresMixer: false,
  mustFollowImmediately: false,
  scalingFactor: 1.0
};


const emptyIngredient: Ingredient = {
  product: {
    name: '',
    id: 0
  },

  unit: '',
  qty: 0
};




interface RecipeFormProps {
  initialRecipe?: Recipe;
  onSubmit: (recipe: Recipe) => void;
  onCancel: () => void;
}

const RecipeForm: React.FC<RecipeFormProps> = ({
  initialRecipe,
  onSubmit,
  onCancel
}) => {


  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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


  const [formData, setFormData] = useState<Omit<Recipe, 'id'>>(() => {
    if (initialRecipe) {
      return { ...initialRecipe };
    }
    return {
      product: { id: 23, name: 'cookies' },
      ingredients: [{ ...emptyIngredient }],
      steps: [{ ...emptyStep }],
      requiresChilling: false,
      maxChillTime: 0,
      minBatchSize: 1,
      maxBatchSize: 50,
      unit: 'pieces'
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validatedSteps = formData.steps.map(step => ({
      ...step,
      id: step.id ? String(step.id) : undefined // Convert to string
    }));
  
    const validatedRecipe = {
      ...formData,
      steps: validatedSteps
    };
  
    onSubmit(formData as Recipe);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {initialRecipe ? 'Edit Recipe' : 'Create New Recipe'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Product Information */}
        <div>
          <label className="block text-sm font-medium mb-1">Product Name</label>


        <select key={formData.product.id}
                     value={formData.product.id}
                     onChange={e => {
                       setFormData({ ...formData, product: {
                        id: Number(e.target.value), 
                        name: products[e.target.selectedIndex].name
                      } });
                     }}
                     className="w-full px-3 py-2 border rounded-md"
                     required
                  >

                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name.charAt(0).toUpperCase() + product.name.slice(1)}
                      </option>
                    ))}
                  </select>

                  </div>

        {/* Batch Size Settings */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Min Batch</label>
            <input
              type="number"
              value={formData.minBatchSize}
              onChange={e => setFormData({
                ...formData,
                minBatchSize: parseInt(e.target.value)
              })}
              className="w-full px-3 py-2 border rounded-md"
              min="1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Batch</label>
            <input
              type="number"
              value={formData.maxBatchSize}
              onChange={e => setFormData({
                ...formData,
                maxBatchSize: parseInt(e.target.value)
              })}
              className="w-full px-3 py-2 border rounded-md"
              min={formData.minBatchSize}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Unit</label>
            <select
              value={formData.unit}
              onChange={e => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="pieces">Pieces</option>
              <option value="loaves">Loaves</option>
              <option value="kg">Kilograms</option>
              <option value="dozen">Dozen</option>
            </select>
          </div>
        </div>

        {/* Ingredients */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Ingredients</label>
            <button
              type="button"
              onClick={() => setFormData({
                ...formData,
                ingredients: [...formData.ingredients, { ...emptyIngredient }]
              })}
              className="text-blue-500 hover:text-blue-600"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            {formData.ingredients.map((ingredient, index) => (
              <div key={index} className="flex gap-2">


                <select
                  value={ingredient.product.id}
                  onChange={e => {
                    const newIngredients = [...formData.ingredients];
                    newIngredients[index] = {
                      ...ingredient,
                      product: { 
                        id:  Number(e.target.value),
                      name:  products[e.target.selectedIndex].name
                       }
                    };

                    setFormData({ ...formData, ingredients: newIngredients });
                  }}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >

                  {products.map(product => (
                    <option key ={product.id} value={product.id}>
                      {product.name.charAt(0).toUpperCase() + product.name.slice(1)}
                    </option>
                  ))}

                </select>


                <input
                  type="text"
                  placeholder="Quantity"
                  value={ingredient.qty}
                  onChange={e => {
                    const newIngredients = [...formData.ingredients];
                    newIngredients[index] = {
                      ...ingredient,
                      qty: Number(e.target.value)
                    };
                    setFormData({ ...formData, ingredients: newIngredients });
                  }}
                  className="w-24 px-3 py-2 border rounded-md"
                  required
                />
                <input
                  type="text"
                  placeholder="Unit"
                  value={ingredient.unit}
                  onChange={e => {
                    const newIngredients = [...formData.ingredients];
                    newIngredients[index] = {
                      ...ingredient,
                      unit: e.target.value
                    };
                    setFormData({ ...formData, ingredients: newIngredients });
                  }}
                  className="w-24 px-3 py-2 border rounded-md"
                  required
                />
                {formData.ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newIngredients = formData.ingredients.filter((_, i) => i !== index);
                      setFormData({ ...formData, ingredients: newIngredients });
                    }}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Production Steps */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Production Steps</label>
            <button
              type="button"
              onClick={() => setFormData({
                ...formData,
                steps: [...formData.steps, { ...emptyStep }]
              })}
              className="text-blue-500 hover:text-blue-600"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {formData.steps.map((step, index) => (
            <div key={index} className="p-4 border rounded-md">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Step {index + 1}</span>
                {formData.steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newSteps = formData.steps.filter((_, i) => i !== index);
                      setFormData({ ...formData, steps: newSteps });
                    }}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <select
                    value={step.name}
                    onChange={e => {
                      const newSteps = [...formData.steps];
                      newSteps[index] = { ...step,  
                        name: e.target.value as ProductionStep 
                      };
                      setFormData({ ...formData, steps: newSteps });
                    }}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    {PRODUCTION_STEPS.map(stepType => (
                      <option key={stepType} value={stepType}>
                        {stepType.charAt(0).toUpperCase() + stepType.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>


                <div>
                  <input
                    type="number"
                    placeholder="Duration (minutes)"
                    value={step.duration}
                    onChange={e => {
                      const newSteps = [...formData.steps];
                      newSteps[index] = { ...step, duration: parseInt(e.target.value) };
                      setFormData({ ...formData, steps: newSteps });
                    }}
                    className="w-full px-3 py-2 border rounded-md"
                    min="0"
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
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={step.requiresOven}
                    onChange={e => {
                      const newSteps = [...formData.steps];
                      newSteps[index] = { ...step, requiresOven: e.target.checked };
                      setFormData({ ...formData, steps: newSteps });
                    }}
                    className="mr-2"
                  />
                  <label className="text-sm">Requires Oven</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={step.requiresMixer}
                    onChange={e => {
                      const newSteps = [...formData.steps];
                      newSteps[index] = { ...step, requiresMixer: e.target.checked };
                      setFormData({ ...formData, steps: newSteps });
                    }}
                    className="mr-2"
                  />
                  <label className="text-sm">Requires Mixer</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={step.mustFollowImmediately}
                    onChange={e => {
                      const newSteps = [...formData.steps];
                      newSteps[index] = { ...step, mustFollowImmediately: e.target.checked };
                      setFormData({ ...formData, steps: newSteps });
                    }}
                    className="mr-2"
                  />
                  <label className="text-sm">Must Follow Immediately</label>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chilling Requirements */}
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.requiresChilling}
              onChange={e => setFormData({
                ...formData,
                requiresChilling: e.target.checked
              })}
              className="mr-2"
            />
            <label className="text-sm font-medium">Requires Chilling</label>
          </div>
          {formData.requiresChilling && (
            <div>
              <label className="block text-sm font-medium mb-1">Max Chill Time (hours)</label>
              <input
                type="number"
                value={formData.maxChillTime}
                onChange={e => setFormData({
                  ...formData,
                  maxChillTime: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
                required
              />
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          {initialRecipe ? 'Update Recipe' : 'Create Recipe'}
        </button>
      </div>
    </form>
  );
};

// Main RecipesView Component
const RecipesView: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | undefined>(undefined);

  useEffect(() => {
    fetchRecipes();

  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const response = await bakeryApi.getRecipes();
      setRecipes(response);
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setError('Failed to fetch recipes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };




  const handleEdit = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedRecipe(undefined);
    setIsFormOpen(true);
  };


  const handleFormSubmit = async (recipe: Recipe) => {
    
    try {
      setLoading(true);
      if (selectedRecipe?.id) {
        const updatedRecipe = await bakeryApi.updateRecipe(selectedRecipe.id, recipe);
        setRecipes(recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r));
      } else {
        const newRecipe = await bakeryApi.createRecipe(recipe);
        setRecipes([...recipes, newRecipe]);
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error('Error saving recipe:', err);
      setError('Failed to save recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  const handleDelete = async (recipeId: number | undefined) => {
    if (!recipeId) return;

    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        setLoading(true);
        await bakeryApi.deleteRecipe(recipeId);
        setRecipes(recipes.filter(recipe => recipe.id !== recipeId));
      } catch (err) {
        console.error('Error deleting recipe:', err);
        setError('Failed to delete recipe. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };


  if (loading && !isFormOpen) {
    return <div className="flex justify-center items-center h-64">Loading recipes...</div>;
  }

  if (error && !recipes.length) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recipe Management</CardTitle>
          <Button onClick={handleAddNew} className="ml-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add New Recipe
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recipe Form Dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
            <RecipeForm
              initialRecipe={selectedRecipe}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default RecipesView;