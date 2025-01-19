import React, { useState, useEffect } from 'react';
import { bakeryApi } from '../api/bakeryApi';
import { Recipe, Step, Ingredient, ProductionStep, PRODUCTION_STEPS, Product, ValidationError, RecipeFormProps } from '../types';
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, X, Minus } from 'lucide-react';
import RecipeForm from './RecipeForm';

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
  variant?: 'default' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
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
  onEdit: (id: number, recipe: Recipe) => void;
  onDelete: (id: number) => void;
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
              onClick={() => onEdit(recipe.id, recipe)}
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

// Main RecipesView Component
const RecipesView: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ValidationError | string | null>(null);
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

  const handleEdit = (id: number, recipe: Recipe) => {
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
      setError(null);
      
      if (selectedRecipe?.id) {
        // Update existing recipe
        const updatedRecipe = await bakeryApi.updateRecipe(selectedRecipe.id, recipe);
        setRecipes(recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r));
      } else {
        // Create new recipe
        const newRecipe = await bakeryApi.createRecipe(recipe);
        setRecipes([...recipes, newRecipe]);
      }
      setIsFormOpen(false);
    } catch (err: unknown) {
      console.error('Error saving recipe:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        const apiError = err as { response: { data: ValidationError } };
        setError(apiError.response.data);
      } else {
        setError('Failed to save recipe. Please try again.');
      }
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

  // Render loading state
  if (loading && !isFormOpen) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading recipes...</p>
      </div>
    );
  }

  // Render error state
  if (error && !recipes.length) {
    return (
      <div className="text-red-500 p-4">
        {typeof error === 'string' ? error : error.message || 'An error occurred'}
      </div>
    );
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
          {recipes.length > 0 ? (
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
          ) : (
            <div className="text-center text-gray-500 py-8">
              No recipes found. Click "Add New Recipe" to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {isFormOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
      <RecipeForm
        initialRecipe={selectedRecipe}  // This should now match the prop interface
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