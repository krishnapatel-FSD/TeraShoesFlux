// A5: the TeraShoes logo as SVG files, outlined from the same Archivo font the site uses, at the
// prototype's logo settings (weight 900, width 125%, letter-spacing -0.01em; the "T" badge is a
// 28 px ink square, radius 9, rotated -8°, with a 15 px "T" in the Lime highlight colour).
//   pnpm brand:logo   (needs the font downloaded by `pnpm dev` or `pnpm build` in .next/static/media)
// Writes public/brand/logo.svg, public/brand/logo-mark.svg and src/app/icon.svg (the favicon).
import { create, openSync } from "fontkit";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { decompress } from "wawoff2";
import { colourwayToken } from "../../src/lib/tokens.ts";
import { THEME } from "../../src/styles/theme.ts";

const MEDIA = ".next/static/media";
const file = readdirSync(MEDIA)
  .filter((f) => f.endsWith(".woff2"))
  .find((f) => {
    const font = openSync(join(MEDIA, f));
    return (
      font.familyName.startsWith("Archivo") &&
      font.hasGlyphForCodePoint("T".codePointAt(0)!)
    );
  });
if (!file)
  throw new Error(
    `Archivo (latin) not found in ${MEDIA}: run pnpm dev or pnpm build first.`,
  );
// fontkit can only apply variations to TTF data, so the WOFF2 file is decompressed first.
const ttf = Buffer.from(await decompress(readFileSync(join(MEDIA, file))));
const font = create(ttf).getVariation({ wght: 900, wdth: 125 });

const INK = THEME.ink;
const HL = colourwayToken("lime").highlight;

/** Outlines `text` at `size` px with `tracking` em letter-spacing; returns path data and width. */
function outline(
  text: string,
  size: number,
  tracking: number,
  x0: number,
  baseline: number,
) {
  const scale = size / font.unitsPerEm;
  const run = font.layout(text);
  let x = x0;
  const parts: string[] = [];
  run.glyphs.forEach((g, i) => {
    const d = g.path.scale(scale, -scale).translate(x, baseline).toSVG();
    if (d) parts.push(d);
    x += run.positions[i]!.xAdvance * scale + tracking * size;
  });
  return { d: parts.join(""), width: x - x0 - tracking * size };
}

const capHeight = (size: number) => (font.capHeight * size) / font.unitsPerEm;

// Badge: 28×28, radius 9, rotated -8° around its centre, "T" centred.
const BADGE = 28;
const t = outline("T", 15, 0, 0, 0);
const tx = (BADGE - t.width) / 2;
const ty = (BADGE + capHeight(15)) / 2;
const tGlyph = outline("T", 15, 0, tx, ty);
const badge = (fill: string, ink: string) =>
  `<g transform="rotate(-8 ${BADGE / 2} ${BADGE / 2})"><rect width="${BADGE}" height="${BADGE}" rx="9" fill="${ink}"/><path d="${tGlyph.d}" fill="${fill}"/></g>`;

// Wordmark: 18 px, 10 px gap after the badge, vertically centred on it.
const word = outline(
  "TERASHOES",
  18,
  -0.01,
  BADGE + 10,
  (BADGE + capHeight(18)) / 2,
);
const pad = 2; // room for the rotated badge corners
const W = Math.ceil(BADGE + 10 + word.width + pad * 2);
const H = BADGE + pad * 2;
const header = (w: number, h: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="TeraShoes">`;

const logo = `${header(W, H)}${badge(HL, INK)}<path d="${word.d}" fill="${INK}"/></svg>\n`;
const mark = `${header(BADGE + pad * 2, H)}${badge(HL, INK)}</svg>\n`;

mkdirSync("public/brand", { recursive: true });
writeFileSync("public/brand/logo.svg", logo);
writeFileSync("public/brand/logo-mark.svg", mark);
writeFileSync("src/app/icon.svg", mark);
console.log(
  `Wrote public/brand/logo.svg (${W}×${H}), public/brand/logo-mark.svg and src/app/icon.svg`,
);
