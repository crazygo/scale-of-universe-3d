import { create } from 'zustand';
import { ViewMode, UNIVERSE_CONSTANTS } from '../constants/universe';

interface SimulationState {
  // Time state
  date: number;                    // 0-365 days
  timeOfDay: number;               // 0-24 hours
  currentSimulationTime: number;   // Continuous timestamp in milliseconds

  // Location
  latitude: number;                // -90 to 90

  // View
  viewMode: ViewMode;
  previousViewMode: ViewMode | null;

  // Time Control (Time Dilation System)
  timeMultiplier: number;          // Speed factor
  isPaused: boolean;

  // Actions
  setDate: (date: number) => void;
  setTimeOfDay: (time: number) => void;
  setLatitude: (lat: number) => void;
  setViewMode: (mode: ViewMode) => void;
  setTimeMultiplier: (multiplier: number) => void;
  setIsPaused: (paused: boolean) => void;
  updateSimulationTime: (deltaMs: number) => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  // Initial state - Beijing at noon on day 0
  date: 0,
  timeOfDay: 12,
  currentSimulationTime: 0,
  latitude: UNIVERSE_CONSTANTS.BEIJING.LATITUDE,
  viewMode: 'human',
  previousViewMode: null,
  timeMultiplier: UNIVERSE_CONSTANTS.TIME.DEFAULT_MULTIPLIER,
  isPaused: false,

  // Actions
  setDate: (date) => set({ date: date % 365 }),

  setTimeOfDay: (timeOfDay) => set({ timeOfDay: timeOfDay % 24 }),

  setLatitude: (latitude) => set({
    latitude: Math.max(-90, Math.min(90, latitude))
  }),

  setViewMode: (viewMode) => set((state) => ({
    viewMode,
    previousViewMode: state.viewMode,
  })),

  setTimeMultiplier: (timeMultiplier) => set({
    timeMultiplier: Math.max(
      UNIVERSE_CONSTANTS.TIME.MIN_MULTIPLIER,
      Math.min(UNIVERSE_CONSTANTS.TIME.MAX_MULTIPLIER, timeMultiplier)
    )
  }),

  setIsPaused: (isPaused) => set({ isPaused }),

  // Update simulation time based on real time delta
  // Simulation Time Delta = Real Time Delta * Multiplier
  updateSimulationTime: (deltaMs) => {
    const state = get();
    if (state.isPaused) return;

    const simDeltaMs = deltaMs * state.timeMultiplier;
    const newSimTime = state.currentSimulationTime + simDeltaMs;

    // Convert simulation time to date and timeOfDay
    // 1 sim day = 24 * 60 * 60 * 1000 ms = 86400000 ms
    const msPerDay = 86400000;

    const totalDays = newSimTime / msPerDay;
    const newDate = Math.floor(totalDays) % 365;
    const dayFraction = totalDays - Math.floor(totalDays);
    const newTimeOfDay = dayFraction * 24;

    set({
      currentSimulationTime: newSimTime,
      date: newDate,
      timeOfDay: newTimeOfDay,
    });
  },
}));
