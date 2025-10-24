
export default function FlatEarthTab() {
  return (
    <article>
      <h1>Flat‑earth — Vérifications reproductibles par l’observation</h1>
      <p>
        Vérifications simples, réalisables sur le terrain et simulables dans l’application, illustrant la cohérence du modèle
        standard (Terre sphérique, Soleil éloigné, parallaxe lunaire).
      </p>

      <h2>Principes vérifiables</h2>
      <ul>
        <li>
          Orientation du terminateur lunaire: dépend de l’axe Soleil‑Lune‑observateur; varie avec latitude et heure. La simulation
          reproduit ces orientations dans les deux hémisphères.
        </li>
        <li>
          Hauteur du Soleil à midi: varie avec latitude et saison (déclinaison solaire). Mesurable avec un gnomon.
        </li>
        <li>
          Ciel austral et Croix du Sud: invisible depuis les hautes latitudes nord; visible et orientée différemment dans le Sud.
        </li>
        <li>
          Parallaxe lunaire: mesurable depuis deux villes éloignées (décalage par rapport aux étoiles), cohérente avec ~384 400 km.
        </li>
      </ul>

      <h2>Protocoles d’observation recommandés</h2>
      <ul>
        <li>
          Sélectionnez deux lieux distants (ex: Paris et Québec), synchronisez l’heure et comparez altitude/azimut de la Lune,
          son diamètre apparent et l’orientation du terminateur.
        </li>
        <li>
          Suivez l’écliptique sur une nuit claire; vérifiez la trajectoire apparente des planètes.
        </li>
        <li>
          Près de l’horizon, comparez les hauteurs avec et sans réfraction pour estimer l’effet atmosphérique.
        </li>
      </ul>

      <p>
        Utilisez les options de lieu, date/heure, projection et couches (étoiles, écliptique, réfraction), puis confrontez
        aux photos horodatées prises in‑situ.
      </p>
    </article>
  );
}