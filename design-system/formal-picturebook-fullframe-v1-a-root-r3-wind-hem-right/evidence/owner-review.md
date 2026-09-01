# Root R3 Direction-only Edit — Owner Review

> Date: 2026-08-30  
> Candidate: `formal-picturebook-root-wind-hem-v1-a-r3`  
> Master SHA-256: `54e86c34bb4234e0a0ffa58993a8e1d2e722691cf59f1ec225fa480536a83a51`

Status: `FAIL / BLOCKED BEFORE USER VISUAL APPROVAL`

| Requirement | Result | Evidence |
|---|---|---|
| Remove the dominant screen-left flap | FAIL | In the 390 comparison and enlarged crop, the hem still projects left from the adult's lower back. |
| Redraw one broad calm screen-right trail | FAIL | No distinct rightward lifted arc is present between the adult and cat. |
| Direction readable at 195×422 | FAIL | The thumbnail shows a mostly settled hem; it does not read as left→right wind without explanation. |
| Preserve “wind lifts the hem” | FAIL | The edit weakens the approved signature gesture instead of reversing it. |
| Preserve R2 outside the edit ROI | FAIL | The adult/cat/house and sky details are visibly re-rendered; upper-sky diagnostic pixels also changed outside the authorized ROI. |
| Keep weighted seated body and ordinary cat | PASS in isolation | Both remain recognizable and seated, but this does not close the direction or drift failures. |
| Keep one galaxy, one house, one warm door and exactly two flowers | PASS in isolation | Counts and broad hierarchy remain, but individual pixels and placements drift. |
| No text/UI/meteor/extra effect | PASS | The output remains a clean plate. |

## Diagnostic note

`r2-r3-drift-metrics.json` reports mean absolute channel delta `5.2302/255` and `24.9168%` of upper-sky pixels with at least one channel delta ≥8. These figures were not predeclared as acceptance thresholds; they only corroborate that the operation was not confined to the garment area. The visual direction decision is based on the actual 390, 195 and crop evidence.

## Decision

The approved one-edit attempt is exhausted. Freeze this package as failed evidence, keep R2 unchanged, and return to the project owner/user for a new production-method decision. Do not silently run another generation.

