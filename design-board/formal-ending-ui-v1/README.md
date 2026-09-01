# FORMAL-ENDING-UI-V1 · 收尾界面 A/B 设计板

状态：`BLOCKED / AWAITING USER APPROVAL / DESIGN BOARD ONLY / NOT FOR BUILD`

本目录只用于比较第一夜收尾界面的可见设计，不是 Cocos 资产、微信包或生产实现。页面引用既有批准参考图作为设计板背景，不复制、不修改，也不改变其“探索参考、不可直接入包”的资产边界。

## 方案

- A `灯下留笺`：推荐默认。窄暖纸位于右侧空墙，尽量保留人物、普通家猫和晚饭。
- B `桌边暖纸`：可读性优先。低位横向暖纸提供更宽的阅读区域，但覆盖更多下方场景。
- 建议组合：默认使用 A；大字模式使用 B，并把字号真实放大到 `120%`、动作纵向排列。

两案共用同一文案与等权动作：

- 安静收尾：`水热了。你也先缓一会儿。`；`再坐一会儿` / `今晚到这里`
- 收束摘要：`这一夜，先放在这里。`；`给朋友留一盏灯` / `回到夜风里`
- 分享预览：`有人给你留了一盏灯`；`发给朋友` / `先不分享`
- 发送失败：`这次没有发出去。`；`再试一次` / `留在今晚`

## 启动

引用图位于相邻设计板目录，因此需要从项目根启动静态服务：

```bash
cd /Users/wxl/Desktop/小程序
python3 -m http.server 4181
```

总览：

`http://127.0.0.1:4181/design-board/formal-ending-ui-v1/`

独立预览：

- `?view=a-ending`
- `?view=a-summary`
- `?view=b-ending`
- `?view=b-summary`
- `?view=b-large`
- `?view=share`
- `?view=failure`

在任一独立预览后追加 `&clean=1` 可隐藏“仅限设计板”角标，便于截取纯视觉对照；这不会改变页面状态或资产边界。

如需重建响应截图证据，在静态服务运行时执行：

```bash
node /Users/wxl/Desktop/小程序/design-board/formal-ending-ui-v1/capture-evidence.mjs
```

脚本通过 Chrome DevTools Protocol 强制移动端 CSS viewport；只有 `innerWidth/innerHeight` 与目标值完全一致且无横向溢出时才写入证据。

## 响应与交互边界

- 独立预览直接使用当前视口，目标检查尺寸为 `360×800`、`390×844`、`430×932`。
- 触控控件最小高度 `44px`；默认主要动作高度 `48px`，相邻间距 `10px`。
- 两项动作使用完全相同的边界、底色、字重与反馈，不设置营销式主按钮。
- 默认进入只做 `180ms` 透明度变化；按压只做 `120ms` 底色／亮度反馈，不改变位置和尺寸。
- `prefers-reduced-motion: reduce` 下移除进入和按压过渡，不发生位移。
- 仅使用系统中文字体，不下载或嵌入字体；无 emoji 图标。
- 暖纸上正文使用深褐墨色，控件使用深褐边界；设计令牌按正文 `4.5:1`、控件 `3:1` 的最低对比目标制定，仍需主任务在最终合成截图上复测。

## 来源边界

- 引用：`../formal-ui-v1-2/approvals/formal-ui-v1-2-a-user-approved-reference-2026-08-24.png`
- 已知 SHA-256：`ad65d6fa811487fe5bd69726f1c5bf9d4b4c983d517c360b7087ff42f89cb36a`
- 用途：仅作为本设计板背景，等待用户选择收尾 UI；不可复制、切片、描摹或进入正式微信包。
