import { useState, FormEvent } from 'react';

export type BuildingParams = {
  height: number;
  width: number;
  depth: number;
  floors: number;
  stiffness: number; // Building stiffness factor (1-10)
  dampingRatio: number; // Structural damping (0.01-0.1)
  materialType: 'concrete' | 'steel' | 'wood';
};

const defaultBuildingParams: BuildingParams = {
  height: 50,
  width: 20,
  depth: 20,
  floors: 6,
  stiffness: 5,
  dampingRatio: 0.05,
  materialType: 'concrete',
};

type BuildingParameterFormProps = {
  onSubmit: (params: BuildingParams) => void;
  initialParams?: Partial<BuildingParams>;
};

export default function BuildingParameterForm({ onSubmit, initialParams = {} }: BuildingParameterFormProps) {
  const [params, setParams] = useState<BuildingParams>({
    ...defaultBuildingParams,
    ...initialParams,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(params);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    setParams((prev) => ({
      ...prev,
      [name]: type === 'number' || type === 'range'
        ? (value === '' ? '' : isNaN(parseFloat(value)) ? prev[name as keyof BuildingParams] : parseFloat(value))
        : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Building Parameters</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="height" className="block mb-1 font-medium">
            Height (m)
          </label>
          <input
            type="number"
            id="height"
            name="height"
            min="10"
            max="500"
            step="5"
            value={params.height}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>
        
        <div>
          <label htmlFor="width" className="block mb-1 font-medium">
            Width (m)
          </label>
          <input
            type="number"
            id="width"
            name="width"
            min="5"
            max="100"
            step="1"
            value={params.width}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>
        
        <div>
          <label htmlFor="depth" className="block mb-1 font-medium">
            Depth (m)
          </label>
          <input
            type="number"
            id="depth"
            name="depth"
            min="5"
            max="100"
            step="1"
            value={params.depth}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>
        
        <div>
          <label htmlFor="floors" className="block mb-1 font-medium">
            Number of Floors
          </label>
          <input
            type="number"
            id="floors"
            name="floors"
            min="1"
            max="100"
            step="1"
            value={params.floors}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>
        
        <div>
          <label htmlFor="stiffness" className="block mb-1 font-medium">
            Structural Stiffness (1-10)
          </label>
          <input
            type="range"
            id="stiffness"
            name="stiffness"
            min="1"
            max="10"
            step="0.1"
            value={params.stiffness}
            onChange={handleChange}
            className="w-full"
          />
          <div className="text-right text-sm">{params.stiffness.toFixed(1)}</div>
        </div>
        
        <div>
          <label htmlFor="dampingRatio" className="block mb-1 font-medium">
            Damping Ratio (0.01-0.1)
          </label>
          <input
            type="range"
            id="dampingRatio"
            name="dampingRatio"
            min="0.01"
            max="0.1"
            step="0.01"
            value={params.dampingRatio}
            onChange={handleChange}
            className="w-full"
          />
          <div className="text-right text-sm">{params.dampingRatio.toFixed(2)}</div>
        </div>
        
        <div className="md:col-span-2">
          <label htmlFor="materialType" className="block mb-1 font-medium">
            Building Material
          </label>
          <select
            id="materialType"
            name="materialType"
            value={params.materialType}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="concrete">Reinforced Concrete</option>
            <option value="steel">Steel Frame</option>
            <option value="wood">Wood Frame</option>
          </select>
        </div>
      </div>
      
      <div className="pt-2">
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Apply Building Parameters
        </button>
      </div>
    </form>
  );
} 