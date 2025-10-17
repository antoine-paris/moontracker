import { useMemo } from 'react';
import { getSunAndMoonAltAzDeg, getMoonIllumination, getMoonLibration } from '../astro/aeInterop';
import { sunApparentDiameterDeg } from '../astro/sun';
import { moonApparentDiameterDeg } from '../astro/moon';
import { moonHorizontalParallaxDeg, topocentricMoonDistanceKm } from '../astro/aeInterop';

export function useAstroData(date: Date, lat: number, lng: number) {
  return useMemo(() => {
    const both = getSunAndMoonAltAzDeg(date, lat, lng);
    const illum = getMoonIllumination(date);
    
    const sunDiamDeg = sunApparentDiameterDeg(date, both.sun.distAU);
    const moonParallaxDeg = moonHorizontalParallaxDeg(both.moon.distanceKm);
    const moonTopoKm = topocentricMoonDistanceKm(both.moon.distanceKm, both.moon.altDeg);
    const moonDiamDeg = moonApparentDiameterDeg(moonTopoKm);
    
    let moonLibrationTopo: { latDeg: number; lonDeg: number; paDeg: number } | undefined;
    try { 
      moonLibrationTopo = getMoonLibration(date, { lat, lng }); 
    } catch { 
      /* ignore */ 
    }
    
    return {
      sun: { 
        alt: both.sun.altDeg, 
        az: both.sun.azDeg, 
        distAU: both.sun.distAU, 
        appDiamDeg: sunDiamDeg 
      },
      moon: { 
        alt: both.moon.altDeg,
        az: both.moon.azDeg,
        parallacticDeg: moonParallaxDeg,
        distKm: both.moon.distanceKm,
        topoDistKm: moonTopoKm,
        appDiamDeg: moonDiamDeg,
        librationTopo: moonLibrationTopo,
      },
      illum,
    };
  }, [date, lat, lng]);
}
