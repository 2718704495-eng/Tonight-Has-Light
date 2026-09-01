# STORY-GAMEPLAY-REPLAN-V1-A-R1 Gate B Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the approved “文字入画与完整夜晚结构” into a complete 16-state visible proof and three separately reviewable formal motion-asset probes, without touching Cocos or any WeChat build.

**Architecture:** Preserve the approved R1 browser file byte-for-byte as approval evidence. Build a new R2 design proof in a versioned directory, driven by a small story-node data contract instead of editing the frozen R1. Formal art work reuses approved clean plates as immutable backgrounds; every new dynamic item is an independent, editable true-alpha asset. Each asset group stops at one probe until owner review, independent read-only review, and user approval all refer to the same hash.

**Tech Stack:** HTML/CSS/JavaScript for disposable design proof; Markdown/YAML for storyboard contracts; SVG and manually painted RGBA PNG sequences for editable overlays; Node/Sharp for alpha, dimension, diff, ROI, and manifest validation; browser automation only for visual/effect evidence.

**Spec:** `docs/superpowers/specs/2026-09-01-story-gameplay-replan-v1-a-design.md`

## Global Constraints

- Approved R1 browser evidence remains immutable: `.superpowers/brainstorm/51330-1788246254/content/complete-evening-slice-v1.html`, SHA-256 `760a0cba95d715c97cc3814b58be7206bf89727bb221036fec7e39f0fe554836`.
- Approved input spec hash is `bfad2cd85fe908c466a459946d9d8ff28b5329d336ce9faeabf07e4ee18da394`; later status-only edits must be recorded separately.
- The 16-state contract is authoritative. R1’s 14 merged nodes are approved as a composition proof, not evidence that `EYES_ADJUST` and `KITCHEN_CALL` are already visible.
- No page count, progress, task, success, reward, streak, timer, completion rate, or “next level” language may appear inside the phone UI.
- Approved Root R4, Stargaze F1–F5, Home H1–H5, H4 state assets and their pixels are immutable inputs. A new result frame or overlay may not silently repaint them.
- New Chinese, UI, meteor, character response, cloud, reflection, steam and interaction assets stay separate and editable. The AI-assisted full-frame exception does not extend to character singletons, Chinese, UI, meteor or critical interaction layers.
- Any formal transparent layer must report `RGBA`, `hasAlpha=true`, and Alpha `0` outside the declared ROI. A checkerboard painted into RGB, color-key extraction, flattened full-screen layer, empty layer, or background ghost is a hard fail.
- The approved visual style remains B night-comic: deep indigo and warm ochre, dry-brush ink, restrained halftone, adult back view, ordinary house cat, one natural Milky Way, stable warm home.
- This plan authorizes local planning and evidence production only. It does not authorize Cocos changes, Cocos/WeChat builds, WeChat preview/upload, experience settings, review submission, public release, Git commit/push, or other remote writes.
- Do not add Git commit steps. The workspace is not currently a Git repository and the user has not authorized Git operations; freeze work with SHA-256 manifests instead.

---

## Task 1: Freeze Approval And Create The R2 Storyboard Contract

**Files:**
- Verify: `docs/STORY-GAMEPLAY-REPLAN-V1-A-R1-APPROVAL.md`
- Create: `design-board/story-gameplay-replan-v1-a-r2/README.md`
- Create: `design-board/story-gameplay-replan-v1-a-r2/storyboard-project/bible/character_bible.md`
- Create: `design-board/story-gameplay-replan-v1-a-r2/storyboard-project/bible/visual_style_bible.md`
- Create: `design-board/story-gameplay-replan-v1-a-r2/storyboard-project/bible/continuity_rules.md`
- Create: `design-board/story-gameplay-replan-v1-a-r2/storyboard-project/scenes/evening_session.yaml`
- Create: `design-board/story-gameplay-replan-v1-a-r2/storyboard-project/shots/story_nodes.yaml`
- Create: `design-board/story-gameplay-replan-v1-a-r2/storyboard-project/reviews/gate_b_checklist.md`

**Interfaces:**
- `evening_session.yaml` contains the 16 canonical state IDs and legal transitions.
- `story_nodes.yaml` stores `illustration_id`, narrative copy, interaction, immediate response, persistent consequence, safe-resume flag, and required formal overlays for each state.
- Character and visual bibles reference approved files and hashes; they do not embed new generated character art.

- [ ] Verify the approved R1 browser and input-spec hashes with `shasum -a 256`.
- [ ] Write a failing schema check that reports any missing state from the fixed 16-state ID list.
- [ ] Create the compact bibles and YAML files, including the exact two currently missing visible states: `EYES_ADJUST` and `KITCHEN_CALL`.
- [ ] Add a check that every choice modifies at least one later visible state and every main action has a touch alternative.
- [ ] Run the schema check and freeze the storyboard package with `HASHES.sha256`.
- [ ] Stop if any new character identity, room layout, color hierarchy, visual style, or branch meaning appears without a separate user decision.

## Task 2: Build A Complete 16-State R2 Browser Proof

**Files:**
- Create: `design-board/story-gameplay-replan-v1-a-r2/index.html`
- Create: `design-board/story-gameplay-replan-v1-a-r2/story-data.js`
- Create: `design-board/story-gameplay-replan-v1-a-r2/tests/story-contract.test.mjs`
- Create: `design-board/story-gameplay-replan-v1-a-r2/evidence/`
- Do not modify: `.superpowers/brainstorm/51330-1788246254/content/complete-evening-slice-v1.html`

**Interfaces:**
- `story-data.js` exports exactly 16 story nodes and a local-only `EveningSessionState` compatible with the approved spec.
- The phone view renders illustration, local prototype effect, narrative, and contextual actions from the same node definition.
- The right reviewer panel may show diagnostics; the phone view may not show progress or page count.

- [ ] Write tests first for exactly 16 unique IDs, legal exits, direct-home completion, stargaze completion, no three consecutive page-only clicks, and no prohibited progress language.
- [ ] Copy only the approved composition logic into the new versioned R2 directory; do not mutate the R1 approval artifact.
- [ ] Add `EYES_ADJUST`: reuse the approved F2 `390×844` file with SHA-256 `98e267506a5485a93fdefa9759611c0ac4de2120edd5dc61d253a9ff59deee52`; use a hold gesture with a light-tap equivalent, with no F2 pixel edits.
- [ ] Use this `EYES_ADJUST` copy: kicker `今夜 · 银河深处`, title `眼睛慢慢看清了`, body `起初只有一片深蓝。再停一会儿，银河里的暗裂才慢慢分开。`
- [ ] Add `KITCHEN_CALL`: remain on approved H2 after the coat is hung; tap a `≥44×44px` kitchen warm zone, show a static steam/warm response within 100ms, persist `kitchenEntered=true`, then transition to H3 after 450–700ms.
- [ ] Use this `KITCHEN_CALL` copy: kicker `回家 · 屋里`, title `厨房那边，轻轻响了一声`, body `外衣放下以后，才听见锅里还留着一点热气。`
- [ ] Preserve direct-home meteor payoff at the H5 window and all prior wind/coat/table/light consequences.
- [ ] Verify sound-off, reduce-motion, 120% large text, 360×800, 390×844, 430×932 and 430×844 pressure states.
- [ ] Capture one complete stargaze route and one direct-home route with input logs and console error count.
- [ ] Freeze the R2 proof with a manifest and request user approval of the same file/hash before using it as a formal timing reference.

## Task 3: Establish The High-Risk True-Alpha Probe

**Files:**
- Create: `design-system/story-gameplay-replan-v1-a-motion-assets/probes/cat-settled-edge/manual-source/`
- Create: `design-system/story-gameplay-replan-v1-a-motion-assets/probes/cat-settled-edge/exports/390x844/scene_02_f5_cat_settled_edge_probe.png`
- Create: `design-system/story-gameplay-replan-v1-a-motion-assets/probes/cat-settled-edge/evidence/alpha-metrics.json`
- Create: `design-system/story-gameplay-replan-v1-a-motion-assets/scripts/validate-alpha-probe.mjs`
- Create: `design-system/story-gameplay-replan-v1-a-motion-assets/HASHES.sha256`

**Interfaces:**
- Probe is a manually redrawn cat replacement/nearby grass repair patch for approved F5, not an AI-generated cat singleton and not an automatic extraction from the approved full frame. Source reference: `design-system/formal-picturebook-fullframe-v1-a-batch1/source/masters/scene_02_stargaze_shot_005-master-2x.png`.
- Declared ROI, source method, manual edit history and reference-frame hash are recorded in provenance.

- [ ] Write the validator before drawing. It must fail RGB, opaque full-frame RGBA, non-zero alpha outside ROI, painted checkerboards, empty alpha, and unexpected dimensions.
- [ ] Manually draw one small cat-settled replacement patch on a transparent canvas, using approved F5 only as a visual reference. At 390 width, the cat may move 6–10px toward the adult while keeping pelvis and paws grounded; the adult, grass ridge and house may not change.
- [ ] Validate `RGBA`, `hasAlpha=true`, non-target Alpha `0`, non-empty ROI, and no rectangular footprint.
- [ ] Composite the probe over `#06265F`, pure white, magenta, a magnified checkerboard and approved F5; export 100% and 25% evidence. Keep at least 4px transparent bleed and record the transparent-RGB strategy so texture filtering cannot create a black halo.
- [ ] Owner and independent read-only reviewers must both report `P0=0 / P1=0` and no visible dark halo or background ghost.
- [ ] Show this exact file/hash to the user. Do not draw the remaining dynamic assets if the probe fails or remains unapproved.

## Task 4: Produce The Cloud, Main-Star And Cat-Settling Probe Group

**Files:**
- Create: `design-system/story-gameplay-replan-v1-a-motion-assets/groups/sky-cloud-cat/`
- Reference only: approved Stargaze F2 R1, F3 R2 and F4 R1 clean plates.

**Interfaces:**
- Outputs: one reversible F2 adaptation mask and dim entry state, one soft cloud-edge overlay sequence, one static reduced-motion cloud result, 8–10 separately timed main-star brightness entries, and one user-approved cat-settled result layer.
- The Milky Way remains fixed; the player accompanies the cloud rather than clearing or defeating it.

- [ ] Write timing and visual-diff assertions before producing frames: no Milky Way transform, no more than three stars beginning a brightness change in any 100ms window, and no cloud movement in reduced motion.
- [ ] Derive F2’s dim entry state and low-frequency adaptation mask without moving, adding or deleting any star; the terminal state must be the approved F2 pixels. The change should read as eyes adapting, not a reward flash or full-screen spotlight.
- [ ] Produce the minimum frames needed to prove cloud occlusion and reopening without particles, star map cues, or a second Milky Way.
- [ ] Add the cat-settled result only after Task 3’s exact alpha probe is approved.
- [ ] Provide tap equivalents for hold/follow gestures and preserve `mainStarKnown`, `followedCloud`, and `catSettled` states.
- [ ] Export default, silent and reduced-motion samples plus first/middle/last stills.
- [ ] Stop for user approval of the exact group manifest before extending the sequence.

## Task 5: Produce The Hand-Drawn Meteor And Environmental Reflection Probe Group

**Files:**
- Create: `design-system/story-gameplay-replan-v1-a-motion-assets/groups/meteor-reflection/`
- Reference only: approved Stargaze F5 and Home H5 clean plates.

**Interfaces:**
- Outputs: 8–10 manually drawn transparent meteor frames, four restrained cold-reflection frames for shoulder/cat/grass, one window-reflection result for direct-home route, and opacity-only reduced-motion equivalent.
- Meteor, UI and Chinese are independent; F5/H5 background pixels remain unchanged.

- [ ] Write alpha, frame-count, duration and background-byte-identity checks before drawing.
- [ ] Draw one meteor with changing hand-drawn contour and fading particulate edge; prohibit a programmatic straight line, laser beam, loop, shower or baked background.
- [ ] Add four-frame cold reflection that reaches shoulder line, cat ear and grass ridge without changing character anatomy.
- [ ] Ensure the same event appears once outside or once at the H5 window according to `meteorOrigin`, never twice.
- [ ] Provide a static streak `≤180ms` fade for reduced motion and a sound-off readable path.
- [ ] Capture the exact full-background finale, route-dependent result and 25% thumbnail; stop for user approval.

## Task 6: Produce The Warm-Home Life-State Probe Group

**Files:**
- Create: `design-system/story-gameplay-replan-v1-a-motion-assets/groups/warm-home-life/`
- Reference only: approved Home H1–H5 and H4 `none/ate/sipped/both` states.

**Interfaces:**
- Outputs: one new `KITCHEN_CALL` full-frame candidate, its independent steam response, kettle-lid micro sequence, serve transition, table-state callback and H5 persistent traces.
- Indoor lighting is stable and bright from the first frame; effects may not darken corners or replay a black-room light-up reveal.

- [ ] Write state-combination tests for coat, wind token, kitchen entered, meal served, first table action, ate/sipped and light choice.
- [ ] Produce only one initial `KITCHEN_CALL` full-frame candidate under the already approved `ai-assisted-formal-fullframe` exception, with at most one separately authorized targeted correction: the hung coat remains visible, the adult turns toward the connected kitchen, light steam appears at the kitchen threshold, and the ordinary cat stays away from the heat source. Chinese, steam, warm-zone feedback and all interaction layers remain manual and separate.
- [ ] Export an H2 → `KITCHEN_CALL` → H3 continuity board at 390×844 and 195×422. At least 4/5 unprompted viewers must retell “挂衣→注意厨房→开始做饭”, and no more than one may read it as a task door, fire, or reward entrance.
- [ ] Produce a restrained kitchen steam response and three-frame lid movement; cat stays away from the heat source.
- [ ] Reuse approved H4 composites byte-identically and layer only separately approved state feedback.
- [ ] Return to approved H5 with visible coat/table/cat/window/light consequences; do not end immediately after eating.
- [ ] For reduced motion, replace steam/movement with static before/after states and `≤180ms` fades.
- [ ] Capture normal, silent, reduced-motion and 120% warm-paper evidence; stop for user approval.

## Task 7: Run Gate B Story And Accessibility Acceptance

**Files:**
- Create: `docs/STORY-GAMEPLAY-REPLAN-V1-A-R1-GATE-B-REVIEW.md`
- Create: `design-board/story-gameplay-replan-v1-a-r2/evidence/story-test-results.csv`
- Create: `design-board/story-gameplay-replan-v1-a-r2/evidence/responsive-index.md`

**Interfaces:**
- Produces one binary Gate B conclusion tied to exact R2 and asset-manifest hashes.

- [ ] Run five unprompted target-user tests with the phone view only. At least 4/5 must retell the cloud/star/meteor/home/meal/light arc, identify one cat or room change, and point to a consequence of their own choice.
- [ ] Verify that no majority describes the experience as “just clicking through pictures”.
- [ ] Verify text placement, 120% large text, 44×44 targets, 8px separation, silent equivalence and reduced-motion equivalence at all four required viewports.
- [ ] Verify outdoor stays cool/quiet and indoor stays bright/warm with no black corners.
- [ ] Run all storyboard, story-contract, alpha, manifest and docs checks; record exact commands and outputs.
- [ ] Freeze final evidence and request one user decision for Gate B. Missing evidence is `BLOCKED`, not `PASS`.

## Task 8: Write The Cocos Production Plan Only After Gate B Passes

**Files:**
- Create only after Gate B PASS: `docs/superpowers/plans/2026-09-xx-story-gameplay-replan-v1-a-cocos.md`

- [ ] Confirm exact user-approved R2 and formal asset manifests.
- [ ] Plan persistent Scene/Prefab/Sprite/Atlas state implementation; do not extend `TonightHasLightV0View` or patch the 0.4.8 build.
- [ ] Map all 16 states, safe-resume nodes, audio unlock, reduce motion, large text and branch consequences into runtime consumers and tests.
- [ ] Keep build, WeChat upload, experience setting, review and release as separate permissions.

## Gate B Exit Condition

Gate B passes only when the complete 16-state R2 proof, all three formal asset probe groups, true-alpha evidence, five-person story test, responsive states, silent path, reduced-motion path, owner review, independent read-only review and user approval all bind the same frozen hashes. Until then: `FORMAL NEW ASSETS BLOCKED / NO COCOS / NO BUILD / NO WECHAT / NO GIT`.
