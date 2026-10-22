import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// lowPower.ts keeps module state, so each test imports a fresh copy.
async function load({ charging }: { charging?: boolean } = {}) {
  vi.resetModules();
  if (charging !== undefined)
    vi.stubGlobal("navigator", {
      ...navigator,
      getBattery: () =>
        Promise.resolve(
          Object.assign(new EventTarget(), { charging }) as EventTarget & {
            charging: boolean;
          },
        ),
    });
  return import("./lowPower");
}

describe("low-power mode", () => {
  let now = 0;
  beforeEach(() => {
    now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("is off on a fast device that is charging", async () => {
    const lp = await load({ charging: true });
    lp.startPowerWatch();
    await Promise.resolve();
    now = 5000;
    for (let i = 0; i < 200; i++) lp.reportFrame(16.7);
    expect(lp.isLowPowerMode()).toBe(false);
    expect(document.documentElement.dataset.motion).toBe("full");
  });

  it("turns on when the battery is discharging", async () => {
    const lp = await load({ charging: false });
    const onChange = vi.fn();
    lp.subscribeLowPower(onChange);
    lp.startPowerWatch();
    await vi.waitFor(() => expect(lp.isLowPowerMode()).toBe(true));
    expect(onChange).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.motion).toBe("low-power");
  });

  it("turns on, and stays on, once frames average over 25 ms after the warm-up", async () => {
    const lp = await load();
    lp.startPowerWatch();
    for (let i = 0; i < 200; i++) lp.reportFrame(40); // during the warm-up: ignored
    expect(lp.isLowPowerMode()).toBe(false);
    now = 5000;
    for (let i = 0; i < 90; i++) lp.reportFrame(40);
    expect(lp.isLowPowerMode()).toBe(true);
    for (let i = 0; i < 200; i++) lp.reportFrame(10);
    expect(lp.isLowPowerMode()).toBe(true);
  });

  it("never applies with reduced motion, which keeps its own behaviour", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn((q: string) => ({ matches: q.includes("reduce"), media: q })),
    );
    const lp = await load({ charging: false });
    lp.startPowerWatch();
    await new Promise((r) => setTimeout(r, 0));
    now = 5000;
    for (let i = 0; i < 200; i++) lp.reportFrame(40);
    expect(lp.isLowPowerMode()).toBe(false);
    expect(document.documentElement.dataset.motion).toBe("reduced");
  });
});
