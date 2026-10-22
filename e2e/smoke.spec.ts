import { expect, test, type Page } from "@playwright/test";

/** Waits until React has hydrated and the page script has run (it sets the colourway variables). */
async function ready(page: Page) {
  await page.goto("/");
  await page.waitForFunction(
    () => document.documentElement.style.getPropertyValue("--hl") !== "",
  );
}

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  return errors;
}

test("renders the prototype's sections and loads the 3D shoe", async ({
  page,
}) => {
  const errors = collectErrors(page);
  await ready(page);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Flux 01",
  );
  // The 3D chunk loads after the page; software WebGL in CI makes it slow.
  await expect(page.locator("canvas")).toHaveCount(1, { timeout: 60_000 });
  for (const id of ["hero", "tour", "buy", "shop", "faq"]) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
  // The loader hides once the model and the selected colourway's texture have loaded.
  await expect(page.locator("#loader")).toBeHidden({ timeout: 60_000 });
  // Shop cards switch from shimmer to live renders of the shoe.
  await expect(page.locator("#grid .pimg img")).toHaveCount(6, {
    timeout: 60_000,
  });
  expect(errors).toEqual([]);
});

test("picking a colourway recolours the site and updates the product", async ({
  page,
}) => {
  const errors = collectErrors(page);
  await ready(page);
  const hl = () =>
    page.evaluate(() =>
      document.documentElement.style.getPropertyValue("--hl"),
    );

  await page.locator('#hero-dots .cdot[aria-label="Obsidian"]').click();
  await expect(
    page.locator('#hero-dots .cdot[aria-label="Obsidian"]'),
  ).toHaveAttribute("aria-pressed", "true");
  expect(await hl()).toBe("#2b3038");
  await expect(page.locator("#hero-color-name")).toHaveText("OBSIDIAN");
  await expect(page.locator("#pdp-color")).toHaveText("Obsidian");
  await expect(page.locator("#hero-price")).toHaveText("$170");
  expect(errors).toEqual([]);
});

test("adding to the bag needs a size, then fills the bag", async ({ page }) => {
  await ready(page);
  await page.click("#add-btn");
  await expect(page.locator("#size-msg")).toHaveText("Pick a size first.");
  await page.locator('#pdp-sizes .size[data-s="9"]').click();
  await page.click("#add-btn");
  await expect(page.locator("#bag-count")).toHaveText("1");
  await expect(page.locator("#toast")).toHaveClass(/\bshow\b/);
  await page.click("#bag-btn");
  await expect(page.locator("#drawer")).toHaveClass(/\bon\b/);
  await expect(page.locator("#scrim")).toHaveClass(/\bon\b/);
  await expect(page.locator("#items .item")).toHaveCount(1);
  await expect(page.locator("#ship-text")).toContainText("free shipping");
});

test("pressing / opens search, which filters the colourways", async ({
  page,
}) => {
  await ready(page);
  await page.keyboard.press("/");
  await expect(page.locator("#search")).toHaveClass(/\bon\b/);
  await page.keyboard.type("sale");
  await expect(page.locator("#results .result")).toHaveCount(1);
  await expect(page.locator("#results .result")).toContainText("Coral");
  await page.keyboard.press("Escape");
  await expect(page.locator("#search")).not.toHaveClass(/\bon\b/);
});

test("sold-out sizes can't be picked", async ({ page }) => {
  await ready(page);
  await expect(page.locator('#pdp-sizes .size[data-s="12"]')).toBeDisabled(); // Lime is sold out in 12
});

test("filters and sort reorder the shop grid", async ({ page }) => {
  await ready(page);
  await page.locator('#filters .fchip[data-f="sale"]').click();
  await expect(page.locator("#count")).toHaveText("1 product");
  await page.locator('#filters .fchip[data-f="all"]').click();
  await page.selectOption("#sort", "low");
  await expect(page.locator("#grid .pcard").first()).toHaveAttribute(
    "data-id",
    "coral",
  );
});

test("without WebGL the hero shows the recorded scene (B8), with no errors", async ({
  page,
}) => {
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
  const errors = collectErrors(page);
  await ready(page);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Flux 01",
  );
  await expect(page.locator("#hero-dots")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  // The recording takes the 3D canvas's place, and the scene's thumbnails fill the swatches and cards.
  await expect(page.locator("#hero .hero-fallback")).toBeVisible();
  await expect(page.locator("#loader")).toBeHidden();
  const thumbs = page.locator("#grid .pimg img");
  await expect(thumbs.first()).toBeVisible();
  await expect
    .poll(() =>
      thumbs.evaluateAll((imgs) =>
        (imgs as HTMLImageElement[]).every(
          (i) => i.complete && i.naturalWidth > 0,
        ),
      ),
    )
    .toBe(true);
  expect(errors).toEqual([]);
});
