# Geographic Scrollytelling Implementation

This document outlines the technical architecture and implementation details of the interactive mapping system used in the Explainer platform.

## 1. Technology Stack

The map feature is built using a modern, reactive mapping stack:
- **[react-simple-maps](https://www.react-simple-maps.io/)**: A declarative wrapper for D3-geo that handles SVG projection and path rendering.
- **[framer-motion](https://www.framer.com/motion/)**: Powers the cinematic "Fly-To" animations using physics-based springs.
- **[react-scrollama](https://github.com/jsonkao/react-scrollama)**: Manages the scroll-triggered state transitions (Scrollytelling).
- **[Highcharts Map Collection](https://code.highcharts.com/mapdata/)**: Provides the web-optimized TopoJSON data for the African continent.

## 2. Data Architecture

### Geographic Data Source
We use a high-fidelity TopoJSON file for Africa:
`https://cdn.jsdelivr.net/npm/@highcharts/map-collection/custom/africa.topo.json`

### Step Schema
Each "Scrolly Step" in the database is defined by a JSON object:
```json
{
  "type": "map",
  "center": [3.37, 6.52], // [Longitude, Latitude]
  "zoom": 12,             // Zoom level (1-20)
  "highlight": "Nigeria", // Country name or ID to highlight
  "label": "Lagos Port",  // HUD Label text
  "text": "..."           // Scrolling copy
}
```

## 3. High-Performance Animations

### Physics-Based "Fly-To"
Instead of simple CSS transitions, we use **Framer Motion Springs**. This creates a natural "gliding" effect as the map pans across the globe.

```javascript
const springConfig = { damping: 20, stiffness: 100, mass: 1 };
const smoothLon = useSpring(useMotionValue(center[0]), springConfig);
const smoothLat = useSpring(useMotionValue(center[1]), springConfig);
const smoothZ = useSpring(useMotionValue(zoom), springConfig);
```

### Motion Geographies
The individual country paths are wrapped in a `MotionGeography` component. This allows the `fill` color to transition smoothly when a country is highlighted, without re-rendering the entire map SVG.

## 4. Component Structure

### `AnimatedMap.jsx`
- Responsible for the sticky visual layer.
- Uses `geoMercator` projection for high coordinate accuracy.
- Listens for prop changes (`center`, `zoom`) and updates the spring motion values.

### `ScrollyIsland.jsx`
- The parent container that orchestrates the relationship between the **sticky background** (Map/Chart) and the **foreground text**.
- Maintains the `currentStepIndex` state provided by Scrollama.

## 5. Integration with Story Editor

The `StoryEditor.jsx` component provides a real-time interface for journalists to:
1. Select the `map` type for a scrolly section.
2. Input standard coordinates (e.g., `3.4, 6.4` for Lagos).
3. Live preview the transition immediately in the admin dashboard.

---
*Created for the Explainer Visual Journalism Platform.*
