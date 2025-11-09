import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguageFromPath } from '../hooks/useLanguageFromPath';
import InfoLogo from '../components/info/InfoLogo';

export default function EclipsePredictorPageFr() {
  useLanguageFromPath();

  // SEO metadata
  React.useEffect(() => {
    const title = "Prédicteur d'Éclipses - SpaceView.me | Calculateur d'Éclipses Solaires et Lunaires";
    const description = "Prédisez et visualisez les éclipses solaires et lunaires avec des calculs précis de chronométrage et de visibilité. Simulateur d'éclipses interactif avec visualisation en temps réel.";
    
    document.title = title;
    
    const metaDesc = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    metaDesc.setAttribute('content', description);
    if (!metaDesc.parentNode) document.head.appendChild(metaDesc);

    // Structured data for this specific tool
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Prédicteur d'Éclipses",
      "description": description,
      "url": window.location.href,
      "applicationCategory": "EducationalApplication",
      "inLanguage": "fr",
      "featureList": [
        "Prédiction d'éclipses solaires",
        "Prédiction d'éclipses lunaires", 
        "Visualisation du trajet des éclipses",
        "Calculs de chronométrage précis",
        "Visibilité basée sur la localisation",
        "Données d'éclipses historiques"
      ],
      "isPartOf": {
        "@type": "WebApplication",
        "name": "SpaceView.me",
        "url": "https://spaceview.me"
      }
    };

    let script = document.getElementById('eclipse-jsonld-fr') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'eclipse-jsonld-fr';
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
              <span className="text-base font-semibold">Prédicteur d'Éclipses</span>
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
        <div className="flex gap-8">
          {/* Main content */}
          <article className="flex-1">
            <header className="mb-8">
              <nav className="text-sm text-gray-500 mb-4">
                <Link to="/fr" className="hover:text-blue-600">SpaceView.me</Link>
                <span className="mx-2">›</span>
                <span>Prédicteur d'Éclipses</span>
              </nav>
              <h1 className="text-3xl font-bold mb-4">Prédicteur & Visualiseur d'Éclipses</h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                Prédisez et visualisez les éclipses solaires et lunaires avec une précision scientifique. Calculez les horaires exacts, 
                les zones de visibilité et observez la progression des éclipses en temps réel depuis n'importe quel endroit sur Terre.
              </p>
            </header>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-3 text-blue-600">🌑 Éclipses Solaires</h2>
                <ul className="space-y-2 text-gray-700">
                  <li>• Prédictions d'éclipses totales, partielles et annulaires</li>
                  <li>• Horaires de contact précis (C1, C2, C3, C4)</li>
                  <li>• Magnitude et obscuration de l'éclipse</li>
                  <li>• Visualisation du trajet de l'ombre</li>
                  <li>• Calculs de durée</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-3 text-red-600">🌕 Éclipses Lunaires</h2>
                <ul className="space-y-2 text-gray-700">
                  <li>• Éclipses totales, partielles et pénombrales</li>
                  <li>• Phases et chronométrage des éclipses</li>
                  <li>• Calculs de magnitude et de couverture</li>
                  <li>• Cartes de visibilité mondiale</li>
                  <li>• Trajet de la Lune dans l'ombre terrestre</li>
                </ul>
              </div>
            </div>

            <section className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-4">Comment Utiliser le Prédicteur d'Éclipses</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">1</div>
                  <h3 className="font-semibold mb-2">Choisir la Localisation</h3>
                  <p className="text-sm text-gray-600">Sélectionnez votre lieu d'observation ou entrez des coordonnées personnalisées</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">2</div>
                  <h3 className="font-semibold mb-2">Définir la Période</h3>
                  <p className="text-sm text-gray-600">Spécifiez la période de temps pour rechercher les éclipses à venir</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">3</div>
                  <h3 className="font-semibold mb-2">Visualiser & Planifier</h3>
                  <p className="text-sm text-gray-600">Voir la progression de l'éclipse et planifier votre observation ou photographie</p>
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-4">Simulations d'Éclipses en Vedette</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Link 
                  to="/fr?tl=1iis.skq100&lp=5xc&l=5128581&t=tp0zab&F=1&p=5&d=nikon-p1000&z=p1000-2000eq&b=5z03&pl=a&sr=0.0167"
                  className="block bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-blue-600 mb-2">🌑 Éclipse Solaire Totale 2024</h3>
                  <p className="text-sm text-gray-600">Vivez l'éclipse solaire totale du 8 avril 2024 à travers l'Amérique du Nord</p>
                </Link>
                <Link 
                  to="/fr?tl=3wn4.wt6xma&lp=5xc&l=2643743&t=wt6tqv&F=0&p=0&d=custom&k=1&f=35w&b=9hg7&pl=a&sr=2.0167&dh=0.11"
                  className="block bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-red-600 mb-2">🌕 Simulateur d'Éclipse Lunaire</h3>
                  <p className="text-sm text-gray-600">Observez les phases d'éclipse lunaire et l'interaction avec l'ombre terrestre</p>
                </Link>
              </div>
            </section>

            <section className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-4">Planification de Photographie d'Éclipse</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  Planifiez votre photographie d'éclipse avec un chronométrage et une simulation d'équipement précis :
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Simulation d'appareil photo et d'objectif avec calculs de champ de vision</li>
                  <li>Positions et chronométrage de prise de vue optimaux</li>
                  <li>Exigences de filtre solaire et consignes de sécurité</li>
                  <li>Planification de séquence composite pour éclipses solaires totales</li>
                  <li>Réglages de longue exposition pour phases d'éclipse lunaire</li>
                </ul>
              </div>
            </section>

            <div className="text-center">
              <Link
                to="/fr?start=true"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors text-lg"
              >
                Commencer la Prédiction d'Éclipse
              </Link>
              <p className="text-sm text-gray-500 mt-2">
                Gratuit • Aucune inscription requise • Fonctionne dans votre navigateur
              </p>
            </div>
          </article>

          {/* Sidebar Navigation */}
          <aside className="w-80 flex-shrink-0 hidden lg:block">
            <div className="sticky top-24">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Outils Associés</h2>
                <div className="space-y-3">
                  <Link to="/fr/moon-phase-calculator" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🌙</span>
                      <div>
                        <div className="font-medium text-gray-900">Calculateur de Phases Lunaires</div>
                        <div className="text-sm text-gray-500">Calendrier lunaire & phases</div>
                      </div>
                    </div>
                  </Link>
                  <Link to="/fr/astrophotography-planner" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📷</span>
                      <div>
                        <div className="font-medium text-gray-900">Planificateur d'Astrophotographie</div>
                        <div className="text-sm text-gray-500">Réglages d'appareil & planification</div>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
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