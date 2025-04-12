import React, { useState, useEffect, useRef } from 'react';
import { BuildingParams } from './BuildingParameterForm';
import { SeismicParams } from './SeismicParameterForm';
import { Button } from './ui/FormComponents';
import Image from 'next/image';

// Add CSS for tour animations
const tourAnimations = `
  @keyframes highlight-pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }
  
  @keyframes overlay-fade {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

type AnalysisStep = {
  id: string;
  title: string;
  description: string;
  elementHighlight?: {
    type: 'column' | 'beam' | 'slab' | 'foundation';
    id: number;
    highlightColor?: string;
    pulseAnimation?: boolean;
  };
  timePoint?: number;
  overlay?: {
    position: 'top' | 'right' | 'bottom' | 'left';
    content: string;
    imageUrl?: string;
    animationDuration?: number;
    showGraph?: boolean;
  };
  interactionPoints?: Array<{
    x: number;
    y: number;
    label: string;
    description: string;
  }>;
  educationalContent?: {
    title: string;
    content: string;
    diagrams?: string[];
    keyPoints?: string[];
  };
  recommendation?: string;
  visualizationType?: 'bar-chart' | 'comparison' | 'stress-map' | 'timeline';
  visualizationData?: any;
};

type SimulationAnalysisResult = {
  maxDisplacement: number;
  interStoryDrift: number;
  baseShear: number;
  damageIndex: number;
  criticalElements: {
    type: 'column' | 'beam' | 'slab' | 'foundation';
    id: number;
    damageLevel: 'None' | 'Minor' | 'Moderate' | 'Severe' | 'Critical';
  }[];
};

type GuidedAnalysisTourProps = {
  buildingParams: BuildingParams;
  seismicParams: SeismicParams;
  analysisResults: SimulationAnalysisResult;
  onElementSelect: (element?: { type: 'column' | 'beam' | 'slab' | 'foundation'; id: number }) => void;
  isSimulationComplete: boolean;
};

export default function GuidedAnalysisTour({
  buildingParams,
  seismicParams,
  analysisResults,
  onElementSelect,
  isSimulationComplete
}: GuidedAnalysisTourProps) {
  // Add style tag for animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = tourAnimations;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [tourStarted, setTourStarted] = useState<boolean>(false);
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [interactionPoint, setInteractionPoint] = useState<number | null>(null);
  const [educationalExpanded, setEducationalExpanded] = useState(false);

  // Generate analysis steps based on simulation results
  useEffect(() => {
    if (!isSimulationComplete || !analysisResults) return;

    const steps: AnalysisStep[] = [
      {
        id: 1,
        title: 'Overview',
        description: `This ${buildingParams.floors}-story ${buildingParams.materialType} building was subjected to a magnitude ${seismicParams.magnitude.toFixed(1)} earthquake. The overall structural response shows a maximum displacement of ${analysisResults.maxDisplacement.toFixed(2)} meters and an inter-story drift of ${analysisResults.interStoryDrift.toFixed(2)}%.`,
      },
      {
        id: 2,
        title: 'Displacement Analysis',
        description: `The maximum displacement observed is ${analysisResults.maxDisplacement.toFixed(2)} meters. ${getDisplacementAnalysis(analysisResults.maxDisplacement, buildingParams.height)}`,
        recommendation: getDisplacementRecommendation(analysisResults.maxDisplacement, buildingParams.height)
      }
    ];

    // Add drift analysis step
    steps.push({
      id: 3,
      title: 'Inter-story Drift',
      description: `The maximum inter-story drift ratio is ${analysisResults.interStoryDrift.toFixed(2)}%. ${getDriftAnalysis(analysisResults.interStoryDrift)}`,
      recommendation: getDriftRecommendation(analysisResults.interStoryDrift, buildingParams.materialType)
    });

    // Add critical elements analysis
    if (analysisResults.criticalElements && analysisResults.criticalElements.length > 0) {
      // Sort critical elements by damage level severity
      const sortedElements = [...analysisResults.criticalElements].sort((a, b) => {
        const damageOrder = { 'None': 0, 'Minor': 1, 'Moderate': 2, 'Severe': 3, 'Critical': 4 };
        return damageOrder[b.damageLevel] - damageOrder[a.damageLevel];
      });

      // Add the most critical element
      const mostCritical = sortedElements[0];
      steps.push({
        id: 4,
        title: 'Critical Element',
        description: `The most critical structural element is ${mostCritical.type} ${mostCritical.id} with ${mostCritical.damageLevel.toLowerCase()} damage. This element requires immediate attention as it significantly affects the overall structural integrity.`,
        elementHighlight: {
          type: mostCritical.type,
          id: mostCritical.id
        },
        recommendation: getCriticalElementRecommendation(mostCritical.damageLevel, mostCritical.type)
      });

      // Add overall structural integrity step
      steps.push({
        id: 5,
        title: 'Structural Integrity',
        description: `The overall structural integrity index is ${(analysisResults.damageIndex * 100).toFixed(1)}%. ${getIntegrityAnalysis(analysisResults.damageIndex)}`,
        recommendation: getIntegrityRecommendation(analysisResults.damageIndex, buildingParams.materialType)
      });
    }

    // Add conclusion step
    steps.push({
      id: steps.length + 1,
      title: 'Conclusion',
      description: `Based on the analysis, this ${buildingParams.materialType} structure ${getConclusionSummary(analysisResults.damageIndex)}`,
      recommendation: 'Consider running additional simulations with modified structural parameters to improve performance.'
    });

    setAnalysisSteps(steps);
  }, [isSimulationComplete, analysisResults, buildingParams, seismicParams]);

  // Start the guided tour
  const startTour = () => {
    setTourStarted(true);
    setCurrentStep(0);
    // Highlight the first element if available
    if (analysisSteps[0]?.elementHighlight) {
      onElementSelect(analysisSteps[0].elementHighlight);
    } else {
      onElementSelect(undefined); // Clear any previous selection
    }
  };

  // Navigate to the next step
  const nextStep = () => {
    if (currentStep < analysisSteps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      // Update element highlight if specified for this step
      if (analysisSteps[newStep]?.elementHighlight) {
        onElementSelect(analysisSteps[newStep].elementHighlight);
      }
    }
  };

  // Navigate to the previous step
  const prevStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      // Update element highlight if specified for this step
      if (analysisSteps[newStep]?.elementHighlight) {
        onElementSelect(analysisSteps[newStep].elementHighlight);
      }
    }
  };

  // End the tour
  const endTour = () => {
    setTourStarted(false);
    onElementSelect(undefined); // Clear element selection
  };

  // Reference for the chart container
  const chartRef = useRef<HTMLDivElement>(null);

  // Function to render a simple bar chart using DOM elements
  const renderBarChart = (data: { labels: string[], values: number[], title: string, description: string }) => {
    if (!chartRef.current) return;
    
    const maxValue = Math.max(...data.values);
    const chartHtml = `
      <div class="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
        <h4 class="text-lg font-semibold mb-1">${data.title}</h4>
        <p class="text-sm text-gray-500 dark:text-gray-400">${data.description}</p>
      </div>
      <div class="space-y-3">
        ${data.labels.map((label, index) => {
          const percentage = (data.values[index] / maxValue) * 100;
          const barColor = percentage > 75 ? 'bg-red-500' :
                          percentage > 50 ? 'bg-yellow-500' :
                          percentage > 25 ? 'bg-green-500' : 'bg-blue-500';
          return `
            <div class="flex items-center gap-3">
              <div class="w-28 text-sm font-medium text-gray-700 dark:text-gray-300">${label}</div>
              <div class="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden shadow-inner">
                <div 
                  class="h-full ${barColor} transition-all duration-700 ease-out transform origin-left"
                  style="width: ${percentage}%; animation: slide-right 1s ease-out;"
                ></div>
              </div>
              <div class="w-20 text-sm font-medium text-right text-gray-700 dark:text-gray-300">
                ${data.values[index].toFixed(2)}
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <style>
        @keyframes slide-right {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      </style>
    `;
    
    chartRef.current.innerHTML = chartHtml;
  };

  // Function to render stress map visualization
  const renderStressMap = (data: { elements: Array<{ id: number, stress: number, type: string }> }) => {
    if (!chartRef.current) return;
    
    const maxStress = Math.max(...data.elements.map(el => el.stress));
    const chartHtml = `
      <div class="mb-4">
        <h4 class="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Structural Stress Distribution</h4>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          ${data.elements.map(element => {
            const percentage = (element.stress / maxStress) * 100;
            const color = percentage > 75 ? '#ef4444' :
                         percentage > 50 ? '#eab308' :
                         percentage > 25 ? '#22c55e' : '#3b82f6';
            return `
              <div class="p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                <div class="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
                  ${element.type} ${element.id}
                </div>
                <div class="relative h-2 bg-gray-100 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    class="absolute top-0 left-0 h-full transition-all duration-700 ease-out"
                    style="width: ${percentage}%; background-color: ${color};"
                  ></div>
                </div>
                <div class="mt-1 text-xs text-right text-gray-500 dark:text-gray-400">
                  ${element.stress.toFixed(2)} MPa
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
    
    chartRef.current.innerHTML = chartHtml;
  };

  if (!isSimulationComplete) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <h3 className="font-bold mb-3 text-gray-900 dark:text-gray-100">Guided Analysis Tour</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          Complete the simulation to access the guided analysis tour.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <h3 className="font-bold mb-3 text-gray-900 dark:text-gray-100">Guided Analysis Tour</h3>
      
      {!tourStarted ? (
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Start a guided tour to understand the structural analysis results.
          </p>
          <Button
            onClick={startTour}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors"
          >
            Start Tour
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Step content */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <h4 className="font-medium text-lg mb-2 text-gray-900 dark:text-gray-100">
              {analysisSteps[currentStep]?.title}
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {analysisSteps[currentStep]?.description}
            </p>
            
            {/* Recommendation section */}
            {analysisSteps[currentStep]?.recommendation && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <h5 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                  Recommendation
                </h5>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {analysisSteps[currentStep].recommendation}
                </p>
              </div>
            )}

            {/* Educational content */}
            {analysisSteps[currentStep]?.educationalContent && (
              <div className="mt-4">
                <button
                  onClick={() => setEducationalExpanded(!educationalExpanded)}
                  className="flex items-center justify-between w-full p-3 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {analysisSteps[currentStep].educationalContent.title}
                  </span>
                  <svg
                    className={`w-5 h-5 transform transition-transform ${educationalExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {educationalExpanded && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {analysisSteps[currentStep].educationalContent.content}
                    </p>
                    {analysisSteps[currentStep].educationalContent.keyPoints && (
                      <ul className="mt-2 space-y-1">
                        {analysisSteps[currentStep].educationalContent.keyPoints.map((point, index) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                            <span className="mr-2">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Visualization area */}
            {analysisSteps[currentStep]?.visualizationType && (
              <div ref={chartRef} className="mt-4 p-3 bg-white dark:bg-gray-700 rounded-lg shadow-inner">
                {/* Chart will be rendered here by renderBarChart function */}
              </div>
            )}
          </div>

          {/* Navigation controls */}
          <div className="flex items-center justify-between gap-2">
            <Button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </Button>
            
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Step {currentStep + 1} of {analysisSteps.length}
            </span>
            
            {currentStep < analysisSteps.length - 1 ? (
              <Button
                onClick={nextStep}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={endTour}
                className="px-4 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                Finish
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Helper functions for analysis text
  function getDisplacementAnalysis(displacement: number, buildingHeight: number): string {
    const displacementRatio = displacement / buildingHeight * 100;
    if (displacementRatio < 0.5) {
      return 'This is within acceptable limits for most building codes.';
    } else if (displacementRatio < 1.5) {
      return 'This is moderate displacement that may cause non-structural damage.';
    } else {
      return 'This is significant displacement that may compromise structural integrity.';
    }
  }

  function getDisplacementRecommendation(displacement: number, buildingHeight: number): string {
    const displacementRatio = displacement / buildingHeight * 100;
    if (displacementRatio < 0.5) {
      return 'No immediate action required. Regular maintenance is sufficient.';
    } else if (displacementRatio < 1.5) {
      return 'Consider adding lateral bracing or increasing column stiffness in future designs.';
    } else {
      return 'Immediate structural reinforcement is recommended. Consider adding shear walls or bracing systems.';
    }
  }

  function getDriftAnalysis(drift: number): string {
    if (drift < 0.5) {
      return 'This is within elastic limits and indicates good structural performance.';
    } else if (drift < 1.5) {
      return 'This indicates moderate inelastic behavior but is generally acceptable for most structures.';
    } else if (drift < 2.5) {
      return 'This indicates significant inelastic behavior and potential for structural damage.';
    } else {
      return 'This indicates severe drift that may lead to partial or complete structural failure.';
    }
  }

  function getDriftRecommendation(drift: number, materialType: string): string {
    if (drift < 0.5) {
      return 'Current design is performing well. No changes needed.';
    } else if (drift < 1.5) {
      return `Consider increasing the stiffness of ${materialType === 'steel' ? 'moment connections' : 'shear walls'} to reduce drift.`;
    } else if (drift < 2.5) {
      return `Significant structural modifications recommended. Add ${materialType === 'steel' ? 'bracing systems' : 'additional shear walls'} to critical areas.`;
    } else {
      return 'Complete redesign may be necessary with focus on lateral force resisting systems.';
    }
  }

  function getCriticalElementRecommendation(damageLevel: string, elementType: string): string {
    switch (damageLevel) {
      case 'Minor':
        return `Inspect ${elementType} for hairline cracks or minor deformation. No immediate action required.`;
      case 'Moderate':
        return `Reinforce the ${elementType} with additional ${elementType === 'column' || elementType === 'beam' ? 'steel jacketing' : 'reinforcement'}.`;
      case 'Severe':
        return `Replace or significantly strengthen the ${elementType}. Consider redesigning this portion of the structure.`;
      case 'Critical':
        return `Immediate evacuation and emergency shoring required. Complete replacement of the ${elementType} is necessary.`;
      default:
        return 'Regular inspection and maintenance recommended.';
    }
  }

  function getIntegrityAnalysis(damageIndex: number): string {
    if (damageIndex < 0.2) {
      return 'The structure has maintained excellent integrity with minimal damage.';
    } else if (damageIndex < 0.4) {
      return 'The structure has maintained good integrity with some minor damage.';
    } else if (damageIndex < 0.6) {
      return 'The structure has moderate damage but maintains basic integrity.';
    } else if (damageIndex < 0.8) {
      return 'The structure has significant damage with compromised integrity.';
    } else {
      return 'The structure has severe damage with critical integrity concerns.';
    }
  }

  function getIntegrityRecommendation(damageIndex: number, materialType: string): string {
    if (damageIndex < 0.2) {
      return 'No structural modifications needed. Regular maintenance is sufficient.';
    } else if (damageIndex < 0.4) {
      return 'Minor repairs to damaged elements recommended. Consider reinforcing critical connections.';
    } else if (damageIndex < 0.6) {
      return `Moderate structural repairs needed. Consider adding ${materialType === 'concrete' ? 'shear walls' : materialType === 'steel' ? 'bracing' : 'reinforced connections'}.`;
    } else if (damageIndex < 0.8) {
      return 'Major structural rehabilitation required. Consider partial reconstruction of damaged areas.';
    } else {
      return 'Complete structural redesign and reconstruction recommended.';
    }
  }

  function getConclusionSummary(damageIndex: number): string {
    if (damageIndex < 0.2) {
      return 'performed well under the seismic load with minimal damage.';
    } else if (damageIndex < 0.4) {
      return 'sustained minor damage but maintained structural integrity.';
    } else if (damageIndex < 0.6) {
      return 'experienced moderate damage requiring attention to critical elements.';
    } else if (damageIndex < 0.8) {
      return 'sustained significant damage with compromised structural integrity.';
    } else {
      return 'experienced severe damage and may not be safe for occupancy without major repairs.';
    }
  }

  if (!isSimulationComplete) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <h3 className="font-bold mb-3 text-gray-900 dark:text-gray-100">Guided Analysis Tour</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          Complete the simulation to access the guided analysis tour.
        </p>
      </div>
    );
  }

  // Reference for the chart container
  const chartRef = useRef<HTMLDivElement>(null);

  // Function to render a simple bar chart using DOM elements
  const renderBarChart = (data: { labels: string[], values: number[], title: string, description: string }) => {
    if (!chartRef.current) return;
    
    const maxValue = Math.max(...data.values);
    const chartHtml = `
      <div class="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
        <h4 class="text-lg font-semibold mb-1">${data.title}</h4>
        <p class="text-sm text-gray-500 dark:text-gray-400">${data.description}</p>
      </div>
      <div class="space-y-3">
        ${data.labels.map((label, index) => {
          const percentage = (data.values[index] / maxValue) * 100;
          const barColor = percentage > 75 ? 'bg-red-500' :
                          percentage > 50 ? 'bg-yellow-500' :
                          percentage > 25 ? 'bg-green-500' : 'bg-blue-500';
          return `
            <div class="flex items-center gap-3">
              <div class="w-28 text-sm font-medium text-gray-700 dark:text-gray-300">${label}</div>
              <div class="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden shadow-inner">
                <div 
                  class="h-full ${barColor} transition-all duration-700 ease-out transform origin-left"
                  style="width: ${percentage}%; animation: slide-right 1s ease-out;"
                ></div>
              </div>
              <div class="w-20 text-sm font-medium text-right text-gray-700 dark:text-gray-300">
                ${data.values[index].toFixed(2)}
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <style>
        @keyframes slide-right {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      </style>
    `;
    
    chartRef.current.innerHTML = chartHtml;
  };

  // Function to render stress map visualization
  const renderStressMap = (data: { elements: Array<{ id: number, stress: number, type: string }> }) => {
    if (!chartRef.current) return;
    
    const maxStress = Math.max(...data.elements.map(el => el.stress));
    const chartHtml = `
      <div class="mb-4">
        <h4 class="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Structural Stress Distribution</h4>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          ${data.elements.map(element => {
            const percentage = (element.stress / maxStress) * 100;
            const color = percentage > 75 ? '#ef4444' :
                         percentage > 50 ? '#eab308' :
                         percentage > 25 ? '#22c55e' : '#3b82f6';
            return `
              <div class="p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                <div class="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
                  ${element.type} ${element.id}
                </div>
                <div class="relative h-2 bg-gray-100 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    class="absolute top-0 left-0 h-full transition-all duration-700 ease-out"
                    style="width: ${percentage}%; background-color: ${color};"
                  ></div>
                </div>
                <div class="mt-1 text-xs text-right text-gray-500 dark:text-gray-400">
                  ${element.stress.toFixed(2)} MPa
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
     `;
}