import { revalidateTag } from "next/cache";
import { CATALOGUE_TAG } from "@/lib/shopify/catalogue";
import { verifyShopifyHmac } from "@/lib/shopify/webhook";

// Shopify webhooks (products/*, inventory_levels/update, metaobjects/*) call this so stock,
// prices and editable content show without a redeploy (C2, C8). The setup script registers them.
export async function POST(request: Request) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret)
    return new Response("Webhook secret is not configured", { status: 503 });

  const body = await request.text();
  if (
    !verifyShopifyHmac(
      body,
      request.headers.get("x-shopify-hmac-sha256"),
      secret,
    )
  ) {
    return new Response("Invalid signature", { status: 401 });
  }

  // Serve the cached catalogue while it refreshes in the background.
  revalidateTag(CATALOGUE_TAG, "max");
  return Response.json({
    revalidated: true,
    topic: request.headers.get("x-shopify-topic"),
  });
}
