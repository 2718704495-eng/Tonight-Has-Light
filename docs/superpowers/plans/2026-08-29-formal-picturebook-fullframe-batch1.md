# FORMAL-PICTUREBOOK-FULLFRAME-V1-A Batch 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce and freeze the first three-page formal full-frame proof set: the already-approved root page, a new stargaze F5 clean plate, and a new bright-home F5 clean plate.

**Architecture:** Every story page is one complete `780×1688` lossless PNG master with no baked UI or meteor. The root master is referenced without modification; the two new pages are generated one at a time with the built-in image generation tool, normalized non-destructively, exported through one deterministic SHOW_ALL pipeline, and reviewed before the next page begins. UI and meteor remain contracts only in this batch.

**Tech Stack:** Markdown/YAML project contracts, built-in `image_gen`, Node.js ESM, Sharp, PNG, SHA-256.

**Spec:** `docs/superpowers/specs/2026-08-29-formal-picturebook-fullframe-design.md`

## Global Constraints

- User approval phrase is exactly `批准 FORMAL-PICTUREBOOK-FULLFRAME-V1-A 规格，开始 Batch 1`.
- Batch 1 contains exactly `root_night_slope_v1`, `scene_02_stargaze_shot_005`, and `scene_01_home_shot_005`.
- `root_night_slope_v1` remains byte-identical at SHA-256 `5c84ce815ba011cd9be570889c768573e80c3d55d6b59fb2bd211301f86c74e3`; its frozen R1 directory is read-only.
- Each new master is `780×1688`, sRGB, 8-bit, full-frame PNG. No Chinese, pseudo-Chinese, UI, logo, watermark, page number, hotspot mark, or baked meteor.
- Stargaze F5 is about 85% sky and keeps a clear upper-right-to-above-pair meteor corridor, but the clean plate contains no meteor or trail.
- Home F5 is bright throughout: readable ceiling, walls, floor, furniture, adult, cat, dinner, and window; no black corners, party, crowd, or light-on spectacle.
- Adult identity and cat identity derive from the approved R1 visual reference; the indoor approval image is mood/light/meaning reference only and is not copied.
- Source property is recorded as `ai-assisted-formal-fullframe`; no claim of fully manual art or semantic layers.
- SHOW_ALL outputs are `360×800`, `390×844`, `430×932`, and `430×844-pressure`, using `#06265F` for the exposed safe border. A `195×422` thumbnail is also required.
- One initial generation and at most one targeted repair are allowed per new frame. A remaining P0/P1 visual defect stops Batch 1.
- No Cocos files, builds, WeChat operations, Git operations, or remote writes.

---

### Task 1: Freeze the detailed-spec approval and current production rule

**Files:**
- Create: `docs/FORMAL-PICTUREBOOK-FULLFRAME-V1-A-SPEC-APPROVAL.md`
- Modify: `docs/superpowers/specs/2026-08-29-formal-picturebook-fullframe-design.md`
- Modify: `docs/FORMAL-PICTUREBOOK-FULLFRAME-V1-A-ROUTE-APPROVAL.md`
- Modify: `docs/FORMAL-PICTUREBOOK-FULLFRAME-V1-A-TRACEABILITY.md`
- Modify: `AGENTS.md`
- Modify: `docs/PROJECT-MEMORY.md`
- Modify: `.agents/skills/tonight-design-gate/references/current-contract.md`
- Modify: `design-board/outdoor-picturebook-branch-v1/storyboard-project/bible/character_bible.md`
- Modify: `design-board/outdoor-picturebook-branch-v1/storyboard-project/bible/visual_style_bible.md`
- Modify: `design-board/outdoor-picturebook-branch-v1/storyboard-project/bible/continuity_rules.md`
- Modify: `design-board/outdoor-picturebook-branch-v1/storyboard-project/scenes/scene_01_home.yaml`
- Modify: `design-board/outdoor-picturebook-branch-v1/storyboard-project/shots/scene_01_home_shots.yaml`
- Modify: `design-board/outdoor-picturebook-branch-v1/storyboard-project/scenes/scene_02_stargaze.yaml`
- Modify: `design-board/outdoor-picturebook-branch-v1/storyboard-project/shots/scene_02_stargaze_shots.yaml`

**Interfaces:**
- Consumes: user approval phrase and spec SHA-256 `69db50589d6658e9397f27013e658430d6457aec1c1cea316fd7915f59c11663`.
- Produces: one unambiguous `SPEC APPROVED / BATCH 1 AUTHORIZED` contract for every later task.

- [x] **Step 1: Record the exact approval**

Create the approval record with the exact user phrase, spec path and SHA-256, three allowed page IDs, the one-repair limit, and the explicit `NO COCOS / NO WECHAT / NO GIT` boundary.

- [x] **Step 2: Replace stale “awaiting review” statuses**

Change only current-status language to `SPEC APPROVED / BATCH 1 AUTHORIZED / ART PRODUCTION IN PROGRESS`. Preserve all historical R1 and 20-layer failure evidence.

- [x] **Step 3: Add the bounded formal-AI exception to project rules**

State in `AGENTS.md` that only the full-frame clean plates approved under `FORMAL-PICTUREBOOK-FULLFRAME-V1-A` may use `ai-assisted-formal-fullframe`; final Chinese, Logo, icons, UI and meteor effect sources remain independently editable and traceable. Do not grant a general production exception to ImageGen.

- [x] **Step 4: Synchronize the bibles**

Set R1 as the approved full-frame visual/identity anchor without calling it a standalone editable character asset. Change only Batch 1 page production boundaries to formal full-frame production; keep all Cocos/runtime permissions blocked.

- [x] **Step 5: Verify documentation**

Run:

```bash
npm run verify:docs
```

Expected: exit `0` and `Documentation verification passed`.

### Task 2: Create the deterministic Batch 1 asset pipeline

**Files:**
- Create: `design-system/formal-picturebook-fullframe-v1-a-batch1/scripts/sharp-loader.mjs`
- Create: `design-system/formal-picturebook-fullframe-v1-a-batch1/scripts/normalize-and-export.mjs`
- Create: `design-system/formal-picturebook-fullframe-v1-a-batch1/scripts/validate-batch1.mjs`
- Create: `design-system/formal-picturebook-fullframe-v1-a-batch1/scripts/write-hashes.mjs`
- Create: `design-system/formal-picturebook-fullframe-v1-a-batch1/batch-manifest.json`
- Create directories through the scripts: `source/raw`, `source/masters`, `exports/195x422`, `exports/390x844`, `exports/360x800`, `exports/430x932`, `exports/430x844-pressure`, `evidence`, `prompts`, `reviews`.

**Interfaces:**
- Consumes: an input image path and stable frame ID.
- Produces: `<frame>-master-2x.png` plus five deterministic review exports and validation metadata.

- [x] **Step 1: Implement normalization and SHOW_ALL exports**

`normalize-and-export.mjs --frame <id> --input <path>` must:

1. center-cover normalize the input to `780×1688` without retouching;
2. attach sRGB and encode lossless PNG;
3. export `390×844` and `195×422` exact downscales;
4. export `360×800`, `430×932`, and `430×844` with `fit: contain` and background `#06265F`;
5. print source/master/output dimensions and paths as JSON.

- [x] **Step 2: Encode the three-page manifest**

Use exact IDs and asset IDs:

```json
{
  "root_night_slope_v1": "ART-OUTDOOR-001",
  "scene_02_stargaze_shot_005": "ART-PBOOK-STAR-005",
  "scene_01_home_shot_005": "ART-PBOOK-HOME-005"
}
```

The root entry references the frozen R1 master; new entries remain `pending-generation` until their files and hashes exist.

- [x] **Step 3: Implement validation**

`validate-batch1.mjs` must fail unless:

- all three page IDs exist;
- root master SHA-256 equals the approved digest;
- each new master is `780×1688`, sRGB-compatible, RGB or fully opaque RGBA;
- every required export exists with exact dimensions;
- source and master file paths are outside `cocos-project`;
- no prompt or manifest grants Cocos, WeChat, release or Git permission;
- every completed entry has source, prompt, master and SHA-256 fields.

- [x] **Step 4: Smoke-test the pipeline with the existing root master**

Run the exporter in `--reference-only` mode for `root_night_slope_v1`, then run:

```bash
node design-system/formal-picturebook-fullframe-v1-a-batch1/scripts/validate-batch1.mjs --allow-pending
```

Expected: root and export checks pass; exactly two new page entries report `pending-generation` without turning the command into a full Batch 1 PASS.

### Task 3: Produce `scene_02_stargaze_shot_005`

**Files:**
- Create: `design-system/formal-picturebook-fullframe-v1-a-batch1/prompts/scene_02_stargaze_shot_005.md`
- Create: `design-system/formal-picturebook-fullframe-v1-a-batch1/source/raw/scene_02_stargaze_shot_005-imagegen-r1.png`
- Create: `design-system/formal-picturebook-fullframe-v1-a-batch1/source/masters/scene_02_stargaze_shot_005-master-2x.png`
- Create: matching files in each `exports/*` directory.
- Modify: `design-system/formal-picturebook-fullframe-v1-a-batch1/batch-manifest.json`

**Interfaces:**
- Consumes: R1 as a style/identity/location reference; the stargaze F5 shot contract.
- Produces: one clean, shooting-star-free, sky-first formal page candidate.

- [x] **Step 1: Write and safety-review the self-contained prompt**

The prompt must include the stable shot ID, 85% sky, small adult-left/cat-right anchors, right-side house and steady door, exactly two weak flowers, one broad broken Milky Way, 8–10 important stars, open meteor corridor, no meteor/text/UI, no artist/IP/real-person cues.

- [x] **Step 2: Generate one initial candidate**

Use built-in `image_gen` in `illustration-story` mode with the R1 master as a reference image, not an edit target. Copy the returned project-bound output into the exact `source/raw` path without overwriting any existing file.

- [x] **Step 3: Normalize and inspect**

Run:

```bash
node design-system/formal-picturebook-fullframe-v1-a-batch1/scripts/normalize-and-export.mjs --frame scene_02_stargaze_shot_005 --input design-system/formal-picturebook-fullframe-v1-a-batch1/source/raw/scene_02_stargaze_shot_005-imagegen-r1.png
```

Inspect the master, 390 and 195 outputs. If there is a P0/P1 defect, use one targeted image edit that preserves approved elements and changes only the named defect. If the repair still fails, mark the frame `FAIL` and stop Batch 1.

- [x] **Step 4: Record the accepted candidate**

Write raw/master/export hashes, prompt hash, input-reference role, normalization operation, owner review and similarity review into the manifest and provenance record. Do not call it user-approved yet.

### Task 4: Produce `scene_01_home_shot_005`

**Files:**
- Create: `design-system/formal-picturebook-fullframe-v1-a-batch1/prompts/scene_01_home_shot_005.md`
- Create: `design-system/formal-picturebook-fullframe-v1-a-batch1/source/raw/scene_01_home_shot_005-imagegen-r1.png`
- Create: `design-system/formal-picturebook-fullframe-v1-a-batch1/source/masters/scene_01_home_shot_005-master-2x.png`
- Create: matching files in each `exports/*` directory.
- Modify: `design-system/formal-picturebook-fullframe-v1-a-batch1/batch-manifest.json`

**Interfaces:**
- Consumes: R1 for adult/cat identity and B comic material; the approved indoor reference for emotional meaning, broad warm lighting and dinner semantics only.
- Produces: one original, fully bright, no-black-corner home F5 clean plate.

- [x] **Step 1: Write and safety-review the self-contained prompt**

The prompt must explicitly label R1 as identity/style reference and the indoor image as mood/light/meaning reference. Require an original room drawing rather than exact room geometry, exact furniture placement or copied pixels. Keep adult left and cat right, both seen from behind at a low dinner table; show prepared simple dinner, kettle, two cups, readable ceiling/walls/floor/furniture and the same deep-blue night through a secondary window.

- [x] **Step 2: Generate one initial candidate**

Use built-in `image_gen` in `illustration-story` mode with both references. Copy the returned output into the exact `source/raw` path.

- [x] **Step 3: Normalize and inspect**

Run:

```bash
node design-system/formal-picturebook-fullframe-v1-a-batch1/scripts/normalize-and-export.mjs --frame scene_01_home_shot_005 --input design-system/formal-picturebook-fullframe-v1-a-batch1/source/raw/scene_01_home_shot_005-imagegen-r1.png
```

Inspect master, 390 and 195 outputs. Fail if any corner is black, the room reads as an orange filter, the adult/cat identity drifts, extra people appear, dinner is absent, or copied reference geometry is obvious. At most one targeted repair is permitted.

- [x] **Step 4: Record the accepted candidate**

Write hashes, prompt, both reference roles, normalization, owner review and similarity review. Do not call it user-approved yet.

### Task 5: Freeze Batch 1 evidence and request user visual approval

**Files:**
- Create: `design-system/formal-picturebook-fullframe-v1-a-batch1/provenance.json`
- Create: `design-system/formal-picturebook-fullframe-v1-a-batch1/evidence/review-board-3up.png`
- Create: `design-system/formal-picturebook-fullframe-v1-a-batch1/evidence/review-board-3up-195.png`
- Create: `design-system/formal-picturebook-fullframe-v1-a-batch1/evidence/owner-review.md`
- Create: `design-system/formal-picturebook-fullframe-v1-a-batch1/reviews/continuity-review.md`
- Create: `design-system/formal-picturebook-fullframe-v1-a-batch1/STATUS.md`
- Create: `design-system/formal-picturebook-fullframe-v1-a-batch1/HASHES.sha256`
- Modify: `assets/asset-register.csv`
- Modify: `docs/ASSET-PROVENANCE.md`
- Modify: `docs/FORMAL-PICTUREBOOK-FULLFRAME-V1-A-TRACEABILITY.md`
- Modify: `docs/PROJECT-MEMORY.md`
- Modify: `.agents/skills/tonight-design-gate/references/current-contract.md`

**Interfaces:**
- Consumes: three complete page entries and their exports.
- Produces: one hash-frozen Gate B Batch 1 review package, still blocked for user visual approval.

- [x] **Step 1: Build review boards**

Place root, stargaze F5 and home F5 left-to-right at 390 scale with neutral `#06265F` gutters and no labels inside the images. Build a second board from the 195 thumbnails.

- [x] **Step 2: Run deterministic validation**

Run:

```bash
node design-system/formal-picturebook-fullframe-v1-a-batch1/scripts/validate-batch1.mjs
```

Expected: every mechanical check passes. This does not equal visual or user PASS.

- [x] **Step 3: Run owner and independent visual review**

Check anatomy, cat scale, B material, sky structure, home lighting, no text/UI/meteor, 390/195 hierarchy, SHOW_ALL exports, reference similarity and asset boundaries. Any P0/P1 finding stops the batch or triggers the one allowed targeted repair.

- [x] **Step 4: Register assets and freeze hashes**

Add `ART-PBOOK-STAR-005` and `ART-PBOOK-HOME-005` as `not-in-build / awaiting-user-visual-approval`. Keep `ART-OUTDOOR-001` visually approved but not in build. Run:

```bash
node design-system/formal-picturebook-fullframe-v1-a-batch1/scripts/write-hashes.mjs
shasum -a 256 -c design-system/formal-picturebook-fullframe-v1-a-batch1/HASHES.sha256
npm run verify:docs
```

Expected: all hash entries `OK`, documentation verification exit `0`, no Cocos path in the batch manifest.

- [x] **Step 5: Present the exact three-page board to the user**

Report `READY FOR USER VISUAL REVIEW`, show the 3-up board and individual 390×844 pages, identify any P2 observations, and request one explicit Batch 1 visual approval. Do not start Batch 2, Cocos or WeChat work from this result.

## Plan self-review

- Spec coverage: Tasks 1–5 cover approval synchronization, the bounded formal-AI exception, root preservation, two new pages, independent UI/meteor boundaries, SHOW_ALL exports, provenance, similarity, package preflight, hashes and user Gate.
- Placeholder scan: no `TBD`, `TODO`, “implement later”, “similar to”, or unspecified error-handling step remains.
- Interface consistency: the frame IDs, asset IDs, dimensions, safe-border color, source property and review statuses are identical across all tasks.
- Permission check: the plan contains no Cocos, WeChat, Git or remote-write step.
