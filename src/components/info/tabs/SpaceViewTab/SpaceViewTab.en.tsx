import InfoLogo from '../../InfoLogo';

export default function SpaceViewTabEn() {
  const ldSoftware = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SpaceView',
    applicationCategory: 'EducationalApplication',
    applicationSubCategory: 'Astronomy simulator, Astrophotography planner',
    operatingSystem: 'Web',
    url: 'https://github.com/antoine-paris/spaceview',
    license: 'https://opensource.org/licenses/MIT',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    description:
      'SpaceView is a real-time 3D astronomical simulator and astrophotography planner: Sun, Moon, planets, phases, libration, wide-angle projections (Recti-Panini, Stereographic, Orthographic, Rectilinear, Cylindrical), timelapse, long exposure, photo frame and export.',
    keywords:
      'sky simulator, astronomical simulator, astrophotography, eclipse, Moon phases, timelapse, recti-panini, stereographic projection, horizon, FOV, field of view, photo frame, webm video recording, PNG capture',
    featureList: [
      'Wide-angle photo projections: Recti-Panini, Centered Stereographic, Orthographic, Rectilinear, Cylindrical',
      'Smart tracking: Sun, Moon, planets or cardinal points; horizon/ecliptic alignment',
      '3D rendering of the Moon and planets (by apparent size): accurate phases, libration, earthshine, terminator orientations',
      'Multi-scale timelapse: minute, hour, day, sidereal day, month, lunar cycles',
      'Real-time long exposure (stacking): trails and trajectory visualizations',
      'Educational magnification option for objects at very wide FOVs',
      'Optics simulation: sensors, 24×36 equiv. focal lengths, H/V FOV, 3:2/16:9 photo frame',
      'Atmospheric refraction, alt/az grid, ecliptic, local markers and cardinal points',
      'URL sharing (complete state), PNG export, .webm video recording',
    ],
  };

  const ldFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is SpaceView free?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Yes. The application is open-source (MIT license) and free to use in a modern browser.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I export a video or image?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Yes. Image export (PNG/copy) and .webm video recording directly from the interface.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are wide-angle photo projections supported?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Yes: Recti-Panini, Centered Stereographic, Orthographic, Rectilinear, Cylindrical.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does the simulation account for refraction and phases?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Yes: optional atmospheric refraction near the horizon, accurate phases, libration and earthshine.',
        },
      },
    ],
  };

  return (
    <article itemScope itemType="https://schema.org/SoftwareApplication">
      {/* Structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldSoftware) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldFaq) }}
      />

      <h1 itemProp="name">SpaceView.me — Astro-photography simulator <br/>(for beginners)</h1>
      
      <div className="flex justify-center my-8">
        <InfoLogo size={120} />
      </div>
      
      <p itemProp="description">
        Visualize the sky in real-time (Sun, Moon, planets, stars) with phases, apparent sizes, libration,
        wide-angle projections and photo tools. Plan an eclipse, a rise/set, a transit or an astrophotography
        session with precision, then share and export your scenes as image/video.
      </p>
      <p>
        Free • Open-source • No registration • Works in browser (modern desktop/mobile)
      </p>

      <h2>Why SpaceView?</h2>
      <ul>
        <li>Understand and visually explain phenomena (phases, ecliptic, altitudes, libration).</li>
        <li>Prepare credible shots: FOV, sensors, focal lengths, 3:2/16:9 frame, adapted projections.</li>
        <li>Create compelling demonstrations: timelapse, long exposure, image/video export and shareable link.</li>
      </ul>

      <h2>Innovative Features</h2>
      <ul>
        <li>
          Photo-oriented wide-angle projections (Recti-Panini, Stereographic, Orthographic, Rectilinear, Cylindrical)
          to maintain natural reading up to very wide FOVs.
        </li>
        <li>
          Smart object tracking and frame alignment (Horizon/Ecliptic) to easily compare altitudes and
          conjunctions.
        </li>
        <li>
          3D Moon rendering with libration, phase, earthshine and terminator orientation for accurate pedagogy.
        </li>
        <li>
          Multi-scale timelapse (minute → lunar cycles) and long exposure with stacking to visualize movements
          over days, months or years.
        </li>
        <li>
          Complete optics simulation: sensors, 24×36 equivalent focal length, H/V FOV, 3:2 photo frame and 16:9 markers.
        </li>
        <li>
          Configurable sky physics: refraction near horizon, alt/az grid, ecliptic, local markers and cardinal points.
        </li>
        <li>
          Instant URL sharing (complete state), PNG capture/copy, .webm video recording to broadcast your scenes.
        </li>
      </ul>

      <h2>Use Cases</h2>
      <ul>
        <li>Prepare an eclipse or planetary alignment from a precise location.</li>
        <li>Compare multiple focal lengths and projections for a credible wide-angle composition.</li>
        <li>Show the dance of Venus/Mercury, the seasons of the Sun or lunar libration in timelapse.</li>
        <li>Record a timelapse in .webm for a presentation or educational sharing.</li>
      </ul>

      
      <figure className="m-0" style={{ marginLeft: '5em', marginRight: '5em' }}>
        <img
          src="/img/capture/spaceview-application-export-1.png"
          alt="Scene capture and export function"
          className="w-full h-auto rounded-md border border-black/10 shadow-sm"
        />
        <figcaption className="text-sm text-gray-500 mt-1">
          View from Paris of the 2026 solar eclipse with Mercury and Jupiter.
        </figcaption>
      </figure>
    
      
      <h2>FAQ</h2>
      <div style={{ marginLeft:'5em', marginRight:'5em' }}>
        <details >
          <summary>Is SpaceView free?</summary>
          <p>Yes, open-source under MIT license, free to use in a modern browser.</p>
        </details>
        <details>
          <summary>Can I export a video or image?</summary>
          <p>Yes, image export (PNG/copy) and .webm video recording integrated.</p>
        </details>
        <details>
          <summary>Are wide-angle projections supported?</summary>
          <p>Yes: Recti-Panini, Centered Stereographic, Orthographic, Rectilinear, Cylindrical.</p>
        </details>
        <details>
          <summary>Does the simulation include refraction and phases?</summary>
          <p>Yes: optional atmospheric refraction, accurate phases, libration and earthshine.</p>
        </details>
      </div>
      <h2>Open-source and Credits</h2>
      <p>
        Source code: <a href="https://github.com/antoine-paris/spaceview" target="_blank" rel="noopener noreferrer" itemProp="url">GitHub</a> —
        <span itemProp="license">MIT</span> license. Stack: React, TypeScript, Vite, Tailwind, three.js, @react-three/fiber,
        astronomy-engine, Natural Earth, etc.
      </p>
    </article>
  );
}