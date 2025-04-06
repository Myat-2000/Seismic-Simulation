/**
 * Render Optimization Utilities
 * 
 * This file contains utility functions to optimize 3D rendering performance
 * in the seismic simulation application.
 */

import * as THREE from 'three';
import { Object3D, Material, BufferGeometry, Mesh } from 'three';

/**
 * Determines if an object should be rendered based on distance from camera
 * Implements a simple level-of-detail (LOD) system
 */
export function applyDistanceBasedLOD(
  object: Object3D,
  camera: THREE.Camera,
  thresholds: { distance: number; detail: number }[]
): number {
  // Calculate distance to camera
  const objectPosition = new THREE.Vector3();
  object.getWorldPosition(objectPosition);
  const cameraPosition = new THREE.Vector3();
  camera.getWorldPosition(cameraPosition);
  const distance = objectPosition.distanceTo(cameraPosition);
  
  // Find appropriate LOD level based on distance
  for (let i = 0; i < thresholds.length; i++) {
    if (distance > thresholds[i].distance) {
      return thresholds[i].detail;
    }
  }
  
  // Return highest detail if within all thresholds
  return thresholds[thresholds.length - 1].detail;
}

/**
 * Creates a simplified version of a geometry with fewer vertices
 * @param geometry The original geometry
 * @param detailLevel Detail level between 0 (lowest) and 1 (highest)
 */
export function simplifyGeometry(geometry: BufferGeometry, detailLevel: number): BufferGeometry {
  // For safety, clamp detail level between 0 and 1
  const detail = Math.max(0, Math.min(1, detailLevel));
  
  // Create a simplified version of the geometry
  // This is a simple implementation - in a real app you might use a more sophisticated decimation algorithm
  if (geometry.attributes.position && geometry.index) {
    // For indexed geometries, we can skip vertices based on detail level
    const originalIndices = geometry.index.array;
    const newIndices = [];
    
    // Skip indices based on detail level (simple approach)
    const skipFactor = Math.max(1, Math.floor(1 / detail));
    for (let i = 0; i < originalIndices.length; i += 3) {
      // Always include complete triangles (3 indices)
      if (i % (skipFactor * 3) === 0) {
        newIndices.push(
          originalIndices[i],
          originalIndices[i + 1],
          originalIndices[i + 2]
        );
      }
    }
    
    // Create new geometry with reduced indices
    const simplified = geometry.clone();
    simplified.setIndex(newIndices);
    return simplified;
  }
  
  // For non-indexed geometries, return original
  return geometry;
}

/**
 * Checks if an object is in the camera's view frustum
 */
export function isInViewFrustum(object: Object3D, camera: THREE.Camera): boolean {
  const frustum = new THREE.Frustum();
  const projScreenMatrix = new THREE.Matrix4();
  
  // Update the projection matrix
  projScreenMatrix.multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse
  );
  frustum.setFromProjectionMatrix(projScreenMatrix);
  
  // Check if the object's bounding sphere is in the frustum
  const boundingSphere = new THREE.Sphere();
  const boundingBox = new THREE.Box3().setFromObject(object);
  boundingBox.getBoundingSphere(boundingSphere);
  
  return frustum.intersectsSphere(boundingSphere);
}

/**
 * Optimizes material settings based on distance from camera
 */
export function optimizeMaterial(material: Material, distanceToCamera: number): void {
  if (material instanceof THREE.MeshStandardMaterial) {
    // Reduce shadow quality for distant objects
    if (distanceToCamera > 50) {
      material.receiveShadow = false;
      material.castShadow = false;
    }
    
    // Simplify material properties for distant objects
    if (distanceToCamera > 100) {
      material.roughness = 0.8; // Simplify roughness
      material.metalness = 0.2; // Simplify metalness
    }
  }
}

/**
 * Creates an instanced mesh for efficient rendering of many similar objects
 */
export function createInstancedMesh(
  geometry: BufferGeometry,
  material: Material,
  count: number
): THREE.InstancedMesh {
  return new THREE.InstancedMesh(geometry, material, count);
}

/**
 * Updates instance matrix for instanced meshes
 */
export function updateInstanceMatrix(
  instancedMesh: THREE.InstancedMesh,
  index: number,
  position: THREE.Vector3,
  rotation: THREE.Euler,
  scale: THREE.Vector3
): void {
  const matrix = new THREE.Matrix4();
  matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale);
  instancedMesh.setMatrixAt(index, matrix);
  instancedMesh.instanceMatrix.needsUpdate = true;
}

/**
 * Optimizes a mesh by applying various performance improvements
 */
export function optimizeMesh(mesh: Mesh, camera: THREE.Camera): void {
  // Get distance to camera
  const meshPosition = new THREE.Vector3();
  mesh.getWorldPosition(meshPosition);
  const cameraPosition = new THREE.Vector3();
  camera.getWorldPosition(cameraPosition);
  const distance = meshPosition.distanceTo(cameraPosition);
  
  // Apply frustum culling
  mesh.visible = isInViewFrustum(mesh, camera);
  
  // Apply material optimizations
  if (mesh.material) {
    optimizeMaterial(Array.isArray(mesh.material) ? mesh.material[0] : mesh.material, distance);
  }
  
  // Apply geometry optimizations based on distance
  if (distance > 50 && mesh.geometry.attributes.position.count > 1000) {
    // Only optimize complex geometries that are far away
    const detailLevel = 1 - Math.min(1, (distance - 50) / 100);
    mesh.geometry = simplifyGeometry(mesh.geometry, detailLevel);
  }
}

/**
 * Throttles a function to limit how often it can be called
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let lastCall = 0;
  let lastResult: ReturnType<T>;
  
  return function(...args: Parameters<T>): ReturnType<T> | undefined {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      lastResult = func(...args);
    }
    return lastResult;
  };
}