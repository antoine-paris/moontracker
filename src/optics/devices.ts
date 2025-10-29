import type { Device } from "./types";

export const CUSTOM_DEVICE_ID = 'custom';

export const DEVICES: Device[] = [
    // Human eye (kept as-is)
  {
    id: 'oeil',
    label: 'Oeuil',
    type: 'phone',
    aspect: 3/2, // champ binoculaire humain ~200°×130° ⇒ ~3:2
    zooms: [
      { id: 'human', label: 'Humain (1×)', kind: 'module', f35: 50 },    // 50mm eq ≈ vision « normale »
      { id: 'eagle', label: 'Aigle (8×)',  kind: 'module', f35: 400 },   // ~8× acuité ⇒ 8× la focale de référence
    ],
  },
  {
    id: 'VM',
    label: 'Vue carrée',
    type: 'camera',
    aspect: 1/1, // champ binoculaire humain ~200°×130° ⇒ ~3:2
    zooms: [
      { id: 'vm173', label: 'fisheye', kind: 'module', f35: 1 },    
    ],
  },
  // Full Frame (24×36) with typical zoom ranges
  {
    id: 'ff',
    label: 'Boîtier 24×36 (Full Frame)',
    type: 'camera',
    sensorW: 36, sensorH: 24, aspect: 3/2,
    zooms: [
      // Primes
      { id: 'ff-fish-15', label: 'Fisheye 15 mm', kind: 'prime', focalMm: 15, projection: 'fisheye' },
      { id: 'ff-35', label: '35 mm', kind: 'prime', focalMm: 35, projection: 'rectilinear' },
      { id: 'ff-50', label: '50 mm', kind: 'prime', focalMm: 50, projection: 'rectilinear' },
      // 14–24
      { id: 'ff-14-24-14', label: 'Zoom 14–24 @ 14 mm', kind: 'zoom', focalMm: 14, projection: 'rectilinear' },
      { id: 'ff-14-24-24', label: 'Zoom 14–24 @ 24 mm', kind: 'zoom', focalMm: 24, projection: 'rectilinear' },
      // 16–35
      { id: 'ff-16-35-16', label: 'Zoom 16–35 @ 16 mm', kind: 'zoom', focalMm: 16, projection: 'rectilinear' },
      { id: 'ff-16-35-35', label: 'Zoom 16–35 @ 35 mm', kind: 'zoom', focalMm: 35, projection: 'rectilinear' },
      // 24–70
      { id: 'ff-24-70-24', label: 'Zoom 24–70 @ 24 mm', kind: 'zoom', focalMm: 24, projection: 'rectilinear' },
      { id: 'ff-24-70-35', label: 'Zoom 24–70 @ 35 mm', kind: 'zoom', focalMm: 35, projection: 'rectilinear' },
      { id: 'ff-24-70-50', label: 'Zoom 24–70 @ 50 mm', kind: 'zoom', focalMm: 50, projection: 'rectilinear' },
      { id: 'ff-24-70-70', label: 'Zoom 24–70 @ 70 mm', kind: 'zoom', focalMm: 70, projection: 'rectilinear' },
      // 24–105
      { id: 'ff-24-105-24', label: 'Zoom 24–105 @ 24 mm', kind: 'zoom', focalMm: 24, projection: 'rectilinear' },
      { id: 'ff-24-105-50', label: 'Zoom 24–105 @ 50 mm', kind: 'zoom', focalMm: 50, projection: 'rectilinear' },
      { id: 'ff-24-105-105', label: 'Zoom 24–105 @ 105 mm', kind: 'zoom', focalMm: 105, projection: 'rectilinear' },
      // 70–200
      { id: 'ff-70-200-70', label: 'Zoom 70–200 @ 70 mm', kind: 'zoom', focalMm: 70, projection: 'rectilinear' },
      { id: 'ff-70-200-135', label: 'Zoom 70–200 @ 135 mm', kind: 'zoom', focalMm: 135, projection: 'rectilinear' },
      { id: 'ff-70-200-200', label: 'Zoom 70–200 @ 200 mm', kind: 'zoom', focalMm: 200, projection: 'rectilinear' },
      // 100–400
      { id: 'ff-100-400-100', label: 'Zoom 100–400 @ 100 mm', kind: 'zoom', focalMm: 100, projection: 'rectilinear' },
      { id: 'ff-100-400-200', label: 'Zoom 100–400 @ 200 mm', kind: 'zoom', focalMm: 200, projection: 'rectilinear' },
      { id: 'ff-100-400-300', label: 'Zoom 100–400 @ 300 mm', kind: 'zoom', focalMm: 300, projection: 'rectilinear' },
      { id: 'ff-100-400-400', label: 'Zoom 100–400 @ 400 mm', kind: 'zoom', focalMm: 400, projection: 'rectilinear' },
      // 200–600
      { id: 'ff-200-600-200', label: 'Zoom 200–600 @ 200 mm', kind: 'zoom', focalMm: 200, projection: 'rectilinear' },
      { id: 'ff-200-600-400', label: 'Zoom 200–600 @ 400 mm', kind: 'zoom', focalMm: 400, projection: 'rectilinear' },
      { id: 'ff-200-600-600', label: 'Zoom 200–600 @ 600 mm', kind: 'zoom', focalMm: 600, projection: 'rectilinear' },
    ],
  },

  // iPhones (older generations)
  {
    id: 'iph8',
    label: 'iPhone 8',
    type: 'phone',
    aspect: 4/3,
    zooms: [
      { id: 'main', label: 'Principal (28 mm eq)', kind: 'module', f35: 28 },
    ],
  },
  {
    id: 'iphX',
    label: 'iPhone X',
    type: 'phone',
    aspect: 4/3,
    zooms: [
      { id: 'wide', label: 'Grand-angle (28 mm eq)', kind: 'module', f35: 28 },
      { id: 'tele', label: 'Télé (56 mm eq)', kind: 'module', f35: 56 },
    ],
  },
  // Existing iPhone 15 Pro
  {
    id: 'iph15pro',
    label: 'iPhone 15 Pro',
    type: 'phone',
    aspect: 4/3,
    zooms: [
      { id: 'uw',   label: 'Ultra grand-angle (13 mm eq)', kind: 'module', f35: 13 },
      { id: 'main', label: 'Principal (24 mm eq)',         kind: 'module', f35: 24 },
      { id: 'tele', label: 'Télé (77 mm eq)',              kind: 'module', f35: 77 },
    ],
  },
  // Samsung phones
  {
    id: 'galaxy-s10',
    label: 'Samsung Galaxy S10',
    type: 'phone',
    aspect: 4/3,
    zooms: [
      { id: 'uw',   label: 'Ultra grand-angle (12 mm eq)', kind: 'module', f35: 12 },
      { id: 'wide', label: 'Grand-angle (26 mm eq)',       kind: 'module', f35: 26 },
      { id: 'tele', label: 'Télé (52 mm eq)',              kind: 'module', f35: 52 },
    ],
  },
  {
    id: 'galaxy-s21u',
    label: 'Samsung Galaxy S21 Ultra',
    type: 'phone',
    aspect: 4/3,
    zooms: [
      { id: 'uw',   label: 'Ultra grand-angle (13 mm eq)', kind: 'module', f35: 13 },
      { id: 'wide', label: 'Grand-angle (24 mm eq)',       kind: 'module', f35: 24 },
      { id: 't3x',  label: 'Télé 3× (72 mm eq)',           kind: 'module', f35: 72 },
      { id: 't10x', label: 'Télé 10× (240 mm eq)',         kind: 'module', f35: 240 },
      { id: 'sd30', label: 'Digital zoom 30x',              kind: 'module', f35: 1560 },
    ],
  },

  // APS-C generic setups (Canon and Sony/Nikon style)
  {
    id: 'aps-c-canon',
    label: 'APS‑C (Canon)',
    type: 'camera',
    sensorW: 22.3, sensorH: 14.9, aspect: 3/2,
    zooms: [
      // Ultra-wide zoom
      { id: '10-18-10', label: 'EF‑S 10–18 @ 10 mm', kind: 'zoom', focalMm: 10, projection: 'rectilinear' },
      { id: '10-18-18', label: 'EF‑S 10–18 @ 18 mm', kind: 'zoom', focalMm: 18, projection: 'rectilinear' },
      // Kit zoom
      { id: '18-55-18', label: 'EF‑S 18–55 @ 18 mm', kind: 'zoom', focalMm: 18, projection: 'rectilinear' },
      { id: '18-55-35', label: 'EF‑S 18–55 @ 35 mm', kind: 'zoom', focalMm: 35, projection: 'rectilinear' },
      { id: '18-55-55', label: 'EF‑S 18–55 @ 55 mm', kind: 'zoom', focalMm: 55, projection: 'rectilinear' },
      // Tele zoom
      { id: '55-250-55', label: 'EF‑S 55–250 @ 55 mm', kind: 'zoom', focalMm: 55, projection: 'rectilinear' },
      { id: '55-250-135', label: 'EF‑S 55–250 @ 135 mm', kind: 'zoom', focalMm: 135, projection: 'rectilinear' },
      { id: '55-250-250', label: 'EF‑S 55–250 @ 250 mm', kind: 'zoom', focalMm: 250, projection: 'rectilinear' },
      // Popular primes
      { id: 'aps-c-24', label: '24 mm', kind: 'prime', focalMm: 24, projection: 'rectilinear' },
      { id: 'aps-c-35', label: '35 mm', kind: 'prime', focalMm: 35, projection: 'rectilinear' },
      { id: 'aps-c-50', label: '50 mm', kind: 'prime', focalMm: 50, projection: 'rectilinear' },
    ],
  },
  {
    id: 'aps-c-sony',
    label: 'APS‑C (Sony/Nikon)',
    type: 'camera',
    sensorW: 23.5, sensorH: 15.6, aspect: 3/2,
    zooms: [
      // Compact kit
      { id: '16-50-16', label: '16–50 @ 16 mm', kind: 'zoom', focalMm: 16, projection: 'rectilinear' },
      { id: '16-50-35', label: '16–50 @ 35 mm', kind: 'zoom', focalMm: 35, projection: 'rectilinear' },
      { id: '16-50-50', label: '16–50 @ 50 mm', kind: 'zoom', focalMm: 50, projection: 'rectilinear' },
      // Travel zoom
      { id: '18-105-18', label: '18–105 @ 18 mm', kind: 'zoom', focalMm: 18, projection: 'rectilinear' },
      { id: '18-105-50', label: '18–105 @ 50 mm', kind: 'zoom', focalMm: 50, projection: 'rectilinear' },
      { id: '18-105-105', label: '18–105 @ 105 mm', kind: 'zoom', focalMm: 105, projection: 'rectilinear' },
      // Tele
      { id: '70-300-70', label: '70–300 @ 70 mm', kind: 'zoom', focalMm: 70, projection: 'rectilinear' },
      { id: '70-300-200', label: '70–300 @ 200 mm', kind: 'zoom', focalMm: 200, projection: 'rectilinear' },
      { id: '70-300-300', label: '70–300 @ 300 mm', kind: 'zoom', focalMm: 300, projection: 'rectilinear' },
      // Popular primes
      { id: 'apsc-35', label: '35 mm', kind: 'prime', focalMm: 35, projection: 'rectilinear' },
      { id: 'apsc-50', label: '50 mm', kind: 'prime', focalMm: 50, projection: 'rectilinear' },
    ],
  },
  {
    id: 'nikon-p1000',
    label: 'Nikon Coolpix P1000',
    type: 'camera',
    sensorW: 6.17, sensorH: 4.55, aspect: 4/3,
    zooms: [
      { id: 'p1000-24eq',   label: 'Zoom @ 24 mm eq',   kind: 'zoom', focalMm: 4.3,   projection: 'rectilinear' },
      { id: 'p1000-50eq',   label: 'Zoom @ 50 mm eq',   kind: 'zoom', focalMm: 8.9,   projection: 'rectilinear' },
      { id: 'p1000-100eq',  label: 'Zoom @ 100 mm eq',  kind: 'zoom', focalMm: 17.9,  projection: 'rectilinear' },
      { id: 'p1000-300eq',  label: 'Zoom @ 300 mm eq',  kind: 'zoom', focalMm: 53.7,  projection: 'rectilinear' },
      { id: 'p1000-1000eq', label: 'Zoom @ 1000 mm eq', kind: 'zoom', focalMm: 179,   projection: 'rectilinear' },
      { id: 'p1000-2000eq', label: 'Zoom @ 2000 mm eq', kind: 'zoom', focalMm: 359,   projection: 'rectilinear' },
      { id: 'p1000-3000eq', label: 'Zoom @ 3000 mm eq', kind: 'zoom', focalMm: 539,   projection: 'rectilinear' },
    ],
  },
  // Astro-oriented: common telescope pairings with typical sensors
  {
    id: 'astro-aps-c',
    label: 'Astrocam APS‑C (23.5×15.6 mm)',
    type: 'camera',
    sensorW: 23.5, sensorH: 15.6, aspect: 3/2,
    zooms: [
      { id: 'samyang-135', label: 'Samyang 135 mm', kind: 'module', focalMm: 135 },
      { id: 'tele-200', label: 'Télé 200 mm', kind: 'module', focalMm: 200 },
      { id: 'newton-150-750', label: 'Newton 150/750 (750 mm)', kind: 'module', focalMm: 750 },
      { id: 'ed80-600', label: 'Lunette ED 80/600 (600 mm)', kind: 'module', focalMm: 600 },
      { id: 'dob-200-1200', label: 'Dobson 200/1200 (1200 mm)', kind: 'module', focalMm: 1200 },
      { id: 'mak-127-1540', label: 'Maksutov 127/1540 (1540 mm)', kind: 'module', focalMm: 1540 },
      { id: 'sct-8-2032', label: 'SCT 8" (2032 mm)', kind: 'module', focalMm: 2032 },
      { id: 'sct-8-0p63', label: 'SCT 8" + réducteur 0,63× (1280 mm)', kind: 'module', focalMm: 1280 },
    ],
  },
  {
    id: 'astro-1inch',
    label: 'Astrocam 1" (13.2×8.8 mm, IMX183/IMX477)',
    type: 'camera',
    sensorW: 13.2, sensorH: 8.8, aspect: 3/2,
    zooms: [
      { id: 'lens-135', label: 'Objectif 135 mm', kind: 'module', focalMm: 135 },
      { id: 'lens-200', label: 'Objectif 200 mm', kind: 'module', focalMm: 200 },
      { id: 'ed72-420', label: 'Lunette ED 72/420 (420 mm)', kind: 'module', focalMm: 420 },
      { id: 'ed80-600-1in', label: 'Lunette ED 80/600 (600 mm)', kind: 'module', focalMm: 600 },
      { id: 'newton-130-650', label: 'Newton 130/650 (650 mm)', kind: 'module', focalMm: 650 },
      { id: 'mak-102-1300', label: 'Maksutov 102/1300 (1300 mm)', kind: 'module', focalMm: 1300 },
      { id: 'sct-6-1500', label: 'SCT 6" (1500 mm)', kind: 'module', focalMm: 1500 },
    ],
  },
  


];