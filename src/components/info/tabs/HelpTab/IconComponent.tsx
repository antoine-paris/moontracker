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

export function I({ id, title, size }: { id: IconId; title?: string; size?: 'small' | 'large' }) {
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
      case 'NEXT': return { char: '\u25B6' };
      case 'PREVIOUS': return { char: '\u25C0' };
      case 'PLUS': return { char: '+' };
      case 'MOINS': return { char: '-' };
      default: return null;
    }
  })();

  if (glyph) {
    return (
      <span className={wrapClass} title={title} aria-hidden="true">
        <span
          style={{
            fontSize: size === 'small' ? '13px' : size === 'large' ? '17px' : '15px',
            transform: glyph.rotate ? `rotate(${glyph.rotate}deg)` : undefined,
          }}>
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