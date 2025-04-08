import { useState, useEffect } from 'react';
import { BuildingParams } from './BuildingParameterForm';
import { SeismicParams } from './SeismicParameterForm';

// Extended building parameters with detailed structural properties
export type DetailedBuildingParams = BuildingParams & {
  structuralComponents?: {
    columns: {
      width: number; // in meters
      reinforcement: 'light' | 'medium' | 'heavy';
      connectionType: 'rigid' | 'semi-rigid' | 'pinned';
    };
    beams: {
      width: number; // in meters
      depth: number; // in meters
      reinforcement: 'light' | 'medium' | 'heavy';
      connectionType: 'rigid' | 'semi-rigid' | 'pinned';
    };
    slabs: {
      thickness: number; // in meters
      reinforcement: 'light' | 'medium' | 'heavy';
      type: 'one-way' | 'two-way' | 'flat';
    };
    foundation: {
      type: 'isolated' | 'strip' | 'raft' | 'pile';
      depth: number; // in meters
    };
  };
};

// Detailed component analysis results
type ComponentAnalysisResult = {
  // Stress analysis
  maxStress: number; // MPa
  yieldStress: number; // MPa
  stressRatio: number; // maxStress/yieldStress
  
  // Strain analysis
  maxStrain: number; // mm/mm
  yieldStrain: number; // mm/mm
  strainRatio: number; // maxStrain/yieldStrain
  
  // Displacement analysis
  maxDisplacement: number; // mm
  allowableDisplacement: number; // mm
  displacementRatio: number; // maxDisplacement/allowableDisplacement
  
  // Damage assessment
  damageLevel: 'None' | 'Minor' | 'Moderate' | 'Severe' | 'Critical';
  failureProbability: number; // 0-1
  remainingCapacity: number; // 0-1
  
  // Failure mode
  primaryFailureMode: string;
  secondaryFailureMode: string;
};

// Complete structural analysis results
type StructuralAnalysisResults = {
  columns: ComponentAnalysisResult[];
  beams: ComponentAnalysisResult[];
  slabs: ComponentAnalysisResult[];
  foundation: ComponentAnalysisResult;
  joints: ComponentAnalysisResult[];
  overallStructuralIntegrity: number; // 0-1
  criticalElements: {
    type: 'column' | 'beam' | 'slab' | 'foundation' | 'joint';
    id: number;
    location: string;
    damageLevel: string;
  }[];
};

type StructuralComponentAnalysisProps = {
  buildingParams: BuildingParams;
  seismicParams: SeismicParams;
  elapsedTime: number;
  selectedComponent?: {
    type: 'column' | 'beam' | 'slab' | 'foundation' | 'joint';
    id: number;
  };
};

export default function StructuralComponentAnalysis({
  buildingParams,
  seismicParams,
  elapsedTime,
  selectedComponent
}: StructuralComponentAnalysisProps) {
  const [analysisResults, setAnalysisResults] = useState<StructuralAnalysisResults | null>(null);
  const [activeTab, setActiveTab] = useState<'columns' | 'beams' | 'slabs' | 'foundation' | 'joints' | 'overview'>(
    selectedComponent ? 
      (selectedComponent.type === 'joint' ? 'joints' : `${selectedComponent.type}s` as any) : 
      'overview'
  );
  
  // Perform detailed structural analysis when parameters change
  useEffect(() => {
    // Only perform analysis if simulation has completed
    if (seismicParams.duration <= elapsedTime) {
      const results = performDetailedStructuralAnalysis(
        buildingParams,
        seismicParams,
        elapsedTime
      );
      setAnalysisResults(results);
    }
  }, [buildingParams, seismicParams, elapsedTime]);
  
  // If a component is selected, focus on that component's tab
  useEffect(() => {
    if (selectedComponent) {
      setActiveTab(selectedComponent.type === 'joint' ? 'joints' : `${selectedComponent.type}s` as any);
    }
  }, [selectedComponent]);
  
  if (!analysisResults) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <p>Waiting for simulation to complete...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'overview' ? 
              'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 
              'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('columns')}
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'columns' ? 
              'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 
              'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
          >
            Columns
          </button>
          <button
            onClick={() => setActiveTab('beams')}
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'beams' ? 
              'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 
              'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
          >
            Beams
          </button>
          <button
            onClick={() => setActiveTab('slabs')}
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'slabs' ? 
              'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 
              'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
          >
            Slabs
          </button>
          <button
            onClick={() => setActiveTab('foundation')}
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'foundation' ? 
              'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 
              'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
          >
            Foundation
          </button>
          <button
            onClick={() => setActiveTab('joints')}
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'joints' ? 
              'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 
              'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
          >
            Joints
          </button>
        </nav>
      </div>
      
      <div className="p-4">
        {activeTab === 'overview' && (
          <OverviewTab results={analysisResults} buildingParams={buildingParams} />
        )}
        
        {activeTab === 'columns' && (
          <ColumnsTab 
            columns={analysisResults.columns} 
            selectedId={selectedComponent?.type === 'column' ? selectedComponent.id : undefined} 
          />
        )}
        
        {activeTab === 'beams' && (
          <BeamsTab 
            beams={analysisResults.beams} 
            selectedId={selectedComponent?.type === 'beam' ? selectedComponent.id : undefined} 
          />
        )}
        
        {activeTab === 'slabs' && (
          <SlabsTab 
            slabs={analysisResults.slabs} 
            selectedId={selectedComponent?.type === 'slab' ? selectedComponent.id : undefined} 
          />
        )}
        
        {activeTab === 'foundation' && (
          <FoundationTab foundation={analysisResults.foundation} />
        )}
        
        {activeTab === 'joints' && (
          <JointsTab 
            joints={analysisResults.joints} 
            selectedId={selectedComponent?.type === 'joint' ? selectedComponent.id : undefined} 
          />
        )}
      </div>
    </div>
  );
}

// Overview tab component
function OverviewTab({ 
  results, 
  buildingParams 
}: { 
  results: StructuralAnalysisResults; 
  buildingParams: BuildingParams;
}) {
  // Calculate overall statistics
  const criticalCount = results.criticalElements.length;
  const totalElements = results.columns.length + results.beams.length + 
                        results.slabs.length + results.joints.length + 1; // +1 for foundation
  
  // Get integrity color
  const getIntegrityColor = (value: number) => {
    if (value > 0.8) return 'text-green-500';
    if (value > 0.6) return 'text-yellow-500';
    if (value > 0.4) return 'text-orange-500';
    return 'text-red-500';
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Structural Integrity Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <div className="text-sm text-gray-500 dark:text-gray-400">Overall Structural Integrity</div>
          <div className={`text-2xl font-bold ${getIntegrityColor(results.overallStructuralIntegrity)}`}>
            {(results.overallStructuralIntegrity * 100).toFixed(1)}%
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <div className="text-sm text-gray-500 dark:text-gray-400">Critical Elements</div>
          <div className="text-2xl font-bold text-red-500">
            {criticalCount} / {totalElements}
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <div className="text-sm text-gray-500 dark:text-gray-400">Building Material</div>
          <div className="text-2xl font-bold">
            {buildingParams.materialType.charAt(0).toUpperCase() + buildingParams.materialType.slice(1)}
          </div>
        </div>
      </div>
      
      {/* Critical elements list */}
      {criticalCount > 0 && (
        <div className="mt-4">
          <h4 className="text-md font-semibold mb-2">Critical Elements Requiring Attention</h4>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <ul className="space-y-2">
              {results.criticalElements.map((element, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <span>
                    <span className="font-medium">{element.type.charAt(0).toUpperCase() + element.type.slice(1)} {element.id}</span> 
                    <span className="text-sm"> at {element.location} - {element.damageLevel}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Component summary */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <ComponentSummaryCard 
          title="Columns" 
          count={results.columns.length}
          components={results.columns}
        />
        
        <ComponentSummaryCard 
          title="Beams" 
          count={results.beams.length}
          components={results.beams}
        />
        
        <ComponentSummaryCard 
          title="Slabs" 
          count={results.slabs.length}
          components={results.slabs}
        />
        
        <ComponentSummaryCard 
          title="Joints" 
          count={results.joints.length}
          components={results.joints}
        />
      </div>
    </div>
  );
}

// Component summary card
function ComponentSummaryCard({ 
  title, 
  count,
  components 
}: { 
  title: string; 
  count: number;
  components: ComponentAnalysisResult[];
}) {
  // Calculate damage distribution
  const damageCounts = {
    None: 0,
    Minor: 0,
    Moderate: 0,
    Severe: 0,
    Critical: 0
  };
  
  components.forEach(component => {
    damageCounts[component.damageLevel]++;
  });
  
  return (
    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
      <h4 className="font-medium text-gray-700 dark:text-gray-300">{title} ({count})</h4>
      
      <div className="mt-2 flex items-center space-x-1">
        {/* Damage distribution bar */}
        <div className="h-4 flex-grow flex rounded-full overflow-hidden">
          {damageCounts.None > 0 && (
            <div 
              className="bg-green-500" 
              style={{ width: `${(damageCounts.None / count) * 100}%` }}
              title={`None: ${damageCounts.None}`}
            />
          )}
          {damageCounts.Minor > 0 && (
            <div 
              className="bg-lime-500" 
              style={{ width: `${(damageCounts.Minor / count) * 100}%` }}
              title={`Minor: ${damageCounts.Minor}`}
            />
          )}
          {damageCounts.Moderate > 0 && (
            <div 
              className="bg-yellow-500" 
              style={{ width: `${(damageCounts.Moderate / count) * 100}%` }}
              title={`Moderate: ${damageCounts.Moderate}`}
            />
          )}
          {damageCounts.Severe > 0 && (
            <div 
              className="bg-orange-500" 
              style={{ width: `${(damageCounts.Severe / count) * 100}%` }}
              title={`Severe: ${damageCounts.Severe}`}
            />
          )}
          {damageCounts.Critical > 0 && (
            <div 
              className="bg-red-500" 
              style={{ width: `${(damageCounts.Critical / count) * 100}%` }}
              title={`Critical: ${damageCounts.Critical}`}
            />
          )}
        </div>
      </div>
      
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
        <span>Undamaged: {damageCounts.None}</span>
        <span>Critical: {damageCounts.Critical}</span>
      </div>
    </div>
  );
}

// Columns tab component
function ColumnsTab({ 
  columns, 
  selectedId 
}: { 
  columns: ComponentAnalysisResult[];
  selectedId?: number;
}) {
  const [selectedColumn, setSelectedColumn] = useState<number | null>(
    selectedId !== undefined ? selectedId : null
  );
  
  useEffect(() => {
    if (selectedId !== undefined) {
      setSelectedColumn(selectedId);
    }
  }, [selectedId]);
  
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Column Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column selection sidebar */}
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <h4 className="font-medium mb-2">Select Column</h4>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {columns.map((column, index) => {
              // Get color based on damage level
              const getDamageColor = (level: string) => {
                switch (level) {
                  case 'None': return 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800';
                  case 'Minor': return 'bg-lime-100 dark:bg-lime-900/20 border-lime-200 dark:border-lime-800';
                  case 'Moderate': return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
                  case 'Severe': return 'bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
                  case 'Critical': return 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800';
                  default: return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
                }
              };
              
              return (
                <button
                  key={index}
                  onClick={() => setSelectedColumn(index)}
                  className={`w-full text-left px-3 py-2 rounded border ${getDamageColor(column.damageLevel)} 
                    ${selectedColumn === index ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className="font-medium">Column {index + 1}</div>
                  <div className="text-xs">{column.damageLevel} Damage</div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Column details */}
        <div className="md:col-span-2">
          {selectedColumn !== null ? (
            <ColumnDetail column={columns[selectedColumn]} columnId={selectedColumn} />
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
              <p>Select a column to view detailed analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Column detail component
function ColumnDetail({ 
  column, 
  columnId 
}: { 
  column: ComponentAnalysisResult;
  columnId: number;
}) {
  // Get color based on ratio (0-1)
  const getRatioColor = (ratio: number) => {
    if (ratio < 0.5) return 'text-green-500';
    if (ratio < 0.8) return 'text-yellow-500';
    if (ratio < 1.0) return 'text-orange-500';
    return 'text-red-500';
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <h4 className="text-lg font-semibold">Column {columnId + 1}</h4>
        <div className={`px-2 py-1 rounded text-sm font-medium ${
          column.damageLevel === 'None' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
          column.damageLevel === 'Minor' ? 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-400' :
          column.damageLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
          column.damageLevel === 'Severe' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {column.damageLevel} Damage
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stress analysis */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <h5 className="font-medium mb-2">Stress Analysis</h5>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Max Stress:</span>
              <span className="font-medium">{column.maxStress.toFixed(2)} MPa</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Yield Stress:</span>
              <span className="font-medium">{column.yieldStress.toFixed(2)} MPa</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Stress Ratio:</span>
              <span className={`font-medium ${getRatioColor(column.stressRatio)}`}>
                {column.stressRatio.toFixed(2)}
              </span>
            </div>
            
            {/* Stress ratio visualization */}
            <div className="mt-1">
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${column.stressRatio >= 1.0 ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(100, column.stressRatio * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>0</span>
                <span>Yield Point</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Strain analysis */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <h5 className="font-medium mb-2">Strain Analysis</h5>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Max Strain:</span>
              <span className="font-medium">{(column.maxStrain * 1000).toFixed(2)} mm/m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Yield Strain:</span>
              <span className="font-medium">{(column.yieldStrain * 1000).toFixed(2)} mm/m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Strain Ratio:</span>
              <span className={`font-medium ${getRatioColor(column.strainRatio)}`}>
                {column.strainRatio.toFixed(2)}
              </span>
            </div>
            
            {/* Strain ratio visualization */}
            <div className="mt-1">
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${column.strainRatio >= 1.0 ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(100, column.strainRatio * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>0</span>
                <span>Yield Point</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Displacement analysis */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <h5 className="font-medium mb-2">Displacement Analysis</h5>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Max Displacement:</span>
              <span className="font-medium">{column.maxDisplacement.toFixed(2)} mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Allowable:</span>
              <span className="font-medium">{column.allowableDisplacement.toFixed(2)} mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Displacement Ratio:</span>
              <span className={`font-medium ${getRatioColor(column.displacementRatio)}`}>
                {column.displacementRatio.toFixed(2)}
              </span>
            </div>
            
            {/* Displacement ratio visualization */}
            <div className="mt-1">
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${column.displacementRatio >= 1.0 ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(100, column.displacementRatio * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>0</span>
                <span>Allowable</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Capacity analysis */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <h5 className="font-medium mb-2">Capacity Analysis</h5>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Remaining Capacity:</span>
              <span className={`font-medium ${getRatioColor(1 - column.remainingCapacity)}`}>
                {(column.remainingCapacity * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Failure Probability:</span>
              <span className={`font-medium ${getRatioColor(column.failureProbability)}`}>
                {(column.failureProbability * 100).toFixed(1)}%
              </span>
            </div>
            
            {/* Capacity visualization */}
            <div className="mt-1">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500"
                  style={{ width: `${column.remainingCapacity * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Failure modes */}