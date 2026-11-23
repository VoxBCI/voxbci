import { Asset } from 'expo-asset';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

import { useThemeScheme } from '@/hooks/use-theme';

// Bundled as a static asset (see metro.config.js) and fetched by OBJLoader at runtime.
const MODEL = require('../../assets/models/bci-headset.obj');

type HeadsetViewerProps = {
  /** Fixed height of the viewer area in points. Ignored when `fill` is true. */
  height?: number;
  /** Expand to fill the parent container instead of using a fixed height. */
  fill?: boolean;
};

/** Locked three-quarter view of the headset, framed slightly wider than the default. */
const LOCKED_CAMERA_POSITION = new THREE.Vector3(3.82, -2.376, 0.122);
const LOCKED_TARGET = new THREE.Vector3(0, 0, 0);
const LOCKED_DISTANCE = LOCKED_CAMERA_POSITION.length();
const LOCKED_DIRECTION = LOCKED_CAMERA_POSITION.clone().normalize();

/** The card opens with a slow dolly-in, like a product hero shot. */
const ZOOM_DURATION_MS = 1000;
const ZOOM_START_SCALE = 1.8;

let modelPromise: Promise<THREE.Group> | null = null;

/**
 * Loads and normalizes the headset once. The card mounts the viewer every time
 * it opens, so caching the parsed mesh keeps the entrance animation immediate
 * and avoids re-downloading the 13 MB OBJ.
 */
function loadHeadsetModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      const asset = Asset.fromModule(MODEL);
      await asset.downloadAsync();
      const uri = asset.localUri ?? asset.uri;
      const object = await new OBJLoader().loadAsync(uri);

      // Centre the model at the origin and scale its largest dimension to 1.9.
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      object.position.sub(center);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      object.scale.setScalar(1.9 / maxDim);

      // The OBJ has no MTL; each mount assigns the theme-aware material.
      object.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).geometry?.computeVertexNormals();
        }
      });

      return object;
    })().catch((error) => {
      // Drop a failed load so the next open can retry.
      modelPromise = null;
      throw error;
    });
  }

  return modelPromise;
}

/** Starts loading the model ahead of the card opening. Safe to call repeatedly. */
export function preloadHeadsetViewer() {
  void loadHeadsetModel();
}

/**
 * 3D view of the headset at a fixed camera pose. Orbit controls are removed;
 * opening the card plays a one-shot dolly-in from a wider framing.
 */
export function HeadsetViewer({ height = 160, fill = false }: HeadsetViewerProps) {
  const scheme = useThemeScheme();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let frame = 0;
    let renderer: THREE.WebGLRenderer | null = null;
    let resizeObserver: ResizeObserver | null = null;
    const cleanups: Array<() => void> = [];

    const container = containerRef.current;
    if (!container || typeof window === 'undefined') return;

    const init = async () => {
      const template = await loadHeadsetModel();
      if (cancelled || !containerRef.current) return;

      const object = template.clone(true);

      const getSize = () => {
        const w = container.clientWidth || 280;
        const h = container.clientHeight || height || 160;
        return { w, h: h || 160 };
      };

      const { w: width, h: viewHeight } = getSize();
      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(32, width / viewHeight, 0.1, 200);
      camera.position.copy(LOCKED_DIRECTION).multiplyScalar(LOCKED_DISTANCE * ZOOM_START_SCALE);
      camera.lookAt(LOCKED_TARGET);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, viewHeight);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.touchAction = 'none';
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      const envTexture = pmrem.fromScene(room, 0.04).texture;
      scene.environment = envTexture;
      scene.environmentIntensity = scheme === 'dark' ? 0.9 : 1.1;
      room.dispose();
      pmrem.dispose();
      cleanups.push(() => envTexture.dispose());

      const ambient = new THREE.AmbientLight(0xffffff, scheme === 'dark' ? 0.55 : 0.75);
      scene.add(ambient);
      const key = new THREE.DirectionalLight(0xffffff, scheme === 'dark' ? 1.2 : 1.0);
      key.position.set(5, 7, 6);
      scene.add(key);
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
      fillLight.position.set(-5, 2, -4);
      scene.add(fillLight);

      // The OBJ ships without MTL textures; use a neutral material that reads
      // clearly on both the light and dark card surfaces.
      const material = new THREE.MeshStandardMaterial({
        color: scheme === 'dark' ? 0xa8b7c8 : 0x334155,
        metalness: 0.25,
        roughness: 0.45,
      });
      cleanups.push(() => material.dispose());

      object.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).material = material;
        }
      });

      scene.add(object);

      const round = (value: number) => Math.round(value * 1000) / 1000;
      console.log('[HeadsetViewer] locked', {
        cameraPosition: [
          round(LOCKED_CAMERA_POSITION.x),
          round(LOCKED_CAMERA_POSITION.y),
          round(LOCKED_CAMERA_POSITION.z),
        ],
        target: [round(LOCKED_TARGET.x), round(LOCKED_TARGET.y), round(LOCKED_TARGET.z)],
        distance: round(LOCKED_DISTANCE),
      });

      const render = () => {
        if (!renderer) return;
        renderer.render(scene, camera);
      };

      const onResize = () => {
        if (!renderer || !containerRef.current) return;
        const { w, h } = getSize();
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        render();
      };

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(onResize);
        resizeObserver.observe(container);
        cleanups.push(() => resizeObserver?.disconnect());
      } else {
        window.addEventListener('resize', onResize);
        cleanups.push(() => window.removeEventListener('resize', onResize));
      }

      const reduceMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reduceMotion) {
        camera.position.copy(LOCKED_CAMERA_POSITION);
        camera.lookAt(LOCKED_TARGET);
        render();
        return;
      }

      const startTime = performance.now();
      const startDistance = LOCKED_DISTANCE * ZOOM_START_SCALE;

      const zoomIn = (now: number) => {
        if (cancelled || !renderer) return;
        const progress = Math.min(1, (now - startTime) / ZOOM_DURATION_MS);
        // Ease-out cubic: quick approach that settles gently on the final pose.
        const eased = 1 - Math.pow(1 - progress, 3);
        const distance = startDistance + (LOCKED_DISTANCE - startDistance) * eased;
        camera.position.copy(LOCKED_DIRECTION).multiplyScalar(distance);
        camera.lookAt(LOCKED_TARGET);
        render();
        if (progress < 1) {
          frame = requestAnimationFrame(zoomIn);
        }
      };

      frame = requestAnimationFrame(zoomIn);
    };

    void init().catch((error) => {
      console.error('[HeadsetViewer] failed to load model', error);
    });

    return () => {
      cancelled = true;
      if (frame) cancelAnimationFrame(frame);
      cleanups.splice(0).forEach((fn) => {
        try {
          fn();
        } catch {
          // ignore disposal errors during teardown
        }
      });
      if (renderer) {
        try {
          renderer.dispose();
          renderer.forceContextLoss();
        } catch {
          // ignore
        }
        const canvas = renderer.domElement;
        if (canvas?.parentNode) canvas.parentNode.removeChild(canvas);
      }
      if (container) container.innerHTML = '';
    };
  }, [fill, height, scheme]);

  return (
    <View
      ref={containerRef as any}
      style={[fill ? styles.fillContainer : [styles.container, { height }]]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  fillContainer: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
});
