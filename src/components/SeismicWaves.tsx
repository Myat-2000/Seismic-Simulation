import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MeshStandardMaterial } from 'three';
import { SeismicParams } from './SeismicParameterForm';

type SeismicWavesProps = {
  params: SeismicParams;
  elapsedTime: number;
};

export default function SeismicWaves({ params, elapsedTime }: SeismicWavesProps) {
  const { magnitude, epicenterX, epicenterY, waveVelocity, depth } = params;
  const groupRef = useRef<THREE.Group>(null);
  
  // Validate and normalize parameters to prevent rendering issues
  const validatedParams = useMemo(() => {
    return {
      magnitude: isNaN(magnitude) || magnitude <= 0 ? 1 : Math.min(Math.max(magnitude, 1), 10),
      epicenterX: isNaN(epicenterX) ? 0 : epicenterX,
      epicenterY: isNaN(epicenterY) ? 0 : epicenterY,
      waveVelocity: isNaN(waveVelocity) || waveVelocity <= 0 ? 1 : Math.min(Math.max(waveVelocity, 0.1), 5),
      depth: isNaN(depth) || depth < 0 ? 10 : depth
    };
  }, [magnitude, epicenterX, epicenterY, waveVelocity, depth]);
  
  // Create wave rings for visualization with improved parameter handling
  const waveRings = useMemo(() => {
    const rings = [];
    const { magnitude, waveVelocity } = validatedParams;
    
    // Adaptive number of rings based on magnitude but with reasonable limits
    const numRings = Math.max(3, Math.min(Math.floor(magnitude * 1.2), 12));
    
    // P-wave rings (primary waves - faster)
    for (let i = 0; i < numRings; i++) {
      // Ensure initial radius has a minimum value to prevent zero-sized rings
      const initialRadius = Math.max(0.5, i * 1.8);
      
      rings.push({
        type: 'p-wave',
        color: new THREE.Color('#ff3300'), // More vibrant red
        emissive: new THREE.Color('#ff2200').multiplyScalar(0.5), // Glow effect
        initialRadius,
        // Ensure speed is always positive and within reasonable bounds
        speed: Math.max(0.1, waveVelocity * 1.5),
        // Scale thickness with magnitude but keep it within reasonable bounds
        thickness: Math.max(0.1, Math.min(0.3 * (magnitude / 5), 0.5)),
        // Adaptive segments based on magnitude for performance optimization
        segments: Math.max(32, Math.min(Math.floor(magnitude * 12), 96)),
        pulseFrequency: 3 + i * 0.2 // Unique pulse frequency per ring
      });
    }
    
    // S-wave rings (secondary waves - slower)
    for (let i = 0; i < numRings; i++) {
      // Ensure initial radius has a minimum value to prevent zero-sized rings
      const initialRadius = Math.max(0.5, i * 1.8);
      
      rings.push({
        type: 's-wave',
        color: new THREE.Color('#00aaff'), // Changed to blue for better contrast
        emissive: new THREE.Color('#0088ff').multiplyScalar(0.5), // Glow effect
        initialRadius,
        // Ensure speed is always positive and within reasonable bounds
        speed: Math.max(0.05, waveVelocity * 0.8),
        // Scale thickness with magnitude but keep it within reasonable bounds
        thickness: Math.max(0.1, Math.min(0.4 * (magnitude / 5), 0.6)),
        // Adaptive segments based on magnitude for performance optimization
        segments: Math.max(32, Math.min(Math.floor(magnitude * 12), 96)),
        pulseFrequency: 2 + i * 0.15 // Unique pulse frequency per ring
      });
    }
    
    return rings;
  }, [validatedParams]);
  
  // Create geometries and materials for wave rings
  const waveMeshes = useMemo(() => {
    return waveRings.map((ring, index) => {
      // Create a more detailed torus geometry
      const geometry = new THREE.TorusGeometry(
        ring.initialRadius,
        ring.thickness,
        4, // More radial segments for smoother appearance
        ring.segments
      );
      
      // Use MeshStandardMaterial for better lighting and glow effects
      const material = new THREE.MeshStandardMaterial({
        color: ring.color,
        emissive: ring.emissive,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.8, // Higher base opacity
        side: THREE.DoubleSide,
        depthWrite: false,
        roughness: 0.3,
        metalness: 0.5
      });
      
      return { geometry, material, ring };
    });
  }, [waveRings]);
  
  // Handle edge case where elapsedTime might be NaN or negative
  const safeElapsedTime = useMemo(() => {
    return isNaN(elapsedTime) || elapsedTime < 0 ? 0 : elapsedTime;
  }, [elapsedTime]);
  
  // Effect to clean up materials when component unmounts to prevent memory leaks
  useEffect(() => {
    return () => {
      waveMeshes.forEach(({ material }) => {
        if (material) {
          material.dispose();
        }
      });
    };
  }, [waveMeshes]);
  
  // Animation for wave propagation with improved error handling and edge case management
  useFrame(() => {
    if (!groupRef.current) return;
    
    const { magnitude } = validatedParams;
    
    // Ensure we don't exceed the number of available meshes
    const maxIndex = Math.min(waveMeshes.length, groupRef.current.children.length);
    
    for (let index = 0; index < maxIndex; index++) {
      const waveMesh = waveMeshes[index];
      const mesh = groupRef.current.children[index] as THREE.Mesh;
      
      if (!mesh || !waveMesh) continue;
      
      const { ring } = waveMesh;
      
      try {
        // Calculate radius based on time and wave speed with safety checks
        const radius = Math.max(
          ring.initialRadius, 
          ring.initialRadius + safeElapsedTime * ring.speed * 5
        );
        
        // Scale the ring with safety checks to prevent zero or negative scaling
        const safeRadius = Math.max(0.01, radius);
        mesh.scale.set(safeRadius, safeRadius, 1);
        
        // Fade out rings as they expand with improved visibility and safety bounds
        const maxRadius = Math.max(10, magnitude * 25); // Ensure minimum max radius
        const opacityRatio = radius / maxRadius;
        const opacity = Math.max(0, Math.min(1 - opacityRatio, 1)); // Clamp between 0 and 1
        
        // Add pulsing effect to make waves more noticeable with safety checks
        const pulseFrequency = isNaN(ring.pulseFrequency) ? 2 : ring.pulseFrequency;
        const pulseEffect = 0.2 * Math.sin(safeElapsedTime * pulseFrequency + index) + 0.8;
        
        // Update material properties with safety checks
        if (mesh.material instanceof MeshStandardMaterial) {
          const material = mesh.material;
          material.opacity = Math.max(0, Math.min(opacity * 0.9 * pulseEffect, 1)); // Clamp between 0 and 1
          material.emissiveIntensity = Math.max(0, Math.min(0.8 * pulseEffect, 1)); // Clamp between 0 and 1
        }
        
        // Add distinctive vertical oscillation for different wave types with safety checks
        if (ring.type === 's-wave') {
          // S-waves have more pronounced vertical oscillation (shear waves)
          const oscillationAmplitude = Math.min(0.15 * magnitude, 1.5); // Limit maximum oscillation
          mesh.position.y = Math.sin(safeElapsedTime * 6 + index) * oscillationAmplitude;
          // Add slight rotation for S-waves to show shearing motion
          mesh.rotation.x = Math.sin(safeElapsedTime * 3 + index) * 0.1;
        } else {
          // P-waves have less vertical movement (compression waves)
          const oscillationAmplitude = Math.min(0.05 * magnitude, 0.5); // Limit maximum oscillation
          mesh.position.y = 0.08 + Math.sin(safeElapsedTime * 8 + index) * oscillationAmplitude;
        }
      } catch (error) {
        console.error('Error updating wave mesh:', error);
        // If an error occurs, reset to safe values
        if (mesh.scale) mesh.scale.set(1, 1, 1);
        if (mesh.position) mesh.position.set(0, 0, 0);
        if (mesh.rotation) mesh.rotation.set(0, 0, 0);
      }
    }
  });
  
  // Safety check to ensure we have valid meshes to render
  const hasValidMeshes = waveMeshes && waveMeshes.length > 0;
  
  return (
    <group 
      ref={groupRef} 
      position={[validatedParams.epicenterX, 0, validatedParams.epicenterY]}
      rotation={[-Math.PI / 2, 0, 0]}
      visible={hasValidMeshes} // Only show if we have valid meshes
    >
      {hasValidMeshes && waveMeshes.map((waveMesh, index) => {
        // Additional safety check for each mesh
        if (!waveMesh || !waveMesh.geometry || !waveMesh.material || !waveMesh.ring) {
          return null;
        }
        
        // Ensure initial radius is valid
        const safeInitialRadius = Math.max(0.01, waveMesh.ring.initialRadius);
        
        return (
          <mesh 
            key={`wave-${index}`} 
            geometry={waveMesh.geometry}
            scale={[safeInitialRadius, safeInitialRadius, 1]}
          >
            <primitive object={waveMesh.material} attach="material" />
          </mesh>
        );
      })}
    </group>
  );
}