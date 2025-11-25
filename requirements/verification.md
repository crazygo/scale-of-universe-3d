# Earth Rotation & Attitude Verification

## Physical Parameters Check

| Parameter | Real World Value | Simulation Implementation | Status |
| :--- | :--- | :--- | :--- |
| **Axial Tilt (Obliquity)** | ~23.44° | 23.5° | ✅ Accurate |
| **Tilt Direction** | Points to Polaris (Fixed) | Fixed in World Space (Points to -X, +Y) | ✅ Accurate |
| **Rotation Axis** | Tilted Axis | Rotates around the tilted Y-axis | ✅ Accurate |
| **Rotation Direction** | Counter-Clockwise (Eastward) | Positive Y Rotation (CCW) | ✅ Accurate |
| **Equator Plane** | Tilted 23.44° to Ecliptic | Tilted 23.5° to World XZ Plane | ✅ Accurate |

## Season & Orbit Alignment

*   **Perihelion (Closest to Sun)**: ~Jan 3.
    *   **Sim**: Aligned to Jan 3 (Day 3).
*   **Winter Solstice (N. Hemisphere)**: ~Dec 21.
    *   **Real Physics**: North Pole points *away* from Sun.
    *   **Sim**: Earth is at `-X` (approx). Sun is at `+X` direction. North Pole points towards `-X` (Away from Sun).
    *   **Result**: **Winter is correctly modeled.**
*   **Summer Solstice (N. Hemisphere)**: ~Jun 21.
    *   **Real Physics**: North Pole points *towards* Sun.
    *   **Sim**: Earth is at `+X`. Sun is at `-X` direction. North Pole points towards `-X` (Towards Sun).
    *   **Result**: **Summer is correctly modeled.**

## Rotation Logic

*   **Method**: Solar Time Sync.
*   **Logic**: `Rotation = SunAngle - BeijingLon + TimeOffset`.
*   **Effect**: Ensures that at 12:00 PM (Sim Time), the Sun is directly overhead for the observer longitude. This simplifies the user experience compared to strictly simulating Sidereal Time (where 12:00 would drift relative to the Sun over the year).

## Conclusion

The Earth's physical attitude, including its axial tilt, fixed axis orientation, and orbital alignment with seasons, is **physically correct** within the simulation.
