import React from 'react';
import { buildShareUrl } from '../../../utils/urlState';
import type { FollowMode } from '../../../types';
import type { LocationOption } from '../../../data/locations';

type Example = {
  label: string;
  desc?: string;
  when: string;            // ISO UTC
  follow: FollowMode;
  projection: import("../../render/projection").ProjectionMode;
  loc: LocationOption;     // custom coords for robustness
  fovXDeg?: number;        // optional, defaults to 90°
};

const loc = (label: string, lat: number, lng: number, timeZone = 'UTC'): LocationOption =>
  ({ id: `url@${lat.toFixed(6)},${lng.toFixed(6)}`, label, lat, lng, timeZone });

const buildExampleUrl = (ex: Example) => {
  const baseUrl = (typeof window !== 'undefined')
    ? `${window.location.origin}/` // ensure links open on the main app '/' and not '/info'
    : '/';

  const whenMs = Date.parse(ex.when);

  // Minimal defaults for a robust, portable URL
  const url = buildShareUrl({
    whenMs,
    location: ex.loc,
    locations: [],

    follow: ex.follow,
    projectionMode: ex.projection,

    // Use custom optics for portability
    deviceId: 'custom-device',
    zoomId: 'custom-theo',
    fovXDeg: ex.fovXDeg ?? 90,
    fovYDeg: 60,
    linkFov: true,
    CUSTOM_DEVICE_ID: 'custom-device',

    toggles: {
      showSun: true,
      showMoon: true,
      showPhase: true,
      earthshine: false,
      showEarth: false,
      showAtmosphere: false,
      showStars: true,
      showMarkers: false,
      showGrid: false,
      showHorizon: true,
      showSunCard: false,
      showEcliptique: true,
      showMoonCard: false,
      enlargeObjects: false,
      debugMask: false,
      showRefraction: true,
    },

    showPanels: false,

    // Planets (optional mask). If you want "all", list ids and set them true.
    allPlanetIds: [],
    showPlanets: {},

    isAnimating: false,
    speedMinPerSec: 1 / 60,

    deltaAzDeg: 0,
    deltaAltDeg: 0,

    timeLapseEnabled: false,
    timeLapsePeriodMs: 200,
    timeLapseStepValue: 1,
    timeLapseStepUnit: 'minute',
    timeLapseLoopAfter: 0,
    timeLapseStartMs: whenMs,

    longPoseEnabled: false,
    longPoseRetainFrames: 1,

    preselectedCityIds: [],

    baseUrl,
    appendHash: '',
  });

  return url;
};

export default function SimulationsTab() {
  const examples: Example[] = [
    {
      label: 'Transit de Vénus — 2012-06-05/06 (San Francisco)',
      desc: 'Dernier transit visible depuis le Pacifique/Amérique du Nord.',
      when: '2012-06-05T22:00:00Z',
      follow: 'VENUS',
      projection: 'rectilinear',
      loc: loc('San Francisco', 37.7749, -122.4194),
    },
    {
      label: 'Éclipse solaire annulaire — 2026-08-12 (Madrid)',
      desc: 'Observer l’alignement Soleil–Lune et la trajectoire apparente.',
      when: '2026-08-12T17:30:00Z',
      follow: 'SOLEIL',
      projection: 'rectilinear',
      loc: loc('Madrid', 40.4168, -3.7038),
    },
    {
      label: 'Éclipse solaire totale — 2024-04-08 (Dallas)',
      desc: 'Totalité en Amérique du Nord; testez différents FOV.',
      when: '2024-04-08T18:30:00Z',
      follow: 'SOLEIL',
      projection: 'rectilinear',
      loc: loc('Dallas', 32.7767, -96.7970),
    },
    {
      label: 'Éclipse lunaire totale — 2025-03-14 (Paris)',
      desc: 'Suivre l’entrée dans l’ombre terrestre.',
      when: '2025-03-14T03:00:00Z',
      follow: 'LUNE',
      projection: 'stereo-centered',
      loc: loc('Paris', 48.8566, 2.3522),
    },
    {
      label: 'Opposition de Jupiter — 2024-10-07 (Rome)',
      desc: 'Jupiter brillante et observable toute la nuit.',
      when: '2024-10-07T00:00:00Z',
      follow: 'JUPITER',
      projection: 'rectilinear',
      loc: loc('Rome', 41.9028, 12.4964),
    },
    {
      label: 'Croix du Sud — visibilité australe (Santiago)',
      desc: 'Vérifier la visibilité de Crux depuis l’hémisphère Sud.',
      when: '2025-06-01T02:00:00Z',
      follow: 'S', // cardinale Sud
      projection: 'stereo-centered',
      loc: loc('Santiago', -33.4489, -70.6693),
    },
    {
      label: 'Hauteur méridienne du Soleil au solstice (Reykjavík)',
      desc: 'Comparer la hauteur maximale selon la latitude.',
      when: '2025-06-21T12:00:00Z',
      follow: 'SOLEIL',
      projection: 'rectilinear',
      loc: loc('Reykjavík', 64.1466, -21.9426),
    },
  ];

  return (
    <article>
      <h1>Simulations — Exemples partageables</h1>
      <p>
        Ouvrez chaque lien dans un nouvel onglet pour comparer aux observations réelles. Les paramètres (lieu, date/heure UTC,
        cible suivie, projection, FOV) sont encodés dans l’URL.
      </p>
      <ul>
        {examples.map(ex => (
          <li key={ex.label} className="mb-4">
            <div className="font-semibold">{ex.label}</div>
            {ex.desc && <div className="text-white/80 mb-1">{ex.desc}</div>}
            <a
              href={buildExampleUrl(ex)}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Ouvrir la simulation
            </a>
          </li>
        ))}
      </ul>
      <p className="text-white/70 text-sm">
        Astuce: ajustez ensuite la ville, la date/heure ou la projection, puis recopiez l’URL pour partager votre configuration.
      </p>
    </article>
  );
}