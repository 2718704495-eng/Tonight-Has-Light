# Task 1 report — Freeze Approval And Create The R2 Storyboard Contract

Status: `PASS` for the Task 1 contract scope; the wider Gate B visible-proof decision remains `BLOCKED` pending the separate R2 UI evidence task.

## TDD evidence

### RED

Command:

```sh
node --test design-board/story-gameplay-replan-v1-a-r2/tests/storyboard-contract.test.mjs
```

Output: 4 tests failed with `ENOENT` for the not-yet-created R2 `evening_session.yaml`, `story_nodes.yaml`, and three bible files. The test itself loaded successfully; failures were solely due to missing contract implementation files.

### GREEN

Command:

```sh
node --test design-board/story-gameplay-replan-v1-a-r2/tests/storyboard-contract.test.mjs
```

Output: `tests 4`, `pass 4`, `fail 0`.

The green test proves canonical 16-ID ordering and uniqueness, independent `EYES_ADJUST` / `KITCHEN_CALL`, complete node fields and retained outcomes, tap equivalents, legal stargaze/direct-home completion routes, prohibited narrative vocabulary absence, and locked bible invariants.

## Files changed

- `design-board/story-gameplay-replan-v1-a-r2/README.md`
- `design-board/story-gameplay-replan-v1-a-r2/storyboard-project/bible/character_bible.md`
- `design-board/story-gameplay-replan-v1-a-r2/storyboard-project/bible/visual_style_bible.md`
- `design-board/story-gameplay-replan-v1-a-r2/storyboard-project/bible/continuity_rules.md`
- `design-board/story-gameplay-replan-v1-a-r2/storyboard-project/scenes/evening_session.yaml`
- `design-board/story-gameplay-replan-v1-a-r2/storyboard-project/shots/story_nodes.yaml`
- `design-board/story-gameplay-replan-v1-a-r2/storyboard-project/reviews/gate_b_checklist.md`
- `design-board/story-gameplay-replan-v1-a-r2/tests/storyboard-contract.test.mjs`
- `design-board/story-gameplay-replan-v1-a-r2/HASHES.sha256`

## Self-review

- Contract contains precisely the approved 16 IDs in order and no browser UI, images, Cocos, builds, WeChat, Git, or remote operation.
- Direct-home and post-meteor routes both pass through `DOOR_MATCH_CUT`; wind and final return preserve their specified state.
- Narrative copy contains none of the prohibited phone-progress terms.
- The approved R1 HTML was read-only checked and remains byte-identical: `760a0cba95d715c97cc3814b58be7206bf89727bb221036fec7e39f0fe554836`.

## Concerns

- The YAML files use JSON-compatible YAML to keep validation dependency-free with Node built-ins. Consumers requiring indentation-only YAML must parse JSON-compatible YAML, which standard YAML parsers support.
- This is a contract and test package, not visual acceptance evidence; do not mark the project-wide Gate B as passed from this task.

## Final hash checks

Command:

```sh
(cd design-board/story-gameplay-replan-v1-a-r2 && shasum -a 256 -c HASHES.sha256)
```

Actual result: all 8 package entries report `OK`.

## Review fix round 1/5 — meteor observation vantage

### RED

Command:

```sh
node --test design-board/story-gameplay-replan-v1-a-r2/tests/storyboard-contract.test.mjs
```

Output: 4 passed, 1 failed. The focused `distinguishes the direct-home meteor observation vantage from the one physical event` assertion failed because `LEAVE_THE_LIGHT` did not yet identify `meteorOrigin=window` as observation vantage.

### GREEN

Command:

```sh
node --test design-board/story-gameplay-replan-v1-a-r2/tests/storyboard-contract.test.mjs
(cd design-board/story-gameplay-replan-v1-a-r2 && shasum -a 256 -c HASHES.sha256)
```

Output: `tests 5`, `pass 5`, `fail 0`; all 8 hash entries report `OK`.

Changed contract files and final hashes:

- `storyboard-project/bible/continuity_rules.md` — `228e7cb74afe6e972d3e97da466a13b3025b4d5ebace6c6752931f06b6d7e839`
- `storyboard-project/shots/story_nodes.yaml` — `45259db92407a8a88d4563feb5a8bfe5de43490b4636be7f94ef6cbf40b294c9`
- `tests/storyboard-contract.test.mjs` — `48d926ed014e36d167256e9e3fc4bfbc509b555cca7cff427b0cd96c42660cfb`

The contract now explicitly distinguishes `meteorOrigin` as observation vantage (`outside` or `window`) from the one physical meteor: it originates outdoor upper-right, occurs once, never replays, and appears in direct-home sessions only as a weak window trace.

## Review fix round 2/5 — route-safe meteor preservation

### RED

Command:

```sh
node --test design-board/story-gameplay-replan-v1-a-r2/tests/storyboard-contract.test.mjs
```

Output: 4 passed, 1 failed. The new route-focused assertion found `DOOR_MATCH_CUT` only recorded `indoors=true`, so it did not encode the required conditional vantage mutation or preservation.

### GREEN

Command:

```sh
node --test design-board/story-gameplay-replan-v1-a-r2/tests/storyboard-contract.test.mjs
(cd design-board/story-gameplay-replan-v1-a-r2 && shasum -a 256 -c HASHES.sha256)
```

Output: `tests 5`, `pass 5`, `fail 0`; all 8 hash entries report `OK`.

Changed contract files and final hashes:

- `storyboard-project/shots/story_nodes.yaml` — `cb5274ce58a32d8c5e5d79e8e8ea0b39e58210f7f875bf3262730ad5aa5b1ae8`
- `tests/storyboard-contract.test.mjs` — `1a8510e8cf0e95b7ce08847b5a880b9d257c70104e99b4f2a88d6caa08ca63ff`

`DOOR_MATCH_CUT` now sets `meteorOrigin=window` only for `none` and explicitly preserves `outside`; `LEAVE_THE_LIGHT` has a structured unconditional preserve entry only. The physical meteor constraint remains unchanged: one outdoor upper-right event, no replay, with a direct-home weak window trace.
