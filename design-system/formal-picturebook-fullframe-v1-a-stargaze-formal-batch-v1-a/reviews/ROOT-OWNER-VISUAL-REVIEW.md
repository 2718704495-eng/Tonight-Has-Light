# Root owner visual review / F1 R1

> Date: 2026-08-31  
> Candidate: `stargaze-formal-batch-v1-a-f1-r1`  
> Decision: `PASS FOR INDEPENDENT REVIEW / P0=0 / P1=0 / P2=0 / NOT IN BUILD`

## Evidence reviewed

- Exact `390×844` export SHA-256 `6b2450a1993742545b83958d4f17913fda63a512071f42fa0a148feb4856c26e`.
- Exact `195×422` export SHA-256 `ad9c89d2880853281aec6e8cde97b071f3d508a485960dadf6d6a8e20c9367c8`.
- Root→F1→F5 comparison boards at 390 and 195 widths.
- 360×800, 430×932 and 430×844-pressure SHOW_ALL exports.
- `evidence/root-mechanical-validation.json`: all artifact/reference hashes, PNG dimensions, sRGB/8-bit metadata and exposed `#06265F` safe-border checks pass.
- Production prompt SHA-256 `cde397574e7b7ffdb0dcb2ff8e158585b27cc74039a56aa1fa614c84798a4ee8`.

## Visual findings

| Contract | Result |
|---|---|
| Sky is the first read | `PASS` — deep-blue negative space and the single broken Milky Way dominate at both sizes. |
| Root→F1→F5 progression | `PASS` — F1 raises the gaze and reduces ground relative to Root R4 while keeping the pair more present and grounded than F5. |
| Adult/cat continuity | `PASS` — adult remains anonymous, weighted and clearly adult; ordinary cat remains immediately right with natural seated anatomy and one full tail. |
| Location continuity | `PASS` — hills, right-side house, stable door and exactly two weak flowers retain the screen axis. |
| One natural Milky Way | `PASS` — no aurora, second band, constellation line, moon or meteor. |
| Clean-plate boundary | `PASS` — no text, pseudo-text, UI, logo, watermark, page number, hotspot or reward/task cue. |
| Ink and edge quality | `PASS` — dry-brush and halftone remain coherent; no rectangular seam, sticker edge or heavy black halo around the pair. |
| Multi-size review | `PASS` — key figures, house, two flowers and Milky Way remain visible; pressure mode uses the approved navy safe border. |

## Side-window determination

The house has one very dim side-window point in addition to the door. This is not a defect: the approved Root R4 and formal F5 both retain a subordinate house window, while the style contract says the door is the only **obvious** warm source, not the only warm pixel. In F1 the door is clearly stronger; neither window nor house competes with the sky. No repair is warranted, so the single targeted-repair allowance remains unused.

## Audit boundary

The earlier `reviews/owner-review-f1-r1.md` was written by the same task that generated the candidate despite a read-only assignment; it is invalid as owner or independent evidence. This root review does not mark F1 user-approved and does not authorize F2, Cocos, build, WeChat, Git or remote writes.
