import { PRODUCTS, SIZES, type Product } from "@/data/catalogue";
import type { CatalogueQuery } from "@/lib/shopify/types/storefront.generated";
import { PROTOTYPE_CATALOGUE } from "./prototype";
import { variantKey, type Catalogue } from "./types";

// Maps the Storefront `Catalogue` query onto what the site renders. Shopify owns prices, stock,
// sizes, widths and copy; each colourway's design (swatch, highlight colours, 3D texture) stays the
// prototype's, matched by the Colour option value (e.g. "Lime" → "lime"). Model: Backend_Schema.md §2–3.

type Field = { key: string; value?: string | null };
const fieldMap = (fields: Field[] | undefined) =>
  Object.fromEntries((fields ?? []).map((f) => [f.key, f.value ?? ""]));

const EU_BY_US = Object.fromEntries(SIZES);

function list(value: string | undefined): string[] | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : null;
  } catch {
    return null;
  }
}

const num = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return value && Number.isFinite(n) ? n : fallback;
};

export function catalogueFromShopify(data: CatalogueQuery): Catalogue {
  const product = data.product;
  if (!product)
    throw new Error(
      'Shopify product "flux-01" not found or not published to the Headless channel',
    );

  const option = (name: string) =>
    product.options
      .find((o) => o.name === name)
      ?.optionValues.map((v) => v.name) ?? [];
  const sizeValues = option("Size");
  const widthValues = option("Width");
  const hasWidths = widthValues.length > 1;

  const variants: Record<string, string> = {};
  const available: Record<string, boolean> = {};
  const prices: Record<string, { price: number; was?: number }> = {};
  let currency = "";
  for (const v of product.variants.nodes) {
    const opt = Object.fromEntries(
      v.selectedOptions.map((o) => [o.name, o.value]),
    );
    const colour = (opt.Colour ?? "").toLowerCase();
    const size = opt.Size ?? "";
    const width = hasWidths ? (opt.Width ?? "") : "";
    const key = variantKey(colour, size, width);
    variants[key] = v.id;
    available[key] = v.availableForSale;
    currency ||= v.price.currencyCode;
    const price = Number(v.price.amount);
    const was = v.compareAtPrice ? Number(v.compareAtPrice.amount) : undefined;
    const prev = prices[colour];
    if (!prev || price < prev.price)
      prices[colour] = { price, was: was && was > price ? was : undefined };
  }

  const merch = Object.fromEntries(
    data.colourways.nodes.map((n) => [n.handle, fieldMap(n.fields)]),
  );
  const products: Product[] = PRODUCTS.filter((p) => prices[p.id]).map((p) => {
    const m = merch[p.id] ?? {};
    const sold = sizeValues.filter((s) =>
      (hasWidths ? widthValues : [""]).every(
        (w) => !available[variantKey(p.id, s, w)],
      ),
    );
    return {
      ...p,
      price: prices[p.id]!.price,
      was: prices[p.id]!.was,
      sold,
      note: m.note || p.note,
      badge: m.badge === undefined ? p.badge : m.badge || undefined,
      fam: m.family || p.fam,
      rank: num(m.rank, p.rank),
    };
  });
  products.sort((a, b) => a.rank - b.rank);

  const content = fieldMap(data.content.nodes[0]?.fields);
  const faq = data.faq.nodes
    .map((n) => fieldMap(n.fields))
    .sort((a, b) => num(a.order, 0) - num(b.order, 0))
    .map((f): [string, string] => [f.question ?? "", f.answer ?? ""])
    .filter(([q]) => q);
  const proto = PROTOTYPE_CATALOGUE;

  return {
    source: "shopify",
    currency: currency || "INR",
    products,
    sizeSystem: content.size_system || proto.sizeSystem,
    sizes: sizeValues.map((s) => ({
      value: s,
      label: s,
      sub: EU_BY_US[s] ? `EU ${EU_BY_US[s]}` : "",
    })),
    widths: hasWidths
      ? widthValues.map((w) => ({
          value: w,
          label: w === "Wide" ? "Wide (2E)" : w,
        }))
      : [],
    variants,
    available,
    freeShipping: num(content.free_shipping_threshold, proto.freeShipping),
    standardShipping: num(content.standard_shipping, proto.standardShipping),
    hero: {
      word: content.hero_word || proto.hero.word,
      title: content.hero_title || proto.hero.title,
      body: content.hero_body || proto.hero.body,
    },
    bandWords: list(content.band_words) ?? proto.bandWords,
    faq: faq.length ? faq : proto.faq,
  };
}
