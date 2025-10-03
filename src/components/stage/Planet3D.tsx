import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrthographicCamera, Text, Billboard } from '@react-three/drei'
import * as THREE from 'three';
import { Z } from '../../render/constants';
import type { PlanetId } from '../../astro/planets';
import { PLANET_REGISTRY } from '../../render/planetRegistry';

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

// Cached processed models (per url+reliefScale)
type ProcessedModel = { scene: THREE.Object3D; maxDim: number; radius: number };
const processedCache = new Map<string, ProcessedModel>();

function processSceneOnce(original: THREE.Object3D, reliefScale: number): ProcessedModel {
  const rScale = Math.max(0, reliefScale ?? DEFAULT_RELIEF_SCALE);
  const clone = original.clone(true);

  // Center clone to origin
  const box0 = new THREE.Box3().setFromObject(clone);
  const center0 = new THREE.Vector3();
  const size0 = new THREE.Vector3();
  box0.getCenter(center0);
  box0.getSize(size0);
  clone.position.x += -center0.x;
  clone.position.y += -center0.y;
  clone.position.z += -center0.z;

  // Clone geometries so we can mutate safely
  clone.traverse((obj: any) => {
    if (obj?.isMesh && obj.geometry?.isBufferGeometry) {
      obj.geometry = (obj.geometry as THREE.BufferGeometry).clone();
      const posAttr = obj.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
      if (posAttr && (posAttr as any).clone) {
        obj.geometry.setAttribute('position', (posAttr as any).clone());
      }
    }
  });

  // Scale material-driven relief
  clone.traverse((obj: any) => {
    if (obj?.isMesh) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m: any) => {
        if (!m) return;
        if (typeof m.displacementScale === 'number') m.displacementScale *= rScale;
        if (typeof m.bumpScale === 'number') m.bumpScale *= rScale;
        if (m.normalScale && m.normalScale.isVector2) m.normalScale.multiplyScalar(rScale);
        m.needsUpdate = true;
      });
    }
  });

  // Optional geometry-based relief rescale
  if (Number.isFinite(rScale) && Math.abs(rScale - 1) > 1e-6) {
    clone.updateMatrixWorld(true);
    let minR = Infinity, maxR = 0;
    const v = new THREE.Vector3();

    clone.traverse((obj: any) => {
      if (obj?.isMesh && obj.geometry?.attributes?.position) {
        const pos = obj.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i);
          obj.localToWorld(v);
          const r = v.length();
          if (r < minR) minR = r;
          if (r > maxR) maxR = r;
        }
      }
    });

    if (isFinite(minR) && isFinite(maxR) && maxR > 0) {
      const r0 = (minR + maxR) * 0.5;
      const vLocal = new THREE.Vector3();
      const vWorld = new THREE.Vector3();

      clone.traverse((obj: any) => {
        if (obj?.isMesh && obj.geometry?.attributes?.position) {
          const geom = obj.geometry as THREE.BufferGeometry;
          const pos = geom.attributes.position as THREE.BufferAttribute;
          for (let i = 0; i < pos.count; i++) {
            vLocal.fromBufferAttribute(pos, i);
            vWorld.copy(vLocal);
            obj.localToWorld(vWorld);
            const r = vWorld.length();
            if (r > 1e-9) {
              vWorld.multiplyScalar(1 / r);
              const newR = r0 + (r - r0) * rScale;
              vWorld.multiplyScalar(newR);
              obj.worldToLocal(vWorld);
              pos.setXYZ(i, vWorld.x, vWorld.y, vWorld.z);
            }
          }
          pos.needsUpdate = true;
          if (!geom.getAttribute('normal')) {
            geom.computeVertexNormals();
          }
          geom.computeBoundingSphere();
          geom.computeBoundingBox?.();
        }
      });
    }
  }

  // Optional: blend baked normals toward spherical normals
  clone.traverse((obj: any) => {
    if (obj?.isMesh && obj.geometry?.attributes?.position && obj.geometry?.attributes?.normal) {
      const geom = obj.geometry as THREE.BufferGeometry;
      const pos = geom.attributes.position as THREE.BufferAttribute;
      const normal = geom.attributes.normal as THREE.BufferAttribute;
      const orig = new Float32Array(normal.array);
      const p = new THREE.Vector3();
      const nSphere = new THREE.Vector3();
      const n0 = new THREE.Vector3();
      const nOut = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        p.fromBufferAttribute(pos, i);
        nSphere.copy(p).normalize();
        n0.set(orig[i * 3 + 0], orig[i * 3 + 1], orig[i * 3 + 2]).normalize();
        nOut.copy(n0).sub(nSphere).multiplyScalar(rScale).add(nSphere).normalize();
        normal.setXYZ(i, nOut.x, nOut.y, nOut.z);
      }
      normal.needsUpdate = true;
    }
  });

  const box = new THREE.Box3().setFromObject(clone);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y);
  const radius = Math.max(1e-6, maxDim) / 2;
  return { scene: clone, maxDim, radius };
}

function getProcessedModel(modelUrl: string, original: THREE.Object3D, reliefScale: number): ProcessedModel {
  const key = `${modelUrl}::${Math.max(0, reliefScale ?? DEFAULT_RELIEF_SCALE)}`;
  const cached = processedCache.get(key);
  if (cached) return cached;
  const processed = processSceneOnce(original, reliefScale);
  processedCache.set(key, processed);
  return processed;
}

// Helpers copied/adapted from Moon3D
type Vec3 = [number, number, number];

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
  return [
    [1 + vx[0][0] + vx2[0][0] * k, vx[0][1] + vx2[0][1] * k, vx[0][2] + vx2[0][2] * k],
    [vx[1][0] + vx2[1][0] * k, 1 + vx[1][1] + vx2[1][1] * k, vx[1][2] + vx2[1][2] * k],
    [vx[2][0] + vx2[2][0] * k, vx[2][1] + vx2[2][1] * k, 1 + vx[2][2] + vx2[2][2] * k],
  ];
}

function mul(R: number[][], v: Vec3): Vec3 {
  return [
    R[0][0] * v[0] + R[0][1] * v[1] + R[0][2] * v[2],
    R[1][0] * v[0] + R[1][1] * v[1] + R[1][2] * v[2],
    R[2][0] * v[0] + R[2][1] * v[1] + R[2][2] * v[2],
  ];
}

// Props aligned with Moon3D (planet-centric names where applicable)
type Props = {
  id: PlanetId;
  x: number;
  y: number;
  wPx: number;
  hPx: number;
  planetAltDeg: number;
  planetAzDeg: number;
  sunAltDeg: number;
  sunAzDeg: number;
  limbAngleDeg: number;
  modelUrl?: string;
  debugMask?: boolean;
  rotOffsetDegX?: number;
  rotOffsetDegY?: number;
  rotOffsetDegZ?: number;
  camRotDegX?: number;
  camRotDegY?: number;
  camRotDegZ?: number;
  showPhase?: boolean;
  showPlanetCard?: boolean; // reserved; no axes/rings overlays here
  illumFraction?: number | string;      // mainly for Mercury/Venus
  brightLimbAngleDeg?: number | string; // PA of bright limb (0=N, 90=E)
  showSubsolarCone?: boolean;
  reliefScale?: number;
  orientationDegX?: number;
  orientationDegY?: number;
  orientationDegZ?: number;
};

function Model({
  targetPx,
  modelUrl,
  sunDirWorld,
  showSubsolarCone = true,
  showPlanetCard = false,
  // rotation/orientation
  limbAngleDeg,
  rotOffsetDegX = 0,
  rotOffsetDegY = 0,
  rotOffsetDegZ = 0,
  debugMask = false,
  reliefScale = DEFAULT_RELIEF_SCALE,
  glbCalib = DEFAULT_GLB_CALIB,
  orientationDegX,
  orientationDegY,
  orientationDegZ,
}: {
  targetPx: number;
  modelUrl: string;
  sunDirWorld?: Vec3;
  showSubsolarCone?: boolean;
  showPlanetCard?: boolean;
  limbAngleDeg: number;
  rotOffsetDegX?: number;
  rotOffsetDegY?: number;
  rotOffsetDegZ?: number;
  debugMask?: boolean;
  reliefScale?: number;
  glbCalib?: GlbCalib;
  orientationDegX?: number;
  orientationDegY?: number;
  orientationDegZ?: number;
}) {
  useGLTF.preload(modelUrl);
  const { scene } = useGLTF(modelUrl);

  const { centeredScene, scale, radius } = useMemo(() => {
    const processed = getProcessedModel(modelUrl, scene, reliefScale);
    const s = Math.max(1, targetPx) / Math.max(1e-6, processed.maxDim);
    return { centeredScene: processed.scene, scale: s, radius: processed.radius };
  }, [modelUrl, scene, reliefScale, targetPx]);

  // Neutral base + user offsets + "limb" rotation on Z (keep parity with Moon3D inputs)
  const baseX = glbCalib.rotationBaseDeg.x, baseY = glbCalib.rotationBaseDeg.y, baseZ = glbCalib.rotationBaseDeg.z;
  const oX = Number.isFinite(orientationDegX) ? (orientationDegX as number) : 0;
  const oY = Number.isFinite(orientationDegY) ? (orientationDegY as number) : 0;
  const oZ = Number.isFinite(orientationDegZ) ? (orientationDegZ as number) : limbAngleDeg;

  const rotX = ((baseX + oX + rotOffsetDegX) * Math.PI) / 180;
  const rotY = ((baseY + oY + rotOffsetDegY) * Math.PI) / 180;
  const rotZ = (((baseZ + limbAngleDeg + oZ + rotOffsetDegZ) * Math.PI) / 180);
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
          {/* Equator ring */}
          <group quaternion={qEquatorTorus} renderOrder={10}>
            <mesh renderOrder={10}>
              <torusGeometry args={[radius * RING_RADIUS_FACTOR, radius * RING_TUBE_FACTOR, 16, 128]} />
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
              <torusGeometry args={[radius * RING_RADIUS_FACTOR, radius * RING_TUBE_FACTOR, 16, 128]} />
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
          {/* Center dot */}
          <mesh renderOrder={11}>
            <sphereGeometry args={[radius * CENTER_DOT_FACTOR, 16, 16]} />
            <meshBasicMaterial color="#38bdf8" depthTest={false} depthWrite={false} />
          </mesh>
          {/* N axis + label */}
          <group renderOrder={11}>
            <mesh position={[axisPos.x, axisPos.y, axisPos.z]} quaternion={qAxisN} renderOrder={11}>
              <cylinderGeometry args={[radius * AXIS_THICKNESS_FACTOR, radius * AXIS_THICKNESS_FACTOR, axisLen, 16]} />
              <meshBasicMaterial color="#a78bfa" depthTest={false} depthWrite={false} />
            </mesh>
            <Billboard position={[labelPos.x, labelPos.y, labelPos.z]}>
              <Text position={[0, 0, 0]} fontSize={radius * N_SIZE_FACTOR} color="#a78bfa" anchorX="center" anchorY="middle" renderOrder={12}>N</Text>
            </Billboard>
          </group>
          {/* E, S, O axes + labels + near/reference axis */}
          <group renderOrder={11}>
            {/* E */}
            <mesh position={[axisPosE.x, axisPosE.y, axisPosE.z]} quaternion={qAxisDiskE} renderOrder={11}>
              <cylinderGeometry args={[radius * AXIS_THICKNESS_FACTOR, radius * AXIS_THICKNESS_FACTOR, axisLen, 16]} />
              <meshBasicMaterial color="#a78bfa" depthTest={false} depthWrite={false} />
            </mesh>
            <Billboard position={[labelPosE.x, labelPosE.y, labelPosE.z]}>
              <Text position={[0, 0, 0]} fontSize={radius * N_SIZE_FACTOR} color="#a78bfa" anchorX="center" anchorY="middle" renderOrder={12}>E</Text>
            </Billboard>
            {/* S */}
            <mesh position={[axisPosS.x, axisPosS.y, axisPosS.z]} quaternion={qAxisDiskS} renderOrder={11}>
              <cylinderGeometry args={[radius * AXIS_THICKNESS_FACTOR, radius * AXIS_THICKNESS_FACTOR, axisLen, 16]} />
              <meshBasicMaterial color="#a78bfa" depthTest={false} depthWrite={false} />
            </mesh>
            <Billboard position={[labelPosS.x, labelPosS.y, labelPosS.z]}>
              <Text position={[0, 0, 0]} fontSize={radius * N_SIZE_FACTOR} color="#a78bfa" anchorX="center" anchorY="middle" renderOrder={12}>S</Text>
            </Billboard>
            {/* O (W) */}
            <mesh position={[axisPosO.x, axisPosO.y, axisPosO.z]} quaternion={qAxisDiskO} renderOrder={11}>
              <cylinderGeometry args={[radius * AXIS_THICKNESS_FACTOR, radius * AXIS_THICKNESS_FACTOR, axisLen, 16]} />
              <meshBasicMaterial color="#a78bfa" depthTest={false} depthWrite={false} />
            </mesh>
            <Billboard position={[labelPosO.x, labelPosO.y, labelPosO.z]}>
              <Text position={[0, 0, 0]} fontSize={radius * N_SIZE_FACTOR} color="#a78bfa" anchorX="center" anchorY="middle" renderOrder={12}>O</Text>
            </Billboard>
            {/* Reference axis along lon0EquatorLocal (no label) */}
            <mesh position={[axisPosNear.x, axisPosNear.y, axisPosNear.z]} quaternion={qAxisNear} renderOrder={11}>
              <cylinderGeometry args={[radius * AXIS_THICKNESS_FACTOR, radius * AXIS_THICKNESS_FACTOR, axisLenNF, 16]} />
              <meshBasicMaterial color="#a78bfa" depthTest={false} depthWrite={false} />
            </mesh>
          </group>
        </group>
      )}

      {showPlanetCard && showSubsolarCone && subsolar && (
        <mesh position={[subsolar.center.x, subsolar.center.y, subsolar.center.z]} quaternion={subsolar.rotation} renderOrder={12}>
          <coneGeometry args={[subsolar.baseRadius, subsolar.h, 24]} />
          <meshStandardMaterial color="#facc15" emissive="#fbbf24" emissiveIntensity={1.2} transparent opacity={0.95} depthTest depthWrite={false} />
        </mesh>
      )}
      {showPlanetCard && showSubsolarCone && antisolar && (
        <mesh position={[antisolar.center.x, antisolar.center.y, antisolar.center.z]} quaternion={antisolar.rotation} renderOrder={12}>
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
  // Source model URL and per-planet overrides
  const reg = PLANET_REGISTRY[id] as any;
  const renderCfg = (reg?.render) || {};

  const modelUrl = modelUrlOverride || reg?.modelUrl;
  if (!modelUrl) return null;


  // Preload GLB even if we don't render now
  useGLTF.preload(modelUrl);

  if (!Number.isFinite(wPx) || !Number.isFinite(hPx) || wPx < 2 || hPx < 2) return null;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

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

  // Sizing like Moon3D: add small margin for cones/card if enabled
  const targetPx = Math.floor(Math.min(wPx, hPx));
  const extraMargin = showPlanetCard ? 0.45 : 0.20;
  const canvasPx = Math.floor(targetPx * (1 + extraMargin));
  const left = Math.round(x - canvasPx / 2);
  const top = Math.round(y - canvasPx / 2);

  return (
    <div
      className="absolute"
      style={{ zIndex: Z.horizon - 1, left, top, width: canvasPx, height: canvasPx, pointerEvents: 'none', overflow: 'hidden' }}
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
            rotOffsetDegX={rotOffsetDegX}
            rotOffsetDegY={rotOffsetDegY}
            rotOffsetDegZ={rotOffsetDegZ}
            debugMask={debugMask}
            reliefScale={effectiveReliefScale}
            glbCalib={glbCalib}
            orientationDegX={orientationDegX}
            orientationDegY={orientationDegY}
            orientationDegZ={orientationDegZ}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}