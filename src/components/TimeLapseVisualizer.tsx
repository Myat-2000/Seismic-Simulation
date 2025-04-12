import React, { useState, useEffect, useRef } from 'react';
import { BuildingParams } from './BuildingParameterForm';
import { SeismicParams } from './SeismicParameterForm';
import { StructuralMaterialsParams } from './StructuralMaterialsForm';
import { DetailedBuildingParams } from './StructuralComponentAnalysis';
import dynamic from 'next/dynamic';

// Use the enhanced structural deformation visualizer based on the memory about consolidated components
const EnhancedStructuralDeformationVisualizer = dynamic(
  () => import('./EnhancedStructuralDeformationVisualizer'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="animate-pulse text-center">
          <div className="text-lg font-semibold">Loading Structural Visualizer...</div>
        </div>
      </div>
    )
  }
);

// Define types for damage snapshots
type DamageSnapshot = {
  timePoint: number;
  seismicIntensity: number;
  stressLevels: {
    columns: number;
    beams: number;
    slabs: number;
    foundation: number;
  };
  maxDeformation: number;
  description: string;
};

type TimeLapseVisualizerProps = {
  buildingParams: BuildingParams;
  seismicParams: SeismicParams;
  materialsParams: StructuralMaterialsParams;
  structuralElements: DetailedBuildingParams['structuralComponents'];
};

export default function TimeLapseVisualizer({
  buildingParams,
  seismicParams,
  materialsParams,
  structuralElements
}: TimeLapseVisualizerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showStressColors, setShowStressColors] = useState(true);
  const [deformationScale, setDeformationScale] = useState(1);
  const [timelineView, setTimelineView] = useState<'continuous' | 'snapshots'>('continuous');
  const [snapshots, setSnapshots] = useState<DamageSnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<number | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Generate snapshots at key moments in the earthquake timeline
  useEffect(() => {
    const duration = seismicParams.duration;
    const newSnapshots: DamageSnapshot[] = [];
    
    // Initial state (before earthquake)
    newSnapshots.push({
      timePoint: 0,
      seismicIntensity: 0,
      stressLevels: { columns: 0, beams: 0, slabs: 0, foundation: 0 },
      maxDeformation: 0,
      description: "Initial state before earthquake"
    });
    
    // P-wave arrival (typically first 10-15% of duration)
    const pWaveTime = Math.floor(duration * 0.1);
    newSnapshots.push({
      timePoint: pWaveTime,
      seismicIntensity: 0.2,
      stressLevels: { columns: 0.1, beams: 0.1, slabs: 0.05, foundation: 0.15 },
      maxDeformation: 0.1,
      description: "P-wave arrival - Initial compression waves detected"
    });
    
    // S-wave arrival (typically at 20-30% of duration)
    const sWaveTime = Math.floor(duration * 0.25);
    newSnapshots.push({
      timePoint: sWaveTime,
      seismicIntensity: 0.5,
      stressLevels: { columns: 0.3, beams: 0.35, slabs: 0.2, foundation: 0.4 },
      maxDeformation: 0.4,
      description: "S-wave arrival - Stronger shear waves causing significant lateral movement"
    });
    
    // Peak intensity (typically at 40-60% of duration)
    const peakTime = Math.floor(duration * 0.5);
    newSnapshots.push({
      timePoint: peakTime,
      seismicIntensity: 1.0,
      stressLevels: { columns: 0.8, beams: 0.9, slabs: 0.7, foundation: 0.75 },
      maxDeformation: 1.0,
      description: "Peak intensity - Maximum ground acceleration and structural stress"
    });
    
    // Declining intensity (typically at 70-80% of duration)
    const decliningTime = Math.floor(duration * 0.75);
    newSnapshots.push({
      timePoint: decliningTime,
      seismicIntensity: 0.6,
      stressLevels: { columns: 0.5, beams: 0.6, slabs: 0.4, foundation: 0.5 },
      maxDeformation: 0.6,
      description: "Declining intensity - Reduced ground motion but cumulative structural damage"
    });
    
    // Final state (at end of earthquake)
    newSnapshots.push({
      timePoint: duration,
      seismicIntensity: 0.1,
      stressLevels: { columns: 0.3, beams: 0.4, slabs: 0.2, foundation: 0.3 },
      maxDeformation: 0.2,
      description: "Final state - Residual deformation and structural assessment"
    });
    
    setSnapshots(newSnapshots);
  }, [seismicParams.duration]);

  // Enhanced animation loop with smooth transitions and interpolation
  // Memoize snapshot search function to prevent recreating on every frame
  const findNearestSnapshot = React.useCallback((time: number) => {
    return snapshots.reduce((nearest, snapshot) => {
      const currentDiff = Math.abs(snapshot.timePoint - time);
      const nearestDiff = Math.abs(nearest.timePoint - time);
      return currentDiff < nearestDiff ? snapshot : nearest;
    }, snapshots[0]);
  }, [snapshots]);

  // Enhanced animation loop with improved timing and cleanup
  useEffect(() => {
    if (!isPlaying) return;

    let frameId: number | null = null;
    let lastTime = performance.now();
    let accumulatedTime = 0;
    
    const animate = (time: number) => {
      const deltaTime = Math.min(time - lastTime, 50); // Cap delta time to prevent large jumps
      lastTime = time;
      accumulatedTime += deltaTime;
      
      // Fixed timestep for consistent animation (60fps)
      const timeStep = 16.67;
      const maxSteps = 3; // Reduced from 5 to prevent potential lag
      let steps = 0;
      
      while (accumulatedTime >= timeStep && steps < maxSteps) {
        setCurrentTime(prevTime => {
          const newTime = prevTime + (timeStep / 1000) * playbackSpeed;
          
          // Find nearest snapshot using memoized function
          const nearestSnapshot = findNearestSnapshot(newTime);
          
          if (nearestSnapshot && Math.abs(nearestSnapshot.timePoint - newTime) < 0.1) {
            return nearestSnapshot.timePoint;
          }
          
          // Loop back to beginning if we reach the end
          return newTime >= seismicParams.duration ? 0 : newTime;
        });
        
        accumulatedTime -= timeStep;
        steps++;
      }
      
      // Reset accumulated time if we hit the step limit
      if (steps >= maxSteps) {
        accumulatedTime = 0;
      }
      
      frameId = requestAnimationFrame(animate);
    };
    
    frameId = requestAnimationFrame(animate);
    
    // Cleanup function
    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [isPlaying, playbackSpeed, seismicParams.duration, findNearestSnapshot]); // Added findNearestSnapshot to dependencies

  // Enhanced seismic intensity calculation with improved physics modeling
  const calculateSeismicIntensity = () => {
    // If a snapshot is selected, use its intensity with smooth interpolation
    if (selectedSnapshot !== null) {
      const snapshot = snapshots[selectedSnapshot];
      const timeDiff = Math.abs(currentTime - snapshot.timePoint);
      if (timeDiff < 0.5) { // Smooth transition within 0.5s of snapshot
        const t = 1 - (timeDiff / 0.5);
        return snapshot.seismicIntensity * t + calculateContinuousIntensity() * (1 - t);
      }
      return snapshot.seismicIntensity;
    }
    
    return calculateContinuousIntensity();
  };

  // Separate function for continuous intensity calculation
  const calculateContinuousIntensity = () => {
    // Normalize time progress with improved curve
    const timeProgress = Math.min(currentTime / (seismicParams.duration * 0.6), 1);
    
    // Enhanced bell curve with more realistic wave propagation
    const intensityBase = timeProgress < 0.5
      ? 4 * Math.pow(timeProgress, 2) * (1 - timeProgress)
      : 4 * Math.pow(1 - timeProgress, 2) * timeProgress;
    
    // Improved earthquake parameter factors
    const magnitudeFactor = Math.pow(10, (seismicParams.magnitude - 4) / 2) / 10;
    const distanceFactor = Math.exp(-seismicParams.distance / 100);
    const depthFactor = Math.exp(-seismicParams.depth / 50);
    
    // Add frequency modulation for more realistic shaking
    const frequencyMod = Math.sin(currentTime * 10) * 0.1 + 1;
    
    // Combine factors with improved normalization
    const intensity = intensityBase * magnitudeFactor * distanceFactor * depthFactor * frequencyMod;
    return Math.min(Math.max(intensity, 0), 1);
  };

  const seismicIntensity = calculateSeismicIntensity();

  // Handle snapshot selection
  const handleSnapshotSelect = (index: number) => {
    setSelectedSnapshot(index);
    setCurrentTime(snapshots[index].timePoint);
    setIsPlaying(false);
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Time-lapse Visualization</h2>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">View:</span>
              <select
                value={timelineView}
                onChange={(e) => {
                  setTimelineView(e.target.value as 'continuous' | 'snapshots');
                  setSelectedSnapshot(null);
                }}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white px-2 py-1"
              >
                <option value="continuous">Continuous</option>
                <option value="snapshots">Key Snapshots</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Speed:</span>
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white px-2 py-1"
              >
                <option value="0.5">0.5x</option>
                <option value="1">1x</option>
                <option value="2">2x</option>
                <option value="5">5x</option>
                <option value="10">10x</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Time:</span>
              <span className="text-sm font-medium text-gray-800 dark:text-white">
                {formatTime(currentTime)} / {formatTime(seismicParams.duration)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        <div className="md:col-span-2 h-[500px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 relative">
          {/* Visualization area */}
          <div className="absolute top-2 left-2 z-10 bg-white dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-80 rounded-md px-3 py-1.5 shadow-md">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-sm font-medium text-gray-800 dark:text-white">
                {timelineView === 'snapshots' && selectedSnapshot !== null
                  ? snapshots[selectedSnapshot].description
                  : `T+${currentTime.toFixed(1)}s - Intensity: ${(seismicIntensity * 10).toFixed(1)}/10`}
              </span>
            </div>
          </div>
          
          {/* Use the enhanced structural deformation visualizer */}
          <EnhancedStructuralDeformationVisualizer
            buildingParams={{
              ...buildingParams,
              structuralComponents: buildingParams.structuralComponents || {
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
              }
            }}
            materialsParams={materialsParams}
            elementInteractions={[]} // This would need to be calculated based on current time
            analysisResults={[]} // This would need to be calculated based on current time
            showStressColors={showStressColors}
            showDeformation={true}
            deformationScale={deformationScale}
            seismicIntensity={seismicIntensity}
          />
        </div>
        
        <div className="space-y-4">
          {/* Controls */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Playback Controls</h3>
            
            <div className="flex items-center justify-center space-x-4 mb-4">
              <button
                onClick={() => setCurrentTime(0)}
                className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
              >
                ⏮
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button
                onClick={() => setCurrentTime(seismicParams.duration)}
                className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
              >
                ⏭
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max={seismicParams.duration}
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => {
                    setCurrentTime(parseFloat(e.target.value));
                    setSelectedSnapshot(null);
                  }}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>0:00</span>
                  <span>{formatTime(seismicParams.duration)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Visualization settings */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Visualization Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showStressColors}
                    onChange={(e) => setShowStressColors(e.target.checked)}
                    className="rounded text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Show Stress Colors</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Deformation Scale: {deformationScale.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={deformationScale}
                  onChange={(e) => setDeformationScale(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          {/* Snapshots section (only visible in snapshots mode) */}
          {timelineView === 'snapshots' && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Key Moments</h3>
              
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                {snapshots.map((snapshot, index) => (
                  <button
                    key={index}
                    onClick={() => handleSnapshotSelect(index)}
                    className={`w-full text-left p-2 rounded-md transition-colors ${
                      selectedSnapshot === index
                        ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500'
                        : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-800 dark:text-white">
                        {formatTime(snapshot.timePoint)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        snapshot.seismicIntensity > 0.7
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : snapshot.seismicIntensity > 0.4
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {(snapshot.seismicIntensity * 10).toFixed(1)}/10
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      {snapshot.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Seismic intensity timeline */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Seismic Intensity:</span>
          <div className="relative flex-1 h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-300"
              style={{ width: `${seismicIntensity * 100}%` }}
            ></div>
            <div className="absolute inset-0 flex items-center px-3">
              <div className="text-xs font-medium text-white drop-shadow-md">
                {(seismicIntensity * 10).toFixed(1)} / 10
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
