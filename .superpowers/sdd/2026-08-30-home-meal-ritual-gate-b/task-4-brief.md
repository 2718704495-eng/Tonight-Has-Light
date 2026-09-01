# Task 4 brief — HOME H2 prompt-ready package

## 位置与授权

- 绑定计划：`docs/superpowers/plans/2026-08-30-home-meal-ritual-gate-b.md` Task 4。
- 用户已批准 H1 同一文件：`docs/HOME-H1-ARRIVAL-V1-A-R2-APPROVAL.md`。
- 本 brief 只准备 H2 prompt、安全审查与生成前候选清单；生成、导出、包 manifest/provenance 和视觉审查由主负责人后续执行。
- 不得触碰 H1、H3、H4、H5 像素；不得运行 imagegen、Cocos、build、WeChat、Git 或远端操作。

## 所有权

只创建或修改：

- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_002/prompt.md`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_002/candidate-manifest.json`
- `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_002/reviews/PROMPT-SAFETY.md`
- `.superpowers/sdd/2026-08-30-home-meal-ritual-gate-b/task-4-report.md`

## 精确 H2 图像请求

```text
Create one original full-bleed 390×844 portrait clean plate for HOME H2, a 50–55mm rear-three-quarter medium close view at the same home’s left entry wall. Preserve the approved H1 room material, hook location, floor direction and warm-light direction. The same unmistakably adult anonymous person places the exact same plain gray-blue outer layer from H1 onto the exact left-wall hook that carries it in approved H5, revealing the same dark knitted inner top seen in H5. Keep hand, garment and hook as the clear action triangle. The same ordinary domestic cat walks past naturally on four paws at floor level. Retain enough doorway, wall and floor to locate the shot inside H1; do not reveal a face. Preserve mature broken dry-brush comic ink, restrained halftone and warm paper tooth. No bag, brand, wardrobe change, anthropomorphic cat help, task UI, text, pseudo-text, logo, reward cue or dark corner.
```

## Prompt contract

- Prompt ID：`HOME-H2-HANG-OUTERWEAR-PROMPT-V1-A`。
- Use case：`illustration-story`。
- Asset type：original full-frame interactive picture-book clean plate。
- Image 1：批准 H1 390，固定同一成年人、灰蓝外衣、猫、左门槛／挂钩位置、墙地材质与暖光方向。
- Image 2：批准 H5 390，固定外衣挂起结果、深色针织内搭、同一左挂钩与房间完成态。
- 输出必须是单张无字全幅页，不是联系表、多格漫画或透明层。

## Safety review

对 NSFW、minors、violence/gore、real-person likeness、copyrighted characters/brands、living-artist imitation、hate/harassment、sensitive data 分别记录 PASS/REVISE；任一 REVISE 阻断生成。

## Candidate manifest

至少记录：contract/page/asset/candidate ID、source property、prompt path/hash、两张参考 path/hash/role、`generationCount=0`、`repairCount=0`、`maxGenerations=2`、H1 用户批准记录 path/hash、状态 `PROMPT READY / GENERATION AUTHORIZED`、权限仅 H2 本地生成，H3/H4/Cocos/build/WeChat/upload/release/Git/remote write 均 false。

## 交付

用 `apply_patch` 写文件；计算 prompt、安全审查和候选清单 SHA-256；解析 JSON；把执行摘要、哈希、未执行项和自审写入 report。你不是唯一员工，不得覆盖他人并发修改，不得派生子代理。

