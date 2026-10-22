"use client";

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { ThumbImg } from "@/components/store/Thumb";
import { Icon } from "@/components/ui/Icons";
import type { Product } from "@/data/catalogue";
import { isSoldOut } from "@/lib/catalogue/types";
import { useCatalogue, useMoney } from "@/state/catalogue";
import { Flip, gsap, reduce } from "@/motion/gsap";
import {
  addToCart,
  goToSection,
  select,
  setFilter,
  setSort,
  takePendingFlip,
  toggleWish,
} from "@/state/actions";
import { useStore } from "@/state/store";

const FILTERS: [id: string, label: string][] = [
  ["all", "All"],
  ["warm", "Warm"],
  ["cool", "Cool"],
  ["dark", "Dark"],
  ["sale", "Sale"],
];

function sorted(products: Product[], sortBy: string): Product[] {
  const list = products.slice();
  if (sortBy === "low")
    list.sort((a, b) => a.price - b.price || a.rank - b.rank);
  else if (sortBy === "high")
    list.sort((a, b) => b.price - a.price || a.rank - b.rank);
  else if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));
  else list.sort((a, b) => a.rank - b.rank);
  return list;
}

function ProductCard({ p, hidden }: { p: Product; hidden: boolean }) {
  const catalogue = useCatalogue();
  const money = useMoney();
  const wished = useStore((s) => s.wish.includes(p.id));
  const [quick, setQuick] = useState(false);
  const quickBox = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const box = quickBox.current;
    if (!quick || !box) return;
    if (!reduce)
      gsap.from(box.querySelectorAll("button"), {
        y: 10,
        opacity: 0,
        stagger: 0.025,
        duration: 0.4,
        ease: "expo.out",
      });
    box.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
  }, [quick]);

  return (
    <article
      className="pcard"
      data-id={p.id}
      style={{ "--a": p.a } as CSSProperties}
      hidden={hidden}
    >
      <button
        type="button"
        className="pimg"
        data-open={p.id}
        aria-label={`View Flux 01 ${p.name}`}
        onClick={(e) => {
          select(p.id, true, { x: e.clientX, y: e.clientY });
          goToSection("#buy");
        }}
      >
        {p.badge ? (
          <span className={`ptag${p.was ? " sale" : ""}`}>{p.badge}</span>
        ) : null}
        <ThumbImg id={p.id} />
      </button>
      <button
        type="button"
        className="icon-btn wish"
        data-wish={p.id}
        aria-pressed={wished}
        aria-label={`Save Flux 01 ${p.name} to wishlist`}
        onClick={(e) => toggleWish(p.id, e.currentTarget)}
      >
        <Icon name="heart" />
      </button>
      <div className="pinfo">
        <div>
          <h3>Flux 01 {p.name}</h3>
          <p>{p.note}</p>
        </div>
        <div className="pprice">
          {money(p.price)}
          {p.was ? <s>{money(p.was)}</s> : null}
        </div>
      </div>
      <div className="quick" ref={quickBox}>
        {quick ? (
          <div className="qsizes" role="group" aria-label="Pick a size">
            {catalogue.sizes.map(({ value: us }) => {
              // Quick add always adds the standard width, as in the prototype.
              const sold = isSoldOut(catalogue, p, us, "Standard");
              return (
                <button
                  key={us}
                  type="button"
                  data-qs={us}
                  data-id={p.id}
                  disabled={sold}
                  aria-label={`${catalogue.sizeSystem} ${us}${sold ? ", sold out" : ""}`}
                  onClick={(e) => {
                    addToCart(p.id, us, 1, "Standard", e.currentTarget);
                    setQuick(false);
                  }}
                >
                  {us}
                </button>
              );
            })}
          </div>
        ) : (
          <button
            type="button"
            className="btn quick-btn"
            data-quick={p.id}
            onClick={() => setQuick(true)}
          >
            Quick add
          </button>
        )}
      </div>
    </article>
  );
}

export function ShopGrid() {
  const filter = useStore((s) => s.filter);
  const sortBy = useStore((s) => s.sortBy);
  const { products } = useCatalogue();
  const list = useMemo(() => sorted(products, sortBy), [products, sortBy]);
  const shown = (p: Product) =>
    filter === "all" || p.fam.split(" ").includes(filter);
  const n = list.filter(shown).length;

  // FLIP: the layout before the change was captured by setFilter/setSort.
  useLayoutEffect(() => {
    const state = takePendingFlip();
    if (!state) return;
    Flip.from(state, {
      duration: 0.7,
      ease: "expo.inOut",
      scale: true,
      absolute: true,
      stagger: 0.03,
      onEnter: (els) =>
        gsap.fromTo(
          els,
          { opacity: 0, scale: 0.85 },
          { opacity: 1, scale: 1, duration: 0.6, ease: "expo.out" },
        ),
      onLeave: (els) =>
        gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.4 }),
    });
  }, [filter, sortBy]);

  return (
    <section className="block" id="shop" style={{ paddingTop: 40 }}>
      <div className="rail">
        <div className="head">
          <div>
            <span className="eyebrow" data-reveal>
              Shop all colourways
            </span>
            <h2 className="display" data-split>
              Six ways to wear{" "}
              <span className="mark" data-mark>
                Flux 01
              </span>
            </h2>
          </div>
          <p className="lede" data-reveal>
            Every product image is a live render of the 3D shoe, so the colour
            you see is the colour you get.
          </p>
        </div>
        <div className="toolbar">
          <div className="chips" id="filters" role="group" aria-label="Filter">
            {FILTERS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className="fchip"
                data-f={id}
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="sort" htmlFor="sort">
            Sort{" "}
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="low">Price, low to high</option>
              <option value="high">Price, high to low</option>
              <option value="name">Name, A to Z</option>
            </select>
          </label>
        </div>
        <p className="count" id="count">
          {n} {n === 1 ? "product" : "products"}
        </p>
        <div className="grid" id="grid">
          {list.map((p) => (
            <ProductCard key={p.id} p={p} hidden={!shown(p)} />
          ))}
        </div>
      </div>
    </section>
  );
}
