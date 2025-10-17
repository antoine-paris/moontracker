import { MakeTime, Observer, Equator, Horizon, Body } from 'astronomy-engine';
import { AU_KM } from '../constants';

export interface EphemResult {
  altDeg: number;
  azDeg: number;
  distAU: number;
  raDeg: number;
  decDeg: number;
}

// Single unified function for alt/az calculation
export function computeAltAz(
  date: Date,
  lat: number,
  lng: number,
  body: Body,
  includeRefraction = true
): EphemResult {
  const time = MakeTime(date);
  const obs = new Observer(lat, lng, 0);
  const eq = Equator(body, time, obs, true, true);
  const hz = Horizon(time, obs, eq.ra, eq.dec, includeRefraction ? 'normal' : 'none');
  
  return {
    altDeg: hz.altitude,
    azDeg: hz.azimuth,
    distAU: eq.dist,
    raDeg: eq.ra * 15,
    decDeg: eq.dec,
  };
}

// Batch computation for multiple bodies
export function computeMultipleAltAz(
  date: Date,
  lat: number,
  lng: number,
  bodies: Body[]
): Array<EphemResult & { body: Body }> {
  const time = MakeTime(date);
  const obs = new Observer(lat, lng, 0);
  
  return bodies.map(body => {
    const eq = Equator(body, time, obs, true, true);
    const hz = Horizon(time, obs, eq.ra, eq.dec, 'normal');
    
    return {
      body,
      altDeg: hz.altitude,
      azDeg: hz.azimuth,
      distAU: eq.dist,
      raDeg: eq.ra * 15,
      decDeg: eq.dec,
    };
  });
}
