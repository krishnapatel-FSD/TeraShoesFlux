# TeraShoes Flux 01: Build roadmap

The working plan, in the order the steps are done. Each step lists the brief's task IDs it covers ([instructions.md](instructions.md)) and its current status.

Ground rule for now: **the prototype is final.** The codebase replicates it exactly (colours, text styles, copy, motion) until the product owner decides otherwise.

| Step | Status (2026-10-20) |
|---|---|
| 1. Create the project structure | ✅ Done locally. The Vercel preview per branch waits for Step 6. |
| 2. Prepare the 3D assets | ⏳ The shoe is decided: the prototype's model stays (21 Oct 2026, no new model). Still waiting on Mixamo and the latest prototype. Blender 5.2.2 LTS is installed. |
| 3. Rebuild the design and motion | ✅ Done as a faithful replica of the prototype |
| 4. Connect Shopify | ⏳ Code built and tested against fixtures; waiting on the store, tokens and the pending values (prices, sizes, stock, shipping). Payment gateway decided later. |
| 5. Optimise and test | Not started |
| 6. Deploy | Not started |

## Step 1 — Create the project structure
Set up Next.js, React, TypeScript, Tailwind, and the required dependencies. Establish a clear folder structure for pages, components, 3D assets, animations, and store integrations.
- Brief tasks: **C1** (except the Vercel preview, which comes in Step 6)
- Details: [TRD §2–3](TRD.md)

## Step 2 — Prepare the 3D assets
Choose the licensed shoe model, optimise it in Blender, prepare its materials and colour masks, and export it as GLB. Build the colourway system and prepare the props and character.
- Brief tasks: **A1–A8**
- Done: export and validation scripts (`pnpm assets:*`), a stand-in shoe from the prototype, the prototype's six colourways, tennis balls, and a parked recolour shader
- Waiting on:
  - ~~the model licence decision and purchase~~ decided 21 Oct 2026: keep the prototype's model ([A1_Model_Selection.md](assets/A1_Model_Selection.md))
  - a Mixamo sign-in for the character (A8)
  - the latest shared prototype, for rackets, shuttlecocks, paddles and players (OD-1)
- Steps: [A2_A3_Pipeline.md](assets/A2_A3_Pipeline.md)
- Plan to finish Workstream A: [plans/Plan_A_3D_Shoe.md](plans/Plan_A_3D_Shoe.md)

## Step 3 — Rebuild the design and motion
Recreate the hero, scrolling 3D tour, colour transitions, product viewer, and micro-interactions using reusable React components, GSAP, and Lenis.
- Brief tasks: **B1–B3, B6**, and the prototype's own parts of B4 and B7
- Done:
  - the prototype's markup, stylesheet, data and motion, ported one to one
  - GSAP 3.12.5, Lenis 1.1.13 and three 0.160.0, as in the prototype
  - side-by-side screenshots match, and 14 end-to-end tests pass
- Not in the prototype, so not built yet: the 4th tour chapter (B4), the hero character (B5), low-power mode (B7) and the video fallback (B8)
- Plan to finish Workstream B: [plans/Plan_B_Motion.md](plans/Plan_B_Motion.md)

## Step 4 — Connect Shopify
Set up products and variants, connect the Storefront API, implement the shop and product pages, and add the cart, checkout, customer accounts, and editable content.
- Brief tasks: **C2–C6, C8, C9**. C7 (accounts) is deferred, because launch is guest checkout first.
- Plan: [Backend_Schema.md](Backend_Schema.md), [TRD §7–8](TRD.md), [User_Flow.md](User_Flow.md)
- Starting point:
  - `src/data/catalogue.ts` holds the products, sizes and FAQ today; Shopify replaces it
  - `src/state/actions.ts` holds the bag and wishlist logic, which currently saves to `localStorage`
  - the shop, product, bag and search components already exist

### Decisions (product owner, 2026-10-20)

| Topic | Decision | Status | What it changes |
|---|---|---|---|
| Currency | **INR (₹)** | Settled | Prices show in rupees. The prototype's `$` formatting becomes Shopify's money format (₹, Indian digit grouping). This is the only intended visual change from the prototype. |
| Delivery | **India only** | Settled | One Shopify market (India) with shipping zones inside India |
| Stock | **Tracked by colour and size.** Width becomes a variant only if more than one width is sold. | Settled rule; **width still to confirm** | 6 colours × 10 sizes = 60 variants. If Wide (2E) is sold: × 2 = 120 variants, each with its own stock. If not: the Standard/Wide selector is removed. |
| Accounts | **Guest checkout first** | Settled | No sign-in, order history or account wishlist at launch (C7 deferred). Bag stays in a cookie, wishlist stays on the device. |
| Free-shipping threshold | Confirm after prices and delivery costs are known | **Pending** | Stored as a setting in Shopify (`site_settings`), so no code change when it's decided. Band, FAQ and bag copy read it. |
| Payment provider and methods | Choose and verify | **Pending: recommendation below** | Configured in Shopify settings. Shopify's hosted checkout shows them. |
| Size range, prices, stock quantities | Confirm before the store is populated | **Pending** | The setup script reads them from one file, so filling it in is the only step left |

### Facts that shape the pending decisions
- **Payments:** Shopify Payments is not available for stores in India, so a third-party gateway is needed. The common choices are Razorpay, Cashfree and PayU, which cover UPI (Google Pay, PhonePe, Paytm), cards, netbanking, wallets and EMI. Cash on delivery is built into Shopify. Shopify adds its own transaction fee when a third-party gateway is used (2% on Basic, less on higher plans). Apple Pay and Google Pay as express buttons (brief C6) depend on Shopify Payments, so in India "Google Pay" means UPI through the gateway. *Verify against Shopify's and the gateway's current docs before choosing.*
- **GST:** since 22 Sep 2025, footwear up to **₹2,500 per pair is 5%** and above that is **18%**, based on the transaction value. A price just above ₹2,500 costs 13 points more tax, so the price points matter. Shopify should be set to "prices include tax", as is usual for Indian consumer prices. *Confirm with your accountant.*
- **Sizes:** the prototype shows men's US sizes with EU equivalents. Indian buyers mostly use UK/India sizes. Pick the size system to display along with the range.

### Built so far (2026-10-20, no store connected yet)
The code is ready and runs on the prototype's data until `.env.local` holds the store's tokens. It then switches to Shopify with no code change.

| Piece | Where | State |
|---|---|---|
| Typed Storefront and Admin API operations (GraphQL Codegen against Shopify's 2026-10 schema) | `.graphqlrc.ts`, `src/lib/shopify/types`, `scripts/shopify/types` | ✅ Generated; every query is checked against the schema |
| Catalogue from Shopify: prices, sale prices, stock and sold-out sizes, sizes, widths, ₹ formatting | `src/lib/shopify/catalogue.ts`, `src/lib/catalogue/*` | ✅ Unit-tested with a sample Shopify response. Not yet run against a real store. |
| Editable content: hero text, band words, FAQ, shipping threshold, size system (C8) | metaobjects `site_content`, `faq_item`, `colourway` | ✅ Read by the site; created by the setup script |
| Bag on the Cart API, kept in a cookie; Checkout goes to Shopify (C5, C6) | `src/lib/shopify/cart.ts`, `src/state/actions.ts` | ✅ Built. Needs a store to test. |
| Webhook refresh (stock, prices, content without a redeploy) | `src/app/api/revalidate/route.ts` | ✅ Signature check unit-tested. Needs a public URL (Step 6 preview). |
| Store setup script | `pnpm shopify:setup` reading `scripts/shopify/store-config.mts` | ✅ Typechecked against the Admin schema. Refuses to run until the pending values are filled in (or with `--allow-placeholders` on a dev store). |
| Prototype look | — | ✅ Unchanged: all sections' text matches the prototype, and 14/14 e2e tests pass |

### Your steps to connect the store
1. Create the development store and set its currency to **INR**.
2. Install the **Headless** sales channel and create a storefront. Copy its Storefront tokens into `.env.local` (see `.env.example`).
3. Create an app in the Shopify **Dev Dashboard** (dev.shopify.com; since 2026 custom apps are no longer made under Settings → Apps), in the same organization as the store, with the scopes listed in `.env.example`. Install it on the store, then copy its **client ID** and **client secret** into `.env.local` (`SHOPIFY_ADMIN_CLIENT_ID`, `SHOPIFY_ADMIN_CLIENT_SECRET`, and the secret again as `SHOPIFY_WEBHOOK_SECRET`). The scripts exchange them for a 24-hour token themselves.
4. Fill in the `null` values in `scripts/shopify/store-config.mts`: sizes, prices, stock, widths and shipping. Or ask me to run the script with placeholders on the dev store first.
5. Run `pnpm shopify:setup`, then `pnpm dev`. The site now shows the store's data.
6. Payment gateway: later, as decided.

### Still needed from you
- A Shopify **development store**, the Headless channel tokens and the Admin app's client ID and secret, all in `.env.local`
- **Payment gateway** account (KYC is done by you with the gateway)
- **Prices in ₹, the size system and range, stock per size, and whether Wide is sold**
- **Delivery costs** (standard and express), then the free-shipping threshold

## Step 5 — Optimise and test
Test on phones and desktops, improve loading speed, implement reduced-motion support and fallbacks, verify checkout, and check accessibility.
- Brief tasks: **B7, B8**, the brief's performance and accessibility goals, and the missing ~16 days (OD-11)
- Plan: [TRD §9–11](TRD.md), [UI_UX §5–7](UI_UX.md)
- Known items:
  - real-device testing
  - the 3D assets weigh about 7 MB (the prototype's original textures)
  - a 30 fps cap on battery and a hero video without WebGL
  - contrast: 5 colour pairs are below AA (OD-8)
  - a real test order and refund in Shopify

## Step 6 — Deploy
Push the code to Git, verify the Vercel preview, configure the production domain and environment variables, and launch after final approval.
- Brief tasks: **C1** (preview per branch), launch
- Plan: [TRD §12](TRD.md)
- Needs from you:
  - a GitHub repository
  - a Vercel account and project
  - the production domain
  - Shopify production credentials
  - the product owner's final approval
