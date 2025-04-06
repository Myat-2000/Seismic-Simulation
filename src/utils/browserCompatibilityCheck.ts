// Utility for checking browser compatibility with WebGL

/**
 * Checks if the browser supports WebGL
 * @returns {boolean} True if WebGL is supported, false otherwise
 */
export function isWebGLSupported(): boolean {
  // Only run on client side
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    console.error('Error checking WebGL support:', e);
    return false;
  }
}

/**
 * Check for any known browser incompatibilities with Three.js
 * @returns {string|null} Error message if incompatible, null if compatible
 */
export function checkBrowserCompatibility(): string | null {
  // Only run on client side
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Check for WebGL support
  if (!isWebGLSupported()) {
    return "Your browser doesn't support WebGL, which is required for the 3D visualization.";
  }
  
  // Check for known problematic browsers or versions
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Check for outdated IE
  if (userAgent.indexOf('msie') !== -1 || userAgent.indexOf('trident') !== -1) {
    return "Internet Explorer is not supported. Please use a modern browser like Chrome, Firefox, Edge, or Safari.";
  }
  
  // Check for outdated browsers by feature detection
  if (!window.requestAnimationFrame) {
    return "Your browser is outdated and missing required features. Please update to a newer version.";
  }
  
  // No compatibility issues found
  return null;
}

/**
 * Perform a simple WebGL capability test
 * @returns {Promise<boolean>} True if WebGL is working, false otherwise
 */
export async function testWebGLCapabilities(): Promise<boolean> {
  // Only run on client side
  if (typeof window === 'undefined') {
    return false;
  }
  
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        resolve(false);
        return;
      }
      
      // Properly type the WebGL context
      const webGl = gl as WebGLRenderingContext;
      
      // Try to create a simple scene
      const vertexShader = webGl.createShader(webGl.VERTEX_SHADER);
      const fragmentShader = webGl.createShader(webGl.FRAGMENT_SHADER);
      
      if (!vertexShader || !fragmentShader) {
        resolve(false);
        return;
      }
      
      // Set up a simple program
      const program = webGl.createProgram();
      if (!program) {
        resolve(false);
        return;
      }
      
      // If we made it this far, WebGL is generally working
      webGl.deleteProgram(program);
      webGl.deleteShader(vertexShader);
      webGl.deleteShader(fragmentShader);
      
      resolve(true);
    } catch (e) {
      console.error('Error testing WebGL capabilities:', e);
      resolve(false);
    }
  });
} 