import { Canvas } from '@react-three/fiber';
import { Leva } from 'leva';
import { UnifiedScene } from './components/UnifiedScene';
import { TimeController } from './components/TimeController';
import { ViewSwitcher } from './components/ViewSwitcher';
import { Legend } from './components/Legend';
import './App.css';

/**
 * Main App - Scale of Universe 3D
 * Single continuous 3D universe scene integrating three scales:
 * - Human Scale: Standing on Earth's surface in Beijing
 * - Solar System Scale: Observing Earth's orbit around the Sun
 * - Galactic Scale: Viewing the Milky Way Galaxy
 */
function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      {/* Leva control panel */}
      <Leva collapsed={false} />

      {/* Control components (render to Leva) */}
      <TimeController />
      <ViewSwitcher />

      {/* Legend overlay */}
      <Legend />

      {/* Three.js Canvas */}
      <Canvas
        camera={{
          position: [0, 20, 20],
          fov: 60,
          near: 0.01,
          far: 1000,
        }}
        style={{ background: '#000' }}
      >
        <UnifiedScene />
      </Canvas>
    </div>
  );
}

export default App;
