import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useControls, folder } from 'leva';
import { useSimulationStore } from '../store/simulationStore';

import { UnifiedView } from './views/UnifiedView';
import { Legend } from './Legend';
import { ViewSwitcher } from './ViewSwitcher';
import { TimeController } from './TimeController';

export const SceneContainer = () => {
    const {
        viewMode, setViewMode,
        date, setDate,
        timeOfDay, setTimeOfDay,
        latitude, setLatitude,
        timeSpeed, setTimeSpeed,
        isPaused, setIsPaused
    } = useSimulationStore();

    // Leva controls for debugging/interaction
    useControls({
        'Simulation Control': folder({
            isPaused: {
                value: isPaused,
                label: 'Pause',
                onChange: (v) => setIsPaused(v),
            },
            timeSpeed: {
                value: timeSpeed,
                min: 0,
                max: 10000, // Allow high speed for seasonal observation
                step: 10,
                label: 'Speed (x)',
                onChange: (v) => setTimeSpeed(v),
            },
        }),
        'Manual Override': folder({
            viewMode: {
                value: viewMode,
                options: ['human', 'solar-system', 'galactic'] as const,
                onChange: (v) => setViewMode(v),
            },
            month: {
                value: Math.floor(date / 30.4) + 1,
                min: 1,
                max: 12,
                step: 1,
                label: 'Month (1-12)',
                onChange: (v) => setDate((v - 1) * 30.4),
                transient: false // Update store on change
            },
            time: {
                value: timeOfDay,
                min: 0,
                max: 24,
                step: 0.1,
                label: 'Time (0-24h)',
                onChange: (v) => setTimeOfDay(v),
                transient: false
            },
            latitude: {
                value: latitude,
                min: -90,
                max: 90,
                step: 1,
                onChange: (v) => setLatitude(v),
            },
        }, { collapsed: true }) // Collapse manual controls by default
    });

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
            <Canvas camera={{ position: [0, 20, 20], fov: 50 }}>
                <TimeController />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />

                <UnifiedView />

                <OrbitControls makeDefault />
            </Canvas>

            <div style={{ position: 'absolute', top: 20, left: 20, color: 'white', pointerEvents: 'none' }}>
                <h1>Milky Way Season Visualizer</h1>
                <p>Current View: {viewMode}</p>
                <p>Day: {Math.round(date)}</p>
            </div>

            <Legend />
            <ViewSwitcher />
        </div>
    );
};
