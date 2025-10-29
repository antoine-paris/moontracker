export default function MoonTrackerTab() {
  const ldSoftware = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'MoonTracker',
    applicationCategory: 'EducationalApplication',
    applicationSubCategory: 'Astronomy simulator, Astrophotography planner',
    operatingSystem: 'Web',
    url: 'https://github.com/antoine-paris/moontracker',
    license: 'https://opensource.org/licenses/MIT',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    description:
      'MoonTracker est un simulateur astronomique 3D en temps réel et un planificateur d’astrophotographie : Soleil, Lune, planètes, phases, libration, projections grand-angle (Recti‑Panini, Stéréographique, Orthographique, Rectilinéaire, Cylindrique), timelapse, pose longue, cadre photo et export.',
    keywords:
      'simulateur ciel, simulateur astronomique, astrophotographie, éclipse, phases de la Lune, timelapse, recti-panini, projection stéréographique, horizon, FOV, champ de vision, cadre photo',
    featureList: [
      'Projections grand-angle photo: Recti‑Panini, Stéréographique centré, Orthographique, Rectilinéaire, Cylindrique',
      'Suivi intelligent: Soleil, Lune, planètes ou points cardinaux; alignement horizon/écliptique',
      'Rendu 3D de la Lune: phases fidèles, libration, clair de Terre, orientations du terminateur',
      'Timelapse multi-échelles: minute, heure, jour, jour sidéral, mois, cycles lunaires',
      'Pose longue en temps réel (empilement): traînées et visualisations de trajectoires',
      'Simulation d’optique: capteurs, focales équiv. 24×36, FOV H/V, cadre photo 3:2/16:9',
      'Réfraction atmosphérique, grille alt/az, écliptique, marqueurs et cardinaux locaux',
      'Partage par URL (état complet), export PNG, enregistrement vidéo .webm',
    ],
  };

  const ldFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'MoonTracker est-il gratuit ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            "Oui. L'application est open‑source (licence MIT) et utilisable gratuitement dans un navigateur moderne.",
        },
      },
      {
        '@type': 'Question',
        name: 'Puis-je exporter une vidéo ou une image ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            "Oui. Export image (PNG/copier) et enregistrement vidéo au format .webm directement depuis l'interface.",
        },
      },
      {
        '@type': 'Question',
        name: 'Les projections photo grand-angle sont-elles supportées ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            "Oui. Recti‑Panini, Stéréographique centré, Orthographique, Rectilinéaire et Cylindrique, adaptées aux très grands FOV.",
        },
      },
      {
        '@type': 'Question',
        name: 'La simulation prend-elle en compte la réfraction et les phases ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            "Oui. Réfraction atmosphérique optionnelle proche de l’horizon, phases fidèles, libration et clair de Terre.",
        },
      },
    ],
  };

  return (
    <article itemScope itemType="https://schema.org/SoftwareApplication">
      {/* Données structurées SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldSoftware) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldFaq) }}
      />

      <h1 itemProp="name">MoonTracker — Simulateur astronomique 3D et planificateur d’astrophotographie</h1>
      <p itemProp="description">
        Visualisez le ciel en temps réel (Soleil, Lune, planètes, étoiles) avec phases, tailles apparentes, libration,
        projections grand‑angle et outils photo. Planifiez une éclipse, un lever/coucher, un transit ou une session
        d’astro‑photo avec précision, puis partagez et exportez vos scènes.
      </p>
      <p>
        Gratuit • Open‑source • Sans inscription • Fonctionne dans le navigateur (desktop/mobile modernes)
      </p>

      <h2>Pourquoi MoonTracker ?</h2>
      <ul>
        <li>Comprendre et expliquer visuellement les phénomènes (phases, écliptique, hauteurs, libration).</li>
        <li>Préparer des prises de vue crédibles: FOV, capteurs, focales, cadre 3:2/16:9, projections adaptées.</li>
        <li>Créer des démonstrations percutantes: timelapse, pose longue, export image/vidéo et lien partageable.</li>
      </ul>

      <h2>Fonctionnalités innovantes</h2>
      <ul>
        <li>
          Projections grand‑angle orientées photo (Recti‑Panini, Stéréographique, Orthographique, Rectilinéaire, Cylindrique)
          pour conserver une lecture naturelle jusqu’aux très grands FOV.
        </li>
        <li>
          Suivi intelligent d’objets et alignement de cadre (Horizon/Écliptique) pour comparer facilement altitudes et
          conjonctions.
        </li>
        <li>
          Rendu 3D de la Lune avec libration, phase, clair de Terre et orientation du terminateur pour une pédagogie fidèle.
        </li>
        <li>
          Timelapse multi‑échelles (minute → cycles lunaires) et pose longue avec empilement pour visualiser des mouvements
          sur des jours, mois ou années.
        </li>
        <li>
          Simulation d’optique complète: capteurs, focale équivalente 24×36, FOV H/V, cadre photo 3:2 et repères 16:9.
        </li>
        <li>
          Physique du ciel configurable: réfraction proche de l’horizon, grille alt/az, écliptique, marqueurs et cardinaux locaux.
        </li>
        <li>
          Partage instantané par URL (état complet), capture PNG/copier, enregistrement vidéo .webm pour diffuser vos scènes.
        </li>
      </ul>

      <h2>Cas d’usage</h2>
      <ul>
        <li>Préparer une éclipse ou un alignement planétaire depuis un lieu précis.</li>
        <li>Comparer plusieurs focales et projections pour une composition grand‑angle crédible.</li>
        <li>Montrer la danse de Vénus/Mercure, les saisons du Soleil ou la libration lunaire en timelapse.</li>
      </ul>

      <p>
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
      </p>
      
      <h2>FAQ</h2>
      <p>
      <details>
        <summary>MoonTracker est‑il gratuit ?</summary>
        <p>Oui, open‑source sous licence MIT, utilisable gratuitement dans un navigateur moderne.</p>
      </details>
      <details>
        <summary>Puis‑je exporter une vidéo ou une image ?</summary>
        <p>Oui, export image (PNG/copier) et enregistrement vidéo .webm intégrés.</p>
      </details>
      <details>
        <summary>Les projections grand‑angle sont‑elles supportées ?</summary>
        <p>Oui: Recti‑Panini, Stéréographique centré, Orthographique, Rectilinéaire, Cylindrique.</p>
      </details>
      <details>
        <summary>La simulation inclut‑elle la réfraction et les phases ?</summary>
        <p>Oui: réfraction atmosphérique optionnelle, phases fidèles, libration et clair de Terre.</p>
      </details>
      </p>
      <h2>Open‑source et crédits</h2>
      <p>
        Code source: <a href="https://github.com/antoine-paris/moontracker" target="_blank" rel="noopener noreferrer" itemProp="url">GitHub</a> —
        licence <span itemProp="license">MIT</span>. Stack: React, TypeScript, Vite, Tailwind, three.js, @react-three/fiber,
        astronomy-engine, Natural Earth, etc.
      </p>
    </article>
  );
}