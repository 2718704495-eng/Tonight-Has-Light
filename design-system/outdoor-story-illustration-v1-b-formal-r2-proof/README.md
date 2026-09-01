# STORY-ILLUSTRATION-B-FORMAL-R2-PROOF

Status: `REVIEW-BLOCKED / VISUAL FAIL / STOPPED / NO COCOS / NO BUILD / NO UPLOAD`

This is the single-shot B01 `坐稳` proof for `STORY-ILLUSTRATION-B-FORMAL-R2-PROOF`. It tests a richer, original, editable SVG production method before B02/B03 are produced. The approved ImageGen keyframe is used only as a composition, light, palette, and mood reference. No reference bitmap, extracted texture, or traced contour is embedded in the formal source.

The main controller rejected the R2.1 render and stopped this production route. The package is retained as traceable failure evidence, not as a review candidate: the adult posture, ordinary-cat anatomy, Milky Way mass, and mature dry-brush comic quality remain below the approved B reference.

## Source and outputs

- Editable source: `source/b01-settle.svg` (`860×1864`, named render layers)
- Layer and runtime-role manifest: `source/manifest.json`
- Provenance: `source/provenance.json`
- Phone mother-frame export: `dist/390x844/b01-settle.png`
- Thumbnail export: `dist/195x422/b01-settle.png`
- Adaptation exports: `dist/360x800/`, `dist/430x932/`, `dist/430x844-pressure/`
- Safe-area review images: `evidence/safe-area/`
- Direction comparison board: `evidence/approved-vs-formal.png`
- Machine report: `evidence/validation-report.json`
- Visual failure report: `evidence/VISUAL-FAILURE.md`

## Reproduction

From this directory:

```bash
node scripts/export-assets.mjs
node tests/formal-pilot.test.mjs
node scripts/validate.mjs
node scripts/write-hashes.mjs
shasum -c HASHES.sha256
```

All exporters use a deterministic SVG source and Sharp with a fixed `contain` policy over `#06182F`. The wide `430×844-pressure` frame intentionally uses calm navy side fill rather than stretching or cropping the scene.

## Stop line

The proof failed visual review and is not approved art. It must not be copied into Cocos, WeChat, review, or release. B02/B03 must not use this drawing method or these visible character/galaxy solutions.
