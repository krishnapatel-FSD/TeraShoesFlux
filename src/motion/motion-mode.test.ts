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
    expect(isLowPower({ discharging: true, avgFrameMs: null })).toBe(true);
  });

  it("is on when frames average over 25 ms", () => {
    expect(isLowPower({ discharging: false, avgFrameMs: 26 })).toBe(true);
    expect(isLowPower({ discharging: false, avgFrameMs: 25 })).toBe(false);
  });

  it("is off when charging and there is no frame average yet", () => {
    expect(isLowPower({ discharging: false, avgFrameMs: null })).toBe(false);
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
});
