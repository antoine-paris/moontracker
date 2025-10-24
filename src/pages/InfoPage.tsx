import { useEffect } from 'react';
import InfoTabs from '../components/info/InfoTabs';

export default function InfoPage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'MoonTracker — Informations, Aide, Simulations';
    const metaDesc = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    metaDesc.setAttribute('content', 'Aide MoonTracker, exemples de simulations, liens et guide de déclaration de bug. Visualisez Lune, Soleil, étoiles et planètes.');
    if (!metaDesc.parentNode) document.head.appendChild(metaDesc);

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'MoonTracker',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      url: window.location.origin,
      description: 'Application web pour visualiser la Lune, le Soleil, les étoiles et les planètes en temps réel.',
      license: 'https://opensource.org/license/mit/',
    });
    document.head.appendChild(script);

    return () => {
      document.title = prevTitle;
      document.head.removeChild(script);
    };
  }, []);

  const hash = (typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '') || 'moontracker';

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="p-3 border-b border-white/10">
        <a href="/" className="text-white/80 hover:text-white">← Retour</a>
      </header>
      <main className="max-w-6xl mx-auto p-3">
        <InfoTabs initialTab={hash} />
      </main>
    </div>
  );
}