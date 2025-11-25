import { Canvas } from '@react-three/fiber';
import { useControls, folder } from 'leva';
import { useSimulationStore } from '../store/simulationStore';

import { UnifiedView } from './views/UnifiedView';
import { Legend } from './Legend';
import { ViewSwitcher } from './ViewSwitcher';
import { TimeController } from './TimeController';

export const SceneContainer = () => {
    const {
        viewMode,
        date, setDate,
        timeOfDay, setTimeOfDay,
        latitude, setLatitude,
        timeSpeed, setTimeSpeed,
        isPaused, setIsPaused,
        scaleFactorSun, setScaleFactorSun,
        scaleFactorEarth, setScaleFactorEarth
    } = useSimulationStore();

    // Leva controls for debugging/interaction
    useControls(() => ({ // Changed to a function to prevent re-renders issues with Leva
        'Simulation Control': folder({
            isPaused: {
                value: isPaused,
                label: 'Pause',
                onChange: (v) => setIsPaused(v),
            },
            timeSpeed: {
                value: timeSpeed,
                min: 0,
                max: viewMode === 'human' ? 30 : 10000, // Limit max speed in human view
                step: 10,
                label: 'Speed (x)',
                onChange: (v) => setTimeSpeed(v),
            },
        }),
        'Celestial Body Sizing': folder({
            scaleFactorSun: {
                value: scaleFactorSun,
                min: 0.1,
                max: 10.0,
                step: 0.1,
                label: 'Sun Scale',
                onChange: (v) => setScaleFactorSun(v),
            },
            scaleFactorEarth: {
                value: scaleFactorEarth,
                min: 0.1,
                max: 10.0,
                step: 0.1,
                label: 'Earth Scale',
                onChange: (v) => setScaleFactorEarth(v),
            },
        }),
        'Manual Override': folder({
            /* viewMode control removed to prevent state override loop
            viewMode: {
                value: viewMode,
                options: ['human', 'solar-system', 'galactic'] as const,
                onChange: (v) => {
                    console.log('Leva onChange:', v);
                    setViewMode(v);
                },
            }, */
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
    }), [viewMode]);

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative' }}>
            <Canvas camera={{ position: [0, 20, 20], fov: 50, near: 0.001, far: 1000000 }}>
                <TimeController />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />

                <UnifiedView
                    minDistance={0.1}
                    maxDistance={500000}
                    cameraFar={1000000}
                    cameraNear={0.001}
                />
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
