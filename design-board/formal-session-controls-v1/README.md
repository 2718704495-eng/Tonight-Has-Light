# FORMAL-SESSION-CONTROLS-V1 · 会话控制设计板

状态：`APPROVED V1-A / LOCAL SOURCE PASS / RUNTIME BLOCKED / NO BUILD / NO UPLOAD`

本目录只比较进屋后的 `3/5/8` 明确确认、设置入口和提前收尾入口。它引用已批准暖屋参考图作为设计背景，不修改该图，也不扩大其“不可直接进入正式微信包”的资产边界。

## 当前批准

- A `右墙留时笺`：用户已批准为普通字号默认；沿用已批准 `灯下留笺` 的暖纸、墨字与右墙位置。
- 120% 大字：用户已批准不缩字，改用 `桌边暖纸` 承载。
- B `墙上三枚纸签` 与 C `右墙暖纸抽屉`：仅保留为历史对照，未获批准，不得混入实现。
- 批准记录：[`../../docs/FORMAL-SESSION-CONTROLS-V1-A-APPROVAL.md`](../../docs/FORMAL-SESSION-CONTROLS-V1-A-APPROVAL.md)。
- 本地 Cocos 源码已按 A 接线并通过 `115/115` 自动测试；这不构成 runtime、微信真机或视觉 Gate 通过。

## A 的固定行为

1. 暖屋加载完成后先保持约 `650ms` 无 UI，让“家一直亮着”先被看见。
2. 留时笺只以约 `170ms` 透明度显现；减动时直接出现，transform 始终为零。
3. `5 分钟` 默认选中，但不会自动开始；用户必须触碰 `就坐 5 分钟`。
4. 确认后纸笺淡出，才启动计时和壶杯互动；不显示倒计时。
5. 正常停留只保留 `48×44px` 的 `停一停` 小签；点开后显示声音、减少动态、大字。
6. 核心完成后增加 `看看今晚的留笺`，进入已批准的收尾 UI，不直接完成今晚。
7. 设置展开时暂停房间热区，纸外触碰只收起设置，避免误碰壶或杯子。

## 文案

- `今晚想坐多久？`
- `只是决定多久后提醒你。没有倒数，随时都可以停下。`
- `3 分钟 / 5 分钟 / 8 分钟`
- 动态确认：`就坐 3/5/8 分钟`
- 退出：`先回到夜风里`
- 折叠入口：`停一停`
- 核心完成后的收尾入口：`看看今晚的留笺`

不显示“推荐”、进度、奖励、任务、连续停留或倒计时。

## 启动与独立状态

从项目根启动静态服务：

```bash
python3 -m http.server 4181 --bind 127.0.0.1
```

总览：`http://127.0.0.1:4181/design-board/formal-session-controls-v1/`

独立状态：

- `?view=a-duration`
- `?view=a-ready`
- `?view=a-settings`
- `?view=b-tags`
- `?view=c-drawer`
- `?view=large-duration`

追加 `&clean=1` 只隐藏设计板角标，便于截图，不改变方案状态。

## 验收停止线

- 360×800、390×844、430×932 和 430×844 压力态无裁字、遮脸、遮猫、遮晚饭或 SafeArea 冲突。
- 所有热区至少 `44×44px`，相邻热区至少 `8px`。
- 大字真实 `120%`，不能 SHRINK；右墙不足时切换桌边暖纸。
- 纸笺和设置不使用暗幕、模糊、Bloom、发光 CTA、位移脉冲或全屏面板。
- 减动时所有 transform 为零；只允许直接状态替换或不超过 `200ms` 的透明度变化。
- 声音二级页未来分别承载环境声、音乐和触碰声；正式音乐未批准前不得把占位资源接入运行版。

## 当前机械证据

- `capture-evidence.mjs` 已生成 390×844 的 A 三态与 B/C 对照、360×800 大字、430×932、430×844 压力态和 390×844 减动态。
- 每个采集视口的 `innerWidth/innerHeight` 与目标一致，横向溢出为 false；结果记录在 `evidence/viewport-metrics.json`。
- `node --check` 已通过 `script.js` 与 `capture-evidence.mjs`。
- 用户已批准 A 与 120% 大字等价态；这些机械证据仍只证明设计板尺寸与结构成立，不代表 Cocos runtime、微信真机或正式 Gate 通过。

## 批准身份

- 用户批准的是状态同步前的设计板；原始索引已原样保存为 `approvals/HASHES.pre-approval.sha256`。
- 批准时索引及冻结副本自身 SHA-256：`0cc7c82303e04d8f1d40d57bed2aeae36f8ac202be682dcc5ffdd4fa8b8c4a9b`。
- 当前根 `HASHES.sha256` 只记录批准后状态同步，不替代上述批准证据。

## 来源边界

- 引用：`../formal-ui-v1-2/approvals/formal-ui-v1-2-a-user-approved-reference-2026-08-24.png`
- 已知 SHA-256：`ad65d6fa811487fe5bd69726f1c5bf9d4b4c983d517c360b7087ff42f89cb36a`
- 用途：只作为已批准会话控制 UI 的设计板背景；不可复制、切片或进入正式 Cocos／微信资产。
