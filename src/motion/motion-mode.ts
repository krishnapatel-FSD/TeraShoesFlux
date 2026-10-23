// Motion modes from TRD §9: full (the prototype), reduced (prefers-reduced-motion) and low-power
// (B7: on battery, or a slow device).
export type MotionMode = "full" | "reduced" | "low-power";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/** Full or reduced, from the user's setting. Low-power is detected later, see lowPower.ts. */
export function getMotionMode(): Exclude<MotionMode, "low-power"> {
  if (typeof window === "undefined" || !window.matchMedia) return "full";
  return window.matchMedia(REDUCED_QUERY).matches ? "reduced" : "full";
}

/** Average frame time above which the device counts as slow (TRD §9). */
export const SLOW_FRAME_MS = 25;

export interface PowerSignals {
  /** Battery Status API: running on battery (charging === false). */
  discharging: boolean;
  /**
   * Recent typical (median) frame time in ms, or null before there are enough frames. The median,
   * not the mean: one load-time freeze of a second would push a fast device's mean over 25 ms.
   */
  frameMs: number | null;
}

/** Low-power rendering (pixel ratio 1, fewer balls). The 30 fps cap is for slow devices only. */
export function isLowPower({ discharging, frameMs }: PowerSignals) {
  return discharging || (frameMs !== null && frameMs > SLOW_FRAME_MS);
}

/** The last `size` frame times: their average and their median. */
export class FrameTimer {
  private times: number[] = [];
  private sum = 0;

  constructor(private readonly size = 90) {}

  add(ms: number) {
    this.times.push(ms);
    this.sum += ms;
    if (this.times.length > this.size) this.sum -= this.times.shift()!;
  }

  /** null until a full window of frames has been seen. */
  average(): number | null {
    return this.times.length < this.size ? null : this.sum / this.size;
  }

  /** null until a full window of frames has been seen. */
  median(): number | null {
    if (this.times.length < this.size) return null;
    const sorted = [...this.times].sort((a, b) => a - b);
    const mid = this.size >> 1;
    return this.size % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
  }

  reset() {
    this.times = [];
    this.sum = 0;
  }
}
