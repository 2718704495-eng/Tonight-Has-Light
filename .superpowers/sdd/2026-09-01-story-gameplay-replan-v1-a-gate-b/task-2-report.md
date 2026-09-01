# Task 2 report — Complete 16-state R2 browser proof

Status: `ALIGNED` for the R2 disposable browser proof. It supplies browser-visible evidence only; project-wide Gate B remains `BLOCKED` for formal new assets and this work does not authorize Cocos, builds, WeChat, Git, or remote state.

## TDD evidence

### RED — required implementation absent

```sh
node --test design-board/story-gameplay-replan-v1-a-r2/tests/story-visible-proof.test.mjs
```

Output: `tests 5`, `pass 1`, `fail 4`. The four expected failures were `ERR_MODULE_NOT_FOUND` for missing `story-data.js` and `ENOENT` for missing `index.html`; the immutable R1 hash check passed. The test file was created before either implementation file.

### GREEN — initial complete proof

```sh
node --test design-board/story-gameplay-replan-v1-a-r2/tests/*.test.mjs
```

Output at the initial candidate: `tests 11`, `pass 11`, `fail 0`. This included the original five Task 1 contract tests and six R2 proof tests.

### Regression RED/GREEN — F2 action stacking

Browser smoke inspection reproducibly found that post-reveal F2 rendered `轻轻碰一下` and `继续看云` in the same bottom-right position. A narrow test requiring the light-tap prompt to be conditional on `!eyesAdjusted` failed (`pass 5`, `fail 1`). The implementation then made that prompt conditional; the full command above returned all 11 passing. Browser recheck reported `revealedButtons: 1`, `promptButtons: 0`.

### Regression RED/GREEN — Root/H5 variant URL

The local server log exposed a deterministic Root 404: the shared variant constructor received a base path already ending in `/exports`, producing `/exports/exports/...`. Exact Root and H5 path assertions failed (`pass 5`, `fail 1`). Removing that duplicate Root suffix produced `tests 11`, `pass 11`, `fail 0`; a direct-home browser route then loaded the exact Root and H5 approved URLs with an empty console error/warning list.

### Independent review FAIL and repair RED/GREEN

The first independent review correctly rejected the initial 11/11 result. It found that the browser page still used a second ad-hoc state object: the outdoor meteor never set `outside`, could replay after `再坐一会儿`, `windToken` / `followedCloud` were not written, H5 did not expose retained consequences or real exits, F2's hold listener sat on a `pointer-events:none` container, gestures leaked across states, and the tests relied too heavily on source strings.

A new focused suite first returned `tests 10`, `pass 6`, `fail 4`. The four expected failures covered the missing shared-state imports/usage, pointer-enabled F2 child zone, single Root invitation timer and setting/H5 controls, and executable route/consequence behavior. The repair then:

- moved all state transitions used by the page into the shared `createStoryState` / `advanceStoryState` reducer;
- made `buildEndingConsequences` an executable retained-result model used by H5 and the tests;
- added route guards for a single outdoor meteor plus distinct `outside` / `window` evidence;
- made Root invitations idempotent, F2 listeners disposable, and gesture/reset state deterministic;
- added progressive H5 choice → feedback → end/return controls.

Final focused and contract result after this first repair: `tests 15`, `pass 15`, `fail 0`.

### Independent review round 2 and final checkpoint repair

The second independent review found four remaining Important gaps despite the 15 passing tests: the replay guard skipped a legal meteor edge; finale timing and tap equivalence did not match the approved contract; H5 omitted cat/coat/meal consequences; and internal state labels leaked through phone alt text.

Focused RED tests were added first and failed in exactly those four areas. The final repair introduced explicit immutable meteor timing, a legal suppressed-presentation intermediate for replays, a full-screen tap equivalent, eight retained H5 markers, human scene alt text and text-node copy construction. Browser smoke then exposed an initialization resize race; a focused RED assertion was added before the render guard.

Final checkpoint result: `tests 17`, `pass 17`, `fail 0`.

## Browser smoke evidence

Local server: `python3 -m http.server 4173` from the project root.

The earlier repair pass loaded Root with one copy of each invitation even after setting re-renders; followed the sky route to distinct F2; verified the 72%-height pointer-enabled blank-space zone, exact copy and one continuation action after reveal; then verified one physical meteor, a second-pass no-replay guard, door match cut, independent H2 `KITCHEN_CALL`, immediate visible steam, H3 after 560ms, retained H5 evidence, progressive ending controls, and the direct-home `window` route.

After the second repair, a fresh browser pass rechecked Root, distinct F2, the complete sky route, first-meteor presentation and the `AFTER_METEOR` state without the initialization race. The user requested a Git handoff before the two full final routes and settings variants were repeated, so those remaining checks are explicitly pending and R2 stays `READY FOR FINAL HUMAN REVIEW`. Full notes: `design-board/story-gameplay-replan-v1-a-r2/evidence/README.md`.

## Files changed

- `design-board/story-gameplay-replan-v1-a-r2/index.html`
- `design-board/story-gameplay-replan-v1-a-r2/story-data.js`
- `design-board/story-gameplay-replan-v1-a-r2/tests/story-visible-proof.test.mjs`
- `design-board/story-gameplay-replan-v1-a-r2/evidence/README.md`
- `design-board/story-gameplay-replan-v1-a-r2/HASHES.sha256`
- `.superpowers/sdd/2026-09-01-story-gameplay-replan-v1-a-gate-b/task-2-report.md`

## Hash and syntax verification

```sh
node --check design-board/story-gameplay-replan-v1-a-r2/story-data.js
(cd design-board/story-gameplay-replan-v1-a-r2 && shasum -a 256 -c HASHES.sha256)
shasum -a 256 .superpowers/brainstorm/51330-1788246254/content/complete-evening-slice-v1.html
```

Final checkpoint verification result: 17 tests passed with 0 failures; the package manifest is regenerated after every owned-file update; `story-data.js` syntax check passed. The R1 result remains exactly `760a0cba95d715c97cc3814b58be7206bf89727bb221036fec7e39f0fe554836`; R1 was only read, never modified. The Task 1 contract files keep their existing hashes in the final R2 list.

## Self-review

- `story-data.js` fetches and validates the two Task 1 JSON-compatible YAML files; it retains only canonical identifiers, asset variants, viewport choice, and the two R2-specific copy overrides rather than duplicating 16 narrative records.
- All 16 canonical IDs are reachable as stable states or deterministic named transitions. `EYES_ADJUST` and `KITCHEN_CALL` are independent phone states.
- F2 uses its exact approved project-root path and recorded 390×844 identity. No `/files/` URL appears.
- Direct-home assigns the meteor observation vantage `window`; the post-meteor route retains `outside`, and a second sky pass preserves the legal `METEOR_EVENT` edge while suppressing a second physical meteor. The full debug snapshot includes all required retained fields and deterministic reset clears transient timers and gestures.
- H5 renders the current wind, meteor, cat, coat, meal, table, water and light consequences; its choice is visibly acknowledged before end/return controls appear.
- The phone never shows a page, node, or completion counter. New visual effects are labelled `prototype-only` only in reviewer/evidence material, never within story artwork.

## Concerns

- This is a browser proof, not a formal-art approval or runtime implementation. Its CSS veil, steam and meteor remain temporary and must not be promoted.
- The Node-only suite checks the data boundary and static browser contract; the local browser smoke pass supplements it with interactive visibility evidence. It is still not a phone or WeChat test.
