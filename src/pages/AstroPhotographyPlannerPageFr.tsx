import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguageFromPath } from '../hooks/useLanguageFromPath';
import InfoLogo from '../components/info/InfoLogo';

export default function AstroPhotographyPlannerPageFr() {
  useLanguageFromPath();

  // SEO metadata
  React.useEffect(() => {
    const title = "Planificateur d'Astrophotographie - SpaceView.me | Réglages d'Appareil & Outil de Planification du Ciel";
    const description = "Planifiez vos sessions d'astrophotographie avec des calculs précis du ciel, simulation de réglages d'appareil et chronométrage optimal pour les événements célestes. Parfait pour la photographie du ciel profond et planétaire.";
    
    document.title = title;
    
    const metaDesc = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    metaDesc.setAttribute('content', description);
    if (!metaDesc.parentNode) document.head.appendChild(metaDesc);

    // Structured data for this specific tool
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Planificateur d'Astrophotographie",
      "description": description,
      "url": window.location.href,
      "applicationCategory": "EducationalApplication",
      "inLanguage": "fr",
      "featureList": [
        "Simulation d'appareil photo et objectif",
        "Calculs de champ de vision",
        "Prédictions de chronométrage optimal",
        "Évaluation de l'obscurité du ciel",
        "Planification de visibilité des cibles",
        "Recommandations d'équipement",
        "Planification de sessions"
      ],
      "isPartOf": {
        "@type": "WebApplication",
        "name": "SpaceView.me",
        "url": "https://spaceview.me"
      }
    };

    let script = document.getElementById('astrophoto-jsonld-fr') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'astrophoto-jsonld-fr';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);

    return () => {
      document.title = "SpaceView.me";
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <InfoLogo showBackground={false} size={64} />
            <div className="flex flex-col leading-tight">
              <span className="text-base font-semibold">Planificateur d'Astrophotographie</span>
              <span className="text-xs text-gray-600">SpaceView.me</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/fr/info"
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
              Infos
            </Link>
            <Link
              to="/fr?start=true"
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Ouvrir le Planificateur
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <article>
          <header className="mb-8">
            <nav className="text-sm text-gray-500 mb-4">
              <Link to="/fr" className="hover:text-blue-600">SpaceView.me</Link>
              <span className="mx-2">›</span>
              <span>Planificateur d'Astrophotographie</span>
            </nav>
            <h1 className="text-3xl font-bold mb-4">Planificateur d'Astrophotographie & Calculateur de Sessions</h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Planifiez des sessions d'astrophotographie parfaites avec des calculs précis du ciel, simulation d'appareil photo et prédictions de chronométrage optimal. 
              Des prises grand-angle de la Voie lactée à l'imagerie planétaire détaillée.
            </p>
          </header>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-3 text-blue-600">📷 Simulation d'Équipement</h2>
              <ul className="space-y-2 text-gray-700">
                <li>• Calculs de champ de vision d'appareil photo et objectif</li>
                <li>• Recommandations de focale par cible</li>
                <li>• Considérations de taille de capteur et facteur de recadrage</li>
                <li>• Superposition de cadre photo pour composition</li>
                <li>• Exigences de monture de suivi</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-3 text-purple-600">🌌 Conditions du Ciel</h2>
              <ul className="space-y-2 text-gray-700">
                <li>• Évaluation de la phase lunaire et interférences</li>
                <li>• Fenêtres d'obscurité optimales</li>
                <li>• Altitude et visibilité des cibles</li>
                <li>• Facteurs de transparence atmosphérique</li>
                <li>• Calcul des meilleures heures d'imagerie</li>
              </ul>
            </div>
          </div>

          <section className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Workflow de Planification Photographique</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">1</div>
                <h3 className="font-semibold mb-2">Choisir la Cible</h3>
                <p className="text-sm text-gray-600">Sélectionnez les objets célestes ou événements à photographier</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">2</div>
                <h3 className="font-semibold mb-2">Définir l'Équipement</h3>
                <p className="text-sm text-gray-600">Configurez votre appareil photo, objectif et télescope</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">3</div>
                <h3 className="font-semibold mb-2">Planifier le Chronométrage</h3>
                <p className="text-sm text-gray-600">Trouvez les dates et heures optimales pour votre session</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">4</div>
                <h3 className="font-semibold mb-2">Capturer & Partager</h3>
                <p className="text-sm text-gray-600">Exécutez votre plan et partagez les résultats</p>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Exemples d'Astrophotographie en Vedette</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link 
                to="/fr?tl=-teqghl.s6l39p&lp=5xc&l=3110876&t=s793kh&F=9&p=0&d=VM&z=vm173&b=9hec&pl=a&sr=-6.9833&da=34.73&dh=89.9"
                className="block bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-blue-600 mb-2">🌌 Photographie de la Voie Lactée</h3>
                <p className="text-sm text-gray-600">Configuration grand-angle pour capturer le centre galactique</p>
              </Link>
              <Link 
                to="/fr?tl=uit0jk.tp0z3k&lp=5xc&l=5128581&t=tp0zab&F=1&p=5&d=nikon-p1000&z=p1000-2000eq&b=5z03&pl=a&sr=0.0167"
                className="block bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-red-600 mb-2">🌕 Gros Plans Lunaires</h3>
                <p className="text-sm text-gray-600">Configuration d'objectif téléphoto pour prises lunaires détaillées</p>
              </Link>
              <Link 
                to="/fr?tl=1iit.usgh40&lp=5xc&l=2988507&t=wad7s0&F=0&p=0&d=custom&k=1&f=1&b=5z2d&pl=a&sr=214.852"
                className="block bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-orange-600 mb-2">🪐 Imagerie Planétaire</h3>
                <p className="text-sm text-gray-600">Configuration haute magnification pour photographie de planètes</p>
              </Link>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Types de Photographie & Techniques</h2>
            <div className="space-y-6">
              
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-lg mb-2 text-blue-600">Photographie du Ciel Profond</h3>
                <p className="text-gray-700 mb-2">
                  Capturez les nébuleuses, galaxies et amas d'étoiles avec des techniques de longue exposition.
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Emplacements de ciel sombre et évitement de la lune</li>
                  <li>Exigences de monture de suivi et alignement polaire</li>
                  <li>Empilement de multiples expositions et traitement</li>
                  <li>Recommandations de filtres (L-RGB, bande étroite)</li>
                </ul>
              </div>

              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-semibold text-lg mb-2 text-red-600">Lunaire & Planétaire</h3>
                <p className="text-gray-700 mb-2">
                  Imagerie haute résolution des objets du système solaire avec chronométrage précis.
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Chronométrage optimal d'opposition et de conjonction</li>
                  <li>Considérations de vision atmosphérique et turbulence</li>
                  <li>Techniques de capture vidéo et imagerie chanceuse</li>
                  <li>Calculs de lentille de Barlow et rapport focal</li>
                </ul>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-lg mb-2 text-purple-600">Astrophotographie Grand-Angle</h3>
                <p className="text-gray-700 mb-2">
                  Astrophotographie de paysage combinant éléments de premier plan et de ciel.
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Planification de composition avec éléments de premier plan</li>
                  <li>Empilement de mise au point et mélange d'exposition</li>
                  <li>Positionnement de la Voie lactée et fenêtres de visibilité</li>
                  <li>Évaluation et atténuation de la pollution lumineuse</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Base de Données d'Équipement</h2>
            <p className="text-gray-700 mb-4">
              SpaceView inclut une base de données étendue d'appareils photo, objectifs et télescopes avec spécifications précises :
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-green-600">📷 Appareils Photo</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Appareils photo reflex et sans miroir</li>
                  <li>• Appareils photo d'astronomie dédiés</li>
                  <li>• Spécifications et caractéristiques de capteur</li>
                  <li>• Performance de bruit et sensibilité</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-blue-600">🔭 Objectifs & Télescopes</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Objectifs grand-angle à super-téléphoto</li>
                  <li>• Télescopes réfracteurs, réflecteurs et SCT</li>
                  <li>• Combinaisons de focale et d'ouverture</li>
                  <li>• Calculs de champ de vision</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-purple-600">🎛️ Accessoires</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Montures de suivi et suiveurs d'étoiles</li>
                  <li>• Filtres et réduction de pollution lumineuse</li>
                  <li>• Lentilles de Barlow et réducteurs focaux</li>
                  <li>• Systèmes d'autoguidage</li>
                </ul>
              </div>
            </div>
          </section>

          <div className="text-center">
            <Link
              to="/fr?start=true"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors text-lg"
            >
              Commencer la Planification de Votre Session
            </Link>
            <p className="text-sm text-gray-500 mt-2">
              Gratuit • Aucune inscription requise • Fonctionne dans votre navigateur
            </p>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              © 2025 SpaceView.me - Simulateur astronomique open source
            </div>
            <div className="flex gap-4 text-sm">
              <Link to="/fr/info/help" className="text-gray-600 hover:text-blue-600">Aide</Link>
              <Link to="/fr/info/contact" className="text-gray-600 hover:text-blue-600">Contact</Link>
              <a href="https://github.com/antoine-paris/spaceview" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}