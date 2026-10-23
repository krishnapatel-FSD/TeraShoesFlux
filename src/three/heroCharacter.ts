import * as THREE from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { type gsap, reduce } from "@/motion/gsap";
import { mark } from "@/motion/probe";

// B5: the runner in the hero, from `pnpm assets:character` (A8). It loads only when that file exists
// (next.config.ts sets NEXT_PUBLIC_HERO_CHARACTER), so the site is unchanged without it.
//   - posture: he stands in a relaxed idle at rest and blends into a jog while the page scrolls,
//     faster the faster it scrolls
//   - scroll: he turns through 180° as the hero scrolls away, front three-quarter to back
//   - cursor: his body turns a little toward it and his head follows it
//   - colour change: a short sprint, on the colour-change timeline (B3), as his kit changes to the
//     colourway: shirt in its stripe colour, shoes in its knit with stripe-coloured accents
//   - reduced motion (B7): holds the idle's first pose, facing the viewer; none of the above

export const HERO_CHARACTER_URL = process.env.NEXT_PUBLIC_HERO_CHARACTER ?? "";

/**
 * Where he stands, as fractions of the hero: feet at (x, feet), `height` tall, `z` in front of the
 * tennis balls, turned `turn` toward the shoe. Clear of the price and "Shop now". Hidden below the
 * site's phone breakpoint (760 px), where the hero has no room for him.
 */
const PLACE = { x: 0.87, feet: 0.87, height: 0.56, z: 0.3, turn: -0.6 };
const MIN_HERO_WIDTH = 760;
/**
 * Scroll, as a fraction of the hero's height scrolled: he turns 180° over the first `turn`, then
 * shrinks away between `leave` and `gone`, before he would reach the header. `rate`: how fast he
 * follows (per second).
 */
const SCROLL = { turn: 0.3, leave: 0.24, gone: 0.42, rate: 6 };
/** Most his body and head turn toward the cursor (radians), and how fast they follow (per second). */
const BODY = { yaw: 0.3, rate: 4 };
const LOOK = { yaw: 0.6, pitch: 0.3, rate: 6 };
/** Scroll speed (Lenis velocity) for a full jog, and how fast he eases into and out of it. */
const JOG = { speed: 14, rateIn: 4, rateOut: 1.5 };

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
      /** The page's scroll velocity (Lenis), for the jog. */
      scroll?: number;
    },
    popIn: number,
  ): void;
  /**
   * Dresses him in a colourway's kit: at once, or blended on a colour-change timeline. Colours are
   * CSS hex strings.
   */
  dress(
    kit: { shirt: string; shoe: string; accent: string },
    timeline?: gsap.core.Timeline,
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

  // Solid rendering: no transparency sorting, cut-out hair, brows and lashes.
  model.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((m) => {
      m.transparent = false;
      m.depthWrite = true;
      if (/hair|eyebrow|eyelash/i.test(m.name)) m.alphaTest = 0.5;
    });
  });

  const clip = (name: string) => {
    const c = gltf.animations.find((a) => a.name === name);
    if (!c) throw new Error(`Hero character has no "${name}" clip`);
    return c;
  };
  const mixer = new THREE.AnimationMixer(model);
  const idle = mixer.clipAction(clip("idle")).play();
  // The jog runs underneath the idle at no weight until the page scrolls (older files have none).
  const runClip = gltf.animations.find((a) => a.name === "run");
  const run = runClip
    ? mixer.clipAction(runClip).setEffectiveWeight(0).play()
    : null;
  const swingAction = mixer.clipAction(clip("swing"));
  // A sprint clip is a single stride: two of them make the burst.
  swingAction.setLoop(THREE.LoopRepeat, 2);
  swingAction.clampWhenFinished = true;
  let swinging = false;
  mixer.addEventListener("finished", (e) => {
    if (e.action !== swingAction) return;
    swinging = false;
    swingAction.fadeOut(0.25);
    mark("character-swing-end");
  });
  mixer.update(0);

  // Normalise: 1 unit tall, feet at the origin. Measured on the posed, skinned vertices, so the
  // file's units and rig scale don't matter.
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

  // The kit: the shirt's grey texture is tinted by its colour; the shoes' shader tints the dark knit
  // upper (keeping its weave) and the accents marked in the texture's alpha by `pnpm assets:character`.
  const materials: THREE.MeshStandardMaterial[] = [];
  model.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial;
    if ((o as THREE.Mesh).isMesh && !materials.includes(m)) materials.push(m);
  });
  const shirt = materials.find((m) => /polo/i.test(m.name));
  const shoes = materials.find((m) => /running_shoes/i.test(m.name));
  const knit = new THREE.Color();
  const accent = new THREE.Color();
  if (shoes)
    shoes.onBeforeCompile = (shader) => {
      shader.uniforms.uKnit = { value: knit };
      shader.uniforms.uAccent = { value: accent };
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
          uniform vec3 uKnit;
          uniform vec3 uAccent;`,
        )
        .replace(
          "#include <map_fragment>",
          `#ifdef USE_MAP
            vec4 texel = texture2D( map, vMapUv );
            float accent = 1.0 - smoothstep( 0.6, 0.9, texel.a );
            float lum = dot( texel.rgb, vec3( 0.2126, 0.7152, 0.0722 ) );
            float upper = ( 1.0 - smoothstep( 0.04, 0.2, lum ) ) * ( 1.0 - accent );
            vec3 kit = mix( texel.rgb, uKnit * ( 0.55 + lum * 6.0 ), upper );
            diffuseColor.rgb *= mix( kit, uAccent * ( 0.5 + lum ), accent );
          #endif`,
        );
    };
  const target = new THREE.Color();

  // Head tracking: "head" in MakeHuman's rig, "mixamorigHead" in Mixamo's.
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
  let bodyYaw = 0;
  let turn = PLACE.turn;
  let jog = 0;
  const look = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const ease = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);

  return {
    root,
    update(dt, pointer, hero, place, popIn) {
      const scrolledPx = Math.max(0, -hero.top) / hero.height;
      const leaving = Math.min(
        1,
        Math.max(0, (scrolledPx - SCROLL.leave) / (SCROLL.gone - SCROLL.leave)),
      );
      root.visible =
        hero.bottom > 0 && hero.width >= MIN_HERO_WIDTH && leaving < 0.97;
      if (!root.visible) return;
      const height =
        place.pxToWorld(hero.height * PLACE.height) *
        popIn *
        (1 - leaving * leaving * (3 - 2 * leaving));
      const [wx, wy] = place.toWorld(
        hero.left + hero.width * PLACE.x,
        hero.top + hero.height * PLACE.feet,
      );
      root.position.set(wx, wy, PLACE.z);
      root.scale.setScalar(Math.max(0.0001, height));
      if (reduce) return;

      // Posture: idle at rest, a jog while scrolling, the sprint over both while it plays.
      const target = Math.min(1, Math.abs(place.scroll ?? 0) / JOG.speed);
      jog += (target - jog) * ease(target > jog ? JOG.rateIn : JOG.rateOut, dt);
      const free = swinging ? 1 - swingAction.getEffectiveWeight() : 1;
      if (run) {
        run.setEffectiveWeight(jog * free);
        run.timeScale = 0.7 + jog * 0.5;
      }
      idle.setEffectiveWeight((1 - (run ? jog : 0)) * free);

      // The turn: 180° as the hero scrolls away, plus a little toward the cursor.
      const scrolled = Math.min(1, scrolledPx / SCROLL.turn);
      bodyYaw += (pointer.x * 2 * BODY.yaw - bodyYaw) * ease(BODY.rate, dt);
      turn +=
        (PLACE.turn + scrolled * Math.PI + bodyYaw - turn) *
        ease(SCROLL.rate, dt);
      root.rotation.y = turn;

      if (head && headRest) head.quaternion.copy(headRest);
      mixer.update(dt);
      if (head) {
        const follow = ease(LOOK.rate, dt);
        yaw += (pointer.x * 2 * LOOK.yaw - yaw) * follow;
        pitch += (pointer.y * 2 * LOOK.pitch - pitch) * follow;
        // Facing away, he no longer looks round at the cursor.
        const facing = Math.max(0, Math.cos(scrolled * Math.PI));
        head.quaternion.multiply(
          look.setFromEuler(euler.set(pitch * facing, yaw * facing, 0)),
        );
      }
    },
    swing(timeline) {
      if (reduce) return;
      timeline.call(
        () => {
          swinging = true;
          swingAction.reset().fadeIn(0.2).play();
          mark("character-swing-start");
        },
        undefined,
        0,
      );
    },
    dress(kit, timeline) {
      const parts: [THREE.Color | undefined, string][] = [
        [shirt?.color, kit.shirt],
        [knit, kit.shoe],
        [accent, kit.accent],
      ];
      for (const [colour, hex] of parts) {
        if (!colour) continue;
        target.set(hex);
        if (timeline)
          timeline.to(
            colour,
            {
              r: target.r,
              g: target.g,
              b: target.b,
              duration: 0.5,
              ease: "power2.inOut",
            },
            0.3,
          );
        else colour.copy(target);
      }
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
