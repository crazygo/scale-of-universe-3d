import { PerspectiveCamera, OrbitControls, Html } from '@react-three/drei';
import { Galaxy } from '../Galaxy';
import { UNIVERSE_CONSTANTS } from '../../constants/universe';
import { useSimulationStore } from '../../store/simulationStore';
import { CameraTransition } from '../CameraTransition';
import { Vector3 } from 'three';

export const GalacticView = () => {
    const { previousViewMode } = useSimulationStore();

    let startPos: Vector3 | undefined;
    let startTarget: Vector3 | undefined;

    if (previousViewMode === 'solar-system') {
        // Start at Solar System Marker (Zoom out)
        // Solar System is at [25, 0, 0]
        startPos = new Vector3(UNIVERSE_CONSTANTS.GALAXY.SOLAR_SYSTEM_DISTANCE, 5, 10);
        startTarget = new Vector3(UNIVERSE_CONSTANTS.GALAXY.SOLAR_SYSTEM_DISTANCE, 0, 0);
    }

    return (
        <group>
            <CameraTransition
                enabled={!!previousViewMode}
                startPos={startPos}
                targetPos={new Vector3(0, 40, 60)}
                startTarget={startTarget || new Vector3(0, 0, 0)}
                targetTarget={new Vector3(0, 0, 0)}
                duration={3.0}
            />

            {/* Galaxy Particles */}
            <Galaxy />

            {/* Solar System Marker */}
            {/* Positioned at roughly 2/3 radius */}
            <group position={[UNIVERSE_CONSTANTS.GALAXY.SOLAR_SYSTEM_DISTANCE, 0, 0]}>
                <mesh>
                    <sphereGeometry args={[0.5, 16, 16]} />
                    <meshBasicMaterial color={UNIVERSE_CONSTANTS.SUN.COLOR} />
                </mesh>
                <mesh>
                    <ringGeometry args={[0.6, 0.8, 32]} />
                    <meshBasicMaterial color={UNIVERSE_CONSTANTS.SUN.COLOR} side={2} />
                </mesh>
                <Html position={[0, 1, 0]} center>
                    <div style={{ color: UNIVERSE_CONSTANTS.SUN.COLOR, background: 'rgba(0,0,0,0.5)', padding: '4px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                        Solar System
                    </div>
                </Html>
            </group>

            <ambientLight intensity={0.5} />
            <PerspectiveCamera makeDefault position={[0, 40, 60]} fov={60} />
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
        </group>
    );
};
