"use client";

import { useEffect, useState } from "react";
import { PRODUCTS } from "@/data/catalogue";
import {
  createProductStudio,
  SHOT_VIEWS,
  type ShotView,
} from "@/three/productShot";

declare global {
  interface Window {
    /** Set when the studio is ready; renders one photo as a PNG data URL. */
    __productShot?: (colourway: string, view: ShotView) => Promise<string>;
    /** A6: the studio environment as base64 Radiance RGBE bytes, bottom row first. */
    __studioHdr?: (width: number) => string;
  }
}

export function ProductShotStudio() {
  const [status, setStatus] = useState("Loading the shoe…");

  useEffect(() => {
    let disposed = false;
    let dispose: (() => void) | undefined;
    createProductStudio()
      .then((studio) => {
        if (disposed) return studio.dispose();
        dispose = studio.dispose;
        window.__studioHdr = (width) => {
          const bytes = studio.studioHdr(width);
          let bin = "";
          for (let i = 0; i < bytes.length; i += 0x8000)
            bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          return btoa(bin);
        };
        window.__productShot = (id, view) => {
          const p = PRODUCTS.find((x) => x.id === id);
          if (!p) throw new Error(`Unknown colourway ${id}`);
          return studio.shoot(p, view);
        };
        setStatus(
          `Ready: ${PRODUCTS.length} colourways × ${SHOT_VIEWS.length} views`,
        );
      })
      .catch((e: unknown) => setStatus(`Failed: ${String(e)}`));
    return () => {
      disposed = true;
      delete window.__productShot;
      delete window.__studioHdr;
      dispose?.();
    };
  }, []);

  return (
    <p
      id="product-shot-status"
      style={{ fontFamily: "var(--mono)", padding: 24 }}
    >
      {status}
    </p>
  );
}
