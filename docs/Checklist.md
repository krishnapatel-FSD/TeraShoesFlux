# TeraShoes build checklist

Status of every task in the brief ([instructions.md](instructions.md)) as of **21 Oct 2026**. "Done" means the brief's *Done when* check is met.

**Key:**
- ✅ Done
- 🟡 Partly done
- ⛔ Blocked (waiting on the product owner, a purchase or an account)
- ⏸ Deferred by decision
- ⬜ Not started

> The build currently replicates the prototype exactly (product owner decision, 2026-10-17). Where the brief asks for more than the prototype has (8 colourways, 4 tour chapters, rackets and paddles), that part is marked as remaining, not built.

**Summary:**

| | Total | ✅ | 🟡 | ⛔ | ⏸ | ⬜ |
|---|---|---|---|---|---|---|
| A: 3D shoe | 9 | 7 | 2 | 0 | 0 | 0 |
| B: Motion | 8 | 8 | 0 | 0 | 0 | 0 |
| C: Store | 9 | 0 | 7 | 0 | 1 | 1 |

---

## What the build must fix or add
- [x] **Own designed shoe:** not needed. The product owner decided on 21 Oct 2026 to keep the prototype's sample model (CC BY 4.0, credited in the footer)
- [ ] **Designed materials, not texture recolours:** the recolour shader exists but is parked; the prototype's textures are in use (A3)
- [ ] **Real checkout, payments, accounts and stock:** Shopify code built; store, gateway and test order pending (C2–C7)
- [ ] **Placeholder copy:** the tour's outsole chapter (title, body, two facts) is marked `[Placeholder]` until the real specs arrive (OD-4)
- [x] **No more single 2,000-line HTML file:** React components, unit tests, 16 end-to-end tests, 10 pixel-exact screenshot tests and 8 motion timing tests
- [ ] **CMS:** editable hero, band and FAQ built on Shopify metaobjects, not yet tested on the store (C8)
- [ ] **Tested on phones:** only a Pixel 7 emulation in headless Chrome, no real devices
- [x] **3D asset weight:** the model is 2.73 MB (was 6.99 MB, budget 3 MB). The six colourway textures (0.5–0.7 MB each) load one at a time, the rest after the intro

---

## Workstream A: 3D shoe and product design

Plan to finish: [plans/Plan_A_3D_Shoe.md](plans/Plan_A_3D_Shoe.md)

| ID | Task | Status | Done | Remaining |
|---|---|---|---|---|
| A1 | Shortlist 3 licensed models; product owner picks one | ✅ | **Decided by the product owner (21 Oct 2026): no new model.** TeraShoes keeps the prototype's shoe, "Materials Variants Shoe" © 2021 Shopify, under CC BY 4.0, which allows commercial use with credit. The credit is in the footer and the licence in `licenses/` | — |
| A2 | Prepare in Blender: <40k triangles, UVs, AO, GLB | ✅ | `pnpm assets:model` builds `public/3d/flux01/`: **2.73 MB** (was 6.99 MB), 22,700 triangles, glTF Validator 0 errors. Geometry Meshopt-compressed; the model's textures re-encoded as full-size WebP q88, and renders before and after differ by no visible amount (39–50 dB) | — |
| A3 | Mask maps and recolour shader, 8 colourways from one model | ✅ | **Decided by the product owner (22 Oct 2026): keep the prototype's texture recolours**, 6 colourways (one colour texture each, Coral from the model's built-in variant). The zone shader stays parked; no mask ships | — |
| A4 | Colourway tokens JSON and contrast-check script | 🟡 | `tokens/colourways.json` is the single source for colourway colours. `pnpm tokens:check` is a gate in `pnpm check`: it fails below AA unless a pair has a written waiver. Options prepared ([A4_Contrast_Options.md](assets/A4_Contrast_Options.md)) | **Decided by the product owner (22 Oct 2026): keep the prototype's colours for now.** 5 pairs stay below AA and pass by waiver; the *Done when* (AA for every hero colour) stays open until the options are revisited (OD-8) |
| A5 | Brand basics: logo SVG, type scale, colour tokens, base components | ✅ | Logo as SVG (`public/brand/`, `pnpm brand:logo`) and a `<Logo/>` component; type scale and every colour as named tokens (`src/styles/design-tokens.css`); `pnpm theme:check` finds no colour literals outside the theme; base components (icons, accordion). Screenshots match pixel for pixel | — |
| A6 | Lighting matched to a reference render | ✅ | **Approved by the product owner (22 Oct 2026), no change.** `pnpm assets:lighting` renders a path-traced Cycles reference under the site's exact light rig (studio HDR exported from the site, `STUDIO_LIGHTS`); every shot is within 3% of it in brightness ([A6_Lighting_Check.md](assets/A6_Lighting_Check.md)) | — |
| A7 | Procedural props as R3F components | ✅ | `<TennisBall>`, `<Racket>`, `<Shuttlecock>`, `<Paddle>`: reusable R3F components with their own colour props, each 2 units long (`src/three/props/`, unit-tested). See them on the dev-only `/dev/props` page | Not on the page yet: the designs and which colourway gets which prop wait on the latest shared prototype (OD-1, OD-7) |
| A8 | Rigged hero character, <2 MB GLB | ✅ | Replaced Mixamo on 23 Oct 2026 with free assets: a MakeHuman (MPFB2) runner in an emerald shirt, dark shorts and running shoes, with Quaternius' idle, jog and sprint retargeted onto him, built by `pnpm assets:character` into `public/3d/character/character.glb`: **1.47 MB**, 33,220 triangles, his shirt and shoes recoloured to each colourway (shirt in its stripe colour, shoes in its knit with stripe accents), glTF Validator 0 errors. Licences (CC0, two CC BY items credited) in `licenses/character-makehuman.md` | — |
| A9 | Script renders 4 product images per colourway and uploads them | 🟡 | `pnpm assets:images` renders side, front, top and sole for each colourway (2048 px, transparent PNG) with the site's lighting and materials; `--upload` sends them to the product media and sets variant images | Run `--upload` once the store and the Admin app (client ID and secret) are set up. The renders are final for this shoe (re-render only if A3 changes the materials) |

## Workstream B: Motion and animation

Plan to finish: [plans/Plan_B_Motion.md](plans/Plan_B_Motion.md)

| ID | Task | Status | Done | Remaining |
|---|---|---|---|---|
| B1 | Lenis, GSAP and a single scroll controller docking the shoe | ✅ | One controller (`src/three/scrollDock.ts`, GB-1) replaces the prototype's 4 overlapping scroll animations, which threw the shoe up to 334 px in one frame. Same poses and scroll ranges; the shoe follows with a speed-capped spring. `pnpm test:motion`: 10 s of fast scrolling, worst on-screen move 40–47 px per 1/60 s (limit 58, 8% of the screen) and settled 0.5 s after the page stops, at 60 and 30 fps | — |
| B2 | Hero intro: loader, fly-in, letters, props | ✅ | All of it, as in the prototype. Measured by `pnpm test:motion` (production build, real GPU): the whole intro ends **2.42–2.44 s** after the model loads (target ≤ 2.5 s) | — (the margin is under 0.1 s; re-measure on a slower device) |
| B3 | Colour change: wash, spin, prop swap, site recolour | ✅ | One GSAP timeline per click (GB-2 timings): wash, price count-up, label, headline bounce, shoe spin, material swap and ball bounce; site colours by a 0.9 s CSS transition. `pnpm test:motion`: **1.0–1.1 s** (was about 1.6 s), and the shoe's material switches exactly once (no flicker) | Prop *swap* joins the timeline once the other props exist (A7, OD-7) |
| B4 | 3D tour, one camera move per chapter (4 chapters) | ✅ | 4 chapters (GB-3): upper, foam, outsole, heel. Each move between chapters is a camera move (dolly and orbit), and each chapter holds still for at least 40% of its scroll while its text shows (unit-tested). Tour 420vh (4 × 80vh) | **Outsole copy is a placeholder** (marked `[Placeholder]` on the page): replace with the real specs before launch (OD-4) |
| B5 | Hero character: idle, swing, head follows the cursor | ✅ | The real character in the hero: idle loop, a swing on each colour change (on the B3 timeline), head turning toward the cursor, still under reduced motion. `pnpm test:motion`: **60 fps** on this Iris Xe laptop (a 2022 mid-range machine) | Placement (right of the shoe, clear of the price; hidden on phones) is provisional until the latest prototype (OD-1) |
| B6 | Micro-interactions under 600 ms | ✅ | GB-2 timings: add-to-bag fly 0.5 s with the bag count popping as it lands, wishlist pop 0.5 s, size-error shake 0.5 s; button fills unchanged (CSS 0.45 s). `pnpm test:motion`, timed from the click: shake 0.49–0.56 s, pop 0.47–0.50 s, add to bag 0.52–0.54 s. No page transitions (single page) | — |
| B7 | Reduced motion and low-power mode | ✅ | Reduced motion: native scroll, no intro or wash, static scene; an e2e audit confirms nothing moves on its own (the tennis balls' idle bob now stops too). Low-power mode on battery or when frames average > 25 ms: 30 fps, pixel ratio 1, three balls (measured 29–30 fps) | Open question: TRD §9 also turns off smooth scrolling in low-power mode (not in Plan B) |
| B8 | 10 s hero video fallback without WebGL | ✅ | `pnpm assets:hero` records the real scene: a seamless 10 s loop as a transparent WebM (between the headline copies, like the canvas) and an MP4 for Safari, in landscape and portrait; stills per colourway for the hero, the tour chapters and the product viewer; the colourway thumbnails. Without WebGL the page shows them, and an e2e test plus the screenshot tests check it | Re-record after A3 (the real shoe) |

## Workstream C: Store features

Decided 2026-10-20: INR, India only, stock by colour × size, guest checkout first.

| ID | Task | Status | Done | Remaining |
|---|---|---|---|---|
| C1 | Next.js, TS, Tailwind, R3F, linting, Vercel preview per branch | 🟡 | Everything except the preview. `pnpm check` and the e2e tests pass | GitHub repository and Vercel project (Step 6) |
| C2 | Shopify store, variants, stock, prices, typed client | 🟡 | Typed Storefront and Admin clients, catalogue mapping (tested), setup script, webhook refresh | **You:** dev store ✅, Headless tokens, Dev Dashboard app, sizes, ₹ prices and stock. **Me:** update the script for the client ID and secret, then run it |
| C3 | Shop grid from Shopify, colour and size filters, sort, filters in the URL | 🟡 | Grid, colour-family filters and sort (reads Shopify when connected) | Size filter, and keeping filters in the URL |
| C4 | Product page: viewer, swatches, live stock, width, size guide | 🟡 | All built; sold-out sizes can't be added; width shown only when sold | Check against the real store. Size guide is only a link to the FAQ, as in the prototype |
| C5 | Bag on the Cart API, free-shipping meter, discount codes | 🟡 | Cart API bag kept in a cookie (survives refresh), free-shipping meter | Discount codes. Second-device bag needs accounts (C7) |
| C6 | Shopify hosted checkout, payments, tax and shipping | 🟡 | Checkout button goes to Shopify's checkout | **You:** payment gateway (Shopify Payments isn't available in India), shipping zones, GST. Then a test order and refund |
| C7 | Accounts, order history, saved wishlist | ⏸ | — | Deferred (guest checkout first) |
| C8 | Hero headline, offers bar, FAQ as metaobjects | 🟡 | Built; the setup script creates them | Check that the product owner can edit them in the store |
| C9 | Branded order, shipping and back-in-stock emails | ⬜ | — | Email templates. Back-in-stock needs an app (OD-6) |

---

## Your open items (in the order they unblock work)
1. [x] Create the development store (Dev Dashboard) and set the currency to INR
2. [ ] Store defaults: India backup region, metric units, kg, IST time zone; Markets shows India as primary
3. [ ] Install the Headless channel and put its tokens in `.env.local`
4. [ ] Create the Dev Dashboard app with the Admin scopes, install it, put its client ID and secret in `.env.local`
5. [ ] Sizes, ₹ prices, stock and shipping costs in `scripts/shopify/store-config.mts`, or ask for placeholders
6. [ ] Payment gateway choice (later)
7. [ ] Model licence decision and purchase (A1)
8. [ ] Latest shared prototype link (A7, rackets and paddles)
9. [x] Hero character from free assets (A8): no sign-in needed
10. [ ] Product owner: contrast fix (OD-8), 2 extra colourways (OD-3), 4th tour chapter (OD-4)
11. [ ] Ask for the missing ~16 days of tasks (probably a workstream D: performance, accessibility, QA, launch)
12. [ ] GitHub repository and Vercel account (Step 6)

Nothing is committed to git yet.
