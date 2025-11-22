import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, PerspectiveCamera, OrbitControls, Stars, Text, Html, Billboard } from '@react-three/drei';
import { Group, MathUtils, Vector3 } from 'three';
import { useSimulationStore } from '../../store/simulationStore';
import { Galaxy } from '../Galaxy';
import { UNIVERSE_CONSTANTS } from '../../constants/universe';
import { CameraTransition } from '../CameraTransition';

export const SolarSystemView = () => {
    const { date, timeOfDay } = useSimulationStore();
    const earthGroupRef = useRef<Group>(null);
    const earthRotationRef = useRef<Group>(null);

    // Orbit parameters
    const orbitRadius = UNIVERSE_CONSTANTS.EARTH.ORBIT_RADIUS;

    useFrame(() => {
        if (earthGroupRef.current && earthRotationRef.current) {
            // 1. Orbital Position (Yearly)
            const yearProgress = date / 365;
            const orbitAngle = yearProgress * Math.PI * 2;

            earthGroupRef.current.position.x = Math.cos(orbitAngle) * orbitRadius;
            earthGroupRef.current.position.z = Math.sin(orbitAngle) * orbitRadius;

            // 2. Daily Rotation (Time of Day)
            // We want Beijing (116.4 E) to face the Sun at 12:00 Beijing Time.
            // Sun is at (0,0,0) in the Universe frame (relative to Earth orbit center).
            // Earth is at `orbitAngle`.
            // Vector Sun->Earth is (cos(orbitAngle), sin(orbitAngle)).
            // Vector Earth->Sun is (-cos(orbitAngle), -sin(orbitAngle)).
            // In Earth's local frame, we want Beijing vector to point to Sun.

            // Beijing Local Vector (simplified on equator for rotation logic):
            // Angle = 116.4 degrees = 2.03 radians.
            // We want: LocalRotation + BeijingAngle = EarthSunAngle + PI (to face sun)
            // Wait, simpler:
            // At 12:00, Beijing is "under the Sun".
            // So Earth should be rotated such that Beijing's longitude points to the Sun.

            // Rotation Rate:
            // Earth rotates 360 deg in 24h.
            // Angle = (timeOfDay - 12) / 24 * 2PI. (Relative to Noon)

            // We need to account for Earth's orbital position `orbitAngle`.
            // And Beijing's longitude offset.
            // And the fact that "Noon" means facing the Sun.

            // Let's construct the rotation:
            // Base Rotation to face Sun: -orbitAngle + PI (because Earth->Sun is opposite to Sun->Earth)
            // Daily Spin: (timeOfDay - 12) / 24 * 2PI.
            // Beijing Offset: We need to rotate Earth so Beijing is at the "Noon" meridian.
            // Beijing is at +116.4 deg.
            // If Earth Rot Y = 0, Prime Meridian (0 deg) is at +Z? (Need to check texture/sphere mapping).
            // Usually Three.js Sphere UVs: 0 is at +Z (or -Z).
            // Let's assume standard mapping.
            // We'll calibrate visually.
            // For now: rotation = (timeOfDay / 24) * 2PI + orbitAngle + Offset.

            // Let's try to match the Human View logic:
            // Human View: 12:00 = Sun South.
            // Here: 12:00 = Beijing faces Sun.

            const earthSpin = (timeOfDay / 24) * Math.PI * 2;

            // The "+ orbitAngle" term keeps the same face to the Sun if earthSpin was 0 (Tidal locking).
            // But we want 24h cycle.
            // Actually, Solar Time vs Sidereal Time.
            // 24h is Solar Time. So 12:00 should ALWAYS face the Sun regardless of orbit.
            // So we DON'T simply add orbitAngle in a linear way if we want "Time of Day" to mean "Solar Time".
            // If `timeOfDay` is Solar Time (which our UI implies), then:
            // At 12:00, rotation should align Beijing to Sun.
            // Sun direction in Earth Frame depends on orbit.
            // Sun Angle in World = atan2(-z, -x) (from Earth to Sun).
            // Earth Rotation Y should be such that Beijing aligns with Sun Angle.

            // Sun Position relative to Earth:
            // Earth is at (R cos O, R sin O). Sun is at (0,0).
            // Vector Earth->Sun is (-cos O, -sin O).
            // Angle is O + PI.

            // We want Beijing (at Lon B) to point to (O + PI).
            // Earth Rotation R.
            // B + R = O + PI
            // R = O + PI - B.
            // This is at 12:00.

            // At other times T (hours):
            // R(T) = R(12) + (T - 12)/24 * 2PI.
            // R(T) = O + PI - B + (T - 12)/24 * 2PI.

            const beijingLonRad = MathUtils.degToRad(116.4);
            const sunDirection = orbitAngle + Math.PI;
            const timeOffset = ((timeOfDay - 12) / 24) * Math.PI * 2;

            // Note: Earth rotates CCW (increasing angle).
            // So we ADD timeOffset.
            // But wait, 13:00 means Beijing has moved PAST the Sun.
            // So Beijing Angle increases.
            // Yes, Earth rotates CCW.

            // However, texture mapping might be different.
            // Let's assume standard UV.
            // We might need a manual offset constant to align texture 0 with geometry 0.
            // Usually 0 lon is at +Z.

            earthRotationRef.current.rotation.y = sunDirection - beijingLonRad + timeOffset;
        }
    });

    // Beijing Coordinates
    // Lat: 39.9 N, Lon: 116.4 E
    // We need to convert spherical to cartesian on the Earth sphere.
    // Radius = 0.5 (UNIVERSE_CONSTANTS.EARTH.RADIUS)
    const beijingLat = 39.9;
    const beijingLon = 116.4;
    const earthRadius = UNIVERSE_CONSTANTS.EARTH.RADIUS;

    // Convert to Cartesian
    // Phi (polar angle) = 90 - Lat
    // Theta (azimuthal angle) = -Lon (Three.js coordinate system quirks, usually)
    const phi = MathUtils.degToRad(90 - beijingLat);
    const theta = MathUtils.degToRad(beijingLon + 90); // +90 to align texture/model if needed, or just relative

    const beijingX = earthRadius * Math.sin(phi) * Math.cos(theta);
    const beijingY = earthRadius * Math.cos(phi);
    const beijingZ = earthRadius * Math.sin(phi) * Math.sin(theta);

    // Camera Transition Logic
    const { previousViewMode } = useSimulationStore();

    // Calculate Earth Position for transition start
    const orbitAngle = (date / 365) * Math.PI * 2;
    const earthPos = new Vector3(
        Math.cos(orbitAngle) * orbitRadius,
        0,
        Math.sin(orbitAngle) * orbitRadius
    );

    let startPos: Vector3 | undefined;
    let startTarget: Vector3 | undefined;

    if (previousViewMode === 'human') {
        // Start close to Earth (Zoom out from Earth)
        startPos = earthPos.clone().add(new Vector3(0, 2, 5));
        startTarget = earthPos.clone();
    } else if (previousViewMode === 'galactic') {
        // Start far away (Zoom in from Galaxy)
        startPos = new Vector3(0, 100, 100);
        startTarget = new Vector3(0, 0, 0);
    }

    return (
        <group>
            <CameraTransition
                enabled={!!previousViewMode}
                startPos={startPos}
                targetPos={new Vector3(0, 20, 20)}
                startTarget={startTarget || new Vector3(0, 0, 0)}
                targetTarget={new Vector3(0, 0, 0)}
                duration={2.5}
            />

            {/* Background Galaxy (Scaled up to be "Universe") */}
            {/* Galaxy radius is 50. Solar system orbit is 10.
                If we want Galaxy to be background, it needs to be HUGE.
                Scale = 100? Radius = 5000.
                Position: Solar System is at (25, 0, 0) in Galactic View.
                So Galaxy Center should be at (-25 * scale, 0, 0) relative to Sun?
                Let's try scale 20 first.
            */}
            <group position={[-UNIVERSE_CONSTANTS.GALAXY.SOLAR_SYSTEM_DISTANCE * 20, 0, 0]} scale={[20, 20, 20]} rotation={[Math.PI / 3, 0, 0]}>
                <Galaxy />
            </group>

            {/* Background Stars */}
            <Stars
                radius={UNIVERSE_CONSTANTS.STARS.RADIUS}
                depth={50}
                count={UNIVERSE_CONSTANTS.STARS.COUNT}
                factor={4}
                saturation={0}
                fade
                speed={0}
            />

            {/* Sun */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[UNIVERSE_CONSTANTS.SUN.RADIUS_SOLAR_VIEW, 32, 32]} />
                <meshStandardMaterial
                    color={UNIVERSE_CONSTANTS.SUN.COLOR}
                    emissive={UNIVERSE_CONSTANTS.SUN.EMISSIVE}
                    emissiveIntensity={UNIVERSE_CONSTANTS.SUN.EMISSIVE_INTENSITY}
                />
                <pointLight intensity={2} distance={50} decay={2} />
            </mesh>
            <Billboard position={[0, 3, 0]}>
                <Text fontSize={1} color={UNIVERSE_CONSTANTS.SUN.COLOR}>Sun</Text>
            </Billboard>

            {/* Orbit Path */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[orbitRadius - 0.1, orbitRadius + 0.1, 128]} />
                <meshBasicMaterial color="#888" side={2} transparent opacity={0.8} />
            </mesh>
            <Billboard position={[orbitRadius + 1.5, 0, 0]}>
                <Text fontSize={0.8} color="#aaa">Earth's Orbit</Text>
            </Billboard>

            {/* Earth Group (Handles Orbit Position) */}
            <group ref={earthGroupRef}>
                {/* Axial Tilt Group (23.5 degrees) */}
                <group rotation={[0, 0, MathUtils.degToRad(23.5)]}>
                    {/* Rotation Group (Handles Daily Spin) */}
                    <group ref={earthRotationRef}>
                        {/* Earth Sphere */}
                        <mesh>
                            <sphereGeometry args={[earthRadius, 32, 32]} />
                            <meshStandardMaterial color={UNIVERSE_CONSTANTS.EARTH.COLOR} roughness={0.7} />
                        </mesh>

                        {/* Beijing Marker */}
                        <group position={[beijingX, beijingY, beijingZ]}>
                            {/* Marker Dot */}
                            <mesh>
                                <sphereGeometry args={[0.05, 16, 16]} />
                                <meshBasicMaterial color="red" />
                            </mesh>

                            {/* Label */}
                            <Html distanceFactor={10}>
                                <div style={{ color: 'white', background: 'rgba(0,0,0,0.7)', padding: '2px 5px', borderRadius: '4px', fontSize: '12px' }}>
                                    Beijing
                                </div>
                            </Html>

                            {/* Coordinate System (Local Frame) */}
                            {/* Up (Red) - Normal to surface */}
                            <arrowHelper args={[new Vector3(beijingX, beijingY, beijingZ).normalize(), new Vector3(0, 0, 0), 0.3, 'red']} />
                            {/* North (Green) - Tangent pointing North */}
                            {/* East (Blue) - Tangent pointing East */}
                            {/* We can use AxesHelper but need to align it.
                                Actually, ArrowHelpers are clearer for specific directions.
                            */}
                        </group>

                        {/* Night Side Indicator (Opposite to Sun? No, this rotates with Earth now, so it's wrong)
                            The Night Side indicator should be static relative to the Sun, NOT rotating with Earth.
                            So it should be outside the Rotation Group but inside the Earth Group.
                        */}
                    </group>

                    {/* Axis Line */}
                    <Line points={[[0, -1, 0], [0, 1, 0]]} color="white" transparent opacity={0.3} />
                </group>

                {/* Visualizing the View Cone */}
                <Line
                    points={[[0, 0, 0], [5, 0, 0]]} // Local +X
                    color="cyan"
                    lineWidth={2}
                />
                <mesh position={[5, 0, 0]}>
                    <sphereGeometry args={[0.2]} />
                    <meshBasicMaterial color="cyan" />
                </mesh>
                <Billboard position={[5.5, 0, 0]}>
                    <Text fontSize={0.4} color="cyan">Night View</Text>
                </Billboard>
            </group>

            <ambientLight intensity={0.1} />
            <PerspectiveCamera makeDefault position={[0, 20, 20]} fov={45} />
            <OrbitControls target={[0, 0, 0]} />
        </group>
    );
};

// Helper to handle the orientation logic cleanly
const EarthOrientationController = ({ earthRef, date }: { earthRef: any, date: number }) => {
    useFrame(() => {
        if (earthRef.current) {
            const angle = (date / 365) * Math.PI * 2;
            // We want the Earth's "Night View" (say, local +X) to point away from Sun.
            // Earth pos is (cos(a), sin(a)).
            // Vector from Sun to Earth is (cos(a), sin(a)).
            // So we want local +X to align with world (cos(a), sin(a)).
            // Rotation Z is 0. Rotation Y should be 'angle' ?
            // If rotY = 0, +X is (1, 0).
            // If rotY = 90 deg (PI/2), +X is (0, -1) or (0, 1)?
            // Three.js: RotY(a) on (1,0,0) -> (cos a, 0, -sin a).
            // We want (cos a, 0, sin a). So maybe -angle?

            earthRef.current.rotation.y = -angle;
        }
    });
    return null;
}
