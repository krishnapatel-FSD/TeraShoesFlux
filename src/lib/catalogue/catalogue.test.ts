import { describe, expect, it } from "vitest";
import type { CatalogueQuery } from "@/lib/shopify/types/storefront.generated";
import { catalogueFromShopify } from "./fromShopify";
import { formatMoney } from "./money";
import { PROTOTYPE_CATALOGUE } from "./prototype";
import { isSoldOut } from "./types";

const money = (amount: string) => ({ amount, currencyCode: "INR" as const });

function variant(
  colour: string,
  size: string,
  price: string,
  available = true,
  was?: string,
) {
  return {
    id: `gid://shopify/ProductVariant/${colour}-${size}`,
    availableForSale: available,
    selectedOptions: [
      { name: "Colour", value: colour },
      { name: "Size", value: size },
    ],
    price: money(price),
    compareAtPrice: was ? money(was) : null,
  };
}

const fixture = {
  product: {
    id: "gid://shopify/Product/1",
    options: [
      { name: "Colour", optionValues: [{ name: "Lime" }, { name: "Coral" }] },
      { name: "Size", optionValues: [{ name: "8" }, { name: "9" }] },
    ],
    variants: {
      nodes: [
        variant("Lime", "8", "2499"),
        variant("Lime", "9", "2499", false),
        variant("Coral", "8", "1999", true, "2499"),
        variant("Coral", "9", "1999", true, "2499"),
      ],
    },
  },
  colourways: {
    nodes: [
      {
        handle: "coral",
        fields: [
          { key: "badge", value: "−20%" },
          { key: "rank", value: "0" },
        ],
      },
    ],
  },
  content: {
    nodes: [
      {
        fields: [
          { key: "free_shipping_threshold", value: "2999" },
          {
            key: "band_words",
            value: '["Free shipping over ₹2,999","60-day returns"]',
          },
        ],
      },
    ],
  },
  faq: {
    nodes: [
      {
        fields: [
          { key: "question", value: "B?" },
          { key: "answer", value: "b" },
          { key: "order", value: "2" },
        ],
      },
      {
        fields: [
          { key: "question", value: "A?" },
          { key: "answer", value: "a" },
          { key: "order", value: "1" },
        ],
      },
    ],
  },
} as unknown as CatalogueQuery;

describe("catalogueFromShopify", () => {
  const c = catalogueFromShopify(fixture);

  it("keeps the prototype design for colourways sold in Shopify, in rank order", () => {
    expect(c.products.map((p) => p.id)).toEqual(["coral", "lime"]);
    expect(c.products[1]!.hl).toBe("#34d27b");
  });

  it("takes prices, sale prices and currency from Shopify", () => {
    expect(c.currency).toBe("INR");
    expect(c.products.find((p) => p.id === "lime")).toMatchObject({
      price: 2499,
      was: undefined,
    });
    expect(c.products.find((p) => p.id === "coral")).toMatchObject({
      price: 1999,
      was: 2499,
      badge: "−20%",
    });
  });

  it("derives sold-out sizes from stock, without widths when only one is sold", () => {
    expect(c.widths).toEqual([]);
    const lime = c.products.find((p) => p.id === "lime")!;
    expect(lime.sold).toEqual(["9"]);
    expect(isSoldOut(c, lime, "9", "Standard")).toBe(true);
    expect(isSoldOut(c, lime, "8", "Standard")).toBe(false);
    expect(c.variants["lime|8|"]).toBe("gid://shopify/ProductVariant/Lime-8");
  });

  it("reads editable content and orders the FAQ", () => {
    expect(c.freeShipping).toBe(2999);
    expect(c.bandWords[0]).toBe("Free shipping over ₹2,999");
    expect(c.faq.map(([q]) => q)).toEqual(["A?", "B?"]);
    expect(c.hero.word).toBe(PROTOTYPE_CATALOGUE.hero.word);
  });

  it("fails clearly when the product isn't published", () => {
    expect(() => catalogueFromShopify({ ...fixture, product: null })).toThrow(
      /flux-01/,
    );
  });
});

describe("formatMoney", () => {
  it("keeps the prototype's dollar format", () => {
    expect(formatMoney(160, "USD")).toBe("$160");
    expect(formatMoney(128.5, "USD")).toBe("$128.50");
  });

  it("formats rupees with Indian grouping", () => {
    expect(formatMoney(2499, "INR")).toBe("₹2,499");
    expect(formatMoney(124999, "INR")).toBe("₹1,24,999");
  });
});
