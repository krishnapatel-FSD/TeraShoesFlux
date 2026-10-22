import "server-only";
import { z } from "zod";

// Shopify settings from the environment (.env.local; see .env.example and docs/TRD.md §12).
// Until the store exists these are empty, and the site runs on the prototype catalogue.
const schema = z.object({
  SHOPIFY_STORE_DOMAIN: z
    .string()
    .regex(/\.myshopify\.com$/, "expected <shop>.myshopify.com"),
  SHOPIFY_API_VERSION: z.string().regex(/^\d{4}-\d{2}$/),
  SHOPIFY_STOREFRONT_PRIVATE_TOKEN: z.string().min(1),
  SHOPIFY_WEBHOOK_SECRET: z.string().optional(),
});

export type ShopifyEnv = z.infer<typeof schema>;

let cached: ShopifyEnv | null | undefined;

/** The Shopify settings, or null when the store isn't configured yet. Throws if they are set but invalid. */
export function shopifyEnv(): ShopifyEnv | null {
  if (cached !== undefined) return cached;
  if (
    !process.env.SHOPIFY_STORE_DOMAIN ||
    !process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN
  ) {
    return (cached = null);
  }
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid Shopify settings in .env.local: ${parsed.error.message}`,
    );
  }
  return (cached = parsed.data);
}
