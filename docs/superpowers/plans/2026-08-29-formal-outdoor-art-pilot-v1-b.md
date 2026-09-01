# FORMAL-OUTDOOR-ART-PILOT-V1-B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce one new, visually strong and auditable `root_night_slope_v1` formal layered-art pilot without entering Cocos, WeChat, build, upload, review, release, or Git workflows.

**Architecture:** A single ImageGen-created master establishes the approved B night-comic composition. After visible preflight, ImageGen must create each authorial transparent layer and any occlusion repair from that frozen master; deterministic Node/Sharp tooling may only normalize, measure, package, composite and validate. The 20 straight-alpha semantic layers must reconstruct the frozen master exactly; if they cannot, the pilot stops instead of hiding a flatten under decorative layers. Existing exploration images are references only and are never renamed, embedded, traced, or copied into the formal package.

**Tech Stack:** Built-in ImageGen, Node.js 24, bundled `sharp` and `pixelmatch`, `zip`/`unzip`, `oxipng`, OpenRaster, Markdown/JSON evidence.

**Spec:** `docs/superpowers/specs/2026-08-29-ai-assisted-formal-layered-art-design.md`

## Global Constraints

- Candidate ID is exactly `formal-outdoor-art-pilot-v1-b-r1`.
- Only `root_night_slope_v1` is in scope; no other branch frame, meteor asset, or indoor asset may be produced.
- Source canvas is `780×1688`, sRGB, 8-bit RGBA; logical composition is `390×844`.
- Existing contact sheets, `b01-settle-reference-r1.png`, old B01 pilots, `0.4.6`, and `0.4.7` remain reference or historical material only.
- The visible contract remains: deep-indigo mature dry-ink night comic; normal adult left, ordinary cat right, shared upward gaze; exactly one broad broken Milky Way; right-middle house and stable amber door; exactly two weak flowers; no text in the clean plate.
- Master generation allows one primary candidate and at most one targeted master correction. Layer-extraction requests do not introduce a second composition and must preserve the accepted master.
- The package must contain 20 honest semantic layers. A full flattened scene hidden under empty or decorative layers is a hard failure.
- Straight alpha, original canvas coordinates, bbox, anchor, pivot, scale, blend, render order, and at least 4px transparent edge bleed must be recorded.
- All produced assets remain `LOCAL GATE B REVIEW CANDIDATE`; no Cocos source or build tree may be modified.
- No Git repository exists at the project root and Git operations are not authorized. Each task ends by hashing its outputs instead of committing.

---

### Task 1: Freeze the specification approval and production prompt

**Files:**
- Create: `docs/FORMAL-OUTDOOR-ART-PILOT-V1-B-SPEC-APPROVAL.md`
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/prompts/root_night_slope_v1.md`
- Modify: `docs/PROJECT-MEMORY.md`
- Modify: `.agents/skills/tonight-design-gate/references/current-contract.md`
- Modify: `docs/FORMAL-OUTDOOR-ART-PILOT-V1-B-TRACEABILITY.md`

**Interfaces:**
- Consumes: the user phrase `批准 FORMAL-OUTDOOR-ART-PILOT-V1-B 规格，开始单帧样板` and spec SHA-256 `9361b12390fac6a76a8f82e3c5017dc4d9184cfd41f645ba34be7b877fe742e4`.
- Produces: immutable approval identity and one self-contained ImageGen prompt used by every production/extraction request.

- [ ] **Step 1: Write the specification-approval record**

  Record the exact approval phrase, date `2026-08-29`, the approved spec path/hash, the single-frame scope, and explicit exclusions for Cocos, build, WeChat, Git, and expansion to the remaining story frames.

- [ ] **Step 2: Save the prompt contract**

  Use the storyboard fields `SHOT`, `PURPOSE`, `CHARACTER`, `CAMERA`, `LIGHTING`, `EMOTION`, `COMPOSITION`, `ENVIRONMENT`, `CONTINUITY`, `NEGATIVE CONSTRAINTS`, and `IMAGE PROMPT`. The prompt must explicitly prohibit text, UI, meteor, moon, constellation lines, aurora, extra galaxy, extra people/animals, anthropomorphic cat, artist imitation, brand, real-person likeness, and copied reference pixels.

- [ ] **Step 3: Synchronize the shared contract**

  Change only the pilot status from “specification review pending” to `SPEC APPROVED / SINGLE-FRAME PRODUCTION AUTHORIZED / ARTWORK IN PROGRESS`; retain `NO COCOS / NO BUILD / NO WECHAT / NO GIT`.

- [ ] **Step 4: Verify the documentation boundary**

  Run: `npm run verify:docs`

  Expected: exit `0` with `Documentation verification passed`.

---

### Task 2: Generate and visually preflight the new master

**Files:**
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/source/raw/root_night_slope_v1-imagegen-r1.png`
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/source/root_night_slope_v1-master-2x.png`
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/evidence/master-preflight.md`
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/provenance.json`

**Interfaces:**
- Consumes: `prompts/root_night_slope_v1.md` and the approved B reference solely as composition/light/material guidance.
- Produces: one accepted 780×1688 composition target or a stopped `FAIL` package.

- [ ] **Step 1: Generate one new master with built-in ImageGen**

  Label the existing B image as a visual reference, not an edit target. Require a new original wordless clean plate. Copy the generated output from the Codex generated-images directory into `source/raw/` without overwriting any historical file.

- [ ] **Step 2: Normalize without redesign**

  Use bundled Sharp only for deterministic color-profile normalization and a centered `cover` crop to `780×1688`. Do not repaint, trace, sharpen faces, add objects, or alter composition in the normalization step.

- [ ] **Step 3: Run the five visible stop checks at 100% and 25%**

  The checks are: believable seated adult weight; ordinary-cat anatomy; one broad broken Milky Way with deep-blue negative space; coherent broad grass masses; thumbnail hierarchy `sky → pair → door` with exactly two weak flowers.

- [ ] **Step 4: Apply at most one targeted master correction if required**

  Use the fixed edit form `Preserve / Change only / Do not change / Output`. If the corrected candidate still fails any visible stop check, write `FAIL / DO NOT LAYER / DO NOT COCOS` and stop this plan before Task 3.

- [ ] **Step 5: Freeze accepted master identity**

  Record raw and normalized SHA-256, ImageGen tool mode, complete prompt, reference path/hash, generation date, and any single targeted correction in `provenance.json` and `master-preflight.md`.

---

### Task 3: Produce honest semantic layer sources

**Files:**
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/source/extractions/01_sky_base.png` through `20_shared_paper_grain.png`
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/source/extraction-record.json`

**Interfaces:**
- Consumes: the visually accepted master only.
- Produces: 20 full-canvas transparent or clean authorial plates that preserve the accepted composition; they are not alternate story frames.

- [ ] **Step 1: Request the clean background and environmental layers**

  Use the frozen master as the only edit target. Produce full-canvas transparent outputs for `01` through `09` and `20`, preserving the accepted sky map, Milky Way, stars, hills, house, door, grass, palette, paper texture, camera and coordinates. ImageGen—not Sharp—must supply authorial pixels and any occluded background repair.

- [ ] **Step 2: Request exact full-canvas character and foreground layers**

  Produce full-canvas transparent outputs for `10` through `19`. Each plate must preserve the master-visible shape, position, color and lighting of its declared semantic role, with no repositioning, redesign, shadow rectangle, matte halo or extra content. Hidden pixels may be added only where another declared layer occludes that same object.

- [ ] **Step 3: Check extraction fidelity before packaging**

  Composite all 20 sources in declared order and compare their raw RGBA output against the accepted master. Visible mismatch, non-zero pixel difference, anatomy drift, palette drift or changed light hierarchy marks the extraction attempt `FAIL`; do not hide the mismatch with a flattened master layer and do not modify the master to fit the extracted layers.

- [ ] **Step 4: Record every extraction request**

  Save the exact extraction prompts, returned source paths, SHA-256 values and declared role for all 20 plates in `source/extraction-record.json`.

---

### Task 4: Build the 20-layer OpenRaster package

**Files:**
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/scripts/sharp-loader.mjs`
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/scripts/build-layer-package.mjs`
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/source/layer-manifest.json`
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/source/layers/*.png`
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/source/root_night_slope_v1.ora`
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/source/runtime-composite-neutral-2x.png`

**Interfaces:**
- Consumes: the accepted master and 20 fidelity-checked ImageGen layer sources.
- Produces: 20 real full-canvas RGBA layers and a standards-shaped OpenRaster package.

- [ ] **Step 1: Define the exact bottom-to-top layer contract**

  Use these IDs: `01_sky_base`, `02_milky_way_and_dust_rifts`, `03_star_dust_baked`, `04_hero_stars_01_10`, `05_distant_hills`, `06_house_body`, `07_door_warm_light`, `08_far_grass`, `09_near_grass`, `10_adult_body`, `11_adult_hair_edge`, `12_adult_clothes_edge`, `13_cat_body`, `14_cat_ears`, `15_cat_tail`, `16_flower_left`, `17_flower_right`, `18_flower_glows`, `19_foreground_grass_occlusion`, `20_shared_paper_grain`.

- [ ] **Step 2: Normalize only from production plates**

  Normalize each ImageGen layer source to the exact full-canvas RGBA contract. Sharp may not invent, segment, repaint, fill, trace or spatially repartition authorial pixels. Every non-empty layer must contribute visible pixels to the neutral composite; no layer may contain the original flattened master.

- [ ] **Step 3: Preserve straight alpha and edge RGB**

  Keep each layer on the full `780×1688` canvas, record nontransparent bbox, use centered anchor `[0.5,0.5]`, pivot in source pixels, scale `[1,1]`, blend `normal`, and extend edge RGB at least 4px beneath transparency without premultiplying RGB.

- [ ] **Step 4: Build OpenRaster deterministically**

  Write `mimetype` first and uncompressed, then `stack.xml`, `mergedimage.png`, `Thumbnails/thumbnail.png`, and 20 `data/*.png` files. Render order in `stack.xml` and `layer-manifest.json` must match exactly.

- [ ] **Step 5: Reconstruct the neutral composite**

  Composite the 20 layer files only—never the master—and save `runtime-composite-neutral-2x.png`. If it does not visually preserve the accepted master, return to extraction; do not lower the threshold or add a hidden flattened layer.

---

### Task 5: Export mobile review evidence and validate the package

**Files:**
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/scripts/validate-layer-package.mjs`
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/scripts/write-hashes.mjs`
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/exports/390x844/root_night_slope_v1.png`
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/exports/195x422/root_night_slope_v1.png`
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/exports/360x800/root_night_slope_v1.png`
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/exports/430x932/root_night_slope_v1.png`
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/exports/430x844-pressure/root_night_slope_v1.png`
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/evidence/safe-area/*.png`
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/evidence/review-board.png`
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/evidence/validation-report.json`
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/HASHES.sha256`

**Interfaces:**
- Consumes: the layer-only neutral composite and manifest.
- Produces: user-visible review images, structural evidence, and a frozen identity.

- [ ] **Step 1: Export SHOW_ALL derivatives**

  Use `#06265F` only for exposed safe-border pixels. Never stretch or crop the logical composition.

- [ ] **Step 2: Build the review board**

  Show 390×844 at readable size, 195×422 thumbnail, the approved B reference labeled `REFERENCE ONLY`, layer composite labeled `FORMAL PILOT`, and edge ROIs for adult, cat, door, flowers, and foreground grass.

- [ ] **Step 3: Validate structure and identity**

  Check exact dimensions, 20 non-empty layers, manifest/file hashes, unique render order, valid bbox/pivot/anchor/scale/blend, ORA archive order, straight alpha, 4px edge bleed record, zero text in clean plate, one Milky Way contract, 8–10 hero stars, exactly two flowers, and no forbidden historical source hash.

- [ ] **Step 4: Validate reconstruction**

  Compare the manifest composite against `runtime-composite-neutral-2x.png` with zero pixel difference. Compare that composite against the accepted master with separately reported full-frame and ROI metrics; the report must never convert a visible mismatch into `PASS` merely because a numeric threshold is met.

- [ ] **Step 5: Freeze hashes and rerun from the frozen tree**

  Run the validator, run `shasum -c HASHES.sha256`, then run the validator again without rewriting timestamps. Expected: both validation runs pass and all frozen hashes remain stable.

---

### Task 6: Independent Gate B review and user handoff

**Files:**
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/evidence/INDEPENDENT-REVIEW.md`
- Create: `design-system/formal-outdoor-art-pilot-v1-b-r1/STATUS.md`
- Modify: `docs/FORMAL-OUTDOOR-ART-PILOT-V1-B-TRACEABILITY.md`
- Modify: `docs/PROJECT-MEMORY.md`
- Modify: `.agents/skills/tonight-design-gate/references/current-contract.md`

**Interfaces:**
- Consumes: the frozen review board, exports, ORA, layers, manifest, provenance, metrics, and hashes.
- Produces: an honest `READY FOR USER VISUAL REVIEW` or `FAIL / STOPPED` Gate B conclusion.

- [ ] **Step 1: Run independent read-only review**

  Review visible quality, anatomy, ordinary-cat reading, thumbnail hierarchy, single Milky Way, door/flower light hierarchy, no black edges/rectangular seams, multi-size safety, honest AI provenance, and real layer usability.

- [ ] **Step 2: Resolve all in-scope P0/P1 findings**

  Structural packaging defects may be fixed without changing visible style. Any fix that changes character, composition, material, palette, sky, lighting, or signature marks returns to user approval instead of being silently applied.

- [ ] **Step 3: Set final local status**

  Use `READY FOR USER VISUAL REVIEW / FORMAL ASSET NOT YET APPROVED / NO COCOS / NO BUILD / NO WECHAT / NO GIT` only if the visible and structural gates pass. Otherwise use `FAIL / STOPPED / DO NOT EXPAND / DO NOT COCOS`.

- [ ] **Step 4: Present only the frozen candidate to the user**

  Show the 390×844 formal composite and link the review board, ORA, manifest, provenance, validation report, and hash list. Do not begin other frames or Cocos work until the user approves the exact candidate and hash.
