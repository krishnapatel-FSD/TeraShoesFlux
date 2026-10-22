"use client";

import { useEffect, useRef } from "react";
import { useCatalogue } from "@/state/catalogue";
import { gsap, reduce } from "@/motion/gsap";
import { getLenis } from "@/motion/SmoothScroll";

// Tilted highlight band: drifts sideways, speeds up with scroll velocity and follows its direction.
export function Band() {
  const { bandWords } = useCatalogue();
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tk = track.current;
    if (!tk || reduce) return;
    let x = 0;
    let boost = 0;
    let dir = 1;
    const tick = () => {
      const half = tk.scrollWidth / 2;
      x -= (0.7 + boost) * dir;
      boost *= 0.92;
      if (-x >= half) x += half;
      if (x > 0) x -= half;
      tk.style.transform = `translateX(${x}px)`;
    };
    gsap.ticker.add(tick);
    const lenis = getLenis();
    const onScroll = (e: { velocity: number; direction: number }) => {
      boost = Math.min(20, Math.abs(e.velocity) * 0.7);
      dir = e.direction < 0 ? -1 : 1;
    };
    const off = lenis?.on("scroll", onScroll);
    return () => {
      gsap.ticker.remove(tick);
      off?.();
    };
  }, []);

  return (
    <div className="band" aria-hidden="true">
      <div className="band-track" id="band" ref={track}>
        {[...bandWords, ...bandWords].map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
    </div>
  );
}
