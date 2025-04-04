import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SeismicParams } from "./SeismicParameterForm";

type WaveParticlesProps = {
  params: SeismicParams;
};

export default function WaveParticles({ params }: WaveParticlesProps) {
  const { magnitude, depth, epicenterX, epicenterY, waveVelocity } = params;
  const pointsRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  
  // Scale particle count based on magnitude
  const numParticles = Math.floor(magnitude * 800);
  
  // Create particle data
  const particleData = useMemo(() => {
    const positionsArray = new Float32Array(numParticles * 3);
    const colorsArray = new Float32Array(numParticles * 3);
    const sizesArray = new Float32Array(numParticles);
    
    for (let i = 0; i < numParticles; i++) {
      // Create particles in different patterns based on their index
      const particleType = i % 3; // 0: radial waves, 1: subsurface, 2: impact particles
      
      if (particleType === 0) {
        // Radial wave particles starting from epicenter
        const theta = Math.random() * Math.PI * 2;
        const radius = Math.random() * magnitude * 2.5;
        
        const x = epicenterX + Math.cos(theta) * radius;
        const z = epicenterY + Math.sin(theta) * radius;
        const y = -0.5 + Math.random() * 0.3; // Near ground level
        
        positionsArray[i * 3] = x;
        positionsArray[i * 3 + 1] = y;
        positionsArray[i * 3 + 2] = z;
        
        // Radial waves are reddish-orange
        colorsArray[i * 3] = 0.9 + Math.random() * 0.1; // Red
        colorsArray[i * 3 + 1] = 0.3 + Math.random() * 0.2; // Green
        colorsArray[i * 3 + 2] = 0.1; // Blue
        
        sizesArray[i] = 0.05 + Math.random() * 0.1 * magnitude;
      } 
      else if (particleType === 1) {
        // Subsurface particles
        const theta = Math.random() * Math.PI * 2;
        const radius = Math.random() * magnitude * 3;
        
        const x = epicenterX + Math.cos(theta) * radius;
        const z = epicenterY + Math.sin(theta) * radius;
        const y = -depth * Math.random() * 0.8; // Underground
        
        positionsArray[i * 3] = x;
        positionsArray[i * 3 + 1] = y;
        positionsArray[i * 3 + 2] = z;
        
        // Subsurface particles are yellow-orange
        colorsArray[i * 3] = 0.8; // Red
        colorsArray[i * 3 + 1] = 0.4 + Math.random() * 0.3; // Green
        colorsArray[i * 3 + 2] = 0.1; // Blue
        
        sizesArray[i] = 0.04 + Math.random() * 0.08 * magnitude;
      }
      else {
        // Impact particles that will appear around the building foundation
        const impact_radius = 20 + Math.random() * 10;
        const theta = Math.random() * Math.PI * 2;
        
        const x = Math.cos(theta) * impact_radius;
        const z = Math.sin(theta) * impact_radius;
        const y = -0.4 + Math.random() * 0.8; // Near the ground
        
        positionsArray[i * 3] = x;
        positionsArray[i * 3 + 1] = y;
        positionsArray[i * 3 + 2] = z;
        
        // Impact particles are more intense red
        colorsArray[i * 3] = 0.95; // Red
        colorsArray[i * 3 + 1] = 0.2 + Math.random() * 0.1; // Green
        colorsArray[i * 3 + 2] = 0.1; // Blue
        
        sizesArray[i] = 0.06 + Math.random() * 0.12 * magnitude;
      }
    }
    
    return { positionsArray, colorsArray, sizesArray };
  }, [numParticles, magnitude, depth, epicenterX, epicenterY]);
  
  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    
    timeRef.current += delta;
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const sizes = pointsRef.current.geometry.attributes.size.array as Float32Array;
    const colors = pointsRef.current.geometry.attributes.color.array as Float32Array;
    
    for (let i = 0; i < numParticles; i++) {
      const idx = i * 3;
      const x = positions[idx];
      const y = positions[idx + 1];
      const z = positions[idx + 2];
      const particleType = i % 3;
      
      if (particleType === 0) {
        // Radial wave particles - move outward from epicenter
        const distToEpicenter = Math.sqrt(
          Math.pow(x - epicenterX, 2) + 
          Math.pow(z - epicenterY, 2)
        );
        
        // Seismic wave propagation - vertical oscillation
        const waveOffset = Math.sin(
          (distToEpicenter - timeRef.current * waveVelocity * 5) * (magnitude / 3)
        ) * 0.2 * magnitude;
        
        positions[idx + 1] = y + waveOffset;
        
        // Adjust size with pulsing effect
        sizes[i] = (0.05 + Math.random() * 0.1 * magnitude) * 
                 (1 + 0.4 * Math.sin(timeRef.current * 5 + i));
        
        // Fade out particles that have traveled far
        const radiusFade = Math.max(0, 1 - distToEpicenter / (magnitude * 8));
        colors[idx + 1] = 0.3 + Math.random() * 0.2 + radiusFade * 0.2; // Adjust green component
      } 
      else if (particleType === 1) {
        // Subsurface particles - rise up over time
        const distToEpicenter = Math.sqrt(
          Math.pow(x - epicenterX, 2) + 
          Math.pow(z - epicenterY, 2)
        );
        
        // Calculate wave phase based on distance and time
        const phase = (distToEpicenter - timeRef.current * waveVelocity * 3);
        
        // Vertical oscillation
        const waveOffset = Math.sin(phase * 0.5) * 0.15 * magnitude;
        
        // Move particles upward slowly if they're within the active wave zone
        const activeWaveZone = Math.abs(phase % (Math.PI * 2)) < Math.PI;
        const upwardMovement = activeWaveZone ? delta * magnitude * 0.3 : 0;
        
        positions[idx + 1] = Math.min(y + upwardMovement + waveOffset, 0);
        
        // Fade out particles that reach the surface
        if (positions[idx + 1] > -0.5) {
          colors[idx] *= 0.99; // Fade red
          colors[idx + 1] *= 0.99; // Fade green
        }
        
        // Adjust size with phase
        sizes[i] = (0.04 + Math.random() * 0.08 * magnitude) * 
                 (1 + 0.3 * Math.sin(timeRef.current * 3 + i));
      }
      else {
        // Impact particles - oscillate around the building foundation
        const distToCenter = Math.sqrt(x * x + z * z);
        
        // Calculate oscillation based on time
        const oscillationY = Math.sin(timeRef.current * 2 + distToCenter * 0.2) * 0.3 * magnitude;
        
        // Apply oscillation
        positions[idx + 1] = -0.4 + oscillationY;
        
        // Pulse size with oscillation
        sizes[i] = (0.06 + Math.random() * 0.12 * magnitude) * 
                 (1 + 0.5 * Math.sin(timeRef.current * 4 + i));
      }
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.size.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={numParticles}
          array={particleData.positionsArray}
          itemSize={3}
          args={[particleData.positionsArray, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={numParticles}
          array={particleData.colorsArray}
          itemSize={3}
          args={[particleData.colorsArray, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          count={numParticles}
          array={particleData.sizesArray}
          itemSize={1}
          args={[particleData.sizesArray, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
} 