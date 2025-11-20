# VideoIntro Component

## Description

Le composant `VideoIntro` affiche une introduction lors de l'enregistrement vidéo. Il apparaît pendant 2 secondes au début de chaque enregistrement et disparaît progressivement avec un effet de fondu.

## Caractéristiques

- **Durée d'affichage** : 2000ms (configurable via `INTRO_DURATION_MS`)
- **Durée du fondu** : 500ms (configurable via `FADE_OUT_DURATION_MS`)
- **Fond transparent** : S'intègre naturellement au-dessus du SpaceView
- **Responsive** : S'adapte à la taille du viewport
- **Multilingue** : Prêt pour l'internationalisation

## Contenu affiché

### En-tête
- **Titre** : "SpaceView.me"
- **Sous-titre** : "Astrophotography & sky simulator"

### Paramètres de simulation
Affichés dans un panneau semi-transparent avec deux colonnes :

**Colonne gauche :**
- Location (lieu)
- Coordinates (coordonnées)
- Date

**Colonne droite :**
- Azimuth
- Altitude
- FOV (champ de vision)
- Camera (optionnel)

## Intégration dans SpaceView

Le composant est intégré dans `SpaceView.tsx` et contrôlé depuis `App.tsx` via :

```typescript
// Dans App.tsx
const [showVideoIntro, setShowVideoIntro] = useState(false);

// Activé au démarrage de l'enregistrement
setShowVideoIntro(true);

// Désactivé à l'arrêt ou après 2 secondes
setShowVideoIntro(false);
```

```tsx
// Dans SpaceView.tsx
<VideoIntro
  show={showVideoIntro}
  location={overlaySplit.place}
  date={overlaySplit.date}
  coordinates={`${formatDeg(latDeg, 0)} ${formatDeg(lngDeg, 0)}`}
  azimuth={`${compass16(refAzDeg, t)} ${formatDeg(refAzDeg, 0)}`}
  altitude={formatDeg(refAltDeg, 0)}
  fov={`${fovXDeg.toFixed(1)}° × ${fovYDeg.toFixed(1)}°`}
  cameraLabel={cameraLabel}
  viewport={viewport}
  onIntroComplete={onVideoIntroComplete}
/>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `show` | `boolean` | Contrôle l'affichage de l'intro |
| `location` | `string` | Nom du lieu d'observation |
| `date` | `string` | Date et heure de la simulation |
| `coordinates` | `string` | Coordonnées géographiques formatées |
| `azimuth` | `string` | Azimut de la direction d'observation |
| `altitude` | `string` | Altitude de la direction d'observation |
| `fov` | `string` | Champ de vision (largeur × hauteur) |
| `cameraLabel` | `string?` | Nom de l'appareil/zoom utilisé |
| `viewport` | `{x, y, w, h}` | Dimensions et position du viewport |
| `onIntroComplete` | `() => void?` | Callback appelé après le fondu complet |

## Personnalisation

### Durées

Modifiez les constantes en haut du fichier :

```typescript
const INTRO_DURATION_MS = 2000;      // Durée totale d'affichage
const FADE_OUT_DURATION_MS = 500;    // Durée du fondu de sortie
```

### Styles

Le composant utilise Tailwind CSS pour le style. Les tailles de police s'adaptent automatiquement au viewport :

- Titre : `max(32px, viewport.w / 25)`
- Sous-titre : `max(16px, viewport.w / 50)`
- Paramètres : `max(12px, viewport.w / 80)`

### Z-index

L'intro utilise `zIndex: 9999` pour apparaître au-dessus de tous les autres éléments.

## Amélirations futures possibles

- [ ] Ajout d'animations d'entrée (slide-in, fade-in)
- [ ] Support de templates personnalisés
- [ ] Logo/image de fond paramétrable
- [ ] Traductions i18n pour les labels
- [ ] Thèmes de couleur personnalisables
- [ ] Animation des paramètres (apparition séquentielle)
