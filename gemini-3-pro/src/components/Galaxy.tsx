import { useMemo } from 'react';
import { Color } from 'three';
import { UNIVERSE_CONSTANTS } from '../constants/universe';

export const Galaxy = () => {
    // Generate Galaxy Particles
    const particles = useMemo(() => {
        const count = UNIVERSE_CONSTANTS.GALAXY.PARTICLE_COUNT;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const colorInside = new Color(UNIVERSE_CONSTANTS.GALAXY.CENTER_COLOR);
        const colorOutside = new Color(UNIVERSE_CONSTANTS.GALAXY.OUTER_COLOR);

        for (let i = 0; i < count; i++) {
            // Spiral Galaxy Logic
            const i3 = i * 3;
            const radius = Math.random() * 50; // Galaxy radius
            const spinAngle = radius * 0.5; // Spiral twist
            const branchAngle = (i % 3) * ((Math.PI * 2) / 3); // 3 arms

            const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 2;
            const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 2;
            const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 2;

            const x = Math.cos(branchAngle + spinAngle) * radius + randomX;
            const y = randomY * (1 - radius / 50) * 2; // Flattened disk
            const z = Math.sin(branchAngle + spinAngle) * radius + randomZ;

            positions[i3] = x;
            positions[i3 + 1] = y;
            positions[i3 + 2] = z;

            // Color gradient
            const mixedColor = colorInside.clone().lerp(colorOutside, radius / 50);
            colors[i3] = mixedColor.r;
            colors[i3 + 1] = mixedColor.g;
            colors[i3 + 2] = mixedColor.b;
        }
        return { positions, colors };
    }, []);

    return (
        <points>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particles.positions.length / 3}
                    array={particles.positions}
                    itemSize={3}
                    args={[particles.positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={particles.colors.length / 3}
                    array={particles.colors}
                    itemSize={3}
                    args={[particles.colors, 3]}
                />
            </bufferGeometry>
            <pointsMaterial size={0.2} vertexColors sizeAttenuation depthWrite={false} blending={2} />
        </points>
    );
};
