'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { BuildingParams } from './BuildingParameterForm';
import { SeismicParams } from './SeismicParameterForm';

// Dynamically import the 3D visualizer with no SSR and forceWebGL
const CombinedSimulator = dynamic(() => import('./CombinedSimulator').then(mod => {
  // Log that we're forcing WebGL
  console.log('Loading WebGL 3D renderer');
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

type SafeSimulatorProps = {
  buildingParams: BuildingParams;
  seismicParams: SeismicParams;
  elapsedTime: number;
};

// Interactive troubleshooting guide component
function TroubleshootingGuide({ onReload }: { onReload: () => void }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 p-8 text-center">
      <h3 className="text-xl font-bold text-red-600 mb-4">3D Visualization Error</h3>
      <p className="mb-4">
        There was an issue loading the 3D visualization. Let's troubleshoot:
      </p>
      
      <button 
        onClick={onReload}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-6"
      >
        Try Again
      </button>
      
      <div className="bg-white dark:bg-gray-700 p-5 rounded-lg max-w-lg mb-5">
        <h4 className="font-semibold mb-3 text-left">Troubleshooting Steps:</h4>
        <ol className="text-sm text-left list-decimal pl-5 space-y-3">
          <li>
            <strong>Use a modern browser</strong>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Chrome, Firefox, Edge, or Safari are recommended. This application requires WebGL support.</p>
          </li>
          <li>
            <strong>Update your graphics drivers</strong>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Outdated graphics drivers can cause WebGL issues. Visit your GPU manufacturer's website for updates.</p>
          </li>
          <li>
            <strong>Enable hardware acceleration</strong>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              In Chrome: Settings → System → "Use hardware acceleration when available"<br/>
              In Firefox: Settings → Performance → "Use recommended performance settings"
            </p>
          </li>
          <li>
            <strong>Try private/incognito mode</strong>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Browser extensions can sometimes interfere with WebGL rendering.</p>
          </li>
          <li>
            <strong>Try a different device</strong>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">If possible, try accessing this application on another device or computer.</p>
          </li>
        </ol>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400">
        This application requires WebGL for 3D visualization. If you're still encountering issues, 
        please try a different browser or device with better WebGL support.
      </p>
    </div>
  );
}

export default function SafeSimulator(props: SafeSimulatorProps) {
  const [hasRuntimeError, setHasRuntimeError] = useState(false);
  const [forceReload, setForceReload] = useState(0);
  
  // Handle reload attempts
  const handleReload = () => {
    // Increment force reload counter to trigger component remount
    setForceReload(prev => prev + 1);
    // Reset error state
    setHasRuntimeError(false);
  };

  // If there's a runtime error, show troubleshooting guide
  if (hasRuntimeError) {
    return <TroubleshootingGuide onReload={handleReload} />;
  }

  // Always attempt to render the 3D visualizer with error handling
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-2 mx-auto"></div>
            <p>Loading 3D Visualizer...</p>
            <p className="text-xs mt-2 text-gray-500">This might take a few moments on first load</p>
          </div>
        </div>
      }
    >
      <ErrorBoundary key={`3d-renderer-${forceReload}`} onError={() => setHasRuntimeError(true)}>
        <CombinedSimulator {...props} />
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
      return null; // Empty render - parent component will handle showing the error UI
    }

    return this.props.children;
  }
} 