# TeraShoes Flux

The production store for the Flux 01 knit trainer: a Next.js front end with one shared 3D scene, cinematic motion, and Shopify as a headless backend. The current code is a faithful React port of the prototype (same markup, stylesheet, data, motion and 3D). The build is described in [docs/instructions.md](docs/instructions.md). The original prototype lives in [`prototype/`](prototype/) and is the look-and-feel reference.

## Docs

| Document | What it covers |
|---|---|
| [Roadmap.md](docs/Roadmap.md) | The six build steps, their status, the brief tasks each covers and what each still needs |
| [instructions.md](docs/instructions.md) | The build brief: goal, team, and the task tables for workstreams A (3D), B (motion) and C (store). This is the source of truth. |
| [PRD.md](docs/PRD.md) | What the store must do and why: goals, prototype baseline, requirements traced to task IDs, open decisions, risks |
| [TRD.md](docs/TRD.md) | How it is built: stack and versions, folder layout, scroll controller, recolour shader, asset budgets, caching, testing |
| [UI_UX.md](docs/UI_UX.md) | Design tokens, contrast audit, typography, sections, components, motion timings, accessibility, responsive rules |
| [Backend_Schema.md](docs/Backend_Schema.md) | Shopify product, variant, metafield and metaobject model, colourway token schema, customer data, API surface |
| [assets/A1_Model_Selection.md](docs/assets/A1_Model_Selection.md) | How to pick and license the Flux 01 model, plus the licence finding about serving models to browsers |
| [assets/A2_A3_Pipeline.md](docs/assets/A2_A3_Pipeline.md) | 3D pipeline status, the stand-in shoe, how the recolour shader works, Blender and Mixamo steps |
| [User_Flow.md](docs/User_Flow.md) | Mermaid diagrams of every journey: browse to checkout, colour change, filters, search, wishlist, bag sync, accounts, fallbacks |

## Run the app

Requires Node 22.12+ (24 recommended, see `.nvmrc`) and pnpm 10.

```bash
pnpm install
```

```bash
pnpm dev
```

Then open http://localhost:3000. Without `.env.local` the site runs on the prototype's catalogue; with the Shopify values from `.env.example` it reads products, stock, prices and content from the store ([Roadmap Step 4](docs/Roadmap.md)).

| Script | Does |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js dev server, production build, production server |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm format` / `pnpm format:check` | Prettier (with Tailwind class sorting) |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright on desktop Chrome and a Pixel 7 (run `pnpm exec playwright install chromium` once first). Includes pixel-exact screenshots of the prototype look (`e2e/visual.spec.ts`; whole pages are stored as 2,000 px slices, because one capture of a tall page at a phone's pixel ratio wraps around); update them only for an approved visual change, with `--update-snapshots` |
| `pnpm test:motion` | Motion checks (B1 scroll jumps, B2 intro, B3 colour change, B6 micro-interactions, B7 low-power) on a production build with the motion probe, in Chrome on this machine's GPU (Plan B) |
| `pnpm tokens:check` | WCAG contrast gate for every colourway's text colours (fails below AA without a waiver in `tokens/colourways.json`, A4) |
| `pnpm theme:check` | Fails if a colour literal appears in `src/` outside the theme files (A5) |
| `pnpm brand:logo` | Rebuild the logo SVGs and favicon from the Archivo font (run `pnpm build` or `pnpm dev` first, A5) |
| `pnpm assets:model` | Rebuild the shoe (`public/3d/flux01/`) from the prototype's model: Meshopt geometry, WebP textures, under 3 MB (A2) |
| `pnpm assets:shoe <in> <out.glb>` | Optimise a shoe export for the web (A2) |
| `pnpm assets:validate` | glTF Validator plus size and triangle budgets for `public/3d` |
| `pnpm assets:hero` | With `pnpm dev` running: record the hero from the 3D scene and encode the no-WebGL fallback (WebM, MP4, stills, thumbnails) into `public/hero-fallback/`. Needs ffmpeg (B8) |
| `pnpm assets:lighting` | With `pnpm dev` running: path-traced Blender reference vs the site's lighting, side by side, with numbers (A6). Needs Blender 5.2 |
| `pnpm assets:character [--dummy]` | Mixamo download in `assets-src/character/` → `public/3d/character/character.glb` (clips idle and swing, under 2 MB, A8). `--dummy` rebuilds the test dummy. Needs Blender 5.2 |
| `pnpm assets:images [--upload]` | With `pnpm dev` running: render 4 product photos per colourway into `assets-out/product-images/`, and optionally upload them to the Shopify product (A9) |
| `pnpm codegen` | Regenerate Shopify GraphQL types after changing a query (no store needed) |
| `pnpm shopify:setup` | Load Flux 01, its variants, stock and editable content into the Shopify store (see `scripts/shopify/store-config.mts`) |
| `pnpm check` | Typecheck, lint, format check, unit tests, the contrast gate and the colour guard together |

The folder layout is in [TRD §3](docs/TRD.md#3-repository-layout).

## Run the prototype

The prototype loads `assets/shoe.json` with `fetch`, so it must be served over HTTP. Opening `prototype/index.html` directly (`file://`) will not load the shoe.

```bash
python -m http.server 5500 --bind 127.0.0.1 --directory prototype
```

Then open http://127.0.0.1:5500. In Claude Code, `.claude/launch.json` has a `prototype` entry for this server and a `web` entry for `pnpm dev`.

Inside `prototype/`:
- `index.html` is the whole page, including markup, styles and the script (the product data is the `PRODUCTS` array). It loads three 0.160.0, GSAP 3.12.5 and Lenis 1.1.13 from CDNs.
- `assets/shoe.json` is the glTF shoe model, with its geometry embedded as base64.
- `assets/diffuse*.jpg` hold one texture per colourway.
- `image.png` is a reference screenshot of the hero.

## Credits

Prototype 3D model: "Materials Variants Shoe" © 2021 Shopify, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), via [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets). The colourways are recoloured.
