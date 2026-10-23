// The hero athlete: the Figma AI still (licenses/hero-athlete-ai.md) made ready for the 3D scene.
//
//   pnpm assets:athlete   assets-src/athlete/athlete-raw.png → public/hero/athlete.webp
//                                                            + public/hero/athlete-depth.webp
//
// 1. The flat magenta backdrop is keyed out: alpha from how magenta each pixel is, and the soft edge
//    pixels have the backdrop's share removed and any magenta spill clamped, so no pink fringe.
// 2. A depth map is inflated from the silhouette: each pixel's distance from the edge, rounded with a
//    circular profile, so the torso bulges most, the limbs a little and the outline not at all. The
//    site displaces the photo by it (src/three/heroAthlete.ts), which gives it real parallax as it turns.
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const SRC = "assets-src/athlete/athlete-raw.png";
const OUT = "public/hero/athlete.webp";
const DEPTH = "public/hero/athlete-depth.webp";
/** Magenta-ness (min(R, B) - G) from fully kept to fully keyed out. */
const KEY = { lo: 40, hi: 150 };
/** Distance from the edge (px) at which the surface reaches full depth: about a torso's half-width. */
const INFLATE_PX = 90;

const { data, info } = await sharp(SRC)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;
const rgba = Buffer.alloc(w * h * 4);
for (let i = 0; i < w * h; i++) {
  const r = data[i * 3]!;
  const g = data[i * 3 + 1]!;
  const b = data[i * 3 + 2]!;
  const m = Math.min(r, b) - g;
  const a = 1 - Math.min(1, Math.max(0, (m - KEY.lo) / (KEY.hi - KEY.lo)));
  let [R, G, B] = [r, g, b];
  if (a > 0 && a < 1) {
    // observed = a * colour + (1 - a) * magenta
    R = (r - (1 - a) * 255) / a;
    G = g / a;
    B = (b - (1 - a) * 255) / a;
  }
  const spill = Math.min(R, B) - G;
  if (a > 0 && spill > 0) {
    R -= spill;
    B -= spill;
  }
  rgba.set(
    [R, G, B].map((v) => Math.max(0, Math.min(255, v))),
    i * 4,
  );
  rgba[i * 4 + 3] = Math.round(a * 255);
}

// Trim to the athlete, then derive the depth from the trimmed alpha.
const trimmed = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
  .png()
  .toBuffer()
  .then((png) =>
    sharp(png)
      .trim({ threshold: 1 })
      .raw()
      .toBuffer({ resolveWithObject: true }),
  );
const { width: tw, height: th } = trimmed.info;
mkdirSync("public/hero", { recursive: true });
await sharp(trimmed.data, { raw: { width: tw, height: th, channels: 4 } })
  .webp({ quality: 88, alphaQuality: 100, effort: 6 })
  .toFile(OUT);

// Distance to the nearest outside pixel: two-pass chamfer (3-4) distance transform.
const INF = 1e9;
const dist = new Float32Array(tw * th);
for (let i = 0; i < tw * th; i++)
  dist[i] = trimmed.data[i * 4 + 3]! > 127 ? INF : 0;
const at = (x: number, y: number) =>
  x < 0 || y < 0 || x >= tw || y >= th ? 0 : dist[y * tw + x]!;
for (let y = 0; y < th; y++)
  for (let x = 0; x < tw; x++) {
    const i = y * tw + x;
    if (!dist[i]) continue;
    dist[i] = Math.min(
      dist[i]!,
      at(x - 1, y) + 3,
      at(x, y - 1) + 3,
      at(x - 1, y - 1) + 4,
      at(x + 1, y - 1) + 4,
    );
  }
for (let y = th - 1; y >= 0; y--)
  for (let x = tw - 1; x >= 0; x--) {
    const i = y * tw + x;
    if (!dist[i]) continue;
    dist[i] = Math.min(
      dist[i]!,
      at(x + 1, y) + 3,
      at(x, y + 1) + 3,
      at(x + 1, y + 1) + 4,
      at(x - 1, y + 1) + 4,
    );
  }
const depth = Buffer.alloc(tw * th);
for (let i = 0; i < tw * th; i++) {
  const t = Math.min(1, dist[i]! / 3 / INFLATE_PX);
  depth[i] = Math.round(Math.sqrt(1 - (1 - t) ** 2) * 255);
}
await sharp(depth, { raw: { width: tw, height: th, channels: 1 } })
  .blur(3)
  .resize(Math.round(tw / 2))
  .webp({ quality: 90 })
  .toFile(DEPTH);

console.log(`Wrote ${OUT} and ${DEPTH} (${tw} × ${th})`);
