"use client";

import { reduce } from "./gsap";
import { FrameTimer, isLowPower } from "./motion-mode";
import { heroRecorder, probe } from "./probe";

// B7 low-power mode (TRD §9), in two steps:
//   - on battery, or on a slow device: the 3D scene renders at pixel ratio 1 with fewer tennis balls
//   - on a slow device only (a typical frame over 25 ms): it also caps at 30 fps. Product-owner
//     change, 23 Oct 2026: the brief capped on battery too, but 30 fps against a 60 fps page scroll
//     reads as lag on any laptop that's unplugged.
// Full motion is the prototype unchanged, and reduced motion keeps its own behaviour (low-power never
// applies there). The current mode is also on <html data-motion="full | reduced | low-power">, and
// the cap on data-fps="30".

/** Frames ignored after the scene starts: loading and shader compiles stutter on every device. */
const WARMUP_MS = 3000;

let discharging = false;
/** Latched: once the device proved slow, stay in low-power (30 fps would read as slow anyway). */
let slow = false;
let low = false;
let capped = false;
const listeners = new Set<() => void>();
const frames = new FrameTimer();
let startedAt = 0;

function update() {
  // A recording session (`pnpm assets:hero`) steps frames by hand, so it always records full motion.
  const active = !reduce && !heroRecorder();
  const next = active && (slow || discharging);
  const nextCapped = active && slow;
  const root = document.documentElement;
  root.dataset.motion = reduce ? "reduced" : next ? "low-power" : "full";
  if (nextCapped) root.dataset.fps = "30";
  else delete root.dataset.fps;
  if (next === low && nextCapped === capped) return;
  low = next;
  capped = nextCapped;
  listeners.forEach((fn) => fn());
}

/** Pixel ratio 1 and fewer balls: on battery or on a slow device. */
export const isLowPowerMode = () => low;
/** The 30 fps cap: on a slow device only. */
export const isFrameCapped = () => capped;

export function subscribeLowPower(fn: () => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

/** Feeds one frame time (ms) from the render loop. */
export function reportFrame(ms: number) {
  // Measured on battery too: a slow device on battery still gets the cap.
  if (reduce || slow || document.hidden) return frames.reset();
  if (performance.now() - startedAt < WARMUP_MS) return;
  frames.add(ms);
  if (isLowPower({ discharging: false, frameMs: frames.median() })) {
    slow = true;
    update();
  }
}

/** Starts watching the battery; returns a cleanup. Call when the 3D scene mounts. */
export function startPowerWatch(): () => void {
  startedAt = performance.now();
  frames.reset();
  // The motion tests stand in a slow device this way (the probe is compiled out of real builds).
  if (probe()?.slowDevice) slow = true;
  update();
  let battery: BatteryManager | null = null;
  const onCharging = () => {
    discharging = battery ? !battery.charging : false;
    update();
  };
  let cancelled = false;
  void navigator.getBattery?.().then(
    (b) => {
      if (cancelled) return;
      battery = b;
      b.addEventListener("chargingchange", onCharging);
      onCharging();
    },
    () => {},
  );
  return () => {
    cancelled = true;
    battery?.removeEventListener("chargingchange", onCharging);
  };
}

/** Battery Status API (Chromium only), not yet in TypeScript's DOM types. */
interface BatteryManager extends EventTarget {
  readonly charging: boolean;
}
declare global {
  interface Navigator {
    getBattery?: () => Promise<BatteryManager>;
  }
}
