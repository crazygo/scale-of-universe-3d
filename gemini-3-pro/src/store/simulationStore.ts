import { create } from 'zustand';

export type ViewMode = 'human' | 'solar-system' | 'galactic';

interface SimulationState {
  date: number; // 0 to 365 (Day of year)
  timeOfDay: number; // 0 to 24 (Hour of day)
  latitude: number; // -90 to 90
  viewMode: ViewMode;
  previousViewMode: ViewMode | null;

  // Time Control
  timeSpeed: number; // Multiplier (1 = Realtime, 60 = 1min/sec)
  isPaused: boolean;

  // Celestial Body Sizing
  scaleFactorSun: number;
  scaleFactorEarth: number;

  setDate: (date: number) => void;
  setLatitude: (lat: number) => void;
  setViewMode: (mode: ViewMode) => void;
  setTimeOfDay: (time: number) => void;
  setTimeSpeed: (speed: number) => void;
  setIsPaused: (paused: boolean) => void;

  setScaleFactorSun: (scale: number) => void;
  setScaleFactorEarth: (scale: number) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  date: 0, // Start at day 0
  latitude: 39.9, // Default to Beijing latitude (~40 degrees North)
  viewMode: 'solar-system',
  previousViewMode: null,
  timeOfDay: 12, // Noon default

  timeSpeed: 3600, // Default: 1 real sec = 1 sim hour
  isPaused: false,

  scaleFactorSun: 1.0,
  scaleFactorEarth: 1.0,

  setDate: (date) => set({ date }),
  setLatitude: (latitude) => set({ latitude }),
  setViewMode: (viewMode) => set((state) => {
    let newSpeed = state.timeSpeed;
    if (viewMode === 'human' && state.timeSpeed > 30) {
      newSpeed = 30;
    }
    return {
      viewMode,
      previousViewMode: state.viewMode,
      timeSpeed: newSpeed
    };
  }),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  setTimeSpeed: (timeSpeed) => set({ timeSpeed }),
  setIsPaused: (isPaused) => set({ isPaused }),

  setScaleFactorSun: (scaleFactorSun) => set({ scaleFactorSun }),
  setScaleFactorEarth: (scaleFactorEarth) => set({ scaleFactorEarth }),
}));
