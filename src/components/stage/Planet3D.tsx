import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrthographicCamera, Text, Billboard } from '@react-three/drei'
import * as THREE from 'three';
import { Z } from '../../render/constants';
import type { PlanetId } from '../../astro/planets';
import { PLANET_REGISTRY } from '../../render/planetRegistry';
import { formatDeg } from "../../utils/format";
import { SATURN_RING_OUTER_TO_GLOBE_DIAM_RATIO } from '../../astro/planets'; // + add
import { getOrProcess, PLANET_RELIEF_SCALE_DEFAULT } from '../../render/modelPrewarm';

// Light/relief defaults (can be overridden per-planet via PLANET_REGISTRY)
const DEFAULT_SUNLIGHT_INTENSITY = 5.0;
const DEFAULT_AMBIENT_FILL_INTENSITY = 0.05;
const DEFAULT_RELIEF_SCALE = 0.5;
const DEFAULT_NO_PHASE_AMBIENT_INTENSITY = 0.5;

// Card overlay factors 
const AXIS_LEN_FACTOR = 0.05;
const N_SIZE_FACTOR = 0.18;
const RING_RADIUS_FACTOR = 1.10;
const RING_TUBE_FACTOR = 0.01;
const AXIS_THICKNESS_FACTOR = 0.01;
const CENTER_DOT_FACTOR = 0.04;
const N_MARGIN_FACTOR = 0.08;
const LABEL_MARGIN_SCALE = 0.25;
const AXIS_GAP_FACTOR = 0.15;
const LABEL_GAP_FACTOR = 0.22;

// épaisseurs fixes écran (pixels) pour la MoonCard
const CARD_THICKNESS_PX = 1;  // épaisseur des traits/anneaux (px)
const CARD_DOT_RADIUS_PX = 4; // rayon du point central (px)
// tailles fixes écran (pixels) pour le texte et les cônes
const LABEL_FONT_PX = 14;     // taille des lettres N/E/S/O en pixels
const CONE_H_PX = 36;         // hauteur du cône en pixels
const CONE_BASE_R_PX = 6;     // rayon de base du cône en pixels

// Minimal/neutral GLB calibration with sensible defaults for card overlays
type GlbCalib = {
  rotationBaseDeg: { x: number; y: number; z: number };
  northLocal: THREE.Vector3;          // direction du Nord dans l'espace local du GLB
  viewForwardLocal: THREE.Vector3;    // direction "vers caméra" dans l'espace local du GLB
  lon0EquatorLocal: THREE.Vector3;    // direction du point (lon=0, lat=0) dans l'espace local du GLB
};
const DEFAULT_GLB_CALIB: GlbCalib = {
  rotationBaseDeg: { x: 0, y: -90, z: 180 },
  northLocal: new THREE.Vector3(0, 0, 1),
  viewForwardLocal: new THREE.Vector3(0, 0, -1),
  lon0EquatorLocal: new THREE.Vector3(1, 0, 0),
} as const;

function Model({
  targetPx,
  modelUrl,
  sunDirWorld,
  showSubsolarCone = true,
  showPlanetCard = false,
  // rotation/orientation
  limbAngleDeg,
  rotationDeg = 0,
  rotOffsetDegX = 0,
  rotOffsetDegY = 0,
  rotOffsetDegZ = 0,
  debugMask = false,
  reliefScale = DEFAULT_RELIEF_SCALE,
  glbCalib = DEFAULT_GLB_CALIB,
  orientationDegX,
  orientationDegY,
  orientationDegZ,
  planetId,                 // + add
}: {
  targetPx: number;
  modelUrl: string;
  sunDirWorld?: Vec3;
  showSubsolarCone?: boolean;
  showPlanetCard?: boolean;
  limbAngleDeg: number;
  rotationDeg?: number;
  rotOffsetDegX?: number;
  rotOffsetDegY?: number;
  rotOffsetDegZ?: number;
  debugMask?: boolean;
  reliefScale?: number;
  glbCalib?: GlbCalib;
  orientationDegX?: number;
  orientationDegY?: number;
  orientationDegZ?: number;
  planetId?: PlanetId;       // + add
}) {
  const { scene } = useGLTF(modelUrl);

  const { centeredScene, scale, radius } = useMemo(() => {
    const processed = getOrProcess(modelUrl, scene, reliefScale, 'planet');

    // Clone for Saturn ring adjustment (safe: we only mutate a clone)
    const working = processed.scene.clone(true);
    let maxDimForScale = processed.maxDim;
    let radiusForScale = processed.radius;

    if (planetId === 'Saturn') {
      const SATURN_RATIO = SATURN_RING_OUTER_TO_GLOBE_DIAM_RATIO;
      // Measure core (globe only)
      const vMin = new THREE.Vector3(+Infinity, +Infinity, +Infinity);
      const vMax = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
      let found = false;
      working.traverse((obj: any) => {
        if (obj?.isMesh) {
          const name = (obj.name || '').toLowerCase();
            if (name.includes('ring')) return;
            if (obj.geometry) {
              const b = new THREE.Box3().setFromObject(obj);
              vMin.min(b.min);
              vMax.max(b.max);
              found = true;
            }
        }
      });
      if (found) {
        const sizeCore = new THREE.Vector3().subVectors(vMax, vMin);
        const coreMaxDim = Math.max(sizeCore.x, sizeCore.y);
        if (coreMaxDim > 0) {
          maxDimForScale = coreMaxDim;
          radiusForScale = coreMaxDim / 2;
          const glbRatio = processed.maxDim / coreMaxDim;
          let ringEnlarge = SATURN_RATIO / glbRatio;
          if (!Number.isFinite(ringEnlarge) || ringEnlarge <= 0) ringEnlarge = 1;
          if (Math.abs(ringEnlarge - 1) > 0.02 && ringEnlarge < 5) {
            working.traverse((obj: any) => {
              if (obj?.isMesh && (obj.name || '').toLowerCase().includes('ring')) {
                obj.scale.multiplyScalar(ringEnlarge);
              }
            });
          }
        }
      }
    }
    const s = Math.max(1, targetPx) / Math.max(1e-6, maxDimForScale);
    return { centeredScene: working, scale: s, radius: radiusForScale };
  }, [modelUrl, scene, reliefScale, targetPx, planetId]);

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


  // Neutral base + user offsets + "limb" rotation on Z (keep parity with Moon3D inputs)
  const baseX = glbCalib.rotationBaseDeg.x, baseY = glbCalib.rotationBaseDeg.y, baseZ = glbCalib.rotationBaseDeg.z;
  const oX = Number.isFinite(orientationDegX) ? (orientationDegX as number) : 0;
  const oY = Number.isFinite(orientationDegY) ? (orientationDegY as number) : 0;
  const oZ = Number.isFinite(orientationDegZ) ? (orientationDegZ as number) : 0;

  const rotX = ((baseX + oX + rotOffsetDegX) * Math.PI) / 180;
  const rotY = ((baseY + oY + rotOffsetDegY) * Math.PI) / 180;
  const rotZ = ((baseZ + oZ - rotationDeg + rotOffsetDegZ) * Math.PI) / 180;
  const quaternion = useMemo(() => {
    const e = new THREE.Euler(rotX, rotY, rotZ, 'ZXY');
    return new THREE.Quaternion().setFromEuler(e);
  }, [rotX, rotY, rotZ]);

  // Subsolar/antisolar cones (optional, only when card is requested)
  const subsolar = useMemo(() => {
    if (!sunDirWorld) return null;
    const sWorld = new THREE.Vector3(sunDirWorld[0], sunDirWorld[1], sunDirWorld[2]);
    if (!isFinite(sWorld.x) || !isFinite(sWorld.y) || !isFinite(sWorld.z) || sWorld.lengthSq() < 1e-9) return null;
    const qInv = quaternion.clone().invert();
    const sLocal = sWorld.clone().applyQuaternion(qInv).normalize();
    const inward = sLocal.clone().negate().normalize();
    const h = Math.max(1e-3, radius * 0.35);
    const baseRadius = Math.max(1e-3, radius * 0.06);
    const center = sLocal.clone().multiplyScalar(radius + h * 0.5);
    const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), inward);
    return { center, rotation, h, baseRadius } as const;
  }, [sunDirWorld, quaternion, radius]);

  const antisolar = useMemo(() => {
    if (!sunDirWorld) return null;
    const sWorld = new THREE.Vector3(sunDirWorld[0], sunDirWorld[1], sunDirWorld[2]);
    if (!isFinite(sWorld.x) || !isFinite(sWorld.y) || !isFinite(sWorld.z) || sWorld.lengthSq() < 1e-9) return null;
    const qInv = quaternion.clone().invert();
    const sLocal = sWorld.clone().applyQuaternion(qInv).normalize();
    const aLocal = sLocal.clone().negate();
    const inward = aLocal.clone().negate().normalize();
    const h = Math.max(1e-3, radius * 0.35);
    const baseRadius = Math.max(1e-3, radius * 0.06);
    const center = aLocal.clone().multiplyScalar(radius + h * 0.5);
    const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), inward);
    return { center, rotation, h, baseRadius } as const;
  }, [sunDirWorld, quaternion, radius]);

// Card overlays (same logic as Moon3D, using planet GLB calibration)
  const axisLen = useMemo(() => radius * AXIS_LEN_FACTOR, [radius]);
  const axisLenNF = useMemo(() => axisLen * 6, [axisLen]);
  const northLocal = useMemo(
    () => (glbCalib.northLocal ? glbCalib.northLocal.clone() : new THREE.Vector3(0, 1, 0)),
    [glbCalib]
  );
  const viewLocal = useMemo(
    () => (glbCalib.viewForwardLocal ? glbCalib.viewForwardLocal.clone() : new THREE.Vector3(0, 0, -1)),
    [glbCalib]
  );
  const lon0EquatorLocal = useMemo(
    () => (glbCalib.lon0EquatorLocal ? glbCalib.lon0EquatorLocal.clone() : new THREE.Vector3(1, 0, 0)),
    [glbCalib]
  );
 const meridianNormalLocal = useMemo(() => {
  const n = new THREE.Vector3().crossVectors(northLocal, viewLocal);
  if (n.lengthSq() < 1e-9) return new THREE.Vector3(1, 0, 0);
  return n.normalize();
}, [northLocal, viewLocal]);

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

  const diskNorthLocal = useMemo(() => {
    const m = meridianNormalLocal.clone();
    if (m.lengthSq() < 1e-9) m.set(1, 0, 0);
    const d = new THREE.Vector3().crossVectors(m, northLocal);
    if (d.lengthSq() < 1e-9) return new THREE.Vector3(0, 1, 0);
    return d.normalize();
  }, [meridianNormalLocal, northLocal]);

  const viewNorm = useMemo(() => viewLocal.clone().normalize(), [viewLocal]);
  const diskEastLocal = useMemo(() => {
    const e = new THREE.Vector3().crossVectors(viewNorm, diskNorthLocal);
    if (e.lengthSq() < 1e-9) return new THREE.Vector3(1, 0, 0);
    return e.normalize();
  }, [viewNorm, diskNorthLocal]);
  const diskSouthLocal = useMemo(() => diskNorthLocal.clone().multiplyScalar(-1), [diskNorthLocal]);
  const diskWestLocal = useMemo(() => diskEastLocal.clone().multiplyScalar(-1), [diskEastLocal]);

  const rotY90 = useMemo(
    () => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2),
    []
  );
  const diskEastLocalR = useMemo(
    () => diskEastLocal.clone().applyQuaternion(rotY90).normalize(),
    [diskEastLocal, rotY90]
  );
  const diskWestLocalR = useMemo(
    () => diskWestLocal.clone().applyQuaternion(rotY90).normalize(),
    [diskWestLocal, rotY90]
  );

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

  const qAxisNear = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), lon0EquatorLocal);
    return q;
  }, [lon0EquatorLocal]);

  const axisPosNear = useMemo(
    () => lon0EquatorLocal.clone().multiplyScalar(radius + axisLenNF / 2 + radius * AXIS_GAP_FACTOR),
    [lon0EquatorLocal, radius, axisLenNF]
  );
  const axisPos = useMemo(() => {
    const nv = diskNorthLocal.clone();
    return nv.multiplyScalar(radius + axisLen / 2 + radius * AXIS_GAP_FACTOR);
  }, [diskNorthLocal, radius, axisLen]);
  const labelPos = useMemo(() => {
    const nv = diskNorthLocal.clone();
    return nv.multiplyScalar(
      radius +
        axisLen +
        radius * N_MARGIN_FACTOR * LABEL_MARGIN_SCALE +
        radius * LABEL_GAP_FACTOR
    );
  }, [diskNorthLocal, radius, axisLen]);

  const axisPosE = useMemo(
    () => diskEastLocalR.clone().multiplyScalar(radius + axisLen / 2 + radius * AXIS_GAP_FACTOR),
    [diskEastLocalR, radius, axisLen]
  );
  const labelPosE = useMemo(
    () =>
      diskEastLocalR.clone().multiplyScalar(
        radius + axisLen + radius * N_MARGIN_FACTOR * LABEL_MARGIN_SCALE + radius * LABEL_GAP_FACTOR
      ),
    [diskEastLocalR, radius, axisLen]
  );
  const axisPosS = useMemo(
    () => diskSouthLocal.clone().multiplyScalar(radius + axisLen / 2 + radius * AXIS_GAP_FACTOR),
    [diskSouthLocal, radius, axisLen]
  );
  const labelPosS = useMemo(
    () =>
      diskSouthLocal.clone().multiplyScalar(
        radius + axisLen + radius * N_MARGIN_FACTOR * LABEL_MARGIN_SCALE + radius * LABEL_GAP_FACTOR
      ),
    [diskSouthLocal, radius, axisLen]
  );
  const axisPosO = useMemo(
    () => diskWestLocalR.clone().multiplyScalar(radius + axisLen / 2 + radius * AXIS_GAP_FACTOR),
    [diskWestLocalR, radius, axisLen]
  );
  const labelPosO = useMemo(
    () =>
      diskWestLocalR.clone().multiplyScalar(
        radius + axisLen + radius * N_MARGIN_FACTOR * LABEL_MARGIN_SCALE + radius * LABEL_GAP_FACTOR
      ),
    [diskWestLocalR, radius, axisLen]
  );

  return (
    <group scale={[scale, scale, scale]} quaternion={quaternion}>
      {debugMask && <axesHelper args={[targetPx * 0.6]} />}
      <primitive object={centeredScene} />

      {showPlanetCard && (
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

      {showPlanetCard && showSubsolarCone && subsolar && (
        <mesh position={[subsolar.center.x, subsolar.center.y, subsolar.center.z]} quaternion={subsolar.rotation} renderOrder={12}>
          {/* FIX: cône en taille écran fixe */}
          <coneGeometry args={[subsolar.baseRadius, subsolar.h, 24]} />
          <meshStandardMaterial color="#facc15" emissive="#fbbf24" emissiveIntensity={1.2} transparent opacity={0.95} depthTest depthWrite={false} />
        </mesh>
      )}
      {showPlanetCard && showSubsolarCone && antisolar && (
        <mesh position={[antisolar.center.x, antisolar.center.y, antisolar.center.z]} quaternion={antisolar.rotation} renderOrder={12}>
          {/* FIX: cône en taille écran fixe */}
          <coneGeometry args={[antisolar.baseRadius, antisolar.h, 24]} />
          <meshStandardMaterial color="#1e3a8a" emissive="#1e40af" emissiveIntensity={0.6} transparent opacity={0.95} depthTest depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

export default function Planet3D({
  id,
  x, y, wPx, hPx,
  planetAltDeg, planetAzDeg,
  sunAltDeg, sunAzDeg,
  rotationDeg,
  limbAngleDeg,
  modelUrl: modelUrlOverride,
  debugMask = false,
  rotOffsetDegX = 0, rotOffsetDegY = 0, rotOffsetDegZ = 0,
  camRotDegX = 0, camRotDegY = 0, camRotDegZ = 0,
  showPhase = true,
  showPlanetCard = false,
  illumFraction,
  brightLimbAngleDeg,
  showSubsolarCone = true,
  reliefScale,
  orientationDegX,
  orientationDegY,
  orientationDegZ,
}: Props) {
  const reg = PLANET_REGISTRY[id] as any;
  const renderCfg = (reg?.render) || {};
  const modelUrl = modelUrlOverride || reg?.modelUrl;
  if (!modelUrl) return null;


  if (!Number.isFinite(wPx) || !Number.isFinite(hPx) || wPx < 2 || hPx < 2) return null;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

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
  return [cosAlt * Math.sin(az), cosAlt * Math.cos(az), Math.sin(alt)];
}

function rotateAToB(a: Vec3, b: Vec3): number[][] {
  const [ax, ay, az] = a;
  const [bx, by, bz] = b;
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
    ],
    [
      vx[2][0] * vx[0][0] + vx[2][1] * vx[1][0] + vx[2][2] * vx[2][0],
      vx[2][0] * vx[0][1] + vx[2][1] * vx[1][1] + vx[2][2] * vx[2][1],
    ],
  ];
  const kx = k * vx[0][0], ky = k * vx[1][1], kz = k * vx[2][2];
  return [
    [1 + kx + vx2[0][0], vx[0][1] + vx2[0][1] * k, vx[0][2] + vx2[0][2] * k],
    [vx[1][0] + vx2[1][0] * k, 1 + ky + vx2[1][1] * k, vx[1][2] + vx2[1][2] * k],
    [vx[2][0] + vx2[2][0] * k, vx[2][1] + vx2[2][1] * k, 1 + kz + vx2[2][2] * k],
  ];
}

  // Per-planet resolved values with defaults
  const sunlightIntensity = toFiniteNumber(renderCfg.sunlightIntensity) ?? DEFAULT_SUNLIGHT_INTENSITY;
  const ambientFillIntensity = toFiniteNumber(renderCfg.ambientFillIntensity) ?? DEFAULT_AMBIENT_FILL_INTENSITY;
  const noPhaseAmbientIntensity = toFiniteNumber(renderCfg.noPhaseAmbientIntensity) ?? DEFAULT_NO_PHASE_AMBIENT_INTENSITY;
  const reliefScaleDefault = toFiniteNumber(renderCfg.reliefScaleDefault ?? renderCfg.reliefScale) ?? DEFAULT_RELIEF_SCALE;
  const glbCalib: GlbCalib = (renderCfg.glbCalib as GlbCalib) ?? DEFAULT_GLB_CALIB;

  // Effective relief (prop wins over per-planet default)
  const effectiveReliefScale = toFiniteNumber(reliefScale) ?? reliefScaleDefault;

  const vPlanet = useMemo(() => altAzToVec(planetAltDeg, planetAzDeg), [planetAltDeg, planetAzDeg]);
  const vSun = useMemo(() => altAzToVec(sunAltDeg, sunAzDeg), [sunAltDeg, sunAzDeg]);
  const R = useMemo(() => rotateAToB(vPlanet, [0, 0, -1]), [vPlanet]);

  // Phase-aware light direction (camera frame) if illumFraction and PA are provided
  const lightCam = useMemo((): Vec3 => {
    const fNum = toFiniteNumber(illumFraction);
    const paNum = toFiniteNumber(brightLimbAngleDeg);
    const hasF = typeof fNum === 'number';
    const hasPa = typeof paNum === 'number';

    if (hasF && hasPa) {
      const f = Math.min(1, Math.max(0, fNum as number));
      const c = Math.max(-1, Math.min(1, 2 * f - 1));
      const gamma = Math.acos(c); // 0=Full, π=New
      const a = ((paNum as number) * Math.PI) / 180;
      // +Y=N (0°), +X=E (90°)
      const px = Math.sin(a);
      const py = Math.cos(a);
      const sx = Math.sin(gamma) * px;
      const sy = Math.sin(gamma) * py;
      const sz = Math.cos(gamma); // +Z for Full
      return [sx, sy, sz];
    }
    return mul(R, vSun);
  }, [illumFraction, brightLimbAngleDeg, R, vSun]);
  //console.log(reg.label, " illumFraction: ", illumFraction);
  const camEuler = useMemo(
    () =>
      new THREE.Euler(
        (camRotDegX * Math.PI) / 180,
        (camRotDegY * Math.PI) / 180,
        (camRotDegZ * Math.PI) / 180,
        'XYZ'
      ),
    [camRotDegX, camRotDegY, camRotDegZ]
  );

  const baseLightPos = useMemo(() => {
    const q = new THREE.Quaternion().setFromEuler(camEuler).invert();
    const v = new THREE.Vector3(lightCam[0], lightCam[1], lightCam[2]).applyQuaternion(q);
    return [-v.x, -v.y, -v.z] as Vec3;
  }, [lightCam, camEuler]);
  const sunDirWorld = useMemo((): Vec3 => {
    const d = new THREE.Vector3(-baseLightPos[0], -baseLightPos[1], -baseLightPos[2]);
    if (d.lengthSq() < 1e-9) return [0, 0, -1];
    d.normalize();
    return [d.x, d.y, d.z];
  }, [baseLightPos]);

  // Sizing (ajusté pour les anneaux de Saturne)
  const hasRings = !!reg?.hasRings;
  const targetPx = Math.floor(Math.min(wPx, hPx));

  // marge de base (carte active -> un peu plus)
  let extraMargin = showPlanetCard ? 0.45 : 0.20;

  if (hasRings) {
    const RING_OUTER_FACTOR = SATURN_RING_OUTER_TO_GLOBE_DIAM_RATIO; // ≈2.347
    const needed = RING_OUTER_FACTOR - 1;
    const withBuffer = needed + 0.08; // léger buffer
    if (extraMargin < withBuffer) extraMargin = withBuffer;
  }

  const canvasPx = Math.floor(targetPx * (1 + extraMargin));
  const left = x;
  const top  = y;
  // Debug: show all incoming props
  const debugProps = {
    id,
    limbAngleDeg,
    illumFraction,
    rotationDeg,
    orientationDegX,
    orientationDegY,  
    orientationDegZ,
  };
  const debugText = id+"\n" +
    "Eclairé : " + formatDeg(limbAngleDeg) + " " + (illumFraction * 100).toFixed(2) + "%, " + "\n " +
    "RotZ Ecran : " + formatDeg(rotationDeg) + "\n" +
    "RotX astro : " + formatDeg(orientationDegX) + "\n" +
    "RotY astro : " + formatDeg(orientationDegY) + "\n" +
    "RotZ astro : " + formatDeg(orientationDegZ) + "\n";

  //JSON.stringify(debugProps.lim, null, 2);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        zIndex: Z.horizon - 1,
        left,
        top,
        width: canvasPx,
        height: canvasPx,
        overflow: 'hidden',
        // Prevent jitter: center anchor and let sub-pixel coordinates render smoothly
        transform: 'translate(-50%, -50%)',
        willChange: 'transform',
      }}
    >
      <Canvas
        orthographic
        dpr={[1, 2]}
        gl={{ alpha: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(0x000000), 0);
          gl.toneMappingExposure = 2.2;
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
        {!showPhase ? (
          <>
            <ambientLight intensity={noPhaseAmbientIntensity} />
          </>
        ) : (
          <>
          <ambientLight intensity={ambientFillIntensity} />
          <directionalLight position={[sunDirWorld[0], sunDirWorld[1], sunDirWorld[2]]} intensity={sunlightIntensity} />
          </>
        )}
        <Suspense fallback={<mesh><sphereGeometry args={[canvasPx * 0.45, 32, 32]} /><meshStandardMaterial color="#b0b0b0" /></mesh>}>
          <Model
            targetPx={targetPx}
            modelUrl={modelUrl}
            sunDirWorld={sunDirWorld}
            showSubsolarCone={showSubsolarCone}
            showPlanetCard={showPlanetCard}
            limbAngleDeg={limbAngleDeg}
            rotationDeg={rotationDeg}
            rotOffsetDegX={rotOffsetDegX}
            rotOffsetDegY={rotOffsetDegY}
            rotOffsetDegZ={rotOffsetDegZ}
            debugMask={debugMask}
            reliefScale={effectiveReliefScale}
            glbCalib={glbCalib}
            orientationDegX={orientationDegX}
            orientationDegY={orientationDegY}
            orientationDegZ={orientationDegZ}
            planetId={id}             // + pass id
          />
        </Suspense>
      </Canvas>
      {debugMask && (
        <div
          style={{
            position: 'absolute',
            left: 6,
            top: 6,
            right: 6,
            maxHeight: '95%',
            color: '#e5e7eb',
            background: 'rgba(0,0,0,0.55)',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: 11,
            lineHeight: 1.2,
            padding: 8,
            borderRadius: 6,
            whiteSpace: 'pre-wrap',
            overflow: 'auto',
          }}
        >
          {debugText}
          
        </div>
      )}
    </div>
  );
}