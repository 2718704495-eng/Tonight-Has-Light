# STORY-B-KF-R1-TEMP 0.4.7 微信上传回执

> 日期：2026-08-29  
> 候选：`gate-d-story-b-kf-r1-temp-dev-r1-0.4.7`  
> 结论：`REMOTE COMMIT PASS / DEVELOPMENT VERSION ONLY`

## 上传前冻结身份

- Build root：`cocos-project/build/gate-d-story-b-kf-r1-temp-dev-r1-0.4.7/wechatgame`
- 开发版本：`0.4.7`
- 原项目 AppID 掩码：`wx49…6f55`
- AppID 同步步骤：Cocos `final2` 构建完成后，使用 `scripts/sync-wechat-appid-from-existing-project.mjs` 从原微信工程配置同步到最终 buildRoot；Creator 构建日志内的默认 `wx6a…99c5` 不是最终上传 AppID 证据。
- 最终构建树 SHA-256：`baca089b549d4015837d36ae4995586ed0133f0adc1f22ef16dfa90946d699e1`
- `assets/main/index.js` SHA-256：`aeff62ae13a39f2f088fdad7cea3d6737e2b0b33ff03df38c905ab5201e8aa43`
- `project.config.json` SHA-256：`04c9250026cbd63b85a85b43914d72090325195161f07334614dd6b4d275aa20`
- 同步后审计 SHA-256：`0de06b4a32d4bf806a56524245930ecf74ff4c9398819581149ae3be7424a162`

## 最终上传证据

- CLI 进程 exit：`0`
- CLI 结果：明确返回 `✔ upload`
- 脱敏原始日志：证据根目录中的 `wechat-upload-0.4.7-final.raw.log`
- 脱敏原始日志 SHA-256：`3bccfc9eb806744302c1385b018251b27a228c777fd939cab82fc2c1611eac8c`
- `--info-output`：`wechat-upload-0.4.7-final-info.json`
- Info SHA-256：`479530f38a7802ed7a2068a97091cc8c75312cbf39bb4b181f90d43825a30f3d`
- CLI 打包体积：main `3,927,297` bytes；total `13,486,565` bytes。该口径不含本地审计辅助文件，因此与 buildRoot 文件树审计体积不同。
- 微信开发工具内部提交链：`2026-08-29 01:19:57 +08:00` 获取上传令牌成功；`01:19:57–01:20:01` 完成分包签名与 `startCosUpload`；`01:20:01` 的 `commitTask` 在约 `506ms` 后完成。
- 内部提交链脱敏摘录：证据根目录中的 `wechat-upload-0.4.7-final-devtools-extract.log`；SHA-256 `08d82f2f62cbc98f67757b52ce661b1d801d42ae044d62aea620c9ca72cfbd75`。摘录只保留候选路径、版本、info 文件名和远端提交阶段，不保存完整 AppID、客户端 ID 或异步任务 ID。

## 被替代尝试

- `wechat-upload-0.4.7.raw.log/info.json`：并发任务提前上传的旧候选，`SUPERSEDED / DO NOT CITE`。
- `wechat-upload-0.4.7-corrected-info.json`：第一次纠正尝试。CLI 表面返回成功，但微信开发工具内部日志显示上传令牌请求网络失败，未出现 `commitTask`；`FALSE POSITIVE / SUPERSEDED / DO NOT CITE`。
- 只有 `wechat-upload-0.4.7-final.raw.log`、最终 info、同步后审计和本回执可共同证明最终候选上传。

## 权限边界

- 已执行：上传微信开发版本 `0.4.7`。
- 未执行：设置体验版、提交审核、公开发布、Git 提交或推送。
- Release validator 仍会递归拒绝 B/KF-R1、暖屋与历史 R2 临时资产；本回执不解除正式资产停止线。
