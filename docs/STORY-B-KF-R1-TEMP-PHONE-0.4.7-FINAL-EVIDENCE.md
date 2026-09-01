# STORY-B-KF-R1-TEMP 0.4.7 FINAL 证据索引

> 唯一候选：`gate-d-story-b-kf-r1-temp-dev-r1-0.4.7`  
> 最终构建树 SHA-256：`baca089b549d4015837d36ae4995586ed0133f0adc1f22ef16dfa90946d699e1`  
> 状态：`WECHAT DEVELOPMENT 0.4.7 UPLOADED / NO REVIEW / NO RELEASE`

## 唯一可引用证据

根目录：`/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/gate-d-story-b-kf-r1-temp-0.4.7-20260829-local/`

- 最终 Web 构建日志：`creator-web-build.final.raw.log`
- 最终 B03 截图：`runtime-final-b03.jpg`；SHA-256 `deb51db9191b70f4dab8796577e356de4258409387a90bc06415a6a25108cdfc`
- 最终 B02→B03 中点：`runtime-final-transition-b02-b03-midpoint.png`；SHA-256 `86673b1000af1c4b9e5434bb34e30813d1940ee3429b13a6bc5186d9f64f4c1a`
- 四尺寸与核心可见截图只引用：`web-smoke/360-b01-mounted.png`、`web-smoke/390-b01-0p5s.png`、`web-smoke/390-b02-3p95s.png`、`web-smoke/390-b03-6p15s.png`、`web-smoke/390-transition-b01-b02-3p4s.png`、`web-smoke/390-reduced-motion-b01.png`、`web-smoke/390-after-door-indoor.png`、`web-smoke/430-b01-mounted.png`、`runtime-reduced-430x844-pressure.jpg` 与上列最终 B02→B03 中点。最终安全边以当前源码、测试和 `#06265F` 为准。
- 最终微信构建日志：`creator-wechat-build.final2.raw.log`；SHA-256 `24dae13b42b01b0dac8ddf6bc3a8987d34e21258d72c8f2b7d54e46ff6038c9d`
- 最终同步后包审计：`wechat-audit-final-synced/wechat-package-audit.json`；SHA-256 `0de06b4a32d4bf806a56524245930ecf74ff4c9398819581149ae3be7424a162`
- 最终脱敏上传原始日志：`wechat-upload-0.4.7-final.raw.log`；SHA-256 `3bccfc9eb806744302c1385b018251b27a228c777fd939cab82fc2c1611eac8c`
- 最终上传信息：`wechat-upload-0.4.7-final-info.json`；SHA-256 `479530f38a7802ed7a2068a97091cc8c75312cbf39bb4b181f90d43825a30f3d`
- 身份与内部远端提交链回执：[`STORY-B-KF-R1-TEMP-PHONE-0.4.7-UPLOAD-RECEIPT`](./STORY-B-KF-R1-TEMP-PHONE-0.4.7-UPLOAD-RECEIPT.md)
- 微信工具提交链脱敏摘录：`wechat-upload-0.4.7-final-devtools-extract.log`；SHA-256 `08d82f2f62cbc98f67757b52ce661b1d801d42ae044d62aea620c9ca72cfbd75`
- 当前 `assets/main/index.js`：SHA-256 `aeff62ae13a39f2f088fdad7cea3d6737e2b0b33ff03df38c905ab5201e8aa43`，与最终审计一致。

## 明确排除

- `runtime-transition-solid-fail.jpg`：实心转场失败证据，不是最终观感。
- `web-smoke-after-safety-color/`：中间 `#020B13` 漂移证据，已被恢复后的 `#06265F` 最终源码、测试和构建替代。
- `runtime-reduced-430x932-lossless.png` 与 `runtime-reduced-430x932-srgb.png`：旧色彩导出路径，不用于最终安全边判断。
- `playwright-error-repro-390x844.png`：Cocos 3804 修复前复现图。
- `creator-web-build.raw.log`、`creator-web-rebuild-after-safety-color.raw.log`、`creator-wechat-build.raw.log`、`creator-wechat-build.final.raw.log`：中间构建日志。
- `wechat-audit/`、`wechat-audit-final/`：AppID 最终同步前或构建修正前的审计。
- `wechat-upload-0.4.7.raw.log` 与 `wechat-upload-0.4.7-info.json`：并发任务提前上传的旧候选回执；已被最终修正版同版本覆盖。
- `wechat-upload-0.4.7-corrected-info.json`：第一次纠正尝试的 false-positive info；内部上传令牌网络失败且没有 `commitTask`，不得引用。

## 远端边界

- Cocos `final2` 日志记录的是构建时默认 AppID；最终 buildRoot 随后由同步脚本切换到原项目 AppID掩码 `wx49…6f55`，同步后审计锁定 `project.config.json` SHA-256 `04c9250026cbd63b85a85b43914d72090325195161f07334614dd6b4d275aa20`。不得用 Creator 日志替代最终 AppID 证据。
- 最终重试的微信 CLI exit `0` 并返回 `✔ upload`；微信开发工具内部日志同时出现上传令牌、`startCosUpload` 和成功完成的 `commitTask`。上传的是同一最终 buildRoot、开发版本 `0.4.7`。
- 主任务没有设置体验版、没有提审、没有公开发布，也没有执行 Git 提交或推送。
- 临时 B/KF-R1 与暖屋素材仍被 Release validator 递归拦截；不得以本证据索引解除正式资产停止线。
