import { useMemo } from 'react';
import { Billboard, Text, Grid } from '@react-three/drei';
import { Vector3, MathUtils, Quaternion } from 'three';
import { useSimulationStore } from '../store/simulationStore';
import { UNIVERSE_CONSTANTS } from '../constants/universe';

/**
 * Earth component - renders the Earth sphere with Beijing marker
 * Position and rotation are controlled by parent UnifiedScene
 */
export const Earth = () => {
  const { RADIUS, COLOR } = UNIVERSE_CONSTANTS.EARTH;
  const { viewMode } = useSimulationStore();

  // Beijing position on Earth's surface (spherical coordinates)
  const beijingPos = useMemo(() => {
    const lat = UNIVERSE_CONSTANTS.BEIJING.LATITUDE;
    const lon = UNIVERSE_CONSTANTS.BEIJING.LONGITUDE;
    const phi = MathUtils.degToRad(90 - lat);    // Polar angle from Y-axis
    const theta = MathUtils.degToRad(lon + 90);  // Azimuthal angle

    return new Vector3(
      RADIUS * Math.sin(phi) * Math.cos(theta),
      RADIUS * Math.cos(phi),
      RADIUS * Math.sin(phi) * Math.sin(theta)
    );
  }, [RADIUS]);

  return (
    <group>
      {/* Earth Sphere */}
      <mesh>
        <sphereGeometry args={[RADIUS, 32, 32]} />
        <meshStandardMaterial color={COLOR} roughness={0.7} />
      </mesh>

      {/* Beijing Marker */}
      <group position={beijingPos}>
        {/* Red marker sphere */}
        <mesh>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="red" />
        </mesh>

        {/* Beijing label */}
        <Billboard position={[0, 0.2, 0]}>
          <Text fontSize={0.15} color="white">
            Beijing
          </Text>
        </Billboard>

        {/* 3D Grid for Human View - Local reference frame */}
        {viewMode === 'human' && (
          <group
            position={[0, 0.01, 0]}
            quaternion={new Quaternion().setFromUnitVectors(
              new Vector3(0, 1, 0),
              beijingPos.clone().normalize()
            )}
          >
            {/* Ground grid */}
            <Grid
              args={[10, 10]}
              cellColor={0x888888}
              sectionColor={0x444444}
              fadeDistance={30}
              fadeStrength={1}
              infiniteGrid={false}
              position={[0, 0, 0]}
              rotation={[Math.PI / 2, 0, 0]}
            />

            {/* Cardinal Direction Markers */}
            <Billboard position={[0, 0.1, -5]}>
              <Text fontSize={0.5} color="white">N</Text>
            </Billboard>
            <Billboard position={[0, 0.1, 5]}>
              <Text fontSize={0.5} color="white">S</Text>
            </Billboard>
            <Billboard position={[5, 0.1, 0]}>
              <Text fontSize={0.5} color="white">E</Text>
            </Billboard>
            <Billboard position={[-5, 0.1, 0]}>
              <Text fontSize={0.5} color="white">W</Text>
            </Billboard>
          </group>
        )}
      </group>
    </group>
  );
};
