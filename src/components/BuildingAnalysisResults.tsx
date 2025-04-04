import { BuildingParams } from './BuildingParameterForm';
import { SeismicParams } from './SeismicParameterForm';
import { useEffect, useState } from 'react';

type BuildingAnalysisResultsProps = {
  buildingParams: BuildingParams;
  seismicParams: SeismicParams;
  elapsedTime: number;
};

// Detailed damage assessment by component
type ComponentDamage = {
  structural: {
    columns: { value: number; status: string };
    beams: { value: number; status: string };
    slabs: { value: number; status: string };
    foundation: { value: number; status: string };
  };
  nonStructural: {
    facades: { value: number; status: string };
    interiorWalls: { value: number; status: string };
    utilities: { value: number; status: string };
  };
};

// Calculate if a building has collapsed based on damage values
const hasBuildingCollapsed = (
  magnitude: number,
  stiffness: number,
  dampingRatio: number,
  materialType: string,
  elapsedTime: number
) => {
  // Material vulnerability factor
  const materialFactor = materialType === 'concrete' ? 0.7 : 
                         materialType === 'steel' ? 0.8 : 1.3;
  
  // Structural integrity factor
  const structuralFactor = (10 - stiffness) / 10 * (1 / (dampingRatio * 15));
  
  // Calculate collapse risk (0-1)
  const collapseRisk = Math.min(1.0, (magnitude * 0.15 - 0.6) * materialFactor * structuralFactor);
  
  // Determine if building has collapsed based on risk and elapsed time
  // Buildings with high risk collapse sooner in the simulation
  const collapseThreshold = collapseRisk > 0 ? 4 + (1 - collapseRisk) * 15 : Infinity;
  
  return collapseRisk > 0.5 && elapsedTime > collapseThreshold;
};

export default function BuildingAnalysisResults({
  buildingParams,
  seismicParams,
  elapsedTime
}: BuildingAnalysisResultsProps) {
  const {
    height,
    width,
    depth,
    floors,
    stiffness,
    dampingRatio,
    materialType
  } = buildingParams;
  
  const { magnitude, depth: seismicDepth, waveVelocity } = seismicParams;
  
  const [results, setResults] = useState({
    maxDisplacement: 0,
    interStoryDrift: 0,
    naturalPeriod: 0,
    structuralResponseFactor: 0,
    damageLevel: 'None',
    damageColor: 'green',
    safetyStatus: 'Safe',
    recommendedActions: [] as string[],
    componentDamage: {
      structural: {
        columns: { value: 0, status: 'Undamaged' },
        beams: { value: 0, status: 'Undamaged' },
        slabs: { value: 0, status: 'Undamaged' },
        foundation: { value: 0, status: 'Undamaged' },
      },
      nonStructural: {
        facades: { value: 0, status: 'Undamaged' },
        interiorWalls: { value: 0, status: 'Undamaged' },
        utilities: { value: 0, status: 'Undamaged' },
      }
    } as ComponentDamage,
    hasCollapsed: false,
    collapseTime: 0
  });
  
  useEffect(() => {
    // Check if building has collapsed
    const hasCollapsed = hasBuildingCollapsed(
      magnitude, 
      stiffness, 
      dampingRatio, 
      materialType, 
      elapsedTime
    );
    
    // Record collapse time if building just collapsed
    const collapseTime = hasCollapsed && !results.hasCollapsed ? elapsedTime : results.collapseTime;
    
    // Calculate natural period (seconds) - simplified equation
    const naturalPeriod = 0.1 * floors;
    
    // Maximum displacement at top of building (m) - enhanced for visualization focus
    const maxDisplacement = calculateMaxDisplacement(
      height,
      magnitude,
      stiffness,
      dampingRatio,
      materialType
    );
    
    // Inter-story drift ratio (%) - increases dramatically during collapse
    const interStoryDrift = hasCollapsed 
      ? Math.min(20, (maxDisplacement / height) * 100 * (1 + (elapsedTime - collapseTime) / 2))
      : (maxDisplacement / height) * 100;
    
    // Structural response factor
    const structuralResponseFactor = calculateResponseFactor(
      magnitude,
      stiffness,
      dampingRatio,
      materialType
    );
    
    // Determine damage level
    const damage = hasCollapsed 
      ? { level: 'Complete Collapse', color: 'red' }
      : determineDamageLevel(
          interStoryDrift,
          structuralResponseFactor,
          materialType
        );
    
    // Component damage assessment - exaggerate during collapse
    const componentDamage = hasCollapsed 
      ? generateCollapseComponentDamage(elapsedTime, collapseTime)
      : assessComponentDamage(
          magnitude,
          interStoryDrift,
          structuralResponseFactor,
          height,
          floors,
          stiffness,
          dampingRatio,
          materialType
        );
    
    // Safety assessment
    const safetyStatus = hasCollapsed 
      ? 'BUILDING COLLAPSE - EVACUATION REQUIRED'
      : assessSafety(damage.level, interStoryDrift, componentDamage);
    
    // Recommended actions
    const recommendedActions = hasCollapsed
      ? getCollapseActions()
      : getRecommendedActions(
          damage.level,
          materialType,
          interStoryDrift,
          componentDamage
        );
    
    setResults({
      maxDisplacement,
      interStoryDrift,
      naturalPeriod,
      structuralResponseFactor,
      damageLevel: damage.level,
      damageColor: damage.color,
      safetyStatus,
      recommendedActions,
      componentDamage,
      hasCollapsed,
      collapseTime
    });
  }, [
    height,
    floors,
    magnitude,
    stiffness,
    dampingRatio,
    materialType,
    seismicDepth,
    waveVelocity,
    elapsedTime,
    results.hasCollapsed,
    results.collapseTime
  ]);
  
  // Get color for damage percentage
  const getDamageColor = (damageValue: number) => {
    if (damageValue < 10) return 'text-green-500';
    if (damageValue < 25) return 'text-lime-500';
    if (damageValue < 50) return 'text-yellow-500';
    if (damageValue < 75) return 'text-orange-500';
    return 'text-red-500';
  };
  
  // Generate collapse-specific actions
  const getCollapseActions = (): string[] => {
    return [
      'IMMEDIATE EVACUATION - Building has structurally collapsed',
      'Contact emergency services and structural engineers',
      'Establish safety perimeter around the building',
      'Account for all building occupants',
      'Do not attempt to enter the building under any circumstances'
    ];
  };
  
  // Generate component damage data for collapse state
  const generateCollapseComponentDamage = (
    currentTime: number, 
    collapseStartTime: number
  ): ComponentDamage => {
    // Calculate progression of collapse (0-1)
    const progressFactor = Math.min(1, (currentTime - collapseStartTime) / 3);
    
    // Start with critical columns, then beams, then slabs
    const columnDamage = Math.min(100, 80 + progressFactor * 20);
    const beamDamage = Math.min(100, 75 + progressFactor * 25);
    const slabDamage = Math.min(100, 70 + progressFactor * 30);
    const foundationDamage = Math.min(100, 60 + progressFactor * 40);
    
    // Non-structural elements also critically damaged
    const facadeDamage = Math.min(100, 90 + progressFactor * 10);
    const wallDamage = Math.min(100, 85 + progressFactor * 15);
    const utilityDamage = 100; // Utilities immediately compromised
    
    return {
      structural: {
        columns: { value: columnDamage, status: 'Critical' },
        beams: { value: beamDamage, status: 'Critical' },
        slabs: { value: slabDamage, status: 'Critical' },
        foundation: { value: foundationDamage, status: 'Critical' }
      },
      nonStructural: {
        facades: { value: facadeDamage, status: 'Critical' },
        interiorWalls: { value: wallDamage, status: 'Critical' },
        utilities: { value: utilityDamage, status: 'Critical' }
      }
    };
  };
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 space-y-3 ${
      results.hasCollapsed ? 'border-2 border-red-600' : ''
    }`}>
      <h2 className="text-xl font-bold border-b pb-2">Building Response Analysis</h2>
      
      {/* Collapse warning alert */}
      {results.hasCollapsed && (
        <div className="bg-red-600 text-white p-3 rounded-md mb-3 animate-pulse">
          <h3 className="font-bold text-lg">⚠️ STRUCTURAL COLLAPSE DETECTED</h3>
          <p className="text-sm mt-1">The building has experienced complete structural failure</p>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="font-medium">Maximum Displacement:</div>
        <div className={`text-right ${results.hasCollapsed ? 'text-red-500 font-bold' : ''}`}>
          {results.maxDisplacement.toFixed(2)} m
        </div>
        
        <div className="font-medium">Inter-story Drift:</div>
        <div className={`text-right ${results.hasCollapsed ? 'text-red-500 font-bold' : ''}`}>
          {results.interStoryDrift.toFixed(2)}%
        </div>
        
        <div className="font-medium">Natural Period:</div>
        <div className="text-right">{results.naturalPeriod.toFixed(2)} s</div>
        
        <div className="font-medium">Response Factor:</div>
        <div className="text-right">{results.structuralResponseFactor.toFixed(2)}</div>
      </div>
      
      {/* Building vibration visualization graph - simplified representation */}
      <div className="mt-4 pt-2 border-t">
        <div className="font-medium mb-2">Building Oscillation Pattern:</div>
        <div className="h-12 w-full bg-gray-100 dark:bg-gray-700 rounded overflow-hidden relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-0.5 bg-gray-300 dark:bg-gray-600"></div>
          </div>
          {[...Array(20)].map((_, i) => {
            // If collapsed, show chaotic patterns
            const heightFactor = results.hasCollapsed 
              ? Math.abs(Math.sin((i / 20) * Math.PI * 6 + elapsedTime * 5) * 
                  Math.cos(i * 0.7 + elapsedTime * 3)) 
              : Math.abs(Math.sin((i / 20) * Math.PI * 4 + elapsedTime * 3));
              
            const position = results.hasCollapsed
              ? 50 - (Math.sin((i / 20) * Math.PI * 4 + elapsedTime * 3) > 0 ? 0 : Math.abs(Math.sin((i / 20) * Math.PI * 4 + elapsedTime * 3)) * 50)
              : Math.sin((i / 20) * Math.PI * 4 + elapsedTime * 3) > 0 ? 50 : 50 - Math.abs(Math.sin((i / 20) * Math.PI * 4 + elapsedTime * 3)) * 50;
            
            return (
              <div 
                key={i}
                className={`absolute w-1 rounded-full ${results.hasCollapsed ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{
                  height: `${heightFactor * 100}%`,
                  left: `${(i / 20) * 100}%`,
                  bottom: `${position}%`,
                  opacity: 0.7
                }}
              ></div>
            );
          })}
        </div>
      </div>
      
      {/* Visualize structural deformation */}
      <div className="mt-4 pt-2 border-t">
        <div className="font-medium mb-1">Structural Deformation:</div>
        <div className="h-20 w-full bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden relative">
          {/* Building outline in initial state */}
          <div className="absolute border border-dashed border-gray-400 dark:border-gray-500"
              style={{
                left: '30%',
                width: '40%',
                top: '10%',
                height: '80%'
              }}>
          </div>
          
          {/* Deformed building shape */}
          <div className="absolute bg-opacity-30 dark:bg-opacity-30"
              style={{
                left: `${30 + (results.hasCollapsed ? (Math.sin(elapsedTime * 3) * 15) : (Math.sin(elapsedTime * 2) * results.interStoryDrift))}%`,
                width: '40%',
                top: `${10 + (results.hasCollapsed ? 20 : 0)}%`,
                height: `${80 - (results.hasCollapsed ? 20 : 0)}%`,
                transform: `skew(${results.hasCollapsed ? Math.sin(elapsedTime * 5) * 30 : Math.sin(elapsedTime * 2) * results.interStoryDrift}deg)`,
                backgroundColor: results.hasCollapsed ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)',
                transition: 'all 0.3s ease'
              }}>
          </div>
          
          {/* Floor lines */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute w-full h-0.5 bg-gray-400 dark:bg-gray-500 left-0"
                style={{
                  top: `${20 + i * 12}%`,
                  transform: `translateY(-50%) rotate(${
                    results.hasCollapsed 
                      ? Math.sin(elapsedTime * 3 + i * 0.5) * 10 
                      : Math.sin(elapsedTime * 2 + i * 0.5) * results.interStoryDrift * 0.2
                  }deg)`,
                  opacity: results.hasCollapsed && i > 3 ? 0.3 : 0.8
                }}>
            </div>
          ))}
          
          {/* Column lines */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="absolute h-full w-0.5 bg-gray-400 dark:bg-gray-500 top-0"
                style={{
                  left: `${30 + i * 10}%`,
                  transform: results.hasCollapsed 
                    ? `skew(${Math.sin(elapsedTime * 4 + i * 0.7) * 20}deg, ${Math.sin(elapsedTime * 3 + i * 0.5) * 15}deg)` 
                    : `skew(${Math.sin(elapsedTime * 2 + i * 0.5) * results.interStoryDrift * 0.3}deg)`
                }}>
            </div>
          ))}
          
          {/* Cracks for collapse visualization */}
          {results.hasCollapsed && [...Array(10)].map((_, i) => (
            <div key={i} className="absolute bg-red-600"
                style={{
                  width: `${2 + Math.random() * 5}px`,
                  height: `${10 + Math.random() * 30}px`,
                  left: `${20 + Math.random() * 60}%`,
                  top: `${10 + Math.random() * 80}%`,
                  transform: `rotate(${Math.random() * 180}deg)`,
                  opacity: 0.7
                }}>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4 pt-2 border-t">
        <div className="font-medium mb-1">Expected Damage Level:</div>
        <div 
          className="text-sm py-1 px-3 rounded-full inline-block"
          style={{ 
            backgroundColor: results.damageColor, 
            color: results.damageColor === 'yellow' ? 'black' : 'white' 
          }}
        >
          {results.damageLevel}
        </div>
      </div>
      
      <div className="mt-2">
        <div className="font-medium mb-1">Building Safety Status:</div>
        <div 
          className={`text-sm font-bold ${
            results.safetyStatus === 'Safe' 
              ? 'text-green-500' 
              : results.safetyStatus === 'Caution - Inspection Required' 
                ? 'text-yellow-500' 
                : 'text-red-500'
          }`}
        >
          {results.safetyStatus}
        </div>
      </div>
      
      {/* Component damage breakdown */}
      <div className="mt-4 pt-2 border-t">
        <div className="font-medium mb-2">Component Response Analysis:</div>
        
        <div className="space-y-3">
          {/* Structural components */}
          <div>
            <h3 className="text-sm font-semibold">Structural Elements:</h3>
            <div className="ml-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs mt-1">
              <div>Columns:</div>
              <div className={getDamageColor(results.componentDamage.structural.columns.value)}>
                {results.componentDamage.structural.columns.value.toFixed(0)}% - {results.componentDamage.structural.columns.status}
              </div>
              
              <div>Beams:</div>
              <div className={getDamageColor(results.componentDamage.structural.beams.value)}>
                {results.componentDamage.structural.beams.value.toFixed(0)}% - {results.componentDamage.structural.beams.status}
              </div>
              
              <div>Floor Slabs:</div>
              <div className={getDamageColor(results.componentDamage.structural.slabs.value)}>
                {results.componentDamage.structural.slabs.value.toFixed(0)}% - {results.componentDamage.structural.slabs.status}
              </div>
              
              <div>Foundation:</div>
              <div className={getDamageColor(results.componentDamage.structural.foundation.value)}>
                {results.componentDamage.structural.foundation.value.toFixed(0)}% - {results.componentDamage.structural.foundation.status}
              </div>
            </div>
          </div>
          
          {/* Non-structural components */}
          <div>
            <h3 className="text-sm font-semibold">Non-Structural Elements:</h3>
            <div className="ml-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs mt-1">
              <div>Facades:</div>
              <div className={getDamageColor(results.componentDamage.nonStructural.facades.value)}>
                {results.componentDamage.nonStructural.facades.value.toFixed(0)}% - {results.componentDamage.nonStructural.facades.status}
              </div>
              
              <div>Interior Walls:</div>
              <div className={getDamageColor(results.componentDamage.nonStructural.interiorWalls.value)}>
                {results.componentDamage.nonStructural.interiorWalls.value.toFixed(0)}% - {results.componentDamage.nonStructural.interiorWalls.status}
              </div>
              
              <div>Utilities:</div>
              <div className={getDamageColor(results.componentDamage.nonStructural.utilities.value)}>
                {results.componentDamage.nonStructural.utilities.value.toFixed(0)}% - {results.componentDamage.nonStructural.utilities.status}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-2 border-t">
        <div className="font-medium mb-2">Recommended Actions:</div>
        <ul className="list-disc list-inside text-sm space-y-1">
          {results.recommendedActions.map((action, index) => (
            <li key={index} className={results.hasCollapsed ? 'text-red-600 font-semibold' : ''}>{action}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Helper functions for calculations

function calculateMaxDisplacement(
  height: number,
  magnitude: number,
  stiffness: number,
  dampingRatio: number,
  materialType: string
): number {
  // Simplified equation for max displacement
  // Higher magnitude, height and lower stiffness increase displacement
  const materialFactor = materialType === 'concrete' ? 0.8 : 
                         materialType === 'steel' ? 1.0 : 1.5;
  
  return (magnitude * height * materialFactor) / (stiffness * 20 * dampingRatio * 10);
}

function calculateResponseFactor(
  magnitude: number,
  stiffness: number,
  dampingRatio: number,
  materialType: string
): number {
  // Response factor indicates how much the building amplifies ground motion
  const materialFactor = materialType === 'concrete' ? 0.9 : 
                         materialType === 'steel' ? 1.1 : 1.4;
  
  return (magnitude * materialFactor) / (stiffness * dampingRatio * 5);
}

function determineDamageLevel(
  interStoryDrift: number,
  responseFactor: number,
  materialType: string
): { level: string; color: string } {
  // Damage thresholds based on inter-story drift (%)
  let threshold1, threshold2, threshold3;
  
  if (materialType === 'concrete') {
    threshold1 = 0.5;
    threshold2 = 1.0;
    threshold3 = 2.0;
  } else if (materialType === 'steel') {
    threshold1 = 0.7;
    threshold2 = 1.5;
    threshold3 = 2.5;
  } else { // wood
    threshold1 = 0.4;
    threshold2 = 0.8;
    threshold3 = 1.5;
  }
  
  // Adjust thresholds based on response factor
  threshold1 *= (1 / responseFactor);
  threshold2 *= (1 / responseFactor);
  threshold3 *= (1 / responseFactor);
  
  if (interStoryDrift < threshold1) {
    return { level: 'None to Slight', color: 'green' };
  } else if (interStoryDrift < threshold2) {
    return { level: 'Moderate', color: 'yellow' };
  } else if (interStoryDrift < threshold3) {
    return { level: 'Extensive', color: 'orange' };
  } else {
    return { level: 'Complete', color: 'red' };
  }
}

function assessComponentDamage(
  magnitude: number,
  interStoryDrift: number,
  responseFactor: number,
  height: number,
  floors: number,
  stiffness: number,
  dampingRatio: number,
  materialType: string
): ComponentDamage {
  // Base damage factors
  const baseDamageFactor = magnitude * responseFactor * 10;
  
  // Material vulnerability factors
  let materialFactors = {
    columns: 1.0,
    beams: 1.0,
    slabs: 1.0,
    foundation: 1.0
  };
  
  if (materialType === 'concrete') {
    materialFactors = {
      columns: 0.8,
      beams: 0.9,
      slabs: 0.75,
      foundation: 0.6
    };
  } else if (materialType === 'steel') {
    materialFactors = {
      columns: 0.7,
      beams: 0.8,
      slabs: 0.85,
      foundation: 0.7
    };
  } else { // wood
    materialFactors = {
      columns: 1.2,
      beams: 1.1,
      slabs: 1.0,
      foundation: 0.9
    };
  }
  
  // Stiffness influence (inverse relationship - higher stiffness means less damage)
  const stiffnessFactor = (11 - stiffness) / 5;
  
  // Damping influence (inverse relationship - higher damping means less damage)
  const dampingFactor = 0.05 / dampingRatio;
  
  // Calculate damage percentages
  const calculateDamagePercent = (baseFactor: number, heightFactor: number = 1): number => {
    return Math.min(100, Math.max(0, baseDamageFactor * baseFactor * stiffnessFactor * dampingFactor * heightFactor));
  };
  
  // Calculate structural damage
  const columnDamage = calculateDamagePercent(materialFactors.columns, 1.2);
  const beamDamage = calculateDamagePercent(materialFactors.beams, 1.0);
  const slabDamage = calculateDamagePercent(materialFactors.slabs, 0.8);
  const foundationDamage = calculateDamagePercent(materialFactors.foundation, 0.7);
  
  // Calculate non-structural damage
  // Non-structural elements are often more vulnerable but less critical
  const facadeDamage = calculateDamagePercent(1.3, 1.0);
  const interiorWallDamage = calculateDamagePercent(1.2, 0.9);
  const utilitiesDamage = calculateDamagePercent(1.4, 0.8);
  
  // Helper to determine damage status
  const getDamageStatus = (damagePercent: number): string => {
    if (damagePercent < 10) return 'Undamaged';
    if (damagePercent < 25) return 'Minor';
    if (damagePercent < 50) return 'Moderate';
    if (damagePercent < 75) return 'Severe';
    return 'Critical';
  };
  
  // Compile results
  return {
    structural: {
      columns: { value: columnDamage, status: getDamageStatus(columnDamage) },
      beams: { value: beamDamage, status: getDamageStatus(beamDamage) },
      slabs: { value: slabDamage, status: getDamageStatus(slabDamage) },
      foundation: { value: foundationDamage, status: getDamageStatus(foundationDamage) }
    },
    nonStructural: {
      facades: { value: facadeDamage, status: getDamageStatus(facadeDamage) },
      interiorWalls: { value: interiorWallDamage, status: getDamageStatus(interiorWallDamage) },
      utilities: { value: utilitiesDamage, status: getDamageStatus(utilitiesDamage) }
    }
  };
}

function assessSafety(
  damageLevel: string, 
  interStoryDrift: number,
  componentDamage: ComponentDamage
): string {
  // Check for critical structural elements
  if (componentDamage.structural.columns.status === 'Critical' ||
      componentDamage.structural.foundation.status === 'Critical') {
    return 'Unsafe - Immediate Evacuation Required';
  }
  
  if (componentDamage.structural.columns.status === 'Severe' ||
      componentDamage.structural.beams.status === 'Severe') {
    return 'Unsafe - Evacuation Recommended';
  }
  
  if (damageLevel === 'None to Slight') {
    return 'Safe';
  } else if (damageLevel === 'Moderate') {
    return 'Caution - Inspection Required';
  } else {
    return 'Unsafe - Evacuation Recommended';
  }
}

function getRecommendedActions(
  damageLevel: string,
  materialType: string,
  interStoryDrift: number,
  componentDamage: ComponentDamage
): string[] {
  const actions = [];
  
  // Critical column damage
  if (componentDamage.structural.columns.status === 'Critical') {
    actions.push('IMMEDIATE EVACUATION - Risk of structural collapse');
    actions.push('Emergency shoring of compromised columns');
  }
  
  // Severe column/beam damage
  else if (componentDamage.structural.columns.status === 'Severe' || 
           componentDamage.structural.beams.status === 'Severe') {
    actions.push('Evacuation recommended until structural assessment');
    actions.push('Detailed engineering evaluation of load path integrity');
    
    if (materialType === 'concrete') {
      actions.push('Inspect for concrete spalling and exposed rebar');
    } else if (materialType === 'steel') {
      actions.push('Inspect for buckling, connection failure, and weld fractures');
    } else {
      actions.push('Inspect for member splitting, connection failure, and joint displacement');
    }
  }
  
  // Moderate damage actions
  else if (damageLevel === 'Moderate') {
    actions.push('Structural engineering inspection required');
    actions.push('Temporary evacuation may be necessary during inspection');
    
    if (componentDamage.structural.foundation.status === 'Moderate' || 
        componentDamage.structural.foundation.status === 'Severe') {
      actions.push('Foundation inspection for settlement and cracking');
    }
    
    if (materialType === 'concrete') {
      actions.push('Check for concrete cracking and rebar exposure');
    } else if (materialType === 'steel') {
      actions.push('Inspect steel connections and welds');
    } else {
      actions.push('Examine wood joints and connections');
    }
  }
  
  // Minor damage actions
  else if (damageLevel === 'None to Slight') {
    actions.push('Visual inspection of structural elements');
    actions.push('Check for non-structural damage');
    
    if (componentDamage.nonStructural.utilities.status === 'Moderate' || 
        componentDamage.nonStructural.utilities.status === 'Severe') {
      actions.push('Inspect utility systems for damage or leaks');
    }
  }
  
  // Additional actions based on component damage
  if (componentDamage.nonStructural.facades.status === 'Severe' || 
      componentDamage.nonStructural.facades.status === 'Critical') {
    actions.push('Secure or remove damaged facade elements to prevent falling hazards');
  }
  
  if (interStoryDrift > 2.5) {
    actions.push('Residual drift assessment before reoccupancy');
  }
  
  return actions;
} 