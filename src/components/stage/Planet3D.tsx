import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Z } from '../../render/constants';
import type { PlanetId } from '../../astro/planets';
import { PLANET_REGISTRY } from '../../render/planetRegistry';

// Light/relief settings (match Moon3D defaults)
const EARTHSHINE_INTENSITY_GAIN = 1.0;
const SUNLIGHT_INTENSITY = 10.0;
const RELIEF_SCALE_DEFAULT = 0.4;

// Minimal/neutral GLB calibration (models may already be oriented)
const GLB_CALIB = {
  rotationBaseDeg: { x: 0, y: 0, z: 0 },
} as const;

// Cached processed models (per url+reliefScale)
type ProcessedModel = { scene: THREE.Object3D; maxDim: number; radius: number };
const processedCache = new Map<string, ProcessedModel>();

function processSceneOnce(original: THREE.Object3D, reliefScale: number): ProcessedModel {
  const rScale = Math.max(0, reliefScale ?? RELIEF_SCALE_DEFAULT);
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
  const key = `${modelUrl}::${Math.max(0, reliefScale ?? RELIEF_SCALE_DEFAULT)}`;
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
      vx[1][0] * vx[0][2] + vx[1][1] * vx[1][2] + vx[1][2] * vx[2][2],
    ],
    [
      vx[2][0] * vx[0][0] + vx[2][1] * vx[1][0] + vx[2][2] * vx[2][0],
      vx[2][0] * vx[0][1] + vx[2][1] * vx[1][1] + vx[2][2] * vx[2][1],
      vx[2][0] * vx[0][2] + vx[2][1] * vx[1][2] + vx[2][2] * vx[2][2],
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
  earthshine?: boolean;
  reliefScale?: number;
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
  reliefScale = RELIEF_SCALE_DEFAULT,
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
}) {
  useGLTF.preload(modelUrl);
  const { scene } = useGLTF(modelUrl);

  const { centeredScene, scale, radius } = useMemo(() => {
    const processed = getProcessedModel(modelUrl, scene, reliefScale);
    const s = Math.max(1, targetPx) / Math.max(1e-6, processed.maxDim);
    return { centeredScene: processed.scene, scale: s, radius: processed.radius };
  }, [modelUrl, scene, reliefScale, targetPx]);

  // Neutral base + user offsets + "limb" rotation on Z (keep parity with Moon3D inputs)
  const baseX = GLB_CALIB.rotationBaseDeg.x, baseY = GLB_CALIB.rotationBaseDeg.y, baseZ = GLB_CALIB.rotationBaseDeg.z;
  const rotX = ((baseX + rotOffsetDegX) * Math.PI) / 180;
  const rotY = ((baseY + rotOffsetDegY) * Math.PI) / 180;
  const rotZ = (((baseZ + limbAngleDeg + rotOffsetDegZ)) * Math.PI) / 180;
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

  return (
    <group scale={[scale, scale, scale]} quaternion={quaternion}>
      {debugMask && <axesHelper args={[targetPx * 0.6]} />}
      <primitive object={centeredScene} />
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
  earthshine = false,
  reliefScale = RELIEF_SCALE_DEFAULT,
}: Props) {
  // ...existing code...
  if (!Number.isFinite(wPx) || !Number.isFinite(hPx) || wPx < 2 || hPx < 2) return null;

  // Source static model from registry (override if provided)
  const reg = PLANET_REGISTRY[id];
  const modelUrl = modelUrlOverride || reg?.modelUrl;
  if (!modelUrl) return null;

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

  // Earthshine fill intensity/position
  const earthshineFrac = useMemo(() => {
    const f = toFiniteNumber(illumFraction);
    if (typeof f !== 'number') return 0;
    return Math.max(0, Math.min(1, 1 - f));
  }, [illumFraction]);

  const earthFillIntensity = useMemo(() => {
    if (!earthshine) return 0;
    return Math.pow(earthshineFrac, 0.8) * EARTHSHINE_INTENSITY_GAIN;
  }, [earthshine, earthshineFrac]);

  const earthFillPos = useMemo((): Vec3 => {
    const rWorld = targetPx / 2;
    const fwd = new THREE.Vector3(0, 0, -1).applyEuler(camEuler).normalize();
    const pos = fwd.multiplyScalar(-rWorld * 1.02);
    return [pos.x, pos.y, pos.z];
  }, [camEuler, targetPx]);

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
            <ambientLight intensity={1.2} />
            <directionalLight position={[1, 0, 0]} intensity={3.5} />
            <directionalLight position={[-1, 0, 0]} intensity={3.5} />
            <directionalLight position={[0, 1, 0]} intensity={3.5} />
            <directionalLight position={[0, -1, 0]} intensity={3.5} />
            <directionalLight position={[0, 0, 1]} intensity={3.5} />
            <directionalLight position={[0, 0, -1]} intensity={3.5} />
            <directionalLight position={[1, 1, 1]} intensity={2.0} />
            <directionalLight position={[1, 1, -1]} intensity={2.0} />
            <directionalLight position={[1, -1, 1]} intensity={2.0} />
            <directionalLight position={[1, -1, -1]} intensity={2.0} />
            <directionalLight position={[-1, 1, 1]} intensity={2.0} />
            <directionalLight position={[-1, 1, -1]} intensity={2.0} />
            <directionalLight position={[-1, -1, 1]} intensity={2.0} />
            <directionalLight position={[-1, -1, -1]} intensity={2.0} />
          </>
        ) : (
          <>
            <hemisphereLight args={[0x888888, 0x111111, 1.2]} />
            <directionalLight position={[sunDirWorld[0], sunDirWorld[1], sunDirWorld[2]]} intensity={SUNLIGHT_INTENSITY} />
            <ambientLight intensity={0.8} />
            {earthFillIntensity > 0 && (
              <directionalLight position={earthFillPos} color="#9999ff" intensity={earthFillIntensity} />
            )}
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
            reliefScale={reliefScale}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}