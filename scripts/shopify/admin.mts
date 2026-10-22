// Shared Admin API client for the store scripts (`pnpm shopify:setup`, `pnpm assets:images --upload`).
//
// Needs in .env.local: SHOPIFY_STORE_DOMAIN, SHOPIFY_API_VERSION and either
//   SHOPIFY_ADMIN_CLIENT_ID + SHOPIFY_ADMIN_CLIENT_SECRET  (Dev Dashboard app, recommended), or
//   SHOPIFY_ADMIN_TOKEN                                    (an existing static Admin API token).
// With a client ID and secret, a 24-hour access token is requested with the client credentials
// grant each time a script runs (the app and the store must be in the same organization).
import { createAdminApiClient } from "@shopify/admin-api-client";
import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export async function adminClient() {
  const {
    SHOPIFY_STORE_DOMAIN: storeDomain,
    SHOPIFY_API_VERSION: apiVersion,
    SHOPIFY_ADMIN_TOKEN,
    SHOPIFY_ADMIN_CLIENT_ID,
    SHOPIFY_ADMIN_CLIENT_SECRET,
  } = process.env;
  if (
    !storeDomain ||
    !apiVersion ||
    !(
      SHOPIFY_ADMIN_TOKEN ||
      (SHOPIFY_ADMIN_CLIENT_ID && SHOPIFY_ADMIN_CLIENT_SECRET)
    )
  ) {
    console.error(
      "Set SHOPIFY_STORE_DOMAIN, SHOPIFY_API_VERSION and SHOPIFY_ADMIN_CLIENT_ID + " +
        "SHOPIFY_ADMIN_CLIENT_SECRET (or SHOPIFY_ADMIN_TOKEN) in .env.local first.",
    );
    process.exit(1);
  }
  const accessToken =
    SHOPIFY_ADMIN_TOKEN ||
    (await clientCredentialsToken(
      storeDomain,
      SHOPIFY_ADMIN_CLIENT_ID!,
      SHOPIFY_ADMIN_CLIENT_SECRET!,
    ));
  return createAdminApiClient({ storeDomain, apiVersion, accessToken });
}

async function clientCredentialsToken(
  storeDomain: string,
  clientId: string,
  clientSecret: string,
) {
  const res = await fetch(`https://${storeDomain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Could not get an Admin API token (${res.status}). Check the client ID and secret, and that ` +
        "the app is installed on this store in the same organization.",
    );
  }
  const { access_token } = (await res.json()) as { access_token?: string };
  if (!access_token) throw new Error("Shopify returned no access token.");
  return access_token;
}

/** Awaits an Admin API call and returns its data, or throws with the GraphQL errors. */
export async function run<T>(
  what: string,
  call: Promise<{
    data?: T;
    errors?: { message?: string; graphQLErrors?: unknown };
  }>,
): Promise<T> {
  const res = await call;
  if (res.errors || !res.data) {
    throw new Error(
      `${what}: ${res.errors?.message ?? "no data"} ${JSON.stringify(res.errors?.graphQLErrors ?? "")}`,
    );
  }
  return res.data;
}

/** Throws if a mutation returned user errors. */
export function userErrors(
  what: string,
  errors: { message: string; field?: string[] | null }[] | undefined,
) {
  if (errors?.length)
    throw new Error(
      `${what}: ${errors.map((e) => `${e.field?.join(".") ?? ""} ${e.message}`).join("; ")}`,
    );
}
