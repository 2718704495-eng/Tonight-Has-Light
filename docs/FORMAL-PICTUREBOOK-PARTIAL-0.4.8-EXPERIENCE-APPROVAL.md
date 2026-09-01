# FORMAL-PICTUREBOOK-PARTIAL-0.4.8 部分体验版授权记录

> 日期：2026-09-01  
> 用户原句：`批准 0.4.8 部分体验版：接入 Root R4＋看星空 F1–F5＋流星收尾＋回家 H1–H5；暂时隐藏“吹吹风”；允许构建并上传微信开发版 0.4.8，不提审、不公开发布`  
> 当前状态：`WECHAT DEVELOPMENT VERSION 0.4.8 UPLOADED / USER EXPERIENCE SETTING PENDING / NO REVIEW / NO PUBLIC RELEASE / NO GIT`

## 1. 唯一候选身份

- 微信开发候选：`gate-d-formal-picturebook-partial-dev-r1-0.4.8`
- Web 验证候选：`gate-d-formal-picturebook-partial-web-r1-0.4.8`
- 开发版本：`0.4.8`
- 正式图页分包：`formal-picturebook-partial-0-4-8`
- 本地存档前缀：`formal-picturebook-partial-r1-0.4.8:`
- 本记录只授权由主任务负责人完成一次与最终冻结构建逐字节绑定的微信开发版上传；用户自行在微信后台把该开发版设为体验版。

旧 `0.4.7`、B01/B02/B03 自动三拍、旧风页和其他 superseded 构建不属于本候选，也不能提供本候选的视觉、运行或上传证据。

## 2. 本次接入范围

### 草坡根页

- 使用已批准且冻结的 `ROOT-WIND-HEM-V1-A-R4` 精确 390×844 文件，不改像素。
- 根页只显示两个低权重画中邀请：`看看星空` 和 `回家`。
- `吹吹风` 入口、热区、页面和提示全部暂时隐藏；不得用“即将开放”或灰色按钮替代。
- 空白处首次触碰可给一次低权重中文提示，但不能形成任务、页码、进度或奖励。

### 看星空

- 接入已批准并冻结的 F1、F2、F3、F4、F5 全幅 clean plate；点击当前图片逐页前进，不自动翻页。
- F5 clean plate 不写入流星；流星作为独立可编辑效果层，按 `STARGAZE-SKY-FINALE-V1-A` 播放恰好一次。
- 收尾固定文案：`一颗流星，刚刚从夜里经过。`、`回家，还是再坐一会儿？`
- `回家` 进入 H1；`再坐一会儿` 回到根页。两者不写完成、解锁或奖励。

### 回家

- 接入已批准并冻结的 H1、H2、H3、H4、H5 全幅页面；点击当前图片逐页前进。
- H4 保留 `吃一点`、`喝口温水` 两个可选互动；顺序不限，空白处仍可进入 H5。
- H4 只组合已批准的原始 `ate-layer` 与 `sipped-layer` 透明反馈层；`both` 为运行时同时显示两层，不生成第三张新图。
- H5 停在已批准的暖家全景，可回到根页继续体验；本部分体验版不把回家绘本写进室内五夜完成进度。

## 3. 运行与体验合同

- 普通翻页使用同画布交叉淡化，不出现黑帧、白闪、空帧或整屏销毁重建；正常动态约 260ms，进入／返回约 320ms。
- 减少动态关闭流星位移与页面位移，只保留不超过 200ms 的透明度或亮度等价反馈。
- 360×800、390×844、430×932 以及 430×844 压力态均须保持整幅构图、安全边、中文和至少 44×44 触控热区。
- 首次触碰前静音；首次触碰后环境风才开始。静音下仍能完成全部分支。
- 不显示 `吹吹风`，也不得从隐藏热区、键盘／调试 API 或旧存档进入该分支。
- H4 状态和当前绘本页面可以作为本地临时会话状态，但不得写入今晚完成、五夜进度、连续签到或奖励。

## 4. 正式资产边界

- Root R4、F1–F5、H1–H5 只允许消费各批准记录绑定的精确文件与 SHA-256。
- 当前唯一运行资产清单：`cocos-project/assets/formal-picturebook-partial-0-4-8/asset-manifest.json`，SHA-256 `10e47544bd6f4666a54e6e1d7f6d92da33a9dc10d2c1a50df4e62f9416086101`；边界文件 SHA-256 `ba7754215e77746466c68a8c54fd25c5f404d6b5190f5ccf4f6e72d1712b2b55`。清单包含 11 张全幅页与 2 张 H4 真透明反馈层，合计 `5,519,815` bytes；manifest 与 boundary 均明确且仅隐藏 `breeze` 分支。
- 这些无字全幅页适用用户批准的 `FORMAL-PICTUREBOOK-FULLFRAME-V1-A` AI 辅助正式候选例外；运行分包必须保留来源、批准身份、源文件哈希、运行文件哈希和逐项对应关系。
- 中文、按钮／热区、流星以及 H4 状态逻辑保持独立、可编辑、可追溯，不能烘焙回正式全幅页。
- 旧 `outdoor-story-b-kf-r1-temp`、`OutdoorStoryPages`、B01/B02/B03、旧 `outdoor-illustration-wind-r2` 与临时暖屋素材不得成为 0.4.8 主运行链或本次证据来源。历史物理分包若因 Cocos 工程历史仍存在，必须标为 runtime/evidence ineligible，并受包体上限约束。

## 5. 验证与上传停止线

上传前必须全部满足：

1. 新 Cocos 持久场景、正式分包和本记录范围的自动测试、类型检查、项目验证通过。2026-09-01 最终结果：根目录 `npm run verify` 通过；Cocos 子项目 `231/231 PASS`。
2. Web 候选真实运行并覆盖根页两入口、F1–F5、一次流星、双出口、H1–H5、H4 四态、减少动态、大字和 360／390／430 适配；重视觉状态必须有截图证据。2026-09-01 最新结果：`FINAL-WEB-QA.md` 为 `PASS`，阻断级控制台问题 `0`；重构建后真实触摸还证明 Root 挂载约 `0.26s` 后即可分别进入 F1/H1，证据位于 `/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/gate-d-formal-picturebook-partial-0.4.8-20260901-local/web-qa/`。
3. 微信构建重新同步原登记 AppID；experience validator、release guard、分包入口和包体审计通过，其中 release 模式明确拒绝本部分体验版进入审核或公开发布。`wechat-preflight-r2`、`wechat-preflight-r3`、`wechat-upload-r1`、`wechat-upload-r2`、`wechat-final-r3` 与 `wechat-final-r4-clean/superseded-upload-1328/` 中的中间上传链均已 `SUPERSEDED / DO NOT CITE AS FINAL UPLOAD`；最终构建目录根级不再保留同名旧回执。
4. 2026-09-01 已单飞重新构建并冻结最终微信构建树，最终预检证据位于 `/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/gate-d-formal-picturebook-partial-0.4.8-20260901-local/wechat-final-r4-clean/`。包体审计 `PASS`：主包 `3,926,254` bytes（低于 4MB），总包 `19,031,459` bytes（低于 20MB），正式绘本分包 `5,544,306` bytes；冻结构建树 SHA-256 `67bff186959aa492d35e06865f7663aef85cc0d82e7e0834763a10bcc07521e7`。
5. 2026-09-01 13:30 最后一次微信开发工具 CLI 已提交开发版本 `0.4.8`，最终上传证据位于 `/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/gate-d-formal-picturebook-partial-0.4.8-20260901-local/wechat-upload-r3/`。CLI exit `0` 且返回 `✔ upload`；上传说明绑定开发版本、完整冻结树哈希和“不提审不发布”；同一远端任务内 `startCosUpload` 与 `commitTask` 完成。主任务用最终 r4 clean 预检重新生成并复核 v2 receipt，精确绑定 buildRoot、完整冻结树哈希、上传描述、info-output 路径和包体清单；回执 SHA-256 `d9933a555a6ed09664ac36b93ce1bc5a632ae6c0d3b94b49d02b19aa1ef9827f`，上传前后构建树同为 `67bff186959aa492d35e06865f7663aef85cc0d82e7e0834763a10bcc07521e7`。

## 6. 明确不授权

- 不授权主任务代设体验版。
- 不授权微信审核、灰度、公开发布、正式上线或任何商用投放。
- 不授权 Git 提交、推送、PR 或 GitHub 远端写入。
- 不授权修改任何已批准插画的可见样式，也不授权把本次“部分体验版”状态扩大为完整项目 Gate D／Gate E 通过。
