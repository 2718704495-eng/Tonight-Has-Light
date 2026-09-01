# Task 1 Brief — Freeze Approval And Create The R2 Storyboard Contract

## Ownership

You own only these new paths for this task:

- `design-board/story-gameplay-replan-v1-a-r2/README.md`
- `design-board/story-gameplay-replan-v1-a-r2/storyboard-project/bible/character_bible.md`
- `design-board/story-gameplay-replan-v1-a-r2/storyboard-project/bible/visual_style_bible.md`
- `design-board/story-gameplay-replan-v1-a-r2/storyboard-project/bible/continuity_rules.md`
- `design-board/story-gameplay-replan-v1-a-r2/storyboard-project/scenes/evening_session.yaml`
- `design-board/story-gameplay-replan-v1-a-r2/storyboard-project/shots/story_nodes.yaml`
- `design-board/story-gameplay-replan-v1-a-r2/storyboard-project/reviews/gate_b_checklist.md`
- `design-board/story-gameplay-replan-v1-a-r2/tests/storyboard-contract.test.mjs`
- `design-board/story-gameplay-replan-v1-a-r2/HASHES.sha256`

You may read the approved spec, approval record, R1 HTML and existing storyboard project as references. Do not modify any file outside the ownership list.

## Goal

Create a compact, testable R2 storyboard contract for the approved 16-state night. This task creates data and bibles only; it does not build the R2 browser UI or any formal art.

## Required Sources

- `docs/STORY-GAMEPLAY-REPLAN-V1-A-R1-APPROVAL.md`
- `docs/superpowers/specs/2026-09-01-story-gameplay-replan-v1-a-design.md`
- `.superpowers/brainstorm/51330-1788246254/content/complete-evening-slice-v1.html`
- `design-board/outdoor-picturebook-branch-v1/storyboard-project/`

## Exact Contract

`evening_session.yaml` must contain exactly these 16 canonical IDs in order:

1. `ROOT_STILL`
2. `WIND_AWAKENS`
3. `LOOK_UP`
4. `EYES_ADJUST`
5. `STAR_OCCLUDED`
6. `FOLLOW_CLOUD`
7. `STAR_RETURNS`
8. `WIDE_SKY`
9. `METEOR_EVENT`
10. `AFTER_METEOR`
11. `DOOR_MATCH_CUT`
12. `ARRIVAL_H1`
13. `KITCHEN_CALL`
14. `COOK_AND_SERVE`
15. `TABLE_RITUAL`
16. `LEAVE_THE_LIGHT`

`story_nodes.yaml` must give each state:

- `id`
- `illustration_id`
- `narrative.kicker`
- `narrative.title`
- `narrative.body`
- `interaction.primary`
- `interaction.tap_equivalent`
- `immediate_response`
- `persistent_consequences` (non-empty)
- `safe_resume`
- `required_formal_overlays`

Legal route requirements:

- Root can enter wind, look-up or direct home.
- Wind returns to Root while preserving `windToken`.
- Stargaze follows `LOOK_UP → EYES_ADJUST → STAR_OCCLUDED → FOLLOW_CLOUD → STAR_RETURNS → WIDE_SKY → METEOR_EVENT → AFTER_METEOR`.
- `AFTER_METEOR` can return to Root without replaying the meteor or enter home through `DOOR_MATCH_CUT`.
- Direct home also uses `DOOR_MATCH_CUT → ARRIVAL_H1`.
- Home follows `ARRIVAL_H1 → KITCHEN_CALL → COOK_AND_SERVE → TABLE_RITUAL → LEAVE_THE_LIGHT`.
- `LEAVE_THE_LIGHT` can stay, end, or return to Root without clearing the current night state.

## Bibles

- Character bible: anonymous adult back/controlled three-quarter view and ordinary domestic cat; preserve approved anatomy, relationship, clothing, scale and no named identity.
- Visual style bible: B night-comic; deep indigo/warm ochre; dry-brush ink; restrained halftone; one natural Milky Way; outdoor cool/quiet, indoor bright/warm/no black corners.
- Continuity rules: preserve main star identity, wind direction, cat settling, coat position, kitchen geography, meal/cup states, meteor origin and porch-light result.
- Do not embed or generate new images.

## Test-First Requirement

Create `tests/storyboard-contract.test.mjs` before creating the YAML/bible implementation. Run it and preserve the expected RED output in the report. The test must initially fail because the contract files/states do not exist, not because of a syntax typo.

The final test must verify:

- exactly 16 unique state IDs in required order;
- `EYES_ADJUST` and `KITCHEN_CALL` exist independently;
- every node has all required fields;
- every node has at least one persistent consequence;
- every non-zero-operation node has a tap equivalent;
- legal stargaze and direct-home routes reach `LEAVE_THE_LIGHT`;
- prohibited phone-progress terms do not appear in narrative (`页码`, `进度`, `任务`, `成功`, `奖励`, `连续`, `倒计时`, `完成率`);
- bibles contain the locked character, visual and continuity invariants.

Use only Node built-ins; do not add dependencies.

## Freeze

After all tests pass, create `HASHES.sha256` for every file in this R2 package except `HASHES.sha256` itself. Keep entries relative to the package root and sorted.

## Hard Boundaries

- The approved R1 HTML must remain byte-identical at SHA-256 `760a0cba95d715c97cc3814b58be7206bf89727bb221036fec7e39f0fe554836`.
- No page/progress/task/reward language in phone narrative.
- No Cocos, build, WeChat, Git or remote write.
- Do not create the R2 browser UI in this task.
- You are not alone in the workspace. Do not revert, overwrite or reformat other contributors' work; adapt only within your owned new directory.
