# TeraShoes Flux 01: User Flows

| | |
|---|---|
| Status | Draft |
| Related | [PRD](PRD.md), [UI/UX spec](UI_UX.md), [TRD](TRD.md), [Backend schema](Backend_Schema.md) |

The diagrams use Mermaid, which renders on GitHub and in most Markdown viewers. Task IDs in brackets show which task delivers each step.

## 1. Site map

```mermaid
flowchart TD
  Home["/ Home<br/>Hero → Band → Tour → Product → Shop → Perks → FAQ → Footer"]
  Shop["/shop?family&size&sort"]
  PDP["/products/flux-01?colour&size&width"]
  Acc["/account"]
  Orders["/account/orders"]
  Wish["/account/wishlist"]
  CO(["Shopify hosted checkout"])
  Home --> Shop --> PDP
  Home --> PDP
  PDP --> Bag{{Bag drawer}}
  Shop --> Bag
  Bag --> CO
  Home -. header .-> Search{{Search}} --> PDP
  Home -. header .-> Menu{{Menu}}
  Home -. header .-> Acc --> Orders
  Acc --> Wish --> PDP
```

## 2. First visit: discover → buy (the main flow)

```mermaid
flowchart TD
  A([Land on /]) --> B{WebGL available?}
  B -- no --> B1[Hero video loop B8<br/>static images below] --> D
  B -- yes --> C[Loader ring with percent<br/>then hero intro ≤ 2.5 s B2]
  C --> D[Hero: shoe, headline, props, colour dots]
  D --> E{Pick a colour dot?}
  E -- yes --> F[Colour change ≤ 1.2 s B3<br/>wash, spin, props swap, site recolours]
  F --> D
  E -- scroll --> G[Tour: 4 chapters, shoe docks B1/B4]
  E -- Shop now --> H
  G --> H[Product section: viewer + buy box C4]
  H --> I[Choose colour, size, width, qty]
  I --> J{Size selected<br/>and in stock?}
  J -- no size --> J1[Size-error shake + message B6] --> I
  J -- sold out --> J2[Button disabled, can't add] --> I
  J -- yes --> K[Add to bag: fly-to-bag animation B6<br/>cartLinesAdd C5]
  K --> L[Bag drawer opens<br/>free-shipping meter]
  L --> M{Discount code?}
  M -- yes --> M1[cartDiscountCodesUpdate] --> L
  M -- no --> N[Checkout → cart.checkoutUrl C6]
  N --> O([Shopify checkout: cards, Apple Pay, Google Pay])
  O --> P([Order confirmation page + branded email C9])
```

## 3. Colour change (B3)

```mermaid
sequenceDiagram
  actor U as Shopper
  participant UI as Swatch / colour dot
  participant TL as colourChange timeline
  participant GL as 3D scene
  participant CSS as CSS tokens
  U->>UI: click colour (x, y)
  UI->>TL: colourChange(id, origin)
  par within 1.2 s
    TL->>CSS: circular wash from (x, y)
    TL->>GL: shoe 360° spin + scale pulse
    TL->>GL: tween shader zone colours mid-spin (no texture load)
    TL->>GL: props shrink, swap theme, spring back
    TL->>CSS: --hl / --on-hl / --hero-ink transition
    TL->>GL: rim light lerps to highlight
  end
  TL-->>UI: update URL ?colour=id, aria-pressed, price, sizes
  Note over U,CSS: Reduced motion: every step is instant, no wash or spin
```

## 4. Shop and filter (C3)

```mermaid
flowchart TD
  A([Open /shop or scroll to Shop]) --> B[Grid: one card per colourway<br/>from Shopify + A9 images]
  B --> C{Action}
  C -- filter chip / size --> D[Update URL ?family=&size=]
  C -- sort --> E[Update URL ?sort=]
  D --> F[FLIP re-layout, count updates]
  E --> F
  F --> C
  C -- copy link --> G([Shared link opens the same results])
  C -- quick add --> H[Inline size picker<br/>sold-out sizes disabled]
  H --> I[cartLinesAdd → toast + bag count]
  C -- open card --> J[Product page in that colour]
  C -- heart --> K[[Wishlist flow §6]]
```

## 5. Search

```mermaid
flowchart LR
  A([Header search icon or /]) --> B[Search dialog, focus in input]
  B --> C[Type: name, note, family or 'sale']
  C --> D{Matches?}
  D -- yes --> E[Result list with swatch + price]
  E --> F[Select → colour change + go to product]
  D -- no --> G["No colourway matches 'x'. Try lime, cool or sale."]
  B -- Esc --> H([Close, focus returns to icon])
```

## 6. Wishlist (C7)

```mermaid
flowchart TD
  A([Tap heart on card or product page]) --> B{Signed in?}
  B -- no --> C[Save to localStorage terashoes-wish<br/>wishlist pop B6, count badge]
  B -- yes --> D[metafieldsSet customer.custom.wishlist]
  D --> E{Saved?}
  E -- yes --> F[Pop + count badge]
  E -- no --> G[Revert heart, toast 'Couldn't save, try again']
  C --> H([Later: sign in]) --> I[Merge device list into account<br/>union by colourway] --> J[Clear device list]
  F --> K([Another device after sign-in shows the same list])
```

## 7. Bag across refresh and devices (C5)

```mermaid
sequenceDiagram
  actor U as Shopper
  participant D1 as Device 1
  participant S as Next.js server
  participant SF as Shopify Storefront
  participant CA as Customer Account API
  U->>D1: add to bag (guest)
  D1->>S: server action addLine
  S->>SF: cartCreate / cartLinesAdd
  S-->>D1: set cookie ts_cart
  U->>D1: refresh
  D1->>S: read ts_cart → cart(id) → same bag ✓
  U->>D1: sign in
  S->>CA: read custom.active_cart_id
  alt account already has a cart
    S->>SF: add device lines into account cart (qty capped at 5)
  else no account cart
    S->>SF: cartBuyerIdentityUpdate(device cart)
  end
  S->>CA: metafieldsSet active_cart_id
  Note over U,CA: Device 2, after sign-in: read active_cart_id → same bag ✓
```

## 8. Sign in and account (C7)

```mermaid
flowchart TD
  A([Account icon / Sign in]) --> B[/account/login: PKCE + state/]
  B --> C([Shopify customer sign-in<br/>email one-time code])
  C --> D[/account/callback: verify state, swap code for tokens/]
  D --> E[Set httpOnly cookies]
  E --> F[Merge wishlist + cart §6, §7]
  F --> G[/account: name, orders, wishlist/]
  G --> H[Order history → order detail / tracking]
  G --> I([Sign out → clear cookies + end Shopify session])
```

## 9. Checkout and after the order (C6, C9)

```mermaid
flowchart LR
  A[Bag: Checkout] --> B([Shopify hosted checkout])
  B --> C{Payment}
  C -- card / Apple Pay / Google Pay --> D([Order placed])
  C -- declined --> B
  D --> E[Order confirmation email C9]
  E --> F[Shipping confirmation email C9]
  F --> G{Return within 60 days?}
  G -- yes --> H[Prepaid label from order email<br/>trade-in old pair: $20 refund OD-9]
```

## 10. Back-in-stock (C9, OD-6)

```mermaid
flowchart TD
  A([Size shows sold out]) --> B[Notify me: email field]
  B --> C[Back-in-stock app records the request<br/>Shopify has no built-in notification]
  C --> D([Stock goes above 0 in Shopify])
  D --> E[App sends branded email]
  E --> F[Link opens /products/flux-01?colour&size]
```

## 11. Product owner: edit content without a developer (C8)

```mermaid
flowchart LR
  A([Shopify admin → Content → Metaobjects]) --> B[Edit hero headline / offers / FAQ]
  B --> C[Save]
  C --> D[Webhook metaobjects/update → /api/revalidate]
  D --> E([Site shows the change in seconds, no redeploy])
  A2([Shopify admin → Products]) --> B2[Change stock or price] --> D2[Webhook products or inventory update] --> E
```

## 12. Reduced motion and fallbacks (B7, B8)

```mermaid
flowchart TD
  A([Page load]) --> B{prefers-reduced-motion?}
  B -- yes --> C[Native scroll, static hero pose<br/>instant colour change, no auto movement]
  B -- no --> D{WebGL context OK?}
  D -- no --> E[Hero video loop + rendered images]
  D -- yes --> F{Battery discharging or<br/>avg frame > 25 ms?}
  F -- yes --> G[Low-power: 30 fps cap, DPR 1, fewer props]
  F -- no --> H[Full experience: Lenis, 60 fps, character]
```

## 13. Error and empty states

| Situation | What the user sees |
|---|---|
| Model fails to load | The loader text changes to "3D shoe could not load". The page stays usable and product images replace the viewer. |
| Shopify slow or down | Catalogue and content render from cache. Bag actions show "Couldn't update your bag, try again". |
| Variant sells out while in the bag | The bag line is marked "Sold out" and checkout is blocked for that line until it's removed |
| Discount code invalid | Inline message under the code field, and totals stay the same |
| Empty bag | "Your bag is empty" with a link to the shop |
| Empty wishlist | Short prompt and a link to the shop |
| No search results | The suggestion text, as in the prototype |
