# STORY-ILLUSTRATION-REDESIGN-V1-B-FORMAL-R1 Implementation Plan

> **For agentic workers:** Required sub-skill: follow `tonight-design-gate` before every visual or implementation change; use `superpowers:test-driven-development` for behavior code and `game-playtest` for browser/Cocos visual evidence.

**Goal:** Turn the user-approved B style and KF-R1 three-beat story into original, editable, traceable production artwork, then integrate it as a smooth outdoor story sequence without changing the approved indoor experience.

**Architecture:** A new `outdoor-story-v1` asset bundle owns three independently composed outdoor beats. Editable SVG sources own silhouettes, masks, pivots, hit zones, palette, and layout; deterministic raster exports own the original dry-brush, halftone, and paper texture. After a second visible approval of the formal composites, a pure TypeScript story model drives a persistent two-Sprite crossfade component. Existing door routing, first-touch audio, and indoor state remain authoritative and are reused unchanged.

**Tech Stack:** Cocos Creator 3.8.8 LTS, TypeScript, SVG, Node.js, Sharp, Vitest/Node test runner already present in the repository, browser visual evidence.

**Spec paths:**

- `docs/STORY-ILLUSTRATION-REDESIGN-V1-B-KF-R1-APPROVAL.md`
- `docs/STORY-ILLUSTRATION-REDESIGN-V1-B-SELECTION.md`
- `docs/CHARACTER-BIBLE.md`
- `storyboard/story-illustration-redesign-v1-b/bible/visual_style_bible.md`
- `storyboard/story-illustration-redesign-v1-b/bible/continuity_rules.md`
- `storyboard/story-illustration-redesign-v1-b/scenes/scene_01.yaml`
- `storyboard/story-illustration-redesign-v1-b/shots/scene_01_shots.yaml`

**Global constraints:**

- Keep the adult-and-ordinary-cat identities, shared gaze, right-side stable warm door, one faint broken Milky Way, and exactly two weakly glowing flowers.
- Keep the deep-navy limited palette, dry-brush edges, halftone patches, and paper grain. Do not import or sample pixels from the exploration PNGs.
- Do not change `FORMAL-UI-V1.2-A`, door behavior, first-touch audio gating, progress semantics, or local save behavior.
- Do not upload, submit for review, publish, push, or commit. This workspace is not a Git repository; all work stays local until the user grants a separate remote-operation authorization.
- A formal composite requires a second user-visible approval before Cocos visual integration begins.

---

## Task 1: Build the editable FORMAL-R1 art source and deterministic exporter

**Files:**

- Create: `design-system/outdoor-story-illustration-v1-b/README.md`
- Create: `design-system/outdoor-story-illustration-v1-b/palette.json`
- Create: `design-system/outdoor-story-illustration-v1-b/layer-manifest.json`
- Create: `design-system/outdoor-story-illustration-v1-b/src/b01-settle.svg`
- Create: `design-system/outdoor-story-illustration-v1-b/src/b02-wind-passes.svg`
- Create: `design-system/outdoor-story-illustration-v1-b/src/b03-afterwind.svg`
- Create: `design-system/outdoor-story-illustration-v1-b/scripts/export-assets.mjs`
- Create: `design-system/outdoor-story-illustration-v1-b/scripts/validate-assets.mjs`
- Create: `design-system/outdoor-story-illustration-v1-b/ASSET-HASHES.sha256`

**Step 1: Write the failing structural validation**

The validator must fail until all three source SVGs exist and contain the required named groups, no external or embedded raster image, and no unapproved colors.

Required groups include: `sky`, `milky_way`, `main_stars`, `mountains`, `house`, `door_light`, `far_grass`, `person_body`, `person_hair`, `person_moving_part`, `cat_body`, `cat_ear`, `cat_tail`, `near_grass`, `flower_left`, `flower_right`, `foreground_occlusion`, and `paper_texture`.

Run:

```bash
node design-system/outdoor-story-illustration-v1-b/scripts/validate-assets.mjs
```

Expected before implementation: non-zero exit with explicit missing-source or missing-group diagnostics.

**Step 2: Create the three editable sources**

- Use an 860×1864 source canvas with safe-area guides for 360×800, 390×844, 430×932, and 430×844 pressure crop.
- Place outlines inside silhouettes; use broken, non-uniform strokes so exported alpha cannot create a rectangular or sticker-like halo.
- Preserve the story change through composition, not a moving crop: B01 sky-dominant settling shot; B02 near-grass-dominant wind passage; B03 hand-and-cat-tail afterwind detail.
- Author texture from vector patterns and deterministic procedural noise only. Do not use an `<image>` element or exploration PNG.

**Step 3: Implement deterministic exports**

Export at minimum:

- `dist/390x844/b01-settle.png`
- `dist/390x844/b02-wind-passes.png`
- `dist/390x844/b03-afterwind.png`
- `dist/360x800/…`
- `dist/430x932/…`
- `dist/430x844-pressure/…`
- `dist/thumbnail-195x422/…`（390×844 的宽高各 50%，与已批准确认板一致）

The exporter must extend edge RGB under transparency by four pixels, retain straight alpha, and produce identical hashes for repeated runs from the same sources.

**Step 4: Run validation and hash the artifact set**

Run:

```bash
node design-system/outdoor-story-illustration-v1-b/scripts/export-assets.mjs
node design-system/outdoor-story-illustration-v1-b/scripts/validate-assets.mjs
cd design-system/outdoor-story-illustration-v1-b && shasum -a 256 -c ASSET-HASHES.sha256
```

Expected: all structural, dimension, palette, alpha-edge, and hash checks pass.

## Task 2: Publish a visible formal-art review board and stop for approval

**Files:**

- Create: `design-board/story-illustration-redesign-v1-b/formal-r1/index.html`
- Create: `design-board/story-illustration-redesign-v1-b/formal-r1/styles.css`
- Create: `design-board/story-illustration-redesign-v1-b/formal-r1/README.md`
- Create: `design-board/story-illustration-redesign-v1-b/formal-r1/HASHES.sha256`
- Create: `design-board/story-illustration-redesign-v1-b/formal-r1/evidence/visual-metrics.json`
- Modify: `docs/ASSET-PROVENANCE.md`
- Modify: `docs/PROJECT-MEMORY.md`

**Step 1: Assemble the review board**

Show B01/B02/B03 at 390×844, the 195×422 thumbnails, the 360/430 crops, layer names, palette, and a clear statement that the art is an original formal redraw rather than the generated exploration image.

**Step 2: Add binary visual checks**

Record whether each frame preserves: adult+cat identity, same gaze direction, exactly one Milky Way, stable right-side warm door, exactly two flowers, dry-brush/halftone continuity, no black rectangle/halo, and no task-map language.

**Step 3: Render and inspect**

Use browser screenshots at 360×800, 390×844, 430×932, and 430×844. Inspect every image at 100% and at the approved 195×422 thumbnail size. Do not mark the visual gate PASS solely from automated measurements.

**Step 4: User checkpoint**

Report every visible difference from the approved KF-R1 explorations. Stop before Cocos visual integration until the user approves `STORY-ILLUSTRATION-REDESIGN-V1-B-FORMAL-R1`.

## Task 3: Add a pure three-beat story model with tests

**Gate:** Start only after Task 2 receives explicit user approval.

**Files:**

- Create: `cocos-project/assets/scripts/outdoor-story-v1/outdoor-story-model.ts`
- Create: `cocos-project/tests/outdoor-story-model.test.ts`

**Step 1: Write failing behavior tests**

Cover these defaults within the already approved timing ranges:

- B01 rests for 3,200ms.
- B01→B02 crossfades for 300ms.
- B02 holds for 1,500ms.
- B02→B03 crossfades for 360ms.
- B03 rests indefinitely; there is no automatic loop or automatic room entry.
- A slow swipe may replay from B01.
- Reduced motion holds B01 and never advances automatically.
- Door entry cancels the story immediately and cannot produce a late transition callback.

Run the focused test and confirm it fails because the model does not exist.

**Step 2: Implement the smallest deterministic state machine**

Use explicit states (`settle`, `to-wind`, `wind`, `to-afterwind`, `afterwind`, `cancelled`) and injectable time. Do not use scene-global timers.

**Step 3: Re-run the focused tests**

Expected: all story model tests pass, including cancellation and reduced-motion cases.

## Task 4: Implement the persistent Sprite transition component

**Files:**

- Create: `cocos-project/assets/scripts/outdoor-story-v1/outdoor-story-pages.ts`
- Create: `cocos-project/assets/scripts/outdoor-story-v1/outdoor-story-pages.ts.meta`
- Create: `cocos-project/tests/outdoor-story-pages.test.ts`
- Create: `cocos-project/assets/outdoor-story-v1/` and its Asset Bundle metadata

**Step 1: Write failing component-contract tests**

Assert two persistent Sprite nodes, no full-scene destruction, current+next textures only during transition, neutral ease-in/out opacity crossfade, and cancellation on door entry.

**Step 2: Implement the minimal component**

- Load the three approved formal composites from the new bundle.
- Keep one current frame resident at rest and two only during transition.
- Do not animate the whole camera or scale the full image.
- In reduced-motion mode, render the approved neutral frame and use no spatial movement.

**Step 3: Verify resource release**

Add a test or instrumentation hook proving the superseded frame can be released after each transition and all outdoor temporary assets release after room entry.

## Task 5: Integrate with the existing outdoor scene without changing door/audio/indoor behavior

**Files:**

- Modify: `cocos-project/assets/scripts/outdoor-gate-c-scene.ts`
- Modify only if required: `cocos-project/assets/scripts/tonight-has-light-bootstrap.ts`
- Create: `cocos-project/tests/outdoor-story-integration.test.ts`

**Step 1: Write regression tests**

Prove that:

- The door hit target exists before the bundle finishes loading.
- Door entry is deduplicated and wins over an in-progress crossfade.
- First-touch audio still starts environment wind before music and keeps the 2–3 second music fade.
- Entering the indoor room still waits for the indoor bundle before removing the outdoor scene.
- The old five-page R2 bundle is not loaded by the new candidate.

**Step 2: Replace only the visual page provider**

Wire the new story component into the existing persistent scene and reuse the current door, audio, lifecycle, and room-entry code. Do not rewrite stable flow code merely to match the new file names.

**Step 3: Run focused and full local tests**

Run the project’s existing test command plus the new focused tests. Record exact commands and results.

## Task 6: Build and perform local visual/interaction QA

**Files:**

- Create: `docs/STORY-ILLUSTRATION-REDESIGN-V1-B-LOCAL-QA.md`
- Modify: `docs/PROJECT-MEMORY.md`
- Modify: `docs/REQUIREMENTS-TRACEABILITY.md`
- Modify: `docs/ASSET-PROVENANCE.md`

**Step 1: Produce a unique local build ID**

Use a new `gate-d-story-b-formal-r1-local-*` ID. Do not reuse or overwrite the superseded `0.4.6` evidence.

**Step 2: Capture visual evidence**

Capture B01, B02, B03, both transitions, reduced-motion, room entry, and the unchanged bright indoor room at 360×800, 390×844, and 430×932.

**Step 3: Run play-path checks**

- Zero input: B01→B02→B03, then rest.
- First touch: audio wind then music fade.
- Door tap during every story phase: immediate smooth room entry.
- Reduced motion: stable B01 with all interactions still available.
- Background/foreground once during a transition: resume at a safe deterministic state without double audio or late callbacks.

**Step 4: Record performance and package evidence**

Record console errors, frame-time P95, long frames, peak memory, bundle size, and main-package size. Treat any visible halo, crop drift, full-image wobble, or missed door entry as a blocker.

**Step 5: Independent read-only review**

Ask a separate reviewer to inspect behavior regressions, test gaps, lifecycle cancellation, package boundary, and visual consistency. Fix all in-scope P0/P1 findings before reporting readiness.

**Step 6: Final local handoff only**

Report the local build path and evidence. Do not upload to WeChat, set an experience version, submit for review, publish, push, or commit without a new explicit authorization from the user.
