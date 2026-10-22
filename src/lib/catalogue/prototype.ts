import {
  BAND_WORDS,
  FAQ,
  FREE_SHIPPING,
  PRODUCTS,
  SIZES,
} from "@/data/catalogue";
import type { Catalogue } from "./types";

/** The prototype's catalogue and copy, used until Shopify is connected. */
export const PROTOTYPE_CATALOGUE: Catalogue = {
  source: "prototype",
  currency: "USD",
  products: PRODUCTS,
  sizeSystem: "US",
  sizes: SIZES.map(([us, eu]) => ({ value: us, label: us, sub: `EU ${eu}` })),
  widths: [
    { value: "Standard", label: "Standard" },
    { value: "Wide", label: "Wide (2E)" },
  ],
  variants: {},
  available: {},
  freeShipping: FREE_SHIPPING,
  standardShipping: 8,
  hero: {
    word: "Tera Flux",
    title: "Flux 01",
    body: "A knit trainer on poured foam. 268 g, 8 mm drop, rated for 800 km.",
  },
  bandWords: BAND_WORDS,
  faq: FAQ,
};
