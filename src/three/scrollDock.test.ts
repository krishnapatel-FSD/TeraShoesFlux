import { describe, expect, it } from "vitest";
import {
  dockPose,
  follow,
  MAX_SPEED,
  POSE,
  TOUR_CHAPTERS,
  tourDrift,
} from "./scrollDock";

// A page like the site's at 900 px tall: hero, the 4.2-screen sticky tour (420vh), the buy
// section, the shop.
const H = 900;
const PAGE = { tour: 900, tourHeight: 3780, buy: 4700, shop: 6000 };
const at = (scroll: number) =>
  dockPose({
    viewport: H,
    tour: { top: PAGE.tour - scroll, height: PAGE.tourHeight },
    buy: { top: PAGE.buy - scroll },
    shop: { top: PAGE.shop - scroll },
  });
/** Scroll position at tour progress p (0–1). */
const tourAt = (p: number) => PAGE.tour + p * (PAGE.tourHeight - H);

describe("dockPose", () => {
  it("docks in the hero at the top of the page", () => {
    expect(at(0)).toBe(POSE.hero);
  });

  it("reaches the first chapter as the tour reaches the top", () => {
    expect(at(PAGE.tour)).toBe(POSE.tourFirst);
    expect(at(PAGE.tour / 2)).toBeCloseTo(0.5);
  });

  it("holds each of the 4 chapters still for at least 30% of its scroll, while its text shows", () => {
    expect(TOUR_CHAPTERS).toBe(4);
    for (let c = 0; c < TOUR_CHAPTERS; c++) {
      // The text of chapter c shows over [c/N, (c+1)/N) of the tour (Tour.tsx).
      const samples = 1000;
      let still = 0;
      for (let k = 0; k < samples; k++) {
        const p = (c + k / samples) / TOUR_CHAPTERS;
        if (at(tourAt(p)) === POSE.tourFirst + c) still++;
      }
      expect(still / samples).toBeGreaterThanOrEqual(0.3);
    }
  });

  it("moves between chapters at the chapter boundaries", () => {
    for (let c = 1; c < TOUR_CHAPTERS; c++)
      expect(at(tourAt(c / TOUR_CHAPTERS))).toBeCloseTo(
        POSE.tourFirst + c - 0.5,
      );
  });

  it("docks in the product viewer, then above the shop", () => {
    expect(at(PAGE.buy - 0.2 * H)).toBeCloseTo(POSE.viewer);
    expect(at(PAGE.shop - 0.1 * H)).toBeCloseTo(POSE.shop);
  });

  it("only ever moves forward as the page scrolls down: no jumps back", () => {
    let prev = at(0);
    for (let scroll = 7; scroll <= PAGE.shop; scroll += 7) {
      const a = at(scroll);
      expect(a).toBeGreaterThanOrEqual(prev);
      expect(a - prev).toBeLessThan(0.05); // 7 px of scroll never moves the pose far
      prev = a;
    }
  });
});

describe("follow", () => {
  const run = (fps: number, seconds: number, target = 4) => {
    const f = { value: 0, velocity: 0 };
    for (let i = 0; i < fps * seconds; i++) follow(f, target, 1 / fps);
    return f.value;
  };

  it("is the same at 60 fps and 30 fps", () => {
    for (const [t, target] of [
      [0.1, 4],
      [0.6, 4],
      [1, 4],
      [1.5, 4],
      [0.1, 1],
      [0.3, 1],
    ] as const)
      expect(Math.abs(run(60, t, target) - run(30, t, target))).toBeLessThan(
        0.02,
      );
  });

  it("never moves faster than MAX_SPEED poses a second", () => {
    const f = { value: 0, velocity: 0 };
    let prev = 0;
    for (let i = 0; i < 120; i++) {
      const next = follow(f, 5, 1 / 60);
      expect(next - prev).toBeLessThanOrEqual(MAX_SPEED / 60 + 1e-9);
      prev = next;
    }
  });

  it("arrives within 1% half a second after a one-pose change, without overshooting", () => {
    const f = { value: 0, velocity: 0 };
    let max = 0;
    for (let i = 0; i < 30; i++) max = Math.max(max, follow(f, 1, 1 / 60));
    expect(1 - f.value).toBeLessThan(0.01);
    expect(max).toBeLessThanOrEqual(1);
  });

  it("doesn't move without time passing", () => {
    expect(follow({ value: 2.5, velocity: 3 }, 4, 0)).toBe(2.5);
  });
});

describe("tourDrift", () => {
  const drift = (scroll: number) =>
    tourDrift({
      viewport: H,
      tour: { top: PAGE.tour - scroll, height: PAGE.tourHeight },
    });

  it("never jumps: continuous across the whole tour", () => {
    let last = drift(tourAt(0));
    for (let k = 1; k <= 2000; k++) {
      const d = drift(tourAt(k / 2000));
      expect(Math.abs(d - last)).toBeLessThan(0.02);
      expect(Math.abs(d)).toBeLessThanOrEqual(0.5);
      last = d;
    }
  });

  it("keeps changing while each chapter holds its pose", () => {
    for (let c = 0; c < TOUR_CHAPTERS; c++) {
      const held: number[] = [];
      for (let k = 0; k < 200; k++) {
        const scroll = tourAt((c + k / 200) / TOUR_CHAPTERS);
        if (at(scroll) === POSE.tourFirst + c) held.push(drift(scroll));
      }
      expect(Math.max(...held) - Math.min(...held)).toBeGreaterThan(0.8);
    }
  });
});
