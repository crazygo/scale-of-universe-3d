import { create } from 'zustand';

export type ViewMode = 'human' | 'solar-system' | 'galactic';

interface SimulationState {
  date: number; // 0 to 365 (Day of year)
  timeOfDay: number; // 0 to 24 (Hour of day)
  latitude: number; // -90 to 90
  viewMode: ViewMode;
  previousViewMode: ViewMode | null;

  setDate: (date: number) => void;
  setLatitude: (lat: number) => void;
  setViewMode: (mode: ViewMode) => void;
  setTimeOfDay: (time: number) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  date: 0, // Start at day 0
  latitude: 39.9, // Default to Beijing latitude (~40 degrees North)
  viewMode: 'human',
  previousViewMode: null,
  timeOfDay: 12, // Noon default

  setDate: (date) => set({ date }),
  setLatitude: (latitude) => set({ latitude }),
  setViewMode: (viewMode) => set((state) => ({
    viewMode,
    previousViewMode: state.viewMode
  })),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
}));
