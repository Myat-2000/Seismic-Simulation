import React from 'react';
import { FormSection, FormRow, FormField, Input, Select, Button } from './ui/FormComponents';

type VisualizationControlsProps = {
  showStressColors: boolean;
  setShowStressColors: (show: boolean) => void;
  showDeformation: boolean;
  setShowDeformation: (show: boolean) => void;
  deformationScale: number;
  setDeformationScale: (scale: number) => void;
  selectedElement?: {
    type: 'column' | 'beam' | 'slab' | 'foundation';
    id: number;
  };
  setSelectedElement: (element?: { type: 'column' | 'beam' | 'slab' | 'foundation'; id: number }) => void;
  availableElements: {
    columns: number[];
    beams: number[];
    slabs: number[];
    foundations: number[];
  };
};

export default function VisualizationControls({
  showStressColors,
  setShowStressColors,
  showDeformation,
  setShowDeformation,
  deformationScale,
  setDeformationScale,
  selectedElement,
  setSelectedElement,
  availableElements
}: VisualizationControlsProps) {
  const handleElementTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as 'column' | 'beam' | 'slab' | 'foundation' | 'none';
    
    if (type === 'none') {
      setSelectedElement(undefined);
      return;
    }
    
    // Get the first available element of the selected type
    const elementIds = availableElements[`${type}s` as keyof typeof availableElements];
    if (elementIds && elementIds.length > 0) {
      setSelectedElement({
        type: type as 'column' | 'beam' | 'slab' | 'foundation',
        id: elementIds[0]
      });
    }
  };
  
  const handleElementIdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!selectedElement) return;
    
    const id = parseInt(e.target.value);
    setSelectedElement({
      ...selectedElement,
      id
    });
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md transition-all hover:shadow-lg">
      <h3 className="font-bold mb-3 text-gray-900 dark:text-gray-100">Visualization Controls</h3>
      
      <FormSection title="Display Options" description="Control how the structural model is visualized">
        <FormRow cols={2}>
          <FormField
            label="Show Stress Colors"
            htmlFor="show-stress-colors"
            tooltip="Visualize stress levels with color gradients"
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                id="show-stress-colors"
                checked={showStressColors}
                onChange={(e) => setShowStressColors(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="show-stress-colors" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {showStressColors ? 'Enabled' : 'Disabled'}
              </label>
            </div>
          </FormField>
          
          <FormField
            label="Show Deformation"
            htmlFor="show-deformation"
            tooltip="Visualize how the structure deforms under seismic loads"
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                id="show-deformation"
                checked={showDeformation}
                onChange={(e) => setShowDeformation(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="show-deformation" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {showDeformation ? 'Enabled' : 'Disabled'}
              </label>
            </div>
          </FormField>
        </FormRow>
        
        {showDeformation && (
          <FormRow>
            <FormField
              label={`Deformation Scale: ${deformationScale.toFixed(1)}x`}
              htmlFor="deformation-scale"
              tooltip="Adjust the visual scale of deformation (higher values make deformations more visible)"
            >
              <Input
                id="deformation-scale"
                type="range"
                value={deformationScale}
                onChange={(e) => setDeformationScale(parseFloat(e.target.value))}
                min="0.1"
                max="10"
                step="0.1"
              />
            </FormField>
          </FormRow>
        )}
      </FormSection>
      
      <FormSection title="Element Selection" description="Isolate specific structural elements for analysis">
        <FormRow cols={2}>
          <FormField
            label="Element Type"
            htmlFor="element-type"
            tooltip="Select the type of structural element to focus on"
          >
            <Select
              id="element-type"
              value={selectedElement ? selectedElement.type : 'none'}
              onChange={handleElementTypeChange}
              options={[
                { value: 'none', label: 'None (Show All)' },
                { value: 'column', label: 'Column' },
                { value: 'beam', label: 'Beam' },
                { value: 'slab', label: 'Slab' },
                { value: 'foundation', label: 'Foundation' }
              ]}
            />
          </FormField>
          
          {selectedElement && (
            <FormField
              label="Element ID"
              htmlFor="element-id"
              tooltip="Select the specific element to focus on"
            >
              <Select
                id="element-id"
                value={selectedElement.id.toString()}
                onChange={handleElementIdChange}
                options={
                  availableElements[`${selectedElement.type}s` as keyof typeof availableElements].map(id => ({
                    value: id.toString(),
                    label: `${selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)} ${id}`
                  }))
                }
              />
            </FormField>
          )}
        </FormRow>
        
        {selectedElement && (
          <div className="mt-2">
            <Button
              onClick={() => setSelectedElement(undefined)}
              variant="secondary"
              size="sm"
            >
              Clear Selection
            </Button>
          </div>
        )}
      </FormSection>
    </div>
  );
}