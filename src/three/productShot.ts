import * as THREE from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Product } from "@/data/catalogue";
import {
  createStudioEnvironment,
  createStudioLights,
  SHOE_ASSET_BASE,
  SHOE_MODEL_URL,
  STUDIO_LIGHTS,
  textureMaterialFrom,
  variantMaterialIndex,
} from "./shoeAssets";
import { studioEquirectRGBE } from "./studioEquirect";

// A9: renders product photos of each colourway from the 3D scene, with the site's studio lighting
// and materials. Used by the dev-only page /dev/product-shot, which `pnpm assets:images` drives.

export const SHOT_VIEWS = ["side", "front", "top", "sole"] as const;
export type ShotView = (typeof SHOT_VIEWS)[number];

/** Model rotation (x, y, z) per view. The model is normalised with its length along x, toe at +x. */
const VIEW_ROTATION: Record<ShotView, [number, number, number]> = {
  side: [0, 0, 0],
  front: [0, -Math.PI / 2, 0],
  top: [Math.PI / 2, 0, 0],
  sole: [-Math.PI / 2, 0, 0],
};

export async function createProductStudio(size = 2048) {
  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(1);
  renderer.setSize(size, size, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = STUDIO_LIGHTS.exposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearAlpha(0);

  const scene = new THREE.Scene();
  const studio = createStudioEnvironment(renderer);
  scene.environment = studio.texture;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  const gltf = await new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .loadAsync(SHOE_MODEL_URL);
  const model = gltf.scene;
  const box = new THREE.Box3().setFromObject(model);
  const k = 2 / box.getSize(new THREE.Vector3()).x;
  model.scale.setScalar(k);
  model.position.copy(box.getCenter(new THREE.Vector3())).multiplyScalar(-k);
  const pivot = new THREE.Group();
  pivot.add(model);
  scene.add(pivot);
  let mesh: THREE.Mesh | null = null;
  model.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) mesh = o as THREE.Mesh;
  });
  if (!mesh) throw new Error("No mesh in the shoe model");
  const shoe: THREE.Mesh = mesh;
  const base = shoe.material as THREE.MeshStandardMaterial;
  const imgLoader = new THREE.ImageLoader();

  const materials = new Map<string, THREE.Material>();

  async function materialFor(p: Product): Promise<THREE.Material> {
    const cached = materials.get(p.id);
    if (cached) return cached;
    let m: THREE.Material = base;
    if (p.gltf !== undefined) {
      m = (await gltf.parser.getDependency(
        "material",
        variantMaterialIndex(shoe, p.gltf),
      )) as THREE.Material;
    } else if (p.tex) {
      const img = await imgLoader.loadAsync(SHOE_ASSET_BASE + p.tex);
      m = textureMaterialFrom(base, img, renderer);
    }
    materials.set(p.id, m);
    return m;
  }

  /** One photo as a PNG data URL: the shoe fills about 80% of the frame, transparent background. */
  async function shoot(p: Product, view: ShotView): Promise<string> {
    const m = (await materialFor(p)) as THREE.MeshStandardMaterial;
    m.envMapIntensity = STUDIO_LIGHTS.envMapIntensity;
    shoe.material = m;
    gltf.parser.assignFinalMaterial(shoe);
    const { lights } = createStudioLights(p.hl);
    scene.add(...lights);
    pivot.rotation.set(...VIEW_ROTATION[view]);
    // Fit the rotated shoe: its larger side spans 80% of the frame.
    const box = new THREE.Box3().setFromObject(pivot);
    const size = box.getSize(new THREE.Vector3());
    pivot.position.copy(box.getCenter(new THREE.Vector3())).negate();
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const dist =
      Math.max(size.x, size.y) / 2 / 0.8 / Math.tan(halfFov) + size.z / 2;
    camera.position.set(0, 0, dist);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    const url = canvas.toDataURL("image/png");
    scene.remove(...lights);
    pivot.position.set(0, 0, 0);
    return url;
  }

  return {
    shoot,
    /** A6: the studio environment as Radiance RGBE bytes (see studioEquirect.ts). */
    studioHdr: (width?: number) => studioEquirectRGBE(renderer, width),
    dispose() {
      studio.dispose();
      renderer.dispose();
    },
  };
}
