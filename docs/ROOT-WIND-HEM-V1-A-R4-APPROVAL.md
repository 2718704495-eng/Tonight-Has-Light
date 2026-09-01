# ROOT-WIND-HEM-V1-A-R4 Approval Record

> Date: 2026-08-30  
> User phrase: `批准 ROOT-WIND-HEM-V1-A-R4：人工局部重绘衣角，不再整体重生成`

## Approved Change

- Start from the frozen R2 master only.
- Manually repaint only the adult sweater hem area.
- Remove the dominant screen-left lifted flap as the primary wind cue.
- Add a calm, broad screen-right lifted hem so the left-to-right wind direction is readable at `195x422`.
- Do not use whole-image regeneration for this repair.

## Frozen Elements

- Overall composition, 72%-78% sky emphasis, single pale broken galaxy, deep indigo B comic style, paper texture, palette and lighting.
- Adult seated weight, pose, head, hair, back, arm, leg, cat, house, warm door, two weak flowers, grass slope and all non-hem story elements.
- No text, UI, meteor, extra galaxy, speed lines, cape effect, camera movement, Cocos build, WeChat upload, review submission, public release or Git operation.

## Evidence Requirements

- R4 must live in a new sibling package and must not overwrite R2 or R3.
- The package must record a declared edit ROI on the 780x1688 master.
- Pixels outside the declared ROI must match the R2 master exactly.
- Deliver 390x844, 195x422, 360x800, 430x932 and 430x844-pressure exports, visual comparison boards, a pixel-diff report, provenance and hashes.
- Before the same-file visual decision recorded below, the final file still needed user approval before the root visual status could become `PASS` or be considered for any later runtime handoff.

## Same-file Visual Approval

> Date: 2026-08-30  
> User phrase: `批准 ROOT-WIND-HEM-V1-A-R4：根页视觉通过`

- Approved master SHA-256: `41599f03a0a7a71acd953b46066c3205b4da1522d0a06bd86b73186afedccdc8`.
- Approved `390x844` export SHA-256: `23443918a0c892d569a6fd49b55b889d70bb4ed0dc7a6396a0af2bf5fad2306a`.
- Approved `195x422` export SHA-256: `6ceac63b51bf9c6e8311aded28c6adf1fe7e6349e864d5f475976b7c09bb9491`.
- The exact 29-file pre-approval list is frozen at `design-system/formal-picturebook-fullframe-v1-a-root-r4-manual-hem/approvals/HASHES.pre-user-visual-approval.sha256`; the original list's SHA-256 is `888ee916f58c1f55a5986afa040be5564e38800dea023f02fb812962167b2c42`.
- Root-page Gate B visual status is now `PASS`. R2 and R3 remain historical and must not replace this R4 baseline.
- This approval is limited to the root-page static visual. It does not approve the remaining formal picture-book pages, the complete Gate B set, Cocos consumption, animation, build, WeChat, upload, review submission, public release or Git operations.
