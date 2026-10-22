"use client";

import { AccordionItem } from "@/components/ui/Accordion";
import { useCatalogue } from "@/state/catalogue";

export function Faq() {
  const { faq } = useCatalogue();
  return (
    <section className="block" id="faq" style={{ paddingTop: 0 }}>
      <div className="rail">
        <div className="head">
          <div>
            <span className="eyebrow" data-reveal>
              Help
            </span>
            <h2 className="display" data-split>
              Before you{" "}
              <span className="mark" data-mark>
                check out
              </span>
            </h2>
          </div>
        </div>
        <div className="faq acc" id="faq-list">
          {faq.map(([q, a]) => (
            <AccordionItem key={q} title={q}>
              {a}
            </AccordionItem>
          ))}
        </div>
      </div>
    </section>
  );
}
