
export default function BugReportTab() {
  return (
    <article>
      <h1>Déclarer un bug</h1>
      <p>
        Merci d’aider à améliorer l’application. Un bon signalement inclut l’URL partageable (paramètres encodés), une capture,
        et si possible une photo in‑situ montrant l’écart.
      </p>

      <h2>Étapes</h2>
      <ol>
        <li>
          Ouvrir un ticket: <a href="https://github.com/votre-org/moontracker/issues" target="_blank" rel="noopener noreferrer">Nouvelle issue GitHub</a>.
        </li>
        <li>
          Décrire le contexte: navigateur (version), OS, appareil, taille de fenêtre ou device pixel ratio si pertinent.
        </li>
        <li>
          Joindre la capture de l’application (bouton appareil photo) et, si possible, une photo correspondante du ciel.
        </li>
        <li>
          Inclure l’URL de partage générée par l’app (elle encode lieu, date/heure UTC, vue, options).
        </li>
        <li>
          Préciser les étapes pour reproduire le problème (lieu, heure, options activées).
        </li>
      </ol>

      <h2>Conseils</h2>
      <ul>
        <li>Vérifiez l’heure UTC et le fuseau du lieu choisi pour éviter les confusions DST.</li>
        <li>Indiquez si la réfraction était activée et l’altitude de l’objet (effets sensibles près de l’horizon).</li>
      </ul>
    </article>
  );
}