# Owner visual review

Candidate: `formal-picturebook-home-f5-wide-room-v1-a-r1`  
Review state: `PASS FOR USER REVIEW WITH P2 NOTE / NOT USER APPROVED`

## Contract checks

- PASS — whole room reads before the pair: ceiling, connected walls, continuous floor, left storage/lamp zone, right storage/cloth zone, window, and threshold are visible.
- PASS — anonymous adult remains lower-left; ordinary domestic cat sits immediately to the adult's right on the same depth plane.
- PASS — low dinner table remains legible with rice, soup, one modest dish, dark kettle, and exactly two cups.
- PASS — stable broad amber light reaches the ceiling, both wall planes, floor, furniture, pair, and dinner; there is no black-room reveal and no unreadable black corner.
- PASS — rear-right cold night window remains secondary to the warm room.
- PASS — mature B night-comic language remains: deep indigo/ochre value separation, broken dry-brush line, restrained halftone, shared paper tooth.
- PASS — clean plate contains no text, pseudo-text, UI, logo, meteor, extra person, party, cake, gift, portrait, or relationship cue.
- PASS — 195×422 retains room/pair/table/window recognition.
- PASS — approved R4 root and Stargaze F5 files remain byte-identical to their frozen hashes.

## Normalization decision

The single generated raw contained an over-heavy dark entry threshold. The candidate uses deterministic crop `left=48, top=0, width=748, height=1618` before resizing to 780×1688. This leaves only a thin contextual entry edge and does not generate, repaint, inpaint, or borrow pixels.

## Severity

- P0: 0
- P1: 0
- P2: 1 — the ceiling and foreground floor are deliberately deeper ochre than the center wall. They remain materially readable; later compression or runtime grading must not darken them further.

The candidate is suitable to show the user, but it must remain `AWAITING USER VISUAL APPROVAL` until the user approves this exact 390×844 export hash `569a7b9b71d16d13ad311bdea9a29d6bc93a7dc68c99892faf8c416f38bc1c51`.
