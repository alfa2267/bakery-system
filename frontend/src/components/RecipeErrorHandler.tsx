import React from 'react';
import { ValidationError } from '../types';
import { Alert, AlertDialogDescription, AlertDialogTitle } from '../ui/Alert'; // Ensure this import is correct

// Error Handler Component Props
interface RecipeErrorHandlerProps {
  error: ValidationError | string | null;
  onDismiss: () => void;
}

// Error Handler Component
const RecipeErrorHandler: React.FC<RecipeErrorHandlerProps> = ({ error, onDismiss }) => {
  if (!error) return null;

  // Extract error message
  const errorMessage = typeof error === 'string'
    ? error
    : error?.detail?.[0]?.msg || error?.message || 'An unexpected error occurred';

  return (
    <Alert variant="error" className="mb-4">
      <AlertDialogTitle className="flex items-center justify-between">
        <span>Error</span>
        <button 
          type="button" 
          onClick={onDismiss} 
          className="text-gray-500 hover:text-gray-700 focus:outline-none" 
          aria-label="Dismiss error"
        >
        </button>
      </AlertDialogTitle>
      <AlertDialogDescription>
        {errorMessage}
      </AlertDialogDescription>
    </Alert>
  );
};

export default RecipeErrorHandler;
