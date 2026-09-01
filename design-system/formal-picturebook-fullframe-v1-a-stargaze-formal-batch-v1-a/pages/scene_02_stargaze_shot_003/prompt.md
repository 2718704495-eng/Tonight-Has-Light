# F3 `scene_02_stargaze_shot_003 / 薄云经过` production prompt

## Edit Target Role

- Edit target: the exact user-approved F2 master clean plate,
  `pages/scene_02_stargaze_shot_002/source/masters/scene_02_stargaze_shot_002-master-2x.png`.
- Use F2 as the locked sky-geography base: same camera, crop, single Milky Way
  arc, dust-dark rift contour, sparse main-star geography, deep-indigo negative
  space, dry-brush ink, restrained halftone, paper tooth, and tiny bottom-edge
  adult/cat slivers if present.
- Do not overwrite or alter any approved F2 file.

## Production Notes

- Use case: illustration-story / precise continuity edit
- Asset type: formal full-frame clean plate for a portrait interactive
  picture-book page
- Page: `scene_02_stargaze_shot_003 / 薄云经过`
- Candidate: `stargaze-formal-batch-v1-a-f3-r2`
- Output intent: one original `780×1688` portrait master, later
  deterministically exported to review sizes.
- F2 approval source: `docs/STARGAZE-F2-FORMAL-V1-A-R1-APPROVAL.md`
- Sequence role: F3 is the locked-camera anchor for future F4; F4 must reuse
  this exact crop, star position, dust-rift contour, and cloud identity after
  separate user approval.

## Initial Image Prompt

Use the provided F2 master image as the edit base for a new F3 full-frame clean
plate, portrait `780×1688`. Preserve the approved F2 composition almost
exactly: same upward locked sky-detail camera, same single broad faint broken
Milky Way entering from upper-left and drifting toward lower-right, same
dust-dark rift contours, same sparse 8-10 important star geography, same
deep-blue negative space, same restrained night-comic dry-brush ink, same
halftone and paper texture, and the same tiny bottom-edge slivers of the seated
adult and ordinary cat if present.

Change only one story element: add a single very thin, natural,
semi-transparent night cloud passing across the lower-middle observed main
star, the clear cool-white star near the lower middle just below the Milky
Way's darker rift. The cloud should veil that star gently without hiding the
whole sky. It should read as a real high cloud lit by faint starlight: soft
irregular edge, low contrast, blue-gray tone, dry-brush texture matching the
image, no glow, no magic, no smoke. The star should become slightly softened
and partially obscured, not erased and not flared.

Keep surrounding sparse stars, Milky Way grain, dark rift, and deep-indigo
breathing space readable. Do not brighten the sky, do not dim the entire frame,
do not add new star points, and do not move the Milky Way. The emotional beat
is a quiet natural absence.

Hard constraints: no Chinese text, pseudo-text, UI, logo, watermark, page
number, caption, hotspot marker, button, meteor, shooting star, comet, moon,
aurora, second galaxy, constellation lines, route/path nodes, cross-shaped
sparkles, bloom, neon, fantasy particles, magic ribbon, glowing river, reward
cue, task-map cue, brand cue, existing IP character, real-person likeness,
living-artist-style imitation, new character body, house, flower, or door.

## Repair Note

The first raw output used the initial prompt above, but the cloud risked
reading as a meteor/comet tail. One targeted repair was used; its exact prompt
is recorded in `prompt-repair-01.md`. The final candidate is R2, and both raw
outputs are preserved.

## Continuity Check Before Accepting

- F3 must look like the direct next page after the approved F2, not a new sky.
- The lower-middle observed main star is locally veiled by one thin natural
  cloud.
- The Milky Way arc, dust-dark rift, important-star geography, bottom-edge
  slivers, palette, ink, halftone, and paper tooth remain aligned with F2.
- The cloud is not a second Milky Way, smoke, aurora, meteor trail, ribbon, or
  magical effect.
- No text, UI, meteor, moon, extra galaxy, constellation, or new story object
  is baked into the clean plate.
- Do not overwrite either raw output.
