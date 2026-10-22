"use client";

import { useRef, type CSSProperties } from "react";
import { ThumbOrEmpty } from "@/components/store/Thumb";
import { Icon } from "@/components/ui/Icons";
import { useCatalogue, useMoney } from "@/state/catalogue";
import {
  cartTotals,
  checkout,
  changeLineQty,
  closeDrawer,
  closeSearch,
  goToSection,
  removeLine,
  searchHits,
  select,
} from "@/state/actions";
import { setState, useStore } from "@/state/store";

export function ToTop() {
  return (
    <button
      className="to-top"
      type="button"
      id="to-top"
      aria-label="Back to top"
      onClick={() => goToSection("#top")}
    >
      <Icon name="up" />
    </button>
  );
}

export function Scrim() {
  const on = useStore((s) => s.drawerOpen || s.searchOpen);
  return (
    <div
      className={`scrim${on ? " on" : ""}`}
      id="scrim"
      onClick={() => {
        closeDrawer();
        closeSearch();
      }}
    ></div>
  );
}

export function BagDrawer() {
  const open = useStore((s) => s.drawerOpen);
  const cart = useStore((s) => s.cart);
  const catalogue = useCatalogue();
  const money = useMoney();
  const { sub, left, ship } = cartTotals(cart, catalogue);
  const rows = useRef<Record<string, HTMLDivElement | null>>({});

  return (
    <aside
      className={`drawer${open ? " on" : ""}`}
      id="drawer"
      aria-label="Your bag"
      inert={!open}
    >
      <div className="drawer-head">
        <h2 className="display">Your bag</h2>
        <button
          className="icon-btn"
          type="button"
          id="drawer-close"
          aria-label="Close bag"
          onClick={closeDrawer}
        >
          <Icon name="x" />
        </button>
      </div>
      <div className="ship">
        <span id="ship-text">
          {!cart.length ? (
            `Free shipping on orders over ${money(catalogue.freeShipping)}`
          ) : left ? (
            <>
              Add <b>{money(left)}</b> more for free shipping
            </>
          ) : (
            <>
              You&apos;ve unlocked <b>free shipping</b>
            </>
          )}
        </span>
        <div className="ship-bar">
          <i
            id="ship-bar"
            style={{
              width: Math.min(100, (sub / catalogue.freeShipping) * 100) + "%",
            }}
          ></i>
        </div>
      </div>
      <div className="items" id="items" data-lenis-prevent>
        {cart.length ? (
          cart.map((i) => {
            const p = catalogue.products.find((x) => x.id === i.id);
            if (!p) return null;
            return (
              <div
                className="item"
                style={{ "--a": p.a } as CSSProperties}
                key={i.key}
                ref={(el) => void (rows.current[i.key] = el)}
              >
                <div className="thumb">
                  <ThumbOrEmpty id={i.id} />
                </div>
                <div>
                  <h4>
                    <span>Flux 01 {p.name}</span>
                    <span className="mono">{money(p.price * i.qty)}</span>
                  </h4>
                  <p>
                    {catalogue.sizeSystem} {i.size} · {i.width}
                    {p.was ? " · Sale" : ""}
                  </p>
                  <div className="row">
                    <div className="stepper" aria-label="Quantity">
                      <button
                        type="button"
                        data-dq={i.key}
                        data-d="-1"
                        aria-label="Decrease"
                        onClick={() => changeLineQty(i.key, -1)}
                      >
                        −
                      </button>
                      <output>{i.qty}</output>
                      <button
                        type="button"
                        data-dq={i.key}
                        data-d="1"
                        aria-label="Increase"
                        onClick={() => changeLineQty(i.key, 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="link-btn"
                      data-rm={i.key}
                      onClick={() => removeLine(i.key, rows.current[i.key])}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty">
            <p style={{ margin: 0 }}>Your bag is empty.</p>
            <a className="btn btn-dark" href="#shop" data-scroll data-close>
              Shop colourways
            </a>
          </div>
        )}
      </div>
      <div className="totals" id="totals">
        {cart.length ? (
          <>
            <div>
              <span>Subtotal</span>
              <span className="mono">{money(sub)}</span>
            </div>
            <div>
              <span>Shipping</span>
              <span className="mono">{ship ? money(ship) : "Free"}</span>
            </div>
            <div className="grand">
              <span>Total</span>
              <span className="mono">{money(sub + ship)}</span>
            </div>
            <button
              className="btn btn-dark"
              type="button"
              id="checkout"
              onClick={checkout}
            >
              Checkout
            </button>
          </>
        ) : null}
      </div>
    </aside>
  );
}

export function SearchPanel() {
  const open = useStore((s) => s.searchOpen);
  const query = useStore((s) => s.searchQuery);
  const catalogue = useCatalogue();
  const money = useMoney();
  const hits = searchHits(query, catalogue);
  const q = query.trim().toLowerCase();

  return (
    <div
      className={`search${open ? " on" : ""}`}
      id="search"
      role="dialog"
      aria-label="Search products"
      inert={!open}
    >
      <label htmlFor="search-input" className="sr">
        Search
      </label>
      <input
        id="search-input"
        type="search"
        placeholder="Search colours: lime, black, sale…"
        autoComplete="off"
        value={query}
        onChange={(e) => setState({ searchQuery: e.target.value })}
      />
      <div className="results" id="results">
        {hits.length ? (
          hits.map((p) => (
            <button
              type="button"
              className="result"
              data-id={p.id}
              style={{ "--a": p.a } as CSSProperties}
              key={p.id}
              onClick={() => {
                closeSearch();
                select(p.id, true, { x: innerWidth / 2, y: innerHeight / 2 });
                goToSection("#buy");
              }}
            >
              <span className="thumb">
                <ThumbOrEmpty id={p.id} />
              </span>
              <span>
                Flux 01 {p.name}
                <small>{p.note}</small>
              </span>
              <span className="mono">{money(p.price)}</span>
            </button>
          ))
        ) : (
          <p style={{ color: "var(--dim)", margin: "10px 6px" }}>
            No colourway matches “{q.replace(/[<>&"]/g, "")}”. Try lime, cool or
            sale.
          </p>
        )}
      </div>
    </div>
  );
}

export function Toast() {
  const { text, show } = useStore((s) => s.toast);
  return (
    <div
      className={`toast${show ? " show" : ""}`}
      id="toast"
      role="status"
      aria-live="polite"
    >
      <i>✓</i>
      <span id="toast-text">{text}</span>
    </div>
  );
}
