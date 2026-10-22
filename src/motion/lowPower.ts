"use client";

import { reduce } from "./gsap";
import { FrameTimer, isLowPower } from "./motion-mode";
import { heroRecorder } from "./probe";

// B7 low-power mode (TRD §9): on battery, or when frames average over 25 ms, the 3D scene caps at
// 30 fps, renders at pixel ratio 1 and shows fewer tennis balls. Full motion is the prototype
// unchanged, and reduced motion keeps its own behaviour (low-power never applies there).
// The current mode is also on <html data-motion="full | reduced | low-power">.

/** Frames ignored after the scene starts: loading and shader compiles stutter on every device. */
const WARMUP_MS = 3000;

let discharging = false;
/** Latched: once the device proved slow, stay in low-power (30 fps would read as slow anyway). */
let slow = false;
let low = false;
const listeners = new Set<() => void>();
const frames = new FrameTimer();
let startedAt = 0;

function update() {
  // A recording session (`pnpm assets:hero`) steps frames by hand, so it always records full motion.
  const next = !reduce && !heroRecorder() && (slow || discharging);
  document.documentElement.dataset.motion = reduce
    ? "reduced"
    : next
      ? "low-power"
      : "full";
  if (next === low) return;
  low = next;
  listeners.forEach((fn) => fn());
}

export const isLowPowerMode = () => low;

export function subscribeLowPower(fn: () => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

/** Feeds one frame time (ms) from the render loop. */
export function reportFrame(ms: number) {
  if (reduce || slow || low || document.hidden) return frames.reset();
  if (performance.now() - startedAt < WARMUP_MS) return;
  frames.add(ms);
  if (isLowPower({ discharging: false, avgFrameMs: frames.average() })) {
    slow = true;
    update();
  }
}

/** Starts watching the battery; returns a cleanup. Call when the 3D scene mounts. */
export function startPowerWatch(): () => void {
  startedAt = performance.now();
  frames.reset();
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
