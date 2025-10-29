
type Example = {
  label: string;
  desc?: string;
  url: string;            // ISO UTC
  img?: string;
  webm?: string;
};



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
      label: 'Éclipse lunaire totale — 2025-03-14 (Paris)',
      desc: 'La Lune traverse la pénombre puis l’ombre terrestre (ombre centrale). Au maximum, elle rougit: la lumière solaire, réfractée par l’atmosphère, est filtrée par diffusion Rayleigh — la Lune voit simultanément toutes les aurores et couchers de Soleil du globe. La teinte/obscurité varient avec la transparence atmosphérique (échelle de Danjon). Observation: sans protection, à l’œil nu ou aux jumelles; un horizon dégagé est utile aux levants/couchants. Photo: pendant la totalité, luminosité très basse — essayez ≈ 1/4 à 2 s, ISO 400–1600, f/4–f/8 selon la focale; hors totalité, revenez à des temps courts. Comparez l’orientation et la vitesse du bord sombre (ombre) avec la simulation.',
      url: '/?tl=2i2p.m55zs0&lp=74&l=5391959&t=m5608o&F=0&p=1&d=nikon-p1000&z=p1000-2000eq&b=aw1z&pl=2&sr=0.0167',
      
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
      label: 'Éclipse solaire annulaire — 2026-08-12 (Palma de Majorque)',
      desc: 'La Lune, trop petite (apogée), ne couvre pas tout le Soleil: un anneau lumineux subsiste. Intérêt: dynamique des contacts d’annularité et orientation du croissant avant/après. Observation: protection OBLIGATOIRE en continu. Astuce: suivez le Soleil, activez l’horizon et la réfraction pour le cadrage bas sur l’horizon.',
      url: '',
      img: ''
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
      desc: 'Au‑delà du cercle polaire, le Soleil reste au‑dessus de l’horizon 24 h au solstice d’été. Dans cette ville de Finlande, le 21 juin, le soleil va se se lever à 3h00, et se coucher à 23h00. Tout au long de cette journée, le soleil va tourner autour de vous. .',
      url: '/?tl=7apt.tgyag0&lp=5xd&l=655194&t=tgyc2c&F=9&p=0&d=VM&z=vm173&b=9hcl&pl=n&sr=2.0167&dh=89.9',
      img: '/img/examples/export-sun-path-north-finland.jpg'
    },
    {
      label: 'Nuit polaire — 21 décembre (Tromsø)',
      desc: 'En hiver, le Soleil ne se lève pas: seuls les crépuscules colorent le ciel. Intérêt: comparer les altitudes négatives du Soleil et la durée des crépuscules. Utilisez Terre ON/OFF pour visualiser la trajectoire sous l’horizon.',
      url: '',
      img: ''
    },
    {
      label: 'Analemme solaire sur 1 an (Quito)',
      desc: 'La figure en “8” résulte de l’obliquité (23,44°) et de l’équation du temps. Intérêt: position du Soleil à midi vrai selon la date. Simulez un point fixe: même lieu, même heure chaque jour (Timelapse jour), projection Recti‑Panini.',
      url: '',
      img: ''
    },
    {
      label: 'Conjonction Vénus–Jupiter — 2025-03-02 (Le Caire)',
      desc: 'Spectaculaire rapprochement crépusculaire. Intérêt: différence d’éclat, trajectoire sur l’écliptique, faible altitude. Suivez Vénus puis Jupiter, activez l’écliptique et comparez diverses focales (grand‑angle vs télé).',
      url: '',
      img: ''
    },
    {
      label: 'Opposition de Mars — 2035-09 (Sydney)',
      desc: 'Mars est plus proche et plus brillante, sa taille apparente culmine. Intérêt: boucle rétrograde autour de l’opposition sur fond d’étoiles. Simulez plusieurs semaines (Timelapse jour), écliptique ON, comparez l’altitude de culminations.',
      url: '',
      img: ''
    },
    {
      label: 'Transit de Mercure — 2032-11-13 (Londres)',
      desc: 'Mercure passe devant le Soleil: minuscule disque sombre. Intérêt: chrono des contacts, orientation sur le disque solaire. Observation: sécurité absolue (filtre certifié). Dans l’appli, suivez le Soleil et zoomez fortement.',
      url: '/?tl=3wn4.wt6xma&lp=5xc&l=2643743&t=wt6tqv&F=0&p=0&d=custom&k=1&f=35w&b=9hg7&pl=a&sr=2.0167&dh=0.11',
      img: '/img/examples/export-mercury-transit-london-2032.jpg'
    },
    {
      label: 'Lever de Pleine Lune au périgée — 2026-11-25 (New York)',
      desc: 'Pleine Lune proche du périgée: disque légèrement plus grand. Intérêt: illusions de taille à l’horizon et compression de perspective au téléobjectif. Activez la réfraction, cadrez un repère urbain et simulez minute par minute.',
      url: '',
      img: ''
    },
    {
      label: 'Libration lunaire sur un mois (Ushuaïa)',
      desc: 'La Lune “bascule” et “respire” (librations en longitude/latitude). Intérêt: voir apparaître/disparaître les bords proches du limbe. Suivez la Lune, pas quotidien, phases ON, et comparez l’orientation du terminateur.',
      url: '',
      img: ''
    },
    {
      label: 'Voie lactée et Croix du Sud — hiver austral (Atacama)',
      desc: 'Ciel sombre exceptionnel: bande galactique, Crux et le “Sac à Charbon”. Intérêt: hauteur du centre galactique et rotation du champ. Utilisez grand‑angle, Atmosphère OFF pour un ciel neutre, Grille ON pour les altitudes.',
      url: '',
      img: ''
    },
    {
      label: 'Traînées circumpolaires — pôle nord céleste (Reykjavík)',
      desc: 'Les étoiles décrivent des arcs autour de Polaris. Intérêt: mesurer la latitude via l’altitude du pôle. Activez Pose longue pour visualiser les arcs; comparez avec une pose au pôle sud céleste depuis l’hémisphère sud.',
      url: '',
      img: ''
    },
    {
      label: 'Inclinaison de l’écliptique au crépuscule d’hiver (Tokyo)',
      desc: 'En hiver boréal, l’écliptique est très inclinée le soir: planètes alignées sur une pente raide. Intérêt: visibilité améliorée de Vénus/Jupiter en début de soirée. Activez l’écliptique et comparez hiver/été.',
      url: '',
      img: ''
    },
    {
      label: 'Équinoxe: ombre d’un gnomon — 2025-03-20 (Nairobi)',
      desc: 'Proche de l’équateur, le Soleil passe presque au zénith: ombre minimale à midi vrai. Intérêt: variation de la longueur/direction de l’ombre dans la journée. Suivez le Soleil, repérez le midi vrai et tracez les altitudes.',
      url: '',
      img: ''
    },
    {
      label: '“Manhattanhenge” — lever/coucher aligné (New York)',
      desc: 'Le Soleil s’aligne avec la trame est‑ouest de Manhattan à quelques dates. Intérêt: angle azimutal exact et hauteur du disque au moment de l’alignement. Simulez autour des dates attendues, horizon ON, projection rectilinéaire.',
      url: '',
      img: ''
    }
    
  ];

  return (
    <article>
      <h1 className="text-xl font-bold">Simulations — Exemples partageables</h1>
      <p>
        Ouvrez chaque lien dans un nouvel onglet pour comparer aux observations réelles. Les paramètres (lieu, date/heure UTC,
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
                </td>
                <td className="py-0 align-top">
                  {ex.desc}<br/>
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