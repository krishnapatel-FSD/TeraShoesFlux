import { z } from "zod";
import data from "../../tokens/colourways.json";
import { THEME } from "@/styles/theme";
import { AA_NORMAL, contrastRatio } from "./contrast";

// tokens/colourways.json is the single source for colourway colours (A4): swatches, the highlight
// colour the site animates to, and the text colours used on it. Values are the prototype's.

const hex = z.string().regex(/^#[0-9a-f]{6}$/i, "expected #rrggbb");

const colourwayTokenSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name: z.string().min(1),
  /** The two swatch colours: knit and stripes. */
  shoe: z.strictObject({ knit: hex, stripes: hex }),
  /** The colour the hero and every accent animate to. */
  highlight: hex,
  /** Text and icons placed on the highlight colour. */
  onHighlight: hex,
  /** Hero headline and nav text over the hero. */
  heroInk: hex,
  /** Colour texture for the shoe, or the model's built-in material variant. */
  texture: z.string().optional(),
  gltfVariant: z.number().int().optional(),
});

const contrastPair = z.enum([
  "heroInk on highlight",
  "onHighlight on highlight",
  "highlight on ink",
]);

export const tokenFileSchema = z
  .strictObject({
    version: z.literal(1),
    colourways: z.array(colourwayTokenSchema).min(1),
    contrastWaivers: z.array(
      z.strictObject({
        colourway: z.string(),
        pair: contrastPair,
        reason: z.string().min(1),
      }),
    ),
  })
  .refine(
    (f) => new Set(f.colourways.map((c) => c.id)).size === f.colourways.length,
    {
      message: "colourway ids must be unique",
    },
  );

export type ColourwayToken = z.infer<typeof colourwayTokenSchema>;
export type ContrastPair = z.infer<typeof contrastPair>;

const file = tokenFileSchema.parse(data);
export const COLOURWAY_TOKENS: readonly ColourwayToken[] = file.colourways;
export const CONTRAST_WAIVERS = file.contrastWaivers;

export function colourwayToken(id: string): ColourwayToken {
  const t = COLOURWAY_TOKENS.find((c) => c.id === id);
  if (!t) throw new Error(`No colourway "${id}" in tokens/colourways.json`);
  return t;
}

/** Ink, the dark band and button colour the highlight sits on (theme `--ink`). */
export const INK = THEME.ink;

export interface ContrastResult {
  colourway: string;
  pair: ContrastPair;
  ratio: number;
  pass: boolean;
  waived: boolean;
}

/** WCAG AA (4.5:1) for every text pair a colourway puts on screen, with any recorded waiver. */
export function checkContrast(
  t: ColourwayToken,
  waivers = CONTRAST_WAIVERS,
): ContrastResult[] {
  const pairs: [ContrastPair, string, string][] = [
    ["heroInk on highlight", t.heroInk, t.highlight],
    ["onHighlight on highlight", t.onHighlight, t.highlight],
    ["highlight on ink", t.highlight, INK],
  ];
  return pairs.map(([pair, fg, bg]) => {
    const ratio = contrastRatio(fg, bg);
    const waived = waivers.some((w) => w.colourway === t.id && w.pair === pair);
    return { colourway: t.id, pair, ratio, pass: ratio >= AA_NORMAL, waived };
  });
}
