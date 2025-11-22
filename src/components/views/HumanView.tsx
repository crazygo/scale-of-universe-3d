import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, PerspectiveCamera, OrbitControls, Text, Line, Billboard } from '@react-three/drei';
import { Group, MathUtils, Vector3 } from 'three';
import { useSimulationStore } from '../../store/simulationStore';
import { Galaxy } from '../Galaxy';
import { UNIVERSE_CONSTANTS } from '../../constants/universe';
import { CameraTransition } from '../CameraTransition';

export const HumanView = () => {
    const { date, timeOfDay, latitude } = useSimulationStore();
    const skyRef = useRef<Group>(null);
    const tiltRef = useRef<Group>(null);
    const spinRef = useRef<Group>(null);

    useFrame(() => {
        if (skyRef.current && tiltRef.current && spinRef.current) {
            // Simplified Astronomy Logic

            // 1. Latitude Tilt:
            const latRad = MathUtils.degToRad(90 - latitude);

            // 2. Sidereal Rotation (Yearly Progress):
            // The sky shifts ~1 degree per day relative to the Sun.
            const yearProgress = date / 365;
            const siderealAngle = yearProgress * Math.PI * 2;

            // 3. Daily Rotation (Time of Day):
            // Earth rotates 360 degrees in 24 hours.
            // Sky rotates -360 degrees in 24 hours.
            // We use UTC+8 (Beijing Time).
            // At 12:00 Beijing Time, the Sun should be roughly at the Meridian (South).
            // We need to calibrate the phase.
            // Let's assume at time=12, rotation puts Sun at South.
            // Sun's position on Ecliptic (relative to stars) is determined by `date`.
            // We rotate the whole sky (Stars + Ecliptic + Sun) based on Time.

            // Rotation Rate: 2PI per 24h.
            // Direction: -Y (Clockwise looking from top) because Earth spins +Y (CCW).
            const timeProgress = (timeOfDay - 12) / 24; // 0 at 12:00
            const dailyAngle = timeProgress * Math.PI * 2;

            // Total Rotation = Sidereal (Star position) + Daily (Earth spin)
            // Actually, Sun position relative to Stars is `siderealAngle`.
            // If we rotate the Sky Group by `dailyAngle`, the Stars move.
            // The Sun is attached to the Sky Group, so it moves with Stars.
            // BUT Sun moves relative to Stars over the year.
            // Our SunMarker calculation `angle = (date/365)*2PI` places Sun on Ecliptic relative to Stars.
            // So if we rotate Sky Group, we rotate everything.

            // We want Sun to be South at 12:00.
            // "South" in our view depends on camera/scene orientation.
            // Let's assume South is +Z (or -Z).
            // We'll add a phase offset to align it.
            // If we subtract `siderealAngle` from rotation, we keep Sun fixed? No.
            // Let's try: rotation = -dailyAngle - siderealAngle + Offset

            // Calibrated for visual correctness:
            // At 12:00 (dailyAngle=0), Sun should be South.
            // South is -Z direction (Angle -PI/2 or 3PI/2).
            // SunLocal (at Equinox) is 0 (East).
            // We want 0 + Rotation = -PI/2.
            // Rotation = -PI/2.

            spinRef.current.rotation.y = -dailyAngle - siderealAngle - Math.PI / 2;
        }
    });

    // Big Dipper (Ursa Major) Coordinates (Approximate relative to North Pole)
    // North Pole is +Y in the "Spin" group.
    // Big Dipper is roughly at RA 11h-13h, Dec +50 to +60.
    // We'll just hardcode some points for visual reference near the "North Star".
    const bigDipperPoints = [
        [1, 3, 1], [1.5, 2.8, 0.8], [2, 2.5, 0.5], // Handle
        [2, 2.5, 0.5], [2.5, 1.5, 0.5], [3.5, 1.5, 0.8], [3.2, 2.5, 1.2], [2, 2.5, 0.5] // Bowl
    ].map(p => new Vector3(p[0], p[1], p[2]).normalize().multiplyScalar(90)); // Project to sky sphere radius

    // Camera Transition
    const { previousViewMode: prevMode } = useSimulationStore();
    let startPos: Vector3 | undefined;

    if (prevMode === 'solar-system') {
        // Start high up (Re-entry)
        startPos = new Vector3(0, 50, 0);
    }

    return (
        <group>
            <CameraTransition
                enabled={!!prevMode}
                startPos={startPos}
                targetPos={new Vector3(0, 1.7, -0.1)}
                startTarget={new Vector3(0, 0, 0)} // Look down initially?
                targetTarget={new Vector3(0, 1.7, 0)}
                duration={2.0}
            />

            {/* Ground Plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
                <circleGeometry args={[20, 64]} />
                <meshStandardMaterial color="#050505" />
            </mesh>
            <gridHelper args={[40, 40, '#222', '#111']} position={[0, -0.99, 0]} />

            {/* Cardinal Directions */}
            <Billboard position={[0, -0.5, 18]}>
                <Text fontSize={2} color="#444">N</Text>
            </Billboard>
            <Billboard position={[0, -0.5, -18]}>
                <Text fontSize={2} color="#444">S</Text>
            </Billboard>
            <Billboard position={[18, -0.5, 0]}>
                <Text fontSize={2} color="#444">E</Text>
            </Billboard>
            <Billboard position={[-18, -0.5, 0]}>
                <Text fontSize={2} color="#444">W</Text>
            </Billboard>

            {/* Sky Hierarchy */}
            <group ref={tiltRef}> {/* Latitude Tilt Group */}

                {/* North Star (Polaris) - Static relative to Tilt Group (The Axis) */}
                <mesh position={[0, 95, 0]}>
                    <sphereGeometry args={[0.5, 16, 16]} />
                    <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
                </mesh>
                <Billboard position={[0, 97, 0]}>
                    <Text fontSize={2} color="white" anchorY="bottom">
                        North Star
                    </Text>
                </Billboard>

                <group ref={spinRef}> {/* Sidereal Spin Group */}
                    <group ref={skyRef}> {/* The Sky Content */}
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

                        {/* Big Dipper */}
                        <Line points={bigDipperPoints} color="cyan" lineWidth={2} />
                        <Billboard position={bigDipperPoints[1]}>
                            <Text fontSize={1.5} color="cyan" anchorX="right">
                                Big Dipper
                            </Text>
                        </Billboard>

                        {/* Unified Galaxy Model */}
                        {/*
                           In GalacticView, Solar System is at [25, 0, 0].
                           Here, we are AT the Solar System (0,0,0).
                           So the Galaxy Center should be at [-25, 0, 0].
                           We scale it up so it surrounds us properly.
                           If we use scale=1, it's small (radius 50).
                           We want it to look like the Milky Way band.
                           Let's scale it by 5 to make it huge enough to be a "band" in the sky.
                        */}
                        <group position={[-UNIVERSE_CONSTANTS.GALAXY.SOLAR_SYSTEM_DISTANCE * 5, 0, 0]} scale={[5, 5, 5]} rotation={[Math.PI / 3, 0, 0]}>
                            <Galaxy />
                            {/* Galactic Center Marker inside the Galaxy group */}
                            <mesh position={[0, 0, 0]}>
                                <sphereGeometry args={[1, 16, 16]} />
                                <meshBasicMaterial color={UNIVERSE_CONSTANTS.GALAXY.CENTER_COLOR} />
                            </mesh>
                        </group>

                        {/* Label for Galactic Center (Positioned in Sky coordinates) */}
                        {/* We need to calculate where -25*5 is. It's at x=-125. */}
                        <Billboard position={[-125, 10, 0]}>
                            <Text fontSize={5} color={UNIVERSE_CONSTANTS.GALAXY.CENTER_COLOR} anchorY="bottom">
                                Galactic Center
                            </Text>
                        </Billboard>

                        {/* Ecliptic Line (Path of Sun) */}
                        {/* The Ecliptic is tilted ~23.5 deg relative to Equator.
                            In our simplified model, the "Spin" axis is the Celestial Pole.
                            The Equator is the plane perpendicular to Spin.
                            So Ecliptic is tilted 23.5 deg from that.
                        */}
                        <group rotation={[MathUtils.degToRad(23.5), 0, 0]}>
                            <mesh>
                                <ringGeometry args={[88, 89, 64]} />
                                <meshBasicMaterial color="yellow" side={2} transparent opacity={0.5} />
                            </mesh>
                            <Billboard position={[0, 90, 0]}>
                                <Text fontSize={2} color="yellow">Ecliptic</Text>
                            </Billboard>

                            {/* Sun Marker - Moves along Ecliptic based on date?
                                Actually, in this "Sky" frame, the Stars rotate. The Sun moves relative to Stars.
                                Sun moves ~1 deg/day along Ecliptic.
                                Position = angle based on date.
                            */}
                            <SunMarker date={date} />
                        </group>
                    </group>
                </group>
            </group>

            <ambientLight intensity={0.2} />
            {/* First Person Camera: Position at eye level (1.7m).
                OrbitControls usually rotates camera AROUND a target.
                To simulate "Looking around", we want the camera fixed at [0, 1.7, 0] and rotating its gaze.
                But OrbitControls is easier for "inspecting the sky".
                Let's keep OrbitControls but move camera closer to center so it feels like we are there.
                
                CONSTRAINT: Fixed facing North (+Z).
                Camera should be at [0, 1.7, -0.1] looking at [0, 1.7, 0] (which is +Z direction).
                Wait, if target is (0,0,0), and camera is (0,0,-1), it looks at +Z.
                
                OrbitControls Azimuth:
                0 is usually +Z.
                Let's lock Azimuth to 0.
            */}
            <PerspectiveCamera makeDefault position={[0, 1.7, -0.1]} fov={75} />
            <OrbitControls
                target={[0, 1.7, 0]}
                enableZoom={false}
                enablePan={false}
                rotateSpeed={0.5}
                minAzimuthAngle={Math.PI} // Lock to facing North (which is +Z, so camera at -Z is angle PI)
                maxAzimuthAngle={Math.PI}
                minPolarAngle={0} // Allow looking up
                maxPolarAngle={Math.PI / 2} // Don't look below ground
            />
        </group>
    );
};

const SunMarker = ({ date }: { date: number }) => {
    // Sun moves along Ecliptic.
    // 365 days = 2PI.
    // We need to position it on the ring.
    const angle = (date / 365) * Math.PI * 2;
    const radius = 88.5;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    return (
        <group position={[x, 0, z]}>
            <mesh>
                <sphereGeometry args={[UNIVERSE_CONSTANTS.SUN.RADIUS_HUMAN_VIEW, 32, 32]} />
                <meshStandardMaterial
                    color={UNIVERSE_CONSTANTS.SUN.COLOR}
                    emissive={UNIVERSE_CONSTANTS.SUN.EMISSIVE}
                    emissiveIntensity={UNIVERSE_CONSTANTS.SUN.EMISSIVE_INTENSITY}
                />
            </mesh>
            <Billboard position={[0, 5, 0]}>
                <Text fontSize={3} color={UNIVERSE_CONSTANTS.SUN.COLOR}>Sun</Text>
            </Billboard>
        </group>
    );
};
