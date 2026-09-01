# Gate C 微信小游戏本地构建与动效运行时修复 V3

## 1. 当前结论

- B-lite 基线：`gate-c-v7-20260824-41b0b7b1-wind-blite-audio-v1`
- 微信动效运行时构建：`gate-c-v7-20260824-41b0b7b1-wind-blite-audio-v1-wechat-motion-runtime-v3`
- AppID 隔离本地副本：`gate-c-v7-20260824-41b0b7b1-wind-blite-audio-v1-wechat-appid-preview-v3-local`
- 本地构建：`PASS`
- v2 二维码：`SUPERSEDED / DO NOT SCAN FOR MOTION QA`
- v3 微信预览二维码：`BLOCKED / AWAITING USER APPROVAL`
- Gate C：`BLOCKED`

本轮只修复微信包使用旧动效运行时代码的问题。V7 构图、角色、材质、配色、夜空、光线、B-lite 动效数值、环境风和全部图像/音频资产均未改变。

## 2. 根因

用户真机反馈“风声有，但画面不会动”。排查确认 v2 预览包中的 `assets/main/index.js` 仍把 `OutdoorGateCRig.update` 编译为一次性尾帧逻辑：

- `elapsedMs` 被夹到 `OUTDOOR_GATE_C_DURATION_MS`，也就是约 `9800ms`；
- 包内没有 `sampleElapsedMs()` 与 `outdoorGateCRuntimeSampleMs()` 的循环采样路径；
- 因此前 9.8 秒后画面保持中性帧，环境风音频继续循环，形成“听得到风但看不到动”的体验。

当前源码已经具备 16 秒运行时循环采样；v3 重新构建后，包内 `OutdoorGateCRig.update` 保持持续累计时间，并通过 `sampleElapsedMs()` 采样。Cocos Creator 官方文档确认组件 `update` 是每帧生命周期回调；微信小游戏发布包由 Creator 构建生成 `wechatgame` 目录及 `game.json`、`project.config.json`。

官方依据：

- Cocos Creator 3.8 生命周期回调：<https://docs.cocos.com/creator/3.8/manual/zh/scripting/life-cycle-callbacks.html>
- Cocos Creator 3.8 发布到微信小游戏：<https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/publish-wechatgame.html>
- Cocos Creator 3.8 命令行发布项目：<https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/publish-in-command-line.html>

## 3. 验证

| 项目 | 结果 |
|---|---|
| `npm run verify` | `33/33 PASS` |
| v2 动效构建闸门 | `FAIL`，确认旧包缺少循环采样并存在 9.8 秒硬停 |
| v3 动效构建闸门 | `PASS` |
| Cocos 构建 | 原始退出码 `36`，日志到达 `build Task (wechatgame) Finished`，按 Cocos 3.8 文档口径为构建成功 |
| v3 包文件数 | `132` |
| v3 泛用包总大小 | `3,760,862 bytes` |
| v3 AppID 本地副本总大小 | `3,761,100 bytes` |
| v3 相对 v2 泛用包差异 | 仅 `assets/main/index.js` |
| v3 AppID 副本 AppID | 掩码 `wx49…6f55`，完整值不写文档 |

关键 SHA-256：

| 文件 | SHA-256 |
|---|---|
| 源码 `outdoor-gate-c-rig.ts` | `1d45dc9740223f7db635dbd06c48da38b8f23d49e17dd5b739a2ac5cd2319120` |
| 源码 `outdoor-gate-c-timeline.ts` | `9e047d4f2ee789119d60fc9e88ff15ddd35827d2f4365171703dfe644a012baf` |
| v3 构建配置 | `cdf454b55f62549bb54484367b9a2fc2449951dcc4c7a6cbcbaf5fd15a4b9420` |
| 构建闸门脚本 | `9aebe0d41bef0e3c5a6b3f44f5c19c8e747e3f0b0dbfe765e5b356f470583d7d` |
| v3 `assets/main/index.js` | `04efecfba1646e4be2612b778efa3e90f1cf1747e99999907c318c17a0136765` |
| v3 `game.js` | `32a997ceb72b71efbc26553d820d1a2de26115a5b00ac48917351ca5ab68c5a3` |
| v3 `game.json` | `85a90384a43e5fef08e20960b21b201153a66544dbb472335c07c59d2fcb5027` |
| v3 泛用包 `project.config.json` | `2a63653e8b3e9bb14fe9b02d0db9d52b16fed04fd08104fbf56e9bf2733ff558` |
| v3 AppID 副本 `project.config.json` | `06f7356cd89f3a406406573ad4a860e9d347793571a399cb309976e2409b8dde` |

新增闸门命令：

```bash
npm run validate:wechat-motion-runtime-build -- build/gate-c-v7-20260824-41b0b7b1-wind-blite-audio-v1-wechat-motion-runtime-v3/wechatgame
```

## 4. 边界

- 没有执行微信 `preview`。
- 没有执行 `upload`。
- 没有设置体验版。
- 没有提交审核或发布。
- 没有提交或推送 GitHub。

下一步需要用户明确授权后，才能把 v3 AppID 隔离本地副本提交到微信预览服务并生成新的二维码。
