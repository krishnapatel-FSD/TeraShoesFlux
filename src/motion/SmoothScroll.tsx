"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { gsap, reduce, ScrollTrigger } from "./gsap";

// Lenis smooth scroll driven by GSAP's ticker (prototype "Smooth scroll"). Reduced motion keeps
// native scrolling.
let lenis: Lenis | null = null;

export function getLenis(): Lenis | null {
  return lenis;
}

export function SmoothScroll() {
  useEffect(() => {
    if (reduce) return;
    const instance = new Lenis({ lerp: 0.09, smoothWheel: true });
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    lenis = instance;
    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      lenis = null;
    };
  }, []);

  return null;
}

/** Smooth-scrolls to a section, as the prototype's `goTo`. */
export function goTo(sel: string) {
  const el =
    sel === "#top" ? document.body : document.querySelector<HTMLElement>(sel);
  if (!el) return;
  if (lenis) {
    lenis.scrollTo(el, {
      offset: sel === "#shop" || sel === "#faq" ? -90 : 0,
      duration: 1.6,
      easing: (t) => 1 - Math.pow(1 - t, 4),
    });
  } else {
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }
}
