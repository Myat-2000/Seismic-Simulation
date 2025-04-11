import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { BuildingParams } from './BuildingParameterForm';
import { SeismicParams } from './SeismicParameterForm';
import { StructuralMaterialsParams } from './StructuralMaterialsForm';
import EnhancedSimulationControls from './EnhancedSimulationControls';
import ConfigurationManager from './ConfigurationManager';
import SimulationComparisonView from './SimulationComparisonView';
import { ElementInteraction, InteractionAnalysisResult } from './StructuralElementInteraction';
import { DetailedBuildingParams } from './StructuralComponentAnalysis';

// Dynamically import the Enhanced 3D visualizer to avoid server-side rendering issues
const EnhancedStructuralDeformationVisualizer = dynamic(
  () => import('./EnhancedStructuralDeformationVisualizer'),
  {
    ssr: false,
    loading: () => <div className="w-full h-96 flex items-center justify-center">Loading enhanced visualizer...</div>
  }
);

type SimulationResult = {
  id: string;
  name: string;
  buildingParams: BuildingParams;
  seismicParams: SeismicParams;
  results: {
    maxDisplacement: number;
    interStoryDrift: number;
    baseShear: number;
    damageIndex: number;
    hasCollapsed: boolean;
    criticalElements: {
      type: 'column' | 'beam' | 'slab' | 'foundation';
      id: number;
      damageLevel: 'None' | 'Minor' | 'Moderate' | 'Severe' | 'Critical';
    }[];
  };
};

type EnhancedSimulationViewProps = {
  buildingParams: BuildingParams;
  seismicParams: SeismicParams;
  materialParams: StructuralMaterialsParams;
  elementInteractions: ElementInteraction[];
  analysisResults: InteractionAnalysisResult[];
  isSimulationComplete: boolean;
  elapsedTime: number;
  onLoadConfiguration: (config: {
    buildingParams: BuildingParams;
    seismicParams: SeismicParams;
    materialParams: StructuralMaterialsParams;
  }) => void;
};

export default function EnhancedSimulationView({
  buildingParams,
  seismicParams,
  materialParams,
  elementInteractions,
  analysisResults,
  isSimulationComplete,
  elapsedTime,
  onLoadConfiguration
}: EnhancedSimulationViewProps) {
  // State for selected element
  const [selectedElement, setSelectedElement] = useState<{ type: 'column' | 'beam' | 'slab' | 'foundation'; id: number } | undefined>(undefined);
  
  // State for visualization controls
  const [showStressColors, setShowStressColors] = useState<boolean>(true);
  const [showDeformation, setShowDeformation] = useState<boolean>(true);
  const [deformationScale, setDeformationScale] = useState<number>(1.0);
  
  // State for saved simulation results
  const [savedResults, setSavedResults] = useState<SimulationResult[]>([]);
  
  // Load saved simulation results from localStorage
  useEffect(() => {
    const savedResultsJson = localStorage.getItem('seismicSimulationResults');
    if (savedResultsJson) {
      try {
        const results = JSON.parse(savedResultsJson);
        setSavedResults(results);
      } catch (e) {
        console.error('Failed to parse saved simulation results', e);
      }
    }
  }, []);
  
  // Calculate available elements for selection
  const availableElements = {
    columns: Array.from({ length: 10 }, (_, i) => i + 1), // Example: 10 columns
    beams: Array.from({ length: 15 }, (_, i) => i + 1),   // Example: 15 beams
    slabs: Array.from({ length: 6 }, (_, i) => i + 1),    // Example: 6 slabs
    foundations: Array.from({ length: 4 }, (_, i) => i + 1) // Example: 4 foundations
  };
  
  // Generate simulation analysis result from interaction analysis results
  const simulationAnalysisResult = {
    maxDisplacement: Math.max(...analysisResults.map(result => result.relativeDisplacement)) / 1000, // Convert mm to m
    interStoryDrift: Math.max(...analysisResults.map(result => result.relativeDisplacement / 30)) / 10, // Example calculation
    baseShear: Math.max(...analysisResults.map(result => result.loadDistribution?.shear || 0)),
    damageIndex: Math.max(...analysisResults.map(result => result.damageIndex)),
    criticalElements: analysisResults
      .map((result, index) => {
        const interaction = elementInteractions[index];
        if (!interaction) return null;
        
        const damageLevel = getDamageLevel(result.damageIndex);
        
        return {
          type: interaction.sourceElement.type,
          id: interaction.sourceElement.id,
          damageLevel
        };
      })
      .filter((element): element is NonNullable<typeof element> => element !== null)
      .sort((a, b) => {
        const damageOrder = { 'None': 0, 'Minor': 1, 'Moderate': 2, 'Severe': 3, 'Critical': 4 };
        return damageOrder[b.damageLevel] - damageOrder[a.damageLevel];
      })
      .slice(0, 5) // Get top 5 critical elements
  };
  
  // Helper function to determine damage level based on damage index
  function getDamageLevel(damageIndex: number): 'None' | 'Minor' | 'Moderate' | 'Severe' | 'Critical' {
    if (damageIndex < 0.2) return 'None';
    if (damageIndex < 0.4) return 'Minor';
    if (damageIndex < 0.6) return 'Moderate';
    if (damageIndex < 0.8) return 'Severe';
    return 'Critical';
  }
  
  // Handle element selection
  const handleElementSelect = (element?: { type: 'column' | 'beam' | 'slab' | 'foundation'; id: number }) => {
    setSelectedElement(element);
  };
  
  // Save current simulation result
  const saveSimulationResult = (name: string) => {
    const newResult: SimulationResult = {
      id: Date.now().toString(),
      name,
      buildingParams,
      seismicParams,
      results: {
        ...simulationAnalysisResult,
        hasCollapsed: simulationAnalysisResult.damageIndex > 0.8
      }
    };
    
    const updatedResults = [...savedResults, newResult];
    setSavedResults(updatedResults);
    localStorage.setItem('seismicSimulationResults', JSON.stringify(updatedResults));
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Main visualization area */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Enhanced Structural Visualization</h2>
        
        <div className="w-full h-96 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
          {isSimulationComplete ? (
            <EnhancedStructuralDeformationVisualizer
              buildingParams={buildingParams as DetailedBuildingParams}
              elementInteractions={elementInteractions}
              analysisResults={analysisResults}
              selectedElement={selectedElement}
              showStressColors={showStressColors}
              showDeformation={showDeformation}
              deformationScale={deformationScale}
              onElementSelect={handleElementSelect}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              Complete the simulation to view enhanced visualization
            </div>
          )}
        </div>
        
        {/* Save simulation result button (only shown when simulation is complete) */}
        {isSimulationComplete && (
          <div className="mt-4">
            <button
              onClick={() => saveSimulationResult(`Simulation ${savedResults.length + 1}`)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Save Simulation Result
            </button>
          </div>
        )}
      </div>
      
      {/* Controls and analysis panel */}
      <div className="space-y-4">
        <EnhancedSimulationControls
          buildingParams={buildingParams}
          seismicParams={seismicParams}
          analysisResults={simulationAnalysisResult}
          isSimulationComplete={isSimulationComplete}
          onElementSelect={handleElementSelect}
          availableElements={availableElements}
        />
        
        <ConfigurationManager
          currentBuildingParams={buildingParams}
          currentSeismicParams={seismicParams}
          currentMaterialParams={materialParams}
          onLoadConfiguration={onLoadConfiguration}
        />
        
        {savedResults.length > 0 && (
          <SimulationComparisonView savedResults={savedResults} />
        )}
      </div>
    </div>
  );
}