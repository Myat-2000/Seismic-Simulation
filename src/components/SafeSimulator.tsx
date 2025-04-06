'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { BuildingParams } from './BuildingParameterForm';
import { SeismicParams } from './SeismicParameterForm';
import { isWebGLSupported, checkBrowserCompatibility, testWebGLCapabilities } from '../utils/browserCompatibilityCheck';

// Dynamically import the 3D visualizer with no SSR
const CombinedSimulator = dynamic(() => import('./CombinedSimulator'), {
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

// Error boundary fallback component
function ErrorFallback({ message }: { message?: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 p-8 text-center">
      <h3 className="text-xl font-bold text-red-600 mb-4">Visualization Error</h3>
      <p className="mb-4">
        {message || "Sorry, we couldn't load the 3D visualization."}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        This might be due to WebGL not being supported in your browser or device.
      </p>
      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg max-w-md">
        <h4 className="font-semibold mb-2">Troubleshooting:</h4>
        <ul className="text-sm text-left list-disc pl-5 space-y-1">
          <li>Try using a modern browser like Chrome, Firefox, or Edge</li>
          <li>Make sure your graphics drivers are up to date</li>
          <li>Check if hardware acceleration is enabled in your browser</li>
          <li>Try refreshing the page or using a different device</li>
        </ul>
      </div>
    </div>
  );
}

export default function SafeSimulator(props: SafeSimulatorProps) {
  const [compatibilityState, setCompatibilityState] = useState<{
    isChecking: boolean;
    isCompatible: boolean;
    errorMessage: string | null;
  }>({
    isChecking: true,
    isCompatible: false,
    errorMessage: null
  });
  
  const [hasRuntimeError, setHasRuntimeError] = useState(false);

  // Check for browser compatibility on the client-side
  useEffect(() => {
    // Skip check if already determined there's an error
    if (hasRuntimeError) return;
    
    const checkCompatibility = async () => {
      try {
        // Check for WebGL support and browser compatibility
        const compatError = checkBrowserCompatibility();
        if (compatError) {
          setCompatibilityState({
            isChecking: false,
            isCompatible: false,
            errorMessage: compatError
          });
          return;
        }
        
        // Perform a deeper WebGL test
        const webGLWorks = await testWebGLCapabilities();
        if (!webGLWorks) {
          setCompatibilityState({
            isChecking: false,
            isCompatible: false,
            errorMessage: "WebGL isn't working properly on your device. This is required for the 3D visualization."
          });
          return;
        }
        
        // All checks passed
        setCompatibilityState({
          isChecking: false,
          isCompatible: true,
          errorMessage: null
        });
      } catch (error) {
        console.error("Error during compatibility check:", error);
        setCompatibilityState({
          isChecking: false,
          isCompatible: false,
          errorMessage: "An error occurred while checking compatibility."
        });
      }
    };
    
    checkCompatibility();
  }, [hasRuntimeError]);

  // If still checking compatibility, show a loading indicator
  if (compatibilityState.isChecking) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">Checking browser compatibility...</div>
        </div>
      </div>
    );
  }

  // If browser is not compatible or there's a runtime error, show error message
  if (!compatibilityState.isCompatible || hasRuntimeError) {
    return <ErrorFallback message={compatibilityState.errorMessage || undefined} />;
  }

  // If browser is compatible, render the 3D visualizer with error handling
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-2 mx-auto"></div>
            <p>Loading 3D Visualizer...</p>
          </div>
        </div>
      }
    >
      <ErrorBoundary onError={() => setHasRuntimeError(true)}>
        <CombinedSimulator {...props} />
      </ErrorBoundary>
    </Suspense>
  );
}

// Simple error boundary component
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
      return <ErrorFallback />;
    }

    return this.props.children;
  }
} 