import { useRef, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Grid, Stats } from "@react-three/drei";
import * as THREE from "three";
import { SeismicParams } from "./SeismicParameterForm";
import WaveParticles from "./WaveParticles";

function Ground({ size = 20, divisions = 20, showGrid }: { size?: number; divisions?: number; showGrid: boolean }) {
  if (!showGrid) return null;
  return <Grid args={[size, size, divisions, divisions]} position={[0, -0.01, 0]} cellColor="#6f6f6f" sectionColor="#9d4b4b" />;
}

function FaultLine({ params }: { params: SeismicParams }) {
  const { magnitude, epicenterX, epicenterY, depth } = params;
  const meshRef = useRef<THREE.Mesh>(null);
  const faultLength = magnitude * 1.5;
  
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.z += delta * 0.1;
  });

  return (
    <mesh
      ref={meshRef}
      position={[epicenterX, -depth / 2, epicenterY]}
      rotation={[Math.PI / 2, 0, Math.random() * Math.PI]}
    >
      <boxGeometry args={[0.05, faultLength, depth]} />
      <meshStandardMaterial color="red" emissive="#500000" />
    </mesh>
  );
}

function Camera() {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  return null;
}

export default function SeismicVisualizer({ params }: { params: SeismicParams }) {
  return (
    <div className="w-full h-full">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[10, 10, 10]} />
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024}
        />
        <Camera />
        <WaveParticles params={params} />
        <FaultLine params={params} />
        <Ground showGrid={params.showGrid} />
        <OrbitControls enableDamping dampingFactor={0.1} />
        {params.showStats && <Stats />}
      </Canvas>
    </div>
  );
} 