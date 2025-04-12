import React from 'react';
import Image from 'next/image';

type TimelinePreviewProps = {
  timePoint: number;
  seismicIntensity: number;
  description: string;
  thumbnail?: string;
  stressLevels?: {
    columns: number;
    beams: number;
    slabs: number;
    foundation: number;
  };
  criticalPoints?: Array<{
    description: string;
    location: string;
    damageLevel: 'None' | 'Minor' | 'Moderate' | 'Severe' | 'Critical';
  }>;
};

export default function TimelinePreview({
  timePoint,
  seismicIntensity,
  description,
  thumbnail,
  stressLevels,
  criticalPoints
}: TimelinePreviewProps) {
  return (
    <div className="absolute bottom-full mb-2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 w-64 z-50">
      {/* Thumbnail Preview */}
      {thumbnail ? (
        <div className="relative w-full h-32 mb-2 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
          <Image
            src={thumbnail}
            alt={`Timeline preview at ${timePoint}s`}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-32 mb-2 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <span className="text-gray-400 dark:text-gray-500">Preview not available</span>
        </div>
      )}

      {/* Description */}
      <div className="mb-2">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">
          Time: {timePoint.toFixed(1)}s
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
      </div>

      {/* Seismic Intensity */}
      <div className="mb-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">Intensity:</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {(seismicIntensity * 100).toFixed(0)}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${seismicIntensity * 100}%` }}
          />
        </div>
      </div>

      {/* Stress Levels */}
      {stressLevels && (
        <div className="mb-2 space-y-1">
          <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">Stress Levels</h5>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(stressLevels).map(([component, level]) => (
              <div key={component} className="flex justify-between items-center">
                <span className="capitalize text-gray-600 dark:text-gray-400">
                  {component}:
                </span>
                <span
                  className={`font-medium ${getStressColor(level)}`}
                >
                  {(level * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Points */}
      {criticalPoints && criticalPoints.length > 0 && (
        <div className="space-y-1">
          <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">Critical Points</h5>
          <div className="space-y-2">
            {criticalPoints.map((point, index) => (
              <div key={index} className="text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{point.location}</span>
                  <span className={getDamageLevelColor(point.damageLevel)}>
                    {point.damageLevel}
                  </span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions for color coding
function getStressColor(level: number): string {
  if (level >= 0.8) return 'text-red-500 dark:text-red-400';
  if (level >= 0.6) return 'text-orange-500 dark:text-orange-400';
  if (level >= 0.4) return 'text-yellow-500 dark:text-yellow-400';
  return 'text-green-500 dark:text-green-400';
}

function getDamageLevelColor(level: 'None' | 'Minor' | 'Moderate' | 'Severe' | 'Critical'): string {
  const colors = {
    None: 'text-green-500 dark:text-green-400',
    Minor: 'text-blue-500 dark:text-blue-400',
    Moderate: 'text-yellow-500 dark:text-yellow-400',
    Severe: 'text-orange-500 dark:text-orange-400',
    Critical: 'text-red-500 dark:text-red-400'
  };
  return colors[level];
}