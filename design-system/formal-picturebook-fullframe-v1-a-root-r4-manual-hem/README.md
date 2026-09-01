# ROOT-WIND-HEM-V1-A-R4 Manual Local Hem Edit

Status: `ROOT PAGE GATE B PASS / USER VISUAL APPROVED / NOT IN BUILD / NO COCOS / NO WECHAT / NO GIT`

This package contains the user-approved R4 root-page visual baseline. It starts from the frozen R2 master, removes only the dominant screen-left flap with a same-image grass clone, reuses the frozen R2 knit pixels through an editable mask and local transform, and adds two editable broken SVG contour accents. It does not use ImageGen or whole-frame regeneration.

## Current Candidate

- Master: `source/masters/root_night_slope_v2-wind-hem-r4-manual-master-2x.png`
- 390 export: `exports/390x844/root_night_slope_v2-wind-hem-r4-manual.png`
- 195 export: `exports/195x422/root_night_slope_v2-wind-hem-r4-manual.png`
- Right-hem transform contract: `source/manual-patch/right_hem_texture.json`
- Editable right-hem source mask: `source/manual-patch/right_hem_source_mask.svg`
- Generated transparent right-hem patch: `source/manual-patch/right_hem_texture_patch.png`
- Editable contour accents: `source/manual-patch/root_wind_hem_r4_patch.svg`
- Old-flap grass repair mask: `source/manual-patch/repair_clone_mask.svg`
- Pixel-diff metrics: `evidence/r4-diff-metrics.json`

## Frozen Boundary

- R2 source master SHA-256: `38e030cbec217c1349beba788e4a041631d295c52a2a0957dc4f9fa45c72a068`
- R4 master SHA-256: `41599f03a0a7a71acd953b46066c3205b4da1522d0a06bd86b73186afedccdc8`
- Approved ROI on the 780x1688 master: `x=50..377`, `y=1318..1429`
- Actual changed bbox: `x=60..361`, `y=1343..1397`
- Changed pixels outside ROI: `0`
- Sky, cat, house/door and both flower guards: `0` changed pixels

The user approved this exact master and `390x844` export with `批准 ROOT-WIND-HEM-V1-A-R4：根页视觉通过`. The pre-approval 29-file list is frozen in `approvals/HASHES.pre-user-visual-approval.sha256` with SHA-256 `888ee916f58c1f55a5986afa040be5564e38800dea023f02fb812962167b2c42`.

This closes the root-page static visual sub-Gate only. The complete picture-book Gate B remains blocked on the other formal pages, and no Cocos, build, WeChat, upload, review, release or Git permission is granted.

## Excluded History

`formal-picturebook-fullframe-v1-a-root-r4-manual-hem-right` is an earlier local SVG attempt and is not this candidate. R2 and R3 remain immutable historical evidence.
