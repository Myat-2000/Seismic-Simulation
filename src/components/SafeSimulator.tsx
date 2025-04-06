'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { BuildingParams } from './BuildingParameterForm';
import { SeismicParams } from './SeismicParameterForm';

// Load simulators with special settings to prevent initialization errors
const BasicSimulator = dynamic(() => import('./BasicSimulator'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center max-w-md p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-t-green-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-t-transparent border-r-transparent border-b-green-300 border-l-transparent rounded-full animate-spin animation-delay-500"></div>
        </div>
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Loading Basic 3D Mode</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm">Optimized for performance and compatibility</p>
      </div>
    </div>
  )
});

// Use dynamic import with noSSR to prevent WebGL initialization issues
const CombinedSimulator = dynamic(() => import('./CombinedSimulator'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center max-w-md p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-t-transparent border-r-transparent border-b-blue-300 border-l-transparent rounded-full animate-spin animation-delay-500"></div>
        </div>
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Loading Full 3D Visualization</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm">High-quality rendering with detailed effects</p>
        <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-4 overflow-hidden">
          <div className="h-full bg-blue-500 animate-pulse-width"></div>
        </div>
      </div>
    </div>
  )
});

// Props definition
export type SafeSimulatorProps = {
  buildingParams: BuildingParams;
  seismicParams: SeismicParams;
  elapsedTime: number;
  preferBasicMode?: boolean;
};

// Troubleshooting component
function TroubleshootingGuide({
  onUseBasicMode,
  onTryAgain
}: {
  onUseBasicMode: () => void;
  onTryAgain: () => void;
}) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-6 text-center">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-red-200 dark:border-red-900">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        
        <h2 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">3D Visualization Error</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">We encountered an issue with WebGL rendering. Please try one of these options:</p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
          <button
            onClick={onUseBasicMode}
            className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Use Basic 3D Mode
          </button>
          
          <button
            onClick={onTryAgain}
            className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Try Again
          </button>
        </div>
        
        <div className="text-left text-sm bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h.01a1 1 0 100-2H9z" clipRule="evenodd" />
            </svg>
            Troubleshooting Steps:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Use a modern browser like Chrome, Firefox, or Edge</li>
            <li>Check if WebGL is enabled in your browser settings</li>
            <li>Update your graphics card drivers</li>
            <li>Disable hardware acceleration in your browser and restart</li>
            <li>Try the Basic 3D Mode which uses simplified rendering</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// Main component with error handling
export default function SafeSimulator({ 
  buildingParams, 
  seismicParams, 
  elapsedTime,
  preferBasicMode = false
}: SafeSimulatorProps) {
  // Use state to manage render mode
  const [renderMode, setRenderMode] = useState<'full' | 'basic' | 'error' | 'loading'>(
    preferBasicMode ? 'basic' : 'full'
  );

  // Add loading state
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading state and track mode changes
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate loading time to ensure UI feedback
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [renderMode]);

  // Update renderMode when preferBasicMode changes
  useEffect(() => {
    if (preferBasicMode) {
      setRenderMode('basic');
    } else if (renderMode === 'basic' && !preferBasicMode) {
      setRenderMode('full');
    }
  }, [preferBasicMode, renderMode]);

  // Custom loading spinner
  const LoadingSpinner = ({ mode }: { mode: 'basic' | 'full' }) => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center max-w-md p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className={`absolute top-0 left-0 w-full h-full border-4 border-t-${mode === 'basic' ? 'green' : 'blue'}-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin`}></div>
          <div className={`absolute top-0 left-0 w-full h-full border-4 border-t-transparent border-r-transparent border-b-${mode === 'basic' ? 'green' : 'blue'}-300 border-l-transparent rounded-full animate-spin animation-delay-500`}></div>
        </div>
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
          Loading {mode === 'basic' ? 'Basic' : 'Full'} 3D Mode
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          {mode === 'basic' 
            ? 'Optimized for performance and compatibility'
            : 'High-quality rendering with detailed effects'}
        </p>
      </div>
    </div>
  );

  // Handle render based on mode
  if (renderMode === 'error') {
    return (
      <TroubleshootingGuide
        onUseBasicMode={() => setRenderMode('basic')}
        onTryAgain={() => setRenderMode('full')}
      />
    );
  }

  // Show loading state
  if (isLoading) {
    return <LoadingSpinner mode={renderMode === 'basic' ? 'basic' : 'full'} />;
  }

  // BasicSimulator as fallback
  if (renderMode === 'basic') {
    return (
      <Suspense fallback={<LoadingSpinner mode="basic" />}>
        <ErrorBoundary onError={() => setRenderMode('error')}>
          <BasicSimulator
            buildingParams={buildingParams}
            seismicParams={seismicParams}
            elapsedTime={elapsedTime}
          />
        </ErrorBoundary>
      </Suspense>
    );
  }

  // Full 3D visualization (default)
  return (
    <Suspense fallback={<LoadingSpinner mode="full" />}>
      <ErrorBoundary onError={() => setRenderMode('error')}>
        <CombinedSimulator
          buildingParams={buildingParams}
          seismicParams={seismicParams}
          elapsedTime={elapsedTime}
        />
      </ErrorBoundary>
    </Suspense>
  );
}

// ErrorBoundary component to catch render errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Rendering error:", error, errorInfo);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null; // The parent will show the error UI
    }

    return this.props.children;
  }
} 