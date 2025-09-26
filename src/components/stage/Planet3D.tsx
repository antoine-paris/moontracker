import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Z } from '../../render/constants';

type Props = {
  x: number;
  y: number;
  wPx: number;
  hPx: number;
  modelUrl: string;
  // Optional: match Moon3D props later (lights, earthshine, etc.)
};

function PlanetModel({ modelUrl, targetPx }: { modelUrl: string; targetPx: number }) {
  useGLTF.preload(modelUrl);
  const gltf = useGLTF(modelUrl);
  const scene = gltf.scene.clone(true);

  // Center and scale to match target diameter
  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const radius = maxDim > 0 ? maxDim / 2 : 1;

  const scale = (targetPx / 2) / radius; // simple mapping: model radius -> targetPx/2
  scene.position.sub(box.getCenter(new THREE.Vector3()));

  return <primitive object={scene} scale={[scale, scale, scale]} />;
}

export default function Planet3D({ x, y, wPx, hPx, modelUrl }: Props) {
  // ...existing code...
  if (!Number.isFinite(wPx) || !Number.isFinite(hPx) || wPx < 2 || hPx < 2) return null;
  const targetPx = Math.min(wPx, hPx);
  const canvasPx = Math.floor(targetPx * 1.2);
  const left = Math.round(x - canvasPx / 2);
  const top = Math.round(y - canvasPx / 2);

  return (
    <div className="absolute" style={{ zIndex: Z.horizon - 1, left, top, width: canvasPx, height: canvasPx, pointerEvents: 'none' }}>
      <Canvas orthographic dpr={[1, 2]} camera={{ position: [0, 0, 10], zoom: 10 }}>
        {/* Simple lighting; consider mirroring Moon3D’s lights later */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <Suspense fallback={null}>
          <PlanetModel modelUrl={modelUrl} targetPx={targetPx} />
        </Suspense>
      </Canvas>
    </div>
  );
}