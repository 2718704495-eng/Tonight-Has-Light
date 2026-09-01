# Gate D-lite V4 微信体验版上传记录

> 日期：2026-08-25  
> 本地候选：`gate-d-mainflow-v4-phone-preview-dev-r2`  
> 微信开发版本号：`0.4.2`  
> 上传说明：`今夜有灯 D-lite V4 R2 手机体验测试`  
> 当前状态：`UPLOAD PASS / USER EXPERIENCE-VERSION SETTING PENDING`  
> 性质：临时体验测试开发版本，不是审核版或线上版

## 1. 用户最新授权

用户最新明确决定为：“我不玩试玩的版本，你直接上传，然后我设为体验版”。该决定替代此前“只生成 developer preview、禁止 upload／体验版”的限制，并授权：

1. 使用已经通过本地与独立 QA 的同一份 r2 微信构建执行一次微信开发者工具 `upload`；
2. 在微信后台创建开发版本 `0.4.2`；
3. 允许用户随后亲自在微信后台把该开发版本设为体验版。

本轮不授权主任务代替用户设置体验版，不授权提交审核、撤回／覆盖其他远程版本、发布线上版、Git 提交或 Git 推送。

## 2. 临时素材例外

- 户外仍逐像素沿用已批准 V7／B-lite／D-lite V3，不改变角色、构图、材质、配色、夜空、光线或标志性动效。
- 室内继续工程化复现 `FORMAL-UI-V1.2-A / 灯一直为你亮着` 与 `INDOOR-N01-PROTOTYPE-V1 / 壶盖轻响`，没有新样式提案。
- 用户批准参考图、三张透明裁片与临时壶盖轻响的范围只临时扩展到开发版本 `0.4.2` 及由用户设置的对应体验版。
- 这些素材仍是 `prototype-only / disposable / experience-v0.4.2-only / not-for-review / not-for-release`，不得进入审核版、线上版或后续正式构建；正式资产仍须原创分层重绘、登记并再次批准。

## 3. 上传前证据

- `npm run verify`：`PASS`，Cocos 测试 `81/81`。
- 微信构建专项校验：`PASS`，构建中包含持久 Gate D-lite 主流程。
- 独立 r2 QA：`P0=0 / P1=0 / P2=0`；原放行范围为 developer preview，本次 upload 权限来自用户新的明确决定。
- 微信工具登录：`PASS`。
- 最近一次同包 preview 输出：总包 `4,377,708 bytes`，主包 `3,803,942 bytes`，`indoor-n01-preview` 分包 `571,278 bytes`；主包低于项目保守 `4 MiB` 线。
- 敏感信息检查：AppID 仅存在于隔离构建配置；源码和其他构建文件未发现密钥、密码、token 或私钥。

## 4. 未被本次上传证明的内容

开发版本上传成功只表示用户可以在后台设置体验版。微信真机首次点门、声音门控、后台恢复、低亮、长时性能、真实用户体感与正式原创资产仍未验收；Gate C／E 与正式 Gate B2／D 继续为 `BLOCKED`。

## 5. 上传结果

- 执行时间：2026-08-25。
- 微信 CLI：`upload` 返回 `PASS`，输出 `✔ upload`。
- 版本号：`0.4.2`。
- 描述：`今夜有灯 D-lite V4 R2 手机体验测试`。
- upload info：`/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/gate-d-mainflow-v4-phone-preview-20260825/upload-info-v4-r2.json`。
- upload info SHA-256：`a1f9408125e10b4f563fde11bc839190784deba5a8f13a12d3ef6ec463e2ab9e`。
- 上传证据索引：同目录 `upload-evidence-v4-r2.json`，SHA-256 `8da968acb2194331b2c98aab22c63ca06a4e70a8982bbd6416688ebe2fcfa484`；`HASHES.r2-upload.sha256` 用于复算两个文件。
- 微信输出总包：`4,377,708 bytes`。
- 微信输出主包：`3,803,942 bytes`。
- 微信输出 `indoor-n01-preview` 分包：`571,278 bytes`。

主任务未执行“设为体验版”、提交审核、线上发布、Git 提交或 Git 推送。

## 6. 已知受控漂移

- 为确保微信收到的正是已完成 r2 QA 的原包，本次上传没有重新构建或改动可见代码与素材。
- 因此，已上传包内不参与运行时判定的 `asset-boundary` JSON 仍保留旧 `phone-preview-only`，而源码台账已更新为 `experience-v0.4.2-only`。这是 `DRIFT`，但不改变画面、交互、声音或微信体验版能力。
- 用户最新明确授权、本文档与 `current-contract.md` 按项目真相源优先级覆盖该旧标记。不为纯元数据重复上传；后续任何新构建必须消费已更新的源码边界，且本临时资产不得进入审核或正式发布。
