import { createHmac, timingSafeEqual } from "node:crypto";

/** True when `hmacHeader` (X-Shopify-Hmac-Sha256) is the base64 HMAC-SHA256 of the raw body. */
export function verifyShopifyHmac(
  rawBody: string,
  hmacHeader: string | null,
  secret: string,
): boolean {
  if (!hmacHeader) return false;
  const expected = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest();
  let given: Buffer;
  try {
    given = Buffer.from(hmacHeader, "base64");
  } catch {
    return false;
  }
  return given.length === expected.length && timingSafeEqual(given, expected);
}
