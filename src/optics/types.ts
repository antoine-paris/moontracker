export type ZoomModule = {
  id: string;
  label: string;
  kind: 'prime' | 'zoom' | 'module';
  focalMm?: number; // objectifs (rectilinéaire)
  f35?: number;     // équivalent 35 mm (smartphones)
  projection?: 'rectilinear' | 'fisheye';
};

export type Device = {
  id: string;
  label: string;
  type: 'camera' | 'phone';
  sensorW?: number; // mm (appareils photo)
  sensorH?: number; // mm (appareils photo)
  aspect?: number;  // ratio W/H (smartphones)
  zooms: ZoomModule[];
};
