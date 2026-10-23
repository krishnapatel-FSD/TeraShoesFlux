"use client";

import { useEffect, useRef } from "react";
import { TOUR_STEP_NAMES } from "@/data/catalogue";
import { gsap, ScrollTrigger } from "@/motion/gsap";
import { getLenis } from "@/motion/SmoothScroll";

// Four chapters (B4, GB-3). The outsole chapter is PLACEHOLDER copy until the product owner sends
// the real specs (OD-4); only "2.5 mm lugs" is real (it moved here from the old Sole chapter).
const STEPS = [
  {
    num: "01 / 04 · Upper",
    title: "One knit, 1,840 threads.",
    body: "Recycled-polyester knit, zoned tight at the midfoot and open over the toes. It breathes where you sweat and holds where you turn.",
    facts: ["94 g upper", "62% recycled", "Seamless toe box"],
  },
  {
    num: "02 / 04 · Foam",
    title: "Poured foam, all the way through.",
    body: "The midsole is poured into the mould rather than pressed, so the foam stays soft at the heel and springy under the forefoot.",
    facts: ["33 mm heel stack", "25 mm forefoot", "8 mm drop"],
  },
  {
    num: "03 / 04 · Outsole",
    title: "[Placeholder] Outsole headline.",
    body: "[Placeholder copy: the outsole's rubber, grip pattern and wear life go here once the specs are confirmed.]",
    facts: ["2.5 mm lugs", "[Spec to confirm]", "[Spec to confirm]"],
  },
  {
    num: "04 / 04 · Heel",
    title: "Locked in, not locked down.",
    body: "A soft internal counter and a padded collar hold your heel without pressing on the Achilles. The pull tab makes it a two-second slip-on.",
    facts: ["Padded collar", "Pull tab", "Reflective heel"],
  },
];

// Scroll-driven 3D tour: a sticky dark panel whose copy steps through the chapters while the shared
// 3D stage docks the shoe into #a-story (see src/three/stage.ts). Each chapter's text shows for an
// equal share of the scroll, and the shoe holds its pose through most of it (scrollDock.ts).
// Clicking the shoe spins it and dragging turns it (stage.ts); the chapter dashes jump to a chapter.

/** Scrolls to the middle of chapter i, where its pose holds and its text shows. */
function goToChapter(tour: HTMLElement, i: number) {
  const top = tour.getBoundingClientRect().top + scrollY;
  const y =
    top + ((i + 0.5) / STEPS.length) * (tour.offsetHeight - innerHeight);
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(y, { duration: 1.2 });
  else scrollTo({ top: y, behavior: "smooth" });
}
export function Tour() {
  const root = useRef<HTMLElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const steps = [...el.querySelectorAll<HTMLElement>(".step")];
    const bars = [...el.querySelectorAll<HTMLElement>(".dots-nav i b")];
    // The current chapter, also for the recorded stills that replace the 3D shoe without WebGL (B8).
    const anchor = el.querySelector<HTMLElement>("#a-story");
    let cur = 0;
    if (anchor) anchor.dataset.chapter = "0";
    steps.forEach((s, j) => (s.style.visibility = j ? "hidden" : "visible"));
    const show = (i: number) => {
      if (i === cur) return;
      const prev = cur;
      cur = i;
      if (anchor) anchor.dataset.chapter = String(i);
      if (label.current) label.current.textContent = TOUR_STEP_NAMES[i]!;
      steps.forEach((s, j) => {
        if (j === i)
          gsap.fromTo(
            s.children,
            { y: prev < i ? 40 : -40, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.9,
              stagger: 0.07,
              ease: "expo.out",
              overwrite: true,
              onStart: () => void (s.style.visibility = "visible"),
            },
          );
        else if (j === prev)
          gsap.to(s.children, {
            y: prev < i ? -30 : 30,
            opacity: 0,
            duration: 0.4,
            stagger: 0.03,
            ease: "power2.in",
            overwrite: true,
            onComplete: () => {
              if (cur !== j) s.style.visibility = "hidden";
            },
          });
        else s.style.visibility = "hidden";
      });
    };
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (s) => {
        const p = s.progress;
        const n = STEPS.length;
        show(Math.min(n - 1, Math.floor(p * n)));
        bars.forEach((b, j) =>
          gsap.set(b, { scaleX: Math.min(1, Math.max(0, (p - j / n) * n)) }),
        );
      },
    });
    return () => st.kill();
  }, []);

  return (
    <section
      className="story"
      id="tour"
      aria-label="3D tour of the Flux 01"
      ref={root}
    >
      <div className="sticky">
        <div className="panel">
          <div className="grid-floor"></div>
          <div className="rail story-grid">
            <div className="story-copy">
              {STEPS.map((s, i) => (
                <div className="step" data-step={i} key={i}>
                  <span className="num">{s.num}</span>
                  <h3 className="display">{s.title}</h3>
                  <p>{s.body}</p>
                  <div className="facts">
                    {s.facts.map((f, k) => (
                      <span className="fact" key={k}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div
              className="anchor story-stage"
              id="a-story"
              role="button"
              tabIndex={0}
              aria-label="Spin the shoe. You can also drag it to turn it."
            >
              <span className="tour-hint" aria-hidden="true">
                Click to spin · Drag to turn
              </span>
            </div>
          </div>
          <div className="dots-nav">
            {STEPS.map((s, i) => (
              <button
                type="button"
                key={i}
                aria-label={`Go to ${s.num}`}
                onClick={() => root.current && goToChapter(root.current, i)}
              >
                <i>
                  <b></b>
                </i>
              </button>
            ))}
            <span id="step-label" ref={label}>
              Upper
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
