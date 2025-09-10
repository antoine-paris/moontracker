import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrthographicCamera, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Z } from '../../render/constants';

// Calibration dépendante du GLB (orientation et axes locaux du modèle)
// Si vous changez de modèle GLB, ajustez ces valeurs ici.
const GLB_CALIB = {
  rotationBaseDeg: { x: 0, y: -90, z: 180 }, // base pour obtenir North-Up et face visible
  northLocal: new THREE.Vector3(0, 0, 1),    // direction du nord lunaire dans l'espace local du GLB
  viewForwardLocal: new THREE.Vector3(0, 0, -1), // direction vers la caméra dans l'espace local du GLB
} as const;

// Facteurs (en multiples du rayon) pour dimensionner la boîte autour des marqueurs
const AXIS_LEN_FACTOR = 0.5;   // longueur du trait nord = 0.5R
const N_SIZE_FACTOR = 0.18;    // hauteur du "N" = 0.18R

// Types et helpers (réécrits pour correction de syntaxe)
export type Props = {
  x: number; // screen x of moon center (absolute in stage)
  y: number; // screen y of moon center (absolute in stage)
  wPx: number;
  hPx: number;
  moonAltDeg: number;
  moonAzDeg: number;
  sunAltDeg: number;
  sunAzDeg: number;
  limbAngleDeg: number; // orientation of the lunar north toward the top
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
};

export type Vec3 = [number, number, number];

export function altAzToVec(altDeg: number, azDeg: number): Vec3 {
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

export function rotateAToB(a: Vec3, b: Vec3): number[][] {
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

export function mul(R: number[][], v: Vec3): Vec3 {
  return [
    R[0][0] * v[0] + R[0][1] * v[1] + R[0][2] * v[2],
    R[1][0] * v[0] + R[1][1] * v[1] + R[1][2] * v[2],
    R[2][0] * v[0] + R[2][1] * v[1] + R[2][2] * v[2],
  ];
}

function Model({ limbAngleDeg, targetPx, modelUrl, rotOffsetDegX = 0, rotOffsetDegY = 0, rotOffsetDegZ = 0, debugMask = false, showMoonCard = false }: { limbAngleDeg: number; targetPx: number; modelUrl: string; rotOffsetDegX?: number; rotOffsetDegY?: number; rotOffsetDegZ?: number; debugMask?: boolean; showMoonCard?: boolean; }) {
  // Pas d'import Vite: on utilise un chemin direct pour le GLB
  useGLTF.preload(modelUrl);
  const { scene } = useGLTF(modelUrl);
  // Centrer le modèle et calculer l'échelle pour remplir targetPx
  const { centeredScene, scale, radius } = useMemo(() => {
     const clone = scene.clone(true);
     const box = new THREE.Box3().setFromObject(clone);
     const center = new THREE.Vector3();
     const size = new THREE.Vector3();
     box.getCenter(center);
     box.getSize(size);
     clone.position.x += -center.x;
     clone.position.y += -center.y;
     clone.position.z += -center.z;
     const maxDim = Math.max(size.x, size.y);
     const s = Math.max(1, targetPx) / Math.max(1e-6, maxDim); // échelle pour que le disque fasse targetPx
     const r = Math.max(1e-6, maxDim) / 2; // rayon écran avant scale
     return { centeredScene: clone, scale: s, radius: r };
   }, [scene, targetPx]);
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
  const axisLen = useMemo(() => radius * 0.5, [radius]);
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
  const qAxisDisk = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), diskNorthLocal);
    return q;
  }, [diskNorthLocal]);
  // Positions exactes de l’axe et du label le long de northLocal (pôle nord réel)
  const axisPos = useMemo(() => {
    const nv = diskNorthLocal.clone();
    return nv.multiplyScalar(radius + axisLen / 2);
  }, [diskNorthLocal, radius, axisLen]);
  const labelPos = useMemo(() => {
    const nv = diskNorthLocal.clone();
    return nv.multiplyScalar(radius + axisLen + radius * 0.08);
  }, [diskNorthLocal, radius, axisLen]);
   return (
     <group scale={[scale, scale, scale]} quaternion={quaternion}>
       {debugMask && <axesHelper args={[targetPx * 0.6]} />}
       {showMoonCard && (
         <group>
            {/* Équateur: anneau dont la normale suit Nord local */}
            <group quaternion={qEquatorTorus} renderOrder={10}>
              <mesh renderOrder={10}>
                <torusGeometry args={[radius * 1.04, radius * 0.01, 16, 128]} />
                <meshBasicMaterial color="#22c55e" transparent opacity={0.95} depthTest={false} depthWrite={false} />
              </mesh>
            </group>
            {/* Méridien central: plan contenant Nord et la direction de vue (normal = Nord×Vue) */}
            <group quaternion={qMeridianTorus} renderOrder={10}>
              <mesh renderOrder={10}>
                <torusGeometry args={[radius * 1.04, radius * 0.01, 16, 128]} />
                <meshBasicMaterial color="#ef4444" transparent opacity={0.95} depthTest={false} depthWrite={false} />
              </mesh>
            </group>
            {/* Point central bleu */}
            <mesh renderOrder={11}>
              <sphereGeometry args={[radius * 0.04, 16, 16]} />
              <meshBasicMaterial color="#38bdf8" depthTest={false} depthWrite={false} />
            </mesh>
            {/* Axe nord (violet) orienté sur Nord local */}
            <group renderOrder={11}>
              <mesh position={[axisPos.x, axisPos.y, axisPos.z]} quaternion={qAxisDisk} renderOrder={11}>
                <cylinderGeometry args={[radius * 0.01, radius * 0.01, axisLen, 16]} />
                <meshBasicMaterial color="#a78bfa" depthTest={false} depthWrite={false} />
              </mesh>
              <Text position={[labelPos.x, labelPos.y, labelPos.z]} fontSize={radius * 0.18} color="#a78bfa" anchorX="center" anchorY="middle" renderOrder={12} rotation={[0, Math.PI / 2, 0]}>N</Text>
            </group>
          </group>
        )}
       {/* On re-scale uniquement le modèle GLB pour conserver son diamètre apparent */}
       <primitive object={centeredScene} />
      </group>
    );
 }

export default function Moon3D({ x, y, wPx, hPx, moonAltDeg, moonAzDeg, sunAltDeg, sunAzDeg, limbAngleDeg, modelUrl = '/src/assets/nasa-gov-4720.glb', debugMask = false, rotOffsetDegX = 0, rotOffsetDegY = 0, rotOffsetDegZ = 0, camRotDegX = 0, camRotDegY = 0, camRotDegZ = 0, showPhase = true, showMoonCard = false }: Props) {
   const tooSmall = !Number.isFinite(wPx) || !Number.isFinite(hPx) || wPx < 2 || hPx < 2;

   const vMoon = useMemo(() => altAzToVec(moonAltDeg, moonAzDeg), [moonAltDeg, moonAzDeg]);
   const vSun  = useMemo(() => altAzToVec(sunAltDeg,  sunAzDeg ), [sunAltDeg,  sunAzDeg ]);
   // Aligner la direction Lune vers la caméra (cam regarde -Z)
   const R = useMemo(() => rotateAToB(vMoon, [0,0,-1]), [vMoon]);
   const lightCam = useMemo(() => mul(R, vSun), [R, vSun]);
   // Base light position (opposée à la direction soleil caméra)
   const baseLightPos = useMemo(() => ([-lightCam[0], -lightCam[1], -lightCam[2]] as Vec3), [lightCam]);

   // Rotations caméra (en radians) et euler
   const camEuler = useMemo(() => new THREE.Euler(
     (camRotDegX * Math.PI) / 180,
     (camRotDegY * Math.PI) / 180,
     (camRotDegZ * Math.PI) / 180,
     'XYZ'
   ), [camRotDegX, camRotDegY, camRotDegZ]);

   if (tooSmall) return null;

   // Diamètre souhaité du disque lunaire (pixels)
   const moonPx = Math.floor(Math.min(wPx, hPx));
   // Taille du Canvas: disque + marge pour les marqueurs aux deux extrémités
   const canvasPx = Math.floor(moonPx * (1 + AXIS_LEN_FACTOR + N_SIZE_FACTOR));
   const left = Math.round(x - canvasPx / 2);
   const top  = Math.round(y - canvasPx / 2);
   const targetPx = moonPx; // utilisé par Model pour caler le diamètre du disque

   return (
     <div className="absolute pointer-events-none" style={{ left, top, width: Math.max(1, canvasPx), height: Math.max(1, canvasPx), zIndex: Z.ui - 1, overflow: 'hidden' }}>
       <Canvas orthographic dpr={[1, 2]} gl={{ alpha: true }} onCreated={({ gl }) => {
         gl.setClearColor(new THREE.Color(0x000000), 0);
         gl.physicallyCorrectLights = true;
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
             <directionalLight position={[baseLightPos[0], baseLightPos[1], baseLightPos[2]]} intensity={4.0} />
             <ambientLight intensity={0.8} />
           </>
         )}
        <Suspense fallback={<mesh><sphereGeometry args={[canvasPx * 0.45, 32, 32]} /><meshStandardMaterial color="#b0b0b0" /></mesh>}>
           <Model limbAngleDeg={limbAngleDeg} targetPx={targetPx} modelUrl={modelUrl} rotOffsetDegX={rotOffsetDegX} rotOffsetDegY={rotOffsetDegY} rotOffsetDegZ={rotOffsetDegZ} debugMask={debugMask} showMoonCard={showMoonCard} />
         </Suspense>
       </Canvas>
     </div>
   );
 }
