import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguageFromPath } from '../hooks/useLanguageFromPath';
import InfoLogo from '../components/info/InfoLogo';

export default function AstrPhotographyPlannerPage() {
  useLanguageFromPath();

  // SEO metadata
  React.useEffect(() => {
    const title = "Astrophotography Planner - SpaceView.me | Camera Settings & Sky Planning Tool";
    const description = "Plan your astrophotography sessions with precise sky calculations, camera settings simulation, and optimal timing for celestial events. Perfect for deep-sky and planetary photography.";
    
    document.title = title;
    
    const metaDesc = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    metaDesc.setAttribute('content', description);
    if (!metaDesc.parentNode) document.head.appendChild(metaDesc);

    // Structured data for this specific tool
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Astrophotography Planner",
      "description": description,
      "url": window.location.href,
      "applicationCategory": "EducationalApplication",
      "featureList": [
        "Camera and lens simulation",
        "Field of view calculations",
        "Optimal timing predictions",
        "Sky darkness assessment",
        "Target visibility planning",
        "Equipment recommendations",
        "Session scheduling"
      ],
      "isPartOf": {
        "@type": "WebApplication",
        "name": "SpaceView.me",
        "url": "https://spaceview.me"
      }
    };

    let script = document.getElementById('astrophoto-jsonld') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'astrophoto-jsonld';
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
              <span className="text-base font-semibold">Astrophotography Planner</span>
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
              Open Planner
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <article>
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Astrophotography Planner & Session Calculator</h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Plan perfect astrophotography sessions with precise sky calculations, camera simulation, and optimal timing predictions. 
              From wide-field Milky Way shots to detailed planetary imaging.
            </p>
          </header>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-3 text-blue-600">📷 Equipment Simulation</h2>
              <ul className="space-y-2 text-gray-700">
                <li>• Camera and lens field of view calculations</li>
                <li>• Focal length recommendations by target</li>
                <li>• Sensor size and crop factor considerations</li>
                <li>• Photo frame overlay for composition</li>
                <li>• Tracking mount requirements</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-3 text-purple-600">🌌 Sky Conditions</h2>
              <ul className="space-y-2 text-gray-700">
                <li>• Moon phase and interference assessment</li>
                <li>• Optimal darkness windows</li>
                <li>• Target altitude and visibility</li>
                <li>• Atmospheric transparency factors</li>
                <li>• Best imaging hours calculation</li>
              </ul>
            </div>
          </div>

          <section className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Photography Planning Workflow</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">1</div>
                <h3 className="font-semibold mb-2">Choose Target</h3>
                <p className="text-sm text-gray-600">Select celestial objects or events to photograph</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">2</div>
                <h3 className="font-semibold mb-2">Set Equipment</h3>
                <p className="text-sm text-gray-600">Configure your camera, lens, and telescope setup</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">3</div>
                <h3 className="font-semibold mb-2">Plan Timing</h3>
                <p className="text-sm text-gray-600">Find optimal dates and times for your session</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">4</div>
                <h3 className="font-semibold mb-2">Capture & Share</h3>
                <p className="text-sm text-gray-600">Execute your plan and share results</p>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Featured Astrophotography Examples</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link 
                to="/?tl=-teqghl.s6l39p&lp=5xc&l=3110876&t=s793kh&F=9&p=0&d=VM&z=vm173&b=9hec&pl=a&sr=-6.9833&da=34.73&dh=89.9"
                className="block bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-blue-600 mb-2">🌌 Milky Way Photography</h3>
                <p className="text-sm text-gray-600">Wide-field setup for capturing the galactic center</p>
              </Link>
              <Link 
                to="/?tl=uit0jk.tp0z3k&lp=5xc&l=5128581&t=tp0zab&F=1&p=5&d=nikon-p1000&z=p1000-2000eq&b=5z03&pl=a&sr=0.0167"
                className="block bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-red-600 mb-2">🌕 Lunar Close-ups</h3>
                <p className="text-sm text-gray-600">Telephoto lens configuration for detailed moon shots</p>
              </Link>
              <Link 
                to="/?tl=1iit.usgh40&lp=5xc&l=2988507&t=wad7s0&F=0&p=0&d=custom&k=1&f=1&b=5z2d&pl=a&sr=214.852"
                className="block bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-orange-600 mb-2">🪐 Planetary Imaging</h3>
                <p className="text-sm text-gray-600">High-magnification setup for planet photography</p>
              </Link>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Photography Types & Techniques</h2>
            <div className="space-y-6">
              
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-lg mb-2 text-blue-600">Deep-Sky Photography</h3>
                <p className="text-gray-700 mb-2">
                  Capture nebulae, galaxies, and star clusters with long exposure techniques.
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Dark sky locations and moon avoidance</li>
                  <li>Tracking mount requirements and polar alignment</li>
                  <li>Multiple exposure stacking and processing</li>
                  <li>Filter recommendations (L-RGB, narrowband)</li>
                </ul>
              </div>

              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-semibold text-lg mb-2 text-red-600">Lunar & Planetary</h3>
                <p className="text-gray-700 mb-2">
                  High-resolution imaging of solar system objects with precise timing.
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Optimal opposition and conjunction timing</li>
                  <li>Atmospheric seeing and turbulence considerations</li>
                  <li>Video capture and lucky imaging techniques</li>
                  <li>Barlow lens and focal ratio calculations</li>
                </ul>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-lg mb-2 text-purple-600">Wide-Field Astrophotography</h3>
                <p className="text-gray-700 mb-2">
                  Landscape astrophotography combining foreground and sky elements.
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Composition planning with foreground elements</li>
                  <li>Focus stacking and exposure blending</li>
                  <li>Milky Way positioning and visibility windows</li>
                  <li>Light pollution assessment and mitigation</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Equipment Database</h2>
            <p className="text-gray-700 mb-4">
              SpaceView includes an extensive database of cameras, lenses, and telescopes with precise specifications:
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-green-600">📷 Cameras</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• DSLR and mirrorless cameras</li>
                  <li>• Dedicated astronomy cameras</li>
                  <li>• Sensor specifications and characteristics</li>
                  <li>• Noise performance and sensitivity</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-blue-600">🔭 Lenses & Telescopes</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Wide-angle to super-telephoto lenses</li>
                  <li>• Refractor, reflector, and SCT telescopes</li>
                  <li>• Focal length and aperture combinations</li>
                  <li>• Field of view calculations</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-purple-600">🎛️ Accessories</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Tracking mounts and star trackers</li>
                  <li>• Filters and light pollution reduction</li>
                  <li>• Barlow lenses and focal reducers</li>
                  <li>• Autoguiding systems</li>
                </ul>
              </div>
            </div>
          </section>

          <div className="text-center">
            <Link
              to="/?start=true"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors text-lg"
            >
              Start Planning Your Session
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