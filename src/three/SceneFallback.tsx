"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { COLOURWAY_TOKENS } from "@/lib/tokens";
import { reduce } from "@/motion/gsap";
import { setState as updateStore, useStore } from "@/state/store";
import { TOUR_CHAPTERS } from "./scrollDock";

// B8: without WebGL, the page shows what the 3D scene would, recorded from it by `pnpm assets:hero`
// (files in public/hero-fallback/):
//   - Hero: the default colourway plays a 10 s loop. The WebM is transparent and sits where the 3D
//     canvas would, between the solid and the outline headline. Safari can't show transparent VP9,
//     so it plays the MP4, which has the hero gradient baked in and replaces the background instead.
//     Other colourways, and reduced motion (nothing moves on its own, B7), show a transparent still.
//   - Tour and product viewer: the shoe in each docking pose, as stills (the tour crossfades them by
//     chapter; the viewer's "drag to rotate" hint is hidden).
//   - The colourway thumbnails the scene renders, for swatches, shop cards, the bag and search.
// Landscape and portrait recordings match how the scene frames the shoe on each kind of screen.

const BASE = "/hero-fallback/";
/** The site opens on the first colourway, so the loop is recorded in it. */
const LOOP_ID = COLOURWAY_TOKENS[0]!.id;
const RECORDED = new Set(COLOURWAY_TOKENS.map((c) => c.id));
const TOUR_CHAPTER_STILLS = Array.from({ length: TOUR_CHAPTERS }, (_, c) => c);

type Orientation = "landscape" | "portrait";

function subscribeResize(fn: () => void) {
  addEventListener("resize", fn);
  return () => removeEventListener("resize", fn);
}
const orientation = (): Orientation =>
  innerWidth >= innerHeight ? "landscape" : "portrait";

/** Safari plays VP9 without its transparency, so it gets the MP4. */
const isSafari = () =>
  /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(
    navigator.userAgent,
  );

/** Where the recordings go: the hero and its background layer, the tour and the viewer anchors. */
interface Hosts {
  hero: Element;
  bg: Element;
  tour: Element;
  viewer: Element;
}
let hosts: Hosts | null = null;
function getHosts() {
  if (!hosts) {
    const hero = document.getElementById("hero");
    const bg = hero?.querySelector(".hero-bg");
    const tour = document.getElementById("a-story");
    const viewer = document.getElementById("a-pdp");
    if (hero && bg && tour && viewer) hosts = { hero, bg, tour, viewer };
  }
  return hosts;
}
const noSubscribe = () => () => {};

export function SceneFallback() {
  const current = useStore((s) => s.current);
  const o = useSyncExternalStore(
    subscribeResize,
    orientation,
    () => "landscape" as const,
  );
  const hosts = useSyncExternalStore(noSubscribe, getHosts, () => null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.webgl = "off";
    updateStore({
      thumbs: Object.fromEntries(
        [...RECORDED].map((id) => [id, `${BASE}thumbs/${id}.webp`]),
      ),
    });
  }, []);

  // The recording takes the loader's place; if it can't load, the loader says there is no 3D.
  useEffect(() => {
    const loader = document.getElementById("loader");
    if (loader) loader.hidden = !failed;
  }, [failed]);

  if (!hosts || failed || !RECORDED.has(current)) return null;
  const onError = () => setFailed(true);
  const still = (pose: string) => `${BASE}${pose}-${current}-${o}.webp`;
  const safari = isSafari();
  const loop = current === LOOP_ID && !reduce;

  return (
    <>
      {loop
        ? createPortal(
            <video
              key={`${o}-${safari}`}
              className="hero-fallback"
              src={`${BASE}hero-${o}.${safari ? "mp4" : "webm"}`}
              poster={safari ? undefined : still("still")}
              autoPlay
              muted
              loop
              playsInline
              aria-hidden="true"
              onError={onError}
            />,
            safari ? hosts.bg : hosts.hero,
          )
        : createPortal(
            <Still
              className="hero-fallback"
              src={still("still")}
              onError={onError}
            />,
            hosts.hero,
          )}
      {createPortal(
        TOUR_CHAPTER_STILLS.map((c) => (
          <Still
            key={c}
            className="pose-fallback"
            chapter={c}
            src={still(`pose-tour${c}`)}
          />
        )),
        hosts.tour,
      )}
      {createPortal(
        <Still className="pose-fallback" src={still("pose-pdp")} />,
        hosts.viewer,
      )}
    </>
  );
}

function Still({
  className,
  src,
  chapter,
  onError,
}: {
  className: string;
  src: string;
  chapter?: number;
  onError?: () => void;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a fixed-size still in place of the 3D canvas
    <img
      className={className}
      src={src}
      alt=""
      aria-hidden="true"
      data-chapter={chapter}
      onError={onError}
    />
  );
}
