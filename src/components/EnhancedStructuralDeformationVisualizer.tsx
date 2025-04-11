import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { DetailedBuildingParams } from './StructuralComponentAnalysis';
import { ElementInteraction, InteractionAnalysisResult } from './StructuralElementInteraction';
import { applyDistanceBasedLOD, isInViewFrustum } from '../utils/renderOptimization';
import { useThree } from '@react-three/fiber';

type EnhancedDeformationVisualizerProps = {
  buildingParams: DetailedBuildingParams;
  elementInteractions: ElementInteraction[];
  analysisResults: InteractionAnalysisResult[];
  selectedElement?: {
    type: 'column' | 'beam' | 'slab' | 'foundation';
    id: number;
  };
  showStressColors: boolean;
  showDeformation: boolean;
  deformationScale: number;
  onElementSelect?: (element: {type: string, id: number}) => void;
};

// Color scale for stress visualization
const getStressColor = (stress: number, maxStress: number): THREE.Color => {
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
  const deformed = originalPosition.clone();
  
  // Apply displacement
  deformed.add(
    new THREE.Vector3(
      Math.sin(deformation.rotation) * deformation.displacement * scale,
      Math.cos(deformation.rotation) * deformation.displacement * scale,
      0
    )
  );
  
  return deformed;
};

export default function EnhancedStructuralDeformationVisualizer({
  buildingParams,
  elementInteractions,
  analysisResults,
  selectedElement,
  showStressColors = true,
  showDeformation = true,
  deformationScale = 1.0,
  onElementSelect
}: EnhancedDeformationVisualizerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredElement, setHoveredElement] = useState<{type: string, id: number} | null>(null);
  
  // Memoize maximum stress value for color scaling
  const maxStress = useMemo(() => {
    return Math.max(...analysisResults.map(result => result.stressConcentration));
  }, [analysisResults]);
  
  // Generate geometry instances for each structural element
  const elements = useMemo(() => {
    const elements: Array<{
      position: THREE.Vector3;
      rotation: THREE.Euler;
      scale: THREE.Vector3;
      color: THREE.Color;
      type: string;
      id: number;
      isSelected: boolean;
      stress: number;
    }> = [];
    
    // Process columns
    buildingParams.structuralComponents?.columns && Object.entries(buildingParams.structuralComponents.columns).forEach(([id, column]) => {
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
    
    // Process beams
    buildingParams.structuralComponents?.beams && Object.entries(buildingParams.structuralComponents.beams).forEach(([id, beam]) => {
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
        position: new THREE.Vector3(0, beam.height, 0),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(beam.width, beam.depth, beam.length),
        color: showStressColors ? getStressColor(stress, maxStress) : new THREE.Color('#909090'),
        type: 'beam',
        id: beamId,
        isSelected,
        stress
      });
    });
    
    // Process slabs
    buildingParams.structuralComponents?.slabs && Object.entries(buildingParams.structuralComponents.slabs).forEach(([id, slab]) => {
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
        position: new THREE.Vector3(0, slab.height, 0),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(slab.width, slab.thickness, slab.depth),
        color: showStressColors ? getStressColor(stress, maxStress) : new THREE.Color('#a8a8a8'),
        type: 'slab',
        id: slabId,
        isSelected,
        stress
      });
    });
    
    // Process foundation
    buildingParams.structuralComponents?.foundation && Object.entries(buildingParams.structuralComponents.foundation).forEach(([id, foundation]) => {
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
        scale: new THREE.Vector3(buildingParams.width * 1.2, foundation.depth, buildingParams.depth * 1.2),
        color: showStressColors ? getStressColor(stress, maxStress) : new THREE.Color('#606060'),
        type: 'foundation',
        id: foundationId,
        isSelected,
        stress
      });
    });
    
    return elements;
  }, [buildingParams, elementInteractions, analysisResults, maxStress, showStressColors, selectedElement]);
  
  // Apply deformation to elements if enabled
  const deformedElements = useMemo(() => {
    if (!showDeformation) return elements;
    
    return elements.map(element => {
      const analysisResult = analysisResults.find(result => 
        elementInteractions.some(interaction => 
          (interaction.sourceElement.type === element.type && interaction.sourceElement.id === element.id) ||
          (interaction.targetElement.type === element.type && interaction.targetElement.id === element.id)
        )
      );
      
      if (!analysisResult) return element;
      
      // Calculate deformation based on analysis results
      const deformation = {
        displacement: analysisResult.relativeDisplacement / 1000, // Convert mm to meters
        rotation: analysisResult.jointRotation
      };
      
      // Apply deformation to position
      const deformedPosition = calculateDeformedPosition(
        element.position,
        deformation,
        deformationScale
      );
      
      return {
        ...element,
        position: deformedPosition,
        // Apply slight rotation based on joint rotation
        rotation: new THREE.Euler(
          element.rotation.x + deformation.rotation * deformationScale * 0.1,
          element.rotation.y,
          element.rotation.z + deformation.rotation * deformationScale * 0.2
        )
      };
    });
  }, [elements, showDeformation, deformationScale, analysisResults, elementInteractions]);
  
  // Get available elements for selection
  const availableElements = useMemo(() => {
    const available = {
      columns: [] as number[],
      beams: [] as number[],
      slabs: [] as number[],
      foundations: [] as number[]
    };
    
    elements.forEach(element => {
      const type = `${element.type}s` as keyof typeof available;
      if (available[type]) {
        available[type].push(element.id);
      }
    });
    
    return available;
  }, [elements]);
  
  // Handle element hover and selection
  const handleElementHover = (element: {type: string, id: number} | null) => {
    setHoveredElement(element);
  };
  
  const handleElementClick = (element: {type: string, id: number}) => {
    if (onElementSelect) {
      onElementSelect(element);
    }
  };
  
  // Animation and rendering optimizations
  useFrame(() => {
    if (!groupRef.current) return;
    
    // Apply subtle animation to selected element for emphasis
    if (selectedElement) {
      const selectedMesh = groupRef.current.children.find(child => {
        const userData = (child as THREE.Mesh).userData;
        return userData.type === selectedElement.type && userData.id === selectedElement.id;
      });
      
      if (selectedMesh) {
        // Pulse animation for selected element
        const time = performance.now() * 0.001; // Convert to seconds
        const scale = 1.0 + Math.sin(time * 3) * 0.05; // Subtle pulsing effect
        
        selectedMesh.scale.set(
          selectedMesh.scale.x * scale,
          selectedMesh.scale.y * scale,
          selectedMesh.scale.z * scale
        );
      }
    }
  });
  
  // Render the structural elements
  return (
    <group ref={groupRef}>
      {deformedElements.map((element, index) => {
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