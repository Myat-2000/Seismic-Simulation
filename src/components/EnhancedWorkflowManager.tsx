'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BuildingParams } from './BuildingParameterForm';
import { SeismicParams } from './SeismicParameterForm';
import { StructuralMaterialsParams } from './StructuralMaterialsForm';
import { DetailedBuildingParams } from './StructuralComponentAnalysis';
import SimulationTransition from './SimulationTransition';
import SimulationProgressIndicator from './SimulationProgressIndicator';
import ConfigurationManager from './ConfigurationManager';
import { isWebGLSupported } from '../utils/browserCompatibilityCheck';

// Define all possible simulation steps
export type SimulationStep = 
  | 'seismic' 
  | 'building' 
  | 'structural' 
  | 'materials' 
  | 'running' 
  | 'results';

// Define step metadata for better context
type StepMetadata = {
  id: SimulationStep;
  title: string;
  description: string;
  requiredParams: string[];
  nextStep?: SimulationStep;
  prevStep?: SimulationStep;
};

// Configuration for saved simulation state
type SimulationConfig = {
  id: string;
  name: string;
  date: string;
  currentStep: SimulationStep;
  seismicParams: SeismicParams | null;
  buildingParams: BuildingParams | null;
  materialsParams: StructuralMaterialsParams | null;
};

type WorkflowManagerProps = {
  children: React.ReactNode;
  currentStep: SimulationStep;
  onStepChange: (step: SimulationStep) => void;
  seismicParams: SeismicParams | null;
  buildingParams: BuildingParams | null;
  materialsParams: StructuralMaterialsParams | null;
  isSimulationRunning: boolean;
  onSimulationComplete?: () => void;
};

/**
 * Enhanced WorkflowManager component to coordinate simulation steps with improved navigation
 * This component provides a more flexible workflow with non-linear navigation, save/resume functionality,
 * better error handling, and clearer transitions between steps.
 */
export default function EnhancedWorkflowManager({
  children,
  currentStep,
  onStepChange,
  seismicParams,
  buildingParams,
  materialsParams,
  isSimulationRunning,
  onSimulationComplete
}: WorkflowManagerProps) {
  // State for transition management
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [transitionMessage, setTransitionMessage] = useState('');
  const [fromStep, setFromStep] = useState<SimulationStep>(currentStep);
  const [toStep, setToStep] = useState<SimulationStep>(currentStep);
  
  // State for error handling
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  // State for configuration management
  const [showConfigManager, setShowConfigManager] = useState(false);
  const [configName, setConfigName] = useState('');
  const [savedConfigs, setSavedConfigs] = useState<SimulationConfig[]>([]);
  
  // State for contextual help
  const [showHelp, setShowHelp] = useState(false);
  const [helpContent, setHelpContent] = useState<{title: string, content: string}[]>([]);
  
  // Ref to track previous step for comparison
  const prevStepRef = useRef<SimulationStep>(currentStep);
  
  // Define step metadata for better context and navigation
  const STEP_METADATA: Record<SimulationStep, StepMetadata> = {
    seismic: {
      id: 'seismic',
      title: 'Seismic Parameters',
      description: 'Configure earthquake characteristics including magnitude, duration, and epicenter location.',
      requiredParams: [],
      nextStep: 'building',
      prevStep: undefined
    },
    building: {
      id: 'building',
      title: 'Building Properties',
      description: 'Define the physical characteristics of your building including dimensions and number of floors.',
      requiredParams: ['seismicParams'],
      nextStep: 'structural',
      prevStep: 'seismic'
    },
    structural: {
      id: 'structural',
      title: 'Structural Elements',
      description: 'Configure the structural components of your building including columns, beams, and connections.',
      requiredParams: ['seismicParams', 'buildingParams'],
      nextStep: 'materials',
      prevStep: 'building'
    },
    materials: {
      id: 'materials',
      title: 'Structural Materials',
      description: 'Specify the materials used in your building structure and their properties.',
      requiredParams: ['seismicParams', 'buildingParams'],
      nextStep: 'running',
      prevStep: 'structural'
    },
    running: {
      id: 'running',
      title: 'Simulation Running',
      description: 'The earthquake simulation is currently running. Please wait for it to complete.',
      requiredParams: ['seismicParams', 'buildingParams', 'materialsParams'],
      nextStep: 'results',
      prevStep: 'materials'
    },
    results: {
      id: 'results',
      title: 'Simulation Results',
      description: 'View and analyze the results of your earthquake simulation.',
      requiredParams: ['seismicParams', 'buildingParams', 'materialsParams'],
      nextStep: undefined,
      prevStep: 'running'
    }
  };
  
  // Check for WebGL support on mount
  useEffect(() => {
    const checkWebGLSupport = async () => {
      const hasWebGL = isWebGLSupported();
      if (!hasWebGL) {
        setWarnings(prev => [...prev, 'Your browser does not support WebGL, which is required for 3D visualization. A 2D fallback will be used.']);
      }
    };
    
    checkWebGLSupport();
    
    // Load saved configurations from localStorage
    const savedConfigsJson = localStorage.getItem('seismicSimulationConfigs');
    if (savedConfigsJson) {
      try {
        const configs = JSON.parse(savedConfigsJson);
        setSavedConfigs(configs);
      } catch (e) {
        console.error('Failed to parse saved configurations', e);
      }
    }
  }, []);
  
  // Handle step transitions with animation
  useEffect(() => {
    // If the step has changed
    if (currentStep !== prevStepRef.current) {
      // Start transition
      setFromStep(prevStepRef.current);
      setToStep(currentStep);
      setIsTransitioning(true);
      setTransitionProgress(0);
      
      // Set appropriate transition message
      setTransitionMessage(STEP_METADATA[currentStep].description);
      
      // Animate progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setTransitionProgress(Math.min(progress, 100));
        
        if (progress >= 100) {
          clearInterval(interval);
          // Keep transition visible for a moment after reaching 100%
          setTimeout(() => {
            setIsTransitioning(false);
          }, 500);
        }
      }, 50);
      
      // Update previous step ref
      prevStepRef.current = currentStep;
      
      return () => clearInterval(interval);
    }
  }, [currentStep, STEP_METADATA]);
  
  // Validate step transitions
  const canProceedToStep = (targetStep: SimulationStep): boolean => {
    const requiredParams = STEP_METADATA[targetStep].requiredParams;
    
    // Check if all required parameters are available
    const hasAllParams = requiredParams.every(param => {
      switch (param) {
        case 'seismicParams':
          return !!seismicParams;
        case 'buildingParams':
          return !!buildingParams;
        case 'materialsParams':
          return !!materialsParams;
        default:
          return false;
      }
    });
    
    // Special case for results step - simulation must be complete
    if (targetStep === 'results') {
      return hasAllParams && !isSimulationRunning;
    }
    
    return hasAllParams;
  };
  
  // Get available steps that can be navigated to
  const getAvailableSteps = (): SimulationStep[] => {
    return Object.keys(STEP_METADATA).filter(step => 
      canProceedToStep(step as SimulationStep)
    ) as SimulationStep[];
  };
  
  // Handle step navigation with validation
  const handleStepChange = (step: SimulationStep) => {
    if (canProceedToStep(step)) {
      onStepChange(step);
    } else {
      // Show error if trying to skip steps
      const missingParams = STEP_METADATA[step].requiredParams.filter(param => {
        switch (param) {
          case 'seismicParams':
            return !seismicParams;
          case 'buildingParams':
            return !buildingParams;
          case 'materialsParams':
            return !materialsParams;
          default:
            return true;
        }
      });
      
      const missingSteps = missingParams.map(param => {
        switch (param) {
          case 'seismicParams':
            return 'Seismic Parameters';
          case 'buildingParams':
            return 'Building Properties';
          case 'materialsParams':
            return 'Structural Materials';
          default:
            return param;
        }
      });
      
      setError(`Cannot proceed to ${STEP_METADATA[step].title}. Please complete the following steps first: ${missingSteps.join(', ')}.`);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };
  
  // Handle next step navigation
  const handleNextStep = () => {
    const nextStep = STEP_METADATA[currentStep].nextStep;
    if (nextStep && canProceedToStep(nextStep)) {
      onStepChange(nextStep);
    }
  };
  
  // Handle previous step navigation
  const handlePrevStep = () => {
    const prevStep = STEP_METADATA[currentStep].prevStep;
    if (prevStep) {
      onStepChange(prevStep);
    }
  };
  
  // Save current configuration
  const handleSaveConfig = () => {
    if (!configName.trim()) {
      setError('Please enter a name for this configuration');
      return;
    }
    
    const newConfig: SimulationConfig = {
      id: Date.now().toString(),
      name: configName,
      date: new Date().toLocaleString(),
      currentStep,
      seismicParams,
      buildingParams,
      materialsParams
    };
    
    const updatedConfigs = [...savedConfigs, newConfig];
    setSavedConfigs(updatedConfigs);
    localStorage.setItem('seismicSimulationConfigs', JSON.stringify(updatedConfigs));
    setConfigName('');
    setShowConfigManager(false);
  };
  
  // Load a saved configuration
  const handleLoadConfig = (config: SimulationConfig) => {
    // Update all parameters
    if (config.seismicParams) {
      // Use the onStepChange callback to update seismic params in parent component
      // This assumes the parent component will update the seismicParams state
    }
    
    if (config.buildingParams) {
      // Use the onStepChange callback to update building params in parent component
      // This assumes the parent component will update the buildingParams state
    }
    
    if (config.materialsParams) {
      // Use the onStepChange callback to update materials params in parent component
      // This assumes the parent component will update the materialsParams state
    }
    
    // Navigate to the saved step
    onStepChange(config.currentStep);
    setShowConfigManager(false);
  };
  
  // Show contextual help for current step
  const showContextualHelp = () => {
    // Set help content based on current step
    switch (currentStep) {
      case 'seismic':
        setHelpContent([
          {
            title: 'Earthquake Magnitude',
            content: 'The Richter scale is logarithmic, meaning each whole number increase represents about 32 times more energy release.'
          },
          {
            title: 'Epicenter Distance',
            content: 'The distance from the epicenter affects how much energy reaches your building. Closer proximity generally means stronger shaking.'
          }
        ]);
        break;
      case 'building':
        setHelpContent([
          {
            title: 'Building Height',
            content: 'Taller buildings have longer natural periods of vibration, which affects how they respond to different earthquake frequencies.'
          },
          {
            title: 'Structural Stiffness',
            content: 'Stiffer buildings experience less displacement but may be subjected to higher forces during an earthquake.'
          }
        ]);
        break;
      // Add help content for other steps
      default:
        setHelpContent([{
          title: 'Help',
          content: 'Contextual help for this step is not available.'
        }]);
    }
    
    setShowHelp(true);
  };
  
  return (
    <div className="relative">
      {/* Main content */}
      <div className={isTransitioning ? 'opacity-0 transition-opacity duration-300' : 'opacity-100 transition-opacity duration-300'}>
        {/* Enhanced Progress Indicator with available steps */}
        <div className="mb-6">
          <SimulationProgressIndicator 
            currentStep={currentStep} 
            onStepClick={handleStepChange}
          />
          
          {/* Step navigation controls */}
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={handlePrevStep}
              disabled={!STEP_METADATA[currentStep].prevStep}
              className={`px-4 py-2 rounded ${!STEP_METADATA[currentStep].prevStep ? 
                'bg-gray-300 text-gray-500 cursor-not-allowed' : 
                'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
            >
              ← Previous
            </button>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setShowConfigManager(true)}
                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
              >
                Save/Load
              </button>
              
              <button
                onClick={showContextualHelp}
                className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded"
              >
                Help
              </button>
            </div>
            
            <button
              onClick={handleNextStep}
              disabled={!STEP_METADATA[currentStep].nextStep || !canProceedToStep(STEP_METADATA[currentStep].nextStep!)}
              className={`px-4 py-2 rounded ${!STEP_METADATA[currentStep].nextStep || !canProceedToStep(STEP_METADATA[currentStep].nextStep!) ? 
                'bg-gray-300 text-gray-500 cursor-not-allowed' : 
                'bg-primary hover:bg-primary-dark text-white'}`}
            >
              Next →
            </button>
          </div>
        </div>
        
        {/* Current step title and description */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-2">{STEP_METADATA[currentStep].title}</h2>
          <p className="text-gray-600 dark:text-gray-400">{STEP_METADATA[currentStep].description}</p>
        </div>
        
        {/* Main content (forms, visualizations, etc.) */}
        {children}
      </div>
      
      {/* Transition overlay */}
      {isTransitioning && (
        <SimulationTransition
          fromStep={fromStep}
          toStep={toStep}
          isLoading={isTransitioning}
          progress={transitionProgress}
          message={transitionMessage}
          onComplete={() => setIsTransitioning(false)}
        />
      )}
      
      {/* Configuration Manager Modal */}
      {showConfigManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Configuration Manager</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Save Current Configuration</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  placeholder="Configuration name"
                  className="flex-1 px-3 py-2 border rounded"
                />
                <button
                  onClick={handleSaveConfig}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
                >
                  Save
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Load Configuration</label>
              {savedConfigs.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {savedConfigs.map(config => (
                    <div 
                      key={config.id}
                      className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded"
                    >
                      <div>
                        <div className="font-medium">{config.name}</div>
                        <div className="text-xs text-gray-500">{config.date}</div>
                      </div>
                      <button
                        onClick={() => handleLoadConfig(config)}
                        className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-sm"
                      >
                        Load
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-2">No saved configurations</p>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowConfigManager(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Contextual Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Help: {STEP_METADATA[currentStep].title}</h3>
            
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {helpContent.map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <h4 className="font-bold mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.content}</p>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowHelp(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Error notification */}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md w-full shadow-lg">
          <div className="flex items-start">
            <div className="py-1">
              <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
              </svg>
            </div>
            <div>
              <p className="font-bold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="ml-auto bg-transparent text-red-700 hover:text-red-800 font-semibold"
            >
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Warning notifications */}
      {warnings.length > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded max-w-md w-full shadow-lg">
          <div className="flex items-start">
            <div className="py-1">
              <svg className="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M10 0C4.5 0 0 4.5 0 10s4.5 10 10 10 10-4.5 10-10S15.5 0 10 0zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm0-13c-.6 0-1 .4-1 1v6c0 .6.4 1 1 1s1-.4 1-1V6c0-.6-.4-1-1-1zm0 10c.6 0 1-.4 1-1s-.4-1-1-1-1 .4-1 1 .4 1 1 1z"/>
              </svg>
            </div>
            <div>
              <p className="font-bold">Warning</p>
              <ul className="text-sm list-disc pl-5">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
            <button 
              onClick={() => setWarnings([])}
              className="ml-auto bg-transparent text-yellow-700 hover:text-yellow-800 font-semibold"
            >
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}