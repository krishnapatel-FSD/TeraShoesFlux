// A9: product photos of Flux 01 rendered from the 3D scene, with the site's lighting and materials.
// Four views (side, front, top, sole) per colourway, 2048 × 2048 PNG with a transparent background.
//
//   pnpm dev                       # in another terminal: the photos come from /dev/product-shot
//   pnpm assets:images             # writes assets-out/product-images/flux01-{colourway}-{view}.png
//   pnpm assets:images --upload    # also uploads them to the Shopify product (see shopify/admin.mts)
//
// Options: --base-url http://localhost:3000, --only lime,ember
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const VIEWS = ["side", "front", "top", "sole"] as const;
const OUT_DIR = "assets-out/product-images";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const upload = args.includes("--upload");
const baseUrl = flag("--base-url") ?? "http://localhost:3000";
// PowerShell passes "a,b" as "a b", so accept either separator.
const only = flag("--only")?.split(/[\s,]+/);

const tokens = JSON.parse(readFileSync("tokens/colourways.json", "utf8")) as {
  colourways: { id: string; name: string }[];
};
const colourways = tokens.colourways.filter(
  (c) => !only || only.includes(c.id),
);

export interface Photo {
  colourway: { id: string; name: string };
  view: (typeof VIEWS)[number];
  file: string;
  alt: string;
}

/* ---------- Render ---------- */
const reachable = await fetch(baseUrl).then(
  (r) => r.ok,
  () => false,
);
if (!reachable) {
  console.error(
    `No dev server at ${baseUrl}. Start it with \`pnpm dev\` first.`,
  );
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });
const browser = await chromium.launch({
  // Software WebGL, so this also runs on machines and CI runners without a GPU.
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const photos: Photo[] = [];
try {
  const page = await browser.newPage();
  await page.goto(new URL("/dev/product-shot", baseUrl).href);
  await page.waitForFunction(
    () => window.__productShot || document.body.innerText.includes("Failed"),
    null,
    {
      timeout: 120_000,
    },
  );
  const status = await page.locator("#product-shot-status").innerText();
  if (!status.startsWith("Ready")) throw new Error(`Photo studio: ${status}`);

  for (const colourway of colourways) {
    for (const view of VIEWS) {
      const dataUrl = await page.evaluate(
        ([id, v]) => window.__productShot!(id, v),
        [colourway.id, view] as const,
      );
      const file = join(OUT_DIR, `flux01-${colourway.id}-${view}.png`);
      writeFileSync(
        file,
        Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64"),
      );
      photos.push({
        colourway,
        view,
        file,
        alt: `Flux 01 ${colourway.name}, ${view} view`,
      });
      console.log(`  ${file}`);
    }
  }
} finally {
  await browser.close();
}
console.log(`Rendered ${photos.length} photos into ${OUT_DIR}/`);

if (upload) {
  const { uploadPhotos } = await import("../shopify/upload-media.mts");
  await uploadPhotos(
    photos.map((p) => ({ ...p, size: statSync(p.file).size })),
  );
}
