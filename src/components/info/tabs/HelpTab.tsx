import { Link } from 'react-router-dom';

type IconId =
  | 'info' | 'panels' | 'play' | 'pause' | 'share' | 'capture'
  | 'sun' | 'moon' | 'planet' | 'stars'
  | 'grid' | 'markers' | 'horizon' | 'earth' | 'atmo' | 'refraction'
  | 'phase' | 'earthshine' | 'ecliptic' | 'sunCard' | 'moonCard' | 'debug'
  | 'device' | 'focal' | 'fov' | 'projection' | 'recti-panini' | 'rectilinear' | 'stereo-centered' | 'ortho' | 'cylindrical' | 'cylindrical-horizon'
  | 'datetime' | 'speed' | 'timelapse' | 'longpose' | 'loop'
  | 'location' | 'search' | 'keyboard' | 'globe' | 'arrow' | 'center' | 'fullscreen'
  | 'mercure' | 'venus' | 'mars' | 'jupiter' | 'saturne' | 'uranus' | 'neptune'
  | 'N' | 'S' | 'E' | 'O'
  | 'arrow-left' | 'arrow-right' | 'arrow-up' | 'arrow-down'
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

        {id === 'arrow-right' && (
          <>
            <path d="M5 12h14" {...s} />
            <path d="M13 6l6 6-6 6" {...s} />
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
        {id === 'longpose' && (<><rect x="5" y="5" width="12" height="8" rx="1" {...s}/><rect x="7" y="7" width="12" height="8" rx="1" {...s} opacity="0.6"/></>)}
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
      <h1>Guide d’utilisation MoonTracker — Simulateur d'astro-photographie (et du ciel depuis chez vous)</h1>
      <p>Pour des <strong>exemples prêts à shooter</strong>, cliquez sur <strong>Simulations</strong> ci dessus.</p>
      <p>
        MoonTracker est un simulateur de ciel et de prise de vue astro. Il simule le Soleil, la Lune, les planètes, l’horizon et le ciel étoilé en 3D. 
        Ce guide détaille chaque fonctionnalité telle que visible dans l’interface. Idéal pour préparer une <strong>éclipse</strong>, un <strong>lever/coucher</strong>,
        un <strong>alignement planétaire</strong> ou un <strong>shoot d’astro‑photo</strong>.
      </p>

      <h2>Ecran principal</h2>
      <figure className="mx-[5rem] my-4">
        <img src="/img/capture/moontracker-application-capture-1.png" alt="Vue d’ensemble de l’écran principal" className="rounded-md border border-black/10 shadow-sm" />
        <figcaption className="text-sm text-gray-500 mt-1">Ecran principal de Moontracker.</figcaption>
      </figure>
      
      <h3><I id="panels" /> <I id="fullscreen" />Afficher/Masquer l’interface</h3>
      <p>Permet d’afficher ou de cacher tous les panneaux (réglages, télémétrie). Pratique pour une capture propre du rendu.</p>

      <h3><I id="play" />Lecture <I id="pause" />Pause</h3>
      <p>Contrôle global de l’animation temporelle (lecture continue ou pause). Fonctionne quel que soit le mode (continu ou time‑lapse).</p>

      <h3><I id="share" />Copier l’URL de partage</h3>
      <p>Copie un lien qui encode tous les paramètres actuels de l'application : lieu, date/heure, projection, FOV, visibilité, etc. Toute personne ouvrant ce lien retrouve exactement la même scène que celle que vous voyez.</p>
      <p>Idéal pour partager une configuration précise, comme une éclipse, un transit ou un alignement planétaire.</p>
      <p>Pour utiliser cette fonctionnalité, cliquez sur l'icône de partage et collez le lien (ctrl+v) dans votre application de messagerie ou de partage préférée.</p>
      <p>Le statut d'affichage de l'interface ( <I id="panels" size='small'/> <I id="fullscreen" size="small" />) et d'animation ( <I id="play" size="small" /> <I id="pause" size="small"/>) est également enregistré dans le lien.</p>

      <h3><I id="capture" />Capture d’image</h3>
      <p>Enregistre une image du rendu à l'écran + la copie dans le presse‑papier. Masquez l’interface ( <I id="fullscreen" size="small" />) Pour activer cette fonctionnalité.</p>
      <p>Utile pour partager un projet d’astro‑photo, un transit ou un lever/coucher précis.
      {/* Galerie 2 colonnes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <figure className="m-0">
          <img
            src="/img/capture/moontracker-application-export-1.png"
            alt="Fonction de capture et d'exportation de la scène"
            className="w-full h-auto rounded-md border border-black/10 shadow-sm"
          />
          <figcaption className="text-sm text-gray-500 mt-1">
            Vue depuis Paris de l'éclipse solaire de 2026 avec Mercure et Jupiter.
          </figcaption>
        </figure>
        <figure className="m-0">
          <img
            src="/img/capture/moontracker-application-export-2.png"
            alt="Fonction de capture et d'exportation de la scène"
            className="w-full h-auto rounded-md border border-black/10 shadow-sm"
          />
          <figcaption className="text-sm text-gray-500 mt-1">
            Vue depuis Paris de l'éclipse solaire de 2026 - Visibilité de Soleil, Lune, Mercure et Jupiter exagérée.
          </figcaption>
        </figure>
      </div>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        <div className="md:col-span-2">
          <h2 ><I id="panels" />Suivi d'objet spatial, angle de vue, champ de vision</h2>
            <p>
              L'application peut se caller sur un point cardinale de la terre ou
              automatiquement suivre un objet spatiel (soleil, lune, planète). Elle permet aussi de choisir un appareil photo et un objectif, ou choisir un angle de prise de vue personnalisé.
            </p>

          <h3><I id="sun" />Suivre le Soleil, <I id="moon" />la lune, une planète, ou un point cardinal</h3>
          <p>
            Dans "Suivi" vous pouvez choisir vers quel point fixer votre scène.</p>
            <ul>
              <li><I id="sun" />La caméra va suivre le soleil. Dans une animation, 
              la caméra va donc faire le tour de l'horizon en 24h, et si le soleil est couché, 
              la caméra va continuer à suivre le soleil sous les pieds de l'observateur.</li>
              <li><I id="moon" />La caméra va suivre la lune. Dans une animation, la caméra va donc se déplacer dans le ciel ou pointer sous les pieds de l'observateur si la lune est couchée.</li>
              <li><I id="mercure" />La caméra va suivre Mercure. </li>
              <li><I id="venus" />La caméra va suivre Vénus. </li>
              <li><I id="mars" />La caméra va suivre Mars. </li>
              <li><I id="jupiter" />La caméra va suivre Jupiter. </li>
              <li><I id="saturne" />La caméra va suivre Saturne. </li>
              <li><I id="uranus" />La caméra va suivre Uranus. </li>
              <li><I id="neptune" />La caméra va suivre Neptune. </li>
              <li><I id="n" />La caméra va rester fixée au Nord, centrée sur l'horizon.</li>
              <li><I id="s" />La caméra va rester fixée au Sud, centrée sur l'horizon.</li>
              <li><I id="e" />La caméra va rester fixée à l'Est, centrée sur l'horizon.</li>
              <li><I id="o" />La caméra va rester fixée à l'Ouest, centrée sur l'horizon.</li>
            </ul>
          <h3><I id="arrow-up" /><I id="arrow-left" /> <I id="center" /><I id="arrow-right" /><I id="arrow-down" />Déplacer le cadre et le suivi avec le pavé directionnel</h3>
          <p>
            Les flèches du pavé directionnel à droite de l'écran permettent de se décentrer autour du point suivi. 
            Le bouton <I id="center" size='small' /> recentre sur l'objet ou le point cardinal que vous avez choisi.
            les déplacements verticaux  ( <I id="arrow-up" size='small' /><I id="arrow-down" size='small' />) est limitée à "haut" du ciel (Altitude 90°), et au bas sous le sol (altitude -90°).
          </p>
            <p>La scène se recentre sur une cible: Soleil, Lune, Mercure à Neptune, ou un azimut cardinal. Idéal pour verrouiller une composition pendant un lever/coucher
            ou suivre un alignement. Le suivi influe sur le repère de navigation et sur le pavé directionnel.
          </p>
          <h3><I id="device" />Cadre photo et capteur</h3>
          <p>
            La zone de rendu est «masquée» par un cadre proportionnel au capteur/l’appareil choisi, avec marges noires minimales.
            Le libellé du boîtier/objectif s’affiche en surimpression pour l’astro‑photo. [CAPTURE]
          </p>

          
        </div>
        <div className="m-0 md:col-span-1">
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
          <figure className="mt-6">
            <img
              src="/img/capture/moontracker-application-direction-1.png"
              alt="Fonction de déplacement de la scène"
              className="w-full h-auto md:w-1/3 rounded-md border border-black/10 shadow-sm"
            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Fonction de déplacement de la scène.
            </figcaption>
          </figure>
        </div>
      </div>

      <h3>Télémétrie d’observation</h3>
      <p>
        En bas, des cartes montrent des angles utiles: orientation du terminateur, fraction de phase, éclairement terrestre, tilt de l’écliptique,
        et estimations d’<strong>éclipse</strong> (chevauchement Soleil/Lune). Idéal pour planifier une session d’observation ou de photographie. [CAPTURE]
      </p>



      <h2>2) Barre supérieure — Suivi, optique, projection, temps</h2>

      

      <h3><I id="device" />Appareil/objectif, <I id="focal" />focale (eq. 24×36) et <I id="fov" />champ de vision</h3>
      <p>
        Choisissez un boîtier ou module (bridge/smartphone) et un zoom/objectif. Le cadre photo se cale au capteur et à la focale.
        En mode «Personnalisé», un unique slider «focale (24×36)» ajuste directement FOV horizontal et vertical. La lecture de la focale est en direct. [CAPTURE]
      </p>

      <h3><I id="projection" />Projections photo & pédagogie</h3>
      <ul>
        <li><I id="recti-panini" />Recti‑Panini (photo ultra‑grand‑angle maîtrisée, lignes droites préservées au centre).</li>
        <li><I id="rectilinear" />Rectilinéaire (perspective photo classique, idéal portraits/tele).</li>
        <li><I id="stereo-centered" />Stéréographique centré (pédagogie du ciel: distances/directions intuitives).</li>
        <li><I id="ortho" />Orthographique (hémisphère all‑sky).</li>
        <li><I id="cylindrical" />Cylindrique et <I id="cylindrical-horizon" />Cylindrique (horizon) pour panoramas.</li>
      </ul>
      <p>L’app choisit automatiquement une projection «idéale» compatible avec votre FOV, que vous pouvez changer à la main si souhaité.</p>

      <h3><I id="datetime" />Date & heure, <I id="speed" />vitesse et temps réel</h3>
      <p>
        Saisissez une date/heure, utilisez ±1h, ou revenez à «Maintenant». La vitesse en <em>minutes par seconde</em> permet d’accélérer
        ou rembobiner le temps (temps réel, accéléré, marche arrière).
      </p>

      <h3><I id="timelapse" />Time‑lapse (pas temporels astronomiques)</h3>
      <p>
        Activez un saut discret par image: minute/heure/jour, <strong>jour sidéral</strong>, <strong>fraction sidérale (orbite Lunaire)</strong> ou
        <strong> fraction synodique (phases)</strong>, et «mois» (UTC). Réglez la période (ms) entre images, le bouclage après N images, et naviguez
        image précédente/suivante. Un label indique la date/heure de départ du time‑lapse. [CAPTURE]
      </p>

      <h3><I id="longpose" />Pose longue (empilement) et <I id="loop" />vider la persistance</h3>
      <p>
        Superpose plusieurs trames pour simuler une pose longue (traînées, lueurs). Ajustez le nombre d’images conservées, et videz à la demande.
        En mode time‑lapse, la progression attend la consolidation de la pose longue pour éviter des manques.
      </p>

      <h3>Visibilité et aides visuelles</h3>
      <ul>
        <li><I id="sun" />Soleil, <I id="moon" />Lune, <I id="planet" />planètes, <I id="stars" />étoiles.</li>
        <li><I id="phase" />Phase de la Lune et <I id="earthshine" />clair de Terre.</li>
        <li><I id="horizon" />Ligne d’horizon, <I id="earth" />sol (Terre), <I id="atmo" />atmosphère.</li>
        <li><I id="refraction" />Réfraction atmosphérique on/off (valeurs géométriques vs apparentes près de l’horizon).</li>
        <li><I id="grid" />Grille de référence, <I id="markers" />marqueurs (réticule), <I id="ecliptic" />écliptique.</li>
        <li><I id="sunCard" />Cardinaux sur le Soleil, <I id="moonCard" />cardinaux locaux sur la Lune/planètes, <I id="debug" />aides de débogage.</li>
        <li>«Agrandir les objets» pour rendre Soleil/Lune lisibles en ultra grand‑angle.</li>
      </ul>

      <h2>3) Barre latérale «Lieux» — globe 3D, villes et coordonnées</h2>

      <h3><I id="globe" />Globe 3D orientable et flèche d’élévation</h3>
      <p>
        Prévisualisez la Terre avec un marqueur sur votre position. Glissez horizontalement pour balayer la longitude. Une flèche indique la direction
        observée (suivi actif), verte au‑dessus de l’horizon, rouge en‑dessous. [CAPTURE]
      </p>

      <h3><I id="location" />Onglet Villes, favoris et navigation</h3>
      <p>
        Liste des villes (filtrée par longitude en l’absence de recherche), recherche instantanée, ajout/suppression de favoris, et navigation «même latitude»
        Est/Ouest. Les pôles sont proposés hors recherche. Les flèches du clavier naviguent dans la liste. [CAPTURE]
      </p>

      <h3><I id="search" />Recherche</h3>
      <p>Tapez quelques lettres (nom de ville/pays) pour filtrer rapidement. La sélection met à jour l’heure locale et le contexte.</p>

      <h3><I id="keyboard" />Raccourcis dans la barre latérale</h3>
      <p>
        Dans «Villes»: flèches Haut/Bas (parcourir), Gauche/Droite (ville suivante/précédente à la même latitude), entrée pour activer.
        Dans «Coordonnées»: flèches N/E/S/O déplacent la position par pas de 100 km.
      </p>

      <h3><I id="location" />Onglet Coordonnées (lat/lon) et déplacements 100 km</h3>
      <p>
        Saisissez directement latitude/longitude (wrap‑around sur les longitudes, garde‑fou aux pôles). Utilisez le pavé NESO pour vous déplacer
        de 100 km. Une mention «Ville proche» indique la grande ville de référence et la direction. [CAPTURE]
      </p>


      <h2>5) Partage, capture, performances</h2>

      <h3><I id="share" />URL partageable complète</h3>
      <p>
        L’URL encode lieu (ou coordonnées), date/heure, suivi, projection, FOV, boîtier/objectif, visibilité (Soleil, Lune, planètes, étoiles, horizon, écliptique, etc.),
        time‑lapse, pose longue et plus. Parfait pour partager une composition d’astro‑photo, un transit ou un lever/coucher précis.
      </p>

      <h3><I id="capture" />Export JPG (presse‑papier + fichier)</h3>
      <p>Copie l’image et télécharge le JPG. L’option est désactivée lorsque l’interface est visible: basculez l’UI pour une capture «propre» du ciel. [CAPTURE]</p>

      <h3>Chargement des modèles 3D</h3>
      <p>
        Les modèles 3D (Lune, Terre, planètes) sont préchargés avec une barre de progression. L’application prépare le relief pour un premier rendu fluide.
        Le premier cadre 3D affiche un «Rendu en cours…» le temps de chauffer le GPU.
      </p>

      <h2>6) Conseils d’astrophotographie et d’observation</h2>
      <ul>
        <li>Utilisez <strong>Recti‑Panini</strong> pour les ultra‑larges (paysages + ciel), <strong>Rectilinéaire</strong> pour les longues focales.</li>
        <li>Activez <strong>réfraction</strong> près de l’horizon pour des hauteurs apparentes crédibles au lever/coucher.</li>
        <li>Servez‑vous de l’<strong>écliptique</strong> pour anticiper les alignements Soleil‑Lune‑planètes.</li>
        <li>La <strong>pose longue</strong> permet de visualiser les traînées ou d’adoucir le bruit des timelapses.</li>
        <li>Les pas <strong>sidéral</strong>/<strong>synodique</strong> du time‑lapse sont parfaits pour suivre la libration et les phases lunaires.</li>
      </ul>

      <h2>Raccourcis et actions rapides</h2>
      <ul>
        <li><I id="keyboard" />Villes: flèches Haut/Bas/Gauche/Droite pour naviguer/faire défiler rapidement.</li>
        <li><I id="keyboard" />Coordonnées: flèches NESO pour des sauts de 100 km (routage aux pôles pris en charge).</li>
        <li><I id="share" />Copier l’URL pour partager une observation reproduisible (éclipses, conjonctions, occultations).</li>
      </ul>

      <p>
        Pour des <strong>exemples prêts à shooter</strong>, voir la <Link to="/info#simulations">page des simulations</Link>.
      </p>
    </article>
  );
}