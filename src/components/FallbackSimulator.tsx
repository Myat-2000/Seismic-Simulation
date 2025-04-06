'use client';

import { useRef, useEffect } from 'react';
import { BuildingParams } from './BuildingParameterForm';
import { SeismicParams } from './SeismicParameterForm';

type FallbackSimulatorProps = {
  buildingParams: BuildingParams;
  seismicParams: SeismicParams;
  elapsedTime: number;
};

/**
 * A simple 2D fallback visualization that works without WebGL
 */
export default function FallbackSimulator({ buildingParams, seismicParams, elapsedTime }: FallbackSimulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Extract parameters
    const { magnitude, epicenterX, epicenterY, waveVelocity } = seismicParams;
    const { height, width, depth, floors, materialType } = buildingParams;
    
    // Animation function
    const render = () => {
      if (!ctx || !canvas) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Set up coordinate system (center of canvas)
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Draw ground
      ctx.fillStyle = '#555555';
      ctx.fillRect(0, centerY + 50, canvas.width, 20);
      
      // Draw seismic waves as concentric circles
      const waveRadius = elapsedTime * waveVelocity * 30;
      const maxWaves = 5;
      
      for (let i = 0; i < maxWaves; i++) {
        const radius = waveRadius - i * 20;
        if (radius > 0) {
          const opacity = Math.max(0, 1 - radius / (canvas.width / 1.5));
          
          // P-waves (red)
          ctx.beginPath();
          ctx.arc(centerX + epicenterX * 5, centerY + 50, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 50, 50, ${opacity})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // S-waves (blue, smaller radius)
          ctx.beginPath();
          ctx.arc(centerX + epicenterX * 5, centerY + 50, radius * 0.6, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(50, 100, 255, ${opacity})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      
      // Get building color based on material type
      let buildingColor = '#a0a0a0'; // default (concrete)
      if (materialType === 'steel') {
        buildingColor = '#607d8b';
      } else if (materialType === 'wood') {
        buildingColor = '#8d6e63';
      }
      
      // Calculate building dimensions
      const buildingWidth = width * 10;
      const buildingHeight = height * 10;
      const buildingX = centerX - buildingWidth / 2;
      const buildingY = centerY + 50 - buildingHeight;
      
      // Calculate displacement based on time and magnitude
      const displacementAmplitude = magnitude * 2;
      const displacement = Math.sin(elapsedTime * 5) * displacementAmplitude;
      
      // Draw building with displacement
      ctx.fillStyle = buildingColor;
      ctx.fillRect(buildingX + displacement, buildingY, buildingWidth, buildingHeight);
      
      // Draw floors
      const floorHeight = buildingHeight / floors;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      
      for (let i = 1; i < floors; i++) {
        const y = buildingY + i * floorHeight;
        
        // Add individual floor displacement (more at the top)
        const floorFactor = i / floors;
        const floorDisplacement = displacement * (1 + floorFactor);
        
        ctx.beginPath();
        ctx.moveTo(buildingX + floorDisplacement, y);
        ctx.lineTo(buildingX + buildingWidth + floorDisplacement, y);
        ctx.stroke();
      }
      
      // Draw windows
      ctx.fillStyle = 'rgba(200, 230, 255, 0.7)';
      const windowWidth = 8;
      const windowHeight = 12;
      const windowsPerFloor = Math.floor(buildingWidth / 20);
      
      for (let floor = 0; floor < floors; floor++) {
        const floorY = buildingY + floor * floorHeight + 10;
        const floorFactor = floor / floors;
        const floorDisplacement = displacement * (1 + floorFactor);
        
        for (let w = 0; w < windowsPerFloor; w++) {
          const windowX = buildingX + 10 + w * 20 + floorDisplacement;
          ctx.fillRect(windowX, floorY, windowWidth, windowHeight);
        }
      }
      
      // Add legends and information
      ctx.fillStyle = '#000';
      ctx.font = '14px Arial';
      ctx.fillText(`Magnitude: ${magnitude.toFixed(1)}`, 20, 30);
      ctx.fillText(`Elapsed: ${elapsedTime.toFixed(1)}s`, 20, 50);
      ctx.fillText(`Building Height: ${height}m (${floors} floors)`, 20, 70);
      
      // Draw damage indicator
      const damagePercent = Math.min(100, Math.max(0, magnitude * elapsedTime / 2));
      ctx.fillText(`Damage Risk: ${damagePercent.toFixed(0)}%`, 20, 90);
      
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.fillText('2D Fallback Visualization (WebGL not available)', canvas.width - 300, canvas.height - 20);
      
      // Continue animation
      animationRef.current = requestAnimationFrame(render);
    };
    
    // Start animation
    render();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, [buildingParams, seismicParams, elapsedTime]);
  
  return (
    <div className="w-full h-full relative bg-gray-100 dark:bg-gray-800">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
      <div className="absolute top-4 right-4 bg-white/70 dark:bg-black/70 p-2 rounded text-sm">
        <p className="font-bold text-red-600">Using 2D Fallback Mode</p>
        <p className="text-xs">Your device doesn't support 3D rendering</p>
      </div>
    </div>
  );
} 