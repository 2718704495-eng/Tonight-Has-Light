# FORMAL-PICTUREBOOK-FULLFRAME-V1-A 需求—视觉—资产追踪

> 日期：2026-08-29  
> 当前总状态：`ALIGNED / SPEC APPROVED / BATCH 1 READY FOR USER VISUAL REVIEW / R1 USER VISUAL PASS / NO COCOS / NO BUILD / NO WECHAT / NO GIT`

## 1. 身份

- 路线批准记录：[`FORMAL-PICTUREBOOK-FULLFRAME-V1-A-ROUTE-APPROVAL.md`](./FORMAL-PICTUREBOOK-FULLFRAME-V1-A-ROUTE-APPROVAL.md)
- 路线批准记录 SHA-256：`0a8f955e2218cc11dc749ee3af90bace76c53045341a16db64e3f5419065a299`
- 详细规格：[`2026-08-29-formal-picturebook-fullframe-design.md`](./superpowers/specs/2026-08-29-formal-picturebook-fullframe-design.md)
- 详细规格 SHA-256：`69db50589d6658e9397f27013e658430d6457aec1c1cea316fd7915f59c11663`
- 详细规格批准记录：[`FORMAL-PICTUREBOOK-FULLFRAME-V1-A-SPEC-APPROVAL.md`](./FORMAL-PICTUREBOOK-FULLFRAME-V1-A-SPEC-APPROVAL.md)
- Batch 1 实施计划：[`2026-08-29-formal-picturebook-fullframe-batch1.md`](./superpowers/plans/2026-08-29-formal-picturebook-fullframe-batch1.md)
- Batch 1 冻结清单：`design-system/formal-picturebook-fullframe-v1-a-batch1/HASHES.sha256`；清单自身 SHA-256：`866adec9f54e9f065875deb933884bfc0a58e0b5d8043cab97c6a5608bf7cf49`
- R1 正式候选母版 SHA-256：`5c84ce815ba011cd9be570889c768573e80c3d55d6b59fb2bd211301f86c74e3`

## 2. 追踪表

| 项目 | 用户／合同来源 | 新路线决定 | 当前证据 | 状态 |
|---|---|---|---|---|
| R1 单帧视觉 | 用户本次原话 | R1 是新路线根页视觉基准，不重新生成 | R1 母版、390／195 预览、独立复核、用户批准原话 | `PASS` |
| 正式页面形态 | 用户本次原话 | 每页一张正式全幅 clean plate | 详细规格 §2、§4 | `ALIGNED` |
| 旧 20 层方案 | 真 Alpha 探针失败＋用户改路线 | 20 层反向拆分停止；不得伪分层 | 探针 `hasAlpha=false`、旧 STATUS | `FAIL`（历史方案） |
| 独立 UI | 三路绘本、终章合同 | 中文、热区、提示、选择不进插画 | 详细规格 §4.2；现有浏览器板证明模型可行 | `ALIGNED` |
| 独立流星 | `STARGAZE-SKY-FINALE-V1-A` | 仅绑定星空 F5，一颗、一次、独立覆盖 | R2 可见批准；详细规格 §4.3 | `PASS`（可见合同） |
| 三路逐页故事 | `OUTDOOR-PICTUREBOOK-BRANCH-V1-A` | 根页＋三支线各五页，点击翻页 | 分镜 YAML、浏览器板 | `PASS`（需求合同） |
| 全幅正式页数量 | 分镜项目 | 根页 1＋支线 15，共 16 页 | 详细规格 §5 | `ALIGNED` |
| 第一生产批 | 用户明确批准规格并要求开始 | 根页、星空 F5、回家 F5，最多三张 | Batch 1 候选、五档导出、负责人审查、全新独立零写入复核、40 项哈希冻结 | `READY FOR USER VISUAL REVIEW` |
| 风格与连续性 | B 夜漫画＋角色／场景圣经 | 深靛漫画、成人＋家猫、同一小屋和天空地理 | 详细规格 §3、§6 | `ALIGNED` |
| 适配 | 项目质量合同 | 390 基准；360／430／压力态 SHOW_ALL；安全边 `#06265F` | Batch 1 五档导出与 validate-batch1 | `ALIGNED`（待用户视觉审查） |
| 来源与权利 | 项目资产合同 | `ai-assisted-formal-fullframe` 如实登记，逐页相似性审查 | `batch-manifest.json`、`provenance.json`、资产台账 | `ALIGNED`（待用户视觉批准） |
| 包体与内存 | 微信小游戏约束 | Batch 1 后先测，不把 16 张 2× PNG 原样默认入包 | 详细规格 §12 | `BLOCKED`（未进入实现 Gate） |
| Cocos／微信 | Gate 顺序与权限 | 本次不授权实现、构建或上传 | 路线批准记录 §3 | `BLOCKED` |
| Git／远端 | 项目权限规则 | 本次不授权提交、推送或远端修改 | 路线批准记录 §3 | `BLOCKED` |

## 3. 明确替代关系

| 被替代项 | 替代项 | 处理 |
|---|---|---|
| 每张插画必须有 20 个真实语义层和 ORA | 每页一张完整正式 clean plate；UI／流星独立 | 旧规格保留为历史，不再作为新页 Gate |
| 全幅 clean plate 必须具有可用透明背景 | 全幅页可为 RGB 或全不透明 RGBA | 真 Alpha 只要求于透明效果层 |
| 一次性批量生产全部页面 | Batch 1 最多三张，逐张 Gate | 任一失败立即停止 |
| 探索图直接入包 | 新正式页逐张生成、登记、审查和批准 | 历史像素禁止复用 |

## 4. 下一次状态变化条件

详细规格已获批准，实施计划已经完成，Batch 1 三页候选已完成来源、适配、负责人审查、全新独立零写入复核和 40 项哈希冻结，当前为 `READY FOR USER VISUAL REVIEW`。只有用户批准清单自身 SHA-256 为 `866adec9f54e9f065875deb933884bfc0a58e0b5d8043cab97c6a5608bf7cf49` 的同一候选，Batch 1 才能记 `PASS`。Cocos、微信与 Git 仍各自需要独立授权。
