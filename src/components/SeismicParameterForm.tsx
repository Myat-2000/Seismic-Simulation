import { useState, FormEvent } from 'react';

export type SeismicParams = {
  magnitude: number;
  depth: number;
  epicenterX: number;
  epicenterY: number;
  waveVelocity: number;
  duration: number;
  showGrid: boolean;
  showStats: boolean;
};

const defaultParams: SeismicParams = {
  magnitude: 5.5,
  depth: 10,
  epicenterX: 0,
  epicenterY: 0,
  waveVelocity: 1.5,
  duration: 30,
  showGrid: true,
  showStats: false,
};

type SeismicParameterFormProps = {
  onSubmit: (params: SeismicParams) => void;
  initialParams?: Partial<SeismicParams>;
};

export default function SeismicParameterForm({ onSubmit, initialParams = {} }: SeismicParameterFormProps) {
  const [params, setParams] = useState<SeismicParams>({
    ...defaultParams,
    ...initialParams,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(params);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setParams((prev) => ({
      ...prev,
      [name]: type === 'checkbox' 
              ? checked 
              : type === 'number' || type === 'range'
                ? (value === '' ? '' : isNaN(parseFloat(value)) ? prev[name as keyof SeismicParams] : parseFloat(value))
                : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Seismic Simulation Parameters</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="magnitude" className="block mb-1 font-medium">
            Magnitude (1-10)
          </label>
          <input
            type="range"
            id="magnitude"
            name="magnitude"
            min="1"
            max="10"
            step="0.1"
            value={params.magnitude}
            onChange={handleChange}
            className="w-full"
          />
          <div className="text-right text-sm">{params.magnitude.toFixed(1)}</div>
        </div>
        
        <div>
          <label htmlFor="depth" className="block mb-1 font-medium">
            Depth (km)
          </label>
          <input
            type="number"
            id="depth"
            name="depth"
            min="0"
            max="50"
            step="0.5"
            value={params.depth}
            onChange={handleChange}
            className="w-full"
          />
        </div>
        
        <div>
          <label htmlFor="epicenterX" className="block mb-1 font-medium">
            Epicenter X
          </label>
          <input
            type="number"
            id="epicenterX"
            name="epicenterX"
            min="-10"
            max="10"
            step="0.5"
            value={params.epicenterX}
            onChange={handleChange}
            className="w-full"
          />
        </div>
        
        <div>
          <label htmlFor="epicenterY" className="block mb-1 font-medium">
            Epicenter Y
          </label>
          <input
            type="number"
            id="epicenterY"
            name="epicenterY"
            min="-10"
            max="10"
            step="0.5"
            value={params.epicenterY}
            onChange={handleChange}
            className="w-full"
          />
        </div>
        
        <div>
          <label htmlFor="waveVelocity" className="block mb-1 font-medium">
            Wave Velocity
          </label>
          <input
            type="number"
            id="waveVelocity"
            name="waveVelocity"
            min="0.1"
            max="5"
            step="0.1"
            value={params.waveVelocity}
            onChange={handleChange}
            className="w-full"
          />
        </div>
        
        <div>
          <label htmlFor="duration" className="block mb-1 font-medium">
            Duration (seconds)
          </label>
          <input
            type="number"
            id="duration"
            name="duration"
            min="5"
            max="60"
            step="1"
            value={params.duration}
            onChange={handleChange}
            className="w-full"
          />
        </div>
      </div>
      
      <div className="flex flex-col space-y-2">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showGrid"
            name="showGrid"
            checked={params.showGrid}
            onChange={handleChange}
            className="mr-2 h-5 w-5 accent-primary"
          />
          <label htmlFor="showGrid" className="font-medium">
            Show Grid
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showStats"
            name="showStats"
            checked={params.showStats}
            onChange={handleChange}
            className="mr-2 h-5 w-5 accent-primary"
          />
          <label htmlFor="showStats" className="font-medium">
            Show Performance Stats
          </label>
        </div>
      </div>
      
      <div className="pt-2">
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Start Simulation
        </button>
      </div>
    </form>
  );
}