import { Asset } from 'expo-asset';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
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

/**
 * Interactive 3D view of the headset model. Drag to orbit; zoom and pan are
 * disabled so the view stays framed in the card.
 */
export function HeadsetViewer({ height = 160, fill = false }: HeadsetViewerProps) {
  const scheme = useThemeScheme();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let frame = 0;
    let renderer: THREE.WebGLRenderer | null = null;
    let controls: OrbitControls | null = null;
    let resizeObserver: ResizeObserver | null = null;
    const cleanups: Array<() => void> = [];

    const container = containerRef.current;
    if (!container || typeof window === 'undefined') return;

    const init = async () => {
      const asset = Asset.fromModule(MODEL);
      await asset.downloadAsync();
      const uri = asset.localUri ?? asset.uri;

      const loader = new OBJLoader();
      const object = await loader.loadAsync(uri);
      if (cancelled || !containerRef.current) return;

      const getSize = () => {
        const w = container.clientWidth || 280;
        const h = container.clientHeight || height || 160;
        return { w, h: h || 160 };
      };

      const { w: width, h: viewHeight } = getSize();
      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(32, width / viewHeight, 0.1, 200);
      camera.position.set(2.2, 1.1, 3.1);

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
      const fill = new THREE.DirectionalLight(0xffffff, 0.35);
      fill.position.set(-5, 2, -4);
      scene.add(fill);

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
          const mesh = child as THREE.Mesh;
          mesh.material = material;
          if (mesh.geometry) {
            mesh.geometry.computeVertexNormals();
            cleanups.push(() => mesh.geometry.dispose());
          }
        }
      });

      // Centre the model at the origin and fit it to the view.
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      object.position.sub(center);

      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 1.9 / maxDim;
      object.scale.setScalar(scale);
      scene.add(object);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.target.set(0, 0, 0);
      controls.update();

      const logOrbitState = (event: string) => {
        if (!controls) return;
        const round = (value: number) => Math.round(value * 1000) / 1000;
        console.log(`[HeadsetViewer] ${event}`, {
          cameraPosition: [
            round(camera.position.x),
            round(camera.position.y),
            round(camera.position.z),
          ],
          target: [
            round(controls.target.x),
            round(controls.target.y),
            round(controls.target.z),
          ],
          azimuthal: round(controls.getAzimuthalAngle()),
          polar: round(controls.getPolarAngle()),
          distance: round(controls.getDistance()),
        });
      };

      logOrbitState('init');
      controls.addEventListener('change', () => logOrbitState('change'));
      controls.addEventListener('end', () => logOrbitState('end'));

      cleanups.push(() => controls?.dispose());

      const onResize = () => {
        if (!renderer || !containerRef.current) return;
        const { w, h } = getSize();
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(onResize);
        resizeObserver.observe(container);
        cleanups.push(() => resizeObserver?.disconnect());
      } else {
        window.addEventListener('resize', onResize);
        cleanups.push(() => window.removeEventListener('resize', onResize));
      }

      const tick = () => {
        if (cancelled) return;
        controls?.update();
        renderer?.render(scene, camera);
        frame = requestAnimationFrame(tick);
      };
      tick();
    };

    void init();

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
