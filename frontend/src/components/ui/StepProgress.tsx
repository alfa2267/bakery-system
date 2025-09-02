import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  subtitle: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number;
  onStepChange: (step: number) => void;
  showNavigation?: boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
  nextLabel?: string;
  prevLabel?: string;
  onNext?: () => void;
  onPrev?: () => void;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  currentStep,
  onStepChange,
  showNavigation = true,
  canGoBack = true,
  canGoForward = true,
  nextLabel = "Next",
  prevLabel = "Previous",
  onNext,
  onPrev
}) => {
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else if (currentStep < steps.length - 1) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (onPrev) {
      onPrev();
    } else if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="bg-white shadow-md border-b border-gray-200 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-gray-600">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Title */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{steps[currentStep].title}</h2>
          <p className="text-gray-600">{steps[currentStep].subtitle}</p>
        </div>
      </div>

      {/* Navigation */}
      {showNavigation && (
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0 || !canGoBack}
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            {prevLabel}
          </button>

          <button
            onClick={handleNext}
            disabled={currentStep === steps.length - 1 || !canGoForward}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {nextLabel}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};