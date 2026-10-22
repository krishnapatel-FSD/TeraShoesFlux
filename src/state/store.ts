"use client";

import { useSyncExternalStore } from "react";

// The storefront's shared state, kept in one small store like the prototype's module variables.
// Components read slices with `useStore(selector)`; actions (src/state/actions.ts) write it.

export interface CartItem {
  key: string;
  /** Shopify cart line, when the bag is on Shopify. */
  lineId?: string;
  id: string;
  size: string;
  width: string;
  qty: number;
}

export interface StoreState {
  current: string;
  size: string | null;
  qty: number;
  width: string;
  cart: CartItem[];
  /** Shopify hosted checkout for the current bag. */
  checkoutUrl: string | null;
  wish: string[];
  filter: string;
  sortBy: string;
  /** Live renders of the 3D shoe per colourway (data URLs), made once the model loads. */
  thumbs: Record<string, string>;
  sizeMsg: string;
  menuOpen: boolean;
  drawerOpen: boolean;
  searchOpen: boolean;
  searchQuery: string;
  toast: { text: string; show: boolean };
}

let state: StoreState = {
  current: "lime",
  size: null,
  qty: 1,
  width: "Standard",
  cart: [],
  checkoutUrl: null,
  wish: [],
  filter: "all",
  sortBy: "featured",
  thumbs: {},
  sizeMsg: "",
  menuOpen: false,
  drawerOpen: false,
  searchOpen: false,
  searchQuery: "",
  toast: { text: "", show: false },
};
const initial = state;
const listeners = new Set<() => void>();

export function getState(): StoreState {
  return state;
}

export function setState(patch: Partial<StoreState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function useStore<T>(selector: (s: StoreState) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => selector(state),
    () => selector(initial),
  );
}
