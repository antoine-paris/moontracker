
type Example = {
  label: string;
  desc?: string;
  url: string;            // ISO UTC
  img?: string;
  webm?: string;
};

// Convertit les <br/> éventuels en véritables retours à la ligne
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
      label: 'Transit de Vénus — 2012-06-05/06 (San Francisco)',
      desc: 'Un transit survient quand Vénus, dont l’orbite est inclinée (~3,4°), passe sur un nœud au moment où Terre–Vénus–Soleil sont parfaitement alignés. Les transits apparaissent par paires séparées de 8 ans, elles‑mêmes espacées d’environ 105,5 ou 121,5 ans: c’est donc rarissime. Visuellement, un petit disque noir traverse lentement le Soleil; on distingue quatre contacts (C1–C4) et parfois l’effet de «goutte noire». Sécurité absolue: jamais à l’œil nu; utilisez des lunettes solaires certifiées ISO 12312‑2, un filtre Astrosolar pleine ouverture ou la projection sur écran (jumelles/télescope). Pour comparer à la simulation, notez la trajectoire sur le disque solaire et l’orientation du champ. Photo: trépied, MAP manuelle sur le limbe, ISO bas, vitesses courtes; déclenchez à intervalles réguliers pour documenter la progression; avec un filtre H‑alpha, la chromosphère et les protubérances sont visibles sans changer la géométrie du transit.',
      url: '/?tl=2i2p.m55zs0&lp=74&l=5391959&t=m5608o&F=0&p=1&d=nikon-p1000&z=p1000-2000eq&b=aw1z&pl=2&sr=0.0167',
      img : '/img/examples/export-venus-transit-san-francisco-2012.jpg'
    },
    {
      label: 'Éclipse solaire — 2026-08-12 (Madrid)',
      desc: 'Une éclipse solaire se produit quand la Lune projette son ombre sur la Terre. À Madrid, l’ombre centrale frôle la ville : l’éclipse est partielle à 99.9% (elle sera totale à Coruña, Bilbao, Saragosse, València et Palma de Majorque, visible comme une «morsure» se déplaçant sur le Soleil. La fraction occultée et l’orientation du croissant dépendent de la géométrie locale et de l’heure. Sécurité: protection OBLIGATOIRE en continu (lunettes ISO 12312‑2, filtre solaire sur l’optique). Observation: suivez l’inclinaison du croissant et la trajectoire apparente via différents FOV/projections; sous les arbres, les interstices agissent comme sténopés et projettent des croissants au sol. Photo: mesure manuelle/spot, ISO bas, temps courts; réalisez une série temporelle régulière; en grand‑angle, cadrez le contexte urbain pour raconter la scène.',
      url: '/?tl=2i2p.tjo3a0&lp=5xc&l=6544494&t=tjo3ic&F=0&p=0&d=nikon-p1000&z=p1000-2000eq&b=9hc7&pl=a&sr=0.0167&da=0.15&dh=-0.04',
      img : '/img/examples/export-eclipse-madrid-2026.jpg'
    },
    {
      label: 'Éclipse solaire totale — 2024-04-08 (Dallas)',
      desc: 'Dans la bande de totalité, la Lune couvre entièrement le Soleil pendant quelques minutes. Phases: C1 (premier contact), C2 (entrée en totalité, perles de Baily, anneau de diamant), totalité (corona, protubérances, chromosphère), C3 (sortie de totalité), C4 (dernier contact). Ambiance: chute de luminosité/température, étoiles/planètes visibles, vents locaux. Sécurité: filtre obligatoire avant C2 et après C3; retirer le filtre uniquement pendant la totalité. Observation: privilégiez un site proche de l’axe et un horizon dégagé. Photo: bracketing large (≈ 1/4000 s à ≈ 1 s) pour couvrir perles et corona étendue; MAP sur le limbe; déclenchement télécommandé; utilisez un second boîtier grand‑angle pour l’horizon et la réaction du public.',
      url: '/?tl=2i2o.sbmvgc&lp=5xc&l=4684888&t=sbmw2b&F=0&p=0&d=nikon-p1000&z=p1000-1000eq&b=9hdz&pl=a&sr=3.0167&da=0.15&dh=-0.04',
      img : '/img/examples/export-eclipse-dallas-2024.jpg'
    },
    {
      label: 'Éclipse lunaire totale — 2025-09-08 (Australie)',
      desc: 'La Lune traverse la pénombre puis l’ombre terrestre (ombre centrale). Au maximum, elle rougit: la lumière solaire, réfractée par l’atmosphère, est filtrée par diffusion Rayleigh — la Lune voit simultanément toutes les aurores et couchers de Soleil du globe. La teinte/obscurité varient avec la transparence atmosphérique (échelle de Danjon). Observation: sans protection, à l’œil nu ou aux jumelles; un horizon dégagé est utile aux levants/couchants. Photo: pendant la totalité, luminosité très basse — essayez ≈ 1/4 à 2 s, ISO 400–1600, f/4–f/8 selon la focale; hors totalité, revenez à des temps courts. Comparez l’orientation et la vitesse du bord sombre (ombre) avec la simulation.',
      url: '/?tl=3wn5.t2875e&lp=5xc&g=rhby8kxye&tz=Australia%2FDarwin&t=t2884e&F=1&p=0&d=custom&k=1&f=1fy&b=9hcf&pl=a&sr=-101.041',
      img : '/img/examples/export-red-moon.jpg'
    },
    {
      label: 'Croix du Sud — visibilité australe (Santiago)',
      desc: 'Crux, petite mais très contrastée, domine le ciel austral. Avec α et β Centauri («pointeurs»), elle permet de localiser le pôle sud céleste: prolongez la grande barre ~4,5 fois et croisez avec la bissectrice α–β Centauri. Saison/heure: près de Santiago, Crux est visible de nombreuses nuits, culminant en automne austral; repérez aussi le «Sac à Charbon» (nébuleuse sombre). Observation: ciel sombre, regard tourné vers le sud; apprenez à lire l’orientation de la Croix selon l’heure/saison. Photo: grand‑angle, 10–20 s, ISO 1600–6400; pour des filés, cumulez de longues poses ou utilisez un suivi; comparez l’altitude et la rotation dans la simulation.',
      url: '/?tl=2i2o.skzd40&lp=74&l=3928245&t=slb67m&F=b&p=5&d=custom&k=1&f=2&b=8s7o&pl=n&sr=167.101&da=16.55&dh=33.48',
      img : '/img/examples/export-crux-santiago.jpg'
    },
    {
      label: 'Hauteur méridienne du Soleil au solstice (Reykjavík)',
      desc: 'La hauteur au midi vrai suit h ≈ 90° − |φ − δ| (φ latitude, δ déclinaison solaire). Au solstice d’été (δ ≈ +23,44°), près du cercle arctique, le Soleil reste bas même à midi et les ombres demeurent longues. «Midi vrai» ne coïncide pas toujours avec 12:00 (équation du temps et fuseau). Observation: servez‑vous de la simulation pour repérer l’instant exact; un gnomon (bâton vertical) permet de mesurer l’ombre minimale. Photo: série régulière au même cadrage pour visualiser la variation saisonnière; sécurité indispensable si le disque entre dans le cadre (filtre certifié ou visée indirecte).',
      url: '/?tl=1og5.uh1io0&lp=75&l=3413829&t=uhplc0&F=b&p=5&d=custom&k=1&f=2&b=8s6t&pl=n&sr=0.0167&dh=31.91',
      img : '/img/examples/export-sun-noon-reykjavik.jpg'
    },
    {
      label: 'Étoile polaire et Croix du Sud visibles en même temps (Équateur)',
      desc: 'À ~0° de latitude, les deux pôles célestes rasent l’horizon: Polaris très basse au nord, Crux effleurant le sud selon la saison. Les champs tournent en sens opposés autour de leurs pôles respectifs. Observation: privilégiez des horizons nord/sud dégagés et une nuit claire (les équinoxes offrent souvent un bon compromis). La turbulence près de l’horizon peut dégrader la netteté. Photo: time‑lapse ou poses longues pour montrer la rotation inverse; grand‑angle pour inclure les deux horizons; sans suivi si vous cherchez des filés, sinon empilez des poses courtes. Comparez les altitudes instantanées et l’angle de rotation dans la simulation.',
      url: '/?tl=1og5.tczxg0&lp=75&lat=0.000000&lng=-80.712710&tz=America%2FGuayaquil&t=tdcw40&F=b&p=0&d=VM&z=vm173&b=8s7p&pl=n&sr=0.0167&da=-51.76&dh=89.9',
      img : '/img/examples/export-polaris-crux-equador.jpg'
    },
    {
      label: 'Éclipse solaire annulaire - cercle de feu — 2024-10-02 (Océan pacifique)',
      desc: 'La Lune, trop petite (apogée), ne couvre pas tout le Soleil: un anneau lumineux subsiste. Intérêt: dynamique des contacts d’annularité et orientation du croissant avant/après. Observation: protection OBLIGATOIRE en continu. Astuce: suivez le Soleil, activez l’horizon et la réfraction pour le cadrage bas sur l’horizon.',
      url: '/?tl=1iis.skq100&lp=5xc&g=3e1ery7k6&tz=America%2FSantiago&t=skqs9f&F=0&p=0&d=custom&k=1&f=kr&b=5z0n&pl=n&sr=1.0167',
      img: '/img/examples/export-eclipse-annulaire-2024.jpg'
    },
    {
      label: 'La drôle d\'orbite de Mercure',
      desc: 'Mercure, petite et proche du Soleil, suit l’orbite la plus excentrique (e ≈ 0,206) et inclinée (~7°) des planètes internes. Sa vitesse varie fortement: elle accélère au périhélie et ralentit à l’aphélie. Les perturbations planétaires font tourner son ellipse (précession du périhélie) et la relativité générale ajoute 43″/siècle — clé qui a résolu le «mystère» laissé par la mécanique newtonienne. Le timelapse «un point par jour à midi» met en scène ses allongements est/ouest (période synodique ~116 j), la hauteur qui change avec la saison et l’inclinaison de l’écliptique, et des boucles asymétriques dues à l’excentricité. Astuce d’observation: planète furtive, visible près de l’horizon au crépuscule ou à l’aube lors des grands allongements; activez l’écliptique et la réfraction dans la simulation — et ne regardez jamais le Soleil sans protection.',
      url: '/?tl=1og5.t5ieo0&lp=5xd&l=2988507&t=t5z2o0&F=0&p=5&d=custom&k=1&f=r&b=35vp&pl=1&sr=1.0167',
      img: '/img/examples/export-mercury-dance.jpg'
    },
    {
      label: 'Eclipse du 29 mai 1919, confirmation de la relativité générale',
      desc: 'Ce jour-là, pendant une éclipse solaire totale observée depuis l\'île de Príncipe (golfe de Guinée) et Sobral (Brésil), les équipes dirigées notamment par Arthur Eddington ont mesuré la déviation de la lumière des étoiles passant près du Soleil. La quantité de déviation observée correspondait à la prédiction de la relativité générale d\'Einstein, et non à celle de la physique newtonienne. Cela a été considéré comme la première grande confirmation expérimentale de sa théorie, et a rendu Einstein mondialement célèbre.',
      url: '/?tl=1og4.-qelao0&lp=5xc&g=s0m1ryjyn&tz=Africa%2FMalabo&t=-qel6g4&F=0&p=5&d=custom&k=1&f=1k&b=2t6v&pl=n&sr=2.0167',
      img: '/img/examples/export-eclipse-eddington-1919.jpg'
    },
    {
      label: 'Soleil de (presque) minuit — 21 juin (Jyvaeskylae - Finlande)',
      desc: 'Au‑delà du cercle polaire, le Soleil reste au‑dessus de l’horizon 24 h au solstice d’été. Dans cette ville de Finlande, le 21 juin, le soleil va se se lever (au nord) à 2h30, et se coucher (au nord) à 23h00. Tout au long de cette journée, le soleil va tourner autour de vous.',
      url: '/?tl=7apt.tgyag0&lp=5xd&l=655194&t=tgyc2c&F=9&p=0&d=VM&z=vm173&b=9hcl&pl=n&sr=2.0167&dh=89.9',
      img: '/img/examples/export-sun-path-north-finland.jpg'
    },
    {
      label: 'Soleil de (presque) minuit — 21 juin (Jyvaeskylae - Finlande)',
      desc: 'Une autre vue du soleil qui semble tourner autour de nous le 21 juin à Jyvaeskylae, Finlande, au‑delà du cercle polaire où le Soleil reste au‑dessus de l’horizon 24 h au solstice d’été. Dans cette ville de Finlande, le 21 juin, le soleil va se se lever (au nord) à 2h30, et se coucher (au nord) à 23h00. Tout au long de cette journée, le soleil va tourner autour de vous.',
      url: '/?tl=7aps.tgyc2c&lp=5xd&l=655194&t=tgyhou&F=0&p=5&d=custom&k=1&f=7&b=9hh1&pl=n&sr=30.0167&dh=-20.61',
      img: '/img/examples/export-sun-path-north-finland-2.jpg'
    },
    {
      label: 'Nuit polaire — 21 décembre (Jyvaeskylae - Finlande)',
      desc: 'Au‑delà du cercle polaire, le Soleil reste couché 24 h au solstice d’hiver. Dans cette ville de Finlande, le 21 décembre, le soleil ne va se lever (au sud) à 9h00 et se coucher (au sud) à 15h00. Cette courte journée ne sera finalement qu\'un long lever et coucher de soleil.',
      url: '/?tl=7apt.tqdvg0&lp=5xd&l=655194&t=tqdxj0&F=b&p=0&d=custom&k=1&f=r&b=9hdh&pl=n&sr=2.0167',
      img: '/img/examples/export-sun-path-south-finland.jpg'
    },
    {
      label: 'Analemme solaire sur 1 an (Quito)',
      desc: 'La figure en “8” résulte de l’obliquité (23,44°) et de l’équation du temps. Intérêt: position du Soleil à midi vrai selon la date. Simulez un point fixe: même lieu, même heure chaque jour (Timelapse jour), projection Recti‑Panini.',
      url: '/?tl=1og5.wer5w0&lp=5xd&l=3652462&t=ts9b80&F=b&p=0&d=custom&k=1&f=1&b=9nsl&pl=n&sr=30.0167&da=-34.73&dh=89.9',
      img: '/img/examples/export-sun-noon-8-quito.jpg'
    },
    {
      label: 'Conjonction Vénus–Jupiter — 2025-08-25 (Paris)',
      desc: 'Spectaculaire rapprochement matinal. Intérêt: différence d’éclat, trajectoire sur l’écliptique, faible altitude. Suivez Vénus puis Jupiter, activez l’écliptique et comparez diverses focales (grand‑angle vs télé).',
      url: '/?tl=1og4.ts9b80&lp=5xc&l=2988507&t=t0v4g0&F=5&p=0&d=oeil&z=human&b=94vr&pl=a&sr=30.0167&dh=-10.89',
      img: '/img/examples/export-venus-jupiter-conjonction-2025.jpg'
    },
    {
      label: 'Conjonction Vénus–Jupiter — 2025-08-25 (Paris) - Teleobjectif',
      desc: 'Spectaculaire rapprochement matinal. Intérêt: différence d’éclat, trajectoire sur l’écliptique, faible altitude. Suivez Vénus puis Jupiter, activez l’écliptique et comparez diverses focales (grand‑angle vs télé).',
      url: '/?tl=1og4.ts9b80&lp=5xc&l=2988507&t=t0v4g0&F=5&p=0&d=custom&k=1&f=7r&b=al13&pl=a&sr=30.0167&da=0.37&dh=-0.4',
      img: '/img/examples/export-venus-jupiter-conjonction-zoomed-2025.jpg'
    },
    {
      label: 'Conjonction Vénus–Jupiter — 2025-08-25 (Paris) - Animation',
      desc: 'Spectaculaire rapprochement matinal. Dans cette version le sol est transparent et les objets agrandits.',
      url: '/?tl=sd8h.t0qzdc&lp=5xc&l=2988507&t=t0r8mo&F=5&p=0&d=custom&k=1&f=9k&b=f5z&pl=a&sr=30.0167',
      img: '/img/examples/export-venus-jupiter-conjonction-timelapse-2025.jpg'
    },
    {
      label: 'Opposition de Mars — 2035-09 (Sydney)',
      desc: 'Mars est plus proche et plus brillante, sa taille apparente culmine. Intérêt: boucle rétrograde autour de l’opposition sur fond d’étoiles. Simulez plusieurs semaines (Timelapse jour), écliptique ON, comparez l’altitude de culminations.',
      url: '/?tl=uit0jp.y7axg0&lp=5xc&l=2147714&t=y7ghg0&F=4&p=0&d=custom&k=1&f=1&b=2hg7&pl=a&sr=30.0167',
      img: '/img/examples/export-mars-opposition-sydney-2035.jpg'
    },
    {
      label: 'Opposition de Mars — 2035-09 à la lunette astro (taille réelle)',
      desc: 'Mars est plus proche et plus brillante, sa taille apparente culmine. Intérêt: boucle rétrograde autour de l’opposition sur fond d’étoiles. Simulez plusieurs semaines (Timelapse jour), écliptique ON, comparez l’altitude de culminations.',
      url: '/?tl=uit0jp.y7ghg0&lp=5xc&l=2147714&t=yb9is0&F=4&p=0&d=astro-1inch&z=sct-6-1500&b=24t3&pl=a&sr=30.0167',
      img: '/img/examples/export-mars-opposition-sydney-astrocam-2035.jpg'
    },
    {
      label: 'Transit de Mercure — 2032-11-13 (Londres)',
      desc: 'Mercure passe devant le Soleil: minuscule disque sombre. Intérêt: chrono des contacts, orientation sur le disque solaire. Observation: sécurité absolue (filtre certifié). Dans l’appli, suivez le Soleil et zoomez fortement.',
      url: '/?tl=3wn4.wt6xma&lp=5xc&l=2643743&t=wt6tqv&F=0&p=0&d=custom&k=1&f=35w&b=9hg7&pl=a&sr=2.0167&dh=0.11',
      img: '/img/examples/export-mercury-transit-london-2032.jpg'
    },
    {
      label: 'Lever de Pleine Lune au périgée — 2026-11-24 (New York) - Temps réel au smartphone',
      desc: 'Pleine Lune proche du périgée: disque légèrement plus grand. Intérêt: illusions de taille à l’horizon et compression de perspective au téléobjectif. Activez la réfraction, cadrez un repère urbain et simulez minute par minute.',
      url: '/?tl=uit0jk.tp0z3k&lp=5xc&l=5128581&t=tp0zab&F=1&p=5&d=galaxy-s21u&z=sd30&b=5z03&pl=a&sr=0.0167',
      img: '/img/examples/export-pleine-lune-perigee-new-york-2026.jpg'
    },
    {
      label: 'Libration lunaire (Style Nasa)',
      desc: 'La Lune “bascule” et “respire” (librations en longitude/latitude). La Nasa utilise les photos de ses satélites pour le montrer. Dans cette application nous nous plaçons au pôle nord, rendons la terre transparente, et alignons notre smartphone avec l’écliptique. Nous faisons une photo chaque jour lunaire (28j) pendant plusieurs années...',
      url: '/?tl=v2s7bh.t52l80&lp=5xc&g=upcrvxb65&tz=Etc%2FUTC&t=vo7rks&F=1&p=5&d=galaxy-s21u&z=sd30&b=dl3&pl=a&sr=360',
      webm: '/img/examples/video-moon-libration.webm'
    },
    {
      label: 'Libration de saturne',
      desc: 'Saturne ne nous montre pas toujours le même visage: son axe est incliné de 27° et sa position par rapport à la Terre varie. En combinant ces deux effets, nous voyons alternativement les hémisphères nord et sud, ainsi que les anneaux sous différents angles. Dans cette application, nous nous plaçons au pôle nord, rendons la terre transparente, et alignons notre smartphone avec l’écliptique. Nous faisons une photo chaque jour sidéral (23h56m) pendant plusieurs années...',
      url: '/?tl=ebk5.ol9ojc&lp=5xc&g=upcrvxb65&tz=Etc%2FUTC&t=s3t8jc&F=6&p=0&d=nikon-p1000&z=p1000-2000eq&b=e85&pl=g&sr=0.0167',
      webm: '/img/examples/video-saturn-libration.webm'
    },
    {
      label: 'Voie lactée et Croix du Sud — hiver austral (Atacama)',
      desc: 'Ciel sombre exceptionnel: bande galactique, Crux et le “Sac à Charbon”. Intérêt: hauteur du centre galactique et rotation du champ. Utilisez grand‑angle, Atmosphère OFF pour un ciel neutre, Grille ON pour les altitudes.',
      url: '/?tl=v2s7b4.vo7rks&lp=5xc&l=3899539&t=sy6bjw&F=b&p=0&d=custom&k=1&f=1&b=6odx&pl=n&sr=5.0167&dh=37.84',
      img: '/img/examples/export-crux-atacama.jpg'
    },
    {
      label: 'Pourquoi les "planètes" s\'appellent-elles ainsi?',
      desc: 'Le terme "planète" vient du grec "planetes", qui signifie "errant". Cela fait référence au mouvement des planètes par rapport aux étoiles fixes. Nos anciens ont mis des siècles pour comprendre ces mouvements complexes (et finalement réaliser que le soleil était le centre du système), notamment les boucles rétrogrades observées depuis la Terre (quand la planète ralentit et fait marche arrière avant de reprendre sa course). Dans l\'application, nous prenons une photo par jour sidéral (quand notre position se réaligne avec les mêmes étoiles toutes les 23h 56m 4s). Nous observons alors les mouvements des planètes par rapport aux étoiles fixes, mettant en évidence leur nature "errante".',
      url: '/?tl=-teqghl.s6l39p&lp=5xc&l=3110876&t=s793kh&F=9&p=0&d=VM&z=vm173&b=9hec&pl=a&sr=-6.9833&da=34.73&dh=89.9',
      img: '/img/examples/export-planetes-errantes.jpg'
    },
    {
      label: 'Le soleil au centre',
      desc: 'Nos anciens ont mis des siècle à comprendre: l\'héliocentrisme (qui place le soleil au centre des planètes) et la relativité (qui fait courber l\'espace par la masse du soleil). Avec cette application, ces deux phénomènes deviennent intuitifs : il nous suffit de rendre le sol transparent, de pointer vers le soleil, et de prendre une photo par jour pendant plusieurs années. On voit clairement se dessiner l\'attraction du soleil sur les Planetes, et la courbure de leurs trajectoires en sinusoïde.',
      url: '/?tl=-6z.uikx40.1e.1.15o&lp=5xd&l=524901&t=usgh40&F=0&p=0&d=custom&k=1&f=1&b=5z0l&pl=u&sr=214.852&dh=-14.19',
      img: '/img/examples/export-planet-dance.jpg'
    },
    {
      label: 'Le soleil au centre (5 ans en 30 secondes)',
      desc: 'Sur le même principe (une photo par jour, sans sol ni athmosphère), voici une vidéo produite avec l\'application.<br/> Lancez vous et créez vos propres animations!!!!',
      url: '/?tl=1iit.usgh40&lp=5xc&l=2988507&t=wad7s0&F=0&p=0&d=custom&k=1&f=1&b=5z2d&pl=a&sr=214.852',
      webm: '/img/examples/video-sun-dance.webm'
    },

  ];

  return (
    <article>
      <h1 className="text-xl font-bold">Quelques simulations et exemples</h1>
      <p>
        Ouvrez chaque lien pour comparer aux observations réelles. Les paramètres (lieu, date/heure UTC,
        cible suivie, projection, FOV) sont encodés dans l’URL.
      </p>

      {examples.map((ex) => (
        <div key={ex.label}>
          <h2 className="text-lg font-semibold">{ex.label}</h2>
          <p>
          <table className="w-full border-collapse" aria-label="Simulations — Exemples partageables">
            <tbody>
              <tr key={ex.label} className="align-top border-b last:border-0">
                <td className="pr-4 w-120 py-0 align-top">
                  {ex.img && (
                    <img
                      src={ex.img}
                      alt={ex.label}
                      className="w-120 h-auto object-cover rounded block p-0 !my-0"
                    />
                  )}
                  {ex.webm && (
                    <video
                      controls
                      preload="metadata"
                      playsInline
                      className="w-auto max-w-full h-auto rounded-md border border-black/10 shadow-sm  p-0 !my-0"
                    >
                      <source src={ex.webm} type="video/webm" />
                      Votre navigateur ne supporte pas la lecture de vidéos WebM.
                    </video>
                  )}
        
                </td>
                <td className="py-0 align-top">
                  {renderDesc(ex.desc)}<br/>
                  
                  <a
                    href={ex.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Ouvrir la simulation
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
          </p>
        </div>
      ))}

      <p className="text-gray-500 text-sm mt-2">
        
      </p>
    </article>
  );
}