export const NASA_IMG =
  "https://svs.gsfc.nasa.gov/vis/a000000/a005100/a005187/frames/730x730_1x1_30p/moon.2709.jpg";
export const NASA_IMG_TOTAL = 730;
export const NASA_IMG_MARGIN = 53; // each side
export const MOON_DISC_DIAMETER = NASA_IMG_TOTAL - 2 * NASA_IMG_MARGIN; // 624
export const MOON_SCALE = 0.2; // 20%
export const MOON_RENDER_DIAMETER = MOON_DISC_DIAMETER * MOON_SCALE; // ~124.8 px

export const Z = { sun: 10, moon: 20, phase: 30, horizon: 40, ui: 50 } as const;

export const ROSE_16 = [
  "N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSO","SO","OSO","O","ONO","NO","NNO",
] as const;
