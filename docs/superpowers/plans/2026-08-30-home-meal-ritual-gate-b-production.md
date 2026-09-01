# SUPERSEDED／无效审查写入（禁止执行）

> 状态：`SUPERSEDED / INVALID READ-ONLY REVIEW WRITE / DO NOT EXECUTE`  
> 原因：本文件由被明确要求“只读”的审查任务越权创建，不能作为独立审查结论或项目真相源。为保留审计证据不删除。  
> 唯一当前生产计划：[`2026-08-30-home-meal-ritual-gate-b.md`](./2026-08-30-home-meal-ritual-gate-b.md)  
> 本文件被封存时原 SHA-256：`b21302c70a08cc1a360c060c5febabc4fa3181ef50a40bd5a7a66542e27adae4`

# Home Meal Ritual Gate B Production Plan（历史无效稿）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce the Gate B visual package for `HOME-MEAL-RITUAL-V1-A`: H1-H4 formal full-frame picture-book pages, H4 optional response states, and an H1-H5 review board that preserves the approved H5 exactly.

**Architecture:** This is a visual-production plan, not a runtime plan. Each story page is one full-frame clean plate under the approved `FORMAL-PICTUREBOOK-FULLFRAME-V1-A` exception; Chinese prompts, touch targets, and H4 response states remain independent overlays or editable assets. H5 is consumed byte-identically from the approved `HOME-F5-WIDE-ROOM-V1-A-R1` export and is never regenerated.

**Tech Stack:** Markdown contracts, YAML storyboard files, ImageGen only for approved full-frame clean plate production, Sharp/Node image validation scripts already used by this project, Cocos-compatible 390x844/360x800/430x932 exports as evidence only.

**Spec:** `docs/superpowers/specs/2026-08-30-home-meal-ritual-v1-a-design.md`

## Global Constraints

- Current user approval: `批准 HOME-MEAL-RITUAL-V1-A 中文规格，开始 Gate B 生产计划`.
- This plan does not authorize art generation, Cocos changes, Cocos build, WeChat preview/upload, review submission, public release, Git commit, or Git push.
- H5 approved baseline: `design-system/formal-picturebook-fullframe-v1-a-home-f5-wide-room-v1-a-r1/exports/390x844/scene_01_home_shot_005.png`.
- H5 SHA-256: `569a7b9b71d16d13ad311bdea9a29d6bc93a7dc68c99892faf8c416f38bc1c51`.
- H5 must remain byte-identical in all review boards and future runtime consumption.
- H1-H4 must use the same B night-comic language: deep indigo and warm ochre limited palette, dry-brush ink, restrained halftone, shared paper tooth, readable warm room, no black corners.
- Adult remains anonymous, back or restrained three-quarter back, adult proportions, short hair, trousers, flat shoes, gray-blue unmarked outer layer over dark knitted top until H2.
- Cat remains an ordinary four-foot house cat with stable scale, coat grouping, ears, and full tail; no clothing, speech, human gesture, glow, or mascot treatment.
- No generated Chinese text, captions, logos, signatures, watermarks, panel numbers, UI buttons, or readable signs may appear inside artwork.
- H4 `吃一点` and `喝口温水` are equal optional interactions. Neither is a completion condition, reward, health claim, or night-progress event.
- 390x844, 195x422, 360x800, 430x932, and 430x844 pressure exports are required before user visual approval.
- Touch targets for future overlays must be at least 44x44px with 8px adjacent spacing.
- Reduced motion uses opacity-only transitions: 150ms page crossfade and at most 180ms H4 response crossfade.
- Any P0 or P1 visual drift stops production before the next page.

---

## File Structure

- Create: `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/README.md`  
  Records package status, approved scope, and blocked runtime boundary.
- Create: `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/prompts/scene_01_home_shot_001.md`  
  H1 production prompt and negative constraints.
- Create: `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/prompts/scene_01_home_shot_002.md`  
  H2 production prompt and garment continuity constraints.
- Create: `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/prompts/scene_01_home_shot_003.md`  
  H3 production prompt and kitchen spatial-anchor constraints.
- Create: `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/prompts/scene_01_home_shot_004.md`  
  H4 clean-plate prompt and table-composition constraints.
- Create: `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/overlays/h4-response-states.md`  
  Editable response-state requirements for `none`, `ate`, `sipped`, and `both`.
- Create: `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/source/raw/`  
  Stores one raw candidate per approved production attempt.
- Create: `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/source/masters/`  
  Stores normalized master images.
- Create: `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/exports/{195x422,360x800,390x844,430x844-pressure,430x932}/`  
  Stores review exports.
- Create: `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/evidence/`  
  Stores visual boards, metrics JSON, contrast notes, and reviewer notes.
- Create: `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/provenance.json`  
  Records prompt, source, generation boundary, manual edits, hashes, and reviewer states.
- Create: `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/HASHES.sha256`  
  Freezes the candidate package.
- Modify: `design-board/outdoor-picturebook-branch-v1/storyboard-project/prompts/scene_01_home_contact_sheet.md`  
  Keep it marked superseded; add the approved Gate B production plan path.
- Modify: `docs/HOME-MEAL-RITUAL-V1-A-TRACEABILITY.md`  
  Move from written-spec pending to Gate B plan pending.
- Modify: `docs/PROJECT-MEMORY.md` and `.agents/skills/tonight-design-gate/references/current-contract.md`  
  Record this plan and the new stop line.

---

### Task 1: Freeze Production Inputs And Package Shell

**Files:**
- Create: `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/README.md`
- Create: `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/provenance.json`
- Create: `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/evidence/input-hashes.json`
- Modify: `docs/HOME-MEAL-RITUAL-V1-A-TRACEABILITY.md`

**Interfaces:**
- Consumes: approved H5 path and SHA-256 from the design spec.
- Produces: package ID `formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a`, frozen input hash record, and an empty provenance ledger.

- [ ] **Step 1: Verify the H5 input hash**

Run:

```bash
shasum -a 256 design-system/formal-picturebook-fullframe-v1-a-home-f5-wide-room-v1-a-r1/exports/390x844/scene_01_home_shot_005.png
```

Expected:

```text
569a7b9b71d16d13ad311bdea9a29d6bc93a7dc68c99892faf8c416f38bc1c51  design-system/formal-picturebook-fullframe-v1-a-home-f5-wide-room-v1-a-r1/exports/390x844/scene_01_home_shot_005.png
```

- [ ] **Step 2: Create package directories**

Run:

```bash
mkdir -p design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/{prompts,overlays,source/raw,source/masters,evidence,exports/195x422,exports/360x800,exports/390x844,exports/430x844-pressure,exports/430x932,reviews}
```

- [ ] **Step 3: Write package status**

Create `README.md` with this exact status block:

```markdown
# FORMAL-PICTUREBOOK-FULLFRAME-V1-A / HOME-MEAL-RITUAL-V1-A

Status: GATE_B_PRODUCTION_PLAN_APPROVED_PENDING_H1_PILOT
Scope: H1-H4 formal full-frame clean plates, H4 editable response-state notes, H1-H5 review boards.
Frozen H5: ../formal-picturebook-fullframe-v1-a-home-f5-wide-room-v1-a-r1/exports/390x844/scene_01_home_shot_005.png
Frozen H5 SHA-256: 569a7b9b71d16d13ad311bdea9a29d6bc93a7dc68c99892faf8c416f38bc1c51
Not authorized: Cocos, WeChat, review submission, public release, Git.
```

- [ ] **Step 4: Write initial provenance ledger**

Create `provenance.json` with these keys and empty arrays:

```json
{
  "package_id": "formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a",
  "contract": "HOME-MEAL-RITUAL-V1-A",
  "approved_h5_sha256_390x844": "569a7b9b71d16d13ad311bdea9a29d6bc93a7dc68c99892faf8c416f38bc1c51",
  "frames": [],
  "manual_edits": [],
  "reviews": [],
  "user_approvals": [],
  "runtime_authorization": false
}
```

- [ ] **Step 5: Stop for H1 pilot authorization**

Do not generate H1 until the user approves this plan with wording equivalent to:

```text
批准 HOME-MEAL-RITUAL-V1-A Gate B 生产计划，开始 H1 单帧探针
```

---

### Task 2: Produce H1 Single-Frame Pilot

**Files:**
- Create: `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/prompts/scene_01_home_shot_001.md`
- Create: `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/source/raw/scene_01_home_shot_001-imagegen-r1.png`
- Create: `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/source/masters/scene_01_home_shot_001-master-2x.png`
- Create: `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/exports/*/scene_01_home_shot_001.png`
- Create: `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/evidence/h1-vs-h5-room-continuity.png`
- Create: `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/evidence/h1-owner-review.md`

**Interfaces:**
- Consumes: `scene_01_home_shot_005.png` as the exact room endpoint.
- Produces: H1 pilot candidate. No H2-H4 work may begin until H1 has no P0/P1 and the user approves the visible H1 file.

- [ ] **Step 1: Write the H1 production prompt**

Use this prompt block in `prompts/scene_01_home_shot_001.md`:

```text
[SHOT ID]
scene_01_home_shot_001 / H1 arrival wide

[PURPOSE]
Show the first moment after entering the bright warm home. The room receives the adult and cat before any task appears.

[CHARACTER]
One anonymous adult, back or restrained three-quarter back view, unmistakably adult proportions, short dark hair, long trousers, flat shoes. The adult is still wearing the same plain gray-blue outer layer that will later hang on the left-wall hook. Under it, only hints of the dark knitted top may show. One ordinary domestic short-haired cat stands at the adult's right foot, natural quadruped anatomy, no clothing, no speech, no glow.

[CAMERA]
Portrait 390x844 composition, 32-35mm equivalent, just inside the threshold, lightly pulled back. Match the approved H5 room axis: left-wall hook, low dinner table, window, warm ceiling/wall light, and floor geometry must feel like the same room.

[LIGHTING]
The whole room is already warmly lit. Corners are readable, not black. Warm light comes from broad wall, ceiling, floor, and furniture bounce. Cold blue night is visible only through the window as a secondary contrast.

[COMPOSITION]
Read complete room first, then adult and cat lower-left. Left-wall hook is visible and empty. Low table has kettle, two cups, rice and soup, but the central shallow plate for the warm-ochre hot dish is not yet on the table. Keep space for a future separate overlay near the hook reading "放下外衣"; do not render any text.

[ENVIRONMENT]
Same cozy home as approved H5: warm plaster walls, wood furniture, low table, window to the same deep-blue night, ordinary lived-in details. No party, no extra people, no dark theatrical surprise, no black room corner.

[CONTINUITY]
H1 must resolve to H5 after H2-H4: same hook, table, window, floor direction, wall planes, palette, adult left/cat right relationship, and B night-comic dry-brush print texture.

[NEGATIVE CONSTRAINTS]
No text, no signs, no labels, no watermark, no logo, no captions, no panel numbers, no famous character, no real person, no artist-name imitation, no brand clothing, no childlike body, no mascot cat, no black corners, no bloom, no orange filter, no task UI, no prepared central hot dish yet.

[IMAGE PROMPT]
Original portrait night-comic illustration, 390x844. A quiet anonymous adult and ordinary cat have just stepped inside a small warm home at midnight. The entire room is already bright and welcoming: readable warm plaster walls, ceiling, floor, wood furniture, a low dinner table, kettle, two cups, rice and soup, and a cold deep-blue night window. The adult stands lower-left in back view wearing a plain gray-blue outer layer over a dark knitted top; the ordinary cat stands at the adult's right foot. The left-wall hook is empty and clearly visible. The central shallow dinner plate is not yet filled. Deep indigo and warm ochre limited palette, mature dry-brush comic ink, restrained halftone, shared paper texture, large readable light and dark masses, no text, no UI.
```

- [ ] **Step 2: Generate exactly one H1 raw candidate**

Use `imagegen` once with the approved prompt. Save the raw output as:

```text
design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/source/raw/scene_01_home_shot_001-imagegen-r1.png
```

- [ ] **Step 3: Normalize H1 without changing visual content**

Use the existing Batch 1 normalization approach as reference. Produce:

```text
source/masters/scene_01_home_shot_001-master-2x.png
exports/390x844/scene_01_home_shot_001.png
exports/195x422/scene_01_home_shot_001.png
exports/360x800/scene_01_home_shot_001.png
exports/430x932/scene_01_home_shot_001.png
exports/430x844-pressure/scene_01_home_shot_001.png
```

- [ ] **Step 4: Owner-review H1 against P0/P1 stop lines**

Record in `evidence/h1-owner-review.md`:

```markdown
# H1 Owner Review

P0 stop lines:
- Same room axis as H5: PASS/FAIL
- Adult wears gray-blue outer layer: PASS/FAIL
- H5 hook visible and empty: PASS/FAIL
- Table has kettle, two cups, rice and soup but no central hot dish: PASS/FAIL
- Whole room bright and readable; no black corners: PASS/FAIL
- No baked Chinese/text/logo/watermark: PASS/FAIL
- Adult and cat remain original and non-IP-like: PASS/FAIL

P1 stop lines:
- 195x422 still reads as warm-home arrival: PASS/FAIL
- Adult left/cat right preserved: PASS/FAIL
- Window is secondary, not the visual focus: PASS/FAIL
- No heavy dark halo around adult or cat: PASS/FAIL
```

- [ ] **Step 5: User-review H1**

Show the 390x844 and 195x422 H1 exports. Stop until the user approves or rejects H1. Do not produce H2/H3/H4 while H1 has unresolved P0/P1 or lacks user approval.

---

### Task 3: Produce H2 Coat-Hook Frame And H3 Kitchen Frame

**Files:**
- Create: `prompts/scene_01_home_shot_002.md`
- Create: `prompts/scene_01_home_shot_003.md`
- Create: `source/raw/scene_01_home_shot_002-imagegen-r1.png`
- Create: `source/raw/scene_01_home_shot_003-imagegen-r1.png`
- Create: `source/masters/scene_01_home_shot_002-master-2x.png`
- Create: `source/masters/scene_01_home_shot_003-master-2x.png`
- Create: `exports/*/scene_01_home_shot_002.png`
- Create: `exports/*/scene_01_home_shot_003.png`
- Create: `evidence/h2-h3-continuity-review.md`

**Interfaces:**
- Consumes: approved H1 and frozen H5.
- Produces: H2 and H3 candidates. H4 may begin only after H2/H3 have no P0/P1 and the user approves both visible files.

- [ ] **Step 1: Write H2 prompt**

Use this required image-prompt content:

```text
H2 is a 50-55mm left-wall entry close view inside the same bright home. The adult hangs the exact gray-blue unmarked outer layer from H1 onto the same left-wall hook visible in frozen H5, revealing the same dark knitted top visible in H5. Keep the adult anonymous in rear three-quarter view. The ordinary cat walks naturally on four paws through the lower frame, not helping and not carrying clothing. Preserve warm readable room light, wall and floor material, wood tones, dry-brush night-comic ink, restrained halftone, and no black corners. No text, no UI, no labels, no brand marks, no extra people, no face reveal.
```

- [ ] **Step 2: Write H3 prompt**

Use this required image-prompt content:

```text
H3 is a 35-40mm medium view in the connected kitchen zone of the same bright home. The adult, wearing the dark knitted top from H2/H5, lifts a pot lid with one hand and serves the final warm-ochre hot dish into the same shallow round plate that will appear at the center of H4 and frozen H5. The cat waits at a safe distance outside the cooking zone, natural ordinary-cat posture. Include one clear spatial anchor back to the main room: a doorway, matching wall corner, or edge of the low table. Preserve the same warm-light direction, wall/floor material, woodwork, deep-indigo/warm-ochre limited palette, dry-brush comic ink, restrained halftone, and readable non-black corners. No recipe UI, timer, progress, text, labels, extra people, face reveal, or theatrical spotlight.
```

- [ ] **Step 3: Generate one raw H2 and one raw H3**

Use `imagegen` once per shot. Save raw outputs with the exact filenames listed above.

- [ ] **Step 4: Normalize and export both frames**

Produce 390x844, 195x422, 360x800, 430x932, and 430x844-pressure exports for both H2 and H3.

- [ ] **Step 5: Review continuity before user review**

Record in `evidence/h2-h3-continuity-review.md`:

```markdown
# H2/H3 Continuity Review

H2:
- Same hook as H5: PASS/FAIL
- Same outer layer from H1 now on hook: PASS/FAIL
- Same dark inner knit as H5: PASS/FAIL
- Cat ordinary four-foot behavior: PASS/FAIL
- No text or generated signs: PASS/FAIL

H3:
- Same house, not a new location: PASS/FAIL
- Kitchen has main-room spatial anchor: PASS/FAIL
- Same inner knit, trousers, shoes and anonymity: PASS/FAIL
- Dish and shallow plate match H4/H5 target: PASS/FAIL
- Cat at safe distance, not anthropomorphic: PASS/FAIL
- No cooking-game UI or progress: PASS/FAIL
```

- [ ] **Step 6: User-review H2 and H3 together**

Show H1-H3 as a three-frame review board plus individual 390x844 exports. Stop if H2 or H3 receives P0/P1 rejection.

---

### Task 4: Produce H4 Table Close Frame And Response State Specification

**Files:**
- Create: `prompts/scene_01_home_shot_004.md`
- Create: `source/raw/scene_01_home_shot_004-imagegen-r1.png`
- Create: `source/masters/scene_01_home_shot_004-master-2x.png`
- Create: `exports/*/scene_01_home_shot_004.png`
- Create: `overlays/h4-response-states.md`
- Create: `evidence/h4-ui-touch-review.md`

**Interfaces:**
- Consumes: approved H1-H3 and frozen H5 table target.
- Produces: H4 clean plate and editable state contract for future runtime/UI work.

- [ ] **Step 1: Write H4 clean-plate prompt**

Use this required image-prompt content:

```text
H4 is a 55-65mm warm dinner-table close view in the same bright home. The meal and one warm-water cup are the main focus. The shallow round plate now contains the warm-ochre hot dish from H3; rice, soup, kettle and two cups remain consistent with frozen H5. The adult is still anonymous, shown through back/shoulder and hands only; no face reveal. The ordinary cat rests naturally on the floor or cushion near the table, not on the table and not human-like. Leave clean space near the food and cup for separate runtime text overlays "吃一点" and "喝口温水"; do not render text in the illustration. Warm readable room light, no black corners, B night-comic dry-brush ink, restrained halftone, no task UI, no reward glow.
```

- [ ] **Step 2: Generate one raw H4 clean plate**

Use `imagegen` once. Save it as:

```text
source/raw/scene_01_home_shot_004-imagegen-r1.png
```

- [ ] **Step 3: Normalize and export H4**

Produce the five export sizes and confirm the food, cup, hand, and cat remain visible at 360x800 and 430x844-pressure.

- [ ] **Step 4: Specify editable response states**

Create `overlays/h4-response-states.md` with:

```markdown
# H4 Response States

Base state: `none`
- Food untouched.
- Warm-water cup at original position.
- No response text baked into art.

State: `ate`
- Central hot dish portion slightly reduced.
- Chopsticks rest on bowl rim.
- No chewing, health effect, reward flash, or completion mark.
- Transition: opacity-only crossfade, max 180ms.

State: `sipped`
- Warm-water cup shifts a few pixels toward the adult.
- Cup waterline is slightly lower.
- No gulp, body glow, steam reward, or completion mark.
- Transition: opacity-only crossfade, max 180ms.

State: `both`
- Combines `ate` and `sipped` static results.
- Do not show chopsticks and cup both raised at the same time.
- Transition: opacity-only crossfade, max 180ms.

Touch design:
- Food hotspot minimum 44x44px.
- Cup hotspot minimum 44x44px.
- Minimum spacing between hotspots: 8px.
- Empty-space tap advances to H5.
- Neither action writes night completion, rewards, or progress.
```

- [ ] **Step 5: Review H4 UI risk**

Record in `evidence/h4-ui-touch-review.md`:

```markdown
# H4 UI Touch Review

- "吃一点" and "喝口温水" fit as quiet picture overlays, not task buttons: PASS/FAIL
- 120% large text can use warm paper overlay without covering food/cup: PASS/FAIL
- Food and cup touch regions can each be at least 44x44px with 8px spacing: PASS/FAIL
- Empty-space advance remains discoverable without a progress label: PASS/FAIL
- Static response states are understandable while muted and reduced-motion: PASS/FAIL
```

- [ ] **Step 6: User-review H4**

Show H4 clean plate, a 195x422 thumbnail, and a simple overlay mock showing the two text positions. Stop until user approves or rejects H4.

---

### Task 5: Build H1-H5 Review Board With Frozen H5

**Files:**
- Create: `evidence/home-meal-ritual-h1-h5-board-390.png`
- Create: `evidence/home-meal-ritual-h1-h5-board-195.png`
- Create: `evidence/h1-h5-hash-and-pixel-check.json`
- Create: `HASHES.sha256`

**Interfaces:**
- Consumes: approved H1-H4 exports and frozen H5.
- Produces: full Gate B user-review package. No Cocos plan may begin until this board and per-page approvals are complete.

- [ ] **Step 1: Copy H5 into package exports by byte-identical copy**

Run:

```bash
cp design-system/formal-picturebook-fullframe-v1-a-home-f5-wide-room-v1-a-r1/exports/390x844/scene_01_home_shot_005.png design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/exports/390x844/scene_01_home_shot_005.png
```

- [ ] **Step 2: Verify copied H5 hash**

Run:

```bash
shasum -a 256 design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/exports/390x844/scene_01_home_shot_005.png
```

Expected:

```text
569a7b9b71d16d13ad311bdea9a29d6bc93a7dc68c99892faf8c416f38bc1c51  design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/exports/390x844/scene_01_home_shot_005.png
```

- [ ] **Step 3: Build two review boards**

Create a 390 board showing H1-H5 in order and a 195 thumbnail board showing the same order. Each tile may have external labels outside the artwork area; labels must not be inside the frame images.

- [ ] **Step 4: Run board review**

Record:

```markdown
# H1-H5 Board Review

- Sequence reads as arrival -> coat -> kitchen -> table -> same wide home: PASS/FAIL
- H1 and H5 read as same room and compatible camera: PASS/FAIL
- H2 garment resolves to H5 hook: PASS/FAIL
- H3 dish resolves to H4/H5 table: PASS/FAIL
- H4 interaction options are optional, not required steps: PASS/FAIL
- H5 hash remains approved value: PASS/FAIL
- No generated text appears inside any illustration: PASS/FAIL
```

- [ ] **Step 5: Freeze hashes**

Run:

```bash
find design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a -type f -not -name HASHES.sha256 -print0 | sort -z | xargs -0 shasum -a 256 > design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/HASHES.sha256
shasum -a 256 design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/HASHES.sha256
```

- [ ] **Step 6: User-review the full board**

Ask for page-specific approval, not broad runtime approval:

```text
请确认是否批准 HOME-MEAL-RITUAL-V1-A Gate B H1-H5 视觉板。这个批准只代表静态视觉通过，不授权 Cocos、微信上传、提审或发布。
```

---

### Task 6: Independent Read-Only Gate B Review

**Files:**
- Create: `reviews/independent-gate-b-review.md`

**Interfaces:**
- Consumes: frozen package with `HASHES.sha256`.
- Produces: independent P0/P1/P2 findings and explicit Gate B status.

- [ ] **Step 1: Run hash verification**

Run:

```bash
cd design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a && shasum -c HASHES.sha256
```

Expected: every listed file reports `OK`.

- [ ] **Step 2: Review against 12 binary checks**

The reviewer must classify each item as `PASS`, `FAIL`, or `BLOCKED`:

```markdown
1. Candidate identity and hash freeze
2. H1/H5 same-room geometry
3. H2 garment and hook continuity
4. H3 kitchen spatial anchor
5. H3/H4/H5 dish and vessel continuity
6. Adult identity, wardrobe, anonymity, and adult proportions
7. Ordinary cat anatomy, scale, behavior, and coat grouping
8. Bright warm room without black corners or orange bloom
9. No baked text, UI, logos, watermarks, or generated captions
10. 390/195/360/430 exports preserve key objects
11. H4 overlays can meet 44x44, 8px spacing, 120% text, muted and reduced-motion requirements
12. H5 remains byte-identical to approved SHA-256
```

- [ ] **Step 3: Stop on P0/P1**

If any item is `FAIL` with P0 or P1 severity, do not ask the user for final Gate B approval until the issue is fixed or explicitly accepted by the user as a new visible style decision.

---

### Task 7: Update Current Contract After Gate B Outcome

**Files:**
- Modify: `docs/PROJECT-MEMORY.md`
- Modify: `.agents/skills/tonight-design-gate/references/current-contract.md`
- Modify: `docs/HOME-MEAL-RITUAL-V1-A-TRACEABILITY.md`
- Modify: `docs/HOME-MEAL-RITUAL-V1-A-APPROVAL.md`

**Interfaces:**
- Consumes: final package hash, per-page approvals, and independent review.
- Produces: current truth-source update. This still does not authorize runtime work.

- [ ] **Step 1: Record approved page identities**

For each approved page, record:

```text
shot id
approved file path
390x844 SHA-256
approval date
approval scope
```

- [ ] **Step 2: Update traceability**

Set H1-H4 rows to `PASS` only when each has approved visual evidence and no P0/P1. Keep HMR-06 runtime progress isolation as `BLOCKED` until Gate D.

- [ ] **Step 3: Preserve runtime boundary**

Every status update must retain:

```text
NO COCOS / NO BUILD / NO WECHAT / NO GIT
```

unless the user separately authorizes one of those operations.

---

## Self-Review

**Spec coverage:** The plan covers H1 arrival, H2 coat, H3 kitchen, H4 food/water optional states, H5 exact return, page transitions, reduced motion, touch sizing, evidence, provenance, and stop lines. Runtime `HomeArrivalStory` remains out of scope and blocked until Gate B passes.

**Prohibited-token scan:** The plan avoids unresolved work markers and every planned file path is concrete.

**Type and identifier consistency:** Shot IDs match the approved YAML contract: `scene_01_home_shot_001` through `scene_01_home_shot_005`. Package ID is stable: `formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a`. H5 hash matches the approved record.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-30-home-meal-ritual-gate-b-production.md`. Two execution options:

1. Subagent-Driven: dispatch a fresh visual worker per task, review between tasks, fastest for art and QA separation.
2. Inline Execution: execute tasks in this session with checkpoints and user review after each major frame.

Recommended for this project: Subagent-Driven for independent visual review, while the main task remains the only owner for user approval and any future WeChat action.
