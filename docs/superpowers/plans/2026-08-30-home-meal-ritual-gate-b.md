# HOME-MEAL-RITUAL-V1-A Gate B 生产计划

> **执行员工必读：**逐项执行时必须使用 `superpowers:subagent-driven-development`（默认）或 `superpowers:executing-plans`；清单以 `- [ ]` 跟踪。任何审查员工保持零写入。

**目标：**生产、审查并冻结四张新的全幅回家故事页（H1–H4）、独立低压力中文 UI 与 H4 反馈状态；随后展示完整五页回家仪式，并让已批准 H5 文件保持逐字节一致。

**生产结构：**Gate B 全程留在 Cocos 之外。每张新页都是一张独立版本化的 `780×1688` 全幅无字 clean plate，分别保存提示词、原始结果、标准化母版、五种审查导出、来源记录和批准快照。生产严格串行：H1 是“同一间屋”的高风险探针；用户批准 H1 后才做 H2/H3；用户批准 H2/H3 后才做 H4；最终浏览器板直接引用已批准 H5，绝不重新生成。

**工具链：**Markdown/YAML 合同、内置 `image_gen`、Node.js ESM、Sharp、SVG/straight-alpha PNG、浏览器设计板、Node test runner、SHA-256。

**规格：**`docs/superpowers/specs/2026-08-30-home-meal-ritual-v1-a-design.md`

> 下文四段英文提示词是给图像生成工具的实际生产输入；所有给用户看的界面文字、验收说明与状态记录均保持中文。

## 用户可见生产节奏

| 批次 | 只做什么 | 展示给用户的证据 | 通过后才允许 |
|---|---|---|---|
| B0 管线 | 新建隔离目录、清单、来源与校验器，不生成图片 | 结构校验结果；H5 原图哈希仍一致 | 生成 H1 |
| B1 H1 单帧探针 | “刚进门，同一间明亮的家接住你” | H1 390 原图、195 缩略图、H1↔H5 同屋对照 | 生产 H2 与 H3 |
| B2 生活动作 | H2 放下外衣；H3 在相连厨房完成最后一道热菜 | 外衣连续性条、厨房空间锚点、热菜器皿连续性 | 生产 H4 |
| B3 饭桌互动 | H4 clean plate、`吃一点`／`喝口温水` 独立反馈层与四种状态 | H4 四状态板、120% 大字、减动、触控热区 | 建五页浏览器板 |
| B4 五页合板 | H1→H2→H3→H4→逐字节一致 H5，验证全部交叉淡变 | 390／195 五页板、360／390／430、H1↔H5、最终哈希 | 请求整段 Gate B 视觉批准 |

每张 H1–H4 只允许一次初始生成；只有一个明确局部缺陷时，才允许一次定点修复。任何页面第二次仍有 P0/P1，就停止该页而不是继续抽卡。最大理论生成次数为 `4 张 ×（1 次初始＋1 次定点修复）= 8 次`，实际优先少用。

## 全局冻结线

- User approval phrase for the written specification is exactly `批准 HOME-MEAL-RITUAL-V1-A 中文规格，开始 Gate B 生产计划`.
- The page order is exactly H1 arrival wide → H2 hang outerwear → H3 connected-kitchen serving → H4 table close-up → byte-identical approved H5.
- H5 390×844 remains byte-identical at SHA-256 `569a7b9b71d16d13ad311bdea9a29d6bc93a7dc68c99892faf8c416f38bc1c51`; no redraw, crop, grade, text, overlay bake or darkening is permitted.
- H1–H4 use `source_property=ai-assisted-formal-fullframe` only under the approved `FORMAL-PICTUREBOOK-FULLFRAME-V1-A` exception. Each page permits one initial generation and at most one targeted repair; raw `r1` is never overwritten by `r2`.
- Chinese, hotspots, H4 food/cup response assets and transition effects are independent editable sources. No generated text, pseudo-text, logo, watermark, page number, progress UI or task card may enter a clean plate.
- The adult remains anonymous, unmistakably adult and rear-facing. H1 wears the same plain gray-blue outer layer later seen on the H5 left hook; H2 reveals the same dark knit top seen in H5. The cat remains an ordinary unclothed four-paw domestic cat at adult-right unless a motivated walk changes depth.
- The home is bright from the first indoor frame. Ceiling, walls, floor, furniture, people, cat and food stay readable; no black-room reveal, black corners, Bloom, pure-white clipping, party or crowd.
- H3 must retain one visible main-room anchor and the same wall/floor material, woodwork and warm-light direction. H3’s warm-ochre dish and shallow plate must resolve unchanged through H4 into H5.
- H4’s `吃一点` and `喝口温水` are equal, optional and idempotent. Either, both or neither is valid; no state completes, rewards or unlocks a night.
- Required review exports are `195×422`, `360×800`, `390×844`, `430×932` and `430×844-pressure`. SHOW_ALL safe-border color is exactly `#06265F`.
- Default page transitions are `260ms ease-in-out`; root door→H1 is `320ms`; H4→H5 is `420ms`; reduced motion is `150ms` opacity-only. H4 response-state crossfades are `≤180ms`.
- Touch targets are at least `44×44px`, adjacent edges at least `8px`; text contrast is at least `4.5:1` and meaningful non-text boundaries at least `3:1` against the final composed pixels. Standard and true 120% text are both reviewed without `SHRINK`.
- No Cocos files, package/build operations, WeChat operations, Git operations or remote writes are included in this plan.
- Because this workspace is not a Git repository and Git is not authorized, every normal commit checkpoint is replaced by an immutable SHA-256 approval snapshot. No task may create a repository or commit.

## 锁定目录结构

```text
design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/
  README.md
  STATUS.md
  ritual-manifest.json
  provenance.json
  HASHES.sha256
  references/
    approved-h5.json
  pages/
    scene_01_home_shot_001/
    scene_01_home_shot_002/
    scene_01_home_shot_003/
    scene_01_home_shot_004/
      source/response-layers/
      exports/states/
  ui/
    home-meal-ui-contract.json
    source/
    evidence/
  scripts/
    sharp-loader.mjs
    export-page.mjs
    compose-h4-states.mjs
    build-review-boards.mjs
    validate-page.mjs
    validate-package.mjs
    write-hashes.mjs
  tests/
    production-contract.test.mjs
    h4-state-contract.test.mjs
  evidence/
  reviews/

design-board/home-meal-ritual-v1-a/
  index.html
  styles.css
  app.js
  home-meal-story-model.mjs
  tests/home-meal-story-model.test.mjs
  evidence/
```

生产目录保存不可变的美术来源与证据；设计板目录只保存可见交互复合，不得反向成为美术来源。

---

### 任务 1：建立隔离生产容器与交叉校验管线

**Files:**
- Create every top-level production file and script listed under **Locked File Structure**.
- Reference without modifying: `design-system/formal-picturebook-fullframe-v1-a-home-f5-wide-room-v1-a-r1/exports/*/scene_01_home_shot_005.png`.
- Test: `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/tests/production-contract.test.mjs`.

**Interfaces:**
- Consumes: `{pageId, assetId, inputPath, candidateVersion, referenceHashes}`.
- Produces: `exportPage(...) -> {raw, master, exports, hashes, metadata}` and `validatePage(...) -> {status, checks, issues}`.
- `ritual-manifest.json` is the page/status index; `provenance.json` is the rights/authoring record. The validator must recompute and cross-check both, never trust one file’s own `PASS` string.

- [ ] **Step 1: Write the failing production-contract tests**

Create tests with the exact assertions below:

```js
assert.deepEqual(PAGE_IDS, [
  'scene_01_home_shot_001',
  'scene_01_home_shot_002',
  'scene_01_home_shot_003',
  'scene_01_home_shot_004',
  'scene_01_home_shot_005',
]);
assert.equal(ASSET_IDS.scene_01_home_shot_001, 'ART-PBOOK-HOME-001');
assert.equal(ASSET_IDS.scene_01_home_shot_004, 'ART-PBOOK-HOME-004');
assert.equal(H5_SHA256_390, '569a7b9b71d16d13ad311bdea9a29d6bc93a7dc68c99892faf8c416f38bc1c51');
assert.deepEqual(REQUIRED_EXPORTS, ['195x422', '360x800', '390x844', '430x932', '430x844-pressure']);
assert.equal(SAFE_BORDER, '#06265F');
assert.equal(MAX_GENERATIONS_PER_PAGE, 2);
```

- [ ] **Step 2: Run the tests and confirm the pipeline does not exist yet**

Run:

```bash
node --test design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/tests/production-contract.test.mjs
```

Expected: non-zero exit because the production contract module has not been created.

- [ ] **Step 3: Implement the manifest schema and deterministic exporter**

The manifest must contain this exact page identity map:

```json
{
  "scene_01_home_shot_001": "ART-PBOOK-HOME-001",
  "scene_01_home_shot_002": "ART-PBOOK-HOME-002",
  "scene_01_home_shot_003": "ART-PBOOK-HOME-003",
  "scene_01_home_shot_004": "ART-PBOOK-HOME-004",
  "scene_01_home_shot_005": "ART-PBOOK-HOME-005"
}
```

`export-page.mjs` 只接受合同内的精确 page ID、原始候选路径和 `r1`／`r2` 版本；它必须保留原始输入，把被接受母版标准化为 `780×1688` sRGB 8-bit 无损 PNG，导出五种尺寸，记录透明度／元数据，并永远不得写入 `cocos-project`。

- [ ] **Step 4: Implement provenance and plan-hash cross-validation**

`validate-page.mjs` and `validate-package.mjs` must recompute:

```text
prompt file hash
raw file hash
master file hash and metadata
all export hashes and dimensions
ritual-manifest ↔ provenance page ID/status/hash equality
current spec hash and approval-record hash
final execution-plan hash only after the plan stops changing
H5 canonical file hash
all permission flags = false except local Gate B design production
```

This closes the previous Batch 1 failure where manifest, provenance and plan hashes could drift while the validator still printed `PASS`.

- [ ] **Step 5: Run structure-only validation**

Run:

```bash
node --test design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/tests/*.test.mjs
node design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/validate-package.mjs --stage structure
```

Expected: tests pass; validator reports H1–H4 as `BLOCKED / NO ART` and H5 as `REFERENCE HASH PASS`, without claiming Gate B visual success.

### 任务 2：编写并冻结 H1“同一间屋”探针提示词

**Files:**
- Create: `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_001/prompt.md`.
- Create: `.../pages/scene_01_home_shot_001/candidate-manifest.json`.
- Modify: `ritual-manifest.json` and `provenance.json`.

**Interfaces:**
- Consumes: approved H5 wide-room image and approved Root R4 identity/outerwear reference.
- Produces: versioned prompt `HOME-H1-ARRIVAL-PROMPT-V1-A`, still blocked from generation until the user approves this production plan.

- [ ] **Step 1: Write the self-contained H1 prompt using this exact image request**

```text
Create one original full-bleed 390×844 portrait clean plate for a quiet wordless interactive picture book. This is HOME H1, the first frame just inside the already bright home.

Reference 1 fixes the same modest room geography: left threshold and wall hook, connected warm wall planes, right-side cold night window, continuous wooden floor, low dinner table and modest cabinets. Match those landmarks and the 32–35mm room axis closely enough that H1 and the approved H5 clearly read as the same room and near-same camera, but create a new H1 illustration rather than copying H5 pixels.

Reference 2 fixes the same anonymous adult and ordinary domestic cat identity and the mature B night-comic material. The unmistakably adult person has just entered at lower-left, rear or restrained rear-three-quarter view, wearing the same plain gray-blue unmarked outer layer seen outdoors. The ordinary dark blue-gray cat stands naturally at the adult’s right foot. The left hook is empty. The low table already holds the same dark kettle, exactly two cups, rice and soup, but the central shallow plate for the final warm-ochre hot dish is visibly empty or absent; do not show the final hot dish yet.

The entire ceiling, walls, floor, furniture, adult, cat and table are readable in stable broad honey-amber reflected light from the first frame. Preserve deep shadow only for form; no black corner, vignette, black-room reveal, Bloom or pure-white clipping. Keep the approved dry-brush comic ink, broken edges, restrained halftone and shared paper tooth. No face reveal, gender cue, relationship cue, extra person, party, brand, text, pseudo-text, logo, UI, page number, task marker or reward light.
```

- [ ] **Step 2: Run the prompt safety review**

Record binary `PASS/REVISE` for NSFW, minors, violence, real-person likeness, copyrighted characters/brands, living-artist imitation and sensitive data. Any `REVISE` blocks generation.

- [ ] **Step 3: Freeze prompt identity**

Record prompt SHA-256, exact reference paths/hashes, `generation_count=0`, `repair_count=0`, and status `PROMPT READY / GENERATION BLOCKED UNTIL PLAN APPROVAL`.

### 任务 3：先生成、标准化并审查 H1，其他页面继续停止

**Files:**
- Create under H1: `source/raw/*-imagegen-r1.png`, `source/masters/*-master-2x.png`, five `exports/*`, `evidence/*`, `reviews/*`, `approvals/*`.
- Modify: H1 manifest, package manifest and provenance.

**Interfaces:**
- Consumes: approved `HOME-H1-ARRIVAL-PROMPT-V1-A` and its two local references.
- Produces: one user-visible H1 candidate or a stopped `FAIL` package; never silently proceeds to H2.

- [ ] **Step 1: Generate exactly one H1 initial candidate**

Use the built-in image generation tool with the two local reference paths. Save the untouched raw output as `r1`; record tool/date/output hash. Do not add generated text or derive a standalone character asset.

- [ ] **Step 2: Export H1 through the deterministic pipeline**

Run:

```bash
node design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/export-page.mjs --page-id scene_01_home_shot_001 --input design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_001/source/raw/scene_01_home_shot_001-imagegen-r1.png --candidate-version r1
node design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/validate-page.mjs --page-id scene_01_home_shot_001
```

Expected: exact dimensions/metadata/hashes pass; visual status remains `REVIEW REQUIRED`.

- [ ] **Step 3: Build H1↔H5 continuity evidence**

Create 390 and 195 side-by-side boards plus an annotated landmark board for: left threshold, hook, table, right window, wall corner and floor direction. Add garment/inner-top/table-content check rows. Labels belong only to evidence, never to clean plates.

- [ ] **Step 4: Run owner review and a fresh independent zero-write review**

H1 fails on any of these P0/P1 conditions: different room; dark corners; adult or cat identity drift; coat already on hook; final hot dish already present; table lacks kettle/two cups/rice/soup; face/relationship revealed; generated text/brand; H1/H5 no longer read as near-same camera at 195.

If exactly one local visual defect can be repaired without changing accepted elements, create a targeted `r2` prompt in the preserve/change/do-not-change format and perform the one allowed repair. Never overwrite `r1`. If `r2` still has a P0/P1 issue, mark H1 `FAIL` and stop Gate B.

- [ ] **Step 5: Freeze and request H1 user approval**

Generate H1 `HASHES.pre-approval.sha256`, show the exact 390 image, H1/H5 comparison and 195 board, and request approval tied to candidate ID and 390 SHA-256. H2/H3 remain blocked until the user approves this same H1 file.

### 任务 4：仅在用户批准 H1 后生产 H2

**Files:**
- Create the full page package under `pages/scene_01_home_shot_002/`.
- Modify: package manifest and provenance.

**Interfaces:**
- Consumes: approved H1, canonical H5 and the H2 shot contract.
- Produces: H2 coat-hook close view with exact clothing continuity.

- [ ] **Step 1: Write H2 prompt with this exact image request**

```text
Create one original full-bleed 390×844 portrait clean plate for HOME H2, a 50–55mm rear-three-quarter medium close view at the same home’s left entry wall. Preserve the approved H1 room material, hook location, floor direction and warm-light direction. The same unmistakably adult anonymous person places the exact same plain gray-blue outer layer from H1 onto the exact left-wall hook that carries it in approved H5, revealing the same dark knitted inner top seen in H5. Keep hand, garment and hook as the clear action triangle. The same ordinary domestic cat walks past naturally on four paws at floor level. Retain enough doorway, wall and floor to locate the shot inside H1; do not reveal a face. Preserve mature broken dry-brush comic ink, restrained halftone and warm paper tooth. No bag, brand, wardrobe change, anthropomorphic cat help, task UI, text, pseudo-text, logo, reward cue or dark corner.
```

- [ ] **Step 2: Safety-review, generate one `r1`, export and validate**

Use approved H1 and canonical H5 as references. Record all hashes. Allow only one targeted `r2` repair under the same non-overwrite rule.

Run for the initial candidate:

```bash
node design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/export-page.mjs --page-id scene_01_home_shot_002 --input design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_002/source/raw/scene_01_home_shot_002-imagegen-r1.png --candidate-version r1
node design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/validate-page.mjs --page-id scene_01_home_shot_002
```

- [ ] **Step 3: Build the garment continuity strip**

At 390 and 195, compare H1 worn outer layer → H2 hanging action → H5 hanging result and H2 inner knit → H5 seated knit. Fail if shape/color/hook position or clothing identity changes.

- [ ] **Step 4: Stop on H2 P0/P1 before H3**

H3 generation is forbidden until H2 has owner and independent `P0=0 / P1=0` evidence.

### 任务 5：生产 H3，证明厨房确实属于同一间家

**Files:**
- Create the full page package under `pages/scene_01_home_shot_003/`.
- Modify: package manifest and provenance.

**Interfaces:**
- Consumes: accepted H1/H2, canonical H5 and the dish continuity contract.
- Produces: one connected-kitchen page, not a new house and not a cooking minigame.

- [ ] **Step 1: Write H3 prompt with this exact image request**

```text
Create one original full-bleed 390×844 portrait clean plate for HOME H3, a 35–40mm rear-side medium view in the connected kitchen zone of the same modest home. Preserve the approved H1/H5 wall and floor material, woodwork, room axis and broad honey-amber reflected-light direction. Keep at least one clearly readable doorway, wall corner or edge of the same low table in frame so the kitchen unmistakably belongs to the same home.

The same anonymous adult, now in the same dark knitted inner top, trousers and flat shoes, lifts a pot lid with one hand and uses the other to serve the final warm-ochre hot dish into the same shallow round plate seen at the center of approved H5. Hands, lid, pot and plate must be anatomically credible and form one simple action. The same ordinary cat stays naturally outside the hot cooking zone. Keep the room bright and readable; no theatrical dark kitchen. Preserve mature broken dry-brush comic ink, restrained halftone and paper tooth. No recipe, ingredient list, cutting steps, timer, progress, correct-answer cue, text, pseudo-text, brand, UI, face reveal, extra person or reward light.
```

- [ ] **Step 2: Safety-review, generate one `r1`, export and validate**

Use accepted H2 and canonical H5 as references. Allow only one targeted `r2` repair and never overwrite the first raw.

Run for the initial candidate:

```bash
node design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/export-page.mjs --page-id scene_01_home_shot_003 --input design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_003/source/raw/scene_01_home_shot_003-imagegen-r1.png --candidate-version r1
node design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/validate-page.mjs --page-id scene_01_home_shot_003
```

- [ ] **Step 3: Build spatial and food continuity evidence**

Create one annotated 390 board showing the retained main-room anchor, light direction and wall/floor material, and one dish strip showing H3 shallow plate → future H4 target → canonical H5 plate. H3 fails if it reads as another house or the dish cannot resolve to H5.

- [ ] **Step 4: Freeze H2 and H3 separately for user approval**

Create separate pre-approval manifests and separate 390 SHA-256 values. They may be displayed together, but the approval record must name both page IDs and hashes. H4 remains blocked until both are approved.

### 任务 6：生产 H4 clean plate 与非生成式反馈层

**Files:**
- Create the H4 full page package.
- Create: `pages/scene_01_home_shot_004/source/response-layers/ate.svg`.
- Create: `pages/scene_01_home_shot_004/source/response-layers/sipped.svg`.
- Create deterministic straight-alpha PNG exports for the two response layers and four composed review states.
- Test: `tests/h4-state-contract.test.mjs`.

**Interfaces:**
- Consumes: approved H3 and canonical H5.
- Produces: H4 `none`, `ate`, `sipped`, `both` states; all background pixels outside declared response ROIs remain identical to the H4 clean plate.

- [ ] **Step 1: Write H4 clean-plate prompt with this exact image request**

```text
Create one original full-bleed 390×844 portrait clean plate for HOME H4, a 55–65mm table medium-close view inside the same bright home. Preserve the approved H3 hot dish, shallow plate, adult inner knit, warm-light direction and B comic material; resolve the table, kettle, exactly two cups, rice, soup and final warm-ochre dish toward the canonical H5 arrangement. Keep the anonymous adult’s rear shoulder and one naturally resting hand visible without revealing the face. Keep the ordinary cat naturally at cushion or floor level. Give the central dish and one warm-water cup distinct, non-overlapping visual neighborhoods large enough for independent 44×44 touch regions with at least 8px between them. The frame must feel like quiet permission to eat or drink, not a task surface. No raised chopsticks, raised cup, chewing, swallowing, health effect, text, pseudo-text, logo, UI, progress, reward, glow ring or dark corner.
```

- [ ] **Step 2: Generate and approve the H4 clean plate before drawing states**

Safety-review, generate one `r1`, export and run owner/independent review. Use at most one targeted `r2` repair. Response-layer work is forbidden until the clean plate has `P0=0 / P1=0`.

Run for the initial candidate:

```bash
node design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/export-page.mjs --page-id scene_01_home_shot_004 --input design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_004/source/raw/scene_01_home_shot_004-imagegen-r1.png --candidate-version r1
node design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/validate-page.mjs --page-id scene_01_home_shot_004
```

- [ ] **Step 3: Write failing H4 state tests**

```js
assert.deepEqual(H4_STATES, ['none', 'ate', 'sipped', 'both']);
assert.equal(applyH4Action('none', 'eat'), 'ate');
assert.equal(applyH4Action('none', 'sip'), 'sipped');
assert.equal(applyH4Action('ate', 'eat'), 'ate');
assert.equal(applyH4Action('sipped', 'sip'), 'sipped');
assert.equal(applyH4Action('ate', 'sip'), 'both');
assert.equal(applyH4Action('sipped', 'eat'), 'both');
assert.equal(applyH4Action('both', 'eat'), 'both');
assert.equal(applyH4Action('both', 'sip'), 'both');
assert.equal(H4_RESPONSE_MS <= 180, true);
```

- [ ] **Step 4: Draw only the two editable response layers**

`ate.svg` changes only the central dish portion and chopsticks-to-bowl-rim result. `sipped.svg` changes only the cup waterline and small cup shift toward the adult. Export both to real straight-alpha RGBA PNG and verify `hasAlpha=true`, non-target pixels Alpha `0`, no checkerboard/background ghost and no generated content. The `both` state composites both sources; it is not a third independently invented image.

- [ ] **Step 5: Compose and validate the four states**

Run:

```bash
node design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/compose-h4-states.mjs
node --test design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/tests/h4-state-contract.test.mjs
node design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/validate-page.mjs --page-id scene_01_home_shot_004
```

Expected: four state images exist, ROIs and hashes are recorded, background outside the union ROI is pixel-identical, and neither action changes story/night completion data.

### 任务 7：设计独立中文 UI，同时避免把饭桌做成任务界面

**Files:**
- Create: `ui/home-meal-ui-contract.json`.
- Create editable UI sources under `ui/source/` only when a backing wash is needed.
- Create standard/120% composite evidence for H1, H2 and all H4 states.

**Interfaces:**
- Consumes: accepted page exports.
- Produces: editable text/layout/hotspot contract for `放下外衣`, the one-time H2 helper, `吃一点` and `喝口温水`.

- [ ] **Step 1: Encode exact copy, timing and hierarchy**

```json
{
  "h1": { "label": "放下外衣", "showAfterMs": 500 },
  "h2": { "helper": "轻轻碰一下，故事会往前走。", "showAfterIdleMs": 2500, "maxShows": 1 },
  "h4": {
    "showAfterMs": 300,
    "actions": [
      { "id": "eat", "label": "吃一点" },
      { "id": "sip", "label": "喝口温水" }
    ]
  }
}
```

Use the established quiet Kaiti-style hierarchy for the design board: H1/H4 standard `16px`, H2 helper `14px`, true 120% values `19.2px` and `16.8px`. Use local composition sampling to choose final dark-warm ink values that meet `4.5:1`; do not assume a raw hex passes. No boxed card, checkmark, numbered step, pulsing halo or selected reward state.

- [ ] **Step 2: Place object-anchored labels and non-overlapping hotspots**

H1 label anchors near the empty hook without covering the adult. H4 labels anchor beside the dish and cup; each hotspot is at least `44×44`, their edges remain at least `8px` apart, and tapping outside them remains the page-advance action. If 120% text cannot fit cleanly beside the objects, use a restrained irregular warm-paper underprint local to each label rather than a full-width task tray.

- [ ] **Step 3: Produce default, pressed, activated and reduced-motion evidence**

Pressed feedback must appear within `80–150ms` without moving layout bounds. Activated feedback is the H4 static state crossfade, not a success toast. Reduced motion has zero translation/scale and uses the same `≤180ms` opacity response. Static/silent views must preserve the full causal meaning.

- [ ] **Step 4: Run binary UI review**

Fail if the page reads as a checklist, order form, cooking task or reward screen; if labels obscure food/cat/person; if 120% uses `SHRINK`; if touch zones overlap; or if state is conveyed only by sound/color.

### 任务 8：建立隔离的五页浏览器板与流畅转场证据

**Files:**
- Create all files under `design-board/home-meal-ritual-v1-a/` from **Locked File Structure**.
- Test: `design-board/home-meal-ritual-v1-a/tests/home-meal-story-model.test.mjs`.

**Interfaces:**
- Consumes: approved H1–H4 review exports, canonical H5 exports and UI contract.
- Produces: a local browser-only Gate B board; it does not modify the current Cocos application flow.

- [ ] **Step 1: Write failing model tests**

```js
assert.equal(createHomeMealState().pageIndex, 0);
assert.equal(createHomeMealState().h4State, 'none');
assert.equal(advanceHomeMeal(createHomeMealState()).pageIndex, 1);
assert.equal(resolvePageTransition(0, false).durationMs, 260);
assert.equal(resolvePageTransition(3, false).durationMs, 420);
assert.equal(resolvePageTransition(0, true).durationMs, 150);
assert.equal(resolvePageTransition(0, true).transform, 'none');
assert.equal(resolveH4Action({ h4State: 'none' }, 'eat').pageIndex, 3);
assert.equal(resolveH4Action({ h4State: 'none' }, 'eat').h4State, 'ate');
assert.equal(resolveH4Action({ h4State: 'none' }, 'sip').pageIndex, 3);
assert.equal(resolveH4Action({ h4State: 'none' }, 'sip').h4State, 'sipped');
assert.equal(resolveH4BackgroundTap({ pageIndex: 3 }).pageIndex, 4);
```

- [ ] **Step 2: Implement persistent dual-image crossfades**

Preload the next page, keep current and next images mounted, crossfade opacity only, lock repeat input until transition completion and retain the current complete page if loading fails. Do not resize, pan, zoom or create black/white/loading frames.

- [ ] **Step 3: Bind H5 by canonical path and hash**

The board must read H5 from the approved candidate directory and assert its SHA-256 before opening. It may overlay later UI for review but must not create a recolored/cropped H5 derivative as the final story page.

- [ ] **Step 4: Capture the complete visible-state matrix**

Capture H1–H5 at `360×800`, `390×844`, `430×932` and `430×844-pressure`; H1/H2/H4 standard and 120% text; H4 `none/ate/sipped/both`; reduced-motion transitions; load failure/retry; and H5 with no overlay/base-pixel change. Record exact screenshot paths and viewport sizes.

### 任务 9：冻结最终 Gate B 证据并请求同一文件视觉批准

**Files:**
- Create final 5-up 390 board, 5-up 195 board, H1↔H5 landmark overlay, garment strip, kitchen-anchor board, H4 2×2 state board, owner review and independent reviews under production `evidence/` and `reviews/`.
- Modify: `assets/asset-register.csv`, `docs/ASSET-PROVENANCE.md`, `docs/HOME-MEAL-RITUAL-V1-A-TRACEABILITY.md`, `docs/PROJECT-MEMORY.md`, `.agents/skills/tonight-design-gate/references/current-contract.md`.

**Interfaces:**
- Consumes: all individually approved page/state files.
- Produces: one final hash-frozen Gate B package that is still not a Cocos/runtime authorization.

- [ ] **Step 1: Run deterministic validation and source-boundary scans**

Run:

```bash
node --test design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/tests/*.test.mjs
node --test design-board/home-meal-ritual-v1-a/tests/*.test.mjs
node design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/validate-package.mjs --stage final
npm run verify:docs
```

Expected: all commands pass; H5 canonical hash matches; no clean plate contains generated text; all permissions for Cocos/build/WeChat/Git remain false.

- [ ] **Step 2: Run owner review and two independent zero-write reviews**

One review owns visual/continuity and one owns UI/accessibility. Any reviewer write invalidates that review and requires a fresh reviewer. Any P0/P1 stops Gate B; P2 is recorded with owner and deadline.

- [ ] **Step 3: Freeze hashes only after reports stop changing**

Run:

```bash
node design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/write-hashes.mjs
shasum -a 256 -c design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/HASHES.sha256
```

Then recompute the plan SHA-256 and bind it in `ritual-manifest.json`; rerun package validation and rewrite the hash list once. The final validator must reject any later plan/provenance/manifest drift.

- [ ] **Step 4: Present exact visual evidence to the user**

Show the five-page 390 board, 195 board, H4 four-state board and H1/H5 same-room comparison. Request approval that names the final package ID, hash-manifest SHA-256 and approved scope. Do not describe Gate B as `PASS` before the user approves that same frozen package.

- [ ] **Step 5: Stop before Cocos**

After final Gate B approval, write a separate Gate C/D implementation plan for `HomeArrivalStory`, transition/runtime assets and progress isolation. This plan never edits or builds Cocos and never authorizes WeChat.

## 计划自检

- Spec coverage: Tasks 1–9 cover H1–H5 order, room/clothing/food continuity, H4 optional states, independent UI, exact transitions, H5 pixel identity, provenance, similarity, five-size exports, reduced motion, 120% text and final evidence.
- Prompt safety: all four page requests exclude existing IP, brands, real-person likeness, living-artist imitation, generated text and sensitive data.
- Scope: production is serial and independently rejectable; H1 is the high-risk pilot, H2/H3 are the continuity pair, H4 owns response/UI complexity, and H5 is immutable.
- Type/interface consistency: page IDs, asset IDs, H4 state names, duration values, dimensions, safe-border color and hash identities are the same in every task.
- 占位符扫描：计划内不存在未填写占位符；命令均绑定精确页面与路径。
- Permission check: no Cocos, build, WeChat, release, Git or remote-write step exists.

## 执行交接

用户已指定由主任务负责人分发员工，因此执行默认采用 **Subagent-Driven**：每个生产阶段由一名新的视觉员工负责，每个 Gate 再由新的零写入审查员工复核。只有用户明确改变偏好时才切换为主任务单线执行。

用户批准本计划后，只授权任务 1 与任务 2–3 的 H1 单帧探针。H2/H3、H4 与最终浏览器板仍分别位于自己的用户可见批准停止线之后。
