![Preview](preview.jpg)
![Preview 2](preview2.jpg)

# SpaceView.me - 
 
Interactive web app to visualize the sky: Moon and Sun phases/orientations, stars, and planets in real time from any location. Built with React, TypeScript, Vite, Tailwind, astronomy-engine, and three.js.

- Precise topocentric positions and apparent sizes
- Multiple wide‑to‑narrow projection modes
- Optional atmospheric refraction
- Stars canvas (DPR-aware, rAF-throttled)
- 3D rendering for Moon and planets (with “readiness” gating)
- Long‑pose/timelapse compositor
- Photo frame and optics/FOV simulation
- Shareable URL state, PNG capture, and WebM video recording

## Overview

SpaceView.me computes Sun/Moon/planet positions, accounts for apparent sizes and orientations (bright limb and sprite rotations), and renders a sky stage with several projections. Time is driven by a single UTC timestamp to avoid DST pitfalls; the UI shows local time for the selected location.

## Features

- Stars
  - High‑performance 2D canvas with device‑pixel‑ratio scaling and rAF throttling
  - Optional atmospheric refraction for star altitudes
  - Angular culling vs camera FOV, projection‑aware screen mapping
  - Southern Cross (Crux) centroid computation for markers
- Moon & Sun
  - Topocentric alt/az, apparent diameters, bright limb, phase fraction
  - Libration (geo/topo) when available
  - Sprite orientation corrected for local vertical in the current projection
  - Optional earthshine rendering
- Planets
  - Ephemerides with per‑planet visibility toggles
  - Adaptive rendering (dot/sprite/3D) with size‑based threshold
  - Orientation vs horizon and phase masks for sprites; 3D models when large enough
  - First‑frame 3D “readiness” gating to avoid UI flashes
- Projections
  - Recti‑Panini (rectilinear blended for ultra‑wide)
  - Rectilinear (perspective)
  - Stereographic centered
  - Orthographic (all‑sky context)
  - Cylindrical and Cylindrical‑horizon
  - Auto‑pick keeps current mode if still valid after FOV/viewport changes
- Refraction
  - Global toggle; affects stars and body projections
  - Unrefracted values used when disabled
- Long‑pose compositor
  - Accumulates trails on a single overlay canvas
  - Works in timelapse (ACK per step) and continuous “smooth” modes
  - Stars use additive blending; Sun/Moon/planets get configurable fill/outline gains
  - 3D canvases explicitly excluded from accumulation
  - Manual clear from the UI
- Timelapse
  - Cadence (ms) and step units: minute, hour, day, sidereal‑day, month, synodic‑fraction (lunar day), lunar‑fraction (sidereal cycle)
  - Optional loop after N frames; prev/next frame buttons
- Optics & photo frame
  - Devices/modules with sensor sizes and focal lengths (or 35mm eq)
  - Custom “focal” slider (maps to FOV); link FOV X/Y to viewport aspect
  - Cropped viewport and masks to simulate camera frame
  - “Enlarge objects” option for visibility at wide FOVs
- Locations
  - Cities loaded from CSV (min population) with an advanced search index (exact/prefix/substring scoring + tie‑breakers)
  - “Nearest city” hint for custom coordinates; arrow‑key navigation by 100 km
  - Sidebar 3D Earth viewer, draggable to adjust longitude; city marker + direction arrow toward active az/alt
- URL & export
  - Full state parsed/built into shareable URLs (location, time, view, toggles, device/FOV, planets, timelapse/long‑pose)
  - PNG capture of the current render stack
  - WebM video recording of the render area

## Quick start

Requirements: Node.js ≥ 18, npm ≥ 9.

```sh
npm install
npm run dev
# open the shown URL (typically http://localhost:5173)
```

Build and preview:

```sh
npm run build
npm run preview
```

## Scripts

- dev: vite
- build: tsc -b && vite build
- preview: vite preview
- lint: eslint .

## Tech stack

- React 19, TypeScript 5
- Vite 7, @vitejs/plugin-react
- Tailwind 4 (via @tailwindcss/vite)
- three.js + @react-three/fiber + drei (3D Moon/planets)
- astronomy-engine (ephemerides)
- html-to-image (PNG export)

## Project map (notable files)

- src/App.tsx
  - App state, animation engines (smooth and timelapse), URL state, panels, device/FOV, long‑pose control, share URL, PNG export
- src/components/layout/SpaceView.tsx
  - Stage compositor: projections, stars, Sun/Moon sprites, 3D Moon/planets, atmosphere, grid, horizon, ecliptic, markers
  - Long‑pose overlay and trails accumulation (2D only)
  - 3D “readiness” gating (Moon and per‑planet)
- src/components/stage/Stars.tsx
  - rAF‑throttled canvas, DPR scaling, refraction, FOV culling, Crux centroid
- src/components/layout/TopBar.tsx
  - Follow modes, device/zoom/FOV controls (focal slider), projections, visibility toggles, timelapse, long‑pose
- src/components/layout/TopRightBar.tsx
  - Panels toggle, share link copy, PNG export, video recording
- src/components/layout/SidebarLocations.tsx
  - Collapsible sidebar with 3D Earth viewer (drag longitude), tabs for cities/coordinates
- src/components/layout/SidebarLocationsCities.tsx / SidebarLocationsCoord.tsx
  - Cities with advanced search; coordinates editor with nearest‑city hint and 100 km arrow keys
- src/data/locations.ts
  - Types and advanced search index (token/prefix/substring scoring; population tie‑breakers)
- src/render/*
  - Projection/orientation/HUD rendering helpers
- src/utils/*
  - refraction, urlState, capture, geo/math/format/tz helpers

## Controls & tips

- Follow modes: Sun, Moon, planets, or fixed cardinals (N/E/S/O)
- Time: play/pause; slider with ±360 min/s; “Temps réel” 1 s/s; timelapse per‑frame step and cadence with prev/next
- Projections: choose any valid mode for the current FOV/viewport; auto‑switch keeps a valid mode
- Long‑pose: enable to accumulate trails; clear persistence with the “clear” button; additive stars
- Stars: enable/disable; a short “burst” composite is triggered after enabling in long‑pose
- Locations: drag Earth to tweak longitude; coordinates tab supports arrow keys (100 km steps, polar caps handled)
- Camera frame: device/module sets FOV from sensor and focal or 35mm eq; “Custom” uses the focal slider

## Acknowledgments

- Astronomy Engine — precise astronomical computations.
- NASA textures/models where applicable for the Moon/planets.

## License

MIT License.

