import * as THREE from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { type gsap, reduce } from "@/motion/gsap";
import { mark } from "@/motion/probe";

// B5: the tennis player in the hero, from `pnpm assets:character` (A8). It loads only when that
// file exists (next.config.ts sets NEXT_PUBLIC_HERO_CHARACTER), so the site is unchanged without it.
//   - idle: loops while the hero is on screen
//   - swing: once per colour change, on the colour-change timeline (B3)
//   - head: turns toward the cursor, layered on top of the animation
//   - reduced motion (B7): holds the idle's first pose, no swing, no head turn
// Placement is provisional until the latest shared prototype (OD-1) shows where the player stands.

export const HERO_CHARACTER_URL = process.env.NEXT_PUBLIC_HERO_CHARACTER ?? "";

/**
 * Where the player stands, as fractions of the hero: feet at (x, feet), `height` tall, `z` in front
 * of the tennis balls. Clear of the price and "Shop now". Hidden below the site's phone breakpoint
 * (760 px), where the hero has no room for him; both provisional until the latest prototype (OD-1).
 */
const PLACE = { x: 0.9, feet: 0.86, height: 0.48, z: 0.3, turn: -0.55 };
const MIN_HERO_WIDTH = 760;
/** Most the head turns toward the cursor (radians), and how fast it follows (per second). */
const LOOK = { yaw: 0.6, pitch: 0.3, rate: 6 };

export interface HeroCharacter {
  root: THREE.Object3D;
  /** pointer: -0.5…0.5 across the window; place converts hero pixels to world units. */
  update(
    dt: number,
    pointer: { x: number; y: number },
    hero: DOMRect,
    place: {
      toWorld(px: number, py: number): [number, number];
      pxToWorld(px: number): number;
    },
    popIn: number,
  ): void;
  /** Adds the swing to a colour-change timeline. */
  swing(timeline: gsap.core.Timeline): void;
  /** Current head turn (radians), for the motion probe. */
  look(): number;
  dispose(): void;
}

export async function loadHeroCharacter(url: string): Promise<HeroCharacter> {
  const gltf = await new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .loadAsync(url);
  const model = gltf.scene;
  const clip = (name: string) => {
    const c = gltf.animations.find((a) => a.name === name);
    if (!c) throw new Error(`Hero character has no "${name}" clip`);
    return c;
  };

  const mixer = new THREE.AnimationMixer(model);
  const idle = mixer.clipAction(clip("idle")).play();
  const swingAction = mixer.clipAction(clip("swing"));
  swingAction.setLoop(THREE.LoopOnce, 1);
  mixer.addEventListener("finished", (e) => {
    if (e.action !== swingAction) return;
    idle.reset().fadeIn(0.2).play();
    swingAction.fadeOut(0.2);
    mark("character-swing-end");
  });
  mixer.update(0);

  // Normalise: 1 unit tall, feet at the origin. Measured on the posed, skinned vertices: Mixamo
  // files are in centimetres under a scaled rig, so the raw mesh bounds are no guide.
  model.updateMatrixWorld(true);
  model.traverse((o) => (o as THREE.SkinnedMesh).skeleton?.update());
  const box = new THREE.Box3().setFromObject(model, true);
  const size = box.getSize(new THREE.Vector3());
  const k = 1 / size.y;
  model.scale.setScalar(k);
  model.position.set(
    -((box.min.x + box.max.x) / 2) * k,
    -box.min.y * k,
    -((box.min.z + box.max.z) / 2) * k,
  );
  const root = new THREE.Group();
  root.add(model);
  root.rotation.y = PLACE.turn;
  mark("character-loaded");

  // Mixamo's "mixamorig:Head" becomes "mixamorigHead" in three.js.
  let head: THREE.Bone | undefined;
  model.traverse((o) => {
    if ((o as THREE.Bone).isBone && /head$/i.test(o.name) && !head)
      head = o as THREE.Bone;
  });
  // The head's rest pose: restored before each update, so the turn never piles up on a clip that
  // doesn't animate the head.
  const headRest = head?.quaternion.clone();
  let yaw = 0;
  let pitch = 0;
  const look = new THREE.Quaternion();
  const euler = new THREE.Euler();

  return {
    root,
    update(dt, pointer, hero, place, popIn) {
      root.visible = hero.bottom > 0 && hero.width >= MIN_HERO_WIDTH;
      if (!root.visible) return;
      const height = place.pxToWorld(hero.height * PLACE.height) * popIn;
      const [wx, wy] = place.toWorld(
        hero.left + hero.width * PLACE.x,
        hero.top + hero.height * PLACE.feet,
      );
      root.position.set(wx, wy, PLACE.z);
      root.scale.setScalar(Math.max(0.0001, height));
      if (reduce) return;
      if (head && headRest) head.quaternion.copy(headRest);
      mixer.update(dt);
      if (head) {
        const follow = 1 - Math.exp(-LOOK.rate * dt);
        yaw += (pointer.x * 2 * LOOK.yaw - yaw) * follow;
        pitch += (pointer.y * 2 * LOOK.pitch - pitch) * follow;
        head.quaternion.multiply(look.setFromEuler(euler.set(pitch, yaw, 0)));
      }
    },
    swing(timeline) {
      if (reduce) return;
      timeline.call(
        () => {
          idle.fadeOut(0.15);
          swingAction.reset().fadeIn(0.15).play();
          mark("character-swing-start");
        },
        undefined,
        0,
      );
    },
    look: () => yaw,
    dispose() {
      mixer.stopAllAction();
      model.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        const mats = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];
        mats.forEach((m) => m.dispose());
      });
    },
  };
}
