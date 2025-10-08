import * as THREE from 'three';

// Default relief scales (kept from original components)
export const MOON_RELIEF_SCALE_DEFAULT = 0.4;
export const PLANET_RELIEF_SCALE_DEFAULT = 0.5;

export type ProcessedModel = { scene: THREE.Object3D; maxDim: number; radius: number };
const cache = new Map<string, ProcessedModel>();

// Core processing (merged from Moon3D / Planet3D)
// Centers, clones geometries, scales material & geometry relief, blends normals.
function processScene(original: THREE.Object3D, reliefScale: number): ProcessedModel {
  const rScale = Math.max(0, reliefScale);
  const clone = original.clone(true);

  // Center clone
  const box0 = new THREE.Box3().setFromObject(clone);
  const center0 = new THREE.Vector3();
  box0.getCenter(center0);
  clone.position.x -= center0.x;
  clone.position.y -= center0.y;
  clone.position.z -= center0.z;

  // Clone geometries (avoid mutating shared buffers)
  clone.traverse((obj: any) => {
    if (obj?.isMesh && obj.geometry?.isBufferGeometry) {
      obj.geometry = obj.geometry.clone();
      const pos = obj.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
      if (pos && (pos as any).clone) {
        obj.geometry.setAttribute('position', (pos as any).clone());
      }
    }
  });

  // Material-driven relief scaling
  clone.traverse((obj: any) => {
    if (obj?.isMesh) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m: any) => {
        if (!m) return;
        if (typeof m.displacementScale === 'number') m.displacementScale *= rScale;
        if (typeof m.bumpScale === 'number') m.bumpScale *= rScale;
        if (m.normalScale?.isVector2) m.normalScale.multiplyScalar(rScale);
        m.needsUpdate = true;
      });
    }
  });

  // Geometry-based radial relief rescale
  if (Math.abs(rScale - 1) > 1e-6) {
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

  // Normal blending (baked → spherical interpolation)
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
        n0.set(orig[i * 3], orig[i * 3 + 1], orig[i * 3 + 2]).normalize();
        nOut.copy(n0).sub(nSphere).multiplyScalar(rScale).add(nSphere).normalize();
        normal.setXYZ(i, nOut.x, nOut.y, nOut.z);
      }
      normal.needsUpdate = true;
    }
  });

  // Size
  const box = new THREE.Box3().setFromObject(clone);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y);
  const radius = Math.max(1e-6, maxDim) / 2;

  return { scene: clone, maxDim, radius };
}

function key(url: string, relief: number) {
  return `${url}::${relief}`;
}

export function prewarmModel(url: string, scene: THREE.Object3D, reliefScale: number, kind: 'moon' | 'planet') {
  const rel = reliefScale ?? (kind === 'moon' ? MOON_RELIEF_SCALE_DEFAULT : PLANET_RELIEF_SCALE_DEFAULT);
  const k = key(url, rel);
  if (!cache.has(k)) {
    cache.set(k, processScene(scene, rel));
  }
}

export function getOrProcess(url: string, scene: THREE.Object3D, reliefScale: number | undefined, kind: 'moon' | 'planet'): ProcessedModel {
  const rel = reliefScale ?? (kind === 'moon' ? MOON_RELIEF_SCALE_DEFAULT : PLANET_RELIEF_SCALE_DEFAULT);
  const k = key(url, rel);
  let pm = cache.get(k);
  if (!pm) {
    pm = processScene(scene, rel);
    cache.set(k, pm);
  }
  return pm;
}

export function getProcessed(url: string, reliefScale: number | undefined, kind: 'moon' | 'planet'): ProcessedModel | undefined {
  const rel = reliefScale ?? (kind === 'moon' ? MOON_RELIEF_SCALE_DEFAULT : PLANET_RELIEF_SCALE_DEFAULT);
  return cache.get(key(url, rel));
}