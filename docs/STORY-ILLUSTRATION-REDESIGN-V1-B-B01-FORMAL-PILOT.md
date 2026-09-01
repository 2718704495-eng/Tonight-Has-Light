# STORY-ILLUSTRATION-B-FORMAL-R2-PROOF

> Date: 2026-08-28
> Owner: main controller
> Status: `FAIL / REVIEW-BLOCKED / STOPPED AFTER R2.1 / NO COCOS / NO BUILD / NO UPLOAD`

## Purpose

Create one production-grade outdoor illustration sample for B01 `坐稳` before extending B02 and B03.

The approved B direction is strong, but the first formal SVG attempts failed because they looked like flat constructed vector art instead of a living night comic. This pilot changes the production method, not the approved style: one small formal sample must prove the art quality, editable layering, source tracking, and mobile readability before any Cocos integration.

## Approved Input

- Style direction: `STORY-ILLUSTRATION-REDESIGN-V1-B / 无字夜漫画·同一阵风`
- Keyframe approval: `STORY-ILLUSTRATION-REDESIGN-V1-B-KF-R1`
- B01 reference image: `design-board/story-illustration-redesign-v1-b/exploration/b01-settle-reference-r1.png`
- B01 reference SHA-256: `fdac7f8edf8a22954a93a3f756ab2c1699c1afe04462bf2fa3ed679ae2794d0c`

The reference image is only a visual target for composition, light, color, and mood. It must not be copied directly into the production package.

## Pilot Scope

Only B01 is in scope.

B01 must show the quiet opening: a normal adult and an ordinary house cat sit on the left side of a wind-touched grass slope, looking at one natural deep-blue sky. A small house sits in the right middle distance with one stable warm door. The scene has exactly two weakly glowing flowers. There is no text, no task prompt, no reward language, no dialogue, no countdown, and no automatic room entry.

## Locked Visual Rules

- Format: `390x844` logical mother frame, with checked exports for `360x800`, `430x932`, `430x844-pressure`, and `195x422` thumbnail.
- Palette: deep indigo limited color, using the established family around `#06182F`, `#173B57`, `#4E7380`, `#91A5AA`, and `#D3A05B`.
- Medium: mature wordless night comic, dry-brush ink lines, broad value masses, restrained halftone, visible paper grain.
- Sky: one faint broken Milky Way only, with loose edges and natural dark gaps. No constellation lines, route nodes, grids, aurora, second galaxy, bright ribbons, or uniform star snow.
- Characters: same adult on the left, same ordinary house cat on the right, both back or three-quarter back, both looking at the same sky. The adult must read as adult from silhouette and posture; the cat must read as a normal seated cat, not a mascot.
- House: right middle distance; warm door is visible and clickable in later runtime, but visually stable and not the first command-like focus.
- Flowers: exactly two, close to the characters, weaker than the door and not placed as path markers.
- Wind: B01 is the resting frame. It may imply wind through grass lean and clothing/hair readiness, but must not look like the active gust frame B02.

## Production Method Change

Do not repeat the failed geometry-only, five-flat-color SVG route. The R2 proof may use a hybrid editable SVG method: hand-authored anatomy and composition paths plus deterministic vector dry-brush, halftone, star, grass, and paper-grain marks. The method is acceptable only if the visible result clears the same anatomy and mature-comic quality bar as a layered painted source.

The pilot must keep an editable production structure: separated sky, Milky Way, main stars, mountains, house, door light, far grass, adult body, adult hair, adult clothing edge, cat body, cat ears, cat tail, near grass, two flowers, foreground grass strokes, paper grain, and optional masks. A flat PNG export is acceptable only as a derivative of that layered source.

AI-generated references may be used for exploration only. The final pilot must record which elements were redrawn, which were discarded, and why it is not a direct generated-image copy.

## Minimum Evidence

The B01 pilot is not reviewable without all of these:

- Editable layered source or source package.
- `390x844` full export.
- `195x422` thumbnail export.
- `360x800`, `430x932`, and `430x844-pressure` exports with safe-area overlay.
- Layer list with render order and intended future runtime role.
- Asset provenance draft with source, author, generator record if any, human redraw notes, and SHA-256.
- Side-by-side board comparing approved B01 reference and formal B01 pilot.
- A one-page visual self-check with Yes/No for the locked rules above.

## Binary Pass Line

`PASS` requires all of the following:

- At 195x422 thumbnail size, the first read is still sky, seated adult, ordinary cat, house, and grass slope.
- At 390x844, the artwork reads closer to the approved B reference than to the failed SVG drafts.
- Adult anatomy is coherent: head, neck, shoulders, back, seated pelvis, legs, sleeves, and hand placement connect naturally.
- Cat anatomy is coherent: head, ears, neck, chest, back, haunch, paws, and tail root connect naturally.
- Dry-brush/halftone/paper texture is shared across characters, grass, house, mountains, and sky.
- The Milky Way is soft, broken, and natural, not a geometric strip or route map.
- No rectangular halo, sticker edge, black box, or transparent-alpha fringe appears around the characters or grass.
- The house door and flowers remain warm but do not overpower the sky.
- The image keeps the approved emotional temperature: cool, quiet, comfortable, and not busy.

If any item fails, the pilot is `FAIL` and must be revised before B02/B03 production.

## Severity Stop Lines

P0:
- Directly using generated reference pixels as final production art.
- Changing the approved B visual language, character identity, cat type, house position, flower count, galaxy count, or no-task contract.
- Sending the pilot to Cocos, WeChat, review, or release before visible approval.

P1:
- Anatomy, silhouette, grass direction, Milky Way shape, or paper texture reads wrong at normal phone size.
- A safe-area export crops characters, flowers, door, or the main sky composition.
- The door looks like a task button or the flowers look like collectibles.
- Alpha edges produce visible dark seams or rectangular halos.

P2:
- Local palette drift that does not change the approved mood.
- Minor grain density, stroke spacing, or crop-margin issues that are obvious to fix and do not affect story or readability.

## Next Handoff

The code-authored SVG pilot and its one directed R2.1 correction did not clear the visual pass line, so this method is stopped and must not extend to B02/B03. The next formal-art handoff must use a painting/illustration workflow capable of natural adult and cat anatomy, loose dry-brush masses, and a broad broken Milky Way. Cocos remains blocked unless the user separately authorizes a narrowly scoped temporary prototype-asset exception.
