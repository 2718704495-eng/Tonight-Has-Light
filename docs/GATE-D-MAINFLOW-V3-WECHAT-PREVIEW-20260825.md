# Gate D-lite V3 微信手机预览记录

> `SUPERSEDED FOR CURRENT PHONE TEST / DO NOT USE AS V4 EVIDENCE`  
> 该二维码只保留历史追溯；它没有用户批准的明亮暖屋。当前手机试玩候选见 [`GATE-D-MAINFLOW-V4-PHONE-PREVIEW.md`](./GATE-D-MAINFLOW-V4-PHONE-PREVIEW.md)。

## 结论

- 候选：`gate-d-mainflow-v3-dev`
- 操作时间：2026-08-25
- 状态：`PREVIEW QR GENERATED / REAL DEVICE USER TEST PENDING`
- 预览包：`cocos-project/build/gate-d-mainflow-v3-dev-wechat-preview-v1/wechatgame`
- 最新证据目录：`/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/gate-d-wechat-preview-v3/`
- 最新二维码：`preview-qr-gate-d-mainflow-v3-dev.jpg`
- 最新二维码 SHA-256：`c4bf667d206dc888a8070176001389ef1ddd71e4b46febf752ac619c83194dee`
- 二维码尺寸：`470x470 JPEG`

本次按用户“现在我想发布一版，在手机上游玩测试”的要求，只调用微信开发者工具 `preview` 生成手机扫码预览。没有执行 `upload`，没有设置体验版，没有提交审核，没有发布线上版，没有 Git 提交或推送。

## 官方与本地依据

- Cocos Creator 3.8 微信小游戏发布文档：`https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/publish-wechatgame.html`
- Cocos Creator 3.8 命令行发布文档：`https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/publish-in-command-line.html`
- Cocos 命令行退出码依据：官方文档列出 `36` 为构建成功。
- 微信开发者工具 CLI：`/Applications/wechatwebdevtools.app/Contents/MacOS/cli preview --help` 显示 `preview` 支持 `--project`、`--qr-format image`、`--qr-output` 和 `--info-output`。

## 预览前验证

| 检查 | 结果 |
|---|---|
| `npm run verify` | `75/75 PASS` |
| `npm run validate:wechat-mainflow-build -- build/gate-d-mainflow-v3-dev/wechatgame` | `PASS` |
| 本地包文件总字节 | `3,802,934 bytes` |
| 微信 preview 输出总包 | `3,792,726 bytes` |
| 微信 preview 输出主包 | `3,790,238 bytes` |
| 最新二维码哈希 | `c4bf667d206dc888a8070176001389ef1ddd71e4b46febf752ac619c83194dee` |

第一次直接对本地包执行 `preview` 时在上传阶段返回 code 10，没有生成二维码；随后生成可扫码二维码。为保持和历史成功流程一致，又创建 `gate-d-mainflow-v3-dev-wechat-preview-v1` 隔离副本并生成最新二维码。两个成功二维码的 `preview-info` 包体统计一致，当前对外只使用最新二维码，避免测试对象混淆。

## 当前可测试内容

- 启动进入户外夜风草坡。
- 户外持续微动、点花、点天空、慢滑草地、点门。
- 点门进入室内第一夜功能壳。
- 3/5/8 分钟选择、壶边核心互动、杯子小剧场、窗雾和围巾可选互动。
- 收尾、固定分享预览、暂停、设置、加载失败/存档失败恢复和基础音频中断逻辑。

## 明确边界

- 这不是正式 Gate C/E 通过。
- 这不是正式 Gate D 通过。
- 室内仍是 `TonightHasLightV0View` 的 local-only Graphics 功能壳，不是用户批准的 `FORMAL-UI-V1.2-A` 正式暖屋 UI。
- `INDOOR-N01-PROTOTYPE-V1` 的批准参考图、临时音效和本地浏览器样片逻辑没有进入本次微信包。
- 正式室内可编辑母版、正式角色/猫/晚饭/灯具资产、户外设置入口、音乐、触碰短音效、OLED/LCD 低亮、真机性能、锁屏/来电/前后台和 10 分钟 soak 仍为 `BLOCKED`。
