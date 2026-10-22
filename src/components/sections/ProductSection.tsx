"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { ThumbImg } from "@/components/store/Thumb";
import { AccordionItem } from "@/components/ui/Accordion";
import { Icon } from "@/components/ui/Icons";
import { isSoldOut } from "@/lib/catalogue/types";
import { defaultProduct, useCatalogue, useMoney } from "@/state/catalogue";
import {
  addCurrentToBag,
  changeQty,
  pickSize,
  pickWidth,
  select,
  sizeLabel,
  toggleWish,
} from "@/state/actions";
import { useStore } from "@/state/store";

/** Delivery estimate with a live cutoff countdown (3 pm local, weekdays). */
function eta() {
  const now = new Date();
  const isWk = (d: Date) => ![0, 6].includes(d.getDay());
  const ship = new Date(now);
  ship.setHours(15, 0, 0, 0);
  if (now >= ship || !isWk(ship)) {
    do ship.setDate(ship.getDate() + 1);
    while (!isWk(ship));
  }
  const arrive = new Date(ship);
  let add = 2;
  while (add) {
    arrive.setDate(arrive.getDate() + 1);
    if (isWk(arrive)) add--;
  }
  const ms = ship.getTime() - now.getTime();
  const h = Math.floor(ms / 3.6e6);
  const m = Math.floor((ms % 3.6e6) / 6e4);
  return {
    title: `Arrives ${arrive.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`,
    sub:
      h < 24
        ? `Order within ${h ? h + " h " : ""}${m} min to ship ${ship.getDate() === now.getDate() ? "today" : "on " + ship.toLocaleDateString("en-US", { weekday: "long" })}. Free over $150.`
        : `Ships ${ship.toLocaleDateString("en-US", { weekday: "long" })}. Free over $150.`,
  };
}

function useEta() {
  const [value, setValue] = useState({
    title: "Free delivery over $150",
    sub: "Order before 3 pm to ship today.",
  });
  useEffect(() => {
    const update = () => setValue(eta());
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, []);
  return value;
}

export function ProductSection() {
  const current = useStore((s) => s.current);
  const size = useStore((s) => s.size);
  const width = useStore((s) => s.width);
  const qty = useStore((s) => s.qty);
  const sizeMsg = useStore((s) => s.sizeMsg);
  const wished = useStore((s) => s.wish.includes(s.current));
  const delivery = useEta();
  const catalogue = useCatalogue();
  const money = useMoney();
  const p =
    catalogue.products.find((x) => x.id === current) ??
    defaultProduct(catalogue);
  // The price is animated by `select` (count-up), so React renders only the first value.
  const [firstPrice] = useState(() => defaultProduct(catalogue).price);
  const sys = catalogue.sizeSystem;

  return (
    <section className="pdp" id="buy" aria-label="Buy Flux 01">
      <div className="rail pdp-grid">
        <div
          className="anchor viewer"
          id="a-pdp"
          role="img"
          aria-label="3D view of the selected colourway. Drag to rotate."
        >
          <span className="viewer-tag" id="viewer-tag">
            {p.badge || "In stock"}
          </span>
          <div className="viewer-hint">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 12h16M4 12l4-4M4 12l4 4M20 12l-4-4M20 12l-4 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Drag to rotate
          </div>
        </div>
        <div className="buybox">
          <div className="crumbs">
            <a href="#shop" data-scroll>
              Shop
            </a>{" "}
            / Running / Daily trainers
          </div>
          <h2 className="display pdp-title">
            Flux 01{" "}
            <span className="mark" id="pdp-color">
              {p.name}
            </span>
          </h2>
          <div className="price-row">
            <span className="price" id="pdp-price" data-value={firstPrice}>
              {money(firstPrice)}
            </span>
            <span className="was" id="pdp-was" hidden={!p.was}>
              {p.was ? money(p.was) : ""}
            </span>
            <span className="save-pill" id="pdp-save" hidden={!p.was}>
              {p.was ? `Save ${money(p.was - p.price)}` : ""}
            </span>
          </div>
          <div>
            <div className="opt-head">
              <span>
                Colour · <b id="pdp-color2">{p.name}</b>
              </span>
              <span id="pdp-note">{p.note}</span>
            </div>
            <div
              className="swatches"
              id="pdp-swatches"
              role="group"
              aria-label="Colourway"
            >
              {catalogue.products.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="sw"
                  data-id={c.id}
                  aria-pressed={c.id === current}
                  aria-label={`${c.name}${c.was ? ", on sale" : ""}`}
                  style={{ "--a": c.a } as CSSProperties}
                  onClick={(e) =>
                    select(c.id, true, { x: e.clientX, y: e.clientY })
                  }
                >
                  <ThumbImg id={c.id} />
                  {c.was ? <span className="sale-dot"></span> : null}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="opt-head">
              <span>
                Size, men&apos;s {sys} ·{" "}
                <b id="pdp-size">{sizeLabel(size, catalogue)}</b>
              </span>
              <a href="#faq" data-scroll>
                Size guide
              </a>
            </div>
            <div
              className="sizes"
              id="pdp-sizes"
              role="group"
              aria-label="Size"
            >
              {catalogue.sizes.map((s) => {
                const sold = isSoldOut(catalogue, p, s.value, width);
                return (
                  <button
                    key={s.value}
                    type="button"
                    className="size"
                    data-s={s.value}
                    aria-pressed={s.value === size}
                    disabled={sold}
                    aria-label={
                      sold
                        ? `${sys} ${s.label}, sold out`
                        : `${sys} ${s.label}${s.sub ? ", " + s.sub : ""}`
                    }
                    onClick={() => pickSize(s.value)}
                  >
                    <b>{s.label}</b>
                    <small>{s.sub}</small>
                  </button>
                );
              })}
            </div>
            <p className="size-msg" id="size-msg" aria-live="polite">
              {sizeMsg}
            </p>
          </div>
          {/* Shown only when more than one width is sold (product owner decision, 2026-10-20). */}
          {catalogue.widths.length > 1 ? (
            <div>
              <div className="opt-head">
                <span>Width</span>
              </div>
              <div className="seg" id="width" role="group" aria-label="Width">
                {catalogue.widths.map((w) => (
                  <button
                    key={w.value}
                    type="button"
                    aria-pressed={width === w.value}
                    onClick={() => pickWidth(w.value)}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div className="buy-actions">
            <div className="stepper" aria-label="Quantity">
              <button
                type="button"
                id="qty-dn"
                aria-label="Decrease quantity"
                onClick={() => changeQty(-1)}
              >
                −
              </button>
              <output id="qty">{qty}</output>
              <button
                type="button"
                id="qty-up"
                aria-label="Increase quantity"
                onClick={() => changeQty(1)}
              >
                +
              </button>
            </div>
            <button
              className="btn btn-dark magnetic"
              type="button"
              id="add-btn"
              onClick={(e) => addCurrentToBag(e.currentTarget)}
            >
              Add to bag
            </button>
            <button
              className="icon-btn wish"
              type="button"
              id="pdp-wish"
              aria-pressed={wished}
              aria-label="Save to wishlist"
              onClick={(e) => toggleWish(current, e.currentTarget)}
            >
              <Icon name="heart" />
            </button>
          </div>
          <div className="delivery">
            <div>
              <Icon name="truck" />
              <p style={{ margin: 0 }}>
                <b id="eta">{delivery.title}</b>
                <br />
                <span id="eta-sub">{delivery.sub}</span>
              </p>
            </div>
            <div>
              <Icon name="return" />
              <p style={{ margin: 0 }}>
                <b>Free 60-day returns</b>
                <br />
                <span>
                  Run in them for two months. Not right? Send them back.
                </span>
              </p>
            </div>
          </div>
          <div className="acc">
            <AccordionItem title="Details">
              <ul>
                <li>Weight 268 g (men&apos;s US 9)</li>
                <li>Heel-to-toe drop 8 mm</li>
                <li>Stack height 33 / 25 mm</li>
                <li>Rated for 800 km</li>
              </ul>
            </AccordionItem>
            <AccordionItem title="Materials and care">
              Upper: 62% recycled polyester knit. Midsole: poured EVA blend.
              Outsole: blown rubber. Hand wash cold and air dry away from heat.
            </AccordionItem>
            <AccordionItem title="Shipping and returns">
              Free standard delivery on orders over $150, otherwise $8. Express
              delivery is $15. Returns are free for 60 days, worn or not.
            </AccordionItem>
          </div>
        </div>
      </div>
    </section>
  );
}
