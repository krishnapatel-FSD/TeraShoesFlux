# Hero character (A8, B5)

`public/3d/character/character.glb` is built by `pnpm assets:character` from Adobe Mixamo downloads, made on 22 Oct 2026 with the product owner's Adobe account:

- **Character:** "Remy" (Mixamo), downloaded with skin
- **Animations:** "Idle" (→ clip `idle`) and "Baseball Strike" (→ clip `swing`), downloaded without skin
- **Source files:** `assets-src/character/`, which git ignores, so they are not redistributed
- **Changes:** the animations merged onto the character, the materials made matte (Mixamo's gloss and specular maps removed), textures re-encoded as WebP (colour at 1024 px, detail maps at 512 px), and the geometry Meshopt-compressed

**Licence:** Mixamo characters and animations can be used royalty-free in commercial projects. Adobe's terms don't allow redistributing the raw files on their own ([Adobe community FAQ](https://community.adobe.com/questions-696/mixamo-faq-licensing-royalties-ownership-eula-and-tos-589400)). As noted for the shoe in `docs/assets/A1_Model_Selection.md` §2, a GLB served to a website can be downloaded through browser devtools. The product owner should confirm this use is acceptable, in the same way.
