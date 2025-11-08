import React, { Suspense, useMemo } from 'react';
import { Canvas, useFrame  } from '@react-three/fiber';
import { useGLTF, OrthographicCamera, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { Z } from '../../render/constants';
import { getOrProcess, MOON_RELIEF_SCALE_DEFAULT } from '../../render/modelPrewarm';

// Calibration dépendante du GLB (orientation et axes locaux du modèle)
// Si vous changez de modèle GLB, ajustez ces valeurs ici.
const GLB_CALIB = {
  rotationBaseDeg: { x: 0, y: -90, z: 180 }, // base pour obtenir North-Up et face visible
  northLocal: new THREE.Vector3(0, 0, 1),
  viewForwardLocal: new THREE.Vector3(0, 0, -1), // direction vers la caméra dans l'espace local du GLB
} as const;

// Facteurs (en multiples du rayon) pour dimensionner la boîte autour des marqueurs
const AXIS_LEN_FACTOR = 0.125; // longueur du trait nord raccourcie (‑75%)
const N_SIZE_FACTOR = 0.18;    // hauteur du "N" = 0.18R
// Paramètres par défaut (verrouillés) des indicateurs cardinaux
const RING_RADIUS_FACTOR = 1.10;     // altitude des anneaux au-dessus de la surface (1.10 = +10% du rayon)
const N_MARGIN_FACTOR = 0.08;        // marge verticale du label "N" au-dessus de l’axe (en R)
const LABEL_MARGIN_SCALE = 0.25;     // marge réduite proportionnellement au raccourcissement de l’axe
const AXIS_GAP_FACTOR = 0.15;        // écarte les traits cardinaux du limbe (en R)
const LABEL_GAP_FACTOR = 0.22;       // écarte les lettres NOSE au-delà du trait (en R)

// Ajout: gain d'intensité du "clair de terre" (modifiable ici)
const EARTHSHINE_INTENSITY_GAIN = 1.0;

// Ajout: intensité de la lumière "Soleil" (directionalLight)
const SUNLIGHT_INTENSITY = 10.0;

//  default scaling for texture-driven relief (displacement/bump/normal)
const RELIEF_SCALE_DEFAULT = 0.4;

// épaisseurs fixes écran (pixels) pour la MoonCard
const CARD_THICKNESS_PX = 1;  // épaisseur des traits/anneaux (px)
const CARD_DOT_RADIUS_PX = 4; // rayon du point central (px)
// tailles fixes écran (pixels) pour le texte et les cônes
const LABEL_FONT_PX = 14;     // taille des lettres N/E/S/O en pixels
const CONE_H_PX = 36;         // hauteur du cône en pixels
const CONE_BASE_R_PX = 6;     // rayon de base du cône en pixels


// Types et helpers (internes au fichier)
type Props = {
  x: number; // screen x of moon center (absolute in stage)
  y: number; // screen y of moon center (absolute in stage)
  wPx: number;
  hPx: number;
  moonAltDeg: number;
  moonAzDeg: number;
  sunAltDeg: number;
  sunAzDeg: number;
  limbAngleDeg: number; // orientation of the lunar north toward the top
  librationTopo?: { latDeg: number; lonDeg: number; paDeg: number };
  modelUrl?: string; // defaults to '/src/assets/nasa-gov-4720.glb'
  debugMask?: boolean; // enable full lighting rig for orientation debugging
  rotOffsetDegX?: number;
  rotOffsetDegY?: number;
  rotOffsetDegZ?: number;
  camRotDegX?: number;
  camRotDegY?: number;
  camRotDegZ?: number;
  showPhase?: boolean;
  showMoonCard?: boolean;
  // New optional inputs to drive Sun direction from Moon card data
  illumFraction?: number | string;        // [0..1] illuminated fraction (number or numeric string)
  brightLimbAngleDeg?: number | string;   // 0°=North, 90°=East (number or numeric string)
  // Visual marker for the subsolar point
  showSubsolarCone?: boolean;
  // New: enable camera-based bluish fill when Earthshine is toggled
  earthshine?: boolean;
  // NEW: scale factor for texture-based relief (displacement/bump/normal)
  reliefScale?: number;
  // Overrides physiques (optionnels). Si définis, priment sur l'heuristique interne.
  eclipseStrength?: number;
  umbraRadiusRel?: number;
  penumbraOuterRel?: number;
  redGlowStrength?: number;
  // Debug: forcer eclipse ON (si pas d’override fourni)
  forceEclipse?: boolean;
  // notify parent when the 3D canvas has rendered a couple of frames
  onReady?: () => void;
  // décalage du centre de l’ombre en Rlunaire (axe Earth shadow vs centre Lune)
  eclipseOffsetRel?: number;
  eclipseAxisPADeg?: number;
};

type Vec3 = [number, number, number];

// Coerce possibly string inputs (like "74.2°" or "0.339") to finite numbers
function toFiniteNumber(v: unknown): number | undefined {
  if (v == null) return undefined;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string') {
    const cleaned = v.replace(/[^0-9+\-.eE]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function altAzToVec(altDeg: number, azDeg: number): Vec3 {
  const d2r = Math.PI / 180;
  const alt = altDeg * d2r;
  const az = azDeg * d2r;
  const cosAlt = Math.cos(alt);
  return [
    cosAlt * Math.sin(az), // +X East
    cosAlt * Math.cos(az), // +Y North
    Math.sin(alt), // +Z Up
  ];
}

function rotateAToB(a: Vec3, b: Vec3): number[][] {
  // Rodrigues' rotation formula
  const ax = a[0], ay = a[1], az = a[2];
  const bx = b[0], by = b[1], bz = b[2];
  const v: Vec3 = [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx];
  const s = Math.hypot(v[0], v[1], v[2]) || 1e-9;
  const c = ax * bx + ay * by + az * bz;
  const vx = [
    [0, -v[2], v[1]],
    [v[2], 0, -v[0]],
    [-v[1], v[0], 0],
  ];
  const k = (1 - c) / (s * s);
  const vx2 = [
    [
      vx[0][0] * vx[0][0] + vx[0][1] * vx[1][0] + vx[0][2] * vx[2][0],
      vx[0][0] * vx[0][1] + vx[0][1] * vx[1][1] + vx[0][2] * vx[2][1],
      vx[0][0] * vx[0][2] + vx[0][1] * vx[1][2] + vx[0][2] * vx[2][2],
    ],
    [
      vx[1][0] * vx[0][0] + vx[1][1] * vx[1][0] + vx[1][2] * vx[2][0],
      vx[1][0] * vx[0][1] + vx[1][1] * vx[1][1] + vx[1][2] * vx[2][1],
      vx[1][0] * vx[0][2] + vx[1][1] * vx[1][2] + vx[1][2] * vx[2][2],
    ],
    [
      vx[2][0] * vx[0][0] + vx[2][1] * vx[1][0] + vx[2][2] * vx[2][0],
      vx[2][0] * vx[0][1] + vx[2][1] * vx[1][1] + vx[2][2] * vx[2][1],
      vx[2][0] * vx[0][2] + vx[2][1] * vx[1][2] + vx[2][2] * vx[2][2],
    ],
  ];
  const R = [
    [1 + vx[0][0] + vx2[0][0] * k, vx[0][1] + vx2[0][1] * k, vx[0][2] + vx2[0][2] * k],
    [vx[1][0] + vx2[1][0] * k, 1 + vx[1][1] + vx2[1][1] * k, vx[1][2] + vx2[1][2] * k],
    [vx[2][0] + vx2[2][0] * k, vx[2][1] + vx2[2][1] * k, 1 + vx[2][2] + vx2[2][2] * k],
  ];
  return R;
}

function mul(R: number[][], v: Vec3): Vec3 {
  return [
    R[0][0] * v[0] + R[0][1] * v[1] + R[0][2] * v[2],
    R[1][0] * v[0] + R[1][1] * v[1] + R[1][2] * v[2],
    R[2][0] * v[0] + R[2][1] * v[1] + R[2][2] * v[2],
  ];
}

function Model({
  limbAngleDeg, targetPx, modelUrl, librationTopo,
  rotOffsetDegX = 0, rotOffsetDegY = 0, rotOffsetDegZ = 0,
  debugMask = false, showMoonCard = false,
  sunDirWorld, showSubsolarCone = true,
  reliefScale = RELIEF_SCALE_DEFAULT,
  // NEW: eclipse visuals
  eclipseStrength = 1,
  umbraRadiusRel = 1.3,
  penumbraOuterRel = 4.0,
  redGlowStrength = 0.8,
  camForwardWorld,
  eclipseOffsetRel = 0,
  eclipseAxisPADeg,
  eclipseActive = true,
}: {
  limbAngleDeg: number; targetPx: number; modelUrl: string;
  librationTopo?: { latDeg: number; lonDeg: number; paDeg: number };
  rotOffsetDegX?: number; rotOffsetDegY?: number; rotOffsetDegZ?: number;
  debugMask?: boolean; showMoonCard?: boolean;
  sunDirWorld?: [number, number, number]; showSubsolarCone?: boolean;
  reliefScale?: number;
  // NEW eclipse params (0 disables)
  eclipseStrength?: number;
  umbraRadiusRel?: number;
  penumbraOuterRel?: number;
  redGlowStrength?: number;
  camForwardWorld?: [number, number, number];
  onMounted?: () => void;
  eclipseOffsetRel?: number;
  eclipseAxisPADeg?: number;
  eclipseActive?: boolean;
}) {
  // Pas d'import Vite: on utilise un chemin direct pour le GLB
  const { scene } = useGLTF(modelUrl);

  // Use one-time processed clone from cache, then only compute the render scale
  const { centeredScene, scale, radius } = useMemo(() => {
    const processed = getOrProcess(modelUrl, scene, reliefScale, 'moon');
    const s = Math.max(1, targetPx) / Math.max(1e-6, processed.maxDim);
    return { centeredScene: processed.scene, scale: s, radius: processed.radius };
  }, [modelUrl, scene, reliefScale, targetPx]);

  // tailles locales qui donnent une épaisseur constante en pixels à l’écran
  // (localSize * scale => pixels; donc localSize = desiredPx / scale)
  const cardAxisRadiusLocal = useMemo(
    () => CARD_THICKNESS_PX / Math.max(1e-6, scale),
    [scale]
  );
  const cardTorusTubeLocal = cardAxisRadiusLocal;
  const cardDotRadiusLocal = useMemo(
    () => CARD_DOT_RADIUS_PX / Math.max(1e-6, scale),
    [scale]
  );
  // texte et cônes en taille écran fixe
  const textFontSizeLocal = useMemo(
    () => LABEL_FONT_PX / Math.max(1e-6, scale),
    [scale]
  );
  const coneHLocal = useMemo(
    () => CONE_H_PX / Math.max(1e-6, scale),
    [scale]
  );
  const coneBaseRLocal = useMemo(
    () => CONE_BASE_R_PX / Math.max(1e-6, scale),
    [scale]
  );

   // Orientation absolue appliquée au group parent (axesHelper suit la même rotation)
   const baseX = GLB_CALIB.rotationBaseDeg.x, baseY = GLB_CALIB.rotationBaseDeg.y, baseZ = GLB_CALIB.rotationBaseDeg.z;
   const rotX = ((baseX + rotOffsetDegX) * Math.PI) / 180;
   const rotY = ((baseY + rotOffsetDegY) * Math.PI) / 180;
   const rotZ = (((baseZ + limbAngleDeg + rotOffsetDegZ)) * Math.PI) / 180;
   const quaternion = useMemo(() => {
     const e = new THREE.Euler(rotX, rotY, rotZ, 'ZXY'); // ordre choisi pour limiter le lock à Y=±90°
     const q = new THREE.Quaternion();
     q.setFromEuler(e);
     return q;
   }, [rotX, rotY, rotZ]);

  // Libration topocentrique: Ry(-lon), puis Rx(+lat) — (composition: qTotal = qx * qy applique Ry puis Rx)
  const quaternionLib = useMemo(() => {
    if (!librationTopo) return new THREE.Quaternion();
    const norm180 = (d: number) => ((d + 180) % 360 + 360) % 360 - 180;
    const lon = norm180(librationTopo.lonDeg) * Math.PI / 180;
    const lat = (librationTopo.latDeg) * Math.PI / 180;
    const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), lon);
    const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1),  lat);
    return qx.multiply(qy);
  }, [librationTopo]);
  // Composition finale: base/orientation existante puis petite rotation interne de libration
  const quaternionFinal = useMemo(() => quaternion.clone().multiply(quaternionLib), [quaternion, quaternionLib]);
  const axisLen = useMemo(() => radius * AXIS_LEN_FACTOR, [radius]);
  // Longueur spécifique des traits Near/Far (x4)
  const axisLenNF = useMemo(() => axisLen * 6, [axisLen]);
  // Axes locaux sélénographiques dans l’espace du modèle (après calibration GLB):
   const northLocal = useMemo(() => GLB_CALIB.northLocal.clone(), []); // Nord lunaire local (dépend GLB)
   const viewLocal = useMemo(() => GLB_CALIB.viewForwardLocal.clone(), []); // Avant caméra local (dépend GLB)
   const meridianNormalLocal = useMemo(() => {
      const n = new THREE.Vector3().crossVectors(northLocal, viewLocal);
      if (n.lengthSq() < 1e-9) return new THREE.Vector3(1, 0, 0); // fallback si colinéaires
      return n.normalize();
    }, [northLocal, viewLocal]);
 // Orientation des tores (leur plan par défaut est XZ, normal +Y)
 const qEquatorTorus = useMemo(() => {
   const q = new THREE.Quaternion();
   q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), northLocal);
   return q;
 }, [northLocal]);
 const qMeridianTorus = useMemo(() => {
   const q = new THREE.Quaternion();
   q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), meridianNormalLocal);
   return q;
 }, [meridianNormalLocal]);

  // Nord visible sur le disque: direction tangentielle d = (meridianNormal × north)
   const diskNorthLocal = useMemo(() => {
     const m = meridianNormalLocal.clone();
     if (m.lengthSq() < 1e-9) m.set(1, 0, 0);
     const d = new THREE.Vector3().crossVectors(m, northLocal);
     if (d.lengthSq() < 1e-9) return new THREE.Vector3(0, 1, 0);
     return d.normalize();
   }, [meridianNormalLocal, northLocal]);
   // Base caméra normalisée pour base d’axes écran
   const viewNorm = useMemo(() => viewLocal.clone().normalize(), [viewLocal]);
   // Est/Ouest: Est = view × NordDisque (droite), Ouest = -Est
   const diskEastLocal = useMemo(() => {
     const e = new THREE.Vector3().crossVectors(viewNorm, diskNorthLocal);
     if (e.lengthSq() < 1e-9) return new THREE.Vector3(1, 0, 0);
     return e.normalize();
   }, [viewNorm, diskNorthLocal]);
   const diskSouthLocal = useMemo(() => diskNorthLocal.clone().multiplyScalar(-1), [diskNorthLocal]);
   const diskWestLocal  = useMemo(() => diskEastLocal.clone().multiplyScalar(-1), [diskEastLocal]);
 
 // Rotation +90° autour de Y appliquée à E/O (hérite des offsets via la rotation du groupe)
 const rotY90 = useMemo(() => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2), []);
 const diskEastLocalR = useMemo(() => diskEastLocal.clone().applyQuaternion(rotY90).normalize(), [diskEastLocal, rotY90]);
 const diskWestLocalR = useMemo(() => diskWestLocal.clone().applyQuaternion(rotY90).normalize(), [diskWestLocal, rotY90]);
 
 const qAxisN = useMemo(() => {
   const q = new THREE.Quaternion();
   q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), diskNorthLocal);
   return q;
 }, [diskNorthLocal]);
 const qAxisDiskE = useMemo(() => {
   const q = new THREE.Quaternion();
   q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), diskEastLocalR);
   return q;
 }, [diskEastLocalR]);
 const qAxisDiskS = useMemo(() => {
   const q = new THREE.Quaternion();
   q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), diskSouthLocal);
   return q;
 }, [diskSouthLocal]);
 const qAxisDiskO = useMemo(() => {
   const q = new THREE.Quaternion();
   q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), diskWestLocalR);
   return q;
 }, [diskWestLocalR]);
 // Trait proche Terre fixe: croisement méridien 0 / équateur (repère GLB)
 const lon0EquatorLocal = useMemo(() => new THREE.Vector3(1, 0, 0), []); // ajuster si 0° diffère dans le GLB
 const qAxisNear = useMemo(() => {
   const q = new THREE.Quaternion();
   q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), lon0EquatorLocal);
   return q;
 }, [lon0EquatorLocal]);
 const axisPosNear = useMemo(() => lon0EquatorLocal.clone().multiplyScalar(radius + axisLenNF / 2 + radius * AXIS_GAP_FACTOR), [lon0EquatorLocal, radius, axisLenNF]);
 // Positions exactes de l’axe et du label le long de northLocal (pôle nord réel)
 const axisPos = useMemo(() => {
   const nv = diskNorthLocal.clone();
  return nv.multiplyScalar(radius + axisLen / 2 + radius * AXIS_GAP_FACTOR);
 }, [diskNorthLocal, radius, axisLen]);
 const labelPos = useMemo(() => {
    const nv = diskNorthLocal.clone();
   return nv.multiplyScalar(radius + axisLen + radius * N_MARGIN_FACTOR * LABEL_MARGIN_SCALE + radius * LABEL_GAP_FACTOR);
 }, [diskNorthLocal, radius, axisLen]);
 // Positions pour E, S, O
 const axisPosE = useMemo(() => diskEastLocalR.clone().multiplyScalar(radius + axisLen / 2 + radius * AXIS_GAP_FACTOR), [diskEastLocalR, radius, axisLen]);
 const labelPosE = useMemo(() => diskEastLocalR.clone().multiplyScalar(radius + axisLen + radius * N_MARGIN_FACTOR * LABEL_MARGIN_SCALE + radius * LABEL_GAP_FACTOR), [diskEastLocalR, radius, axisLen]);
 const axisPosS = useMemo(() => diskSouthLocal.clone().multiplyScalar(radius + axisLen / 2 + radius * AXIS_GAP_FACTOR), [diskSouthLocal, radius, axisLen]);
 const labelPosS = useMemo(() => diskSouthLocal.clone().multiplyScalar(radius + axisLen + radius * N_MARGIN_FACTOR * LABEL_MARGIN_SCALE + radius * LABEL_GAP_FACTOR), [diskSouthLocal, radius, axisLen]);
 const axisPosO = useMemo(() => diskWestLocalR.clone().multiplyScalar(radius + axisLen / 2 + radius * AXIS_GAP_FACTOR), [diskWestLocalR, radius, axisLen]);
 const labelPosO = useMemo(() => diskWestLocalR.clone().multiplyScalar(radius + axisLen + radius * N_MARGIN_FACTOR * LABEL_MARGIN_SCALE + radius * LABEL_GAP_FACTOR), [diskWestLocalR, radius, axisLen]);
   // Compute subsolar cone placement using the same Sun direction as the light
  const subsolar = useMemo(() => {
    if (!sunDirWorld) return null;
    const sWorld = new THREE.Vector3(sunDirWorld[0], sunDirWorld[1], sunDirWorld[2]);
    if (!isFinite(sWorld.x) || !isFinite(sWorld.y) || !isFinite(sWorld.z)) return null;
    if (sWorld.lengthSq() < 1e-9) return null;
    const qInv = quaternionFinal.clone().invert();
    const sLocal = sWorld.clone().applyQuaternion(qInv).normalize();
    const inward = sLocal.clone().negate().normalize();
    const h = Math.max(1e-3, coneHLocal);
    const baseRadius = Math.max(1e-3, coneBaseRLocal);
    const center = sLocal.clone().multiplyScalar(radius + h * 0.5);
    const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), inward);
    return { center, rotation, h, baseRadius } as const;
  }, [sunDirWorld, quaternionFinal, radius, coneHLocal, coneBaseRLocal]);

  // Anti-solar (lunar midnight) cone: opposite to subsolar, same sizing/orientation logic
  const antisolar = useMemo(() => {
    if (!sunDirWorld) return null;
    const sWorld = new THREE.Vector3(sunDirWorld[0], sunDirWorld[1], sunDirWorld[2]);
    if (!isFinite(sWorld.x) || !isFinite(sWorld.y) || !isFinite(sWorld.z)) return null;
    if (sWorld.lengthSq() < 1e-9) return null;
    const qInv = quaternionFinal.clone().invert();
    const sLocal = sWorld.clone().applyQuaternion(qInv).normalize();
    const aLocal = sLocal.clone().negate();
    const inward = aLocal.clone().negate().normalize(); // points toward center (i.e., +sLocal)
    const h = Math.max(1e-3, coneHLocal);
    const baseRadius = Math.max(1e-3, coneBaseRLocal);
    const center = aLocal.clone().multiplyScalar(radius + h * 0.5);
    const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), inward);
    return { center, rotation, h, baseRadius } as const;
  }, [sunDirWorld, quaternionFinal, radius, coneHLocal, coneBaseRLocal]);

  // Compute Earth direction in model local space (opposite Sun vector)
  const earthDirLocalRaw = useMemo(() => {
    if (!sunDirWorld) return null;
    const sWorld = new THREE.Vector3().fromArray(sunDirWorld as any);
    if (sWorld.lengthSq() < 1e-9) return null;
    const qInv = quaternionFinal.clone().invert();
    const sLocal = sWorld.applyQuaternion(qInv).normalize();
    return sLocal.clone().negate().normalize(); // toward Earth
  }, [sunDirWorld, quaternionFinal]);

  const earthDirLocal = useMemo(() => {
    if (!earthDirLocalRaw) return null;
    // Garder la direction géométrique (pas de flip côté visible) pour une progression continue
    return earthDirLocalRaw.clone().normalize();
  }, [earthDirLocalRaw]);

  // Front facing (view axis) and disk axes for stable “screen” overlay
  // Camera forward expressed in the model's local space (compte la rotation du groupe)
  const viewAxisLocal = useMemo(() => {
    // fallback: -viewLocal = centre->cam (car viewLocal est "cam -> objet")
    if (!camForwardWorld) return viewLocal.clone().negate().normalize();
    const fWorld = new THREE.Vector3().fromArray(camForwardWorld as any); // cam -> objet
    const toCamWorld = fWorld.clone().negate().normalize();               // centre -> caméra
    const qInv = quaternionFinal.clone().invert();
    return toCamWorld.applyQuaternion(qInv).normalize();                  // en espace local
  }, [camForwardWorld, quaternionFinal, viewLocal]);

  // Base 2D écran: projeter le nord du disque sur le plan orthogonal à la vue
  const yAxisLocal = useMemo(() => {
    const n = diskNorthLocal.clone().normalize();
    const v = viewAxisLocal.clone().normalize(); // centre -> caméra
    // y = n - (n·v) v  (projection de n sur le plan écran)
    const y = n.add(v.multiplyScalar(-n.dot(v)));
    return y.lengthSq() > 1e-9 ? y.normalize() : diskNorthLocal.clone().normalize();
  }, [diskNorthLocal, viewAxisLocal]);

  const xAxisLocal = useMemo(
    () => new THREE.Vector3().crossVectors(viewAxisLocal, yAxisLocal).normalize(),
    [viewAxisLocal, yAxisLocal]
  );
  
  
  const eclipseShadowVs = `
    varying vec3 vPos;
    void main() {
      vPos = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

   const eclipseShadowFs = `
    precision highp float;
    varying vec3 vPos;
    uniform vec3 uXAxis;
    uniform vec3 uYAxis;
    uniform vec3 uViewAxis;
    uniform vec3 uEarthDir;
    uniform float uRUmbra;
    uniform float uRPenumbra;
    uniform float uStrength;
    uniform float uOffsetRel;
    uniform float uAxisPA;      // radians (E depuis N, Nord lunaire)
    uniform float uUsePA;
    uniform float uPenWidth;    // [0.2..1.0] proportion de largeur de pénombre
    uniform float uRedScale;    // rayon "efficace" du rouge
    uniform float uHoleGain;    // [0..1] force du "trou" dans l'ombre
    uniform float uHoleScale;   // NEW: >1 => trou un peu plus large que le rouge

    void main() {
      if (uStrength <= 0.0001) discard;

      vec3 p = normalize(vPos);
      vec3 xA = normalize(uXAxis);
      vec3 yA = normalize(uYAxis);
      vec3 vA = normalize(uViewAxis);
      vec3 u  = normalize(uEarthDir);

      float w = dot(p, vA);
      if (w <= 0.0) discard;

      vec2 dir2;
      if (uUsePA > 0.5) {
        // centre d'ombre opposé à axisPerp (PA)
        dir2 = -vec2(sin(uAxisPA), cos(uAxisPA));
      } else {
        vec3 r_hat = normalize(-vA);
        vec3 r_perp = r_hat - u * dot(r_hat, u);
        float rlen = length(r_perp);
        vec3 dir3 = rlen > 1e-6 ? (r_perp / rlen) : normalize(cross(u, vec3(0.0, 0.0, 1.0)));
        if (length(dir3) < 1e-6) dir3 = normalize(cross(u, vec3(0.0, 1.0, 0.0)));
        dir2 = vec2(dot(dir3, xA), dot(dir3, yA));
        float d2l = length(dir2);
        if (d2l > 1e-6) dir2 /= d2l;
      }

      vec2 c = dir2 * max(0.0, uOffsetRel);
      vec2 uv = vec2(dot(p, xA), dot(p, yA));
      float d = length(uv - c);

      // Pénombre plus "nette"
      float outer = mix(uRUmbra, uRPenumbra, clamp(uPenWidth, 0.2, 1.0));
      float pen = 1.0 - smoothstep(uRUmbra, outer, d);
      float umb = 1.0 - smoothstep(0.0,       uRUmbra,   d);
      pen = pow(pen, 1.45);
      umb = pow(umb, 0.7);

      const float ALPHA_PENUM = 3.45;
      const float ALPHA_UMBRA = 1.93;
      float alpha = uStrength * (ALPHA_PENUM * pen + (ALPHA_UMBRA - ALPHA_PENUM) * umb);

       // NEW: "trou" doux dans la passe sombre là où le rouge est fort
      float uR = uRUmbra * max(1.0, uRedScale) * max(1.0, uHoleScale);
      float deep = clamp((uR - d) / max(1e-5, uR), 0.0, 1.0);
      deep = smoothstep(0.0, 1.0, deep);
      alpha *= (1.0 - clamp(uHoleGain, 0.0, 1.0) * deep);

      gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
    }
  `;

  const eclipseRedVs = eclipseShadowVs;
  const eclipseRedFs = `
    precision highp float;
    varying vec3 vPos;
    uniform vec3 uXAxis;
    uniform vec3 uYAxis;
    uniform vec3 uViewAxis;
    uniform vec3 uEarthDir;
    uniform float uRUmbra;
    uniform float uRPenumbra;
    uniform float uRedGain;     // [0..1] intensité globale
    uniform float uOffsetRel;
    uniform float uAxisPA;
    uniform float uUsePA;
    uniform float uRedScale;    // >1 => rouge plus large
    uniform float uRedDark;     // NEW: [0..1.5] profondeur de noircissement

    void main() {
      if (uRedGain <= 0.0001) discard;

      vec3 p = normalize(vPos);
      vec3 xA = normalize(uXAxis);
      vec3 yA = normalize(uYAxis);
      vec3 vA = normalize(uViewAxis);
      vec3 u  = normalize(uEarthDir);

      float w = dot(p, vA);
      if (w <= 0.0) discard;

      vec2 dir2;
      if (uUsePA > 0.5) {
        // centre d'ombre opposé à axisPerp (PA)
        dir2 = -vec2(sin(uAxisPA), cos(uAxisPA));
      } else {
        vec3 r_hat = normalize(-vA);
        vec3 r_perp = r_hat - u * dot(r_hat, u);
        float rlen = length(r_perp);
        vec3 dir3 = rlen > 1e-6 ? (r_perp / rlen) : normalize(cross(u, vec3(0.0, 0.0, 1.0)));
        if (length(dir3) < 1e-6) dir3 = normalize(cross(u, vec3(0.0, 1.0, 0.0)));
        dir2 = vec2(dot(dir3, xA), dot(dir3, yA));
        float d2l = length(dir2);
        if (d2l > 1e-6) dir2 /= d2l;
      }

      vec2 c = dir2 * max(0.0, uOffsetRel);

      vec2 uv = vec2(dot(p, xA), dot(p, yA));
      float d = length(uv - c);

      // "Profondeur" autour de l'umbra élargi
      float uR = uRUmbra * max(1.0, uRedScale);
      float deep = clamp((uR - d) / max(1e-5, uR), 0.0, 1.0);
      deep = smoothstep(0.0, 1.0, deep);
      deep *= deep;

      // Facteur multiplicatif sombre, plus fort sur G/B pour une teinte rouge foncé
      float k = clamp(uRedGain, 0.0, 1.0) * clamp(uRedDark, 0.0, 1.5) * deep;
      vec3 mul = vec3(1.0)
               - k * vec3(0.35, 0.85, 0.90); // R baisse peu, G/B baissent plus => bordeaux
      mul = clamp(mul, 0.0, 1.0);

      gl_FragColor = vec4(mul, 1.0);
    }
  `;

  // Stable fallback vector (évite de recréer un new Vector3 à chaque render)
  const fallbackEarth = React.useMemo(() => new THREE.Vector3(0, 0, 1), []);

  // UNIFORMS: objets stables (une seule instance par passe)
  const shadowUniformsRef = React.useRef({
    uXAxis:     { value: new THREE.Vector3() },
    uYAxis:     { value: new THREE.Vector3() },
    uViewAxis:  { value: new THREE.Vector3() },
    uEarthDir:  { value: new THREE.Vector3() },
    uRUmbra:    { value: 1.3 },
    uRPenumbra: { value: 4.0 },
    uStrength:  { value: 1.0 },
    uOffsetRel: { value: 0.0 },
    uAxisPA:    { value: 0.0 },
    uUsePA:     { value: 0.0 },
    uPenWidth:  { value: 0.52 },
    uRedScale:  { value: 1.30 }, // ...existing code...
    uHoleGain:  { value: 0.90 }, // NEW: trou plus marqué
    uHoleScale: { value: 1.0 }, // NEW: trou un peu plus grand que le rouge
  });
   const redUniformsRef = React.useRef({
    uXAxis:     { value: new THREE.Vector3() },
    uYAxis:     { value: new THREE.Vector3() },
    uViewAxis:  { value: new THREE.Vector3() },
    uEarthDir:  { value: new THREE.Vector3() },
    uRUmbra:    { value: 1.3 },
    uRPenumbra: { value: 4.0 },
    uRedGain:   { value: 0.8 },
    uOffsetRel: { value: 0.0 },
    uAxisPA:    { value: 0.0 },
    uUsePA:     { value: 0.0 },
    uRedScale:  { value: 1.40 },
    uRedDark:   { value: 1.0 }, // NEW: intensité du noircissement
  });


  // Références sur les matériaux pour marquer needsUpdate si nécessaire
  const shadowMatRef = React.useRef<THREE.ShaderMaterial | null>(null);
  const redMatRef    = React.useRef<THREE.ShaderMaterial | null>(null);

  // Mettre à jour les uniforms "in place" dès que la géométrie spatiale change
  React.useEffect(() => {
    if (!eclipseActive) return;
    // Clamp util
    const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
    const paRad = ( Number.isFinite(eclipseAxisPADeg as number) ? ((eclipseAxisPADeg as number) * Math.PI / 180) : 0);
    const usePA = Number.isFinite(eclipseAxisPADeg as number) ? 1 : 0;

    //console.log("eclipseOffsetRel, eclipseAxisPADeg,",eclipseOffsetRel, eclipseAxisPADeg);


    // Shadow uniforms
    {
      const u = shadowUniformsRef.current;
      u.uXAxis.value.copy(xAxisLocal);
      u.uYAxis.value.copy(yAxisLocal);
      u.uViewAxis.value.copy(viewAxisLocal);
      u.uEarthDir.value.copy(earthDirLocal ?? fallbackEarth);
      u.uRUmbra.value    = clamp(umbraRadiusRel, 0.05, 6.0);
      u.uRPenumbra.value = clamp(Math.max(umbraRadiusRel + 1e-3, penumbraOuterRel), 0.06, 8.0);
      u.uStrength.value  = clamp(eclipseStrength, 0, 1);
      u.uOffsetRel.value = Math.max(0, eclipseOffsetRel || 0);
      u.uAxisPA.value    = paRad;
      u.uUsePA.value     = usePA;
      u.uPenWidth.value  = 0.72;
      u.uRedScale.value  = 1.60; // élargit le rouge (et base du trou)
      u.uHoleGain.value  = 0.90; // trou plus visible
      u.uHoleScale.value = 1.18; // trou encore un peu plus large que le rouge
      if (shadowMatRef.current) shadowMatRef.current.needsUpdate = true;

    }
    // Red uniforms
    {
      const u = redUniformsRef.current;
      u.uXAxis.value.copy(xAxisLocal);
      u.uYAxis.value.copy(yAxisLocal);
      u.uViewAxis.value.copy(viewAxisLocal);
      u.uEarthDir.value.copy(earthDirLocal ?? fallbackEarth);
      u.uRUmbra.value    = clamp(umbraRadiusRel, 0.05, 6.0);
      u.uRPenumbra.value = clamp(Math.max(umbraRadiusRel + 1e-3, penumbraOuterRel), 0.06, 8.0);
      u.uRedGain.value   = clamp(redGlowStrength * eclipseStrength, 0, 1);
      u.uOffsetRel.value = Math.max(0, eclipseOffsetRel || 0);
      u.uAxisPA.value    = paRad;
      u.uUsePA.value     = usePA;
      u.uRedScale.value  = 2.80;
      u.uRedDark.value   = 1.2; // 0.7..1.2 pour ajuster "plus sombre"
      if (redMatRef.current) redMatRef.current.needsUpdate = true;

    }
  }, [
    eclipseActive,
    xAxisLocal, yAxisLocal, viewAxisLocal, earthDirLocal,
    umbraRadiusRel, penumbraOuterRel, eclipseStrength, redGlowStrength,
    eclipseOffsetRel, eclipseAxisPADeg,
    fallbackEarth
  ]);


  return (
    <group scale={[scale, scale, scale]} quaternion={quaternionFinal}>
      {debugMask && <axesHelper args={[targetPx * 0.6]} />}

      {/* Rendu principal de la Lune */}
      <primitive object={centeredScene} />

      {/* Moon card / markers */}
      {showMoonCard && (
        <group>
          {/* Équateur: torus plein avant */}
          <group quaternion={qEquatorTorus} renderOrder={10}>
            <mesh renderOrder={10}>
              <torusGeometry args={[radius * RING_RADIUS_FACTOR, cardTorusTubeLocal, 16, 128]} />
              <meshBasicMaterial
                color="#22c55e"
                transparent
                opacity={0.95}
                depthTest
                depthWrite={false}
                side={THREE.DoubleSide}
                polygonOffset
                polygonOffsetFactor={-1}
                polygonOffsetUnits={-1}
              />
            </mesh>
          </group>
          {/* Méridien central: torus plein avant */}
          <group quaternion={qMeridianTorus} renderOrder={10}>
            <mesh renderOrder={10}>
              <torusGeometry args={[radius * RING_RADIUS_FACTOR, cardTorusTubeLocal, 16, 128]} />
              <meshBasicMaterial
                color="#ef4444"
                transparent
                opacity={0.95}
                depthTest
                depthWrite={false}
                side={THREE.DoubleSide}
                polygonOffset
                polygonOffsetFactor={-1}
                polygonOffsetUnits={-1}
              />
            </mesh>
          </group>
          {/* Point central bleu */}
          <mesh renderOrder={11}>
            <sphereGeometry args={[cardDotRadiusLocal, 16, 16]} />
            <meshBasicMaterial color="#38bdf8" depthTest={false} depthWrite={false} />
          </mesh>
          {/* Axe nord (violet) orienté sur Nord local */}
          <group renderOrder={11}>
            <mesh position={[axisPos.x, axisPos.y, axisPos.z]} quaternion={qAxisN} renderOrder={11}>
              <cylinderGeometry args={[cardAxisRadiusLocal, cardAxisRadiusLocal, axisLen, 16]} />
              <meshBasicMaterial color="#a78bfa" depthTest={false} depthWrite={false} />
            </mesh>
            <Billboard position={[labelPos.x, labelPos.y, labelPos.z]}>
              {/* FIX: taille de police fixe en pixels */}
              <Text position={[0, 0, 0]} fontSize={textFontSizeLocal} color="#a78bfa" anchorX="center" anchorY="middle" renderOrder={12}>N</Text>
            </Billboard>
          </group>
          {/* Axes Est, Sud, Ouest (même style) */}
          <group renderOrder={11}>
            {/* Est */}
            <mesh position={[axisPosE.x, axisPosE.y, axisPosE.z]} quaternion={qAxisDiskE} renderOrder={11}>
              <cylinderGeometry args={[cardAxisRadiusLocal, cardAxisRadiusLocal, axisLen, 16]} />
              <meshBasicMaterial color="#a78bfa" depthTest={false} depthWrite={false} />
            </mesh>
            <Billboard position={[labelPosE.x, labelPosE.y, labelPosE.z]}>
              {/* FIX: taille de police fixe en pixels */}
              <Text position={[0, 0, 0]} fontSize={textFontSizeLocal} color="#a78bfa" anchorX="center" anchorY="middle" renderOrder={12}>E</Text>
            </Billboard>
            {/* Sud */}
            <mesh position={[axisPosS.x, axisPosS.y, axisPosS.z]} quaternion={qAxisDiskS} renderOrder={11}>
              <cylinderGeometry args={[cardAxisRadiusLocal, cardAxisRadiusLocal, axisLen, 16]} />
              <meshBasicMaterial color="#a78bfa" depthTest={false} depthWrite={false} />
            </mesh>
            <Billboard position={[labelPosS.x, labelPosS.y, labelPosS.z]}>
              {/* FIX: taille de police fixe en pixels */}
              <Text position={[0, 0, 0]} fontSize={textFontSizeLocal} color="#a78bfa" anchorX="center" anchorY="middle" renderOrder={12}>S</Text>
            </Billboard>
            {/* Ouest */}
            <mesh position={[axisPosO.x, axisPosO.y, axisPosO.z]} quaternion={qAxisDiskO} renderOrder={11}>
              <cylinderGeometry args={[cardAxisRadiusLocal, cardAxisRadiusLocal, axisLen, 16]} />
              <meshBasicMaterial color="#a78bfa" depthTest={false} depthWrite={false} />
            </mesh>
            <Billboard position={[labelPosO.x, labelPosO.y, labelPosO.z]}>
              {/* FIX: taille de police fixe en pixels */}
              <Text position={[0, 0, 0]} fontSize={textFontSizeLocal} color="#a78bfa" anchorX="center" anchorY="middle" renderOrder={12}>O</Text>
            </Billboard>
            {/* Proche Terre (sans étiquette) */}
            <mesh position={[axisPosNear.x, axisPosNear.y, axisPosNear.z]} quaternion={qAxisNear} renderOrder={11}>
              <cylinderGeometry args={[cardAxisRadiusLocal, cardAxisRadiusLocal, axisLenNF, 16]} />
              <meshBasicMaterial color="#a78bfa" depthTest={false} depthWrite={false} />
            </mesh>
          </group>
        </group>
      )}
      {showSubsolarCone && showMoonCard && subsolar && (
        <mesh position={[subsolar.center.x, subsolar.center.y, subsolar.center.z]} quaternion={subsolar.rotation} renderOrder={12}>
          {/* FIX: cône en taille écran fixe */}
          <coneGeometry args={[subsolar.baseRadius, subsolar.h, 24]} />
          <meshStandardMaterial color="#facc15" emissive="#fbbf24" emissiveIntensity={1.2} transparent opacity={0.95} depthTest depthWrite={false} />
        </mesh>
      )}
      {showSubsolarCone && showMoonCard && antisolar && (
        <mesh position={[antisolar.center.x, antisolar.center.y, antisolar.center.z]} quaternion={antisolar.rotation} renderOrder={12}>
          {/* FIX: cône en taille écran fixe */}
          <coneGeometry args={[antisolar.baseRadius, antisolar.h, 24]} />
          <meshStandardMaterial color="#1e3a8a" emissive="#1e40af" emissiveIntensity={0.6} transparent opacity={0.95} depthTest depthWrite={false} />
        </mesh>
      )}

      {/* NEW: Eclipse overlays (rendered after the Moon to modulate lighting) */}
      {eclipseActive && eclipseStrength > 0.001 && earthDirLocal && (
        <>
          {/* Debug: centre de l’ombre (valider orientation) */}
          {debugMask && (
            <mesh position={earthDirLocal?.clone().normalize().multiplyScalar(radius * 1.01).toArray() as any} renderOrder={13}>
              <sphereGeometry args={[radius * 0.03, 16, 16]} />
              <meshBasicMaterial color="#ef4444" depthTest={false} depthWrite={false} />
            </mesh>
          )}
          {/* Multiply shadow pass */}
          {/* Multiply shadow -> passe alpha noire (Normal blending) */}
          <mesh renderOrder={14}>
            <sphereGeometry args={[radius * 1.01, 64, 64]} />
            <shaderMaterial
              ref={shadowMatRef}
              uniforms={shadowUniformsRef.current}   // <= stable
              vertexShader={eclipseShadowVs}
              fragmentShader={eclipseShadowFs}
              transparent
              depthTest={false}
              depthWrite={false}
              blending={THREE.NormalBlending}
              side={THREE.FrontSide}
            />
          </mesh>

          {/* Additive red glow -> devient Multiply sombre rouge */}
          <mesh renderOrder={15}>
            <sphereGeometry args={[radius * 1.012, 64, 64]} />
            <shaderMaterial
              ref={redMatRef}
              uniforms={redUniformsRef.current}
              vertexShader={eclipseRedVs}
              fragmentShader={eclipseRedFs}
              transparent
              depthTest={false}
              depthWrite={false}
              blending={THREE.MultiplyBlending}  // was AdditiveBlending
              side={THREE.FrontSide}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

// Helper: calls onReady after 2 rendered frames once 'armed' becomes true
function ReadyPing({ armed, onReady }: { armed: boolean; onReady?: () => void }) {
  const frames = React.useRef(0);
  const done = React.useRef(false);
  useFrame(() => {
    if (!armed || done.current) return;
    frames.current += 1;
    if (frames.current >= 2) {
      done.current = true;
      onReady?.();
    }
  });
  React.useEffect(() => {
    if (!armed) { frames.current = 0; done.current = false; }
  }, [armed]);
  return null;
}

export default function Moon3D({
  x, y, wPx, hPx,
  moonAltDeg, moonAzDeg, sunAltDeg, sunAzDeg, limbAngleDeg,
  librationTopo,
  modelUrl = new URL('../../assets/moon-nasa-gov-4720-1k.glb', import.meta.url).href,
  debugMask = false,
  rotOffsetDegX = 0, rotOffsetDegY = 0, rotOffsetDegZ = 0,
  camRotDegX = 0, camRotDegY = 0, camRotDegZ = 0,
  showPhase = true,
  showMoonCard = false,
  illumFraction,
  brightLimbAngleDeg,
  earthshine = false,
  reliefScale = MOON_RELIEF_SCALE_DEFAULT,
  // NEW overrides physiques (optionnels)
  eclipseStrength: eclipseStrengthProp,
  umbraRadiusRel: umbraRelProp,
  penumbraOuterRel: penumbraRelProp,
  redGlowStrength: redStrengthProp,
  // Debug
  forceEclipse,
  onReady,
  eclipseOffsetRel,
  eclipseAxisPADeg,
}: Props) {
  const tooSmall = !Number.isFinite(wPx) || !Number.isFinite(hPx) || wPx < 2 || hPx < 2;

  const vMoon = useMemo(() => altAzToVec(moonAltDeg, moonAzDeg), [moonAltDeg, moonAzDeg]);
  const vSun  = useMemo(() => altAzToVec(sunAltDeg,  sunAzDeg ), [sunAltDeg,  sunAzDeg ]);
  // Aligner la direction Lune vers la caméra (cam regarde -Z)
  const R = useMemo(() => rotateAToB(vMoon, [0,0,-1]), [vMoon]);

  // Fraction fournie (si string -> number)
  const illumFNum = useMemo(() => toFiniteNumber(illumFraction), [illumFraction]);

  

  // Compute Sun direction in camera space from Moon card data when available.
  // If illumFraction and a limb angle are provided, derive s_cam from:
  //   f = (1 + cos(gamma)) / 2, gamma = arccos(2f - 1)
  //   azimuth in image plane = bright limb angle (0=N, 90°=E).
  // Otherwise fall back to alt/az-based mapping (mul(R, vSun)).
  const lastStableLightCamY = React.useRef<number | undefined>(undefined);
  const lightCam = useMemo((): Vec3 => {
    const fNum = toFiniteNumber(illumFraction);
    const paCandidate = brightLimbAngleDeg != null ? brightLimbAngleDeg : librationTopo?.paDeg;
    const paNum = toFiniteNumber(paCandidate);

    const hasF = typeof fNum === 'number';
    const hasPa = typeof paNum === 'number';

    if (hasF) {
      const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
      const f = clamp01(fNum as number);

      const c = Math.max(-1, Math.min(1, 2 * f - 1));
      const s = Math.sqrt(Math.max(0, 1 - c * c));

      
      if (hasPa) {
        const qPar = Number.isFinite(limbAngleDeg) ? (limbAngleDeg as number) : 0;
        const norm360 = (d: number) => ((d % 360) + 360) % 360;
        const delta = norm360((paNum as number) - qPar);
        const aDeg = delta > 180 ? delta - 360 : delta;
        const a = (aDeg * Math.PI) / 180;

        // Plan image: +Y=N (0°), +X=E (90°)
        const px = Math.sin(a);
        const py = Math.cos(a);

        let sx = s * px;
        let sy = s * py;
        let sz = c;

        const snap0 = (v: number) => (Math.abs(v) < 1e-8 ? 0 : v);
        sx = snap0(sx); sy = snap0(sy);
        const len = Math.hypot(sx, sy, sz) || 1;
        const nx = sx / len;
        const ny = sy / len;
        const nz = sz / len;

        // Zone morte: conserver l'ancien Y stable pour éviter la rotation apparente
        /*if (inDeadZone) {
          const yHeld = lastStableLightCamY.current ?? 0;
          return [nx, yHeld, nz] as Vec3;
        }*/
        // Hors zone morte: mettre à jour la mémoire Y et renvoyer le vecteur complet
        lastStableLightCamY.current = ny;
        return [nx, ny, nz] as Vec3;
      }

      // Pas de PA -> fallback alt/az pour les phases intermédiaires
      return mul(R, vSun);
    }

    // Pas d'illumFraction -> fallback
    if (illumFraction != null || brightLimbAngleDeg != null || librationTopo?.paDeg != null) {
      console.warn('[Moon3D] Fallback to alt/az. Provided:', {
        illumFraction,
        brightLimbAngleDeg,
        paDeg: librationTopo?.paDeg,
      });
    }
    return mul(R, vSun);
  }, [illumFraction, brightLimbAngleDeg, librationTopo?.paDeg, limbAngleDeg, R, vSun]);

  // Base light position (opposée à la direction soleil caméra),
  // transformed to world space by the inverse camera rotation so the direction stays correct if the camera rotates
  const camEuler = useMemo(() => new THREE.Euler(
    (camRotDegX * Math.PI) / 180,
    (camRotDegY * Math.PI) / 180,
    (camRotDegZ * Math.PI) / 180,
    'XYZ'
  ), [camRotDegX, camRotDegY, camRotDegZ]);

  // Camera forward in world (nécessaire pour définir l’hémisphère visible en espace local)
  const camForwardWorld = useMemo((): Vec3 => {
    const f = new THREE.Vector3(0, 0, -1).applyEuler(camEuler).normalize();
    return [f.x, f.y, f.z];
  }, [camEuler]);

  const baseLightPos = useMemo(() => {
    const q = new THREE.Quaternion().setFromEuler(camEuler).invert();
    const v = new THREE.Vector3(lightCam[0], lightCam[1], lightCam[2]).applyQuaternion(q);
    return [-v.x, -v.y, -v.z] as Vec3;
  }, [lightCam, camEuler]);

  // Sun direction in world space (from Moon toward Sun), synced with the light source
  const sunDirWorld = useMemo((): Vec3 => {
    const d = new THREE.Vector3(-baseLightPos[0], -baseLightPos[1], -baseLightPos[2]);
    if (d.lengthSq() < 1e-9) return [0, 0, -1];
    d.normalize();
    return [d.x, d.y, d.z];
  }, [baseLightPos]);

  // NEW: heuristique d’éclipse + paramètres visuels (ombres + rougeoiement)
  const sunMoonSepDeg = useMemo(() => {
    const dot = vMoon[0]*vSun[0] + vMoon[1]*vSun[1] + vMoon[2]*vSun[2];
    const c = Math.max(-1, Math.min(1, dot));
    return Math.acos(c) * 180 / Math.PI;
  }, [vMoon, vSun]);

  const phaseFracNum = useMemo(() => {
    const f = toFiniteNumber(illumFraction);
    if (typeof f === 'number') return Math.max(0, Math.min(1, f));
    const sep = (sunMoonSepDeg * Math.PI) / 180;
    return 0.5 * (1 - Math.cos(sep));
  }, [illumFraction, sunMoonSepDeg]);

  // Seuil CPU: n’activer l’éclipse que si illum ≥ 0.95 (sinon, fallback sur l’estimation)
  const eclipseActive = useMemo(() => {
    if (!showPhase || !earthshine) return false;
    if (typeof illumFNum === 'number') return illumFNum >= 0.95;
    return (phaseFracNum >= 0.95);
  }, [showPhase, earthshine, illumFNum, phaseFracNum]);

  const oppositionOffsetDeg = useMemo(() => Math.abs(180 - sunMoonSepDeg), [sunMoonSepDeg]);

  const oppGate = useMemo(() => {
    const a = oppositionOffsetDeg;
    const t0 = 18, t1 = 2;
    const s = (t0 - a) / (t0 - t1);
    return Math.max(0, Math.min(1, s));
  }, [oppositionOffsetDeg]);

  const phaseGate = useMemo(() => {
    const s = (phaseFracNum - 0.85) / (0.995 - 0.85);
    return Math.max(0, Math.min(1, s));
  }, [phaseFracNum]);

  // Choix final: overrides physiques > forceEclipse > heuristique
  const eclipseStrength = useMemo(() => {
    if (typeof eclipseStrengthProp === 'number') {
      return Math.max(0, Math.min(1, eclipseStrengthProp));
    }
    if (forceEclipse) return 1;
    return Math.max(0, Math.min(1, oppGate * phaseGate));
  }, [eclipseStrengthProp, forceEclipse, oppGate, phaseGate]);

  const umbraRadiusRel = useMemo(() => {
    if (typeof umbraRelProp === 'number') return umbraRelProp;
    return 1.02 - 0.35 * eclipseStrength;
  }, [umbraRelProp, eclipseStrength]);

  const penumbraOuterRel = useMemo(() => {
    if (typeof penumbraRelProp === 'number') return penumbraRelProp;
    return 1.18 + 0.10 * eclipseStrength;
  }, [penumbraRelProp, eclipseStrength]);

  const redGlowStrength = useMemo(() => {
    if (typeof redStrengthProp === 'number') return Math.max(0, Math.min(1, redStrengthProp));
    return Math.max(0, Math.min(1, 0.35 + 0.45 * eclipseStrength));
  }, [redStrengthProp, eclipseStrength]);

  // Rotations (en degrés) dues à la libration appliquées au modèle: Ry(-lon), Rx(+lat), Rz=0
  const libLonDegNorm = (() => {
    if (!librationTopo) return 0;
    const d = ((librationTopo.lonDeg + 180) % 360 + 360) % 360 - 180;
    return d;
  })();
  const libRotXDeg = librationTopo ? librationTopo.latDeg : 0;
  const libRotYDeg = librationTopo ? -libLonDegNorm : 0;
  const libRotZDeg = 0;
  const tiltHint = librationTopo
    ? (libRotXDeg > 0
        ? 'pôle Nord légèrement “penché” vers l’observateur'
        : libRotXDeg < 0
          ? 'pôle Sud légèrement “penché” vers l’observateur'
          : 'sans bascule nord/sud notable')
    : '—';
  const eastHint = librationTopo
    ? (libLonDegNorm > 0
        ? 'on fait tourner le globe pour amener l’Est vers nous'
        : libLonDegNorm < 0
          ? 'on fait tourner le globe pour amener l’Ouest vers nous'
          : 'sans biais est/ouest notable')
    : '—';
  
  if (tooSmall) return null;

  // Diamètre souhaité du disque lunaire (pixels)
  const moonPx = Math.floor(Math.min(wPx, hPx));
  const targetPx = moonPx; // utilisé par Model pour caler le diamètre du disque

  // Taille de Canvas souhaitée (disque + marge pour card/axes)
  const desiredCanvasPx = Math.floor(
    moonPx * (
      1
      + (RING_RADIUS_FACTOR - 1)
      + AXIS_LEN_FACTOR
      + AXIS_GAP_FACTOR
      + N_SIZE_FACTOR
      + LABEL_GAP_FACTOR
    )
  );

  // Grow-only canvas to avoid 1-frame frustum/backbuffer mismatch
  const [canvasPx, setCanvasPx] = React.useState<number>(() => Math.max(16, desiredCanvasPx));
  React.useLayoutEffect(() => {
    // grow immediately, never shrink
    if (desiredCanvasPx > canvasPx) setCanvasPx(desiredCanvasPx);
  }, [desiredCanvasPx, canvasPx]);

  // Center on (x,y) with translate to keep sub-pixel smoothness
  const left = x;
  const top  = y;

  // const targetPx = moonPx; // utilisé par Model pour caler le diamètre du disque
 
   // (rotations de libration déjà calculées plus haut)
 
   // New: Earthshine fraction and camera-fill intensity
  const earthshineFrac = React.useMemo(() => {
    const f = toFiniteNumber(illumFraction);
    if (typeof f !== 'number') return 0;
    return Math.max(0, Math.min(1, 1 - f));
  }, [illumFraction]);

  const earthFillIntensity = React.useMemo(() => {
    if (!earthshine) return 0;
    // subtle boost when Earth is fuller; capped for realism
    return Math.pow(earthshineFrac, 0.8) * EARTHSHINE_INTENSITY_GAIN;
  }, [earthshine, earthshineFrac]);

  // NEW: position du clair de terre — proche de la surface, aligné avec l'axe avant caméra
  const earthFillPos = React.useMemo((): Vec3 => {
    const rWorld = targetPx / 2; // rayon monde du disque (avec cette caméra ortho)
    const fwd = new THREE.Vector3(0, 0, -1).applyEuler(camEuler).normalize(); // avant caméra en monde
    const pos = fwd.multiplyScalar(-rWorld * 1.02); // vers l'observateur (légèrement hors surface)
    return [pos.x, pos.y, pos.z];
  }, [camEuler, targetPx]);

  const [modelMounted, setModelMounted] = React.useState(false);

  // Call onReady only once
  const readyOnceRef = React.useRef(false);
  const safeOnReady = React.useCallback(() => {
    if (readyOnceRef.current) return;
    readyOnceRef.current = true;
    onReady?.();
  }, [onReady]);

  // Fallback: arm readiness once Canvas is created (even if Model is late)
  const [canvasCreated, setCanvasCreated] = React.useState(false);

  // Last-resort timeout: release after 800ms if model not mounted yet
  React.useEffect(() => {
    if (modelMounted || !showMoonCard) return; // optional: tie to UI need
    const t = setTimeout(() => safeOnReady(), 800);
    return () => clearTimeout(t);
  }, [modelMounted, showMoonCard, safeOnReady]);

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: Math.max(1, canvasPx),
        height: Math.max(1, canvasPx),
        zIndex: Z.ui - 1,
        overflow: 'hidden',
        transform: 'translate(-50%, -50%)',
        willChange: 'transform',
      }}
    >
      <Canvas
        orthographic
        dpr={[1, 2]}
        frameloop="always"
        gl={{ alpha: true, preserveDrawingBuffer: true }}
        onCreated={({ gl, invalidate }) => {
          gl.setClearColor(new THREE.Color(0x000000), 0);
          gl.toneMappingExposure = 2.2;
          invalidate();
          requestAnimationFrame(() => invalidate());
          setCanvasCreated(true);           // <= arm via Canvas creation too
        }}
      >
        <OrthographicCamera
          makeDefault
          left={-canvasPx / 2}
          right={canvasPx / 2}
          top={canvasPx / 2}
          bottom={-canvasPx / 2}
          near={-2000}
          far={2000}
          position={[0, 0, 100]}
          rotation={[camEuler.x, camEuler.y, camEuler.z]}
        />
        {/* Lumières (plein si phase désactivée) */}
        {!showPhase ? (
          <>
            <ambientLight intensity={1.2} />
            {/* Six directions cardinales autour de l’objet */}
            <directionalLight position={[ 1,  0,  0]} intensity={3.5} />
            <directionalLight position={[-1,  0,  0]} intensity={3.5} />
            <directionalLight position={[ 0,  1,  0]} intensity={3.5} />
            <directionalLight position={[ 0, -1,  0]} intensity={3.5} />
            <directionalLight position={[ 0,  0,  1]} intensity={3.5} />
            <directionalLight position={[ 0,  0, -1]} intensity={3.5} />
            {/* Huit directions diagonales */}
            <directionalLight position={[ 1,  1,  1]} intensity={2.0} />
            <directionalLight position={[ 1,  1, -1]} intensity={2.0} />
            <directionalLight position={[ 1, -1,  1]} intensity={2.0} />
            <directionalLight position={[ 1, -1, -1]} intensity={2.0} />
            <directionalLight position={[-1,  1,  1]} intensity={2.0} />
            <directionalLight position={[-1,  1, -1]} intensity={2.0} />
            <directionalLight position={[-1, -1,  1]} intensity={2.0} />
            <directionalLight position={[-1, -1, -1]} intensity={2.0} />
          </>
        ) : (
          <>
            <hemisphereLight args={[0x888888, 0x111111, 1.2]} />
            <directionalLight position={[sunDirWorld[0], sunDirWorld[1], sunDirWorld[2]]} intensity={SUNLIGHT_INTENSITY} />
            <ambientLight intensity={0.8} />
            {earthFillIntensity > 0 && (
              // Remplacement: directionalLight pour le "clair de terre" (pas d'atténuation 1/r²)
              <directionalLight
                position={earthFillPos}      // placé côté observateur
                color="#9999ff"              // léger bleu
                intensity={earthFillIntensity}
              />
            )}
          </>
        )}
        <Suspense
          fallback={
            <mesh>
              <sphereGeometry args={[canvasPx * 0.45, 32, 32]} />
              {/* Three.js n’accepte pas rgba dans color; utiliser hex + opacity */}
              <meshStandardMaterial color="#b0b0b0" transparent opacity={0.45} />
            </mesh>
          }
        >
          <Model
            limbAngleDeg={limbAngleDeg}
            targetPx={targetPx}
            modelUrl={modelUrl}
            librationTopo={librationTopo}
            rotOffsetDegX={rotOffsetDegX}
            rotOffsetDegY={rotOffsetDegY}
            rotOffsetDegZ={rotOffsetDegZ}
            debugMask={debugMask}
            showMoonCard={showMoonCard}
            sunDirWorld={sunDirWorld}
            showSubsolarCone={true}
            reliefScale={reliefScale}
            // NEW: eclipse overlay params
            eclipseStrength={eclipseStrength}
            umbraRadiusRel={umbraRadiusRel}
            penumbraOuterRel={penumbraOuterRel}
            redGlowStrength={redGlowStrength}
            camForwardWorld={camForwardWorld}
            onMounted={() => setModelMounted(true)}
            eclipseOffsetRel={eclipseOffsetRel || 0} 
            eclipseAxisPADeg={eclipseAxisPADeg}
            eclipseActive={eclipseActive}  
          />
        </Suspense>

        {/* Ping after 2 frames once armed */}
        <ReadyPing armed={modelMounted || canvasCreated} onReady={safeOnReady} />
      </Canvas>

      {/* ...debug HUD... */}
      {debugMask ? (
        <div style={{ position: 'absolute', left: 8, top: 8, color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '6px 8px', fontSize: 12, lineHeight: 1.3, borderRadius: 4 }}>
          <div>Libration RX: {libRotXDeg.toFixed(1)}° — {tiltHint}</div>
          <div>Libration RY: {libRotYDeg.toFixed(1)}° — {eastHint}</div>
          <div>Libration RZ: {libRotZDeg.toFixed(1)}°</div>
        </div>
      ) : null}

    </div>
  );
 }