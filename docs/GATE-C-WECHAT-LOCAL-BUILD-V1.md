# Gate C 微信小游戏本地构建证据 V1（已替代）

> **SUPERSEDED**：本轮的 Cocos 本地构建本身完成，但 AppID v1 独立预览副本在微信小游戏模拟器首帧触发 `URLSearchParams is not defined`。v1 二维码和运行包不得继续使用，也不得作为 Gate C 通过证据。当前结论见 [`GATE-C-WECHAT-LOCAL-BUILD-V2.md`](./GATE-C-WECHAT-LOCAL-BUILD-V2.md)。

## 可保留事实

- 2026-08-24 使用 Cocos Creator 3.8.8 生成了 B-lite 的微信小游戏 Debug/Release 本地包；日志到达 `build Task (wechatgame) Finished`。
- 冻结 Release 一直保留 Cocos 通用测试 ID，`project.config.json` SHA-256 为 `2a63653e8b3e9bb14fe9b02d0db9d52b16fed04fd08104fbf56e9bf2733ff558`。
- 用户现有 AppID 只写入独立的 `wechat-appid-preview-v1` 副本，文档只记录掩码；旧项目源码、资源和画面未复用。
- v1 曾调用微信 `preview` 并生成临时二维码。该操作向微信预览服务提交了临时代码包，但没有创建或修改开发版、体验版、审核版或线上版；未执行 `upload`、审核或发布。
- 在二维码生成后的小游戏模拟器检查中发现首帧兼容缺陷，因此 v1 立即排除。历史报告已加 `DO NOT SCAN` 停止线。

## 不可沿用的旧结论

- 不得再写“冻结 Release 已迁入真实 AppID”。真实 AppID 从未保留在冻结 Release，只存在于隔离预览副本。
- 不得把 `preview` 描述成纯本地或零远程写入。
- 不得用 v1 的二维码生成成功代替模拟器画面、真机、音频、生命周期、低亮、性能或内存证据。

Gate C 在 v1 结束时仍为 `BLOCKED`。
