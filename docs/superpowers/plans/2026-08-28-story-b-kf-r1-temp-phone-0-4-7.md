# B 风格三拍临时手机体验版 0.4.7 实施计划

> **执行规则：** 每个可见或实现变更先遵守 `tonight-design-gate`；行为代码按 `superpowers:test-driven-development` 先写失败测试；本地可见验证使用 `game-playtest`。本计划只允许主任务执行微信上传，任何子任务和 QA 均只做本地工作或只读审查。

**目标：** 把用户已经批准的 `STORY-ILLUSTRATION-REDESIGN-V1-B-KF-R1` 三张探索图，仅作为一次性临时素材接入 Cocos，形成可在手机体验的三拍无字夜漫画，并上传新的微信开发版本 `0.4.7`。

**架构：** 新建完全独立的 `outdoor-story-b-kf-r1-temp` Asset Bundle；纯 TypeScript 三拍状态机负责 `B01 3200ms → 300ms 草线墨带转场 → B02 1500ms → 360ms 草带转场 → B03 无限停留`。持久双 Sprite 与 Graphics Stencil 实现不空帧的接页，旧门路由、首触风声、暖屋、会话控制、收尾和存档逻辑继续作为唯一权威。新候选不覆盖 R2，也不把三张探索图升级为正式资产。

**技术栈：** Cocos Creator 3.8.8 LTS、TypeScript、Node test runner、Cocos 2D Sprite / Mask / Graphics、Asset Bundle、微信小游戏构建与 CLI 上传。

**唯一身份：**

- 微信候选：`gate-d-story-b-kf-r1-temp-dev-r1-0.4.7`
- Web 候选：`gate-d-story-b-kf-r1-temp-web-r1-0.4.7`
- 存档前缀：`phone-preview-story-b-kf-r1-temp-r1-0.4.7:`
- Bundle：`outdoor-story-b-kf-r1-temp`
- 版本：`0.4.7`
- 资产边界：`prototype-only / disposable / one 0.4.7 developer upload / not-for-review / not-for-release`

**固定源图及 SHA-256：**

- B01：`fdac7f8edf8a22954a93a3f756ab2c1699c1afe04462bf2fa3ed679ae2794d0c`
- B02：`e0f00f2b573dda25b91f53aa5e04fa72456fa3ed1f784a1087b4238083504727`
- B03：`8da6d324520fce5175a1f0546a8cb67e29c041795d002439a5add28a80ea1b67`

**不变项：** 不新增音乐；风声仍在首次触碰后播放；门从首帧可点且转场中优先；减少动态固定 B01；室内继续使用已批准明亮暖屋；不改角色关系、故事文案、任务/奖励、会话控制、存档隐私和收尾 UI；不提审、不公开发布、不设置体验版、不提交或推送 Git。

---

## 任务 1：冻结授权与候选合同

**文件：**

- 修改：`docs/STORY-ILLUSTRATION-B-KF-R1-TEMP-PHONE-EXCEPTION-PROPOSAL.md`
- 修改：`docs/PROJECT-MEMORY.md`
- 修改：`.agents/skills/tonight-design-gate/references/current-contract.md`
- 新建：`docs/STORY-B-KF-R1-TEMP-PHONE-0.4.7-IMPLEMENTATION-LEDGER.md`

- [x] 记录用户对完整中文提案回复“没问题，继续”，以及主任务已明确解释为允许制作并上传一次 `0.4.7` 微信开发版。
- [x] 将旧禁止入包规则标为被这一个精确例外覆盖；正式资产停止线仍保留。
- [x] 冻结上述候选 ID、存档前缀、Bundle 名称和三张源图哈希。
- [x] 台账只记录本次改动文件、验证命令、证据路径和审查结论，不引用旧 0.4.6 作为 B 视觉证据。

## 任务 2：测试优先实现三拍状态机与转场几何

**文件：**

- 新建：`cocos-project/assets/scripts/cocos/outdoor-story-b-kf-r1-temp/outdoor-story-model.ts`
- 新建：`cocos-project/assets/scripts/cocos/outdoor-story-b-kf-r1-temp/outdoor-story-transition.ts`
- 新建对应 `.meta`
- 新建：`cocos-project/tests/outdoor-story-b-kf-r1-temp.test.ts`

- [x] 先写失败测试，覆盖 3199/3200/3499/3500/4999/5000/5359/5360ms 边界、smoothstep、互补不空帧、B03 不循环、不自动进屋、重播、减少动态和取消后不再回调。
- [x] 把浏览器已批准的草线／草带几何转换成与渲染器无关的纯数据：上下两条斜边、墨带位置、倾角和透明度。
- [x] 加入 B01/B02/B03 各自门热区；转场时使用两帧热区并集，门请求立即把模型置为 `cancelled`。
- [x] 只实现通过测试所需的最小状态机，不复用 R2 五页循环模型。

## 任务 3：建立隔离的临时素材 Bundle

**文件：**

- 新建：`cocos-project/scripts/import-story-b-kf-r1-temp-assets.mjs`
- 新建：`cocos-project/assets/outdoor-story-b-kf-r1-temp.meta`
- 新建：`cocos-project/assets/outdoor-story-b-kf-r1-temp/asset-manifest.json`
- 新建：`cocos-project/assets/outdoor-story-b-kf-r1-temp/asset-boundary.json`
- 新建：`cocos-project/assets/outdoor-story-b-kf-r1-temp/b01-settle.png` 及 `.meta`
- 新建：`cocos-project/assets/outdoor-story-b-kf-r1-temp/b02-wind-passes.png` 及 `.meta`
- 新建：`cocos-project/assets/outdoor-story-b-kf-r1-temp/b03-afterwind.png` 及 `.meta`
- 修改：`cocos-project/settings/v2/packages/builder.json`

- [x] 导入脚本先校验三张源图精确哈希，再生成确定性的临时运行图；不得读取两套失败正式稿。
- [x] Manifest 记录来源、ImageGen 探索属性、尺寸、哈希、三拍时序、门热区、减少动态与释放规则。
- [x] Boundary 只允许本地验证、一次 `0.4.7` 微信开发上传和用户自行设置对应体验版；递归阻止 review/release。
- [x] Bundle 使用独立 UUID / bundleConfigID，不覆盖或修改 `outdoor-illustration-wind-r2`。

## 任务 4：实现持久双 Sprite 草线接页并接入户外

**文件：**

- 新建：`cocos-project/assets/scripts/cocos/outdoor-story-b-kf-r1-temp/outdoor-story-pages.ts`
- 新建对应 `.meta`
- 修改：`cocos-project/assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-scene.ts`
- 修改：`cocos-project/assets/scripts/cocos/outdoor-gate-c/outdoor-door-input.ts`
- 新建或修改相应测试文件

- [x] 两个满屏 Sprite 持久存在，静止时仅当前帧可见；转场时下一帧由 Graphics Stencil 的斜草线从下向上显出，同时出现已批准的深靛墨带。
- [x] 任意采样帧至少有一张不透明故事图；不销毁重建整场景，不摆动整屏，不闪黑/白/透明空帧。
- [x] B01 自动开始三拍；水平慢滑可从 B01 重播；减少动态固定 B01，不运行裁切、墨带或位移。
- [x] 门目标在 B01/B02/B03 及两次转场中与画面里的门对齐，触控不小于 44×44；门请求先取消三拍，再进入现有 `REQUEST_ENTER_HOUSE` 主链。
- [x] 首触风声、花/天空反馈、暖屋预载、前后台恢复和室内销毁顺序保持原逻辑；旧 R2 bundle 不在新候选运行时加载。

## 任务 5：建立 0.4.7 的存档、构建和发布守卫

**文件：**

- 修改：`cocos-project/assets/scripts/cocos/tonight-has-light-bootstrap.ts`
- 修改：`cocos-project/assets/scripts/cocos/tonight-has-light-indoor-n01-preview.ts`
- 修改：`cocos-project/assets/indoor-n01-preview/asset-boundary.json`
- 修改：`cocos-project/scripts/wechat-experience-authorization.mjs`
- 修改：`cocos-project/scripts/prepare-wechat-experience-candidate.mjs`
- 修改：`cocos-project/scripts/validate-wechat-motion-runtime-build.mjs`
- 修改：`cocos-project/scripts/validate-project.mjs`
- 修改：`cocos-project/tests/phone-preview-v4-contract.test.ts`
- 新建：`cocos-project/scripts/gate-d-story-b-kf-r1-temp-dev-r1-0-4-7.json`
- 新建：`cocos-project/scripts/gate-d-story-b-kf-r1-temp-web-r1-0-4-7.json`

- [x] 用新存档前缀隔离 0.4.7，不迁移或覆盖 0.4.6 数据。
- [x] 暖屋临时素材边界追加精确 0.4.7 例外，同时保留 0.4.3–0.4.6 历史记录。
- [x] Experience 模式只接受唯一 0.4.7 候选、三张精确源/运行哈希和当前暖屋边界。
- [x] Release 模式必须因 KF-R1 与暖屋临时素材返回非零；递归扫描不能只检查入口脚本。
- [x] 构建 identity 写入 `remoteOperationPerformed: false`；上传成功后只在外部回执中记录，不伪改冻结构建内容。

## 任务 6：本地验证和可见证据

**文件：**

- 新建：`docs/STORY-B-KF-R1-TEMP-PHONE-0.4.7-LOCAL-QA.md`
- 修改：`docs/STORY-B-KF-R1-TEMP-PHONE-0.4.7-IMPLEMENTATION-LEDGER.md`
- 修改：`docs/PROJECT-MEMORY.md`
- 修改：`docs/ASSET-PROVENANCE.md`

- [x] 运行 `npm --prefix cocos-project run verify`，所有旧测试与新增测试必须通过。
- [x] 构建唯一 Web 候选，验证 360×800、390×844、430×932、430×844；捕获 B01/B02/B03、两次转场中点、减动、转场点门和暖屋。
- [x] 检查无黑/白/空帧、画面不拉伸、门热区不漂移、首次触碰后风声仍播放、B03 不循环、控制台 error 为 0。
- [ ] 检查前后台在两次转场中各一次：自动测试已覆盖门转场回滚与重播；两段故事转场的真实微信前后台仍待体验版手机复验。
- [ ] 记录帧时、长帧、内存、Bundle/主包/总包体积；任何 >250ms 交互冻结或明显画面撕裂都阻止上传。

## 任务 7：独立只读审查与微信开发上传

- [x] 让至少两个独立只读任务分别审查：行为/生命周期/测试缺口；样式一致性/临时资产边界/构建污染。任何子任务写文件都视为 P0。
- [x] 主任务逐项复核审查证据并解决全部范围内 P0/P1。
- [x] 生成唯一微信候选；补分包入口；写入 identity；运行 experience validator、包体审计，并确认 release validator 按设计拒绝。
- [x] 由主任务单点上传开发版本 `0.4.7`；不设置体验版、不提审、不公开发布。
- [x] 上传后记录构建路径、构建树哈希、CLI 退出码和脱敏回执；旧 0.4.6 保留为历史，不覆盖源证据。
- [x] 完成并验证后更新项目学习卡；学习卡已在默认目录创建并标记 `verified`，同时明确手机真机项仍待确认。

## 完成定义

只有以下条件全部成立，才可向用户说“0.4.7 已上传”：

1. 三拍时序、转场、B03 停留、减动和门取消的自动测试通过。
2. Web 四尺寸与真实 Cocos 截图证明三幅画、两个转场和暖屋都可见。
3. 风声仍需首触后播放，门在任意阶段进入暖屋。
4. Experience 构建守卫通过，Release 守卫按预期失败，包体预算通过。
5. 独立只读审查没有未解决 P0/P1。
6. 微信上传 CLI 明确返回成功；没有设置体验版、提审、正式发布或 Git 操作。
