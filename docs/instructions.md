# Goal and Starting Point

Turn the TeraShoes prototype into a production store with one full-stack developer in about 16 weeks: our own designed 3D shoe, a proper colourway system, cinematic motion, real checkout, and a fast, accessible launch.

The current prototype proves the concept and is the reference for look and feel. It is private until shared from its Share menu. It already has:

- A real 3D shoe (a free scanned sample model) in six colourways, recoloured from one texture.
- A full-screen hero in the selected colour, a giant headline the shoe flies through, and themed 3D props per colourway (tennis balls, rackets, players, shuttlecocks, ping-pong paddles).
- A scroll-driven 3D tour, a product page with drag-to-rotate, a filterable shop grid, wishlist, bag drawer and search.
- One highlight colour that animates across the whole site, with GSAP and Lenis motion.

### What the build must fix or add

- The shoe is a borrowed sample model; TeraShoes needs its own designed shoe.
- Colourways are texture recolours, not designed materials.
- Checkout, payments, accounts and stock are demo only.
- Everything is one 2,000-line HTML file with no components, tests or CMS.
- It is untested on phones, and the 3D assets weigh about 9 MB uncompressed.

# Who Does the Work

One full-stack developer builds everything, working through each phase's tasks in ID order. Only the shoe model and the tennis-player character are bought in, because modelling them from scratch would cost a developer weeks.

| Who                            | Does what                                                                             | Time                                           |
| ------------------------------ | ------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Full-stack developer           | All code, 3D in the browser, motion, commerce, hosting and testing                    | Full time, 76 working days over about 16 weeks |
| Product owner                  | Approves the shoe, colourways and copy; answers open decisions within one working day | 2 to 3 hours a week                            |
| Freelance 3D artist (optional) | Custom Flux 01 model and materials, only if no licensed model fits                    | 2 to 3 weeks, alongside phase 2                |

### How to read the task tables below

- ID is the task code to quote in commits and updates (A1, B4).
- Effort is in working days: S = 1 to 2, M = 3 to 5, L = 6 to 10.
- Depends on lists tasks that must finish first.
- Done when is the check that closes the task.
- Status is a dropdown the developer updates daily; Blocked means waiting on the product owner or a purchase.

# Workstream A: 3D Shoe and Product Design

A gives TeraShoes its own shoe without a 3D team: license a sneaker model, prepare it once in Blender, and drive every colourway from code. A1 and A4 start on day 1 because everything else waits on them.

| ID | Task                                                                                                                                                 | Effort     | Depends on | Done when                                                   | Status      |
| -- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------- | ----------------------------------------------------------- | ----------- |
| A1 | Shortlist 3 licensed sneaker models (Sketchfab, CGTrader) with a commercial licence; the product owner picks one, or a freelancer is briefed instead | S (2 days) | None       | Model bought and licence saved in the repo                  | Not started |
| A2 | Prepare the model in Blender: under 40k triangles, clean UVs, baked ambient occlusion, GLB export                                                    | M (4 days) | A1         | Passes the glTF Validator and is under 3 MB                 | Not started |
| A3 | Paint mask maps for upper, stripes and sole, and write a recolour shader so colourways are set in code                                               | M (4 days) | A2         | 8 colourways render from one model with no extra textures   | Not started |
| A4 | Colourway tokens: one JSON file with name, shoe colours, highlight colour and text colour, plus a contrast-check script                              | S (1 day)  | None       | Script passes WCAG AA for every hero colour                 | Not started |
| A5 | Brand basics in code: logo SVG, type scale, colour tokens and base components in the Tailwind theme                                                  | S (2 days) | A4         | No hard-coded colours outside the theme                     | Not started |
| A6 | Lighting: studio environment map, key and rim lights, contact shadow, matched to a reference render                                                  | S (2 days) | A3         | Product owner approves a side-by-side check                 | Not started |
| A7 | Port the prototype's procedural props (tennis ball, racket, shuttlecock, paddle) to React Three Fiber components                                     | S (2 days) | A5         | Each prop is a reusable component with its own colour props | Not started |
| A8 | Character: a rigged character with tennis idle and swing clips from Mixamo, retargeted and exported to GLB                                           | M (3 days) | A1         | Both clips loop cleanly and the file is under 2 MB          | Not started |
| A9 | Product images generated from the 3D scene: a script renders side, front, top and sole per colourway                                                 | S (2 days) | A3, A6     | 4 images per colourway uploaded to the store                | Not started |

# Workstream B: Motion and Animation

B rebuilds the prototype's motion as reusable code and raises it to launch quality. Reuse the prototype's single scroll controller (live section positions eased into one value) from the start; several scrubbed animations moving the same shoe caused jumps in the prototype.

| ID | Task                                                                                                                               | Effort     | Depends on | Done when                                                        | Status      |
| -- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------- | ---------------------------------------------------------------- | ----------- |
| B1 | Port the motion system to React: Lenis smooth scroll, GSAP, and the single scroll controller that docks the shoe into each section | M (3 days) | C1, A2     | Fast scrolling back and forth never makes the shoe jump or stick | Not started |
| B2 | Hero intro: loader, shoe fly-in, headline letters, props popping in                                                                | S (2 days) | B1, A7     | Whole intro finishes within 2.5 s of the model loading           | Not started |
| B3 | Colour change sequence: colour wash, shoe spin, prop swap and site recolour in one timeline                                        | S (2 days) | B1, A3     | One click recolours everything in 1.2 s with no flicker          | Not started |
| B4 | 3D tour with a camera move per chapter: upper, foam, outsole, heel                                                                 | M (4 days) | B1         | Each chapter holds still long enough to read its text            | Not started |
| B5 | Character in the hero: idle loop, swing on colour change, head turns toward the cursor                                             | S (2 days) | A8, B3     | Runs at 60 fps on a 2022 mid-range laptop                        | Not started |
| B6 | Micro-interactions: button fills, add-to-bag fly, wishlist pop, size-error shake, page transitions                                 | S (2 days) | C4, C5     | Every interaction finishes in under 600 ms                       | Not started |
| B7 | Reduced motion and low-power mode: static hero, native scrolling, 30 fps cap on battery                                            | S (1 day)  | B2         | With reduced motion on, nothing moves on its own                 | Not started |
| B8 | Hero video fallback: a 10 s loop recorded from the 3D scene as WebM and MP4 for devices without WebGL                              | S (1 day)  | B2         | The page looks complete with WebGL turned off                    | Not started |

# Workstream C: Store Features

C makes TeraShoes a real store on Shopify as a headless backend, so one developer never builds payments, tax or order management. The site is a Next.js front end on Vercel that reads products and carts from Shopify's Storefront API.

| ID | Task                                                                                                     | Effort     | Depends on | Done when                                                      | Status      |
| -- | -------------------------------------------------------------------------------------------------------- | ---------- | ---------- | -------------------------------------------------------------- | ----------- |
| C1 | Project setup: Next.js, TypeScript, Tailwind, React Three Fiber, linting, Vercel preview per branch      | S (2 days) | None       | A pushed branch gets its own working preview link              | Not started |
| C2 | Shopify store: Flux 01 with 8 colourway variants by 10 sizes, stock, prices; typed Storefront API client | M (3 days) | A4         | Changing stock in Shopify shows on the site without a redeploy | Not started |
| C3 | Shop page: product grid from Shopify, filters by colour family and size, sort, filters kept in the URL   | S (2 days) | C2, A9     | A shared filtered link opens the same results                  | Not started |
| C4 | Product page: 3D viewer, colour swatches, size picker with live stock, width option, size guide          | M (4 days) | C2, A3     | Sold-out sizes cannot be added to the bag                      | Not started |
| C5 | Bag: slide-out drawer on Shopify's cart API, free-shipping meter, discount codes                         | S (2 days) | C2         | Bag survives a refresh and a second device after sign-in       | Not started |
| C6 | Checkout: Shopify hosted checkout with cards, Apple Pay and Google Pay, tax and shipping zones           | S (2 days) | C5         | A real test order completes and refunds in Shopify             | Not started |
| C7 | Accounts: Shopify customer sign-in, order history, wishlist saved to the account                         | M (3 days) | C6         | A wishlist saved on one device shows on another                | Not started |
| C8 | Editable content: hero headline, offers bar and FAQ stored as Shopify metaobjects                        | S (2 days) | C2         | The product owner changes the headline without the developer   | Not started |
| C9 | Branded emails: order confirmation, shipping and back-in-stock through Shopify notifications             | S (1 day)  | C6, A5     | Test emails match the brand kit                                | Not started |
