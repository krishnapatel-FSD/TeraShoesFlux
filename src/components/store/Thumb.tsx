"use client";

import { useStore } from "@/state/store";

/** A live render of the 3D shoe in this colourway, or a shimmer until the model has loaded. */
export function ThumbImg({ id }: { id: string }) {
  const src = useStore((s) => s.thumbs[id]);
  // eslint-disable-next-line @next/next/no-img-element -- data URL rendered from the 3D scene
  return src ? <img alt="" src={src} /> : <span className="shimmer"></span>;
}

/** Same as ThumbImg, but renders nothing while loading (bag rows, search results). */
export function ThumbOrEmpty({ id }: { id: string }) {
  const src = useStore((s) => s.thumbs[id]);
  // eslint-disable-next-line @next/next/no-img-element -- data URL rendered from the 3D scene
  return src ? <img alt="" src={src} /> : null;
}
