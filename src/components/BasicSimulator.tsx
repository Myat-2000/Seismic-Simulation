'use client';

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { BuildingParams } from "./BuildingParameterForm";
import { SeismicParams } from "./SeismicParameterForm";
import { StructuralMaterialsParams } from './StructuralMaterialsForm';
import { optimizeMesh, isInViewFrustum, applyDistanceBasedLOD } from "../utils/renderOptimization";
import { Vector3, Euler } from 'three';

// Define types
type BasicSimulatorProps = {
  buildingParams: BuildingParams;
  seismicParams: SeismicParams;
  elapsedTime: number;
  materialsParams?: StructuralMaterialsParams;
};

// Component to render a single floor piece with physics for collapse
function FloorPiece({ 
  position,
  size,
  color,
  rotation = [0, 0, 0] as [number, number, number],
  collapseIntensity = 0,
  delay = 0
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  rotation?: [number, number, number];
  collapseIntensity?: number;
  delay?: number;
}) {
  // Calculate physics for collapse animation
  const animatedPosition = useMemo(() => {
    const [x, y, z] = position;
    if (collapseIntensity <= 0) return [x, y, z] as [number, number, number];
    
    // Apply gravity and add some randomness for realistic collapse
    const progress = Math.max(0, collapseIntensity - delay);
    const fallY = progress > 0 ? y - (progress * progress * 9.8) : y;
    
    // Add horizontal drift during collapse
    const driftX = progress > 0 ? x + Math.sin(position[1] * 0.5) * progress * 2 : x;
    const driftZ = progress > 0 ? z + Math.cos(position[1] * 0.5) * progress * 2 : z;
    
    return [driftX, Math.max(-0.5, fallY), driftZ] as [number, number, number];
  }, [position, collapseIntensity, delay]);
  
  // Calculate rotation during collapse
  const animatedRotation = useMemo(() => {
    const [rx, ry, rz] = rotation;
    if (collapseIntensity <= 0) return [rx, ry, rz] as [number, number, number];
    
    // Apply rotation during collapse for more realistic effect
    const progress = Math.max(0, collapseIntensity - delay);
    if (progress <= 0) return [rx, ry, rz] as [number, number, number];
    
    // Add rotation based on position (different for each piece)
    const rotX = rx + Math.sin(position[0] * 0.5) * progress * 2;
    const rotY = ry + progress * 0.5;
    const rotZ = rz + Math.cos(position[2] * 0.5) * progress * 2;
    
    return [rotX, rotY, rotZ] as [number, number, number];
  }, [rotation, position, collapseIntensity, delay]);
  
  return (
    <mesh 
      position={new Vector3(animatedPosition[0], animatedPosition[1], animatedPosition[2])}
      rotation={new Euler(animatedRotation[0], animatedRotation[1], animatedRotation[2])}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// Enhanced building component with detailed collapse animation
function DetailedBuilding({ 
  width = 10, 
  height = 30, 
  depth = 10,
  floors = 5,
  materialType = 'concrete',
  elapsedTime = 0,
  magnitude = 5,
  collapseThreshold = 7.5, // Collapse when magnitude exceeds this
  showCollapse = false // Override to force collapse for testing
}: {
  width?: number;
  height?: number;
  depth?: number;
  floors?: number;
  materialType?: string;
  elapsedTime?: number;
  magnitude?: number;
  collapseThreshold?: number;
  showCollapse?: boolean;
}) {
  // Get building color based on material type
  let buildingColor = '#a0a0a0'; // default (concrete)
  if (materialType === 'steel') {
    buildingColor = '#607d8b';
  } else if (materialType === 'wood') {
    buildingColor = '#8d6e63';
  }
  
  // Normal earthquake displacement
  const displacement = Math.sin(elapsedTime * 2) * magnitude * 0.03;
  
  // Calculate if building should collapse
  const shouldCollapse = showCollapse || magnitude > collapseThreshold;
  
  // If we're collapsing, calculate collapse progress (0 to 1)
  // Use a slow-motion effect by making the collapse take 5 seconds
  const collapseProgress = shouldCollapse ? 
    Math.min(1, (elapsedTime - 1) / 5) : 0;
  
  // If not collapsing, just show the regular building with displacement
  if (collapseProgress <= 0) {
    return (
      <group position={[displacement, 0, 0]}>
        {/* Main building structure */}
        <mesh position={[0, height/2, 0]}>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial color={buildingColor} />
        </mesh>
        
        {/* Floor lines */}
        {Array.from({ length: Math.min(floors, 10) }).map((_, i) => {
          // Skip some floors if there are many
          if (floors > 10 && i % Math.ceil(floors / 10) !== 0) return null;
          
          const y = (i + 1) * (height / Math.min(floors, 10));
          return (
            <mesh key={`floor-${i}`} position={[0, y, 0]}>
              <boxGeometry args={[width + 0.2, 0.2, depth + 0.2]} />
              <meshStandardMaterial color="#333333" />
            </mesh>
          );
        })}
      </group>
    );
  }
  
  // For collapse animation, break the building into many pieces
  const floorHeight = height / floors;
  const pieces = [];
  
  // Create column pieces
  const columnWidth = width * 0.1;
  const columnDepth = depth * 0.1;
  
  // How many sections to break the building into (more = more detailed collapse)
  const sectionsX = 3;
  const sectionsY = floors;
  const sectionsZ = 3;
  
  // Generate building sections
  for (let y = 0; y < sectionsY; y++) {
    for (let x = 0; x < sectionsX; x++) {
      for (let z = 0; z < sectionsZ; z++) {
        // Calculate position
        const sectionWidth = width / sectionsX;
        const sectionHeight = height / sectionsY;
        const sectionDepth = depth / sectionsZ;
        
        // Position at center of each section
        const posX = (x * sectionWidth) - (width / 2) + (sectionWidth / 2);
        const posY = (y * sectionHeight) + (sectionHeight / 2);
        const posZ = (z * sectionDepth) - (depth / 2) + (sectionDepth / 2);
        
        // Add randomness to size for more realistic debris
        const sizeVariation = 0.8 + Math.random() * 0.4;
        
        // Add each piece with delay based on height (top floors collapse first)
        const delayFactor = y / sectionsY; // 0 for top floor, 1 for bottom
        const delayValue = delayFactor * 0.5; // 0.5 seconds delay from top to bottom
        
        pieces.push({
          position: [posX, posY, posZ] as [number, number, number],
          size: [
            sectionWidth * 0.9 * sizeVariation, 
            sectionHeight * 0.9 * sizeVariation, 
            sectionDepth * 0.9 * sizeVariation
          ] as [number, number, number],
          color: buildingColor,
          delay: delayValue,
          id: `piece-${x}-${y}-${z}`
        });
        
        // Add floor pieces for each level
        if (x === 1 && z === 1) {
          pieces.push({
            position: [0, (y + 1) * sectionHeight, 0],
            size: [width + 0.2, 0.2, depth + 0.2],
            color: "#333333",
            delay: delayValue * 0.8, // Floors collapse slightly ahead of structure
            id: `floor-${y}`
          });
        }
      }
    }
  }
  
  // Render all the building pieces
  return (
    <group>
      {pieces.map((piece) => (
        <FloorPiece
          key={piece.id}
          position={piece.position as [number, number, number]}
          size={piece.size as [number, number, number]}
          color={piece.color}
          rotation={[0, 0, 0] as [number, number, number]}
          collapseIntensity={collapseProgress}
          delay={piece.delay}
        />
      ))}
    </group>
  );
}

// Simple static ground plane
function SimpleGround() {
  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -0.5, 0]}
    >
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#555555" />
    </mesh>
  );
}

export default function BasicSimulator({
  buildingParams,
  seismicParams,
  elapsedTime
}: BasicSimulatorProps) {
  // Camera setup with proper typing
  const cameraPosition: [number, number, number] = [30, 20, 30];
  const targetPosition: [number, number, number] = [0, buildingParams.height/3, 0];
  
  // UI state for showing/hiding controls
  const [showControls, setShowControls] = useState(true);
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Test collapse state
  const [showCollapse, setShowCollapse] = useState(false);
  
  // Slow motion replay state
  const [slowMotion, setSlowMotion] = useState(false);
  const [slowMotionTime, setSlowMotionTime] = useState(0);
  
  // Ref for the container element to make fullscreen
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Camera view state
  const [cameraView, setCameraView] = useState<"front" | "side" | "top">("front");
  
  // Calculate current camera position based on view
  const getCurrentCamera = () => {
    switch (cameraView) {
      case "side":
        return [buildingParams.width * 2, buildingParams.height / 2, 0] as [number, number, number];
      case "top":
        return [0, buildingParams.height * 2, 0] as [number, number, number];
      case "front":
      default:
        return [30, 20, 30] as [number, number, number];
    }
  };
  
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
  
  // Handle slow motion replay
  const startSlowMotionReplay = useCallback(() => {
    setSlowMotion(true);
    setSlowMotionTime(0);
  }, []);
  
  // Update slow motion time
  useEffect(() => {
    if (!slowMotion) return;
    
    const interval = setInterval(() => {
      setSlowMotionTime(prev => {
        const newTime = prev + 0.05; // Very slow increment for dramatic effect
        if (newTime > 10) { // End slow motion after 10 seconds
          setSlowMotion(false);
          return 0;
        }
        return newTime;
      });
    }, 50); // Update every 50ms
    
    return () => clearInterval(interval);
  }, [slowMotion]);
  
  // Calculate progress percentage
  const progressPercentage = Math.min(100, Math.floor((elapsedTime / seismicParams.duration) * 100));
  
  // Calculate intensity based on elapsed time and magnitude
  const currentIntensity = elapsedTime > 0 
    ? Math.max(0, Math.sin(elapsedTime * 2) * seismicParams.magnitude / 10)
    : 0;
    
  // Determine if building should collapse based on intensity
  const shouldCollapse = seismicParams.magnitude > 7.5; // Collapse if magnitude > 7.5
  
  // Show collapse warning if intense
  const showCollapseWarning = shouldCollapse && elapsedTime > 1.0;
  
  // Determine which time to use for rendering
  const renderTime = slowMotion ? slowMotionTime : elapsedTime;

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
      
      {/* Show collapse control button for testing */}
      <button 
        onClick={() => setShowCollapse(prev => !prev)}
        className="absolute top-2 right-22 z-20 bg-red-600/90 text-white rounded px-2 py-1 text-xs font-medium hover:bg-red-700/90 transition-all ml-2"
        style={{ right: '80px' }}
      >
        {showCollapse ? "Stop Collapse" : "Test Collapse"}
      </button>
      
      {/* Show slow motion replay button */}
      {(showCollapse || shouldCollapse) && !slowMotion && (
        <button 
          onClick={startSlowMotionReplay}
          className="absolute top-10 right-22 z-20 bg-purple-600/90 text-white rounded px-2 py-1 text-xs font-medium hover:bg-purple-700/90 transition-all flex items-center gap-1"
          style={{ right: '80px' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
          </svg>
          Slow Motion Replay
        </button>
      )}
      
      {/* Slow motion indicator */}
      {slowMotion && (
        <div className="absolute top-10 right-22 z-20 bg-purple-600/90 text-white rounded px-2 py-1 text-xs font-medium flex items-center gap-1"
          style={{ right: '80px' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Slow Motion Active
        </div>
      )}
      
      {/* Basic mode indicator */}
      <div className="absolute top-2 left-2 z-10 bg-green-600/90 text-white text-xs px-2 py-1 rounded font-medium">
        Basic Mode
      </div>
      
      {/* Collapse warning alert */}
      {showCollapseWarning && !slowMotion && (
        <div className="absolute top-10 left-2 z-10 bg-red-600/90 text-white text-xs px-2 py-1 rounded font-medium animate-pulse flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Building Collapse Imminent
        </div>
      )}
      
      {/* Simulation progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-700 z-10">
        <div 
          className="h-full bg-green-500 transition-all duration-300 ease-linear"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {/* Elapsed time indicator */}
      <div className="absolute top-24 right-4 z-10 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm">
        <div className="flex items-center gap-2">
          <span>Simulation:</span>
          <span className="font-mono bg-black/50 px-2 py-0.5 rounded text-xs">
            {elapsedTime.toFixed(1)}s / {seismicParams.duration.toFixed(1)}s
          </span>
        </div>
      </div>
      
      {/* Slow motion time indicator */}
      {slowMotion && (
        <div className="absolute top-32 right-4 z-10 bg-purple-600/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <span>Slow Motion:</span>
            <span className="font-mono bg-purple-800/50 px-2 py-0.5 rounded text-xs">
              {slowMotionTime.toFixed(2)}s
            </span>
          </div>
        </div>
      )}
      
      {showControls && (
        <>
          {/* Camera view selector */}
          <div className="absolute top-4 right-24 z-10 flex gap-2">
            <button
              onClick={() => setCameraView("front")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
                cameraView === "front" 
                  ? "bg-green-600 text-white" 
                  : "bg-black/50 text-white/80 hover:bg-black/70"
              }`}
              aria-label="Front View"
            >
              <span>⬜</span> Front
            </button>
            <button
              onClick={() => setCameraView("side")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
                cameraView === "side" 
                  ? "bg-green-600 text-white" 
                  : "bg-black/50 text-white/80 hover:bg-black/70"
              }`}
              aria-label="Side View"
            >
              <span>◀</span> Side
            </button>
            <button
              onClick={() => setCameraView("top")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
                cameraView === "top" 
                  ? "bg-green-600 text-white" 
                  : "bg-black/50 text-white/80 hover:bg-black/70"
              }`}
              aria-label="Top View"
            >
              <span>▼</span> Top
            </button>
          </div>
          
          {/* Building info */}
          <div className="absolute top-20 left-4 z-10 bg-black/70 backdrop-blur-sm text-white p-3 rounded-lg text-sm shadow-lg">
            <h3 className="font-medium mb-2">Building Specifications</h3>
            <div className="space-y-1 text-xs">
              <p className="flex justify-between gap-4">
                <span className="text-gray-400">Material:</span> 
                <span className="font-medium">{buildingParams.materialType}</span>
              </p>
              <p className="flex justify-between gap-4">
                <span className="text-gray-400">Dimensions:</span> 
                <span className="font-medium">{buildingParams.width}×{buildingParams.height}×{buildingParams.depth}m</span>
              </p>
              <p className="flex justify-between gap-4">
                <span className="text-gray-400">Floors:</span> 
                <span className="font-medium">{buildingParams.floors}</span>
              </p>
              <p className="flex justify-between gap-4">
                <span className="text-gray-400">Displacement:</span> 
                <span className="font-medium">{(currentIntensity * 100).toFixed(1)}cm</span>
              </p>
              {/* Display structural integrity status */}
              <p className="flex justify-between gap-4">
                <span className="text-gray-400">Status:</span> 
                <span className={`font-medium ${shouldCollapse || showCollapse ? 'text-red-400' : 'text-green-400'}`}>
                  {shouldCollapse || showCollapse ? 'Critical Failure' : 'Stable'}
                </span>
              </p>
            </div>
          </div>
          
          {/* Enhanced instructions */}
          <div className="absolute bottom-4 left-4 z-10 bg-black/70 backdrop-blur-sm text-white p-3 rounded-lg text-sm max-w-xs shadow-lg border border-gray-700">
            <p className="font-bold mb-2 flex items-center gap-2">
              <span className="bg-green-600 w-5 h-5 rounded-full flex items-center justify-center text-xs">?</span>
              Camera Controls
            </p>
            <div className="space-y-1.5 text-xs">
              <p className="flex items-center gap-2">
                <span className="bg-gray-700 px-1.5 rounded">Click + Drag</span>
                <span className="text-gray-300">Rotate view</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="bg-gray-700 px-1.5 rounded">Scroll</span>
                <span className="text-gray-300">Zoom in/out</span>
              </p>
            </div>
          </div>
          
          {/* Fullscreen notice when in fullscreen mode */}
          {isFullscreen && (
            <div className="absolute bottom-4 right-4 z-10 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs">
              <p className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Press <span className="bg-gray-700 px-1.5 rounded mx-1">ESC</span> or click the button to exit fullscreen
              </p>
            </div>
          )}
        </>
      )}
      
      <Canvas
        gl={{
          antialias: false,
          powerPreference: 'default',
          depth: true
        }}
        style={{ background: '#202020' }}
        frameloop="always" // Always render for collapse animation
      >
        {/* Basic camera setup */}
        <PerspectiveCamera
          makeDefault
          position={getCurrentCamera()}
          fov={50}
        />
        
        {/* Basic lighting */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 20, 10]} intensity={0.7} />
        
        {/* Simple ground */}
        <SimpleGround />
        
        {/* Enhanced building with collapse animation */}
        <DetailedBuilding 
          width={buildingParams.width} 
          height={buildingParams.height}
          depth={buildingParams.depth}
          floors={buildingParams.floors}
          materialType={buildingParams.materialType}
          elapsedTime={renderTime}
          magnitude={seismicParams.magnitude}
          collapseThreshold={7.5}
          showCollapse={showCollapse}
        />
        
        {/* Camera controls */}
        <OrbitControls 
          target={targetPosition}
          maxDistance={100}
          minDistance={5}
          enableDamping={false}
        />
      </Canvas>
    </div>
  );
}