import React from 'react';
import { Link } from 'react-router-dom';

export default function HelpTab() {
  return (
    <article>
      <h1>Aide — Options et contrôles</h1>

      <h2>TopBar</h2>
      <ul>
        <li>Suivi: ciblez Soleil, Lune, une planète ou un point cardinal (N/E/S/O). La vue se recentre sur la cible.</li>
        <li>Temps: lecture/pause, vitesse (temps réel ou accéléré), timelapse (pas minute/heure/jour, etc.).</li>
        <li>Projection: Recti‑Panini (ultra‑large), Rectilinear (photo), Stereographic centré (pédagogie), Orthographic (hémisphère), Cylindrique.</li>
        <li>Visibilité: basculez Soleil/Lune/planètes/étoiles, horizon, grille, marqueurs cardinaux, écliptique.</li>
        <li>Réfraction: applique une approximation standard; désactivez pour des valeurs géométriques.</li>
        <li>Capture/Partage: export PNG et URL partageable (lieu/heure/vue/options encodés).</li>
      </ul>

      <h2>Optique et cadre photo</h2>
      <ul>
        <li>Appareil/module: sélectionnez un boîtier ou module; le cadre reflète le capteur et la focale.</li>
        <li>FOV X/Y: liez ou non les axes pour simuler des rapports d’aspect non standard ou des recadrages.</li>
        <li>“Agrandir les objets”: aide visuelle pour Soleil/Lune aux très grands angles.</li>
      </ul>

      <h2>Sidebar Locations</h2>
      <ul>
        <li>Villes: recherche, filtrage, favoris.</li>
        <li>Coordonnées: saisie lat/lon personnalisée; gestion des pôles et longitudes wrap‑around.</li>
        <li>Globe/Carte: ajustement rapide de longitude/latitude; repères azimut/altitude actifs.</li>
      </ul>

      <h2>Raccourcis utiles</h2>
      <ul>
        <li>Lecture/Pause via le bouton supérieur; navigation image‑par‑image en timelapse.</li>
        <li>Copie d’URL: partage de la configuration exacte pour reproduire une observation.</li>
      </ul>

      <p>Voir aussi la <Link to="/info#simulations">page des simulations</Link> pour des exemples prêts à l’emploi.</p>
    </article>
  );
}