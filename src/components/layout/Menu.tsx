"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";
import { gsap, reduce } from "@/motion/gsap";
import { getLenis } from "@/motion/SmoothScroll";
import { closeMenu } from "@/state/actions";
import { useStore } from "@/state/store";

// Full-screen menu that opens as a circle growing from the menu button.
export function Menu() {
  const open = useStore((s) => s.menuOpen);
  const ref = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    const m = ref.current;
    const btn = document.getElementById("menu-btn");
    if (!m || !btn || open === wasOpen.current) return;
    wasOpen.current = open;
    const r = btn.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;

    if (open) {
      getLenis()?.stop();
      const R = Math.hypot(
        Math.max(x, innerWidth - x),
        Math.max(y, innerHeight - y),
      );
      if (!reduce) {
        gsap
          .timeline()
          .set(m, {
            visibility: "visible",
            clipPath: `circle(0px at ${x}px ${y}px)`,
          })
          .to(m, {
            clipPath: `circle(${R}px at ${x}px ${y}px)`,
            duration: 0.9,
            ease: "expo.inOut",
          })
          .from(
            ".menu-links li",
            {
              yPercent: 120,
              opacity: 0,
              stagger: 0.06,
              duration: 0.9,
              ease: "expo.out",
            },
            0.35,
          );
      } else {
        m.style.visibility = "visible";
        m.style.clipPath = "none";
      }
      const t = setTimeout(
        () => document.getElementById("menu-close")?.focus(),
        60,
      );
      return () => clearTimeout(t);
    }

    getLenis()?.start();
    if (!reduce) {
      gsap.to(m, {
        clipPath: `circle(0px at ${x}px ${y}px)`,
        duration: 0.7,
        ease: "expo.inOut",
        onComplete: () => void gsap.set(m, { visibility: "hidden" }),
      });
    } else {
      m.style.visibility = "hidden";
    }
    btn.focus();
  }, [open]);

  return (
    <div
      className="menu"
      id="menu"
      role="dialog"
      aria-label="Menu"
      inert={!open}
      ref={ref}
    >
      <div className="menu-top">
        <Logo menuClose />
        <button
          className="icon-btn"
          type="button"
          id="menu-close"
          aria-label="Close menu"
          onClick={closeMenu}
        >
          <Icon name="x" />
        </button>
      </div>
      <ul className="menu-links">
        <li>
          <a href="#shop" data-scroll data-filter="all" data-menu-close>
            <small>01</small>Shop all
          </a>
        </li>
        <li>
          <a href="#buy" data-scroll data-menu-close>
            <small>02</small>Flux 01
          </a>
        </li>
        <li>
          <a href="#tour" data-scroll data-menu-close>
            <small>03</small>3D tour
          </a>
        </li>
        <li>
          <a href="#shop" data-scroll data-filter="sale" data-menu-close>
            <small>04</small>Sale
          </a>
        </li>
        <li>
          <a href="#faq" data-scroll data-menu-close>
            <small>05</small>Help
          </a>
        </li>
      </ul>
      <div className="menu-foot">
        <span>Free shipping over $150 · 60-day returns</span>
        <span>Press / to search</span>
      </div>
    </div>
  );
}
