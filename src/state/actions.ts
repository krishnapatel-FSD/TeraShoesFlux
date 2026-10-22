"use client";

import { isSoldOut, variantKey } from "@/lib/catalogue/types";
import {
  addCartLine,
  getCart,
  removeCartLine,
  updateCartLine,
  type ServerCart,
} from "@/lib/shopify/cart";
import { Flip, gsap, reduce } from "@/motion/gsap";
import { track } from "@/motion/probe";
import { getLenis, goTo } from "@/motion/SmoothScroll";
import { getStageApi } from "@/three/stageState";
import { activeCatalogue, money, productById } from "./catalogue";
import { getState, setState, type CartItem } from "./store";

// The prototype's behaviour, ported function by function. Animations that span several
// components address elements by the prototype's ids, exactly as the prototype script does.
// Data comes from the active catalogue (Shopify, or the prototype's until the store is connected).
// With Shopify the bag lives on Shopify's Cart API; without it, in localStorage as in the prototype.

const name = (id: string) => productById(id)?.name ?? id;
const onShopify = () => activeCatalogue().source === "shopify";

const $ = <T extends Element = HTMLElement>(s: string) =>
  document.querySelector<T>(s);

export const goToSection = goTo;

/* ---------- Persistence (localStorage, as the prototype) ---------- */
const storage = {
  get<T>(k: string, d: T): T {
    try {
      const v = localStorage.getItem(k);
      return v ? (JSON.parse(v) as T) : d;
    } catch {
      return d;
    }
  },
  set(k: string, v: unknown) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
};

/** Loads the saved bag and wishlist once the page is in the browser. */
export function hydrateFromStorage() {
  setState({
    wish: storage
      .get<string[]>("terashoes-wish", [])
      .filter((id) => productById(id)),
  });
  if (onShopify()) {
    getCart()
      .then((cart) => cart && applyServerCart(cart))
      .catch((e: unknown) => console.error("Couldn't load your bag", e));
  } else {
    setState({
      cart: storage
        .get<CartItem[]>("terashoes-cart", [])
        .filter((i) => i && productById(i.id)),
    });
  }
}

/* ---------- Colour wash from the click point ---------- */
function flood(tl: gsap.core.Timeline, color: string, x: number, y: number) {
  const f = $("#flood");
  if (!f) return;
  const R = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y),
  );
  f.style.background = color;
  gsap.killTweensOf(f);
  tl.fromTo(
    f,
    { opacity: 0.6, clipPath: `circle(0px at ${x}px ${y}px)` },
    {
      clipPath: `circle(${R}px at ${x}px ${y}px)`,
      duration: 0.7,
      ease: "expo.inOut",
    },
    0,
  ).to(f, { opacity: 0, duration: 0.5, ease: "power2.out" }, 0.5);
}

function countTo(
  el: HTMLElement | null,
  to: number,
  tl: gsap.core.Timeline | null,
) {
  if (!el) return;
  // The shown value is kept in data-value (prices may be "₹2,499", which doesn't parse as a number).
  const from = Number(el.dataset.value) || to;
  el.dataset.value = String(to);
  if (!tl) {
    el.textContent = money(to);
    return;
  }
  const o = { v: from };
  tl.to(
    o,
    {
      v: to,
      duration: 0.7,
      ease: "power3.out",
      onUpdate: () => {
        el.textContent = money(Math.round(o.v));
      },
    },
    0,
  );
}

/* ---------- Select a colourway ---------- */
// B3: one click recolours everything on one timeline that ends within 1.2 s (GB-2): the colour
// wash, price count-up, colour label, headline bounce, and the shoe's spin, material swap and ball
// bounce (added by the 3D stage). The page colours themselves change by a 0.9 s CSS transition.
export function select(
  id: string,
  animate = true,
  origin?: { x: number; y: number },
) {
  const p = productById(id);
  if (!p) return;
  const s = getState();
  const changed = id !== s.current;
  const st = document.documentElement.style;
  st.setProperty("--hl", p.hl);
  st.setProperty("--on-hl", p.on);
  st.setProperty("--hero-ink", p.hi);
  const tl = changed && !reduce ? gsap.timeline() : null;
  if (tl && animate && origin) flood(tl, p.hl, origin.x, origin.y);

  if (changed) {
    countTo($("#pdp-price"), p.price, tl);
    countTo($("#hero-price"), p.price, tl);
    tl?.fromTo(
      "#pdp-color",
      { "--mk": 0 },
      { "--mk": 1, duration: 0.8, ease: "expo.inOut" },
      0,
    );
  } else {
    for (const el of [$("#pdp-price"), $("#hero-price")]) {
      if (!el) continue;
      el.textContent = money(p.price);
      el.dataset.value = String(p.price);
    }
  }
  if (tl) {
    for (const word of ["#word-solid .ch", "#word-line .ch"]) {
      tl.fromTo(
        word,
        { yPercent: 0 },
        {
          keyframes: [
            { yPercent: -14, duration: 0.25, ease: "power2.out" },
            { yPercent: 0, duration: 0.6, ease: "bounce.out" },
          ],
          stagger: 0.035,
        },
        0,
      );
    }
  }
  // renderSizes(): a sold-out size can't stay selected.
  const size =
    s.size && isSoldOut(activeCatalogue(), p, s.size, s.width) ? null : s.size;
  setState({ current: id, size, sizeMsg: "" });
  if (changed) getStageApi()?.show(id, animate, tl ?? undefined);
  if (tl) track("colour-change", tl);
}

/* ---------- Product options ---------- */
export function pickSize(us: string) {
  setState({ size: us, sizeMsg: "" });
}

export function pickWidth(width: string) {
  setState({ width });
}

export function changeQty(delta: number) {
  setState({ qty: Math.min(5, Math.max(1, getState().qty + delta)) });
}

export function addCurrentToBag(from: HTMLElement) {
  const s = getState();
  if (!s.size) {
    setState({ sizeMsg: "Pick a size first." });
    track(
      "size-shake",
      gsap.fromTo(
        "#pdp-sizes",
        { x: -10 },
        { x: 0, duration: 0.5, ease: "elastic.out(1, .3)" },
      ),
    );
    return;
  }
  addToCart(s.current, s.size, s.qty, s.width, from);
}

/* ---------- Toast ---------- */
let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function toast(text: string) {
  setState({ toast: { text, show: true } });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(
    () => setState({ toast: { text: getState().toast.text, show: false } }),
    3000,
  );
}

/* ---------- Wishlist ---------- */
export function toggleWish(id: string, btn?: HTMLElement | null) {
  const wish = new Set(getState().wish);
  if (wish.has(id)) wish.delete(id);
  else wish.add(id);
  const list = [...wish];
  storage.set("terashoes-wish", list);
  setState({ wish: list });
  const on = wish.has(id);
  if (btn)
    track(
      "wishlist-pop",
      gsap.fromTo(
        btn,
        { scale: 0.6 },
        { scale: 1, duration: 0.5, ease: "elastic.out(1, .35)" },
      ),
    );
  toast(
    on
      ? `Saved Flux 01 ${name(id)} to your wishlist`
      : `Removed Flux 01 ${name(id)} from your wishlist`,
  );
}

export function showWishlist() {
  const { wish } = getState();
  if (!wish.length)
    return toast("Your wishlist is empty. Tap a heart to save a colourway.");
  setFilter("all");
  goToSection("#shop");
  toast(`Saved: ${wish.map(name).join(", ")}`);
}

/* ---------- Cart ---------- */
function saveCart(cart: CartItem[]) {
  if (!onShopify()) storage.set("terashoes-cart", cart);
  setState({ cart });
}

/** Mirrors Shopify's bag into the store (the drawer renders from it). */
function applyServerCart(cart: ServerCart) {
  setState({
    checkoutUrl: cart.checkoutUrl,
    cart: cart.lines
      .filter((l) => productById(l.colour))
      .map((l) => ({
        key: `${l.colour}|${l.size}|${l.width}`,
        lineId: l.lineId,
        id: l.colour,
        size: l.size,
        width: l.width,
        qty: l.qty,
      })),
  });
}

/** Sends a bag change to Shopify after the optimistic update; restores the bag if it fails. */
function syncWithShopify(
  before: CartItem[],
  request: () => Promise<ServerCart>,
) {
  request()
    .then(applyServerCart)
    .catch((e: unknown) => {
      console.error(e);
      setState({ cart: before });
      toast("Couldn't update your bag. Please try again.");
    });
}

export function addToCart(
  id: string,
  sz: string,
  n: number,
  wd: string,
  from?: HTMLElement | null,
) {
  const cat = activeCatalogue();
  const key = `${id}|${sz}|${wd}`;
  const before = getState().cart;
  const cart = before.map((i) => ({ ...i }));
  const ex = cart.find((i) => i.key === key);
  const added = ex ? Math.min(5, ex.qty + n) - ex.qty : n;
  if (ex) ex.qty += added;
  else cart.push({ key, id, size: sz, width: wd, qty: n });
  saveCart(cart);
  if (onShopify() && added > 0) {
    const variant =
      cat.variants[variantKey(id, sz, cat.widths.length ? wd : "")];
    if (variant) syncWithShopify(before, () => addCartLine(variant, added));
    else {
      setState({ cart: before });
      return toast("That size isn't available in this colour.");
    }
  }
  flyToBag(id, from);
  track(
    "bag-count",
    gsap.fromTo(
      "#bag-count",
      { scale: 1.8 },
      {
        scale: 1,
        // Pops as the flying thumbnail reaches the bag, so adding finishes within 0.6 s (B6).
        duration: 0.2,
        delay: reduce ? 0 : 0.35,
        ease: "elastic.out(1, .4)",
      },
    ),
  );
  toast(
    `Added Flux 01 ${name(id)} · ${cat.sizeSystem} ${sz}${wd === "Wide" ? " wide" : ""} to your bag`,
  );
}

function flyToBag(id: string, from?: HTMLElement | null) {
  const thumb = getState().thumbs[id];
  const bag = $("#bag-btn");
  if (reduce || !from || !thumb || !bag) return;
  const a = from.getBoundingClientRect();
  const b = bag.getBoundingClientRect();
  const sx = a.left + a.width / 2;
  const sy = a.top + a.height / 2;
  const ex = b.left + b.width / 2;
  const ey = b.top + b.height / 2;
  const img = document.createElement("img");
  img.className = "fly";
  img.src = thumb;
  img.alt = "";
  document.body.appendChild(img);
  gsap.set(img, { left: sx - 55, top: sy - 35 });
  const fly = gsap
    .timeline({ onComplete: () => img.remove() })
    .to(img, { x: ex - sx, duration: 0.5, ease: "power2.inOut" }, 0)
    .to(img, { y: ey - sy, duration: 0.5, ease: "back.in(1.6)" }, 0)
    .to(
      img,
      {
        scale: 0.2,
        rotate: -30,
        opacity: 0.3,
        duration: 0.5,
        ease: "power2.in",
      },
      0,
    );
  track("bag-fly", fly);
}

export function changeLineQty(key: string, delta: number) {
  const before = getState().cart;
  const line = before.find((i) => i.key === key);
  if (!line) return;
  const qty = Math.max(1, Math.min(5, line.qty + delta));
  if (qty === line.qty) return;
  saveCart(before.map((i) => (i.key === key ? { ...i, qty } : i)));
  if (onShopify() && line.lineId)
    syncWithShopify(before, () => updateCartLine(line.lineId!, qty));
}

export function removeLine(key: string, row?: HTMLElement | null) {
  const before = getState().cart;
  const line = before.find((i) => i.key === key);
  const go = () => {
    saveCart(getState().cart.filter((i) => i.key !== key));
    if (onShopify() && line?.lineId)
      syncWithShopify(before, () => removeCartLine(line.lineId!));
  };
  if (!reduce && row)
    gsap.to(row, {
      x: 80,
      opacity: 0,
      duration: 0.35,
      ease: "power2.in",
      onComplete: go,
    });
  else go();
}

export function cartTotals(cart: CartItem[], cat = activeCatalogue()) {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const sub = cart.reduce(
    (s, i) => s + (cat.products.find((p) => p.id === i.id)?.price ?? 0) * i.qty,
    0,
  );
  const left = Math.max(0, cat.freeShipping - sub);
  const ship =
    !cart.length || sub >= cat.freeShipping ? 0 : cat.standardShipping;
  return { count, sub, left, ship };
}

/** Shopify's hosted checkout; the prototype only shows a message. */
export function checkout() {
  const { checkoutUrl } = getState();
  if (onShopify() && checkoutUrl) window.location.assign(checkoutUrl);
  else
    toast(
      "Checkout is not part of this demo store. Your bag stays saved in this browser.",
    );
}

/* ---------- Drawer, search, menu ---------- */
let lastFocus: Element | null = null;

export function openDrawer() {
  lastFocus = document.activeElement;
  setState({ drawerOpen: true });
  getLenis()?.stop();
  if (!reduce)
    gsap.from("#items > *", {
      x: 40,
      opacity: 0,
      stagger: 0.06,
      duration: 0.6,
      ease: "expo.out",
      delay: 0.2,
    });
  setTimeout(() => $("#drawer-close")?.focus(), 50);
}

export function closeDrawer() {
  if (!getState().drawerOpen) return;
  setState({ drawerOpen: false });
  getLenis()?.start();
  (lastFocus as HTMLElement | null)?.focus?.();
}

export function openSearch() {
  setState({ searchOpen: true });
  setTimeout(() => $<HTMLInputElement>("#search-input")?.focus(), 60);
}

export function closeSearch() {
  if (getState().searchOpen) setState({ searchOpen: false });
}

export function openMenu() {
  if (!getState().menuOpen) setState({ menuOpen: true });
}

export function closeMenu() {
  if (getState().menuOpen) setState({ menuOpen: false });
}

/* ---------- Shop grid ---------- */
let pendingFlip: Flip.FlipState | null = null;

/** Captures the grid layout before a filter or sort change, for the FLIP animation. */
function captureGrid() {
  const cards = document.querySelectorAll("#grid .pcard");
  pendingFlip = !reduce && cards.length ? Flip.getState(cards) : null;
}

export function takePendingFlip() {
  const s = pendingFlip;
  pendingFlip = null;
  return s;
}

export function setFilter(filter: string) {
  if (filter === getState().filter) return;
  captureGrid();
  setState({ filter });
}

export function setSort(sortBy: string) {
  captureGrid();
  setState({ sortBy });
}

/* ---------- Search ---------- */
export function searchHits(q: string, cat = activeCatalogue()) {
  q = q.trim().toLowerCase();
  return cat.products.filter(
    (p) =>
      !q ||
      `${p.name} ${p.note} ${p.fam} ${p.badge || ""} ${p.fam.includes("dark") ? "black" : ""} ${p.id === "lime" ? "green" : ""}`
        .toLowerCase()
        .includes(q),
  );
}

export function sizeLabel(size: string | null, cat = activeCatalogue()) {
  const s = cat.sizes.find((o) => o.value === size);
  if (!size || !s) return "Select";
  return s.sub ? `${s.label} · ${s.sub}` : s.label;
}
