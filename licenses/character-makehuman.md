# Hero character (A8, B5)

`public/3d/character/character.glb` is built by `pnpm assets:character` (`scripts/assets/character_mpfb.py`) from free, open assets:

| Part                                                                         | Asset                                                                      | Source                                                                                                                    | Licence |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------- |
| Body, skin `young_caucasian_male`, eyes, eyebrows, eyelashes, hair `short02` | MakeHuman system assets                                                    | [MakeHuman asset packs](https://static.makehumancommunity.org/assets/assetpacks.html), made with the MPFB2 Blender add-on | CC0     |
| Polo shirt                                                                   | `namuhekam_male_polo_shirt` by Namuhekam                                   | Shirts 01 pack                                                                                                            | CC0     |
| Running shorts                                                               | `mindfront_male_swimming_trunks_01` by Mindfront                           | Pants 03 pack                                                                                                             | CC BY   |
| Running shoes                                                                | `punkduck_running_shoes_01` by Punkduck                                    | Shoes 02 pack                                                                                                             | CC BY   |
| Clips `idle`, `run` and `swing`                                              | `Idle_Loop`, `Jog_Fwd_Loop` and `Sprint_Loop`, Universal Animation Library | [Quaternius](https://quaternius.com)                                                                                      | CC0     |

The MakeHuman asset repository gives the CC BY items' licence as "CC BY" without a version.

**Changes:** the clothes fitted to the body and recoloured (shirt emerald, shorts dark, the shoes' yellow accents emerald), the part of the shorts hidden under the shirt removed, the animations retargeted onto MPFB's game-engine rig, the materials made matte, textures re-encoded as WebP (colour at 1024 px, detail maps at 256 px), and the geometry Meshopt-compressed.

**Source files:** the asset packs are installed in MPFB's user data folder and `assets-src/` (both outside git), so they are not redistributed.

## Attribution (CC BY)

- Running shorts "mindfront_male_swimming_trunks_01" by Mindfront, MakeHuman Community asset repository, CC BY (recoloured).
- Running shoes "punkduck_running_shoes_01" by Punkduck, MakeHuman Community asset repository, CC BY (recoloured).
