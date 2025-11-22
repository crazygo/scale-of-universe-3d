import { useThree, useFrame } from '@react-three/fiber';
import { Vector3, MathUtils } from 'three';
import { useEffect, useRef, useState } from 'react';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface CameraTransitionProps {
    startPos?: Vector3;
    targetPos: Vector3;
    startTarget?: Vector3;
    targetTarget: Vector3;
    duration?: number;
    enabled: boolean;
}

export const CameraTransition = ({
    startPos,
    targetPos,
    startTarget,
    targetTarget,
    duration = 2.0,
    enabled
}: CameraTransitionProps) => {
    const { camera, controls } = useThree();
    const [isAnimating, setIsAnimating] = useState(false);
    const startTimeRef = useRef(0);

    // Initial Setup
    useEffect(() => {
        if (enabled && startPos) {
            camera.position.copy(startPos);
            if (controls && startTarget) {
                (controls as OrbitControlsImpl).target.copy(startTarget);
            }
            setIsAnimating(true);
            startTimeRef.current = Date.now();
        }
    }, [enabled, startPos, startTarget, camera, controls]);

    // Animation Loop
    useFrame(() => {
        if (!isAnimating) return;

        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const ease = 1 - Math.pow(1 - progress, 3);

        if (startPos) {
            camera.position.lerpVectors(startPos, targetPos, ease);
        }

        if (controls && startTarget) {
            (controls as OrbitControlsImpl).target.lerpVectors(startTarget, targetTarget, ease);
            (controls as OrbitControlsImpl).update();
        }

        if (progress >= 1) {
            setIsAnimating(false);
        }
    });

    return null;
};
