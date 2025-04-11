import React, { useState } from 'react';
import { SeismicParams } from './SeismicParameterForm';

// Define historical earthquake data
export const historicalEarthquakes = [
  {
    id: 'tohoku2011',
    name: 'Tohoku, Japan (2011)',
    description: 'One of the most powerful earthquakes ever recorded, causing a devastating tsunami.',
    magnitude: 9.0,
    depth: 29,
    epicenterX: -5,
    epicenterY: -7,
    waveVelocity: 2.5,
    duration: 180,
    distance: 120,
    showGrid: true,
    showStats: true,
    image: '/earthquakes/tohoku.jpg'
  },
  {
    id: 'haiti2010',
    name: 'Haiti (2010)',
    description: 'Catastrophic earthquake that caused extensive damage to infrastructure.',
    magnitude: 7.0,
    depth: 13,
    epicenterX: -2,
    epicenterY: -3,
    waveVelocity: 1.8,
    duration: 35,
    distance: 45,
    showGrid: true,
    showStats: true,
    image: '/earthquakes/haiti.jpg'
  },
  {
    id: 'chile1960',
    name: 'Valdivia, Chile (1960)',
    description: 'The most powerful earthquake ever recorded (9.5), causing tsunamis across the Pacific.',
    magnitude: 9.5,
    depth: 33,
    epicenterX: -8,
    epicenterY: -10,
    waveVelocity: 3.0,
    duration: 210,
    distance: 150,
    showGrid: true,
    showStats: true,
    image: '/earthquakes/chile.jpg'
  },
  {
    id: 'sanFrancisco1906',
    name: 'San Francisco (1906)',
    description: 'Historic earthquake that destroyed much of San Francisco through fire and building collapse.',
    magnitude: 7.9,
    depth: 8,
    epicenterX: -1,
    epicenterY: -2,
    waveVelocity: 1.5,
    duration: 45,
    distance: 35,
    showGrid: true,
    showStats: true,
    image: '/earthquakes/sanfrancisco.jpg'
  },
  {
    id: 'kobe1995',
    name: 'Kobe, Japan (1995)',
    description: 'One of the most destructive earthquakes to hit Japan, causing extensive damage to infrastructure.',
    magnitude: 6.9,
    depth: 16,
    epicenterX: -3,
    epicenterY: -4,
    waveVelocity: 1.7,
    duration: 20,
    distance: 40,
    showGrid: true,
    showStats: true,
    image: '/earthquakes/kobe.jpg'
  },
  {
    id: 'sumatra2004',
    name: 'Sumatra, Indonesia (2004)',
    description: 'Triggered a devastating tsunami that killed over 230,000 people across multiple countries.',
    magnitude: 9.1,
    depth: 30,
    epicenterX: -9,
    epicenterY: -8,
    waveVelocity: 2.8,
    duration: 240,
    distance: 180,
    showGrid: true,
    showStats: true,
    image: '/earthquakes/sumatra.jpg'
  },
  {
    id: 'mexico1985',
    name: 'Mexico City (1985)',
    description: 'Famous for demonstrating the effects of soil amplification in a sedimentary basin.',
    magnitude: 8.0,
    depth: 18,
    epicenterX: -6,
    epicenterY: -5,
    waveVelocity: 2.0,
    duration: 60,
    distance: 75,
    showGrid: true,
    showStats: true,
    image: '/earthquakes/mexico.jpg'
  },
  {
    id: 'christchurch2011',
    name: 'Christchurch, NZ (2011)',
    description: 'Moderate earthquake that caused significant damage due to liquefaction and proximity to the city.',
    magnitude: 6.3,
    depth: 5,
    epicenterX: -1,
    epicenterY: -1,
    waveVelocity: 1.2,
    duration: 15,
    distance: 25,
    showGrid: true,
    showStats: true,
    image: '/earthquakes/christchurch.jpg'
  }
];

type HistoricalEarthquakePresetsProps = {
  onSelect: (params: SeismicParams) => void;
};

export default function HistoricalEarthquakePresets({ onSelect }: HistoricalEarthquakePresetsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEarthquake, setSelectedEarthquake] = useState<string | null>(null);

  // This function only selects the earthquake but doesn't apply parameters yet
  const handleSelect = (earthquake: typeof historicalEarthquakes[0]) => {
    setSelectedEarthquake(earthquake.id);
    // No longer calling onSelect here to prevent immediate form submission
  };
  
  // This function applies the selected earthquake parameters when user clicks Apply button
  const applySelectedEarthquake = () => {
    if (selectedEarthquake) {
      const earthquake = historicalEarthquakes.find(eq => eq.id === selectedEarthquake);
      if (earthquake) {
        // Convert to SeismicParams format
        const seismicParams: SeismicParams = {
          magnitude: earthquake.magnitude,
          depth: earthquake.depth,
          epicenterX: earthquake.epicenterX,
          epicenterY: earthquake.epicenterY,
          waveVelocity: earthquake.waveVelocity,
          duration: earthquake.duration,
          distance: earthquake.distance,
          showGrid: earthquake.showGrid,
          showStats: earthquake.showStats
        };
        
        // Only now do we call onSelect to update the form values
        onSelect(seismicParams);
      }
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-md transition-colors"
      >
        <span className="text-lg">🌊</span>
        <span>Historical Earthquake Presets</span>
      </button>

      {isOpen && (
        <div className="fixed left-0 right-0 top-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 border border-gray-200 dark:border-gray-700 w-[800px] max-w-[95vw] max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Historical Earthquakes</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
              {historicalEarthquakes.map(earthquake => (
                <div 
                  key={earthquake.id}
                  className={`
                    border rounded-lg overflow-hidden transition-all cursor-pointer
                    ${selectedEarthquake === earthquake.id 
                      ? 'border-blue-500 shadow-md scale-[1.02]' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'}
                  `}
                  onClick={() => handleSelect(earthquake)}
                >
                  <div className="flex h-full">
                    <div className="w-1/3 bg-gray-100 dark:bg-gray-700 relative">
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                        <span className="text-4xl">🌊</span>
                      </div>
                    </div>
                    <div className="w-2/3 p-3">
                      <h4 className="font-bold text-gray-800 dark:text-white mb-1">{earthquake.name}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">{earthquake.description}</p>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Magnitude:</span>
                          <span className="font-medium text-gray-800 dark:text-white">{earthquake.magnitude}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Depth:</span>
                          <span className="font-medium text-gray-800 dark:text-white">{earthquake.depth} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Distance:</span>
                          <span className="font-medium text-gray-800 dark:text-white">{earthquake.distance} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                          <span className="font-medium text-gray-800 dark:text-white">{earthquake.duration} sec</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={applySelectedEarthquake}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-md transition-colors"
                disabled={!selectedEarthquake}
              >
                Apply Selected Earthquake
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
