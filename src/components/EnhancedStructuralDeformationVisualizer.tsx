import { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { DetailedBuildingParams } from './StructuralComponentAnalysis';
import { ElementInteraction, InteractionAnalysisResult } from './StructuralElementInteraction';
import { applyDistanceBasedLOD, isInViewFrustum } from '../utils/renderOptimization';
import { StructuralMaterialsParams } from './StructuralMaterialsForm';

type ElementType = 'column' | 'beam' | 'slab' | 'foundation';

type SelectedElement = {
  type: ElementType;
  id: number;
};

type StructuralElement = {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  color: THREE.Color;
  type: ElementType;
  id: number;
  isSelected: boolean;
  stress: number;
};

type EnhancedDeformationVisualizerProps = {
  buildingParams: DetailedBuildingParams;
  materialsParams?: StructuralMaterialsParams;
  elementInteractions: ElementInteraction[];
  analysisResults: InteractionAnalysisResult[];
  selectedElement?: SelectedElement;
  showStressColors: boolean;
  showDeformation: boolean;
  deformationScale: number;
  onElementSelect?: (element: SelectedElement) => void;
  seismicIntensity?: number; // Added to factor in seismic intensity for deformation
};

// Color scale for stress visualization
const getStressColor = (stress: number, maxStress: number): THREE.Color => {
  // Prevent division by zero
  if (maxStress === 0) return new THREE.Color(0x0000ff); // Default blue for zero stress
  
  // Color gradient: Blue (low stress) -> Green -> Yellow -> Red (high stress)
  const t = Math.min(stress / maxStress, 1);
  
  if (t <= 0.33) {
    return new THREE.Color().setHSL(0.6, 1, 0.5).lerp(
      new THREE.Color().setHSL(0.3, 1, 0.5),
      t * 3
    );
  } else if (t <= 0.66) {
    return new THREE.Color().setHSL(0.3, 1, 0.5).lerp(
      new THREE.Color().setHSL(0.15, 1, 0.5),
      (t - 0.33) * 3
    );
  } else {
    return new THREE.Color().setHSL(0.15, 1, 0.5).lerp(
      new THREE.Color().setHSL(0, 1, 0.5),
      (t - 0.66) * 3
    );
  }
};

// Calculate deformed position based on analysis results
const calculateDeformedPosition = (
  originalPosition: THREE.Vector3,
  deformation: {
    displacement: number;
    rotation: number;
  },
  scale: number
): THREE.Vector3 => {
  // Create a new vector to avoid modifying the original
  const deformed = originalPosition.clone();
  
  // Apply displacement with safety checks
  if (deformation && typeof deformation.displacement === 'number' && typeof deformation.rotation === 'number') {
    deformed.add(
      new THREE.Vector3(
        Math.sin(deformation.rotation) * deformation.displacement * scale,
        Math.cos(deformation.rotation) * deformation.displacement * scale,
        0
      )
    );
  }
  
  return deformed;
};

function StructuralVisualization({
  buildingParams,
  materialsParams,
  elementInteractions,
  analysisResults,
  selectedElement,
  showStressColors = true,
  showDeformation = true,
  deformationScale = 1.0,
  onElementSelect,
  seismicIntensity = 1.0
}: EnhancedDeformationVisualizerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredElement, setHoveredElement] = useState<SelectedElement | null>(null);
  const { camera } = useThree();

  // useFrame hook is now safely inside the Canvas component
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    
    // Apply subtle animation to selected element for emphasis
    if (selectedElement) {
      const selectedMesh = groupRef.current.children.find(
        child => child instanceof THREE.Mesh &&
        child.userData.type === selectedElement.type &&
        child.userData.id === selectedElement.id
      ) as THREE.Mesh | undefined;
      
      if (selectedMesh) {
        const pulseScale = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.05;
        selectedMesh.scale.setScalar(pulseScale);
      }
    }
  });

  // Generate geometry instances for each structural element
  const elements = useMemo(() => {
    const elements: StructuralElement[] = [];
    
    // Create a default column if no structural components exist
    if (!buildingParams.structuralComponents) {
      elements.push({
        position: new THREE.Vector3(0, 5, 0),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(1, 10, 1),
        color: new THREE.Color('#808080'),
        type: 'column',
        id: 1,
        isSelected: false,
        stress: 0
      });
      
      // Add a beam
      elements.push({
        position: new THREE.Vector3(5, 9.5, 0),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(10, 1, 1),
        color: new THREE.Color('#909090'),
        type: 'beam',
        id: 1,
        isSelected: false,
        stress: 0
      });
      
      // Add a slab
      elements.push({
        position: new THREE.Vector3(0, 10, 0),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(10, 0.5, 10),
        color: new THREE.Color('#a8a8a8'),
        type: 'slab',
        id: 1,
        isSelected: false,
        stress: 0
      });
      
      // Add a foundation
      elements.push({
        position: new THREE.Vector3(0, -1, 0),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(12, 2, 12),
        color: new THREE.Color('#606060'),
        type: 'foundation',
        id: 1,
        isSelected: false,
        stress: 0
      });
      
      return elements;
    }
    
    // Process columns
    if (buildingParams.structuralComponents?.columns) {
      // If it's an object with properties
      if (typeof buildingParams.structuralComponents.columns === 'object' && !Array.isArray(buildingParams.structuralComponents.columns)) {
        const column = buildingParams.structuralComponents.columns;
        elements.push({
          position: new THREE.Vector3(0, 5, 0),
          rotation: new THREE.Euler(0, 0, 0),
          scale: new THREE.Vector3(column.width || 1, 10, column.width || 1),
          color: showStressColors ? getStressColor(0.5, 1) : new THREE.Color('#808080'),
          type: 'column',
          id: 1,
          isSelected: selectedElement?.type === 'column' && selectedElement?.id === 1,
          stress: 0.5
        });
      }
    }
    
    // Process beams
    if (buildingParams.structuralComponents?.beams) {
      // If it's an object with properties
      if (typeof buildingParams.structuralComponents.beams === 'object' && !Array.isArray(buildingParams.structuralComponents.beams)) {
        const beam = buildingParams.structuralComponents.beams;
        elements.push({
          position: new THREE.Vector3(5, 9.5, 0),
          rotation: new THREE.Euler(0, 0, 0),
          scale: new THREE.Vector3(10, beam.depth || 0.5, beam.width || 0.3),
          color: showStressColors ? getStressColor(0.6, 1) : new THREE.Color('#909090'),
          type: 'beam',
          id: 1,
          isSelected: selectedElement?.type === 'beam' && selectedElement?.id === 1,
          stress: 0.6
        });
      }
    }
    
    // Process slabs
    if (buildingParams.structuralComponents?.slabs) {
      // If it's an object with properties
      if (typeof buildingParams.structuralComponents.slabs === 'object' && !Array.isArray(buildingParams.structuralComponents.slabs)) {
        const slab = buildingParams.structuralComponents.slabs;
        elements.push({
          position: new THREE.Vector3(0, 10, 0),
          rotation: new THREE.Euler(0, 0, 0),
          scale: new THREE.Vector3(10, slab.thickness || 0.2, 10),
          color: showStressColors ? getStressColor(0.4, 1) : new THREE.Color('#a8a8a8'),
          type: 'slab',
          id: 1,
          isSelected: selectedElement?.type === 'slab' && selectedElement?.id === 1,
          stress: 0.4
        });
      }
    }
    
    // Process foundation
    if (buildingParams.structuralComponents?.foundation) {
      // If it's an object with properties
      if (typeof buildingParams.structuralComponents.foundation === 'object' && !Array.isArray(buildingParams.structuralComponents.foundation)) {
        const foundation = buildingParams.structuralComponents.foundation;
        elements.push({
          position: new THREE.Vector3(0, -1, 0),
          rotation: new THREE.Euler(0, 0, 0),
          scale: new THREE.Vector3(12, foundation.depth || 2, 12),
          color: showStressColors ? getStressColor(0.3, 1) : new THREE.Color('#606060'),
          type: 'foundation',
          id: 1,
          isSelected: selectedElement?.type === 'foundation' && selectedElement?.id === 1,
          stress: 0.3
        });
      }
    }
    
    return elements;
  }, [buildingParams, showStressColors, selectedElement]);
  
  // Apply deformation to elements if enabled
  const deformedElements = useMemo(() => {
    if (!showDeformation || !elements) return elements;
    
    return elements.map(element => {
      // Calculate deformation based on seismic intensity and element type
      const deformation = {
        displacement: 0.5 * seismicIntensity,
        rotation: 0.1 * seismicIntensity
      };
      
      // Apply material-specific deformation factors
      let materialFactor = 1.0;
      
      // Apply seismic intensity to deformation
      const totalDeformationFactor = materialFactor * deformationScale * seismicIntensity;
      
      // Apply deformation to position and rotation
      return {
        ...element,
        position: calculateDeformedPosition(element.position, deformation, totalDeformationFactor),
        rotation: new THREE.Euler(
          element.rotation.x,
          element.rotation.y,
          element.rotation.z + deformation.rotation * totalDeformationFactor * 0.2
        )
      };
    });
  }, [elements, showDeformation, deformationScale, seismicIntensity]);

  // Handle element hover and selection
  const handleElementHover = useCallback((element: SelectedElement | null) => {
    setHoveredElement(element);
  }, []);
  
  const handleElementClick = useCallback((element: SelectedElement) => {
    if (onElementSelect) {
      onElementSelect(element);
    }
  }, [onElementSelect]);

  // Render the structural elements
  return (
    <group ref={groupRef}>
      {deformedElements?.map((element, index) => {
        // Determine if this element should be highlighted
        const isHighlighted = element.isSelected;
        const isHovered = hoveredElement?.type === element.type && hoveredElement?.id === element.id;
        
        // Apply visual enhancements for selected/hovered elements
        const elementColor = isHighlighted 
          ? new THREE.Color(0xffcc00) // Highlight color for selected elements
          : isHovered 
            ? new THREE.Color().copy(element.color).lerp(new THREE.Color(0xffffff), 0.3) // Lighten on hover
            : element.color;
        
        // Apply opacity based on selection state (if an element is selected, fade others)
        const opacity = selectedElement && !isHighlighted ? 0.4 : 1.0;
        
        return (
          <mesh
            key={`${element.type}-${element.id}-${index}`}
            position={element.position}
            rotation={element.rotation}
            scale={element.scale}
            userData={{ type: element.type, id: element.id, stress: element.stress }}
            onPointerOver={() => handleElementHover({ type: element.type, id: element.id })}
            onPointerOut={() => handleElementHover(null)}
            onClick={() => handleElementClick({ type: element.type, id: element.id })}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial 
              color={elementColor} 
              transparent={opacity < 1}
              opacity={opacity}
              emissive={isHighlighted ? new THREE.Color(0x333300) : undefined}
              emissiveIntensity={isHighlighted ? 0.5 : 0}
              roughness={0.7}
              metalness={0.2}
            />
            
            {/* Add outline effect for selected elements */}
            {isHighlighted && (
              <lineSegments>
                <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(1.02, 1.02, 1.02)]} />
                <lineBasicMaterial 
                  attach="material" 
                  color={0xffcc00} 
                  linewidth={2}
                />
              </lineSegments>
            )}
          </mesh>
        );
      })}
    </group>
  );
}

export default function EnhancedStructuralDeformationVisualizer(props: EnhancedDeformationVisualizerProps) {
  return (
    <Canvas
      camera={{ position: [10, 10, 10], fov: 50 }}
      shadows
    >
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 5, 5]}
        castShadow
        intensity={1}
        shadow-mapSize={[1024, 1024]}
      />
      <StructuralVisualization {...props} />
      <OrbitControls enableDamping />
      <Grid infiniteGrid />
    </Canvas>
  );
  
  // Memoize maximum stress value for color scaling, adjusted by material properties
  const maxStress = useMemo(() => {
    if (!analysisResults || analysisResults.length === 0) return 1;
    
    // Get base max stress
    const baseMaxStress = Math.max(...analysisResults.map(result => result.stressConcentration || 0));
    
    // Apply material-specific stress factors
    let stressFactor = 1.0;
    if (materialsParams) {
      const activeMaterial = materialsParams.activeMaterial;
      
      switch (activeMaterial) {
        case 'concrete':
          // Higher compressive strength can handle more stress
          stressFactor = materialsParams.concrete.compressiveStrength / 30;
          break;
        case 'steel':
          // Higher yield strength can handle more stress
          stressFactor = materialsParams.steel.yieldStrength / 350;
          break;
        case 'wood':
          // Higher bending strength can handle more stress
          stressFactor = materialsParams.wood.bendingStrength / 20;
          break;
      }
    }
    
    // Apply structural element properties to stress capacity
    if (buildingParams.structuralComponents) {
      // Factor in column properties for overall stress capacity
      if (buildingParams.structuralComponents.columns) {
        if (buildingParams.structuralComponents.columns.reinforcement === 'heavy') {
          stressFactor *= 1.2; // Heavy reinforcement increases stress capacity
        } else if (buildingParams.structuralComponents.columns.reinforcement === 'light') {
          stressFactor *= 0.8; // Light reinforcement decreases stress capacity
        }
      }
    }
    
    return baseMaxStress * stressFactor;
  }, [analysisResults, materialsParams, buildingParams]);
  
  // Generate geometry instances for each structural element
  const elements = useMemo(() => {
    const elements: StructuralElement[] = [];
    
    // Process columns
    if (buildingParams.structuralComponents?.columns) {
      Object.entries(buildingParams.structuralComponents.columns).forEach(([id, column]) => {
        const columnId = parseInt(id);
        const analysisResult = analysisResults.find(result => 
          result.loadDistribution && 
          elementInteractions.some(interaction => 
            (interaction.sourceElement.type === 'column' && interaction.sourceElement.id === columnId) ||
            (interaction.targetElement.type === 'column' && interaction.targetElement.id === columnId)
          )
        );
        
        const stress = analysisResult ? analysisResult.stressConcentration : 0;
        const isSelected = selectedElement?.type === 'column' && selectedElement?.id === columnId;
        
        // Create column visualization
        elements.push({
          position: new THREE.Vector3(0, column.height / 2, 0),
          rotation: new THREE.Euler(0, 0, 0),
          scale: new THREE.Vector3(column.width, column.height, column.width),
          color: showStressColors ? getStressColor(stress, maxStress) : new THREE.Color('#808080'),
          type: 'column',
          id: columnId,
          isSelected,
          stress
        });
      });
    }
    
    // Process beams
    if (buildingParams.structuralComponents?.beams) {
      Object.entries(buildingParams.structuralComponents.beams).forEach(([id, beam]) => {
        const beamId = parseInt(id);
        const analysisResult = analysisResults.find(result => 
          result.loadDistribution && 
          elementInteractions.some(interaction => 
            (interaction.sourceElement.type === 'beam' && interaction.sourceElement.id === beamId) ||
            (interaction.targetElement.type === 'beam' && interaction.targetElement.id === beamId)
          )
        );
        
        const stress = analysisResult ? analysisResult.stressConcentration : 0;
        const isSelected = selectedElement?.type === 'beam' && selectedElement?.id === beamId;
        
        // Create beam visualization
        elements.push({
          position: new THREE.Vector3(beam.length / 2, beam.floorLevel, 0),
          rotation: new THREE.Euler(0, 0, 0),
          scale: new THREE.Vector3(beam.length, beam.depth, beam.width),
          color: showStressColors ? getStressColor(stress, maxStress) : new THREE.Color('#909090'),
          type: 'beam',
          id: beamId,
          isSelected,
          stress
        });
      });
    }
    
    // Process slabs
    if (buildingParams.structuralComponents?.slabs) {
      Object.entries(buildingParams.structuralComponents.slabs).forEach(([id, slab]) => {
        const slabId = parseInt(id);
        const analysisResult = analysisResults.find(result => 
          result.loadDistribution && 
          elementInteractions.some(interaction => 
            (interaction.sourceElement.type === 'slab' && interaction.sourceElement.id === slabId) ||
            (interaction.targetElement.type === 'slab' && interaction.targetElement.id === slabId)
          )
        );
        
        const stress = analysisResult ? analysisResult.stressConcentration : 0;
        const isSelected = selectedElement?.type === 'slab' && selectedElement?.id === slabId;
        
        // Create slab visualization
        elements.push({
          position: new THREE.Vector3(0, slab.floorLevel, 0),
          rotation: new THREE.Euler(0, 0, 0),
          scale: new THREE.Vector3(slab.width, slab.thickness, slab.depth),
          color: showStressColors ? getStressColor(stress, maxStress) : new THREE.Color('#a8a8a8'),
          type: 'slab',
          id: slabId,
          isSelected,
          stress
        });
      });
    }
    
    // Process foundation
    if (buildingParams.structuralComponents?.foundation) {
      Object.entries(buildingParams.structuralComponents.foundation).forEach(([id, foundation]) => {
        const foundationId = parseInt(id);
        const analysisResult = analysisResults.find(result => 
          result.loadDistribution && 
          elementInteractions.some(interaction => 
            (interaction.sourceElement.type === 'foundation' && interaction.sourceElement.id === foundationId) ||
            (interaction.targetElement.type === 'foundation' && interaction.targetElement.id === foundationId)
          )
        );
        
        const stress = analysisResult ? analysisResult.stressConcentration : 0;
        const isSelected = selectedElement?.type === 'foundation' && selectedElement?.id === foundationId;
        
        // Create foundation visualization
        elements.push({
          position: new THREE.Vector3(0, -foundation.depth / 2, 0),
          rotation: new THREE.Euler(0, 0, 0),
          scale: new THREE.Vector3(foundation.width, foundation.depth, foundation.length),
          color: showStressColors ? getStressColor(stress, maxStress) : new THREE.Color('#606060'),
          type: 'foundation',
          id: foundationId,
          isSelected,
          stress
        });
      });
    }
    
    return elements;
  }, [buildingParams, elementInteractions, analysisResults, maxStress, showStressColors, selectedElement]);
  
  // Apply deformation to elements if enabled
  const deformedElements = useMemo(() => {
    if (!showDeformation || !elements) return elements;
    
    return elements.map(element => {
      const analysisResult = analysisResults.find(result => 
        elementInteractions.some(interaction => 
          (interaction.sourceElement.type === element.type && interaction.sourceElement.id === element.id) ||
          (interaction.targetElement.type === element.type && interaction.targetElement.id === element.id)
        )
      );
      
      if (!analysisResult) return element;
      
      // Calculate deformation
      const deformation = {
        displacement: analysisResult.relativeDisplacement,
        rotation: analysisResult.jointRotation
      };
      
      // Apply material-specific deformation factors
      let materialFactor = 1.0;
      if (materialsParams) {
        const activeMaterial = materialsParams.activeMaterial;
        
        // Different materials respond differently to deformation
        switch (activeMaterial) {
          case 'concrete':
            // Concrete with higher elastic modulus deforms less
            materialFactor = 1.0 / (materialsParams.concrete.elasticModulus / 25);
            // Reinforcement type affects deformation
            if (materialsParams.concrete.reinforcementType === 'high-strength') {
              materialFactor *= 0.8; // Less deformation with high-strength reinforcement
            } else if (materialsParams.concrete.reinforcementType === 'fiber-reinforced') {
              materialFactor *= 0.7; // Even less deformation with fiber reinforcement
            }
            break;
          case 'steel':
            // Steel with higher elastic modulus deforms less
            materialFactor = 1.0 / (materialsParams.steel.elasticModulus / 200);
            // Connection type affects deformation
            if (materialsParams.steel.connectionType === 'bolted') {
              materialFactor *= 1.2; // More deformation with bolted connections
            } else if (materialsParams.steel.connectionType === 'riveted') {
              materialFactor *= 1.1; // Slightly more deformation with riveted
            }
            break;
          case 'wood':
            // Wood with higher elastic modulus deforms less
            materialFactor = 1.0 / (materialsParams.wood.elasticModulus / 10);
            // Wood grade affects deformation
            if (materialsParams.wood.gradeType === 'construction') {
              materialFactor *= 1.3; // More deformation with construction grade
            } else if (materialsParams.wood.gradeType === 'premium') {
              materialFactor *= 0.9; // Less deformation with premium grade
            }
            break;
        }
      }
      
      // Apply structural element properties to deformation
      if (buildingParams.structuralComponents) {
        if (element.type === 'column' && buildingParams.structuralComponents.columns) {
          // Columns with more reinforcement deform less
          if (buildingParams.structuralComponents.columns.reinforcement === 'heavy') {
            materialFactor *= 0.7;
          } else if (buildingParams.structuralComponents.columns.reinforcement === 'light') {
            materialFactor *= 1.3;
          }
          
          // Connection type affects deformation
          if (buildingParams.structuralComponents.columns.connectionType === 'pinned') {
            materialFactor *= 1.5; // Pinned connections allow more movement
          } else if (buildingParams.structuralComponents.columns.connectionType === 'semi-rigid') {
            materialFactor *= 1.2;
          }
        } else if (element.type === 'beam' && buildingParams.structuralComponents.beams) {
          // Similar factors for beams
          if (buildingParams.structuralComponents.beams.reinforcement === 'heavy') {
            materialFactor *= 0.8;
          } else if (buildingParams.structuralComponents.beams.reinforcement === 'light') {
            materialFactor *= 1.2;
          }
        }
      }
      
      // Apply seismic intensity to deformation
      const totalDeformationFactor = materialFactor * deformationScale * seismicIntensity;
      
      // Apply deformation to position and rotation
      return {
        ...element,
        position: calculateDeformedPosition(element.position, deformation, totalDeformationFactor),
        rotation: new THREE.Euler(
          element.rotation.x,
          element.rotation.y,
          element.rotation.z + deformation.rotation * totalDeformationFactor * 0.2
        )
      };
    });
  }, [elements, showDeformation, deformationScale, analysisResults, elementInteractions, materialsParams, buildingParams, seismicIntensity]);
  
  // Get available elements for selection
  const availableElements = useMemo(() => {
    const available = {
      columns: [] as number[],
      beams: [] as number[],
      slabs: [] as number[],
      foundations: [] as number[]
    };
    
    if (elements) {
      elements.forEach(element => {
        const type = `${element.type}s` as keyof typeof available;
        if (available[type]) {
          available[type].push(element.id);
        }
      });
    }
    
    return available;
  }, [elements]);
  
  // Handle element hover and selection
  const handleElementHover = useCallback((element: SelectedElement | null) => {
    setHoveredElement(element);
  }, []);
  
  const handleElementClick = useCallback((element: SelectedElement) => {
    if (onElementSelect) {
      onElementSelect(element);
    }
  }, [onElementSelect]);
  
  // Animation and rendering optimizations
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    
    // Apply subtle animation to selected element for emphasis
    if (selectedElement) {
      const selectedMesh = groupRef.current.children.find(child => {
        const userData = (child as THREE.Mesh).userData;
        return userData.type === selectedElement.type && userData.id === selectedElement.id;
      });
      
      if (selectedMesh) {
        // Pulse animation for selected element using clock for consistent timing
        const time = clock.getElapsedTime();
        const scale = 1.0 + Math.sin(time * 3) * 0.05; // Subtle pulsing effect
        
        // Reset scale first to prevent compounding scale effects
        selectedMesh.scale.setScalar(1.0);
        selectedMesh.scale.multiplyScalar(scale);
      }
    }
  });
  
  // Render the structural elements
  return (
    <group ref={groupRef}>
      {deformedElements?.map((element, index) => {
        // Determine if this element should be highlighted
        const isHighlighted = element.isSelected;
        const isHovered = hoveredElement?.type === element.type && hoveredElement?.id === element.id;
        
        // Apply visual enhancements for selected/hovered elements
        const elementColor = isHighlighted 
          ? new THREE.Color(0xffcc00) // Highlight color for selected elements
          : isHovered 
            ? new THREE.Color().copy(element.color).lerp(new THREE.Color(0xffffff), 0.3) // Lighten on hover
            : element.color;
        
        // Apply opacity based on selection state (if an element is selected, fade others)
        const opacity = selectedElement && !isHighlighted ? 0.4 : 1.0;
        
        return (
          <mesh
            key={`${element.type}-${element.id}-${index}`}
            position={element.position}
            rotation={element.rotation}
            scale={element.scale}
            userData={{ type: element.type, id: element.id, stress: element.stress }}
            onPointerOver={() => handleElementHover({ type: element.type, id: element.id })}
            onPointerOut={() => handleElementHover(null)}
            onClick={() => handleElementClick({ type: element.type, id: element.id })}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial 
              color={elementColor} 
              transparent={opacity < 1}
              opacity={opacity}
              emissive={isHighlighted ? new THREE.Color(0x333300) : undefined}
              emissiveIntensity={isHighlighted ? 0.5 : 0}
              roughness={0.7}
              metalness={0.2}
            />
            
            {/* Add outline effect for selected elements */}
            {isHighlighted && (
              <lineSegments>
                <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(1.02, 1.02, 1.02)]} />
                <lineBasicMaterial 
                  attach="material" 
                  color={0xffcc00} 
                  linewidth={2}
                />
              </lineSegments>
            )}
          </mesh>
        );
      })}
    </group>
  );
}
