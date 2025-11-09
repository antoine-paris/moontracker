type IconId =
  | 'info' | 'panels' | 'play' | 'pause' | 'rec' | 'stop' | 'share' | 'capture'
  | 'sun' | 'moon' | 'planet' | 'stars'
  | 'grid' | 'markers' | 'horizon' | 'earth' | 'atmo' | 'refraction'
  | 'phase' | 'earthshine' | 'ecliptic' | 'sunCard' | 'moonCard' | 'debug'
  | 'device' | 'focal' | 'fov' | 'projection' | 'recti-panini' | 'rectilinear' | 'stereo-centered' | 'ortho' | 'cylindrical' | 'cylindrical-horizon'
  | 'datetime' | 'speed' | 'timelapse' | 'timelapse2' | 'longpose' | 'loop'
  | 'location' | 'search' | 'keyboard' | 'globe' | 'arrow' | 'center' | 'fullscreen'
  | 'mercure' | 'venus' | 'mars' | 'jupiter' | 'saturne' | 'uranus' | 'neptune'
  | 'N' | 'S' | 'E' | 'O'
  | 'arrow-left' | 'arrow-right' | 'arrow-up' | 'arrow-down'
  | 'zoom-device'
  | 'previous' | 'next'
  | 'plus' | 'moins'
  | 'enlarge'
  ;

function I({ id, title, size }: { id: IconId; title?: string; size?: 'small' | 'large' }) {
  // Wrapper: taille dépendante de `size`
  const wrapBase = 'inline-flex items-center justify-center rounded bg-black text-white/90 border border-white/20 mr-2 align-middle';
  const wrapClass =
    size === 'small'
      ? `${wrapBase} w-[24px] h-[24px]`
      : size === 'large'
      ? `${wrapBase} w-[34px] h-[34px]`
      : `${wrapBase} w-[30px] h-[30px]`;

  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

  // SVG size selon `size`
  const svgSize = size === 'small' ? 16 : size === 'large' ? 24 : 22;
  const svgClass = size === 'small'
    ? 'w-[16px] h-[16px]'
    : size === 'large'
    ? 'w-[24px] h-[24px]'
    : 'w-[22px] h-[22px]';

  const upper = String(id).toUpperCase();
  const glyph = (() => {
    switch (upper) {
      case 'MERCURE': return { char: '\u263F' }; // ☿
      case 'VENUS': return { char: '\u2640' };   // ♀
      case 'MARS': return { char: '\u2642' };    // ♂
      case 'JUPITER': return { char: '\u2643' }; // ♃
      case 'SATURNE': return { char: '\u2644' }; // ♄
      case 'URANUS': return { char: '\u2645' };  // ♅
      case 'NEPTUNE': return { char: '\u2646' }; // ♆
      case 'E': return { char: '\u27A4', rotate: 0 };    // ➤
      case 'O': return { char: '\u27A4', rotate: 180 };  // ➤ (Ouest)
      case 'N': return { char: '\u27A4', rotate: 270 };  // ➤
      case 'S': return { char: '\u27A4', rotate: 90 };   // ➤
      case 'NEXT': return { char: '\u21B7', rotate: 0 };
      case 'PREVIOUS': return { char: '\u21B6', rotate: 0 };
      case 'PLUS': return { char: '+', rotate: 0 };
      case 'MOINS': return { char: '-', rotate: 0 };
      default: return null;
    }
  })();

  if (glyph) {
    return (
      <span className={wrapClass} title={title} aria-hidden="true">
        <span
          style={{
            display: 'inline-block',
            fontSize: `${svgSize}px`,
            lineHeight: 1,
            transform: glyph.rotate != null ? `rotate(${glyph.rotate}deg)` : undefined,
          }}
        >
          {glyph.char}
        </span>
      </span>
    );
  }
  return (
    <span className={wrapClass} title={title} aria-hidden="true">
      <svg className={svgClass} width={svgSize} height={svgSize} viewBox="0 0 24 24">
        {id === 'enlarge' && (
            <>
            <circle cx="10" cy="10" r="5" {...s} />
            <path d="M14.5 14.5L19 19" {...s} />
            <path d="M10 7.5v5M7.5 10h5" {...s} />
          </>
        )}
        {id === 'arrow-right' && (
          <>
            <path d="M5 12h14" {...s} />
            <path d="M13 6l6 6-6 6" {...s} />
          </>
        )}
        {id === 'zoom-device' && (
          <>
            {/* Zoom device (lens barrel) */}
            <g transform="translate(2.75 0)" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
                {/* Mount */}
              <rect x="2.5" y="9" width="3" height="6" rx="1.5" />
              {/* Barrel */}
              <rect x="6" y="8" width="10" height="8" rx="2" />
              {/* Zoom ring ridges */}
              <path d="M8 8v8M10 8v8M12 8v8" />
              
            </g>
          </>
        )}
        {id === 'arrow-left' && (
          <>
            <path d="M19 12h-14" {...s} />
            <path d="M11 6l-6 6 6 6" {...s} />
          </>
        )}
        {id === 'arrow-up' && (
          <>
            <path d="M12 19v-14" {...s} />
            <path d="M6 11l6-6 6 6" {...s} />
          </>
        )}
        {id === 'arrow-down' && (
          <>
            <path d="M12 5v14" {...s} />
            <path d="M6 13l6 6 6-6" {...s} />
          </>
        )}
        {id === 'info' && (<><circle cx="12" cy="12" r="9" stroke="currentColor" fill="none" strokeWidth="2" /><rect x="11" y="10" width="2" height="6" rx="1" fill="currentColor"/><circle cx="12" cy="7.5" r="1.2" fill="currentColor"/></>)}
        {id === 'panels' && (
          <>
            {/* Engrenage 8 dents */}
            {/* Dents (remplies) */}
            <g transform="translate(12 12)">
              <rect x="-1" y="-10.8" width="2" height="3.2" rx="0.6" fill="currentColor" />
              <g transform="rotate(45)"><rect x="-1" y="-10.8" width="2" height="3.2" rx="0.6" fill="currentColor" /></g>
              <g transform="rotate(90)"><rect x="-1" y="-10.8" width="2" height="3.2" rx="0.6" fill="currentColor" /></g>
              <g transform="rotate(135)"><rect x="-1" y="-10.8" width="2" height="3.2" rx="0.6" fill="currentColor" /></g>
              <g transform="rotate(180)"><rect x="-1" y="-10.8" width="2" height="3.2" rx="0.6" fill="currentColor" /></g>
              <g transform="rotate(225)"><rect x="-1" y="-10.8" width="2" height="3.2" rx="0.6" fill="currentColor" /></g>
              <g transform="rotate(270)"><rect x="-1" y="-10.8" width="2" height="3.2" rx="0.6" fill="currentColor" /></g>
              <g transform="rotate(315)"><rect x="-1" y="-10.8" width="2" height="3.2" rx="0.6" fill="currentColor" /></g>

              {/* Branches (traits) */}
              <path d="M0 -3.4v-2.2M0 3.4v2.2M-3.4 0h-2.2M3.4 0h2.2" {...s} />
            </g>

            {/* Jante et moyeu (traits) */}
            <circle cx="12" cy="12" r="6.4" {...s} />
            <circle cx="12" cy="12" r="2.6" {...s} />
          </>
        )}
        {id === 'fullscreen' && (
          <>
            {/* Coins externes plein écran (inspiré de ⛶ U+26F6) */}
            <path d="M4 9V4h5" {...s}/>
            <path d="M20 9V4h-5" {...s}/>
            <path d="M4 15v5h5" {...s}/>
            <path d="M20 15v5h-5" {...s}/>
          </>
        )}
        {id === 'play' && <path d="M8 5l12 7-12 7V5z" fill="currentColor" />}
        {id === 'pause' && (<><rect x="7" y="5" width="4" height="14" rx="1.5" fill="currentColor"/><rect x="13" y="5" width="4" height="14" rx="1.5" fill="currentColor"/></>)}
        {id === 'stop' && (
            <>
              <rect x="6.5" y="6.5" height="11" width='11' rx="2" fill="currentColor"  />
            </>
        )}
        {id === 'rec' && (
            <>
              <circle cx="12" cy="12" r="7" fill="currentColor"   />
            </>
        )}
        {id === 'share' && (
          <>
            {/* Nœuds */}
            <circle cx="6" cy="12" r="3" fill="currentColor" />
            <circle cx="18" cy="6" r="3" fill="currentColor" />
            <circle cx="18" cy="18" r="3" fill="currentColor" />
            {/* Liaisons */}
            <path d="M8 12L16 8" {...s} />
            <path d="M8 12L16 16" {...s} />
          </>
        )}
        {id === 'capture' && (<><rect x="3" y="6" width="18" height="12" rx="2" {...s}/><circle cx="12" cy="12" r="3.5" {...s}/></>)}
        {id === 'sun' && (<><circle cx="12" cy="12" r="4" {...s}/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" {...s}/></>)}
        {id === 'moon' && (<><circle cx="12" cy="12" r="10" {...s}/><path d="M12 3 A 9 9 0 0 1 12 21 A 3.5 9 0 0 0 12 3 Z" fill="currentColor"/></>)}
        {id === 'planet' && (<><circle cx="12" cy="12" r="3.5" {...s}/><ellipse cx="12" cy="12" rx="7" ry="2.8" transform="rotate(-20 12 12)" {...s}/></>)}
        {id === 'stars' && (<><path d="M12 6l1.2 2.6 2.8.4-2 2 0.5 2.9L12 13.4 9.5 14.9 10 12 8 9l2.8-.4L12 6z" {...s}/><path d="M5 7.5h0M18.5 8.5h0M6.5 16.5h0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>)}
        {id === 'grid' && (<><path d="M4 9c3-3 13-3 16 0M4 15c3 3 13 3 16 0" {...s}/><path d="M9 4c-2.5 3.5-2.5 12.5 0 16M15 4c2.5 3.5 2.5 12.5 0 16" {...s}/><circle cx="12" cy="12" r="10" {...s}/></>)}
        {id === 'markers' && (<><circle cx="12" cy="12" r="1.4" fill="currentColor"/><path d="M12 4.2v3M12 16.8v3M4.2 12h3M16.8 12h3" {...s}/></>)}
        {id === 'horizon' && (<><circle cx="12" cy="12" r="8" {...s} strokeDasharray="2 3"/><path d="M3 12h18" {...s}/></>)}
        {id === 'earth' && (<><circle cx="12" cy="12" r="8" {...s} strokeDasharray="2 3"/><path d="M4 12A8 8 0 0 1 20 12" fill="#479b47"/></>)}
        {id === 'atmo' && (<><circle cx="12" cy="12" r="8" {...s} strokeDasharray="2 3"/><path d="M4 12A8 8 0 0 1 20 12" fill="#4c57f3"/></>)}
        {id === 'refraction' && (<><circle cx="12" cy="12" r="8" {...s} strokeDasharray="2 3"/><path d="M3 12h18" {...s}/><path d="M2 21L12 12L18 2" {...s} strokeDasharray="2 3"/></>)}
        {id === 'phase' && (<><circle cx="12" cy="12" r="10" {...s}/><path d="M12 3 A 9 9 0 0 1 12 21 A 3.5 9 0 0 0 12 3 Z" fill="currentColor"/></>)}
        {id === 'earthshine' && (<><circle cx="12" cy="12" r="10" {...s}/><circle cx="12" cy="12" r="8" stroke="currentColor" strokeOpacity="0.3"/></>)}
        {id === 'ecliptic' && (<><path d="M1 23L23 1" {...s} strokeDasharray="2 3"/><circle cx="12" cy="12" r="2" fill="currentColor"/></>)}
        {id === 'sunCard' && (<><circle cx="12" cy="12" r="3.5" {...s}/><path d="M12 5v3M12 16v3M5 12h3M16 12h3" {...s}/></>)}
        {id === 'moonCard' && (<><circle cx="12" cy="12" r="4" fill="currentColor"/><ellipse cx="12" cy="12" rx="10" ry="4" {...s}/><ellipse cx="12" cy="12" rx="4" ry="10" {...s}/></>)}
        {id === 'debug' && (<><ellipse cx="12" cy="12" rx="4" ry="5" {...s}/><path d="M12 7V5M12 19v-2M8 9L6 7M16 9l2-2M8 15l-2 2M16 15l2 2" {...s}/></>)}
        {id === 'device' && (<><rect x="5" y="4" width="14" height="12" rx="2" {...s}/><circle cx="12" cy="10" r="3" {...s}/></>)}
        {id === 'focal' && (<><path d="M5 12h14" {...s}/><path d="M7 8v8M17 8v8" {...s}/></>)}
        {id === 'fov' && (<><path d="M4 6l16 6L4 18z" {...s}/></>)}
        {id === 'projection' && (<><rect x="3" y="5" width="18" height="14" rx="2" {...s}/><path d="M3 12h18" {...s}/></>)}
        {id === 'recti-panini' && (<><rect x="3" y="5" width="18" height="14" rx="2" {...s}/><path d="M9 5v14M15 5v14M3 10h18M3 14h18" {...s}/></>)}
        {id === 'rectilinear' && (<><rect x="3" y="5" width="18" height="14" rx="2" {...s}/><path d="M12 5v14M3 12h18M3 5l18 14M21 5L3 19" {...s}/></>)}
        {id === 'stereo-centered' && (<><circle cx="12" cy="12" r="8" {...s}/><path d="M4 12c2.5-4 13.5-4 16 0M4 12c2.5 4 13.5 4 16 0" {...s}/></>)}
        {id === 'ortho' && (<><rect x="4" y="4" width="16" height="16" rx="2" {...s}/><circle cx="12" cy="12" r="6.5" {...s}/></>)}
        {id === 'cylindrical' && (<><rect x="3" y="5" width="18" height="14" rx="2" {...s}/><path d="M5 8c3-3 11-3 14 0M5 16c3 3 11 3 14 0M9 5v14M15 5v14" {...s}/></>)}
        {id === 'cylindrical-horizon' && (<><rect x="3" y="5" width="18" height="14" rx="2" {...s}/><path d="M9 5v14M15 5v14M3 12h18" {...s}/></>)}
        {id === 'datetime' && (<><rect x="3" y="5" width="18" height="14" rx="2" {...s}/><path d="M7 5v-2M17 5v-2M3 9h18" {...s}/></>)}
        {id === 'speed' && (<><path d="M4 19l16-7-7 16" {...s}/></>)}
        {id === 'timelapse' && (<><circle cx="12" cy="12" r="9" {...s}/><path d="M12 7v6l4 4" {...s}/></>)}
        {id === 'timelapse2' && (<><path d="M12 20.75a8.75 8.75 0 1 1 0 -17.5V0.75C5.787 0.75 0.75 5.787 0.75 12S5.787 23.25 12 23.25 23.25 18.213 23.25 12h-2.5A8.75 8.75 0 0 1 12 20.75Zm7.876 -12.568c0.315 0.648 0.552 1.34 0.699 2.066l2.45 -0.497a11.176 11.176 0 0 0 -0.9 -2.662l-2.25 1.093ZM19 6.749A8.809 8.809 0 0 0 17.249 5l1.502 -2c0.851 0.64 1.609 1.397 2.248 2.249L19.001 6.75Zm-5.25 -3.324a8.678 8.678 0 0 1 2.067 0.7l1.092 -2.249a11.178 11.178 0 0 0 -2.661 -0.9l-0.498 2.45ZM11 7v5.414l0.293 0.293 4 4 1.414 -1.414L13 11.586V7h-2Z"  strokeWidth={0.8} stroke='currentColor' fill='currentColor'/></>)}
        {id === 'longpose' && (
          <>
            <circle cx="8" cy="8" r="2" {...s}  fill='currentColor'  opacity="0.8"/>
            <circle cx="10" cy="10" r="2" {...s}  fill='currentColor'  opacity="0.6"/>
            <circle cx="12" cy="12" r="2" {...s}  fill='currentColor'  opacity="0.5"/>
            <circle cx="14" cy="14" r="2" {...s}  fill='currentColor'  opacity="0.4"/>
            <circle cx="16" cy="16" r="2" {...s}  fill='currentColor'  opacity="0.2"/>
            <circle cx="18" cy="18" r="2" {...s}  fill='currentColor'  opacity="0.1"/>
            <circle cx="20" cy="20" r="2" {...s}  fill='currentColor'  opacity="0.1"/>
            <circle cx="22" cy="22" r="2" {...s}  fill='currentColor'  opacity="0.1"/>
            <circle cx="6" cy="6" r="2" {...s}  fill='currentColor'  opacity="1"/>

            <circle cx="14" cy="2" r="1" {...s}  fill='currentColor'  opacity="0.8"/>
            <circle cx="15" cy="3" r="1" {...s}  fill='currentColor'  opacity="0.6"/>
            <circle cx="16" cy="4" r="1" {...s}  fill='currentColor'  opacity="0.5"/>
            <circle cx="17" cy="5" r="1" {...s}  fill='currentColor'  opacity="0.4"/>
            <circle cx="18" cy="6" r="1" {...s}  fill='currentColor'  opacity="0.2"/>
            <circle cx="19" cy="7" r="1" {...s}  fill='currentColor'  opacity="0.1"/>
            <circle cx="20" cy="8" r="1" {...s}  fill='currentColor'  opacity="0.1"/>
            <circle cx="14" cy="2" r="1" {...s}  fill='currentColor'  opacity="1"/>

            <circle cx="2" cy="16" r="1" {...s}  fill='currentColor'  opacity="0.8"/>
            <circle cx="3" cy="17" r="1" {...s}  fill='currentColor'  opacity="0.6"/>
            <circle cx="4" cy="18" r="1" {...s}  fill='currentColor'  opacity="0.5"/>
            <circle cx="5" cy="19" r="1" {...s}  fill='currentColor'  opacity="0.4"/>
            <circle cx="6" cy="20" r="1" {...s}  fill='currentColor'  opacity="0.2"/>
            <circle cx="7" cy="21" r="1" {...s}  fill='currentColor'  opacity="0.1"/>
            <circle cx="8" cy="22" r="1" {...s}  fill='currentColor'  opacity="0.1"/>
            <circle cx="2" cy="16" r="1" {...s}  fill='currentColor'  opacity="1"/>
          </>
        )}
        {id === 'loop' && (<><path d="M3 12a7 7 0 1 1 2 5" {...s}/><path d="M3 17v-5h5" {...s}/></>)}
        {id === 'location' && (<><path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10z" {...s}/><circle cx="12" cy="11" r="2.2" {...s}/></>)}
        {id === 'search' && (<><circle cx="10" cy="10" r="5" {...s}/><path d="M14.5 14.5L19 19" {...s}/></>)}
        {id === 'keyboard' && (<><rect x="3" y="7" width="18" height="10" rx="2" {...s}/><path d="M6 10h12M6 13h4" {...s}/></>)}
        {id === 'globe' && (<><circle cx="12" cy="12" r="9" {...s}/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" {...s}/></>)}
        {id === 'arrow' && <path d="M5 12h14M13 6l6 6-6 6" {...s} />}
        {id === 'center' && (<><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="6" {...s}/></>)}
      </svg>
    </span>
  );
}

export default function HelpTab() {
  return (
    <article itemScope itemType="https://schema.org/SoftwareApplication" className="prose-info">
      <h1>User Guide — Astrophotography Simulator (and sky from your location)</h1>
      <p>For ready-to-photograph examples, click on <strong>Simulations</strong> above.</p>
      <p>
        SpaceView.me is a sky and astrophotography shooting simulator. It simulates the Sun, Moon, planets, horizon and starry sky in 3D. 
        This guide details each functionality as visible in the interface. Ideal for preparing an <strong>eclipse</strong>, a <strong>sunrise/sunset</strong>,
        a <strong>planetary alignment</strong> or an <strong>astro-photo shoot</strong>.
      </p>

      <h2>Main Screen</h2>
      <figure className="info-content-margins my-4">
        <img src="/img/capture/spaceview-application-capture-1.png" alt="Overview of the main screen" className="rounded-md border border-black/10 shadow-sm" />
        <figcaption className="text-sm text-gray-500 mt-1">SpaceView main screen.</figcaption>
      </figure>
      
      <h3><I id="panels" /> <I id="fullscreen" />Show/Hide Interface</h3>
      <p>Allows you to show or hide all panels (settings, telemetry). Useful for a clean capture of the rendering.</p>

      <h3><I id="play" />Play <I id="pause" />Pause</h3>
      <p>Global control of time animation (continuous playback or pause). Works regardless of mode (continuous or time-lapse).</p>

      <h3><I id="rec" />Start recording and <I id="stop" />download video (.webm)</h3>
      <figure className="info-content-margins my-4">
        <video
          controls
          preload="metadata"
          playsInline
          className="w-auto max-w-full h-auto rounded-md border border-black/10 shadow-sm"
        >
          <source src="/img/capture/spaceview-video-sample-1.webm" type="video/webm" />
          Your browser does not support WebM video playback.
        </video>
        <figcaption className="text-sm text-gray-500 mt-1">
          Example of recorded video (.webm).
        </figcaption>
      </figure>
      <p>
        Records a WEBM video of the scene (rendering area only, without interface). Click <I id="rec" />to
        start, then <I id="stop" />to stop: the file downloads automatically.
      </p>
      <ul className="list-disc pl-6">
        <li><I id='play' size='small'/>Classic animation: Creates a 24 frames per second video whose pace depends on the speed chosen with the slider (in minutes per second).</li>
        <li><I id='timelapse' size='small'/>Timelapse activated: 1 image per step, constant 
        playback rate. The number of frames per second in the video will depend on the "Every [] ms" parameter. For smooth video, lower this parameter below 50 milliseconds.</li>
        <li><I id='longpose' size='small'/>Long exposure active: each frame waits for stacking to avoid "gaps".</li>
        <li>Recording starts scene playback automatically; stopping ends the video. You can pause recording <I id='pause' size='small'/>and
        change application parameters during recording to change scenes mid-video.</li>
        <li>The "Recording in progress" banner is not included in the video.</li>
      </ul>
      <p>
        The recording process is much slower than a <I id='play' size='small'/>animation played on screen because the application will wait for each frame to be perfectly rendered before adding it to the video. The video generation time will therefore depend on the available power of your hardware.
      </p>
      <p>
        Video quality depends on your screen/browser resolution.
      </p>
      <p>This functionality has been tested on Chrome. It might not work on Safari.</p>
      
      <h3><I id="share" />Copy Share URL</h3>
      <p>Copies a link that encodes all current application parameters: location, date/time, projection, FOV, visibility, etc. Anyone opening this link will see exactly the same scene as you.</p>
      <p>Ideal for sharing a precise configuration, such as an eclipse, transit, or planetary alignment.</p>
      <p>To use this feature, click the share icon and paste the link (Ctrl+V) in your preferred messaging or sharing application.</p>
      <p>The interface display status (<I id="panels" size='small'/> <I id="fullscreen" size="small" />) and animation (<I id="play" size="small" /> <I id="pause" size="small"/>) are also saved in the link.</p>

      <h3><I id="capture" />Image Capture</h3>
      <p>Saves a screen rendering image and copies it to clipboard. Hide the interface (<I id="fullscreen" size="small" />) to activate it.</p>
      <p>Useful for sharing an astrophotography project, transit, or precise sunrise/sunset.</p>
      {/* 2-column gallery */}
      <div className="info-content-margins grid grid-cols-1 sm:grid-cols-2 gap-4">
        <figure className="m-0">
          <img
            src="/img/capture/spaceview-application-export-1.png"
            alt="Scene capture and export function"
            className="w-full h-auto rounded-md border border-black/10 shadow-sm"
          />
          <figcaption className="text-sm text-gray-500 mt-1">
            View from Paris of the 2026 solar eclipse with Mercury and Jupiter.
          </figcaption>
        </figure>
        <figure className="m-0">
          <img
            src="/img/capture/spaceview-application-export-2.png"
            alt="Scene capture and export function"
            className="w-full h-auto rounded-md border border-black/10 shadow-sm"
          />
          <figcaption className="text-sm text-gray-500 mt-1">
            View from Paris of the 2026 solar eclipse — exaggerated visibility of Sun, Moon, Mercury and Jupiter.
          </figcaption>
        </figure>
      </div>
      

      <h2 ><I id="panels" />Spatial Object Tracking, Viewing Angle, Field of View</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2">
          <p>
            The application can lock onto a cardinal point or
            automatically follow a spatial object (Sun, Moon, planet). It also allows choosing a camera and lens, or selecting a custom shooting angle.
          </p>
        </div>
        <div className="m-0 md:col-span-1 info-content-margins-right-md">
          <figure className="mt-0">
            <img
              src="/img/capture/spaceview-application-follow-1.png"
              alt="Main scene selection function"
              className="w-full h-auto rounded-md border border-black/10 shadow-sm"
            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Main scene selection function.
            </figcaption>
          </figure>
        </div>
      </div>
      <h3><I id="sun" />Follow the Sun, <I id="moon" />Moon, a planet, or cardinal point</h3>
        <p>
          In "Tracking", you can choose which point to focus your scene on.</p>
          <ul className="list-disc pl-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <li><I id="sun" />Camera will follow the Sun. In animation, 
            the camera will therefore go around the horizon in 24 hours, and if the Sun is set, 
            the camera will continue to follow it below the observer's feet.</li>
            <li><I id="moon" />Camera will follow the Moon. In animation, the camera will move across the sky or point below the observer's feet if the Moon is set.</li>
            <li><I id="mercure" />Camera will follow Mercury.</li>
            <li><I id="venus" />Camera will follow Venus.</li>
            <li><I id="mars" />Camera will follow Mars.</li>
            <li><I id="jupiter" />Camera will follow Jupiter.</li>
            <li><I id="saturne" />Camera will follow Saturn.</li>
            <li><I id="uranus" />Camera will follow Uranus.</li>
            <li><I id="neptune" />Camera will follow Neptune.</li>
            <li><I id="N" />Camera will stay fixed to the north, centered on horizon.</li>
            <li><I id="S" />Camera will stay fixed to the south, centered on horizon.</li>
            <li><I id="E" />Camera will stay fixed to the east, centered on horizon.</li>
            <li><I id="O" />Camera will stay fixed to the west, centered on horizon.</li>
          </ul>
        <h3>Align screen to <I id="horizon" />terrestrial horizon or <I id="ecliptic" />ecliptic</h3>
        <p>
          Two orientation references are offered to rotate the frame without changing the tracked point:
          <br/>
          <I id="horizon" size="small" /> Terrestrial horizon — horizon stays perfectly straight; altitudes (°) can be read directly and scene maintains classic "photo" orientation.
          <br/>
          <I id="ecliptic" size="small" /> Ecliptic — ecliptic plane is rendered horizontal; apparent path of Sun, Moon and planets becomes a straight line, useful for comparing conjunctions and ecliptic longitudes.
          <br/>
          Tip: alignment doesn't modify tracking (object/cardinal point) but only frame rotation. Use arrows to reframe, then <I id="center" size="small" />to recenter.
        </p>
        <h3><I id="arrow-up" /><I id="arrow-left" /> <I id="center" /><I id="arrow-right" /><I id="arrow-down" />Move frame and tracking with directional pad</h3>
        <p>
          The directional pad arrows on the right side of the screen allow you to offset around the tracked point. 
          The <I id="center" size='small' /> button recenters on the object or cardinal point you chose.
          Vertical movements (<I id="arrow-up" size='small' /><I id="arrow-down" size='small' />) are limited upward to the zenith (90° altitude) and downward to ground level (-90° altitude).
        </p>
        
      <h3>Field of View</h3>
      <p>
        Choose a camera body or module (bridge/smartphone) <I id="device" size='small' /> and a zoom/lens <I id="zoom-device" size='small' />. 
        A photo frame is then drawn based on the chosen sensor and focal length.
        <br/>
        Using the "f" slider, you can create a custom field of view by choosing a theoretical focal length from 1mm to 4000mm (35mm equivalent). 
        The width and height (in degrees) of the field of view are displayed to the right of the slider.
      </p>

      <h3><I id="projection" />Screen Projections</h3>
      <p>When the field of view is very wide (from 90° displayed on screen, and even more with a fisheye effect at nearly 180°), it becomes impossible to respect both the proportions of displayed objects, angles, and positions. There will necessarily be one or even two of these elements that will be distorted.</p>
      <p>You must then choose a projection adapted to what we want to show. The application offers the following projections:</p>
      <ul>
        <li>
          <I id="recti-panini" />Recti-Panini — preserves straight lines around center and limits edge stretching. Renders natural perspective up to very wide-angle (≈140–170° depending on settings). Deforms scales/shapes at periphery and slightly curves straight lines far from center. Ideal for urban/architecture and ultra-wide landscapes.
          {/* 2-column gallery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <figure className="m-0">
              <img
                src="/img/capture/spaceview-application-projection-rectipanini-173.jpg"
                alt="Recti-Panini projection at 173° field of view"
                className="w-full max-w-2/3 h-auto rounded-md border border-black/10 shadow-sm"
              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Recti-Panini projection at 173° field of view
              </figcaption>
            </figure>
            <figure className="m-0">
              <img
                src="/img/capture/spaceview-application-projection-rectipanini-114.jpg"
                alt="Recti-Panini projection at 114° field of view"
                className="w-full max-w-2/3 h-auto rounded-md border border-black/10 shadow-sm"
              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Recti-Panini projection at 114° field of view
              </figcaption>
            </figure>
          </div>
        </li>
        <li>
          <I id="rectilinear" />Rectilinear — "pinhole lens" projection. All straight lines remain straight; rendering conforms to classic photos. Strong size dilation near 90° (edge stretching), poorly adapted to more than 120° FOV. Good choice for normal/telephoto focal lengths.
          {/* 2-column gallery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <figure className="m-0">
              
            </figure>
            <figure className="m-0">
              <img
                src="/img/capture/spaceview-application-projection-rectiperspective-114.jpg"
                alt="Recti-Perspective projection at 114° field of view"
                className="w-full max-w-2/3 h-auto rounded-md border border-black/10 shadow-sm"
              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Recti-Perspective projection at 114° field of view
              </figcaption>
            </figure>
          </div>
        </li>
        <li>
          <I id="stereo-centered" />Stereographic centered — conformal projection (preserves angles, thus local directions). Straight lines become arcs; distances and surfaces amplify toward edge. Very readable for sky pedagogy (orientations, rotations), "planets" and large domes.
          {/* 2-column gallery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <figure className="m-0">
              <img
                src="/img/capture/spaceview-application-projection-stereocentre-173.jpg"
                alt="Centered stereographic projection at 173° field of view"
                className="w-full max-w-2/3 h-auto rounded-md border border-black/10 shadow-sm"
              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Centered stereographic projection at 173° field of view
              </figcaption>
            </figure>
            <figure className="m-0">
              <img
                src="/img/capture/spaceview-application-projection-stereocentre-114.jpg"
                alt="Centered stereographic projection at 114° field of view"
                className="w-full max-w-2/3 h-auto rounded-md border border-black/10 shadow-sm"
              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Centered stereographic projection at 114° field of view
              </figcaption>
            </figure>
          </div>
        </li>
        <li>
          <I id="ortho" />Orthographic — hemisphere seen "from space". Preserves shapes well near center; compresses distances toward edge. Neither conformal nor equal-area. Very readable for simple all-sky view and hemispheric maps.
          {/* 2-column gallery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <figure className="m-0">
              <img
                src="/img/capture/spaceview-application-projection-ortho-173.jpg"
                alt="Orthographic projection at 173° field of view"
                className="w-full max-w-2/3 h-auto rounded-md border border-black/10 shadow-sm"
              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Orthographic projection at 173° field of view
              </figcaption>
            </figure>
            <figure className="m-0">
              <img
                src="/img/capture/spaceview-application-projection-ortho-114.jpg"
                alt="Orthographic projection at 114° field of view"
                className="w-full max-w-2/3 h-auto rounded-md border border-black/10 shadow-sm"
              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Orthographic projection at 114° field of view
              </figcaption>
            </figure>
          </div>
        </li>
        <li><I id="cylindrical" />Cylindrical — panoramas: linear azimuth, straight horizon, vertical meridians. Preserves horizontal directions; strongly stretches near zenith/nadir. 
          {/* 2-column gallery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <figure className="m-0">
              <img
                src="/img/capture/spaceview-application-projection-cylindrique-173.jpg"
                alt="Cylindrical projection at 173° field of view"
                className="w-full max-w-2/3 h-auto rounded-md border border-black/10 shadow-sm"
              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Cylindrical projection at 173° field of view
              </figcaption>
            </figure>
            <figure className="m-0">
              <img
                src="/img/capture/spaceview-application-projection-cylindrique-114.jpg"
                alt="Cylindrical projection at 114° field of view"
                className="w-full max-w-2/3 h-auto rounded-md border border-black/10 shadow-sm"
              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Cylindrical projection at 114° field of view
              </figcaption>
            </figure>
          </div>
        </li>
        <li>
          <I id="cylindrical-horizon" />Cylindrical (horizon) — variant recentered on horizon for panoramic strips; minimizes horizon curvature but flattens top/bottom of sky.
          {/* 2-column gallery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <figure className="m-0">
              <img
                src="/img/capture/spaceview-application-projection-cylindriquehorizon-173.jpg"
                alt="Cylindrical (horizon) projection at 173° field of view"
                className="w-full max-w-2/3 h-auto rounded-md border border-black/10 shadow-sm"
              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Cylindrical (horizon) projection at 173° field of view
              </figcaption>
            </figure>
            <figure className="m-0">
              <img
                src="/img/capture/spaceview-application-projection-cylindriquehorizon-114.jpg"
                alt="Cylindrical (horizon) projection at 114° field of view"
                className="w-full max-w-2/3 h-auto rounded-md border border-black/10 shadow-sm"
              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Cylindrical (horizon) projection at 114° field of view
              </figcaption>
            </figure>
          </div>
        </li>
      </ul>
      <p>When you change field of view width (FOV), the app automatically chooses an "ideal" projection compatible with your FOV.</p>
      <p>Warning: we chose never to distort the shape of planets, Sun and Moon (as software would do on a fisheye photo, for example). These celestial bodies will therefore always be rendered perfectly circular.</p>
      <p>Projection will only modify the angles and positions of these objects on screen.</p>

      <h3><I id="device" />Photo Frame</h3>
      <p>
        When you choose a particular camera, the rendering area is surrounded by a frame (in gray) proportional to the chosen camera's sensor.
        Dotted lines indicate 16:9 format.</p>
      <figure className="info-content-margins m-0">
        <img
          src="/img/capture/spaceview-application-capture-cadre-iphone.jpg"
          alt="Moon photo with iPhone 15 Pro. Gray frame matches iPhone sensor dimensions."
          className="w-full max-w-2/3 h-auto rounded-md border border-black/10 shadow-sm"
        />
        <figcaption className="text-sm text-gray-500 mt-1">
          Moon photo with iPhone 15 Pro. Gray frame matches iPhone sensor dimensions.
        </figcaption>
      </figure>
        
      
      
      <h2>Side Bar "Locations" — Moving on Earth</h2>
      <p>Choose an observation location on Earth (latitude, longitude) to see the sky and horizon from that place. Several tools facilitate search, navigation and precise positioning.
       
      </p>

      <h3><I id="globe" />Earth Globe</h3>
      
      <div className="info-content-margins grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4 items-center">
        <figure className="m-0">
          <img
            src="/img/capture/spaceview-application-capture-globe.jpg"
            alt="Location and observation direction indicator"
            className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"
          />
          <figcaption className="text-sm text-gray-500 mt-1">
            Location and observation direction indicator
          </figcaption>
        </figure>
        <p>
          With this globe, you can move east to west, which will update the city list in the "Cities" tab. 
          <br/>
          On the globe, the observer's position is indicated by a marker and an arrow shows the viewing direction.
          <br/>
          When the arrow is red, it indicates the observer is looking below the horizon (negative altitude).
        </p>
      </div>
      

      <h3><I id="location" />Cities Tab, Favorites and Navigation</h3>
      <p>
        The application has a database of cities with more than 100,000 inhabitants. Type a few letters in the <I id="search" size='small' />"Search" field to find one of these cities.
        <br/>
        <br/>
        In the "Cities" tab, they are presented from north <I id="N" size='small' /> to south <I id="S" size='small' /> (within 1° latitude), allowing movement from one city to another on the same latitude with a single click.
        <br/>
      </p>
      
      <div className="info-content-margins grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4 items-center">
        <figure className="m-0">
          <img
            src="/img/capture/spaceview-application-capture-cities.jpg"
            alt="Moving on Earth with Cities tab"
            className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"
          />
          <figcaption className="text-sm text-gray-500 mt-1">
            Moving on Earth with Cities tab
          </figcaption>
        </figure>
      <div> {/* inner text block (cities) */}
      <p>    
        <br/>
        The two east  <I id="E" size='small' /> and west  <I id="O" size='small' /> buttons allow
        navigation in the city list while staying on the same longitude (within 1°).
        <br/>
        <br/>
        This organization helps highlight the planet's sphericity since moving east to west or north to south will rotate the rendered scene.
        <br/>
      </p>
      {/* 2-column gallery */}
      <div className="info-content-margins grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <figure className="m-0">
          <img
            src="/img/capture/spaceview-application-moon-paris.jpg"
            alt="Moon simulation as seen from Paris"
            className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

          />
          <figcaption className="text-sm text-gray-500 mt-1">
            Moon as seen from Paris
          </figcaption>
        </figure>
        <figure className="m-0">
          <img
            src="/img/capture/spaceview-application-moon-cotonou.jpg"
            alt="Moon simulation as seen from Cotonou"
            className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

          />
          <figcaption className="text-sm text-gray-500 mt-1">
            Moon as seen from Cotonou (south of Paris)
          </figcaption>
        </figure>
        <figure className="m-0">
          <img
            src="/img/capture/spaceview-application-moon-somalia.jpg"
            alt="Moon simulation as seen from Somalia"
            className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

          />
          <figcaption className="text-sm text-gray-500 mt-1">
            Moon as seen from Somalia (east of Cotonou)
          </figcaption>
        </figure>
        <figure className="m-0">
          <img
            src="/img/capture/spaceview-application-moon-madagascar.jpg"
            alt="Moon simulation as seen from Madagascar"
            className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

          />
          <figcaption className="text-sm text-gray-500 mt-1">
            Moon as seen from Madagascar (south of Somalia)
          </figcaption>
        </figure>
      </div>
      <p>
        These four photos (simulated by the application) show the Moon as seen from Paris, Cotonou, Somalia and Madagascar at the same moment. The rotation effect is only possible on a spherical Earth.
      </p>
      <p>
        This movement <I id="O" size='small' /><I id="N" size='small' /><I id="S" size='small' /><I id="E" size='small' /> is 
        also possible using your keyboard's numeric keypad keys.
        <br/>
        <br/>
        With the "+" button (next to each city), you can create a list of favorite cities to facilitate navigation between these cities.
      </p>
      </div> {/* CLOSE inner text block */}
    </div> {/* CLOSE grid (cities) */}
      <h3><I id="location" />Coordinates Tab (lat/lon) and 100km Step Movements</h3>
      <div className="info-content-margins grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4 items-center">
        <figure className="m-0">
          <img
            src="/img/capture/spaceview-application-capture-coord.jpg"
            alt="Moving on Earth with Coordinates tab"
            className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"
          />
          <figcaption className="text-sm text-gray-500 mt-1">
            Moving on Earth with Coordinates tab
          </figcaption>
        </figure>
        <div>
          In this tab, you can directly enter the observer's latitude and longitude.
          <br/><br/>
          The <I id="O" size='small' /><I id="N" size='small' /><I id="S" size='small' /><I id="E" size='small' /> buttons allow movement in 100km steps in each direction.
          <br/><br/>
          You can also move quickly using your keyboard's numeric keypad keys.
          <br/>
        </div>
      </div>
      <h2 ><I id="panels" />Date, Time and Animation</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2">
          <p>
            In the toolbar <I id="panels" size='small' />, you can choose the date and time of sky
            observation, and configure its update rate to create an animation.
            <br/>
            <br/>
            The animation reference time is UTC time, which avoids jumps during daylight/standard time transitions.
            <br/><br/>
            However, the "Date & Time" field you can configure is expressed in your browser's local time, regardless of the observation location you chose in the navigation bar.
            
          </p>
        </div>
        <div className="m-0 md:col-span-1 info-content-margins-right-md">
          <figure className="mt-0">
            <img
              src="/img/capture/spaceview-application-capture-date.jpg"
              alt="Choosing observation time and date. Animation setup"
              className="w-full h-auto rounded-md border border-black/10 shadow-sm"
            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Choosing observation time and date. Animation setup
            </figcaption>
          </figure>
        </div>
      </div>
      <p>
        For information, UTC time and local time of the chosen observation city are displayed under the "Date & Time" field.
        <br/>
        <br/>
        Furthermore, if you change observation city in the navigation bar, 
        UTC time will not change. Similarly, the "Date & Time" field will remain unchanged (local 
        to your browser).
        <br/>
        <br/>
        The <I id="previous" size='small' /><I id="timelapse" size='small' /><I id="next" size='small'/> buttons allow going back, forward, or returning to current time.
      </p>

      <h3><I id="play" />Animate the Scene</h3>
      <p>
        The application animates the scene by evolving the reference UTC time.
        <br/>
        <br/>
        Activate animation or pause it with <I id="play" size='small'/> and <I id="pause" size='small'/> buttons.
        <br/>
        <br/>
        The slider in this area allows speeding up or slowing down animation (toward future or past).
        <br/>
        <br/>
        Similarly, <I id="moins" size='small' /><I id="plus" size='small'/> buttons allow
        fine acceleration or deceleration (from 1 simulated minute per second on screen), or return to real time <I id="timelapse" size='small' />.
        <br/>
        <br/>
        This animation mode (in minutes per second) will try to adapt to your browser's capacity by creating as many frames as possible. It differs from the "timelapse" function which performs discrete time jumps (minute, hour, day, sidereal day, etc.).
      </p>
      <h3><I id="timelapse2" />Timelapse</h3>
      <p>
        "Timelapse" mode allows creating animations by significantly accelerating time. Unlike standard animation that simulates time passage in real time, timelapse performs discrete time jumps, allowing visualization of events over long periods in seconds.
        <br/>
        <br/>
        You can choose different time intervals for jumps. This allows capturing astronomical phenomena that occur over longer time scales.
      </p>
      <ul>
        <li>Minute</li>
        <li>Hour</li>
        <li>Day</li>
        <li>Sidereal day: 23h 56min 4s, allows return of observation location under same stars as previous day</li>
        <li>Month: one twelfth of a year</li>
        <li>Lunar day: 29.53 days, time between two identical Moon phases. Allows interesting observation of Moon libration (well visible from poles).</li>
        <li>Sidereal lunar cycle: 27.32 days, time between two Moon passages in front of same stars.</li>
      </ul>
      <p>
        Timelapse is particularly useful for observing events such as Moon phases, planetary transits, or star movements over several nights. 
      </p>

      <h3><I id="longpose" />Long Exposure (Stacking)</h3>
      <div>
        <p>
          Superimposes multiple frames to simulate long exposure (trails, glows). Adjust the number of retained images, and clear on demand.
          In time-lapse mode, progression waits for long exposure consolidation to avoid gaps.
        </p>
        {/* 4-column gallery */}
        <div className="info-content-margins grid grid-cols-1 sm:grid-cols-2 gap-4">
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-application-sun-noon-followup.jpg"
              alt="One Sun image at noon superimposed throughout the year shows seasonal progression"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              One Sun image at noon superimposed throughout the year shows seasonal progression.
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-application-sun-venus-dance.jpg"
              alt="Simulation of Venus and Mercury dance around the Sun"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Same parameters, atmosphere hidden, over several decades: Venus and Mercury dance.
            </figcaption>
          </figure>
        </div>
        <div className="info-content-margins grid grid-cols-1 sm:grid-cols-2 gap-4">
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-application-venus-transit.png"
              alt="Venus transit as seen from Tokyo in 2012"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Venus transit as seen from Tokyo in 2012.
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-application-sun-vens-polaris.jpg"
              alt="Sun, Polaris, Venus and Mercury in long exposure"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Sun, Polaris, Venus and Mercury in long exposure. This shot is obviously very complex to achieve with the Sun in the field of view.
            </figcaption>
          </figure>
        </div>
      </div>
      <h2><I id="panels" /> Spatial Objects Visible in Scene and Visual Assistance</h2>

      <div>{/* wrap visibility option lists */}
      <ul className="list-disc pl-6  gap-x-8 gap-y-2">
        <li><I id="enlarge" />Enlarges objects compared to the size they should have with the chosen zoom level.
          <br/>
          This function is implemented to simulate software zoom, but may give the impression that objects will overlap in a shot (which won't be the case).
          <br/>
          It can help animate a presentation and make it more immersive (even if less realistic).
            <figure className="m-0">
              <img
                src="/img/capture/spaceview-application-not-enlarge.jpg"
                alt="Real-size simulation"
                className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Real-size simulation without enlargement: Sun and Moon are tiny at 173° FOV.
              </figcaption>
            </figure>
            <figure className="m-0">
              <img
                src="/img/capture/spaceview-application-enlarge.jpg"
                alt="Simulation with enlargement"
                className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Simulation with enlargement: Sun, Moon and planets are rendered at the same size.
              </figcaption>
            </figure>
        </li>
        <li><I id="horizon" />Adds a horizon line, with cardinal and spatial object position indicators.
        <br/>Dotted "up" and "down" lines are also added to indicate 90° and -90° altitudes.</li>
        <li><I id="earth" />Shows or hides opaque ground (Earth). Disabling allows following spatial object paths even when hidden from observer (below horizon).</li>
        <li><I id="atmo" />Shows or hides atmospheric effect. Enabling makes stars and planets difficult to see (as in reality).</li>
        <li><I id="refraction" />Atmospheric refraction: modifies position of stars and planets near horizon. Disabling allows smoothing animations crossing horizon.</li>
        <li><I id="phase" />Moon and planet phases: shows phases according to relative position of Sun, Earth and Moon/planet. When disabled, Moon is lit throughout its phase and lunar eclipses are disabled.</li>
        <li><I id="earthshine" />Earthshine / Earth shadow: bluish backlighting of Moon's shadowed limb by light reflecting off Earth. Enables or disables Earth shadow and thus lunar eclipses (red Moon).</li>
      </ul>
      <ul className="list-disc pl-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
        <li><I id="sun" />Show or hide Sun</li>
        <li><I id="moon" />Show or hide Moon</li>
        <li><I id="mercure" />Show or hide Mercury.</li>
        <li><I id="venus" />Show or hide Venus.</li>
        <li><I id="mars" />Show or hide Mars.</li>
        <li><I id="jupiter" />Show or hide Jupiter.</li>
        <li><I id="saturne" />Show or hide Saturn.</li>
        <li><I id="uranus" />Show or hide Uranus.</li>
        <li><I id="neptune" />Show or hide Neptune.</li>
      </ul>
      <ul className="list-disc pl-6  gap-x-8 gap-y-2">
        <li><I id="grid" />Show or hide reference grid. It draws a line every 15°.</li>
        <li><I id="markers" />Show or hide markers (crosshairs on spatial objects).</li>
        <li><I id="ecliptic" />Show or hide ecliptic plane.
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-application-ecliptic.jpg"
              alt="Standard meridian, Equator and planetary cardinals"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Standard meridian, Equator and planetary cardinals
            </figcaption>
          </figure>
        </li>
        <li><I id="moonCard" />Show or hide local cardinals on Moon and planets.
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-application-cards.jpg"
              alt="Standard meridian, Equator and planetary cardinals"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Standard meridian, Equator and planetary cardinals
            </figcaption>
          </figure>
        </li>
      </ul>
      </div>
      <h3>Observation Telemetry</h3>
      <div>
        <p>At bottom of scene: telemetry information on Moon and Sun.</p>
        <figure className="info-content-margins m-0">
            <img
              src="/img/capture/spaceview-application-moon3d.jpg"
              alt="Moon rendered in 3D with libration effect, orientation and phase"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Moon rendered in 3D with libration effect, orientation and phase
            </figcaption>
          </figure>
          <figure className="info-content-margins m-0">
            <img
              src="/img/capture/spaceview-application-telemetry.jpg"
              alt="Application telemetry"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Application telemetry
            </figcaption>
          </figure>
      </div>
    </article>
  );
}