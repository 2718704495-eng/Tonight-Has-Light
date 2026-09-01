# root_night_slope_v1 master preflight

> Candidate: `formal-outdoor-art-pilot-v1-b-r1`  
> Frame: `root_night_slope_v1`  
> Date: 2026-08-29  
> Status: `MASTER_PREFLIGHT_PASS / TRUE_ALPHA_PROBE_FAIL / LAYERING_BLOCKED`

## Source identity

| Item | Path | Size | SHA-256 |
|---|---|---:|---|
| Raw ImageGen output | `source/raw/root_night_slope_v1-imagegen-r1.png` | 853x1844 | `97fcad9a1800204cf06aba5be23fbc6e8aad73e650cd81d2c3af14f7edcc95c7` |
| Normalized master | `source/root_night_slope_v1-master-2x.png` | 780x1688 | `5c84ce815ba011cd9be570889c768573e80c3d55d6b59fb2bd211301f86c74e3` |
| Phone preflight | `evidence/preflight/root_night_slope_v1-390x844.png` | 390x844 | `e5cc6cfe263bab1f7152ca50336ddbd452f0cfabe635e469c1e1ccf310d1094c` |
| Thumbnail preflight | `evidence/preflight/root_night_slope_v1-195x422.png` | 195x422 | `b4dfe6f466bc1912046be32901b682e188d876f2067f592b62b98bf595a4d1eb` |

## Owner visual gate

Result: `PASS_TO_LAYER_ATTEMPT`.

The raw ImageGen output is RGB. Normalization adds a fully opaque alpha channel so the frozen source conforms to the approved RGBA master contract. A raw-buffer comparison found `0` differing RGB bytes and a maximum RGB channel delta of `0`; this packaging correction makes no visible style change.

- The 390x844 frame reads as sky first, adult plus ordinary cat second, and small warm house/door third.
- The 195x422 thumbnail still preserves the same hierarchy and remains readable as a quiet stargazing scene.
- The image follows the approved B direction: deep indigo limited palette, dry-brush comic linework, restrained halftone, large calm value masses and no glossy 3D look.
- The sky contains exactly one broad, pale, broken Milky Way with dark interruptions and sparse star dust. No constellation lines, UI marks, meteor, moon, aurora or second galaxy are visible.
- The scene contains exactly two weakly glowing flowers near the pair. They do not read as collectibles or road markers.
- The adult sits naturally from the back, with relaxed weight. The cat is slightly large but still reads as an ordinary domestic cat, not a mascot or humanlike character.

## Risks held for the next gate

- The warm door is intentionally quiet. Later interactive hit zones and invitation text must keep it available without letting it become a task button.
- The cat should not be scaled up in follow-up frames; this frame is the upper acceptable bound.
- This preflight does not prove formal layered production. A flat master plus decorative layers is forbidden by the approved spec.
- The first transparent-layer probe failed: it returned RGB with a painted checkerboard and residual background ghosting, not a real alpha layer. The same method must not be used to mass-produce the remaining layers.

## Decision on the single targeted edit

Do not spend the single allowed targeted edit on R1 now. The visible image is strong enough, but the current transparent extraction method has already failed. The correct current result is `MASTER_PREFLIGHT_PASS / TRUE_ALPHA_PROBE_FAIL / LAYERING_BLOCKED`, not a cosmetic image edit and not a formal art pass.
