import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Plus, Trash2, Save, Clock, ChefHat, Factory } from 'lucide-react';
import { bakeryApi } from '../api/api';
import type { Recipe, RecipeStep } from '../types';

export function RecipeManager() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe>({
    id: '',
    productType: '',
    steps: [],
    requiresChilling: false,
    maxChillTime: 0,
    minBatchSize: 1,
    maxBatchSize: 100
  });
  const [editingStep, setEditingStep] = useState<RecipeStep | null>(null);
  const [stepIndex, setStepIndex] = useState<number>(-1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const response = await bakeryApi.getAvailableRecipes();
      setRecipes(response.recipes || []);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const addStep = () => {
    const newStep: RecipeStep = {
      id: Date.now().toString(),
      name: '',
      duration: 30,
      requiresHuman: false,
      requiresOven: false,
      requiresMixer: false,
      mustFollowImmediately: false,
      scalingFactor: 1.0
    };
    setCurrentRecipe(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
    setEditingStep(newStep);
    setStepIndex(currentRecipe.steps.length);
  };

  const updateStep = (index: number, step: RecipeStep) => {
    const updatedSteps = [...currentRecipe.steps];
    updatedSteps[index] = step;
    setCurrentRecipe(prev => ({
      ...prev,
      steps: updatedSteps
    }));
    setEditingStep(null);
    setStepIndex(-1);
  };

  const deleteStep = (index: number) => {
    setCurrentRecipe(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const saveRecipe = async () => {
    if (!currentRecipe.productType || currentRecipe.steps.length === 0) {
      return;
    }

    setLoading(true);
    try {
      // In a real app, you would save to API
      const newRecipe = { ...currentRecipe, id: Date.now().toString() };
      setRecipes(prev => [...prev, newRecipe]);
      
      // Reset form
      setCurrentRecipe({
        id: '',
        productType: '',
        steps: [],
        requiresChilling: false,
        maxChillTime: 0,
        minBatchSize: 1,
        maxBatchSize: 100
      });
    } catch (error) {
      console.error('Failed to save recipe:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalDuration = (steps: RecipeStep[]) => {
    return steps.reduce((total, step) => total + step.duration, 0);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recipe List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Existing Recipes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recipes.map((recipe, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{recipe.productType}</h3>
                    <Badge variant="outline">
                      {recipe.steps.length} steps
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Duration: {formatDuration(getTotalDuration(recipe.steps))}</p>
                    <p>Batch Size: {recipe.minBatchSize}-{recipe.maxBatchSize}</p>
                    {recipe.requiresChilling && (
                      <p>Chilling: Up to {recipe.maxChillTime} minutes</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Edit</Button>
                    <Button size="sm" variant="outline">Duplicate</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recipe Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Recipe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Recipe Info */}
            <div className="space-y-2">
              <Label htmlFor="productType">Product Type</Label>
              <Input
                id="productType"
                value={currentRecipe.productType}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentRecipe(prev => ({
                  ...prev,
                  productType: e.target.value
                }))}
                placeholder="e.g., Sourdough Bread"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minBatchSize">Min Batch Size</Label>
                <Input
                  id="minBatchSize"
                  type="number"
                  value={currentRecipe.minBatchSize}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentRecipe(prev => ({
                    ...prev,
                    minBatchSize: parseInt(e.target.value) || 1
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxBatchSize">Max Batch Size</Label>
                <Input
                  id="maxBatchSize"
                  type="number"
                  value={currentRecipe.maxBatchSize}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentRecipe(prev => ({
                    ...prev,
                    maxBatchSize: parseInt(e.target.value) || 100
                  }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requiresChilling"
                checked={currentRecipe.requiresChilling}
                onChange={(e) => setCurrentRecipe(prev => ({
                  ...prev,
                  requiresChilling: e.target.checked
                }))}
              />
              <Label htmlFor="requiresChilling">Requires Chilling</Label>
            </div>

            {currentRecipe.requiresChilling && (
              <div className="space-y-2">
                <Label htmlFor="maxChillTime">Max Chill Time (minutes)</Label>
                <Input
                  id="maxChillTime"
                  type="number"
                  value={currentRecipe.maxChillTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentRecipe(prev => ({
                    ...prev,
                    maxChillTime: parseInt(e.target.value) || 0
                  }))}
                />
              </div>
            )}

            {/* Production Steps */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Production Steps</h3>
                <Button onClick={addStep} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </div>

              <div className="space-y-3">
                {currentRecipe.steps.map((step, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Step {index + 1}</h4>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingStep(step);
                            setStepIndex(index);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteStep(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Name</Label>
                        <p className="text-sm">{step.name}</p>
                      </div>
                      <div>
                        <Label>Duration</Label>
                        <p className="text-sm">{formatDuration(step.duration)}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {step.requiresHuman && <Badge variant="secondary">Human</Badge>}
                      {step.requiresOven && <Badge variant="secondary">Oven</Badge>}
                      {step.requiresMixer && <Badge variant="secondary">Mixer</Badge>}
                      {step.mustFollowImmediately && <Badge variant="secondary">Immediate</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={saveRecipe} 
              disabled={!currentRecipe.productType || currentRecipe.steps.length === 0 || loading}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Recipe
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Step Editor Modal */}
      {editingStep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit Step</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stepName">Step Name</Label>
                <Input
                  id="stepName"
                  value={editingStep.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingStep(prev => prev ? {
                    ...prev,
                    name: e.target.value
                  } : null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stepDuration">Duration (minutes)</Label>
                <Input
                  id="stepDuration"
                  type="number"
                  value={editingStep.duration}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingStep(prev => prev ? {
                    ...prev,
                    duration: parseInt(e.target.value) || 0
                  } : null)}
                />
              </div>

              <div className="space-y-2">
                <Label>Requirements</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="requiresHuman"
                      checked={editingStep.requiresHuman}
                      onChange={(e) => setEditingStep(prev => prev ? {
                        ...prev,
                        requiresHuman: e.target.checked
                      } : null)}
                    />
                    <Label htmlFor="requiresHuman">Requires Human</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="requiresOven"
                      checked={editingStep.requiresOven}
                      onChange={(e) => setEditingStep(prev => prev ? {
                        ...prev,
                        requiresOven: e.target.checked
                      } : null)}
                    />
                    <Label htmlFor="requiresOven">Requires Oven</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="requiresMixer"
                      checked={editingStep.requiresMixer}
                      onChange={(e) => setEditingStep(prev => prev ? {
                        ...prev,
                        requiresMixer: e.target.checked
                      } : null)}
                    />
                    <Label htmlFor="requiresMixer">Requires Mixer</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="mustFollowImmediately"
                      checked={editingStep.mustFollowImmediately}
                      onChange={(e) => setEditingStep(prev => prev ? {
                        ...prev,
                        mustFollowImmediately: e.target.checked
                      } : null)}
                    />
                    <Label htmlFor="mustFollowImmediately">Must Follow Immediately</Label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (editingStep && stepIndex >= 0) {
                      updateStep(stepIndex, editingStep);
                    }
                  }}
                  className="flex-1"
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingStep(null);
                    setStepIndex(-1);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
