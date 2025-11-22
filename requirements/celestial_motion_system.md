# Celestial Motion System Requirements

## 1. Physical Motion Model
The system must drive celestial bodies using physical laws rather than simple static animations.

### 1.1 Orbital Mechanics
- **Earth's Orbit**: Must be modeled as an **elliptical orbit** (Keplerian motion), not a perfect circle.
  - **Perihelion/Aphelion**: Earth should be closer to the Sun in January and farther in July.
  - **Variable Speed**: Earth should move faster when closer to the Sun (Kepler's Second Law), though a simplified constant speed is acceptable if visual smoothness is prioritized.
- **Scale**:
  - **Distance Scale**: Realistic (scaled) distances between Sun and Earth.
  - **Size Scale**: Relative sizes of Sun and Earth (can use a different scale factor than distance to ensure visibility, i.e., "Logarithmic" or "Visual" scale).

### 1.2 Rotation
- **Earth Rotation**: Continuous rotation around its tilted axis (23.5°).
- **Period**: One full rotation every 24 simulation hours.

## 2. Time System (Clock & Multiplier)
The simulation is driven by a "Simulation Clock" that advances based on real-time passage multiplied by a speed factor.

### 2.1 Time Dilation
- **Concept**: `Simulation Time Delta = Real Time Delta * Multiplier`
- **Default Rate**: 1 second (Real) = 1 minute (Sim). Multiplier = 60x.
- **UI Control**:
  - A slider or input to adjust the **Time Multiplier**.
  - Range: Support from 0x (Paused) to high speeds (e.g., 10,000x for observing seasons).

### 2.2 Clock State
- The system must maintain a continuous `currentSimulationTime` timestamp.
- UI should display the current Date and Time derived from this timestamp.

## 3. Camera Anchoring & Reference Frame (Human View)

### 3.1 Camera Anchor
- **Target**: When in "Human View" (View 1), the camera is anchored to the **Beijing Landmark** on the surface of the rotating Earth.
- **Rotation**: The camera position rotates *with* the Earth.
- **Look Direction**: The camera looks outward from the surface.
  - **Sunrise/Sunset**: As Earth rotates, the Sun (stationary at origin) must visually rise in the East and set in the West relative to the camera's frame.

### 3.2 Spatial Reference (3D Grid)
- **Problem**: In deep space/on a sphere, "East" is hard to distinguish without reference.
- **Requirement**: Render a **3D Grid / Coordinate System** centered on the Earth or the Observer.
  - **Local Grid**: A grid tangent to the surface at the observer's location.
  - **Cardinal Markers**: Visual indicators for North, South, East, West fixed to this local grid.
- **Purpose**: To provide a clear "Ground Truth" for orientation, ensuring the user knows which way they are facing when observing celestial motion.
