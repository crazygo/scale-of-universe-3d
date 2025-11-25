import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import { Points, Color } from 'three';
import { UNIVERSE_CONSTANTS } from '../constants/universe';

/**
 * Galaxy component - Spiral galaxy particle system
 * Positioned at (-25, 0, 0) relative to Sun
 */
export const Galaxy = () => {
  const pointsRef = useRef<Points>(null);
  const { CENTER_COLOR, OUTER_COLOR, PARTICLE_COUNT, RADIUS, SOLAR_SYSTEM_DISTANCE } = UNIVERSE_CONSTANTS.GALAXY;

  // Generate spiral galaxy particles
  const { positions, colors } = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];

    const centerColor = new Color(CENTER_COLOR);
    const outerColor = new Color(OUTER_COLOR);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Spiral arm formula
      const armIndex = Math.floor(Math.random() * 4); // 4 spiral arms
      const armAngle = (armIndex / 4) * Math.PI * 2;

      // Distance from center with logarithmic distribution
      const distance = Math.pow(Math.random(), 0.5) * RADIUS;

      // Spiral twist - more twist at greater distances
      const spiralAngle = distance * 0.3 + armAngle;

      // Add randomness for thickness
      const spread = distance * 0.15;
      const x = Math.cos(spiralAngle) * distance + (Math.random() - 0.5) * spread;
      const z = Math.sin(spiralAngle) * distance + (Math.random() - 0.5) * spread;
      const y = (Math.random() - 0.5) * 2; // Thin disk

      positions.push(x, y, z);

      // Color gradient from center to outer
      const t = distance / RADIUS;
      const color = centerColor.clone().lerp(outerColor, t);
      colors.push(color.r, color.g, color.b);
    }

    return {
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
    };
  }, [CENTER_COLOR, OUTER_COLOR, PARTICLE_COUNT, RADIUS]);

  // Slow rotation of galaxy
  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group position={[-SOLAR_SYSTEM_DISTANCE, 0, 0]}>
      {/* Galaxy particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.5}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>

      {/* Galactic Center marker */}
      <mesh>
        <sphereGeometry args={[2, 32, 32]} />
        <meshStandardMaterial
          color={CENTER_COLOR}
          emissive={CENTER_COLOR}
          emissiveIntensity={1}
        />
      </mesh>

      {/* Galactic Center label */}
      <Billboard position={[0, 10, 0]}>
        <Text fontSize={5} color={CENTER_COLOR}>
          Galactic Center
        </Text>
      </Billboard>

      {/* Solar System marker - showing Sun's position in galaxy */}
      <group position={[SOLAR_SYSTEM_DISTANCE, 0, 0]}>
        <mesh>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color={UNIVERSE_CONSTANTS.SUN.COLOR} />
        </mesh>
        <Billboard position={[0, 2, 0]}>
          <Text fontSize={1.5} color={UNIVERSE_CONSTANTS.SUN.COLOR}>
            Solar System
          </Text>
        </Billboard>
      </group>
    </group>
  );
};
