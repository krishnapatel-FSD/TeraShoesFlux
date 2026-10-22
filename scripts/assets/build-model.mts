// Builds the Flux 01 shoe the site ships (A2) from the prototype's sample model, Shopify's
// "Materials Variants Shoe" (CC BY 4.0, see licenses/). The product owner kept this model (A1) and
// its texture recolours (A3), so the model keeps its material variants, one colour texture per
// colourway sits next to it, and the result is written as glTF + external files so textures load
// lazily.
//
// A2's budget is under 3 MB: geometry is Meshopt-compressed, and the model's own textures are
// re-encoded as full-size WebP (EXT_texture_webp) at quality 88, which keeps them visually the same
// (38–42 dB PSNR against the originals). The colourway textures stay as the prototype's JPEGs.
//
//   pnpm assets:model     # writes public/3d/flux01/, then check it with pnpm assets:validate
import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import { PRODUCTS } from "../../src/data/catalogue.ts";
import { optimizeShoe } from "./optimize-shoe.mts";

const SRC = "prototype/assets";
const OUT = "public/3d/flux01";
const TEXTURE_QUALITY = 88;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
await optimizeShoe(`${SRC}/shoe.json`, `${OUT}/shoe.gltf`, {
  textureQuality: TEXTURE_QUALITY,
});
for (const p of PRODUCTS)
  if (p.tex) copyFileSync(`${SRC}/${p.tex}`, `${OUT}/${p.tex}`);
console.log(`Wrote ${OUT}/shoe.gltf, its textures and the colourway textures`);
