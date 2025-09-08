import type { Device } from "./types";

export const CUSTOM_DEVICE_ID = 'custom';

export const DEVICES: Device[] = [
  {
    id: 'ff',
    label: 'Boîtier 24×36 (Full Frame)',
    type: 'camera',
    sensorW: 36, sensorH: 24, aspect: 3/2,
    zooms: [
      { id: '35', label: '35 mm', kind: 'prime', focalMm: 35, projection: 'rectilinear' },
      { id: '50', label: '50 mm', kind: 'prime', focalMm: 50, projection: 'rectilinear' },
      { id: '70-200@70', label: 'Zoom 70–200 @70 mm', kind: 'zoom', focalMm: 70, projection: 'rectilinear' },
    ],
  },
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
];
