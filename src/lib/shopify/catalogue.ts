import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { catalogueFromShopify } from "@/lib/catalogue/fromShopify";
import { PROTOTYPE_CATALOGUE } from "@/lib/catalogue/prototype";
import type { Catalogue } from "@/lib/catalogue/types";
import { assertOk, storefront } from "./client";
import { shopifyEnv } from "./env";
import { CATALOGUE_QUERY, PRODUCT_HANDLE } from "./queries";

/** Cache tag for products, stock and editable content; the Shopify webhook revalidates it. */
export const CATALOGUE_TAG = "shopify-catalogue";

/** The catalogue from Shopify, or the prototype's until the store is configured in .env.local. */
export async function getCatalogue(): Promise<Catalogue> {
  "use cache";
  cacheTag(CATALOGUE_TAG);
  // Webhooks refresh it straight away; this is the safety net if one is missed.
  cacheLife("minutes");
  if (!shopifyEnv()) return PROTOTYPE_CATALOGUE;
  const res = await storefront().request(CATALOGUE_QUERY, {
    variables: { handle: PRODUCT_HANDLE },
  });
  return catalogueFromShopify(assertOk(res, "catalogue"));
}
