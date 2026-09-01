# OUTDOOR-ILLUSTRATION-WIND-V1-A-R2 disposable handoff

Status: `PASS_MECHANICAL_HANDOFF_ONLY / LOCAL PROTOTYPE CONSUMER ALLOWED / HUMAN VISUAL QA PENDING`

Asset boundary: `prototype-only/disposable/not-for-review/not-for-release`

This directory mechanically converts the user-approved R2 exploration contact
sheet into a local Cocos/Web handoff. It does not promote the generated
exploration art to production art.

## Source identity

- Source: `design-board/outdoor-illustration-wind-v1/exploration/five-wind-pages-storyboard-r2-stronger.png`
- Required SHA-256: `a787d06f170cef4ac675e7a14287b4f8c4cfaef5414248091bfe481abdb1b811`
- Required dimensions: `1774x887`
- Approved direction: `OUTDOOR-ILLUSTRATION-WIND-V1-A-R2 / 大轮廓五幅风页`

## Mechanical method

1. Detect the five divider-free panel spans around source columns
   `356 / 709 / 1061 / 1413`.
2. Take one centred `349x756` crop from each span (`y=65..820`) and resize it
   with LANCZOS to the logical `390x844` canvas.
3. Keep the F0 crop as the only opaque stable scene.
4. Apply the five immutable masks in `approved-masks/`. They were frozen from
   the coherent R2 visual candidate that the user approved. All five use one
   continuous lower-scene region; F3/F4 additionally expose the approved hair,
   clothing-edge, ear and full-tail silhouettes.
5. Keep the full upper sky, galaxy, cottage core and door pixels on the single
   stable F0 base. The adult and cat keep the same seated composition and visual
   identity; exact character pixel identity is deliberately not claimed because
   the approved wind pages change their outer silhouettes.

The earlier narrow per-object polygon experiment produced visible rectangular
dark patches and is explicitly superseded. It must not be rebuilt or cited.

The method is intentionally mechanical. No image generation, repainting,
content-aware fill, object invention or style change is performed here.

## Runtime files

The runtime directory is
`cocos-project/assets/resources/outdoor-illustration-wind-r2/`:

- `stable-scene-390x844.png`: one opaque F0 base.
- `lower-f0-390x844.png` .. `lower-f4-390x844.png`: five full-canvas RGBA
  overlays with the same pivot; the coherent lower mask is shared by F0–F2 and
  expanded only for the approved F3/F4 outer silhouettes.
- `asset-manifest.json`: source, crop, anchor, blend, order and transition
  contract.
- `asset-boundary.json`: explicit release guard.

Suggested order is stable base, then exactly one of F0..F4. A local disposable
consumer may preload all five states and use two resident Sprite nodes for the
approved `140ms smoothstep` crossfade. Reduced motion must stay on F0.

## Rebuild and validate

Use the bundled workspace Python (Pillow is required):

```sh
/Users/wxl/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 \
  prototype/outdoor-illustration-wind-v1-a-r2-handoff/generate_assets.py
/Users/wxl/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 \
  prototype/outdoor-illustration-wind-v1-a-r2-handoff/validate_assets.py
```

The validator checks source and immutable-mask identities, output size/mode,
state alpha, separator columns, exact upper/cottage/door ROIs, key-state
differences at full and quarter scale, manifest hashes and the asset boundary.
`HASHES.sha256` covers both handoff and runtime files except itself.

## Stop line

- Mechanical PASS is not phone-scale human visual PASS.
- These PNGs must be rejected by any review/release build.
- Formal production art still requires editable, traceable original redraws.
- This handoff permits only the approved disposable local Cocos/Web candidate
  and evidence. It authorizes no WeChat preview/upload, experience version,
  review submission, release, Git commit or push.
