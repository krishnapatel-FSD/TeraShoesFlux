# 3D asset pipeline (A2, A3, A7, A8)

| | |
|---|---|
| Related | [A1 model selection](A1_Model_Selection.md), [TRD §5–6](../TRD.md), [Backend schema §4](../Backend_Schema.md) |

## Status (2026-10-22)

> **Product owner decisions (21–22 Oct 2026):** keep the prototype's shoe (A1, no new model) and its texture recolours (A3). The zone recolour shader below stays parked: not used at runtime, and no mask ships.

| Task | State | What exists | Waiting on |
|---|---|---|---|
| A1 Model | ✅ Decided | The prototype's "Materials Variants Shoe" (CC BY 4.0, `licenses/`) | — |
| A2 Prepare + export | ✅ Done | `pnpm assets:model` → `public/3d/flux01/`: **2.73 MB**, 22,700 triangles, validator 0 errors (budget 3 MB / 40k) | — |
| A3 Recolour | ✅ Decided: texture recolours | One colour texture per colourway, plus the model's built-in "beach" variant for Coral | — (the shader is parked groundwork) |
| A6 Lighting | ✅ Approved (22 Oct 2026): within 3% of a path-traced reference | `STUDIO_LIGHTS` in `src/three/shoeAssets.ts`; `pnpm assets:lighting` ([A6_Lighting_Check.md](A6_Lighting_Check.md)) | — |
| A7 Props | ✅ Components | Tennis ball, racket, shuttlecock, paddle in `src/three/props/` (see `/dev/props`) | Designs checked against the latest prototype (OD-1), prop per colourway (OD-7) |
| A8 Character | ✅ Done | Mixamo "Remy" + Idle + Baseball Strike → `public/3d/character/character.glb`, 1.25 MB (`pnpm assets:character`) | — |

## The model

```bash
pnpm assets:model      # builds public/3d/flux01/ (shoe.gltf + .bin, WebP textures, the colourway textures)
pnpm assets:validate   # glTF Validator + budgets on everything in public/3d
```

| | Prototype | After `pnpm assets:model` | Budget |
|---|---|---|---|
| Shoe geometry | 0.92 MB (base64 inside JSON) | **0.20 MB** `.bin` (Meshopt) | |
| Model textures (normal, ORM, 3 variant colours) | 6.8 MB of 2048 px JPEGs | **2.53 MB**: the same 2048 px, re-encoded as WebP q88 (38–42 dB PSNR; renders 39–50 dB, no visible change) | |
| Model total | 7.7 MB | **2.73 MB** | < 3 MB |
| Colourway textures | 2048 px JPEGs, loaded per colourway | The same files, unchanged | |
| Triangles | 22,700 | 22,700 | < 40,000 |
| Validator | — | 0 errors, 1 warning | 0 errors |

**Parked shader, for reference.** If the texture recolours are ever replaced, the mask was derived automatically by comparing two of the sample's colour textures (the old `build-standin` script). Its "stripes" zone holds the laces, lining and heel tab, and the side stripes fall into the upper, so a painted mask would be needed.

## How the recolour works (A3)

- The **zone mask** is an RGBA texture on the model's UVs:
  - R = upper
  - G = stripes and overlays
  - B = sole
  - A = detail, the texel's brightness relative to its zone's average ÷ 2, which keeps the knit weave and foam texture
- `src/three/materials/zoneRecolour.ts` clones the model's PBR material and binds the mask as `map`, read as data rather than colour. It replaces three's `map_fragment`:
  `colour = (upper·R + stripes·G + sole·B) / (R+G+B) × A × 2`.
  Normal, AO, roughness, the environment and lights stay standard three.js.
- Zone colours are three uniforms. Changing colourway only changes their values: no texture loads, no shader recompile, no flicker (B3 builds on this).
- Zone colours are passed in as `{ upper, stripes, sole }` (`ZoneColours`).

## A2 with a new model (reference only: the product owner kept the current model)

1. **Blender**: 5.2.2 LTS is installed (`C:\Program Files\Blender Foundation\`).
2. Import the source into Blender and save it as `assets-src/flux01/flux01.blend`. Keep the licence in `licenses/`.
3. Clean up:
   - delete hidden and duplicate parts
   - apply transforms (scale 1, metres)
   - Decimate or retopologise to **< 40k triangles**
   - keep laces as geometry
4. UVs: one non-overlapping UV set. Pack upper, overlays and sole into separate islands where possible.
5. Bake **ambient occlusion** to the AO channel (R) of an ORM texture (R = AO, G = roughness, B = metalness). Bake or keep the normal map.
6. Paint the **zone mask** (A3) in Texture Paint mode on the same UVs: pure red for upper, green for stripes and overlays, blue for sole. Put detail in alpha, or leave it white to use the normal map only. Export it as `flux01-zones.png`.
7. Export glTF 2.0 (`.glb`) with normal and ORM textures and no colour textures, then run:
   ```bash
   pnpm assets:shoe assets-src/flux01/flux01.glb public/3d/flux01-shoe.glb
   ```
   ```bash
   pnpm assets:validate
   ```
8. Convert the mask to `public/3d/flux01-zones.webp`, then point `ASSET_BASE` / `MODEL_URL` in `src/three/stage.ts` at the new files.
9. **Done when (A2):** the validator reports 0 errors, the file is under 3 MB and under 40k triangles. **(A3):** all 8 colourways render correctly from that one model and mask.

## A8: character procedure (needs your input)

1. **Your input:** sign in at mixamo.com with a free Adobe account. I can't create accounts or sign in for you. Choose a humanoid character in sportswear, or upload one bought in (the brief says the player is bought in, so confirm which).
2. Download the character **with skin** (FBX, T-pose), plus two animations **without skin**: a tennis idle ("Tennis Idle" or similar) and a forehand swing ("Tennis Forehand" or similar). Set 30 fps and turn in-place on. Put the files in `assets-src/character/`.
3. In Blender (developer):
   - import the character and both clips
   - retarget the clips onto one armature as two NLA actions, `idle` and `swing`
   - check that both loop cleanly (match the first and last frames)
   - decimate the mesh, keep textures at 1024 px or less, limit to 4 bone influences
4. Export `public/3d/character.glb` and run `pnpm assets:validate`. The `character` budget is under 2 MB.
5. Mixamo's terms don't allow redistributing the raw files. The same licence question as A1 §2 applies to serving the GLB.
