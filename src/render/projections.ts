import { toRad, toDeg, clamp } from '../utils/common';

export type ProjectionMode = 
  | 'recti-panini' 
  | 'rectilinear' 
  | 'stereo-centered' 
  | 'ortho' 
  | 'cylindrical' 
  | 'cylindrical-horizon';

export interface ProjectionContext {
  refAz: number;
  refAlt: number;
  fovXDeg: number;
  fovYDeg: number;
  width: number;
  height: number;
}

export interface ProjectionResult {
  x: number;
  y: number;
  visible: boolean;
  visibleX?: boolean;
  visibleY?: boolean;
  pxPerDegX?: number;
  pxPerDegY?: number;
}

// Base projection interface
export interface Projection {
  project(az: number, alt: number, ctx: ProjectionContext): ProjectionResult;
}

// Rectilinear + Panini projection
class RectiPaniniProjection implements Projection {
  project(az: number, alt: number, ctx: ProjectionContext): ProjectionResult {
    // Implementation from your existing projectToScreen for 'recti-panini'
    // ...existing projection math...
    return { x: 0, y: 0, visible: true };
  }
}

// Stereographic centered projection
class StereoCenteredProjection implements Projection {
  project(az: number, alt: number, ctx: ProjectionContext): ProjectionResult {
    // Implementation from your existing projectToScreen for 'stereo-centered'
    // ...existing projection math...
    return { x: 0, y: 0, visible: true };
  }
}

// Orthographic projection
class OrthoProjection implements Projection {
  project(az: number, alt: number, ctx: ProjectionContext): ProjectionResult {
    // Implementation from your existing projectToScreen for 'ortho'
    // ...existing projection math...
    return { x: 0, y: 0, visible: true };
  }
}

// Cylindrical projection
class CylindricalProjection implements Projection {
  project(az: number, alt: number, ctx: ProjectionContext): ProjectionResult {
    // Implementation from your existing projectToScreen for 'cylindrical'
    // ...existing projection math...
    return { x: 0, y: 0, visible: true };
  }
}

// Factory pattern for projections
export function createProjection(mode: ProjectionMode): Projection {
  switch (mode) {
    case 'recti-panini': return new RectiPaniniProjection();
    case 'stereo-centered': return new StereoCenteredProjection();
    case 'ortho': return new OrthoProjection();
    case 'cylindrical': return new CylindricalProjection();
    case 'cylindrical-horizon': return new CylindricalProjection(); // Same as cylindrical for now
    case 'rectilinear': return new RectiPaniniProjection(); // Use panini but with different parameters
    default: return new RectiPaniniProjection();
  }
}
