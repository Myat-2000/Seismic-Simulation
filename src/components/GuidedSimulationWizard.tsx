import React, { useState, useEffect } from 'react';
import { BuildingParams } from './BuildingParameterForm';
import { SeismicParams } from './SeismicParameterForm';
import { StructuralMaterialsParams } from './StructuralMaterialsForm';
import { DetailedBuildingParams } from './StructuralComponentAnalysis';
import { FormSection, FormField, Input, Select, Button } from './ui/FormComponents';

// Define preset configurations for common scenarios
const BUILDING_PRESETS = {
  residential: {
    name: 'Residential Building',
    description: 'Typical multi-story apartment building',
    params: {
      height: 30,
      width: 20,
      depth: 15,
      floors: 5,
      stiffness: 6,
      dampingRatio: 0.05,
      materialType: 'concrete'
    }
  },
  commercial: {
    name: 'Commercial Office',
    description: 'Mid-rise office building with open floor plans',
    params: {
      height: 45,
      width: 30,
      depth: 30,
      floors: 10,
      stiffness: 7,
      dampingRatio: 0.04,
      materialType: 'steel'
    }
  },
  skyscraper: {
    name: 'High-rise Skyscraper',
    description: 'Tall building with advanced structural systems',
    params: {
      height: 200,
      width: 40,
      depth: 40,
      floors: 50,
      stiffness: 8,
      dampingRatio: 0.03,
      materialType: 'steel'
    }
  },
  woodFrame: {
    name: 'Wood Frame Structure',
    description: 'Low-rise residential or small commercial building',
    params: {
      height: 12,
      width: 15,
      depth: 10,
      floors: 3,
      stiffness: 4,
      dampingRatio: 0.07,
      materialType: 'wood'
    }
  }
};

const SEISMIC_PRESETS = {
  moderate: {
    name: 'Moderate Earthquake',
    description: 'Common earthquake with noticeable but limited damage',
    params: {
      magnitude: 5.5,
      duration: 20,
      distance: 15,
      depth: 10,
      soilType: 'medium'
    }
  },
  strong: {
    name: 'Strong Earthquake',
    description: 'Significant earthquake with potential for serious damage',
    params: {
      magnitude: 6.8,
      duration: 35,
      distance: 8,
      depth: 15,
      soilType: 'soft'
    }
  },
  severe: {
    name: 'Severe Earthquake',
    description: 'Major earthquake with catastrophic potential',
    params: {
      magnitude: 8.0,
      duration: 60,
      distance: 5,
      depth: 20,
      soilType: 'soft'
    }
  },
  distant: {
    name: 'Distant Earthquake',
    description: 'Strong but distant earthquake with attenuated effects',
    params: {
      magnitude: 7.2,
      duration: 45,
      distance: 50,
      depth: 25,
      soilType: 'rock'
    }
  }
};

// Define the wizard steps
type WizardStep = {
  id: string;
  title: string;
  description: string;
};

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Seismic Simulation',
    description: 'This wizard will guide you through setting up a seismic simulation. You\'ll configure building parameters, seismic conditions, and structural materials.'
  },
  {
    id: 'building',
    title: 'Building Configuration',
    description: 'Define the physical characteristics of your building including dimensions, number of floors, and material type.'
  },
  {
    id: 'seismic',
    title: 'Seismic Parameters',
    description: 'Configure the earthquake characteristics including magnitude, duration, and distance from the epicenter.'
  },
  {
    id: 'materials',
    title: 'Structural Materials',
    description: 'Specify the materials used in your building structure and their properties.'
  },
  {
    id: 'review',
    title: 'Review & Simulate',
    description: 'Review your configuration and start the simulation.'
  }
];

// Parameter explanations for tooltips and help text
const PARAMETER_EXPLANATIONS = {
  building: {
    height: 'The total height of the building from ground level to the roof in meters.',
    width: 'The width of the building footprint in meters.',
    depth: 'The depth of the building footprint in meters.',
    floors: 'The number of floors or stories in the building.',
    stiffness: 'A measure of the building\'s resistance to deformation (1-10). Higher values indicate a stiffer structure.',
    dampingRatio: 'The ability of the structure to dissipate energy (0.01-0.1). Higher values indicate better energy absorption.',
    materialType: 'The primary structural material used in the building construction.'
  },
  seismic: {
    magnitude: 'The Richter scale magnitude of the earthquake. Each 1-point increase represents about 32 times more energy.',
    duration: 'The duration of strong shaking in seconds.',
    distance: 'The distance from the building to the earthquake epicenter in kilometers.',
    depth: 'The depth of the earthquake hypocenter below the surface in kilometers.',
    soilType: 'The type of soil at the building site, which affects ground motion amplification.',
    pWave: 'Primary waves (P-waves) are compression waves that are the first to arrive. They move through solids and liquids.',
    sWave: 'Secondary waves (S-waves) are shear waves that arrive after P-waves. They can only move through solids and cause more damage.'
  },
  materials: {
    concrete: 'Reinforced concrete is strong in compression but requires steel reinforcement for tension. It provides good mass and damping.',
    steel: 'Steel structures are lightweight, ductile, and have high strength-to-weight ratios. They can flex without breaking.',
    wood: 'Wood frame structures are lightweight and flexible, but have lower strength than concrete or steel.'
  }
};

type GuidedSimulationWizardProps = {
  onComplete: (params: {
    buildingParams: BuildingParams;
    seismicParams: SeismicParams;
    materialsParams: StructuralMaterialsParams;
  }) => void;
  initialBuildingParams?: Partial<BuildingParams>;
  initialSeismicParams?: Partial<SeismicParams>;
  initialMaterialsParams?: Partial<StructuralMaterialsParams>;
};

export default function GuidedSimulationWizard({
  onComplete,
  initialBuildingParams = {},
  initialSeismicParams = {},
  initialMaterialsParams = {}
}: GuidedSimulationWizardProps) {
  // Current step in the wizard
  const [currentStep, setCurrentStep] = useState<string>('welcome');
  
  // State for real-time preview
  const [showPreview, setShowPreview] = useState<boolean>(true);
  
  // Parameters state
  const [buildingParams, setBuildingParams] = useState<BuildingParams>({
    height: 50,
    width: 20,
    depth: 20,
    floors: 6,
    stiffness: 5,
    dampingRatio: 0.05,
    materialType: 'concrete',
    structuralComponents: {
      columns: {
        width: 0.5,
        reinforcement: 'medium',
        connectionType: 'rigid'
      },
      beams: {
        width: 0.3,
        depth: 0.5,
        reinforcement: 'medium',
        connectionType: 'rigid'
      },
      slabs: {
        thickness: 0.2,
        reinforcement: 'medium',
        type: 'two-way'
      },
      foundation: {
        type: 'isolated',
        depth: 2
      }
    },
    ...initialBuildingParams
  });
  
  const [seismicParams, setSeismicParams] = useState<SeismicParams>({
    magnitude: 6.5,
    duration: 30,
    distance: 10,
    depth: 15,
    soilType: 'medium',
    ...initialSeismicParams
  });
  
  const [materialsParams, setMaterialsParams] = useState<StructuralMaterialsParams>({
    concreteStrength: 30,
    steelYieldStrength: 400,
    woodGrade: 'medium',
    ...initialMaterialsParams
  });

  // Get current step index
  const currentStepIndex = WIZARD_STEPS.findIndex(step => step.id === currentStep);
  
  // Navigate to next step with animation
  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < WIZARD_STEPS.length) {
      // Add a brief transition effect
      const container = document.getElementById('wizard-content');
      if (container) {
        container.classList.add('opacity-0');
        setTimeout(() => {
          setCurrentStep(WIZARD_STEPS[nextIndex].id);
          setTimeout(() => {
            container.classList.remove('opacity-0');
          }, 50);
        }, 200);
      } else {
        setCurrentStep(WIZARD_STEPS[nextIndex].id);
      }
    }
  };
  
  // Navigate to previous step with animation
  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      // Add a brief transition effect
      const container = document.getElementById('wizard-content');
      if (container) {
        container.classList.add('opacity-0');
        setTimeout(() => {
          setCurrentStep(WIZARD_STEPS[prevIndex].id);
          setTimeout(() => {
            container.classList.remove('opacity-0');
          }, 50);
        }, 200);
      } else {
        setCurrentStep(WIZARD_STEPS[prevIndex].id);
      }
    }
  };
  
  // Complete the wizard
  const completeWizard = () => {
    onComplete({
      buildingParams,
      seismicParams,
      materialsParams
    });
  };
  
  // Generate a simplified preview of the current configuration
  const generatePreview = () => {
    // This would be replaced with actual visualization in a production environment
    // For now, we'll return a description of what would be shown
    switch(currentStep) {
      case 'building':
        return {
          title: 'Building Preview',
          description: `${buildingParams.floors}-story ${buildingParams.materialType} building`,
          details: [
            `Height: ${buildingParams.height}m`,
            `Width: ${buildingParams.width}m × Depth: ${buildingParams.depth}m`,
            `Stiffness: ${buildingParams.stiffness}/10`,
            `Damping: ${buildingParams.dampingRatio.toFixed(2)}`
          ]
        };
      case 'seismic':
        return {
          title: 'Earthquake Simulation Preview',
          description: `Magnitude ${seismicParams.magnitude.toFixed(1)} earthquake`,
          details: [
            `Duration: ${seismicParams.duration}s`,
            `Distance: ${seismicParams.distance}km`,
            `Depth: ${seismicParams.depth}km`,
            `Soil: ${seismicParams.soilType}`
          ]
        };
      case 'materials':
        return {
          title: 'Materials Preview',
          description: `${buildingParams.materialType.charAt(0).toUpperCase() + buildingParams.materialType.slice(1)} structure with detailed properties`,
          details: [
            buildingParams.materialType === 'concrete' ? `Concrete Strength: ${materialsParams.concreteStrength}MPa` : '',
            buildingParams.materialType === 'steel' ? `Steel Yield Strength: ${materialsParams.steelYieldStrength}MPa` : '',
            buildingParams.materialType === 'wood' ? `Wood Grade: ${materialsParams.woodGrade}` : ''
          ].filter(Boolean)
        };
      default:
        return {
          title: 'Simulation Preview',
          description: 'Complete the setup to run your simulation',
          details: []
        };
    }
  };
  
  const preview = generatePreview();
  
  // Apply a building preset
  const applyBuildingPreset = (presetKey: keyof typeof BUILDING_PRESETS) => {
    const preset = BUILDING_PRESETS[presetKey];
    setBuildingParams(prev => ({
      ...prev,
      ...preset.params
    }));
  };
  
  // Apply a seismic preset
  const applySeismicPreset = (presetKey: keyof typeof SEISMIC_PRESETS) => {
    const preset = SEISMIC_PRESETS[presetKey];
    setSeismicParams(prev => ({
      ...prev,
      ...preset.params
    }));
  };
  
  // Handle building parameter changes
  const handleBuildingParamChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setBuildingParams(prev => ({
      ...prev,
      [name]: type === 'number' || type === 'range'
        ? parseFloat(value)
        : value
    }));
  };
  
  // Handle seismic parameter changes
  const handleSeismicParamChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setSeismicParams(prev => ({
      ...prev,
      [name]: type === 'number' || type === 'range'
        ? parseFloat(value)
        : value
    }));
  };
  
  // Handle materials parameter changes
  const handleMaterialsParamChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setMaterialsParams(prev => ({
      ...prev,
      [name]: type === 'number' || type === 'range'
        ? parseFloat(value)
        : value
    }));
  };

  // Render the current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="text-5xl mb-4">🏢</div>
              <h2 className="text-2xl font-bold mb-2">Welcome to the Seismic Simulation Wizard</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                This guided wizard will help you set up a detailed seismic simulation for your building.
                You'll learn about important parameters and their effects on structural response.
              </p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">What You'll Configure:</h3>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li>Building dimensions, materials, and structural properties</li>
                <li>Earthquake characteristics including magnitude and duration</li>
                <li>Structural material specifications and behavior</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-2">Did You Know?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                During an earthquake, buildings experience different types of seismic waves. P-waves (Primary) arrive first and cause compression, 
                while S-waves (Secondary) arrive later and cause more damaging lateral movements.
              </p>
            </div>
          </div>
        );
        
      case 'building':
        return (
          <div className="space-y-6 py-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Building Configuration</h3>
              <p className="text-blue-700 dark:text-blue-300">
                The physical characteristics of your building significantly affect how it responds to seismic events.
                Taller buildings typically experience more sway, while stiffer structures may experience higher forces.
              </p>
            </div>
            
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Quick Presets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(BUILDING_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyBuildingPreset(key as keyof typeof BUILDING_PRESETS)}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <FormSection title="Building Dimensions" description="Define the physical size of your building">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField 
                  label="Height (m)" 
                  htmlFor="height" 
                  tooltip={PARAMETER_EXPLANATIONS.building.height}
                >
                  <Input
                    id="height"
                    type="number"
                    name="height"
                    value={buildingParams.height}
                    onChange={handleBuildingParamChange}
                    min={10}
                    max={500}
                    step={5}
                  />
                </FormField>
                
                <FormField 
                  label="Width (m)" 
                  htmlFor="width" 
                  tooltip={PARAMETER_EXPLANATIONS.building.width}
                >
                  <Input
                    id="width"
                    type="number"
                    name="width"
                    value={buildingParams.width}
                    onChange={handleBuildingParamChange}
                    min={5}
                    max={100}
                    step={1}
                  />
                </FormField>
                
                <FormField 
                  label="Depth (m)" 
                  htmlFor="depth" 
                  tooltip={PARAMETER_EXPLANATIONS.building.depth}
                >
                  <Input
                    id="depth"
                    type="number"
                    name="depth"
                    value={buildingParams.depth}
                    onChange={handleBuildingParamChange}
                    min={5}
                    max={100}
                    step={1}
                  />
                </FormField>
              </div>
            </FormSection>
            
            <FormSection title="Structural Properties" description="Define how your building responds to forces">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField 
                  label="Number of Floors" 
                  htmlFor="floors" 
                  tooltip={PARAMETER_EXPLANATIONS.building.floors}
                >
                  <Input
                    id="floors"
                    type="number"
                    name="floors"
                    value={buildingParams.floors}
                    onChange={handleBuildingParamChange}
                    min={1}
                    max={100}
                    step={1}
                  />
                </FormField>
                
                <FormField 
                  label="Material Type" 
                  htmlFor="materialType" 
                  tooltip={PARAMETER_EXPLANATIONS.building.materialType}
                >
                  <Select
                    id="materialType"
                    name="materialType"
                    value={buildingParams.materialType}
                    onChange={handleBuildingParamChange}
                    options={[
                      { value: 'concrete', label: 'Reinforced Concrete' },
                      { value: 'steel', label: 'Steel Frame' },
                      { value: 'wood', label: 'Wood Frame' }
                    ]}
                  />
                </FormField>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField 
                  label={`Stiffness (${buildingParams.stiffness})`} 
                  htmlFor="stiffness" 
                  tooltip={PARAMETER_EXPLANATIONS.building.stiffness}
                >
                  <Input
                    id="stiffness"
                    type="range"
                    name="stiffness"
                    value={buildingParams.stiffness}
                    onChange={handleBuildingParamChange}
                    min={1}
                    max={10}
                    step={0.1}
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>Flexible</span>
                    <span>Rigid</span>
                  </div>
                </FormField>
                
                <FormField 
                  label={`Damping Ratio (${buildingParams.dampingRatio.toFixed(2)})`} 
                  htmlFor="dampingRatio" 
                  tooltip={PARAMETER_EXPLANATIONS.building.dampingRatio}
                >
                  <Input
                    id="dampingRatio"
                    type="range"
                    name="dampingRatio"
                    value={buildingParams.dampingRatio}
                    onChange={handleBuildingParamChange}
                    min={0.01}
                    max={0.1}
                    step={0.01}
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>Low Energy Absorption</span>
                    <span>High Energy Absorption</span>
                  </div>
                </FormField>
              </div>
            </FormSection>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Material Properties</h3>
              <p className="text-yellow-700 dark:text-yellow-300">
                {buildingParams.materialType === 'concrete' && PARAMETER_EXPLANATIONS.materials.concrete}
                {buildingParams.materialType === 'steel' && PARAMETER_EXPLANATIONS.materials.steel}
                {buildingParams.materialType === 'wood' && PARAMETER_EXPLANATIONS.materials.wood}
              </p>
            </div>
          </div>
        );
        
      case 'seismic':
        return (
          <div className="space-y-6 py-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Seismic Parameters</h3>
              <p className="text-blue-700 dark:text-blue-300">
                Earthquake characteristics determine the intensity and nature of ground motion.
                The magnitude, distance, and soil conditions all affect how the seismic waves impact your building.
              </p>
            </div>
            
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Earthquake Presets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(SEISMIC_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applySeismicPreset(key as keyof typeof SEISMIC_PRESETS)}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <FormSection title="Earthquake Characteristics" description="Define the properties of the seismic event">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField 
                  label={`Magnitude (${seismicParams.magnitude.toFixed(1)})`} 
                  htmlFor="magnitude" 
                  tooltip={PARAMETER_EXPLANATIONS.seismic.magnitude}
                >
                  <Input
                    id="magnitude"
                    type="range"
                    name="magnitude"
                    value={seismicParams.magnitude}
                    onChange={handleSeismicParamChange}
                    min={4}
                    max={9}
                    step={0.1}
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>Minor</span>
                    <span>Catastrophic</span>
                  </div>
                </FormField>
                
                <FormField 
                  label={`Duration (${seismicParams.duration} seconds)`} 
                  htmlFor="duration" 
                  tooltip={PARAMETER_EXPLANATIONS.seismic.duration}
                >
                  <Input
                    id="duration"
                    type="range"
                    name="duration"
                    value={seismicParams.duration}
                    onChange={handleSeismicParamChange}
                    min={5}
                    max={120}
                    step={5}
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>Brief</span>
                    <span>Extended</span>
                  </div>
                </FormField>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField 
                  label={`Distance (${seismicParams.distance} km)`} 
                  htmlFor="distance" 
                  tooltip={PARAMETER_EXPLANATIONS.seismic.distance}
                >
                  <Input
                    id="distance"
                    type="range"
                    name="distance"
                    value={seismicParams.distance}
                    onChange={handleSeismicParamChange}
                    min={0}
                    max={100}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>Near</span>
                    <span>Far</span>
                  </div>
                </FormField>
                
                <FormField 
                  label={`Depth (${seismicParams.depth} km)`} 
                  htmlFor="depth" 
                  tooltip={PARAMETER_EXPLANATIONS.seismic.depth}
                >
                  <Input
                    id="depth"
                    type="range"
                    name="depth"
                    value={seismicParams.depth}
                    onChange={handleSeismicParamChange}
                    min={5}
                    max={50}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>Shallow</span>
                    <span>Deep</span>
                  </div>
                </FormField>
                
                <FormField 
                  label="Soil Type" 
                  htmlFor="soilType" 
                  tooltip={PARAMETER_EXPLANATIONS.seismic.soilType}
                >
                  <Select
                    id="soilType"
                    name="soilType"
                    value={seismicParams.soilType}
                    onChange={handleSeismicParamChange}
                    options={[
                      { value: 'rock', label: 'Rock (Type A)' },
                      { value: 'stiff', label: 'Stiff Soil (Type B)' },
                      { value: 'medium', label: 'Medium Soil (Type C)' },
                      { value: 'soft', label: 'Soft Soil (Type D)' },
                      { value: 'very-soft', label: 'Very Soft Soil (Type E)' }
                    ]}
                  />
                </FormField>
              </div>
            </FormSection>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Seismic Wave Types</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-yellow-700 dark:text-yellow-300">P-Waves (Primary)</h4>
                  <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                    {PARAMETER_EXPLANATIONS.seismic.pWave}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-yellow-700 dark:text-yellow-300">S-Waves (Secondary)</h4>
                  <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                    {PARAMETER_EXPLANATIONS.seismic.sWave}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'materials':
        return (
          <div className="space-y-6 py-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Structural Materials</h3>
              <p className="text-blue-700 dark:text-blue-300">
                The properties of structural materials determine how your building responds to seismic forces.
                Different materials have different strengths, ductility, and energy absorption characteristics.
              </p>
            </div>
            
            <FormSection title="Material Properties" description="Define the strength and quality of your structural materials">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField 
                  label={`Concrete Strength (${materialsParams.concreteStrength} MPa)`} 
                  htmlFor="concreteStrength"
                  tooltip="Compressive strength