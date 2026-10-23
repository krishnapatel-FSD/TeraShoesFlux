"use client";

import { useState, type CSSProperties } from "react";
import { formatMoney } from "@/lib/catalogue/money";
import { defaultProduct, useCatalogue } from "@/state/catalogue";
import { select } from "@/state/actions";
import { useStore } from "@/state/store";

// The giant word is split into characters: the solid copy sits behind the shoe and the outline
// copy in front, so letters crossing the shoe read as outlines.
function SplitChars({ id, text }: { id: string; text: string }) {
  return (
    <span id={id}>
      {[...text].map((c, i) => (
        <span className="ch" key={i}>
          {c === " " ? " " : c}
        </span>
      ))}
    </span>
  );
}

export function Hero() {
  const catalogue = useCatalogue();
  const current = useStore((s) => s.current);
  const p =
    catalogue.products.find((x) => x.id === current) ??
    defaultProduct(catalogue);
  // The price is animated by `select` (count-up), so React renders only the first value.
  const [firstPrice] = useState(() => defaultProduct(catalogue).price);

  return (
    <section className="hero" id="hero">
      <div className="hero-bg"></div>
      <div className="word" aria-hidden="true">
        <SplitChars id="word-solid" text={catalogue.hero.word} />
      </div>
      <div className="anchor hero-stage" id="a-hero">
        <div className="loader" id="loader">
          <svg viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              style={{ stroke: "var(--ink-12)" }}
              strokeWidth="3"
            />
            <circle
              id="loader-arc"
              cx="18"
              cy="18"
              r="15"
              fill="none"
              style={{ stroke: "var(--ink)" }}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="94.2"
              strokeDashoffset="94.2"
            />
          </svg>
          <span>
            Loading 3D shoe <b id="loader-pct">0%</b>
          </span>
        </div>
      </div>
      <div className="word outline" aria-hidden="true">
        <SplitChars id="word-line" text={catalogue.hero.word} />
      </div>
      <div className="rail hero-foot">
        <div className="left" data-intro>
          <h1>
            <b>{catalogue.hero.title}</b>
            {catalogue.hero.body}
          </h1>
          <div
            className="dots"
            id="hero-dots"
            role="group"
            aria-label="Colourway"
          >
            {catalogue.products.map((c) => (
              <button
                key={c.id}
                type="button"
                className="cdot"
                data-id={c.id}
                aria-pressed={c.id === current}
                aria-label={c.name}
                style={{ "--a": c.a, "--b": c.b } as CSSProperties}
                onClick={(e) =>
                  select(c.id, true, { x: e.clientX, y: e.clientY })
                }
              ></button>
            ))}
            <span className="lbl" id="hero-color-name">
              {p.name.toUpperCase() + (p.was ? " · SALE" : "")}
            </span>
          </div>
        </div>
        <div className="right" data-intro>
          <span className="price-tag" id="hero-price" data-value={firstPrice}>
            {formatMoney(firstPrice, catalogue.currency)}
          </span>
          <a className="btn btn-dark magnetic" href="#buy" data-scroll>
            Shop now <span className="arrow">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
