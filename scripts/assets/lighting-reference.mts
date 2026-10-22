// A6: checks the site's real-time lighting against a path-traced reference render.
//
//   pnpm dev                # in another terminal (the dev-only /dev/product-shot page)
//   pnpm assets:lighting    # writes assets-out/lighting/ (side-by-side sheets and numbers)
//
// 1. Exports the site's studio environment from three.js as an HDR (src/three/studioEquirect.ts).
// 2. Renders the site's own images of each shot (the product-photo studio, on this machine's GPU).
// 3. Renders the same shots in Blender Cycles under the same light rig (lighting_reference.py),
//    from the prototype's original model and textures.
// 4. Puts each pair side by side and measures how the site's shoe differs from the reference.
// Options: --base-url http://localhost:3000, --samples 128, --size 1024
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { SCENE } from "../../src/styles/theme.ts";
import { STUDIO_LIGHTS } from "../../src/three/shoeAssets.ts";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const baseUrl = flag("--base-url") ?? "http://localhost:3000";
const samples = Number(flag("--samples") ?? 128);
const size = Number(flag("--size") ?? 1024);
const OUT = resolve("assets-out/lighting");
const PAPER = "#eceef1"; // the site's page colour, behind each pair

const BLENDER =
  process.env.BLENDER ??
  "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe";
if (!existsSync(BLENDER)) {
  console.error(`Blender not found at ${BLENDER}. Set BLENDER to its path.`);
  process.exit(1);
}

const tokens = JSON.parse(readFileSync("tokens/colourways.json", "utf8")) as {
  colourways: {
    id: string;
    name: string;
    highlight: string;
    texture?: string;
    gltfVariant?: number;
  }[];
};
/** The model's built-in variants, in order (Coral is variant 1, "beach"). */
const VARIANT_TEXTURES = [
  "diffuseMidnight.jpg",
  "diffuseBeach.jpg",
  "diffuseStreet.jpg",
];
const VIEWS: Record<string, [number, number, number]> = {
  side: [0, 0, 0],
  front: [0, -Math.PI / 2, 0],
  top: [Math.PI / 2, 0, 0],
};
/** Every colourway from the side, plus the front and top of the first. */
const shots = [
  ...tokens.colourways.map((c) => ({ c, view: "side" })),
  { c: tokens.colourways[0]!, view: "front" },
  { c: tokens.colourways[0]!, view: "top" },
];

const linear = (hex: string) =>
  [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });

mkdirSync(OUT, { recursive: true });

/* ---------- 1–2. The site: studio HDR and its own renders ---------- */
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
const browser = await chromium.launch({
  args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"],
});
try {
  const page = await browser.newPage();
  await page.goto(new URL("/dev/product-shot", baseUrl).href);
  await page.waitForFunction(() => window.__studioHdr, null, {
    timeout: 120_000,
  });
  const W = 2048;
  const rgbe = Buffer.from(
    await page.evaluate((w) => window.__studioHdr!(w), W),
    "base64",
  );
  // Radiance files list rows top to bottom; WebGL read them bottom first.
  const rows: Buffer[] = [];
  for (let y = W / 2 - 1; y >= 0; y--)
    rows.push(rgbe.subarray(y * W * 4, (y + 1) * W * 4));
  writeFileSync(
    join(OUT, "studio.hdr"),
    Buffer.concat([
      Buffer.from(
        `#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${W / 2} +X ${W}\n`,
      ),
      ...rows,
    ]),
  );
  for (const { c, view } of shots) {
    const url = await page.evaluate(
      ([id, v]) => window.__productShot!(id, v as "side"),
      [c.id, view] as const,
    );
    await sharp(Buffer.from(url.slice(url.indexOf(",") + 1), "base64"))
      .resize(size, size)
      .toFile(join(OUT, `site-${c.id}-${view}.png`));
  }
} finally {
  await browser.close();
}
console.log("Site renders and studio.hdr written");

/* ---------- 3. The reference: Blender Cycles ---------- */
const modelDir = join(tmpdir(), "terashoes-lighting-model");
mkdirSync(modelDir, { recursive: true });
copyFileSync("prototype/assets/shoe.json", join(modelDir, "shoe.gltf"));
for (const f of readdirSync("prototype/assets").filter((f) =>
  f.endsWith(".jpg"),
))
  copyFileSync(join("prototype/assets", f), join(modelDir, f));

const config = {
  model: join(modelDir, "shoe.gltf"),
  textures: modelDir,
  hdr: join(OUT, "studio.hdr"),
  out: OUT,
  size,
  samples,
  envMapIntensity: STUDIO_LIGHTS.envMapIntensity,
  exposure: STUDIO_LIGHTS.exposure,
  lights: {
    key: { ...STUDIO_LIGHTS.key, colour: linear(SCENE.keyLight) },
    fill: { ...STUDIO_LIGHTS.fill, colour: linear(SCENE.fillLight) },
    rim: { ...STUDIO_LIGHTS.rim, colour: [1, 1, 1] },
  },
  hemi: {
    sky: linear(SCENE.hemiSky),
    ground: linear(SCENE.hemiGround),
    intensity: STUDIO_LIGHTS.hemi.intensity,
  },
  shots: shots.map(({ c, view }) => ({
    name: `${c.id}-${view}`,
    texture:
      c.gltfVariant !== undefined ? VARIANT_TEXTURES[c.gltfVariant] : c.texture,
    rim: linear(c.highlight),
    rotation: VIEWS[view],
  })),
};
const configFile = join(OUT, "blender-config.json");
writeFileSync(configFile, JSON.stringify(config, null, 2));
console.log(
  `Rendering ${shots.length} reference images in Cycles (${samples} samples)…`,
);
execFileSync(
  BLENDER,
  [
    "-b",
    "--factory-startup",
    "-P",
    "scripts/assets/lighting_reference.py",
    "--",
    configFile,
  ],
  { stdio: ["ignore", "ignore", "inherit"] },
);

/* ---------- 4. Side by side, and the numbers ---------- */
const label = (text: string) =>
  Buffer.from(
    `<svg width="${size}" height="64"><text x="24" y="44" font-family="Segoe UI, Arial" font-size="30" fill="#101216">${text}</text></svg>`,
  );
const onPaper = (file: string) =>
  sharp({
    create: { width: size, height: size, channels: 4, background: PAPER },
  })
    .composite([{ input: file }])
    .png()
    .toBuffer();

/** The shoe's pixels (opaque in both), as sRGB 0–1. */
async function shoePixels(file: string) {
  const { data } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return data;
}
const luminance = (r: number, g: number, b: number) =>
  0.2126 * r + 0.7152 * g + 0.0722 * b;

const results: Record<string, unknown>[] = [];
for (const { c, view } of shots) {
  const name = `${c.id}-${view}`;
  const ref = join(OUT, `ref-${name}.png`);
  const site = join(OUT, `site-${name}.png`);
  const [a, s] = await Promise.all([shoePixels(ref), shoePixels(site)]);
  let n = 0;
  let la = 0;
  let ls = 0;
  let diff = 0;
  for (let i = 0; i < a.length; i += 4) {
    if (a[i + 3]! < 250 || s[i + 3]! < 250) continue;
    const lr = luminance(a[i]!, a[i + 1]!, a[i + 2]!) / 255;
    const lt = luminance(s[i]!, s[i + 1]!, s[i + 2]!) / 255;
    la += lr;
    ls += lt;
    diff += Math.abs(lr - lt);
    n++;
  }
  results.push({
    shot: name,
    referenceBrightness: +(la / n).toFixed(3),
    siteBrightness: +(ls / n).toFixed(3),
    siteVsReference: `${(((ls - la) / la) * 100).toFixed(1)}%`,
    meanDifference: +(diff / n).toFixed(3),
  });
  await sharp({
    create: {
      width: size * 2,
      height: size + 64,
      channels: 4,
      background: "#ffffff",
    },
  })
    .composite([
      {
        input: label(`Reference (Cycles): ${c.name}, ${view}`),
        left: 0,
        top: 0,
      },
      { input: label("Site (real-time)"), left: size, top: 0 },
      { input: await onPaper(ref), left: 0, top: 64 },
      { input: await onPaper(site), left: size, top: 64 },
    ])
    .png()
    .toFile(join(OUT, `compare-${name}.png`));
}
writeFileSync(join(OUT, "results.json"), JSON.stringify(results, null, 2));
console.table(results);
console.log(`Side-by-side images: ${OUT}/compare-*.png`);
