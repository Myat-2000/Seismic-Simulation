import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { DetailedBuildingParams } from './StructuralComponentAnalysis';
import { ElementInteraction, InteractionAnalysisResult } from './StructuralElementInteraction';
import { applyDistanceBasedLOD, isInViewFrustum } from '../utils/renderOptimization';
import { useThree } from '@react-three/fiber';

type DeformationVisualizerProps = {
  buildingParams: DetailedBuildingParams;
  elementInteractions: ElementInteraction[];
  analysisResults: InteractionAnalysisResult[];
  selectedElement?: {
    type: 'column' | 'beam' | 'slab' | 'foundation';
    id: number;
  };
  showStressColors?: boolean;
  showDeformation?: boolean;
  deformationScale?: number;
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

export default function StructuralDeformationVisualizer({
  buildingParams,
  elementInteractions,
  analysisResults,
  selectedElement,
  showStressColors = true,
  showDeformation = true,
  deformationScale = 1.0,
  onElementSelect // Add this prop
}: DeformationVisualizerProps & { 
  onElementSelect?: (element: {type: string, id: number}) => void 
}) {
  const groupRef = useRef<THREE.Group>();
  
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
    }> = [];
    
    // Process columns
    buildingParams.structuralComponents?.columns && Object.entries(buildingParams.structuralComponents.columns).forEach(([id, column]) => {
      const result = analysisResults.find(r => 
        r.loadDistribution.axial > 0 && // Column is load-bearing
        elementInteractions.some(i => 
          (i.sourceElement.type === 'column' && i.sourceElement.id === parseInt(id)) ||
          (i.targetElement.type === 'column' && i.targetElement.id === parseInt(id))
        )
      );
      
      if (result) {
        elements.push({
          position: new THREE.Vector3(0, column.height / 2, 0),
          rotation: new THREE.Euler(0, 0, 0),
          scale: new THREE.Vector3(column.width, column.height, column.width),
          color: showStressColors ? getStressColor(result.stressConcentration, maxStress) : new THREE.Color(0x808080),
          type: 'column',
          id: parseInt(id)
        });
      }
    });
    
    // Process beams (similar structure for beams)
    // Process slabs (similar structure for slabs)
    // Process foundation elements
    
    return elements;
  }, [buildingParams, elementInteractions, analysisResults, showStressColors, maxStress]);
  
  // Update deformations in animation frame
  useFrame((state) => {
    if (!groupRef.current || !showDeformation) return;
    
    elements.forEach((element, index) => {
      const instance = groupRef.current!.children[index] as THREE.Mesh;
      if (!instance) return;
      
      // Apply LOD based on camera distance
      const distance = state.camera.position.distanceTo(instance.position);
      const detail = applyDistanceBasedLOD(distance);
      
      // Skip updates for elements far from camera
      if (!isInViewFrustum(instance, state.camera)) return;
      
      // Find corresponding analysis result
      const result = analysisResults.find(r => 
        elementInteractions.some(i => 
          (i.sourceElement.type === element.type && i.sourceElement.id === element.id) ||
          (i.targetElement.type === element.type && i.targetElement.id === element.id)
        )
      );
      
      if (result) {
        // Calculate deformed position
        const deformedPosition = calculateDeformedPosition(
          element.position,
          {
            displacement: result.relativeDisplacement,
            rotation: result.jointRotation
          },
          deformationScale * detail
        );
        
        // Update instance position
        instance.position.copy(deformedPosition);
        instance.updateMatrix();
      }
    });
  });
  
  // Add raycaster for element selection
  const { raycaster, camera, mouse } = useThree();
  
  // Handle element selection
  const handleClick = useCallback((event) => {
    if (!groupRef.current || !onElementSelect) return;
    
    // Update the raycaster with the current mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(groupRef.current.children, true);
    
    if (intersects.length > 0) {
      // Get the first intersected object
      const object = intersects[0].object;
      
      // Find the corresponding element
      const elementIndex = groupRef.current.children.indexOf(object);
      if (elementIndex >= 0 && elementIndex < elements.length) {
        const element = elements[elementIndex];
        onElementSelect({
          type: element.type,
          id: element.id
        });
      }
    }
  }, [raycaster, camera, mouse, elements, onElementSelect]);
  
  // Add event listener for element selection
  useEffect(() => {
    const domElement = document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [handleClick]);
  
  return (
    <group ref={groupRef}>
      <Instances limit={elements.length}>
        {/* Base geometry for instances */}
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.5} metalness={0.5} />
        
        {/* Create instances for each element */}
        {elements.map((element, index) => (
          <Instance
            key={`${element.type}-${element.id}`}
            position={element.position}
            rotation={element.rotation}
            scale={element.scale}
            color={element.color}
            // Highlight selected element
            emissive={selectedElement && 
                     selectedElement.type === element.type && 
                     selectedElement.id === element.id ? 
                     new THREE.Color(0xffff00) : undefined}
            emissiveIntensity={0.5}
          />
        ))}
      </Instances>
    </group>
  );
}