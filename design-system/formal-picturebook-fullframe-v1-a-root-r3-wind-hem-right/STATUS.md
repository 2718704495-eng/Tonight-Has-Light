# Root R3 Wind Hem Right — Status

> Date: 2026-08-30  
> Candidate: `formal-picturebook-root-wind-hem-v1-a-r3`

Status: `BLOCKED / SINGLE EDIT FAILED / NOT USER APPROVED / NOT IN BUILD`

Primary 390×844 export SHA-256: `c4df25fa1291e63044176690ceef6d88afc5a188bb1a89d80c95d4d51f137096`

## Blocking findings

- `P0`: the generative edit changed visible content outside the authorized hem-adjacent edit area, so it is not a direction-only revision of frozen R2.
- `P1`: the most visible garment hem still extends toward screen-left instead of lifting and trailing toward screen-right.
- `P1`: at `195×422`, the intended rightward hem gesture is absent; the image no longer reliably communicates “wind lifts the hem.”

## Stop-line result

- Exactly one R3 direction edit was executed.
- No second attempt was generated.
- The file is retained only as failed process evidence and must not be offered as a visual PASS, used as a formal root asset, or passed to runtime work.

## Independent review

- A clean visual-only reviewer independently returned `BLOCKED / P1`: the hem remains a stiff screen-left extension and the frame contains non-target drift.
- The reviewer explicitly confirmed zero filesystem writes.
- Two earlier write-contaminated review attempts are excluded from the evidence chain and documented under `reviews/INVALID-WRITE-CONTAMINATED-REVIEW.md`.
