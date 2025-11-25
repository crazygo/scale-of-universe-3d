import { useFrame } from '@react-three/fiber';
import { useSimulationStore } from '../store/simulationStore';

export const TimeController = () => {
    const { timeSpeed, isPaused, timeOfDay, setTimeOfDay, date, setDate } = useSimulationStore();

    useFrame((state, delta) => {
        if (isPaused) return;

        // delta is in seconds.
        // timeSpeed is multiplier (e.g. 60 means 1 sec real = 60 sec sim).
        // We need to add (delta * timeSpeed) seconds to our current time.

        const secondsToAdd = delta * timeSpeed * 10;
        const hoursToAdd = secondsToAdd / 3600;

        let newTime = timeOfDay + hoursToAdd;
        let newDate = date;

        // Handle Day Rollover
        if (newTime >= 24) {
            newTime -= 24;
            newDate += 1;
        }

        // Handle Year Rollover
        if (newDate >= 365) {
            newDate -= 365;
        }

        setTimeOfDay(newTime);
        setDate(newDate);
    });

    return null;
};
