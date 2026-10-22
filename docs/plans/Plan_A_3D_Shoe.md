# Plan A: finish Workstream A (3D shoe and product design)

**Goal:** every A task meets the *Done when* check in [instructions.md](../instructions.md).
**Today (21 Oct 2026):** A2–A7 partly done, A1 and A8 blocked, A9 not started ([Checklist](../Checklist.md)).

## 1. Gates: decisions that unlock the plan

| Gate | Decision | Who | Unlocks |
|---|---|---|---|
| **GA-1** | **Allow the build to go beyond the prototype where the brief asks for it:** 8 colourways, AA-contrast text colours, designed materials | Product owner | A3, A4 *Done when* |
| **GA-2** | Model licence route: seller's written web permission, or a freelancer ([A1 guide](../assets/A1_Model_Selection.md)) | Product owner | A1 → A2, A3, A6, A9 |
| **GA-3** | The 2 new colourways (names, colours) and new hero text colours for the 5 failing pairs (OD-3, OD-8) | Product owner | A4, A3 |
| **GA-4** | The latest shared prototype link (it has rackets, shuttlecocks, paddles and players) (OD-1), and which props go with which colourway (OD-7) | You / product owner | A7 |
| **GA-5** | Mixamo sign-in (free Adobe account), or a bought-in character | You | A8 |

Without GA-1 the plan stops at "prototype parity". Every step that changes the look is marked **(GA-1)**.

## 2. Phases

### Phase A-0: start now, no purchases needed (≈ 5 days)

**Status (21 Oct 2026): done.** All 7 steps are built and pass their checks, except two that wait on others: step 2's gate passes 5 pairs only by waiver until GA-3, and step 7's upload runs once the store's Admin app exists.

| # | Step | Task | Owner | Effort | Verify |
|---|---|---|---|---|---|
| 1 | Bring back one **token file** (`tokens/colourways.json`) as the single source for colourway colours. `src/data/catalogue.ts` reads from it, and the 6 prototype values stay unchanged. | A4 | Me | 0.5 d | Unit test: the site renders the same values as now |
| 2 | Make the contrast script a **build gate** (fails below AA). Enable it once GA-3 provides passing colours. | A4 | Me + PO | 0.5 d | `pnpm tokens:check` passes for all 8 colourways |
| 3 | **Logo as SVG:** redraw the "T" badge and the TERASHOES wordmark as an `<Logo/>` component, pixel-matched to the prototype | A5 | Me | 0.5 d | Side-by-side screenshot diff |
| 4 | **Type scale** as Tailwind tokens (hero word, display, h2, lede, body, mono), with the values taken from the prototype CSS | A5 | Me | 0.5 d | Computed font sizes unchanged (test) |
| 5 | **Remove hard-coded colours:** move every hex/rgba in `prototype.css` into named variables in the theme, as a mechanical change only | A5 | Me | 1 d | A script finds no colour literals outside the theme file, and screenshots match the prototype pixel for pixel |
| 6 | **Tennis ball as a reusable component** (`<TennisBall colour seamColour />`, R3F), used by the stage with identical output | A7 | Me | 0.5 d | Prop renders alone in a test scene; hero screenshot unchanged |
| 7 | **Product image script** (`pnpm assets:images`): headless render of side, front, top and sole per colourway at 2048 px, then upload to Shopify product media through the Admin API | A9 | Me | 1.5 d | 4 images per colourway on the dev store (run with the stand-in, re-run after A3) |

### Phase A-1: the model (after GA-2) (≈ 2 days of your time + purchase)

**Status (21 Oct 2026): not needed.** The product owner decided against a new model: the prototype's "Materials Variants Shoe" (CC BY 4.0) stays. Phase A-2 continues on this model: bring it under 3 MB (it's 6.99 MB, almost all textures), and decide whether to switch on the recolour shader.

| # | Step | Task | Owner | Effort | Verify |
|---|---|---|---|---|---|
| 8 | Fill in the scorecard for 3 models, check web-use permission, buy one, and save the licence and receipt in `licenses/` | A1 | You / PO | 2 d | Licence file in the repo |

### Phase A-2: prepare and recolour the real shoe (≈ 10 days)

| # | Step | Task | Owner | Effort | Verify |
|---|---|---|---|---|---|
| 9 | **Blender prep**, scripted where possible: import, apply transforms, decimate to under 40k triangles, check and repack UVs, bake AO into the ORM texture, export GLB | A2 | Me | 3 d | — |
| 10 | Run `pnpm assets:shoe` and `pnpm assets:validate` | A2 | Me | 0.5 d | **0 validator errors, < 3 MB, < 40k triangles** |
| 11 | **Paint the zone masks** (upper, stripes, sole) on the real UVs in Blender Texture Paint, plus the detail map | A3 | Me | 2 d | Mask preview |
| 12 | **Wire the recolour shader** in place of the per-colourway textures, drop the extra textures, and add the 2 new colourways **(GA-1, GA-3)** | A3 | Me | 1.5 d | **8 colourways render from one model with no extra textures**, with a screenshot of each |
| 13 | Swap the model paths in `stage.ts` and remove the stand-in and the sample model credit | A2/A3 | Me | 0.5 d | e2e tests pass |

### Phase A-3: lighting and product images (≈ 3 days)

| # | Step | Task | Owner | Effort | Verify |
|---|---|---|---|---|---|
| 14 | Make a **reference render** in Blender (studio HDRI, key, rim), then tune the three.js lighting: environment map, key, rim and contact shadow | A6 | Me | 1.5 d | Side-by-side page (`/dev/lighting`) |
| 15 | Product owner reviews the side-by-side | A6 | PO | — | **PO approves** |
| 16 | Re-run `pnpm assets:images` with the final model and lighting | A9 | Me | 0.5 d | **4 images per colourway in the store** |

### Phase A-4: props and character (after GA-4, GA-5) (≈ 5 days)

| # | Step | Task | Owner | Effort | Verify |
|---|---|---|---|---|---|
| 17 | Port the **racket, shuttlecock and ping-pong paddle** from the latest prototype as procedural R3F components with colour props | A7 | Me | 1.5 d | **Each prop is a reusable component with its own colour props** |
| 18 | Download the Mixamo character with skin, plus idle and forehand clips without skin, into `assets-src/character/` | A8 | You | 0.5 d | — |
| 19 | Retarget both clips onto one rig in Blender, make them loop cleanly, decimate, export `character.glb`, validate | A8 | Me | 2.5 d | **Both clips loop cleanly, < 2 MB** |

## 3. Order and timeline

```
Now ─ A-0 (5 d, me) ───────────────────────────────┐
GA-2 ─ A1 (you) ─ A-2 (10 d) ─ A-3 (3 d) ──────────┼─► Workstream A done
GA-4 ─ A7 props (1.5 d) ─┐                         │
GA-5 ─ A8 character (3 d) ┴────────────────────────┘
```

- **My effort:** about 22 working days (the brief budgets 22 for A).
- **Critical path:** GA-2 (model purchase) → A2 → A3 → A6 → A9. The sooner the model is bought, the sooner A finishes.

## 4. Risks

| Risk | Mitigation |
|---|---|
| No licensed model fits, or the seller refuses web use | Brief a freelancer (GA-2, option C); the plan shifts 2–3 weeks |
| Shader recolours look flatter than the prototype's painted textures | Detail map plus per-zone roughness and sheen in the tokens, and the A6 lighting pass |
| Removing hard-coded colours changes the look | Mechanical change with pixel-diff screenshots against the prototype |
