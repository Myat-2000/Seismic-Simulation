import React, { useState, FormEvent } from 'react';
import { FormSection, FormRow, FormField, Input, Select, Button } from './ui/FormComponents';
import StructuralElementForm from './StructuralElementForm';
import { DetailedBuildingParams } from './StructuralComponentAnalysis';

export type StructuralMaterialsParams = {
  concrete: {
    compressiveStrength: number; // MPa
    tensileStrength: number; // MPa
    elasticModulus: number; // GPa
    reinforcementType: 'standard' | 'high-strength' | 'fiber-reinforced';
    // Enhanced structural parameters
    structuralSystemType: 'frame' | 'shear-wall' | 'dual-system' | 'tube';
    dampingRatio: number; // % of critical damping
    poissonsRatio: number; // unitless
    thermalExpansionCoeff: number; // 10^-6/°C
    creepCoefficient: number; // unitless
    shrinkageStrain: number; // mm/m
    codeCompliance: 'ACI-318' | 'Eurocode-2' | 'IS-456' | 'other';
  };
  steel: {
    yieldStrength: number; // MPa
    tensileStrength: number; // MPa
    elasticModulus: number; // GPa
    connectionType: 'welded' | 'bolted' | 'riveted';
    // Enhanced structural parameters
    structuralSystemType: 'moment-frame' | 'braced-frame' | 'eccentrically-braced' | 'special-moment-frame';
    dampingRatio: number; // % of critical damping
    poissonsRatio: number; // unitless
    thermalExpansionCoeff: number; // 10^-6/°C
    fatigueCategory: 'low-cycle' | 'high-cycle' | 'ultra-high-cycle';
    fractureClass: 'A' | 'B' | 'C' | 'D';
    codeCompliance: 'AISC-360' | 'Eurocode-3' | 'IS-800' | 'other';
  };
  wood: {
    bendingStrength: number; // MPa
    compressionStrength: number; // MPa
    elasticModulus: number; // GPa
    gradeType: 'structural' | 'construction' | 'premium';
    // Enhanced structural parameters
    structuralSystemType: 'light-frame' | 'post-and-beam' | 'heavy-timber' | 'cross-laminated';
    dampingRatio: number; // % of critical damping
    poissonsRatio: number; // unitless
    moistureContent: number; // %
    shrinkageCoefficient: number; // % per % moisture change
    durabilityClass: '1' | '2' | '3' | '4' | '5';
    codeCompliance: 'NDS' | 'Eurocode-5' | 'AS-1720' | 'other';
  };
  activeMaterial: 'concrete' | 'steel' | 'wood';
};

const defaultMaterialsParams: StructuralMaterialsParams = {
  concrete: {
    compressiveStrength: 30,
    tensileStrength: 3,
    elasticModulus: 25,
    reinforcementType: 'standard',
    // Default values for enhanced parameters
    structuralSystemType: 'frame',
    dampingRatio: 5,
    poissonsRatio: 0.2,
    thermalExpansionCoeff: 10,
    creepCoefficient: 2.0,
    shrinkageStrain: 0.5,
    codeCompliance: 'ACI-318'
  },
  steel: {
    yieldStrength: 350,
    tensileStrength: 450,
    elasticModulus: 200,
    connectionType: 'welded',
    // Default values for enhanced parameters
    structuralSystemType: 'moment-frame',
    dampingRatio: 2,
    poissonsRatio: 0.3,
    thermalExpansionCoeff: 12,
    fatigueCategory: 'high-cycle',
    fractureClass: 'B',
    codeCompliance: 'AISC-360'
  },
  wood: {
    bendingStrength: 20,
    compressionStrength: 15,
    elasticModulus: 10,
    gradeType: 'structural',
    // Default values for enhanced parameters
    structuralSystemType: 'light-frame',
    dampingRatio: 7,
    poissonsRatio: 0.25,
    moistureContent: 12,
    shrinkageCoefficient: 0.2,
    durabilityClass: '2',
    codeCompliance: 'NDS'
  },
  activeMaterial: 'concrete'
};

type StructuralMaterialsFormProps = {
  onSubmit: (params: StructuralMaterialsParams, structuralElements?: DetailedBuildingParams['structuralComponents']) => void;
  initialParams?: Partial<StructuralMaterialsParams>;
  activeMaterial: 'concrete' | 'steel' | 'wood';
  initialStructuralElements?: DetailedBuildingParams['structuralComponents'];
};

export default function StructuralMaterialsForm({ 
  onSubmit, 
  initialParams = {}, 
  activeMaterial,
  initialStructuralElements
}: StructuralMaterialsFormProps) {
  const [params, setParams] = useState<StructuralMaterialsParams>({
    ...defaultMaterialsParams,
    ...initialParams,
    activeMaterial
  });
  
  const [structuralElements, setStructuralElements] = useState<DetailedBuildingParams['structuralComponents']>(initialStructuralElements);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(params, structuralElements);
  };
  
  const handleStructuralElementSubmit = (elements: DetailedBuildingParams['structuralComponents']) => {
    setStructuralElements(elements);
  };

  const handleChange = (
    material: 'concrete' | 'steel' | 'wood',
    property: string,
    value: string | number
  ) => {
    setParams(prev => ({
      ...prev,
      [material]: {
        ...prev[material],
        [property]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-all hover:shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Structural Materials Properties</h2>
      
      {activeMaterial === 'concrete' && (
        <FormSection title="Concrete Properties" description="Define the properties of concrete material">
          <FormRow cols={2}>
            <FormField 
              label="Compressive Strength (MPa)" 
              htmlFor="concrete-compressive-strength" 
              tooltip="The maximum compressive stress that concrete can withstand before failure. Higher values indicate stronger concrete."
            >
              <Input
                type="number"
                id="concrete-compressive-strength"
                value={params.concrete.compressiveStrength}
                onChange={(e) => handleChange('concrete', 'compressiveStrength', parseFloat(e.target.value))}
                step="1"
                min="20"
                max="100"
              />
            </FormField>
            
            <FormField 
              label="Tensile Strength (MPa)" 
              htmlFor="concrete-tensile-strength"
              tooltip="The maximum tensile stress that concrete can withstand before cracking. Concrete is weak in tension."
            >
              <Input
                type="number"
                id="concrete-tensile-strength"
                value={params.concrete.tensileStrength}
                onChange={(e) => handleChange('concrete', 'tensileStrength', parseFloat(e.target.value))}
                step="0.1"
                min="1"
                max="10"
              />
            </FormField>
          </FormRow>
          
          <FormRow cols={2}>
            <FormField 
              label="Elastic Modulus (GPa)" 
              htmlFor="concrete-elastic-modulus"
              tooltip="Measure of concrete's stiffness. Higher values mean the concrete deforms less under load."
            >
              <Input
                type="number"
                id="concrete-elastic-modulus"
                value={params.concrete.elasticModulus}
                onChange={(e) => handleChange('concrete', 'elasticModulus', parseFloat(e.target.value))}
                step="1"
                min="15"
                max="50"
              />
            </FormField>
            
            <FormField 
              label="Reinforcement Type" 
              htmlFor="concrete-reinforcement-type"
              tooltip="Type of reinforcement used in the concrete. Different types provide varying levels of strength and ductility."
            >
              <Select
                id="concrete-reinforcement-type"
                value={params.concrete.reinforcementType}
                onChange={(e) => handleChange('concrete', 'reinforcementType', e.target.value)}
                options={[
                  { value: 'standard', label: 'Standard Rebar' },
                  { value: 'high-strength', label: 'High-Strength Rebar' },
                  { value: 'fiber-reinforced', label: 'Fiber Reinforced' }
                ]}
              />
            </FormField>
          </FormRow>
          
          <FormSection title="Enhanced Structural Parameters" description="Advanced parameters for seismic analysis">
            <FormRow cols={2}>
              <FormField 
                label="Structural System Type" 
                htmlFor="concrete-structural-system" 
                tooltip="The type of structural system used in the building, which affects its seismic response."
              >
                <Select
                  id="concrete-structural-system"
                  value={params.concrete.structuralSystemType}
                  onChange={(e) => handleChange('concrete', 'structuralSystemType', e.target.value)}
                  options={[
                    { value: 'frame', label: 'Moment Frame' },
                    { value: 'shear-wall', label: 'Shear Wall' },
                    { value: 'dual-system', label: 'Dual System' },
                    { value: 'tube', label: 'Tube System' }
                  ]}
                />
              </FormField>
              
              <FormField 
                label="Damping Ratio (%)" 
                htmlFor="concrete-damping-ratio"
                tooltip="Percentage of critical damping. Higher values reduce vibration amplitude but may indicate less efficient energy dissipation."
              >
                <Input
                  type="number"
                  id="concrete-damping-ratio"
                  value={params.concrete.dampingRatio}
                  onChange={(e) => handleChange('concrete', 'dampingRatio', parseFloat(e.target.value))}
                  step="0.5"
                  min="1"
                  max="10"
                />
              </FormField>
            </FormRow>
            
            <FormRow cols={2}>
              <FormField 
                label="Poisson's Ratio" 
                htmlFor="concrete-poissons-ratio"
                tooltip="Ratio of transverse to axial strain. Affects how material deforms under load."
              >
                <Input
                  type="number"
                  id="concrete-poissons-ratio"
                  value={params.concrete.poissonsRatio}
                  onChange={(e) => handleChange('concrete', 'poissonsRatio', parseFloat(e.target.value))}
                  step="0.01"
                  min="0.1"
                  max="0.3"
                />
              </FormField>
              
              <FormField 
                label="Thermal Expansion Coeff (10^-6/°C)" 
                htmlFor="concrete-thermal-expansion"
                tooltip="Coefficient of thermal expansion. Affects how material expands/contracts with temperature changes."
              >
                <Input
                  type="number"
                  id="concrete-thermal-expansion"
                  value={params.concrete.thermalExpansionCoeff}
                  onChange={(e) => handleChange('concrete', 'thermalExpansionCoeff', parseFloat(e.target.value))}
                  step="0.5"
                  min="8"
                  max="14"
                />
              </FormField>
            </FormRow>
            
            <FormRow cols={2}>
              <FormField 
                label="Creep Coefficient" 
                htmlFor="concrete-creep-coefficient"
                tooltip="Measure of concrete's tendency to deform permanently under sustained load. Important for long-term behavior."
              >
                <Input
                  type="number"
                  id="concrete-creep-coefficient"
                  value={params.concrete.creepCoefficient}
                  onChange={(e) => handleChange('concrete', 'creepCoefficient', parseFloat(e.target.value))}
                  step="0.1"
                  min="1.0"
                  max="4.0"
                />
              </FormField>
              
              <FormField 
                label="Shrinkage Strain (mm/m)" 
                htmlFor="concrete-shrinkage-strain"
                tooltip="Strain due to drying shrinkage. Affects cracking potential and long-term deformation."
              >
                <Input
                  type="number"
                  id="concrete-shrinkage-strain"
                  value={params.concrete.shrinkageStrain}
                  onChange={(e) => handleChange('concrete', 'shrinkageStrain', parseFloat(e.target.value))}
                  step="0.05"
                  min="0.2"
                  max="1.0"
                />
              </FormField>
            </FormRow>
            
            <FormRow cols={1}>
              <FormField 
                label="Code Compliance" 
                htmlFor="concrete-code-compliance"
                tooltip="Design code used for structural analysis and design. Different codes have different safety factors and requirements."
              >
                <Select
                  id="concrete-code-compliance"
                  value={params.concrete.codeCompliance}
                  onChange={(e) => handleChange('concrete', 'codeCompliance', e.target.value)}
                  options={[
                    { value: 'ACI-318', label: 'ACI 318 (US)' },
                    { value: 'Eurocode-2', label: 'Eurocode 2 (EU)' },
                    { value: 'IS-456', label: 'IS 456 (India)' },
                    { value: 'other', label: 'Other' }
                  ]}
                />
              </FormField>
            </FormRow>
          </FormSection>
        </FormSection>
      )}
      
      {activeMaterial === 'steel' && (
        <FormSection title="Steel Properties" description="Define the properties of steel material">
          <FormRow cols={2}>
            <FormField 
              label="Yield Strength (MPa)" 
              htmlFor="steel-yield-strength" 
              tooltip="The stress at which steel begins to deform plastically. Critical for structural design."
            >
              <Input
                type="number"
                id="steel-yield-strength"
                value={params.steel.yieldStrength}
                onChange={(e) => handleChange('steel', 'yieldStrength', parseFloat(e.target.value))}
                step="10"
                min="200"
                max="700"
              />
            </FormField>
            
            <FormField 
              label="Tensile Strength (MPa)" 
              htmlFor="steel-tensile-strength"
              tooltip="The maximum stress that steel can withstand while being stretched before breaking."
            >
              <Input
                type="number"
                id="steel-tensile-strength"
                value={params.steel.tensileStrength}
                onChange={(e) => handleChange('steel', 'tensileStrength', parseFloat(e.target.value))}
                step="10"
                min="300"
                max="900"
              />
            </FormField>
          </FormRow>
          
          <FormRow cols={2}>
            <FormField 
              label="Elastic Modulus (GPa)" 
              htmlFor="steel-elastic-modulus"
              tooltip="Measure of steel's stiffness. Steel has a high elastic modulus, making it resistant to deformation."
            >
              <Input
                type="number"
                id="steel-elastic-modulus"
                value={params.steel.elasticModulus}
                onChange={(e) => handleChange('steel', 'elasticModulus', parseFloat(e.target.value))}
                step="5"
                min="180"
                max="220"
              />
            </FormField>
            
            <FormField 
              label="Connection Type" 
              htmlFor="steel-connection-type"
              tooltip="Method used to connect steel members. Different connection types affect the overall structural behavior."
            >
              <Select
                id="steel-connection-type"
                value={params.steel.connectionType}
                onChange={(e) => handleChange('steel', 'connectionType', e.target.value)}
                options={[
                  { value: 'welded', label: 'Welded' },
                  { value: 'bolted', label: 'Bolted' },
                  { value: 'riveted', label: 'Riveted' }
                ]}
              />
            </FormField>
          </FormRow>
          
          <FormSection title="Enhanced Structural Parameters" description="Advanced parameters for seismic analysis">
            <FormRow cols={2}>
              <FormField 
                label="Structural System Type" 
                htmlFor="steel-structural-system" 
                tooltip="The type of structural system used in the building, which affects its seismic response."
              >
                <Select
                  id="steel-structural-system"
                  value={params.steel.structuralSystemType}
                  onChange={(e) => handleChange('steel', 'structuralSystemType', e.target.value)}
                  options={[
                    { value: 'moment-frame', label: 'Moment Frame' },
                    { value: 'braced-frame', label: 'Braced Frame' },
                    { value: 'eccentrically-braced', label: 'Eccentrically Braced' },
                    { value: 'special-moment-frame', label: 'Special Moment Frame' }
                  ]}
                />
              </FormField>
              
              <FormField 
                label="Damping Ratio (%)" 
                htmlFor="steel-damping-ratio"
                tooltip="Percentage of critical damping. Steel structures typically have lower damping than concrete."
              >
                <Input
                  type="number"
                  id="steel-damping-ratio"
                  value={params.steel.dampingRatio}
                  onChange={(e) => handleChange('steel', 'dampingRatio', parseFloat(e.target.value))}
                  step="0.5"
                  min="1"
                  max="5"
                />
              </FormField>
            </FormRow>
            
            <FormRow cols={2}>
              <FormField 
                label="Poisson's Ratio" 
                htmlFor="steel-poissons-ratio"
                tooltip="Ratio of transverse to axial strain. For steel, typically around 0.3."
              >
                <Input
                  type="number"
                  id="steel-poissons-ratio"
                  value={params.steel.poissonsRatio}
                  onChange={(e) => handleChange('steel', 'poissonsRatio', parseFloat(e.target.value))}
                  step="0.01"
                  min="0.25"
                  max="0.35"
                />
              </FormField>
              
              <FormField 
                label="Thermal Expansion Coeff (10^-6/°C)" 
                htmlFor="steel-thermal-expansion"
                tooltip="Coefficient of thermal expansion. Affects how material expands/contracts with temperature changes."
              >
                <Input
                  type="number"
                  id="steel-thermal-expansion"
                  value={params.steel.thermalExpansionCoeff}
                  onChange={(e) => handleChange('steel', 'thermalExpansionCoeff', parseFloat(e.target.value))}
                  step="0.5"
                  min="10"
                  max="14"
                />
              </FormField>
            </FormRow>
            
            <FormRow cols={2}>
              <FormField 
                label="Fatigue Category" 
                htmlFor="steel-fatigue-category"
                tooltip="Classification of fatigue resistance. Important for structures subjected to cyclic loading like earthquakes."
              >
                <Select
                  id="steel-fatigue-category"
                  value={params.steel.fatigueCategory}
                  onChange={(e) => handleChange('steel', 'fatigueCategory', e.target.value)}
                  options={[
                    { value: 'low-cycle', label: 'Low Cycle' },
                    { value: 'high-cycle', label: 'High Cycle' },
                    { value: 'ultra-high-cycle', label: 'Ultra-High Cycle' }
                  ]}
                />
              </FormField>
              
              <FormField 
                label="Fracture Class" 
                htmlFor="steel-fracture-class"
                tooltip="Classification of fracture toughness. Higher classes have better resistance to brittle fracture."
              >
                <Select
                  id="steel-fracture-class"
                  value={params.steel.fractureClass}
                  onChange={(e) => handleChange('steel', 'fractureClass', e.target.value)}
                  options={[
                    { value: 'A', label: 'Class A (Highest)' },
                    { value: 'B', label: 'Class B' },
                    { value: 'C', label: 'Class C' },
                    { value: 'D', label: 'Class D (Lowest)' }
                  ]}
                />
              </FormField>
            </FormRow>
            
            <FormRow cols={1}>
              <FormField 
                label="Code Compliance" 
                htmlFor="steel-code-compliance"
                tooltip="Design code used for structural analysis and design. Different codes have different safety factors and requirements."
              >
                <Select
                  id="steel-code-compliance"
                  value={params.steel.codeCompliance}
                  onChange={(e) => handleChange('steel', 'codeCompliance', e.target.value)}
                  options={[
                    { value: 'AISC-360', label: 'AISC 360 (US)' },
                    { value: 'Eurocode-3', label: 'Eurocode 3 (EU)' },
                    { value: 'IS-800', label: 'IS 800 (India)' },
                    { value: 'other', label: 'Other' }
                  ]}
                />
              </FormField>
            </FormRow>
          </FormSection>
        </FormSection>
      )}
      
      {activeMaterial === 'wood' && (
        <FormSection title="Wood Properties" description="Define the properties of wood material">
          <FormRow cols={2}>
            <FormField 
              label="Bending Strength (MPa)" 
              htmlFor="wood-bending-strength" 
              tooltip="The maximum stress in bending that wood can withstand. Important for beams and joists."
            >
              <Input
                type="number"
                id="wood-bending-strength"
                value={params.wood.bendingStrength}
                onChange={(e) => handleChange('wood', 'bendingStrength', parseFloat(e.target.value))}
                step="1"
                min="10"
                max="50"
              />
            </FormField>
            
            <FormField 
              label="Compression Strength (MPa)" 
              htmlFor="wood-compression-strength"
              tooltip="The maximum compressive stress that wood can withstand parallel to grain. Important for columns."
            >
              <Input
                type="number"
                id="wood-compression-strength"
                value={params.wood.compressionStrength}
                onChange={(e) => handleChange('wood', 'compressionStrength', parseFloat(e.target.value))}
                step="1"
                min="8"
                max="40"
              />
            </FormField>
          </FormRow>
          
          <FormRow cols={2}>
            <FormField 
              label="Elastic Modulus (GPa)" 
              htmlFor="wood-elastic-modulus"
              tooltip="Measure of wood's stiffness. Wood has a lower elastic modulus than concrete or steel."
            >
              <Input
                type="number"
                id="wood-elastic-modulus"
                value={params.wood.elasticModulus}
                onChange={(e) => handleChange('wood', 'elasticModulus', parseFloat(e.target.value))}
                step="0.5"
                min="5"
                max="20"
              />
            </FormField>
            
            <FormField 
              label="Grade Type" 
              htmlFor="wood-grade-type"
              tooltip="Quality classification of wood. Higher grades have fewer defects and better structural properties."
            >
              <Select
                id="wood-grade-type"
                value={params.wood.gradeType}
                onChange={(e) => handleChange('wood', 'gradeType', e.target.value)}
                options={[
                  { value: 'structural', label: 'Structural Grade' },
                  { value: 'construction', label: 'Construction Grade' },
                  { value: 'premium', label: 'Premium Grade' }
                ]}
              />
            </FormField>
          </FormRow>
          
          <FormSection title="Enhanced Structural Parameters" description="Advanced parameters for seismic analysis">
            <FormRow cols={2}>
              <FormField 
                label="Structural System Type" 
                htmlFor="wood-structural-system" 
                tooltip="The type of structural system used in the building, which affects its seismic response."
              >
                <Select
                  id="wood-structural-system"
                  value={params.wood.structuralSystemType}
                  onChange={(e) => handleChange('wood', 'structuralSystemType', e.target.value)}
                  options={[
                    { value: 'light-frame', label: 'Light Frame' },
                    { value: 'post-and-beam', label: 'Post and Beam' },
                    { value: 'heavy-timber', label: 'Heavy Timber' },
                    { value: 'cross-laminated', label: 'Cross-Laminated Timber' }
                  ]}
                />
              </FormField>
              
              <FormField 
                label="Damping Ratio (%)" 
                htmlFor="wood-damping-ratio"
                tooltip="Percentage of critical damping. Wood structures typically have higher natural damping than steel or concrete."
              >
                <Input
                  type="number"
                  id="wood-damping-ratio"
                  value={params.wood.dampingRatio}
                  onChange={(e) => handleChange('wood', 'dampingRatio', parseFloat(e.target.value))}
                  step="0.5"
                  min="3"
                  max="10"
                />
              </FormField>
            </FormRow>
            
            <FormRow cols={2}>
              <FormField 
                label="Poisson's Ratio" 
                htmlFor="wood-poissons-ratio"
                tooltip="Ratio of transverse to axial strain. For wood, typically around 0.25, varies by grain direction."
              >
                <Input
                  type="number"
                  id="wood-poissons-ratio"
                  value={params.wood.poissonsRatio}
                  onChange={(e) => handleChange('wood', 'poissonsRatio', parseFloat(e.target.value))}
                  step="0.01"
                  min="0.2"
                  max="0.5"
                />
              </FormField>
              
              <FormField 
                label="Moisture Content (%)" 
                htmlFor="wood-moisture-content"
                tooltip="Percentage of water in wood. Affects strength, stiffness, and dimensional stability."
              >
                <Input
                  type="number"
                  id="wood-moisture-content"
                  value={params.wood.moistureContent}
                  onChange={(e) => handleChange('wood', 'moistureContent', parseFloat(e.target.value))}
                  step="1"
                  min="6"
                  max="20"
                />
              </FormField>
            </FormRow>
            
            <FormRow cols={2}>
              <FormField 
                label="Shrinkage Coefficient (%)" 
                htmlFor="wood-shrinkage-coefficient"
                tooltip="Percentage of dimensional change per percentage of moisture content change. Important for long-term behavior."
              >
                <Input
                  type="number"
                  id="wood-shrinkage-coefficient"
                  value={params.wood.shrinkageCoefficient}
                  onChange={(e) => handleChange('wood', 'shrinkageCoefficient', parseFloat(e.target.value))}
                  step="0.05"
                  min="0.1"
                  max="0.5"
                />
              </FormField>
              
              <FormField 
                label="Durability Class" 
                htmlFor="wood-durability-class"
                tooltip="Classification of natural durability against decay and insects. Class 1 is most durable, 5 is least durable."
              >
                <Select
                  id="wood-durability-class"
                  value={params.wood.durabilityClass}
                  onChange={(e) => handleChange('wood', 'durabilityClass', e.target.value)}
                  options={[
                    { value: '1', label: 'Class 1 (Very Durable)' },
                    { value: '2', label: 'Class 2 (Durable)' },
                    { value: '3', label: 'Class 3 (Moderately Durable)' },
                    { value: '4', label: 'Class 4 (Slightly Durable)' },
                    { value: '5', label: 'Class 5 (Not Durable)' }
                  ]}
                />
              </FormField>
            </FormRow>
            
            <FormRow cols={1}>
              <FormField 
                label="Code Compliance" 
                htmlFor="wood-code-compliance"
                tooltip="Design code used for structural analysis and design. Different codes have different safety factors and requirements."
              >
                <Select
                  id="wood-code-compliance"
                  value={params.wood.codeCompliance}
                  onChange={(e) => handleChange('wood', 'codeCompliance', e.target.value)}
                  options={[
                    { value: 'NDS', label: 'NDS (US)' },
                    { value: 'Eurocode-5', label: 'Eurocode 5 (EU)' },
                    { value: 'AS-1720', label: 'AS 1720 (Australia)' },
                    { value: 'other', label: 'Other' }
                  ]}
                />
              </FormField>
            </FormRow>
          </FormSection>
        </FormSection>
      )}
      
      <div className="pt-2">
        <Button type="submit" variant="primary" className="w-full">
          Apply Material Properties
        </Button>
      </div>
    </form>
    
    <StructuralElementForm
      onSubmit={handleStructuralElementSubmit}
      initialParams={structuralElements}
    />
    </div>
  );
}
