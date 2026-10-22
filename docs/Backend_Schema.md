# TeraShoes Flux 01: Backend and Data Schema

| | |
|---|---|
| Status | Draft. Confirm names during C2, C7 and C8. |
| Inputs | [instructions.md](instructions.md), [PRD](PRD.md), [TRD](TRD.md) |

There is **no database of our own**. Shopify is the backend (headless). This document defines:

1. what lives where
2. the Shopify product, variant and metafield model
3. the content metaobjects
4. the colourway token file in the repo
5. customer data
6. the TypeScript domain types the front end uses
7. the API queries and cache tags

## 1. Where each piece of data lives

| Data | Lives in | Edited by | Why |
|---|---|---|---|
| Products, variants, prices, sale prices | Shopify product | Product owner | System of record, so prices change without a redeploy |
| Stock per variant | Shopify inventory | Product owner / operations | C2: stock shows without a redeploy |
| Colourway **design** (name, shoe zone colours, highlight and text colours, family, prop theme) | `tokens/colourways.json` in the repo | Developer, with product owner approval | It drives the shader, theme and CI contrast check (A4) |
| Colourway **merchandising** (note, badge, rank) | Shopify metaobject `colourway` | Product owner | Copy changes without a deploy |
| Hero headline, offers bar, FAQ, site settings | Shopify metaobjects | Product owner | C8 |
| Carts | Shopify Cart (Storefront API) | Shopper | C5 |
| Orders, payments, tax, shipping | Shopify checkout and orders | Shopify | C6 |
| Customers, wishlist, active cart pointer | Shopify customer and its metafields | Shopper | C7 |
| Product images (side, front, top, sole) | Shopify product media, one set per colour | `render-product-images` script (A9) | C3 grid and SEO |
| 3D assets | `public/3d/` on Vercel's CDN | Developer | A2, A3, A8 |

## 2. Product model (C2)

> **Decided 2026-10-20** ([Roadmap Step 4](Roadmap.md)): the store sells in **INR**, delivers in **India only**, and launches with **guest checkout** (customer data in §5 is deferred). Stock is tracked by colour × size. `Width` becomes the third option only if Wide (2E) is sold. The size system and range, prices and stock quantities are still to confirm, so the values below are placeholders from the prototype.

**One product, "Flux 01"** (handle `flux-01`), with up to three options:

| Option | Values | Notes |
|---|---|---|
| `Colour` | 8 values, for example Lime, Ember, Glacier, Obsidian, Amber, Coral, plus 2 new ones (OD-3) | Each value's name **must equal** a `name` in `colourways.json` (checked by a script in CI) |
| `Size` | `7`, `7.5`, `8`, `8.5`, `9`, `9.5`, `10`, `10.5`, `11`, `12` (men's US) | EU sizes come from a lookup: 40, 40.5, 41, 42, 42.5, 43, 44, 44.5, 45, 46 (from the prototype) |
| `Width` *(OD-5)* | `Standard`, `Wide (2E)` | Only if width has its own stock. Otherwise it's a cart line attribute. |

Variant count:
- **8 × 10 = 80** without width
- **160** with width

Both are within Shopify's limit of 2,048 variants per product, and three options is the maximum Shopify allows.

**Variant fields**

| Field | Rule | Example |
|---|---|---|
| `sku` | `FLX01-{COLOUR}-{US}[-W]` | `FLX01-LIME-10`, `FLX01-LIME-10-W` |
| `price` | Per colour (the prototype has $160 standard and $170 Obsidian) | `160.00` |
| `compareAtPrice` | Set only when on sale. **"Sale" is derived from this field**, not stored as a family. | Coral: `160.00` with price `128.00` |
| `inventoryPolicy` | `DENY` (no overselling) | — |
| inventory tracked | yes | Prototype sold-out sizes become stock 0 |
| media | 4 images per colour (A9), attached to that colour's variants | `flux01-lime-side.webp` |

**Product metafields** (namespace `custom`)

| Key | Type | Example |
|---|---|---|
| `weight_g` | `number_integer` | `268` |
| `drop_mm` | `number_integer` | `8` |
| `stack_heel_mm` / `stack_forefoot_mm` | `number_integer` | `33` / `25` |
| `rated_km` | `number_integer` | `800` |
| `materials` | `multi_line_text_field` | "Upper: 62% recycled polyester knit…" |
| `care` | `multi_line_text_field` | "Hand wash cold…" |
| `size_guide` | `metaobject_reference → size_guide` | — |

**Storefront API access:** give every metafield and metaobject definition storefront read access. Without it the headless site can't read them.

### 2.1 Alternative (rejected unless decided otherwise)
One product per colourway, with options Size × Width, grouped by a metafield. Grid cards would map one-to-one with products, but stock, SKUs and reviews get split across 8 products, and the brief says "Flux 01 with 8 colourway variants". **Recommendation: a single product.**

## 3. Content metaobjects (C8)

| Metaobject type | Fields | Entries |
|---|---|---|
| `colourway` | `token_id` (text, must equal a JSON `id`), `note` (text, e.g. "Lime knit · mint stripes"), `badge` (text, optional: New, Limited), `rank` (integer, Featured sort order) | 8 |
| `hero` | `headline` (text, default "Tera Flux"), `subline` (text), `cta_label` (text, default "Shop now") | 1 |
| `offers_bar` | `messages` (list of text: "Free shipping over $150", "60-day returns", …) | 1 |
| `faq_item` | `question` (text), `answer` (rich text), `order` (integer) | 4 to start: fit, delivery, returns, trade-in |
| `site_settings` | `free_shipping_threshold` (money), `standard_shipping` (money), `express_shipping` (money), `returns_days` (integer) | 1. The meter and copy read these values. The actual rates are configured in Shopify shipping zones and must match. |
| `size_guide` | `rows` (JSON: `[{us, eu, uk, cm}]`), `fit_note` (rich text) | 1 |

## 4. Colourway tokens (A4): `tokens/colourways.json`

This is the single source of truth for colourway **design**. The prototype's `PRODUCTS` array is the seed data.

### 4.1 JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["version", "colourways"],
  "properties": {
    "version": { "const": 1 },
    "colourways": {
      "type": "array",
      "minItems": 8,
      "items": {
        "type": "object",
        "required": ["id", "name", "status", "family", "shoe", "swatch", "highlight", "onHighlight", "heroInk", "accentOnInk", "props"],
        "additionalProperties": false,
        "properties": {
          "id":       { "type": "string", "pattern": "^[a-z][a-z0-9-]*$" },
          "name":     { "type": "string" },
          "status":   { "enum": ["approved", "proposed"] },
          "family":   { "enum": ["warm", "cool", "dark"] },
          "shoe": {
            "type": "object",
            "required": ["upper", "stripes", "sole"],
            "properties": {
              "upper":   { "$ref": "#/$defs/hex" },
              "stripes": { "$ref": "#/$defs/hex" },
              "sole":    { "$ref": "#/$defs/hex" },
              "roughness": { "type": "number", "minimum": 0, "maximum": 1 },
              "sheen":     { "type": "number", "minimum": 0, "maximum": 1 }
            }
          },
          "swatch":      { "type": "array", "items": { "$ref": "#/$defs/hex" }, "minItems": 2, "maxItems": 2 },
          "highlight":   { "$ref": "#/$defs/hex" },
          "onHighlight": { "$ref": "#/$defs/hex" },
          "heroInk":     { "$ref": "#/$defs/hex" },
          "accentOnInk": { "$ref": "#/$defs/hex" },
          "props":       { "enum": ["tennis", "badminton", "table-tennis"] }
        }
      }
    }
  },
  "$defs": { "hex": { "type": "string", "pattern": "^#[0-9a-fA-F]{6}$" } }
}
```

| Field | Prototype field | Meaning |
|---|---|---|
| `highlight` | `hl` | Hero background and site accent (`--hl`), and 3D rim light |
| `onHighlight` | `on` | Text and icons on `highlight` |
| `heroInk` | `hi` | Hero headline and nav text |
| `accentOnInk` | *(new)* | Accent text on the dark band and the back-to-top button. Fixes Obsidian's 1.41:1 (see [UI/UX §2.3](UI_UX.md)). |
| `swatch` | `a`, `b` | The two halves of the swatch dot |
| `shoe.*` | *(new)* | Shader zone colours (A3). The prototype used whole textures instead. |
| `props` | *(new)* | Which prop set appears in the hero (OD-7) |

### 4.2 Example entry (Lime, seeded from the prototype)

```json
{
  "id": "lime",
  "name": "Lime",
  "status": "approved",
  "family": "cool",
  "shoe": { "upper": "#8ee03c", "stripes": "#e8ffc2", "sole": "#f4f6ee", "roughness": 0.8, "sheen": 0.3 },
  "swatch": ["#8ee03c", "#e8ffc2"],
  "highlight": "#34d27b",
  "onHighlight": "#0b1f12",
  "heroInk": "#0b1f12",
  "accentOnInk": "#34d27b",
  "props": "tennis"
}
```

`highlight`, `onHighlight`, `swatch` and `family` come from the prototype. `shoe.sole`, `roughness` and `sheen` are placeholders until A3. `heroInk` was `#ffffff` in the prototype, which gives 1.97:1 and fails. It is shown here switched to `onHighlight` as the proposed fix (OD-8).

### 4.3 Contrast check (`scripts/contrast-check.ts`)

For every colourway it asserts these WCAG ratios and fails CI if any is below:
- `heroInk` on `highlight` ≥ 4.5
- `onHighlight` on `highlight` ≥ 4.5
- `accentOnInk` on `#101216` ≥ 4.5
- `ink` on `tint` ≥ 4.5

## 5. Customer data (C5, C7)

Customer metafields (namespace `custom`). Each needs a definition that grants **customer account read and write** access, so the Customer Account API `metafieldsSet` mutation can write it.

| Key | Type | Content | Written when |
|---|---|---|---|
| `wishlist` | `json` | `{"v":1,"items":[{"colourway":"lime","addedAt":"2026-10-17T10:00:00Z"}]}` | The wishlist heart is toggled while signed in, and on sign-in merge |
| `active_cart_id` | `single_line_text_field` | `gid://shopify/Cart/…` | The cart is created or attached after sign-in. It is read on another device to restore the bag. |

Guest data stays on the device only:

| Store | Key | Content |
|---|---|---|
| httpOnly cookie | `ts_cart` | Shopify cart ID |
| `localStorage` | `terashoes-wish` | `["lime","ember"]`, merged into the account at sign-in, then cleared |

**Merge rules:**
- **Wishlist:** union by `colourway`, keeping the earliest `addedAt`.
- **Cart:** add the device cart's lines into the account cart (the same variant sums its quantity, capped at 5 like the prototype). Then point `active_cart_id` and the cookie at the account cart.

## 6. Front-end domain types

```ts
export type ColourwayId = string;            // "lime"
export type Family = 'warm' | 'cool' | 'dark';               // extend only with product owner approval

export interface Colourway {                 // tokens JSON merged with the Shopify colourway metaobject
  id: ColourwayId; name: string; family: Family;
  note: string; badge?: string; rank: number;
  shoe: { upper: string; stripes: string; sole: string; roughness?: number; sheen?: number };
  swatch: [string, string];
  highlight: string; onHighlight: string; heroInk: string; accentOnInk: string;
  props: 'tennis' | 'badminton' | 'table-tennis';
}

export interface Money { amount: string; currencyCode: string }

export interface Variant {
  id: string;                                // gid://shopify/ProductVariant/…
  sku: string; colour: ColourwayId; sizeUS: string; sizeEU: string;
  width: 'Standard' | 'Wide (2E)';
  price: Money; compareAtPrice?: Money;
  availableForSale: boolean; quantityAvailable?: number;
}

export interface ColourwayListing {          // one shop-grid card
  colourway: Colourway;
  price: Money; compareAtPrice?: Money; onSale: boolean;
  images: { side: string; front: string; top: string; sole: string };
  availableSizes: string[];                  // used by the size filter
}

export interface CartLine { id: string; variant: Variant; quantity: number }
export interface Cart {
  id: string; checkoutUrl: string; lines: CartLine[];
  subtotal: Money; total: Money; discountCodes: { code: string; applicable: boolean }[];
}
```

## 7. API surface

### 7.1 Storefront API operations (GraphQL, typed by Codegen)

| Operation | Use | Cache tag |
|---|---|---|
| `Product(handle)`: options, variants (`first: 250`) with price, compareAtPrice, availableForSale, quantityAvailable, selectedOptions, image; metafields | Product page, grid, search | `product:flux-01`, `products` |
| `Metaobjects(type)` for `colourway`, `hero`, `offers_bar`, `faq_item`, `site_settings`, `size_guide` | Content | `content` |
| `cartCreate`, `cart(id)`, `cartLinesAdd`, `cartLinesUpdate`, `cartLinesRemove`, `cartDiscountCodesUpdate`, `cartBuyerIdentityUpdate` | Bag | not cached |

### 7.2 Customer Account API operations

| Operation | Use |
|---|---|
| OAuth authorize → token (PKCE) → refresh, and logout | Sign-in and sign-out |
| `customer { firstName, emailAddress, metafields(wishlist, active_cart_id), orders(first: 20) { … } }` | Account page, wishlist and cart restore |
| `metafieldsSet` | Save wishlist and `active_cart_id` |

### 7.3 Our route handlers (Next.js)

| Route | Method | Purpose | Auth |
|---|---|---|---|
| `/api/revalidate` | POST | Shopify webhook to `revalidateTag` | HMAC (`X-Shopify-Hmac-Sha256`) |
| `/account/login` | GET | Start OAuth (PKCE challenge, state) | — |
| `/account/callback` | GET | Exchange the code, set token cookies, merge wishlist and cart | `state` check |
| `/account/logout` | GET | Clear cookies and end the Shopify session | — |

Cart, wishlist and other mutations run as **server actions**. There is no other public API.

### 7.4 Webhooks to cache tags

| Shopify topic | Revalidates |
|---|---|
| `products/update`, `products/create`, `products/delete` | `products`, `product:{handle}` |
| `inventory_levels/update` | `products` (stock) |
| `metaobjects/create`, `metaobjects/update`, `metaobjects/delete` | `content` |

## 8. Where each prototype field goes

| Prototype `PRODUCTS` field | New home |
|---|---|
| `id`, `name` | Tokens `id`, `name`, plus the Shopify `Colour` option value |
| `note` | Metaobject `colourway.note` |
| `price`, `was` | Variant `price`, `compareAtPrice` |
| `badge` | Metaobject `colourway.badge`. "−20%" is computed from `compareAtPrice`, not typed in. |
| `fam` | Tokens `family`. **"sale" is dropped from family** and derived from `compareAtPrice`. |
| `tex`, `gltf` | Dropped. Replaced by the shader and `shoe.*` colours (A3). |
| `a`, `b` | Tokens `swatch` |
| `hl`, `on`, `hi` | Tokens `highlight`, `onHighlight`, `heroInk` |
| `sold` | Variant inventory = 0 |
| `rank` | Metaobject `colourway.rank` |
| `SIZES` | `Size` option values plus the EU lookup in `size_guide` |
| `FAQ` | `faq_item` metaobjects |
| `localStorage` cart / wish | Shopify cart plus the `ts_cart` cookie, and the customer `wishlist` metafield |
