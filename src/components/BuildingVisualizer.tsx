import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Box, Text, Cylinder } from "@react-three/drei";
import * as THREE from "three";
import { BuildingParams } from "./BuildingParameterForm";
import { SeismicParams } from "./SeismicParameterForm";

type BuildingVisualizerProps = {
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

// Get damaged material appearance with enhanced deformation visualization
const getDamagedMaterial = (
  baseMaterial: {color: string, roughness: number, metalness: number},
  damage: number,
  hasFailed: boolean
) => {
  // Convert base color hex to RGB
  const baseColor = new THREE.Color(baseMaterial.color);
  
  // If building has failed, intensify the damage appearance
  const effectiveDamage = hasFailed ? Math.min(1.0, damage * 1.5) : damage;
  
  // For severe damage, add reddish tint
  if (effectiveDamage > 0.7) {
    const damageColor = new THREE.Color('#ff2000');
    baseColor.lerp(damageColor, (effectiveDamage - 0.7) * 3);
  }
  
  // For concrete/wood, add cracks via emissive
  const emissiveIntensity = effectiveDamage > 0.4 ? (effectiveDamage - 0.4) * 0.4 : 0;
  const emissiveColor = new THREE.Color('#330000').multiplyScalar(emissiveIntensity);
  
  return {
    color: baseColor,
    roughness: baseMaterial.roughness + effectiveDamage * 0.2, // More damage = rougher surface
    metalness: Math.max(0, baseMaterial.metalness - effectiveDamage * 0.5), // Less metalness with damage
    emissive: emissiveColor
  };
};

export default function BuildingVisualizer({
  buildingParams,
  seismicParams,
  elapsedTime
}: BuildingVisualizerProps) {
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
  
  // Material properties
  const material = getMaterialProperties(materialType);
  
  // Refs for building elements
  const floorRefs = useRef<THREE.Mesh[]>([]);
  const columnRefs = useRef<THREE.Mesh[][]>([]);
  const beamRefsX = useRef<THREE.Mesh[][]>([]);
  const beamRefsZ = useRef<THREE.Mesh[][]>([]);
  
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
  
  // Create columns
  const columns = useMemo(() => {
    const cols = [];
    
    // Initialize column refs array
    for (let floor = 0; floor < floors; floor++) {
      columnRefs.current[floor] = [];
    }
    
    // Create columns for each floor
    for (let floor = 0; floor < floors; floor++) {
      const y = floor * floorHeight;
      
      for (let x = 0; x < columnCount.x; x++) {
        for (let z = 0; z < columnCount.z; z++) {
          const xPos = -width/2 + x * columnSpacing.x;
          const zPos = -depth/2 + z * columnSpacing.z;
          const damage = calculateDamage(
            y + floorHeight/2, 
            height, 
            magnitude, 
            stiffness, 
            dampingRatio, 
            materialType,
            'column'
          );
          
          const damagedMaterial = getDamagedMaterial(
            { 
              color: material.columnColor, 
              roughness: material.roughness, 
              metalness: material.metalness 
            },
            damage,
            false
          );
          
          // Column index
          const colIndex = x * columnCount.z + z;
          
          cols.push(
            <Cylinder
              key={`column-${floor}-${x}-${z}`}
              args={[columnRadius, columnRadius, floorHeight, 8]}
              position={[xPos, y + floorHeight/2, zPos]}
              ref={(el: THREE.Mesh) => {
                if (el) columnRefs.current[floor][colIndex] = el;
              }}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial
                color={damagedMaterial.color}
                roughness={damagedMaterial.roughness}
                metalness={damagedMaterial.metalness}
                emissive={damagedMaterial.emissive}
              />
            </Cylinder>
          );
        }
      }
    }
    
    return cols;
  }, [floors, floorHeight, width, depth, columnCount, columnSpacing, material, magnitude, stiffness, dampingRatio, materialType, height, columnRadius]);
  
  // Create beams
  const beams = useMemo(() => {
    const beamElements = [];
    
    // Initialize beam refs arrays
    for (let floor = 0; floor < floors; floor++) {
      beamRefsX.current[floor] = [];
      beamRefsZ.current[floor] = [];
    }
    
    // Create beams for each floor
    for (let floor = 0; floor < floors; floor++) {
      const y = (floor + 1) * floorHeight - beamHeight/2;
      
      // X-direction beams
      for (let x = 0; x < columnCount.x; x++) {
        for (let z = 0; z < columnCount.z - 1; z++) {
          const xPos = -width/2 + x * columnSpacing.x;
          const zPos = -depth/2 + z * columnSpacing.z + columnSpacing.z/2;
          const damage = calculateDamage(
            y, 
            height, 
            magnitude, 
            stiffness, 
            dampingRatio, 
            materialType,
            'beam'
          );
          
          const damagedMaterial = getDamagedMaterial(
            { 
              color: material.beamColor, 
              roughness: material.roughness, 
              metalness: material.metalness 
            },
            damage,
            false
          );
          
          // Beam index
          const beamIndex = x * (columnCount.z - 1) + z;
          
          beamElements.push(
            <Box
              key={`beam-x-${floor}-${x}-${z}`}
              args={[beamWidth, beamHeight, columnSpacing.z]}
              position={[xPos, y, zPos]}
              ref={(el: THREE.Mesh) => {
                if (el) beamRefsX.current[floor][beamIndex] = el;
              }}
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
      }
      
      // Z-direction beams
      for (let x = 0; x < columnCount.x - 1; x++) {
        for (let z = 0; z < columnCount.z; z++) {
          const xPos = -width/2 + x * columnSpacing.x + columnSpacing.x/2;
          const zPos = -depth/2 + z * columnSpacing.z;
          const damage = calculateDamage(
            y, 
            height, 
            magnitude, 
            stiffness, 
            dampingRatio, 
            materialType,
            'beam'
          );
          
          const damagedMaterial = getDamagedMaterial(
            { 
              color: material.beamColor, 
              roughness: material.roughness, 
              metalness: material.metalness 
            },
            damage,
            false
          );
          
          // Beam index
          const beamIndex = x * columnCount.z + z;
          
          beamElements.push(
            <Box
              key={`beam-z-${floor}-${x}-${z}`}
              args={[columnSpacing.x, beamHeight, beamWidth]}
              position={[xPos, y, zPos]}
              ref={(el: THREE.Mesh) => {
                if (el) beamRefsZ.current[floor][beamIndex] = el;
              }}
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
      }
    }
    
    return beamElements;
  }, [floors, floorHeight, width, depth, columnCount, columnSpacing, material, magnitude, stiffness, dampingRatio, materialType, height, beamHeight, beamWidth]);
  
  // Create floor slabs
  const floorMeshes = useMemo(() => {
    const meshes = [];
    
    for (let i = 0; i < floors; i++) {
      const y = (i + 1) * floorHeight - slabThickness/2;
      const damage = calculateDamage(
        y, 
        height, 
        magnitude, 
        stiffness, 
        dampingRatio, 
        materialType,
        'slab'
      );
      
      const damagedMaterial = getDamagedMaterial(
        { 
          color: material.slabColor, 
          roughness: material.roughness, 
          metalness: material.metalness 
        },
        damage,
        false
      );
      
      // Floor slab
      meshes.push(
        <Box
          key={`floor-${i}`}
          ref={(el: THREE.Mesh) => {
            if (el) floorRefs.current[i] = el;
          }}
          args={[width, slabThickness, depth]}
          position={[0, y, 0]}
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
    
    return meshes;
  }, [floors, floorHeight, width, depth, slabThickness, material, magnitude, stiffness, dampingRatio, materialType, height]);
  
  // Calculate risk level based on building and seismic parameters
  const getRiskLevel = () => {
    // Structural vulnerability factor
    const vulnerabilityFactor = ((10 - stiffness) / 10) * (1 / dampingRatio) / 20;
    
    // Material factor (concrete is most resistant, wood least)
    const materialFactor = materialType === 'concrete' ? 0.8 : 
                          materialType === 'steel' ? 1.0 : 1.3;
    
    // Calculate overall risk score
    const riskScore = magnitude * vulnerabilityFactor * materialFactor;
    
    if (riskScore < 2) return { level: 'Low', color: 'green' };
    if (riskScore < 5) return { level: 'Moderate', color: 'yellow' };
    if (riskScore < 8) return { level: 'High', color: 'orange' };
    return { level: 'Severe', color: 'red' };
  };
  
  const risk = getRiskLevel();
  
  // Determine if building has collapsed
  const hasFailed = hasBuildingCollapsed(
    magnitude,
    stiffness,
    dampingRatio,
    materialType,
    elapsedTime
  );
  
  // Create deformation details for visualization
  const getDeformedGeometry = (damage: number) => {
    // Base deformation (undamaged = 0, collapsed = 1)
    const baseDeformation = hasFailed ? Math.min(1.0, elapsedTime / 5) : 0;
    
    // Combined damage factor
    const deformFactor = Math.max(damage * 0.5, baseDeformation);
    
    return {
      // Visual crack/bend effect
      crackFactor: deformFactor > 0.3 ? deformFactor : 0,
      // Visual bend/warp effect
      bendFactor: deformFactor > 0.2 ? deformFactor * 1.2 : 0,
      // Visual collapse effect
      collapseFactor: hasFailed ? Math.min(1.0, elapsedTime / 3) : 0
    };
  };
  
  // Animation for building displacement
  useFrame(() => {
    // Animate floor slabs
    for (let i = 0; i < floors; i++) {
      const floor = floorRefs.current[i];
      if (!floor) continue;
      
      const floorY = (i + 1) * floorHeight - slabThickness/2;
      const { x, z } = calculateFloorDisplacement(
        floorY,
        height,
        magnitude,
        elapsedTime,
        waveVelocity,
        stiffness,
        dampingRatio,
        hasFailed
      );
      
      // Calculate floor damage for visualization
      const floorDamage = calculateDamage(
        floorY,
        height,
        magnitude,
        stiffness,
        dampingRatio,
        materialType,
        'slab'
      );
      
      // Get deformation details for visualization
      const deformation = getDeformedGeometry(floorDamage);
      
      // Add vertical displacement with progressive collapse effect for failed buildings
      let verticalDisplacement = Math.sin(elapsedTime * 5 + i * 0.5) * magnitude * 0.02 * 
                                Math.min(1, floorY / height * 2); // More effect at higher floors
      
      // Add collapse effect - floors drop progressively from top to bottom
      if (hasFailed) {
        // Progressive collapse - higher floors collapse first and faster
        const progressiveFactor = (floors - i) / floors;
        const collapseOffset = -progressiveFactor * 
                              Math.pow(deformation.collapseFactor, 2) * 
                              Math.min(20, (i + 1) * 2); // Higher floors fall further
        verticalDisplacement += collapseOffset;
      }
      
      // Apply displacement to floor
      floor.position.x = x;
      floor.position.z = z;
      floor.position.y = floorY + verticalDisplacement;
      
      // Apply rotation deformation based on damage
      floor.rotation.y = x * 0.05 + deformation.bendFactor * Math.sin(i * 2.1) * 0.3;
      floor.rotation.x = deformation.bendFactor * Math.sin(i * 1.7) * 0.2;
      
      // Apply displacements to columns at this floor
      for (let colIdx = 0; colIdx < columnRefs.current[i].length; colIdx++) {
        const column = columnRefs.current[i][colIdx];
        if (!column) continue;
        
        // Calculate column damage for enhanced visualization
        const colX = colIdx % columnCount.x;
        const colZ = Math.floor(colIdx / columnCount.x);
        const xPos = -width/2 + colX * columnSpacing.x;
        const zPos = -depth/2 + colZ * columnSpacing.z;
        
        // Calculate column damage
        const columnDamage = calculateDamage(
          (i + 0.5) * floorHeight,
          height,
          magnitude,
          stiffness,
          dampingRatio,
          materialType,
          'column'
        );
        
        // Get deformation details
        const colDeformation = getDeformedGeometry(columnDamage);
        
        // Add variation to make columns deform differently
        const variationFactor = Math.sin(colIdx * 5.3 + i * 3.7) * 0.5 + 0.5;
        
        // Apply displacement with slight variation
        const displacementFactor = 0.9 + Math.sin(colIdx * 1.5) * 0.1;
        column.position.x = xPos + x * displacementFactor;
        column.position.z = zPos + z * displacementFactor;
        
        // Apply y position with potential collapse
        let yOffset = 0;
        if (hasFailed) {
          // Columns buckle and shift when building collapses
          yOffset = colDeformation.collapseFactor * variationFactor * -3;
          // Edge columns may lean outward during collapse
          if (colX === 0 || colX === columnCount.x - 1 || 
              colZ === 0 || colZ === columnCount.z - 1) {
            const edgeFactor = (colX === 0 ? -1 : (colX === columnCount.x - 1 ? 1 : 0)) * 2;
            const edgeFactorZ = (colZ === 0 ? -1 : (colZ === columnCount.z - 1 ? 1 : 0)) * 2;
            column.position.x += colDeformation.collapseFactor * edgeFactor * Math.min(3, magnitude);
            column.position.z += colDeformation.collapseFactor * edgeFactorZ * Math.min(3, magnitude);
          }
        }
        
        column.position.y = (i * floorHeight) + floorHeight/2 + verticalDisplacement + yOffset;
        
        // Apply enhanced column deformation - more bending for damaged columns
        column.rotation.z = -x * 0.2 - colDeformation.bendFactor * variationFactor * 0.8;
        column.rotation.x = z * 0.2 + colDeformation.bendFactor * variationFactor * 0.8;
        
        // Apply column scale deformation for buckling/crushing visualization
        if (columnDamage > 0.5 || hasFailed) {
          // Deform column shape to show buckling/crushing
          const bucklingFactor = hasFailed ? 0.3 * colDeformation.collapseFactor : 0;
          const heightReduction = hasFailed ? 0.2 * colDeformation.collapseFactor : 0;
          
          column.scale.set(
            1 + columnDamage * 0.1 + bucklingFactor * variationFactor, 
            1 - heightReduction * variationFactor,
            1 + columnDamage * 0.1 + bucklingFactor * variationFactor
          );
        }
      }
      
      // Apply displacements to beams at this floor
      // X-direction beams
      for (let beamIdx = 0; beamIdx < beamRefsX.current[i]?.length || 0; beamIdx++) {
        const beam = beamRefsX.current[i]?.[beamIdx];
        if (!beam) continue;
        
        // Calculate beam damage for enhanced visualization
        const beamDamage = calculateDamage(
          floorY,
          height,
          magnitude,
          stiffness,
          dampingRatio,
          materialType,
          'beam'
        );
        
        // Get deformation details
        const beamDeformation = getDeformedGeometry(beamDamage);
        
        // Calculate beam original position
        const beamX = Math.floor(beamIdx / (columnCount.z - 1));
        const beamZ = beamIdx % (columnCount.z - 1);
        const xPos = -width/2 + beamX * columnSpacing.x;
        const zPos = -depth/2 + beamZ * columnSpacing.z + columnSpacing.z/2;
        
        // Add variation to make beams deform differently
        const variationFactor = Math.sin(beamIdx * 4.5 + i * 2.3) * 0.5 + 0.5;
        
        // Apply displacement with bending effect
        beam.position.x = xPos + x;
        beam.position.z = zPos + z;
        beam.position.y = floorY + verticalDisplacement;
        
        // Apply enhanced beam deformation
        beam.rotation.z = -x * 0.25 - beamDeformation.bendFactor * variationFactor * 0.8;
        beam.rotation.x = z * 0.1 + beamDeformation.bendFactor * variationFactor * 0.4;
        
        // Apply beam scale deformation for sagging/cracking visualization
        if (beamDamage > 0.4 || hasFailed) {
          // Deform beam shape to show sagging/cracking
          const sagFactor = hasFailed ? 0.2 * beamDeformation.collapseFactor : 0;
          
          beam.scale.set(
            1, 
            1 - beamDamage * 0.1 - sagFactor * variationFactor, 
            1
          );
        }
      }
      
      // Z-direction beams (similar to X-direction beams)
      for (let beamIdx = 0; beamIdx < beamRefsZ.current[i]?.length || 0; beamIdx++) {
        const beam = beamRefsZ.current[i]?.[beamIdx];
        if (!beam) continue;
        
        // Calculate beam damage
        const beamDamage = calculateDamage(
          floorY,
          height,
          magnitude,
          stiffness,
          dampingRatio,
          materialType,
          'beam'
        );
        
        // Get deformation details
        const beamDeformation = getDeformedGeometry(beamDamage);
        
        // Calculate beam original position
        const beamX = Math.floor(beamIdx / columnCount.z);
        const beamZ = beamIdx % columnCount.z;
        const xPos = -width/2 + beamX * columnSpacing.x + columnSpacing.x/2;
        const zPos = -depth/2 + beamZ * columnSpacing.z;
        
        // Add variation
        const variationFactor = Math.sin(beamIdx * 3.7 + i * 1.9) * 0.5 + 0.5;
        
        // Apply displacement with bending effect
        beam.position.x = xPos + x;
        beam.position.z = zPos + z;
        beam.position.y = floorY + verticalDisplacement;
        
        // Apply enhanced beam deformation
        beam.rotation.x = z * 0.25 + beamDeformation.bendFactor * variationFactor * 0.8;
        beam.rotation.z = -x * 0.1 - beamDeformation.bendFactor * variationFactor * 0.4;
        
        // Apply beam scale deformation for sagging/cracking visualization
        if (beamDamage > 0.4 || hasFailed) {
          // Deform beam shape to show sagging/cracking
          const sagFactor = hasFailed ? 0.2 * beamDeformation.collapseFactor : 0;
          
          beam.scale.set(
            1, 
            1 - beamDamage * 0.1 - sagFactor * variationFactor, 
            1
          );
        }
      }
    }
  });
  
  // Determine status message and color based on collapse state
  const statusMessage = hasFailed ? "BUILDING COLLAPSE" : `Risk: ${risk.level}`;
  const statusColor = hasFailed ? "#ff0000" : risk.color;
  
  return (
    <group>
      {buildingBase}
      {floorMeshes}
      {columns}
      {beams}
      
      {/* Risk level or collapse indicator */}
      <Text
        position={[0, height + 5, 0]}
        fontSize={hasFailed ? 4 : 3}
        color={statusColor}
        anchorX="center"
        anchorY="middle"
      >
        {statusMessage}
      </Text>
      
      {/* Building info */}
      <Text
        position={[0, -5, 0]}
        fontSize={2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {`${material.name} - ${floors} floors`}
      </Text>
    </group>
  );
} 