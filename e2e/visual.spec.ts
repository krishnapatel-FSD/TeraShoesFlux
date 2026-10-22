import { expect, test, type Page } from "@playwright/test";

// Pixel-level guard for the prototype look (Plan A, Phase A-0): refactors such as moving colours
// and type sizes into the theme must not change a single pixel. WebGL is turned off (the hero then
// shows its recorded still, B8) and motion reduced, so screenshots are deterministic. The clock and time zone are fixed, so the live
// delivery estimate ("Order within 4 h 0 min…") always reads the same.
// Update baselines only for an approved visual change: pnpm test:e2e --update-snapshots

test.use({ timezoneId: "Asia/Kolkata" });

async function stillPage(page: Page) {
  await page.clock.setFixedTime(new Date("2026-10-21T11:00:00+05:30"));
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error narrowing the overloads is not needed for this stub
    HTMLCanvasElement.prototype.getContext = function (
      type: string,
      ...rest: unknown[]
    ) {
      if (type.startsWith("webgl")) return null;
      return (original as (...args: unknown[]) => unknown).apply(this, [
        type,
        ...rest,
      ]);
    };
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForFunction(
    () => document.documentElement.style.getPropertyValue("--hl") !== "",
  );
  await page.evaluate(() => document.fonts.ready);
  // Without WebGL the hero shows a still from the recorded scene and its thumbnails (B8).
  await expect(page.locator("#hero .hero-fallback")).toBeVisible();
  await page.waitForFunction(() =>
    [...document.images].every((i) => i.complete && i.naturalWidth > 0),
  );
}

/**
 * The whole page as numbered slices (name-1.png, name-2.png, …). One full-page capture of the tall
 * page at a phone's pixel ratio is more than Chrome captures at once, and the image wrapped around
 * (the hero repeated below the shop, the FAQ and footer missing), so each slice is a clip of it.
 */
async function expectWholePage(page: Page, name: string) {
  const SLICE = 2000;
  const { width, height } = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    height: document.documentElement.scrollHeight,
  }));
  for (let i = 0, y = 0; y < height; i++, y += SLICE)
    await expect(page, `${name}, slice ${i + 1}`).toHaveScreenshot(
      `${name}-${i + 1}.png`,
      {
        fullPage: true,
        clip: { x: 0, y, width, height: Math.min(SLICE, height - y) },
        maxDiffPixels: 0,
      },
    );
}

test("home page", async ({ page }) => {
  await stillPage(page);
  await expectWholePage(page, "home");
});

test("Obsidian colourway", async ({ page }) => {
  await stillPage(page);
  await page.locator('#hero-dots .cdot[aria-label="Obsidian"]').click();
  await expect(page.locator("#hero-color-name")).toHaveText("OBSIDIAN");
  await expectWholePage(page, "obsidian");
});

test("menu open", async ({ page }) => {
  await stillPage(page);
  await page.click("#menu-btn");
  await expect(page.locator("#menu")).toBeVisible();
  await expect(page).toHaveScreenshot("menu.png", { maxDiffPixels: 0 });
});

test("bag with an item", async ({ page }) => {
  await stillPage(page);
  await page.locator('#pdp-sizes .size[data-s="9"]').click();
  await page.click("#add-btn");
  await page.click("#bag-btn");
  await expect(page.locator("#drawer")).toHaveClass(/\bon\b/);
  await page.locator("#toast").evaluate((t) => t.classList.remove("show"));
  await expect(page).toHaveScreenshot("bag.png", { maxDiffPixels: 0 });
});

test("search results", async ({ page }) => {
  await stillPage(page);
  await page.keyboard.press("/");
  await expect(page.locator("#search-input")).toBeFocused();
  await page.keyboard.type("sale");
  await expect(page.locator("#results .result")).toHaveCount(1);
  await expect(page).toHaveScreenshot("search.png", { maxDiffPixels: 0 });
});
