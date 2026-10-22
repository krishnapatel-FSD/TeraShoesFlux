// Shared between the page and the 3D stage, as in the prototype: GSAP tweens these values from
// scroll and UI events, and the stage reads them every frame.
//   a      docking pose: 0 hero, 1–4 tour chapters, 5 product viewer, 6 above the shop (POSE)
//   turn   extra spin added by the colour-change sequence
//   pulse  scale pulse during a colour change
//   drag   rotation from dragging the product viewer
//   intro  0 → 1 fly-in once the model has loaded
//   balls  0 → 1 scale of the tennis balls
import type { gsap } from "gsap";
import { reduce } from "@/motion/gsap";

export const S = {
  a: 0,
  turn: 0,
  pulse: 0,
  drag: 0,
  dragV: 0,
  intro: reduce ? 1 : 0,
  balls: reduce ? 1 : 0,
};

export interface StageApi {
  /**
   * Shows a colourway. With `animate`, the shoe's spin, material swap and ball bounce join the
   * click's colour-change `timeline` (B3), so everything finishes together.
   */
  show(id: string, animate: boolean, timeline?: gsap.core.Timeline): void;
}

let api: StageApi | null = null;

export function setStageApi(next: StageApi | null) {
  api = next;
}

export function getStageApi(): StageApi | null {
  return api;
}
