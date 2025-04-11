import React, { useState } from 'react';
import { BuildingParams } from './BuildingParameterForm';
import { SeismicParams } from './SeismicParameterForm';
import { StructuralMaterialsParams } from './StructuralMaterialsForm';
import { DetailedBuildingParams } from './StructuralComponentAnalysis';
import HistoricalEarthquakePresets, { historicalEarthquakes } from './HistoricalEarthquakePresets';
import TimeLapseVisualizer from './TimeLapseVisualizer';

type EnhancedSimulationCapabilitiesProps = {
  initialSeismicParams: SeismicParams;
  initialBuildingParams: BuildingParams;
  initialStructuralElements: DetailedBuildingParams['structuralComponents'];
  initialMaterialsParams: StructuralMaterialsParams;
};

export default function EnhancedSimulationCapabilities({
  initialSeismicParams,
  initialBuildingParams,
  initialStructuralElements,
  initialMaterialsParams
}: EnhancedSimulationCapabilitiesProps) {
  // State for current parameters
  const [seismicParams, setSeismicParams] = useState<SeismicParams>(initialSeismicParams);
  const [buildingParams, setBuildingParams] = useState<BuildingParams>(initialBuildingParams);
  const [structuralElements, setStructuralElements] = useState<DetailedBuildingParams['structuralComponents']>(initialStructuralElements);
  const [materialsParams, setMaterialsParams] = useState<StructuralMaterialsParams>(initialMaterialsParams);
  
  // State for active feature
  const [activeFeature, setActiveFeature] = useState<'historical' | 'time-lapse'>('time-lapse');

  return (
    <div className="w-full space-y-6">
      {/* Feature Selection Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeFeature === 'historical'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveFeature('historical')}
          >
            Historical Earthquakes
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeFeature === 'time-lapse'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveFeature('time-lapse')}
          >
            Time-lapse Visualization
          </button>
        </div>
        
        <div className="p-6">
          {/* Feature Description */}
          <div className="mb-6">
            {activeFeature === 'historical' && (
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Historical Earthquake Presets</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Select from a library of historical earthquake data to simulate real-world events.
                  These presets provide realistic parameters based on recorded seismic events.
                </p>
              </div>
            )}
            

            
            {activeFeature === 'time-lapse' && (
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Time-lapse Visualization</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  View the progression of structural damage over time during extended seismic events.
                  Observe how different building elements respond at various stages of an earthquake.
                </p>
              </div>
            )}
          </div>
          
          {/* Feature Content */}
          {activeFeature === 'historical' && (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
              <div className="text-4xl mb-4">🌊</div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Historical Earthquake Feature Moved</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                The Historical Earthquake Presets feature has been moved to the initial Seismic Parameter Form.
                You can now select historical earthquakes at the beginning of your simulation setup.  
              </p>
            </div>
          )}
          

          
          {activeFeature === 'time-lapse' && (
            <TimeLapseVisualizer
              buildingParams={buildingParams}
              seismicParams={seismicParams}
              materialsParams={materialsParams}
              structuralElements={structuralElements}
            />
          )}
        </div>
      </div>
    </div>
  );
}
