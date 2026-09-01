# Task 1 report — B0 isolated production container

## Result

`STRUCTURE VALID / GATE B VISUAL BLOCKED`

- H1–H4: `BLOCKED / NO ART`
- H5: `REFERENCE HASH PASS`
- Gate B visual status: `BLOCKED / NO VISUAL REVIEW OR USER APPROVAL`

The validator recomputes the live written-spec hash, approval-record hash, execution-plan hash, all five H5 export hashes/dimensions, the manifest/provenance identity and artifact records, and both permission sets. It does not consume a self-reported `PASS` value.

## TDD evidence

### RED

Command:

```sh
node --test design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/tests/production-contract.test.mjs
```

Exit code: `1`

Expected failure: `ERR_MODULE_NOT_FOUND` for `scripts/production-contract.mjs`, before that production module existed.

### GREEN

Command:

```sh
node --test design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/tests/production-contract.test.mjs
```

Exit code: `0` (`1` passing production-contract test).

Final commands:

```sh
shasum -a 256 -c HASHES.sha256
node --test tests/*.test.mjs
node scripts/validate-package.mjs --stage structure
```

Run from `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/`; exit code: `0`.

- `HASHES.sha256`: every listed package file reported `OK`.
- Tests: `2` passed, `0` failed.
- Structure result: H1–H4 `BLOCKED / NO ART`; H5 `REFERENCE HASH PASS`; no Gate B visual pass was claimed.

## Independent-review remediation

### RED

Command:

```sh
node --test design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/tests/*.test.mjs
```

Exit code: `1`.

Expected failure: `production-contract.mjs` did not export `REVIEW_EXPORT_OPTIONS`; this proved the new SHOW_ALL/contain, asset/raw identity, Sharp-loader, metadata, and drift assertions were not already satisfied.

### GREEN

Commands:

```sh
node --test design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/tests/*.test.mjs
node design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/validate-package.mjs --stage structure
```

Exit code: `0`.

- Tests: `6` passed, `0` failed.
- Review exports are `contain`; only non-exact aspect ratios receive the approved `#06265F` letterbox background.
- `assetId` is derived from the locked page map; supplied mismatches, wrong candidate versions/raw names, and `cocos-project` paths are rejected.
- Sharp resolves in this environment through the homedir-derived Codex bundled-runtime fallback after standard resolution and optional `CODEX_SHARP_PATH`.
- Page validation now checks recursive B0 no-art state, manifest/provenance drift, and master/export PNG/8-bit/sRGB/dimension/recorded-alpha metadata.
- H4 has an executable B0-blocked composition test.

`HASHES.sha256` must be verified from the package root, not the repository root, because every entry is deliberately package-relative:

```sh
cd design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a
shasum -a 256 -c HASHES.sha256
```

## Files written

- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/README.md`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/STATUS.md`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/ritual-manifest.json`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/provenance.json`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/HASHES.sha256`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/references/approved-h5.json`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/production-contract.mjs`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/package-utils.mjs`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/sharp-loader.mjs`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/export-page.mjs`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/validate-page.mjs`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/validate-package.mjs`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/compose-h4-states.mjs`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/build-review-boards.mjs`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/write-hashes.mjs`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/tests/production-contract.test.mjs`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/tests/h4-state-contract.test.mjs`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/ui/home-meal-ui-contract.json`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_001/source/raw/.keep`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_001/source/masters/.keep`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_001/exports/.keep`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_002/source/raw/.keep`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_002/source/masters/.keep`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_002/exports/.keep`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_003/source/raw/.keep`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_003/source/masters/.keep`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_003/exports/.keep`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_004/source/raw/.keep`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_004/source/masters/.keep`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_004/source/response-layers/.keep`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_004/exports/states/.keep`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/ui/source/.keep`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/ui/evidence/.keep`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/evidence/.keep`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/reviews/.keep`
- `.superpowers/sdd/2026-08-30-home-meal-ritual-gate-b/task-1-report.md`

## Limits and stop points

- The original task brief transcribed the current spec SHA incorrectly. The task owner resolved this by using the actual disk SHA-256 `606a48ff905fe49e0114e1f80c0d05f519f26c7cc70aadee3441585822064ed1`, which is independently recomputed by the validator.
- Standard Node module resolution does not find `sharp`; the validated loader now tries standard resolution, optional `CODEX_SHARP_PATH`, then the homedir-derived Codex bundled runtime. It does not hard-code a user home or edit package configuration.
- H4 test behavior, UI copy/hotspots, H4 response composition, art generation, visual review boards, and every later Gate B batch remain owned by their later plan tasks.

`NO H1 ART / NO COCOS / NO BUILD / NO WECHAT / NO GIT`
