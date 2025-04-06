import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SeismicParams } from './SeismicParameterForm';

type GroundWaveEffectProps = {
  params: SeismicParams;
  elapsedTime: number;
};

export default function GroundWaveEffect({ params, elapsedTime }: GroundWaveEffectProps) {
  const { magnitude, epicenterX, epicenterY } = params;
  
  // Mesh reference for the ground plane
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Create ground geometry with reduced resolution for better performance
  const geometry = useMemo(() => {
    // Fixed size ground plane
    const size = 100;
    // Lower resolution (fewer segments)
    const resolution = 32;
    
    // Create a plane geometry with fewer segments
    return new THREE.PlaneGeometry(size, size, resolution, resolution);
  }, []);
  
  // Create material with simpler settings
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#555555',
      metalness: 0.2,
      roughness: 0.8,
      wireframe: false,
      side: THREE.DoubleSide,
      flatShading: false, // Don't use flat shading for better performance
    });
  }, []);
  
  // Simplified animation for ground deformation
  useFrame(() => {
    if (!meshRef.current) return;
    
    const mesh = meshRef.current;
    const positions = mesh.geometry.attributes.position.array as Float32Array;
    
    // Simplified wave parameters
    const waveAmplitude = magnitude * 0.03; // Reduced amplitude
    const waveFrequency = 0.6; // Reduced frequency
    
    // Only update every frame if time is less than 70% of the duration
    // This focuses animation on the beginning of the simulation
    if (elapsedTime < params.duration * 0.7) {
      // Update each vertex position with simpler calculation
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 2];
        
        // Calculate distance from epicenter
        const dx = x - epicenterX;
        const dz = z - epicenterY;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // Simple wave effect based on distance and time
        const distanceEffect = Math.max(0, 1 - distance / (magnitude * 10));
        const wave = Math.sin(distance - elapsedTime * 5) * distanceEffect;
        
        // Apply vertical displacement (much simpler calculation)
        positions[i + 1] = wave * waveAmplitude;
      }
      
      // Update geometry
      mesh.geometry.attributes.position.needsUpdate = true;
      
      // Only compute normals when needed
      if (elapsedTime % 0.2 < 0.01) { // Only recompute normals every 0.2 seconds
        mesh.geometry.computeVertexNormals();
      }
    }
  });
  
  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
      receiveShadow
    >
      <primitive object={geometry} attach="geometry" />
      <primitive object={material} attach="material" />
    </mesh>
  );
}