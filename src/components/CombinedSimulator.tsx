'use client';

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stats, Environment, Grid } from "@react-three/drei";
import { BuildingParams } from "./BuildingParameterForm";
import { SeismicParams } from "./SeismicParameterForm";
import BuildingVisualizer from "./OptimizedBuildingVisualizer";
import GroundWaveEffect from "./GroundWaveEffect";
import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from 'three';
import { WebGLRenderer } from 'three';

import { StructuralMaterialsParams } from './StructuralMaterialsForm';

type CombinedSimulatorProps = {
  buildingParams: BuildingParams;
  seismicParams: SeismicParams;
  elapsedTime: number;
  materialsParams?: StructuralMaterialsParams;
};

// Simple ground plane instead of dynamic ground
function SimplifiedGround({ 
  size = 500
}: { 
  size?: number 
}) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
      receiveShadow
    >
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial 
        color="#333333" 
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  );
}

// Force WebGL context creation with optimized settings
function createOptimizedRenderer(canvas: HTMLCanvasElement | OffscreenCanvas) {
  // Skip canvas element check for browser compatibility
  try {
    // Create optimized renderer
    const renderer = new WebGLRenderer({
      canvas: canvas as HTMLCanvasElement,
      antialias: true,
      powerPreference: 'high-performance',
      precision: 'highp',
    });
    
    // Configure renderer for performance
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    return renderer;
  } catch (error) {
    console.error("Error creating WebGL renderer:", error);
    throw new Error('WebGL renderer creation failed');
  }
}

// Fix the usePerformanceMode hook typing issues
function usePerformanceMode() {
  const [performanceMode, setPerformanceMode] = useState<'high' | 'medium' | 'low'>('high');
  
  useEffect(() => {
    // Check GPU capabilities and adjust performance mode accordingly
    const checkPerformance = () => {
      try {
        // Create temporary canvas to check WebGL capabilities
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') as WebGLRenderingContext | null || 
                 canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
        
        if (!gl) {
          // WebGL not available, use lowest settings
          setPerformanceMode('low');
          return;
        }
        
        // Check for performance limitations
        const extension = gl.getExtension('WEBGL_debug_renderer_info');
        if (!extension) {
          // Can't get detailed GPU info, use medium settings
          setPerformanceMode('medium');
          return;
        }
        
        const renderer = gl.getParameter(extension.UNMASKED_RENDERER_WEBGL);
        
        // Mobile GPU detection (common mobile GPU names)
        const isMobileGPU = /adreno|mali|powervr|apple gpu/i.test(renderer);
        
        // Integrated GPU detection
        const isIntegratedGPU = /intel|iris|hd graphics/i.test(renderer) && 
                               !/nvidia|radeon|geforce|rtx/i.test(renderer);
        
        if (isMobileGPU) {
          setPerformanceMode('low');
        } else if (isIntegratedGPU) {
          setPerformanceMode('medium');
        } else {
          setPerformanceMode('high');
        }
        
      } catch (error) {
        console.error("Error during performance detection:", error);
        // Default to medium on error
        setPerformanceMode('medium');
      }
    };
    
    checkPerformance();
  }, []);
  
  return performanceMode;
}

export default function CombinedSimulator({
  buildingParams,
  seismicParams,
  elapsedTime,
  materialsParams
}: CombinedSimulatorProps) {
  // Camera position state with modified view options (removed seismic)
  const [cameraView, setCameraView] = useState<"building" | "combined" | "damage">("building");
  
  // Simulation speed control state
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1.0);

  // UI state for showing/hiding controls
  const [showControls, setShowControls] = useState(true);
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Ref for the container element to make fullscreen
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Get performance mode based on device capabilities
  const performanceMode = usePerformanceMode();
  
  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error(`Error attempting to exit fullscreen: ${err.message}`);
      });
    }
  }, []);
  
  // Update fullscreen state when exiting via Escape key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  // Helper function to get camera position based on view mode
  const getCameraPosition = () => {
    const { height, width, depth } = buildingParams;
    const maxDimension = Math.max(height, width, depth);
    
    switch (cameraView) {
      case "damage":
        // Closer view to inspect damage details
        return [width / 2, height / 3, depth / 2] as [number, number, number];
      case "combined":
        return [maxDimension, maxDimension * 0.75, maxDimension * 1.5] as [number, number, number];
      case "building":
      default:
        return [0, height / 2, maxDimension * 1.5] as [number, number, number];
    }
  };
  
  // Helper function to get camera target position
  const getCameraTarget = () => {
    const { height } = buildingParams;
    
    switch (cameraView) {
      case "damage":
        // Focus on the building's mid-height
        return [0, height / 3, 0] as [number, number, number];
      default:
        // Default target
        return [0, height / 4, 0] as [number, number, number];
    }
  };
  
  const cameraPosition = getCameraPosition();
  const cameraTarget = getCameraTarget();

  // Calculate progress percentage
  const progressPercentage = Math.min(100, Math.floor((elapsedTime / seismicParams.duration) * 100));

  // Calculate intensity based on elapsed time and magnitude
  const currentIntensity = elapsedTime > 0 
    ? Math.max(0, Math.sin(elapsedTime * 2) * seismicParams.magnitude / 10)
    : 0;

  const intensityLevel = currentIntensity < 0.2 ? 'Low' : 
                        currentIntensity < 0.5 ? 'Moderate' : 
                        currentIntensity < 0.7 ? 'High' : 'Severe';
  
  return (
    <div ref={containerRef} className={`relative w-full h-full ${isFullscreen ? 'bg-black' : ''}`}>
      {/* Toggle controls button */}
      <button 
        onClick={() => setShowControls(prev => !prev)}
        className="absolute top-2 right-2 z-20 bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/90 transition-all"
        aria-label={showControls ? "Hide Controls" : "Show Controls"}
      >
        {showControls ? "✕" : "≡"}
      </button>
      
      {/* Fullscreen toggle button */}
      <button 
        onClick={toggleFullscreen}
        className="absolute top-2 right-12 z-20 bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/90 transition-all"
        aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      >
        {isFullscreen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
          </svg>
        )}
      </button>

      {/* Simulation progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-700 z-10">
        <div 
          className="h-full bg-blue-500 transition-all duration-300 ease-linear"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Current intensity indicator */}
      <div className="absolute top-10 right-4 z-10 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm">
        <div className="flex items-center gap-2">
          <span>Intensity:</span>
          <span className={`font-bold ${
            intensityLevel === 'Low' ? 'text-green-400' : 
            intensityLevel === 'Moderate' ? 'text-yellow-400' : 
            intensityLevel === 'High' ? 'text-orange-400' : 'text-red-400'
          }`}>
            {intensityLevel}
          </span>
          <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${
                intensityLevel === 'Low' ? 'bg-green-400' : 
                intensityLevel === 'Moderate' ? 'bg-yellow-400' : 
                intensityLevel === 'High' ? 'bg-orange-400' : 'bg-red-400'
              }`} 
              style={{ width: `${currentIntensity * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      {showControls && (
        <>
          {/* Improved view selector with icons */}
          <div className="absolute top-4 right-24 z-10 view-controls flex gap-2">
            <button
              onClick={() => setCameraView("building")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
                cameraView === "building" 
                  ? "bg-blue-600 text-white" 
                  : "bg-black/50 text-white/80 hover:bg-black/70"
              }`}
              aria-label="Building Focus View"
            >
              <span>🏢</span> Building
            </button>
            <button
              onClick={() => setCameraView("combined")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
                cameraView === "combined" 
                  ? "bg-blue-600 text-white" 
                  : "bg-black/50 text-white/80 hover:bg-black/70"
              }`}
              aria-label="Wide View"
            >
              <span>🔍</span> Wide View
            </button>
            <button
              onClick={() => setCameraView("damage")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
                cameraView === "damage" 
                  ? "bg-blue-600 text-white" 
                  : "bg-black/50 text-white/80 hover:bg-black/70"
              }`}
              aria-label="Damage Details View"
            >
              <span>⚠️</span> Damage
            </button>
          </div>
          
          {/* Simulation speed control with visual indicator */}
          <div className="absolute top-20 left-4 z-10 bg-black/70 backdrop-blur-sm text-white p-3 rounded-lg text-sm shadow-lg w-48">
            <div className="flex justify-between items-center mb-1">
              <p className="font-medium">Simulation Speed</p>
              <span className="font-mono bg-black/50 px-2 py-0.5 rounded text-xs">{simulationSpeed.toFixed(1)}x</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSimulationSpeed(prev => Math.max(0.1, prev - 0.1))}
                className="w-6 h-6 flex items-center justify-center bg-gray-700 rounded hover:bg-gray-600"
              >-</button>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={simulationSpeed}
                onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
                className="flex-1"
              />
              <button 
                onClick={() => setSimulationSpeed(prev => Math.min(2, prev + 0.1))}
                className="w-6 h-6 flex items-center justify-center bg-gray-700 rounded hover:bg-gray-600"
              >+</button>
            </div>
            <div className="mt-1 flex justify-between text-xs text-gray-400">
              <span>Slow</span>
              <span>Normal</span>
              <span>Fast</span>
            </div>
          </div>
          
          {/* Enhanced instructions with better styling */}
          <div className="absolute bottom-4 left-4 z-10 bg-black/70 backdrop-blur-sm text-white p-3 rounded-lg text-sm max-w-xs shadow-lg border border-gray-700">
            <p className="font-bold mb-2 flex items-center gap-2">
              <span className="bg-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs">?</span>
              Camera Controls
            </p>
            <div className="space-y-1.5">
              <p className="flex items-center gap-2">
                <span className="bg-gray-700 text-xs px-1.5 rounded">Click + Drag</span>
                <span className="text-gray-300">Rotate view</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="bg-gray-700 text-xs px-1.5 rounded">Scroll</span>
                <span className="text-gray-300">Zoom in/out</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="bg-gray-700 text-xs px-1.5 rounded">Right-click + Drag</span>
                <span className="text-gray-300">Pan camera</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="bg-gray-700 text-xs px-1.5 rounded">Double-click</span>
                <span className="text-gray-300">Reset view</span>
              </p>
            </div>
          </div>
          
          {/* Fullscreen notice when in fullscreen mode */}
          {isFullscreen && (
            <div className="absolute bottom-4 right-4 z-10 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs">
              <p className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Press <span className="bg-gray-700 px-1.5 rounded mx-1">ESC</span> or click the button to exit fullscreen
              </p>
            </div>
          )}
        </>
      )}
      
      <Canvas
        shadows={performanceMode !== 'low'} // Disable shadows in low performance mode
        dpr={
          performanceMode === 'high' ? [1, 2] : 
          performanceMode === 'medium' ? [1, 1.5] : 
          [0.8, 1] // Lower resolution for low performance
        }
        gl={{
          antialias: performanceMode !== 'low', // Disable antialiasing in low performance mode
          powerPreference: 'high-performance',
          precision: performanceMode === 'high' ? 'highp' : 'mediump', // Lower precision for better performance
          alpha: false
        }}
        performance={{ 
          min: performanceMode === 'low' ? 0.3 : performanceMode === 'medium' ? 0.5 : 0.7
        }}
      >
        {/* Camera setup */}
        <PerspectiveCamera 
          makeDefault 
          position={cameraPosition} 
          fov={60}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[50, 100, 50]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-100}
          shadow-camera-right={100}
          shadow-camera-top={100}
          shadow-camera-bottom={-100}
          shadow-camera-near={0.1}
          shadow-camera-far={500}
        />
        
        {/* Hemisphere light for better ambience */}
        <hemisphereLight 
          args={['#cef', '#357', 0.4]}
        />
        
        {/* Enhanced ground with wave effect */}
        <GroundWaveEffect params={seismicParams} elapsedTime={elapsedTime * simulationSpeed} />
        <Grid 
          args={[500, 500]} 
          position={[0, -0.49, 0]} 
          cellColor="#555" 
          sectionColor="#888"
          fadeDistance={100}
          fadeStrength={1}
        />
        
        {/* Building visualization - focus of the simulation */}
        <BuildingVisualizer
          buildingParams={buildingParams}
          seismicParams={seismicParams}
          elapsedTime={elapsedTime * simulationSpeed}
          materialsParams={materialsParams}
          seismicIntensity={seismicParams.magnitude / 5} // Scale seismic intensity based on magnitude
        />
        
        {/* Environment for better lighting */}
        <Environment preset="city" />
        
        {/* Controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.1}
          target={cameraTarget}
          maxDistance={500}
          minDistance={5}
        />
        
        {/* Performance stats (if enabled) */}
        {seismicParams.showStats && <Stats />}
      </Canvas>
    </div>
  );
}