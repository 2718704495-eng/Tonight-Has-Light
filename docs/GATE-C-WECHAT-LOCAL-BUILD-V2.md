# Gate C 微信小游戏本地构建与模拟器证据 V2

## 1. 当前结论

- B-lite 基线：`gate-c-v7-20260824-41b0b7b1-wind-blite-audio-v1`
- 微信兼容构建：`gate-c-v7-20260824-41b0b7b1-wind-blite-audio-v1-wechat-runtime-compat-v2`
- AppID 隔离副本：`gate-c-v7-20260824-41b0b7b1-wind-blite-audio-v1-wechat-appid-preview-v2`
- 本地构建：`PASS`
- 微信开发者工具小游戏模拟器：`PASS`
- v2 预览二维码：`PASS / GENERATED`
- 微信真机：`BLOCKED`
- Gate C：`BLOCKED`

本轮只修复小游戏环境缺少浏览器 `URLSearchParams` 导致的首帧崩溃。V7 构图、角色、材质、配色、夜空、光线、B-lite 动效参数、环境风和全部图像/音频资产均未改变。

## 2. 兼容修复

`startupRequestsReducedMotion` 改用不依赖浏览器 API 的查询参数解析函数；它保持首个同名参数、`+`、百分号编码和畸形输入不抛错的行为。

| 项目 | 结果 |
|---|---|
| 修复源码 SHA-256 | `e8e80b3001e04ac683076935b2031860e649637a49d0902a7871d3c74aaa0f05` |
| 回归测试 SHA-256 | `0d827fd05eba02f90942c6892a922036d917921bfecfa7ca6e219d7cec057a2e` |
| `npm run verify` | `32/32 PASS` |
| 生成代码中的 `URLSearchParams` | `0` |
| 对旧冻结 Release 的文件差异 | 仅 `assets/main/index.js` |

## 3. 构建身份与包体

- 配置：`cocos-project/scripts/gate-c-wechat-runtime-compat-v2.json`
- 配置 SHA-256：`af1600d764b90c2bce54f342bb35bbacf3a9cbabf4f61d1682bbbdd8edf0b852`
- 输出：`cocos-project/build/gate-c-v7-20260824-41b0b7b1-wind-blite-audio-v1-wechat-runtime-compat-v2/wechatgame/`
- 日志到达 `build Task (wechatgame) Finished`。日志中有一条发生在项目脚本已完成后的 Cocos 子进程 `SIGTERM` 调试记录；后续引擎、资源和平台模板任务均完成，保留给独立 QA 判定。

| 项目 | 数值 |
|---|---:|
| 主包 | 3,757,278 bytes |
| 分包 | 3,468 bytes |
| 总计 | 3,760,746 bytes |
| 文件数 | 132 |
| 距 4 MiB 保守主包线余量 | 437,026 bytes |

关键哈希：

| 文件 | SHA-256 |
|---|---|
| `game.js` | `32a997ceb72b71efbc26553d820d1a2de26115a5b00ac48917351ca5ab68c5a3` |
| `game.json` | `85a90384a43e5fef08e20960b21b201153a66544dbb472335c07c59d2fcb5027` |
| `assets/main/index.js` | `c0a59bda39a0699ca764127a1308ae9d580ccdf90136d9ddb6f3cb4527f79518` |
| 构建源 `project.config.json` | `2a63653e8b3e9bb14fe9b02d0db9d52b16fed04fd08104fbf56e9bf2733ff558` |
| AppID 副本 `project.config.json` | `06f7356cd89f3a406406573ad4a860e9d347793571a399cb309976e2409b8dde` |

构建源仍使用 Cocos 通用测试 ID。用户现有已登记 AppID 只写入独立 v2 副本，掩码为 `wx49…6f55`；v2 构建源与 AppID 副本只差 `project.config.json`，没有复制旧项目源码、资源、画面或其他配置。

## 4. 微信模拟器证据

微信开发者工具 Stable 2.01.2510290 中切换到“小游戏模式”并本地编译后：

- V7 星空、成年人背影、普通家猫、右侧小屋、门光和两朵弱光小花全部可见。
- Console 为 `0 error / 2 warning`；两条均为模拟器外壳 SharedArrayBuffer 弃用提示与灰度基础库 3.17.0 提示。
- Cocos 场景加载日志约 `403.659 ms`，不代表完整冷启动时间。
- 证据目录：`/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/gate-c-wechat-appid-preview-v2/`。
- 完整工具截图 SHA-256：`c2b2ae20bb4aa4dd97069cd45e89c634dbe5ae3be8c6eef3d604ba4008fbe02a`。
- 模拟器裁片 SHA-256：`321caf032586e7345950be85c93149d437a753015d4433815c97d878e4472f2f`。

该截图只证明微信模拟器可运行及静态观感未明显漂移，不代替 GC-03、GC-06、GC-09、GC-11、GC-12 的真人与设备阈值。

## 5. 临时预览与远程停止线

用户于 2026-08-24 明确授权把 v2 临时代码包提交到微信预览服务并生成二维码后，负责人执行一次微信 `preview`：

- 结果：`PASS`，CLI 返回 `preview` 成功；
- 二维码：`preview-qr-v2.jpg`，470×470 JPEG，SHA-256 `28816efc63df3215f8181731536f7409cbac9a5be67e2a26cab7418df77206ea`；
- 预览统计：总包 3,750,302 bytes，主包 3,747,814 bytes，四个分包各 622 bytes；
- 预览信息 SHA-256：`6ac6a2bc81cac97a42c9a72506f3942b794d53f3d7c323991acafaa8fc01d2f2`。

`preview` 只生成临时预览包和二维码，没有创建开发版、体验版、审核版或线上版。停止线继续有效：

- 不执行 `upload`；
- 不设置体验版；
- 不提交审核或发布；
- 不推送 GitHub。

下一步只使用该 v2 二维码，按 [`GATE-C-WECHAT-DEVICE-MATRIX-V1.md`](./GATE-C-WECHAT-DEVICE-MATRIX-V1.md) 补真机证据；旧 v1 二维码不得扫描。
