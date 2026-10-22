"use client";

import { useEffect } from "react";
import {
  closeDrawer,
  closeMenu,
  closeSearch,
  goToSection,
  hydrateFromStorage,
  openSearch,
  select,
  setFilter,
} from "@/state/actions";
import { activeCatalogue, defaultProduct } from "@/state/catalogue";
import { track } from "./probe";
import { gsap, reduce, ScrollTrigger } from "./gsap";

/** Wraps each word of a heading for the rise-in reveal (prototype `splitWords`). */
function splitWords(el: Element): HTMLElement[] {
  const walk = (node: Node) =>
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        (n.textContent ?? "").split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(" "));
            return;
          }
          const w = document.createElement("span");
          w.className = "w";
          const i = document.createElement("span");
          i.className = "wi";
          i.textContent = part;
          w.appendChild(i);
          frag.appendChild(w);
        });
        (n as ChildNode).replaceWith(frag);
      } else if (n instanceof HTMLElement && n.classList.contains("mark")) {
        const w = document.createElement("span");
        w.className = "w";
        n.classList.add("wi");
        n.replaceWith(w);
        w.appendChild(n);
      } else if (n.nodeType === Node.ELEMENT_NODE) walk(n);
    });
  walk(el);
  return [...el.querySelectorAll<HTMLElement>(".wi")];
}

// Page-wide behaviour from the prototype script that isn't owned by one component: the hero
// intro, scroll reveals, progress bar, header state, smooth-scroll links, magnetic buttons and
// keyboard shortcuts. Mounted last so every section is in the DOM.
export function PageMotion() {
  useEffect(() => {
    hydrateFromStorage();
    select(defaultProduct(activeCatalogue()).id, false);

    /* Smooth-scroll links (data-scroll), which can also close overlays or set a filter. */
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest<HTMLElement>("[data-scroll]");
      if (!a) return;
      e.preventDefault();
      if (a.dataset.close !== undefined) closeDrawer();
      if (a.dataset.menuClose !== undefined) closeMenu();
      if (a.dataset.filter) setFilter(a.dataset.filter);
      const href = a.getAttribute("href")!;
      setTimeout(
        () => goToSection(href),
        a.dataset.menuClose !== undefined ? 250 : 0,
      );
    };
    document.addEventListener("click", onClick);

    /* Escape closes overlays; "/" opens search. */
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeSearch();
        closeDrawer();
        closeMenu();
      }
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement?.tagName ?? "",
        )
      ) {
        e.preventDefault();
        closeMenu();
        openSearch();
      }
    };
    addEventListener("keydown", onKey);

    /* Header pill and back-to-top button follow the scroll position. */
    const header = document.getElementById("header");
    const toTop = document.getElementById("to-top");
    const hero = document.getElementById("hero");
    const onScrollState = () => {
      const y = scrollY;
      const h = hero?.offsetHeight ?? 0;
      header?.classList.toggle("scrolled", y > h - 90);
      toTop?.classList.toggle("on", y > 600);
    };
    addEventListener("scroll", onScrollState, { passive: true });
    onScrollState();

    /* Text splitting, reveals and the hero intro. */
    const splitHeadings = [
      ...document.querySelectorAll<HTMLElement>("[data-split]"),
    ];
    const originals = splitHeadings.map((h) => h.innerHTML);
    const removers: (() => void)[] = [];
    const ctx = gsap.context(() => {
      if (reduce) return;
      const tl = track(
        "intro-headline",
        gsap.timeline({ defaults: { ease: "expo.out" } }),
      );
      for (const chars of ["#word-solid .ch", "#word-line .ch"]) {
        tl.from(
          chars,
          { yPercent: 120, rotate: 8, duration: 1.4, stagger: 0.05 },
          0.15,
        );
      }
      tl.from(
        "[data-intro]",
        { y: 30, opacity: 0, duration: 1.1, stagger: 0.12 },
        0.6,
      );
      // Parallax: the word drifts up and spreads as the hero scrolls away (both copies move together).
      gsap.to(".word span", {
        yPercent: -22,
        letterSpacing: ".05em",
        ease: "none",
        scrollTrigger: {
          trigger: "#hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
      splitHeadings.forEach((h) => {
        const t = gsap.timeline({
          scrollTrigger: { trigger: h, start: "top 88%" },
        });
        t.from(splitWords(h), {
          yPercent: 110,
          rotate: 4,
          duration: 1.2,
          stagger: 0.05,
          ease: "expo.out",
        });
        h.querySelectorAll("[data-mark]").forEach((m) =>
          t.fromTo(
            m,
            { "--mk": 0 },
            { "--mk": 1, duration: 0.9, ease: "expo.inOut" },
            0.5,
          ),
        );
      });
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) =>
        gsap.from(el, {
          y: 30,
          opacity: 0,
          duration: 1.1,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 90%" },
        }),
      );
      gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((g) =>
        gsap.from(g.children, {
          y: 50,
          opacity: 0,
          duration: 1.1,
          stagger: 0.08,
          ease: "expo.out",
          scrollTrigger: { trigger: g, start: "top 88%" },
        }),
      );
      gsap.from(".buybox > *", {
        y: 36,
        opacity: 0,
        duration: 1,
        stagger: 0.06,
        ease: "expo.out",
        scrollTrigger: { trigger: ".buybox", start: "top 80%" },
      });
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (s) => gsap.set("#progress", { scaleX: s.progress }),
      });
      gsap.from("#foot-big span", {
        yPercent: 100,
        opacity: 0,
        stagger: 0.05,
        duration: 1,
        ease: "expo.out",
        scrollTrigger: { trigger: "#foot-big", start: "top 95%" },
      });

      /* Magnetic buttons. */
      if (matchMedia("(hover: hover)").matches) {
        document.querySelectorAll<HTMLElement>(".magnetic").forEach((b) => {
          const move = (e: PointerEvent) => {
            const r = b.getBoundingClientRect();
            gsap.to(b, {
              x: (e.clientX - r.left - r.width / 2) * 0.25,
              y: (e.clientY - r.top - r.height / 2) * 0.35,
              duration: 0.5,
              ease: "power3.out",
            });
          };
          const leave = () =>
            gsap.to(b, {
              x: 0,
              y: 0,
              duration: 1,
              ease: "elastic.out(1, .35)",
            });
          b.addEventListener("pointermove", move);
          b.addEventListener("pointerleave", leave);
          removers.push(() => {
            b.removeEventListener("pointermove", move);
            b.removeEventListener("pointerleave", leave);
          });
        });
      }
    });

    const refresh = () => ScrollTrigger.refresh();
    if (document.readyState === "complete") refresh();
    else addEventListener("load", refresh, { once: true });

    return () => {
      removers.forEach((r) => r());
      ctx.revert();
      splitHeadings.forEach((h, i) => (h.innerHTML = originals[i]!));
      document.removeEventListener("click", onClick);
      removeEventListener("keydown", onKey);
      removeEventListener("scroll", onScrollState);
      removeEventListener("load", refresh);
    };
  }, []);

  return null;
}
