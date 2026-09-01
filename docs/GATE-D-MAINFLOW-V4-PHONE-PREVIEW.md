# Gate D-lite V4 微信手机试玩候选

> 日期：2026-08-28  
> 首轮候选 ID：`gate-d-mainflow-v4-phone-preview-dev`（`R1 SUPERSEDED / DO NOT DELIVER`）  
> 历史修复候选 ID：`gate-d-mainflow-v4-phone-preview-dev-r2`（微信开发版本 `0.4.2`）  
> 历史 r3 候选 ID：`gate-d-mainflow-v4-phone-preview-dev-r3`（微信开发版本 `0.4.3`）  
> 当前唯一候选 ID：`gate-d-mainflow-v4-r2-edgefix-01-dev-r10-0.4.6`（微信开发版本 `0.4.6` 已上传）  
> 当前 Web 诊断 ID：`outdoor-illustration-wind-r2-edgefix-01-local-r4-web`（只作上传前视觉／交互机械证据）  
> 当前状态：`R1-R9 SUPERSEDED OR HISTORICAL / 0.4.5 V1-A PHONE MOTION FAIL / V2-B HUMAN VISIBILITY FAIL / R2 EDGEFIX R10 0.4.6 DEVELOPMENT UPLOADED / USER EXPERIENCE SETTING PENDING / PHONE RETEST BLOCKED / FORMAL GATES BLOCKED`  
> 性质：一次性、可丢弃的微信开发测试候选；不是正式资产包、审核版或线上版

> 后续授权更新：用户先授权门入口修复版使用同一临时暖屋素材构建并上传开发版本 `0.4.3`；批准 `FORMAL-ENDING-UI-V1-A` 后又要求“继续完成线上”。主任务已说明其执行边界为上传 `0.4.3` 供用户自行设体验版，不提审、不发布、不推送，用户未反对。
>
> 2026-08-26 最新授权更新：用户反馈 `0.4.4` 仍停在开局户外页后，明确授权 `gate-d-mainflow-v4-phone-preview-dev-r8-0.4.5` 上传为微信开发版本 `0.4.5`，并允许同一临时暖屋素材仅用于 `0.4.5` 体验测试；不提审、不发布。负责人已完成该 upload；用户设置体验版和手机复测仍待完成。
>
> 2026-08-27 真机反馈更新：用户确认 `0.4.5` 的动态效果仍不太明显，因此 r8 的 V1-A 手机可感知度为 `FAIL / P1`；既有 `120/120` 与 Web 机械证据不能覆盖该结论。新 [`OUTDOOR-MOTION-PHONE-V2`](./OUTDOOR-MOTION-PHONE-V2-PROPOSAL.md) 推荐 B“真分层微风”，当前等待用户批准，尚未修改源码、构建或上传。
>
> 2026-08-28 当前覆盖更新：V2-B 随后被用户判定“完全看不出来”，用户改为批准 R2“大轮廓五幅风页”，并在看到人物／猫周围黑线后批准 `R2-EDGEFIX-01` 工程修正。用户已明确授权上传这一版；唯一 r10 已上传为微信开发版本 `0.4.6`，CLI exit `0` 且返回 `✔ upload`。用户自行设置体验版；未提审、未公开发布、未提交或推送 Git。详见 [`0.4.6 上传记录`](./GATE-D-MAINFLOW-V4-EXPERIENCE-UPLOAD-0-4-6-20260828.md)。

## 1. 本次授权与边界

用户先要求“现在我想发布一版，在手机上游玩测试”，历史 r2 按项目既有外部操作口径生成微信 `preview` 并上传为开发版本 `0.4.2`。用户真机反馈门入口问题后，历史 r3/r4 逐步接入主流程、收尾、可感知微风和会话控制；`0.4.4` 真机仍不能进屋。当前授权边界为：

1. 只使用唯一 r10 Cocos 微信小游戏候选，r1–r9 均不得复用为当前上传或验收证据；
2. 复用用户已经登记的原 AppID，只在隔离的预览构建中配置；
3. r10 本地构建、R2 edgefix 可见回归、四尺寸主链和资产边界验证通过后，按用户授权上传微信开发版本 `0.4.6`；
4. 当前远端状态为 `PASS`，微信开发版本 `0.4.6` 已上传；旧 r9／孤立回执全部排除，不代表当前候选；
5. 体验版设置由用户在微信后台手动完成；主任务不设置体验版、不提交审核、不发布线上版、不提交或推送 Git。

用户此前批准的暖屋参考图仍不是正式生产资产。本次最新手机测试要求只把它的允许范围从“本地浏览器可丢弃样片”临时扩展到这个**单一、可丢弃的微信开发版本候选**；允许用户将该开发版本设为体验版做内部测试，但不得进入后续正式包、审核包或线上版，也不得据此把 Gate B2／D／E 标为通过。

## 2. 锁定的可见体验

- 户外完全沿用已批准 V7／B-lite／D-lite V3：自然深蓝星空、一条淡银河、成年人背影＋普通家猫、两朵弱光花和既有持久风链；不改变角色、构图、材质、配色、光线或标志性动效。
- 点门后从第一帧进入 `FORMAL-UI-V1.2-A / 灯一直为你亮着`：整屋明亮温暖、晚饭已备、角落不黑；不播放黑房亮灯表演。
- 室内核心沿用 `INDOOR-N01-PROTOTYPE-V1 / 壶盖轻响`：点壶后约 `600ms` 内给出低音量轻响与蒸汽反馈；约 `1.18s` 后进入杯子小剧场；用户可点杯子提前继续，或 `4s` 后自然继续；最后显示“水热了。你也先缓一会儿。”
- 不添加教程箭头、奖励光圈、倒计时或催促按钮；透明热区不小于 `44×44`。
- 减少动态时不使用壶盖、杯子、人物或猫的 transform 动画，只允许不超过 `200ms` 的透明度／亮度等价反馈；静音仍能理解因果。
- 本轮不提出任何新视觉样式。压缩、切片、分包、透明热区与时间轴接线只属于工程化复现。

## 3. 资源隔离

- 批准参考图身份：`design-board/formal-ui-v1-2/approvals/formal-ui-v1-2-a-user-approved-reference-2026-08-24.png`。
- 原图 SHA-256：`ad65d6fa811487fe5bd69726f1c5bf9d4b4c983d517c360b7087ff42f89cb36a`。
- 历史 r2–r8 例外只保留 `0.4.2`–`0.4.5` 追溯；当前一次性例外允许同源压缩衍生图、R2 edgefix 风页、局部切片和确定性合成轻响进入唯一 r10 开发版本 `0.4.6` 及由用户设置的对应体验版。当前文件必须标记 `prototype-only / disposable / experience-v0.4.3-through-v0.4.6-only / not-for-review / not-for-release`。
- 微信候选优先把暖屋素材放进独立 Asset Bundle／小游戏分包，避免挤占保守的 `4 MiB` 主包预算。
- 下一次正式构建不得默认消费该分包；正式母版、角色、猫、房间、灯、饭菜、壶、杯和声音仍须原创分层重绘、来源登记与再次批准。

## 4. 旧二维码处理

所有 `gate-d-mainflow-v3-dev` 二维码只包含旧室内 Graphics 功能壳，不能代表本次暖屋手机试玩。V4 新二维码生成后，旧 V3 二维码统一标记 `SUPERSEDED FOR CURRENT PHONE TEST / DO NOT USE AS V4 EVIDENCE`；旧二维码文件不删除，只保留追溯。

## 5. 放行清单

| 检查 | 目标 | 当前 |
|---|---|---|
| 源码与类型 | 项目验证全部通过，无未批准样式漂移 | `R10 133/133 PASS` |
| Web 可见回归 | R2 五幅风页、去黑边、点门进入明亮暖家，壶／杯、A/B 收尾、摘要、分享／失败与返回路径可完成 | `R10 PASS / 4 PATHS / 0 RUNTIME ERRORS` |
| 三宽与减动 | 360×800、390×844、430×932 无关键裁切；减动等价 | `R10 LOCAL WEB PASS; PHONE PENDING` |
| 微信本地构建 | 新 ID、新目录、AppID 仅隔离同步 | `R10 PASS / 198 FILES` |
| 包体 | 主包不超过项目保守预算；分包结构可识别 | `R10 UPLOAD PASS; CLI total 8,529,679 bytes; main 3,923,351 bytes; R2 4,031,674 bytes; indoor 572,030 bytes` |
| 独立复核 | 当前候选与上传回执一致，旧候选排除 | `R10 PASS; PHONE RUNTIME PENDING` |
| 微信预览 | 不重复制作二维码，直接按授权上传开发版本 | `NOT REQUIRED FOR R10` |
| 微信开发版本 | 只允许 r10 `0.4.6` 作为当前开发测试版本 | `PASS / DEVELOPMENT VERSION UPLOADED` |
| 真机体验 | 用户设为体验版后确认画面、触控、声音、生命周期 | `PENDING` |

二维码生成只表示“可开始手机测试”，不表示任何正式 Gate 通过。r1 二维码虽成功生成，但因下列 P1 已被排除，用户不得将其作为当前候选扫码测试。

## 6. r1 结果与停止线

- `npm run verify` 通过，Cocos 领域与源码测试为 `80/80`。
- 微信构建使用绝对 `configPath` 完成；Cocos CLI 返回 `36`，按项目既有官方口径视为构建成功，日志到达 `build Task (wechatgame) Finished`。
- 已从原微信小游戏项目同步 AppID 到隔离构建，文档只记录掩码 `wx49…6f55`。
- 构建目录：`cocos-project/build/gate-d-mainflow-v4-phone-preview-dev/wechatgame`。
- 证据目录：`/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/gate-d-mainflow-v4-phone-preview-20260825/`。
- 微信 preview 输出：总包 `4,377,001 bytes`，主包 `3,803,290 bytes`，`indoor-n01-preview` 分包 `571,223 bytes`。
- r1 二维码：`preview-qr-v4.jpg`，SHA-256 `5ec4a1422950922b6568ce1db9444c89ec0e155ec5c5691340ce9cac52d06d74`，状态为 `SUPERSEDED / DO NOT DELIVER`。
- info：`preview-info-v4.json`，SHA-256 `cd36112bbcb8dc4ac5b542529ca2277fde6558dd0fbb5f70b2abccc5699f8ad4`，不含完整 AppID。
- 未执行 `upload`、体验版设置、提交审核、发布、Git 提交或 GitHub 推送。
- 已知临时偏差：为避免在未批准正式时长 UI 前制造新室内界面，本候选进入室内后默认选择 `5` 分钟；正式版仍需明确 3/5/8 选择界面。
- 旧 `TonightHasLightV0View` 源文件仍在 Cocos 脚本目录并会被 Cocos 编译，但当前 `main.scene` 只挂载主启动组件，运行时进屋挂载 `TonightHasLightIndoorN01Preview`，不挂载旧 V0 房间。

独立 Web QA 对 r1 给出 `P0=0 / P1=2 / P2=1`：

1. `?reducedMotion=1` 只传入户外 rig，未写入共享 `UserSettings`；进屋后快照仍为 `reducedMotion:false`，室内会走 transform 动画。
2. 冷启动完整户外已显示约 1.8 秒时，第一次点门曾被输入就绪竞态吞掉；同坐标稍后点击才生效。
3. 室内 LabelShadow 使用三个废弃属性并产生 warning；业务 error 仍为 0。

r2 必须在不改变任何可见样式的前提下关闭以上问题，完成新 ID 本地构建、全量验证和增量复验后，才能再次调用微信 `preview`。r1 构建、二维码、info 和截图只保留追溯，不得复用为 r2 证据。

## 7. r2 结果与手机测试入口

- `npm run verify` 通过：文档、原型、Cocos 类型检查与测试全部通过；Cocos 源码测试为 `81/81`。
- r2 微信构建 ID：`gate-d-mainflow-v4-phone-preview-dev-r2`；Web 诊断 ID：`gate-d-mainflow-v4-phone-preview-web-r2`。
- 修复范围：独立存档前缀改为 `phone-preview-v4-r2:`；`?reducedMotion=1` 作为会话覆盖贯通到室内共享设置但不污染后续持久偏好；户外门热区在资源异步挂载前安装；室内 Label 阴影改用非废弃属性。
- AppID：仅同步到 r2 隔离构建产物，文档只记录掩码 `wx49…6f55`；未复用旧项目源码、资源或画面。
- 本地包体：总文件大小 `4,387,680 bytes`；主包估算 `3,812,689 bytes`；`indoor-n01-preview` 分包 `571,523 bytes`。
- 微信 preview 输出：总包 `4,377,708 bytes`，主包 `3,803,942 bytes`，`indoor-n01-preview` 分包 `571,278 bytes`。
- r2 二维码：`/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/gate-d-mainflow-v4-phone-preview-20260825/preview-qr-v4-r2.jpg`，`470×470`，SHA-256 `73aaec0e761f1b2742f59044acb1c2279d0309a670a3fb4a3c8cb8e05fed66d4`。
- r2 info：`preview-info-v4-r2.json`，SHA-256 `a1f9408125e10b4f563fde11bc839190784deba5a8f13a12d3ef6ec463e2ab9e`，内容只记录包体信息。
- r2 本地 Web 冒烟截图：`/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/gate-d-mainflow-v4-phone-preview-20260825/r2-local-smoke/`。已覆盖户外首屏、首击点门进入暖屋、壶反馈、杯子路径、`?reducedMotion=1` 首击点门进入暖屋；本地浏览器 console warning/error 为 `0`。
- 独立 QA 结论：`ALLOW r2 DEVELOPER PREVIEW ONLY`，`P0=0 / P1=0 / P2=0`。它确认 V7 观感、首触前静音、减动户外通道归零、室内设置调用链和门热区竞态修复；当前只读浏览器无法注入真机触摸，因此首次点门 5 次、音频生命周期和前后台恢复必须在扫码后由真机补证。
- 已按用户授权对同一 r2 候选执行一次微信 `upload`，版本号 `0.4.2`；上传说明与最终证据见 [`GATE-D-MAINFLOW-V4-EXPERIENCE-UPLOAD-20260825`](./GATE-D-MAINFLOW-V4-EXPERIENCE-UPLOAD-20260825.md)。
- upload info：`upload-info-v4-r2.json`，SHA-256 `a1f9408125e10b4f563fde11bc839190784deba5a8f13a12d3ef6ec463e2ab9e`。
- 微信 upload 输出：总包 `4,377,708 bytes`，主包 `3,803,942 bytes`，`indoor-n01-preview` 分包 `571,278 bytes`。
- 未设置体验版、未提交审核、未发布、未执行 Git 提交或 GitHub 推送。体验版设置由用户手动完成。
- 仍未完成：微信真机完整路径、音频生命周期、低亮屏、前后台恢复、长时性能和真实用户体感；开发版本／体验版测试不表示 Gate C/E 或正式 Gate D 通过。

## 8. r3 历史候选与 `0.4.3` 上传记录

- 用户反馈 `0.4.2` 体验版只能看到户外后，源码完成门入口兜底：整块小屋暖光区可点，保留节点命中并增加微信全局触摸兜底，按触点 ID 配对，18px 以上移动不算点门，350ms 去重；AppFlow 在 `door-transition/indoor-loading` 阶段继续拒绝重复进屋命令。
- 启动组件统一检查室内 `3/5/8` 分钟会话时长；室内 N01 通过独立语义动作层打通结束、继续停留、固定分享、分享失败恢复和返回户外。
- 用户批准 `FORMAL-ENDING-UI-V1-A` 后，r3 接入普通字号 A“灯下留笺”和大字／分享／失败 B“桌边暖纸”。本地 `cocos-project` 验证为 `99/99`；r3 Cocos build 与 Web 完整路径 QA 为 `PASS`。
- 历史证据目录：`/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/gate-d-mainflow-v4-r3-0.4.3-20260825/`。微信 CLI 已成功上传开发版本 `0.4.3`；上传信息见 `upload-info-v4-r3.json`，最终记录见 `upload-evidence-v4-r3.json`。
- 上传后独立只读 QA 重算哈希、重跑 `99/99` 和微信包验证、抽看四路 Web 证据，结论为 `PASS / P0=0 / P1=0 / P2=0`；允许用户设为体验版，但不替代真机运行验收。
- r3 一次性体验候选因当时尚未获批准的正式时长选择 UI 而自动使用默认 `5` 分钟；这是历史受控限制，不能扩散到正式 Gate D。当前 r8 已要求用户明确选择 `3/5/8` 分钟且不显示倒计时。
- r3 不改变 `FORMAL-UI-V1.2-A` 底图、户外 V7/B-lite、角色、材质、配色、光线、壶盖/杯子时序或声音边界，不引入新视觉样式。

已按授权执行一次 `upload --version 0.4.3`，上传成功只表示用户可以开始设置体验版做内部手机测试。上传不代表主任务已设置体验版、提审、发布、Git 提交或 GitHub 推送；这些操作仍在授权范围外。正式 Gate B2／C／D／E 继续为 `BLOCKED`。

## 9. r8 当前候选与 `0.4.5` 手机复测停止线

- `0.4.4` 真机表现为能听到风声但点击门不跳转，因此主链为 `FAIL`。
- r8 同时保留 Cocos UI 坐标与 raw viewport 投影命中；户外静默预取室内分包，12 秒无结果进入可重试错误路径；五个分包均有 `game.js` 与兼容 `index.js`。
- `npm run verify` 为 `120/120`；Web 四路径为 0 runtime error；430×844 专项证明旧误触点保持户外、真实门点进入暖屋。
- 用户已授权并完成微信开发版本 `0.4.5` 上传。CLI 回执为 exit `0` 与 `✔ upload`，总包 `4,490,691 bytes`、主包 `3,916,329 bytes`、暖屋分包 `571,738 bytes`。
- 一次并行只读审查任务错误先执行了同包上传，负责人未知结果时再次上传同一冻结目录；两份回执包体逐项一致，不代表两个候选。后续远程写操作只允许主任务单点执行。
- 主证据见 [`GATE-D-MAINFLOW-V4-EXPERIENCE-UPLOAD-0-4-5-20260826`](./GATE-D-MAINFLOW-V4-EXPERIENCE-UPLOAD-0-4-5-20260826.md)。用户尚未把 `0.4.5` 设为体验版；真机进门、动效、低亮、音频生命周期和性能仍为 `BLOCKED`。
