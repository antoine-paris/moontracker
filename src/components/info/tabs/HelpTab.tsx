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
      <h1>Guide d’utilisation MoonTracker — Simulateur d’astrophotographie (et du ciel depuis chez vous)</h1>
      <p>Pour des exemples prêts à photographier, cliquez sur <strong>Simulations</strong> ci‑dessus.</p>
      <p>
        MoonTracker est un simulateur de ciel et de prise de vue astro. Il simule le Soleil, la Lune, les planètes, l’horizon et le ciel étoilé en 3D. 
        Ce guide détaille chaque fonctionnalité telle que visible dans l’interface. Idéal pour préparer une <strong>éclipse</strong>, un <strong>lever/coucher</strong>,
        un <strong>alignement planétaire</strong> ou un <strong>shoot d’astro‑photo</strong>.
      </p>

      <h2>Écran principal</h2>
      <figure className="mx-[5rem] my-4">
        <img src="/img/capture/moontracker-application-capture-1.png" alt="Vue d’ensemble de l’écran principal" className="rounded-md border border-black/10 shadow-sm" />
        <figcaption className="text-sm text-gray-500 mt-1">Écran principal de Moontracker.</figcaption>
      </figure>
      
      <h3><I id="panels" /> <I id="fullscreen" />Afficher/Masquer l’interface</h3>
      <p>Permet d’afficher ou de cacher tous les panneaux (réglages, télémétrie). Pratique pour une capture propre du rendu.</p>

      <h3><I id="play" />Lecture <I id="pause" />Pause</h3>
      <p>Contrôle global de l’animation temporelle (lecture continue ou pause). Fonctionne quel que soit le mode (continu ou time‑lapse).</p>

      <h3><I id="rec" />Démarrer un enregistrement et <I id="stop" />télécharger la vidéo (.webm)</h3>
      <figure className="mx-[5rem] my-4">
        <video
          controls
          preload="metadata"
          playsInline
          className="w-auto max-w-full h-auto rounded-md border border-black/10 shadow-sm"
        >
          <source src="/img/capture/moontracker-video-sample-1.webm" type="video/webm" />
          Votre navigateur ne supporte pas la lecture de vidéos WebM.
        </video>
        <figcaption className="text-sm text-gray-500 mt-1">
          Exemple de vidéo enregistrée (.webm).
        </figcaption>
      </figure>
      <p>
        Enregistre une vidéo WEBM de la scène (zone de rendu uniquement, sans l’interface). Cliquez <I id="rec" />pour
        démarrer, puis <I id="stop" />pour arrêter : le fichier se télécharge automatiquement.
      </p>
      <ul className="list-disc pl-6">
        <li><I id='play' size='small'/>Animation classique : Crée une vidéo en 24 images par seconde dont le rythme dépend de la vitesse choisie au slider (en minutes par secondes).</li>
        <li><I id='timelapse' size='small'/>Timelapse activé : 1 image par pas, cadence 
        de lecture constante. Le nombre d'image par seconde de la vidéo dépendra du paramètre "Toutes les [] ms". Pour une vidéo fluide, descendez ce paramètre en dessous de 50 millisecondes. </li>
        <li><I id='longpose' size='small'/>Pose longue active : chaque image attend l’empilement pour éviter des « trous ».</li>
        <li>L’enregistrement lance la lecture de la scène automatiquement; l’arrêt termine la vidéo. Vous pouvez mettre l'enregistrement en pause <I id='pause' size='small'/>et
        changer les paramètres de l'application en cours d'enregistrement afin de changer de scène en cours de vidéo.</li>
        <li>Le bandeau « Enregistrement en cours » n’est pas inclus dans la vidéo.</li>
      </ul>
      <p>
        Le processus d'enregistrement est beaucoup plus lent qu'une animation <I id='play' size='small'/>lue à l'écran car l'application va attendre que chaque image soit parfaitement rendue pour l'ajouter à la vidéo. Le temps de génération d'une vidéo va donc dépendre de la puissance disponible sur votre matériel
      </p>
      <p>
        La qualité de la vidéo dépend de la résolution de votre écran/navigateur.
      </p>
      <p> Cette fonctionalité a été testée sur Chrome. Elle pourrait ne pas fonctionner sur Safari.</p>
      
      <h3><I id="share" />Copier l’URL de partage</h3>
      <p>Copie un lien qui encode tous les paramètres actuels de l’application : lieu, date/heure, projection, FOV, visibilité, etc. Toute personne ouvrant ce lien retrouve exactement la même scène que celle que vous voyez.</p>
      <p>Idéal pour partager une configuration précise, comme une éclipse, un transit ou un alignement planétaire.</p>
      <p>Pour utiliser cette fonctionnalité, cliquez sur l’icône de partage et collez le lien (Ctrl+V) dans votre application de messagerie ou de partage préférée.</p>
      <p>Le statut d’affichage de l’interface ( <I id="panels" size='small'/> <I id="fullscreen" size="small" />) et d’animation ( <I id="play" size="small" /> <I id="pause" size="small"/>) est également enregistré dans le lien.</p>

      <h3><I id="capture" />Capture d’image</h3>
      <p>Enregistre une image du rendu à l’écran et la copie dans le presse‑papier. Masquez l’interface ( <I id="fullscreen" size="small" />) pour l’activer.</p>
      <p>Utile pour partager un projet d’astrophotographie, un transit ou un lever/coucher précis.</p>
      {/* Galerie 2 colonnes */}
      <div style={{ marginLeft:'5em', marginRight:'5em' }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <figure className="m-0">
          <img
            src="/img/capture/moontracker-application-export-1.png"
            alt="Fonction de capture et d’exportation de la scène"
            className="w-full h-auto rounded-md border border-black/10 shadow-sm"
          />
          <figcaption className="text-sm text-gray-500 mt-1">
            Vue depuis Paris de l’éclipse solaire de 2026 avec Mercure et Jupiter.
          </figcaption>
        </figure>
        <figure className="m-0">
          <img
            src="/img/capture/moontracker-application-export-2.png"
            alt="Fonction de capture et d’exportation de la scène"
            className="w-full h-auto rounded-md border border-black/10 shadow-sm"
          />
          <figcaption className="text-sm text-gray-500 mt-1">
            Vue depuis Paris de l’éclipse solaire de 2026 — visibilité du Soleil, de la Lune, de Mercure et de Jupiter exagérée.
          </figcaption>
        </figure>
      </div>
      

      <h2 ><I id="panels" />Suivi d’objet spatial, angle de vue, champ de vision</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2">
          <p>
            L’application peut se caler sur un point cardinal ou
            automatiquement suivre un objet spatial (Soleil, Lune, planète). Elle permet aussi de choisir un appareil photo et un objectif, ou de choisir un angle de prise de vue personnalisé.
          </p>
        </div>
        <div className="m-0 md:col-span-1 md:mr-[5em]">
          <figure className="mt-0">
            <img
              src="/img/capture/moontracker-application-follow-1.png"
              alt="Fonction de choix de la scène principale"
              className="w-full h-auto rounded-md border border-black/10 shadow-sm"
            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Fonction de choix de la scène principale.
            </figcaption>
          </figure>
        </div>
      </div>
      <h3><I id="sun" />Suivre le Soleil, <I id="moon" />la Lune, une planète, ou un point cardinal</h3>
        <p>
          Dans « Suivi », vous pouvez choisir vers quel point fixer votre scène.</p>
          <ul className="list-disc pl-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <li><I id="sun" />La caméra va suivre le Soleil. Dans une animation, 
            la caméra va donc faire le tour de l’horizon en 24 h, et si le Soleil est couché, 
            la caméra va continuer à le suivre sous les pieds de l’observateur.</li>
            <li><I id="moon" />La caméra va suivre la Lune. Dans une animation, la caméra va donc se déplacer dans le ciel ou pointer sous les pieds de l’observateur si la Lune est couchée.</li>
            <li><I id="mercure" />La caméra va suivre Mercure.</li>
            <li><I id="venus" />La caméra va suivre Vénus.</li>
            <li><I id="mars" />La caméra va suivre Mars.</li>
            <li><I id="jupiter" />La caméra va suivre Jupiter.</li>
            <li><I id="saturne" />La caméra va suivre Saturne.</li>
            <li><I id="uranus" />La caméra va suivre Uranus.</li>
            <li><I id="neptune" />La caméra va suivre Neptune.</li>
            <li><I id="N" />La caméra va rester fixée au nord, centrée sur l’horizon.</li>
            <li><I id="S" />La caméra va rester fixée au sud, centrée sur l’horizon.</li>
            <li><I id="E" />La caméra va rester fixée à l’est, centrée sur l’horizon.</li>
            <li><I id="O" />La caméra va rester fixée à l’ouest, centrée sur l’horizon.</li>
          </ul>
        <h3>Aligner l'écran sur <I id="horizon" />l'horizon terrestre ou sur <I id="ecliptic" />l'écliptique</h3>
        <p>
          Deux repères d’orientation sont proposés pour faire pivoter le cadre sans changer le point suivi:
          <br/>
          <I id="horizon" size="small" /> Horizon terrestre — l’horizon reste parfaitement droit; les altitudes (°) se lisent directement et la scène conserve l’orientation « photo » classique.
          <br/>
          <I id="ecliptic" size="small" /> Écliptique — le plan de l’écliptique est rendu horizontal; le trajet apparent du Soleil, de la Lune et des planètes devient une ligne droite, utile pour comparer les conjonctions et longitudes écliptiques.
          <br/>
          Astuce: l’alignement ne modifie pas le suivi (objet/point cardinal) mais uniquement la rotation du cadre. Utiliser les flèches pour recadrer, puis <I id="center" size="small" />pour recentrer.
        </p>
        <h3><I id="arrow-up" /><I id="arrow-left" /> <I id="center" /><I id="arrow-right" /><I id="arrow-down" />Déplacer le cadre et le suivi avec le pavé directionnel</h3>
        <p>
          Les flèches du pavé directionnel à droite de l’écran permettent de se décentrer autour du point suivi. 
          Le bouton <I id="center" size='small' /> recentre sur l’objet ou le point cardinal que vous avez choisi.
          Les déplacements verticaux ( <I id="arrow-up" size='small' /><I id="arrow-down" size='small' />) sont limités vers le haut du ciel (altitude 90°) et vers le bas au niveau du sol (altitude −90°).
        </p>
        
      <h3>Champ de vision</h3>
      <p>
        Choisissez un boîtier ou module (bridge/smartphone) <I id="device" size='small' /> et un zoom/objectif <I id="zoom-device" size='small' />. 
        Un cadre photo se dessine alors d’après le capteur et la focale choisis.
        <br/>
        À l’aide du slider « f », vous pouvez créer un champ de vision personnalisé en choisissant une focale théorique de 1 mm à 4000 mm (équivalent 24/36). 
        La largeur et la hauteur (en degrés) du champ de vision s’affichent à droite du slider.
      </p>

      <h3><I id="projection" />Projections à l’écran</h3>
      <p>Quand le champ de vision est très large (à partir de 90° affichés sur un écran, et encore 
        plus avec un effet fisheye à presque 180°), il devient impossible de respecter à la fois 
        les proportions des objets affichés, les angles et les positions. Il y aura forcément un, voire deux de ces éléments qui seront déformés.</p>
      <p>Il faut alors choisir une projection adaptée à ce que nous voulons montrer. L’application propose les projections suivantes :</p>
      <ul>
        <li>
          <I id="recti-panini" />Recti‑Panini — conserve des lignes droites autour du centre et limite l’étirement aux bords. Rend une perspective naturelle jusqu’en très grand‑angle (≈140–170° selon réglages). Déforme échelles/formes en périphérie et courbe légèrement les droites loin du centre. Idéale en urbain/architecture et paysages ultra‑larges.
          {/* Galerie 2 colonnes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <figure className="m-0">
              <img
                src="/img/capture/moontracker-application-projection-rectipanini-173.jpg"
                alt="Projection Recti-Panini à 173° de champ de vision"
                className="w-full max-w-2/3 h-auto rounded-md border border-black/10 shadow-sm"
              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Projection Recti‑Panini à 173° de champ de vision
              </figcaption>
            </figure>
            <figure className="m-0">
              <img
                src="/img/capture/moontracker-application-projection-rectipanini-114.jpg"
                alt="Projection Recti-Panini à 114° de champ de vision"
                className="w-full max-w-2/3 h-auto rounded-md border border-black/10 shadow-sm"
              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Projection Recti‑Panini à 114° de champ de vision
              </figcaption>
            </figure>
          </div>
        </li>
        <li>
          <I id="rectilinear" />Rectilinéaire — projection « objectif à trou d’épingle ». Toutes les droites restent droites; rendu conforme aux photos classiques. Forte dilatation des tailles près de 90° (étirement en bord de champ), peu adaptée à plus de 120° de FOV. Bon choix en focale normale/télé.
          {/* Galerie 2 colonnes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <figure className="m-0">
              
            </figure>
            <figure className="m-0">
              <img
                src="/img/capture/moontracker-application-projection-rectiperspective-114.jpg"
                alt="Projection Recti-Perspective à 114° de champ de vision"
                className="w-full max-w-2/3 h-auto rounded-md border border-black/10 shadow-sm"
              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Projection Recti‑Perspective à 114° de champ de vision
              </figcaption>
            </figure>
          </div>
        </li>
        <li>
          <I id="stereo-centered" />Stéréographique centré — projection conforme (préserve les angles, donc les directions locales). Les droites deviennent des arcs; distances et surfaces s’amplifient vers le bord. Très lisible pour la pédagogie du ciel (orientations, rotations), « planètes » et grands dômes.
          {/* Galerie 2 colonnes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <figure className="m-0">
              <img
                src="/img/capture/moontracker-application-projection-stereocentre-173.jpg"
                alt="Projection stéréographique centrée à 173° de champ de vision"
                className="w-full max-w-2/3 h-auto rounded-md border border-black/10 shadow-sm"
              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Projection stéréographique centrée à 173° de champ de vision
              </figcaption>
            </figure>
            <figure className="m-0">
              <img
                src="/img/capture/moontracker-application-projection-stereocentre-114.jpg"
                alt="Projection stéréographique centrée à 114° de champ de vision"
                className="w-full max-w-2/3 h-auto rounded-md border border-black/10 shadow-sm"
              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Projection stéréographique centrée à 114° de champ de vision
              </figcaption>
            </figure>
          </div>
        </li>
        <li>
          <I id="ortho" />Orthographique — hémisphère vu « depuis l’espace ». Préserve bien les formes près du centre; compresse les distances vers le bord. Ni conforme ni équivalente en aire. Très lisible pour une vue all‑sky simple et des cartes hémisphériques.
          {/* Galerie 2 colonnes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <figure className="m-0">
              <img
                src="/img/capture/moontracker-application-projection-ortho-173.jpg"
                alt="Projection orthographique à 173° de champ de vision"
                className="w-full max-w-2/3 h-auto rounded-md border border-black/10 shadow-sm"
              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Projection orthographique à 173° de champ de vision
              </figcaption>
            </figure>
            <figure className="m-0">
              <img
                src="/img/capture/moontracker-application-projection-ortho-114.jpg"
                alt="Projection orthographique à 114° de champ de vision"
                className="w-full max-w-2/3 h-auto rounded-md border border-black/10 shadow-sm"
              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Projection orthographique à 114° de champ de vision
              </figcaption>
            </figure>
          </div>
        </li>
        <li><I id="cylindrical" />Cylindrique — panoramas : azimut linéaire, horizon droit, méridiens verticaux. Conserve les directions horizontales; étire fortement près du zénith/nadir. 
          {/* Galerie 2 colonnes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <figure className="m-0">
              <img
                src="/img/capture/moontracker-application-projection-cylindrique-173.jpg"
                alt="Projection cylindrique à 173° de champ de vision"
                className="w-full max-w-2/3 h-auto rounded-md border border-black/10 shadow-sm"
              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Projection cylindrique à 173° de champ de vision
              </figcaption>
            </figure>
            <figure className="m-0">
              <img
                src="/img/capture/moontracker-application-projection-cylindrique-114.jpg"
                alt="Projection cylindrique à 114° de champ de vision"
                className="w-full max-w-2/3 h-auto rounded-md border border-black/10 shadow-sm"
              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Projection cylindrique à 114° de champ de vision
              </figcaption>
            </figure>
          </div>
        </li>
        <li>
          <I id="cylindrical-horizon" />Cylindrique (horizon) — variante recentrée sur l’horizon pour bandes panoramiques; minimise la courbure de l’horizon mais écrase le haut/bas du ciel.
          {/* Galerie 2 colonnes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <figure className="m-0">
              <img
                src="/img/capture/moontracker-application-projection-cylindriquehorizon-173.jpg"
                alt="Projection cylindrique (horizon) à 173° de champ de vision"
                className="w-full max-w-2/3 h-auto rounded-md border border-black/10 shadow-sm"
              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Projection cylindrique (horizon) à 173° de champ de vision
              </figcaption>
            </figure>
            <figure className="m-0">
              <img
                src="/img/capture/moontracker-application-projection-cylindriquehorizon-114.jpg"
                alt="Projection cylindrique (horizon) à 114° de champ de vision"
                className="w-full max-w-2/3 h-auto rounded-md border border-black/10 shadow-sm"
              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Projection cylindrique (horizon) à 114° de champ de vision
              </figcaption>
            </figure>
          </div>
        </li>
      </ul>
      <p>Quand vous changez de largeur de champ de vision (FOV), l’app choisit automatiquement une projection « idéale » compatible avec votre FOV.</p>
      <p>Attention : nous avons fait le choix de ne jamais déformer la forme des planètes, du Soleil et de la Lune (comme le ferait un logiciel sur une photo fisheye, par exemple). Ces astres seront donc toujours rendus parfaitement circulaires.</p>
      <p>La projection ne modifiera que les angles et les positions de ces objets à l’écran.</p>

      <h3><I id="device" />Cadre photo</h3>
      <p>
        Quand vous choisissez un appareil photo particulier, la zone de rendu est entourée par un cadre (en gris) proportionnel au capteur de l’appareil choisi.
        Des pointillés indiquent le format 16:9.</p>
      <figure style={{ marginLeft:'5em', marginRight:'5em' }}  className="m-0">
        <img
          src="/img/capture/moontracker-application-capture-cadre-iphone.jpg"
          alt="Photo de la Lune avec un iPhone 15 Pro. Le cadre gris est aux dimensions du capteur de l’iPhone."
          className="w-full max-w-2/3 h-auto rounded-md border border-black/10 shadow-sm"
        />
        <figcaption className="text-sm text-gray-500 mt-1">
          Photo de la Lune avec un iPhone 15 Pro. Le cadre gris est aux dimensions du capteur de l’iPhone.
        </figcaption>
      </figure>
        
      
      
      <h2>Barre latérale « Lieux » — se déplacer sur la Terre</h2>
      <p>Choisissez un lieu d’observation sur Terre (latitude, longitude) pour voir le ciel et l’horizon depuis cet endroit. Plusieurs outils facilitent la recherche, la navigation et le positionnement précis.
       
      </p>

      <h3><I id="globe" />Globe terrestre</h3>
      
      <div style={{ marginLeft:'5em', marginRight:'5em' }}  className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4 items-center">
        <figure className="m-0">
          <img
            src="/img/capture/moontracker-application-capture-globe.jpg"
            alt="Indicateur du lieu et de la direction d’observation"
            className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"
          />
          <figcaption className="text-sm text-gray-500 mt-1">
            Indicateur du lieu et de la direction d’observation
          </figcaption>
        </figure>
        <p>
          Avec ce globe, vous pouvez vous déplacer d’est en ouest, ce qui mettra à jour la liste des villes dans l’onglet « Villes ». 
          <br/>
          Sur le globe, la position de l’observateur est indiquée par un marqueur et une flèche indique la direction de la prise de vue.
          <br/>
          Quand la flèche est rouge, elle indique que l’observateur regarde sous l’horizon (altitude négative).
        </p>
      </div>
      

      <h3><I id="location" />Onglet Villes, favoris et navigation</h3>
      <p>
        L’application dispose d’une base de données des villes de plus de 100 000 habitants. Tapez quelques lettres dans le champ <I id="search" size='small' />« Recherche » pour trouver l’une de ces villes.
        <br/>
        <br/>
        Dans l’onglet « Villes », elles sont présentées du nord <I id="N" size='small' /> au sud <I id="S" size='small' /> (à 1° de latitude), permettant de se déplacer d’une ville à l’autre sur la même latitude en un seul clic.
        <br/>
      </p>
      
      <div style={{ marginLeft:'5em', marginRight:'5em' }} className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4 items-center">
        <figure className="m-0">
          <img
            src="/img/capture/moontracker-application-capture-cities.jpg"
            alt="Se déplacer sur la Terre avec l’onglet Villes"
            className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"
          />
          <figcaption className="text-sm text-gray-500 mt-1">
            Se déplacer sur la Terre avec l’onglet Villes
          </figcaption>
        </figure>
      <div> {/* inner text block (cities) */}
      <p>    
        <br/>
        Les deux boutons est  <I id="E" size='small' /> et ouest  <I id="O" size='small' /> permettent
        de naviguer dans la liste des villes en restant sur la même longitude (à 1° près).
        <br/>
        <br/>
        Cette organisation permet de mettre en évidence la sphéricité de la planète puisqu’en se déplaçant d’est en ouest ou du nord au sud, la scène rendue va pivoter.
        <br/>
      </p>
      {/* Galerie 2 colonnes */}
      <div style={{ marginLeft:'5em', marginRight:'5em' }} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <figure className="m-0">
          <img
            src="/img/capture/moontracker-application-moon-paris.jpg"
            alt="Simulation de la Lune vue de Paris"
            className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

          />
          <figcaption className="text-sm text-gray-500 mt-1">
            La Lune vue de Paris
          </figcaption>
        </figure>
        <figure className="m-0">
          <img
            src="/img/capture/moontracker-application-moon-cotonou.jpg"
            alt="Simulation de la Lune vue de Cotonou"
            className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

          />
          <figcaption className="text-sm text-gray-500 mt-1">
            La Lune vue de Cotonou (au sud de Paris)
          </figcaption>
        </figure>
        <figure className="m-0">
          <img
            src="/img/capture/moontracker-application-moon-somalia.jpg"
            alt="Simulation de la Lune vue de Somalie"
            className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

          />
          <figcaption className="text-sm text-gray-500 mt-1">
            La Lune vue de Somalie (à l’est de Cotonou)
          </figcaption>
        </figure>
        <figure className="m-0">
          <img
            src="/img/capture/moontracker-application-moon-madagascar.jpg"
            alt="Simulation de la Lune vue de Madagascar"
            className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

          />
          <figcaption className="text-sm text-gray-500 mt-1">
            La Lune vue de Madagascar (au sud de la Somalie)
          </figcaption>
        </figure>
      </div>
      <p>
        Ces quatre photos (simulées par l’application) montrent la Lune vue de Paris, Cotonou, Somalie et Madagascar au même instant. L’effet de rotation n’est possible que sur une Terre sphérique.
      </p>
      <p>
        Ce déplacement <I id="O" size='small' /><I id="N" size='small' /><I id="S" size='small' /><I id="E" size='small' /> est 
        aussi possible en utilisant les touches du pavé numérique de votre clavier.
        <br/>
        <br/>
        Avec le bouton « + » (situé à côté de chaque ville), vous pouvez créer une liste de villes préférées pour faciliter la navigation entre ces villes.
      </p>
      </div> {/* CLOSE inner text block */}
    </div> {/* CLOSE grid (cities) */}
      <h3><I id="location" />Onglet Coordonnées (lat/lon) et déplacements par pas de 100 km</h3>
      <div style={{ marginLeft:'5em', marginRight:'5em' }} className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4 items-center">
        <figure className="m-0">
          <img
            src="/img/capture/moontracker-application-capture-coord.jpg"
            alt="Se déplacer sur la Terre avec l’onglet Coordonnées"
            className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"
          />
          <figcaption className="text-sm text-gray-500 mt-1">
            Se déplacer sur la Terre avec l’onglet Coordonnées
          </figcaption>
        </figure>
        <div>
          Dans cet onglet, vous pouvez saisir directement la latitude et la longitude de l’observateur.
          <br/><br/>
          Les boutons <I id="O" size='small' /><I id="N" size='small' /><I id="S" size='small' /><I id="E" size='small' /> permettent de se déplacer par pas de 100 km dans chaque direction.
          <br/><br/>
          Il est aussi possible de se déplacer rapidement en utilisant les touches du pavé numérique de votre clavier.
          <br/>
        </div>
      </div>
      <h2 ><I id="panels" />Date, heure et animation</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2">
          <p>
            Dans la barre d’outils <I id="panels" size='small' />, vous pouvez choisir la date et l’heure d’observation
            du ciel, et paramétrer son rythme de mise à jour afin de créer une animation.
            <br/>
            <br/>
            L’heure de référence de l’animation est l’heure UTC, ce qui permet d’éviter les sauts lors des passages en heure d’été/hiver.
            <br/><br/>
            En revanche, le champ « Date & Heure » que vous pouvez configurer est exprimé en heure locale de votre navigateur, et ce quel que soit le lieu d’observation que vous avez choisi dans la barre de navigation.
            
          </p>
        </div>
        <div className="m-0 md:col-span-1 md:mr-[5em]">
          <figure className="mt-0">
            <img
              src="/img/capture/moontracker-application-capture-date.jpg"
              alt="Choix de l’heure et de la date d’observation. Paramétrage de l’animation"
              className="w-full h-auto rounded-md border border-black/10 shadow-sm"
            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Choix de l’heure et de la date d’observation. Paramétrage de l’animation
            </figcaption>
          </figure>
        </div>
      </div>
      <p>
        À titre d’information, l’heure UTC et l’heure locale de la ville d’observation choisie sont indiquées sous le champ « Date & Heure ».
        <br/>
        <br/>
        Par ailleurs, si vous changez de ville d’observation dans la barre de navigation, 
        l’heure UTC ne changera pas. De même, le champ « Date & Heure » restera inchangé (local 
        à votre navigateur).
        <br/>
        <br/>
        Les boutons <I id="previous" size='small' /><I id="timelapse" size='small' /><I id="next" size='small'/> permettent de reculer, d’avancer ou de revenir à l’heure actuelle.
      </p>

      <h3><I id="play" />Animer la scène</h3>
      <p>
        L’application anime la scène en faisant évoluer l’heure UTC de référence.
        <br/>
        <br/>
        Activez l’animation ou mettez‑la en pause avec les boutons <I id="play" size='small'/> et <I id="pause" size='small'/>.
        <br/>
        <br/>
        Le slider de cette zone permet d’accélérer ou de ralentir l’animation (vers l’avenir ou vers le passé).
        <br/>
        <br/>
        De même, les boutons <I id="moins" size='small' /><I id="plus" size='small'/> permettent
        d’accélérer ou de ralentir finement (de 1 minute simulée par seconde à l’écran), ou de revenir en temps réel <I id="timelapse" size='small' />.
        <br/>
        <br/>
        Ce mode d’animation (en minutes par seconde) va essayer de s’adapter à la capacité de votre navigateur en créant le plus d’images possible. Il est à différencier de la fonction « timelapse » qui, elle, va effectuer des sauts de temps discrets (minute, heure, jour, jour sidéral, etc.).
      </p>
      <h3><I id="timelapse2" />Timelapse</h3>
      <p>
        Le mode « Timelapse » permet de créer des animations en accélérant le temps de manière significative. Contrairement à l’animation standard qui simule le passage du temps en temps réel, le timelapse effectue des sauts de temps discrets, permettant de visualiser des événements sur de longues périodes en quelques secondes.
        <br/>
        <br/>
        Vous pouvez choisir différents intervalles de temps pour les sauts. Cela permet de capturer des phénomènes astronomiques qui se déroulent sur des échelles de temps plus longues.
      </p>
      <ul>
        <li>Minute</li>
        <li>Heure</li>
        <li>Jour</li>
        <li>Jour sidéral : 23 h 56 min 4 s, permet le retour du lieu d’observation sous les mêmes étoiles que le jour précédent</li>
        <li>Mois : un douzième d’année</li>
        <li>Jour lunaire : 29,53 jours, temps entre deux phases identiques de la Lune. Permet une observation intéressante de la libration de la Lune (bien visible depuis les pôles).</li>
        <li>Cycle lunaire sidéral : 27,32 jours, temps entre deux passages de la Lune devant les mêmes étoiles.</li>
      </ul>
      <p>
        Le timelapse est particulièrement utile pour observer des événements tels que les phases de la Lune, les transits planétaires ou les mouvements des étoiles sur plusieurs nuits. 
      </p>

      <h3><I id="longpose" />Pose longue (empilement)</h3>
      <div>
        <p>
          Superpose plusieurs trames pour simuler une pose longue (traînées, lueurs). Ajustez le nombre d’images conservées, et videz à la demande.
          En mode time‑lapse, la progression attend la consolidation de la pose longue pour éviter des manques.
        </p>
        {/* Galerie 4 colonnes */}
        <div style={{marginLeft: '5em', marginRight: '5em'}} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <figure className="m-0">
            <img
              src="/img/capture/moontracker-application-sun-noon-followup.jpg"
              alt="Une image du Soleil à midi superposée tout au long de l’année montre la progression des saisons"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Une image du Soleil à midi superposée tout au long de l’année montre la progression des saisons.
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/capture/moontracker-application-sun-venus-dance.jpg"
              alt="Simulation de la danse de Vénus et de Mercure autour du Soleil"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Même paramètres, atmosphère cachée, durant plusieurs décennies : la danse de Vénus et de Mercure.
            </figcaption>
          </figure>
        </div>
        <div style={{marginLeft: '5em', marginRight: '5em'}} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <figure className="m-0">
            <img
              src="/img/capture/moontracker-application-venus-transit.png"
              alt="Transit de Vénus vu de Tokyo en 2012"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Transit de Vénus vu de Tokyo en 2012.
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/capture/moontracker-application-sun-vens-polaris.jpg"
              alt="Le Soleil, Polaris, Vénus et Mercure en pose longue"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Le Soleil, Polaris, Vénus et Mercure en pose longue. Cette prise de vue est évidemment très complexe à réaliser avec le Soleil dans le champ de vision.
            </figcaption>
          </figure>
        </div>
      </div>
      <h2><I id="panels" /> Objets spatiaux visibles dans la scène et assistance visuelle</h2>

      <div>{/* wrap visibility option lists */}
      <ul className="list-disc pl-6  gap-x-8 gap-y-2">
        <li><I id="enlarge" />Agrandit les objets par rapport à la taille qu’ils devraient avoir avec le niveau de zoom choisi.
          <br/>
          Cette fonction est mise en place pour simuler un zoom logiciel, mais peut donner l’impression que les objets se chevaucheront sur une prise de vue (ce qui ne sera pas le cas).
          <br/>
          Elle peut aider à animer une présentation et à la rendre plus immersive (même si elle est moins réaliste).
            <figure className="m-0">
              <img
                src="/img/capture/moontracker-application-not-enlarge.jpg"
                alt="Simulation à taille réelle"
                className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Simulation à taille réelle sans agrandissement : le Soleil et la Lune sont minuscules à 173° de FOV.
              </figcaption>
            </figure>
            <figure className="m-0">
              <img
                src="/img/capture/moontracker-application-enlarge.jpg"
                alt="Simulation avec agrandissement"
                className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

              />
              <figcaption className="text-sm text-gray-500 mt-1">
                Simulation avec agrandissement : le Soleil, la Lune et les planètes sont rendus à la même taille.
              </figcaption>
            </figure>
        </li>
        <li><I id="horizon" />Ajoute une ligne d’horizon, avec des indicateurs cardinaux et de position des objets spatiaux affichés.
        <br/>Des lignes pointillées « haut » et « bas » sont aussi ajoutées pour indiquer les altitudes 90° et −90°.</li>
        <li><I id="earth" />Affiche ou cache le sol opaque (la Terre). Le désactiver permet de suivre le trajet des objets spatiaux même quand ils sont cachés à un observateur (sous l’horizon).</li>
        <li><I id="atmo" />Affiche ou cache un effet d’atmosphère. L’activer rend les étoiles et les planètes difficiles à voir (comme dans la réalité).</li>
        <li><I id="refraction" />Réfraction atmosphérique : modifie la position des étoiles et des planètes proches de l’horizon. La désactiver permet de fluidifier les animations qui traversent l’horizon.</li>
        <li><I id="phase" />Phase de la Lune et des planètes : affiche les phases selon la position relative du Soleil, de la Terre et de la Lune/planète. Quand cette option est désactivée, la Lune est éclairée tout au long de sa phase et les éclipses de lune sont désactivées.</li>
        <li><I id="earthshine" />Clair de Terre / Ombre de terre : rétréclairage bleuté du limbe ombré de la Lune par la lumière qui se réfléchit sur la Terre. Active ou désactive l'ombre de la Terre et donc les éclipses de Lune (Lune rouge).</li>
      </ul>
      <ul className="list-disc pl-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
        <li><I id="sun" />Affiche ou cache le Soleil</li>
        <li><I id="moon" />Affiche ou cache la Lune</li>
        <li><I id="mercure" />Affiche ou cache Mercure.</li>
        <li><I id="venus" />Affiche ou cache Vénus.</li>
        <li><I id="mars" />Affiche ou cache Mars.</li>
        <li><I id="jupiter" />Affiche ou cache Jupiter.</li>
        <li><I id="saturne" />Affiche ou cache Saturne.</li>
        <li><I id="uranus" />Affiche ou cache Uranus.</li>
        <li><I id="neptune" />Affiche ou cache Neptune.</li>
      </ul>
      <ul className="list-disc pl-6  gap-x-8 gap-y-2">
        <li><I id="grid" />Affiche ou cache la grille de référence. Elle trace un trait tous les 15°.</li>
        <li><I id="markers" />Affiche ou cache les marqueurs (réticule sur les objets spatiaux).</li>
        <li><I id="ecliptic" />Affiche ou cache le plan de l’écliptique.
          <figure className="m-0">
            <img
              src="/img/capture/moontracker-application-ecliptic.jpg"
              alt="Méridien standard, Équateur et cardinaux des planètes"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Méridien standard, Équateur et cardinaux des planètes
            </figcaption>
          </figure>
        </li>
        <li><I id="moonCard" />Affiche ou cache les cardinaux locaux sur la Lune et les planètes.
          <figure className="m-0">
            <img
              src="/img/capture/moontracker-application-cards.jpg"
              alt="Méridien standard, Équateur et cardinaux des planètes"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Méridien standard, Équateur et cardinaux des planètes
            </figcaption>
          </figure>
        </li>
      </ul>
      </div>
      <h3>Télémétrie d’observation</h3>
      <div>
        <p>En bas de la scène : des informations télémétriques sur la Lune et le Soleil.</p>
        <figure style={{marginLeft: '5em', marginRight: '5em'}}  className="m-0">
            <img
              src="/img/capture/moontracker-application-moon3d.jpg"
              alt="Lune rendue en 3D avec effet de libration, orientation et phase"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Lune rendue en 3D avec effet de libration, orientation et phase
            </figcaption>
          </figure>
          <figure style={{marginLeft: '5em', marginRight: '5em'}} className="m-0">
            <img
              src="/img/capture/moontracker-application-telemetry.jpg"
              alt="Télémétrie de l’application"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Télémétrie de l’application
            </figcaption>
          </figure>
      </div>
    </article>
  );
}