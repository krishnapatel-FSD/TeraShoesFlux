"use client";

import { useRef, useState, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/motion/gsap";

// One accordion row (`.acc-item`): the body animates between 0 and its natural height.
export function AccordionItem({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const body = useRef<HTMLDivElement>(null);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    gsap.to(body.current, {
      height: next ? "auto" : 0,
      duration: 0.7,
      ease: "expo.out",
      onComplete: () => ScrollTrigger.refresh(),
    });
  };

  return (
    <div className="acc-item">
      <button type="button" aria-expanded={open} onClick={toggle}>
        {title}
        <span className="pm" aria-hidden="true"></span>
      </button>
      <div className="acc-body" ref={body}>
        <div>{children}</div>
      </div>
    </div>
  );
}
