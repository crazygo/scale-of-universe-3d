export const UNIVERSE_CONSTANTS = {
    SCALE_FACTOR_SUN: 1.0, // New constant
    SCALE_FACTOR_EARTH: 1.0, // New constant
    SUN: {
        COLOR: '#ff0000', // Red as requested
        EMISSIVE: '#ff0000',
        EMISSIVE_INTENSITY: 2,
        RADIUS_SOLAR_VIEW: 2,
        RADIUS_HUMAN_VIEW: 4, // Visual size in sky
    },
    EARTH: {
        COLOR: '#2244ff',
        RADIUS: 0.5,
        ORBIT_RADIUS: 10,
    },
    GALAXY: {
        CENTER_COLOR: '#9900ff', // Purple/Magenta to distinguish from Sun
        OUTER_COLOR: '#1b3984',
        PARTICLE_COUNT: 8000, // Increased for better density
        RADIUS: 50,
        SOLAR_SYSTEM_DISTANCE: 25, // Distance of Sun from Galactic Center
    },
    STARS: {
        COUNT: 5000,
        RADIUS: 200,
    }
};
