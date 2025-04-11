import React, { useState, useEffect } from 'react';
import { BuildingParams } from './BuildingParameterForm';
import { SeismicParams } from './SeismicParameterForm';
import { StructuralMaterialsParams } from './StructuralMaterialsForm';

type SimulationConfig = {
  id: string;
  name: string;
  date: string;
  buildingParams: BuildingParams;
  seismicParams: SeismicParams;
  materialParams: StructuralMaterialsParams;
};

type ConfigurationManagerProps = {
  currentBuildingParams: BuildingParams;
  currentSeismicParams: SeismicParams;
  currentMaterialParams: StructuralMaterialsParams;
  onLoadConfiguration: (config: SimulationConfig) => void;
};

export default function ConfigurationManager({
  currentBuildingParams,
  currentSeismicParams,
  currentMaterialParams,
  onLoadConfiguration
}: ConfigurationManagerProps) {
  const [savedConfigs, setSavedConfigs] = useState<SimulationConfig[]>([]);
  const [configName, setConfigName] = useState('');
  
  // Load saved configurations from localStorage
  useEffect(() => {
    const savedConfigsJson = localStorage.getItem('seismicSimulationConfigs');
    if (savedConfigsJson) {
      try {
        const configs = JSON.parse(savedConfigsJson);
        setSavedConfigs(configs);
      } catch (e) {
        console.error('Failed to parse saved configurations', e);
      }
    }
  }, []);
  
  // Save current configuration
  const handleSaveConfig = () => {
    if (!configName.trim()) {
      alert('Please enter a name for this configuration');
      return;
    }
    
    const newConfig: SimulationConfig = {
      id: Date.now().toString(),
      name: configName,
      date: new Date().toLocaleString(),
      buildingParams: currentBuildingParams,
      seismicParams: currentSeismicParams,
      materialParams: currentMaterialParams
    };
    
    const updatedConfigs = [...savedConfigs, newConfig];
    setSavedConfigs(updatedConfigs);
    localStorage.setItem('seismicSimulationConfigs', JSON.stringify(updatedConfigs));
    setConfigName('');
  };
  
  // Delete a saved configuration
  const handleDeleteConfig = (id: string) => {
    const updatedConfigs = savedConfigs.filter(config => config.id !== id);
    setSavedConfigs(updatedConfigs);
    localStorage.setItem('seismicSimulationConfigs', JSON.stringify(updatedConfigs));
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <h3 className="font-bold mb-3">Configuration Manager</h3>
      
      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            placeholder="Configuration name"
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={handleSaveConfig}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
          >
            Save Current
          </button>
        </div>
      </div>
      
      {savedConfigs.length > 0 ? (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {savedConfigs.map(config => (
            <div 
              key={config.id}
              className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded"
            >
              <div>
                <div className="font-medium">{config.name}</div>
                <div className="text-xs text-gray-500">{config.date}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onLoadConfiguration(config)}
                  className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-sm"
                >
                  Load
                </button>
                <button
                  onClick={() => handleDeleteConfig(config.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-2">No saved configurations</p>
      )}
    </div>
  );
}