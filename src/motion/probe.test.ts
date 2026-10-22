import gsap from "gsap";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mark, probe, recordFrame, track } from "./probe";

const frame = {
  x: 0,
  y: 0,
  w: 0,
  visible: true,
  a: 0,
  intro: 1,
  balls: 6,
  scroll: 0,
  colourway: "lime",
};

describe("motion probe", () => {
  afterEach(() => {
    delete window.__motionProbe;
  });

  it("records nothing unless a test opted in", () => {
    const tween = gsap.to({ v: 0 }, { v: 1, duration: 0.01 });
    expect(track("idle", tween)).toBe(tween);
    mark("idle");
    recordFrame(frame);
    expect(probe()).toBeNull();
  });

  it("records when a timeline starts and ends, keeping its own callbacks", async () => {
    window.__motionProbe = { frames: [], timelines: [], marks: {} };
    const onComplete = vi.fn();
    const tween = track(
      "pop",
      gsap.to({ v: 0 }, { v: 1, duration: 0.05, onComplete }),
    );
    const [entry] = window.__motionProbe.timelines;
    // Timed from creation, before any frame has run: what a person waits for after a click.
    expect(entry?.start).toBeTypeOf("number");
    expect(entry?.end).toBeUndefined();
    await tween.then();
    expect(entry?.name).toBe("pop");
    expect(entry!.end!).toBeGreaterThan(entry!.start!);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("times a delayed tween from the end of its delay", async () => {
    window.__motionProbe = { frames: [], timelines: [], marks: {} };
    const before = performance.now();
    await track(
      "late",
      gsap.to({ v: 0 }, { v: 1, duration: 0.05, delay: 0.1 }),
    ).then();
    const [entry] = window.__motionProbe.timelines;
    expect(entry!.start! - before).toBeGreaterThanOrEqual(100);
    expect(entry!.end!).toBeGreaterThan(entry!.start!);
  });

  it("records zero-duration tweens, which finish as they are created", () => {
    window.__motionProbe = { frames: [], timelines: [], marks: {} };
    track("instant", gsap.to({ v: 0 }, { v: 1, duration: 0 }));
    const [entry] = window.__motionProbe.timelines;
    expect(entry?.end).toBeTypeOf("number");
    expect(entry?.end).toBe(entry?.start);
  });

  it("records marks and keeps a bounded number of frames", () => {
    window.__motionProbe = { frames: [], timelines: [], marks: {} };
    mark("model-loaded");
    for (let i = 0; i < 5010; i++) recordFrame({ ...frame, x: i });
    expect(window.__motionProbe.marks["model-loaded"]).toBeTypeOf("number");
    expect(window.__motionProbe.frames).toHaveLength(5000);
    expect(window.__motionProbe.frames.at(-1)?.x).toBe(5009);
  });
});
