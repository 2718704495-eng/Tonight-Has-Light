# Task 6 brief — HOME H3 prompt-ready package

## 位置与授权

- 绑定计划：`docs/superpowers/plans/2026-08-30-home-meal-ritual-gate-b.md` Task 5。
- 用户已批准 H1 并授权 H2→H3 串行生产：`docs/HOME-H1-ARRIVAL-V1-A-R2-APPROVAL.md`。
- H2 `home-meal-h2-hang-outerwear-v1-a-r1` 已取得负责人及全新独立零写入审查 `P0=0 / P1=0 / P2=0`，因此 H3 内部串行停止线已解锁。
- 本 brief 只准备 H3 prompt、安全审查与生成前候选清单；生成、导出、package manifest/provenance 和视觉审查由主负责人后续执行。
- 不得触碰 H1、H2、H4、H5 像素；不得运行 imagegen、Cocos、build、WeChat、Git 或远程操作。

## 所有权

只创建或修改：

- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_003/prompt.md`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_003/candidate-manifest.json`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_003/reviews/PROMPT-SAFETY.md`
- `.superpowers/sdd/2026-08-30-home-meal-ritual-gate-b/task-6-report.md`

## 精确 H3 图像请求

```text
Create one original full-bleed 390×844 portrait clean plate for HOME H3, a 35–40mm rear-side medium view in the connected kitchen zone of the same modest home. Preserve the approved H1/H5 wall and floor material, woodwork, room axis and broad honey-amber reflected-light direction. Keep at least one clearly readable doorway, wall corner or edge of the same low table in frame so the kitchen unmistakably belongs to the same home.

The same anonymous adult, now in the same dark knitted inner top, trousers and flat shoes, lifts a pot lid with one hand and uses the other to serve the final warm-ochre hot dish into the same shallow round plate seen at the center of approved H5. Hands, lid, pot and plate must be anatomically credible and form one simple action. The same ordinary cat stays naturally outside the hot cooking zone. Keep the room bright and readable; no theatrical dark kitchen. Preserve mature broken dry-brush comic ink, restrained halftone and paper tooth. No recipe, ingredient list, cutting steps, timer, progress, correct-answer cue, text, pseudo-text, brand, UI, face reveal, extra person or reward light.
```

## Prompt contract

- Prompt ID：`HOME-H3-SERVE-HOT-DISH-PROMPT-V1-A`。
- Use case：`illustration-story`。
- Asset type：original full-frame interactive picture-book clean plate。
- Image 1：H2 r1 390，固定同一成年人、深色针织内搭、裤子、平底鞋、普通家猫、墙地材质与暖光连续。
- Image 2：批准 H5 390，固定主屋轴线、木作、墙地材质、低桌边缘、中央浅圆盘及最终暖赭热菜结果。
- 输出必须是单张无字全幅页，不是联系表、多格漫画、食谱或烹饪小游戏画面。

## Safety review

对 NSFW、minors、violence/gore、real-person likeness、copyrighted characters/brands、living-artist imitation、hate/harassment、sensitive data 分别记录 PASS/REVISE；任一 REVISE 阻断生成。

## Candidate manifest

至少记录：contract/page/asset/candidate ID、source property、prompt path/hash、两张参考 path/hash/role、`generationCount=0`、`repairCount=0`、`maxGenerations=2`、H1 用户批准记录 path/hash、H2 负责人及独立审查 path/hash/decision、状态 `PROMPT READY / GENERATION AUTHORIZED`、权限仅 H3 本地生成，H4/Cocos/build/WeChat/upload/release/Git/remote write 均 false。

## 交付

用 `apply_patch` 写文件；计算 prompt、安全审查和候选清单 SHA-256；解析 JSON；把执行摘要、哈希、未执行项和自审写入 report。你不是唯一员工，不得覆盖他人并发修改，不得派生子代理。
