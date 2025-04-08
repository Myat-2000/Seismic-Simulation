import React, { useState, FormEvent } from 'react';
import { FormSection, FormRow, FormField, Input, Select, Button } from './ui/FormComponents';

export type StructuralMaterialsParams = {
  concrete: {
    compressiveStrength: number; // MPa
    tensileStrength: number; // MPa
    elasticModulus: number; // GPa
    reinforcementType: 'standard' | 'high-strength' | 'fiber-reinforced';
  };
  steel: {
    yieldStrength: number; // MPa
    tensileStrength: number; // MPa
    elasticModulus: number; // GPa
    connectionType: 'welded' | 'bolted' | 'riveted';
  };
  wood: {
    bendingStrength: number; // MPa
    compressionStrength: number; // MPa
    elasticModulus: number; // GPa
    gradeType: 'structural' | 'construction' | 'premium';
  };
  activeMaterial: 'concrete' | 'steel' | 'wood';
};

const defaultMaterialsParams: StructuralMaterialsParams = {
  concrete: {
    compressiveStrength: 30,
    tensileStrength: 3,
    elasticModulus: 25,
    reinforcementType: 'standard'
  },
  steel: {
    yieldStrength: 350,
    tensileStrength: 450,
    elasticModulus: 200,
    connectionType: 'welded'
  },
  wood: {
    bendingStrength: 20,
    compressionStrength: 15,
    elasticModulus: 10,
    gradeType: 'structural'
  },
  activeMaterial: 'concrete'
};

type StructuralMaterialsFormProps = {
  onSubmit: (params: StructuralMaterialsParams) => void;
  initialParams?: Partial<StructuralMaterialsParams>;
  activeMaterial: 'concrete' | 'steel' | 'wood';
};

export default function StructuralMaterialsForm({ 
  onSubmit, 
  initialParams = {}, 
  activeMaterial 
}: StructuralMaterialsFormProps) {
  const [params, setParams] = useState<StructuralMaterialsParams>({
    ...defaultMaterialsParams,
    ...initialParams,
    activeMaterial
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(params);
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
        </FormSection>
      )}
      
      <div className="pt-2">
        <Button type="submit" variant="primary" className="w-full">
          Apply Material Properties
        </Button>
      </div>
    </form>
  );
}