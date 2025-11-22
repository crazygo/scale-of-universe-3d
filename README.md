# Scale of Universe 3D

A unified, interactive 3D visualization of the Universe, spanning from the human perspective on Earth to the macro scale of the Milky Way Galaxy.

## Features

*   **Unified Continuous Universe**: Seamlessly zoom from a human standing in Beijing to the edge of the Milky Way.
*   **Accurate Astronomical Models**:
    *   **Earth**: Correct axial tilt (23.5°), daily rotation, and yearly orbit.
    *   **Time**: Real-time simulation of day/night cycles and seasonal changes based on Date and Time.
    *   **Location**: Calibrated for Beijing (UTC+8), with accurate sun positioning (South at Noon).
*   **Interactive Controls**:
    *   Time of Day (0-24h)
    *   Month/Season (1-12)
    *   View Switching (Human, Solar System, Galactic)

## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Start the development server:
    ```bash
    npm run dev
    ```

## Controls

*   **Left Click + Drag**: Rotate camera (Orbit)
*   **Scroll**: Zoom in/out
*   **UI Panel**: Adjust Time, Month, and View Mode.

## Tech Stack

*   React
*   Three.js (@react-three/fiber)
*   Vite
*   TypeScript
