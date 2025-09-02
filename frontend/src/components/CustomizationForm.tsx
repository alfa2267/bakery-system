// src/components/CustomizationForm.tsx

import React, { useState, useEffect } from 'react';
import { OrderItem, ProductOption } from '../types';
import { pricingEngine } from '../lib/utils';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import ImageUpload from './ImageUpload';

interface CustomizationFormProps {
  item: OrderItem;
  onChange: (updatedItem: OrderItem) => void;
  onRemove: () => void;
  itemIndex: number;
}

const CustomizationForm: React.FC<CustomizationFormProps> = ({
  item,
  onChange,
  onRemove,
  itemIndex
}) => {
  const [availableOptions, setAvailableOptions] = useState<{
    sizes: ProductOption[];
    flavors: ProductOption[];
    icings: ProductOption[];
    toppings: ProductOption[];
  }>({
    sizes: [],
    flavors: [],
    icings: [],
    toppings: []
  });

  // Load available options when product changes
  useEffect(() => {
    const options = pricingEngine.getAvailableOptions(item.product);
    setAvailableOptions(options);
  }, [item.product]);

  // Update pricing when item changes
  useEffect(() => {
    try {
      const calculation = pricingEngine.calculateItemPrice(item);
      if (calculation.totalPrice !== item.totalPrice) {
        onChange({
          ...item,
          totalPrice: calculation.totalPrice
        });
      }
    } catch (error) {
      console.error('Error calculating price:', error);
    }
  }, [item.customizations, item.quantity]);

  const updateCustomization = (field: string, value: any) => {
    const updatedCustomizations = {
      ...item.customizations,
      [field]: value
    };

    onChange({
      ...item,
      customizations: updatedCustomizations
    });
  };

  const updateIcing = (field: string, value: any) => {
    const updatedIcing = {
      ...item.customizations?.icing,
      [field]: value
    };

    updateCustomization('icing', updatedIcing);
  };

  const toggleFlavor = (flavorId: string) => {
    const currentFlavors = item.customizations?.flavor || [];
    let updatedFlavors;

    if (currentFlavors.includes(flavorId)) {
      updatedFlavors = currentFlavors.filter(f => f !== flavorId);
    } else {
      if (currentFlavors.length >= 3) {
        return; // Max 3 flavors
      }
      updatedFlavors = [...currentFlavors, flavorId];
    }

    updateCustomization('flavor', updatedFlavors);
  };

  const toggleTopping = (toppingId: string) => {
    const currentToppings = item.customizations?.toppings || [];
    let updatedToppings;

    if (currentToppings.includes(toppingId)) {
      updatedToppings = currentToppings.filter(t => t !== toppingId);
    } else {
      if (currentToppings.length >= 5) {
        return; // Max 5 toppings
      }
      updatedToppings = [...currentToppings, toppingId];
    }

    updateCustomization('toppings', updatedToppings);
  };

  const handleImageUpload = (file: File) => {
    onChange({
      ...item,
      inspirationImage: file
    });
  };

  const handleImageRemove = () => {
    const { inspirationImage, ...itemWithoutImage } = item;
    onChange(itemWithoutImage);
  };

  const getFlavorDisplayName = (flavorId: string): string => {
    const flavor = availableOptions.flavors.find(f => f.id === flavorId);
    return flavor ? flavor.name : flavorId;
  };

  const getToppingDisplayName = (toppingId: string): string => {
    const topping = availableOptions.toppings.find(t => t.id === toppingId);
    return topping ? topping.name : toppingId;
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg capitalize">
              {item.product} #{itemIndex + 1}
            </CardTitle>
            <CardDescription>
              Customize your order item
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <div className="text-sm text-gray-600">Total</div>
              <div className="font-bold text-green-600">${item.totalPrice.toFixed(2)}</div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRemove}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Remove
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quantity */}
        <div>
          <Label htmlFor={`quantity-${itemIndex}`}>Quantity</Label>
          <Input
            id={`quantity-${itemIndex}`}
            type="number"
            min="1"
            max="100"
            value={item.quantity}
            onChange={(e) => onChange({
              ...item,
              quantity: Math.max(1, parseInt(e.target.value) || 1)
            })}
            className="w-20"
          />
        </div>

        {/* Size Selection */}
        {availableOptions.sizes.length > 0 && (
          <div>
            <Label>Size</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {availableOptions.sizes.map(size => (
                <Button
                  key={size.id}
                  variant={item.customizations?.size === size.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateCustomization('size', size.id)}
                  className="justify-start"
                >
                  {size.name}
                  {size.multiplier !== 1 && (
                    <span className="ml-1 text-xs">({size.multiplier}x)</span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Flavor Selection */}
        {availableOptions.flavors.length > 0 && (
          <div>
            <Label>
              Flavors (Select up to 3)
              {item.customizations?.flavor && item.customizations.flavor.length > 1 && (
                <span className="ml-2 text-sm text-blue-600">
                  +${pricingEngine.calculateItemPrice(item).flavorSurcharge.toFixed(2)} surcharge
                </span>
              )}
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {availableOptions.flavors.map(flavor => {
                const isSelected = item.customizations?.flavor?.includes(flavor.id);
                const isDisabled = !isSelected && (item.customizations?.flavor?.length || 0) >= 3;
                
                return (
                  <Button
                    key={flavor.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleFlavor(flavor.id)}
                    disabled={isDisabled}
                    className="justify-start"
                  >
                    {flavor.name}
                    {(flavor.additionalCost || 0) > 0 && (
                      <span className="ml-1 text-xs">+${flavor.additionalCost}</span>
                    )}
                  </Button>
                );
              })}
            </div>
            {item.customizations?.flavor && item.customizations.flavor.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Selected: {item.customizations.flavor.map(getFlavorDisplayName).join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Icing Selection */}
        {availableOptions.icings.length > 0 && (
          <div>
            <Label>Icing</Label>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableOptions.icings.map(icing => (
                  <Button
                    key={icing.id}
                    variant={item.customizations?.icing?.type === icing.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateIcing('type', icing.id)}
                    className="justify-start"
                  >
                    {icing.name}
                    {(icing.additionalCost || 0) > 0 && (
                      <span className="ml-1 text-xs">+${icing.additionalCost}</span>
                    )}
                  </Button>
                ))}
              </div>

              {/* Icing flavor and message for certain types */}
              {item.customizations?.icing?.type && item.customizations.icing.type !== 'none' && (
                <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                  <div>
                    <Label htmlFor={`icing-flavor-${itemIndex}`}>Icing Flavor</Label>
                    <Input
                      id={`icing-flavor-${itemIndex}`}
                      placeholder="e.g., Vanilla, Chocolate"
                      value={item.customizations?.icing?.flavor || ''}
                      onChange={(e) => updateIcing('flavor', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`icing-message-${itemIndex}`}>
                      Custom Message (optional, max 50 chars)
                    </Label>
                    <Input
                      id={`icing-message-${itemIndex}`}
                      placeholder="e.g., Happy Birthday!"
                      maxLength={50}
                      value={item.customizations?.icing?.message || ''}
                      onChange={(e) => updateIcing('message', e.target.value)}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {(item.customizations?.icing?.message || '').length}/50 characters
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Toppings Selection */}
        {availableOptions.toppings.length > 0 && (
          <div>
            <Label>Toppings (Select up to 5)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {availableOptions.toppings.map(topping => {
                const isSelected = item.customizations?.toppings?.includes(topping.id);
                const isDisabled = !isSelected && (item.customizations?.toppings?.length || 0) >= 5;
                
                return (
                  <Button
                    key={topping.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTopping(topping.id)}
                    disabled={isDisabled}
                    className="justify-start"
                  >
                    {topping.name}
                    {(topping.additionalCost || 0) > 0 && (
                      <span className="ml-1 text-xs">+${topping.additionalCost}</span>
                    )}
                  </Button>
                );
              })}
            </div>
            {item.customizations?.toppings && item.customizations.toppings.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Selected: {item.customizations.toppings.map(getToppingDisplayName).join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Special Instructions */}
        <div>
          <Label htmlFor={`special-instructions-${itemIndex}`}>
            Special Instructions (optional, max 200 chars)
          </Label>
          <textarea
            id={`special-instructions-${itemIndex}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            maxLength={200}
            placeholder="Any special requests or dietary restrictions..."
            value={item.customizations?.specialInstructions || ''}
            onChange={(e) => updateCustomization('specialInstructions', e.target.value)}
          />
          <div className="text-xs text-gray-500 mt-1">
            {(item.customizations?.specialInstructions || '').length}/200 characters
          </div>
        </div>

        {/* Design Notes */}
        <div>
          <Label htmlFor={`design-notes-${itemIndex}`}>
            Design Notes (optional)
          </Label>
          <Input
            id={`design-notes-${itemIndex}`}
            placeholder="Describe your design preferences..."
            value={item.designNotes || ''}
            onChange={(e) => onChange({
              ...item,
              designNotes: e.target.value
            })}
          />
        </div>

        {/* Inspiration Image */}
        <div>
          <Label>Inspiration Image (optional)</Label>
          <ImageUpload
            onImageUpload={handleImageUpload}
            onImageRemove={handleImageRemove}
            currentImage={item.inspirationImage}
            className="mt-2"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomizationForm;