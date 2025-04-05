import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SeismicParams } from './SeismicParameterForm';

type GroundWaveEffectProps = {
  params: SeismicParams;
  elapsedTime: number;
};

export default function GroundWaveEffect({ params, elapsedTime }: GroundWaveEffectProps) {
  const { magnitude, epicenterX, epicenterY, waveVelocity, depth } = params;
  
  // Mesh reference for the ground plane
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Create ground geometry with higher resolution for better wave visualization
  const geometry = useMemo(() => {
    // Scale grid size based on magnitude
    const size = Math.max(100, magnitude * 20);
    const resolution = Math.max(64, Math.floor(magnitude * 10)); // Higher resolution for larger magnitudes
    
    // Create a plane geometry with high segment count for detailed deformation
    return new THREE.PlaneGeometry(size, size, resolution, resolution);
  }, [magnitude]);
  
  // Create material with custom shader for wave effect
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#555555',
      metalness: 0.2,
      roughness: 0.8,
      wireframe: false,
      side: THREE.DoubleSide,
      flatShading: true,
    });
  }, []);
  
  // Animation for ground deformation
  useFrame(() => {
    if (!meshRef.current) return;
    
    const mesh = meshRef.current;
    const positions = mesh.geometry.attributes.position.array as Float32Array;
    
    // Calculate wave parameters
    const waveAmplitude = magnitude * 0.05; // Scale amplitude with magnitude
    const waveSpeed = waveVelocity * 2; // Wave propagation speed
    const waveFrequency = 0.8; // Wave frequency
    const decayFactor = 0.3; // How quickly waves decay with distance
    
    // P-wave and S-wave speeds (P-waves are faster)
    const pWaveSpeed = waveSpeed;
    const sWaveSpeed = waveSpeed * 0.6;
    
    // P-wave and S-wave radii (distance traveled)
    const pWaveRadius = elapsedTime * pWaveSpeed;
    const sWaveRadius = elapsedTime * sWaveSpeed;
    
    // Update each vertex position
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      
      // Calculate distance from epicenter
      const dx = x - epicenterX;
      const dz = z - epicenterY;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      // No deformation for vertices very close to epicenter (avoid singularity)
      if (distance < 1) {
        positions[i + 1] = -Math.sin(elapsedTime * 5) * waveAmplitude * 2;
        continue;
      }
      
      // Calculate P-wave effect (compressional wave)
      const pWaveDistFromRadius = Math.abs(distance - pWaveRadius);
      const pWaveEffect = Math.exp(-pWaveDistFromRadius * decayFactor) * 
                         Math.sin(distance * waveFrequency - elapsedTime * 10);
      
      // Calculate S-wave effect (shear wave) - follows P-wave
      const sWaveDistFromRadius = Math.abs(distance - sWaveRadius);
      const sWaveEffect = Math.exp(-sWaveDistFromRadius * decayFactor * 1.5) * 
                         Math.sin(distance * waveFrequency * 1.5 - elapsedTime * 8);
      
      // Combine wave effects with distance-based decay
      const distanceDecay = Math.max(0, 1 - distance / (magnitude * 15));
      const combinedEffect = (pWaveEffect * 0.6 + sWaveEffect * 0.4) * distanceDecay;
      
      // Apply vertical displacement
      positions[i + 1] = combinedEffect * waveAmplitude;
      
      // Add epicenter depression effect
      if (distance < magnitude * 2) {
        const craterEffect = -Math.exp(-distance * 0.5) * magnitude * 0.1;
        positions[i + 1] += craterEffect;
      }
    }
    
    // Update geometry
    mesh.geometry.attributes.position.needsUpdate = true;
    
    // Compute normals for proper lighting
    mesh.geometry.computeVertexNormals();
  });
  
  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
      receiveShadow
      castShadow
    >
      <primitive object={geometry} attach="geometry" />
      <primitive object={material} attach="material" />
    </mesh>
  );
}