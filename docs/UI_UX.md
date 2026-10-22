# TeraShoes Flux 01: UI/UX Specification

| | |
|---|---|
| Status | Draft. The visual baseline is taken from the prototype (`index.html`, `image.png`). |
| Inputs | [instructions.md](instructions.md), [PRD](PRD.md) |
| Related | [TRD](TRD.md) (implementation), [User flows](User_Flow.md) |

## 1. Design principles

1. **The shoe is the interface.** One 3D shoe travels through the whole page (hero, tour, product, shop) instead of being repeated in each section.
2. **One colour runs the site.** The selected colourway's highlight colour (`--hl`) paints the hero, accents, highlight marks, the band, buttons and the 3D rim light, and animates everywhere at once.
3. **Cinematic, then fast.** Motion sells the product but never blocks buying. Every commerce control is usable the moment it's on screen.
4. **Readable on every colour.** Each colourway's text colours pass WCAG AA by design (A4 script).
5. **Calm when asked.** Reduced motion and low-power mode give a complete, static, native-scrolling site.

## 2. Design tokens

### 2.1 Base palette (from the prototype `:root`)

| Token | Value | Use |
|---|---|---|
| `paper` | `#eceef1` | Page background below the hero |
| `surface` | `#ffffff` | Cards, drawer, inputs, scrolled nav |
| `ink` | `#101216` | Body text, dark buttons, band background |
| `dim` | `#5d6670` | Secondary text (5.0:1 on paper, 5.8:1 on surface, passes AA) |
| `line` | `rgba(16,18,22,.10)` | Hairlines and borders |
| `tint` | `color-mix(hl 22%, surface)` | Soft highlight fills |

### 2.2 Per-colourway tokens

These are driven by `tokens/colourways.json` (schema in [Backend schema §4](Backend_Schema.md)) and exposed as animatable CSS custom properties (`@property`, `<color>` syntax), with a 0.9 s transition on `--ease`.

| Token | Meaning |
|---|---|
| `--hl` | Highlight. Hero background, accent marks, band text, rim light. |
| `--on-hl` | Text and icons placed **on** `--hl` (buttons, menu bars) |
| `--hero-ink` | Headline and nav text over the hero |
| `a` / `b` | Swatch split (main knit / stripes), also shader zone colours |

### 2.3 Contrast audit of the prototype palette

Checked with the WCAG 2.x relative-luminance formula:

| Colourway | `--hero-ink` on `--hl` | `--on-hl` on `--hl` | `--hl` on `ink` (band) |
|---|---|---|---|
| Lime | **1.97 ✗** | 8.74 ✓ | 9.51 ✓ |
| Ember | **2.86 ✗** | 6.56 ✓ | 6.56 ✓ |
| Glacier | **2.36 ✗** | 7.93 ✓ | 7.93 ✓ |
| Obsidian | 4.68 ✓ | 13.27 ✓ | **1.41 ✗** |
| Amber | 10.25 ✓ | 10.25 ✓ | 10.25 ✓ |
| Coral | **2.30 ✗** | 8.17 ✓ | 8.17 ✓ |

The bar is 4.5:1 for normal text and 3:1 for large text, meaning 24 px+ regular or 18.66 px+ bold. The giant headline and the small nav, price and description text in the hero all use `--hero-ink`, so the small text needs 4.5:1.

**Fixes to decide (OD-8):**
- Use `--on-hl` (dark ink) as the hero text colour for light highlights. All pass, at 6.5:1 or better.
- Or keep white and darken those highlights.
- For dark colourways like Obsidian, add a separate `band` / `accent-on-ink` token rather than reusing `--hl` on ink.

A4's script checks all three pairs for every colourway.

### 2.4 Typography

| Role | Family | Settings | Size |
|---|---|---|---|
| Hero word | Archivo (variable) | weight 900, width 62 (condensed), uppercase, line-height .82 | `clamp(96px, 19vw, 320px)` |
| Display headings | Archivo | weight 800, width 125 (expanded), uppercase, line-height .92, tracking -.02em | h2 `clamp(40px, 5.6vw, 80px)` |
| Body | Hanken Grotesk | 400–700, line-height 1.55 | 16 px, lede 17 px |
| Data / eyebrow / prices | JetBrains Mono | 400–500, eyebrow tracking .14em uppercase | 12–15 px |

A5 turns these into a Tailwind type scale (`text-hero`, `text-display`, `text-lede`, `text-body`, `text-eyebrow`, `text-mono`). No arbitrary font sizes are allowed outside the scale.

### 2.5 Layout, spacing and shape

- **Rail:** content max width 1240 px. Gutter `clamp(16px, 4vw, 40px)`, with safe-area insets respected.
- **Radii:** pill (999 px) for buttons, nav, chips and segments, 32 px for the viewer, 12 px for size buttons.
- **Easing:** `--ease: cubic-bezier(.16, 1, .3, 1)` (expo-out) is the house curve. GSAP uses `expo.out` and `expo.inOut`.
- **Breakpoints in the prototype:** 480, 560, 760, 820, 860, 900, 960 and 980 px. **Production uses Tailwind's set**: `sm` 640, `md` 768, `lg` 1024, `xl` 1280. Map the prototype's layouts onto it rather than keeping eight ad-hoc breakpoints.

## 3. Page and section inventory

The prototype is one long page. Production keeps the cinematic home page and adds deep-linkable routes.

| Route | Sections | Notes |
|---|---|---|
| `/` | Header, Hero, Band, Tour, Product, Shop, Perks, FAQ, Footer | The shoe docks into hero → tour → product → shop |
| `/shop?family=warm&size=10&sort=low` | Grid with filters and sort | The URL holds all filter state (C3) |
| `/products/flux-01?colour=lime&size=10&width=wide` | Product page | Shareable, SEO-indexable, opens with that colour applied |
| `/account`, `/account/orders`, `/account/wishlist` | Account pages | C7 |
| Overlays (no route) | Menu, Search, Bag drawer, Size guide, Toast | Focus-trapped, Esc closes, focus returns to the trigger |

### 3.1 Header
- Floating pill nav: logo, Search, Wishlist (count), Bag (count), Menu.
- Over the hero it's transparent with `--hero-ink`. Once the hero is passed it becomes a white surface pill and shrinks to 1000 px.
- A 3 px reading-progress bar sits at the very top.

### 3.2 Hero (`100svh`, minimum 620 px)
- `--hl` background with a soft radial glow.
- "TERA FLUX" in two layers. The **solid** copy sits behind the shoe and the **outline** copy (2 px stroke) in front, so letters crossing the shoe read as outlines.
- Bottom left: product name, one-line spec, colour dots with the colour name. Bottom right: price and "Shop now".
- 3D: the shoe at an angle, with themed props (OD-7) floating at parallax depth and the character (B5).
- A loader ring with percentage shows until the model is ready.

### 3.3 Band
A tilted (-1.6°) ink strip with `--hl` text that scrolls sideways. Scrolling speeds it up and reverses its direction. The text is the product facts (six colourways, free shipping over $150, 268 g, and so on).

### 3.4 Tour (B4)
- A sticky stage about 340 vh tall. **Four chapters:** Upper, Foam, Outsole, Heel. The prototype has 3, so the copy needs splitting (OD-4).
- Each chapter has an eyebrow (`01 / 04 · Upper`), a headline with one highlighted word, a short lede, and three spec chips.
- The camera moves once per chapter and **holds** while the text is readable. Progress dots show the chapter.

### 3.5 Product section (C4)
- Left: sticky 3D viewer in a rounded card with a radial `--hl` gradient. Drag to rotate, with momentum. Badge (New, Limited, −20%).
- Right, the buy box:
  - breadcrumb
  - title "Flux 01 *Colour*"
  - price, plus was-price and save pill
  - colour swatches with name and note
  - size grid (5 columns, US over EU; sold out shown struck through and disabled)
  - size guide link
  - width segment (Standard / Wide 2E)
  - quantity stepper (1–5)
  - **Add to bag** and wishlist heart
  - delivery and returns notes
  - details accordion (Details, Materials and care, Shipping and returns)

### 3.6 Shop grid (C3)
- Heading "Shop all colourways" and a lede.
- Filter chips: All, Warm, Cool, Dark, Sale. **Production adds a size filter.**
- Sort: Featured, Price low–high, Price high–low, Name A–Z. Plus a product count.
- Cards: rendered product image (A9), name, note, price, badge, wishlist heart, and a **Quick add** button that swaps in an inline size picker.
- Filtering animates with FLIP (cards slide to their new places, and leaving and entering cards scale and fade).

### 3.7 Perks, FAQ and footer
- Perks: free shipping, 60-day returns, $20 trade-in, plastic-free packaging.
- FAQ accordion, editable through C8.
- Footer: newsletter (OD-9), link columns, payment marks, a giant "TeraShoes" wordmark that animates in letter by letter and spans the content column exactly at every width (approved change from the prototype, 21 Oct 2026: the prototype clipped it below about 1650 px), and the 3D model credit while the sample model is in use.

### 3.8 Overlays
| Overlay | Behaviour |
|---|---|
| **Menu** | Full-screen. Opens as a circle expanding from the menu button (0.9 s expo.inOut), with links staggering in. Pauses Lenis. |
| **Search** | Dialog with live results as you type, searching colourway name, note and family. Empty state suggests "lime, cool or sale". |
| **Bag drawer** | Slides in from the right over a scrim. Free-shipping meter, line items with quantity and remove, totals, Checkout. Focus is trapped. |
| **Toast** | Bottom, `role=status`, auto-hides after 3 s |

## 4. Components (A5 base set)

`Button` (dark, highlight, ghost, magnetic), `IconButton` (with count badge), `Chip` (pressed state), `Segment`, `Stepper`, `SwatchDot`, `SizeButton` (available, selected, sold out), `Accordion`, `Drawer`, `Dialog`, `Toast`, `Price` (with was-price and save pill), `Badge`, `Eyebrow`, `HighlightMark`, `ProductCard`, `ShipMeter`, `Loader`.

Every component reads colour from theme tokens only (A5 is done when there are no hard-coded colours).

## 5. Motion specification

| Moment | Spec | Budget |
|---|---|---|
| Loader | Ring and percentage follow the asset loading manager, then fade and scale to 0.8 over 0.5 s | — |
| Hero intro (B2) | Headline letters rise (yPercent 120 → 0, rotate 8° → 0, 1.4 s, stagger 0.05, expo.out). Shoe flies in from below with a spin (2.2 s expo.out). Props pop (elastic.out). Details fade up. | **≤ 2.5 s** after model load |
| Colour change (B3) | Circle wash from the click point (1 s expo.inOut, then fades), a 360° shoe spin (1.3 s power3.inOut) with a scale pulse, the material swaps mid-spin, props shrink to 0.55 and spring back, and `--hl`, `--on-hl` and `--hero-ink` transition across the site | **≤ 1.2 s** total, so the prototype's 1.3 s spin must be shortened |
| Scroll docking (B1) | One damped progress value moves the shoe between anchors, and section poses lerp | No jumps or sticking |
| Tour (B4) | One camera move per chapter, with hold zones | Text readable while held |
| Reveals | Headings split into words that rise (1.2 s expo.out), highlight marks wipe in, blocks fade up 30 px | — |
| Band | Constant drift, boosted by scroll velocity, reverses with scroll direction | — |
| Micro-interactions (B6) | Button fill, magnetic pull, add-to-bag fly to the bag icon, wishlist pop, size-error shake, page transitions | **< 600 ms** each |
| Character (B5) | Idle loop, swing on colour change, head turns toward the cursor | 60 fps on a 2022 mid-range laptop |

### Reduced motion and low power (B7)
- With `prefers-reduced-motion: reduce`, there is no Lenis, no intro, no wash, no spin, no parallax, no band drift and no idle bob. The shoe sits still in each section, colour changes are instant, and reveals are already in their final state.
- In low-power mode, the 3D stays but is capped at 30 fps and DPR 1, with fewer props.
- Without WebGL (B8), a 10 s video loop replaces the hero canvas, and product sections use the rendered images (A9).

## 6. Accessibility checklist

- AA contrast for every colourway (§2.3), checked automatically.
- Every icon button has an `aria-label`. Swatches, sizes and width use `role=group` and `aria-pressed`. Sold-out sizes are `disabled` with an accessible "sold out" label.
- Menu, search and drawer are dialogs that trap focus, close on Esc, set `inert` on the background, and return focus to the trigger (the prototype already does most of this).
- `aria-live` regions announce size errors, add-to-bag and newsletter results.
- The 3D canvas is `aria-hidden`. The viewer has `role=img` with a label describing the colourway. Every 3D-only fact also appears in the text.
- Touch targets: at least 24 × 24 px (WCAG 2.2 AA). **Aim for 44 × 44 px on phones**, so the prototype's 30 px colour dots need a larger hit area.
- Keyboard: drag-to-rotate also responds to ←/→ when the viewer is focused.

## 7. Responsive behaviour (phones are untested in the prototype)

| Area | Phone (< 768 px) |
|---|---|
| Hero | Headline scales down with `vw`, the shoe sits higher, props are fewer and smaller, dots and price stack |
| Tour | Text under the stage, shorter scroll distance per chapter |
| Product | Viewer stacks above the buy box (no sticky), size grid stays 5 columns at 44 px or more |
| Shop | One column (two from `sm`), filters scroll sideways |
| Drawer | Full width |
| Performance | DPR ≤ 1.5, 3D props reduced, character optional (decide after device testing) |
