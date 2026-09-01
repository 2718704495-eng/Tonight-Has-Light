# Continuity Rules

## Global

- `FORMAL-PICTUREBOOK-FULLFRAME-V1-A` detailed spec is approved. Root R4, formal stargaze F1–F5, Home F5 and Home H1–H4 are frozen exact-file visual anchors. `STARGAZE-FORMAL-BATCH-V1-A` has `GATE B VISUAL SUBPACKAGE PASS / NOT IN BUILD`: F1 R1, F2 R1, F3 R2, F4 R1 and F5 are all user-approved and frozen. No output is a runtime asset before the project Gates and a separate implementation authorization.
- Every branch begins from `root_night_slope_v1`: the adult seated lower-left, the ordinary cat immediately to the adult’s right, the house in the right middle ground, and the same calm natural sky.
- Each branch contains exactly five manually advanced frames. One tap advances one frame; there is no page autoplay, reward, score, timer, page number, or progress indicator. The only automatic post-frame event is the separately approved one-time `STARGAZE-SKY-FINALE-V1-A` overlay after stargaze F5 becomes visible.
- Runtime hints are separate overlays. Never bake Chinese copy, icons, buttons, captions, signs, or labels into the art.
- Preserve the left-to-right screen axis. The house and warm door do not jump sides; camera changes must not read as a mirrored location.
- Changes between frames must communicate event, response, and a small relational or emotional result—not merely swap nearly identical poses.

## Characters

- Preserve `char_adult_back_v1` adult anatomy, short hair, loose top, long trousers, flat shoes, and back-facing anonymity.
- Preserve `char_house_cat_v1` ordinary quadruped anatomy, scale, coat grouping, ear shape, and full tail length.
- Keep the root left-right order: adult left, cat right. A motivated walk toward the door may change depth but not identity or scale.
- The cat’s actions must remain feline: look, ear turn, walk, sit, lean, or one natural forepaw bat. Never use human pointing, waving, smiling, or upright walking.
- Do not reveal a definitive face, gender marker, public name, specific relationship, or real-person likeness.

## Location

- Use `loc_night_slope_v1` in all outdoor panels: the same slope direction, distant-hill silhouette, house design, door placement, flower count, and sky geography.
- Keep `prop_warm_door_v1` in the right middle ground with stable amber color and stable perceived brightness. It never blinks, pulses, becomes a prize, or moves position.
- `HOME-MEAL-RITUAL-V1-A` supersedes the old `scene_01_home` frames 1–4 in which the pair noticed the door, stood, crossed the slope and entered at frame 4. Tapping the root warm door now transitions directly to H1 just inside the already bright home. H1 is a 32–35mm room-wide arrival frame; H2 places the same gray-blue outer layer on the approved left-wall hook; H3 completes one simple hot dish in the connected kitchen; H4 is a table close view with optional food and warm-water responses; H5 returns to the approved wide room.
- `HOME-F5-WIDE-ROOM-V1-A` supersedes the close-framed home F5 candidate after the user found that it showed too little of the room. The replacement must be a lightly pulled-back `32–35mm` interior wide view: room architecture and lived-in zones about `58%–62%`, adult + ordinary cat + low dinner table about `22%–26%`, adult left and cat immediately right, cold rear-right window secondary. This is exactly one user-authorized full-frame recomposition and does not authorize shots 001–004, Cocos, build, WeChat, release, or Git.
- The user has since approved the Gate A direction for shots 001–004, but their new artwork remains blocked until the written specification and a later Gate B production plan are approved. H5 is no longer merely a semantic target: it is the exact approved file with SHA-256 `569a7b9b71d16d13ad311bdea9a29d6bc93a7dc68c99892faf8c416f38bc1c51` and must not be redrawn, cropped, recolored or darkened.
- H1 and H5 share room axis, hook, table and window geography. H1 shows the adult wearing the same unmarked outer layer that appears on the H5 hook; H2 places it there and reveals the same dark knitted top visible in H5. H3's hot dish must match the food and vessel visible on H4/H5.
- Keep exactly two weakly glowing flowers near the original sitting place. They may leave frame because of a closer crop, but they cannot move, multiply, or become a path marker.
- Keep one broad, faint, broken natural Milky Way. Do not redraw it into an aurora, ribbon, constellation, or multiple bands.
- In `scene_02_stargaze`, preserve the same Milky Way arc, dust-dark rift, 8–10 important-star geography, and blue negative-space pattern across all five frames. Panels 3 and 4 are a matched locked sky insert; only the same thin cloud advances to reveal the same main star.
- Stargaze detail crops may omit the house, flowers, or full character bodies. That omission is camera cropping, not permission to move, redesign, multiply, or remove those anchors from the location.

## Wind And Light

- Wind reads in one consistent chain: far grass → near grass → adult hair/clothing → cat ear/tail. Across the breeze branch it travels left-to-right in screen space while moving from background toward foreground.
- The warm door remains the only obvious warm source. Flower glow is weaker; star and Milky Way light stays cool.
- Paper grain, halftone density, ink pressure, and color separation remain consistent across all five panels and all three branches.

## Stargaze Finale

- F5 remains a clean shooting-star-free base frame. After it holds for `0.9s`, a separate overlay plays exactly one meteor from the upper-right toward the open sky above the adult and cat for `0.8s`; its one short trail fades for `0.45s` and never loops.
- Hold the returned quiet sky for `1s`, then reveal the exact copy `一颗流星，刚刚从夜里经过。` and `回家，还是再坐一会儿？` with a single `180ms` opacity transition. Text is a browser-board UI layer, never baked into the illustration.
- `回家` enters `scene_01_home` frame 1; it cannot skip the home picture-book branch or jump directly indoors. `再坐一会儿` returns to `root_night_slope_v1` without completion, unlock, or reward.
- Reduced motion uses zero displacement and zero transform. Show only one static meteor trace at a neutral position above the pair with `≤180ms` cross-fade transitions, then preserve the `1s` quiet hold and `180ms` copy reveal.
- The meteor is a restrained story punctuation, not a wish, prize, task cue, door pointer, or brighter replacement for the Milky Way. Apart from this one approved finale event, all other shooting stars remain forbidden.

## Branch Resets

- `scene_01_home` ends on the byte-identical approved bright-home H5. Food/warm-water responses in H4 are optional and never complete or unlock a night. H5 may later bridge to `indoor-ready` without replacing the image, but this storyboard contract does not authorize runtime entry.
- `scene_02_stargaze` resolves with the approved finale choices: home enters `scene_01_home` frame 1 and stay returns to the root choice. `scene_03_breeze` still resolves outdoors. This contract authorizes only the Gate B browser design board, not runtime or Cocos wiring.
- Returning to the root restores the original seated composition without implying completion, reward, or progress.

## Known Failure Patterns

- Five near-identical frames with only tiny grass or opacity changes.
- Adult proportions drifting toward a child, standing bust, icon, or generic mascot.
- Cat becoming upright, oversized, clothed, human-faced, or inconsistent in coat and tail.
- House or door changing side, scale, architecture, warmth, or brightness between panels.
- Extra moons, glowing rivers, aurora bands, multiple galaxies, magic particles, or busy star effects.
- Multiple meteors, recurring shooting-star loops, meteor showers, a meteor aimed at the door, or a finale meteor treated as a wish/reward/task effect.
- Uniform black vector outlines, rectangular dark seams, heavy halo edges, glossy gradients, or watercolor glow replacing dry-brush ink.
- Generated captions, Chinese-like gibberish, panel numbers, logos, watermarks, or readable signs.
- A famous character, brand cue, artist imitation, or real-person likeness entering the design.
