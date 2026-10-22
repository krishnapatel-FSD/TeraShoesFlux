import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { SCENE } from "@/styles/theme";

// Shared by the live 3D stage and the product-photo renderer (A9), so photos match the site:
// where the shoe model lives, how a colourway's material is built, and the studio lighting.

/** The Flux 01 model and its colourway textures (see licenses/ and `pnpm assets:model`). */
export const SHOE_ASSET_BASE = "/3d/flux01/";
export const SHOE_MODEL_URL = SHOE_ASSET_BASE + "shoe.gltf";

/** A colourway material: the model's base material with the colourway's colour texture. */
export function textureMaterialFrom(
  base: THREE.MeshStandardMaterial,
  img: HTMLImageElement,
  renderer: THREE.WebGLRenderer,
): THREE.MeshStandardMaterial {
  const b = base.map!;
  const t = new THREE.Texture(img);
  t.flipY = b.flipY;
  t.colorSpace = b.colorSpace;
  t.wrapS = b.wrapS;
  t.wrapT = b.wrapT;
  t.magFilter = b.magFilter;
  t.minFilter = b.minFilter;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  t.channel = b.channel;
  t.needsUpdate = true;
  const m = base.clone();
  m.map = t;
  return m;
}

/** The material index for a KHR_materials_variants variant on the shoe mesh. */
export function variantMaterialIndex(
  mesh: THREE.Mesh,
  variant: number,
): number {
  type Mapping = { material: number; variants: number[] };
  const maps =
    (
      mesh.userData.gltfExtensions as
        { KHR_materials_variants?: { mappings: Mapping[] } } | undefined
    )?.KHR_materials_variants?.mappings ?? [];
  const byVariant: number[] = [];
  maps.forEach((m) => m.variants.forEach((v) => (byVariant[v] = m.material)));
  return byVariant[variant] ?? variant;
}

/** The studio environment map (procedural, no HDR download). */
export function createStudioEnvironment(renderer: THREE.WebGLRenderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  return {
    texture,
    dispose() {
      texture.dispose();
      pmrem.dispose();
    },
  };
}

/**
 * The prototype's studio light rig, in one place so the site, the product photos and the A6
 * reference render (`pnpm assets:lighting`) all use the same numbers. Directional lights shine
 * from `position` toward the origin.
 */
export const STUDIO_LIGHTS = {
  key: { position: [3, 5, 5], intensity: 2.4 },
  fill: { position: [-5, 1, 4], intensity: 0.9 },
  /** Tinted with the colourway's highlight colour. */
  rim: { position: [-4, 3, -5], intensity: 2.4 },
  hemi: { intensity: 0.6 },
  /** Strength of the studio environment's reflections on the shoe. */
  envMapIntensity: 1.1,
  /** ACES filmic tone mapping exposure. */
  exposure: 1.05,
} as const;

/** Key, fill and a rim light tinted with the colourway highlight, plus a soft hemisphere light. */
export function createStudioLights(rimColour: string) {
  const { key: k, fill: f, rim: r, hemi: h } = STUDIO_LIGHTS;
  const key = new THREE.DirectionalLight(SCENE.keyLight, k.intensity);
  key.position.set(...k.position);
  const fill = new THREE.DirectionalLight(SCENE.fillLight, f.intensity);
  fill.position.set(...f.position);
  const rim = new THREE.DirectionalLight(
    new THREE.Color(rimColour),
    r.intensity,
  );
  rim.position.set(...r.position);
  const hemi = new THREE.HemisphereLight(
    SCENE.hemiSky,
    SCENE.hemiGround,
    h.intensity,
  );
  return { lights: [key, fill, rim, hemi] as THREE.Light[], rim };
}
