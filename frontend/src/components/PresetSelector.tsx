import React from 'react';
import { OrderPreset, PresetSelectorProps } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const PresetSelector: React.FC<PresetSelectorProps> = ({
  presets,
  onSelectPreset,
  selectedPreset,
  className = ''
}) => {
  if (presets.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">No presets available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Quick Order Presets</h3>
        <p className="text-sm text-gray-600">
          Choose from our popular combinations or customize your own order below.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {presets.map(preset => (
          <Card
            key={preset.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedPreset === preset.id 
                ? 'ring-2 ring-blue-500 border-blue-500' 
                : 'hover:border-gray-300'
            }`}
            onClick={() => onSelectPreset(preset)}
          >
            {preset.image && (
              <div className="w-full h-32 bg-gray-200 rounded-t-lg overflow-hidden">
                <img
                  src={preset.image}
                  alt={preset.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Hide image if it fails to load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                {preset.name}
              </CardTitle>
              {preset.category && (
                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block w-fit">
                  {preset.category}
                </div>
              )}
            </CardHeader>
            
            <CardContent className="pt-0">
              <CardDescription className="text-sm text-gray-600 mb-3">
                {preset.description}
              </CardDescription>
              
              {/* Items preview */}
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 mb-1">Includes:</p>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {preset.items.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>{item.product} {item.customizations?.size && `(${item.customizations.size})`}</span>
                      <span>×{item.quantity}</span>
                    </li>
                  ))}
                  {preset.items.length > 3 && (
                    <li className="text-gray-400 italic">
                      +{preset.items.length - 3} more items...
                    </li>
                  )}
                </ul>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="font-bold text-lg text-green-600">
                  ${preset.totalPrice.toFixed(2)}
                </div>
                <Button
                  size="sm"
                  variant={selectedPreset === preset.id ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPreset(preset);
                  }}
                >
                  {selectedPreset === preset.id ? 'Selected' : 'Select'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PresetSelector;