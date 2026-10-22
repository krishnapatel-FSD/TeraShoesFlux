# TeraShoes Flux 01: Product Requirements (PRD)

| | |
|---|---|
| Status | Draft for product owner review |
| Source of truth | [instructions.md](instructions.md) (the build brief). If this document and the brief disagree, the brief wins until the product owner decides otherwise. |
| Look-and-feel reference | The shared TeraShoes prototype, plus the local snapshot `index.html` in this repo (see [Prototype baseline](#3-prototype-baseline)) |
| Related | [TRD](TRD.md), [UI/UX spec](UI_UX.md), [Backend schema](Backend_Schema.md), [User flows](User_Flow.md) |

## 1. Summary

TeraShoes sells one running shoe, the **Flux 01**, in several colourways. The prototype shows the concept: a 3D shoe flies through a full-screen hero painted in the selected colour, and the whole site recolours when you pick a colourway. The goal is to turn that prototype into a production store within about 16 weeks, built by one full-stack developer. The production store needs:

- TeraShoes' **own** 3D shoe, with colourways driven from code
- **Cinematic motion** at launch quality on phones and laptops
- **Real commerce**: live stock, a cart that syncs across devices, hosted checkout, accounts, and order emails
- A **fast, accessible** launch

## 2. Goals and non-goals

### Goals
1. **G1 Own product:** replace the borrowed sample shoe with a licensed (or freelance-made) Flux 01 model. The model's licence is kept in the repo.
2. **G2 Colourway system:** 8 colourways rendered from one model and a set of mask maps, defined in one token file and checked for contrast.
3. **G3 Signature motion:** keep the prototype's feel (hero fly-through, colour wash, 3D tour, docking shoe) without jumps, and degrade gracefully when motion is reduced or WebGL is missing.
4. **G4 Real store:** Shopify is the system of record for products, stock, prices, carts, checkout, customers, orders and emails.
5. **G5 Editable content:** the product owner changes the hero headline, offers bar and FAQ without a developer.
6. **G6 Fast and accessible:** tested on phones, with 3D assets well under the prototype's ~9 MB, WCAG AA contrast, and full keyboard use.

### Non-goals (for this build)
- A custom payments, tax, order-management or inventory backend. Shopify does all of this.
- More than one product model. Flux 01 is the only shoe, and new colourways are new variants.
- A native mobile app.
- Writing or building our own email service. Shopify notifications are used, plus an app for back-in-stock alerts (see OD-6).
- Modelling the shoe or the character in-house. Both are bought in (A1, A8).

## 3. Prototype baseline

This is what exists today and is the reference for look and feel.

| Area | In the prototype | In production |
|---|---|---|
| 3D shoe | Shopify's "Materials Variants Shoe" sample (CC BY 4.0) | Licensed or freelance Flux 01 model (A1, A2) |
| Colourways | 6 (Lime, Ember, Glacier, Obsidian, Amber, Coral). Five swap in a full diffuse texture each, and Coral uses the model's built-in "beach" variant. | 8, recoloured by a shader from mask maps with no extra textures (A3) |
| Hero | Full-screen highlight colour, giant "Tera Flux" headline in solid and outline copies, shoe flies in, props pop in | Same, plus a rigged tennis character (A8, B5) |
| Props | The brief lists themed props per colourway (tennis balls, rackets, players, shuttlecocks, paddles). **The local snapshot has tennis balls only.** | Reusable R3F prop components (A7) |
| 3D tour | Scroll-driven. The local snapshot has **3 chapters** (Upper, Sole, Heel). | 4 chapters (upper, foam, outsole, heel), each with its own camera move (B4) |
| Product section | Drag-to-rotate viewer, swatches, sizes US 7–12 with sold-out sizes, width Standard/Wide (2E), quantity 1–5, add to bag, wishlist, details accordion | Live stock from Shopify, size guide (C4) |
| Shop grid | 6 cards, filters All, Warm, Cool, Dark, Sale; sort Featured, price low/high, name; quick-add size picker | Filters by colour family **and size**, all kept in the URL (C3) |
| Bag | Drawer, free-shipping meter (threshold $150), quantity and remove; saved in `localStorage` | Shopify Cart API, discount codes, synced across devices after sign-in (C5) |
| Checkout | A toast saying "Checkout is not part of this demo store" | Shopify hosted checkout (C6) |
| Search | Matches colourway name, note and family | The same over Shopify data (see FR-12) |
| Wishlist | `localStorage` | Saved to the customer's account (C7) |
| Newsletter | Fake submit | Open decision (OD-9) |
| Content | Hard-coded | Shopify metaobjects (C8) |

> **The local snapshot is older than the shared prototype.** The brief describes a 2,000-line file with rackets, players, shuttlecocks and paddles, and a single scroll controller. The local `index.html` has 1,246 lines, tennis balls only, and four separate scrubbed ScrollTriggers driving the shoe. Get the latest shared version before porting motion (OD-1).

## 4. Users

| User | Needs |
|---|---|
| **Shopper on a laptop** | The full cinematic experience, then choosing a colour and size and buying quickly |
| **Shopper on a phone** | The same story without stutter or a slow first load. Touch-friendly swatches and sizes. Apple Pay or Google Pay. |
| **Returning customer** | Signs in, finds the wishlist and bag from another device, and sees order history |
| **Shopper with motion sensitivity or assistive technology** | A static hero, native scrolling, a keyboard path through every control, and screen-reader labels |
| **Product owner** | Approves the shoe, colourways and copy, edits headline, offers and FAQ in Shopify, and changes stock and prices without a redeploy |

## 5. Functional requirements

Each requirement points to the brief task that delivers it. "Accept" is that task's "Done when" check, with extra checks marked *(added)*.

### 3D product and colourways
| ID | Requirement | Task | Accept |
|---|---|---|---|
| FR-1 | The Flux 01 model is TeraShoes' own licensed or commissioned asset, and the licence is stored in the repo | A1 | Model bought and licence saved in `licenses/` |
| FR-2 | The model is web-ready: under 40k triangles, clean UVs, baked AO, a single GLB | A2 | Passes the glTF Validator and is under 3 MB |
| FR-3 | Colourways come from code: mask maps for upper, stripes and sole, and a recolour shader | A3 | 8 colourways from one model with no extra textures |
| FR-4 | One colourway token file holds each colourway's name, shoe colours, highlight colour and text colours | A4 | Contrast script passes WCAG AA for every hero colour |
| FR-5 | Studio lighting matches a reference render | A6 | Product owner approves a side-by-side check |
| FR-6 | Product images (side, front, top, sole) are rendered from the 3D scene for each colourway | A9 | 4 images per colourway uploaded to Shopify |

### Experience and motion
| ID | Requirement | Task | Accept |
|---|---|---|---|
| FR-7 | One scroll controller docks the shoe into hero, tour, product and shop | B1 | Fast scrolling back and forth never makes the shoe jump or stick |
| FR-8 | Hero intro: loader, shoe fly-in, headline letters, props | B2 | Intro finishes within 2.5 s of the model loading |
| FR-9 | Colour change: colour wash, shoe spin, prop swap and site recolour in one timeline | B3 | One click recolours everything in 1.2 s with no flicker |
| FR-10 | 3D tour with one camera move per chapter: upper, foam, outsole, heel | B4 | Each chapter holds still long enough to read |
| FR-11 | Hero character: idle loop, swing on colour change, head follows the cursor | A8, B5 | 60 fps on a 2022 mid-range laptop |
| FR-12 | Search across colourways (name, note, family) opens the product in that colour | *(added, the prototype has it but no task covers it)* | Typing "lime", "cool" or "sale" gives the same results as the prototype |
| FR-13 | Micro-interactions: button fills, add-to-bag fly, wishlist pop, size-error shake, page transitions | B6 | Each finishes in under 600 ms |
| FR-14 | Reduced motion and low-power mode | B7 | With reduced motion on, nothing moves on its own |
| FR-15 | No-WebGL fallback: a 10 s hero video loop (WebM and MP4) | B8 | The page looks complete with WebGL off |

### Commerce
| ID | Requirement | Task | Accept |
|---|---|---|---|
| FR-16 | Flux 01 in Shopify with colourway and size variants, plus stock and prices | C2 | Changing stock in Shopify shows on the site without a redeploy |
| FR-17 | Shop grid from Shopify, with filters by colour family and size and a sort, all kept in the URL | C3 | A shared filtered link opens the same results |
| FR-18 | Product page: 3D viewer, swatches, size picker with live stock, width, size guide | C4 | Sold-out sizes cannot be added to the bag |
| FR-19 | Bag drawer on the Shopify Cart API, with a free-shipping meter and discount codes | C5 | The bag survives a refresh, and a second device after sign-in |
| FR-20 | Shopify hosted checkout with cards, Apple Pay, Google Pay, tax and shipping zones | C6 | A real test order completes and refunds in Shopify |
| FR-21 | Customer accounts: sign-in, order history, wishlist saved to the account | C7 | A wishlist saved on one device shows on another |
| FR-22 | Guests can use the wishlist (stored on the device) and it merges into the account at sign-in | *(added)* | A guest wishlist survives sign-in |
| FR-23 | Editable hero headline, offers bar and FAQ | C8 | The product owner changes the headline without the developer |
| FR-24 | Branded order confirmation, shipping and back-in-stock emails | C9 | Test emails match the brand kit |

## 6. Non-functional requirements

| ID | Area | Requirement | Source |
|---|---|---|---|
| NFR-1 | 3D weight | Shoe GLB under 3 MB, character GLB under 2 MB, no per-colourway textures | A2, A3, A8 |
| NFR-2 | Frame rate | 60 fps in the hero on a 2022 mid-range laptop, and a 30 fps cap on battery | B5, B7 |
| NFR-3 | Motion timing | Intro ≤ 2.5 s after model load, colour change ≤ 1.2 s, micro-interactions < 600 ms | B2, B3, B6 |
| NFR-4 | Contrast | WCAG 2.2 AA for all text on every hero colour (4.5:1 for body text, 3:1 for large display text) | A4 |
| NFR-5 | Motion safety | `prefers-reduced-motion` is respected everywhere | B7 |
| NFR-6 | Resilience | The site is complete without WebGL, and still renders (read-only) if Shopify is slow | B8, *(added)* |
| NFR-7 | Devices | Tested on recent iOS Safari and Android Chrome phones, plus desktop Chrome, Safari, Firefox and Edge | Brief: "untested on phones" |
| NFR-8 | Freshness | Stock and prices update without a redeploy | C2 |
| NFR-9 | Keyboard and screen reader | Every control reachable and labelled, focus trapped in the drawer, menu and search, and focus returned on close (the prototype already does this) | *(added)* |
| NFR-10 | Page speed | *Proposed:* LCP ≤ 2.5 s on a mid-range phone over 4G, measured on the product page and the hero poster frame | *(added, product owner to confirm)* |

## 7. Content inventory (from the prototype)

Copy to carry over, pending product owner sign-off:
- **Product facts:** 268 g (men's US 9), 8 mm drop, 33/25 mm stack, rated for 800 km, 62% recycled polyester knit, poured EVA-blend midsole, blown-rubber outsole.
- **Offers:** free shipping over $150 (otherwise $8, express $15), 60-day returns, $20 trade-in, plastic-free packaging.
- **FAQ:** fit, delivery, returns, trade-in.
- **Tour copy:** Upper ("One knit, 1,840 threads"), Sole ("Poured foam, all the way through"), Heel ("Locked in, not locked down"). This needs splitting into 4 chapters (OD-4).

## 8. Open decisions

The product owner answers each within one working day, as the brief requires. A task waiting on one of these is **Blocked**.

| ID | Decision | Blocks | Notes |
|---|---|---|---|
| OD-1 | Share the latest prototype link and archive it in the repo | B1–B5, A7 | The local snapshot is older (see §3) |
| OD-2 | Which licensed model (pick 1 of 3), or brief a freelancer instead | A1 → most of A and B | Biggest schedule risk |
| OD-3 | The two new colourways and their names and colours | A3, A4, C2 | The prototype has 6 and the brief requires 8 |
| OD-4 | Split the tour copy from 3 chapters to 4 | B4 | **Split 2026-10-21:** upper, foam, outsole, heel. The outsole copy is a placeholder until the product owner sends the specs |
| OD-5 | Make width (Standard / Wide 2E) a Shopify variant option? | C2, C4 | **Decided 2026-10-20:** stock is tracked by colour and size, and width is a variant only if more than one width is sold. Whether Wide is sold is still to confirm. See [Roadmap Step 4](Roadmap.md). |
| OD-6 | Which back-in-stock app or email platform | C9 | Shopify has no built-in back-in-stock notification |
| OD-7 | Which sport or prop theme goes with which colourway | A7, B3 | The brief lists 5 prop types |
| OD-8 | New hero text colours for the colourways that fail contrast | A4 | **Decided 2026-10-22: keep the prototype's colours for now** (5 pairs waived). Options for later: [A4_Contrast_Options.md](assets/A4_Contrast_Options.md) |
| OD-9 | Newsletter provider (Shopify Email / customer marketing consent, or Klaviyo) and whether the $20 trade-in launches | Footer, checkout | The prototype only fakes these |
| OD-10 | Markets: currency, countries, shipping zones and tax setup | C6 | **Decided 2026-10-20:** INR, India only, guest checkout first. Free-shipping threshold, payment gateway, prices and sizes are still to confirm. See [Roadmap Step 4](Roadmap.md). |
| OD-11 | The missing ~16 days: the brief lists 60 days of tasks against a 76-day plan | Planning | Probably a workstream D for performance, accessibility, QA and launch. Ask for it. |

## 9. Milestones (derived from task dependencies)

Phases are not defined in the brief, so this grouping follows the dependency graph:

1. **Foundations:** A1, A4, C1 (no dependencies, start on day 1), then A5, C2, C8.
2. **3D core:** A2 → A3 → A6 → A9, and A8 in parallel once A1 is done. The optional freelancer works here ("phase 2").
3. **Motion:** B1 (needs C1 and A2) → B2, B3, B4 → B5, B7, B8.
4. **Commerce:** C3, C4, C5 → C6 → C7, C9, then B6.
5. **Hardening and launch:** the missing ~16 days (OD-11).

The critical path is **A1 → A2 → A3 → A6 → A9 → C3**, with B1 starting as soon as A2 lands.

## 10. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| No licensed model fits (A1) | Pushes back almost every A and B task | Shortlist early and keep the freelancer option warm. Build B1 and C-tasks against the sample model meanwhile. |
| Mask-map recolour looks flat compared with designed materials | Weak product imagery | Lighting pass (A6) and a reference render. Allow per-zone roughness and sheen in tokens. |
| Motion jank on phones | Fails G3 and G6 | Single scroll controller, low-power mode, DPR cap, measure on real devices from week 1 |
| Cart and wishlist sync need features Shopify doesn't expose directly | C5 and C7 miss their checks | Store the cart ID and wishlist on the customer as metafields (see [Backend schema](Backend_Schema.md)) |
| Back-in-stock email needs a third-party app | C9 slips | Decide OD-6 early |
