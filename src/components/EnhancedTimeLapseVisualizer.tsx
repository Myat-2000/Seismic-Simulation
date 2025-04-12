import React, { useState, useEffect, useRef } from 'react';
import { BuildingParams } from './BuildingParameterForm';
import { SeismicParams } from './SeismicParameterForm';
import { StructuralMaterialsParams } from './StructuralMaterialsForm';
import { DetailedBuildingParams } from './StructuralComponentAnalysis';
import InteractiveTimelineNavigator from './InteractiveTimelineNavigator';
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
  criticalPoints?: {
    description: string;
    location: string;
    damageLevel: 'None' | 'Minor' | 'Moderate' | 'Severe' | 'Critical';
  }[];
};

type TimeLapseVisualizerProps = {
  buildingParams: BuildingParams;
  seismicParams: SeismicParams;
  materialsParams: StructuralMaterialsParams;
  structuralElements: DetailedBuildingParams['structuralComponents'];
};

export default function EnhancedTimeLapseVisualizer({
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
  const [showCriticalPoints, setShowCriticalPoints] = useState(true);
  const [showWaveEffects, setShowWaveEffects] = useState(true);
  const [showDataOverlay, setShowDataOverlay] = useState(true);
  const [viewMode, setViewMode] = useState<'3d' | 'cross-section'>('3d');
  const animationRef = useRef<number | null>(null);
  
  // Generate snapshots at key moments in the earthquake timeline with more detailed information
  useEffect(() => {
    const duration = seismicParams.duration;
    const newSnapshots: DamageSnapshot[] = [];
    
    // Initial state (before earthquake)
    newSnapshots.push({
      timePoint: 0,
      seismicIntensity: 0,
      stressLevels: { columns: 0, beams: 0, slabs: 0, foundation: 0 },
      maxDeformation: 0,
      description: "Initial state before earthquake",
      criticalPoints: []
    });
    
    // P-wave arrival (typically first 10-15% of duration)
    const pWaveTime = Math.floor(duration * 0.1);
    newSnapshots.push({
      timePoint: pWaveTime,
      seismicIntensity: 0.2,
      stressLevels: { columns: 0.1, beams: 0.1, slabs: 0.05, foundation: 0.15 },
      maxDeformation: 0.1,
      description: "P-wave arrival - Initial compression waves detected",
      criticalPoints: [
        {
          description: "First ground movement",
          location: "Foundation",
          damageLevel: "None"
        }
      ]
    });
    
    // S-wave arrival (typically at 20-30% of duration)
    const sWaveTime = Math.floor(duration * 0.25);
    newSnapshots.push({
      timePoint: sWaveTime,
      seismicIntensity: 0.5,
      stressLevels: { columns: 0.3, beams: 0.35, slabs: 0.2, foundation: 0.4 },
      maxDeformation: 0.4,
      description: "S-wave arrival - Stronger shear waves causing significant lateral movement",
      criticalPoints: [
        {
          description: "Lateral forces begin affecting columns",
          location: "Lower columns",
          damageLevel: "Minor"
        },
        {
          description: "Foundation experiencing stress",
          location: "Foundation-column connections",
          damageLevel: "Minor"
        }
      ]
    });
    
    // Peak intensity (typically at 40-60% of duration)
    const peakTime = Math.floor(duration * 0.5);
    newSnapshots.push({
      timePoint: peakTime,
      seismicIntensity: 1.0,
      stressLevels: { columns: 0.8, beams: 0.9, slabs: 0.7, foundation: 0.75 },
      maxDeformation: 1.0,
      description: "Peak intensity - Maximum ground acceleration and structural stress",
      criticalPoints: [
        {
          description: "Maximum lateral displacement",
          location: "Upper floors",
          damageLevel: "Severe"
        },
        {
          description: "Beam-column connections under high stress",
          location: "Connection points",
          damageLevel: "Moderate"
        },
        {
          description: "Potential cracking in concrete elements",
          location: "Lower columns",
          damageLevel: "Moderate"
        }
      ]
    });
    
    // Declining intensity (typically at 70-80% of duration)
    const decliningTime = Math.floor(duration * 0.75);
    newSnapshots.push({
      timePoint: decliningTime,
      seismicIntensity: 0.6,
      stressLevels: { columns: 0.5, beams: 0.6, slabs: 0.4, foundation: 0.5 },
      maxDeformation: 0.6,
      description: "Declining intensity - Reduced ground motion but cumulative structural damage",
      criticalPoints: [
        {
          description: "Residual deformation in structure",
          location: "Overall building",
          damageLevel: "Moderate"
        },
        {
          description: "Potential permanent damage to connections",
          location: "Beam-column joints",
          damageLevel: "Moderate"
        }
      ]
    });
    
    // Final state (at end of earthquake)
    newSnapshots.push({
      timePoint: duration,
      seismicIntensity: 0.1,
      stressLevels: { columns: 0.3, beams: 0.4, slabs: 0.2, foundation: 0.3 },
      maxDeformation: 0.2,
      description: "Final state - Residual deformation and structural assessment",
      criticalPoints: [
        {
          description: "Permanent structural deformation",
          location: "Multiple locations",
          damageLevel: "Minor"
        },
        {
          description: "Potential hidden damage requiring inspection",
          location: "Connection points",
          damageLevel: "Minor"
        }
      ]
    });
    
    setSnapshots(newSnapshots);
  }, [seismicParams.duration]);
  
  // Generate thumbnail previews for snapshots
  useEffect(() => {
    // In a real implementation, this would generate actual thumbnails
    // For now, we'll just use the snapshot data as is
    // This could be implemented with canvas or by taking screenshots of the 3D view
  }, [snapshots]);

  // Animation loop for continuous playback with improved timing and performance
  useEffect(() => {
    if (!isPlaying) return;

    let frameId: number | null = null;
    let lastTime = performance.now();
    let accumulatedTime = 0;
    
    const animate = (time: number) => {
      const deltaTime = Math.min(time - lastTime, 50); // Cap deltaTime to prevent jumps
      lastTime = time;
      accumulatedTime += deltaTime;
      
      // Fixed timestep for consistent animation
      const timeStep = 16.67; // ~60fps
      const maxSteps = 3; // Limit max updates per frame
      let steps = 0;
      
      while (accumulatedTime >= timeStep && steps < maxSteps) {
        setCurrentTime(prevTime => {
          const newTime = prevTime + (timeStep / 1000) * playbackSpeed;
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
    
    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [isPlaying, playbackSpeed, seismicParams.duration]);

  // Calculate seismic intensity based on current time with improved wave modeling
  const calculateSeismicIntensity = () => {
    // If a snapshot is selected, use its intensity
    if (selectedSnapshot !== null) {
      return snapshots[selectedSnapshot].seismicIntensity;
    }
    
    // For continuous mode, calculate based on current time with more realistic wave patterns
    const timeProgress = Math.min(currentTime / (seismicParams.duration * 0.6), 1);
    
    // Create a more realistic wave pattern with primary and secondary waves
    let intensityBase = 0;
    
    // P-wave arrival (first 25% of the timeline)
    if (timeProgress < 0.25) {
      // Gradual increase with small oscillations
      intensityBase = timeProgress * 0.4 * (1 + 0.2 * Math.sin(timeProgress * 40));
    } 
    // S-wave arrival and peak (25% to 60% of timeline)
    else if (timeProgress < 0.6) {
      // Stronger intensity with larger oscillations
      const normalizedTime = (timeProgress - 0.25) / 0.35; // Normalize to 0-1 for this phase
      intensityBase = 0.4 + normalizedTime * 0.6 * (1 + 0.3 * Math.sin(normalizedTime * 30));
    } 
    // Declining phase (60% to 100%)
    else {
      // Gradual decline with diminishing oscillations
      const normalizedTime = (timeProgress - 0.6) / 0.4; // Normalize to 0-1 for this phase
      intensityBase = 1.0 - normalizedTime * 0.8 * (1 + 0.15 * Math.sin(normalizedTime * 20));
    }
    
    // Factor in earthquake parameters
    const magnitudeFactor = Math.pow(10, seismicParams.magnitude - 5) / 10;
    const distanceFactor = 100 / (seismicParams.distance + 10);
    const depthFactor = 50 / (seismicParams.depth + 5);
    
    // Combine factors and normalize to a 0-1 scale
    let intensity = intensityBase * magnitudeFactor * distanceFactor * depthFactor;
    return Math.min(Math.max(intensity, 0), 1);
  };

  const seismicIntensity = calculateSeismicIntensity();

  // Calculate current stress levels based on time and seismic intensity
  const calculateCurrentStressLevels = () => {
    if (selectedSnapshot !== null) {
      return snapshots[selectedSnapshot].stressLevels;
    }
    
    // For continuous mode, interpolate between snapshots
    let prevSnapshot = snapshots[0];
    let nextSnapshot = snapshots[snapshots.length - 1];
    
    // Find the surrounding snapshots
    for (let i = 0; i < snapshots.length - 1; i++) {
      if (snapshots[i].timePoint <= currentTime && snapshots[i + 1].timePoint >= currentTime) {
        prevSnapshot = snapshots[i];
        nextSnapshot = snapshots[i + 1];
        break;
      }
    }
    
    // Interpolate stress levels
    const timeRange = nextSnapshot.timePoint - prevSnapshot.timePoint;
    const timeProgress = timeRange === 0 ? 0 : (currentTime - prevSnapshot.timePoint) / timeRange;
    
    return {
      columns: prevSnapshot.stressLevels.columns + 
        (nextSnapshot.stressLevels.columns - prevSnapshot.stressLevels.columns) * timeProgress,
      beams: prevSnapshot.stressLevels.beams + 
        (nextSnapshot.stressLevels.beams - prevSnapshot.stressLevels.beams) * timeProgress,
      slabs: prevSnapshot.stressLevels.slabs + 
        (nextSnapshot.stressLevels.slabs - prevSnapshot.stressLevels.slabs) * timeProgress,
      foundation: prevSnapshot.stressLevels.foundation + 
        (nextSnapshot.stressLevels.foundation - prevSnapshot.stressLevels.foundation) * timeProgress
    };
  };

  const currentStressLevels = calculateCurrentStressLevels();

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

  // Get current critical points
  const getCurrentCriticalPoints = () => {
    if (selectedSnapshot !== null && snapshots[selectedSnapshot].criticalPoints) {
      return snapshots[selectedSnapshot].criticalPoints;
    }
    
    // For continuous mode, find the closest snapshot
    let closestSnapshot = snapshots[0];
    let minTimeDiff = Math.abs(snapshots[0].timePoint - currentTime);
    
    for (let i = 1; i < snapshots.length; i++) {
      const timeDiff = Math.abs(snapshots[i].timePoint - currentTime);
      if (timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        closestSnapshot = snapshots[i];
      }
    }
    
    return closestSnapshot.criticalPoints || [];
  };

  // Get damage level color
  const getDamageLevelColor = (level: 'None' | 'Minor' | 'Moderate' | 'Severe' | 'Critical') => {
    switch (level) {
      case 'None': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Minor': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Moderate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Severe': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Enhanced Time-lapse Visualization</h2>
          
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
                <option value="0.25">0.25x</option>
                <option value="0.5">0.5x</option>
                <option value="1">1x</option>
                <option value="2">2x</option>
                <option value="5">5x</option>
                <option value="10">10x</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">View Mode:</span>
              <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-600">
                <button 
                  className={`px-3 py-1 text-xs ${viewMode === '3d' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  onClick={() => setViewMode('3d')}
                >
                  3D
                </button>
                <button 
                  className={`px-3 py-1 text-xs ${viewMode === 'cross-section' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  onClick={() => setViewMode('cross-section')}
                >
                  Cross-section
                </button>
              </div>
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
          
          {/* View mode toggle */}
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-white dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-80 rounded-md shadow-md flex overflow-hidden">
              <button 
                className={`px-3 py-1.5 text-xs font-medium ${viewMode === '3d' ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-300'}`}
                onClick={() => setViewMode('3d')}
              >
                3D View
              </button>
              <button 
                className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'cross-section' ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-300'}`}
                onClick={() => setViewMode('cross-section')}
              >
                Cross-section
              </button>
            </div>
          </div>
          
          {/* Data overlay toggle */}
          <div className="absolute bottom-2 left-2 z-10">
            <button 
              className={`px-3 py-1.5 text-xs font-medium rounded-md shadow-md ${showDataOverlay ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
              onClick={() => setShowDataOverlay(!showDataOverlay)}
            >
              {showDataOverlay ? 'Hide Data Overlay' : 'Show Data Overlay'}
            </button>
          </div>
          
          {/* Data overlay */}
          {showDataOverlay && (
            <div className="absolute bottom-2 right-2 z-10 bg-white dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-80 rounded-md p-3 shadow-md max-w-xs">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">Structural Stress Levels</h4>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Columns:</span>
                  <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-red-500"
                      style={{ width: `${currentStressLevels.columns * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-800 dark:text-white ml-2">
                    {(currentStressLevels.columns * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Beams:</span>
                  <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-red-500"
                      style={{ width: `${currentStressLevels.beams * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-800 dark:text-white ml-2">
                    {(currentStressLevels.beams * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Slabs:</span>
                  <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-red-500"
                      style={{ width: `${currentStressLevels.slabs * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-800 dark:text-white ml-2">
                    {(currentStressLevels.slabs * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Foundation:</span>
                  <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-red-500"
                      style={{ width: `${currentStressLevels.foundation * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-800 dark:text-white ml-2">
                    {(currentStressLevels.foundation * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          )}
          
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
          
          {/* Wave propagation visualization overlay */}
          {showWaveEffects && seismicIntensity > 0.05 && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div 
                className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: '50%',
                  top: '90%',
                  width: `${currentTime * 100}px`,
                  height: `${currentTime * 100}px`,
                  opacity: Math.max(0, 0.3 - currentTime / seismicParams.duration * 0.3),
                  transition: 'all 100ms linear'
                }}
              ></div>
              <div 
                className="absolute inset-0 bg-red-500 bg-opacity-10 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: '50%',
                  top: '90%',
                  width: `${currentTime * 70}px`,
                  height: `${currentTime * 70}px`,
                  opacity: Math.max(0, 0.3 - currentTime / seismicParams.duration * 0.3),
                  transition: 'all 100ms linear'
                }}
              ></div>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          {/* Interactive Timeline Navigator */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Interactive Timeline</h3>
            
            <InteractiveTimelineNavigator
              currentTime={currentTime}
              duration={seismicParams.duration}
              seismicParams={seismicParams}
              onTimeChange={setCurrentTime}
              onPlayPause={() => setIsPlaying(!isPlaying)}
              isPlaying={isPlaying}
              snapshots={snapshots}
            />
            
            {/* Additional controls */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Deformation Scale: {deformationScale.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={deformationScale}
                  onChange={(e) => setDeformationScale(parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
              
              <div className="flex flex-col space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Visualization Options
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowStressColors(!showStressColors)}
                    className={`px-3 py-1 text-xs rounded-full ${showStressColors ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  >
                    {showStressColors ? 'Hide Stress Colors' : 'Show Stress Colors'}
                  </button>
                  <button
                    onClick={() => setShowWaveEffects(!showWaveEffects)}
                    className={`px-3 py-1 text-xs rounded-full ${showWaveEffects ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  >
                    {showWaveEffects ? 'Hide Wave Effects' : 'Show Wave Effects'}
                  </button>
                  <button
                    onClick={() => setShowCriticalPoints(!showCriticalPoints)}
                    className={`px-3 py-1 text-xs rounded-full ${showCriticalPoints ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  >
                    {showCriticalPoints ? 'Hide Critical Points' : 'Show Critical Points'}
                  </button>
                </div>
              </div>
            </div>