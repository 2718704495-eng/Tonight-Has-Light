# Gate D mainflow V4 r8 微信开发版 0.4.5 上传记录

> 日期：2026-08-26  
> 状态：`DEVELOPMENT VERSION 0.4.5 UPLOADED / USER EXPERIENCE SETTING PENDING / PHONE RETEST BLOCKED / NOT REVIEWED / NOT PUBLICLY RELEASED`  
> 候选 ID：`gate-d-mainflow-v4-phone-preview-dev-r8-0.4.5`

## 授权与边界

用户明确授权：将 r8 门跳转修复版上传为微信开发版本 `0.4.5`；允许同一临时暖屋素材只用于此次体验测试；不提审、不发布。

本轮最终远端仍只有同一个微信开发版本 `0.4.5`，内容来自同一个冻结 r8 候选。一次并行只读审查任务错误越过只读边界，先完成了上传；负责人尚未收到该结果时，又对同一目录、同一版本执行了一次上传。两次 CLI 回执的包体数字完全相同，没有产生不同候选或不同代码内容。主任务没有生成预览二维码、设置体验版、提交审核、公开发布、提交或推送 Git，也没有修改凭据。

## 上传输入

- 唯一候选：`gate-d-mainflow-v4-phone-preview-dev-r8-0.4.5`
- r5、r6、r7：`SUPERSEDED / DO NOT CITE`
- 源码验证：`120/120 PASS`
- Web 主链：4 路通过，0 runtime error
- 430×844 坐标专项：旧误触点保持户外，真实门点进入暖屋
- 微信体验模式 validator：`PASS`
- 五个分包：均包含 Cocos `game.js` 与兼容 `index.js`
- 正式发布 guard：按预期失败，继续阻止临时素材进入审核或公开发布
- 本地证据索引 SHA-256：`dbd66e291a8a1ce24844fba9ee489bb3ae60deef0af6c2ac54748a9b422fa311`

## 上传结果

首个上传回执时间为 `2026-08-26 18:54:51 +0800`，微信 CLI 退出码为 `0` 并明确返回 `✔ upload`。负责人在未知该回执已产生的情况下，于约三分钟后再次退出已有 IDE HTTP 服务并上传同一冻结包；第二份回执同样退出 `0`、返回 `✔ upload`，且包体数字逐项一致。并行任务随后被停止，后续上传必须由主任务单点执行。

上传报告：

- 总包：`4,490,691 bytes`
- 主包：`3,916,329 bytes`
- `indoor-n01-preview`：`571,738 bytes`
- `night-02` 至 `night-05`：各 `656 bytes`

首个成功回执（主证据）：`/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/gate-d-mainflow-v4-r8-0.4.5-20260826-upload/`

重复的同包回执（仅作并发事件追踪，不代表另一个候选）：`/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/wechat-0.4.5-upload-r8-20260826/`

## 当前结论

开发版本 `0.4.5` 已上传成功；重复回执没有改变最终版本身份或内容。手机缺陷仍不能标记为修复。下一步由用户在微信后台把 `0.4.5` 设为体验版，并在真实手机上复测“触碰后有风声、点击小屋门进入明亮暖屋”。真机通过前，Gate E 与手机主链保持 `BLOCKED`。
