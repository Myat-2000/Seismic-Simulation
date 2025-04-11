import React, { useState } from 'react';
import { BuildingParams } from './BuildingParameterForm';
import { SeismicParams } from './SeismicParameterForm';
import VisualizationControls from './VisualizationControls';
import GuidedAnalysisTour from './GuidedAnalysisTour';

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

type EnhancedSimulationControlsProps = {
  buildingParams: BuildingParams;
  seismicParams: SeismicParams;
  analysisResults: SimulationAnalysisResult;
  isSimulationComplete: boolean;
  onElementSelect: (element?: { type: 'column' | 'beam' | 'slab' | 'foundation'; id: number }) => void;
  availableElements: {
    columns: number[];
    beams: number[];
    slabs: number[];
    foundations: number[];
  };
};

export default function EnhancedSimulationControls({
  buildingParams,
  seismicParams,
  analysisResults,
  isSimulationComplete,
  onElementSelect,
  availableElements
}: EnhancedSimulationControlsProps) {
  // Visualization control states
  const [showStressColors, setShowStressColors] = useState<boolean>(true);
  const [showDeformation, setShowDeformation] = useState<boolean>(true);
  const [deformationScale, setDeformationScale] = useState<number>(1.0);
  const [selectedElement, setSelectedElement] = useState<{ type: 'column' | 'beam' | 'slab' | 'foundation'; id: number } | undefined>(undefined);
  
  // Handle element selection from visualization controls
  const handleElementSelect = (element?: { type: 'column' | 'beam' | 'slab' | 'foundation'; id: number }) => {
    setSelectedElement(element);
    onElementSelect(element);
  };
  
  return (
    <div className="space-y-4">
      <VisualizationControls
        showStressColors={showStressColors}
        setShowStressColors={setShowStressColors}
        showDeformation={showDeformation}
        setShowDeformation={setShowDeformation}
        deformationScale={deformationScale}
        setDeformationScale={setDeformationScale}
        selectedElement={selectedElement}
        setSelectedElement={handleElementSelect}
        availableElements={availableElements}
      />
      
      <GuidedAnalysisTour
        buildingParams={buildingParams}
        seismicParams={seismicParams}
        analysisResults={analysisResults}
        onElementSelect={handleElementSelect}
        isSimulationComplete={isSimulationComplete}
      />
    </div>
  );
}