import "server-only";
import {
  createStorefrontApiClient,
  type StorefrontApiClient,
} from "@shopify/storefront-api-client";
import { shopifyEnv } from "./env";

// Server-side Storefront API client (private token, never sent to the browser). Operations are
// typed by GraphQL Codegen from their `#graphql` strings (see .graphqlrc.ts and ./types).
let client: StorefrontApiClient | null = null;

export function storefront(): StorefrontApiClient {
  const env = shopifyEnv();
  if (!env) throw new Error("Shopify is not configured (.env.local)");
  client ??= createStorefrontApiClient({
    storeDomain: env.SHOPIFY_STORE_DOMAIN,
    apiVersion: env.SHOPIFY_API_VERSION,
    privateAccessToken: env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN,
  });
  return client;
}

/** Throws a readable error for GraphQL or user errors from a Storefront response. */
export function assertOk<T>(
  res: { data?: T; errors?: { message?: string } },
  what: string,
): T {
  if (res.errors || !res.data) {
    throw new Error(
      `Shopify ${what} failed: ${res.errors?.message ?? "no data"}`,
    );
  }
  return res.data;
}
