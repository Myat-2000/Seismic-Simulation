'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import SeismicParameterForm, { SeismicParams } from '../components/SeismicParameterForm';
import BuildingParameterForm, { BuildingParams } from '../components/BuildingParameterForm';
import SeismicInfo from '../components/SeismicInfo';
import BuildingAnalysisResults from '../components/BuildingAnalysisResults';

// Dynamically import the Safe 3D visualizer to avoid server-side rendering issues
const SafeSimulator = dynamic(() => import('../components/SafeSimulator'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center">Loading visualizer...</div>
});

export default function Home() {
  // Simulation states
  const [simulationStep, setSimulationStep] = useState<'seismic' | 'building' | 'running'>('seismic');
  
  // Parameter states
  const [seismicParams, setSeismicParams] = useState<SeismicParams | null>(null);
  const [buildingParams, setBuildingParams] = useState<BuildingParams | null>(null);
  
  // Timer state
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle seismic parameter form submission
  const handleSeismicSubmit = (params: SeismicParams) => {
    setSeismicParams(params);
    setSimulationStep('building');
  };

  // Handle building parameter form submission
  const handleBuildingSubmit = (params: BuildingParams) => {
    setBuildingParams(params);
    startSimulation();
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
    setSimulationStep('seismic');
  };
  
  // Handle restarting the simulation with new parameters
  const handleRestartSetup = () => {
    handleStopSimulation();
    setSeismicParams(null);
    setBuildingParams(null);
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
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3">Seismic Building Simulation</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Interactive 3D visualization of building response to seismic activity with real-time structural analysis
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel: Parameter forms or analysis results */}
          <div className="lg:col-span-1 space-y-6">
            {simulationStep === 'seismic' && (
              <SeismicParameterForm onSubmit={handleSeismicSubmit} />
            )}
            
            {simulationStep === 'building' && seismicParams && (
              <>
                <div className="card p-4">
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
            
            {simulationStep === 'running' && seismicParams && buildingParams && (
              <>
                <SeismicInfo params={seismicParams} elapsedTime={elapsedTime} />
                
                <BuildingAnalysisResults
                  buildingParams={buildingParams}
                  seismicParams={seismicParams}
                  elapsedTime={elapsedTime}
                />
                
                <div className="flex flex-col space-y-3 mt-4">
                  <button
                    onClick={handleStopSimulation}
                    className="w-full btn btn-danger"
                  >
                    Stop Simulation
                  </button>
                  
                  <button
                    onClick={handleReplaySimulation}
                    className="w-full btn btn-primary"
                  >
                    Replay Simulation
                  </button>
                  
                  <button
                    onClick={handleRestartSetup}
                    className="w-full btn btn-outline"
                  >
                    Reset & Start Over
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right panel: 3D visualization */}
          <div className="lg:col-span-2 card overflow-hidden">
            <div className="h-[600px]">
              {simulationStep === 'running' && seismicParams && buildingParams ? (
                <SafeSimulator
                  seismicParams={seismicParams}
                  buildingParams={buildingParams}
                  elapsedTime={elapsedTime}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                  <h2 className="text-2xl font-bold mb-4">Building Seismic Simulation</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg">
                    {simulationStep === 'seismic' 
                      ? 'Start by setting earthquake parameters on the left panel'
                      : 'Now configure building properties to see how they respond to the earthquake'}
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
                        <li>Step 3: Run simulation and analyze results</li>
                        <li>Interact with 3D model using mouse/touch</li>
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
