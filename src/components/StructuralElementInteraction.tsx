import { useEffect, useMemo } from 'react';
import { DetailedBuildingParams } from './StructuralComponentAnalysis';

// Advanced structural element interaction types
type ElementInteraction = {
  sourceElement: {
    type: 'column' | 'beam' | 'slab' | 'foundation';
    id: number;
  };
  targetElement: {
    type: 'column' | 'beam' | 'slab' | 'foundation';
    id: number;
  };
  interactionType: 'load-transfer' | 'moment-connection' | 'shear-connection';
  loadTransferRatio: number; // 0-1, how much load is transferred
  momentResistance: number; // 0-1, resistance to rotational forces
  shearResistance: number; // 0-1, resistance to shear forces
  thermalExpansion: number; // mm/°C
  dynamicAmplification: number; // Factor for dynamic loads
};

type NonStructuralEffect = {
  type: 'partition-wall' | 'facade' | 'mechanical-equipment' | 'live-load';
  location: {
    floor: number;
    x: number;
    y: number;
    z: number;
  };
  mass: number; // kg
  stiffnessContribution: number; // 0-1
  dampingContribution: number; // 0-1
  naturalFrequency: number; // Hz
};

type DynamicProperties = {
  temperature: number; // °C
  loadVariation: number; // % of design load
  moistureContent: number; // % for concrete/wood
  creepFactor: number; // Long-term deformation
  fatigueAccumulation: number; // 0-1
  cyclesCount: number; // Number of load cycles
};

type InteractionAnalysisResult = {
  loadDistribution: {
    axial: number;
    shear: number;
    moment: number;
  };
  jointRotation: number; // radians
  relativeDisplacement: number; // mm
  stressConcentration: number; // MPa
  damageIndex: number; // 0-1
};

export function calculateElementInteractions(
  buildingParams: DetailedBuildingParams,
  interactions: ElementInteraction[],
  nonStructuralEffects: NonStructuralEffect[],
  dynamicProps: DynamicProperties
): InteractionAnalysisResult[] {
  return interactions.map(interaction => {
    // Calculate load distribution
    const axialLoad = calculateAxialLoadTransfer(interaction, dynamicProps);
    const shearLoad = calculateShearForces(interaction, dynamicProps);
    const momentLoad = calculateMomentTransfer(interaction, dynamicProps);
    
    // Calculate joint behavior
    const rotation = calculateJointRotation(interaction, dynamicProps);
    const displacement = calculateRelativeDisplacement(interaction, dynamicProps);
    
    // Evaluate stress concentrations
    const stress = calculateStressConcentration(
      interaction,
      nonStructuralEffects,
      dynamicProps
    );
    
    // Assess damage
    const damage = evaluateDamageIndex(
      interaction,
      stress,
      rotation,
      displacement,
      dynamicProps
    );
    
    return {
      loadDistribution: {
        axial: axialLoad,
        shear: shearLoad,
        moment: momentLoad
      },
      jointRotation: rotation,
      relativeDisplacement: displacement,
      stressConcentration: stress,
      damageIndex: damage
    };
  });
}

// Helper functions for detailed calculations
function calculateAxialLoadTransfer(
  interaction: ElementInteraction,
  dynamicProps: DynamicProperties
): number {
  const baseLoad = interaction.loadTransferRatio;
  const tempEffect = 1 + (dynamicProps.temperature - 20) * interaction.thermalExpansion * 0.001;
  const dynamicFactor = 1 + interaction.dynamicAmplification * (dynamicProps.loadVariation / 100);
  
  return baseLoad * tempEffect * dynamicFactor;
}

function calculateShearForces(
  interaction: ElementInteraction,
  dynamicProps: DynamicProperties
): number {
  const baseShear = interaction.shearResistance;
  const dynamicFactor = 1 + interaction.dynamicAmplification * (dynamicProps.loadVariation / 100);
  const fatigueFactor = 1 - (dynamicProps.fatigueAccumulation * 0.5);
  
  return baseShear * dynamicFactor * fatigueFactor;
}

function calculateMomentTransfer(
  interaction: ElementInteraction,
  dynamicProps: DynamicProperties
): number {
  const baseMoment = interaction.momentResistance;
  const dynamicFactor = 1 + interaction.dynamicAmplification * (dynamicProps.loadVariation / 100);
  const creepFactor = 1 - (dynamicProps.creepFactor * 0.3);
  
  return baseMoment * dynamicFactor * creepFactor;
}

function calculateJointRotation(
  interaction: ElementInteraction,
  dynamicProps: DynamicProperties
): number {
  const baseRotation = 0.001; // Initial rotation in radians
  const stiffnessFactor = interaction.momentResistance;
  const creepEffect = 1 + dynamicProps.creepFactor * 0.2;
  
  return baseRotation * (1 - stiffnessFactor) * creepEffect;
}

function calculateRelativeDisplacement(
  interaction: ElementInteraction,
  dynamicProps: DynamicProperties
): number {
  const baseDisplacement = 1.0; // Base displacement in mm
  const loadFactor = 1 + (dynamicProps.loadVariation / 100);
  const tempEffect = 1 + (dynamicProps.temperature - 20) * interaction.thermalExpansion * 0.001;
  
  return baseDisplacement * loadFactor * tempEffect;
}

function calculateStressConcentration(
  interaction: ElementInteraction,
  nonStructuralEffects: NonStructuralEffect[],
  dynamicProps: DynamicProperties
): number {
  const baseStress = 10.0; // Base stress in MPa
  const nonStructuralFactor = calculateNonStructuralEffect(nonStructuralEffects);
  const dynamicFactor = 1 + interaction.dynamicAmplification * (dynamicProps.loadVariation / 100);
  const fatigueFactor = 1 + (dynamicProps.fatigueAccumulation * 0.4);
  
  return baseStress * nonStructuralFactor * dynamicFactor * fatigueFactor;
}

function calculateNonStructuralEffect(
  effects: NonStructuralEffect[]
): number {
  return effects.reduce((factor, effect) => {
    return factor * (1 + effect.stiffnessContribution * 0.2);
  }, 1.0);
}

function evaluateDamageIndex(
  interaction: ElementInteraction,
  stress: number,
  rotation: number,
  displacement: number,
  dynamicProps: DynamicProperties
): number {
  const stressFactor = stress / 100; // Normalize stress
  const rotationFactor = rotation / 0.01; // Normalize rotation
  const displacementFactor = displacement / 10; // Normalize displacement
  
  const fatigueDamage = dynamicProps.fatigueAccumulation * 
    Math.log(dynamicProps.cyclesCount) / Math.log(1000000);
  
  const damageIndex = (
    0.4 * stressFactor +
    0.3 * rotationFactor +
    0.2 * displacementFactor +
    0.1 * fatigueDamage
  );
  
  return Math.min(Math.max(damageIndex, 0), 1);
}