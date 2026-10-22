// Catalogue and copy from the prototype (prototype/index.html), character for character.
// The prototype is the reference: values here are final until the product owner changes them.

import { colourwayToken } from "@/lib/tokens";

export interface Product {
  id: string;
  name: string;
  note: string;
  price: number;
  /** Price before the sale, when on sale. */
  was?: number;
  badge?: string;
  /** Space-separated filter families: warm, cool, dark, sale. */
  fam: string;
  /** Colour texture for the shoe (files in public/3d/flux01/). */
  tex?: string;
  /** Material variant index in the model, used instead of `tex`. */
  gltf?: number;
  /** Swatch colours: knit and stripes. */
  a: string;
  b: string;
  /** hl = the colour the hero and every accent animate to; on = text on hl; hi = hero text colour */
  hl: string;
  on: string;
  hi: string;
  /** Sold-out US sizes. */
  sold: string[];
  /** Featured sort order. */
  rank: number;
}

/** Commerce and copy per colourway; colours and 3D sources come from tokens/colourways.json (A4). */
type Commerce = Pick<Product, "id" | "note" | "price" | "was" | "badge" | "fam" | "sold" | "rank">;
const COMMERCE: Commerce[] = [
  { id: "lime", note: "Lime knit · mint stripes", price: 160, badge: "New", fam: "cool", sold: ["12"], rank: 1 },
  { id: "ember", note: "Ember knit · glacier stripes", price: 160, badge: "New", fam: "warm", sold: ["7.5", "12"], rank: 2 },
  { id: "glacier", note: "Ice knit · ember stripes", price: 160, fam: "cool", sold: ["11"], rank: 3 },
  { id: "obsidian", note: "Black knit · ember stripes", price: 170, badge: "Limited", fam: "dark", sold: ["8", "10.5", "12"], rank: 4 },
  { id: "amber", note: "Amber knit · ink stripes", price: 160, fam: "warm", sold: [], rank: 5 },
  { id: "coral", note: "Coral knit · white sole", price: 128, was: 160, badge: "−20%", fam: "warm sale", sold: ["7", "8.5"], rank: 6 },
];

export const PRODUCTS: Product[] = COMMERCE.map((c) => {
  const t = colourwayToken(c.id);
  return {
    ...c,
    name: t.name,
    tex: t.texture,
    gltf: t.gltfVariant,
    a: t.shoe.knit,
    b: t.shoe.stripes,
    hl: t.highlight,
    on: t.onHighlight,
    hi: t.heroInk,
  };
});

export const byId: Record<string, Product> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

/** Men's US sizes with their EU equivalent. */
export const SIZES: [us: string, eu: string][] = [
  ["7", "40"], ["7.5", "40.5"], ["8", "41"], ["8.5", "42"], ["9", "42.5"],
  ["9.5", "43"], ["10", "44"], ["10.5", "44.5"], ["11", "45"], ["12", "46"],
];

export const FREE_SHIPPING = 150;

export const BAND_WORDS = [
  "Six colourways",
  "Free shipping over $150",
  "268 grams",
  "60-day returns",
  "8 mm drop",
  "Recycled knit",
  "800 km rated",
];

export const FAQ: [question: string, answer: string][] = [
  ["How does Flux 01 fit?", "True to size for most runners. With a wide forefoot, choose the Wide (2E) option. If you are between sizes or running marathons, go up half a size."],
  ["When will my order arrive?", "Orders placed before 3 pm on a weekday ship the same day. Standard delivery takes 2 to 4 business days and is free over $150. Express is $15."],
  ["How do returns work?", "You have 60 days to return any pair, even after running in them. Print the prepaid label from your order email and drop the box at any carrier point."],
  ["What is the $20 trade-in?", "Put any worn pair of running shoes in your return box within 30 days of delivery. Once they reach our recycler, we refund $20 to your card."],
];

export const TOUR_STEP_NAMES = ["Upper", "Foam", "Outsole", "Heel"];

export const money = (n: number) => "$" + (Number.isInteger(n) ? n : n.toFixed(2));
