'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { BuildingParams } from './BuildingParameterForm';
import { SeismicParams } from './SeismicParameterForm';

// Dynamically import the full 3D visualizer with no SSR
const CombinedSimulator = dynamic(() => import('./CombinedSimulator').then(mod => {
  console.log('Loading full WebGL 3D renderer');
  return mod;
}), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-2 mx-auto"></div>
        <p>Loading 3D Visualizer...</p>
      </div>
    </div>
  )
});

// Import the basic simulator with reduced complexity
const BasicSimulator = dynamic(() => import('./BasicSimulator'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-2 mx-auto"></div>
        <p>Loading Basic 3D View...</p>
      </div>
    </div>
  )
});

type SafeSimulatorProps = {
  buildingParams: BuildingParams;
  seismicParams: SeismicParams;
  elapsedTime: number;
  preferBasicMode?: boolean;
};

// Troubleshooting guide component with basic mode option
function TroubleshootingGuide({ 
  onReload, 
  onUseBasicMode 
}: { 
  onReload: () => void;
  onUseBasicMode: () => void;
}) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 p-8 text-center">
      <h3 className="text-xl font-bold text-red-600 mb-4">3D Visualization Error</h3>
      <p className="mb-4">
        There was an issue loading the full 3D visualization. Let's troubleshoot:
      </p>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <button 
          onClick={onUseBasicMode}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Use Basic 3D Mode
        </button>
        
        <button 
          onClick={onReload}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Try Again (Full 3D)
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-700 p-5 rounded-lg max-w-lg mb-5">
        <h4 className="font-semibold mb-3 text-left">Troubleshooting Steps:</h4>
        <ol className="text-sm text-left list-decimal pl-5 space-y-3">
          <li>
            <strong>Use Basic 3D Mode</strong>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">We've created a simplified 3D view that works on more devices.</p>
          </li>
          <li>
            <strong>Use a modern browser</strong>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Chrome, Firefox, Edge, or Safari are recommended.</p>
          </li>
          <li>
            <strong>Update graphics drivers</strong>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Outdated drivers can cause WebGL issues.</p>
          </li>
          <li>
            <strong>Enable hardware acceleration</strong>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              In Chrome: Settings → System → "Use hardware acceleration"
            </p>
          </li>
        </ol>
      </div>
    </div>
  );
}

export default function SafeSimulator({
  buildingParams,
  seismicParams,
  elapsedTime,
  preferBasicMode = false
}: SafeSimulatorProps) {
  const [renderMode, setRenderMode] = useState<'full' | 'basic' | 'error'>(
    preferBasicMode ? 'basic' : 'full'
  );
  const [forceReload, setForceReload] = useState(0);
  
  // Update renderMode if preferBasicMode changes
  useEffect(() => {
    if (preferBasicMode && renderMode === 'full') {
      setRenderMode('basic');
    } else if (!preferBasicMode && renderMode === 'basic') {
      // Only switch back to full if it wasn't set to basic due to an error
      setRenderMode('full');
    }
  }, [preferBasicMode, renderMode]);
  
  // Handle reload attempts
  const handleReload = () => {
    setForceReload(prev => prev + 1);
    setRenderMode('full');
  };
  
  // Switch to basic mode
  const handleUseBasicMode = () => {
    setRenderMode('basic');
  };

  // If in basic mode, render the simplified simulator
  if (renderMode === 'basic') {
    return <BasicSimulator {...{ buildingParams, seismicParams, elapsedTime }} />;
  }

  // If there was an error, show troubleshooting guide
  if (renderMode === 'error') {
    return (
      <TroubleshootingGuide 
        onReload={handleReload} 
        onUseBasicMode={handleUseBasicMode} 
      />
    );
  }

  // Otherwise, try to render the full 3D visualizer with error handling
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-2 mx-auto"></div>
            <p>Loading 3D Visualizer...</p>
            <p className="text-xs mt-2 text-gray-500">This might take a few moments</p>
          </div>
        </div>
      }
    >
      <ErrorBoundary key={`3d-renderer-${forceReload}`} onError={() => setRenderMode('error')}>
        <CombinedSimulator {...{ buildingParams, seismicParams, elapsedTime }} />
      </ErrorBoundary>
    </Suspense>
  );
}

// Error boundary component for catching rendering errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Error in 3D visualization:', error, errorInfo);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null; // Parent will handle error UI
    }

    return this.props.children;
  }
} 