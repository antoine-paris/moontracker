import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguageFromPath } from '../hooks/useLanguageFromPath';
import InfoLogo from '../components/info/InfoLogo';

export default function EclipsePredictorPage() {
  useLanguageFromPath();

  // SEO metadata
  React.useEffect(() => {
    const title = "Eclipse Predictor - SpaceView.me | Solar & Lunar Eclipse Calculator";
    const description = "Predict and visualize solar and lunar eclipses with precise timing and visibility calculations. Interactive eclipse simulator with real-time path visualization.";
    
    document.title = title;
    
    const metaDesc = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    metaDesc.setAttribute('content', description);
    if (!metaDesc.parentNode) document.head.appendChild(metaDesc);

    // Structured data for this specific tool
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Eclipse Predictor",
      "description": description,
      "url": window.location.href,
      "applicationCategory": "EducationalApplication",
      "featureList": [
        "Solar eclipse prediction",
        "Lunar eclipse prediction", 
        "Eclipse path visualization",
        "Precise timing calculations",
        "Location-based visibility",
        "Historical eclipse data"
      ],
      "isPartOf": {
        "@type": "WebApplication",
        "name": "SpaceView.me",
        "url": "https://spaceview.me"
      }
    };

    let script = document.getElementById('eclipse-jsonld') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'eclipse-jsonld';
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
              <span className="text-base font-semibold">Eclipse Predictor</span>
              <span className="text-xs text-gray-600">SpaceView.me</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/info"
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
              Info
            </Link>
            <Link
              to="/?start=true"
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Open Simulator
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
                <Link to="/" className="hover:text-blue-600">SpaceView.me</Link>
                <span className="mx-2">›</span>
                <span>Eclipse Predictor</span>
              </nav>
              <h1 className="text-3xl font-bold mb-4">Eclipse Predictor & Visualizer</h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Predict and visualize solar and lunar eclipses with scientific precision. Calculate exact timing, 
              visibility zones, and observe eclipse progression in real-time from any location on Earth.
            </p>
          </header>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-3 text-blue-600">🌑 Solar Eclipses</h2>
              <ul className="space-y-2 text-gray-700">
                <li>• Total, partial, and annular eclipse predictions</li>
                <li>• Precise contact times (C1, C2, C3, C4)</li>
                <li>• Eclipse magnitude and obscuration</li>
                <li>• Shadow path visualization</li>
                <li>• Duration calculations</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-3 text-red-600">🌕 Lunar Eclipses</h2>
              <ul className="space-y-2 text-gray-700">
                <li>• Total, partial, and penumbral eclipses</li>
                <li>• Eclipse phases and timing</li>
                <li>• Magnitude and coverage calculations</li>
                <li>• Global visibility maps</li>
                <li>• Moon's path through Earth's shadow</li>
              </ul>
            </div>
          </div>

          <section className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">How to Use the Eclipse Predictor</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">1</div>
                <h3 className="font-semibold mb-2">Select Location</h3>
                <p className="text-sm text-gray-600">Choose your observing location or enter custom coordinates</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">2</div>
                <h3 className="font-semibold mb-2">Set Date Range</h3>
                <p className="text-sm text-gray-600">Specify the time period to search for upcoming eclipses</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">3</div>
                <h3 className="font-semibold mb-2">Visualize & Plan</h3>
                <p className="text-sm text-gray-600">View eclipse progression and plan your observation or photography</p>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Featured Eclipse Simulations</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link 
                to="/?tl=1iis.skq100&lp=5xc&l=5128581&t=tp0zab&F=1&p=5&d=nikon-p1000&z=p1000-2000eq&b=5z03&pl=a&sr=0.0167"
                className="block bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-blue-600 mb-2">🌑 Total Solar Eclipse 2024</h3>
                <p className="text-sm text-gray-600">Experience the April 8, 2024 total solar eclipse path across North America</p>
              </Link>
              <Link 
                to="/?tl=3wn4.wt6xma&lp=5xc&l=2643743&t=wt6tqv&F=0&p=0&d=custom&k=1&f=35w&b=9hg7&pl=a&sr=2.0167&dh=0.11"
                className="block bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-red-600 mb-2">🌕 Lunar Eclipse Simulator</h3>
                <p className="text-sm text-gray-600">Observe lunar eclipse phases and Earth's shadow interaction</p>
              </Link>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Eclipse Photography Planning</h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                Plan your eclipse photography with precise timing and equipment simulation:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Camera and lens simulation with field of view calculations</li>
                <li>Optimal shooting positions and timing</li>
                <li>Solar filter requirements and safety guidelines</li>
                <li>Composite sequence planning for total solar eclipses</li>
                <li>Long exposure settings for lunar eclipse phases</li>
              </ul>
            </div>
          </section>

          <div className="text-center">
            <Link
              to="/?start=true"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors text-lg"
            >
              Start Eclipse Prediction
            </Link>
            <p className="text-sm text-gray-500 mt-2">
              Free • No registration required • Works in your browser
            </p>
          </div>
        </article>

        {/* Sidebar Navigation */}
        <aside className="w-80 flex-shrink-0 hidden lg:block">
          <div className="sticky top-24">
            {/* Feature Navigation would go here */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Related Tools</h2>
              <div className="space-y-3">
                <Link to="/moon-phase-calculator" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🌙</span>
                    <div>
                      <div className="font-medium text-gray-900">Moon Phase Calculator</div>
                      <div className="text-sm text-gray-500">Lunar calendar & phases</div>
                    </div>
                  </div>
                </Link>
                <Link to="/astrophotography-planner" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📷</span>
                    <div>
                      <div className="font-medium text-gray-900">Astrophotography Planner</div>
                      <div className="text-sm text-gray-500">Camera settings & planning</div>
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
              © 2025 SpaceView.me - Open source astronomical simulator
            </div>
            <div className="flex gap-4 text-sm">
              <Link to="/info/help" className="text-gray-600 hover:text-blue-600">Help</Link>
              <Link to="/info/contact" className="text-gray-600 hover:text-blue-600">Contact</Link>
              <a href="https://github.com/antoine-paris/spaceview" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}