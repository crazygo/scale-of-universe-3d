import { useControls, folder, button } from 'leva';
import { useSimulationStore } from '../store/simulationStore';
import { UNIVERSE_CONSTANTS } from '../constants/universe';

/**
 * Time Controller - UI controls for time, date, and simulation speed
 * Uses Leva for dev panel controls
 */
export const TimeController = () => {
  const {
    date,
    timeOfDay,
    timeMultiplier,
    isPaused,
    setDate,
    setTimeOfDay,
    setTimeMultiplier,
    setIsPaused,
  } = useSimulationStore();

  // Convert date to month name for display
  const getMonthName = (day: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    let remaining = day;
    for (let i = 0; i < 12; i++) {
      if (remaining < daysInMonths[i]) {
        return `${months[i]} ${Math.floor(remaining) + 1}`;
      }
      remaining -= daysInMonths[i];
    }
    return 'December 31';
  };

  // Format time for display
  const formatTime = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  useControls({
    'Time Control': folder({
      'Current Date': {
        value: getMonthName(date),
        editable: false,
      },
      'Current Time (UTC+8)': {
        value: formatTime(timeOfDay),
        editable: false,
      },
      'Day of Year': {
        value: date,
        min: 0,
        max: 364,
        step: 1,
        onChange: (v) => setDate(v),
      },
      'Time of Day': {
        value: timeOfDay,
        min: 0,
        max: 24,
        step: 0.1,
        onChange: (v) => setTimeOfDay(v),
      },
    }),
    'Speed Control': folder({
      'Time Multiplier': {
        value: timeMultiplier,
        min: UNIVERSE_CONSTANTS.TIME.MIN_MULTIPLIER,
        max: UNIVERSE_CONSTANTS.TIME.MAX_MULTIPLIER,
        step: 10,
        onChange: (v) => setTimeMultiplier(v),
      },
      'Paused': {
        value: isPaused,
        onChange: (v) => setIsPaused(v),
      },
      'Preset: Real-time': button(() => setTimeMultiplier(1)),
      'Preset: 1 min/sec': button(() => setTimeMultiplier(60)),
      'Preset: 1 hour/sec': button(() => setTimeMultiplier(3600)),
      'Preset: 1 day/sec': button(() => setTimeMultiplier(86400)),
    }),
  });

  return null; // Leva renders its own UI
};
