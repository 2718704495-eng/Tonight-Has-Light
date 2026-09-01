# FORMAL-SESSION-CONTROLS-V1-A 批准记录

> 日期：2026-08-26  
> Gate：B2／室内会话控制可见设计  
> 状态：`STYLE APPROVED / LOCAL SOURCE PASS / RUNTIME EVIDENCE BLOCKED / NO BUILD / NO UPLOAD`

用户批准原文：

```text
批准 FORMAL-SESSION-CONTROLS-V1-A：右墙留时笺；120% 大字使用桌边暖纸
```

## 1. 批准身份

- 提案：[`FORMAL-SESSION-CONTROLS-V1-PROPOSAL.md`](./FORMAL-SESSION-CONTROLS-V1-PROPOSAL.md)
- 设计板：`design-board/formal-session-controls-v1/`
- 用户批准时的原始索引：`design-board/formal-session-controls-v1/HASHES.sha256`
- 用户批准时索引的 SHA-256：`0cc7c82303e04d8f1d40d57bed2aeae36f8ac202be682dcc5ffdd4fa8b8c4a9b`
- 原样冻结副本：`design-board/formal-session-controls-v1/approvals/HASHES.pre-approval.sha256`
- 冻结副本自身 SHA-256：`0cc7c82303e04d8f1d40d57bed2aeae36f8ac202be682dcc5ffdd4fa8b8c4a9b`
- 批准前清单已逐项复算：`17/17 OK`。
- `approvals/HASHES.pre-approval.sha256` 是批准瞬间的身份清单，不是当前工作树清单。批准后的状态同步改变了其中 `index.html`、`README.md` 和提案文档的当前文件哈希；因此它只能以自身 SHA-256 与本条批准记录核对，不能对批准后工作树执行 `shasum -c` 并据此判断样式漂移。当前工作树应复算下一条批准后状态索引。
- 批准后状态索引：`design-board/formal-session-controls-v1/HASHES.sha256`；当前 SHA-256 为 `c8a5885556fd96571f44ed2dbdcfd980bc65eb74627c8e039922a3991509097f`。它只记录批准后的状态文字与索引更新，不替代上面的 `0cc7...c4a9b` 批准证据。
- 暖屋参考图 SHA-256：`ad65d6fa811487fe5bd69726f1c5bf9d4b4c983d517c360b7087ff42f89cb36a`。该图仍只作设计板背景，不因本次 UI 批准而升格为正式 Cocos／微信资产。

## 2. 批准范围

1. 普通字号采用 `A / 右墙留时笺`，沿用已批准“灯下留笺”的暖纸、深褐墨字、茶褐边和右墙次要区位置。
2. 暖屋真正可见后先完整显示约 `650ms`；留时笺随后仅以约 `170ms` 透明度显现，不使用位移、缩放、暗幕或发光提示。
3. 时长提供 `3 / 5 / 8 分钟`；`5 分钟`默认以不发光双墨圈选中，但在用户触碰动态确认文案 `就坐 X 分钟` 前，NightSession 计时不得开始。
4. 不显示倒计时；用户可通过低权重动作 `先回到夜风里` 返回户外。
5. 确认时长后，右墙只保留不小于 `48×44px` 的 `停一停` 小纸签；它稳定、不闪烁、不脉冲。
6. `停一停` 展开声音、减少动态和大字设置；声音二级页分别承载环境声、音乐和触碰声，不把三路重新合成一个总开关。
7. 核心互动完成后，设置内增加 `看看今晚的留笺`，打开已批准 `FORMAL-ENDING-UI-V1-A`；该动作不得直接完成今晚。
8. `largeText=true` 时不缩字，改用已批准的 `桌边暖纸` 承载真实 `120%` 字号。
9. 减少动态时所有 transform 为 `0`；状态直接替换，或只使用不超过 `200ms` 的透明度变化。
10. 所有触控区不小于 `44×44px`，相邻触控区边缘至少 `8px`；设置展开时必须拦截壶、杯及其他房间热区，纸外触碰只收起设置。

## 3. 不变项

- `FORMAL-UI-V1.2-A / 灯一直为你亮着` 的整屋明亮暖家、人物、普通家猫、晚饭、星窗、壶杯、构图、材质、配色与光线全部不变。
- `FORMAL-ENDING-UI-V1-A` 的收尾与分享语义不变；不会新增结算、奖励、任务、强分享或营销 CTA。
- 户外 V7、`OUTDOOR-MOTION-PHONE-V1-A`、首触音频门、五夜进度和远端微信开发版本 `0.4.3` 均不变。
- 120% 大字只改变承载纸面和真实字号，不用 SHRINK，也不重新设计第三套样式。

## 4. 本次没有批准

- B `墙上三枚纸签` 与 C `右墙暖纸抽屉` 没有获批，不得混入实现。
- 没有批准把暖屋参考 PNG、设计板整屏截图或其裁片复制进正式 Cocos／微信资产；正式 UI 纸面、图标和关键互动物必须使用可编辑、可追溯的 SVG／PNG。
- 没有批准音乐成品、正式触碰音效、第二至第五夜、任何新视觉样式或户外设置入口方案。
- 没有批准把设计板机械截图写成 Cocos runtime、微信真机、Gate D 或 Gate E 的 `PASS`。
- 没有授权生成微信包、上传开发版、设置体验版、提审、发布、Git 提交或推送。

## 5. 本地 Cocos 实现条件

- 只能消费本记录批准的 A 与大字等价态；使用持久 `Sprite / Label / Button` 与可编辑 UI 资产，不用临时 Graphics 卡片或整屏销毁重建。
- 会话开始必须绑定用户确认，而不是纸笺出现、分包下载完成或暖屋初始化；历史 `0.4.3` 的一次性默认 5 分钟行为只作旧体验记录，不能进入新的正式路径。
- 纸笺淡出后才能开放壶杯热区；设置展开期间房间热区暂停，关闭设置后恢复，不能造成一次触摸穿透或重复动作。
- 必须覆盖 360×800、390×844、430×932 与 430×844 压力态、默认／减少动态／120% 大字、暂停恢复、加载失败和前后台恢复。
- 本地接线、自动测试或 Web 截图完成后，状态最多写为相应工程子项 `PASS`；微信真机未复验前，整体 runtime 继续为 `BLOCKED`。

## 6. 当前结论

- 已完成：按冻结设计完成本地 Cocos 源码接线、可编辑双墨圈资产及资产登记；历史自动 5 分钟已移除，默认 5 只作预选，明确确认后才开始计时。`npm run verify` 于 2026-08-26 通过，Cocos 测试 `115/115`，领域与 Cocos TypeScript 检查通过。
- 本地源码证据：`TonightHasLightFormalSessionControls` 使用持久 `Sprite / Label / Button / BlockInputEvents`；`UI-N01-SESSION-001` 由可编辑 `selection-ring.svg` 确定性导出，运行时 PNG SHA-256 为 `74718c3349b13bb988e82983e6d13fdfbf6f0061634948257d8ba7de39f7c79e`。
- 不可进入：任何新构建、微信上传、体验版设置、提审或发布。
- 当前 Gate 结论：设计选择 `ALIGNED / STYLE APPROVED`，本地源码工程子项 `PASS`；尚无本轮 Cocos/Web 合成截图或微信真机证据，因此 runtime 与 Gate E 继续 `BLOCKED`。
