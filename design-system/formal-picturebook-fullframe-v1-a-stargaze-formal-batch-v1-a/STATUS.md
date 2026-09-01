# STARGAZE-FORMAL-BATCH-V1-A Status

> State: `F1_R1_USER_VISUAL_PASS_FROZEN / F2_R1_USER_VISUAL_PASS_FROZEN / F3_R2_USER_VISUAL_PASS_FROZEN / F4_R1_USER_VISUAL_PASS_FROZEN / STARGAZE_F1-F5_GATE_B_VISUAL_SUBPACKAGE_PASS / NOT_IN_BUILD`
> Updated: 2026-08-31

This package is the isolated Gate B formal full-frame production area for
`STARGAZE-FORMAL-BATCH-V1-A`.

## Frozen Page

- Page: `scene_02_stargaze_shot_001 / 抬头`
- Candidate: `stargaze-formal-batch-v1-a-f1-r1`
- Asset ID: `ART-PBOOK-STAR-001`
- Property: `ai-assisted-formal-fullframe`
- 390x844 SHA-256:
  `6b2450a1993742545b83958d4f17913fda63a512071f42fa0a148feb4856c26e`
- Root owner review: `P0=0 / P1=0 / P2=0`
- Independent review: `P0=0 / P1=0 / P2=0 / writeOperations=0`
- User visual approval: `PASS / FROZEN`
- Approval record: `docs/STARGAZE-F1-FORMAL-V1-A-R1-APPROVAL.md`

## Boundary

The F1 image is approved and pixel-frozen for the Gate B formal sequence. It is not approved for
Cocos, build, WeChat upload, review submission, public release, Git commit, Git
push, or any remote write.

F2 `银河深处`, F3 `薄云经过` R2 and F4 `云缝重开` R1 passed root and
independent visual review, then received exact-file user visual approval. F1–F4
in this package and the separately approved formal F5 now form a complete
`STARGAZE-FORMAL-BATCH-V1-A GATE B VISUAL SUBPACKAGE PASS`. Every page remains
outside Cocos and every build.

## Frozen F2

- Page: `scene_02_stargaze_shot_002 / 银河深处`
- Candidate: `stargaze-formal-batch-v1-a-f2-r1`
- Asset ID: `ART-PBOOK-STAR-002`
- Property: `ai-assisted-formal-fullframe`
- 390x844 SHA-256:
  `98e267506a5485a93fdefa9759611c0ac4de2120edd5dc61d253a9ff59deee52`
- Master SHA-256:
  `2c8326bae7dbd85384583864e5689bf719d84d3dfdca998711ee681eff0a2d63`
- Root owner review: `P0=0 / P1=0 / P2=0`
- Independent review: `P0=0 / P1=0 / P2=0 after final package hash refresh / writeOperations=0`
- User visual approval: `PASS / FROZEN`
- Approval record: `docs/STARGAZE-F2-FORMAL-V1-A-R1-APPROVAL.md`
- Pre-approval package manifest SHA-256:
  `6639f380d2cbc408b64a1cfac6631ff74c6ebaeb5d91862aa4301d2b2cfb5e47`

## Frozen F3

- Page: `scene_02_stargaze_shot_003 / 薄云经过`
- Candidate: `stargaze-formal-batch-v1-a-f3-r2`
- Asset ID: `ART-PBOOK-STAR-003`
- Property: `ai-assisted-formal-fullframe`
- 390x844 SHA-256:
  `ae9cc70c56be5b8f83e985058d7ab40bc71a0aa0f5f32819bb2706f0111244ec`
- Master SHA-256:
  `d2561098ca35f15b02adb7a74bc7cc61778bbfb789552f57a27dc58685b57745`
- Root owner review: `P0=0 / P1=0 / P2=0`
- Independent review: `P0=0 / P1=0 / P2=0 / writeOperations=0`
- Mechanical validation: `PASS`
- Generation: one initial image plus one targeted repair; no further F3 repair budget remains unless the user approves a new visible revision path.
- User visual approval: `PASS / FROZEN`
- Approval record: `docs/STARGAZE-F3-FORMAL-V1-A-R2-APPROVAL.md`
- Pre-approval package manifest SHA-256:
  `0466cb82c55385dddd058cae3f780d472c9df6f66c02b213706cee04f7750bc1`

## Frozen F4

- Page: `scene_02_stargaze_shot_004 / 云缝重开`
- Candidate: `stargaze-formal-batch-v1-a-f4-r1`
- Asset ID: `ART-PBOOK-STAR-004`
- Status: `USER VISUAL PASS / FROZEN / NOT IN BUILD`
- 390×844 SHA-256: `0973fec9fc18cfdb7422dcef32941a1fb071f84c95154cb10fd1d5279bda1ae9`
- Master SHA-256: `7a1d0cac3e0b6a27dd7629213fbf58547b9f3f378348308f87f1bda8fa642fd0`
- Locked input: exact approved F3 master SHA-256 `d2561098ca35f15b02adb7a74bc7cc61778bbfb789552f57a27dc58685b57745`
- Generation: one initial image, zero targeted repairs.
- Mechanical validation: `PASS / issues=[]`
- Root owner review: `P0=0 / P1=0 / P2=0`
- Independent visual review: `P0=0 / P1=0 / P2=0 / writeOperations=0`
- User visual approval: `PASS / FROZEN`
- Approval record: `docs/STARGAZE-F4-FORMAL-V1-A-R1-APPROVAL.md`
- Pre-approval package manifest SHA-256: `abc92a43429d03d58be0e9c22ef09c0f68d955c30681cef7fc3ce1b89ad5b111`
- Boundary: same locked camera, crop, main star, Milky Way, dust-dark rift and star geography; only the same cloud opens into a natural gap and quietly reveals the same main star.

## Visual Subpackage Outcome

F1, F2, F3, F4 and the separately frozen formal F5 all have exact-file user
visual approval. The stargaze visual subpackage is therefore `PASS`, while the
project-wide Gate B remains blocked by the remaining formal branches and
independent UI/effect assets. This status does not authorize runtime use.

## Continuity Note

The house has a very weak secondary warm window in addition to the door. It is
not treated as a defect: approved Root R4 and formal F5 retain the same
subordinate cue, while the door remains the only obvious warm source. F2 used
no repair. F3 used one bounded targeted repair to remove a possible
meteor/comet-tail reading from the cloud.
