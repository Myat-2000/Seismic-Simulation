'use client';

import React from 'react';

type SimulationTransitionProps = {
  fromStep: string;
  toStep: string;
  isLoading: boolean;
  progress?: number;
  message?: string;
  onComplete?: () => void;
};

/**
 * A component to provide visual feedback during transitions between simulation steps
 * This improves the user workflow by making transitions more clear and providing feedback
 */
export default function SimulationTransition({
  fromStep,
  toStep,
  isLoading,
  progress = 0,
  message = 'Preparing simulation...',
  onComplete
}: SimulationTransitionProps) {
  // Automatically trigger onComplete when loading is done
  React.useEffect(() => {
    if (!isLoading && onComplete) {
      // Add a small delay to allow the animation to complete
      const timer = setTimeout(() => {
        onComplete();
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, onComplete]);

  // If not loading, don't render anything
  if (!isLoading) return null;

  // Get appropriate icons for the steps
  const getStepIcon = (step: string) => {
    switch (step) {
      case 'seismic':
        return '🌊';
      case 'building':
        return '🏢';
      case 'structural':
        return '🏗️';
      case 'materials':
        return '🧱';
      case 'running':
        return '▶️';
      default:
        return '📋';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all duration-500 scale-100">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
            {getStepIcon(fromStep)}
          </div>
          
          <div className="mx-4 flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
            {getStepIcon(toStep)}
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-center mb-2 text-gray-800 dark:text-white">
          {message}
        </h3>
        
        <div className="flex justify-center items-center space-x-2 mt-4">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        
        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-4">
          Transitioning from {fromStep} to {toStep}...
        </p>
      </div>
    </div>
  );
}