# STARGAZE-FORMAL-BATCH-V1-A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `tonight-design-gate`, `storyboard-skill`, `frontend-design` and `imagegen`. Work serially; one page is reviewed and user-approved before the next page begins. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce and freeze formal full-frame stargazing pages F1–F4 that lead into the already approved F5 without visual or story drift.

**Architecture:** Each page is one independent `780×1688` lossless full-frame master with deterministic `390×844`, `195×422`, `360×800`, `430×932` and `430×844-pressure` exports. Root R4 and formal F5 are read-only continuity anchors. Chinese, hotspots, final choices and meteor remain separate editable UI/FX contracts.

**Tech Stack:** Markdown/YAML contracts, built-in `image_gen`, Node.js ESM, Sharp, PNG, SHA-256.

**Spec:** `docs/STARGAZE-FORMAL-BATCH-V1-A-APPROVAL.md`

## Global Constraints

- Current work is F1 only; F2–F4 stay blocked until the previous exact page is user-approved.
- Use `ai-assisted-formal-fullframe` only for the clean plate exception already granted by `FORMAL-PICTUREBOOK-FULLFRAME-V1-A`.
- Root R4 master SHA-256 remains `41599f03a0a7a71acd953b46066c3205b4da1522d0a06bd86b73186afedccdc8`.
- Formal F5 390×844 SHA-256 remains `ad3a13c6a4d915f178d03d444874776e2df042f328f998de81a2bfbf0d774d8d`.
- F1 uses about `85%` sky and remains visually distinct from both the closer root page and the farther resolving F5.
- No text, pseudo-text, UI, logo, watermark, page number, hotspot marker, meteor, moon, aurora, second galaxy, constellation line, task cue or existing-IP feature.
- One initial generation and at most one targeted repair per page.
- No Cocos files, builds, WeChat operations, Git operations or remote writes.

---

### Task 1: Freeze approval and page identities

**Files:**
- Create: `docs/STARGAZE-F5-FORMAL-V1-A-APPROVAL.md`
- Create: `docs/STARGAZE-FORMAL-BATCH-V1-A-APPROVAL.md`
- Modify: `docs/PROJECT-MEMORY.md`
- Modify: `.agents/skills/tonight-design-gate/references/current-contract.md`
- Modify: `design-board/outdoor-picturebook-branch-v1/storyboard-project/scenes/scene_02_stargaze.yaml`
- Modify: `design-board/outdoor-picturebook-branch-v1/storyboard-project/shots/scene_02_stargaze_shots.yaml`

**Interfaces:**
- Consumes: the exact user approval phrase and approved F5 hashes.
- Produces: one unambiguous `F1 PILOT AUTHORIZED / F2-F4 SERIAL BLOCKED` contract.

- [ ] Record F5 exact-file approval and the batch scope.
- [ ] Replace the stale “only F5 authorized” production boundary.
- [ ] Verify documentation contains no runtime or remote authorization.

### Task 2: Write and review the F1 production prompt

**Files:**
- Create: `design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_001/prompt.md`
- Create: `design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_001/reviews/PROMPT-SAFETY.md`

**Interfaces:**
- Consumes: root R4, formal F5, character bible, visual bible and F1 shot contract.
- Produces: one self-contained built-in ImageGen prompt with explicit reference roles and negative constraints.

- [ ] State that root R4 is the identity/location reference and F5 is the sky-geography/material reference; neither is an edit target.
- [ ] Encode F1’s camera and scale so it is a bridge, not an F5 duplicate.
- [ ] Record prompt safety: no living artist, IP, brand, real-person likeness, unsafe content or personal data.

### Task 3: Generate and normalize F1

**Files:**
- Create: `design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_001/source/raw/scene_02_stargaze_shot_001-imagegen-r1.png`
- Create: `design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_001/source/masters/scene_02_stargaze_shot_001-master-2x.png`
- Create: `design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_001/exports/195x422/scene_02_stargaze_shot_001.png`
- Create: `design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_001/exports/360x800/scene_02_stargaze_shot_001.png`
- Create: `design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_001/exports/390x844/scene_02_stargaze_shot_001.png`
- Create: `design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_001/exports/430x844-pressure/scene_02_stargaze_shot_001.png`
- Create: `design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_001/exports/430x932/scene_02_stargaze_shot_001.png`
- Create: `design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_001/export-metadata.json`

**Interfaces:**
- Consumes: the reviewed prompt and two read-only reference images.
- Produces: one F1 candidate and five deterministic review exports.

- [ ] Generate exactly one initial candidate using built-in `image_gen`.
- [ ] Copy the selected output into the isolated project package without overwriting historical assets.
- [ ] Normalize to `780×1688`, export the five review sizes with `#06265F` SHOW_ALL borders, and record hashes.
- [ ] If and only if a P0/P1 remains, use one targeted repair; a second failure stops the batch.

### Task 4: Owner and independent Gate B review

**Files:**
- Create: `design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/reviews/ROOT-OWNER-VISUAL-REVIEW.md`
- Create: `design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/reviews/INDEPENDENT-VISUAL-REVIEW.md`
- Create: `design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_001/candidate-manifest.json`
- Create: `design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/HASHES.sha256`
- Modify: `assets/asset-register.csv`
- Modify: `docs/ASSET-PROVENANCE.md`

**Interfaces:**
- Consumes: the exact candidate, 390/195 exports and root/F5 comparison board.
- Produces: `READY FOR USER VISUAL REVIEW` or a stopped `FAIL/BLOCKED` candidate.

- [ ] Check hierarchy, adult/cat anatomy, left-right order, house/door/flower stability, one Milky Way and no forbidden content.
- [ ] Check F1 is recognizably between root and F5 rather than a duplicate of either.
- [ ] Run an independent zero-write visual review after owner review.
- [ ] Freeze every file hash and present the exact 390×844 file to the user.

### Task 5: Stop for same-file user approval

F1 cannot be marked `PASS` and F2 cannot start until the user approves the exact displayed F1 file and SHA-256. No later task may infer that approval from mechanical checks or from this plan.

## Plan self-review

- Spec coverage: F1 prompt, generation, deterministic exports, continuity, safety, provenance, independent review and same-file approval are all mapped.
- Placeholder scan: no `TBD`, `TODO`, unspecified handler or generic “test later” step remains.
- Permission check: no Cocos, build, WeChat, Git or remote-write action appears.
