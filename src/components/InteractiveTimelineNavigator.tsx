import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SeismicParams } from './SeismicParameterForm';
import Image from 'next/image';

type TimelineMarker = {
  id: string;
  timePoint: number;
  label: string;
  description: string;
  type: 'p-wave' | 's-wave' | 'peak' | 'custom' | 'declining' | 'end';
  thumbnail?: string; // URL or data URI for thumbnail preview
  color?: string; // Color for the marker
  icon?: string; // Icon for the marker
  explanatoryOverlay?: {
    title: string;
    content: string;
    imageUrl?: string;
  };
};

type CustomAnnotation = {
  id: string;
  timePoint: number;
  label: string;
  description: string;
  color: string;
};

type InteractiveTimelineNavigatorProps = {
  currentTime: number;
  duration: number;
  seismicParams: SeismicParams;
  onTimeChange: (time: number) => void;
  onPlayPause: () => void;
  isPlaying: boolean;
  snapshots?: Array<{
    timePoint: number;
    description: string;
    seismicIntensity: number;
  }>;
};

export default function InteractiveTimelineNavigator({
  currentTime,
  duration,
  seismicParams,
  onTimeChange,
  onPlayPause,
  isPlaying,
  snapshots = []
}: InteractiveTimelineNavigatorProps) {
  const [markers, setMarkers] = useState<TimelineMarker[]>([]);
  const [customAnnotations, setCustomAnnotations] = useState<CustomAnnotation[]>([]);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const [isTourMode, setIsTourMode] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState<Partial<CustomAnnotation>>({});
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Generate timeline markers based on seismic parameters with enhanced information
  useEffect(() => {
    const generatedMarkers: TimelineMarker[] = [];
    
    // Initial state
    generatedMarkers.push({
      id: 'start',
      timePoint: 0,
      label: 'Start',
      description: 'Initial state before earthquake',
      type: 'custom',
      color: '#4CAF50',
      icon: '🏢',
      explanatoryOverlay: {
        title: 'Initial Building State',
        content: 'The building is in its normal state before any seismic activity. This is the reference point for measuring all subsequent deformations and stress levels.',
      }
    });
    
    // P-wave arrival (typically first 10-15% of duration)
    const pWaveTime = Math.floor(duration * 0.1);
    generatedMarkers.push({
      id: 'p-wave',
      timePoint: pWaveTime,
      label: 'P-Wave',
      description: 'Primary waves arrive - initial compression waves',
      type: 'p-wave',
      color: '#2196F3',
      icon: '🌊',
      explanatoryOverlay: {
        title: 'Primary Wave (P-Wave) Arrival',
        content: 'P-waves are compression waves that travel through the earth at high velocity. They are the first waves to arrive at a location after an earthquake. These waves push and pull the ground in the direction they travel, causing buildings to compress and expand slightly.',
      }
    });
    
    // S-wave arrival (typically at 20-30% of duration)
    const sWaveTime = Math.floor(duration * 0.25);
    generatedMarkers.push({
      id: 's-wave',
      timePoint: sWaveTime,
      label: 'S-Wave',
      description: 'Secondary waves arrive - stronger shear waves causing lateral movement',
      type: 's-wave',
      color: '#9C27B0',
      icon: '↔️',
      explanatoryOverlay: {
        title: 'Secondary Wave (S-Wave) Arrival',
        content: 'S-waves are shear waves that arrive after P-waves. They move the ground perpendicular to their direction of travel, causing buildings to sway side to side. These waves typically cause more damage than P-waves due to their lateral motion that buildings are less resistant to.',
      }
    });
    
    // Peak intensity (typically at 40-60% of duration)
    const peakTime = Math.floor(duration * 0.5);
    generatedMarkers.push({
      id: 'peak',
      timePoint: peakTime,
      label: 'Peak',
      description: 'Maximum ground acceleration and structural stress',
      type: 'peak',
      color: '#F44336',
      icon: '⚠️',
      explanatoryOverlay: {
        title: 'Peak Intensity',
        content: 'This is the moment of maximum ground acceleration and highest structural stress. Buildings experience their maximum displacement during this phase, and most structural damage occurs at this point. Critical structural elements may reach their yield point or failure threshold.',
      }
    });
    
    // Declining intensity (typically at 70-80% of duration)
    const decliningTime = Math.floor(duration * 0.75);
    generatedMarkers.push({
      id: 'declining',
      timePoint: decliningTime,
      label: 'Declining',
      description: 'Reduced ground motion but cumulative structural damage',
      type: 'declining',
      color: '#FF9800',
      icon: '📉',
      explanatoryOverlay: {
        title: 'Declining Intensity',
        content: 'Ground motion begins to decrease, but buildings may continue to experience significant stress due to accumulated damage and resonance effects. Weakened structural elements may continue to degrade even as the earthquake intensity diminishes.',
      }
    });
    
    // Final state (at end of earthquake)
    generatedMarkers.push({
      id: 'end',
      timePoint: duration,
      label: 'End',
      description: 'Final state - residual deformation and structural assessment',
      type: 'end',
      color: '#607D8B',
      icon: '🔍',
      explanatoryOverlay: {
        title: 'Final State Assessment',
        content: 'The earthquake has ended, leaving the building with residual deformations and damage. This is when structural assessment would begin to evaluate the building\'s safety and integrity. Permanent deformations, cracks, and other damage would be documented and analyzed.',
      }
    });
    
    setMarkers(generatedMarkers);
  }, [duration]);
  
  // Handle timeline click to change time
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || isAddingAnnotation) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = clickPosition / rect.width;
    const newTime = percentage * duration;
    
    onTimeChange(Math.max(0, Math.min(newTime, duration)));
  };
  
  // Handle timeline hover to show preview
  const handleTimelineHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const hoverPosition = e.clientX - rect.left;
    const percentage = hoverPosition / rect.width;
    const hoverTime = percentage * duration;
    
    setHoveredTime(Math.max(0, Math.min(hoverTime, duration)));
  };
  
  // Handle mouse leave
  const handleMouseLeave = () => {
    setHoveredTime(null);
  };
  
  // Start tour mode
  const startTour = () => {
    setIsTourMode(true);
    setCurrentTourStep(0);
    onTimeChange(markers[0].timePoint);
  };
  
  // Go to next tour step
  const nextTourStep = () => {
    if (currentTourStep < markers.length - 1) {
      const nextStep = currentTourStep + 1;
      setCurrentTourStep(nextStep);
      onTimeChange(markers[nextStep].timePoint);
    } else {
      // End tour when we reach the last marker
      setIsTourMode(false);
    }
  };
  
  // Go to previous tour step
  const prevTourStep = () => {
    if (currentTourStep > 0) {
      const prevStep = currentTourStep - 1;
      setCurrentTourStep(prevStep);
      onTimeChange(markers[prevStep].timePoint);
    }
  };
  
  // End tour mode
  const endTour = () => {
    setIsTourMode(false);
  };
  
  // Start adding a custom annotation
  const startAddingAnnotation = () => {
    setIsAddingAnnotation(true);
    setNewAnnotation({
      timePoint: currentTime,
      color: '#3b82f6' // Default blue color
    });
  };
  
  // Save the new annotation
  const saveAnnotation = () => {
    if (newAnnotation.label && newAnnotation.timePoint !== undefined) {
      const annotation: CustomAnnotation = {
        id: `custom-${Date.now()}`,
        timePoint: newAnnotation.timePoint,
        label: newAnnotation.label,
        description: newAnnotation.description || '',
        color: newAnnotation.color || '#3b82f6'
      };
      
      setCustomAnnotations(prev => [...prev, annotation]);
      setIsAddingAnnotation(false);
      setNewAnnotation({});
    }
  };
  
  // Cancel adding annotation
  const cancelAddingAnnotation = () => {
    setIsAddingAnnotation(false);
    setNewAnnotation({});
  };
  
  // Delete a custom annotation
  const deleteAnnotation = (id: string) => {
    setCustomAnnotations(prev => prev.filter(annotation => annotation.id !== id));
  };
  
  // Get the closest marker or annotation to the current time
  const getClosestItem = () => {
    const allItems = [...markers, ...customAnnotations];
    let closest = allItems[0];
    let minDiff = Math.abs(closest.timePoint - currentTime);
    
    for (let i = 1; i < allItems.length; i++) {
      const diff = Math.abs(allItems[i].timePoint - currentTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = allItems[i];
      }
    }
    
    return minDiff < duration * 0.05 ? closest : null;
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get marker color based on type
  const getMarkerColor = (type: TimelineMarker['type']) => {
    switch (type) {
      case 'p-wave': return 'bg-blue-500';
      case 's-wave': return 'bg-purple-500';
      case 'peak': return 'bg-red-500';
      case 'declining': return 'bg-orange-500';
      case 'end': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Get the current tour marker
  const currentTourMarker = isTourMode ? markers[currentTourStep] : null;
  
  // Get the closest item to current time for highlighting
  const closestItem = getClosestItem();
  
  // Generate thumbnail preview for a specific time point
  const generateThumbnailPreview = (timePoint: number) => {
    // In a real implementation, this would generate actual thumbnails
    // For now, we'll return a placeholder based on the time point
    const timePercentage = timePoint / duration;
    let thumbnailType = '';
    
    if (timePercentage === 0) thumbnailType = 'initial';
    else if (timePercentage < 0.2) thumbnailType = 'p-wave';
    else if (timePercentage < 0.4) thumbnailType = 's-wave';
    else if (timePercentage < 0.6) thumbnailType = 'peak';
    else if (timePercentage < 0.8) thumbnailType = 'declining';
    else thumbnailType = 'final';
    
    return `/thumbnails/${thumbnailType}.svg`;
  };
  
  // Find the snapshot that corresponds to the current time
  const currentSnapshot = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return null;
    
    // Find the closest snapshot to the current time
    return snapshots.reduce((closest, snapshot) => {
      const currentDiff = Math.abs(currentTime - snapshot.timePoint);
      const closestDiff = Math.abs(currentTime - closest.timePoint);
      return currentDiff < closestDiff ? snapshot : closest;
    }, snapshots[0]);
  }, [currentTime, snapshots]);

  return (
    <div className="w-full space-y-2">
      {/* Tour mode overlay with enhanced explanations */}
      {isTourMode && currentTourMarker && (
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-4 shadow-md">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 flex items-center">
              <span className="mr-2 text-lg">{currentTourMarker.icon}</span>
              Tour: {currentTourMarker.label} ({formatTime(currentTourMarker.timePoint)})
            </h4>
            <button 
              onClick={endTour}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
            >
              Exit Tour
            </button>
          </div>
          
          {currentTourMarker.explanatoryOverlay && (
            <div className="mb-3">
              <h5 className="font-medium text-blue-700 dark:text-blue-200 mb-1">
                {currentTourMarker.explanatoryOverlay.title}
              </h5>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                {currentTourMarker.explanatoryOverlay.content}
              </p>
              {currentTourMarker.explanatoryOverlay.imageUrl && (
                <div className="mt-2 bg-white dark:bg-gray-800 p-2 rounded border border-blue-100 dark:border-blue-800">
                  <img 
                    src={currentTourMarker.explanatoryOverlay.imageUrl} 
                    alt={currentTourMarker.explanatoryOverlay.title}
                    className="max-w-full h-auto rounded"
                  />
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-between">
            <button
              onClick={prevTourStep}
              disabled={currentTourStep === 0}
              className={`px-3 py-1.5 rounded text-sm font-medium ${currentTourStep === 0 ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-700'}`}
            >
              ← Previous
            </button>
            <button
              onClick={nextTourStep}
              disabled={currentTourStep === markers.length - 1}
              className={`px-3 py-1.5 rounded text-sm font-medium ${currentTourStep === markers.length - 1 ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-700'}`}
            >
              Next →
            </button>
          </div>
        </div>
      )}
      
      {/* Enhanced timeline controls */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={onPlayPause}
            className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-sm"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <span className="text-lg">{isPlaying ? '⏸' : '▶'}</span>
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`text-xs px-2 py-1 rounded-md shadow-sm ${showThumbnails ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}
          >
            {showThumbnails ? '👁️ Hide Previews' : '👁️ Show Previews'}
          </button>
          
          {!isTourMode && (
            <button
              onClick={startTour}
              className="text-xs px-2 py-1 rounded-md bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 shadow-sm"
            >
              🔍 Start Tour
            </button>
          )}
          
          <button
            onClick={startAddingAnnotation}
            disabled={isAddingAnnotation}
            className={`text-xs px-2 py-1 rounded-md shadow-sm ${isAddingAnnotation ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'}`}
          >
            📝 Add Annotation
          </button>
        </div>
      </div>
      
      {/* Annotation form */}
      {isAddingAnnotation && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-3 shadow-md">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Add Custom Annotation</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1" htmlFor="annotation-label">
                Label
              </label>
              <input
                id="annotation-label"
                type="text"
                value={newAnnotation.label || ''}
                onChange={(e) => setNewAnnotation({...newAnnotation, label: e.target.value})}
                className="w-full px-3 py-2 border border-yellow-300 dark:border-yellow-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                placeholder="Brief title for this annotation"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1" htmlFor="annotation-description">
                Description
              </label>
              <textarea
                id="annotation-description"
                value={newAnnotation.description || ''}
                onChange={(e) => setNewAnnotation({...newAnnotation, description: e.target.value})}
                className="w-full px-3 py-2 border border-yellow-300 dark:border-yellow-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                rows={3}
                placeholder="Detailed notes about this point in time"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1" htmlFor="annotation-time">
                Time Point: {formatTime(newAnnotation.timePoint || 0)}
              </label>
              <input
                id="annotation-time"
                type="range"
                value={newAnnotation.timePoint || 0}
                onChange={(e) => setNewAnnotation({...newAnnotation, timePoint: parseFloat(e.target.value)})}
                className="w-full accent-yellow-500"
                min={0}
                max={duration}
                step={0.1}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1" htmlFor="annotation-color">
                Color
              </label>
              <div className="flex space-x-2">
                {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewAnnotation({...newAnnotation, color})}
                    className={`w-6 h-6 rounded-full ${newAnnotation.color === color ? 'ring-2 ring-offset-2 ring-yellow-500' : ''}`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={cancelAddingAnnotation}
                className="px-3 py-1.5 rounded text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={saveAnnotation}
                disabled={!newAnnotation.label}
                className={`px-3 py-1.5 rounded text-sm font-medium ${!newAnnotation.label ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-600 text-white'}`}
              >
                Save Annotation
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Enhanced visual timeline with markers and thumbnails */}
      <div 
        className="relative h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-inner"
        ref={timelineRef}
        onClick={handleTimelineClick}
        onMouseMove={handleTimelineHover}
        onMouseLeave={handleMouseLeave}
      >
        {/* Timeline track */}
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 dark:bg-blue-600 transition-all duration-100"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Timeline markers */}
        <div className="absolute inset-0">
          {markers.map(marker => (
            <div 
              key={marker.id}
              className="absolute top-0 bottom-0 flex flex-col items-center justify-center cursor-pointer group"
              style={{ left: `${(marker.timePoint / duration) * 100}%`, transform: 'translateX(-50%)' }}
              onClick={(e) => {
                e.stopPropagation();
                onTimeChange(marker.timePoint);
              }}
            >
              <div 
                className={`w-4 h-4 rounded-full shadow-md z-10 transition-transform group-hover:scale-125`}
                style={{ backgroundColor: marker.color || getMarkerColor(marker.type) }}
              ></div>
              <div className="absolute bottom-1 text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-900 px-1.5 py-0.5 rounded shadow-sm">
                {marker.icon && <span className="mr-1">{marker.icon}</span>}
                {marker.label}
              </div>
              
              {/* Thumbnail preview on hover */}
              {showThumbnails && (
                <div className="absolute -top-24 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 w-48">
                    <div className="text-xs font-medium text-gray-800 dark:text-white mb-1">{marker.label}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">{marker.description}</div>
                    <div className="bg-gray-100 dark:bg-gray-700 h-24 rounded flex items-center justify-center">
                      {marker.thumbnail ? (
                        <img src={marker.thumbnail} alt={marker.label} className="max-h-full max-w-full rounded" />
                      ) : (
                        <div className="text-2xl">{marker.icon || '🔍'}</div>
                      )}
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-white dark:bg-gray-800 transform rotate-45 border-b border-r border-gray-200 dark:border-gray-700 mx-auto -mt-1.5"></div>
                </div>
              )}
            </div>
          ))}
          
          {/* Custom annotations */}
          {customAnnotations.map(annotation => (
            <div 
              key={annotation.id}
              className="absolute top-0 bottom-0 flex flex-col items-center justify-center cursor-pointer group"
              style={{ left: `${(annotation.timePoint / duration) * 100}%`, transform: 'translateX(-50%)' }}
              onClick={(e) => {
                e.stopPropagation();
                onTimeChange(annotation.timePoint);
              }}
            >
              <div 
                className="w-3 h-3 rounded-full shadow-md z-10 transition-transform group-hover:scale-125"
                style={{ backgroundColor: annotation.color }}
              ></div>
              <div className="absolute bottom-1 text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-900 px-1.5 py-0.5 rounded shadow-sm flex items-center">
                <span>{annotation.label}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAnnotation(annotation.id);
                  }}
                  className="ml-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  aria-label="Delete annotation"
                >
                  ×
                </button>
              </div>
              
              {/* Annotation preview on hover */}
              {showThumbnails && (
                <div className="absolute -top-24 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 w-48">
                    <div className="text-xs font-medium text-gray-800 dark:text-white mb-1 flex justify-between items-center">
                      <span>{annotation.label}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatTime(annotation.timePoint)}</span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{annotation.description}</div>
                  </div>
                  <div className="w-3 h-3 bg-white dark:bg-gray-800 transform rotate-45 border-b border-r border-gray-200 dark:border-gray-700 mx-auto -mt-1.5"></div>
                </div>
              )}
            </div>
          ))}
          
          {/* Current time indicator */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          >
            <div className="w-3 h-3 rounded-full bg-red-500 absolute -top-1 -ml-1.5"></div>
          </div>
          
          {/* Hover time indicator */}
          {hoveredTime !== null && (
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-gray-400 dark:bg-gray-500 opacity-50 z-10"
              style={{ left: `${(hoveredTime / duration) * 100}%` }}
            >
              <div className="absolute -top-6 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded">
                {formatTime(hoveredTime)}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* List of custom annotations */}
      {customAnnotations.length > 0 && (
        <div className="mt-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Annotations</h4>
          <div className="space-y-1.5">
            {customAnnotations.map(annotation => (
              <div 
                key={annotation.id} 
                className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer"
                onClick={() => onTimeChange(annotation.timePoint)}
              >
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: annotation.color }}
                  ></div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-white">{annotation.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatTime(annotation.timePoint)}</div>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAnnotation(annotation.id);
                  }}
                  className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                  aria-label="Delete annotation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>