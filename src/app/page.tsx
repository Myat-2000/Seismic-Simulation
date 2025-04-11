'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import SeismicParameterForm, { SeismicParams } from '../components/SeismicParameterForm';
import BuildingParameterForm, { BuildingParams } from '../components/BuildingParameterForm';
import StructuralElementForm from '../components/StructuralElementForm';
import StructuralMaterialsForm, { StructuralMaterialsParams } from '../components/StructuralMaterialsForm';
import SeismicInfo from '../components/SeismicInfo';
import BuildingAnalysisResults from '../components/BuildingAnalysisResults';
// SimulationControls import removed to avoid duplication
import SimulationProgressIndicator from '../components/SimulationProgressIndicator';
import EnhancedSimulationView from '../components/EnhancedSimulationView';
import EnhancedSimulationCapabilities from '../components/EnhancedSimulationCapabilities';
import { DetailedBuildingParams } from '../components/StructuralComponentAnalysis';

// Dynamically import the Safe 3D visualizer to avoid server-side rendering issues
const SafeSimulator = dynamic(() => import('../components/SafeSimulator'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center">Loading visualizer...</div>
});

export default function Home() {
  // Simulation states
  const [simulationStep, setSimulationStep] = useState<'seismic' | 'building' | 'structural' | 'materials' | 'running'>('seismic');
  
  // Parameter states
  const [seismicParams, setSeismicParams] = useState<SeismicParams | null>(null);
  const [buildingParams, setBuildingParams] = useState<BuildingParams | null>(null);
  const [materialsParams, setMaterialsParams] = useState<StructuralMaterialsParams | null>(null);
  
  // Timer state
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Render mode state
  const [preferBasicMode, setPreferBasicMode] = useState(false);

  // Handle seismic parameter form submission
  const handleSeismicSubmit = (params: SeismicParams) => {
    setSeismicParams(params);
    setSimulationStep('building');
  };

  // Handle building parameter form submission
  const handleBuildingSubmit = (params: BuildingParams) => {
    setBuildingParams(params);
    setSimulationStep('structural');
  };

  // Handle structural element properties form submission
  const handleStructuralElementSubmit = (structuralElements: DetailedBuildingParams['structuralComponents']) => {
    if (buildingParams) {
      setBuildingParams({
        ...buildingParams,
        structuralComponents: structuralElements
      });
    }
    setSimulationStep('materials');
  };

  // Handle materials parameter form submission
  const handleMaterialsSubmit = (params: StructuralMaterialsParams) => {
    setMaterialsParams(params);
  };

  // Start the simulation
  const startSimulation = () => {
    // Reset timer if already running
    if (timerRef.current) {
      clearInterval(timerRef.current);
      setElapsedTime(0);
    }
    
    // Activate simulation
    setSimulationStep('running');
    
    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + 0.1;
        // Stop simulation when duration is reached
        if (seismicParams && newTime >= seismicParams.duration) {
          if (timerRef.current) clearInterval(timerRef.current);
          return seismicParams.duration;
        }
        return newTime;
      });
    }, 100);
  };

  // Handle stopping the simulation
  const handleStopSimulation = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // Just stop the timer without changing the step
  };
  
  // Handle restarting the simulation with new parameters
  const handleRestartSetup = () => {
    handleStopSimulation();
    setSeismicParams(null);
    setBuildingParams(null);
    setMaterialsParams(null);
  };
  
  // Handle stopping the simulation and returning to setup
  const handleReturnToSetup = () => {
    handleStopSimulation();
    setSimulationStep('seismic');
  };
  
  // Handle replaying the simulation
  const handleReplaySimulation = () => {
    // Stop current timer if running
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Reset elapsed time
    setElapsedTime(0);
    
    // Restart the timer
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + 0.1;
        // Stop simulation when duration is reached
        if (seismicParams && newTime >= seismicParams.duration) {
          if (timerRef.current) clearInterval(timerRef.current);
          return seismicParams.duration;
        }
        return newTime;
      });
    }, 100);
  };

  // Clean up timer when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-6 text-center">
          <h1 className="text-4xl font-bold mb-3">Seismic Building Simulation</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Interactive 3D visualization of building response to seismic activity with real-time structural analysis
          </p>
        </header>
        
        {/* Progress Indicator */}
        <SimulationProgressIndicator 
          currentStep={simulationStep} 
          onStepClick={(step) => {
            // Only allow navigation to previous steps or current step
            const currentStepIndex = ['seismic', 'building', 'structural', 'materials', 'running'].indexOf(simulationStep);
            const targetStepIndex = ['seismic', 'building', 'structural', 'materials', 'running'].indexOf(step);
            
            if (targetStepIndex <= currentStepIndex) {
              setSimulationStep(step);
            }
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel: Parameter forms or analysis results */}
          <div className="lg:col-span-1 space-y-6">
            {simulationStep === 'seismic' && (
              <SeismicParameterForm onSubmit={handleSeismicSubmit} />
            )}
            
            {simulationStep === 'building' && seismicParams && (
              <>
                <div className="card p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  <h3 className="font-bold mb-2">Seismic Parameters (Set)</h3>
                  <p className="text-sm">Magnitude: {seismicParams.magnitude.toFixed(1)}</p>
                  <p className="text-sm">Depth: {seismicParams.depth} km</p>
                  <p className="text-sm">Epicenter: ({seismicParams.epicenterX}, {seismicParams.epicenterY})</p>
                  
                  <button
                    onClick={() => setSimulationStep('seismic')}
                    className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Edit Seismic Parameters
                  </button>
                </div>
                
                <BuildingParameterForm onSubmit={handleBuildingSubmit} />
              </>
            )}
            
            {simulationStep === 'structural' && seismicParams && buildingParams && (
              <>
                <div className="card p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  <h3 className="font-bold mb-2">Seismic Parameters (Set)</h3>
                  <p className="text-sm">Magnitude: {seismicParams.magnitude.toFixed(1)}</p>
                  <p className="text-sm">Depth: {seismicParams.depth} km</p>
                  <p className="text-sm">Epicenter: ({seismicParams.epicenterX}, {seismicParams.epicenterY})</p>
                  
                  <button
                    onClick={() => setSimulationStep('seismic')}
                    className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Edit Seismic Parameters
                  </button>
                </div>

                <div className="card p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  <h3 className="font-bold mb-2">Building Parameters (Set)</h3>
                  <p className="text-sm">Dimensions: {buildingParams.width}m × {buildingParams.depth}m × {buildingParams.height}m</p>
                  <p className="text-sm">Floors: {buildingParams.floors}</p>
                  <p className="text-sm">Material: {buildingParams.materialType.charAt(0).toUpperCase() + buildingParams.materialType.slice(1)}</p>
                  
                  <button
                    onClick={() => setSimulationStep('building')}
                    className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Edit Building Parameters
                  </button>
                </div>
                
                <StructuralElementForm 
                  onSubmit={handleStructuralElementSubmit} 
                  initialParams={buildingParams.structuralComponents}
                />
              </>
            )}
            
            {simulationStep === 'materials' && seismicParams && buildingParams && (
              <>
                <div className="card p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  <h3 className="font-bold mb-2">Seismic Parameters (Set)</h3>
                  <p className="text-sm">Magnitude: {seismicParams.magnitude.toFixed(1)}</p>
                  <p className="text-sm">Depth: {seismicParams.depth} km</p>
                  <p className="text-sm">Epicenter: ({seismicParams.epicenterX}, {seismicParams.epicenterY})</p>
                  
                  <button
                    onClick={() => setSimulationStep('seismic')}
                    className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Edit Seismic Parameters
                  </button>
                </div>

                <div className="card p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  <h3 className="font-bold mb-2">Building Parameters (Set)</h3>
                  <p className="text-sm">Dimensions: {buildingParams.width}m × {buildingParams.depth}m × {buildingParams.height}m</p>
                  <p className="text-sm">Floors: {buildingParams.floors}</p>
                  <p className="text-sm">Material: {buildingParams.materialType.charAt(0).toUpperCase() + buildingParams.materialType.slice(1)}</p>
                  
                  <button
                    onClick={() => setSimulationStep('building')}
                    className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Edit Building Parameters
                  </button>
                </div>
                
                <div className="card p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  <h3 className="font-bold mb-2">Structural Elements (Set)</h3>
                  <p className="text-sm">Columns: {buildingParams.structuralComponents?.columns.width}m width, {buildingParams.structuralComponents?.columns.reinforcement} reinforcement</p>
                  <p className="text-sm">Beams: {buildingParams.structuralComponents?.beams.width}m × {buildingParams.structuralComponents?.beams.depth}m</p>
                  <p className="text-sm">Foundation: {buildingParams.structuralComponents?.foundation.type}</p>
                  
                  <button
                    onClick={() => setSimulationStep('structural')}
                    className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Edit Structural Elements
                  </button>
                </div>
                
                <StructuralMaterialsForm 
                  onSubmit={handleMaterialsSubmit} 
                  activeMaterial={buildingParams.materialType}
                />
                
                <div className="mt-6">
                  <button
                    onClick={startSimulation}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-1 duration-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Start Simulation
                  </button>
                </div>
              </>
            )}
            
            {simulationStep === 'running' && seismicParams && buildingParams && materialsParams && (
              <div className="space-y-6">
                <SeismicInfo params={seismicParams} elapsedTime={elapsedTime} />
                
                <BuildingAnalysisResults
                  buildingParams={buildingParams}
                  seismicParams={seismicParams}
                  elapsedTime={elapsedTime}
                />
                
                {/* SimulationControls removed to avoid duplication with controls in SafeSimulator */}
                
                {elapsedTime >= seismicParams.duration && (
                  <div className="card p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <h3 className="font-bold mb-2">Enhanced Visualization & Analysis</h3>
                    <button
                      onClick={() => setPreferBasicMode(!preferBasicMode)}
                      className="mb-4 px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                    >
                      {preferBasicMode ? 'Switch to Enhanced View' : 'Switch to Basic View'}
                    </button>
                  </div>
                )}
                
                <div className="flex flex-col space-y-3 mt-6">
                  <button
                    onClick={handleReplaySimulation}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2 shadow-md"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Replay Simulation
                  </button>
                  
                  <button
                    onClick={handleReturnToSetup}
                    className="w-full bg-danger hover:bg-danger-dark text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2 shadow-md"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Exit Simulation
                  </button>
                  
                  <button
                    onClick={handleRestartSetup}
                    className="w-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Reset & Start Over
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right panel: 3D visualization */}
          <div className="lg:col-span-2 card overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="h-[600px]">
              {(simulationStep === 'running' || simulationStep === 'materials' || simulationStep === 'building') && seismicParams && buildingParams ? (
                <>
                  <div className="absolute top-2 right-2 z-10 flex items-center bg-black/20 backdrop-blur-sm rounded p-1 text-xs">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferBasicMode}
                        onChange={() => setPreferBasicMode(prev => !prev)}
                        className="mr-2"
                      />
                      Use Basic 3D (Better Performance)
                    </label>
                  </div>
                  {simulationStep === 'building' ? (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                      <button
                        onClick={() => setSimulationStep('structural')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg transition-colors flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                        </svg>
                        Continue to Materials
                      </button>
                    </div>
                  ) : simulationStep === 'structural' ? (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="text-center bg-black/30 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
                        Configure structural elements on the left panel
                      </div>
                    </div>
                  ) : simulationStep === 'materials' ? (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="text-center bg-black/30 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
                        Configure materials properties on the left panel
                      </div>
                    </div>
                  ) : null}
                  <SafeSimulator
                    seismicParams={seismicParams}
                    buildingParams={buildingParams}
                    elapsedTime={elapsedTime}
                    preferBasicMode={preferBasicMode}
                    onStop={simulationStep === 'running' ? handleStopSimulation : undefined}
                    onRestart={simulationStep === 'running' ? handleReplaySimulation : undefined}
                    materialsParams={materialsParams || {
                      concrete: {
                        compressiveStrength: 30,
                        tensileStrength: 3,
                        elasticModulus: 25,
                        reinforcementType: 'standard',
                        structuralSystemType: 'frame',
                        dampingRatio: 5,
                        poissonsRatio: 0.2,
                        thermalExpansionCoeff: 10,
                        creepCoefficient: 2.0,
                        shrinkageStrain: 0.5,
                        codeCompliance: 'ACI-318'
                      },
                      steel: {
                        yieldStrength: 350,
                        tensileStrength: 450,
                        elasticModulus: 200,
                        connectionType: 'welded',
                        structuralSystemType: 'moment-frame',
                        dampingRatio: 2,
                        poissonsRatio: 0.3,
                        thermalExpansionCoeff: 12,
                        fatigueCategory: 'high-cycle',
                        fractureClass: 'B',
                        codeCompliance: 'AISC-360'
                      },
                      wood: {
                        bendingStrength: 20,
                        compressionStrength: 15,
                        elasticModulus: 10,
                        gradeType: 'structural',
                        structuralSystemType: 'light-frame',
                        dampingRatio: 7,
                        poissonsRatio: 0.25,
                        moistureContent: 12,
                        shrinkageCoefficient: 0.2,
                        durabilityClass: '2',
                        codeCompliance: 'NDS'
                      },
                      activeMaterial: buildingParams.materialType
                    }}
                  />
                  
                  {/* Enhanced Simulation Capabilities */}
                  {simulationStep === 'running' && (
                    <div className="mt-6">
                      <EnhancedSimulationCapabilities
                        initialSeismicParams={seismicParams}
                        initialBuildingParams={buildingParams}
                        initialStructuralElements={buildingParams.structuralComponents || {}}
                        initialMaterialsParams={materialsParams || {
                          concrete: {
                            compressiveStrength: 30,
                            tensileStrength: 3,
                            elasticModulus: 25,
                            reinforcementType: 'standard',
                            structuralSystemType: 'frame',
                            dampingRatio: 5,
                            poissonsRatio: 0.2,
                            thermalExpansionCoeff: 10,
                            creepCoefficient: 2.0,
                            shrinkageStrain: 0.5,
                            codeCompliance: 'ACI-318'
                          },
                          steel: {
                            yieldStrength: 350,
                            tensileStrength: 450,
                            elasticModulus: 200,
                            connectionType: 'welded',
                            structuralSystemType: 'moment-frame',
                            dampingRatio: 2,
                            poissonsRatio: 0.3,
                            thermalExpansionCoeff: 12,
                            fatigueCategory: 'high-cycle',
                            fractureClass: 'B',
                            codeCompliance: 'AISC-360'
                          },
                          wood: {
                            bendingStrength: 20,
                            compressionStrength: 15,
                            elasticModulus: 10,
                            gradeType: 'structural',
                            structuralSystemType: 'light-frame',
                            dampingRatio: 7,
                            poissonsRatio: 0.25,
                            moistureContent: 12,
                            shrinkageCoefficient: 0.2,
                            durabilityClass: '2',
                            codeCompliance: 'NDS'
                          },
                          activeMaterial: buildingParams.materialType
                        }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                  <h2 className="text-2xl font-bold mb-4">Building Seismic Simulation</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg">
                    {simulationStep === 'seismic' 
                      ? 'Start by setting earthquake parameters on the left panel'
                      : simulationStep === 'building'
                        ? 'Now configure building properties to see how they respond to the earthquake'
                        : simulationStep === 'structural'
                          ? 'Configure structural elements to define the building framework'
                          : simulationStep === 'materials'
                            ? 'Configure material properties to fine-tune the building response'
                            : 'Running simulation and analyzing results'}
                  </p>
                  <div className="flex flex-wrap justify-center gap-6 text-left">
                    <div className="bg-gray-100 dark:bg-gray-700 p-5 rounded-lg max-w-xs shadow-md">
                      <h3 className="font-bold mb-3 text-primary dark:text-primary-light">Features:</h3>
                      <ul className="list-disc list-inside text-sm space-y-2">
                        <li>3D visualization of seismic waves</li>
                        <li>Building response to earthquake forces</li>
                        <li>Structural analysis based on building parameters</li>
                        <li>Safety assessment and recommended actions</li>
                      </ul>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-5 rounded-lg max-w-xs shadow-md">
                      <h3 className="font-bold mb-3 text-primary dark:text-primary-light">Instructions:</h3>
                      <ul className="list-disc list-inside text-sm space-y-2">
                        <li>Step 1: Set earthquake parameters</li>
                        <li>Step 2: Configure building properties</li>
                        <li>Step 3: Define structural elements</li>
                        <li>Step 4: Define structural materials</li>
                        <li>Step 5: Run simulation and analyze results</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
