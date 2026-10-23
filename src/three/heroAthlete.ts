import * as THREE from "three";
import { type gsap, reduce } from "@/motion/gsap";
import { mark } from "@/motion/probe";
import { SCENE } from "@/styles/theme";
import type { HeroCharacter } from "./heroCharacter";

// B5: the hero athlete, the AI still (licenses/hero-athlete-ai.md) as a 3D surface. The photo is
// displaced by a depth map inflated from its silhouette (`pnpm assets:athlete`), so as he turns his
// torso and limbs shift against the outline the way a body would, rather than a flat card's.
//   - running: a stride bounce and a small lean sway, over a soft ground shadow
//   - cursor: he turns and tilts toward it, and the light moves across him
//   - colour change: a sprint burst forward and back, on the colour-change timeline (B3)
//   - reduced motion (B7): stands still, facing the viewer
// He stands where the plain image does without WebGL (.hero-athlete in prototype.css), which the
// stage hides once he's loaded.

const IMAGE = "/hero/athlete.webp";
const DEPTH = "/hero/athlete-depth.webp";
/** As .hero-athlete: right edge, feet and height as fractions of the hero. */
const PLACE = { right: 0.03, bottom: 0.14, height: 0.62 };
/** Behind the shoe and balls (z 0); the body bulges toward the camera by this fraction of his height. */
const Z = -0.6;
const BULGE = 0.05;
/** Most he turns toward the cursor (radians), and how fast he follows (per second). */
const LOOK = { yaw: 0.35, pitch: 0.1, rate: 10 };
/** Strides per second, the bounce (fraction of his height) and the lean sway (radians). */
const RUN = { hz: 1.4, bounce: 0.012, lean: 0.025 };
/** The burst: how far forward (fraction of the hero's width) and for how long (s). */
const BURST = { distance: 0.06, out: 0.35, back: 0.55 };
/** Where the plain image is hidden too: phones, and portrait tablets where the shoe would cross him. */
const HIDDEN =
  "(max-width: 760px), (max-width: 1023px) and (orientation: portrait)";

const vertexShader = /* glsl */ `
  uniform sampler2D depthMap;
  uniform float bulge;
  uniform vec2 size;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    float d = texture2D(depthMap, uv).r;
    // The surface's slope, from the depth map, for the light.
    const float e = 1.0 / 256.0;
    float du = texture2D(depthMap, uv + vec2(e, 0.0)).r - texture2D(depthMap, uv - vec2(e, 0.0)).r;
    float dv = texture2D(depthMap, uv + vec2(0.0, e)).r - texture2D(depthMap, uv - vec2(0.0, e)).r;
    vec3 n = vec3(-du * bulge / (2.0 * e * size.x), -dv * bulge / (2.0 * e * size.y), 1.0);
    vNormal = normalize(normalMatrix * n);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + vec3(0.0, 0.0, d * bulge), 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D map;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vec4 c = texture2D(map, vUv);
    if (c.a < 0.02) discard;
    // The photo is already lit: a key light from the upper left only deepens or lifts it a little,
    // so the shading follows him as he turns.
    float key = dot(normalize(vNormal), normalize(vec3(-0.45, 0.55, 0.7)));
    gl_FragColor = vec4(c.rgb * (0.9 + 0.22 * key), c.a);
    #include <colorspace_fragment>
  }
`;

function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  // The same gradient as the shoe's contact shadow.
  r.addColorStop(0, SCENE.shadowStops[0]);
  r.addColorStop(0.5, SCENE.shadowStops[1]);
  r.addColorStop(1, SCENE.shadowStops[2]);
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export async function loadHeroAthlete(): Promise<HeroCharacter> {
  const loader = new THREE.TextureLoader();
  const [map, depthMap] = await Promise.all([
    loader.loadAsync(IMAGE),
    loader.loadAsync(DEPTH),
  ]);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  const aspect = map.image.width / map.image.height;

  // root: the feet, bottom centre, scaled to his height → pivot: turns and bounces about his middle.
  const geometry = new THREE.PlaneGeometry(aspect, 1, 96, 150);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: map },
      depthMap: { value: depthMap },
      bulge: { value: BULGE },
      size: { value: new THREE.Vector2(aspect, 1) },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
  });
  const body = new THREE.Mesh(geometry, material);
  const pivot = new THREE.Group();
  pivot.position.y = 0.5;
  pivot.add(body);
  const shadowMap = shadowTexture();
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: shadowMap,
      transparent: true,
      depthWrite: false,
      opacity: 0.75,
    }),
  );
  shadow.position.set(aspect * 0.08, 0.01, -0.01);
  const root = new THREE.Group();
  root.add(shadow, pivot);
  mark("character-loaded");

  const hiddenQuery = matchMedia(HIDDEN);
  const burst = { v: 0 };
  let time = 0;
  let yaw = 0;
  let pitch = 0;

  return {
    root,
    update(dt, pointer, hero, place, popIn) {
      root.visible = hero.bottom > 0 && !hiddenQuery.matches;
      if (!root.visible) return;
      // Sized and placed in hero pixels, then scaled for his depth behind the z = 0 plane.
      const k = place.camZ ? (place.camZ - Z) / place.camZ : 1;
      const heightPx = hero.height * PLACE.height;
      const x =
        hero.right -
        hero.width * PLACE.right -
        (heightPx * aspect) / 2 -
        burst.v * BURST.distance * hero.width;
      const [wx, wy] = place.toWorld(
        x,
        hero.bottom - hero.height * PLACE.bottom,
      );
      root.position.set(wx * k, wy * k, Z);
      root.scale.setScalar(
        Math.max(0.0001, place.pxToWorld(heightPx) * k * popIn),
      );
      if (reduce) return;

      time += dt;
      const follow = 1 - Math.exp(-LOOK.rate * dt);
      yaw += (pointer.x * 2 * LOOK.yaw - yaw) * follow;
      pitch += (pointer.y * 2 * LOOK.pitch - pitch) * follow;
      // Two bounces per stride: up off each foot, down on landing.
      const stride = time * RUN.hz * Math.PI;
      const lift = Math.abs(Math.sin(stride));
      pivot.position.y = 0.5 + lift * RUN.bounce;
      pivot.rotation.set(
        pitch,
        yaw,
        Math.sin(stride) * RUN.lean + burst.v * 0.06,
      );
      shadow.scale.set(aspect * 0.9 * (1 - lift * 0.12), 0.07, 1);
      (shadow.material as THREE.MeshBasicMaterial).opacity = 0.75 - lift * 0.2;
    },
    swing(timeline: gsap.core.Timeline) {
      if (reduce) return;
      timeline
        .call(() => mark("character-swing-start"), undefined, 0)
        .to(burst, { v: 1, duration: BURST.out, ease: "power3.out" }, 0)
        .to(
          burst,
          { v: 0, duration: BURST.back, ease: "power2.inOut" },
          BURST.out,
        )
        .call(
          () => mark("character-swing-end"),
          undefined,
          BURST.out + BURST.back,
        );
    },
    look: () => yaw,
    dispose() {
      geometry.dispose();
      material.dispose();
      map.dispose();
      depthMap.dispose();
      shadowMap.dispose();
      shadow.geometry.dispose();
      (shadow.material as THREE.Material).dispose();
    },
  };
}
