import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stats, Environment, Grid } from "@react-three/drei";
import { BuildingParams } from "./BuildingParameterForm";
import { SeismicParams } from "./SeismicParameterForm";
import BuildingVisualizer from "./BuildingVisualizer";
import { useState } from "react";

type CombinedSimulatorProps = {
  buildingParams: BuildingParams;
  seismicParams: SeismicParams;
  elapsedTime: number;
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

export default function CombinedSimulator({
  buildingParams,
  seismicParams,
  elapsedTime
}: CombinedSimulatorProps) {
  // Camera position state - removed seismic view option
  const [cameraView, setCameraView] = useState<"building" | "combined" | "damage">("building");
  
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
  
  return (
    <div className="relative w-full h-full">
      {/* View selector - removed seismic waves option */}
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <button
          onClick={() => setCameraView("building")}
          className={`px-2 py-1 text-xs rounded-md ${
            cameraView === "building"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white"
          }`}
        >
          Building Focus
        </button>
        <button
          onClick={() => setCameraView("combined")}
          className={`px-2 py-1 text-xs rounded-md ${
            cameraView === "combined"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white"
          }`}
        >
          Wide View
        </button>
        <button
          onClick={() => setCameraView("damage")}
          className={`px-2 py-1 text-xs rounded-md ${
            cameraView === "damage"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white"
          }`}
        >
          Damage Details
        </button>
      </div>
      
      {/* Instructions for user */}
      <div className="absolute bottom-4 left-4 z-10 bg-black/50 text-white p-2 rounded text-xs max-w-xs">
        <p className="font-bold mb-1">Controls:</p>
        <p>• Drag to rotate view</p>
        <p>• Scroll to zoom</p>
        <p>• Right-click + drag to pan</p>
      </div>
      
      <Canvas shadows>
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
        
        {/* Simple ground with grid */}
        <SimplifiedGround />
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
          elapsedTime={elapsedTime}
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