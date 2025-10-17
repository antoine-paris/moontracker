// Physical constants
export const EARTH_RADIUS_KM = 6378.137;
export const AU_KM = 149597870.7;
export const SYNODIC_DAYS = 29.530588853;
export const SIDEREAL_DAYS = 27.321661;
export const AVG_MONTH_DAYS = 30.436875;
export const DAY_MS = 86400000;

// FOV limits
export const FOV_DEG_MIN = 0.1;
export const FOV_DEG_MAX = 360;

// Full Frame sensor (35mm equivalent)
export const FF_WIDTH_MM = 36;
export const FF_HEIGHT_MM = 24;
export const FOCAL_MIN_MM = 1;
export const FOCAL_MAX_MM = 4100;

// Render thresholds
export const MOON_DOT_PX = 5;
export const MOON_3D_SWITCH_PX = 20;
export const PLANET_DOT_MIN_PX = 4;
export const PLANET_3D_SWITCH_PX = 20;

// Z-index layers
export const Z = {
  sun: 10,
  moon: 20,
  phase: 30,
  horizon: 40,
  ui: 50,
} as const;

// Compass rose
export const ROSE_16 = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO",
] as const;

// Named stars
export const POLARIS_RA_DEG = 37.952917;
export const POLARIS_DEC_DEG = 89.264167;
export const CRUX_CENTROID_RA_DEG = 187.539271;
export const CRUX_CENTROID_DEC_DEG = -59.6625;

// NASA Moon texture
export const NASA_IMG = "https://svs.gsfc.nasa.gov/vis/a000000/a005100/a005187/frames/730x730_1x1_30p/moon.2709.jpg";
export const NASA_IMG_TOTAL = 730;
export const NASA_IMG_MARGIN = 53;
export const MOON_DISC_DIAMETER = NASA_IMG_TOTAL - 2 * NASA_IMG_MARGIN; // 624
export const MOON_SCALE = 0.2; // 20%
export const MOON_RENDER_DIAMETER = MOON_DISC_DIAMETER * MOON_SCALE; // ~124.8 px
