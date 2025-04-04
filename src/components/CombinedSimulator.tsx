import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stats, Environment, Grid } from "@react-three/drei";
import { BuildingParams } from "./BuildingParameterForm";
import { SeismicParams } from "./SeismicParameterForm";
import BuildingVisualizer from "./BuildingVisualizer";
import GroundWaveEffect from "./GroundWaveEffect";
import SeismicWaves from "./SeismicWaves";
import WaveParticles from "./WaveParticles";
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
  // Camera position state with added seismic view option
  const [cameraView, setCameraView] = useState<"building" | "combined" | "damage" | "seismic">("building");
  
  // Helper function to get camera position based on view mode
  const getCameraPosition = () => {
    const { height, width, depth } = buildingParams;
    const maxDimension = Math.max(height, width, depth);
    const { epicenterX, epicenterY, magnitude } = seismicParams;
    
    switch (cameraView) {
      case "damage":
        // Closer view to inspect damage details
        return [width / 2, height / 3, depth / 2] as [number, number, number];
      case "combined":
        return [maxDimension, maxDimension * 0.75, maxDimension * 1.5] as [number, number, number];
      case "seismic":
        // Elevated view centered on the epicenter to see wave propagation
        return [epicenterX, magnitude * 5, epicenterY + magnitude * 3] as [number, number, number];
      case "building":
      default:
        return [0, height / 2, maxDimension * 1.5] as [number, number, number];
    }
  };
  
  // Helper function to get camera target position
  const getCameraTarget = () => {
    const { height } = buildingParams;
    const { epicenterX, epicenterY } = seismicParams;
    
    switch (cameraView) {
      case "damage":
        // Focus on the building's mid-height
        return [0, height / 3, 0] as [number, number, number];
      case "seismic":
        // Focus on the epicenter
        return [epicenterX, 0, epicenterY] as [number, number, number];
      default:
        // Default target
        return [0, height / 4, 0] as [number, number, number];
    }
  };
  
  const cameraPosition = getCameraPosition();
  const cameraTarget = getCameraTarget();
  
  return (
    <div className="relative w-full h-full">
      {/* View selector with improved styling */}
      <div className="absolute top-4 right-4 z-10 view-controls">
        <button
          onClick={() => setCameraView("building")}
          className={`view-control-btn ${cameraView === "building" ? "active" : ""}`}
          aria-label="Building Focus View"
        >
          Building Focus
        </button>
        <button
          onClick={() => setCameraView("combined")}
          className={`view-control-btn ${cameraView === "combined" ? "active" : ""}`}
          aria-label="Wide View"
        >
          Wide View
        </button>
        <button
          onClick={() => setCameraView("damage")}
          className={`view-control-btn ${cameraView === "damage" ? "active" : ""}`}
          aria-label="Damage Details View"
        >
          Damage Details
        </button>
        <button
          onClick={() => setCameraView("seismic")}
          className={`view-control-btn ${cameraView === "seismic" ? "active" : ""}`}
          aria-label="Seismic Waves View"
        >
          Seismic Waves
        </button>
      </div>
      
      {/* Enhanced instructions for user */}
      <div className="absolute bottom-4 left-4 z-10 bg-black/70 backdrop-blur-sm text-white p-3 rounded-lg text-sm max-w-xs shadow-lg">
        <p className="font-bold mb-2">Controls:</p>
        <div className="space-y-1">
          <p>• <span className="text-primary-light">Drag</span> to rotate view</p>
          <p>• <span className="text-primary-light">Scroll</span> to zoom in/out</p>
          <p>• <span className="text-primary-light">Right-click + drag</span> to pan</p>
          <p>• <span className="text-primary-light">Double-click</span> to reset view</p>
        </div>
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
        
        {/* Enhanced ground with wave effect */}
        <GroundWaveEffect params={seismicParams} elapsedTime={elapsedTime} />
        <Grid 
          args={[500, 500]} 
          position={[0, -0.49, 0]} 
          cellColor="#555" 
          sectionColor="#888"
          fadeDistance={100}
          fadeStrength={1}
        />
        
        {/* Seismic wave visualization */}
        <SeismicWaves params={seismicParams} elapsedTime={elapsedTime} />
        
        {/* Particle effects for additional visual impact */}
        <WaveParticles params={seismicParams} />
        
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