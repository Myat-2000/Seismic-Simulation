import React from 'react';

type SimulationStep = 'seismic' | 'building' | 'materials' | 'running';

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
    { id: 'materials', label: 'Structural Materials', icon: '🧱' },
    { id: 'running', label: 'Simulation', icon: '▶️' }
  ];

  // Calculate progress percentage based on current step
  const getProgressPercentage = () => {
    const stepIndex = steps.findIndex(step => step.id === currentStep);
    return ((stepIndex + 1) / steps.length) * 100;
  };

  return (
    <div className="w-full mb-8">
      {/* Progress bar */}
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary-light bg-primary/10">
              Progress
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block text-primary-light">
              {Math.round(getProgressPercentage())}%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
          <div 
            style={{ width: `${getProgressPercentage()}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500 ease-in-out"
          ></div>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isPast = steps.findIndex(s => s.id === currentStep) > index;
          const isClickable = onStepClick && (isPast || isActive);
          
          return (
            <div 
              key={step.id} 
              className={`flex flex-col items-center ${index < steps.length - 1 ? 'w-1/4' : ''}`}
            >
              <div 
                className={`
                  w-10 h-10 flex items-center justify-center rounded-full text-lg
                  ${isActive ? 'bg-primary text-white scale-110 shadow-lg' : ''}
                  ${isPast ? 'bg-primary/20 text-primary' : ''}
                  ${!isActive && !isPast ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : ''}
                  ${isClickable ? 'cursor-pointer hover:scale-105 transition-transform' : ''}
                  transition-all duration-300
                `}
                onClick={() => isClickable ? onStepClick(step.id as SimulationStep) : null}
                role={isClickable ? 'button' : undefined}
                aria-label={isClickable ? `Go to ${step.label}` : undefined}
              >
                <span>{step.icon}</span>
              </div>
              <span 
                className={`
                  mt-2 text-xs font-medium text-center
                  ${isActive ? 'text-primary font-semibold' : ''}
                  ${isPast ? 'text-primary/70' : ''}
                  ${!isActive && !isPast ? 'text-gray-500 dark:text-gray-400' : ''}
                `}
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className="w-full h-1 mt-5 hidden sm:block">
                  <div 
                    className={`h-1 ${isPast || isActive ? 'bg-primary/30' : 'bg-gray-200 dark:bg-gray-700'}`}
                  ></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}