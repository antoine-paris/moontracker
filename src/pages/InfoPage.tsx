import { useEffect, useMemo } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import InfoNav from '../components/info/InfoNav';
import InfoLogo from '../components/info/InfoLogo';

export default function InfoPage() {
  const { pathname } = useLocation();

  const seo = useMemo(() => {
    if (pathname === '/info' || pathname === '/info/') {
      return {
        title: 'SpaceView.me — Informations, Aide, Simulations',
        desc: 'Aide SpaceView, exemples de simulations, liens et guide de déclaration de bug. Visualisez Lune, Soleil, étoiles et planètes.',
      };
    }
    if (pathname.startsWith('/info/aide')) {
      return {
        title: 'SpaceView.me — Aide et documentation',
        desc: 'Découvrez les options, projections, optiques et contrôles pour utiliser SpaceView.me efficacement.',
      };
    }
    if (pathname.startsWith('/info/simulations')) {
      return {
        title: 'SpaceView.me — Simulations partageables',
        desc: 'Ouvrez des configurations prêtes à l’emploi: éclipses, transits, oppositions, saisons, hémisphères.',
      };
    }
    if (pathname.startsWith('/info/flat-earth')) {
      return {
        title: 'SpaceView.me — Observations et vérifications',
        desc: 'Vérifications reproductibles: terminateur lunaire, hauteur du Soleil, parallaxe, ciel austral.',
      };
    }
    if (pathname.startsWith('/info/bug')) {
      return {
        title: 'SpaceView.me — Déclarer un bug',
        desc: 'Signalez un problème avec URL partageable, captures, contexte (navigateur, OS, appareil).',
      };
    }
    return {
      title: 'SpaceView.me — Informations',
      desc: 'Informations, aide et simulations pour SpaceView.me.',
    };
  }, [pathname]);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = seo.title;

    const metaDesc = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    metaDesc.setAttribute('content', seo.desc);
    if (!metaDesc.parentNode) document.head.appendChild(metaDesc);

    // JSON-LD (SoftwareApplication), one instance with fixed id
    let script = document.getElementById('schema-app') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'schema-app';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'SpaceView.me',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      url: window.location.origin,
      description: 'Application web pour simuler la Lune, le Soleil, les étoiles et les planètes depuis n\'importe où.',
      license: 'https://opensource.org/license/mit/',
    });

    return () => {
      document.title = prevTitle;
      // keep meta and JSON-LD to benefit navigation between info pages
    };
  }, [seo.title, seo.desc]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Cartouche standard */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <InfoLogo showBackground={false} size={64} />
            <div className="flex flex-col leading-tight">
              <span className="text-base font-semibold">SpaceView.me</span>
              <span className="text-xs text-gray-600">Informations et Aide</span>
            </div>
          </div>
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow-sm"
            >
              ← Retour à l’application
            </Link>
          </div>
        </div>
        <div className="max-w-6xl mx-auto">
          <InfoNav />
        </div>
      </header>

      {/* Contenu (prose claire avec hiérarchie H1/H2/H3) */}
      <main className="max-w-6xl mx-auto px-3 py-4">
        <section className="prose prose-info max-w-none font-sans">
          {/* Les articles (tabs) existants rendent leurs H1/H2/H3 */}
          <Outlet />
        </section>
      </main>

      <footer className="border-t border-gray-200 text-sm text-gray-600">
        <div className="max-w-6xl mx-auto px-3 py-4">
          © {new Date().getFullYear()} SpaceView — MIT
        </div>
      </footer>
    </div>
  );
}