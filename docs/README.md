# 《今夜有灯》交付文档

> 版本：v1.0  
> 适用范围：Gate B 视觉设计、Gate C 高保真竖切片、Gate D 正式开发  
> 产品基线：项目根 `AGENTS.md`、本目录 `PROJECT-MEMORY.md` 及其未替代的角色、五夜、资产与质量约束

本目录是设计、编剧、美术、音频、开发和测试共用的执行基线。发生冲突时，优先级为：用户最新明确决定 → 产品基线 → 本目录。

当前户外 V7 决策与任务协作方式已统一记录在 [PROJECT-MEMORY.md](./PROJECT-MEMORY.md)。它替代旧文档中“打开即进入室内”和“软团兽＋灯灵”的首场景描述；未冲突的五夜结构、资产与质量要求继续有效。

## 使用导航

| 文档 | 主要读者 | 作用 |
|---|---|---|
| [PROJECT-MEMORY.md](./PROJECT-MEMORY.md) | 全员 | 当前目标、首场景、Gate、Skill 路由与已替代项 |
| [SCENE-01-NIGHT-BREEZE-BRIEF.md](./SCENE-01-NIGHT-BREEZE-BRIEF.md) | 需求、UI、动效、开发 | 第一场景的 0–20 秒节奏、可选互动、风与门 |
| [GATE-D-MAINFLOW-V3.md](./GATE-D-MAINFLOW-V3.md) | 总控、开发、QA | 当前唯一主功能本地候选、验证和外部停止线 |
| [GATE-D-MAINFLOW-V4-PHONE-PREVIEW.md](./GATE-D-MAINFLOW-V4-PHONE-PREVIEW.md) | 总控、开发、QA | 当前暖屋手机试玩候选、一次性预览授权、资源隔离、包体与二维码证据 |
| [FORMAL-UI-V1-2-A-APPROVAL.md](./FORMAL-UI-V1-2-A-APPROVAL.md) | 全员 | 用户批准“灯一直为你亮着”的版本、参考图 SHA-256、批准范围与生产停止线 |
| [FORMAL-UI-PROPOSAL-V1-2.md](./FORMAL-UI-PROPOSAL-V1-2.md) | 用户、UI、美术、开发、QA | 当前明亮暖家、已批准 A、晚饭语义、交互影响与正式母版边界 |
| [INDOOR-N01-CORE-PROPOSAL-V1.md](./INDOOR-N01-CORE-PROPOSAL-V1.md) | 用户、需求、UI、开发、QA | A 到家方式下替代旧拖光玩法的三案与推荐“壶盖轻响” |
| [INDOOR-N01-PROTOTYPE-V1.md](./INDOOR-N01-PROTOTYPE-V1.md) | 用户、UI、开发、QA | 用户批准的“壶盖轻响”可丢弃本地浏览器互动样片边界、验收证据与禁止入包范围 |
| [FORMAL-ENDING-UI-PROPOSAL-V1.md](./FORMAL-ENDING-UI-PROPOSAL-V1.md) | 用户、UI、美术、开发、QA | 第一夜收尾 A/B：A“灯下留笺”、B“桌边暖纸”，以及分享、失败、大字和减动状态；A 默认＋B 大字已批准 |
| [FORMAL-ENDING-UI-V1-A-APPROVAL.md](./FORMAL-ENDING-UI-V1-A-APPROVAL.md) | 开发、QA、发布负责人 | A 默认＋B 120% 大字的批准身份、文案、动作、不变项、资产边界和实现停止线 |
| [FORMAL-UI-PROPOSAL-V1-1.md](./FORMAL-UI-PROPOSAL-V1-1.md) | 追溯 | 被用户否决的暗屋／黑角历史提案 |
| [FORMAL-UI-PROPOSAL-V1.md](./FORMAL-UI-PROPOSAL-V1.md) | 追溯 | 被替代的冷蓝室内 A/B 历史提案 |
| [OUTDOOR-ENTRY-REDESIGN-V4.md](./OUTDOOR-ENTRY-REDESIGN-V4.md) | UI、美术、开发 | V4-B 到 V7 自然星空方向的演进与当前约束 |
| [REQUIREMENTS-TRACEABILITY.md](./REQUIREMENTS-TRACEABILITY.md) | 全员、负责人 | 当前需求、替代项、设计/代码/QA 状态与 Gate A 证据 |
| [CHARACTER-BIBLE.md](./CHARACTER-BIBLE.md) | 角色设计、动画、UI | 成年人背影＋普通家猫的视觉与动作唯一基线 |
| [NIGHTS-CONTENT.md](./NIGHTS-CONTENT.md) | 编剧、UI、动画、开发 | 五夜节拍、交互、状态和精确中文文案 |
| [ASSET-PROVENANCE.md](./ASSET-PROVENANCE.md) | 美术、音频、制片 | 资产来源、授权、AI 辅助和审核记录规则 |
| [`assets/asset-register.csv`](../assets/asset-register.csv) | 制片、开发、法务复核 | 本版本实际素材状态、路径、版本与 SHA-256 |
| [GATE-CHECKLISTS.md](./GATE-CHECKLISTS.md) | 负责人、制片、测试 | 当前户外 Gate A/B/C/D 进出口；旧室内清单仅作附录 |
| [RESEARCH-TEST-KIT.md](./RESEARCH-TEST-KIT.md) | 用户研究、主持人 | 8 人原创盲测与 6–10 人体验测试表 |
| [QUALITY-VALIDATION.md](./QUALITY-VALIDATION.md) | 开发、QA、UI | 包体、性能、声音、无障碍和真机验证协议 |

## 执行约定

- 所有表单使用匿名编号，不记录姓名、微信号、头像或工作单位。
- 所有验收项均需记录证据路径、负责人代号、日期和结论；只勾选不算通过。
- 未通过对应视觉 Gate 不制作批量素材；正式 UI 提案获批前不得替换 D-lite 的运行时样式。
- 体验版可以构建；上传、提交审核、发布、推送仓库均不在自动执行范围。
- 包体与平台能力以 Gate D 当日的微信官方文档和当前 AppID 后台为准；本文档的数字是项目内部保守预算，不是平台长期承诺。

## 自动检查

```bash
node scripts/verify-docs.mjs
node scripts/audit-package.mjs /absolute/path/to/wechatgame-build
```

两个脚本都只读；不修改文档或构建产物。
