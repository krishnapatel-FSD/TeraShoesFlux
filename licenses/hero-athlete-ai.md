# Hero athlete image

`public/hero/athlete.webp` is an AI-generated image, not a photograph of a real person.

- **Made:** 23 Oct 2026 with Figma AI's image generation (model `gpt-image-2.5-sunburst`), in the product owner's Figma file "TeraShoes hero athlete", from a written brief: a photorealistic male runner in a mid-stride sprint, emerald running shirt, black shorts, mint socks, white and emerald running shoes, on a flat magenta backdrop.
- **Changes (`pnpm assets:athlete`):** the magenta backdrop keyed out to transparency (edges colour-corrected), trimmed, and saved as WebP, plus a depth map inflated from the silhouette (`public/hero/athlete-depth.webp`) that the site uses to show him in 3D. The original is in `assets-src/athlete/athlete-raw.png` (outside git).
- **Terms:** use is governed by Figma's AI terms for the account that generated it. The shoes are generic, not the Flux 01; there are no logos or text.

The animated 3D player it replaces (A8, B5, `licenses/character-makehuman.md`) is still built and can be switched back on with `NEXT_PUBLIC_HERO_CHARACTER` (see `next.config.ts`).
