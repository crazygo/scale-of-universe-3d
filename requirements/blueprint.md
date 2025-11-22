# Scale of Universe 3D - Technical Blueprint

## 1. Project Goal

Build a **single, continuous 3D universe scene** that seamlessly integrates three scales of observation:
- **Human Scale** (Microscopic): Standing on Earth's surface in Beijing
- **Solar System Scale** (Mesoscopic): Observing Earth's orbit around the Sun
- **Galactic Scale** (Macroscopic): Viewing the Milky Way Galaxy with our Solar System as a point within it

**Core Challenge**: Represent these vastly different scales within a unified coordinate system while maintaining accurate astronomical relationships and enabling smooth, continuous camera transitions between perspectives.

## 2. Core Architecture Requirements

### 2.1 Single Scene Constraint
- **CRITICAL**: The entire universe must exist in a single Three.js scene. 
- **FORBIDDEN**: Conditional rendering of separate "view components" or multiple Canvas instances.
- **REQUIREMENT**: All celestial bodies (Sun, Earth, Galaxy) must be instantiated once and remain persistent throughout the application lifecycle.

### 2.2 Unified Coordinate System
The coordinate system follows Three.js conventions (Y-up, right-handed):

```
Origin (0, 0, 0): Sun (Solar System Center)
Earth Position: Orbital radius ~10 units, dynamic based on date
Galaxy Center: Offset at (-25, 0, 0) relative to Sun
```

**Spatial Relationships**:
- The Sun is the local origin.
- Earth orbits in the XZ plane around the Sun.
- The Milky Way Galaxy is positioned such that the Solar System appears approximately 2/3 out from the Galactic Center.

### 2.3 Continuous Camera Navigation
- **Mechanism**: View transitions are achieved **solely** through camera movement (position and target).
- **Implementation**: Use `CameraControls` or similar smooth interpolation.
- **Animation**: Camera should smoothly fly from one perspective to another, allowing the user to observe the continuous nature of the universe.

**View Presets**:
1. **Human View**: Camera positioned ~0.2 units above Beijing's surface, following Earth's rotation.
2. **Solar System View**: Camera at (0, 20, 20), looking at origin, showing Earth's orbit.
3. **Galactic View**: Camera at (-25, 60, 80), looking at Galaxy Center, showing spiral structure.

## 3. Astronomical Dynamics

### 3.1 Earth Motion

#### 3.1.1 Rotation (Daily)
- **Input**: `timeOfDay` (0-24 hours)
- **Effect**: Earth spins on its own axis
- **Calibration**: At 12:00 (noon UTC+8), Beijing (116.4°E, 39.9°N) must face directly toward the Sun
- **Implementation**: Apply rotation to Earth's Y-axis, accounting for Beijing's longitude offset

#### 3.1.2 Revolution (Yearly)
- **Input**: `date` (0-365 days)
- **Effect**: Earth's position along its orbital path around the Sun
- **Physics**: 
  - **Elliptical Orbit**: Must use an elliptical path (eccentricity > 0) rather than a perfect circle.
  - **Orbital Speed**: (Optional) Vary speed based on distance from Sun (Kepler's 2nd Law approximation).
  - **Scale**: Use a defined scale ratio (e.g., 1 unit = 1 million km) to maintain relative proportions, even if simplified for visualization.

#### 3.1.3 Axial Tilt
- **Value**: 23.5 degrees
- **Axis**: Tilt applied to Earth's rotation axis (Z-axis tilt)
- **Purpose**: Simulates seasons and affects the apparent path of the Sun across the sky

### 3.2 Relative Positioning
- **Galaxy-Sun Distance**: Approximately 25 units (configurable via `UNIVERSE_CONSTANTS.GALAXY.SOLAR_SYSTEM_DISTANCE`)
- **Earth-Sun Distance**: Approximately 10 units (orbital radius)
- **Beijing-Earth Center**: Earth's radius (~1 unit), calculated using spherical coordinates

## 4. Interaction & Controls

### 4.1 Time Control
- **UI Elements**: 
  - Time Slider (0-24h)
  - **Simulation Speed Slider**: Multiplier control (e.g., 1x, 60x, 1000x).
  - **Play/Pause Button**: Toggle automatic time progression.
- **State**: `timeOfDay`, `isPlaying`, `simulationSpeed`
- **Physics**:
  - **Time Dilation**: Default multiplier should be **60x** (1 second real time = 1 minute simulation time).
  - **Continuous Loop**: Time should wrap around 24h -> 0h automatically.
- **Effect**: 
  - Updates Earth's rotation angle continuously.
  - In Human View, sky and celestial bodies move dynamically (Sunrise/Sunset).

### 4.2 Date Control
- **UI Element**: Month selector (1-12) or date slider (0-365)
- **State**: `date` in global store
- **Effect**:
  - Updates Earth's orbital position
  - Changes seasonal tilt effect in Human View

### 4.3 View Mode Switching
- **UI Element**: Buttons or dropdown with options: `human`, `solar-system`, `galactic`
- **State**: `viewMode` in global store
- **Effect**: Triggers camera animation to the corresponding preset position

### 4.4 Camera Controls
- **In Solar/Galactic Views**: Free orbit controls enabled (user can rotate, zoom)
- **In Human View**: Limited controls (can look up/down, but camera follows Earth's surface)

## 5. Visual Standards

### 5.1 Color Identity
Consistent color scheme across all scales for instant recognition:

| Celestial Body | Color | Hex Code | Purpose |
|----------------|-------|----------|---------|
| Sun | Red | `#ff0000` | Distinguishes from typical yellow depictions |
| Earth | Blue | `#2244ff` | Standard Earth representation |
| Galactic Center | Purple | `#9900ff` | Differentiates from Sun |
| Milky Way Band | Gray | `#666666` | Subtle background |

### 5.2 Label System
- **Technology**: Billboard component (always faces camera)
- **Labels Required**:
  - "Sun" (at Sun's position)
  - "Earth's Orbit" (along orbital path)
  - "Galactic Center" (at Galaxy center)
  - "Beijing" (on Earth's surface)
  - Cardinal Directions (N, S, E, W) in Human View
  
### 5.3 Markers
- **Beijing Marker**: Small red sphere (radius ~0.05) on Earth's surface at (116.4°E, 39.9°N)
- **Solar System Marker**: Highlighted point in Galactic View showing Sun's location within the galaxy
- **Orbit Visualization**: Semi-transparent ring showing Earth's orbital path

## 6. Technical Stack

### 6.1 Required Technologies
- **Framework**: React 18+
- **3D Engine**: Three.js via `@react-three/fiber`
- **Helpers**: `@react-three/drei` (for Billboard, Stars, Text, CameraControls)
- **State Management**: Zustand
- **UI Controls**: Leva (dev panel)
- **Build Tool**: Vite

## 7. Implementation Details

### 7.1 Unified Constants System
To ensure visual and logical consistency, a single source of truth (`UNIVERSE_CONSTANTS`) must govern all physical properties:

```typescript
UNIVERSE_CONSTANTS = {
  SUN: {
    COLOR: '#ff0000',
    EMISSIVE: '#ff0000',
    EMISSIVE_INTENSITY: 2,
    RADIUS_SOLAR_VIEW: 2
  },
  EARTH: {
    COLOR: '#2244ff',
    RADIUS: 1,
    ORBIT_RADIUS: 10
  },
  GALAXY: {
    CENTER_COLOR: '#9900ff',
    OUTER_COLOR: '#1b3984',
    PARTICLE_COUNT: 8000,
    RADIUS: 50,
    SOLAR_SYSTEM_DISTANCE: 25
  }
}
```

### 7.2 View-Specific Features

#### Human View (Ground Level)
- **Camera Anchor**: 
  - **Center**: Camera must be anchored to the Beijing marker on Earth's surface.
  - **Rotation**: Camera rotates *with* the Earth. Looking "Out" means facing South/North relative to the ground.
  - **Experience**: User should observe the Sun rising in the East and setting in the West as time progresses.
- **Spatial Reference**:
  - **3D Grid System**: A visible 3D grid or coordinate sphere centered on the observer to define "Local Space" (East/West/North/South/Zenith).
  - **Ground Plane**: Visual reference for the horizon.
- **Sky Elements**:
  - **Ecliptic path** visualization.
  - **Milky Way band**.
  - **Night View indicator**.

#### Solar System View (Orbital)
- **Earth's orbit ring** as a semi-transparent guide
- **Axial tilt visualization** showing Earth's 23.5° angle
- **Beijing marker** as a red dot on Earth's surface
- **Coordinate axes** for orientation reference
- **Sun label** with billboard text

#### Galactic View (Macro)
- **Full spiral galaxy** particle system
- **Solar System marker** showing Sun's position in the galaxy
- **Galactic Center label** with distinct purple color
- **Camera positioned** to show galaxy structure clearly

### 7.3 Astronomical Mapping
Coordinate system conventions:
- **World Space**: Three.js standard (Y-up, right-handed)
- **North**: +Z direction in Human View
- **South**: -Z direction
- **East/West**: +X/-X directions
- **Zenith**: +Y (skyward)

### 7.4 State Management
Global state store must include:
```typescript
{
  date: number,           // 0-365 days
  timeOfDay: number,      // 0-24 hours
  latitude: number,       // -90 to 90 (default: 39.9 for Beijing)
  viewMode: 'human' | 'solar-system' | 'galactic',
  previousViewMode: ViewMode | null  // For transition effects
}
```
