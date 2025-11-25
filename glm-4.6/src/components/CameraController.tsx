import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import { Vector3, MathUtils, Group } from 'three';
import { useSimulationStore } from '../store/simulationStore';
import { UNIVERSE_CONSTANTS } from '../constants/universe';

interface CameraControllerProps {
  earthGroupRef: React.RefObject<Group>;
  earthRotationRef: React.RefObject<Group>;
}

/**
 * Camera Controller - Handles smooth transitions between view modes
 * and camera anchoring to Beijing in Human View
 */
export const CameraController = ({ earthGroupRef, earthRotationRef }: CameraControllerProps) => {
  const cameraControlsRef = useRef<CameraControls>(null);
  const { viewMode } = useSimulationStore();

  const { RADIUS, AXIAL_TILT } = UNIVERSE_CONSTANTS.EARTH;
  const { SOLAR_SYSTEM_DISTANCE } = UNIVERSE_CONSTANTS.GALAXY;

  // Calculate Beijing's world position
  const getBeiijingWorldPosition = (): Vector3 | null => {
    if (!earthGroupRef.current || !earthRotationRef.current) return null;

    const lat = UNIVERSE_CONSTANTS.BEIJING.LATITUDE;
    const lon = UNIVERSE_CONSTANTS.BEIJING.LONGITUDE;
    const phi = MathUtils.degToRad(90 - lat);
    const theta = MathUtils.degToRad(lon + 90);

    // Beijing in Earth's local coordinates
    const beijingLocal = new Vector3(
      RADIUS * Math.sin(phi) * Math.cos(theta),
      RADIUS * Math.cos(phi),
      RADIUS * Math.sin(phi) * Math.sin(theta)
    );

    // Apply daily rotation
    const rotY = earthRotationRef.current.rotation.y;
    beijingLocal.applyAxisAngle(new Vector3(0, 1, 0), rotY);

    // Apply axial tilt
    const tiltRad = MathUtils.degToRad(AXIAL_TILT);
    beijingLocal.applyAxisAngle(new Vector3(0, 0, 1), tiltRad);

    // Add Earth's orbital position
    return earthGroupRef.current.position.clone().add(beijingLocal);
  };

  // Handle view mode transitions
  useEffect(() => {
    if (!cameraControlsRef.current) return;
    const controls = cameraControlsRef.current;

    if (viewMode === 'galactic') {
      // Galactic view - zoom out to see galaxy
      controls.setLookAt(
        -SOLAR_SYSTEM_DISTANCE, 60, 80,
        -SOLAR_SYSTEM_DISTANCE, 0, 0,
        true
      );
    } else if (viewMode === 'solar-system') {
      // Solar system view - see Earth's orbit around Sun
      controls.setLookAt(
        0, 20, 20,
        0, 0, 0,
        true
      );
    }
    // Human view is handled in useFrame for continuous tracking
  }, [viewMode, SOLAR_SYSTEM_DISTANCE]);

  // Continuous camera updates for Human View
  useFrame(() => {
    if (!cameraControlsRef.current) return;
    if (viewMode !== 'human') return;

    const beijingWorld = getBeiijingWorldPosition();
    if (!beijingWorld) return;

    // Calculate surface normal (up direction at Beijing)
    const earthPos = earthGroupRef.current!.position;
    const surfaceNormal = beijingWorld.clone().sub(earthPos).normalize();

    // Camera position - slightly above Beijing's surface
    const cameraHeight = UNIVERSE_CONSTANTS.CAMERA_PRESETS.HUMAN.height;
    const cameraPos = beijingWorld.clone().add(
      surfaceNormal.clone().multiplyScalar(cameraHeight)
    );

    // Look towards the horizon (tangent to surface, roughly towards North)
    // For simplicity, look at a point on the horizon in the +Z direction (local north)
    const lookTarget = cameraPos.clone().add(
      new Vector3(0, 0, 1).multiplyScalar(5) // Look towards north
    );

    cameraControlsRef.current.setLookAt(
      cameraPos.x, cameraPos.y, cameraPos.z,
      lookTarget.x, lookTarget.y, lookTarget.z,
      true
    );
  });

  return (
    <CameraControls
      ref={cameraControlsRef}
      makeDefault
      // Allow orbit controls in Solar/Galactic views
      enabled={viewMode !== 'human'}
      minDistance={1}
      maxDistance={500}
    />
  );
};
