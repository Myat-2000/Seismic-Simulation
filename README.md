# Seismic Simulation & Analysis

A 3D visualization application for simulating seismic activity with customizable parameters. This app allows users to:

- Visualize earthquake waves in a dynamic 3D environment
- Customize earthquake parameters (magnitude, depth, epicenter, etc.)
- Observe wave propagation and behavior in real-time
- Analyze potential earthquake impact based on the Richter scale

## Features

- Interactive 3D visualization using Three.js and React Three Fiber
- Dynamic particle system for seismic wave representation
- Customizable earthquake parameters with real-time updates
- Detailed information about the simulated earthquake
- Responsive design that works on desktop and mobile devices

## Technology Stack

- Next.js 15 with App Router
- React 19
- TypeScript
- Three.js with React Three Fiber & Drei
- TailwindCSS

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/seismic-simulation.git
   cd seismic-simulation
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Adjust the parameters on the left panel:
   - Magnitude (1-10 on the Richter scale)
   - Depth (km)
   - Epicenter X and Y coordinates
   - Wave velocity
   - Duration

2. Click "Start Simulation" to begin the 3D visualization

3. Interact with the 3D model:
   - Click and drag to rotate the view
   - Scroll to zoom in/out
   - Right-click and drag to pan

4. Click "Stop Simulation" to end the simulation

## Building for Production

```
npm run build
npm run start
```

## License

MIT

## Acknowledgments

- Three.js for the 3D rendering capabilities
- React Three Fiber for the React integration with Three.js
- Next.js team for the excellent framework
