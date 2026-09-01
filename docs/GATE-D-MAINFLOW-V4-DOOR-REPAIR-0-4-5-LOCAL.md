# Gate D 门跳转修复 0.4.5（本地候选）

> 日期：2026-08-26  
> 唯一候选：`gate-d-mainflow-v4-phone-preview-dev-r8-0.4.5`  
> 状态：`LOCAL PASS / WECHAT PHONE BLOCKED / NO UPLOAD / NO REVIEW / NO RELEASE`

## 用户可见问题

微信体验版 `0.4.4` 首次触碰后能听到风声，但点击右侧小屋仍停留在户外星空页。风声只能证明触摸到达了音频解锁链，不能证明门热区、应用流和室内分包已经成功。

## 修复范围

1. 门触控同时保留 Cocos UI 坐标与原始 viewport 坐标；UI 坐标直接命中，raw 坐标只按当前视口投影到 `390×844` 一次。
2. 保留已有门节点热区，并增加同一套全局 fallback 与 `350ms` 去重；不增加按钮、闪烁、箭头或任务提示。
3. 户外挂载后静默预取 `indoor-n01-preview`；点门时复用同一个加载请求。
4. 室内分包加载超过 `12s` 时进入已有可重试失败路径；同步异常、回调失败和 timeout 后均清理 in-flight 状态。
5. 微信构建后为五个 Cocos Asset Bundle 的 `game.js` 生成非破坏性 `index.js` 兼容入口，并由校验器检查声明、文件和哈希。
6. 修复 `430×844` 宽屏下 raw 像素被再次按设计坐标解释而造成的误命中。

## 明确保留不变

- 户外继续使用已批准 V7：自然深蓝星空、单条淡银河、成年人背影与普通家猫、小屋右侧中景、两朵弱光花。
- 门从第一帧可点但稳定、不脉冲、不催促。
- 室内继续使用已批准 `FORMAL-UI-V1.2-A`、`FORMAL-ENDING-UI-V1-A` 和 `FORMAL-SESSION-CONTROLS-V1-A` 的可丢弃体验表现。
- 没有新增 HUD、CTA、任务、奖励、进度或强制提示。
- 临时暖屋素材仍是 `prototype-only / disposable / not-for-review / not-for-release`，不能因此进入正式审核或公开发布。

## 验证结果

| 检查 | 结果 | 证明范围 |
|---|---|---|
| 源码验证（构建前、构建后） | `120/120 PASS` | 类型、合同、触控、分包、资源边界无本地回归 |
| Web 390×844 | `PASS` | 点门→暖屋→确认时长→壶杯→收尾→分享失败恢复→回户外 |
| Web 360×800 / 430×932 | `PASS` | 两类适配尺寸的完整主链与大字模式 |
| Web 390×844 减少动态 | `PASS` | 减动等价主链可完成 |
| Web 430×844 坐标专项 | `PASS` | 旧误触点不进屋，真实门点进入室内 |
| 微信 experience validator | `PASS` | 本地构建结构可作体验测试候选 |
| 微信分包入口 | `5/5 PASS` | 每个声明分包均有 `game.js` 与兼容 `index.js` |
| 包体预算 | 主包 `3,924,432 B`；总计 `4,499,959 B` | 通过当前内部保守预算 |
| release guard | `EXPECTED FAIL` | 临时素材仍会阻止提审和公开发布 |

## 证据与身份

- 证据目录：`/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/gate-d-mainflow-v4-r8-0.4.5-20260826-final/`
- `HASHES.sha256` 自身 SHA-256：`dbd66e291a8a1ce24844fba9ee489bb3ae60deef0af6c2ac54748a9b422fa311`
- r5、r6、r7 均为 `SUPERSEDED / DO NOT CITE`；不得用于上传或验收。

## 当前结论与下一步

本地候选已达到“可申请上传微信开发版本”的标准，但不能宣称手机问题已经修复。手机仍运行旧 `0.4.4`；只有获得用户对 `0.4.5` 上传及临时暖屋素材此次远端体验用途的明确授权后，才可上传并进行真机点门复测。未经授权不得 preview、upload、设置体验版、提审、发布、提交或推送。
