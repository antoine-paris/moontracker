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
  northLocal: new THREE.Vector3(0, 0, 1),    // direction du nord lunaire dans l'espace local du GLB
  viewForwardLocal: new THREE.Vector3(0, 0, -1), // direction vers la caméra dans l'espace local du GLB
} as const;

// Facteurs (en multiples du rayon) pour dimensionner la boîte autour des marqueurs
const AXIS_LEN_FACTOR = 0.125; // longueur du trait nord raccourcie (‑75%)
const N_SIZE_FACTOR = 0.18;    // hauteur du "N" = 0.18R
// Paramètres par défaut (verrouillés) des indicateurs cardinaux
const RING_RADIUS_FACTOR = 1.10;     // altitude des anneaux au-dessus de la surface (1.10 = +10% du rayon)
const RING_TUBE_FACTOR = 0.01;       // épaisseur du torus (tube) vs rayon lunaire
const AXIS_THICKNESS_FACTOR = 0.01;  // épaisseur du cylindre de l’axe nord vs rayon
const CENTER_DOT_FACTOR = 0.04;      // rayon du point central vs rayon
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
  // notify parent when the 3D canvas has rendered a couple of frames
  onReady?: () => void;
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
  onMounted,
}: {
  limbAngleDeg: number; targetPx: number; modelUrl: string;
  librationTopo?: { latDeg: number; lonDeg: number; paDeg: number };
  rotOffsetDegX?: number; rotOffsetDegY?: number; rotOffsetDegZ?: number;
  debugMask?: boolean; showMoonCard?: boolean;
  sunDirWorld?: [number, number, number]; showSubsolarCone?: boolean;
  reliefScale?: number;
  onMounted?: () => void;
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

  React.useEffect(() => { onMounted?.(); }, [onMounted]);
  return (
    <group scale={[scale, scale, scale]} quaternion={quaternionFinal}>
      {debugMask && <axesHelper args={[targetPx * 0.6]} />}

      {/* Rendu principal de la Lune (déjà centré & préparé) */}
      <primitive object={centeredScene} />

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
  // modelUrl = '/src/assets/moon-nasa-gov-4720-1k.glb',
  modelUrl = new URL('../../assets/moon-nasa-gov-4720-1k.glb', import.meta.url).href,
  debugMask = false,
  rotOffsetDegX = 0, rotOffsetDegY = 0, rotOffsetDegZ = 0,
  camRotDegX = 0, camRotDegY = 0, camRotDegZ = 0,
  showPhase = true,
  showMoonCard = false,
  illumFraction,
  brightLimbAngleDeg,
  showSubsolarCone = true,
  earthshine = false,
  // NEW: allow overriding from parent
  reliefScale = MOON_RELIEF_SCALE_DEFAULT,
  onReady,
}: Props) {
  const tooSmall = !Number.isFinite(wPx) || !Number.isFinite(hPx) || wPx < 2 || hPx < 2;

  const vMoon = useMemo(() => altAzToVec(moonAltDeg, moonAzDeg), [moonAltDeg, moonAzDeg]);
  const vSun  = useMemo(() => altAzToVec(sunAltDeg,  sunAzDeg ), [sunAltDeg,  sunAzDeg ]);
  // Aligner la direction Lune vers la caméra (cam regarde -Z)
  const R = useMemo(() => rotateAToB(vMoon, [0,0,-1]), [vMoon]);

  // Compute Sun direction in camera space from Moon card data when available.
  // If illumFraction and a limb angle are provided, derive s_cam from:
  //   f = (1 + cos(gamma)) / 2, gamma = arccos(2f - 1)
  //   azimuth in image plane = bright limb angle (0=N, 90°=E).
  // Otherwise fall back to alt/az-based mapping (mul(R, vSun)).
  const lightCam = useMemo((): Vec3 => {
    const fNum = toFiniteNumber(illumFraction);
    const paCandidate = brightLimbAngleDeg != null ? brightLimbAngleDeg : librationTopo?.paDeg;
    const paNum = toFiniteNumber(paCandidate);

    const hasF = typeof fNum === 'number';
    const hasPa = typeof paNum === 'number';

    if (hasF && hasPa) {
      const f = Math.min(1, Math.max(0, fNum as number));
      const c = Math.max(-1, Math.min(1, 2 * f - 1));
      const gamma = Math.acos(c); // 0=Full, π=New
      // Correct the bright limb azimuth by the parallactic rotation already applied to the GLB
      const qPar = Number.isFinite(limbAngleDeg) ? (limbAngleDeg as number) : 0;
      const a = (((paNum as number) - qPar) * Math.PI) / 180; // image-plane azimuth adjusted by parallactic angle
      // Image plane unit vector: +Y=N (0°), +X=E (90°)
      const px = Math.sin(a);
      const py = Math.cos(a);
      // Sun direction in camera frame (pointing from Moon to Sun)
      const sx = Math.sin(gamma) * px;
      const sy = Math.sin(gamma) * py;
      const sz = Math.cos(gamma); // +Z for Full, -Z for New
      return [sx, sy, sz];
    }

    if (illumFraction != null || brightLimbAngleDeg != null || librationTopo?.paDeg != null) {
      console.warn('[Moon3D] Fallback to alt/az. Provided:', {
        illumFraction,
        brightLimbAngleDeg,
        paDeg: librationTopo?.paDeg,
        parsed: { fNum, paNum }
      });
    }
    // Fallback: compute from Sun alt/az
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
   // Taille du Canvas: disque + marge pour les marqueurs aux deux extrémités
   const canvasPx = Math.floor(
     moonPx * (
       1
      + (RING_RADIUS_FACTOR - 1)
      + AXIS_LEN_FACTOR
      + AXIS_GAP_FACTOR
      + N_SIZE_FACTOR
      + LABEL_GAP_FACTOR
     )
   );
   //const left = Math.round(x - canvasPx / 2);
   //const top  = Math.round(y - canvasPx / 2);
   const left = x;
   const top  = y;

   const targetPx = moonPx; // utilisé par Model pour caler le diamètre du disque
 
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
  
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left,
        top,
        width: Math.max(1, canvasPx),
        height: Math.max(1, canvasPx),
        zIndex: Z.ui - 1,
        overflow: 'hidden',
        // Prevent jitter: center anchor and let sub-pixel coordinates be rendered smoothly
        transform: 'translate(-50%, -50%)',
        willChange: 'transform',
      }}
    >
    <Canvas orthographic dpr={[1, 2]} gl={{ alpha: true }} onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color(0x000000), 0);
        gl.toneMappingExposure = 2.2;
      }}>
        <OrthographicCamera
           makeDefault
           left={-canvasPx / 2}
           right={canvasPx / 2}
           top={canvasPx / 2}
           bottom={-canvasPx / 2}
           near={-2000}
           far={2000}
           position={[0, 0, 100]}
           // FIX: use radians via camEuler again
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
        <Suspense fallback={<mesh><sphereGeometry args={[canvasPx * 0.45, 32, 32]} /><meshStandardMaterial color="rgba(176, 176, 176, 0.45)" /></mesh>}>
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
             showSubsolarCone={showSubsolarCone}
             // NEW: pass through to materials
             reliefScale={reliefScale}
             onMounted={() => setModelMounted(true)}
           />
        </Suspense>
        <ReadyPing armed={modelMounted} onReady={onReady} />
      </Canvas>
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