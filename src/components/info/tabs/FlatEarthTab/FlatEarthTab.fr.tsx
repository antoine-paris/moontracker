import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useLanguageFromPath } from '../../../../hooks/useLanguageFromPath';
const FlatEarthSimulator = lazy(() => import('./FlatEarthSimulator/FlatEarthSimulator'));

// Simple ErrorBoundary pour intercepter un échec de montage du Canvas/lazy
class ErrorBoundary extends React.Component<{ onRetry?: () => void; children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { onRetry?: () => void; children: React.ReactNode }) {
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
    return this.props.children;
  }
}

export default function FlatEarthTab() {
  const [reloadKey, setReloadKey] = useState(0);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const { currentLanguage } = useLanguageFromPath();

  // Check for mobile portrait orientation
  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth <= 768; // Mobile breakpoint
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsMobilePortrait(isMobile && isPortrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Précharger le module pour éviter la "cold start" du lazy loading
  useEffect(() => {
    import('./FlatEarthSimulator/FlatEarthSimulator').catch(() => {});
  }, []);

  return (
    <article>
      <h1>Explorer les modèles de la Terre : Une invitation à l'observation</h1>

      <h2>Les modèles de Terre plate - Ce qu'ils expliquent... et ce qu'ils n'expliquent pas</h2>

      <p style={{ fontWeight: 'bold', backgroundColor: '#7a0000', color: '#ffffff', padding: '12px 16px', borderRadius: '6px', lineHeight: 1.5 }}>
        Un simulateur de terre plate est disponible plus bas sur cette page. Mais avant de
        l'utiliser, lisez la page pour bien comprendre comment l'utiliser, et pourquoi le simulateur est à votre disposition.</p>
      
      <h3>Le modèle de base : la Terre-disque</h3>
      <p>
        Certaines personnes n'arrivent pas à admettre que la Terre est sphérique. Ils pensent que la Terre est plate, et comment leur en vouloir ? 
        Quand on regarde nos pieds et qu'on écarte les bras, c'est ce que nos sens nous disent. 
        Pour ces personnes, la Terre est comme une grande crêpe. 
      </p>
      <p>
        L'image la plus répandue d'une Terre plate se présente comme ceci : un disque plat avec le pôle Nord au 
        centre (comme le moyeu d'une roue de vélo) et l'Antarctique (le pôle Sud) formant un mur de glace 
        tout autour du bord (comme le pneu de cette roue).</p>
      
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', margin: '16px 0', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 360px', minWidth: '280px' }}>

        <p>Dans ce modèle :</p>
          <ul style={{ marginRight: '0',}}>
            <li><strong>Le Soleil et la Lune</strong> seraient de petites boules (environ 50 km de diamètre) qui tournent en cercle au-dessus de la terre, à environ 5000 km d'altitude</li>
            <li><strong>Le jour et la nuit</strong> s'expliquent, dans ce modèle, parce que le Soleil agit comme un projecteur : il n'éclaire qu'une zone limitée du disque</li>
            <li><strong>Les saisons</strong> arrivent parce que le Soleil change de cercle : il tourne plus près du centre en été, et plus près du bord en hiver</li>
            <li><strong>Les étoiles</strong> seraient accrochées (ou seraient des petits trous) sur un dôme qui entoure la terre</li>
          </ul>
        </div>
        <figure style={{ marginLeft: '0', marginRight: '5rem', flex: '0 0 320px', maxWidth: '420px' }}>
          <img
            src="/img/flatearth/fe.png"
            alt="Image classique d'une terre plate"
            loading="lazy"
            style={{ width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid #333' }}
          />
          <figcaption style={{ fontSize: '0.9em', color: '#aaa', marginTop: '6px' }}>
            <small>Modèle de Terre plate le plus courant.</small>
          </figcaption>
        </figure>
      </div>

      <h3>Ce que la Terre plate explique à peu près</h3>
      <ul>
        <li><strong>L'horizon plat</strong> : Quand tu regardes l'océan, il semble effectivement plat. Mais ce modèle a du mal à expliquer pourquoi on ne voit pas l'autre rive de l'océan (par exemple le Brésil depuis l'Afrique, ou Londres depuis la tour Eiffel). Même avec des télescopes ultra-puissants, on ne voit pas plus loin que l'horizon.</li>
        <li><strong>Les fuseaux horaires</strong> : Différentes zones du disque 
        sont éclairées à différents moments. Il peut faire jour à New York et nuit 
        à Tokyo au même moment. Ça, ça fonctionne « à peu près », mais on va voir que ce n'est pas toujours aussi précis avec une Terre plate qu'avec une Terre sphérique.</li>
        <li><strong>Les ombres à midi</strong> : Les ombres n'ont pas toujours la même longueur selon notre position sur la Terre. C'est quelque chose qu'on « sait » depuis
         plus de 2000 ans. C'est en Égypte qu'Ératosthène avait déjà repéré que :
        <br/>- À Syène (aujourd'hui Assouan), au sud de l'Égypte, le Soleil était directement au-dessus de sa tête le jour du solstice d'été (21 juin) à midi — son bâton ne faisait pas d'ombre du tout
        <br/>- À Alexandrie, 800 km plus au nord, au même moment, les objets faisaient une ombre qu'on pouvait mesurer et avec laquelle on pouvait faire de la géométrie pour calculer plein de choses
        <br/>Il a donc calculé qu'il ne pouvait y avoir que deux géométries possibles :
          <ul>
              <li> Soit la Terre était sphérique et le soleil vraiment très loin (des millions de km)</li>
              <li> Soit la Terre était plate et le soleil était proche (à peu près 5000 km)</li>
            </ul>
            C'est la raison pour laquelle les « Platistes » nous disent que le soleil est à 5000 km au-dessus de nous et que les « Sphéristes » nous disent qu'il est à 150 millions de km. Dans les deux cas, on peut expliquer les ombres.
         </li>
        
      </ul>
      
      <h2>Depuis quand pense-t-on que la Terre est sphérique ?</h2>
      
      <h3>Les Grecs anciens : les premiers détectives</h3>
      
      <p><strong>Vers 500 avant J.-C. - Pythagore</strong> : Ce mathématicien (oui, celui du théorème !) remarque que les navires disparaissent coque d'abord à l'horizon, puis les voiles. Comme s'ils descendaient une colline invisible !</p>
      
      <p><strong>Vers 350 avant J.-C. - Aristote</strong> : Il compile les preuves :</p>
      <ul>
        <li>L'ombre de la Terre sur la Lune pendant les éclipses est toujours ronde</li>
        <li>On voit différentes étoiles en voyageant vers le nord ou le sud</li>
        <li>Tous les objets célestes (Lune, planètes) sont des sphères, pourquoi pas la Terre ?</li>
      </ul>
      
      <p><strong>Vers 240 avant J.-C. - Ératosthène</strong> : Le champion ! Il calcule la circonférence de la Terre avec juste des bâtons et des ombres ! À Syène (Assouan aujourd'hui), le Soleil éclaire le fond des puits à midi le jour du solstice d'été. Le même jour à Alexandrie, 800 km plus au nord, les objets font une ombre. En mesurant l'angle de cette ombre (7,2°), il calcule : 7,2° c'est 1/50 d'un cercle, donc la Terre fait 50 × 800 = 40 000 km de tour. Bingo ! C'est la bonne réponse !</p>
      
      <h3>Le Moyen Âge : on n'a jamais cru que la Terre était plate !</h3>
      
      <p><strong>Contrairement au mythe</strong>, les savants médiévaux savaient que la Terre était ronde :</p>
      
      <p><strong>Bède le Vénérable (673-735)</strong> : Ce moine anglais explique les marées par l'attraction de la Lune et décrit la Terre comme une sphère.</p>
      
      <p><strong>Al-Biruni (973-1048)</strong> : Ce savant persan recalcule le rayon de la Terre et obtient 6339,6 km (le vrai : 6371 km). Pas mal pour l'époque !</p>
      
      <p><strong>Thomas d'Aquin (1225-1274)</strong> : Le plus grand philosophe médiéval utilise la rotondité de la Terre comme exemple de vérité scientifique évidente.</p>
      
      <h3>Les grandes explorations : la preuve par le voyage</h3>
      
      <p><strong>1519-1522 - Magellan</strong> : Son expédition fait le premier tour complet de la Terre. Ils partent vers l'ouest et reviennent par l'est. </p>
      
      <p><strong>Les navigateurs</strong> : Tous utilisent les étoiles pour naviguer. La hauteur de l'étoile Polaire au-dessus de l'horizon donne directement la latitude (la distance au nord de l'équateur). Ça ne marche que sur une sphère !</p>
      
      <h3>L'ère moderne : les preuves s'accumulent</h3>
      
      <p><strong>1851 - Pendule de Foucault</strong> : Ce pendule géant montre la rotation de la Terre. Il change de direction de balancement selon la latitude. Au pôle, il fait un tour complet en 24h. À Paris, en 32h. À l'équateur, il ne tourne pas. Exactement ce qu'on attend d'une sphère qui tourne !</p>
      
      <p><strong>Les fuseaux horaires</strong> : Créés en 1884, ils divisent la Terre en 24 tranches. Le Soleil se lève à l'est et parcourt 15° par heure (360° ÷ 24h). Ça colle parfaitement avec une Terre sphérique qui tourne.</p>
      
      <h3>Aujourd'hui : des milliers de preuves indépendantes</h3>
      <ul>
        <li><strong>Les satellites</strong> : Plusieurs milliers de satellites actifs (méga‑constellations incluses), opérés par des dizaines de pays</li>
        <li><strong>L'ISS</strong> : Des astronautes de 20 nations l'ont visitée</li>
        <li><strong>GPS</strong> : Ton téléphone utilise des satellites en orbite et des corrections relativistes; ce cadre est incompatible avec un modèle de Terre plate sans orbites</li>
        <li><strong>Les compagnies aériennes</strong> : Elles économisent des millions en carburant grâce aux routes "grand cercle" (le plus court chemin sur une sphère)</li>
        <li><strong>Les radioamateurs</strong> : Des millions de passionnés communiquent en faisant rebondir les ondes sur l'ionosphère (couche de l'atmosphère)</li>
      </ul>
      
      <p><strong>Conclusion du chapitre</strong> : Ce n'est donc pas "juste la NASA" qui affirme que la Terre est sphérique. C'est l'humanité entière, depuis 2500 ans, à travers toutes les cultures, tous les pays, toutes les époques !</p>
      
      <h2>Ce que la Terre plate n'explique pas du tout</h2>

      <p>Pour vous permettre d'essayer toutes les hypothèses de Terre plate et les réglages possibles, nous vous proposons ce <strong>simulateur de Terre plate</strong> :</p>

      <p>Vous pouvez essayer toutes sortes de combinaisons de taille, de distance et d'éclairage, et aussi choisir la ville depuis laquelle vous observez le ciel.</p>
       
        {/* Container pour le simulateur avec hauteur fixe */}
        <div 
          id="flat-earth-simulator"
          style={{ 
            width: '100%', 
            height: '520px', 
            position: 'relative',
            border: '2px solid #333',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '20px',
            backgroundColor: '#0b1020', // fond sombre stable
          }}>
          {isMobilePortrait ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              fontSize: '18px',
              color: '#fff',
              background: '#0b1020',
              textAlign: 'center',
              padding: '20px',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ fontSize: '48px' }}>📱↻</div>
              <div>
                {currentLanguage === 'fr' 
                  ? 'Veuillez tourner votre appareil en mode paysage pour voir le simulateur'
                  : 'Please turn your device to landscape mode to see the simulator'
                }
              </div>
            </div>
          ) : (
            <ErrorBoundary onRetry={() => setReloadKey(k => k + 1)}>
              <Suspense fallback={
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  fontSize: '20px',
                  color: '#fff',
                  background: '#0b1020',
                }}>
                  ⏳ Chargement du simulateur 3D...
                </div>
              }>
                <FlatEarthSimulator key={reloadKey} />
              </Suspense>
            </ErrorBoundary>
          )}
        </div>
      

      <p>Si vous utilisez ce simulateur et que vous le comparez avec ce que vous pouvez observer dans la réalité (ou ce que vous donne le simulateur en « Terre sphérique » de SpaceView), vous verrez qu'il y a beaucoup de choses qu'on n'arrive pas à expliquer sur une Terre plate.</p>

      <h3>Le coucher de soleil</h3>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', margin: '16px 0', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 360px', minWidth: '280px' }}>
          <p style={{ marginRight: 0}}>Sur une 
          terre sphérique, on voit très bien que le soleil se lève à l'Est et se 
          couche à l'Ouest (parfois un peu au Sud, parfois un peu au Nord). Sur une terre plate, il est difficile d'expliquer
          pourquoi le soleil disparaît sous l'horizon.
          Le simulateur nous montre que si on était sur une terre plate, peu importe comment on place le soleil ou peu importe d'où on regarde,
          le soleil devrait tourner dans le ciel en venant du Nord-Est pour aller au Nord-Ouest. Le simulateur le montre, sur une terre plate, l'après-midi,
          le soleil s'éloignerait de nous, apparaîtrait de plus en plus petit, se rapprocherait de l'horizon
           (à cause de la perspective), mais ne toucherait jamais l'horizon.</p>
          <p style={{ marginRight: 0 }}>
            De plus, dans un tel modèle, la taille apparente du Soleil devrait varier sensiblement au cours de la journée.
            Or les observations montrent une taille quasi constante (~0,53°), ce qui contredit ce scénario.
          </p>
        </div>
        <figure className="info-content-margins-right" style={{ marginTop : 0, flex: '0 0 320px', maxWidth: '420px' }}>
          <img
            src="/img/flatearth/fe-sun-to-north.png"
            alt="Trajectoire attendue du Soleil vers le nord sur un modèle de Terre plate"
            loading="lazy"
            style={{ width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid #333' }}
          />
          <figcaption style={{ fontSize: '0.9em', color: '#aaa', marginTop: '6px' }}>
            <small>Sur un modèle de Terre plate, le Soleil se déplacerait du nord-est vers le nord-ouest.</small>
          </figcaption>
        </figure>
      </div>

      <h3>Les fuseaux horaires</h3>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', margin: '16px 0', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 360px', minWidth: '280px' }}>
          <p style={{ marginRight: 0}}>On a vu qu'avec le modèle de Terre plate, on explique pourquoi il peut faire jour à un endroit et nuit à un autre endroit au même moment.
          <br/> Mais on a beau « jouer » avec le simulateur de Terre plate, changer la largeur du faisceau du soleil, modifier son orbite ou sa hauteur, on n'arrive pas à « tomber juste ».
          <br/>
          <br/> Par exemple, 
          <br/> - Le 21 mars de chaque année à 12:25, le soleil est pile au-dessus de Kisangani, une grande ville (quasiment) sur l'équateur au milieu de l'Afrique.
          <br/> - Au même moment à New York, il est 6h25 et il fait encore nuit.&nbsp;
          <br/> - Au même moment à Porto Velho au Brésil, il est 6h25 et le soleil vient de se lever.&nbsp;
          <br/>
          <a
            href='?tl=2i2o.t5d2ax&lp=5xc&l=3662762&t=stgybb&F=0&p=5&d=custom&k=1&f=3p&b=94vp&pl=n&sr=-82.675&pc=5128581.212730.3662762'
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            (simulation en terre sphérique)
          </a>
          </p>          
        </div>
        <figure className="info-content-margins-right" style={{ marginTop : 0, marginBottom : 0, flex: '0 0 320px', maxWidth: '420px' }}>
          <img
            src="/img/capture/capture-earth-noon-at-congo.png"
            alt="Sur une terre sphérique la moitié de la planète est éclairée, et l'autre moitié ne l'est pas"
            loading="lazy"
            style={{ width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid #333' }}
          />
          <figcaption style={{ fontSize: '0.9em', color: '#aaa', marginTop: '6px' }}>
            <small>Sur une terre sphérique, la moitié de la planète est éclairée, et l'autre moitié ne l'est pas.</small>
          </figcaption>
        </figure>
      </div>

      <p >
        Eh bien, avec le simulateur de Terre plate, on a beaucoup de mal à trouver une configuration où ça fonctionne (en fait, on n'y est pas arrivé).
        <br/>On peut voir que si le soleil est à la verticale de Kisangani (en bleu), il va éclairer New York (en rouge) bien avant d'éclairer Porto Velho (en vert).
      </p>
        <figure className="info-content-margins" style={{ marginTop : 0, marginBottom : 0 }}>
          <img
            src="/img/flatearth/fe-noon-at-congo.png"
            alt="Sur une terre plate en Mars, le soleil se leve à New York avant de se lever à l'Est du brésil. Dans la vraie vie c'est le contraire."
            loading="lazy"
            style={{ width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid #333' }}
          />
          <figcaption style={{ fontSize: '0.9em', color: '#aaa', marginTop: '6px' }}>
            <small>Sur une Terre plate en mars, le soleil se lève à New York avant de se lever à l'est du Brésil. Dans la vraie vie, c'est le contraire.</small>
          </figcaption>
        </figure>
      <p>
        En effet, sur une Terre plate éclairée par une « lampe de poche », les fuseaux horaires et le cercle éclairé ne coïncident pas.
         <br/>La raison est simple : le faisceau donne un éclairage rond, et les fuseaux horaires, sur une Terre plate, sont des triangles.
      </p>

      <h3>La Lune</h3>
      <p>Sur une Terre plate, on ne devrait pas voir la même image
       de la Lune selon le lieu où on l'observe (puisque les « Platistes » la théorisent à 5000 km 
       d'altitude — et que la Terre plate fait 40 000 km d'un bout à l'autre), alors que
        sur le simulateur SpaceView (et dans la vraie vie) on voit toujours la même face et
       phase de la Lune, et ce, peu importe où on se place (puisque pour les « sphéristes », la Lune est à presque 400 000 km).
       <br/>Sur une Terre sphérique, on voit aussi un effet supplémentaire : la Lune est bien la même, mais on la voit se « tourner » (jusqu'à avoir « la tête en bas »)<br/>
       </p>
       <div 
        className="info-content-margins grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 md:grid-cols-4 gap-4"
        style={{ marginTop : 0 }}>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-application-moon-paris.jpg"
              alt="Simulation de la Lune vue de Paris"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              La Lune vue de Paris sur une Terre sphérique
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-application-moon-cotonou.jpg"
              alt="Simulation de la Lune vue de Cotonou"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Vue de Cotonou (6400 km au sud de Paris) au même moment
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-application-moon-somalia.jpg"
              alt="Simulation de la Lune vue de Somalie"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Vue de Somalie (6000 km à l’est de Cotonou) au même moment
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-application-moon-madagascar.jpg"
              alt="Simulation de la Lune vue de Madagascar"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Vue de Madagascar (3000 km au sud de la Somalie) au même moment
              
            </figcaption>
          </figure>
        </div>
        <p>Sur le simulateur de Terre plate, la Lune est vue sous un angle différent si on l'observe depuis un endroit différet.</p>
        <div 
          className="info-content-margins grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 md:grid-cols-4 gap-4"
          style={{ marginTop : 0 }}>
          <style>{`
            .crop570x597 {
              width: 100%;
              height: auto;
              aspect-ratio: 570 / 597;
              object-fit: cover;
              display: block;
            }
            @media (max-width: 620px) {
              .crop570x597 {
                width: 100%;
                height: auto;
                aspect-ratio: 570 / 597;
                object-fit: cover;
              }
            }
          `}</style>
          <figure className="m-0">
            <img
              src="/img/flatearth/fe-moon-paris.png"
              alt="Simulation de la Lune vue de Paris sur une terre plate"
              className="crop570x597 w-auto h-auto rounded-md border border-black/10 shadow-sm"

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              La Lune vue de Paris sur une Terre plate
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/flatearth/fe-moon-dakar.png"
              alt="Simulation de la Lune vue de Dakar sur une terre plate"
              className="crop570x597 w-auto h-auto rounded-md border border-black/10 shadow-sm"

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Simulation Terre plate depuis Dakar (4000 km au sud de Paris) au même moment
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/flatearth/fe-moon-mexico.png"
              alt="Simulation de la Lune vue de Mexico sur une terre plate"
              className="crop570x597 w-auto h-auto rounded-md border border-black/10 shadow-sm"

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Simulation Terre plate depuis Mexico (10000 km à l’ouest de Paris) au même moment
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/flatearth/fe-moon-rio.png"
              alt="Simulation de la Lune vue de Rio de Janeiro sur une terre plate"
              className="crop570x597 w-auto h-auto rounded-md border border-black/10 shadow-sm"

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Simulation Terre plate depuis Rio de Janeiro (8800 km à l’ouest de Paris) au même moment
              
            </figcaption>
          </figure>
        </div>
       
      <h3>Les étoiles</h3>
      <p>Avec un modèle de Terre plate, il est très difficile d’expliquer l’existence de deux pôles célestes
      (autour desquels les étoiles tournent) et le fait que les ciels de l’hémisphère nord et sud soient différents.
      Pourtant, les observateurs en Australie voient des étoiles invisibles depuis l'Europe !
      <br />De plus, quand on fait un time-lapse des étoiles sur une Terre plate, on devrait les voir tourner autour du « nord » et ce, peu importe d'où on les observe, alors que sur une Terre sphérique, on voit tourner les étoiles dans le sens des aiguilles d'une montre au pôle sud, et dans le sens inverse au pôle nord.<br/>
      Dans ces vidéos faites sur SpaceView, on voit d'ailleurs que, quand on est sur l'équateur et qu'on regarde au nord, elles tournent dans le sens inverse de quand on regarde au sud.</p>
      <div className="info-content-margins" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <figure style={{ margin: 0, flex: '1 1 320px', maxWidth: '40%' }} className="fe-star-video">
          <video
            autoPlay
            muted
            loop
            preload="metadata"
            playsInline
            className="w-auto max-w-full h-auto rounded-md border border-black/10 shadow-sm"
          >
            <source src="/img/flatearth/fe-stars-1.webm" type="video/webm" />
            Votre navigateur ne supporte pas la lecture de vidéos WebM.
          </video>
          <figcaption className="text-sm text-gray-500 mt-1">
            Timelapse des étoiles vues depuis Santiago de Surco au Pérou, en regardant vers le sud.
          </figcaption>
        </figure>
        <figure style={{ margin: 0, flex: '1 1 320px', maxWidth: '40%' }} className="fe-star-video">
          <video
            autoPlay
            muted
            loop
            preload="metadata"
            playsInline
            className="w-auto max-w-full h-auto rounded-md border border-black/10 shadow-sm"
          >
            <source src="/img/flatearth/fe-stars-2.webm" type="video/webm" />
            Votre navigateur ne supporte pas la lecture de vidéos WebM.
          </video>
          <figcaption className="text-sm text-gray-500 mt-1">
            Timelapse des étoiles vues depuis Santiago de Surco au Pérou, en regardant vers le nord.
          </figcaption>
        </figure>
      </div>
    
      <h3>Les éclipses solaires</h3>
      <p>Lors des éclipses solaires, la Lune passe entre nous et le soleil. 
      Donc il faut forcément que la Lune soit plus proche de nous que ne l'est le soleil. 
      C'est possible dans le simulateur de Terre plate ci-dessus, mais c'est compliqué de trouver comment placer la Lune et le soleil pour obtenir les éclipses telles qu'on les observe depuis différents lieux. 
      <br/>Si on essaye avec la prochaine éclipse (qui sera visible le 12 août 2026 entre l'Europe et l'Afrique du Nord) : 
      Les captures suivantes (faites avec SpaceView) nous prédisent comment l'éclipse sera à exactement 20h32 (heure de Paris), depuis différents endroits :
      <br/>
      </p>
      <div 
        className="info-content-margins grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 md:grid-cols-4 gap-4"
        style={{ marginTop : 0 }}>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-eclipse-2026-oslo.jpg"
              alt="Oslo, Norvège, le 12 août 2026 à 20h32 (simulation SpaceView)"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Oslo, Norvège, le 12 août 2026 à 20h32 (simulation SpaceView)
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-eclipse-2026-london.jpg"
              alt="London, UK, le 12 août 2026 à 19h32 (heure locale) (simulation SpaceView)"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              London, UK, le 12 août 2026 à 19h32 (heure locale) (simulation SpaceView)
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-eclipse-2026-berlin.jpg"
              alt="Berlin, Allemagne, le 12 août 2026 à 20h32 (simulation SpaceView)"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Berlin, Allemagne, le 12 août 2026 à 20h32 (simulation SpaceView)
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-eclipse-2026-paris.jpg"
              alt="Paris, France, le 12 août 2026 à 20h32 (simulation SpaceView)"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Paris, France, le 12 août 2026 à 20h32 (simulation SpaceView)
              
            </figcaption>
          </figure>
        </div>
      <div 
        className="info-content-margins grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 md:grid-cols-4 gap-4"
        style={{ marginTop : 0 }}>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-eclipse-2026-madrid.jpg"
              alt="Madrid, Espagne, le 12 août 2026 à 20h32 (simulation SpaceView)"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Madrid, Espagne, le 12 août 2026 à 20h32 (simulation SpaceView)
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-eclipse-2026-Rabat.jpg"
              alt="Rabat, Maroc, le 12 août 2026 à 19h32 (heure locale) (simulation SpaceView)"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Rabat, Maroc, le 12 août 2026 à 19h32 (heure locale) (simulation SpaceView)
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-eclipse-2026-alger.jpg"
              alt="Alger, Algérie, le 12 août 2026 à 19h32 (heure locale) (simulation SpaceView)"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Alger, Algérie, le 12 août 2026 à 19h32 (heure locale) (simulation SpaceView)
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-eclipse-2026-dakar.jpg"
              alt="Dakar, Sénégal, le 12 août 2026 à 18h32 (heure locale) (simulation SpaceView)"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Dakar, Sénégal, le 12 août 2026 à 18h32 (heure locale) (simulation SpaceView)
              
            </figcaption>
          </figure>
        </div>
      <p>
        Ces 8 images sont simulées (et pourront être vérifiées sur place) <strong>exactement</strong> au même moment. Donc appelez vos amis pendant l'éclipse et &nbsp;
      <a
        href="/?tl=2i2o.t5cuxn&lp=5xc&l=3117735&t=tjo65c&F=0&p=0&d=nikon-p1000&z=p1000-2000eq&b=94p3&pl=a&sr=0.0167&pc=3117735.2988507.2643743.2507480.2538475.2950159.2253354.3143244"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        Comparez avec la simulation SpaceView (Terre sphérique)
      </a>
      <br/>Jusqu'ici personne n'a trouvé de configuration de terre plate qui puisse expliquer toutes ces images en même temps.
      </p>
      <h3>Les éclipses lunaires</h3>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', margin: '16px 0', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 360px', minWidth: '280px' }}>
          <p style={{ marginRight: 0 }}>
          Lors des éclipses lunaires, la Lune passe « derrière la Terre » et traverse l'ombre de notre planète. 
          Au début et à la fin de l'éclipse, on peut voir la forme arrondie de notre planète (le bord de l'ombre).
          C'est l'une des preuves les plus anciennes de la rotondité de la Terre (Aristote l'avait déjà remarquée en 350 avant J.-C.).
          Sur une Terre plate, on ne peut pas expliquer pourquoi l'ombre de la Terre est toujours ronde pendant une éclipse lunaire.
          <br/>De plus, lors d'une éclipse lunaire, la Lune devient rouge (à cause de la diffusion de la lumière dans l'atmosphère terrestre). 
          Sur une Terre plate, on ne peut pas expliquer pourquoi la Lune devient rouge pendant une éclipse lunaire.
          </p>
        </div>
        <figure style={{ marginLeft: '0', marginRight: '5rem', flex: '0 0 320px', maxWidth: '420px' }}>
          <img
            src="/img/examples/export-red-moon.jpg"
            alt="Phase de lune rouge d'une éclipse lunaire"
            loading="lazy"
            style={{ width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid #333' }}
          />
          <figcaption style={{ fontSize: '0.9em', color: '#aaa', marginTop: '6px' }}>
            <small>Phase de lune rouge d'une éclipse lunaire.</small>
          </figcaption>
        </figure>
      </div>
      <div className="info-content-margins" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <figure style={{ margin: 0, flex: '1 1 320px', maxWidth: '40%' }} className="fe-star-video">
          <video
            autoPlay
            muted
            loop
            preload="metadata"
            playsInline
            className="w-auto max-w-full h-auto rounded-md border border-black/10 shadow-sm"
          >
            <source src="/img/capture/video-moon-eclipse-australia.webm" type="video/webm" />
            Votre navigateur ne supporte pas la lecture de vidéos WebM.
          </video>
          <figcaption className="text-sm text-gray-500 mt-1">
            Début de l'éclipse lunaire vue depuis l'Australie. On voit l'ombre de la terre avancer (durée réelle 38 minutes)
          </figcaption>
        </figure>
        <figure style={{ margin: 0, flex: '1 1 320px', maxWidth: '40%' }} className="fe-star-video">
          <video
            autoPlay
            muted
            loop
            preload="metadata"
            playsInline
            className="w-auto max-w-full h-auto rounded-md border border-black/10 shadow-sm"
          >
            <source src="/img/capture/video-moon-eclipse-japan.webm" type="video/webm" />
            Votre navigateur ne supporte pas la lecture de vidéos WebM.
          </video>
          <figcaption className="text-sm text-gray-500 mt-1">
            Même éclipse lunaire vue depuis le Japon.
          </figcaption>
        </figure>
      </div>
      <p>
      
      <br/>Jusqu'ici, personne n'a trouvé de configuration de Terre plate qui puisse expliquer à la fois l'ombre qui apparaît sur la Lune en 30 à 40 minutes, et le fait qu'on ne la voie pas orientée de la même façon dans l'hémisphère sud et dans l'hémisphère nord.  &nbsp;
      <a
        href='/?tl=3wn4.t2884e&lp=5xc&g=rhby8kxye&tz=Australia%2FDarwin&t=t287xz&F=1&p=0&d=custom&k=1&f=1fy&b=9hcf&pl=a&sr=2.0167'
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        Voir la simulation en terre sphérique
      </a>
      </p>

      <p>
        <a
          href="#flat-earth-simulator"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition"
          style={{color:'white'}}
        >
          Essayer quand même avec le simulateur de terre plate
        </a>
      </p>

      <h2>Et si elle était sphérique ?</h2>
    
      <p>La science, ce n'est pas croire aveuglément ce qu'on te dit. C'est observer, tester, vérifier. Cette application te donne les outils. À toi de jouer ! Compare ce que tu vois dans l'application avec le vrai ciel. Pose-toi des questions. Cherche des explications.</p>
      
      <p>Et souviens-toi : si la Terre était vraiment plate, il faudrait une conspiration impliquant des millions de personnes (scientifiques, pilotes, marins, ingénieurs...) de tous les pays, depuis des siècles, sans qu'aucun ne vende la mèche pour devenir riche et célèbre.</p>
      
      <p>Ou alors... la Terre est juste ronde, et tout devient simple ! 🌍</p>
      
      <p><em>"Le plus beau dans la science, c'est qu'elle marche que tu y croies ou non."</em> - Neil deGrasse Tyson</p>
    </article>
  );
}