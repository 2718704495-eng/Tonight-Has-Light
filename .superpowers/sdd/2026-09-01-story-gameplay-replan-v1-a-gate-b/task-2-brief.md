# Task 2 Brief — Build The Complete 16-State R2 Browser Proof

## Ownership

You own only these paths in this task:

- `design-board/story-gameplay-replan-v1-a-r2/index.html`
- `design-board/story-gameplay-replan-v1-a-r2/story-data.js`
- `design-board/story-gameplay-replan-v1-a-r2/tests/story-visible-proof.test.mjs`
- `design-board/story-gameplay-replan-v1-a-r2/evidence/README.md`
- `design-board/story-gameplay-replan-v1-a-r2/HASHES.sha256`
- `.superpowers/sdd/2026-09-01-story-gameplay-replan-v1-a-gate-b/task-2-report.md`

You may read the frozen R1 browser proof and Task 1 contract package. Do not modify Task 1 YAML/bibles/tests, the approved R1, docs, Cocos, builds, or other files.

## Context

The user approved `STORY-GAMEPLAY-REPLAN-V1-A-R1：文字入画与完整夜晚结构`. R1 is visually approved as a composition direction but shows 14 merged nodes. This task creates a separate disposable R2 browser proof with all 16 states visible, especially F2 `EYES_ADJUST` and independent `KITCHEN_CALL`. It is not formal art and not runtime code.

Required references:

- Approved R1: `.superpowers/brainstorm/51330-1788246254/content/complete-evening-slice-v1.html`, immutable SHA-256 `760a0cba95d715c97cc3814b58be7206bf89727bb221036fec7e39f0fe554836`.
- R2 contract: `design-board/story-gameplay-replan-v1-a-r2/storyboard-project/scenes/evening_session.yaml` and `storyboard-project/shots/story_nodes.yaml`.
- R2 contract manifest SHA-256: `36ad74c9e8bf3ba5378f3746fe84213a0fa08992494b8bae88eddcf283a6cdcc` at Task 1 completion.
- Design spec: `docs/superpowers/specs/2026-09-01-story-gameplay-replan-v1-a-design.md`.

## Architecture

- `story-data.js` is an ES module. It must load the two Task 1 JSON-compatible YAML files, validate exactly 16 nodes against the canonical state IDs, and return the story contract. Avoid copying the 16 narrative records into JavaScript.
- `story-data.js` also owns immutable approved asset-path variants and a pure viewport-selection helper.
- `index.html` imports `story-data.js` with `<script type="module">`, renders the phone experience from the contract, and may keep a right-side reviewer panel. The phone itself must never show node number, page count, progress or completion rate.
- Reuse the approved R1 visual layout and composition logic as implementation reference only. Do not edit R1. New R2 CSS/Canvas effects remain visibly labelled `prototype-only` in the reviewer panel/evidence, never inside the story artwork.
- Expose `window.__storyR2Debug` with a read-only snapshot function, canonical route/action log, settings toggles, and deterministic `reset()`/`goTo(stateId)` hooks for browser QA. These hooks must not appear as phone UI.

## Approved Asset Paths

Use project-root URLs beginning with `/design-system/` so the proof works under `python3 -m http.server` from the project root. Do not use `/files/`.

- Root R4 base: `/design-system/formal-picturebook-fullframe-v1-a-root-r4-manual-hem/exports/{size}/root_night_slope_v2-wind-hem-r4-manual.png`
- Stargaze F1–F4 base: `/design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_00N/exports/{size}/scene_02_stargaze_shot_00N.png`
- Stargaze F5 base: `/design-system/formal-picturebook-fullframe-v1-a-batch1/exports/{size}/scene_02_stargaze_shot_005.png`
- Home H1–H4 base: `/design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_00N/exports/{size}/scene_01_home_shot_00N.png`
- Home H5 base: `/design-system/formal-picturebook-fullframe-v1-a-home-f5-wide-room-v1-a-r1/exports/{size}/scene_01_home_shot_005.png`
- H4 approved 390 composites/layers: `/design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_004/exports/states/`.
- Temporary audio only: `/.superpowers/brainstorm/51330-1788246254/content/night-breeze.ogg`, `night-room.ogg`, `kettle-test.mp3`.

Supported `{size}` values: `360x800`, `390x844`, `430x932`, `430x844-pressure`. `selectViewportVariant(width,height)` must choose the exact one for those four pairs and default to `390x844` for the desktop review phone.

## Required 16-State Experience

All 16 IDs must be observable either as their own stable phone state or as a named deterministic transition state. The phone top line stays `今夜有灯`; it never displays `01/16`, a page number or progress.

1. `ROOT_STILL`: approved Root R4, three quiet invitations after a short pause; zero operation can stay forever.
2. `WIND_AWAKENS`: slow slide across grass; two taps are equivalent; retains `windToken` and returns to Root.
3. `LOOK_UP`: approved F1, cat attention and sky invitation.
4. `EYES_ADJUST`: approved F2 exact asset. Initial independent navy veil lowers local contrast; hold 720ms or one light tap reveals the approved F2. Set `mainStarKnown=true` and `eyesAdjusted=true`, then offer continuation to F3. Copy must be:
   - kicker `今夜 · 银河深处`
   - title `眼睛慢慢看清了`
   - body `起初只有一片深蓝。再停一会儿，银河里的暗裂才慢慢分开。`
   - reduced motion: no transform; veil result changes with `≤180ms` opacity only.
5. `STAR_OCCLUDED`: approved F3, same star is covered; stable enough to observe.
6. `FOLLOW_CLOUD`: follow cloud by slow slide; two taps equivalent; the player accompanies rather than defeats the cloud.
7. `STAR_RETURNS`: approved F4; star returns and the cat settles closer in prototype response.
8. `WIDE_SKY`: approved F5 clean background remains fully present.
9. `METEOR_EVENT`: one prototype-only meteor over F5, never a blank background or loop. This is not formal meteor approval.
10. `AFTER_METEOR`: choices `回家` / `再坐一会儿`; do not replay meteor or clear state.
11. `DOOR_MATCH_CUT`: warm-door match cut, no black screen and no black-room light-up performance.
12. `ARRIVAL_H1`: approved H1 then H2 after coat drag; tapping the hook is equivalent; `coatHung=true`.
13. `KITCHEN_CALL`: after coat completion remain on approved H2. A `≥44×44px` kitchen warm-zone tap must give visible static steam/warm response synchronously in the same event callback (so first feedback is under 100ms), set `kitchenEntered=true`, and only then move to H3 after 560ms. Copy must be:
   - kicker `回家 · 屋里`
   - title `厨房那边，轻轻响了一声`
   - body `外衣放下以后，才听见锅里还留着一点热气。`
   - sound-off still uses steam/copy; reduced motion uses `≤180ms` opacity and no steam displacement/warm expansion.
14. `COOK_AND_SERVE`: H3 kettle hold or taps, then drag dish or tap equivalent; retain `kettleWarm` and `mealServed`.
15. `TABLE_RITUAL`: H4 eat/sip in either order; state changes are visible and retained.
16. `LEAVE_THE_LIGHT`: H5 shows retained coat/table/wind/meteor-vantage/light consequences; offer leave light, sit, end or return. Direct-home sets meteor observation vantage to `window`; outdoor route retains `outside`.

## Settings And State

State snapshot must include at least:

`nodeId`, `safeNodeId`, `audioUnlocked`, `sound`, `reducedMotion`, `largeText`, `windToken`, `mainStarKnown`, `eyesAdjusted`, `followedCloud`, `catSettled`, `meteorOrigin`, `coatHung`, `kitchenEntered`, `kettleWarm`, `mealServed`, `firstTableAction`, `ate`, `sipped`, `lightChoice`, `actionLog`.

- First touch unlocks audio; before touch both audio elements remain paused.
- Sound-off cannot block any action or consequence.
- 120% large text uses a real scale token, no `SHRINK`; indoor copy stays warm-paper style.
- Reduced motion must remove cloud/grass/meteor/steam displacement, camera push and warm expansion; only opacity/brightness/crossfade up to 180ms.
- Reset clears timers/listeners/transient FX and restores `ROOT_STILL` without reloading.

## Test-First Requirements

Create `tests/story-visible-proof.test.mjs` before `story-data.js` or `index.html`. Run it and record expected RED because implementation files are missing.

Final tests must use Node built-ins and verify at least:

- `story-data.js` loads the Task 1 contract rather than duplicating a 16-node narrative literal;
- exactly 16 canonical states and independent `EYES_ADJUST` / `KITCHEN_CALL`;
- exact F2 path/hash identity statement and no `/files/` URLs;
- exact two required copy blocks;
- 720ms F2 hold + tap equivalent; synchronous kitchen feedback and 560ms delayed H3 transition;
- route-safe meteor vantage and full-state snapshot fields;
- no phone page/progress counter or prohibited progress language;
- correct 4-viewport asset selection and `390x844` default;
- reduced-motion rules, 120% large text token, first-touch audio boundary and debug hooks;
- approved R1 SHA remains unchanged.

After GREEN, update `HASHES.sha256` to include every R2 package file except itself, sorted relative to package root. Preserve Task 1 hashes for unchanged files.

## Verification

- Focused: `node --test design-board/story-gameplay-replan-v1-a-r2/tests/*.test.mjs`
- Syntax: extract the module script if needed or use the static test to confirm balanced/importable JavaScript.
- Hashes: run `shasum -a 256 -c HASHES.sha256` from the R2 package root.
- R1 immutability: re-run `shasum -a 256` on the approved R1 HTML.

## Hard Boundaries

- No new images and no visual style changes.
- No formal asset promotion. All new CSS/SVG/Canvas/cloud/meteor/steam effects are `prototype-only`.
- Do not modify the approved R1 or any approved image.
- No Cocos, build, WeChat, Git, upload, review submission, release or remote write.
- You are not alone in the workspace. Do not revert or overwrite others; stay inside the ownership list.
