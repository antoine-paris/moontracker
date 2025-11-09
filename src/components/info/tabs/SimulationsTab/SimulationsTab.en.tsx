type Example = {
  label: string;
  desc?: string;
  url: string;            // ISO UTC
  img?: string;
  webm?: string;
};

// Convert any <br/> tags to actual line breaks
function renderDesc(desc?: string) {
  if (!desc) return null;
  const parts = desc.split(/<br\s*\/?>/gi);
  return parts.flatMap((part, idx) =>
    idx < parts.length - 1 ? [part, <br key={idx} />] : [part]
  );
}

export default function SimulationsTab() {
  const examples: Example[] = [
    {
      label: 'Venus Transit — 2012-06-05/06 (San Francisco)',
      desc: 'A transit occurs when Venus, whose orbit is inclined (~3.4°), passes through a node while Earth–Venus–Sun are perfectly aligned. Transits appear in pairs separated by 8 years, themselves spaced approximately 105.5 or 121.5 years apart: extremely rare. Visually, a small black disk slowly crosses the Sun; we can distinguish four contacts (C1–C4) and sometimes the "black drop" effect. Absolute safety: never look with naked eye; use certified ISO 12312‑2 solar glasses, full-aperture Astrosolar filter, or screen projection (binoculars/telescope). To compare with the simulation, note the trajectory on the solar disk and field orientation. Photography: tripod, manual focus on the limb, low ISO, fast speeds; trigger at regular intervals to document progression; with an H‑alpha filter, chromosphere and prominences are visible without changing transit geometry.',
      url: '/en?tl=2i2p.m55zs0&lp=74&l=5391959&t=m5608o&F=0&p=1&d=nikon-p1000&z=p1000-2000eq&b=aw1z&pl=2&sr=0.0167',
      img : '/img/examples/export-venus-transit-san-francisco-2012.jpg'
    },
    {
      label: 'Solar Eclipse — 2026-08-12 (Madrid)',
      desc: 'A solar eclipse occurs when the Moon casts its shadow on Earth. In Madrid, the central shadow grazes the city: the eclipse is 99.9% partial (it will be total in Coruña, Bilbao, Zaragoza, Valencia, and Palma de Mallorca), visible as a "bite" moving across the Sun. The occluded fraction and crescent orientation depend on local geometry and time. Safety: MANDATORY continuous protection (ISO 12312‑2 glasses, solar filter on optics). Observation: follow the crescent inclination and apparent trajectory via different FOV/projections; under trees, gaps act as pinholes and project crescents on the ground. Photography: manual/spot metering, low ISO, short exposures; create a regular time series; in wide-angle, frame urban context to tell the story.',
      url: '/en?tl=2i2p.tjo3a0&lp=5xc&l=6544494&t=tjo3ic&F=0&p=0&d=nikon-p1000&z=p1000-2000eq&b=9hc7&pl=a&sr=0.0167&da=0.15&dh=-0.04',
      img : '/img/examples/export-eclipse-madrid-2026.jpg'
    },
    {
      label: 'Total Solar Eclipse — 2024-04-08 (Dallas)',
      desc: 'In the totality band, the Moon completely covers the Sun for a few minutes. Phases: C1 (first contact), C2 (totality begins, Baily\'s beads, diamond ring), totality (corona, prominences, chromosphere), C3 (totality ends), C4 (last contact). Atmosphere: light/temperature drop, visible stars/planets, local winds. Safety: filter mandatory before C2 and after C3; remove filter only during totality. Observation: prioritize a site near the centerline with clear horizon. Photography: wide bracketing (≈ 1/4000 s to ≈ 1 s) to cover beads and extended corona; focus on limb; remote triggering; use a second wide-angle camera for horizon and public reaction.',
      url: '/en?tl=2i2o.sbmvgc&lp=5xc&l=4684888&t=sbmw2b&F=0&p=0&d=nikon-p1000&z=p1000-1000eq&b=9hdz&pl=a&sr=3.0167&da=0.15&dh=-0.04',
      img : '/img/examples/export-eclipse-dallas-2024.jpg'
    },
    {
      label: 'Total Lunar Eclipse — 2025-09-08 (Australia)',
      desc: 'The Moon passes through Earth\'s penumbra then umbra (central shadow). At maximum, it turns red: sunlight, refracted by the atmosphere, is filtered by Rayleigh scattering — the Moon simultaneously sees all auroras and sunsets on the globe. Hue/darkness vary with atmospheric transparency (Danjon scale). Observation: no protection needed, naked eye or binoculars; clear horizon useful for moonrise/moonset. Photography: during totality, very low brightness — try ≈ 1/4 to 2 s, ISO 400–1600, f/4–f/8 depending on focal length; outside totality, return to short exposures. Compare shadow edge orientation and speed with simulation.',
      url: '/en?tl=3wn4.t2884e&lp=5xc&g=rhby8kxye&tz=Australia%2FDarwin&t=t287xz&F=1&p=0&d=custom&k=1&f=1fy&b=9hcf&pl=a&sr=2.0167',
      img : '/img/examples/export-red-moon.jpg'
    },
    {
      label: 'Southern Cross — southern visibility (Santiago)',
      desc: 'Crux, small but very contrasted, dominates the southern sky. With α and β Centauri ("pointers"), it helps locate the south celestial pole: extend the long bar ~4.5 times and cross with the α–β Centauri bisector. Season/time: near Santiago, Crux is visible many nights, culminating in southern autumn; also spot the "Coal Sack" (dark nebula). Observation: dark sky, facing south; learn to read the Cross orientation by hour/season. Photography: wide-angle, 10–20 s, ISO 1600–6400; for star trails, stack long exposures or use tracking; compare altitude and rotation in simulation.',
      url: '/en?tl=2i2o.skzd40&lp=74&l=3928245&t=slb67m&F=b&p=5&d=custom&k=1&f=2&b=8s7o&pl=n&sr=167.101&da=16.55&dh=33.48',
      img : '/img/examples/export-crux-santiago.jpg'
    },
    {
      label: 'Sun\'s meridian height at solstice (Reykjavík)',
      desc: 'Height at true noon follows h ≈ 90° − |φ − δ| (φ latitude, δ solar declination). At summer solstice (δ ≈ +23.44°), near the arctic circle, the Sun stays low even at noon and shadows remain long. "True noon" doesn\'t always coincide with 12:00 (equation of time and time zone). Observation: use simulation to find exact moment; a gnomon (vertical stick) allows measuring minimum shadow. Photography: regular series with same framing to visualize seasonal variation; mandatory safety if disk enters frame (certified filter or indirect aiming).',
      url: '/en?tl=1og5.uh1io0&lp=75&l=3413829&t=uhplc0&F=b&p=5&d=custom&k=1&f=2&b=8s6t&pl=n&sr=0.0167&dh=31.91',
      img : '/img/examples/export-sun-noon-reykjavik.jpg'
    },
    {
      label: 'Polaris and Southern Cross visible simultaneously (Ecuador)',
      desc: 'At ~0° latitude, both celestial poles graze the horizon: Polaris very low to the north, Crux touching the south by season. Fields rotate in opposite directions around their respective poles. Observation: prioritize clear north/south horizons and clear night (equinoxes often offer good compromise). Turbulence near horizon can degrade sharpness. Photography: time-lapse or long exposures to show reverse rotation; wide-angle to include both horizons; no tracking for trails, otherwise stack short exposures. Compare instantaneous altitudes and rotation angle in simulation.',
      url: '/en?tl=1og5.tczxg0&lp=75&lat=0.000000&lng=-80.712710&tz=America%2FGuayaquil&t=tdcw40&F=b&p=0&d=VM&z=vm173&b=8s7p&pl=n&sr=0.0167&da=-51.76&dh=89.9',
      img : '/img/examples/export-polaris-crux-equador.jpg'
    },
    {
      label: 'Annular Solar Eclipse - ring of fire — 2024-10-02 (Pacific Ocean)',
      desc: 'The Moon, too small (apogee), doesn\'t cover the entire Sun: a luminous ring remains. Interest: annularity contact dynamics and crescent orientation before/after. Observation: MANDATORY continuous protection. Tip: follow the Sun, enable horizon and refraction for low horizon framing.',
      url: '/en?tl=1iis.skq100&lp=5xc&g=3e1ery7k6&tz=America%2FSantiago&t=skqs9f&F=0&p=0&d=custom&k=1&f=kr&b=5z0n&pl=n&sr=1.0167',
      img: '/img/examples/export-eclipse-annulaire-2024.jpg'
    },
    {
      label: 'Mercury\'s strange orbit',
      desc: 'Mercury, small and close to the Sun, follows the most eccentric (e ≈ 0.206) and inclined (~7°) orbit of the inner planets. Its speed varies greatly: accelerating at perihelion and slowing at aphelion. Planetary perturbations rotate its ellipse (perihelion precession) and general relativity adds 43″/century — the key that solved the "mystery" left by Newtonian mechanics. The timelapse "one point per day at noon" showcases its eastern/western elongations (synodic period ~116 d), height changing with season and ecliptic inclination, and asymmetric loops due to eccentricity. Observation tip: elusive planet, visible near horizon at twilight or dawn during greatest elongations; enable ecliptic and refraction in simulation — and never look at the Sun without protection.',
      url: '/en?tl=1og5.t5ieo0&lp=5xd&l=2988507&t=t5z2o0&F=0&p=5&d=custom&k=1&f=r&b=35vp&pl=1&sr=1.0167',
      img: '/img/examples/export-mercury-dance.jpg'
    },
    {
      label: 'Eclipse of May 29, 1919, confirmation of general relativity',
      desc: 'On this day, during a total solar eclipse observed from Príncipe Island (Gulf of Guinea) and Sobral (Brazil), teams led notably by Arthur Eddington measured the deflection of starlight passing near the Sun. The observed deflection matched Einstein\'s general relativity prediction, not Newtonian physics. This was considered the first major experimental confirmation of his theory, making Einstein world-famous.',
      url: '/en?tl=1og4.-qelao0&lp=5xc&g=s0m1ryjyn&tz=Africa%2FMalabo&t=-qel6g4&F=0&p=5&d=custom&k=1&f=1k&b=2t6v&pl=n&sr=2.0167',
      img: '/img/examples/export-eclipse-eddington-1919.jpg'
    },
    {
      label: '(Almost) Midnight Sun — June 21 (Jyväskylä - Finland)',
      desc: 'Beyond the polar circle, the Sun stays above the horizon 24 hours at summer solstice. In this Finnish city, on June 21, the sun will rise (to the north) at 2:30 AM and set (to the north) at 11:00 PM. Throughout this day, the sun will rotate around you.',
      url: '/en?tl=7apt.tgyag0&lp=5xd&l=655194&t=tgyc2c&F=9&p=0&d=VM&z=vm173&b=9hcl&pl=n&sr=2.0167&dh=89.9',
      img: '/img/examples/export-sun-path-north-finland.jpg'
    },
    {
      label: '(Almost) Midnight Sun — June 21 (Jyväskylä - Finland) - horizontal view',
      desc: 'Another view of the sun that seems to rotate around us on June 21 in Jyväskylä, Finland, beyond the polar circle where the Sun stays above the horizon 24 hours at summer solstice. In this Finnish city, on June 21, the sun will rise (to the north) at 2:30 AM and set (to the north) at 11:00 PM. Throughout this day, the sun will rotate around you.',
      url: '/en?tl=7aps.tgyc2c&lp=5xd&l=655194&t=tgyhou&F=0&p=5&d=custom&k=1&f=7&b=9hh1&pl=n&sr=30.0167&dh=-20.61',
      img: '/img/examples/export-sun-path-north-finland-2.jpg'
    },
    {
      label: 'Polar Night — December 21 (Jyväskylä - Finland)',
      desc: 'Beyond the polar circle, the Sun stays set 24 hours at winter solstice. In this Finnish city, on December 21, the sun will rise (to the south) at 9:00 AM and set (to the south) at 3:00 PM. This short day will essentially be one long sunrise and sunset.',
      url: '/en?tl=7apt.tqdvg0&lp=5xd&l=655194&t=tqdxj0&F=b&p=0&d=custom&k=1&f=r&b=9hdh&pl=n&sr=2.0167',
      img: '/img/examples/export-sun-path-south-finland.jpg'
    },
    {
      label: 'Solar Analemma over 1 year (Quito)',
      desc: 'The figure-8 results from obliquity (23.44°) and equation of time. Interest: Sun\'s position at true noon by date. Simulate a fixed point: same location, same time each day (Day timelapse), Recti-Panini projection.',
      url: '/en?tl=1og5.wer5w0&lp=5xd&l=3652462&t=ts9b80&F=b&p=0&d=custom&k=1&f=1&b=9nsl&pl=n&sr=30.0167&da=-34.73&dh=89.9',
      img: '/img/examples/export-sun-noon-8-quito.jpg'
    },
    {
      label: 'Venus–Jupiter Conjunction — 2025-08-25 (Paris)',
      desc: 'Spectacular morning close approach. Interest: brightness difference, ecliptic trajectory, low altitude. Follow Venus then Jupiter, enable ecliptic and compare various focal lengths (wide-angle vs telephoto).',
      url: '/en?tl=1og4.ts9b80&lp=5xc&l=2988507&t=t0v4g0&F=5&p=0&d=oeil&z=human&b=94vr&pl=a&sr=30.0167&dh=-10.89',
      img: '/img/examples/export-venus-jupiter-conjonction-2025.jpg'
    },
    {
      label: 'Venus–Jupiter Conjunction — 2025-08-25 (Paris) - Telephoto',
      desc: 'Spectacular morning close approach. Interest: brightness difference, ecliptic trajectory, low altitude. Follow Venus then Jupiter, enable ecliptic and compare various focal lengths (wide-angle vs telephoto).',
      url: '/en?tl=1og4.ts9b80&lp=5xc&l=2988507&t=t0v4g0&F=5&p=0&d=custom&k=1&f=7r&b=al13&pl=a&sr=30.0167&da=0.37&dh=-0.4',
      img: '/img/examples/export-venus-jupiter-conjonction-zoomed-2025.jpg'
    },
    {
      label: 'Venus–Jupiter Conjunction — 2025-08-25 (Paris) - Animation',
      desc: 'Spectacular morning close approach. In this version the ground is transparent and objects are enlarged.',
      url: '/en?tl=sd8h.t0qzdc&lp=5xc&l=2988507&t=t0r8mo&F=5&p=0&d=custom&k=1&f=9k&b=f5z&pl=a&sr=30.0167',
      img: '/img/examples/export-venus-jupiter-conjonction-timelapse-2025.jpg'
    },
    {
      label: 'Mars Opposition — 2035-09 (Sydney)',
      desc: 'Mars is closest and brightest, its apparent size peaks. Interest: retrograde loop around opposition against star background. Simulate several weeks (Day timelapse), ecliptic ON, compare culmination altitudes.',
      url: '/en?tl=uit0jp.y7axg0&lp=5xc&l=2147714&t=y7ghg0&F=4&p=0&d=custom&k=1&f=1&b=2hg7&pl=a&sr=30.0167',
      img: '/img/examples/export-mars-opposition-sydney-2035.jpg'
    },
    {
      label: 'Mars Opposition — 2035-09 with astronomical telescope (actual size)',
      desc: 'Mars is closest and brightest, its apparent size peaks. Interest: retrograde loop around opposition against star background. Simulate several weeks (Day timelapse), ecliptic ON, compare culmination altitudes.',
      url: '/en?tl=uit0jp.y7ghg0&lp=5xc&l=2147714&t=yb9is0&F=4&p=0&d=astro-1inch&z=sct-6-1500&b=24t3&pl=a&sr=30.0167',
      img: '/img/examples/export-mars-opposition-sydney-astrocam-2035.jpg'
    },
    {
      label: 'Mercury Transit — 2032-11-13 (London)',
      desc: 'Mercury passes in front of the Sun: tiny dark disk. Interest: contact timing, orientation on solar disk. Observation: absolute safety (certified filter). In the app, follow the Sun and zoom heavily.',
      url: '/en?tl=3wn4.wt6xma&lp=5xc&l=2643743&t=wt6tqv&F=0&p=0&d=custom&k=1&f=35w&b=9hg7&pl=a&sr=2.0167&dh=0.11',
      img: '/img/examples/export-mercury-transit-london-2032.jpg'
    },
    {
      label: 'Full Moon rise at perigee — 2026-11-24 (New York) - Real-time on smartphone',
      desc: 'Full Moon near perigee: slightly larger disk. Interest: horizon size illusions and perspective compression with telephoto. Enable refraction, frame an urban landmark and simulate minute by minute.',
      url: '/en?tl=uit0jk.tp0z3k&lp=5xc&l=5128581&t=tp0zab&F=1&p=5&d=galaxy-s21u&z=sd30&b=5z03&pl=a&sr=0.0167',
      img: '/img/examples/export-pleine-lune-perigee-new-york-2026.jpg'
    },
    {
      label: 'Lunar Libration (NASA Style)',
      desc: 'The Moon "tilts" and "breathes" (longitude/latitude librations). NASA uses photos from their satellites to show this. In this application we position ourselves at the north pole, make Earth transparent, and align our smartphone with the ecliptic. We take a photo each lunar day (28d) for several years...',
      url: '/en?tl=v2s7bh.t52l80&lp=5xc&g=upcrvxb65&tz=Etc%2FUTC&t=vo7rks&F=1&p=5&d=galaxy-s21u&z=sd30&b=dl3&pl=a&sr=360',
      webm: '/img/examples/video-moon-libration.webm'
    },
    {
      label: 'Saturn Libration',
      desc: 'Saturn doesn\'t always show us the same face: its axis is tilted 27° and its position relative to Earth varies. Combining these two effects, we alternately see the northern and southern hemispheres, as well as the rings from different angles. In this application, we position ourselves at the north pole, make Earth transparent, and align our smartphone with the ecliptic. We take a photo each sidereal day (23h56m) for several years...',
      url: '/en?tl=ebk5.ol9ojc&lp=5xc&g=upcrvxb65&tz=Etc%2FUTC&t=s3t8jc&F=6&p=0&d=nikon-p1000&z=p1000-2000eq&b=e85&pl=g&sr=0.0167',
      webm: '/img/examples/video-saturn-libration.webm'
    },
    {
      label: 'Milky Way and Southern Cross — southern winter (Atacama)',
      desc: 'Exceptional dark sky: galactic band, Crux and the "Coal Sack". Interest: galactic center height and field rotation. Use wide-angle, Atmosphere OFF for neutral sky, Grid ON for altitudes.',
      url: '/en?tl=v2s7b4.vo7rks&lp=5xc&l=3899539&t=sy6bjw&F=b&p=0&d=custom&k=1&f=1&b=6odx&pl=n&sr=5.0167&dh=37.84',
      img: '/img/examples/export-crux-atacama.jpg'
    },
    {
      label: 'Why are "planets" called that?',
      desc: 'The term "planet" comes from Greek "planetes", meaning "wanderer". This refers to planets\' movement relative to fixed stars. Our ancestors took centuries to understand these complex movements (and finally realize the sun was the center of the system), notably the retrograde loops observed from Earth (when the planet slows down and goes backward before resuming its course). In the application, we take a photo per sidereal day (when our position realigns with the same stars every 23h 56m 4s). We then observe planetary movements relative to fixed stars, highlighting their "wandering" nature.',
      url: '/en?tl=-teqghl.s6l39p&lp=5xc&l=3110876&t=s793kh&F=9&p=0&d=VM&z=vm173&b=9hec&pl=a&sr=-6.9833&da=34.73&dh=89.9',
      img: '/img/examples/export-planetes-errantes.jpg'
    },
    {
      label: 'The sun at the center',
      desc: 'Our ancestors took centuries to understand: heliocentrism (placing the sun at the center of planets) and relativity (making space curve due to the sun\'s mass). With this application, these two phenomena become intuitive: we simply need to make the ground transparent, point toward the sun, and take a photo per day for several years. We clearly see the sun\'s attraction on planets, and the curvature of their trajectories in sinusoids.',
      url: '/en?tl=-6z.uikx40.1e.1.15o&lp=5xd&l=524901&t=usgh40&F=0&p=0&d=custom&k=1&f=1&b=5z0l&pl=u&sr=214.852&dh=-14.19',
      img: '/img/examples/export-planet-dance.jpg'
    },
    {
      label: 'The sun at the center (5 years in 30 seconds)',
      desc: 'On the same principle (one photo per day, no ground or atmosphere), here\'s a video produced with the application.<br/> Go ahead and create your own animations!!!!',
      url: '/en?tl=1iit.usgh40&lp=5xc&l=2988507&t=wad7s0&F=0&p=0&d=custom&k=1&f=1&b=5z2d&pl=a&sr=214.852',
      webm: '/img/examples/video-sun-dance.webm'
    },

  ];

  return (
    <article>
      <h1 className="text-xl font-bold">Some simulations and examples</h1>
      <p>
        Open each link to compare with real observations. Parameters (location, UTC date/time,
        tracked target, projection, FOV) are encoded in the URL.
      </p>

      {examples.map((ex) => (
        <div key={ex.label} className="mb-8">
          <h2 className="text-lg font-semibold mb-4">{ex.label}</h2>
          
          <div className="info-content-margins flex flex-col md:flex-row gap-4">
            <div className="flex-shrink-0 md:w-80">
              {ex.img && (
                <img
                  src={ex.img}
                  alt={ex.label}
                  className="w-full h-auto object-cover rounded block"
                  style={{ margin:0 }}
                />
              )}
              {ex.webm && (
                <video
                  controls
                  preload="metadata"
                  playsInline
                  className="w-full h-auto rounded-md border border-black/10 shadow-sm"
                >
                  <source src={ex.webm} type="video/webm" />
                  Your browser doesn't support WebM video playbook.
                </video>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="mb-4">
                {renderDesc(ex.desc)}
              </div>
              <a
                href={ex.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Open simulation
              </a>
            </div>
          </div>
        </div>
      ))}

      <p className="text-gray-500 text-sm mt-2">
        
      </p>
    </article>
  );
}