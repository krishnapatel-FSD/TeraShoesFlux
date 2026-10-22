import { expect, test, type Page } from "@playwright/test";
import { writeFileSync } from "node:fs";

// B7 "Done when": with reduced motion on, nothing moves on its own. Every element's animatable
// styles are sampled twice, 3 s apart, with nobody touching the page; the 3D canvas (tennis balls,
// shoe) is compared pixel for pixel. Runs in the regular e2e projects (software WebGL is fine:
// this checks that nothing changes, not how fast).

const PROPS = [
  "transform",
  "translate",
  "rotate",
  "scale",
  "opacity",
  "clip-path",
  "border-radius",
  "background-position",
  "box-shadow",
  "letter-spacing",
] as const;

/** Every element's animatable styles, keyed by its position in the document. */
function sampleStyles(page: Page) {
  return page.evaluate((props) => {
    const out: Record<string, string> = {};
    const els = [...document.querySelectorAll("body *")];
    els.forEach((el, i) => {
      for (const pseudo of [null, "::before", "::after"]) {
        const cs = getComputedStyle(el, pseudo);
        if (pseudo && cs.content === "none") continue;
        const label = `${i} ${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${
          typeof el.className === "string" && el.className
            ? "." + el.className.trim().split(/\s+/).join(".")
            : ""
        }${pseudo ?? ""}`;
        out[label] = props.map((p) => cs.getPropertyValue(p)).join(" | ");
      }
    });
    return out;
  }, PROPS);
}

test("B7: with reduced motion on, nothing moves on its own", async ({
  page,
}) => {
  // Software WebGL at a phone's pixel ratio is slow to load and to screenshot.
  test.setTimeout(240_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced", {
    timeout: 60_000,
  });
  // Settled: fonts in, the 3D shoe loaded (the loader hides), thumbnails rendered.
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("#loader")).toBeHidden({ timeout: 60_000 });
  // The loader's one-off fade-out when the model arrives is a state change, not motion; at software
  // WebGL's few frames a second it can outlast the check above, so wait for it to end.
  await expect
    .poll(
      () =>
        page.locator("#loader").evaluate((l) => getComputedStyle(l).opacity),
      {
        timeout: 60_000,
      },
    )
    .toBe("0");
  await page.waitForTimeout(1500);

  // Canvas screenshots with the page's own layers hidden (no layout change, so the 3D positions are
  // unaffected): the compositor re-rasterises DOM edges slightly differently between captures.
  const canvas = page.locator("#gl canvas");
  const shootCanvas = () =>
    canvas.screenshot({
      style:
        "body * { visibility: hidden !important; } #gl, #gl * { visibility: visible !important; }",
    });
  const before = await sampleStyles(page);
  const shotBefore = await shootCanvas();
  await page.waitForTimeout(3000);
  const after = await sampleStyles(page);
  const shotAfter = await shootCanvas();

  const moved = Object.keys(before).filter((k) => before[k] !== after[k]);
  expect(
    moved.map((k) => `${k}\n  before: ${before[k]}\n  after:  ${after[k]}`),
  ).toEqual([]);
  if (!shotAfter.equals(shotBefore)) {
    writeFileSync(test.info().outputPath("canvas-before.png"), shotBefore);
    writeFileSync(test.info().outputPath("canvas-after.png"), shotAfter);
  }
  expect(shotAfter.equals(shotBefore), "the 3D canvas changed").toBe(true);
});
