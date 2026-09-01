# Root R4 Manual Hem Repaint — Owner Review

> Date: 2026-08-30  
> Candidate: `formal-picturebook-root-wind-hem-v1-a-r4-manual-local-repaint`

Status: `LOCAL CANDIDATE / AWAITING USER VISUAL APPROVAL`

| Requirement | Result | Evidence |
|---|---|---|
| Use R2 as the only image source | PASS | `candidate-manifest.json` points to the frozen R2 master. |
| Do not regenerate the whole image | PASS | R4 is produced by `scripts/build-root-r4.mjs` using a hand-authored SVG patch over R2. |
| Keep edits local to the hem area | PASS | `evidence/pixel-diff-report.json` reports `outside_declared_roi_changed_pixels: 0`. |
| Change the wind cue away from the dominant screen-left flap | CANDIDATE | The old left flap is visually reduced and the screen-right hem curve is added. Final style approval is reserved for the user. |
| Preserve adult, cat, sky, galaxy, house, door, flowers and framing | PASS by pixel boundary | All pixels outside the declared ROI are byte-identical to R2. |
| No Cocos, WeChat, release or Git | PASS | Manifest permissions are all `false`; no build or upload command was run. |

## Visual Note

This R4 candidate intentionally avoids ImageGen and whole-frame editing. The repair is conservative: the left flap is pressed into the grass shadow, while a smaller rightward hem curve is painted near the seated waist. The result should be judged by the user on the `390x844` and `195x422` exports before any runtime work.
