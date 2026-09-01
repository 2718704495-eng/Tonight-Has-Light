# Owner Review

> Date: 2026-08-30  
> Candidate: `formal-picturebook-root-wind-hem-v1-a-r4-manual`

Status: `ROOT_PAGE_GATE_B_PASS / USER VISUAL APPROVED`

| Requirement | Result | Evidence |
|---|---|---|
| Frozen R2 is the only image source | PASS | Input SHA-256 `38e030cb…72a068`; no third-party pixels. |
| No whole-frame generation | PASS | `imagegen_used=false`; only local masks, same-image texture reuse, transform and SVG contour accents. |
| Changes stay inside the approved ROI | PASS | `outside_roi_changed_pixels=0`; changed bbox `x=60..361, y=1343..1397`. |
| Cat, sky, house/door and flowers remain frozen | PASS | Every declared guard reports `changed_pixels=0`. |
| Rightward hem is visually approved | PASS | 390 export shows the knit corner extending from the right waist; the user approved this exact 390/195 file set after review. |
| Seated weight and non-hem story remain unchanged | PASS | Upper body, pose, cat, galaxy, house, door and flowers are untouched outside the narrow ROI. |
| Runtime boundary | PASS | No Cocos, build, WeChat, upload, review submission, release or Git action was performed. |

## Decision

The exact 390 export, 195 export and local R2/R4 crop were shown to the user. On 2026-08-30 the user replied `批准 ROOT-WIND-HEM-V1-A-R4：根页视觉通过`, so the root-page visual is now `PASS` for this same file/hash. Runtime handoff remains unauthorized, and the complete picture-book Gate B remains blocked on the other formal pages.
