// What `pnpm shopify:setup` loads into the Shopify store. Decisions (docs/Roadmap.md, Step 4):
// INR, India only, guest checkout, stock tracked by colour × size, width only if more than one is sold.
//
// Values set to `null` are WAITING FOR THE PRODUCT OWNER. The script refuses to run while any are
// null, unless it is run with --allow-placeholders against a development store (it then uses the
// prototype's numbers, clearly not real ₹ prices).

export interface ColourwayConfig {
  /** Must match a prototype colourway id (src/data/catalogue.ts) so the 3D design applies. */
  id: string;
  name: string;
  /** Price in ₹, GST included. */
  price: number | null;
  /** Price before a sale, in ₹, or null when not on sale. */
  compareAtPrice: number | null;
  note: string;
  badge: string;
  family: string;
  rank: number;
  /** Sizes with no stock (the rest get `stockPerSize`). */
  soldOut: string[];
}

export const storeConfig = {
  product: {
    handle: "flux-01",
    title: "Flux 01",
    productType: "Running shoes",
    vendor: "TeraShoes",
  },

  /** PENDING: "US" as in the prototype, or "UK" / "India", as Indian buyers mostly use. */
  sizeSystem: null as string | null,
  /** PENDING: the size range. Prototype: men's US 7–12. */
  sizes: null as string[] | null,
  /** Width becomes a variant only if more than one is sold, e.g. ["Standard", "Wide"]. PENDING. */
  widths: null as string[] | null,
  /** PENDING: units per size per colourway (sold-out sizes get 0). */
  stockPerSize: null as number | null,

  /** Prototype colourways with their copy. PENDING: prices in ₹. */
  colourways: [
    {
      id: "lime",
      name: "Lime",
      price: null,
      compareAtPrice: null,
      note: "Lime knit · mint stripes",
      badge: "New",
      family: "cool",
      rank: 1,
      soldOut: ["12"],
    },
    {
      id: "ember",
      name: "Ember",
      price: null,
      compareAtPrice: null,
      note: "Ember knit · glacier stripes",
      badge: "New",
      family: "warm",
      rank: 2,
      soldOut: ["7.5", "12"],
    },
    {
      id: "glacier",
      name: "Glacier",
      price: null,
      compareAtPrice: null,
      note: "Ice knit · ember stripes",
      badge: "",
      family: "cool",
      rank: 3,
      soldOut: ["11"],
    },
    {
      id: "obsidian",
      name: "Obsidian",
      price: null,
      compareAtPrice: null,
      note: "Black knit · ember stripes",
      badge: "Limited",
      family: "dark",
      rank: 4,
      soldOut: ["8", "10.5", "12"],
    },
    {
      id: "amber",
      name: "Amber",
      price: null,
      compareAtPrice: null,
      note: "Amber knit · ink stripes",
      badge: "",
      family: "warm",
      rank: 5,
      soldOut: [],
    },
    {
      id: "coral",
      name: "Coral",
      price: null,
      compareAtPrice: null,
      note: "Coral knit · white sole",
      badge: "−20%",
      family: "warm sale",
      rank: 6,
      soldOut: ["7", "8.5"],
    },
  ] satisfies ColourwayConfig[] as ColourwayConfig[],

  /** PENDING: in ₹, once delivery costs are known. */
  shipping: {
    freeShippingThreshold: null as number | null,
    standard: null as number | null,
    express: null as number | null,
  },

  /**
   * Editable copy (C8), from the prototype. The band and FAQ quote $ amounts; update them to ₹ when
   * the shipping numbers are confirmed (the product owner can also edit them later in Shopify).
   */
  content: {
    heroWord: "Tera Flux",
    heroTitle: "Flux 01",
    heroBody:
      "A knit trainer on poured foam. 268 g, 8 mm drop, rated for 800 km.",
    bandWords: [
      "Six colourways",
      "Free shipping over $150",
      "268 grams",
      "60-day returns",
      "8 mm drop",
      "Recycled knit",
      "800 km rated",
    ],
    faq: [
      [
        "How does Flux 01 fit?",
        "True to size for most runners. With a wide forefoot, choose the Wide (2E) option. If you are between sizes or running marathons, go up half a size.",
      ],
      [
        "When will my order arrive?",
        "Orders placed before 3 pm on a weekday ship the same day. Standard delivery takes 2 to 4 business days and is free over $150. Express is $15.",
      ],
      [
        "How do returns work?",
        "You have 60 days to return any pair, even after running in them. Print the prepaid label from your order email and drop the box at any carrier point.",
      ],
      [
        "What is the $20 trade-in?",
        "Put any worn pair of running shoes in your return box within 30 days of delivery. Once they reach our recycler, we refund $20 to your card.",
      ],
    ] as [string, string][],
  },
};

/** The prototype's numbers, used only with --allow-placeholders on a development store. */
export const PLACEHOLDERS = {
  sizeSystem: "US",
  sizes: ["7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "12"],
  widths: [] as string[],
  stockPerSize: 20,
  prices: {
    lime: [160, null],
    ember: [160, null],
    glacier: [160, null],
    obsidian: [170, null],
    amber: [160, null],
    coral: [128, 160],
  } as Record<string, [number, number | null]>,
  shipping: { freeShippingThreshold: 150, standard: 8, express: 15 },
};
