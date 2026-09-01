# Gate D mainflow V4 r10 微信开发版 0.4.6 上传记录

> 日期：2026-08-28  
> 状态：`DEVELOPMENT VERSION 0.4.6 UPLOADED / USER EXPERIENCE SETTING PENDING / PHONE RETEST BLOCKED / NOT REVIEWED / NOT PUBLICLY RELEASED`  
> 候选 ID：`gate-d-mainflow-v4-r2-edgefix-01-dev-r10-0.4.6`

## 授权与边界

用户明确授权：上传这一版去黑边后的 R2 风页体验测试包。执行边界仅为微信开发版本 `0.4.6` upload；用户自行在微信后台设置体验版。

本轮没有设置体验版、没有生成预览二维码、没有提审、没有公开发布、没有 Git 提交或推送。临时暖屋素材和 R2 风页仍是 `prototype-only / disposable / not-for-review / not-for-release`，只允许用于本次 `0.4.6` 内部体验测试。

旧 `gate-d-mainflow-v4-phone-preview-dev-r9-0.4.6` 和 2026-08-28 12:16 左右的孤立 r9 上传信息均为 `SUPERSEDED / DO NOT CITE`，不作为本次远端成功证据。

## 上传输入

- 唯一候选：`gate-d-mainflow-v4-r2-edgefix-01-dev-r10-0.4.6`
- 工程修订：`R2-EDGEFIX-01`
- 存档前缀：`phone-preview-v4-r2-edgefix-r10-0.4.6:`
- R2 资产 manifest SHA-256：`ba8efcd093405beac36085414ef865a78278ecfba7991d31db62cfbd18e69e69`
- 构建树 SHA-256：`6617135fbc157d932aac287d21482d47e5af92b90dcf97c8fe724994fccdf15b`
- 哈希算法：将 198 个文件按规范化相对路径排序，每行写成 `<文件 SHA-256><两个空格><相对路径><换行>`，再对完整 UTF-8 清单计算 SHA-256

## 验证结果

- `npm --prefix cocos-project run verify`：`133/133 PASS`
- `prototype/outdoor-illustration-wind-v1-a-r2-handoff/validate_assets.py`：`126/126 PASS`
- 微信包 experience-only validator：`PASS`
- 微信包 release guard：按预期失败，阻止临时素材进入提审/公开发布
- 分包入口：`game.js` 与 `index.js` 均存在于 R2、室内和 night-02 至 night-05 分包
- 本地包体审计：198 个文件；主包 `3,931,375 bytes`，R2 风页分包 `4,031,907 bytes`，总包 `8,539,101 bytes`；主包与 R2 分包均低于 4MiB，总包低于 20MiB

## 上传结果

微信 CLI 日志返回 `✔ upload`，上传包体如下：

| 包 | 字节 |
|---|---:|
| TOTAL | 8,529,679 |
| main | 3,923,351 |
| /subpackages/outdoor-illustration-wind-r2/ | 4,031,674 |
| /subpackages/indoor-n01-preview/ | 572,030 |
| /subpackages/night-02/ | 656 |
| /subpackages/night-03/ | 656 |
| /subpackages/night-04/ | 656 |
| /subpackages/night-05/ | 656 |

微信 CLI 的上传有效载荷比本地完整构建树少 `9,422 bytes`：本地审计统计所有生成文件字节，CLI 会排除本地专用元数据／兼容字节。两者绑定的是同一个 r10 候选；候选 ID、`build-identity.json` 与 `game.json` 哈希均未变化。

上传证据目录：`/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/gate-d-mainflow-v4-r2-edgefix-r10-0.4.6-20260828-upload/`

关键证据哈希：

- `wechat-upload-0.4.6.raw.log` SHA-256：`cdaa76ccbe7b547014da00266f881a502752f11ce554437bd056a367d7b2f288`
- `upload-info-0.4.6-final.json` SHA-256：`e0c8ccef3aab8b8227a596e620586c27cfeb819b97f35636658978d2b62676fb`
- `upload-evidence-v4-r10-0.4.6.json` SHA-256：`3fcb2ffc36051b5ad351970fda3a792a9abf934166fb2db8739a4727000232f1`
- `upload-receipt-sanitized.md` SHA-256：`37202f0897430bfd3bd1066f8cafe2cb8e7fde3ba2560b1f6606fffd19368a72`
- `HASHES.upload-r10-0.4.6.sha256`

## 当前结论

微信开发版本 `0.4.6` 已上传成功。下一步由用户在微信后台把 `0.4.6` 设为体验版，并在真实手机上复测五幅风页变化、人物/猫边缘、点门进入暖屋、会话控制、收尾留笺和返回夜风。

真机复测前，手机体验、低亮、生命周期、性能和正式 Gate E 仍保持 `BLOCKED`；正式素材、提审和公开发布仍未授权。
