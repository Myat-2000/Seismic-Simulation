import React, { useState, FormEvent } from 'react';
import { DetailedBuildingParams } from './StructuralComponentAnalysis';
import { FormSection, FormRow, FormField, Input, Select, Button } from './ui/FormComponents';

type StructuralElementFormProps = {
  onSubmit: (params: DetailedBuildingParams['structuralComponents']) => void;
  initialParams?: DetailedBuildingParams['structuralComponents'];
};

const defaultStructuralParams: DetailedBuildingParams['structuralComponents'] = {
  columns: {
    width: 0.5,
    reinforcement: 'medium',
    connectionType: 'rigid'
  },
  beams: {
    width: 0.3,
    depth: 0.5,
    reinforcement: 'medium',
    connectionType: 'rigid'
  },
  slabs: {
    thickness: 0.2,
    reinforcement: 'medium',
    type: 'two-way'
  },
  foundation: {
    type: 'isolated',
    depth: 2
  }
};

export default function StructuralElementForm({ onSubmit, initialParams = defaultStructuralParams }: StructuralElementFormProps) {
  const [params, setParams] = useState(initialParams);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(params);
  };

  const handleChange = (
    category: keyof typeof params,
    property: string,
    value: string | number
  ) => {
    setParams(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [property]: value
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-all hover:shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Structural Element Properties</h2>
      
      {/* Columns Section */}
      <FormSection title="Columns" description="Define the properties of structural columns">
        <FormRow cols={3}>
          <FormField 
            label="Width (m)" 
            htmlFor="columns-width" 
            tooltip="The width of columns in meters. Larger columns provide more stability but use more material."
          >
            <Input
              type="number"
              id="columns-width"
              value={params.columns.width}
              onChange={(e) => handleChange('columns', 'width', parseFloat(e.target.value))}
              step="0.1"
              min="0.3"
              max="2"
            />
          </FormField>
          
          <FormField 
            label="Reinforcement" 
            htmlFor="columns-reinforcement"
            tooltip="The amount of steel reinforcement in the columns. Heavier reinforcement provides more strength during seismic events."
          >
            <Select
              id="columns-reinforcement"
              value={params.columns.reinforcement}
              onChange={(e) => handleChange('columns', 'reinforcement', e.target.value)}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'medium', label: 'Medium' },
                { value: 'heavy', label: 'Heavy' }
              ]}
            />
          </FormField>
          
          <FormField 
            label="Connection Type" 
            htmlFor="columns-connection"
            tooltip="How columns connect to beams. Rigid connections transfer more force but allow less movement."
          >
            <Select
              id="columns-connection"
              value={params.columns.connectionType}
              onChange={(e) => handleChange('columns', 'connectionType', e.target.value)}
              options={[
                { value: 'rigid', label: 'Rigid' },
                { value: 'semi-rigid', label: 'Semi-rigid' },
                { value: 'pinned', label: 'Pinned' }
              ]}
            />
          </FormField>
        </FormRow>
      </FormSection>

      {/* Beams Section */}
      <FormSection title="Beams" description="Define the properties of structural beams">
        <FormRow cols={4}>
          <FormField 
            label="Width (m)" 
            htmlFor="beams-width"
            tooltip="The width of beams in meters. Affects load distribution and structural integrity."
          >
            <Input
              type="number"
              id="beams-width"
              value={params.beams.width}
              onChange={(e) => handleChange('beams', 'width', parseFloat(e.target.value))}
              step="0.1"
              min="0.2"
              max="1"
            />
          </FormField>
          
          <FormField 
            label="Depth (m)" 
            htmlFor="beams-depth"
            tooltip="The depth of beams in meters. Deeper beams provide more resistance to bending."
          >
            <Input
              type="number"
              id="beams-depth"
              value={params.beams.depth}
              onChange={(e) => handleChange('beams', 'depth', parseFloat(e.target.value))}
              step="0.1"
              min="0.3"
              max="1.5"
            />
          </FormField>
          
          <FormField 
            label="Reinforcement" 
            htmlFor="beams-reinforcement"
            tooltip="The amount of steel reinforcement in the beams. Affects strength and ductility."
          >
            <Select
              id="beams-reinforcement"
              value={params.beams.reinforcement}
              onChange={(e) => handleChange('beams', 'reinforcement', e.target.value)}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'medium', label: 'Medium' },
                { value: 'heavy', label: 'Heavy' }
              ]}
            />
          </FormField>
          
          <FormField 
            label="Connection Type" 
            htmlFor="beams-connection"
            tooltip="How beams connect to columns. Affects force transfer during seismic events."
          >
            <Select
              id="beams-connection"
              value={params.beams.connectionType}
              onChange={(e) => handleChange('beams', 'connectionType', e.target.value)}
              options={[
                { value: 'rigid', label: 'Rigid' },
                { value: 'semi-rigid', label: 'Semi-rigid' },
                { value: 'pinned', label: 'Pinned' }
              ]}
            />
          </FormField>
        </FormRow>
      </FormSection>

      {/* Slabs Section */}
      <FormSection title="Slabs" description="Define the properties of floor slabs">
        <FormRow cols={3}>
          <FormField 
            label="Thickness (m)" 
            htmlFor="slabs-thickness"
            tooltip="The thickness of floor slabs in meters. Thicker slabs provide more rigidity but add weight."
          >
            <Input
              type="number"
              id="slabs-thickness"
              value={params.slabs.thickness}
              onChange={(e) => handleChange('slabs', 'thickness', parseFloat(e.target.value))}
              step="0.05"
              min="0.1"
              max="0.5"
                />
              </FormField>
              
              <FormField 
                label="Reinforcement" 
                htmlFor="slabs-reinforcement"
                tooltip="The amount of steel reinforcement in the slabs. Affects load distribution and crack resistance."
              >
                <Select
                  id="slabs-reinforcement"
                  value={params.slabs.reinforcement}
                  onChange={(e) => handleChange('slabs', 'reinforcement', e.target.value)}
                  options={[
                    { value: 'light', label: 'Light' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'heavy', label: 'Heavy' }
                  ]}
                  className="transition-all focus:ring-2 focus:ring-blue-500"
                />
              </FormField>
              
              <FormField 
                label="Type" 
                htmlFor="slabs-type"
                tooltip="The structural system of the slab. Affects load distribution and behavior during seismic events."
              >
                <Select
                  id="slabs-type"
                  value={params.slabs.type}
                  onChange={(e) => handleChange('slabs', 'type', e.target.value)}
                  options={[
                    { value: 'one-way', label: 'One-way' },
                    { value: 'two-way', label: 'Two-way' },
                    { value: 'flat', label: 'Flat' }
                  ]}
                  className="transition-all focus:ring-2 focus:ring-blue-500"
                />
              </FormField>
            </FormRow>
      </FormSection>

      {/* Foundation Section */}
      <FormSection title="Foundation" description="Define the properties of building foundation">
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
            <FormRow cols={2}>
              <FormField 
                label="Type" 
                htmlFor="foundation-type"
                tooltip="The type of foundation system. Different types are suitable for different soil conditions and building loads."
              >
                <Select
                  id="foundation-type"
                  value={params.foundation.type}
                  onChange={(e) => handleChange('foundation', 'type', e.target.value)}
                  options={[
                    { value: 'isolated', label: 'Isolated' },
                    { value: 'strip', label: 'Strip' },
                    { value: 'raft', label: 'Raft' },
                    { value: 'pile', label: 'Pile' }
                  ]}
                  className="transition-all focus:ring-2 focus:ring-blue-500"
                />
              </FormField>
              
              <FormField 
                label="Depth (m)" 
                htmlFor="foundation-depth"
                tooltip="The depth of the foundation in meters. Deeper foundations provide more stability but are more expensive."
              >
                <Input
                  type="number"
                  id="foundation-depth"
                  value={params.foundation.depth}
                  onChange={(e) => handleChange('foundation', 'depth', parseFloat(e.target.value))}
                  step="0.5"
                  min="1"
                  max="20"
                  className="transition-all focus:ring-2 focus:ring-blue-500"
                />
              </FormField>
            </FormRow>
          </div>
        </FormSection>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        size="md"
      >
        Update Structural Properties
      </Button>
    </form>
  );
}