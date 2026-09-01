# FORMAL-OUTDOOR-ART-PILOT-V1-B 需求—设计—实现追踪

> 当前 Gate：B（正式静态分层资产）  
> 总状态：`ALIGNED / SPEC APPROVED / SINGLE-FRAME VISUAL PASS / TRUE-ALPHA PROBE FAIL / FORMAL PACKAGE BLOCKED`  
> 可进入 Cocos：否

| ID | 当前需求 | 来源/决策日期 | 被替代项 | 静态视觉证据 | 动效/交互证据 | 代码消费者 | QA 证据 | 状态 | 负责人/下一步 |
|---|---|---|---|---|---|---|---|---|---|
| FAP-01 | 允许 AI 辅助制作一张正式分层草坡入口样板 | 用户批准 B 与规格 / 2026-08-29 | ImageGen 永远只能探索的绝对限制 | R1 母版候选已生成并通过负责人预检 | 不适用 | 无 | 路线批准、规格批准、实施计划、`master-preflight.md`、`provenance.json` | `ALIGNED` | 主任务；只生产单帧样板 |
| FAP-02 | 不把既有探索图直接切片升格 | 批准记录 / 2026-08-29 | 直接复用 r3 联系表、B01 参考或 0.4.7 | 新生成母版、输入／输出哈希与并排板 | 不适用 | 无 | provenance、像素来源检查 | `ALIGNED` | 美术；分层时继续核对来源 |
| FAP-03 | 390×844 深靛夜漫画草坡入口保持批准观感 | B 风格、三路绘本合同 | 程序 SVG、几何纸片画法 | 390×844 与 195×422 flatten 负责人预检通过 | 画中邀请仅独立预览 | 无 | `master-preflight.md` 与全新只读 `INDEPENDENT-REVIEW.md` 均为单帧视觉 PASS；用户同哈希可见批准待完成 | `ALIGNED` | 主任务；向用户展示冻结母版，不自行修图 |
| FAP-04 | 成人、普通猫、银河、门、两花可编辑分层 | 角色／视觉 bible | 单张扁平 PNG、低质 procedural ORA | 首个 `10_adult_body` 真 Alpha 探针失败；未制作 ORA／manifest | 不适用 | 未来 Sprite/Atlas；本轮无代码 | `evidence/extraction-probes/README.md`：返回为 RGB 棋盘格且 `hasAlpha=false` | `FAIL / BLOCKED` | 主任务；按规格停止其余 19 层，等待真实图层工具或新合同 |
| FAP-05 | UI 中文、热区和后续流星不烘焙进插画 | 三路互动与 finale 合同 | 生成文字、图片内按钮、CSS 流星升格 | clean plate＋独立 overlay 预览 | 1.5s 邀请只作后续合同输入 | 未来 UI 层；本轮无代码 | clean plate 像素检查 | `ALIGNED` | 主任务保持边界 |
| FAP-06 | 不越权进入 Cocos／微信／Git | 项目 AGENTS 与本批准 | 历史临时体验包例外 | 无 | 无 | 无 | 文件路径与构建树只读检查 | `ALIGNED` | 主任务；等待新的 Gate 授权 |

## Gate 结论

- 当前 Gate：B。
- 总状态：`ALIGNED`；R1 母版视觉预检通过，但首个真 Alpha 分层探针已失败，正式分层包依规格停止并保持 `BLOCKED`。
- P0：无当前基线分叉。
- P1：现有 ImageGen 返回无 Alpha 的 RGB 棋盘格，不能形成规格要求的真实透明层；在真实图层编辑能力或新资产合同到位前，ORA／manifest／重建证据不可生成。
- P2：猫比例处于普通家猫可接受上沿，后续不得继续放大；暖门未来热区与邀请文字必须保持天空第一的层级。
- 可进入下一 Gate：否。
- 当前证据：[`FORMAL-OUTDOOR-ART-PILOT-V1-B-APPROVAL.md`](./FORMAL-OUTDOOR-ART-PILOT-V1-B-APPROVAL.md)、[`FORMAL-OUTDOOR-ART-PILOT-V1-B-SPEC-APPROVAL.md`](./FORMAL-OUTDOOR-ART-PILOT-V1-B-SPEC-APPROVAL.md)、[`2026-08-29-ai-assisted-formal-layered-art-design.md`](./superpowers/specs/2026-08-29-ai-assisted-formal-layered-art-design.md)、[`2026-08-29-formal-outdoor-art-pilot-v1-b.md`](./superpowers/plans/2026-08-29-formal-outdoor-art-pilot-v1-b.md)、`design-system/formal-outdoor-art-pilot-v1-b-r1/evidence/master-preflight.md`、`evidence/INDEPENDENT-REVIEW.md`、`provenance.json`、`STATUS.md` 与 `evidence/extraction-probes/README.md`。候选 `HASHES.sha256` 自身 SHA-256 为 `500d4b07e2978318f3e59118cd1a8ad497ceed94289ed2e068b3a4539a43d22b`，14/14 复算通过。
- 主任务裁决：规格已获用户确认；R1 单帧母版可见预检通过，决定不消耗唯一一次定向修图机会。首个真 Alpha 探针失败后按批准规格停止，不继续量产其余 19 层，不使用自动抠图或隐藏 flatten 兜底；不得扩产或交 Cocos。
