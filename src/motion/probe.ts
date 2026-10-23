// B-0 step 1: test-only motion probe, so each Workstream B "Done when" is measured, not eyeballed.
// It records the shoe's screen position every frame, named moments (e.g. "model-loaded") and the
// start and end of the timelines the brief puts limits on (intro, colour change, micro-interactions).
//
// Compiled in only for dev builds, or production builds made with NEXT_PUBLIC_MOTION_PROBE=1 (for
// e2e against a preview deployment); elsewhere PROBE_ENABLED is the constant `false` and the bundler
// drops it. Even when compiled in, it records nothing until a test opts in before the page loads:
//   await page.addInitScript(() => { window.__motionProbe = { frames: [], timelines: [], marks: {} } })
import type { gsap } from "gsap";

export const PROBE_ENABLED =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_MOTION_PROBE === "1";

export interface ProbeFrame {
  /** performance.now() in ms */
  t: number;
  /** Shoe centre and width in CSS pixels */
  x: number;
  y: number;
  w: number;
  visible: boolean;
  /** Docking progress and intro progress (see stageState.ts) */
  a: number;
  intro: number;
  /** Tennis balls drawn this frame */
  balls: number;
  /** window.scrollY: the shoe moving with the page is not a jump */
  scroll: number;
  /** The colourway whose material the shoe shows (a flicker shows up as extra switches) */
  colourway: string;
  /** The hero character's head turn toward the cursor (radians), when there is one (B5) */
  look?: number;
  /** The docking pose the shoe is easing toward (S.a's target), to measure how far it trails. */
  target?: number;
}

export interface ProbeTimeline {
  name: string;
  /** performance.now() in ms when it was created (plus any delay) and when it completed */
  start?: number;
  end?: number;
}

export interface MotionProbe {
  frames: ProbeFrame[];
  timelines: ProbeTimeline[];
  marks: Record<string, number>;
  /** Set by a test before the page loads: treat this device as slow (B7's 30 fps cap). */
  slowDevice?: boolean;
}

declare global {
  interface Window {
    __motionProbe?: MotionProbe;
  }
}

/** Frames kept: about 80 s at 60 fps. */
const MAX_FRAMES = 5000;

/** The probe, when compiled in and a test asked for it; otherwise null. */
export function probe(): MotionProbe | null {
  if (!PROBE_ENABLED || typeof window === "undefined") return null;
  return window.__motionProbe ?? null;
}

/** Records a named moment. */
export function mark(name: string) {
  const p = probe();
  if (p) p.marks[name] = performance.now();
}

export function recordFrame(frame: Omit<ProbeFrame, "t">) {
  const p = probe();
  if (!p) return;
  p.frames.push({ t: performance.now(), ...frame });
  if (p.frames.length > MAX_FRAMES) p.frames.shift();
}

/** Records when a GSAP tween or timeline starts and completes; returns it unchanged. */
export function track<T extends gsap.core.Animation>(name: string, anim: T): T {
  const p = probe();
  if (!p) return anim;
  // Timed from when it was created (plus any delay): what a person waits for after a click.
  // Call `track` right where the animation is made.
  const entry: ProbeTimeline = {
    name,
    start: performance.now() + anim.delay() * 1000,
  };
  p.timelines.push(entry);
  // Zero-duration tweens (reduced motion) are done as soon as they are made.
  if (anim.totalDuration() === 0 || anim.progress() === 1) {
    entry.end = entry.start;
    return anim;
  }
  const onComplete = anim.eventCallback("onComplete");
  anim.eventCallback(
    "onComplete",
    function (this: unknown, ...args: unknown[]) {
      entry.end = performance.now();
      return onComplete?.apply(this, args);
    },
  );
  return anim;
}

/**
 * B8: lets `pnpm assets:hero` record the hero from the real scene, frame by frame. A recording
 * session sets `window.__heroRecorder = {}` before load; the scene then fills in these methods.
 */
export interface HeroRecorder {
  /** True once the intro has finished and the colourway thumbnails exist. */
  ready?: () => boolean;
  /** Stops the live render loop, so only `frame` advances the scene. */
  pause?: () => void;
  /** Advances the scene by `dt` seconds, renders it, and returns the canvas as a PNG data URL. */
  frame?: (dt: number) => string;
  /** Shows a colourway at once (no colour-change animation). */
  select?: (id: string) => void;
  /**
   * Holds the shoe in docking pose `a` (see stageState.ts) and returns the frame cropped to the
   * `anchor` element, as a PNG data URL. The anchor must be on screen.
   */
  pose?: (a: number, anchor: string) => string;
  /** The colourway thumbnails the scene rendered (PNG data URLs). */
  thumbs?: () => Record<string, string>;
}

declare global {
  interface Window {
    __heroRecorder?: HeroRecorder;
  }
}

/** The recorder hooks object, when compiled in and a recording session asked for it. */
export function heroRecorder(): HeroRecorder | null {
  if (!PROBE_ENABLED || typeof window === "undefined") return null;
  return window.__heroRecorder ?? null;
}
