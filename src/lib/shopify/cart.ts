"use server";

import { cookies } from "next/headers";
import { assertOk, storefront } from "./client";
import {
  CART_CREATE,
  CART_LINES_ADD,
  CART_LINES_REMOVE,
  CART_LINES_UPDATE,
  CART_QUERY,
} from "./queries";
import type {
  CartCreateMutation,
  CartFieldsFragment,
  CartLinesAddMutation,
  CartLinesRemoveMutation,
  CartLinesUpdateMutation,
  CartQuery,
} from "./types/storefront.generated";

// The bag on Shopify's Cart API (C5). The cart ID lives in an httpOnly cookie, so the bag survives
// a refresh; checkout is Shopify's hosted checkout at `checkoutUrl` (C6).

const COOKIE = "ts_cart";
const MAX_AGE = 60 * 60 * 24 * 30;

export interface CartLine {
  lineId: string;
  variantId: string;
  colour: string;
  size: string;
  width: string;
  qty: number;
}

export interface ServerCart {
  id: string;
  checkoutUrl: string;
  lines: CartLine[];
}

function toCart(cart: CartFieldsFragment): ServerCart {
  return {
    id: cart.id,
    checkoutUrl: cart.checkoutUrl,
    lines: cart.lines.nodes.flatMap((l) => {
      if (!("selectedOptions" in l.merchandise)) return [];
      const opt = Object.fromEntries(
        l.merchandise.selectedOptions.map((o) => [o.name, o.value]),
      );
      const attr = Object.fromEntries(
        l.attributes.map((a) => [a.key, a.value ?? ""]),
      );
      return [
        {
          lineId: l.id,
          variantId: l.merchandise.id,
          colour: (opt.Colour ?? "").toLowerCase(),
          size: opt.Size ?? "",
          width: opt.Width ?? attr.Width ?? "Standard",
          qty: l.quantity,
        },
      ];
    }),
  };
}

function check<T extends { userErrors: { message: string }[] }>(
  payload: T | null | undefined,
  what: string,
) {
  if (!payload) throw new Error(`Shopify ${what} returned nothing`);
  if (payload.userErrors.length)
    throw new Error(
      `Shopify ${what}: ${payload.userErrors.map((e) => e.message).join("; ")}`,
    );
  return payload;
}

async function remember(id: string) {
  (await cookies()).set(COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

/** The current bag, or null when there isn't one (or Shopify has expired it). */
export async function getCart(): Promise<ServerCart | null> {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id) return null;
  const data = assertOk(
    await storefront().request<CartQuery>(CART_QUERY, { variables: { id } }),
    "cart",
  );
  return data.cart ? toCart(data.cart) : null;
}

export async function addCartLine(
  variantId: string,
  quantity: number,
  width?: string,
): Promise<ServerCart> {
  const line = {
    merchandiseId: variantId,
    quantity,
    attributes: width ? [{ key: "Width", value: width }] : [],
  };
  const id = (await cookies()).get(COOKIE)?.value;
  if (id) {
    const res = await storefront().request<CartLinesAddMutation>(
      CART_LINES_ADD,
      { variables: { cartId: id, lines: [line] } },
    );
    const cart = check(
      assertOk(res, "add to bag").cartLinesAdd,
      "add to bag",
    ).cart;
    if (cart) return toCart(cart);
  }
  const res = await storefront().request<CartCreateMutation>(CART_CREATE, {
    variables: { lines: [line] },
  });
  const cart = check(assertOk(res, "create bag").cartCreate, "create bag").cart;
  if (!cart) throw new Error("Shopify create bag returned no cart");
  await remember(cart.id);
  return toCart(cart);
}

export async function updateCartLine(
  lineId: string,
  quantity: number,
): Promise<ServerCart> {
  const cartId = (await cookies()).get(COOKIE)?.value;
  if (!cartId) throw new Error("No bag to update");
  const res = await storefront().request<CartLinesUpdateMutation>(
    CART_LINES_UPDATE,
    {
      variables: { cartId, lines: [{ id: lineId, quantity }] },
    },
  );
  const cart = check(
    assertOk(res, "update bag").cartLinesUpdate,
    "update bag",
  ).cart;
  if (!cart) throw new Error("Shopify update bag returned no cart");
  return toCart(cart);
}

export async function removeCartLine(lineId: string): Promise<ServerCart> {
  const cartId = (await cookies()).get(COOKIE)?.value;
  if (!cartId) throw new Error("No bag to update");
  const res = await storefront().request<CartLinesRemoveMutation>(
    CART_LINES_REMOVE,
    {
      variables: { cartId, lineIds: [lineId] },
    },
  );
  const cart = check(
    assertOk(res, "remove from bag").cartLinesRemove,
    "remove from bag",
  ).cart;
  if (!cart) throw new Error("Shopify remove from bag returned no cart");
  return toCart(cart);
}
