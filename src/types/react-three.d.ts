import * as THREE from 'three';

declare module '@react-three/fiber' {
  interface ThreeElements {
    mesh: JSX.IntrinsicElements['mesh'];
    group: JSX.IntrinsicElements['group'];
  }
}

declare module '@react-three/drei' {
  export const OrbitControls: React.FC<{
    enableDamping?: boolean;
    dampingFactor?: number;
    target?: [number, number, number];
    maxDistance?: number;
    minDistance?: number;
  }>;
  
  export const PerspectiveCamera: React.FC<{
    makeDefault?: boolean;
    position?: [number, number, number];
    fov?: number;
  }>;
  
  export const Environment: React.FC<{
    preset?: string;
  }>;
  
  export const Stats: React.FC;
  
  export const Grid: React.FC<{
    args?: [number, number];
    position?: [number, number, number];
    cellColor?: string;
    sectionColor?: string;
    fadeDistance?: number;
    fadeStrength?: number;
  }>;
  
  export const Box: React.FC<{
    args?: [number, number, number];
    position?: [number, number, number];
    rotation?: [number, number, number];
    material?: THREE.Material;
    castShadow?: boolean;
    receiveShadow?: boolean;
  }>;
  
  export const Text: React.FC<{
    position?: [number, number, number];
    rotation?: [number, number, number];
    fontSize?: number;
    color?: string;
    anchorX?: string | number;
    anchorY?: string | number;
    children: React.ReactNode;
  }>;
  
  export const Cylinder: React.FC<{
    args?: [number, number, number, number];
    position?: [number, number, number];
    rotation?: [number, number, number];
    material?: THREE.Material;
    castShadow?: boolean;
    receiveShadow?: boolean;
  }>;
} 