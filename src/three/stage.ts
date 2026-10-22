import { flushSync } from "react-dom";
import * as THREE from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import {
  GLTFLoader,
  type GLTF,
  type GLTFParser,
} from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Product } from "@/data/catalogue";
import { activeCatalogue, productById } from "@/state/catalogue";
import { gsap, reduce } from "@/motion/gsap";
import { isLowPowerMode } from "@/motion/lowPower";
import { mark, probe, recordFrame, track } from "@/motion/probe";
import { getLenis } from "@/motion/SmoothScroll";
import { getState, setState } from "@/state/store";
import { SCENE } from "@/styles/theme";
import {
  createStudioEnvironment,
  createStudioLights,
  SHOE_ASSET_BASE,
  SHOE_MODEL_URL,
  STUDIO_LIGHTS,
  textureMaterialFrom,
  variantMaterialIndex,
} from "./shoeAssets";
import {
  HERO_CHARACTER_URL,
  loadHeroCharacter,
  type HeroCharacter,
} from "./heroCharacter";
import { createTennisBalls } from "./props/tennisBallKit";
import {
  dockPose,
  follow,
  MAX_SCREEN_SPEED,
  MAX_SPEED,
  POSE,
  SMOOTH_TIME,
  type Follow,
} from "./scrollDock";
import { S, setStageApi } from "./stageState";

// The prototype's 3D scene (`three()` in prototype/index.html), ported to run inside the shared
// React Three Fiber canvas. R3F owns the renderer, camera and render loop; this module builds the
// same scene graph and runs the prototype's per-frame logic from `update()`.

/**
 * Docking poses. `a` is a DOM anchor whose live rect positions the shoe; `f` is the shoe width as a
 * fraction of the anchor width; rx/ry/rz the rotation; `sh` shadow opacity; `v` visibility. The last
 * pose parks the shoe above the shop grid (fractions of the viewport).
 */
type Pose = {
  a?: string;
  f?: number;
  fx?: number;
  fy?: number;
  fw?: number;
  rx: number;
  ry: number;
  rz: number;
  sh: number;
  v: number;
};
const P: Pose[] = [
  // Hero
  { a: "#a-hero", f: 0.7, rx: 0.3, ry: 2.6, rz: -0.55, sh: 0, v: 1 },
  // Tour (B4, GB-3): upper, foam, outsole, heel. Moving between chapters is the camera move (a dolly
  // in or out and an orbit); each then holds still while its text is shown.
  { a: "#a-story", f: 0.95, rx: 0.06, ry: -0.05, rz: 0, sh: 1, v: 1 },
  { a: "#a-story", f: 1, rx: -0.12, ry: 0.35, rz: 0.04, sh: 1, v: 1 },
  { a: "#a-story", f: 0.85, rx: -1.3, ry: 0.2, rz: 0.2, sh: 0, v: 1 },
  { a: "#a-story", f: 0.85, rx: 0.25, ry: 2.5, rz: 0, sh: 1, v: 1 },
  // Product viewer
  { a: "#a-pdp", f: 0.78, rx: 0.26, ry: -0.6, rz: 0.04, sh: 1, v: 1 },
  // Above the shop (hidden)
  { fx: 0.5, fy: -0.35, fw: 0.3, rx: 0.9, ry: 1.6, rz: 0.3, sh: 0, v: 0 },
];

// Tennis balls: position as a fraction of the hero, diameter as a fraction of hero height, parallax depth
const BALLS = [
  { x: 0.13, y: 0.26, s: 0.17, d: 1.0 },
  { x: 0.87, y: 0.74, s: 0.17, d: 1.2 },
  { x: 0.88, y: 0.2, s: 0.1, d: 0.6 },
  { x: 0.12, y: 0.76, s: 0.12, d: 0.8 },
  { x: 0.64, y: 0.9, s: 0.07, d: 0.5 },
  { x: 0.36, y: 0.12, s: 0.06, d: 0.4 },
];

/** In low-power mode, balls smaller than this (fraction of hero height) are hidden. */
const LOW_POWER_MIN_BALL = 0.12;

const $ = <T extends Element = HTMLElement>(s: string) =>
  document.querySelector<T>(s);

export interface Stage {
  update(dt: number, time: number): void;
  dispose(): void;
}

export function createStage(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
): Stage {
  const cleanups: (() => void)[] = [];
  const listen = <K extends keyof WindowEventMap>(
    target: Window | HTMLElement,
    type: K,
    fn: (e: WindowEventMap[K]) => void,
    opts?: AddEventListenerOptions,
  ) => {
    target.addEventListener(type, fn as EventListener, opts);
    cleanups.push(() => target.removeEventListener(type, fn as EventListener));
  };

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = STUDIO_LIGHTS.exposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const stage = new THREE.Group();
  scene.add(stage);
  const studio = createStudioEnvironment(renderer);
  scene.environment = studio.texture;

  const current = () => getState().current;
  const { lights, rim } = createStudioLights(productById(current())!.hl);
  stage.add(...lights);

  const root = new THREE.Group();
  const tilt = new THREE.Group();
  root.add(tilt);
  stage.add(root);
  const sc = document.createElement("canvas");
  sc.width = sc.height = 128;
  const sx = sc.getContext("2d")!;
  const g = sx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, SCENE.shadowStops[0]);
  g.addColorStop(0.5, SCENE.shadowStops[1]);
  g.addColorStop(1, SCENE.shadowStops[2]);
  sx.fillStyle = g;
  sx.fillRect(0, 0, 128, 128);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(sc),
    transparent: true,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.7), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  root.add(shadow);

  /* ---- Tennis balls (A7: src/three/props), sharing one felt texture, geometry and materials ---- */
  const tennisBalls = createTennisBalls();
  const ballGroup = new THREE.Group();
  stage.add(ballGroup);
  const balls = BALLS.map((b, i) => {
    const m = tennisBalls.create();
    m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    ballGroup.add(m);
    return {
      ...b,
      m,
      spin: new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5,
      ).normalize(),
      sp: 0.25 + Math.random() * 0.35,
      ph: i * 1.7,
    };
  });

  let model: THREE.Group | null = null;
  let mesh: THREE.Mesh | null = null;
  let parser: GLTFParser | null = null;
  let loaded = false;
  let shown: string | null = null;
  let disposed = false;
  const mats: Record<string, THREE.Material> = {};
  let W = innerWidth;
  let H = innerHeight;
  listen(window, "resize", () => {
    W = innerWidth;
    H = innerHeight;
  });
  const halfH = () =>
    Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
  const toWorld = (px: number, py: number): [number, number] => {
    const h = halfH();
    const w = h * camera.aspect;
    return [((px / W) * 2 - 1) * w, -((py / H) * 2 - 1) * h];
  };
  const pxToWorld = (px: number) => (px / H) * 2 * halfH();

  /* ---- The hero's tennis player (B5), only when its file exists (A8) ---- */
  let character: HeroCharacter | null = null;
  if (HERO_CHARACTER_URL)
    loadHeroCharacter(HERO_CHARACTER_URL).then(
      (c) => {
        if (disposed) return c.dispose();
        character = c;
        stage.add(c.root);
      },
      (err: unknown) => console.warn("Hero character failed to load", err),
    );

  const manager = new THREE.LoadingManager();
  manager.onProgress = (_url, done, total) => {
    const p = done / total;
    const pct = $("#loader-pct");
    if (pct) pct.textContent = Math.round(p * 100) + "%";
    $("#loader-arc")?.setAttribute("stroke-dashoffset", String(94.2 * (1 - p)));
  };
  const imgLoader = new THREE.ImageLoader();
  const pending: Record<string, Promise<THREE.Material | null>> = {};
  function texMaterial(p: Product) {
    if (pending[p.id]) return pending[p.id]!;
    return (pending[p.id] = new Promise((res) => {
      const base = mats.base as THREE.MeshStandardMaterial | undefined;
      if (!base || !base.map) return res(null);
      imgLoader.load(
        SHOE_ASSET_BASE + p.tex,
        (img) => {
          const m = textureMaterialFrom(base, img, renderer);
          mats[p.id] = m;
          res(m);
        },
        undefined,
        () => res(null),
      );
    }));
  }
  async function ensure(id: string) {
    if (mats[id]) return mats[id];
    const p = productById(id)!;
    return p.tex ? texMaterial(p) : null;
  }
  function apply(id: string) {
    const m = mats[id];
    if (!m || !mesh) return false;
    mesh.material = m;
    parser?.assignFinalMaterial(mesh);
    shown = id;
    return true;
  }

  const loadFailed = (err: unknown) => {
    console.error("3D shoe failed to load", err);
    const span = $("#loader span");
    if (span) span.textContent = "3D shoe could not load";
    S.balls = 1;
  };
  new GLTFLoader(manager)
    .setMeshoptDecoder(MeshoptDecoder)
    .load(
      SHOE_MODEL_URL,
      (gltf) => void onShoe(gltf).catch(loadFailed),
      undefined,
      loadFailed,
    );

  /** The prototype's material settings for every colourway material. */
  function prepare(m: THREE.Material) {
    const sm = m as THREE.MeshStandardMaterial;
    sm.envMapIntensity = STUDIO_LIGHTS.envMapIntensity;
    if (sm.map) sm.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return m;
  }

  async function onShoe(gltf: GLTF) {
    if (disposed) return;
    mark("model-loaded");
    model = gltf.scene;
    parser = gltf.parser;
    const box = new THREE.Box3().setFromObject(model);
    const c = box.getCenter(new THREE.Vector3());
    const sz = box.getSize(new THREE.Vector3());
    const k = 2 / sz.x;
    model.scale.setScalar(k);
    model.position.copy(c).multiplyScalar(-k);
    shadow.position.y = (-sz.y * k) / 2 - 0.02;
    tilt.add(model);
    model.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) mesh = o as THREE.Mesh;
    });
    mats.base = prepare(mesh!.material as THREE.Material);
    // B2: only the colourway on screen is needed before the intro starts (the intro must finish
    // within 2.5 s of the model loading); the other glTF variants load while it plays.
    const variants = activeCatalogue().products.filter(
      (p) => p.gltf !== undefined,
    );
    const loadVariant = async (p: Product) => {
      try {
        mats[p.id] = prepare(
          (await parser!.getDependency(
            "material",
            variantMaterialIndex(mesh!, p.gltf!),
          )) as THREE.Material,
        );
      } catch {}
    };
    const first = variants.find((p) => p.id === current());
    if (first) await loadVariant(first);
    await ensure(current());
    if (disposed) return;
    if (!apply(current())) apply("base");
    loaded = true;
    mark("intro-start");
    track(
      "loader-out",
      gsap.to("#loader", {
        opacity: 0,
        scale: 0.8,
        duration: 0.5,
        onComplete: () => {
          const l = $("#loader");
          if (l) l.hidden = true;
        },
      }),
    );
    track(
      "intro-shoe",
      gsap.to(S, { intro: 1, duration: reduce ? 0 : 2.2, ease: "expo.out" }),
    );
    track(
      "intro-balls",
      gsap.to(S, {
        balls: 1,
        duration: reduce ? 0 : 1.8,
        ease: "elastic.out(1, .55)",
        delay: reduce ? 0 : 0.5,
      }),
    );
    for (const p of variants) if (p !== first) await loadVariant(p);
    for (const p of activeCatalogue().products) await ensure(p.id);
    if (disposed) return;
    if (mats[current()]) apply(current());
    makeThumbs();
  }

  const rectOf = (p: Pose) => {
    if (p.a) {
      const r = $(p.a)!.getBoundingClientRect();
      return {
        cx: r.left + r.width / 2,
        cy: r.top + r.height / 2,
        w: r.width * p.f!,
      };
    }
    return { cx: W * p.fx!, cy: H * p.fy!, w: W * p.fw! };
  };
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  let mx = 0;
  let my = 0;
  let tmx = 0;
  let tmy = 0;
  let vel = 0;
  listen(window, "pointermove", (e) => {
    tmx = e.clientX / innerWidth - 0.5;
    tmy = e.clientY / innerHeight - 0.5;
  });
  const offScroll = getLenis()?.on("scroll", (e: { velocity: number }) => {
    vel = e.velocity;
  });
  if (offScroll) cleanups.push(offScroll);

  /**
   * The fastest the docking pose may change (poses a second). On screen, the shoe never crosses
   * more than MAX_SCREEN_SPEED of the screen: the anchors it moves between may be close together or,
   * after a fling or a jump link, far apart. Off screen nobody sees it, so it may hurry to the edge
   * of the screen (and one normal step past it) instead of crawling between distant anchors.
   */
  function poseSpeedCap(a: number, dt: number) {
    const i = Math.max(0, Math.min(P.length - 2, Math.floor(a)));
    const t = Math.min(1, Math.max(0, a - i));
    const ra = rectOf(P[i]!);
    const rb = rectOf(P[i + 1]!);
    const px = Math.max(
      1,
      Math.hypot(rb.cx - ra.cx, rb.cy - ra.cy),
      Math.abs(rb.w - ra.w),
    );
    // How far the shoe (about w wide, w/2 tall) is outside the screen, in pixels.
    const cx = lerp(ra.cx, rb.cx, t);
    const cy = lerp(ra.cy, rb.cy, t);
    const w = lerp(ra.w, rb.w, t);
    const outside = Math.max(
      0,
      -(cx + w / 2),
      cx - w / 2 - W,
      -(cy + w / 4),
      cy - w / 4 - H,
    );
    const step = MAX_SCREEN_SPEED * H * Math.max(dt, 1e-3);
    const onScreenCap = Math.min(MAX_SPEED, (MAX_SCREEN_SPEED * H) / px);
    return outside > 0
      ? Math.max(onScreenCap, (outside + step) / px / Math.max(dt, 1e-3))
      : onScreenCap;
  }

  function place(a: number, extraRy: number) {
    const i = Math.max(0, Math.min(P.length - 2, Math.floor(a)));
    const t = Math.min(1, Math.max(0, a - i));
    const A0 = P[i]!;
    const B0 = P[i + 1]!;
    const ra = rectOf(A0);
    const rb = rectOf(B0);
    const [wx, wy] = toWorld(lerp(ra.cx, rb.cx, t), lerp(ra.cy, rb.cy, t));
    root.position.set(wx, wy, 0);
    const vis = lerp(A0.v, B0.v, t);
    const w = lerp(ra.w, rb.w, t);
    root.scale.setScalar(
      vis > 0.001
        ? Math.max(0.0001, (pxToWorld(w) / 2) * (0.35 + 0.65 * vis))
        : 0.0001,
    );
    tilt.rotation.set(
      lerp(A0.rx, B0.rx, t),
      lerp(A0.ry, B0.ry, t) + extraRy,
      lerp(A0.rz, B0.rz, t),
    );
    shadowMat.opacity = lerp(A0.sh, B0.sh, t) * vis;
  }
  function placeBalls(time: number, dt: number) {
    const r = $("#hero")!.getBoundingClientRect();
    ballGroup.visible = r.bottom > 0 && S.balls > 0.001;
    if (!ballGroup.visible) return;
    const scrollP = Math.min(1, Math.max(0, -r.top / r.height));
    const fewer = isLowPowerMode();
    balls.forEach((b) => {
      // Low-power mode (B7) keeps the three largest balls.
      b.m.visible = !fewer || b.s >= LOW_POWER_MIN_BALL;
      const px = r.left + b.x * r.width + mx * 70 * b.d;
      const py =
        r.top +
        b.y * r.height +
        my * 50 * b.d -
        scrollP * 260 * b.d +
        // The idle bob stops with reduced motion, like the spin below (B7).
        (reduce ? 0 : Math.sin(time * 1.1 + b.ph) * 10);
      const [wx, wy] = toWorld(px, py);
      b.m.position.set(wx, wy, 0);
      b.m.scale.setScalar((pxToWorld(b.s * r.height) / 2) * S.balls);
      if (!reduce) b.m.rotateOnAxis(b.spin, b.sp * dt + Math.abs(vel) * 0.002);
    });
  }

  /* Drag to rotate in the product viewer. */
  const viewer = $("#a-pdp")!;
  let dragging = false;
  let lastX = 0;
  listen(viewer, "pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX;
    viewer.setPointerCapture(e.pointerId);
    S.dragV = 0;
  });
  listen(viewer, "pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    S.drag += dx * 0.012;
    S.dragV = dx * 0.012;
  });
  const stop = () => {
    dragging = false;
  };
  listen(viewer, "pointerup", stop);
  listen(viewer, "pointercancel", stop);

  /* Scroll docking (B1): one controller, see scrollDock.ts. Hero → tour chapters → product viewer →
     above the shop. Reduced motion follows the scroll exactly, as the prototype's scrub did. */
  const sections = { tour: $("#tour")!, buy: $("#buy")!, shop: $("#shop")! };
  const dockTarget = () => {
    const tour = sections.tour.getBoundingClientRect();
    return dockPose({
      viewport: H,
      tour: { top: tour.top, height: tour.height },
      buy: { top: sections.buy.getBoundingClientRect().top },
      shop: { top: sections.shop.getBoundingClientRect().top },
    });
  };
  S.a = dockTarget();
  const dock: Follow = { value: S.a, velocity: 0 };

  const rimTarget = new THREE.Color(productById(current())!.hl);
  const probePoint = new THREE.Vector3();

  function update(dt: number, time: number) {
    mx += (tmx - mx) * 0.05;
    my += (tmy - my) * 0.05;
    if (!dragging) {
      S.drag += S.dragV;
      S.dragV *= 0.94;
    }
    if (Math.abs(S.a - POSE.viewer) > 0.6) S.drag *= 0.94;
    rim.color.lerp(rimTarget, 0.05);
    const target = dockTarget();
    // S.a may also be set directly (e.g. by the hero recorder), so follow from wherever it is.
    dock.value = S.a;
    S.a = reduce
      ? target
      : follow(dock, target, dt, SMOOTH_TIME, poseSpeedCap(S.a, dt));
    place(S.a, S.turn + S.drag);
    if (!reduce) {
      const heroAmt = Math.max(0, 1 - S.a);
      tilt.rotation.y +=
        mx * (0.45 + 0.3 * heroAmt) + Math.sin(time * 0.5) * 0.06;
      tilt.rotation.x += my * 0.22;
      tilt.rotation.z +=
        Math.max(-0.25, Math.min(0.25, vel * 0.004)) +
        Math.sin(time * 0.8) * 0.05 * heroAmt;
      tilt.position.y = Math.sin(time * 1.1) * 0.06;
      shadow.scale.setScalar(1 - Math.sin(time * 1.1) * 0.06);
    }
    vel *= 0.9;
    root.scale.multiplyScalar((0.4 + 0.6 * S.intro) * (1 + S.pulse * 0.06));
    tilt.rotation.y += (1 - S.intro) * -3.2;
    tilt.position.y += (1 - S.intro) * 1.2;
    root.visible = loaded && root.scale.x > 0.001;
    placeBalls(time, dt);
    character?.update(
      dt,
      { x: mx, y: my },
      $("#hero")!.getBoundingClientRect(),
      { toWorld, pxToWorld },
      S.balls,
    );
    if (probe()) {
      const c = root.getWorldPosition(probePoint).project(camera);
      recordFrame({
        x: ((c.x + 1) / 2) * W,
        y: ((1 - c.y) / 2) * H,
        w: (root.scale.x * H) / halfH(),
        visible: root.visible,
        a: S.a,
        intro: S.intro,
        balls: ballGroup.visible ? balls.filter((b) => b.m.visible).length : 0,
        scroll: scrollY,
        colourway: shown ?? "",
        look: character?.look(),
      });
    }
  }

  /** Renders each colourway once into a 480×300 image for swatches, cards, bag and search. */
  function makeThumbs() {
    const cw = renderer.domElement.width;
    const ch = renderer.domElement.height;
    if (!cw || !ch || !model) {
      listen(window, "resize", makeThumbs, { once: true });
      return;
    }
    const out = document.createElement("canvas");
    out.width = 480;
    out.height = 300;
    const o2 = out.getContext("2d")!;
    const h = halfH();
    const w = h * camera.aspect;
    const keep = shown;
    const keepRim = rim.color.clone();
    const ballsWere = ballGroup.visible;
    const thumbs: Record<string, string> = {};
    ballGroup.visible = false;
    if (character) character.root.visible = false;
    root.visible = true;
    activeCatalogue().products.forEach((p) => {
      if (!apply(p.id)) return;
      rim.color.set(p.hl);
      root.position.set(0, 0, 0);
      root.scale.setScalar(Math.min(w * 1.2, h * 1.6) / 2);
      tilt.rotation.set(0.22, -0.45, 0.04);
      tilt.position.set(0, 0, 0);
      shadowMat.opacity = 0;
      renderer.render(scene, camera);
      const box = new THREE.Box3().setFromObject(model!);
      const pts: THREE.Vector3[] = [];
      for (const x of [box.min.x, box.max.x])
        for (const y of [box.min.y, box.max.y])
          for (const z of [box.min.z, box.max.z])
            pts.push(new THREE.Vector3(x, y, z).project(camera));
      const xs = pts.map((q) => ((q.x + 1) / 2) * cw);
      const ys = pts.map((q) => ((1 - q.y) / 2) * ch);
      const x0 = Math.min(...xs);
      const x1 = Math.max(...xs);
      const y0 = Math.min(...ys);
      const y1 = Math.max(...ys);
      const sw = Math.max(x1 - x0, (y1 - y0) * 1.6) * 1.1;
      const shh = sw / 1.6;
      o2.clearRect(0, 0, 480, 300);
      o2.drawImage(
        renderer.domElement,
        (x0 + x1) / 2 - sw / 2,
        (y0 + y1) / 2 - shh / 2,
        sw,
        shh,
        0,
        0,
        480,
        300,
      );
      thumbs[p.id] = out.toDataURL("image/png");
    });
    if (keep) apply(keep);
    rim.color.copy(keepRim);
    ballGroup.visible = ballsWere;
    place(S.a, S.turn + S.drag);
    renderer.render(scene, camera);
    refreshImages(thumbs);
  }

  function refreshImages(thumbs: Record<string, string>) {
    // Commit the new images synchronously so the fade-in starts in the same task, as in the prototype.
    flushSync(() => setState({ thumbs }));
    if (!reduce)
      gsap.from("#grid .pimg img, #pdp-swatches img", {
        opacity: 0,
        scale: 0.8,
        duration: 0.8,
        stagger: 0.05,
        ease: "expo.out",
      });
  }

  setStageApi({
    show(id, animate, timeline) {
      rimTarget.set(productById(id)!.hl);
      // The swap must not flicker: the shoe only spins into a colourway whose material is loaded.
      // (They all load right after the intro; until then it switches without the spin.)
      if (loaded && mats[id] && animate && timeline && !reduce) {
        character?.swing(timeline);
        timeline
          .to(
            S,
            { turn: S.turn + Math.PI * 2, duration: 1, ease: "power3.inOut" },
            0,
          )
          .to(
            S,
            {
              pulse: 1,
              duration: 0.4,
              ease: "power2.out",
              yoyo: true,
              repeat: 1,
            },
            0.3,
          )
          // Swap the material while the shoe faces away, as the prototype did (0.55 of its 1.3 s).
          .call(() => void (current() === id && apply(id)), undefined, 0.42)
          .fromTo(
            S,
            { balls: 0.55 },
            { balls: 1, duration: 0.9, ease: "elastic.out(1, .4)" },
            0.15,
          );
        return;
      }
      void ensure(id).then(() => {
        if (loaded && current() === id) apply(id);
      });
    },
  });

  return {
    update,
    dispose() {
      disposed = true;
      setStageApi(null);
      cleanups.forEach((c) => c());
      scene.remove(stage);
      scene.environment = null;
      studio.dispose();
      tennisBalls.dispose();
      character?.dispose();
      shadow.geometry.dispose();
      shadowMat.dispose();
    },
  };
}
