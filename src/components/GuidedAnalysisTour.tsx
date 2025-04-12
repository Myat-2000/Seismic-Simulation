import React, { useState, useEffect, useRef } from 'react';
import { BuildingParams } from './BuildingParameterForm';
import { SeismicParams } from './SeismicParameterForm';
import { Button } from './ui/FormComponents';

type AnalysisStep = {
  id: number;
  title: string;
  description: string;
  elementHighlight?: {
    type: 'column' | 'beam' | 'slab' | 'foundation';
    id: number;
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
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [tourStarted, setTourStarted] = useState<boolean>(false);
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([]);

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
      <div class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">${data.title}</div>
      <div class="space-y-2">
        ${data.labels.map((label, index) => {
          const percentage = (data.values[index] / maxValue) * 100;
          return `
            <div class="flex items-center">
              <div class="w-24 text-xs text-gray-600 dark:text-gray-400">${label}</div>
              <div class="flex-1 h-5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div 
                  class="
}