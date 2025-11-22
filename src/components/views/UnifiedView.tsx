import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars, Text, Billboard, CameraControls } from '@react-three/drei';
import { Group, MathUtils, Vector3, Matrix4, Quaternion } from 'three';
import { useSimulationStore } from '../../store/simulationStore';
import { Galaxy } from '../Galaxy';
import { UNIVERSE_CONSTANTS } from '../../constants/universe';

export const UnifiedView = () => {
    const { date, timeOfDay, viewMode } = useSimulationStore();
    const cameraControlsRef = useRef<CameraControls>(null);

    // Refs for scene objects
    const earthGroupRef = useRef<Group>(null);
    const earthRotationRef = useRef<Group>(null);
    const beijingRef = useRef<Group>(null);

    // Constants
    const orbitRadius = UNIVERSE_CONSTANTS.EARTH.ORBIT_RADIUS;
    const earthRadius = UNIVERSE_CONSTANTS.EARTH.RADIUS;
    const galaxyDistance = UNIVERSE_CONSTANTS.GALAXY.SOLAR_SYSTEM_DISTANCE;

    // --- Earth Dynamics ---
    useFrame(() => {
        if (earthGroupRef.current && earthRotationRef.current) {
            // 1. Orbital Position (Yearly)
            const yearProgress = date / 365;
            const orbitAngle = yearProgress * Math.PI * 2;

            earthGroupRef.current.position.x = Math.cos(orbitAngle) * orbitRadius;
            earthGroupRef.current.position.z = Math.sin(orbitAngle) * orbitRadius;

            // 2. Daily Rotation (Time of Day)
            // Calibrated so 12:00 = Beijing faces Sun
            const beijingLonRad = MathUtils.degToRad(116.4);
            const sunDirection = orbitAngle + Math.PI;
            const timeOffset = ((timeOfDay - 12) / 24) * Math.PI * 2;

            earthRotationRef.current.rotation.y = sunDirection - beijingLonRad + timeOffset;
        }
    });

    // --- Beijing Coordinates Calculation ---
    const beijingPos = useMemo(() => {
        const lat = 39.9;
        const lon = 116.4;
        const phi = MathUtils.degToRad(90 - lat);
        const theta = MathUtils.degToRad(lon + 90);

        return new Vector3(
            earthRadius * Math.sin(phi) * Math.cos(theta),
            earthRadius * Math.cos(phi),
            earthRadius * Math.sin(phi) * Math.sin(theta)
        );
    }, [earthRadius]);

    // --- Camera Transitions ---
    useFrame((state, delta) => {
        if (!cameraControlsRef.current || !earthGroupRef.current || !earthRotationRef.current) return;

        const controls = cameraControlsRef.current;

        // Calculate global position of Beijing
        // We need to manually apply the nested transformations to get the world position
        const earthPos = earthGroupRef.current.position;
        const earthRotY = earthRotationRef.current.rotation.y;
        const axialTilt = MathUtils.degToRad(23.5);

        // Apply Axial Tilt then Rotation Y to Beijing Local Pos
        const tiltedBeijing = beijingPos.clone()
            .applyAxisAngle(new Vector3(0, 1, 0), earthRotY) // Daily Spin
            .applyAxisAngle(new Vector3(0, 0, 1), axialTilt); // Axial Tilt

        const beijingWorldPos = earthPos.clone().add(tiltedBeijing);

        // Define Camera Targets based on View Mode
        if (viewMode === 'human') {
            // Camera on surface, looking North?
            // For simplicity in this unified view, let's hover slightly above Beijing
            // and look towards the horizon or Sun.
            // To look North: We need to know North direction in World Space.
            // North is tangent to surface towards pole.

            // Position: Just above Beijing
            const cameraPos = beijingWorldPos.clone().add(tiltedBeijing.clone().normalize().multiplyScalar(0.5)); // 0.5 units above surface

            // Smoothly move camera
            controls.setLookAt(
                cameraPos.x, cameraPos.y, cameraPos.z,
                beijingWorldPos.x, beijingWorldPos.y, beijingWorldPos.z, // Look at ground? No, look out.
                true // animate
            );

            // Actually, CameraControls is better for "move to position".
            // But we need continuous updates because Earth is moving!
            // So we might need to snap camera if in 'human' mode.

            // Let's use a simpler strategy for the "Transition":
            // When viewMode changes, we trigger a transition.
            // But during 'human' mode, we lock camera to Earth?
        }
    });

    // Effect to trigger transitions
    useEffect(() => {
        if (!cameraControlsRef.current) return;
        const controls = cameraControlsRef.current;

        if (viewMode === 'galactic') {
            // Zoom out to see Galaxy
            // Sun is at 0,0,0. Galaxy Center is at -25, 0, 0.
            // Camera at -25, 50, 80 looking at Galaxy Center
            controls.setLookAt(
                -galaxyDistance, 60, 80,
                -galaxyDistance, 0, 0,
                true
            );
        } else if (viewMode === 'solar-system') {
            // Zoom to Solar System
            // Look at Sun (0,0,0) from (0, 20, 20)
            controls.setLookAt(
                0, 20, 20,
                0, 0, 0,
                true
            );
        } else if (viewMode === 'human') {
            // We need to find where Earth is RIGHT NOW.
            // But Earth moves.
            // For the transition, we can just zoom to the Earth's current approximate position.
            // The useFrame loop will handle the precise locking if we implement it there.
            // For now, let's just zoom close to Earth.

            // We can't easily know the exact position in useEffect without ref access, 
            // but we can rely on the controls damping to smooth it out if we update in useFrame.
            // Let's just set a flag or rely on useFrame to "capture" the camera.
        }
    }, [viewMode, galaxyDistance]);

    // Specialized Human Camera Logic
    useFrame(() => {
        if (viewMode === 'human' && cameraControlsRef.current && earthGroupRef.current && earthRotationRef.current) {
            // Calculate global position of Beijing again
            const earthPos = earthGroupRef.current.position;
            const earthRotY = earthRotationRef.current.rotation.y;
            const axialTilt = MathUtils.degToRad(23.5);

            const tiltedBeijing = beijingPos.clone()
                .applyAxisAngle(new Vector3(0, 1, 0), earthRotY)
                .applyAxisAngle(new Vector3(0, 0, 1), axialTilt);

            const beijingWorldPos = earthPos.clone().add(tiltedBeijing);

            // Up vector at Beijing (Normal to surface)
            const upVec = tiltedBeijing.clone().normalize();

            // Camera Position: 0.2 units above Beijing
            const camPos = beijingWorldPos.clone().add(upVec.clone().multiplyScalar(0.2));

            // Look Direction: North?
            // North is tangent to surface, towards North Pole.
            // North Pole Local: (0, 1, 0).
            // Tilted Pole: (0, 1, 0) rotated by tilt.
            // We can approximate: Look outwards + slight up?
            // Or just look at the Sun (0,0,0) if it's day?
            // Let's look "Out" from center for now.
            const target = camPos.clone().add(upVec);

            cameraControlsRef.current.setLookAt(
                camPos.x, camPos.y, camPos.z,
                beijingWorldPos.x, beijingWorldPos.y, beijingWorldPos.z, // Looking down at Beijing?
                true
            );

            // Note: This might fight with user controls. 
            // Ideally we disable user controls in Human mode or make them rotate around the camera pos.
        }
    });

    return (
        <group>
            <CameraControls ref={cameraControlsRef} smoothTime={1.0} />

            {/* --- GALAXY (Background) --- */}
            {/* Centered at -25, 0, 0 */}
            <group position={[-galaxyDistance, 0, 0]}>
                <Galaxy />
                <Billboard position={[0, 10, 0]}>
                    <Text fontSize={5} color={UNIVERSE_CONSTANTS.GALAXY.CENTER_COLOR}>Galactic Center</Text>
                </Billboard>
            </group>

            {/* --- SOLAR SYSTEM --- */}
            {/* Sun at 0,0,0 */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[UNIVERSE_CONSTANTS.SUN.RADIUS_SOLAR_VIEW, 32, 32]} />
                <meshStandardMaterial
                    color={UNIVERSE_CONSTANTS.SUN.COLOR}
                    emissive={UNIVERSE_CONSTANTS.SUN.EMISSIVE}
                    emissiveIntensity={UNIVERSE_CONSTANTS.SUN.EMISSIVE_INTENSITY}
                />
                <pointLight intensity={2} distance={100} decay={2} />
            </mesh>
            <Billboard position={[0, 3, 0]}>
                <Text fontSize={1} color={UNIVERSE_CONSTANTS.SUN.COLOR}>Sun</Text>
            </Billboard>

            {/* Earth Orbit */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[orbitRadius - 0.1, orbitRadius + 0.1, 128]} />
                <meshBasicMaterial color="#888" side={2} transparent opacity={0.3} />
            </mesh>

            {/* --- EARTH SYSTEM --- */}
            <group ref={earthGroupRef}>
                <group rotation={[0, 0, MathUtils.degToRad(23.5)]}> {/* Axial Tilt */}
                    <group ref={earthRotationRef}> {/* Daily Spin */}
                        {/* Earth Sphere */}
                        <mesh>
                            <sphereGeometry args={[earthRadius, 32, 32]} />
                            <meshStandardMaterial color={UNIVERSE_CONSTANTS.EARTH.COLOR} roughness={0.7} />
                        </mesh>

                        {/* Beijing Marker & Human View Elements */}
                        <group position={beijingPos}>
                            <mesh>
                                <sphereGeometry args={[0.05, 16, 16]} />
                                <meshBasicMaterial color="red" />
                            </mesh>
                            {/* Compass / Ground Plane - Only visible when close? */}
                            <group rotation={[-Math.PI / 2, 0, 0]}> {/* Align with surface roughly? No, need precise normal alignment */}
                                {/* Simplified Ground Marker */}
                                <mesh position={[0, 0.01, 0]}>
                                    <ringGeometry args={[0.1, 0.12, 32]} />
                                    <meshBasicMaterial color="white" />
                                </mesh>
                            </group>
                        </group>
                    </group>
                </group>
            </group>

            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0} />
            <ambientLight intensity={0.2} />
        </group>
    );
};
