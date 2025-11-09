import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguageFromPath } from '../hooks/useLanguageFromPath';
import InfoLogo from '../components/info/InfoLogo';

export default function MoonPhaseCalculatorPageFr() {
  useLanguageFromPath();

  // SEO metadata
  React.useEffect(() => {
    const title = "Calculateur de Phases Lunaires - SpaceView.me | Calendrier Lunaire & Prédicteur de Phases";
    const description = "Calculez les phases lunaires précises, créez des calendriers lunaires et suivez la position de la Lune pour n'importe quelle date et localisation. Simulateur interactif de phases lunaires avec libration et calculs de taille apparente.";
    
    document.title = title;
    
    const metaDesc = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    metaDesc.setAttribute('content', description);
    if (!metaDesc.parentNode) document.head.appendChild(metaDesc);

    // Structured data for this specific tool
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Calculateur de Phases Lunaires",
      "description": description,
      "url": window.location.href,
      "applicationCategory": "EducationalApplication",
      "inLanguage": "fr",
      "featureList": [
        "Prédiction des phases lunaires",
        "Génération de calendrier lunaire",
        "Heures de lever et coucher de lune",
        "Visualisation de la libration lunaire", 
        "Calculs de taille apparente",
        "Suivi de la position lunaire",
        "Planification photographique"
      ],
      "isPartOf": {
        "@type": "WebApplication",
        "name": "SpaceView.me",
        "url": "https://spaceview.me"
      }
    };

    let script = document.getElementById('moonphase-jsonld-fr') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'moonphase-jsonld-fr';
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
              <span className="text-base font-semibold">Calculateur de Phases Lunaires</span>
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
              Ouvrir le Simulateur
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
              <span>Calculateur de Phases Lunaires</span>
            </nav>
            <h1 className="text-3xl font-bold mb-4">Calculateur de Phases Lunaires & Calendrier Lunaire</h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Calculez les phases lunaires précises, créez des calendriers lunaires et suivez la position de la Lune avec une précision scientifique. 
              Parfait pour les passionnés d'astronomie, les photographes et les observateurs lunaires.
            </p>
          </header>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-3 text-blue-600">🌙 Calculs de Phases</h2>
              <ul className="space-y-2 text-gray-700">
                <li>• Nouvelle Lune, Premier Croissant, Premier Quartier</li>
                <li>• Lune Gibbeuse Croissante, Pleine Lune, Lune Gibbeuse Décroissante</li>
                <li>• Dernier Quartier, Dernier Croissant</li>
                <li>• Pourcentage et fraction d'illumination</li>
                <li>• Âge de la phase en jours</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-3 text-purple-600">🔄 Libration & Mouvement</h2>
              <ul className="space-y-2 text-gray-700">
                <li>• Libration lunaire en longitude et latitude</li>
                <li>• Caractéristiques lunaires visibles et mers</li>
                <li>• Position orbitale et distance de la Lune</li>
                <li>• Variations du diamètre apparent</li>
                <li>• Calculs d'angle du limbe éclairé</li>
              </ul>
            </div>
          </div>

          <section className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Fonctionnalités du Calendrier Lunaire</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">🌑</div>
                <h3 className="font-semibold mb-1">Nouvelle Lune</h3>
                <p className="text-xs text-gray-600">Idéale pour la photographie du ciel profond</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">🌓</div>
                <h3 className="font-semibold mb-1">Premier Quartier</h3>
                <p className="text-xs text-gray-600">Parfaite pour les détails de surface lunaire</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">🌕</div>
                <h3 className="font-semibold mb-1">Pleine Lune</h3>
                <p className="text-xs text-gray-600">Parfaite pour la photographie lunaire</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">🌗</div>
                <h3 className="font-semibold mb-1">Dernier Quartier</h3>
                <p className="text-xs text-gray-600">Idéale pour les observations matinales</p>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Simulations Lunaires en Vedette</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link 
                to="/fr?tl=uit0jk.tp0z3k&lp=5xc&l=5128581&t=tp0zab&F=1&p=5&d=nikon-p1000&z=p1000-2000eq&b=5z03&pl=a&sr=0.0167"
                className="block bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-blue-600 mb-2">🌕 Pleine Lune au Périgée</h3>
                <p className="text-sm text-gray-600">Vivez une super-lune - quand la lune apparaît la plus grande dans le ciel</p>
              </Link>
              <Link 
                to="/fr?tl=-teqghl.s6l39p&lp=5xc&l=3110876&t=s793kh&F=9&p=0&d=VM&z=vm173&b=9hec&pl=a&sr=-6.9833&da=34.73&dh=89.9"
                className="block bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-purple-600 mb-2">🔄 Cycle de Libration Lunaire</h3>
                <p className="text-sm text-gray-600">Observez comment la lune semble "se balancer" d'avant en arrière</p>
              </Link>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Planification de Photographie Lunaire</h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                Planifiez vos sessions de photographie lunaire avec précision :
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2 text-blue-600">Chronométrage Optimal</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>Heures de lever et coucher de lune</li>
                    <li>Calculs d'heure dorée et heure bleue</li>
                    <li>Meilleures phases pour différents styles photographiques</li>
                    <li>Conditions atmosphériques et clarté</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-purple-600">Réglages d'Appareil</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>Simulation de focale et champ de vision</li>
                    <li>Recommandations d'exposition par phase</li>
                    <li>Exigences de suivi pour longues expositions</li>
                    <li>Planification de composition avec éléments de premier plan</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Fonctionnalités Avancées</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-green-600">📍 Basé sur la Localisation</h3>
                <p className="text-sm text-gray-700">
                  Calculez les phases et positions lunaires pour n'importe quel endroit sur Terre avec des corrections topocentriques précises.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-orange-600">⏰ Voyage dans le Temps</h3>
                <p className="text-sm text-gray-700">
                  Explorez les phases lunaires historiques ou prédisez les événements lunaires futurs avec notre fonction timelapse.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-red-600">📊 Export de Données</h3>
                <p className="text-sm text-gray-700">
                  Générez des calendriers lunaires, exportez des données de phases et créez des horaires d'observation personnalisés.
                </p>
              </div>
            </div>
          </section>

          <div className="text-center">
            <Link
              to="/fr?start=true"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors text-lg"
            >
              Calculer les Phases Lunaires
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