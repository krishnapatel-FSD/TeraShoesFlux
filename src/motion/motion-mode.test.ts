import { afterEach, describe, expect, it, vi } from "vitest";
import { FrameTimer, getMotionMode, isLowPower } from "./motion-mode";

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: matches && query.includes("reduce"),
      media: query,
    })),
  );
}

describe("getMotionMode", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is full when the user has no motion preference", () => {
    mockReducedMotion(false);
    expect(getMotionMode()).toBe("full");
  });

  it("is reduced when the user prefers reduced motion", () => {
    mockReducedMotion(true);
    expect(getMotionMode()).toBe("reduced");
  });
});

describe("isLowPower", () => {
  it("is on when running on battery", () => {
    expect(isLowPower({ discharging: true, frameMs: null })).toBe(true);
  });

  it("is on when a typical frame takes over 25 ms", () => {
    expect(isLowPower({ discharging: false, frameMs: 26 })).toBe(true);
    expect(isLowPower({ discharging: false, frameMs: 25 })).toBe(false);
  });

  it("is off when charging and there is no frame time yet", () => {
    expect(isLowPower({ discharging: false, frameMs: null })).toBe(false);
  });
});

describe("FrameTimer", () => {
  it("averages only a full window of the most recent frames", () => {
    const t = new FrameTimer(3);
    t.add(10);
    t.add(20);
    expect(t.average()).toBeNull();
    t.add(30);
    expect(t.average()).toBe(20);
    t.add(60);
    expect(t.average()).toBe((20 + 30 + 60) / 3);
    t.reset();
    expect(t.average()).toBeNull();
  });

  it("gives the median, which one long freeze doesn't move", () => {
    const t = new FrameTimer(5);
    [16, 17, 16, 1000, 17].forEach((ms) => t.add(ms));
    expect(t.median()).toBe(17);
    expect(t.average()).toBeGreaterThan(200);
  });
});
