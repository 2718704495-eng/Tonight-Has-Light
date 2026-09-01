# Gate B 可点击设计板复核记录

> 日期：2026-08-29  
> 当前状态：`STARGAZE FINALE R2 USER VISUAL PASS / COMPLETE BACKDROP PRESERVED / FORMAL LAYERED ASSETS BLOCKED / EXPLORATION ONLY`

## 已复核

- 入口稳定约 `1.5s` 后显示 `看看星空／吹吹风／回家`，没有卡片、图标、进度或任务面板。
- 三条支线均为五幅；每次有效点击只前进一幅，连续快速点击不会跳过一幅。
- 星空支线第 5 幅转场完成后才启动一次性结尾：`0.9s` clean hold → `0.8s` 单颗流星 → `0.45s` 同一尾迹淡去 → `1s` 安静停顿 → `180ms` 文案显现；DOM 中只有一个 `.meteor`，没有循环、第二颗流星、音频或粒子。
- 星空结尾“回家”进入既有回家支线第 1 幅，未闪回草坡；“再坐一会儿”回草坡。提前点击“回草坡”会清除结尾计时器，等待超过 `3.15s` 也不会残留文案。吹风支线仍回草坡；回家支线停在整屋明亮、备有晚饭的暖家。
- 星空中段／结尾、吹风中段／结尾、回家中段／结尾已在当前 `cover` 裁切下逐页目检；人物、普通家猫、关键事件、暖门和室内晚饭均未被裁掉。
- 人物或空白处的完整提示只出现一次；暖门热区高于其他热区，人物提示区低于天空、草地和暖门。
- `360×800`、`390×844`、`430×932` 无横向溢出；结尾文案均在画面内，两个选择高度 `48px`、间距 `12px`。`360×800` 下 120% 大字仍无溢出，选择宽度分别为 `108px` 与约 `112px`。
- 减少动态下 `.meteor` 的计算样式为 `animation-name: meteor-static`、`transform: none`；静态痕淡入与淡出各 `180ms`，总节奏和两个出口不变。
- 浏览器控制台错误为 `0`；`app.js` 最终幅空白问题已由固定交叉淡变的前一图层引用修复。
- 本轮新证据见 `evidence/stargaze-finale-browser-check.json`、`stargaze-finale-meteor-390x844.png`、`stargaze-finale-choices-390x844.png` 与 `stargaze-finale-reduced-static-390x844.png`。旧 `browser-check-gate-b-031f8775.json`、`owner-browser-check.json` 与 `*-owner-check.png` 只证明被替代的旧星空返回逻辑，不得引用为本次收尾证据。

## R2 网页背景可见性修复

- 用户指出静态证据中背景完整，但网页播放流星时像是“后面的背景没了”。运行态复现确认 F5 背景始终存在：可见 story layer 数量为 `1`、opacity 为 `1`、背景指向 `star-branch-contact-sheet-r3.png`，流星飞行时 opacity 为 `0.92`，console error/warning 为 `0`。
- 真正问题是 R1 的 390×844 舞台高于 `1280×720` 浏览器视口；点击自动滚动后，舞台顶部约为 `-62px`、底部约为 `782px`，人物／猫／草坡／小屋落在当前可视区外，而不是被覆盖层删除。
- R2 新增纯函数视口适配模型并由页面运行时消费；回归测试先以“模块不存在”失败，再实现通过。`1280×720` 下舞台完整位于 `24px–约696px`；360、390、430 三档手机视口进入故事后 `fullyVisible=true`、F5 背景可见且流星正在播放。手动或系统减少动态开启时，窄屏自动定位改为无平滑滚动的 `auto`。
- 新证据为 `evidence/stargaze-finale-background-preserved-390x844-r2.png`、`evidence/stargaze-finale-fit-1280x720-r2.png` 与 `evidence/stargaze-finale-layout-r2-browser-check.json`。R1 的流星截图仍只作原效果追溯，不再证明网页展示布局。

## 仍未放行

- 用户已在同一 `STARGAZE-SKY-FINALE-V1-A-GATE-B-R2` 网页上确认“没问题”；流星收尾、完整背景同屏、文案和双出口的可见候选子项记为 `PASS`。批准时冻结清单自身 SHA-256 为 `cb5aa845eb1e6fdd0bacd6891c0f408c4b130d16b08f58735725a233e6cdc9a0`。
- 当前三张五格图及入口图均为 imagegen 探索图；正式分层原创资产尚不存在，禁止进入 Cocos 或微信包。
- 原生按钮与可访问名称已经存在，但真实键盘激活、VoiceOver、TalkBack、微信真机触控、低亮设备和性能未在本设计板中验收。
- 本轮未修改 Cocos，未构建，未执行微信预览／上传、体验版设置、提审、发布或 Git 操作。

## 下一停止线

下一步是把同一分镜与流星覆盖层重绘为可编辑、可追溯的正式分层资产；任何 Cocos 接线、构建或微信操作仍需独立决策与授权。
