import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, CameraControls, Billboard, Text, Line, Grid, useTexture } from '@react-three/drei';
import { Group, MathUtils, Vector3, Quaternion, Matrix4, DoubleSide } from 'three';
import { useSimulationStore } from '../../store/simulationStore';
import { Galaxy } from '../Galaxy';
import { Sun } from '../Sun';
import { UNIVERSE_CONSTANTS } from '../../constants/universe';

interface UnifiedViewProps {
    minDistance?: number;
    maxDistance?: number;
    cameraFar?: number;
    cameraNear?: number;
}

export const UnifiedView = ({
    minDistance = 0.1,
    maxDistance = 500000,
    cameraFar = 1000000,
    cameraNear = 0.001
}: UnifiedViewProps) => {
    const { viewMode, scaleFactorSun, scaleFactorEarth } = useSimulationStore();

    const cameraControlsRef = useRef<CameraControls>(null);
    const earthGroupRef = useRef<Group>(null);
    const earthRotationRef = useRef<Group>(null);
    const previousEarthRotationY = useRef(0);
    const previousBeijingWorldPos = useRef<Vector3 | null>(null);

    // Constants
    const orbitRadius = UNIVERSE_CONSTANTS.EARTH.ORBIT_RADIUS;
    const earthRadius = UNIVERSE_CONSTANTS.EARTH.RADIUS;
    const galaxyDistance = UNIVERSE_CONSTANTS.GALAXY.SOLAR_SYSTEM_DISTANCE;

    // Orbit Parameters
    const eccentricity = 0.0167;
    const semiMajorAxis = orbitRadius;
    const semiMinorAxis = semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity);
    const c = semiMajorAxis * eccentricity; // Distance from center to focus

    // Generate Orbit Path Points
    const orbitPoints = useMemo(() => {
        const points = [];
        const segments = 128;
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            // x = center + a * cos(theta)
            // z = b * sin(theta)
            // Center is at (c, 0, 0)
            points.push(new Vector3(
                c + Math.cos(theta) * semiMajorAxis,
                0,
                Math.sin(theta) * semiMinorAxis
            ));
        }
        return points;
    }, [c, semiMajorAxis, semiMinorAxis]);

    // Load Earth Texture
    const earthTexture = useTexture('/earth_daymap.png');

    // --- Earth Dynamics ---
    useFrame(() => {
        const { date, timeOfDay } = useSimulationStore.getState();

        if (earthGroupRef.current && earthRotationRef.current) {
            // 1. Orbital Position (Yearly) - Realistic Elliptical Orbit
            // Eccentricity: 0.0167
            // Perihelion: ~Jan 3 (Day 3). Distance = a(1-e).
            // Aphelion: ~July 4 (Day 185). Distance = a(1+e).
            // Axial Tilt: 23.5 deg (Leans towards -X in our setup).
            // Winter Solstice (Dec 21): Earth at -X (Left), Axis points Away from Sun (Right).
            // Summer Solstice (Jun 21): Earth at +X (Right), Axis points Towards Sun (Left).

            // Alignment:
            // We want Perihelion (Jan 3) to be at -X (Winter).
            // Standard Ellipse: x = a cos(t). Focus at -c.
            // t = PI => x = -a. Dist to Focus (-c) = |-a - (-c)| = |-a + ae| = a(1-e). (Perihelion).
            // So we use t = PI for Jan 3.

            // Calculate Mean Anomaly
            // We want Angle = PI at Day 3 (Jan 3)
            // MA = (Date / 365) * 2PI
            // Offset = PI - (3/365)*2PI
            const perihelionDay = 3;
            const orbitOffset = Math.PI - (perihelionDay / 365) * Math.PI * 2;

            const yearProgress = date / 365;
            const meanAnomaly = yearProgress * Math.PI * 2;
            const orbitAngle = meanAnomaly + orbitOffset;

            // Position relative to geometric center of ellipse
            const x_center = Math.cos(orbitAngle) * semiMajorAxis;
            const z_center = Math.sin(orbitAngle) * semiMinorAxis;

            // Shift so Sun (at World 0,0,0) is at the Left Focus (-c relative to center)
            // So Center is at +c relative to Sun.
            // Earth = Center + (x_center, z_center) = (c + x_center, z_center)

            earthGroupRef.current.position.x = c + x_center;
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
    useFrame(() => {
        if (!cameraControlsRef.current || !earthGroupRef.current || !earthRotationRef.current) return;

        const { viewMode } = useSimulationStore.getState();
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
            // Smart Follow Logic:
            // 1. Lock Target to Beijing (so we orbit Beijing)
            controls.setTarget(beijingWorldPos.x, beijingWorldPos.y, beijingWorldPos.z, false);

            // 2. Rotate Camera with Earth (Geosynchronous behavior)
            const currentRotY = earthRotationRef.current.rotation.y;
            const rotationDeltaY = currentRotY - previousEarthRotationY.current;

            // Initialize previous position if null
            if (!previousBeijingWorldPos.current) {
                previousBeijingWorldPos.current = beijingWorldPos.clone();
            }

            if (Math.abs(rotationDeltaY) > 0.00001) { // Only rotate if there's a significant change
                // Get the current camera position
                const cameraPosition = controls.camera.position;

                // Calculate the Earth's rotation axis in world space
                const axisWorld = new Vector3(0, 1, 0).applyAxisAngle(new Vector3(0, 0, 1), axialTilt);

                // Correct Math for Stable Follow:
                // The Earth rotates around its axis passing through the Earth Center.
                // To stay "geosynchronous", the camera must also rotate around the Earth Center by the same delta.
                // Rotating around Beijing (as we did before) causes a wobble because the axis doesn't pass through Beijing.

                const earthCenterPos = earthGroupRef.current.position;

                // Vector from Earth Center to Camera
                const relativeVec = cameraPosition.clone().sub(earthCenterPos);

                // Rotate this vector by the Earth's rotation delta around the Earth Axis
                relativeVec.applyAxisAngle(axisWorld, rotationDeltaY);

                // New Camera Position = Earth Center + Rotated Relative Vector
                const newCameraPos = earthCenterPos.clone().add(relativeVec);

                // Update controls with the new camera position
                controls.setPosition(newCameraPos.x, newCameraPos.y, newCameraPos.z, false);
            }

            // 3. Update previous states for the next frame
            previousEarthRotationY.current = currentRotY;
            previousBeijingWorldPos.current.copy(beijingWorldPos);
        }
    });

    // --- Grid Orientation ---
    const gridQuaternion = useMemo(() => {
        // Calculate basis vectors for the grid orientation
        // 1. Up Vector (Y) = Surface Normal at Beijing
        const up = beijingPos.clone().normalize();

        // 2. North Pole Vector (in Earth's local space)
        const northPole = new Vector3(0, 1, 0);

        // 3. East Vector (X) = North x Up
        // This gives a vector tangent to the latitude line pointing East
        const east = new Vector3().crossVectors(northPole, up).normalize();

        // 4. North Tangent Vector = Up x East
        // This gives a vector tangent to the longitude line pointing North
        const northTangent = new Vector3().crossVectors(up, east).normalize();

        // 5. Construct Basis
        // Grid Labels: E is +X, N is -Z.
        // So:
        // X axis = East
        // Y axis = Up
        // Z axis = South (opposite of North Tangent)
        const south = northTangent.clone().negate();

        const matrix = new Matrix4().makeBasis(east, up, south);
        return new Quaternion().setFromRotationMatrix(matrix);
    }, [beijingPos]);

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
            <group position={[0, 0, 0]}>
                <Sun radius={UNIVERSE_CONSTANTS.SUN.RADIUS_SOLAR_VIEW * (viewMode === 'solar-system' ? scaleFactorSun : 1)} />
                <Billboard position={[0, 3, 0]}>
                    <Text fontSize={2} color={UNIVERSE_CONSTANTS.SUN.COLOR}>Sun</Text>
                </Billboard>
            </group>

            {/* Orbit Visualization - Realistic Ellipse */}
            <Line
                points={orbitPoints}
                color="#888"
                opacity={0.3}
                transparent
                lineWidth={1}
            />

            {/* Earth Group */}
            <group ref={earthGroupRef}>

                {/* Earth Rotation Group (Axial Tilt + Daily Spin) */}
                <group rotation={[0, 0, MathUtils.degToRad(23.5)]}> {/* Axial Tilt */}
                    <group ref={earthRotationRef}> {/* Daily Spin */}
                        {/* Earth Sphere */}
                        <mesh>
                            <sphereGeometry args={[UNIVERSE_CONSTANTS.EARTH.RADIUS * (viewMode === 'solar-system' ? scaleFactorEarth : 1), 32, 32]} />
                            <meshStandardMaterial map={earthTexture} roughness={0.7} />

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
                                        quaternion={gridQuaternion}
                                    >
                                        <Grid
                                            args={[3, 3]} // 3x3 units grid (30% of original)
                                            cellColor={0x888888}
                                            sectionColor={0x444444}
                                            fadeDistance={100}
                                            fadeStrength={1}
                                            infiniteGrid={false}
                                            position={[0, 0, 0]}
                                            side={DoubleSide}
                                        />
                                        {/* Cardinal Directions */}
                                        <Billboard position={[0, 0, -1.5]}> {/* North */}
                                            <Text fontSize={0.5} color="white">N</Text>
                                        </Billboard>
                                        <Billboard position={[0, 0, 1.5]}> {/* South */}
                                            <Text fontSize={0.5} color="white">S</Text>
                                        </Billboard>
                                        <Billboard position={[1.5, 0, 0]}> {/* East */}
                                            <Text fontSize={0.5} color="white">E</Text>
                                        </Billboard>
                                        <Billboard position={[-1.5, 0, 0]}> {/* West */}
                                            <Text fontSize={0.5} color="white">W</Text>
                                        </Billboard>
                                    </group>
                                )}
                            </group>
                        </mesh>
                    </group>

                    {/* Earth Axis Visualization (Solar System View) */}
                    {viewMode === 'solar-system' && (
                        <group>
                            {/* Axis Line - Extended beyond poles */}
                            <Line
                                points={[[0, -1.5, 0], [0, 1.5, 0]]} // 1.5 units long (Earth radius is 0.5)
                                color="white"
                                opacity={0.5}
                                transparent
                                lineWidth={1}
                            />
                            {/* North Pole Label */}
                            <Billboard position={[0, 1.6, 0]}>
                                <Text fontSize={0.5} color="white">N</Text>
                            </Billboard>
                            {/* South Pole Label */}
                            <Billboard position={[0, -1.6, 0]}>
                                <Text fontSize={0.5} color="white">S</Text>
                            </Billboard>
                        </group>
                    )}
                </group>
            </group>

            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0} />
            <ambientLight intensity={0.2} />
            <CameraControls ref={cameraControlsRef} minDistance={minDistance} maxDistance={maxDistance} />
        </group>
    );
};
