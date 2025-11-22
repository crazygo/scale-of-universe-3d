# Unified Universe Visualization - Project Requirements

## 1. Project Overview
The goal is to create a cohesive, interactive 3D visualization of the Universe, spanning from the human perspective on Earth to the macro scale of the Milky Way Galaxy. The system emphasizes visual consistency, accurate (simplified) astronomical dynamics, and intuitive user controls to demonstrate the interconnectedness of celestial phenomena.

## 2. Astronomical Model

### 2.1 The Milky Way Galaxy
*   **Structure**: Visualized as a particle-based spiral galaxy.
*   **Visual Identity**:
    *   **Galactic Center**: Represented by a **Purple/Magenta** core to clearly distinguish it from the Sun.
    *   **Milky Way Band**: Visible from Earth as a dense band of stars/particles crossing the sky.
*   **Scale**: The Galaxy is the "container" of the Solar System. The Solar System is positioned at a specific distance from the Galactic Center (approx. 2/3rds out).

### 2.2 The Solar System
*   **Sun**:
    *   **Role**: The central anchor of the local system.
    *   **Visual Identity**: **Red** sphere (emissive), consistent across all views.
    *   **Position**: Center (0,0,0) in Solar System View; positioned on the Ecliptic path in Human View.
*   **Earth**:
    *   **Role**: The observer's home and the subject of dynamic simulation.
    *   **Visual Identity**: Blue sphere with a distinct "Night View" indicator.
    *   **Dynamics**:
        *   **Orbit**: Revolves around the Sun once per "Year" (controlled by Month/Date).
        *   **Rotation**: Rotates on its axis once per "Day" (controlled by Time of Day).
        *   **Axial Tilt**: Tilted **23.5 degrees** relative to the orbital plane, creating seasons.

### 2.3 Location & Time
*   **Observer Location**: **Beijing** (approx. 40°N, 116°E).
*   **Timezone**: **UTC+8**.
    *   **Calibration**: At **12:00 (Noon)**, the Sun is positioned at the Meridian (South) in Human View, and Beijing faces the Sun in Solar System View.
    *   **Cycle**: 0-24h cycle simulates a full day/night rotation.

## 3. Space Construction Strategy

### 3.1 Unified Constant System
To ensure visual and logical consistency, a single source of truth (`UNIVERSE_CONSTANTS`) governs all physical properties:
*   **Colors**: Sun (Red), Galactic Center (Purple), Earth (Blue).
*   **Sizes**: Relative radii of celestial bodies.
*   **Distances**: Orbital radii and galactic offsets.
*   **Particle Counts**: Star and galaxy density.

### 3.2 Multi-View Architecture
The application provides three interconnected perspectives, all sharing the same underlying model state:

1.  **Human View (Ground Level)**
    *   **Perspective**: First-person view from Beijing, Earth.
    *   **Constraints**: Camera locked facing **North** (+Z) to provide a stable reference frame.
    *   **Features**:
        *   Ground plane with Cardinal Directions (N, S, E, W).
        *   Sky dome rotating based on Time and Date.
        *   Visible Ecliptic path and Milky Way band.
        *   **Billboarding**: All text labels always face the camera for readability.

2.  **Solar System View (Orbital)**
    *   **Perspective**: Third-person view overlooking the Sun-Earth system.
    *   **Features**:
        *   Visualizes Earth's orbit ring.
        *   Shows Earth's axial tilt and daily rotation.
        *   **Beijing Marker**: A red dot on Earth showing the specific location of the observer.
        *   **Coordinate System**: Local axes indicating orientation.

3.  **Galactic View (Macro)**
    *   **Perspective**: Distant view of the entire Milky Way.
    *   **Features**:
        *   Full spiral galaxy visualization.
        *   **Solar System Marker**: A highlighted location showing where our Sun resides within the galaxy.

### 3.3 Coordinate Systems
*   **World Space**: Three.js Standard (Y-up).
*   **Astronomical Mapping**:
    *   **North**: Mapped to **+Z** in Human View.
    *   **South**: Mapped to **-Z**.
    *   **East/West**: Mapped to **+X/-X**.
    *   **Zenith**: **+Y**.

## 4. Interaction & Debugging Strategy

### 4.1 Control Parameters (Input)
User interaction is driven by a centralized control panel (Leva) and UI sliders:
*   **Month (1-12)**: Controls the `date` state.
    *   *Effect*: Moves Earth along its orbit; shifts the background stars/galaxy in Human View (Sidereal motion).
*   **Time (0-24h)**: Controls the `timeOfDay` state.
    *   *Effect*: Spins Earth on its axis; rotates the sky in Human View (Diurnal motion).
*   **Latitude**: Adjustable (default to Beijing) to see how sky perspective changes.

### 4.2 Visual Feedback (Output)
*   **Legend**: A persistent UI element explaining color codes (Sun=Red, Galaxy=Purple, etc.).
*   **Labels**: 3D text labels (Billboarded) identify key objects (North Star, Big Dipper, Ecliptic).
*   **Markers**: Visual cues for "Night View" direction and specific geographic locations (Beijing).

### 4.3 Debugging Strategy
*   **Isolation**: Each view can be debugged independently while sharing the same state.
*   **Visual Verification**:
    *   *Noon Test*: Set Time to 12.0 -> Verify Sun is South (Human) / Beijing faces Sun (Solar).
    *   *Midnight Test*: Set Time to 0.0 -> Verify Sun is hidden/North (Human) / Beijing faces away (Solar).
    *   *Color Consistency*: Verify Sun is Red and Galaxy Center is Purple in all views.
