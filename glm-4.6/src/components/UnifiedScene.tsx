import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, CameraControls } from '@react-three/drei';
import { Group, Vector3, MathUtils } from 'three';
import { useSimulationStore } from '../store/simulationStore';
import { UNIVERSE_CONSTANTS } from '../constants/universe';
import { Sun } from './Sun';
import { Earth } from './Earth';
import { Galaxy } from './Galaxy';
import { OrbitPath } from './OrbitPath';

/**
 * Unified Scene - Single continuous 3D universe scene
 * Contains all celestial bodies and manages camera transitions
 */
export const UnifiedScene = () => {
  const cameraControlsRef = useRef<CameraControls>(null);
  const earthGroupRef = useRef<Group>(null);
  const earthRotationRef = useRef<Group>(null);

  const { viewMode, updateSimulationTime, isPaused } = useSimulationStore();

  const { RADIUS, ORBIT_RADIUS, AXIAL_TILT, ECCENTRICITY } = UNIVERSE_CONSTANTS.EARTH;
  const { SOLAR_SYSTEM_DISTANCE } = UNIVERSE_CONSTANTS.GALAXY;

  // Ellipse parameters
  const semiMajorAxis = ORBIT_RADIUS;
  const semiMinorAxis = semiMajorAxis * Math.sqrt(1 - ECCENTRICITY * ECCENTRICITY);
  const focalDistance = semiMajorAxis * ECCENTRICITY;

  // Update simulation time each frame
  useFrame((_, delta) => {
    if (!isPaused) {
      updateSimulationTime(delta * 1000); // Convert to milliseconds
    }
  });

  // Update Earth position and rotation
  useFrame(() => {
    const { date, timeOfDay } = useSimulationStore.getState();

    if (!earthGroupRef.current || !earthRotationRef.current) return;

    // === Orbital Position (Yearly) ===
    const perihelionDay = 3;
    const yearProgress = date / 365;
    const orbitOffset = Math.PI - (perihelionDay / 365) * Math.PI * 2;
    const meanAnomaly = yearProgress * Math.PI * 2;
    const orbitAngle = meanAnomaly + orbitOffset;

    const xCenter = Math.cos(orbitAngle) * semiMajorAxis;
    const zCenter = Math.sin(orbitAngle) * semiMinorAxis;

    earthGroupRef.current.position.x = focalDistance + xCenter;
    earthGroupRef.current.position.z = zCenter;
    earthGroupRef.current.position.y = 0;

    // === Daily Rotation ===
    const beijingLonRad = MathUtils.degToRad(UNIVERSE_CONSTANTS.BEIJING.LONGITUDE);
    const earthPos = earthGroupRef.current.position;
    const toSun = new Vector3(0, 0, 0).sub(earthPos).normalize();
    const sunDirection = Math.atan2(toSun.x, toSun.z);
    const timeOffset = ((timeOfDay - 12) / 24) * Math.PI * 2;

    earthRotationRef.current.rotation.y = sunDirection - beijingLonRad + timeOffset;
  });

  // Calculate Beijing world position and local directions
  const getBeijingTransform = () => {
    if (!earthGroupRef.current || !earthRotationRef.current) return null;

    const lat = UNIVERSE_CONSTANTS.BEIJING.LATITUDE;
    const lon = UNIVERSE_CONSTANTS.BEIJING.LONGITUDE;
    const phi = MathUtils.degToRad(90 - lat);
    const theta = MathUtils.degToRad(lon + 90);

    // Beijing position in Earth's local space (before rotation)
    const beijingLocal = new Vector3(
      RADIUS * Math.sin(phi) * Math.cos(theta),
      RADIUS * Math.cos(phi),
      RADIUS * Math.sin(phi) * Math.sin(theta)
    );

    // Surface normal (up direction) in local space
    const localUp = beijingLocal.clone().normalize();

    // Calculate local South direction (towards equator, along meridian)
    // South is the direction of decreasing latitude
    const latRad = MathUtils.degToRad(lat);
    const lonRad = MathUtils.degToRad(lon);
    // Tangent vector pointing South (derivative with respect to latitude)
    const localSouth = new Vector3(
      Math.cos(latRad) * Math.sin(lonRad),
      -Math.sin(latRad),
      Math.cos(latRad) * Math.cos(lonRad)
    ).normalize();

    // Apply Earth's daily rotation
    const rotY = earthRotationRef.current.rotation.y;
    beijingLocal.applyAxisAngle(new Vector3(0, 1, 0), rotY);
    localUp.applyAxisAngle(new Vector3(0, 1, 0), rotY);
    localSouth.applyAxisAngle(new Vector3(0, 1, 0), rotY);

    // Apply Earth's axial tilt
    const tiltRad = MathUtils.degToRad(AXIAL_TILT);
    beijingLocal.applyAxisAngle(new Vector3(0, 0, 1), tiltRad);
    localUp.applyAxisAngle(new Vector3(0, 0, 1), tiltRad);
    localSouth.applyAxisAngle(new Vector3(0, 0, 1), tiltRad);

    // World position
    const worldPos = earthGroupRef.current.position.clone().add(beijingLocal);

    return {
      position: worldPos,
      up: localUp,
      south: localSouth,
    };
  };

  // Handle view mode transitions
  useEffect(() => {
    if (!cameraControlsRef.current) return;
    const controls = cameraControlsRef.current;

    if (viewMode === 'galactic') {
      controls.setLookAt(
        -SOLAR_SYSTEM_DISTANCE, 60, 80,
        -SOLAR_SYSTEM_DISTANCE, 0, 0,
        true
      );
    } else if (viewMode === 'solar-system') {
      controls.setLookAt(0, 20, 20, 0, 0, 0, true);
    }
  }, [viewMode, SOLAR_SYSTEM_DISTANCE]);

  // Continuous camera updates for Human View
  // Camera is anchored to Beijing surface, looking towards South horizon
  // This allows observing the Sun rise in the East and set in the West
  useFrame(({ camera }) => {
    if (!cameraControlsRef.current || viewMode !== 'human') return;

    const transform = getBeijingTransform();
    if (!transform) return;

    const { position, up, south } = transform;
    const cameraHeight = UNIVERSE_CONSTANTS.CAMERA_PRESETS.HUMAN.height;

    // Camera position: slightly above Beijing's surface
    const cameraPos = position.clone().add(up.clone().multiplyScalar(cameraHeight));

    // Look target: point on the horizon towards South
    // This keeps a fixed viewing direction relative to the ground
    // As Earth rotates, the Sun will move across this view
    const lookDistance = 10;
    const lookTarget = cameraPos.clone().add(south.clone().multiplyScalar(lookDistance));

    // Set camera up vector to match local "up" (surface normal)
    camera.up.copy(up);

    cameraControlsRef.current.setLookAt(
      cameraPos.x, cameraPos.y, cameraPos.z,
      lookTarget.x, lookTarget.y, lookTarget.z,
      false // Don't animate - need instant update to follow rotation
    );
  });

  return (
    <group>
      {/* Background Stars */}
      <Stars
        radius={300}
        depth={50}
        count={UNIVERSE_CONSTANTS.STARS.COUNT}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      {/* Galaxy */}
      <Galaxy />

      {/* Sun at origin */}
      <Sun />

      {/* Earth's Orbit Path */}
      <OrbitPath />

      {/* Earth Group */}
      <group ref={earthGroupRef}>
        <group rotation={[0, 0, MathUtils.degToRad(AXIAL_TILT)]}>
          <group ref={earthRotationRef}>
            <Earth />
          </group>
        </group>
      </group>

      {/* Ambient light */}
      <ambientLight intensity={0.2} />

      {/* Camera Controls */}
      <CameraControls
        ref={cameraControlsRef}
        makeDefault
        minDistance={0.5}
        maxDistance={500}
      />
    </group>
  );
};
