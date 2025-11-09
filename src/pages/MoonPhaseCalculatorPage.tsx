import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguageFromPath } from '../hooks/useLanguageFromPath';
import InfoLogo from '../components/info/InfoLogo';

export default function MoonPhaseCalculatorPage() {
  useLanguageFromPath();

  // SEO metadata
  React.useEffect(() => {
    const title = "Moon Phase Calculator - SpaceView.me | Lunar Calendar & Phase Predictor";
    const description = "Calculate precise moon phases, lunar calendar, and moon position for any date and location. Interactive lunar phase simulator with libration and apparent size calculations.";
    
    document.title = title;
    
    const metaDesc = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    metaDesc.setAttribute('content', description);
    if (!metaDesc.parentNode) document.head.appendChild(metaDesc);

    // Structured data for this specific tool
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Moon Phase Calculator",
      "description": description,
      "url": window.location.href,
      "applicationCategory": "EducationalApplication",
      "featureList": [
        "Moon phase prediction",
        "Lunar calendar generation",
        "Moon rise and set times",
        "Lunar libration visualization", 
        "Apparent size calculations",
        "Moon position tracking",
        "Photography planning"
      ],
      "isPartOf": {
        "@type": "WebApplication",
        "name": "SpaceView.me",
        "url": "https://spaceview.me"
      }
    };

    let script = document.getElementById('moonphase-jsonld') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'moonphase-jsonld';
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
              <span className="text-base font-semibold">Moon Phase Calculator</span>
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
        <article>
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Moon Phase Calculator & Lunar Calendar</h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Calculate precise moon phases, create lunar calendars, and track the moon's position with scientific accuracy. 
              Perfect for astronomy enthusiasts, photographers, and lunar observers.
            </p>
          </header>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-3 text-blue-600">🌙 Phase Calculations</h2>
              <ul className="space-y-2 text-gray-700">
                <li>• New Moon, Waxing Crescent, First Quarter</li>
                <li>• Waxing Gibbous, Full Moon, Waning Gibbous</li>
                <li>• Last Quarter, Waning Crescent phases</li>
                <li>• Illumination percentage and fraction</li>
                <li>• Phase age in days</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-3 text-purple-600">🔄 Libration & Motion</h2>
              <ul className="space-y-2 text-gray-700">
                <li>• Lunar libration in longitude and latitude</li>
                <li>• Visible lunar features and maria</li>
                <li>• Moon's orbital position and distance</li>
                <li>• Apparent diameter variations</li>
                <li>• Bright limb angle calculations</li>
              </ul>
            </div>
          </div>

          <section className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Lunar Calendar Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">🌑</div>
                <h3 className="font-semibold mb-1">New Moon</h3>
                <p className="text-xs text-gray-600">Best for deep-sky photography</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">🌓</div>
                <h3 className="font-semibold mb-1">First Quarter</h3>
                <p className="text-xs text-gray-600">Ideal for lunar surface details</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">🌕</div>
                <h3 className="font-semibold mb-1">Full Moon</h3>
                <p className="text-xs text-gray-600">Perfect for lunar photography</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">🌗</div>
                <h3 className="font-semibold mb-1">Last Quarter</h3>
                <p className="text-xs text-gray-600">Great for morning observations</p>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Featured Moon Simulations</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link 
                to="/?tl=uit0jk.tp0z3k&lp=5xc&l=5128581&t=tp0zab&F=1&p=5&d=nikon-p1000&z=p1000-2000eq&b=5z03&pl=a&sr=0.0167"
                className="block bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-blue-600 mb-2">🌕 Full Moon at Perigee</h3>
                <p className="text-sm text-gray-600">Experience a supermoon - when the moon appears largest in the sky</p>
              </Link>
              <Link 
                to="/?tl=-teqghl.s6l39p&lp=5xc&l=3110876&t=s793kh&F=9&p=0&d=VM&z=vm173&b=9hec&pl=a&sr=-6.9833&da=34.73&dh=89.9"
                className="block bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-purple-600 mb-2">🔄 Lunar Libration Cycle</h3>
                <p className="text-sm text-gray-600">Observe how the moon appears to "rock" back and forth</p>
              </Link>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Moon Photography Planning</h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                Plan your lunar photography sessions with precision:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2 text-blue-600">Optimal Timing</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>Moon rise and set times</li>
                    <li>Golden hour and blue hour calculations</li>
                    <li>Best phases for different photography styles</li>
                    <li>Atmospheric conditions and clarity</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-purple-600">Camera Settings</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>Focal length and field of view simulation</li>
                    <li>Exposure recommendations by phase</li>
                    <li>Tracking requirements for long exposures</li>
                    <li>Composition planning with foreground elements</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Advanced Features</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-green-600">📍 Location-Based</h3>
                <p className="text-sm text-gray-700">
                  Calculate moon phases and positions for any location on Earth with precise topocentric corrections.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-orange-600">⏰ Time Travel</h3>
                <p className="text-sm text-gray-700">
                  Explore historical moon phases or predict future lunar events with our time-lapse feature.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-red-600">📊 Data Export</h3>
                <p className="text-sm text-gray-700">
                  Generate lunar calendars, export phase data, and create custom observation schedules.
                </p>
              </div>
            </div>
          </section>

          <div className="text-center">
            <Link
              to="/?start=true"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors text-lg"
            >
              Calculate Moon Phases
            </Link>
            <p className="text-sm text-gray-500 mt-2">
              Free • No registration required • Works in your browser
            </p>
          </div>
        </article>
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