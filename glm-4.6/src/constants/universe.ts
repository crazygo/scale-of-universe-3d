/**
 * Universe Constants - Single source of truth for all physical properties
 * Based on blueprint.md specifications
 */
export const UNIVERSE_CONSTANTS = {
  SUN: {
    COLOR: '#ff0000',           // Red as specified
    EMISSIVE: '#ff0000',
    EMISSIVE_INTENSITY: 2,
    RADIUS_SOLAR_VIEW: 2,
    RADIUS_HUMAN_VIEW: 4,       // Visual size in sky
  },
  EARTH: {
    COLOR: '#2244ff',           // Blue
    RADIUS: 1,
    ORBIT_RADIUS: 10,
    AXIAL_TILT: 23.5,           // degrees
    ECCENTRICITY: 0.0167,       // Elliptical orbit eccentricity
  },
  GALAXY: {
    CENTER_COLOR: '#9900ff',    // Purple
    OUTER_COLOR: '#1b3984',
    PARTICLE_COUNT: 8000,
    RADIUS: 50,
    SOLAR_SYSTEM_DISTANCE: 25,  // Distance from galactic center
  },
  STARS: {
    COUNT: 5000,
    RADIUS: 200,
  },
  BEIJING: {
    LATITUDE: 39.9,
    LONGITUDE: 116.4,
  },
  // Camera presets for each view mode
  CAMERA_PRESETS: {
    HUMAN: {
      // Camera positioned above Beijing's surface
      height: 0.2,  // units above surface
    },
    SOLAR_SYSTEM: {
      position: [0, 20, 20] as const,
      target: [0, 0, 0] as const,
    },
    GALACTIC: {
      position: [-25, 60, 80] as const,
      target: [-25, 0, 0] as const,
    },
  },
  // Time system defaults
  TIME: {
    DEFAULT_MULTIPLIER: 60,     // 1 real second = 1 sim minute
    MIN_MULTIPLIER: 0,
    MAX_MULTIPLIER: 10000,
  },
};

export type ViewMode = 'human' | 'solar-system' | 'galactic';
