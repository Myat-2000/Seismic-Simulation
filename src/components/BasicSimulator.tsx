'use client';

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { BuildingParams } from "./BuildingParameterForm";
import { SeismicParams } from "./SeismicParameterForm";
import { useState, useRef } from "react";
import * as THREE from 'three';

type BasicSimulatorProps = {
  buildingParams: BuildingParams;
  seismicParams: SeismicParams;
  elapsedTime: number;
};

// Simple building component without complex effects
function SimpleBuilding({ 
  width = 10, 
  height = 30, 
  depth = 10,
  floors = 5,
  materialType = 'concrete',
  elapsedTime = 0,
  magnitude = 5
}) {
  // Get building color based on material type
  let buildingColor = '#a0a0a0'; // default (concrete)
  if (materialType === 'steel') {
    buildingColor = '#607d8b';
  } else if (materialType === 'wood') {
    buildingColor = '#8d6e63';
  }
  
  // Very basic animation (much simpler than full simulation)
  const displacement = Math.sin(elapsedTime * 3) * magnitude * 0.05;
  
  return (
    <group position={[displacement, 0, 0]}>
      {/* Main building structure */}
      <mesh position={[0, height/2, 0]} castShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={buildingColor} />
      </mesh>
      
      {/* Simple floor lines */}
      {Array.from({ length: floors }).map((_, i) => {
        const y = (i + 1) * (height / floors);
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

// Simple ground instead of the complex wave effect
function SimpleGround() {
  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -0.5, 0]} 
      receiveShadow
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
  // Performance measure - only render at 30fps max to reduce load
  const lastRenderTime = useRef(0);
  const shouldRender = () => {
    const now = Date.now();
    const elapsed = now - lastRenderTime.current;
    if (elapsed > 33) { // ~30fps
      lastRenderTime.current = now;
      return true;
    }
    return false;
  };
  
  return (
    <div className="relative w-full h-full">
      <div className="absolute top-2 left-2 z-10 bg-white/80 dark:bg-black/80 text-black dark:text-white text-xs p-2 rounded">
        <p>Basic Mode - Reduced Complexity</p>
      </div>
      
      <Canvas
        shadows={false} // Disable shadows for performance
        dpr={[0.6, 1]} // Lower resolution
        gl={{
          antialias: false, // Disable antialiasing
          powerPreference: 'default',
          precision: 'lowp', // Use lowest precision
          alpha: false,
          stencil: false, // Disable stencil buffer
          depth: true // Keep depth for 3D
        }}
        frameloop="demand" // Only render when needed
      >
        {/* Simplified camera setup */}
        <PerspectiveCamera 
          makeDefault 
          position={[30, 20, 30]} 
          fov={50}
        />
        
        {/* Minimal lighting */}
        <ambientLight intensity={0.7} />
        <directionalLight 
          position={[10, 20, 10]}
          intensity={0.7}
          castShadow={false}
        />
        
        {/* Simple ground */}
        <SimpleGround />
        
        {/* Simplified building */}
        <SimpleBuilding 
          width={buildingParams.width} 
          height={buildingParams.height}
          depth={buildingParams.depth}
          floors={buildingParams.floors}
          materialType={buildingParams.materialType}
          elapsedTime={elapsedTime}
          magnitude={seismicParams.magnitude}
        />
        
        {/* Simplified controls */}
        <OrbitControls 
          enableDamping={false}
          target={[0, buildingParams.height/3, 0]}
          maxDistance={100}
          minDistance={5}
        />
      </Canvas>
    </div>
  );
} 