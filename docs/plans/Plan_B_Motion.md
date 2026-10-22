# Plan B: finish Workstream B (motion and animation)

**Goal:** every B task meets the *Done when* check in [instructions.md](../instructions.md).
**Today (21 Oct 2026):** B2 done; B1, B3, B4, B6 and B7 partly done; B5 blocked; B8 not started ([Checklist](../Checklist.md)).

## 1. Gates: decisions that unlock the plan

Several *Done when* targets are stricter than the prototype. Meeting them changes how the site moves, so each needs your OK (the prototype is otherwise final).

| Gate | Decision | Who | Unlocks |
|---|---|---|---|
| **GB-1** | Replace the prototype's 4 overlapping scroll animations with **one scroll controller**. The poses stay the same; only the jumps go. The latest shared prototype already does this, so the link (OD-1) lets me port it exactly. | Product owner | B1 |
| **GB-2** | Tighten timings to the brief: colour change **≤ 1.2 s** (prototype spin 1.3 s); add-to-bag fly, wishlist pop and size shake **< 600 ms** (prototype 0.7–0.9 s) | Product owner | B3, B6 |
| **GB-3** | **4 tour chapters** (upper, foam, outsole, heel) and the split copy (OD-4) | Product owner | B4 |
| **GB-4** | The character (Plan A, A8) and props per colourway (A7, OD-7) | — | B5, B3 prop swap |
| **GB-5** | OK to install **ffmpeg** (free, via `winget`) to encode the MP4 fallback | You | B8 |

## 2. Steps

### Phase B-0: start now, no decisions needed (≈ 3.5 days)

**Status (21 Oct 2026): Phase B-0 done.** GB-5 was approved, and ffmpeg 9.0.2 is installed via winget.
- Step 1: the motion probe is `src/motion/probe.ts`. It is compiled only into dev builds and `pnpm test:motion` builds.
- Step 2: `e2e/motion.spec.ts` runs on a production build on the real GPU. Software WebGL draws about 2 fps, and GSAP then stretches every animation. The intro ends 2.42–2.44 s after the model loads.
- Step 3: `src/motion/lowPower.ts`, at 29–30 fps.
- Step 4: `e2e/reduced-motion.spec.ts`. The audit found one leak, the tennis balls' idle bob, and it now stops under reduced motion.
- Step 5: `pnpm assets:hero` and `src/three/SceneFallback.tsx`. Without WebGL, the scene's recording fills the hero, the tour and the product viewer, and its thumbnails fill the swatches and cards.

| # | Step | Task | Effort | Verify |
|---|---|---|---|---|
| 1 | **Motion test harness:** test-only hooks that report the shoe's screen position per frame and the duration of each timeline, so every *Done when* is measured, not eyeballed | B1–B7 | 1 d | Hooks exist only in test builds |
| 2 | **Measure the intro:** a Playwright test asserting the intro finishes within 2.5 s of the model loading | B2 | 0.5 d | **≤ 2.5 s** (closes B2's open check) |
| 3 | **Low-power mode:** detect battery discharging (Battery API) or a slow average frame time (> 25 ms), then cap at 30 fps, set pixel ratio 1 and show fewer balls. Reduced motion keeps today's behaviour. | B7 | 1 d | Unit test for the detector; e2e with emulated reduced motion confirms **nothing moves on its own** |
| 4 | **Reduced-motion audit:** check every looping animation (band drift, eyebrow pulse, viewer blob, hero drift, ball spin) | B7 | 0.5 d | e2e: no element's transform changes over 3 s with reduced motion on |
| 5 | **Hero video fallback:** record a 10 s hero loop from the 3D scene (canvas capture in headless Chrome to WebM), encode MP4 **(GB-5)**, and show it with a poster frame when there's no WebGL | B8 | 1 d | e2e with WebGL off: **the page looks complete** (screenshot) |

### Phase B-1: the scroll controller (after GB-1) (≈ 3 days)

**Status (21 Oct 2026): done.** GB-1 was approved without the shared prototype, so the controller was built around the current poses.
- Step 6: `src/three/scrollDock.ts`, unit-tested. The pose is one function of scroll, using the prototype's ranges and chapter hold zones.
  - The shoe follows the pose with a critically damped spring.
  - Its speed is capped at 5% of the screen per 1/60 s while on screen. Off screen it may hurry, so it doesn't crawl between far-apart anchors after a jump link.
- Step 7: the jump test in `e2e/motion.spec.ts`. The prototype's animations failed it: 334 px in one frame at 60 fps, and 815 px at 30 fps. The controller passes at 60 and 30 fps, with a worst move of 40–47 px against the 58 px limit.
- Also: the intro now starts as soon as the colourway on screen is ready, while the others load in the background. It ends 2.31–2.41 s after the model loads, against 2.42–2.52 s before.

| # | Step | Task | Effort | Verify |
|---|---|---|---|---|
| 6 | Replace the 4 scroll segments with **one controller**: progress worked out from the live anchor positions, eased with frame-rate-independent damping, and hold zones for the tour chapters | B1 | 2 d | — |
| 7 | **Jump test:** scroll fast up and down for 10 s and record the shoe position every frame | B1 | 1 d | **No frame-to-frame jump above the threshold and no sticking**, at 60 fps and 30 fps |

### Phase B-2: tour, colour change, micro-interactions (after GB-2, GB-3) (≈ 6 days)

**Status (21 Oct 2026): Phase B-2 done.** GB-2 and GB-3 were approved with the default timings and poses, and placeholder outsole copy.
- Step 8: 4 chapters (`TOUR_CHAPTERS`, `POSE` in `src/three/scrollDock.ts`):
  - Poses: upper (side), foam (a closer, lower side view of the midsole), outsole (underside), heel.
  - Each move is a dolly and orbit centred on a chapter boundary. Every chapter holds still for at least 40% of its scroll while its text shows (unit test).
  - The tour is 420vh tall. The no-WebGL stills were re-recorded for all 4 chapters.
  - The outsole copy is a marked placeholder (OD-4).
- Step 9: one colour-change timeline per click, built in `select()` (`src/state/actions.ts`). The 3D stage adds the spin, material swap and ball bounce to that same timeline. The whole change measures 1.0–1.1 s.
  - No flicker: the shoe only spins into a colourway whose material is already loaded, and the probe records exactly one material switch.
- Step 10: fly 0.5 s, with the bag count popping as the thumbnail lands; wishlist pop 0.5 s; size shake 0.5 s. Each measures under 600 ms from the click.
- The motion probe now times animations from the moment they are created, so a measurement can't start late.

| # | Step | Task | Effort | Verify |
|---|---|---|---|---|
| 8 | **4-chapter tour:** add the outsole chapter and its copy, and give each chapter its own camera move (dolly and orbit on top of the docked pose), each holding while its text is shown | B4 | 3 d | Test: each chapter's pose holds for ≥ 30% of its scroll range, so **the text is readable while still** |
| 9 | **One colour-change timeline:** wash, spin, material swap, prop swap (when the props exist) and site recolour on a single GSAP timeline of **≤ 1.2 s** | B3 | 1.5 d | Harness measures **≤ 1.2 s**; frame capture shows **no flicker** (the texture is preloaded before the swap) |
| 10 | **Micro-interactions under 600 ms:** fly 0.9 → 0.55 s, wishlist pop 0.8 → 0.5 s, size shake 0.7 → 0.5 s; button fills stay as they are (CSS ≤ 0.5 s). Page transitions: none, because the site is a single page (unless routes are added in Step 4). | B6 | 1 d | Harness: **every interaction < 600 ms** |

### Phase B-3: the character (after Plan A's A8) (≈ 2 days)

**Status (22 Oct 2026): done with the real character.** Mixamo's "Remy", with "Idle" and "Baseball Strike" (1.25 MB), runs at 60 fps. `src/three/heroCharacter.ts` loads only when `public/3d/character/character.glb` exists.
- Idle loop, a swing on each colour change (added to the B3 timeline), head turning toward the cursor, still under reduced motion.
- Tested with a dummy in Mixamo's format (`pnpm assets:character --dummy`): 60 fps on this laptop, head follows the cursor, the swing plays.
- The placement is provisional until the latest prototype (OD-1) shows where the player stands.

| # | Step | Task | Effort | Verify |
|---|---|---|---|---|
| 11 | Hero character: idle loop, crossfade to the swing on a colour change, and the head bone turning toward the cursor within limits | B5 | 1.5 d | — |
| 12 | **Performance check** on a 2022 mid-range laptop (real device, Chrome performance panel) | B5 | 0.5 d | **60 fps** in the hero |

## 3. Order and timeline

```
Now ─ B-0 (3.5 d) ─────────────────────────────────────┐
GB-1 ─ B-1 scroll controller (3 d) ─┐                  │
GB-2, GB-3 ─────────────────────────┴─ B-2 (6 d) ──────┼─► Workstream B done
Plan A (A8) ─ B-3 character (2 d) ─────────────────────┘
```

- **My effort:** about 14.5 working days (the brief budgets 17 for B).
- B-1 must come before B-2, because the tour camera moves and hold zones sit on top of the single controller.
- B3's **prop swap** completes once Plan A's A7 adds the other props; until then the swap is the ball bounce.

## 4. Risks

| Risk | Mitigation |
|---|---|
| The new controller feels different from the prototype | Same poses and easing feel; side-by-side video for the product owner before switching (GB-1) |
| 60 fps not reached on the target laptop | Low-power mode (step 3), pixel-ratio cap, fewer props, character decimated in A8 |
| Software WebGL makes CI timing tests flaky | Timing tests read the timeline's own duration, not wall-clock frames |
