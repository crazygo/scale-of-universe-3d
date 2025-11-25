import { Billboard, Text } from '@react-three/drei';
import { UNIVERSE_CONSTANTS } from '../constants/universe';

/**
 * Sun component - positioned at origin (0, 0, 0)
 * Red color as specified in blueprint
 */
export const Sun = () => {
  const { COLOR, EMISSIVE, EMISSIVE_INTENSITY, RADIUS_SOLAR_VIEW } = UNIVERSE_CONSTANTS.SUN;

  return (
    <group position={[0, 0, 0]}>
      {/* Sun sphere with emissive material */}
      <mesh>
        <sphereGeometry args={[RADIUS_SOLAR_VIEW, 32, 32]} />
        <meshStandardMaterial
          color={COLOR}
          emissive={EMISSIVE}
          emissiveIntensity={EMISSIVE_INTENSITY}
        />
      </mesh>

      {/* Sun label - billboard always faces camera */}
      <Billboard position={[0, RADIUS_SOLAR_VIEW + 1, 0]}>
        <Text fontSize={2} color={COLOR}>
          Sun
        </Text>
      </Billboard>

      {/* Point light to illuminate the scene */}
      <pointLight intensity={2} distance={100} decay={0.1} />
    </group>
  );
};
