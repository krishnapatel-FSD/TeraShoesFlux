# Hero character (A8, B5)

`public/3d/character/character.glb` is built by `pnpm assets:character` (`scripts/assets/character_mpfb.py`) from free, open assets:

| Part                                                                         | Asset                                                        | Source                                                                                                                    | Licence |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------- |
| Body, skin `young_caucasian_male`, eyes, eyebrows, eyelashes, hair `short02` | MakeHuman system assets                                      | [MakeHuman asset packs](https://static.makehumancommunity.org/assets/assetpacks.html), made with the MPFB2 Blender add-on | CC0     |
| Polo shirt                                                                   | `namuhekam_male_polo_shirt` by Namuhekam                     | Shirts 01 pack                                                                                                            | CC0     |
| Shorts                                                                       | `elvs_male_trouser_short_1` by Elvaerwyn                     | Pants 03 pack                                                                                                             | CC BY   |
| Running shoes                                                                | `punkduck_running_shoes_01` by Punkduck                      | Shoes 02 pack                                                                                                             | CC BY   |
| Clips `idle` and `swing`                                                     | `Sword_Idle` and `Sword_Attack`, Universal Animation Library | [Quaternius](https://quaternius.com)                                                                                      | CC0     |

The MakeHuman asset repository gives the CC BY items' licence as "CC BY" without a version.

**Changes:** the clothes fitted to the body, the shirt tucked into the shorts (the part below the waistband removed), the animations retargeted onto MPFB's game-engine rig, the materials made matte, textures re-encoded as WebP (colour at 1024 px, detail maps at 512 px), and the geometry Meshopt-compressed. The racket is the site's own (`src/three/props/racketKit.ts`), placed in the right hand at runtime.

**Source files:** the asset packs are installed in MPFB's user data folder and `assets-src/` (both outside git), so they are not redistributed.

## Attribution (CC BY)

- Shorts "elvs_male_trouser_short_1" by Elvaerwyn, MakeHuman Community asset repository, CC BY.
- Running shoes "punkduck_running_shoes_01" by Punkduck, MakeHuman Community asset repository, CC BY.
