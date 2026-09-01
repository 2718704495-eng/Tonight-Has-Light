# B01 FORMAL-R2-PROOF Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce one original, editable, traceable B01 `坐稳` formal-art pilot that visibly matches the user-approved B graphic-novel direction before any B02/B03 production or Cocos integration.

**Architecture:** A new isolated art package owns one 860×1864 master SVG and a manifest of named visual layers. Hand-authored character and house paths are combined with deterministic program-authored grass, dry-brush, halftone, star, and paper-grain vectors; approved/generated PNGs are comparison inputs only and may never be embedded, linked, traced, or copied into the source or exports. A deterministic exporter produces review images, while a structural validator and a human visual gate keep technical correctness separate from art approval.

**Tech Stack:** SVG 1.1, Node.js ESM, Sharp from the bundled Codex workspace runtime, SHA-256, browser review board.

**Spec:** `docs/STORY-ILLUSTRATION-REDESIGN-V1-B-B01-FORMAL-PILOT.md`

**Execution result:** `STOPPED / VISUAL FAIL after R2.1`. Tasks 1–4 produced reproducible evidence, but the main-controller art gate rejected the adult posture, cat anatomy, Milky Way structure, and constructed-vector medium. Task 5 must not create a user approval board or continue to B02/B03.

## Global Constraints

- Work only inside `design-system/outdoor-story-illustration-v1-b-formal-r2-proof/` until the main controller begins the review board task.
- Do not modify Cocos, the current local motion preview, old `formal-r1`, approved KF-R1 exploration files, or any WeChat build.
- Keep the approved B visual language: mature wordless night comic, deep indigo limited palette, broad value masses, dry-brush ink, restrained halftone, and paper grain.
- Keep an adult on the left and an ordinary house cat on the right, looking at the same sky; no mascot anatomy, front-facing pose, or identity change.
- Keep exactly one faint broken Milky Way, one stable warm door in the right midground, and exactly two weak glowing flowers.
- Generated images remain `prototype-only/not-in-build`; no `<image>`, `data:image`, raster href, pixel sampling, automatic trace, or contour copy is allowed.
- The first formal pilot remains `REVIEW-BLOCKED` until the main controller visually inspects it and the user approves the same hashed version.
- No commit, push, build, upload, review submission, or publication is authorized.

---

### Task 1: Define the isolated package contract and failing validator

**Files:**

- Create: `design-system/outdoor-story-illustration-v1-b-formal-r2-proof/README.md`
- Create: `design-system/outdoor-story-illustration-v1-b-formal-r2-proof/STATUS.md`
- Create: `design-system/outdoor-story-illustration-v1-b-formal-r2-proof/layer-manifest.json`
- Create: `design-system/outdoor-story-illustration-v1-b-formal-r2-proof/scripts/validate-assets.mjs`

**Interfaces:**

- Consumes: locked B01 rules from the spec and current contract.
- Produces: a validator that requires one 860×1864 SVG, named layer groups, exact flower and Milky Way counts, no raster inputs, expected exports, and a complete hash index.

- [ ] **Step 1: Write the validator before the source exists**

  Require exactly these top-level IDs: `sky_base`, `paper_grain`, `milky_way`, `star_dust`, `main_stars`, `mountains_far`, `mountains_near`, `house`, `door_light`, `far_grass`, `adult_legs`, `adult_body`, `adult_hair`, `adult_hand`, `cat_body`, `cat_ears`, `cat_tail`, `near_grass`, `flower_left`, `flower_right`, and `foreground_ink`.

- [ ] **Step 2: Run the validator and record the expected red state**

  Run:

  ```bash
  node design-system/outdoor-story-illustration-v1-b-formal-r2-proof/scripts/validate-assets.mjs
  ```

  Expected: non-zero exit naming the missing SVG and exports.

- [ ] **Step 3: Freeze review status**

  `STATUS.md` must say `REVIEW-BLOCKED / B01 ONLY / NO COCOS / NO BUILD / NO UPLOAD`; the validator must reject `PASS`, `APPROVED`, or production-package claims before a separate approval record exists.

### Task 2: Author the B01 layered master

**Files:**

- Create: `design-system/outdoor-story-illustration-v1-b-formal-r2-proof/src/b01-formal-r2-proof.svg`
- Create: `design-system/outdoor-story-illustration-v1-b-formal-r2-proof/scripts/build-source.mjs` only if deterministic repeated marks are too verbose to maintain directly.

**Interfaces:**

- Consumes: `layer-manifest.json` layer IDs and 860×1864 source geometry.
- Produces: one editable SVG with no raster dependency and stable group order.

- [ ] **Step 1: Build the scene in value order**

  Author sky and mountain masses first; preserve a large quiet sky, a lower-left character group, and the right-midground cottage without copying the reference contour.

- [ ] **Step 2: Author coherent original anatomy**

  Draw connected adult head/neck/shoulders/back/pelvis/legs/sleeve/grounded hand paths and connected cat head/neck/chest/back/haunch/paws/tail-root paths. Outlines must sit within or overlap fills so there is no detached black sticker rim.

- [ ] **Step 3: Add the natural sky contract**

  Build one loose, broad, broken Milky Way from irregular vector marks and dark gaps; name 8–10 main-star child groups and keep remaining stars static and sparse.

- [ ] **Step 4: Add shared material language**

  Use the same dry-brush edge logic, halftone scale, and paper-grain density across sky, mountains, house, characters, and grass. Avoid rectangular texture bounds visible at normal size or 25% scale.

- [ ] **Step 5: Add restrained warm accents**

  Keep the door brighter than either flower, the two flowers weaker than the door, and all warm accents subordinate to the sky at thumbnail size.

### Task 3: Export deterministic review derivatives

**Files:**

- Create: `design-system/outdoor-story-illustration-v1-b-formal-r2-proof/scripts/sharp-loader.mjs`
- Create: `design-system/outdoor-story-illustration-v1-b-formal-r2-proof/scripts/export-assets.mjs`
- Create: `design-system/outdoor-story-illustration-v1-b-formal-r2-proof/dist/390x844/b01-formal-r2-proof.png`
- Create: `design-system/outdoor-story-illustration-v1-b-formal-r2-proof/dist/195x422/b01-formal-r2-proof.png`
- Create: `design-system/outdoor-story-illustration-v1-b-formal-r2-proof/dist/360x800/b01-formal-r2-proof.png`
- Create: `design-system/outdoor-story-illustration-v1-b-formal-r2-proof/dist/430x932/b01-formal-r2-proof.png`
- Create: `design-system/outdoor-story-illustration-v1-b-formal-r2-proof/dist/430x844-pressure/b01-formal-r2-proof.png`

**Interfaces:**

- Consumes: `src/b01-formal-r2-proof.svg`.
- Produces: sRGB straight-alpha review PNGs with deterministic dimensions and hashes.

- [ ] **Step 1: Implement target-specific crop geometry**

  Use explicit crop/focal metadata from `layer-manifest.json`; do not stretch the 390×844 composition to other aspect ratios.

- [ ] **Step 2: Export all five review sizes**

  Run:

  ```bash
  node design-system/outdoor-story-illustration-v1-b-formal-r2-proof/scripts/export-assets.mjs
  ```

  Expected: exactly five PNG files with the declared pixel dimensions.

- [ ] **Step 3: Prove deterministic output**

  Run the exporter twice and compare SHA-256 for every derivative. Expected: identical hashes.

### Task 4: Validate structure and perform the human art stop line

**Files:**

- Create: `design-system/outdoor-story-illustration-v1-b-formal-r2-proof/ASSET-HASHES.sha256`
- Create: `design-system/outdoor-story-illustration-v1-b-formal-r2-proof/SELF-CHECK.md`

**Interfaces:**

- Consumes: the master, manifest, and five exports.
- Produces: structural proof plus an honest `REVIEW-BLOCKED` visual self-check.

- [ ] **Step 1: Run structural validation**

  Run:

  ```bash
  node design-system/outdoor-story-illustration-v1-b-formal-r2-proof/scripts/validate-assets.mjs
  ```

  Expected: all file, group, count, dimension, provenance, raster-input, and hash checks pass.

- [ ] **Step 2: Inspect 390×844 at 100%**

  Fail the sample if the adult or cat anatomy is disconnected, outlines look like black stickers, the Milky Way reads as a strip, grass reads as repeated triangles, or the house/flowers become task markers.

- [ ] **Step 3: Inspect 195×422 at 100%**

  Fail the sample unless the first read remains sky plus two companions jointly looking upward, with the house and slope secondary but legible.

- [ ] **Step 4: Inspect all aspect ratios**

  Fail if any target crops the adult, cat, either flower, door, or main Milky Way arc; no image may be non-uniformly scaled.

- [ ] **Step 5: Hash the complete package**

  `ASSET-HASHES.sha256` must cover every package file except itself and `.DS_Store`; a second pass must verify all entries.

### Task 5: Main-controller review board and approval stop

**Result:** stopped before user review because the internal visible-art stop line failed. The files below were not created and remain intentionally blocked.

**Files:**

- Create after Task 4 only: `design-board/story-illustration-redesign-v1-b/formal-r2-proof/index.html`
- Create after Task 4 only: `design-board/story-illustration-redesign-v1-b/formal-r2-proof/styles.css`
- Create after Task 4 only: `design-board/story-illustration-redesign-v1-b/formal-r2-proof/README.md`
- Modify after Task 4 only: `docs/PROJECT-MEMORY.md`
- Modify after Task 4 only: `docs/ASSET-PROVENANCE.md`

**Interfaces:**

- Consumes: the hashed B01 package and approved KF-R1 comparison image as separate review-only files.
- Produces: a visible side-by-side decision surface; it does not produce a Cocos-ready asset approval.

- [ ] **Step 1: Assemble the board without mixing sources**

  Show approved reference and formal pilot side-by-side with explicit labels; never composite or sample the reference into the formal result.

- [ ] **Step 2: Ask an independent read-only reviewer**

  Review for anatomy, shared gaze, style continuity, dark/sticker edges, mobile thumbnail readability, safe crops, asset provenance, and unapproved-style drift.

- [ ] **Step 3: Main-controller visual decision**

  If any P0/P1 visual issue remains, keep the board private, mark the pilot `FAIL`, and revise or stop. If it clears the internal bar, show the same hashed version to the user.

- [ ] **Step 4: Stop for explicit user approval**

  B02/B03 and Cocos remain blocked until the user approves `STORY-ILLUSTRATION-B-FORMAL-R2-PROOF` with the version and SHA-256 shown on the board.

## Self-Review

- Spec coverage: the plan covers the B01 composition, characters, sky, warm accents, named layering, provenance, five output sizes, deterministic export, visual review, and approval stop.
- Placeholder scan: no `TBD`, `TODO`, or unspecified implementation handoff remains.
- Interface consistency: the master path, layer IDs, output names, and review version are identical across tasks.
