import React, { useState } from 'react';
import { BuildingParams } from './BuildingParameterForm';
import { SeismicParams } from './SeismicParameterForm';

type SimulationResult = {
  id: string;
  name: string;
  buildingParams: BuildingParams;
  seismicParams: SeismicParams;
  results: {
    maxDisplacement: number;
    interStoryDrift: number;
    baseShear: number;
    damageIndex: number;
    hasCollapsed: boolean;
  };
};

type SimulationComparisonViewProps = {
  savedResults: SimulationResult[];
};

export default function SimulationComparisonView({
  savedResults
}: SimulationComparisonViewProps) {
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  
  const toggleResultSelection = (id: string) => {
    if (selectedResults.includes(id)) {
      setSelectedResults(selectedResults.filter(resultId => resultId !== id));
    } else {
      // Limit to comparing 3 simulations at once for clarity
      if (selectedResults.length < 3) {
        setSelectedResults([...selectedResults, id]);
      }
    }
  };
  
  const filteredResults = savedResults.filter(result => 
    selectedResults.includes(result.id)
  );
  
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <h3 className="font-bold mb-3">Simulation Comparison</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
          Select up to 3 simulations to compare:
        </p>
        
        <div className="flex flex-wrap gap-2">
          {savedResults.map(result => (
            <button
              key={result.id}
              onClick={() => toggleResultSelection(result.id)}
              className={`px-3 py-1 rounded text-sm ${
                selectedResults.includes(result.id)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              {result.name}
            </button>
          ))}
        </div>
      </div>
      
      {filteredResults.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="p-2 text-left">Metric</th>
                {filteredResults.map(result => (
                  <th key={result.id} className="p-2 text-left">{result.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 font-medium">Max Displacement</td>
                {filteredResults.map(result => (
                  <td key={result.id} className="p-2">
                    {result.results.maxDisplacement.toFixed(2)} m
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 font-medium">Inter-story Drift</td>
                {filteredResults.map(result => (
                  <td key={result.id} className="p-2">
                    {result.results.interStoryDrift.toFixed(2)}%
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 font-medium">Base Shear</td>
                {filteredResults.map(result => (
                  <td key={result.id} className="p-2">
                    {result.results.baseShear.toFixed(2)} kN
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 font-medium">Damage Index</td>
                {filteredResults.map(result => (
                  <td key={result.id} className={`p-2 ${
                    result.results.damageIndex > 0.7 ? 'text-red-500' :
                    result.results.damageIndex > 0.4 ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    {result.results.damageIndex.toFixed(2)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 font-medium">Structural Integrity</td>
                {filteredResults.map(result => (
                  <td key={result.id} className={`p-2 ${
                    result.results.hasCollapsed ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {result.results.hasCollapsed ? 'Collapsed' : 'Intact'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-500 py-4">
          Select simulations to compare results
        </p>
      )}
    </div>
  );
}