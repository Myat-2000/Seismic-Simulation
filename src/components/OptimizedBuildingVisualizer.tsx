import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Box, Text, Cylinder, Instance, Instances } from "@react-three/drei";
import * as THREE from "three";
import { BuildingParams } from "./BuildingParameterForm";
import { SeismicParams } from "./SeismicParameterForm";
import {
  optimizeMesh,
  isInViewFrustum,
  applyDistanceBasedLOD,
  throttle
} from "../utils/renderOptimization";

type OptimizedBuildingVisualizerProps = {
  buildingParams: BuildingParams;
  seismicParams: SeismicParams;
  elapsedTime: number;
};

// Material properties based on building material type
const getMaterialProperties = (materialType: string) => {
  switch (materialType) {
    case 'concrete':
      return {
        color: '#a0a0a0',
        roughness: 0.7,
        metalness: 0.1,
        name: 'Reinforced Concrete',
        beamColor: '#909090',
        columnColor: '#808080',
        slabColor: '#a8a8a8'
      };
    case 'steel':
      return {
        color: '#607d8b',
        roughness: 0.3,
        metalness: 0.8,
        name: 'Steel Frame',
        beamColor: '#546e7a',
        columnColor: '#455a64',
        slabColor: '#78909c'
      };
    case 'wood':
      return {
        color: '#8d6e63',
        roughness: 0.8,
        metalness: 0.0,
        name: 'Wood Frame',
        beamColor: '#795548',
        columnColor: '#6d4c41',
        slabColor: '#a1887f'
      };
    default:
      return {
        color: '#a0a0a0',
        roughness: 0.7,
        metalness: 0.1,
        name: 'Reinforced Concrete',
        beamColor: '#909090',
        columnColor: '#808080', 
        slabColor: '#a8a8a8'
      };
  }
};

// Calculate floor displacement based on height and seismic parameters
const calculateFloorDisplacement = (
  floorHeight: number,
  totalHeight: number,
  magnitude: number,
  elapsedTime: number,
  waveVelocity: number,
  stiffness: number,
  dampingRatio: number,
  hasFailed: boolean // Whether the structure has collapsed
) => {
  // Mode shape factor - taller buildings sway more at the top (enhanced effect)
  const modeShapeFactor = Math.pow(floorHeight / totalHeight, 1.3);
  
  // Increased base displacement amplitude based on magnitude
  const baseAmplitude = magnitude * 0.08 * (10 / stiffness);
  
  // If building has failed, increase amplitude dramatically to show collapse
  const collapseFactor = hasFailed ? 5.0 * Math.min(elapsedTime / 3, 1) : 1.0;
  
  // Time-dependent factor with damping - slower decay for visualization
  const damping = hasFailed ? 1.0 : Math.exp(-dampingRatio * elapsedTime * 1.5);
  
  // Multiple frequency components for more realistic shaking
  const primaryFreq = 1.0 + stiffness * 0.4 - totalHeight * 0.004;
  const secondaryFreq = primaryFreq * 1.4; // Higher frequency component
  
  // Add chaotic component for collapse
  const chaosFactor = hasFailed ? Math.sin(elapsedTime * 10 + floorHeight) * 0.5 : 0;
  
  // Calculate displacement in x and z directions with multiple wave components
  let xDisplacement = 
    baseAmplitude * modeShapeFactor * damping * (
      0.8 * Math.sin(elapsedTime * primaryFreq * 2) * Math.sin(elapsedTime * waveVelocity * 0.5) +
      0.2 * Math.sin(elapsedTime * secondaryFreq * 3) // Higher frequency component
    );
  
  let zDisplacement = 
    baseAmplitude * modeShapeFactor * damping * (
      0.8 * Math.cos(elapsedTime * primaryFreq * 2) * Math.sin(elapsedTime * waveVelocity * 0.5 + 0.4) +
      0.2 * Math.sin(elapsedTime * secondaryFreq * 3 + 0.7) // Higher frequency component with phase shift
    );
    
  // Apply collapse offset - increase with floor height to show progressive collapse
  if (hasFailed) {
    xDisplacement = xDisplacement * collapseFactor + chaosFactor * modeShapeFactor * 10;
    zDisplacement = zDisplacement * collapseFactor + chaosFactor * modeShapeFactor * 10;
  }
  
  return { x: xDisplacement, z: zDisplacement };
};

// Calculate damage factor for structural elements
const calculateDamage = (
  floorHeight: number,
  totalHeight: number,
  magnitude: number,
  stiffness: number,
  dampingRatio: number,
  materialType: string,
  elementType: 'column' | 'beam' | 'slab'
) => {
  // Base vulnerability by element type
  const typeVulnerability = {
    column: 1.0,  // columns are reference
    beam: 0.85,   // beams slightly less vulnerable
    slab: 0.7     // slabs least vulnerable
  };
  
  // Material vulnerability factor
  const materialFactor = materialType === 'concrete' ? 0.8 : 
                          materialType === 'steel' ? 1.0 : 1.3;
  
  // Height factor (higher elements experience more stress)
  const heightFactor = Math.pow(floorHeight / totalHeight, 0.7);
  
  // Structural properties factor
  const structuralFactor = (10 - stiffness) / 10 * (1 / (dampingRatio * 20));
  
  // Calculate damage (0-1 scale)
  const damage = magnitude * 0.08 * materialFactor * 
                 heightFactor * structuralFactor * typeVulnerability[elementType];
  
  return Math.min(Math.max(damage, 0), 1); // Clamp between 0-1
};

// Calculate if a building has collapsed based on damage values
const hasBuildingCollapsed = (
  magnitude: number,
  stiffness: number,
  dampingRatio: number,
  materialType: string,
  elapsedTime: number
) => {
  // Material vulnerability factor
  const materialFactor = materialType === 'concrete' ? 0.7 : 
                         materialType === 'steel' ? 0.8 : 1.3;
  
  // Structural integrity factor
  const structuralFactor = (10 - stiffness) / 10 * (1 / (dampingRatio * 15));
  
  // Calculate collapse risk (0-1)
  const collapseRisk = Math.min(1.0, (magnitude * 0.15 - 0.6) * materialFactor * structuralFactor);
  
  // Determine if building has collapsed based on risk and elapsed time
  // Buildings with high risk collapse sooner in the simulation
  const collapseThreshold = collapseRisk > 0 ? 4 + (1 - collapseRisk) * 15 : Infinity;
  
  return collapseRisk > 0.5 && elapsedTime > collapseThreshold;
};

// Get damaged material appearance with enhanced deformation visualization and improved color coding
const getDamagedMaterial = (
  baseMaterial: {color: string, roughness: number, metalness: number},
  damage: number,
  hasFailed: boolean
) => {
  // Convert base color hex to RGB
  const baseColor = new THREE.Color(baseMaterial.color);
  
  // If building has failed, intensify the damage appearance
  const effectiveDamage = hasFailed ? Math.min(1.0, damage * 1.5) : damage;
  
  // Enhanced color gradient based on damage level
  // Green (safe) -> Yellow (moderate) -> Orange (significant) -> Red (severe)
  if (effectiveDamage <= 0.3) {
    // Safe to moderate damage - green to yellow gradient
    const safeColor = new THREE.Color('#00cc00'); // Green
    const moderateColor = new THREE.Color('#ffcc00'); // Yellow
    const t = effectiveDamage / 0.3; // Normalized value for lerp
    baseColor.copy(safeColor).lerp(moderateColor, t);
  } else if (effectiveDamage <= 0.6) {
    // Moderate to significant damage - yellow to orange gradient
    const moderateColor = new THREE.Color('#ffcc00'); // Yellow
    const significantColor = new THREE.Color('#ff6600'); // Orange
    const t = (effectiveDamage - 0.3) / 0.3; // Normalized value for lerp
    baseColor.copy(moderateColor).lerp(significantColor, t);
  } else {
    // Significant to severe damage - orange to red gradient
    const significantColor = new THREE.Color('#ff6600'); // Orange
    const severeColor = new THREE.Color('#ff0000'); // Red
    const t = (effectiveDamage - 0.6) / 0.4; // Normalized value for lerp
    baseColor.copy(significantColor).lerp(severeColor, t);
  }
  
  // For concrete/wood, add cracks via emissive
  const emissiveIntensity = effectiveDamage > 0.4 ? (effectiveDamage - 0.4) * 0.5 : 0;
  const emissiveColor = new THREE.Color('#330000').multiplyScalar(emissiveIntensity);
  
  return {
    color: baseColor,
    roughness: baseMaterial.roughness + effectiveDamage * 0.2, // More damage = rougher surface
    metalness: Math.max(0, baseMaterial.metalness - effectiveDamage * 0.5), // Less metalness with damage
    emissive: emissiveColor
  };
};

// Instanced mesh component for columns
function InstancedColumns({
  columnPositions,
  columnDamages,
  columnRadius,
  floorHeight,
  material,
  hasFailed
}: {
  columnPositions: { x: number, y: number, z: number }[];
  columnDamages: number[];
  columnRadius: number;
  floorHeight: number;
  material: ReturnType<typeof getMaterialProperties>;
  hasFailed: boolean;
}) {
  const { camera } = useThree();
  const instancesRef = useRef<THREE.InstancedMesh>(null);
  
  // Create a reusable matrix for setting instance transforms
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  
  // Update instances on each frame
  useFrame(() => {
    if (!instancesRef.current) return;
    
    // Only update visible instances
    if (!isInViewFrustum(instancesRef.current, camera)) {
      instancesRef.current.visible = false;
      return;
    }
    instancesRef.current.visible = true;
    
    // Update each column instance
    columnPositions.forEach((pos, i) => {
      // Get damage for this column
      const damage = columnDamages[i];
      const damagedMaterial = getDamagedMaterial(
        { 
          color: material.columnColor, 
          roughness: material.roughness, 
          metalness: material.metalness 
        },
        damage,
        hasFailed
      );
      
      // Set color for this instance
      instancesRef.current?.setColorAt(i, damagedMaterial.color);
      
      // Set transform for this instance
      matrix.setPosition(pos.x, pos.y, pos.z);
      instancesRef.current?.setMatrixAt(i, matrix);
    });
    
    // Mark instance attributes as needing update
    instancesRef.current.instanceMatrix.needsUpdate = true;
    if (instancesRef.current.instanceColor) {
      instancesRef.current.instanceColor.needsUpdate = true;
    }
  });
  
  return (
    <instancedMesh 
      ref={instancesRef} 
      args={[undefined, undefined, columnPositions.length]}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={[columnRadius, columnRadius, floorHeight, 8]} />
      <meshStandardMaterial 
        color={material.columnColor}
        roughness={material.roughness}
        metalness={material.metalness}
      />
    </instancedMesh>
  );
}

// Instanced mesh component for beams
function InstancedBeams({
  beamPositions,
  beamRotations,
  beamScales,
  beamDamages,
  material,
  hasFailed
}: {
  beamPositions: { x: number, y: number, z: number }[];
  beamRotations: { x: number, y: number, z: number }[];
  beamScales: { x: number, y: number, z: number }[];
  beamDamages: number[];
  material: ReturnType<typeof getMaterialProperties>;
  hasFailed: boolean;
}) {
  const { camera } = useThree();
  const instancesRef = useRef<THREE.InstancedMesh>(null);
  
  // Create reusable objects for setting instance transforms
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const quaternion = useMemo(() => new THREE.Quaternion(), []);
  const position = useMemo(() => new THREE.Vector3(), []);
  const scale = useMemo(() => new THREE.Vector3(), []);
  
  // Update instances on each frame
  useFrame(() => {
    if (!instancesRef.current) return;
    
    // Only update visible instances
    if (!isInViewFrustum(instancesRef.current, camera)) {
      instancesRef.current.visible = false;
      return;
    }
    instancesRef.current.visible = true;
    
    // Update each beam instance
    beamPositions.forEach((pos, i) => {
      // Get damage for this beam
      const damage = beamDamages[i];
      const damagedMaterial = getDamagedMaterial(
        { 
          color: material.beamColor, 
          roughness: material.roughness, 
          metalness: material.metalness 
        },
        damage,
        hasFailed
      );
      
      // Set color for this instance
      instancesRef.current?.setColorAt(i, damagedMaterial.color);
      
      // Set transform for this instance
      const rot = beamRotations[i];
      const sc = beamScales[i];
      
      position.set(pos.x, pos.y, pos.z);
      quaternion.setFromEuler(new THREE.Euler(rot.x, rot.y, rot.z));
      scale.set(sc.x, sc.y, sc.z);
      
      matrix.compose(position, quaternion, scale);
      instancesRef.current?.setMatrixAt(i, matrix);
    });
    
    // Mark instance attributes as needing update
    instancesRef.current.instanceMatrix.needsUpdate = true;
    if (instancesRef.current.instanceColor) {
      instancesRef.current.instanceColor.needsUpdate = true;
    }
  });
  
  return (
    <instancedMesh 
      ref={instancesRef} 
      args={[undefined, undefined, beamPositions.length]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color={material.beamColor}
        roughness={material.roughness}
        metalness={material.metalness}
      />
    </instancedMesh>
  );
}

export default function OptimizedBuildingVisualizer({
  buildingParams,
  seismicParams,
  elapsedTime
}: OptimizedBuildingVisualizerProps) {
  const {
    height,
    width,
    depth,
    floors,
    stiffness,
    dampingRatio,
    materialType
  } = buildingParams;
  
  const { magnitude, waveVelocity } = seismicParams;
  const { camera } = useThree();
  
  // Material properties
  const material = getMaterialProperties(materialType);
  
  // Calculate dimensions
  const floorHeight = height / floors;
  
  // Memoize columnCount to prevent re-creation on each render
  const columnCount = useMemo(() => ({ 
    x: 3, 
    z: 3 
  }), []);
  
  // Memoize columnSpacing to prevent re-creation on each render
  const columnSpacing = useMemo(() => ({ 
    x: width / (columnCount.x - 1), 
    z: depth / (columnCount.z - 1) 
  }), [width, depth, columnCount]);
  
  const columnRadius = Math.min(width, depth) * 0.03;
  const beamHeight = floorHeight * 0.2;
  const beamWidth = columnRadius * 1.5;
  const slabThickness = floorHeight * 0.1;
  
  // Check if building has collapsed
  const buildingCollapsed = useMemo(() => {
    return hasBuildingCollapsed(
      magnitude,
      stiffness,
      dampingRatio,
      materialType,
      elapsedTime
    );
  }, [magnitude, stiffness, dampingRatio, materialType, elapsedTime]);
  
  // Generate column data for instanced rendering
  const { columnPositions, columnDamages } = useMemo(() => {
    const positions: { x: number, y: number, z: number }[] = [];
    const damages: number[] = [];
    
    // Create columns for each floor
    for (let floor = 0; floor < floors; floor++) {
      const y = floor * floorHeight;
      
      for (let x = 0; x < columnCount.x; x++) {
        for (let z = 0; z < columnCount.z; z++) {
          const xPos = -width/2 + x * columnSpacing.x;
          const zPos = -depth/2 + z * columnSpacing.z;
          
          // Calculate displacement for this floor
          const displacement = calculateFloorDisplacement(
            y, 
            height, 
            magnitude, 
            elapsedTime, 
            waveVelocity, 
            stiffness, 
            dampingRatio,
            buildingCollapsed
          );
          
          // Calculate damage for this column
          const damage = calculateDamage(
            y + floorHeight/2, 
            height, 
            magnitude, 
            stiffness, 
            dampingRatio, 
            materialType,
            'column'
          );
          
          // Add position with displacement
          positions.push({
            x: xPos + displacement.x,
            y: y + floorHeight/2,
            z: zPos + displacement.z
          });
          
          // Add damage value
          damages.push(damage);
        }
      }
    }
    
    return { columnPositions: positions, columnDamages: damages };
  }, [floors, floorHeight, width, depth, columnCount, columnSpacing, height, magnitude, elapsedTime, waveVelocity, stiffness, dampingRatio, materialType, buildingCollapsed]);
  
  // Generate beam data for instanced rendering
  const { beamPositionsX, beamRotationsX, beamScalesX, beamDamagesX, 
          beamPositionsZ, beamRotationsZ, beamScalesZ, beamDamagesZ } = useMemo(() => {
    const positionsX: { x: number, y: number, z: number }[] = [];
    const rotationsX: { x: number, y: number, z: number }[] = [];
    const scalesX: { x: number, y: number, z: number }[] = [];
    const damagesX: number[] = [];
    
    const positionsZ: { x: number, y: number, z: number }[] = [];
    const rotationsZ: { x: number, y: number, z: number }[] = [];
    const scalesZ: { x: number, y: number, z: number }[] = [];
    const damagesZ: number[] = [];
    
    // Create beams for each floor
    for (let floor = 0; floor < floors; floor++) {
      const y = (floor + 1) * floorHeight - beamHeight/2;
      
      // Calculate displacement for this floor
      const displacement = calculateFloorDisplacement(
        (floor + 1) * floorHeight, 
        height, 
        magnitude, 
        elapsedTime, 
        waveVelocity, 
        stiffness, 
        dampingRatio,
        buildingCollapsed
      );
      
      // X-direction beams
      for (let x = 0; x < columnCount.x; x++) {
        for (let z = 0; z < columnCount.z - 1; z++) {
          const xPos = -width/2 + x * columnSpacing.x;
          const zPos = -depth/2 + z * columnSpacing.z + columnSpacing.z/2;
          
          // Calculate damage for this beam
          const damage = calculateDamage(
            y, 
            height, 
            magnitude, 
            stiffness, 
            dampingRatio, 
            materialType,
            'beam'
          );
          
          // Add position with displacement
          positionsX.push({
            x: xPos + displacement.x,
            y: y,
            z: zPos + displacement.z
          });
          
          // Add rotation (no rotation for X beams)
          rotationsX.push({ x: 0, y: 0, z: 0 });
          
          // Add scale
          scalesX.push({
            x: beamWidth,
            y: beamHeight,
            z: columnSpacing.z
          });
          
          // Add damage value
          damagesX.push(damage);
        }
      }
      
      // Z-direction beams
      for (let x = 0; x < columnCount.x - 1; x++) {
        for (let z = 0; z < columnCount.z; z++) {
          const xPos = -width/2 + x * columnSpacing.x + columnSpacing.x/2;
          const zPos = -depth/2 + z * columnSpacing.z;
          
          // Calculate damage for this beam
          const damage = calculateDamage(
            y, 
            height, 
            magnitude, 
            stiffness, 
            dampingRatio, 
            materialType,
            'beam'
          );
          
          // Add position with displacement
          positionsZ.push({
            x: xPos + displacement.x,
            y: y,
            z: zPos + displacement.z
          });
          
          // Add rotation (90 degrees around Y for Z beams)
          rotationsZ.push({ x: 0, y: Math.PI / 2, z: 0 });
          
          // Add scale
          scalesZ.push({
            x: beamWidth,
            y: beamHeight,
            z: columnSpacing.x
          });
          
          // Add damage value
          damagesZ.push(damage);
        }
      }
    }
    
    return { 
      beamPositionsX: positionsX, beamRotationsX: rotationsX, beamScalesX: scalesX, beamDamagesX: damagesX,
      beamPositionsZ: positionsZ, beamRotationsZ: rotationsZ, beamScalesZ: scalesZ, beamDamagesZ: damagesZ
    };
  }, [floors, floorHeight, width, depth, columnCount, columnSpacing, beamHeight, beamWidth, height, magnitude, elapsedTime, waveVelocity, stiffness, dampingRatio, materialType, buildingCollapsed]);
  
  // Generate floor slabs with optimized rendering
  const floorSlabs = useMemo(() => {
    const slabs = [];
    
    // Create floor slabs
    for (let floor = 1; floor <= floors; floor++) {
      const y = floor * floorHeight - slabThickness/2;
      
      // Calculate displacement for this floor
      const displacement = calculateFloorDisplacement(
        floor * floorHeight, 
        height, 
        magnitude, 
        elapsedTime, 
        waveVelocity, 
        stiffness, 
        dampingRatio,
        buildingCollapsed
      );
      
      // Calculate damage for this slab
      const damage = calculateDamage(
        y, 
        height, 
        magnitude, 
        stiffness, 
        dampingRatio, 
        materialType,
        'slab'
      );
      
      // Get damaged material properties
      const damagedMaterial = getDamagedMaterial(
        { 
          color: material.slabColor, 
          roughness: material.roughness, 
          metalness: material.metalness 
        },
        damage,
        buildingCollapsed
      );
      
      slabs.push(
        <Box
          key={`slab-${floor}`}
          args={[width, slabThickness, depth]}
          position={[
            displacement.x,
            y,
            displacement.z
          ]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={damagedMaterial.color}
            roughness={damagedMaterial.roughness}
            metalness={damagedMaterial.metalness}
            emissive={damagedMaterial.emissive}
          />
        </Box>
      );
    }
    
    return slabs;
  }, [floors, floorHeight, width, depth, slabThickness, height, magnitude, elapsedTime, waveVelocity, stiffness, dampingRatio, materialType, material, buildingCollapsed]);
  
  // Define building base
  const buildingBase = useMemo(() => {
    return (
      <Box 
        args={[width + 5, 2, depth + 5]} 
        position={[0, -1, 0]}
        receiveShadow
      >
        <meshStandardMaterial 
          color="#444444" 
          roughness={0.8}
        />
      </Box>
    );
  }, [width, depth]);
  
  // Apply performance optimizations using the throttle utility
  const throttledOptimizeMesh = useMemo(() => throttle((mesh: THREE.Mesh) => {
    optimizeMesh(mesh, camera);
  }, 100), [camera]);
  
  // Apply optimizations to floor slabs
  useFrame(() => {
    // Apply LOD and frustum culling to floor slabs
    document.querySelectorAll('[data-floor-slab]').forEach((element) => {
      const mesh = (element as any).__r3f?.instance as THREE.Mesh;
      if (mesh) {
        throttledOptimizeMesh(mesh);
      }
    });
  });
  
  return (
    <group>
      {/* Building base */}
      {buildingBase}
      
      {/* Instanced columns */}
      <InstancedColumns
        columnPositions={columnPositions}
        columnDamages={columnDamages}
        columnRadius={columnRadius}
        floorHeight={floorHeight}
        material={material}
        hasFailed={buildingCollapsed}
      />
      
      {/* Instanced beams in X direction */}
      <InstancedBeams
        beamPositions={beamPositionsX}
        beamRotations={beamRotationsX}
        beamScales={beamScalesX}
        beamDamages={beamDamagesX}
        material={material}
        hasFailed={buildingCollapsed}
      />
      
      {/* Instanced beams in Z direction */}
      <InstancedBeams
        beamPositions={beamPositionsZ}
        beamRotations={beamRotationsZ}
        beamScales={beamScalesZ}
        beamDamages={beamDamagesZ}
        material={material}
        hasFailed={buildingCollapsed}
      />
      
      {/* Floor slabs */}
      {floorSlabs}
    </group>
  );
}