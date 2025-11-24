import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Text, Billboard, CameraControls, Grid } from '@react-three/drei';
import { Group, MathUtils, Vector3, Quaternion } from 'three';
import { useSimulationStore } from '../../store/simulationStore';
import { Galaxy } from '../Galaxy';
import { UNIVERSE_CONSTANTS } from '../../constants/universe';

export const UnifiedView = () => {
    const { viewMode, date, timeOfDay } = useSimulationStore();
    const cameraControlsRef = useRef<CameraControls>(null);

    // Refs for scene objects
    const earthGroupRef = useRef<Group>(null);
    const earthRotationRef = useRef<Group>(null);

    // Constants
    const orbitRadius = UNIVERSE_CONSTANTS.EARTH.ORBIT_RADIUS;
    const earthRadius = UNIVERSE_CONSTANTS.EARTH.RADIUS;
    const galaxyDistance = UNIVERSE_CONSTANTS.GALAXY.SOLAR_SYSTEM_DISTANCE;

    // --- Earth Dynamics ---
    // --- Earth Dynamics ---
    useFrame(() => {
        if (earthGroupRef.current && earthRotationRef.current) {
            // 1. Orbital Position (Yearly) - Elliptical Orbit
            // Earth's eccentricity is ~0.0167. Let's exaggerate slightly for visibility if needed, 
            // but requirements say "Physical Motion". Let's stick to a simple ellipse first.
            // x = a * cos(theta)
            // z = b * sin(theta)
            // where b = a * sqrt(1 - e^2)
            // Focus is at (c, 0), where c = a * e. Sun is at focus.

            const eccentricity = 0.05; // Slightly exaggerated for visual effect (Earth is 0.0167)
            const semiMajorAxis = orbitRadius;
            const semiMinorAxis = semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity);
            const c = semiMajorAxis * eccentricity; // Distance from center to focus

            const yearProgress = date / 365;
            const meanAnomaly = yearProgress * Math.PI * 2;

            // Simplified: Use Mean Anomaly as Eccentric Anomaly for now (circular speed approximation)
            // For true variable speed, we'd solve Kepler's equation, but let's start with the shape.
            // We align Perihelion (closest) to roughly Jan 3 (approx date 3).
            // Angle 0 = Perihelion? 
            // In our system, date 0 = Jan 1.

            const orbitAngle = meanAnomaly;

            // Position relative to geometric center of ellipse
            const x_center = Math.cos(orbitAngle) * semiMajorAxis;
            const z_center = Math.sin(orbitAngle) * semiMinorAxis;

            // Shift so Sun (Focus) is at (0,0)
            // If Perihelion is at +X, Sun is at -c relative to center.
            // So Earth = (x_center + c, z_center).

            earthGroupRef.current.position.x = x_center + c;
            earthGroupRef.current.position.z = z_center;

            // 2. Daily Rotation (Time of Day)
            // Calibrated so 12:00 = Beijing faces Sun
            const beijingLonRad = MathUtils.degToRad(116.4);

            // Sun Direction calculation needs to account for new position
            // Vector from Earth to Sun
            const earthPos = earthGroupRef.current.position;
            const sunPos = new Vector3(0, 0, 0);
            const toSun = sunPos.clone().sub(earthPos).normalize();
            const sunDirection = Math.atan2(toSun.x, toSun.z); // Angle of Sun relative to Earth

            // We need Earth to face Sun at 12:00.
            // Rotation Y = SunDir - BeijingLon + TimeOffset
            // But we need to be careful with coordinate frames.
            // Let's stick to the previous logic but update sunDirection dynamically.

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

            // Transition handled by useFrame
        }
    }, [viewMode, galaxyDistance]);

    return (
        <group>
            {/* Stars Background */}
            <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            {/* Galaxy */}
            <group position={[-galaxyDistance, 0, 0]}>
                <Galaxy />
                <Billboard position={[0, 10, 0]}>
                    <Text fontSize={5} color={UNIVERSE_CONSTANTS.GALAXY.CENTER_COLOR}>
                        Galactic Center
                    </Text>
                </Billboard>
            </group>

            {/* Solar System Center (Sun) */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[UNIVERSE_CONSTANTS.SUN.RADIUS_SOLAR_VIEW, 32, 32]} />
                <meshStandardMaterial
                    color={UNIVERSE_CONSTANTS.SUN.COLOR}
                    emissive={UNIVERSE_CONSTANTS.SUN.EMISSIVE}
                    emissiveIntensity={UNIVERSE_CONSTANTS.SUN.EMISSIVE_INTENSITY}
                />
            </mesh>
            <Billboard position={[0, 3, 0]}>
                <Text fontSize={2} color={UNIVERSE_CONSTANTS.SUN.COLOR}>Sun</Text>
            </Billboard>

            {/* Earth Group */}
            <group ref={earthGroupRef}>
                {/* Orbit Visualization */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[orbitRadius - 0.1, orbitRadius + 0.1, 128]} />
                    <meshBasicMaterial color="#888" side={2} transparent opacity={0.3} />
                </mesh>

                {/* Earth Rotation Group (Axial Tilt + Daily Spin) */}
                <group rotation={[0, 0, MathUtils.degToRad(23.5)]}> {/* Axial Tilt */}
                    <group ref={earthRotationRef}> {/* Daily Spin */}
                        {/* Earth Sphere */}
                        <mesh>
                            <sphereGeometry args={[UNIVERSE_CONSTANTS.EARTH.RADIUS, 32, 32]} />
                            <meshStandardMaterial color={UNIVERSE_CONSTANTS.EARTH.COLOR} roughness={0.7} />

                            {/* Beijing Marker */}
                            <group position={beijingPos}>
                                <mesh>
                                    <sphereGeometry args={[0.05, 16, 16]} />
                                    <meshBasicMaterial color="red" />
                                </mesh>
                                <Billboard position={[0, 0.2, 0]}>
                                    <Text fontSize={0.3} color="white">Beijing</Text>
                                </Billboard>

                                {/* 3D Grid for Human View */}
                                {viewMode === 'human' && (
                                    <group
                                        position={[0, 0.01, 0]} // Slightly above the marker
                                        quaternion={new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), beijingPos.clone().normalize())}
                                    >
                                        <Grid
                                            args={[10, 10]} // 10x10 units grid
                                            cellColor={0x888888}
                                            sectionColor={0x444444}
                                            fadeDistance={30}
                                            fadeStrength={1}
                                            infiniteGrid={false}
                                            position={[0, 0, 0]}
                                            rotation={[Math.PI / 2, 0, 0]} // Rotate to be flat on the local XZ plane
                                        />
                                        {/* Cardinal Directions */}
                                        <Billboard position={[0, 0, -5]}> {/* North */}
                                            <Text fontSize={0.5} color="white">N</Text>
                                        </Billboard>
                                        <Billboard position={[0, 0, 5]}> {/* South */}
                                            <Text fontSize={0.5} color="white">S</Text>
                                        </Billboard>
                                        <Billboard position={[5, 0, 0]}> {/* East */}
                                            <Text fontSize={0.5} color="white">E</Text>
                                        </Billboard>
                                        <Billboard position={[-5, 0, 0]}> {/* West */}
                                            <Text fontSize={0.5} color="white">W</Text>
                                        </Billboard>
                                    </group>
                                )}
                            </group>
                        </mesh>
                    </group>
                </group>
            </group>

            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0} />
            <ambientLight intensity={0.2} />
        </group>
    );
};
