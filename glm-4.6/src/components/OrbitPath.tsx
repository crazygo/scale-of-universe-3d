import { useMemo } from 'react';
import { Line, Billboard, Text } from '@react-three/drei';
import { Vector3 } from 'three';
import { UNIVERSE_CONSTANTS } from '../constants/universe';

/**
 * Orbit Path visualization - Elliptical orbit ring
 * Semi-transparent guide showing Earth's orbital path
 */
export const OrbitPath = () => {
  const { ORBIT_RADIUS, ECCENTRICITY } = UNIVERSE_CONSTANTS.EARTH;

  // Ellipse parameters
  const semiMajorAxis = ORBIT_RADIUS;
  const semiMinorAxis = semiMajorAxis * Math.sqrt(1 - ECCENTRICITY * ECCENTRICITY);
  const focalDistance = semiMajorAxis * ECCENTRICITY;

  // Generate orbit path points
  const orbitPoints = useMemo(() => {
    const points: Vector3[] = [];
    const segments = 128;

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      // Ellipse centered at focalDistance so Sun is at focus
      points.push(new Vector3(
        focalDistance + Math.cos(theta) * semiMajorAxis,
        0,
        Math.sin(theta) * semiMinorAxis
      ));
    }

    return points;
  }, [focalDistance, semiMajorAxis, semiMinorAxis]);

  return (
    <group>
      {/* Orbit line */}
      <Line
        points={orbitPoints}
        color="#888888"
        opacity={0.3}
        transparent
        lineWidth={1}
      />

      {/* Orbit label */}
      <Billboard position={[ORBIT_RADIUS, 0.5, 0]}>
        <Text fontSize={0.8} color="#888888">
          Earth's Orbit
        </Text>
      </Billboard>
    </group>
  );
};
