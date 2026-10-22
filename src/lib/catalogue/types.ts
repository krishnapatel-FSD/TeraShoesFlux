import type { Product } from "@/data/catalogue";

// What the storefront renders: either the prototype's data (until Shopify is connected) or the
// store's data merged onto the prototype's colourway design (colours, textures).

export interface SizeOption {
  /** The Size option value in Shopify, e.g. "9". */
  value: string;
  /** Shown large on the size button. */
  label: string;
  /** Shown small under it, e.g. "EU 42.5". */
  sub: string;
}

export interface WidthOption {
  value: string;
  label: string;
}

export interface Catalogue {
  source: "prototype" | "shopify";
  /** ISO currency code for every price in the catalogue. */
  currency: string;
  products: Product[];
  /** Size system shown before sizes, e.g. "US" ("Size, men's US", "US 9"). */
  sizeSystem: string;
  sizes: SizeOption[];
  /** Empty when only one width is sold (the width picker is then hidden). */
  widths: WidthOption[];
  /** Variant IDs by `${colour}|${size}|${width}` (Shopify only). */
  variants: Record<string, string>;
  /** Available stock by `${colour}|${size}|${width}` (Shopify only). */
  available: Record<string, boolean>;
  freeShipping: number;
  standardShipping: number;
  hero: { word: string; title: string; body: string };
  bandWords: string[];
  faq: [question: string, answer: string][];
}

export const variantKey = (colour: string, size: string, width: string) =>
  `${colour}|${size}|${width}`;

/** Whether a size can't be bought in this colour (and width, when widths are sold). */
export function isSoldOut(
  c: Catalogue,
  p: Product,
  size: string,
  width: string,
): boolean {
  if (c.source === "prototype") return p.sold.includes(size);
  const w = c.widths.length ? width : "";
  return !c.available[variantKey(p.id, size, w)];
}
