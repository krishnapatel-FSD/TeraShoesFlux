// B1: the single scroll controller that docks the shoe. Each frame the stage works out the docking
// pose (S.a, see stageState.ts) from the live section positions with `dockPose`, then eases toward
// it with `follow`. One function of the scroll position replaces the prototype's four overlapping
// scrubbed ScrollTriggers, which fought over S.a when the scroll direction changed fast and made the
// shoe jump (measured: 334 px in one frame). The section scroll ranges are the prototype's.

/** Section positions in viewport pixels (getBoundingClientRect), and the viewport height. */
export interface DockLayout {
  viewport: number;
  tour: { top: number; height: number };
  buy: { top: number };
  shop: { top: number };
}

/** Tour chapters (B4, GB-3): upper, foam, outsole, heel. */
export const TOUR_CHAPTERS = 4;

/** Docking poses (S.a): the hero, each tour chapter, the product viewer, then above the shop. */
export const POSE = {
  hero: 0,
  /** Tour chapter c (0-based) is pose `tourFirst + c`. */
  tourFirst: 1,
  viewer: 1 + TOUR_CHAPTERS,
  shop: 2 + TOUR_CHAPTERS,
} as const;

/**
 * Where the tour moves the shoe to the next chapter, as tour progress (0–1): centred on the
 * chapter boundaries and 60% of a chapter long, so every chapter holds still for at least 40% of
 * its scroll range while its text is shown (the text changes at the boundaries, see Tour.tsx).
 */
export const TOUR_MOVES: readonly (readonly [number, number])[] = Array.from(
  { length: TOUR_CHAPTERS - 1 },
  (_, i) => {
    const boundary = (i + 1) / TOUR_CHAPTERS;
    const half = 0.3 / TOUR_CHAPTERS;
    return [boundary - half, boundary + half] as const;
  },
);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** GSAP's power2.inOut, as the prototype's chapter moves used. */
const inOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/**
 * The docking pose for a scroll position (see POSE). The section ranges are the prototype's
 * ScrollTrigger start and end points.
 */
export function dockPose({ viewport: h, tour, buy, shop }: DockLayout): number {
  // Hero → tour: the tour's top travels from the bottom of the screen to the top.
  const intoTour = clamp01((h - tour.top) / h);
  // Tour chapters, while its sticky panel is on screen: tour top at the top → bottom at the bottom.
  const tourProgress = clamp01(-tour.top / Math.max(1, tour.height - h));
  const chapters = TOUR_MOVES.reduce(
    (sum, [start, end]) =>
      sum + inOut(clamp01((tourProgress - start) / (end - start))),
    0,
  );
  // Tour → product viewer: the buy section's top travels from the bottom of the screen to 20%.
  const intoBuy = clamp01((h - buy.top) / (0.8 * h));
  // Product viewer → above the shop: the shop's top travels from 70% of the screen to 10%.
  const intoShop = clamp01((0.7 * h - shop.top) / (0.6 * h));
  return intoTour + chapters + intoBuy + intoShop;
}

/**
 * How the shoe follows the pose: a critically damped spring (it eases in and out, never overshoots)
 * that takes about SMOOTH_TIME to arrive and never moves faster than MAX_SPEED poses a second. The
 * speed cap keeps a fast scroll between distant anchors from throwing the shoe across the screen.
 */
export const SMOOTH_TIME = 0.12;
export const MAX_SPEED = 4;
/**
 * The fastest the shoe may cross the screen, in screen heights a second: 5% of the screen per
 * 1/60 s, with margin under the 8% that counts as a jump (e2e/motion.spec.ts; the anchors themselves
 * also move with the scroll). The stage turns it into a pose speed from how far apart the two
 * anchors it is moving between are.
 */
export const MAX_SCREEN_SPEED = 0.05 * 60;

export interface Follow {
  value: number;
  velocity: number;
}

/**
 * Moves `f` toward `target` over `dt` seconds: the "smooth damp" spring from Game Programming Gems
 * 4 (§1.10) with the speed cap applied to each step.
 */
export function follow(
  f: Follow,
  target: number,
  dt: number,
  smoothTime = SMOOTH_TIME,
  maxSpeed = MAX_SPEED,
) {
  if (dt <= 0) return f.value;
  const omega = 2 / smoothTime;
  const x = omega * dt;
  const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = f.value - target;
  const temp = (f.velocity + omega * change) * dt;
  f.velocity = (f.velocity - omega * temp) * decay;
  let next = target + (change + temp) * decay;
  // The speed cap, per step, so the shoe cruises at the same speed at any frame rate.
  const step = next - f.value;
  if (Math.abs(step) > maxSpeed * dt) {
    next = f.value + Math.sign(step) * maxSpeed * dt;
    f.velocity = Math.sign(step) * maxSpeed;
  }
  // Never overshoot the target.
  if (target - f.value > 0 === next > target) {
    next = target;
    f.velocity = 0;
  }
  f.value = next;
  return next;
}
