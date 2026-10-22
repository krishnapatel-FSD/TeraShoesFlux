"use client";

import { createContext, use, useLayoutEffect, type ReactNode } from "react";
import { formatMoney } from "@/lib/catalogue/money";
import { PROTOTYPE_CATALOGUE } from "@/lib/catalogue/prototype";
import type { Catalogue } from "@/lib/catalogue/types";

// The catalogue reaches components through context, and the prototype-style action functions
// (src/state/actions.ts) and the 3D stage through `activeCatalogue()`.

const CatalogueContext = createContext<Catalogue>(PROTOTYPE_CATALOGUE);
let active: Catalogue = PROTOTYPE_CATALOGUE;

export function activeCatalogue(): Catalogue {
  return active;
}

export function CatalogueProvider({
  value,
  children,
}: {
  value: Catalogue;
  children: ReactNode;
}) {
  // Set before any child's passive effects run (the page script and the 3D stage use it).
  useLayoutEffect(() => {
    active = value;
  }, [value]);
  return <CatalogueContext value={value}>{children}</CatalogueContext>;
}

export function useCatalogue(): Catalogue {
  return use(CatalogueContext);
}

/** Price formatter for the current catalogue's currency. */
export function useMoney() {
  const { currency } = useCatalogue();
  return (n: number) => formatMoney(n, currency);
}

export function money(n: number) {
  return formatMoney(n, active.currency);
}

/** The colourway shown first: Lime, as in the prototype, or the first one sold. */
export function defaultProduct(c: Catalogue) {
  return c.products.find((p) => p.id === "lime") ?? c.products[0]!;
}

export function productById(id: string) {
  return active.products.find((p) => p.id === id);
}
