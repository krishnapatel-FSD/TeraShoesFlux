# A1: Choosing the Flux 01 model

| | |
|---|---|
| Task | A1. Shortlist 3 licensed sneaker models with a commercial licence. The product owner picks one, or a freelancer is briefed instead. |
| Done when | The model is bought and its licence saved in `licenses/` |
| Status | **Decided (21 Oct 2026): no new model.** The product owner keeps the prototype's "Materials Variants Shoe" (© 2021 Shopify, CC BY 4.0, see `licenses/`). This guide is kept for reference in case that changes |

## 1. What the model must meet

These limits come from A2 and A3. A model that fails one can still be chosen, but every failure adds Blender time in A2.

| # | Requirement | Why |
|---|---|---|
| 1 | Licence allows commercial use **in a public website**, including real-time 3D (see §2) | The shoe ships inside the site |
| 2 | No third-party brand (logo, swoosh or stripes that copy a real brand). Not "editorial use only". | A trademark risk for a store that sells its own shoe |
| 3 | A running or knit trainer silhouette close to Flux 01 (knit upper, foam midsole, pull tab, padded collar) | The tour copy describes these parts (PRD §7) |
| 4 | A low or mid poly version, ideally ≤ 60k triangles before cleanup | A2 target: under 40k after cleanup |
| 5 | Non-overlapping UVs, or UVs that are easy to repack | A3 paints masks and bakes AO on these UVs |
| 6 | Upper, stripes/overlays and sole are separable (separate meshes, materials or clean UV islands) | A3 needs one mask channel per zone |
| 7 | PBR maps: at least a normal map, ideally roughness and AO too | Knit and foam detail survive recolouring |
| 8 | Laces modelled in the mesh, not painted on | Close-ups on the product page |
| 9 | Source format FBX, BLEND or glTF | Blender import |

## 2. Licence finding (needs a decision)

**A GLB served to a website can be downloaded by anyone using browser devtools.** Most marketplace licences don't allow that for a purchased model:

- **CGTrader royalty-free:** a model must be *incorporated* into a product so that third parties cannot retrieve it on its own. For software, the buyer must take reasonable measures to prevent end users accessing the model, for example proprietary formats or encryption ([CGTrader help](https://help.cgtrader.com/hc/en-us/articles/360015124437)).
- **Sketchfab:** the Sketchfab Store has closed and paid listings have moved to Epic's **Fab** ([Sketchfab help](https://help.sketchfab.com/en/articles/16152225-store-license-usage-faq)). Under the old store terms, buyers could not offer others the ability to download purchased models. Fab's Standard licence allows commercial distribution of projects that include assets, but not giving assets away standalone ([Fab licences](https://dev.epicgames.com/documentation/en-us/fab/licenses-and-pricing-in-fab)). Check the binding wording in the full Fab EULA.
- **Mixamo (for A8):** free for commercial use, but the raw character and animation files must not be redistributed ([Adobe community FAQ](https://community.adobe.com/questions-696/mixamo-faq-licensing-royalties-ownership-eula-and-tos-589400)). The same extraction question applies.

**Options for the product owner:**

| Option | What it means | Cost and risk |
|---|---|---|
| **A. Licensed model + technical safeguard** | Buy a model and ship it in a protected form (Meshopt-compressed, with the geometry buffer encrypted and decrypted in the browser). This is a "reasonable measure", not real protection. | Cheapest. Needs a written OK from the seller, or legal sign-off, that this meets the licence. |
| **B. Licensed model + seller's written permission** | Ask the seller to confirm web real-time use, or buy an extended or custom licence | Small extra cost. Removes the doubt. |
| **C. Commissioned model (freelancer)** | TeraShoes owns the model outright, so there is no extraction issue. It's also truly "our own designed shoe". | 2–3 weeks alongside phase 2 (brief). Higher cost. |

**Recommendation:** B if a good model exists, otherwise C. Whichever is chosen, keep the seller's confirmation in `licenses/` next to the licence text.

## 3. Where to look

These are starting points from a quick search. **None has been checked against §1 yet.** Open each listing and fill in the scorecard (§4).

| Marketplace | Lead | Notes from the listing snippet |
|---|---|---|
| CGTrader | ["Premium running sneaker, engineered mesh" model pack](https://www.cgtrader.com/3d-models/sports/equipment/premium-running-sneaker-engineered-mesh-model-pack) | About $60, royalty-free, 3 levels of detail (low, mid, high poly), PBR maps at 4096 px. GLB not confirmed. Check for brand marks. |
| Fab (former Sketchfab store) | Search "running shoe", "sneaker", filter **Standard licence** and **game-ready / low poly** | Read the Fab EULA for web use |
| Freelance | ArtStation, Upwork, Fab sellers who take commissions | Option C. Brief the artist with §1 as the spec, plus `prototype/image.png` and the tour copy. |

Avoid models of real branded shoes (Nike, Adidas, New Balance, Skechers and so on). Many are sold "editorial use only", and all carry trademark risk.

## 4. Scorecard (product owner fills in, then picks 1)

| | Model 1 | Model 2 | Model 3 |
|---|---|---|---|
| Link | | | |
| Price / licence name | | | |
| Web real-time use allowed? (§2 option) | | | |
| Brand-free? | | | |
| Triangles (low or mid version) | | | |
| UVs non-overlapping? | | | |
| Zones separable (upper / stripes / sole)? | | | |
| Maps included | | | |
| Formats | | | |
| Looks like Flux 01? (1–5) | | | |

## 5. After the purchase (developer)

1. Save the licence text and receipt (or the seller's confirmation) as `licenses/flux01-model.md` plus the original PDF if there is one.
2. Put the source files in `assets-src/flux01/`. This folder is git-ignored when the licence forbids redistribution.
3. A2 starts: Blender cleanup, then `pnpm assets:shoe` and `pnpm assets:validate` (see [A2_A3_Pipeline.md](A2_A3_Pipeline.md)).
