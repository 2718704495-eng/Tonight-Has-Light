# FORMAL-PICTUREBOOK-FULLFRAME-V1-A 详细规格批准记录

> 日期：2026-08-29  
> 用户原话：`批准 FORMAL-PICTUREBOOK-FULLFRAME-V1-A 规格，开始 Batch 1`

## 1. 获批输入

- 详细规格：[`2026-08-29-formal-picturebook-fullframe-design.md`](./superpowers/specs/2026-08-29-formal-picturebook-fullframe-design.md)
- 用户批准时规格 SHA-256：`69db50589d6658e9397f27013e658430d6457aec1c1cea316fd7915f59c11663`
- 根页视觉基准：`design-system/formal-outdoor-art-pilot-v1-b-r1/source/root_night_slope_v1-master-2x.png`
- 根页视觉基准 SHA-256：`5c84ce815ba011cd9be570889c768573e80c3d55d6b59fb2bd211301f86c74e3`

## 2. 本次批准范围

1. `FORMAL-PICTUREBOOK-FULLFRAME-V1-A` 的页面、视觉、连续性、适配、来源和 Gate B 验收条款由待复核转为已批准。
2. 启动 Batch 1，且只生产以下三页同一候选：
   - 既有 `root_night_slope_v1`，只登记和导出，不重生成、不修改冻结源；
   - `scene_02_stargaze_shot_005` 全幅无字 clean plate；
   - `scene_01_home_shot_005` 全幅无字 clean plate。
3. 两张新页可使用规格内的 `ai-assisted-formal-fullframe` 有边界例外；每页必须记录完整提示词、模型／工具、参考边界、原始输出、归一化、哈希和独立审查。
4. 每张新页只允许一次初始生成和最多一次定向修复；任一 P0／P1 视觉问题未关闭即停止 Batch 1。
5. 中文、热区、选择和 F5 单颗流星继续作为独立可编辑层，不得烘焙进插画。

## 3. 本次仍未批准

- 不批准生产 Batch 2 或其余 13 张新页。
- 不批准把 Batch 1 候选直接写成用户视觉 `PASS`；负责人和独立审查通过后仍须展示给用户确认同一文件和哈希。
- 不批准修改 Cocos、Scene、Prefab、资源包、状态机或正式运行时。
- 不批准 Cocos／微信构建、preview、upload、体验版设置、提审或发布。
- 不批准 Git 提交、推送、PR 或其他远端写操作。

## 4. 当前停止线

Batch 1 的当前状态只能是 `ART PRODUCTION IN PROGRESS` 或 `READY FOR USER VISUAL REVIEW`。三页没有共同通过用户可见批准前，不得开始下一批，也不得进入 Cocos。
