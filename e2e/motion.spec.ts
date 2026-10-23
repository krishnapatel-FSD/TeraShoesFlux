import { expect, test, type Page } from "@playwright/test";
import { writeFileSync } from "node:fs";
import type { MotionProbe } from "../src/motion/probe";

// Workstream B "Done when" checks, measured with the motion probe (src/motion/probe.ts).
// Run with `pnpm test:motion`: a production build on the real GPU. Timings are skipped on software
// WebGL, which draws a few frames a second (GSAP then stretches every animation).

/**
 * Turns the probe on and fixes the battery state (the test machine may be unplugged); `slowDevice`
 * stands in a device whose frames average over 25 ms (B7's 30 fps cap).
 */
async function withProbe(
  page: Page,
  { onBattery = false, slowDevice = false } = {},
) {
  await page.addInitScript(
    ([discharging, slow]) => {
      window.__motionProbe = {
        frames: [],
        timelines: [],
        marks: {},
        slowDevice: slow,
      };
      const battery = Object.assign(new EventTarget(), {
        charging: !discharging,
      });
      Object.defineProperty(navigator, "getBattery", {
        value: () => Promise.resolve(battery),
      });
    },
    [onBattery, slowDevice] as const,
  );
}

const readProbe = (page: Page) =>
  page.evaluate(() => window.__motionProbe!) as Promise<MotionProbe>;

/** When each named timeline last completed (dev mode mounts twice and reverts the first run). */
const lastEnds = (p: MotionProbe) =>
  Object.fromEntries(
    p.timelines.filter((t) => t.end !== undefined).map((t) => [t.name, t.end!]),
  );

async function skipOnSoftwareWebGL(page: Page) {
  const renderer = await page.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl2");
    const info = gl?.getExtension("WEBGL_debug_renderer_info");
    return info ? String(gl!.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
  });
  test.skip(
    /swiftshader|llvmpipe|software/i.test(renderer),
    `software WebGL (${renderer}): timings are meaningless without a GPU`,
  );
}

/** The stage's intro timelines; the headline starts on page load, before the model. */
const INTRO = ["loader-out", "intro-shoe", "intro-balls", "intro-headline"];

test("B2: the whole intro finishes within 2.5 s of the model loading", async ({
  page,
}) => {
  await withProbe(page);
  await page.goto("/");
  await skipOnSoftwareWebGL(page);
  const introDone = async () => {
    const ends = lastEnds(await readProbe(page));
    return INTRO.every((n) => n in ends);
  };
  // Warm-up: a freshly launched browser starts its GPU process and shader cache cold, which a
  // visitor's running browser doesn't. Measure the second load.
  await expect.poll(introDone, { timeout: 60_000 }).toBe(true);
  await page.reload();
  await expect.poll(introDone, { timeout: 60_000 }).toBe(true);

  const p = await readProbe(page);
  const loaded = p.marks["model-loaded"];
  expect(loaded, "model-loaded mark").toBeDefined();
  const ends = lastEnds(p);
  const ms = Math.max(...INTRO.map((n) => ends[n]!)) - loaded!;
  test.info().annotations.push({
    type: "intro",
    description: `${Math.round(ms)} ms after the model loaded`,
  });
  const wait = (p.marks["intro-start"] ?? loaded!) - loaded!;
  console.log(
    `B2 intro: ${Math.round(ms)} ms after the model loaded (${Math.round(wait)} ms of it before the intro started)`,
  );
  expect(ms).toBeLessThanOrEqual(2500);

  // The probe's frames: after the intro the shoe sits on its hero anchor.
  await page.waitForTimeout(500);
  const last = (await readProbe(page)).frames.at(-1)!;
  const anchor = await page.locator("#a-hero").boundingBox();
  expect(last.visible).toBe(true);
  expect(Math.abs(last.x - (anchor!.x + anchor!.width / 2))).toBeLessThan(40);
  expect(Math.abs(last.y - (anchor!.y + anchor!.height / 2))).toBeLessThan(40);
});

/** Frames a second over 2 s, once the intro has played. */
async function measureFps(page: Page) {
  await expect
    .poll(async () => "intro-balls" in lastEnds(await readProbe(page)), {
      timeout: 60_000,
    })
    .toBe(true);
  const from = await page.evaluate(() => performance.now());
  await page.waitForTimeout(2000);
  const frames = (await readProbe(page)).frames.filter((f) => f.t >= from);
  const fps = (frames.length - 1) / ((frames.at(-1)!.t - frames[0]!.t) / 1000);
  return { fps, frames };
}
const pixelRatio = (page: Page) =>
  page.evaluate(() => {
    const c = document.querySelector<HTMLCanvasElement>("#gl canvas")!;
    return c.width / c.clientWidth;
  });

test("B7: on battery the scene keeps 60 fps, at pixel ratio 1 with three balls", async ({
  page,
}) => {
  await withProbe(page, { onBattery: true });
  await page.goto("/");
  await skipOnSoftwareWebGL(page);
  await expect(page.locator("html")).toHaveAttribute(
    "data-motion",
    "low-power",
  );
  const { fps, frames } = await measureFps(page);
  console.log(`B7 on battery: ${fps.toFixed(1)} fps`);
  expect(fps).toBeGreaterThan(50);
  expect(frames.at(-1)!.balls).toBe(3);
  expect(await pixelRatio(page)).toBe(1);
});

test("B7: a slow device drops to 30 fps, pixel ratio 1 and three balls", async ({
  page,
}) => {
  await withProbe(page, { slowDevice: true });
  await page.goto("/");
  await skipOnSoftwareWebGL(page);
  await expect(page.locator("html")).toHaveAttribute(
    "data-motion",
    "low-power",
  );
  await expect(page.locator("html")).toHaveAttribute("data-fps", "30");
  const { fps, frames } = await measureFps(page);
  test.info().annotations.push({ type: "fps", description: fps.toFixed(1) });
  console.log(`B7 slow device: ${fps.toFixed(1)} fps`);
  expect(fps).toBeGreaterThan(24);
  expect(fps).toBeLessThan(33);
  expect(frames.at(-1)!.balls).toBe(3);
  expect(await pixelRatio(page)).toBe(1);
});

test("B7: plugged in, the scene keeps full motion", async ({ page }) => {
  await withProbe(page);
  await page.goto("/");
  await skipOnSoftwareWebGL(page);
  await expect
    .poll(async () => "intro-balls" in lastEnds(await readProbe(page)), {
      timeout: 60_000,
    })
    .toBe(true);
  await page.waitForTimeout(1000);
  await expect(page.locator("html")).toHaveAttribute("data-motion", "full");
  expect((await readProbe(page)).frames.at(-1)!.balls).toBe(6);
});

/** Scrolls hard up and down the page with the mouse wheel for `ms`, then stops. */
async function scrollHard(page: Page, ms: number) {
  await page.mouse.move(640, 360);
  const end = Date.now() + ms;
  let dir = 1;
  let burst = 0;
  while (Date.now() < end) {
    const atEnd = await page.evaluate(
      () => scrollY + innerHeight >= document.body.scrollHeight - 50,
    );
    if (atEnd) dir = -1;
    else if (await page.evaluate(() => scrollY < 10)) dir = 1;
    // Fling, then change direction now and then, as a restless reader does.
    if (++burst % 25 === 0) dir = -dir;
    await page.mouse.wheel(0, dir * 400);
    await page.waitForTimeout(30);
  }
}

const FRAME_60 = 1000 / 60;

/**
 * The worst movement of the shoe beyond what the page itself scrolled, per 60 fps frame: a longer
 * frame (30 fps, or a stall) may move it proportionally further without counting as a jump. Only
 * frames where the shoe is on screen count: a jump nobody can see isn't one.
 */
function worstJump(
  frames: MotionProbe["frames"],
  screen: { width: number; height: number },
) {
  /** How far the shoe's box (about w wide, w/2 tall) is inside the screen; ≤ 0 when off it. */
  const inside = (f: MotionProbe["frames"][number]) =>
    Math.min(
      f.x + f.w / 2,
      screen.width - (f.x - f.w / 2),
      f.y + f.w / 4,
      screen.height - (f.y - f.w / 4),
    );
  let worst = { px: 0, at: 0, a: 0 };
  for (let i = 1; i < frames.length; i++) {
    const f0 = frames[i - 1]!;
    const f1 = frames[i]!;
    if (!f0.visible || !f1.visible || f0.w < 20 || f1.w < 20) continue;
    if (inside(f1) <= 0) continue;
    const scrolled = Math.abs(f1.scroll - f0.scroll);
    const moved = Math.max(
      Math.abs(f1.y - f0.y) - scrolled,
      Math.abs(f1.x - f0.x),
      Math.abs(f1.w - f0.w),
    );
    // Coming on screen, what is seen is how far in it appears, not the distance it covered off it.
    const seen = inside(f0) > 0 ? moved : Math.min(moved, inside(f1));
    const px = seen * (FRAME_60 / Math.max(FRAME_60, f1.t - f0.t));
    if (px > worst.px) worst = { px, at: f1.t, a: f1.a };
  }
  return worst;
}

for (const fps of [60, 30] as const) {
  test(`B1: fast scrolling never makes the shoe jump or stick (${fps} fps)`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    // 30 fps is the cap on a slow device.
    await withProbe(page, { slowDevice: fps === 30 });
    await page.goto("/");
    await skipOnSoftwareWebGL(page);
    await expect
      .poll(async () => "intro-balls" in lastEnds(await readProbe(page)), {
        timeout: 60_000,
      })
      .toBe(true);

    const from = await page.evaluate(() => performance.now());
    await scrollHard(page, 10_000);
    await page.waitForTimeout(2000);
    const frames = (await readProbe(page)).frames.filter((f) => f.t >= from);
    // "Stopped" is when the page itself stops moving: smooth scrolling glides on after the wheel.
    const lastMove = frames.findLastIndex(
      (f, i) => i > 0 && f.scroll !== frames[i - 1]!.scroll,
    );
    const stopped = frames[lastMove]!.t;
    const screen = page.viewportSize()!;
    const viewport = screen.height;
    writeFileSync(
      test.info().outputPath("frames.json"),
      JSON.stringify(frames),
    );

    // Jumps: the shoe never moves more than 8% of the screen height per 1/60 s beyond the page's
    // own scroll.
    const jump = worstJump(frames, screen);
    const stalls = frames.filter(
      (f, i) => i > 0 && f.t - frames[i - 1]!.t > 100,
    ).length;
    console.log(
      `B1 ${fps} fps: worst jump ${jump.px.toFixed(1)} px per 1/60 s (limit ${(viewport * 0.08).toFixed(0)}) at a=${jump.a.toFixed(2)}, ${frames.length} frames, ${(frames.length / ((frames.at(-1)!.t - frames[0]!.t) / 1000)).toFixed(0)} fps measured, ${stalls} stalls over 100 ms`,
    );
    expect(jump.px).toBeLessThan(viewport * 0.08);

    // Sticking: half a second after the page stops, the shoe has settled (under 1 px a frame).
    const after = frames.filter((f) => f.t >= stopped + 500);
    const drift = worstJump(
      after.length > 1 ? after : frames.slice(-2),
      screen,
    );
    console.log(
      `B1 ${fps} fps: movement 0.5 s after stopping ${drift.px.toFixed(2)} px/frame`,
    );
    expect(drift.px).toBeLessThan(1);
  });
}

/** Waits for the intro and for every colourway's material (the thumbnails are rendered last). */
async function sceneReady(page: Page) {
  await expect
    .poll(async () => "intro-balls" in lastEnds(await readProbe(page)), {
      timeout: 60_000,
    })
    .toBe(true);
  await expect(page.locator("#grid .pimg img").first()).toBeAttached({
    timeout: 60_000,
  });
}

/** When the last run of the named timeline started and ended, and how long it took (ms). */
async function lastRun(page: Page, name: string) {
  await expect
    .poll(async () =>
      (await readProbe(page)).timelines.some(
        (t) => t.name === name && t.end !== undefined,
      ),
    )
    .toBe(true);
  const t = (await readProbe(page)).timelines
    .filter((t) => t.name === name && t.end !== undefined)
    .at(-1)!;
  return { start: t.start!, end: t.end!, ms: t.end! - t.start! };
}

test("B3: one click recolours everything within 1.2 s, with no flicker", async ({
  page,
}) => {
  await withProbe(page);
  await page.goto("/");
  await skipOnSoftwareWebGL(page);
  await sceneReady(page);

  const from = await page.evaluate(() => performance.now());
  await page.locator('#hero-dots .cdot[data-id="ember"]').click();
  const run = await lastRun(page, "colour-change");
  console.log(`B3 colour change: ${Math.round(run.ms)} ms`);
  expect(run.ms).toBeLessThanOrEqual(1200);

  // No flicker: the shoe's material switches exactly once, from the old colourway to the new.
  await page.waitForTimeout(300);
  const shown = (await readProbe(page)).frames
    .filter((f) => f.t >= from)
    .map((f) => f.colourway)
    .filter((c, i, all) => i === 0 || c !== all[i - 1]);
  expect(shown).toEqual(["lime", "ember"]);
});

test("B6: every micro-interaction finishes in under 600 ms", async ({
  page,
}) => {
  await withProbe(page);
  await page.goto("/");
  await skipOnSoftwareWebGL(page);
  await sceneReady(page);
  await page.locator("#add-btn").scrollIntoViewIfNeeded();

  // Size-error shake: adding to the bag without a size.
  await page.locator("#add-btn").click();
  const shake = await lastRun(page, "size-shake");
  // Wishlist pop.
  await page.locator("#pdp-wish").click();
  const pop = await lastRun(page, "wishlist-pop");
  // Add to bag: the thumbnail flies to the bag and the count pops.
  await page.locator('#pdp-sizes .size[data-s="9"]').click();
  await page.locator("#add-btn").click();
  const fly = await lastRun(page, "bag-fly");
  const count = await lastRun(page, "bag-count");
  const add = Math.max(fly.end, count.end) - Math.min(fly.start, count.start);

  console.log(
    `B6: size shake ${Math.round(shake.ms)} ms, wishlist pop ${Math.round(pop.ms)} ms, add to bag ${Math.round(add)} ms`,
  );
  expect(shake.ms).toBeLessThan(600);
  expect(pop.ms).toBeLessThan(600);
  expect(add).toBeLessThan(600);
});

test("B5: the hero character idles at 60 fps, follows the cursor and swings on a colour change", async ({
  page,
}) => {
  await withProbe(page);
  await page.goto("/");
  await skipOnSoftwareWebGL(page);
  await sceneReady(page);
  await expect
    .poll(async () => "character-loaded" in (await readProbe(page)).marks)
    .toBe(true);

  // 60 fps with the character idling in the hero (a 2022 mid-range laptop: this machine's Iris Xe).
  const from = await page.evaluate(() => performance.now());
  await page.waitForTimeout(3000);
  const frames = (await readProbe(page)).frames.filter((f) => f.t >= from);
  const gaps = frames
    .slice(1)
    .map((f, i) => f.t - frames[i]!.t)
    .sort((a, b) => a - b);
  const median = gaps[gaps.length >> 1]!;
  console.log(
    `B5: ${(1000 / median).toFixed(0)} fps (median frame ${median.toFixed(1)} ms) with the character`,
  );
  expect(median).toBeLessThan(18);

  // The head turns toward the cursor.
  const lookAt = async (x: number) => {
    await page.mouse.move(x, 360, { steps: 5 });
    await page.waitForTimeout(1000);
    return (await readProbe(page)).frames.at(-1)!.look!;
  };
  expect(await lookAt(1270)).toBeGreaterThan(0.2);
  expect(await lookAt(10)).toBeLessThan(-0.2);

  await page.screenshot({ path: test.info().outputPath("hero-character.png") });

  // A colour change plays the swing once, and the idle comes back (the swing clip may run ~7 s).
  await page.locator('#hero-dots .cdot[data-id="ember"]').click();
  await expect
    .poll(
      async () => {
        const m = (await readProbe(page)).marks;
        return m["character-swing-end"]! > m["character-swing-start"]!;
      },
      { timeout: 12_000 },
    )
    .toBe(true);
});
