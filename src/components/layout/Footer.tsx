"use client";

import { useState } from "react";

export function Footer() {
  const [newsMsg, setNewsMsg] = useState("");

  return (
    <footer>
      <div className="rail">
        <div className="foot-grid">
          <div>
            <span className="eyebrow">Drops and restocks</span>
            <p
              style={{
                margin: "14px 0 0",
                maxWidth: "40ch",
                color: "var(--white-65)",
              }}
            >
              New colourways, restocks in your size and member-only sales. One
              email a month.
            </p>
            <form
              className="news"
              id="news-form"
              onSubmit={(e) => {
                e.preventDefault();
                setNewsMsg(
                  "Saved. This is a demo store, so no email was sent.",
                );
                e.currentTarget.reset();
              }}
            >
              <label htmlFor="news-email" className="sr">
                Email address
              </label>
              <input
                id="news-email"
                type="email"
                required
                placeholder="you@example.com"
                autoComplete="email"
              />
              <button className="btn btn-hl" type="submit">
                Join
              </button>
            </form>
            <p className="news-msg" id="news-msg" aria-live="polite">
              {newsMsg}
            </p>
          </div>
          <div>
            <h4>Shop</h4>
            <ul>
              <li>
                <a href="#buy" data-scroll>
                  Flux 01
                </a>
              </li>
              <li>
                <a href="#shop" data-scroll data-filter="all">
                  All colourways
                </a>
              </li>
              <li>
                <a href="#shop" data-scroll data-filter="sale">
                  Sale
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Help</h4>
            <ul>
              <li>
                <a href="#faq" data-scroll>
                  Size guide
                </a>
              </li>
              <li>
                <a href="#faq" data-scroll>
                  Shipping
                </a>
              </li>
              <li>
                <a href="#faq" data-scroll>
                  Returns
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Brand</h4>
            <ul>
              <li>
                <a href="#tour" data-scroll>
                  3D tour
                </a>
              </li>
              <li>
                <a href="#faq" data-scroll>
                  Trade-in
                </a>
              </li>
              <li>
                <a href="#top" data-scroll>
                  Back to top
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="pay" aria-label="Payment methods shown in this demo">
          <span>VISA</span>
          <span>MASTERCARD</span>
          <span>AMEX</span>
          <span>PAYPAL</span>
          <span>APPLE PAY</span>
        </div>
        <div className="display foot-big" id="foot-big" aria-hidden="true">
          {[..."TeraShoes"].map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </div>
        <div className="legal">
          <span>© 2026 TeraShoes · concept store, no real orders</span>
          <span>
            3D model: “Materials Variants Shoe” © 2021 Shopify,{" "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noopener"
            >
              CC BY 4.0
            </a>
            , via{" "}
            <a
              href="https://github.com/KhronosGroup/glTF-Sample-Assets"
              target="_blank"
              rel="noopener"
            >
              Khronos glTF Sample Assets
            </a>
            . Colourways recoloured.
          </span>
        </div>
      </div>
    </footer>
  );
}
