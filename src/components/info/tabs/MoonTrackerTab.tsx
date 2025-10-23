import React from 'react';

export default function MoonTrackerTab() {
  return (
    <article itemScope itemType="https://schema.org/SoftwareApplication">
      <h1 itemProp="name">MoonTracker — Visualisation interactive du ciel</h1>
      <p itemProp="description">
        MoonTracker est une application web pour visualiser en temps réel la Lune, le Soleil, les étoiles et les planètes
        avec positions topocentriques, tailles apparentes, phases et orientations (limbe lumineux), et plusieurs projections
        adaptées au champ de vision photographique.
      </p>

      <h2>Objectifs</h2>
      <ul>
        <li>Préparer observations et prises de vue (simulation d’optique, cadre photo, FOV horizontal/vertical).</li>
        <li>Comprendre phases, parallaxe, libration, hauteur méridienne, écliptique, orientations du terminateur.</li>
        <li>Comparer simulation et réel pour documenter des phénomènes (éclipses, transits, oppositions).</li>
      </ul>

      <h2>Fonctionnalités principales</h2>
      <ul>
        <li>Alt/az topocentriques Soleil/Lune/planètes; étoiles jusqu’à magnitude 9 selon le jeu de données.</li>
        <li>Phase/fraction éclairée, diamètre apparent, limbe lumineux et orientation du terminateur lunaire.</li>
        <li>Projections: Recti‑Panini (ultra‑large), Rectilinear, Stereographic centré, Orthographic, Cylindrique.</li>
        <li>Réfraction atmosphérique optionnelle; horizon, grille, marqueurs cardinaux, écliptique.</li>
        <li>Rendu 3D (Lune/planètes) avec préchauffage pour éviter les flashes à la première frame.</li>
        <li>Timelapse (minute/heure/jour/jour sidéral/mois/fractions lunaires), boucle, lecture/pause.</li>
        <li>Cadre photo et simulation d’optiques (capteurs, focales, équivalences 35 mm, liaison d’aspect).</li>
        <li>URL partageable encodant l’état complet, export PNG/copie presse‑papiers.</li>
      </ul>

      <h2>Open‑source et crédits</h2>
      <p>
        Code source: <a href="https://github.com/votre-org/moontracker" target="_blank" rel="noopener noreferrer" itemProp="url">GitHub</a> — 
        licence <span itemProp="license">MIT</span>. Technologies: React, TypeScript, Vite, Tailwind, three.js, @react-three/fiber,
        astronomy-engine, Natural Earth, etc.
      </p>

      <figure>
        <img loading="lazy" src="/preview2.jpg" alt="Interface MoonTracker avec projections et contrôles" width="1200" height="675" />
        <figcaption>Projections, contrôles d’optique, étoiles et écliptique.</figcaption>
      </figure>
    </article>
  );
}