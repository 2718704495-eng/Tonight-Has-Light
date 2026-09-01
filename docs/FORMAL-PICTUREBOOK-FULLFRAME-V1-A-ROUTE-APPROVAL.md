# FORMAL-PICTUREBOOK-FULLFRAME-V1-A 路线批准记录

> 日期：2026-08-29  
> 用户原话：`批准 R1 单帧视觉；改用全幅正式插画页＋独立 UI/流星效果层。`
> 后续详细规格批准：`批准 FORMAL-PICTUREBOOK-FULLFRAME-V1-A 规格，开始 Batch 1`

## 1. 批准身份

- 新路线 ID：`FORMAL-PICTUREBOOK-FULLFRAME-V1-A`。
- 被批准的 R1 母版：`design-system/formal-outdoor-art-pilot-v1-b-r1/source/root_night_slope_v1-master-2x.png`。
- R1 母版 SHA-256：`5c84ce815ba011cd9be570889c768573e80c3d55d6b59fb2bd211301f86c74e3`。
- R1 390×844 预览 SHA-256：`e5cc6cfe263bab1f7152ca50336ddbd452f0cfabe635e469c1e1ccf310d1094c`。
- R1 195×422 预览 SHA-256：`b4dfe6f466bc1912046be32901b682e188d876f2067f592b62b98bf595a4d1eb`。
- R1 候选清单自身 SHA-256：`500d4b07e2978318f3e59118cd1a8ad497ceed94289ed2e068b3a4539a43d22b`，14/14 复算通过。
- 新详细设计规格：[`2026-08-29-formal-picturebook-fullframe-design.md`](./superpowers/specs/2026-08-29-formal-picturebook-fullframe-design.md)。
- 规格 SHA-256：`69db50589d6658e9397f27013e658430d6457aec1c1cea316fd7915f59c11663`。

## 2. 本次已批准

1. R1 单帧视觉作为新正式路线的根页视觉基准。
2. 正式故事画面的资产单元改为“每页一张全幅 clean plate”。
3. 中文、热区、提示与选择保持独立 UI 层。
4. 星空 F5 的一颗流星保持独立效果层，F5 clean plate 不烘焙流星或文案。
5. 原 20 层反向拆分要求被新路线替代；旧真 Alpha 探针失败继续保留为历史证据和禁止伪分层的停止线。

## 3. 本次没有批准

- 详细页面规格、批次和验收条款已在后续批准中通过；批准记录见 [`FORMAL-PICTUREBOOK-FULLFRAME-V1-A-SPEC-APPROVAL.md`](./FORMAL-PICTUREBOOK-FULLFRAME-V1-A-SPEC-APPROVAL.md)。
- 只批准 Batch 1 的根页登记、星空 F5 和回家 F5；其余 13 张新插画仍未批准。
- 未批准把 R1 放进 Cocos、微信包或任何远端构建。
- 未批准修改 Cocos、构建、微信 preview／upload、体验版设置、提审或发布。
- 未批准 Git 提交、推送、PR 或远程资源修改。
- 未把历史探索图、联系表、`0.4.6` 或 `0.4.7` 资产升格为正式资产。

## 4. 被替代项的处理

`FORMAL-OUTDOOR-ART-PILOT-V1-B` 的原规格、探针、失败输出与审查证据保留，不删除、不改写。其状态仍是：

`SINGLE-FRAME VISUAL PASS / TRUE-ALPHA EXTRACTION PROBE FAIL / 20-LAYER PACKAGE STOPPED`

这不再阻止新全幅路线编写规格，但也不能被引用为新路线已完成生产或运行时验证。

## 5. 下一停止线

主任务按已批准详细规格和 Batch 1 实施计划逐张制图。三页没有共同通过负责人、独立只读审查和用户对同一文件／哈希的可见批准前，不进入下一批或 Cocos。
