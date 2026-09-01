# Gate D-lite V4 r4 微信开发版 0.4.4 上传记录

> 日期：2026-08-26  
> 状态：`DEVELOPMENT VERSION 0.4.4 UPLOADED / USER EXPERIENCE SETTING PENDING / NOT REVIEWED / NOT PUBLICLY RELEASED`  
> 候选 ID：`gate-d-mainflow-v4-phone-preview-dev-r4-0.4.4`  
> 目标微信开发版：`0.4.4`

## 1. 用户授权与边界

用户澄清：

```text
我说的是发布体验版，之前已经有体验版了，你把代码上传即可
```

本轮将该决定执行为：

- 允许生成唯一新候选，并向已登记 AppID 上传微信开发版 `0.4.4`。
- 允许同一临时暖屋底图、三张局部叠层和临时壶盖轻响用于 `0.4.4` 及用户自行设置的对应体验版。
- 主任务不代替用户设置体验版，不提交审核，不正式发布，不执行 Git 提交或推送。
- 临时素材仍是 `prototype-only / disposable / not-for-review / not-for-release`，本次体验例外不能作为正式资产证据。

## 2. 候选内容

- 户外保持已批准 V7 画面，接入 `OUTDOOR-MOTION-PHONE-V1-A / 可感知微风`。
- 点门后进入 `FORMAL-UI-V1.2-A / 灯一直为你亮着` 的明亮暖屋。
- 进屋后使用 `FORMAL-SESSION-CONTROLS-V1-A / 右墙留时笺`，用户明确确认 `3/5/8` 后才开始。
- 保留壶盖轻响、杯子小剧场、灯下留笺收尾、分享失败恢复和返回夜风。
- 使用新存档前缀 `phone-preview-v4-r4-0.4.4:`，不继承远端 `0.4.3` 的体验存档。

## 3. 上传前证据

- `npm run verify`：`PASS / 115 of 115`。
- Cocos 微信构建目录：`cocos-project/build/gate-d-mainflow-v4-phone-preview-dev-r4-0.4.4/wechatgame`。
- Cocos 构建日志到达 `build Task (wechatgame) Finished`；CLI 返回码 `36` 按项目既有 Cocos 3.8 口径记为成功。
- AppID 已从旧项目同步到新包；证据只记录掩码。
- 微信包内体验模式验证 `PASS`。
- 微信包内 release 模式验证按预期失败，用于阻断审核/公开发布。
- 最终微信 upload 输出总包 `4,489,026 bytes`、主包 `3,915,018 bytes`、`indoor-n01-preview` 分包 `571,520 bytes`。

## 4. 上传结果

一次并行重试在微信工具 `compile_start` 阶段返回 `code 10`，未用作远程成功证据；其日志已脱敏并隔离。退出开发者工具服务后，负责人对同一唯一候选执行最终受控 `upload --version 0.4.4`：微信 CLI 退出码为 `0`，并明确返回 `✔ upload`。

该操作只更新微信开发版本 `0.4.4`；主任务未设置体验版、未提审、未发布、未提交或推送 Git。

证据目录：`/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/gate-d-mainflow-v4-r4-0.4.4-20260826/`。

关键文件：

- `upload-evidence-v4-r4-0.4.4.json`
- `upload-info-0.4.4-final.json`
- `HASHES.final-upload-r4.sha256`
- `superseded-failed-upload-attempt-0.4.4-code10.log`（脱敏，仅用于记录未成功尝试）

所有最终回执与包哈希使用 `final` 命名；上传前的构建、哈希和被覆盖失败日志统一加 `superseded-` 前缀，不得作为最终远程证据。

后续由用户在微信后台把开发版本 `0.4.4` 设置为体验版后，再做手机真机确认。
