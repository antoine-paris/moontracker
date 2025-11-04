import React, { lazy, Suspense, useEffect, useState } from 'react';
const FlatEarthSimulator = lazy(() => import('./FlatEarthSimulator/FlatEarthSimulator'));

// Simple ErrorBoundary pour intercepter un échec de montage du Canvas/lazy
class ErrorBoundary extends React.Component<{ onRetry?: () => void }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', color: '#fff', background: '#0b1020', flexDirection: 'column'
        }}>
          <div>Une erreur est survenue lors du chargement du simulateur.</div>
          <button onClick={this.props.onRetry} style={{ marginTop: 10 }}>Réessayer</button>
        </div>
      );
    }
    return this.props.children as any;
  }
}

export default function FlatEarthTab() {
  const [reloadKey, setReloadKey] = useState(0);

  // Précharger le module pour éviter le "cold start" du lazy
  useEffect(() => {
    import('./FlatEarthSimulator/FlatEarthSimulator').catch(() => {});
  }, []);

  return (
    <article>
      <h1>Explorer les modèles de la Terre : Une invitation à l'observation</h1>
      
      <h2>Chapitre 1  : Les modèles de Terre plate - Ce qu'ils expliquent... et ce qu'ils n'expliquent pas</h2>
      
      <h3>Le modèle de base : la Terre-disque</h3>
      <p>
        Imagine une grande crêpe posée sur une table. C'est l'image la plus simple d'une Terre plate : un disque plat 
        avec le pôle Nord au centre (comme le moyeu d'une roue de vélo) et l'Antarctique formant un mur de glace 
        tout autour du bord (comme le pneu de cette roue).
      </p>
      {/* Container pour le simulateur avec hauteur fixe */}
      <div style={{ 
        width: '100%', 
        height: '600px', 
        position: 'relative',
        border: '2px solid #333',
        borderRadius: '10px',
        overflow: 'hidden',
        marginBottom: '20px',
        backgroundColor: '#0b1020' // fond sombre stable
      }}>
        <ErrorBoundary onRetry={() => setReloadKey(k => k + 1)}>
          <Suspense fallback={
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              fontSize: '20px',
              color: '#fff',
              background: '#0b1020'
            }}>
              ⏳ Chargement du simulateur 3D...
            </div>
          }>
            <FlatEarthSimulator key={reloadKey} />
          </Suspense>
        </ErrorBoundary>
      </div>

      <p>Dans ce modèle :</p>
      <ul>
        <li><strong>Le Soleil et la Lune</strong> sont de petites boules (environ 50 km de diamètre) qui tournent en cercle au-dessus du disque, à environ 5000 km d'altitude</li>
        <li><strong>Le jour et la nuit</strong> s'expliquent parce que le Soleil agit comme un projecteur : il n'éclaire qu'une zone limitée du disque</li>
        <li><strong>Les saisons</strong> arrivent parce que le Soleil change de cercle : il tourne plus près du centre en été de l'hémisphère nord, et plus près du bord en hiver</li>
      </ul>
      
      <h3>Les variations du modèle</h3>
      <p>Comme une recette de gâteau qu'on modifie, il existe plusieurs versions :</p>
      
      <p><strong>Version "dôme"</strong> : Une sorte de cloche en verre (le "firmament") recouvre tout le disque. Les étoiles sont collées sur ce dôme qui tourne. C'est comme un planétarium géant !</p>
      
      <p><strong>Version "accélération"</strong> : Pour expliquer pourquoi les objets tombent, certains disent que le disque accélère vers le haut à 9,8 m/s². Imagine être dans un ascenseur qui monte de plus en plus vite : tu te sens poussé vers le sol. Problème : après un an à cette vitesse, on dépasserait la vitesse de la lumière !</p>
      
      <p><strong>Version "électromagnétique"</strong> : Le Soleil et la Lune sont des sortes de lampes qui se déplacent grâce à des forces magnétiques mystérieuses au-dessus du disque.</p>
      
      <h3>Ce que ces modèles expliquent bien</h3>
      <ul>
        <li><strong>L'horizon plat</strong> : Quand tu regardes l'océan, il semble effectivement plat</li>
        <li><strong>Le Soleil qui "monte" et "descend"</strong> : On le voit bien monter le matin et descendre le soir</li>
        <li><strong>Les fuseaux horaires</strong> : Différentes zones du disque sont éclairées à différents moments</li>
      </ul>
      
      <h3>Les gros problèmes non résolus</h3>
      <p>Malheureusement, ces modèles coincent sur beaucoup de choses :</p>
      
      <p><strong>Le problème du Soleil de minuit</strong> : En Antarctique (le supposé "mur de glace"), il y a des bases scientifiques où le Soleil tourne dans le ciel sans se coucher pendant des mois. Sur un disque avec l'Antarctique au bord, c'est impossible ! Le Soleil devrait parcourir tout le périmètre du disque en 24h - il devrait voler à plus de 35 000 km/h !</p>
      
      <p><strong>Le problème des distances</strong> : Sur une carte de Terre plate, l'Australie devrait être étirée comme un chewing-gum. Un vol Sydney-Perth devrait prendre le double du temps réel. Spoiler : ce n'est pas le cas !</p>
      
      <p><strong>Le problème de la gravité</strong> : Sur un disque, la gravité devrait tirer les objets vers le centre du disque. Si tu lâches une balle à Buenos Aires, elle devrait tomber en diagonale vers le pôle Nord !</p>
      
      <p><strong>Le problème des étoiles du Sud</strong> : Des gens en Australie, en Afrique du Sud et en Argentine voient tous la même Croix du Sud au même moment, dans la direction du sud. Sur un disque, ils devraient regarder dans trois directions totalement différentes !</p>
      
      <p><strong>Le problème des éclipses</strong> : Qu'est-ce qui passe devant le Soleil lors d'une éclipse solaire si la Lune est toujours au-dessus du disque ? Et comment la Lune devient-elle rouge lors d'une éclipse lunaire ?</p>
      
      <h2>Chapitre 2 : Des milliers d'années d'observations - L'histoire de la Terre sphérique</h2>
      
      <h3>Les Grecs anciens : les premiers détectives</h3>
      
      <p><strong>Vers 500 avant J.-C. - Pythagore</strong> : Ce mathématicien (oui, celui du théorème !) remarque que les navires disparaissent coque d'abord à l'horizon, puis les voiles. Comme s'ils descendaient une colline invisible !</p>
      
      <p><strong>Vers 350 avant J.-C. - Aristote</strong> : Il compile les preuves :</p>
      <ul>
        <li>L'ombre de la Terre sur la Lune pendant les éclipses est toujours ronde</li>
        <li>On voit différentes étoiles en voyageant vers le nord ou le sud</li>
        <li>Tous les objets célestes (Lune, planètes) sont des sphères, pourquoi pas la Terre ?</li>
      </ul>
      
      <p><strong>Vers 240 avant J.-C. - Ératosthène</strong> : Le champion ! Il mesure la circonférence de la Terre avec juste des bâtons et des ombres ! À Syène (Assouan aujourd'hui), le Soleil éclaire le fond des puits à midi le jour du solstice d'été. Le même jour à Alexandrie, 800 km plus au nord, les objets font une ombre. En mesurant l'angle de cette ombre (7,2°), il calcule : 7,2° c'est 1/50 d'un cercle, donc la Terre fait 50 × 800 = 40 000 km de tour. Bingo ! C'est la bonne réponse !</p>
      
      <h3>Le Moyen Âge : on n'a jamais cru que la Terre était plate !</h3>
      
      <p><strong>Contrairement au mythe</strong>, les savants médiévaux savaient que la Terre était ronde :</p>
      
      <p><strong>Bède le Vénérable (673-735)</strong> : Ce moine anglais explique les marées par l'attraction de la Lune et décrit la Terre comme une sphère.</p>
      
      <p><strong>Al-Biruni (973-1048)</strong> : Ce savant persan recalcule le rayon de la Terre et obtient 6339,6 km (le vrai : 6371 km). Pas mal pour l'époque !</p>
      
      <p><strong>Thomas d'Aquin (1225-1274)</strong> : Le plus grand philosophe médiéval utilise la rotondité de la Terre comme exemple de vérité scientifique évidente.</p>
      
      <h3>Les grandes explorations : la preuve par le voyage</h3>
      
      <p><strong>1519-1522 - Magellan</strong> : Son expédition fait le premier tour complet de la Terre. Ils partent vers l'ouest et reviennent par l'est. Difficile à faire sur un disque !</p>
      
      <p><strong>Les navigateurs</strong> : Tous utilisent les étoiles pour naviguer. La hauteur de l'étoile Polaire au-dessus de l'horizon donne directement la latitude (la distance au nord de l'équateur). Ça ne marche que sur une sphère !</p>
      
      <h3>L'ère moderne : les preuves s'accumulent</h3>
      
      <p><strong>1851 - Pendule de Foucault</strong> : Ce pendule géant montre la rotation de la Terre. Il change de direction de balancement selon la latitude. Au pôle, il fait un tour complet en 24h. À Paris, en 32h. À l'équateur, il ne tourne pas. Exactement ce qu'on attend d'une sphère qui tourne !</p>
      
      <p><strong>Les fuseaux horaires</strong> : Créés en 1884, ils divisent la Terre en 24 tranches. Le Soleil se lève à l'est et parcourt 15° par heure (360° ÷ 24h). Ça colle parfaitement avec une Terre sphérique qui tourne.</p>
      
      <h3>Aujourd'hui : des milliers de preuves indépendantes</h3>
      <ul>
        <li><strong>Les satellites</strong> : Plus de 5000 en orbite, appartenant à 70 pays différents</li>
        <li><strong>L'ISS</strong> : Des astronautes de 20 nations l'ont visitée</li>
        <li><strong>GPS</strong> : Ton téléphone utilise des satellites. Les calculs ne fonctionnent qu'avec une Terre sphérique</li>
        <li><strong>Les compagnies aériennes</strong> : Elles économisent des millions en carburant grâce aux routes "grand cercle" (le plus court chemin sur une sphère)</li>
        <li><strong>Les radioamateurs</strong> : Des millions de passionnés communiquent en faisant rebondir les ondes sur l'ionosphère (couche de l'atmosphère)</li>
      </ul>
      
      <p><strong>Conclusion du chapitre</strong> : Ce n'est donc pas "juste la NASA" qui affirme que la Terre est sphérique. C'est l'humanité entière, depuis 2500 ans, à travers toutes les cultures, tous les pays, toutes les époques !</p>
      
      <h2>Chapitre 3 : Teste par toi-même avec l'application !</h2>
      
      <p>Voici des expériences que tu peux faire avec cette application pour comprendre la forme de notre planète. Pour chaque test, compare ce que montre l'application avec ce que tu peux observer dans la vraie vie !</p>
      
      <h3>Expérience 1 : Le mystère du Soleil de minuit</h3>
      
      <p><strong>Ce qu'on teste</strong> : Le Soleil qui ne se couche jamais en été près des pôles</p>
      
      <p><strong>Dans l'application</strong> :</p>
      <ol>
        <li>Mets la date au 21 juin (solstice d'été)</li>
        <li>Place-toi à Tromsø, Norvège (69°N) ou utilise ce <a href="/?tl=2i2p.tgyag0&lp=5xd&lat=69.6492&lng=18.9553&tz=Europe/Oslo&t=tgyc2c&F=b&p=0&d=VM&z=vm173&b=9hcl&pl=n&sr=24.0167&dh=89.9" target="_blank" rel="noopener noreferrer">lien direct</a></li>
        <li>Active le time-lapse rapide (×1000) sur 24h</li>
        <li>Observe : le Soleil fait un cercle complet sans toucher l'horizon !</li>
      </ol>
      
      <p><strong>Ce qu'on verrait sur une Terre plate</strong> :</p>
      <ul>
        <li>Le Soleil devrait disparaître quand il s'éloigne de ta zone</li>
        <li>Il ne pourrait pas faire un cercle complet visible depuis un seul point</li>
      </ul>
      
      <p><strong>Dans la vraie vie</strong> : Des millions de personnes vivent cette expérience chaque été en Alaska, Norvège, Islande... et chaque été en Antarctique aussi !</p>
      
      <h3>Expérience 2 : La danse étrange des planètes</h3>
      
      <p><strong>Ce qu'on teste</strong> : Le mouvement rétrograde de Mars (quand elle semble reculer dans le ciel)</p>
      
      <p><strong>Dans l'application</strong> :</p>
      <ol>
        <li>Suis Mars pendant un an avec un point par semaine</li>
        <li>Active la pose longue et observe sa trajectoire</li>
        <li>Remarque la boucle qu'elle fait ! <a href="/?tl=1og5.t5ieo0&lp=5xc&l=2988507&t=t5z2o0&F=0&p=5&d=custom&k=1&f=r&b=35vp&pl=4&sr=168.0167" target="_blank" rel="noopener noreferrer">Lancer la simulation</a></li>
      </ol>
      
      <p><strong>Ce qu'on verrait sur une Terre plate</strong> :</p>
      <ul>
        <li>Mars devrait juste tourner en cercle au-dessus du disque</li>
        <li>Pas de raison qu'elle fasse marche arrière !</li>
      </ul>
      
      <p><strong>L'explication sphérique</strong> : La Terre double Mars sur son orbite (comme quand tu doubles une voiture sur l'autoroute, elle semble reculer par rapport au paysage).</p>
      
      <h3>Expérience 3 : Les étoiles impossibles</h3>
      
      <p><strong>Ce qu'on teste</strong> : Voir différentes étoiles selon où on est sur Terre</p>
      
      <p><strong>Dans l'application</strong> :</p>
      <ol>
        <li>Place-toi à Paris et regarde vers le nord : tu vois la Grande Ourse - <a href="/?tl=1og5.t5ieo0&lp=75&l=2988507&t=t5z2o0&F=b&p=0&d=VM&z=vm173&b=8s6t&pl=n&sr=0.0167&dh=45.0" target="_blank" rel="noopener noreferrer">Voir depuis Paris</a></li>
        <li>Téléporte-toi à Sydney, Australie - <a href="/?tl=1og5.t5ieo0&lp=75&lat=-33.8688&lng=151.2093&tz=Australia/Sydney&t=t5z2o0&F=b&p=0&d=VM&z=vm173&b=8s7o&pl=n&sr=0.0167&dh=-45.0" target="_blank" rel="noopener noreferrer">Voir depuis Sydney</a></li>
        <li>Regarde vers le nord : plus de Grande Ourse ! Mais vers le sud : la Croix du Sud !</li>
        <li>Bonus : mets-toi à l'équateur - tu peux voir les deux ! - <a href="/?tl=1og5.tczxg0&lp=75&lat=0.000000&lng=-78.467&tz=America/Guayaquil&t=tdcw40&F=b&p=0&d=VM&z=vm173&b=8s7p&pl=n&sr=0.0167&da=-51.76&dh=89.9" target="_blank" rel="noopener noreferrer">Voir depuis l'Équateur</a></li>
      </ol>
      
      <p><strong>Ce qu'on verrait sur une Terre plate</strong> :</p>
      <ul>
        <li>Tout le monde devrait voir les mêmes étoiles</li>
        <li>Ou alors le "dôme" devrait être magique et montrer des choses différentes selon où on est (compliqué !)</li>
      </ul>
      
      <h3>Expérience 4 : L'ombre révélatrice de la Terre</h3>
      
      <p><strong>Ce qu'on teste</strong> : Les éclipses de Lune</p>
      
      <p><strong>Dans l'application</strong> :</p>
      <ol>
        <li>Trouve une date d'éclipse lunaire (par exemple : 14 mars 2025) - <a href="/?tl=2i2p.u1xnk0&lp=5xc&l=2988507&t=u1y2o0&F=1&p=0&d=custom&k=1&f=1fy&b=9hcf&pl=a&sr=4.0167" target="_blank" rel="noopener noreferrer">Voir l'éclipse</a></li>
        <li>Place-toi n'importe où d'où l'éclipse est visible</li>
        <li>Observe l'ombre qui passe sur la Lune</li>
        <li>Change de lieu d'observation : l'ombre est toujours ronde !</li>
      </ol>
      
      <p><strong>Ce qu'on verrait sur une Terre plate</strong> :</p>
      <ul>
        <li>L'ombre devrait être ovale ou en forme de ligne</li>
        <li>Elle changerait selon l'angle d'observation</li>
      </ul>
      
      <p><strong>Bonus</strong> : Mesure le rapport entre la taille de l'ombre et celle de la Lune. Tu peux en déduire que la Terre fait environ 3,7 fois le diamètre de la Lune !</p>
      
      <h3>Expérience 5 : Le Soleil qui ne rétrécit pas</h3>
      
      <p><strong>Ce qu'on teste</strong> : La taille apparente du Soleil</p>
      
      <p><strong>Dans l'application</strong> :</p>
      <ol>
        <li>Mesure la taille du Soleil à différents moments de la journée - <a href="/?tl=2i2p.t5ieo0&lp=5xd&l=2988507&t=t5z2o0&F=0&p=0&d=nikon-p1000&z=p1000-2000eq&b=9hc7&pl=n&sr=12.0167" target="_blank" rel="noopener noreferrer">Lancer le test</a></li>
        <li>Use la fonction zoom pour bien voir</li>
        <li>Compare lever, midi, coucher</li>
      </ol>
      
      <p><strong>Ce qu'on verrait sur une Terre plate</strong> :</p>
      <ul>
        <li>Si le Soleil s'éloignait (modèle du projecteur), il devrait paraître 2-3 fois plus petit au coucher qu'à midi</li>
        <li>Les time-lapses montreraient un Soleil qui grandit et rétrécit</li>
      </ul>
      
      <p><strong>La réalité</strong> : Le Soleil garde la même taille (environ 0,5°) toute la journée. Il peut même paraître plus gros à l'horizon (mais c'est une illusion d'optique !).</p>
      
      <h3>Expérience 6 : Les distances qui ne collent pas</h3>
      
      <p><strong>Ce qu'on teste</strong> : Les vols dans l'hémisphère sud</p>
      
      <p><strong>Dans l'application</strong> :</p>
      <ol>
        <li>Trace une ligne entre Sydney et Santiago du Chili - <a href="/?tl=1og5.t5ieo0&lp=75&lat=-33.8688&lng=151.2093&tz=Australia/Sydney&t=t5z2o0&F=b&p=0&d=VM&z=vm173&b=8s7o&pl=n&sr=0.0167&da=-70.0&dh=0.0" target="_blank" rel="noopener noreferrer">Sydney-Santiago</a></li>
        <li>Regarde la distance et la direction</li>
        <li>Fais pareil avec Johannesburg - Sydney - <a href="/?tl=1og5.t5ieo0&lp=75&lat=-26.2041&lng=28.0473&tz=Africa/Johannesburg&t=t5z2o0&F=b&p=0&d=VM&z=vm173&b=8s7o&pl=n&sr=0.0167&da=120.0&dh=0.0" target="_blank" rel="noopener noreferrer">Johannesburg-Sydney</a></li>
      </ol>
      
      <p><strong>Sur une carte de Terre plate</strong> :</p>
      <ul>
        <li>Ces vols devraient faire d'énormes détours</li>
        <li>Sydney-Santiago devrait passer près du pôle Nord (!)</li>
        <li>Les vols devraient durer 25-30 heures</li>
      </ul>
      
      <p><strong>La réalité</strong> :</p>
      <ul>
        <li>Vol direct Sydney-Santiago : 12h30, en passant au-dessus de l'Antarctique</li>
        <li>Les pilotes confirment voir le continent blanc en dessous !</li>
      </ul>
      
      <h3>Expérience 7 : Le test ultime - Crée ton propre modèle !</h3>
      
      <p><strong>Le défi</strong> : Essaie de créer UN SEUL modèle qui explique TOUS ces phénomènes :</p>
      <ul>
        <li>Le Soleil de minuit aux deux pôles</li>
        <li>Les phases de la Lune vues pareil partout</li>
        <li>Les éclipses</li>
        <li>Les saisons inversées nord/sud</li>
        <li>Les étoiles différentes selon la latitude</li>
        <li>Les fuseaux horaires</li>
        <li>La taille constante du Soleil et de la Lune</li>
      </ul>
      
      <p>Spoiler : Des milliers de personnes ont essayé... Le seul modèle qui marche pour tout, c'est la sphère !</p>
      
      <h3>Pour aller plus loin</h3>
      
      <p>L'application te permet de voyager dans le temps et l'espace. Profites-en pour :</p>
      <ul>
        <li>Observer les transits de Vénus (super rares !) - <a href="/?tl=2i2p.m55zs0&lp=74&l=5391959&t=m5608o&F=0&p=1&d=nikon-p1000&z=p1000-2000eq&b=aw1z&pl=2&sr=0.0167" target="_blank" rel="noopener noreferrer">Transit de 2012</a></li>
        <li>Suivre les éclipses historiques - <a href="/?tl=1og4.-qelao0&lp=5xc&g=s0m1ryjyn&tz=Africa/Malabo&t=-qel6g4&F=0&p=5&d=custom&k=1&f=1k&b=2t6v&pl=n&sr=2.0167" target="_blank" rel="noopener noreferrer">Éclipse de 1919 (Einstein)</a></li>
        <li>Comprendre pourquoi les anciens ont appelé les planètes "étoiles errantes" - <a href="/?tl=-teqghl.s6l39p&lp=5xc&l=2988507&t=s793kh&F=9&p=0&d=VM&z=vm173&b=9hec&pl=a&sr=-6.9833&da=34.73&dh=89.9" target="_blank" rel="noopener noreferrer">Voir le mouvement</a></li>
        <li>Voir comment le ciel change selon où tu es sur Terre</li>
      </ul>
      
      <p><strong>Le message final</strong> : La science, ce n'est pas croire aveuglément ce qu'on te dit. C'est observer, tester, vérifier. Cette application te donne les outils. À toi de jouer ! Compare ce que tu vois dans l'application avec le vrai ciel. Pose-toi des questions. Cherche des explications.</p>
      
      <p>Et souviens-toi : si la Terre était vraiment plate, il faudrait une conspiration impliquant des millions de personnes (scientifiques, pilotes, marins, ingénieurs...) de tous les pays, depuis des siècles, sans qu'aucun ne vende la mèche pour devenir riche et célèbre.</p>
      
      <p>Ou alors... la Terre est juste ronde, et tout devient simple ! 🌍</p>
      
      <p><em>"Le plus beau dans la science, c'est qu'elle marche que tu y croies ou non."</em> - Neil deGrasse Tyson</p>
    </article>
  );
}