import React, { useState, useEffect, useRef } from 'react';
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

// Define the wizard steps with enhanced descriptions and educational content
type WizardStep = {
  id: string;
  title: string;
  description: string;
  educationalContent?: {
    title: string;
    content: string;
    imageUrl?: string;
  }[];
  tips?: string[];
};

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Seismic Simulation',
    description: 'This wizard will guide you through setting up a seismic simulation. You\'ll configure building parameters, seismic conditions, and structural materials.',
    educationalContent: [
      {
        title: 'Understanding Seismic Simulation',
        content: 'Seismic simulation helps engineers and architects understand how buildings respond to earthquakes. By modeling the complex interactions between seismic waves and structures, we can design safer buildings and predict potential damage patterns.',
        imageUrl: '/earthquake.svg'
      },
      {
        title: 'How This Wizard Works',
        content: 'This step-by-step guide will help you set up a comprehensive simulation by configuring your building parameters, defining earthquake characteristics, and specifying structural materials. Each step includes educational information and real-time previews.'
      }
    ],
    tips: [
      'Take your time to explore the educational content at each step',
      'Use the preset configurations if you\'re unsure about specific parameters',
      'The real-time preview will update as you adjust parameters'
    ]
  },
  {
    id: 'building',
    title: 'Building Configuration',
    description: 'Define the physical characteristics of your building including dimensions, number of floors, and material type.',
    educationalContent: [
      {
        title: 'Building Height and Seismic Response',
        content: 'Taller buildings typically have longer natural periods of vibration. During an earthquake, if the seismic waves match this natural period, resonance can occur, amplifying the building\'s motion. This is why skyscrapers sway more during earthquakes than shorter buildings.'
      },
      {
        title: 'Structural Stiffness',
        content: 'Stiffness measures a building\'s resistance to deformation. Stiffer buildings experience less displacement but may be subjected to higher forces during an earthquake. More flexible buildings may sway more but can dissipate energy better.'
      }
    ],
    tips: [
      'Consider the relationship between height and natural period',
      'Balance stiffness with flexibility for optimal seismic performance',
      'Material choice significantly affects how a building responds to earthquakes'
    ]
  },
  {
    id: 'seismic',
    title: 'Seismic Parameters',
    description: 'Configure the earthquake characteristics including magnitude, duration, and distance from the epicenter.',
    educationalContent: [
      {
        title: 'Earthquake Magnitude',
        content: 'The Richter scale is logarithmic, meaning each whole number increase represents about 32 times more energy release. A magnitude 7.0 earthquake releases 32 times more energy than a 6.0, and about 1,000 times more than a 5.0.'
      },
      {
        title: 'Soil Conditions',
        content: 'Soil type significantly affects ground motion. Soft soils amplify seismic waves, potentially causing more damage than rock sites. This phenomenon, called site amplification, was responsible for much of the damage in Mexico City\'s 1985 earthquake, where soft lake bed sediments amplified distant seismic waves.'
      }
    ],
    tips: [
      'Distance from epicenter greatly affects the intensity of shaking',
      'Duration of strong shaking is often more critical than peak acceleration',
      'Consider how soil conditions at your site might amplify seismic waves'
    ]
  },
  {
    id: 'materials',
    title: 'Structural Materials',
    description: 'Specify the materials used in your building structure and their properties.',
    educationalContent: [
      {
        title: 'Material Ductility',
        content: 'Ductility is a material\'s ability to deform without breaking. In seismic design, ductile materials like properly detailed steel can absorb energy through deformation, making them excellent choices for earthquake-resistant structures.'
      },
      {
        title: 'Reinforced Concrete',
        content: 'Reinforced concrete combines the compressive strength of concrete with the tensile strength of steel. The arrangement and amount of reinforcement significantly affect how concrete structures perform during earthquakes.'
      }
    ],
    tips: [
      'Steel structures typically offer better ductility than concrete',
      'Wood frame buildings are lightweight and flexible, reducing seismic forces',
      'Material strength should be balanced with ductility for optimal performance'
    ]
  },
  {
    id: 'review',
    title: 'Review & Simulate',
    description: 'Review your configuration and start the simulation.',
    educationalContent: [
      {
        title: 'What Happens During Simulation',
        content: 'The simulation will model how seismic waves propagate through the ground and interact with your building. It calculates forces, displacements, and stresses throughout the structure over time, identifying potential failure points and overall performance.'
      },
      {
        title: 'Interpreting Results',
        content: 'After simulation, you\'ll see detailed results including maximum displacements, inter-story drift ratios, and component damage assessments. These metrics help evaluate whether the building would remain safe during the specified earthquake.'
      }
    ],
    tips: [
      'Review all parameters carefully before starting the simulation',
      'Consider running multiple simulations with different parameters for comparison',
      'Pay special attention to critical structural elements identified in the results'
    ]
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

type EnhancedGuidedSimulationWizardProps = {
  onComplete: (params: {
    buildingParams: BuildingParams;
    seismicParams: SeismicParams;
    materialsParams: StructuralMaterialsParams;
  }) => void;
  initialBuildingParams?: Partial<BuildingParams>;
  initialSeismicParams?: Partial<SeismicParams>;
  initialMaterialsParams?: Partial<StructuralMaterialsParams>;
};

export default function EnhancedGuidedSimulationWizard({
  onComplete,
  initialBuildingParams = {},
  initialSeismicParams = {},
  initialMaterialsParams = {}
}: EnhancedGuidedSimulationWizardProps) {
  // Current step in the wizard
  const [currentStep, setCurrentStep] = useState<string>('welcome');
  
  // State for real-time preview
  const [showPreview, setShowPreview] = useState<boolean>(true);
  
  // State for educational content
  const [showEducationalContent, setShowEducationalContent] = useState<boolean>(true);
  
  // State for contextual help
  const [activeHelpTopic, setActiveHelpTopic] = useState<string | null>(null);
  
  // Animation state
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  
  // Reference to the wizard content for smooth transitions
  const wizardContentRef = useRef<HTMLDivElement>(null);
  
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
  const currentStepData = WIZARD_STEPS[currentStepIndex];
  
  // Navigate to next step with enhanced animation
  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < WIZARD_STEPS.length) {
      // Add a more sophisticated transition effect
      setIsAnimating(true);
      if (wizardContentRef.current) {
        wizardContentRef.current.classList.add('opacity-0', 'translate-x-10');
        setTimeout(() => {
          setCurrentStep(WIZARD_STEPS[nextIndex].id);
          setTimeout(() => {
            if (wizardContentRef.current) {
              wizardContentRef.current.classList.remove('opacity-0', 'translate-x-10');
              wizardContentRef.current.classList.add('translate-x-0', 'opacity-100');
              setTimeout(() => {
                setIsAnimating(false);
              }, 300);
            }
          }, 50);
        }, 300);
      } else {
        setCurrentStep(WIZARD_STEPS[nextIndex].id);
        setIsAnimating(false);
      }
    }
  };
  
  // Navigate to previous step with enhanced animation
  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      // Add a more sophisticated transition effect
      setIsAnimating(true);
      if (wizardContentRef.current) {
        wizardContentRef.current.classList.add('opacity-0', '-translate-x-10');
        setTimeout(() => {
          setCurrentStep(WIZARD_STEPS[prevIndex].id);
          setTimeout(() => {
            if (wizardContentRef.current) {
              wizardContentRef.current.classList.remove('opacity-0', '-translate-x-10');
              wizardContentRef.current.classList.add('translate-x-0', 'opacity-100');
              setTimeout(() => {
                setIsAnimating(false);
              }, 300);
            }
          }, 50);
        }, 300);
      } else {
        setCurrentStep(WIZARD_STEPS[prevIndex].id);
        setIsAnimating(false);
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
  
  // Generate a enhanced preview of the current configuration
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
          ],
          visualizationData: {
            height: buildingParams.height,
            width: buildingParams.width,
            depth: buildingParams.depth,
            floors: buildingParams.floors,
            materialType: buildingParams.materialType
          }
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
          ],
          visualizationData: {
            magnitude: seismicParams.magnitude,
            duration: seismicParams.duration,
            distance: seismicParams.distance,
            depth: seismicParams.depth,
            soilType: seismicParams.soilType
          }
        };
      case 'materials':
        return {
          title: 'Materials Preview',
          description: `${buildingParams.materialType.charAt(0).toUpperCase() + buildingParams.materialType.slice(1)} structure with detailed properties`,
          details: [
            buildingParams.materialType === 'concrete' ? `Concrete Strength: ${materialsParams.concreteStrength}MPa` : '',
            buildingParams.materialType === 'steel' ? `Steel Yield Strength: ${materialsParams.steelYieldStrength}MPa` : '',
            buildingParams.materialType === 'wood' ? `Wood Grade: ${materialsParams.woodGrade}` : ''
          ].filter(Boolean),
          visualizationData: {
            materialType: buildingParams.materialType,
            concreteStrength: materialsParams.concreteStrength,
            steelYieldStrength: materialsParams.steelYieldStrength,
            woodGrade: materialsParams.woodGrade
          }
        };
      case 'review':
        return {
          title: 'Complete Simulation Preview',
          description: `${buildingParams.floors}-story ${buildingParams.materialType} building under M${seismicParams.magnitude.toFixed(1)} earthquake`,
          details: [
            `Building: ${buildingParams.height}m tall, ${buildingParams.width}m × ${buildingParams.depth}m footprint`,
            `Earthquake: ${seismicParams.duration}s duration, ${seismicParams.distance}km from epicenter`,
            `Material: ${buildingParams.materialType === 'concrete' ? `Concrete (${materialsParams.concreteStrength}MPa)` : 
                       buildingParams.materialType === 'steel' ? `Steel (${materialsParams.steelYieldStrength}MPa)` : 
                       `Wood (${materialsParams.woodGrade} grade)`}`
          ],
          visualizationData: {
            building: buildingParams,
            seismic: seismicParams,
            materials: materialsParams
          }
        };
      default:
        return {
          title: 'Simulation Preview',
          description: 'Complete the setup to run your simulation',
          details: [],
          visualizationData: null
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

  // Show contextual help for a specific parameter
  const showHelp = (topic: string) => {
    setActiveHelpTopic(activeHelpTopic === topic ? null : topic);
  };

  // Render the current step content with enhanced educational features
  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="text-5xl mb-4">🏢</div>
              <h2 className="text-2xl font-bold mb-2">Welcome to the Enhanced Seismic Simulation Wizard</h2>
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
            
            {showEducationalContent && currentStepData.educationalContent && (
              <div className="space-y-4 mt-6">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Educational Content</h3>
                {currentStepData.educationalContent.map((content, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold mb-2 text-gray-800 dark:text-white">{content.title}</h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">{content.content}</p>
                    {content.imageUrl && (
                      <div className="mt-2 bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600 flex justify-center">
                        <img src={content.imageUrl} alt={content.title} className="max-h-40" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {currentStepData.tips && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">Pro Tips:</h3>
                <ul className="list-disc list-inside space-y-1 text-green-700 dark:text-green-300">
                  {currentStepData.tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
        
      case 'building':
        return (
          <div className="space-y-6 py-4">
            {showEducationalContent && currentStepData.educationalContent && (
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Building Configuration</h3>
                  <button 
                    onClick={() => setShowEducationalContent(!showEducationalContent)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {showEducationalContent ? 'Hide Educational Content' : 'Show Educational Content'}
                  </button>
                </div>
                <div className="space-y-4">
                  {currentStepData.educationalContent.map((content, index) => (
                    <div key={index}>
                      <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-1">{content.title}</h4>
                      <p className="text-blue-700 dark:text-blue-300 text-sm">{content.content}</p>
                      {content.imageUrl && (
                        <div className="mt-