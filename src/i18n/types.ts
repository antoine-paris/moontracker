import 'react-i18next';

// Import translation interfaces
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: {
        navigation: {
          back: string;
          close: string;
          expand: string;
          return: string;
          goToApp: string;
        };
        time: {
          now: string;
          setCurrentTime: string;  
          enterDateTime: string;
          goToMinusHour: string;
          goToPlusHour: string;
        };
        recording: {
          inProgress: string;
          frame: string;
          timecode: string;
        };
        loading: {
          locations: string;
          models: string;
          sceneRendering: string;
        };
        directions: {
          north: string;
          south: string;
          east: string;
          west: string;
          northAbbrev: string;
          southAbbrev: string;
          eastAbbrev: string;
          westAbbrev: string;
          toNorth: string;
          toSouth: string;
          toEast: string;
          toWest: string;
        };
        location: {
          nearNorthPole: string;
          nearSouthPole: string;
          kmFromNorthPole: string;
          kmFromSouthPole: string;
          coordinates: string;
          coordinatesWithDistance: string;
          localTime: string;
        };
      };
      astro: {
        sun: {
          title: string;
          altitude: string;
          azimuth: string;
          apparentDiameter: string;
          distance: string;
          eclipticTilt: string;
        };
        moon: {
          title: string;
          altitude: string;
          azimuth: string;
          apparentDiameter: string;
          distance: string;
          phase: string;
          phaseIlluminated: string;
          earthshine: string;
          libration: string;
          librationToEarth: string;
          parallaticAngle: string;
          horizontalParallax: string;
          orientation: string;
          solarDeclination: string;
          geocentric: string;
          topocentric: string;
        };
        directions: {
          north: string;
          south: string;
          east: string;
          west: string;
          top: string;
          bottom: string;
          northAbbrev: string;
          southAbbrev: string;
          eastAbbrev: string;
          westAbbrev: string;
        };
        units: {
          degrees: string;
          kilometers: string;
          percent: string;
          astronomicalUnit: string;
        };
      };
      ui: {
        controls: {
          play: string;
          pause: string;
          settings: string;
          share: string;
          capture: string;
          record: string;
          info: string;
          help: string;
        };
        device: {
          custom: string;
          theoreticalFocal: string;
        };
        projection: {
          rectilinear: string;
          stereographic: string;
          orthographic: string;
        };
        followModes: {
          sun: string;
          moon: string;
          north: string;
          east: string;
          south: string;
          west: string;
          mercury: string;
          venus: string;
          mars: string;
          jupiter: string;
          saturn: string;
          uranus: string;
          neptune: string;
        };
      };
      info: {
        site: {
          title: string;
          subtitle: string;
          description: string;
        };
        tabs: {
          spaceview: string;
          help: string;
          simulations: string;
          flatearth: string;
          bug: string;
        };
        metadata: {
          keywords: string;
          description: string;
        };
      };
    };
  }
}