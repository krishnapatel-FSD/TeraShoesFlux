import { ApiType, shopifyApiProject } from "@shopify/api-codegen-preset";

// GraphQL Codegen for Shopify. Schemas come from shopify.dev's public proxy, so types can be
// generated without store credentials. Run `pnpm codegen` after changing any `#graphql` operation.
export const SHOPIFY_API_VERSION = "2026-10";

const config = {
  projects: {
    // Storefront API operations used by the site (src/lib/shopify).
    storefront: shopifyApiProject({
      apiType: ApiType.Storefront,
      apiVersion: SHOPIFY_API_VERSION,
      documents: ["./src/lib/shopify/**/*.ts"],
      outputDir: "./src/lib/shopify/types",
      enumsAsConst: true,
    }),
    // Admin API operations used by the store setup script (scripts/shopify).
    admin: shopifyApiProject({
      apiType: ApiType.Admin,
      apiVersion: SHOPIFY_API_VERSION,
      documents: ["./scripts/shopify/**/*.mts"],
      outputDir: "./scripts/shopify/types",
      enumsAsConst: true,
    }),
  },
};

export default config;
