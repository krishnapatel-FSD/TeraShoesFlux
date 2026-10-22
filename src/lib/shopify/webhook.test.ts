import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyShopifyHmac } from "./webhook";

const secret = "shhh";
const body = JSON.stringify({ id: 1, inventory_item_id: 2, available: 0 });
const sign = (b: string, s = secret) =>
  createHmac("sha256", s).update(b, "utf8").digest("base64");

describe("verifyShopifyHmac", () => {
  it("accepts Shopify's signature of the raw body", () => {
    expect(verifyShopifyHmac(body, sign(body), secret)).toBe(true);
  });

  it("rejects a missing, wrong or tampered signature", () => {
    expect(verifyShopifyHmac(body, null, secret)).toBe(false);
    expect(verifyShopifyHmac(body, sign(body, "other"), secret)).toBe(false);
    expect(verifyShopifyHmac(body + " ", sign(body), secret)).toBe(false);
    expect(verifyShopifyHmac(body, "not-base64!", secret)).toBe(false);
  });
});
