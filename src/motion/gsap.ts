"use client";

import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getMotionMode } from "./motion-mode";

// One place that registers GSAP plugins, as the prototype does at the top of its script.
if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger, Flip);

export { Flip, gsap, ScrollTrigger };

/** `prefers-reduced-motion: reduce` at load time (the prototype's `reduce`). */
export const reduce =
  typeof window !== "undefined" && getMotionMode() === "reduced";
