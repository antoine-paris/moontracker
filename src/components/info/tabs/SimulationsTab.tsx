
export default function SimulationsTab() {
  const examples: Example[] = [
    {
      label: 'Transit de Vénus — 2012-06-05/06 (San Francisco)',
      desc: 'Dernier transit visible depuis le Pacifique/Amérique du Nord.',
      url: '/?tl=2i2p.m55zs0&lp=74&l=5391959&t=m5608o&F=0&p=1&d=nikon-p1000&z=p1000-2000eq&b=aw1z&pl=2&sr=0.0167',
      img : '/img/examples/export-venus-transit-san-francisco-2012.jpg'
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
            {ex.desc && <div className="text-gray-600 mb-1">{ex.desc}</div>}
            <a
              href={ex.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Ouvrir la simulation
            </a>
          </li>
        ))}
      </ul>
      <p className="text-gray-500 text-sm">
        Astuce: ajustez ensuite la ville, la date/heure ou la projection, puis recopiez l’URL pour partager votre configuration.
      </p>
    </article>
  );
}