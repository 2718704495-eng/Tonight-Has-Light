---
task_id: "2026-08-24-gate-d-mainflow-v3"
task_type: "requirement"
title: "D-lite V3 主功能本地候选"
status: "verified"
completed_at: "2026-08-24"
branch: "not-a-git-repository"
commit: "not-committed"
---

# 2026-08-24-gate-d-mainflow-v3：D-lite V3 主功能本地候选

## 一句话结论

先不做二维码和正式测试，已把《今夜有灯》的 N01 主功能链和长期运行补完整：户外不再机械循环，来电、存档、加载与分享异常也都能安全恢复，并产出唯一微信本地候选 V3。

## 1. 先讲业务：这次到底做了什么

- 谁会遇到这个场景：想在下班后先看夜空、再决定是否进屋坐一会儿的用户。
- 他想做什么：不被任务催促地停一下，也能在想继续时进入第一夜。
- 原来是什么情况：V2 虽能走通主链，但户外仍沿用固定 16 秒整段重播；系统音频中断、存档失败、分享重复点击与资源失败存在竞态或静默失败风险。
- 现在是什么情况：唯一候选 `gate-d-mainflow-v3-dev` 已能持续赏景、响应花/天空/慢滑/门、进入 N01、完成核心仪式、暂停设置、收束和固定分享；长期调度与异常路径均有明确状态。
- 为什么要改：用户明确要求“先把主功能完善再进行测试”，所以本轮优先补功能，不扩大到外部预览或正式视觉验收。
- 验收结果：`npm run verify` 为 75/75 PASS；微信本地包内合同验证通过，132 个文件共 3,802,934 bytes；未上传、未审核、未发布。

## 2. 再讲底层：程序是怎么做到的

### 2.1 底层原理一句话

本质上是用外层应用状态机和内层夜晚状态机管主链，再用一个可复验的长期调度器管户外微动，并把微信生命周期、存档和分享回调都变成可拒绝、可恢复、可测试的状态变化。

### 2.2 调用链

| 顺序 | 谁调用谁 | 传入什么 | 做了什么 | 输出或状态变化 |
|---|---|---|---|---|
| 1 | `TonightHasLightBootstrap.onLoad` → `loadLocalSave` | 本地存储和当前时间 | 读取或修复 LocalSaveV2 | 得到设置、进度和最近安全点 |
| 2 | `Bootstrap` → `transitionAppFlow(BOOT_COMPLETE)` | 是否分享入口、是否恢复室内 | 决定进入共享欢迎、户外或室内加载 | `AppFlowState.phase` 改变 |
| 3 | `OutdoorGateCScene` → `onEnterDoor` | 点门事件 | 请求进入小屋 | AppFlow 进入 `door-transition` 后加载室内 |
| 4 | `Bootstrap.mountIndoorScene` → `TonightHasLightV0View.initialize` | 状态查询、命令发送、设置更新、分享函数 | 挂载本地室内功能壳 | 用户看到 3/5/8 选择和 N01 互动 |
| 5 | `V0View` → `transitionNightSession` | 选择时长、拖/点暖光、完成小剧场、结束 | 推进 N01 状态 | 核心完成时产生 `NIGHT_COMPLETED` |
| 6 | `Bootstrap.send` → `storeRecentCheckpoint` + `completeNight` | 当前夜晚状态 | 完成点立即落盘并顺序解锁 | 存档更新，结束页可分享 |
| 7 | `V0View` → `requestWechatShare` | 固定分享 payload | 调微信分享或本地失败覆盖层 | 不携带身份、昵称、留言或进度 |
| 8 | `OutdoorGateCRig` → `OutdoorGateCPersistentScheduler` | 累计运行毫秒数 | 保留首轮 B-lite，之后错开环境通道并安排 20 秒后的非固定阵风 | 长时间停留不再每 16 秒整段重播 |
| 9 | 微信 Begin/End、Cocos Hide/Show → `Bootstrap` | 系统中断与前后台事件 | 叠加暂停原因，只在可见且非手动暂停时恢复 | 不偷播、不叠播，中断时间不计入停留时长 |

### 2.3 改动前后对比

- 改动前：V2 主链已接通，但长期户外仍是 Gate C 一次性样片的固定循环；系统中断、分享和失败恢复缺少完整乱序保护。
- 改动后：AppFlow 与 NightSession 主链保留；户外改为持久调度；完成保存、加载重试、分享单飞和系统音频中断形成闭环。
- 真正发生变化的那一步：一次性视觉样片不再直接承担无限运行，运行时间先由持久调度器拆成“首轮、安静期、后续阵风和异步环境通道”。

## 3. 相关对象和字段

| 对象/接口/事件 | 字段或参数 | 白话含义 | 谁写入/传入 | 谁读取/使用 | 什么时候变化 |
|---|---|---|---|---|---|
| `AppFlowState` | `phase` | 现在处在启动、户外、进门、室内或结束页 | `transitionAppFlow` | `Bootstrap`、`V0View` | 启动、点门、加载、完成后 |
| `AppFlowState` | `overlay` | 当前是否有设置、暂停、分享或错误层 | `transitionAppFlow` | `V0View` | 打开设置、分享失败、后台恢复 |
| `NightSessionState` | `phase` | 室内第一夜的当前步骤 | `transitionNightSession` | `V0View`、`Bootstrap` | 选时长、拖拽、微剧场、收束 |
| `NightSessionState` | `coreCompleted` | 第一夜核心仪式是否完成 | `transitionToCoreComplete` | `completeNight` 路径 | 暖光到水壶成功时 |
| `LocalSaveV2` | `recentAppCheckpoint` | 下次启动回到户外还是室内 | `storeRecentAppCheckpoint` | `Bootstrap.onLoad` | 进屋、离开、完成后 |
| `UserSettingsV2` | `musicEnabled/ambientEnabled/feedbackEnabled` | 三类声音开关 | 设置面板 | 音频控制器和户外场景 | 用户切换设置时 |
| 微信分享 payload | `title/query` | 固定分享入口 | `createSharePayload` | 微信分享 API 和启动解析 | 用户打开分享预览时 |
| `OutdoorGateCPersistentScheduler` | `recurringGustStartsMs/nextGustStartMs` | 已安排的后续阵风起点 | 固定种子调度器 | `OutdoorGateCRig` | 运行跨过下一阵风起点时增长 |
| `NightSessionState` | `pauseReason` | 为什么室内暂时停止 | 手动、后台或音频中断命令 | Bootstrap 的 End/Show 恢复判断 | 暂停、恢复时 |
| `OutdoorGateCAudioGate` | `backgroundPaused/interruptionPaused` | 两种系统暂停是否仍有效 | Cocos Hide/Show 与微信 Begin/End | `canPlayCommon` | 前后台或系统抢占变化时 |
| `TonightHasLightBootstrap` | `shareInFlight/shareAttemptToken` | 是否已有一次原生分享尚未结束 | `requestWechatShare` | 分享 success/fail 闭包 | 分享开始、回调或销毁时 |

## 4. 本次出现的开发技术地图

| 开发知识点 | 所属类别 | 在哪里出现 | 本次起什么作用 | 重要程度 |
|---|---|---|---|---|
| 有限状态机 | 架构/前端状态 | `app-flow.ts`、`night-state-machine.ts` | 限制哪些动作在什么阶段有效 | 核心 |
| 本地存档迁移 | 数据与存储 | `local-save.ts` | 从 V1 声音设置迁移到 V2 分轨设置 | 核心 |
| Cocos 生命周期 | 前端/游戏框架 | `Game.EVENT_HIDE/SHOW`、`onLoad/start/onDestroy` | 处理后台暂停、恢复和资源挂载 | 核心 |
| 触摸事件与热区 | 前端/交互 | `bindTap`、拖拽、慢滑分类 | 支持点花、点天空、点门、拖/点替代 | 核心 |
| 微信小游戏配置 | 工程与交付 | `project.config.json`、AppID 同步脚本 | 本地包使用旧 AppID 但不泄露完整值 | 基础或顺带 |
| TypeScript 类型检查 | 测试与质量 | `typecheck:domain`、`typecheck:cocos` | 防止领域代码和 Cocos 代码类型漂移 | 基础或顺带 |
| 静态项目验证 | 测试与质量 | `validate-project.mjs` | 保护完成落盘、音频生命周期和 UI 边界 | 基础或顺带 |
| 可复验伪随机调度 | 算法/动效 | `OutdoorGateCPersistentScheduler` | 生成 8–18 秒不固定但测试可重现的阵风间隔 | 核心 |
| 二分查找与小型缓存 | 数据结构/性能 | `lastStartAtOrBefore`、阵风起点数组 | 长时间运行时快速找到当前阵风 | 基础或顺带 |
| 乱序生命周期测试 | 测试/并发 | `bootstrap-audio-interruption.test.ts` | 覆盖 Begin/End 与 Hide/Show 的不同到达顺序 | 核心 |
| 单飞与令牌 | 并发/幂等 | `shareInFlight/shareAttemptToken` | 防止重复分享和迟到回调覆盖新状态 | 核心 |

### 4.1 核心技术

#### 双状态机分层

- 先用白话说它是什么：外层管“在哪个大场景”，内层管“室内第一夜走到哪一步”。
- 本次具体怎么用：`AppFlowState` 管户外、点门、加载、结束页和覆盖层；`NightSessionState` 管时长、核心仪式、小剧场和收束。
- 为什么这样用：户外不能误写五夜进度，室内完成又必须能准确落盘，混在一个状态机会容易串错。
- 这样做的好处：点门、后台、分享失败、加载失败都可以各自被拒绝或恢复，不会靠页面文字硬撑。
- 它的限制或代价：状态更多，必须用测试保护竞态和不变量。
- 相关字段、函数、接口或文件：`transitionAppFlow`、`transitionNightSession`、`AppFlowState.phase`、`NightSessionState.phase`。
- 证据：`app-flow.test.ts`、`night-state-machine.test.ts` 通过；`npm run verify` 75/75 PASS。

#### 完成点立即落盘

- 先用白话说它是什么：水壶互动成功时就记“今晚完成”，不是等用户最后离开页面才记。
- 本次具体怎么用：`NIGHT_COMPLETED` effect 出现后，`Bootstrap.send` 先保存最近房间安全点，再调用 `completeNight` 顺序解锁。
- 为什么这样用：用户可以继续坐一会儿或提前离开，完成状态不应丢失；但未完成前退出不能误记完成。
- 这样做的好处：体验更贴近“完成核心仪式即完成今晚”，也更容易恢复。
- 它的限制或代价：结束页和完成状态分离，测试必须覆盖“完成但还没退出”的存档。
- 相关字段、函数、接口或文件：`NIGHT_COMPLETED`、`storeRecentCheckpoint`、`completeNight`、`recentSafeCheckpoint`。
- 证据：`local-save.test.ts` 覆盖 completed checkpoint；`validate-project.mjs` 检查 `completeNight` 只在核心 effect 路径调用一次。

#### 持久调度与可复验的“随机”

- 先用白话说它是什么：用户看到的风不固定循环，但同一份代码在测试里仍能算出完全相同的时间表。
- 本次具体怎么用：`0–9.8s` 保留 B-lite；之后呼吸、云、星和花使用错开的周期；`20s+` 用固定种子生成 8–18 秒的阵风间隔，每次阵风仍复用原六段 cue。
- 为什么这样用：真正随机难稳定复现，固定 16 秒又很机械；固定种子同时保留自然变化和测试能力。
- 这样做的好处：不会整段同步重启，出现问题时又能精确定位到同一毫秒和同一阵风。
- 它的限制或代价：间隔可变但阵风强弱仍固定，因为幅度属于用户批准的样式；要随机强弱必须另行批准。
- 相关字段、函数、接口或文件：`OutdoorGateCPersistentScheduler`、`sampleOutdoorGateCPersistentTimeline`、`outdoorGateCRecurringGustIntervalMs`。
- 证据：时间轴测试逐值比较首轮样片、检查 8–18 秒范围、非固定间隔、减动静态和长时采样；构建包验证找到持久调度合同。

#### 叠加暂停与乱序恢复

- 先用白话说它是什么：后台和来电可能先后发生，只有所有阻断都结束、游戏又在前台时才允许继续。
- 本次具体怎么用：户外音频分别记录 `backgroundPaused` 与 `interruptionPaused`；室内把 `audio-interruption` 作为暂停原因，Bootstrap 按 Begin/End/Hide/Show 的真实顺序判断恢复。
- 为什么这样用：只用一个“暂停了”布尔值会在 End 先到或 Show 先到时偷播、卡死或把手动暂停自动解开。
- 这样做的好处：重复事件幂等，手动暂停永不被系统事件越权恢复，中断时长也不进入 3/5/8 分钟的活跃时长。
- 它的限制或代价：本地测试只能模拟事件顺序，真实来电、锁屏和耳机抢占仍要微信真机验证。
- 相关字段、函数、接口或文件：`audioInterruptionActive`、`appHidden`、`pauseReason`、`backgroundPaused`、`interruptionPaused`。
- 证据：`bootstrap-audio-interruption.test.ts` 覆盖两种相反乱序和重复 Begin/End；音频门测试覆盖双暂停、静音和首触前状态。

### 4.2 基础或顺带用到的知识

- **Cocos 构建退出码**：当前项目已记录 Cocos CLI 返回码 `36` 按官方口径代表构建成功；本轮仍用构建日志 `build Task (wechatgame) Finished` 做配套证据。
- **AppID 掩码**：完整 AppID 不写文档；同步脚本只输出前四位和后四位，避免把项目身份到处传播。
- **减少动态**：户外减动时关闭位移和草浪，只保留亮度等价反馈；室内按钮按压缩放也在减动下关闭。
- **大字模式**：室内功能壳按 120% 放大文字，并禁止 `Label.Overflow.SHRINK`。
- **分享单飞**：`shareInFlight` 是简单的“正在分享”开关，`shareAttemptToken` 用来忽略同一轮结束后的迟到回调。
- **原子 AppID 同步**：脚本先写临时文件再改名，构建后只输出掩码并核对源、目标 AppID 相等。

### 4.3 想过但没有采用的技术

- **远程微信预览/体验版**：未采用。适合真机验收阶段；本次用户要求先完善主功能，而且旧室内仍是 local-only 壳，不能直接作为外部视觉候选。
- **正式室内美术替换**：未采用。适合正式 Gate D；本次没有用户批准室内成年人＋猫动作、房间视觉、门转场和分享卡视觉。

## 5. 这个需求能不能做，怎么判断

| 业务目标或限制 | 现有代码/数据是否支持 | 可以使用的技术 | 本次选择 | 判断依据或缺少的前提 |
|---|---|---|---|---|
| 先完善主功能 | 支持，已有 Cocos 工程和状态机 | AppFlow、NightSession、LocalSaveV2、持久调度器 | 本地 D-lite V3 | 75 项自动验证和微信本地构建通过 |
| 不改变已批样式 | 支持，户外样式由 V7/B-lite 锁定 | 只改接线和功能壳 | 不重绘、不换资源 | 文档和代码均记录 local-only 边界 |
| 现在进入正式测试 | 不完全支持 | 真机矩阵、人测、正式 UI | 暂不执行 | 旧室内视觉和外部证据仍 `BLOCKED` |

## 6. 为什么这样实现

- 最关键的实现选择：主链继续用双状态机，长期动效另设调度器，不把一次性证据时间轴硬循环成正式运行时。
- 为什么当前方案够用：它能把主功能与关键异常完整走通，同时保持 V7/B-lite 视觉和单次风链参数不变。
- 为什么没有必要做得更复杂：本轮不做正式生产资产、账号、云存档、分析系统或远程发布。
- 什么情况下当前方案会不够用：要给外部用户测试时，必须先批准并接入正式室内 UI、音乐/短音效和分享卡视觉。

## 7. 风险和容易出错的地方

| 风险或失败场景 | 会发生什么 | 当前怎么保护 | 还需要注意什么 |
|---|---|---|---|
| 旧室内 Graphics 壳被误当正式视觉 | 外部测试反馈会污染 UI 判断 | 文档标为 local-only，不得外部预览 | 正式测试前替换室内视觉 |
| 手动暂停后后台恢复音频 | 画面仍暂停但声音响起 | `handleGameShow` 只在非 paused 或后台暂停恢复时恢复音频 | 真机生命周期仍要测 |
| Cocos 重构建覆盖旧 AppID | 本地包回到通用测试 ID | 构建后用同步脚本重写并掩码核对 | 每次构建后都要复核 |
| 分享携带身份或进度 | 违背固定私信语气和隐私边界 | `createSharePayload` 固定 title/query | 前台分享回流仍需产品裁决 |
| 16 秒整段重播 | 呼吸、星、花和风同时复位，显得机械 | 持久调度将环境通道错开，阵风 20 秒后按 8–18 秒安排 | 真机长时体感仍要测 |
| Begin/End 与 Hide/Show 乱序 | 偷播、永久暂停或解开手动暂停 | 独立暂停字段、明确 pauseReason、重复事件幂等 | 来电/锁屏仍需真机 |
| 分享按钮连点或迟到回调 | 调起多个分享或覆盖新一轮状态 | 单飞开关与 attempt token | 微信实际取消回调仍需真机 |
| 核心完成写盘失败 | 页面说完成但退出后丢进度 | `save-error` 阻断层与 `retryPersist` | 真实存储配额/异常仍需设备验证 |

## 8. 测试与验证

| 命令或操作 | 结果 | 它证明了什么 |
|---|---|---|
| `npm run verify` | 75/75 PASS | 项目结构、领域/Cocos 类型、状态机、调度、生命周期、存档和分享回归全部通过 |
| Cocos 微信本地构建 | 日志到达 `build Task (wechatgame) Finished` | 代码能产出本地小游戏包 |
| `npm run validate:wechat-mainflow-build -- build/gate-d-mainflow-v3-dev/wechatgame` | PASS | 构建包内包含持久调度、音频中断、恢复和固定分享入口，不含旧 URLSearchParams |
| 包体统计 | 132 文件 / 3,802,934 bytes | 主包仍处于 4 MiB 保守预算内 |
| AppID 掩码核对 | `wx49…6f55` | 本地包已同步旧 AppID，未在文档写完整值 |
| 负责人复核 | 2026-08-24 重新通过 75/75、本地包验证、SHA 核对、包体预算和 AppID 泄漏扫描 | V3 记录与磁盘证据一致；完整 AppID 未出现在源码、文档、测试或脚本中 |

- 没有执行的验证及原因：未做远程 preview、upload、体验版、审核、发布、真人测试、微信真机矩阵和 OLED/LCD 低亮，因为用户要求先完善主功能，且旧室内视觉仍未正式批准。
- 剩余风险：正式室内 UI、户外设置入口、门转场、分享卡、音乐和短音效仍需用户批准；前台分享回流需要单独裁决。
- Git/合并/发布状态：当前目录不是 Git 仓库；未提交、未推送、未上传、未发布。

## 9. 下次遇到类似需求，我该怎么想

1. 先问清楚什么业务问题：用户是要先证明体验效果，还是先把功能链打通。
2. 再找到哪个入口和调用链：启动入口、场景切换、内层状态机、存档、外部平台配置。
3. 重点查看哪些对象或字段：`AppFlowState`、`NightSessionState`、`LocalSaveV2`、`project.config.json`。
4. 可以想到哪些开发技术：状态机、可复验调度、叠加暂停、存档迁移、单飞、触摸热区、构建后配置同步。
5. 怎么判断简单方案够不够：功能链和关键乱序在本地可复现通过、构建包包含实现且不改变未批准视觉，就够做本地候选；外部测试仍需正式 UI 和真机证据。

## 10. 自测题与参考答案

### 题目 1：为什么这次不能直接生成新二维码给人测？

- 参考答案：因为用户要求先完善主功能，而且旧室内仍是 local-only Graphics 功能壳；正式室内 UI、门转场、分享卡、音乐和真机矩阵还没批准或验证。
- 我的回答：

### 题目 2：点门后程序调用链大致怎么走？

- 参考答案：户外热区触发 `onEnterDoor`，Bootstrap 发送 `REQUEST_ENTER_HOUSE`，AppFlow 进入 `door-transition`，随后 `DOOR_TRANSITION_DONE` 进入 `indoor-loading`，再 `mountIndoorScene` 挂载室内 N01 功能壳。
- 我的回答：

### 题目 3：为什么要同时有 `recentAppCheckpoint` 和 `recentSafeCheckpoint`？

- 参考答案：`recentAppCheckpoint` 决定下次回到户外还是室内；`recentSafeCheckpoint` 记录室内夜晚内部的安全位置。两者分开可避免户外互动误写五夜进度。
- 我的回答：

### 题目 4：为什么户外调度要“看起来不固定，但测试时可复现”？

- 参考答案：固定循环会显得机械，完全随机又难复现问题；固定种子能生成非固定的 8–18 秒间隔，同时让测试每次得到同一时间表。单次风链参数仍保持 B-lite 不变。
- 我的回答：

### 题目 5：为什么来电结束不能无条件立刻恢复声音和会话？

- 参考答案：游戏可能仍在后台，或者用户原本就是手动暂停；只有回到前台、系统中断已结束、暂停原因属于后台或音频中断时才能恢复，手动暂停不能被越权解开。
- 我的回答：

## 11. 待确认与后续观察

- [ ] 正式室内成年人＋猫动作、暖光物件、房间视觉、门转场和分享卡视觉。
- [ ] 户外设置入口的正式 UI、360/390/430 大字适配。
- [ ] 音乐方向和短音效素材。
- [ ] 前台已打开游戏时，从分享卡回来的产品处理。
- [ ] 微信真机生命周期、低亮、性能 soak 和真人体感测试。
