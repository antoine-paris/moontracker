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
];
