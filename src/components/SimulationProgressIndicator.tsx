import React from 'react';

type SimulationStep = 'seismic' | 'building' | 'structural' | 'materials' | 'running';

type SimulationProgressIndicatorProps = {
  currentStep: SimulationStep;
  onStepClick?: (step: SimulationStep) => void;
};

export default function SimulationProgressIndicator({
  currentStep,
  onStepClick
}: SimulationProgressIndicatorProps) {
  // Define steps and their properties
  const steps = [
    { id: 'seismic', label: 'Seismic Parameters', icon: '🌊' },
    { id: 'building', label: 'Building Properties', icon: '🏢' },
    { id: 'structural', label: 'Structural Elements', icon: '🏗️' },
    { id: 'materials', label: 'Structural Materials', icon: '🧱' },
    { id: 'running', label: 'Simulation', icon: '▶️' }
  ];

  // Calculate progress percentage based on current step
  const getProgressPercentage = () => {
    const stepIndex = steps.findIndex(step => step.id === currentStep);
    return ((stepIndex + 1) / steps.length) * 100;
  };
  
  // Get current step index
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="w-full mb-8">
      {/* Progress bar */}
      <div className="relative pt-1">
        <div className="flex mb-3 items-center justify-between">
          <div>
            <span className="text-sm font-semibold inline-block py-1.5 px-3 uppercase rounded-full text-primary-light bg-primary/10 shadow-sm">
              Progress
            </span>
          </div>
          <div className="text-right">
            <span className="text-sm font-semibold inline-block py-1 px-2 rounded-md bg-gray-100 dark:bg-gray-800 text-primary shadow-sm">
              {Math.round(getProgressPercentage())}%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-3 mb-6 text-xs flex rounded-full bg-gray-200 dark:bg-gray-700 shadow-inner">
          <div 
            style={{ width: `${getProgressPercentage()}%` }}
            className="shadow-lg flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-primary/90 to-primary transition-all duration-500 ease-in-out rounded-full"
          >
            {getProgressPercentage() > 15 && (
              <div className="absolute inset-0 flex items-center justify-start pl-3">
                <span className="text-xs font-medium text-white drop-shadow-md">
                  Step {currentStepIndex + 1} of {steps.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isPast = currentStepIndex > index;
          const isClickable = onStepClick && (isPast || isActive);
          
          return (
            <div 
              key={step.id} 
              className={`flex flex-col items-center ${index < steps.length - 1 ? 'w-1/4' : ''}`}
            >
              <div 
                className={`
                  w-12 h-12 flex items-center justify-center rounded-full text-lg
                  ${isActive ? 'bg-primary text-white scale-110 shadow-lg ring-4 ring-primary/20' : ''}
                  ${isPast ? 'bg-primary/20 text-primary border-2 border-primary/30' : ''}
                  ${!isActive && !isPast ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600' : ''}
                  ${isClickable ? 'cursor-pointer hover:scale-105 hover:shadow-md transition-transform' : ''}
                  transition-all duration-300
                `}
                onClick={() => isClickable ? onStepClick(step.id as SimulationStep) : null}
                role={isClickable ? 'button' : undefined}
                aria-label={isClickable ? `Go to ${step.label}` : undefined}
              >
                <span className="text-xl">{step.icon}</span>
              </div>
              <span 
                className={`
                  mt-2 text-xs font-medium text-center max-w-[90px] leading-tight
                  ${isActive ? 'text-primary font-bold' : ''}
                  ${isPast ? 'text-primary/70' : ''}
                  ${!isActive && !isPast ? 'text-gray-500 dark:text-gray-400' : ''}
                `}
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className="w-full h-1 mt-5 hidden sm:block relative">
                  <div 
                    className={`h-1.5 rounded-full ${isPast || isActive ? 'bg-primary/40' : 'bg-gray-200 dark:bg-gray-700'}`}
                  ></div>
                  {isPast && (
                    <div className="absolute top-1/2 right-0 w-2 h-2 rounded-full bg-primary transform -translate-y-1/2"></div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}