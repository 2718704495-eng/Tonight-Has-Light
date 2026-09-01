---
task_id: "Gate-C-V7-r5"
task_type: "requirement"
title: "Gate C V7 r5 动态样片运行时合成一致性"
status: "draft"
completed_at: "2026-08-21"
branch: "不适用：当前目录不是 Git 仓库"
commit: "未提交"
---

# Gate-C-V7-r5：Gate C V7 r5 动态样片运行时合成一致性

## 一句话结论

r5 候选已经证明“浏览器运行时能按 30 层复现 V7 静态画面，并展示 9.8 秒夜风微动”的本地工程子目标；但完整 Gate C 是 `FAIL`，因为独立 QA 判定正常倍率下完整风链裸眼可读性不足。真实音频、盲测、真机和低亮暗部证据仍是 `BLOCKED`。

## 1. 先讲业务：这次到底做了什么

- 谁会遇到这个场景：下班后打开《今夜有灯》，想先在夜空下坐一会儿的用户。
- 他想做什么：零操作也能看见成年人背影和普通家猫一起望向星空，风从草坡传到人物和猫，两朵小花弱光呼吸，小屋门不催促。
- 原来是什么情况：旧候选里出现过旧 handoff、自证式 validator、裁切、安全边颜色、Camera 绑定和异步资源释放问题。
- 现在是什么情况：唯一候选是 `gate-c-v7-20260821-41b0b7b1-showall-navy-r5`；旧 `4834...`、`07b...`、旧 `41b...`、`showall-r2`、`navy-r3`、`navy-r4` 全部排除。
- 为什么要改：Gate C 不能只说“画面像”，必须证明 Cocos 真实显示的画面、图层、动效和减动状态没有偏离用户批准的 V7。
- 验收结果：r5 本地工程自检和独立 QA 通过一批关键子项；完整 Gate C 不能标 PASS，GC-06 风链可读性为 P1 `FAIL`。

## 2. 再讲底层：程序是怎么做到的

### 2.1 底层原理一句话

程序把 V7 样片工程化成 30 个持久 Sprite，按 manifest 的顺序、坐标、透明度和 Screen 混合方式叠回画面，再用时间轴只驱动少量星、花、草、人物和猫的微动。

### 2.2 调用链

| 顺序 | 谁调用谁 | 传入什么 | 做了什么 | 输出或状态变化 |
|---|---|---|---|---|
| 1 | handoff validator 读取 manifest | 30 层文件、hash、位置、render order、blend | 重建离线 neutral composite，检查 10 颗主星 ROI | 输出 composite、diff、metrics 和 star ROI 证据 |
| 2 | `OutdoorGateCScene` 读取 Cocos resources | manifest、Screen effect、30 个 SpriteFrame | 校验合同后创建持久场景和 30 个 Sprite | `spriteCount=30`、`loadedFrameCount=30` |
| 3 | `OutdoorGateCRig` 调用 timeline | elapsedMs、reducedMotion | 应用风、异步呼吸、主星错峰、花光和云层微动 | 默认态可动；减动态 transform 和 overlay 为 0 |
| 4 | browser 采证脚本打开 r5 构建 | 390/360/430 viewport、零操作和减动模式 | 采集截图、录屏、console、性能、恢复和音频 gate 状态 | 输出 r5 evidence 目录 |
| 5 | fidelity 脚本比较截图 | V7、离线 composite、Cocos runtime 截图 | 逐像素和逐星 ROI 对比 | t=0、t=9.8、reduced、430 内容区均为零差 |

### 2.3 改动前后对比

- 改动前：候选证据中曾混入旧版本、错误层顺序/身份、自证式截图和失败后资源释放竞态。
- 改动后：r5 绑定新的 handoff hash 和 build ID；资源批次等待全部 settle 后再统一释放，失败注入后 `loadedFrameCount=0`，恢复后为 30。
- 真正发生变化的那一步：资源加载不再用会早退的 `Promise.all` 语义，而是 `Promise.allSettled` 后再决定提交或释放整批资源。

## 3. 相关对象和字段

| 对象/接口/事件 | 字段或参数 | 白话含义 | 谁写入/传入 | 谁读取/使用 | 什么时候变化 |
|---|---|---|---|---|---|
| `OUTDOOR_GATE_C_MANIFEST_CONTRACT` | `approvedMasterSha256` | 用户批准的 V7 母版身份 | 合同文件 | manifest 校验和测试 | V7 批准后锁定 |
| `OUTDOOR_GATE_C_MANIFEST_CONTRACT` | `approvedHandoffHashesSha256` | 当前允许消费的 handoff 包身份 | 合同文件 | 单元测试和项目记忆 | r5 handoff 锁定后更新 |
| `prototype_layer_manifest.json` | `render_order` | 真实运行时图层顺序 | UI handoff | validator、Cocos 场景 | handoff 冻结时 |
| `prototype_layer_manifest.json` | `neutral_opacity` | 静态中性帧哪些层可见 | UI handoff | Cocos Sprite opacity | handoff 冻结时 |
| `loadSettledResourceBatch` | `paths/load/release` | 一批资源要么全部可用，要么释放已加载项 | Cocos 场景 | 资源加载辅助函数 | 挂载资源时 |
| `run-report.json` | `audioAssigned` | 是否已经接入真实音频素材 | 浏览器采证 | QA 和主任务 | 当前为 `false` |

## 4. 本次出现的开发技术地图

| 开发知识点 | 所属类别 | 在哪里出现 | 本次起什么作用 | 重要程度 |
|---|---|---|---|---|
| Manifest 驱动渲染 | Cocos/UI | `outdoor-visual-manifest.ts`、`OutdoorGateCScene` | 防止手写层级和坐标漂移 | 核心 |
| `Promise.allSettled` 资源批次 | 异步/资源生命周期 | `settled-resource-batch.ts` | 失败时释放所有已成功加载的帧 | 核心 |
| Runtime screenshot fidelity | 视觉 QA | r5 `runtime-fidelity-report.json` | 证明真实浏览器截图没有样式漂移 | 核心 |
| Cocos Sprite 与自定义 Screen material | 渲染 | `outdoor_screen_sprite.effect`、`OutdoorGateCScene` | 让弱光 overlay 只增亮不形成暗圈 | 核心 |
| 时间轴采样函数 | 动效 | `outdoor-gate-c-timeline.ts` | 控制风、呼吸、星和花的节奏 | 核心 |
| 减少动态模式 | 可访问性 | timeline、rig、浏览器证据 | 关闭 transform、草浪、视差和自动亮度 | 核心 |
| 首触音频 gate | 音频/平台限制 | `OutdoorGateCAudioGate` | 触碰前不播放，触碰后才允许启动 | 基础或顺带 |
| SHA-256 锁版本 | 工程交付 | handoff hash、manifest hash | 防止旧证据混入当前 Gate | 基础或顺带 |

### 4.1 核心技术

#### Manifest 驱动的运行时合成

- 先用白话说它是什么：把“画面怎么拼”写成数据清单，Cocos 照清单创建图层。
- 本次具体怎么用：manifest 固定 30 层的顺序、位置、尺寸、透明度和混合方式；Cocos 校验后创建 30 个 Sprite。
- 为什么这样用：Gate C 要验证分层微动，不允许用整图背景冒充可动样片。
- 这样做的好处：QA 能独立按同一 manifest 重合成，发现运行时和批准稿是否偏离。
- 它的限制或代价：r5 仍是可丢弃动态样片；Gate D 前还要做正式可编辑资产和授权登记。
- 相关字段、函数、接口或文件：`validateOutdoorVisualManifest`、`resourcePathForLayer`、`OutdoorGateCScene`。
- 证据：r5 `run-report.json` 显示 `spriteCount=30`，fidelity 报告显示关键静态帧对 V7 零差。

#### 资源批次的失败恢复

- 先用白话说它是什么：一批图层只要有一个失败，就等其余请求也结束，然后释放已经拿到的资源。
- 本次具体怎么用：`loadSettledResourceBatch` 用 `Promise.allSettled` 收集所有结果；有失败时遍历 fulfilled 项并调用 `release`。
- 为什么这样用：旧候选可能在第一个失败发生时早退，后续慢成功的资源没人释放。
- 这样做的好处：失败路径不会留下半批 SpriteFrame，也不会把未完整资源提交到场景。
- 它的限制或代价：这只证明加载阶段的一类竞态；微信真机的后台、音频抢占和长时间停留还需专项验证。
- 相关字段、函数、接口或文件：`settled-resource-batch.ts`、`mount-failure-recovery-report.json`。
- 证据：失败注入报告中失败态 `loadedFrameCount=0`，恢复态 `loadedFrameCount=30`，`pass=true`。

### 4.2 基础或顺带用到的知识

- **Cocos `SHOW_ALL` 适配**：让完整 390×844 画面在 360/430 宽度保留完整构图，画布外用 `#06265F` 安全边填充。
- **首触音频 gate**：当前代码能记录首次触碰并尝试启动已分配的 AudioSource；但 r5 没有分配真实音频，所以不能证明环境风和音乐渐入。
- **性能采样分层**：录屏路径会受 ReadPixels 影响；硬件路径报告约 60fps，录屏路径约 54.7fps，二者不能混写。
- **Cocos 构建成功码记录**：Cocos Creator CLI 这次退出码为 `36`，官方 3.8 文档明确它表示“构建成功”；日志和实跑产物继续作为第二层证据。若报告保留 `cleanExit=false`，只能解释为“不是 POSIX 0”，不能当成构建风险。

### 4.3 想过但没有采用的技术

- **整屏 PNG 播放**：未采用。它能显示 V7，但不能验证分层、微动和减少动态合同。
- **粒子、Bloom、实时噪声**：未采用。它们会增加性能和样式漂移风险，不符合 V7 克制夜空。
- **未经用户批准的音频素材**：未采用。音频候选需要先确认授权和风格，再接入。

## 5. 这个需求能不能做，怎么判断

| 业务目标或限制 | 现有代码/数据是否支持 | 可以使用的技术 | 本次选择 | 判断依据或缺少的前提 |
|---|---|---|---|---|
| 零操作 9.6–10 秒赏景 | 支持 | Cocos 时间轴、30 层 Sprite | r5 9.866667 秒录屏 | `normal-390x844-zero-operation.mp4` |
| 不发生未批准样式漂移 | 已由本地证据和独立 QA 支持 | 离线合成、runtime 截图对比、ROI | 三类截图和星 ROI 零差 | 后续 A/B 风链改动仍需重新审批 |
| 音频首触后播放 | 结构支持，素材未接入 | AudioSource gate、2.5 秒渐入 | 暂不接入 | `audioAssigned=false`，音频项 `BLOCKED` |
| 可进入正式开发 | 不支持 | Gate C/E 完整验收 | 暂停 | GC-06 风链 `FAIL`，且缺音频、盲测、真机和暗部 |

## 6. 为什么这样实现

- 最关键的实现选择：用 manifest 驱动 30 层 Sprite，而不是整屏 PNG。
- 为什么当前方案够用：Gate C 只要证明已批准 V7 可以在 Cocos 中真实微动。
- 为什么没有必要做得更复杂：还没进入正式 Gate D，不能提前引入完整交互和生产资产管线。
- 什么情况下当前方案会不够用：接入四类户外互动、门转场、正式音频、微信小游戏包体和正式可编辑资产时。

## 7. 风险和容易出错的地方

| 风险或失败场景 | 会发生什么 | 当前怎么保护 | 还需要注意什么 |
|---|---|---|---|
| 旧证据混入 | 团队误判 Gate C 通过 | 项目记忆列出 superseded 构建 | 交付时只引用 r5 |
| validator 自证 | 离线 PASS 但 runtime 漂移 | runtime 截图与 V7/离线 composite 三方比较 | QA 要独立重合成 |
| 部分资源加载失败 | 半批资源泄漏或半场景显示 | `Promise.allSettled` 后统一释放 | 仍需真机后台/长时 soak |
| 音频未接入 | 无法证明首触后风声和音乐渐入 | 明确 `audioAssigned=false` | 用户批准素材后再接入 |
| 风链裸眼可读性不足 | 用户可能感受不到“风从草到人和猫”的传递 | 独立 QA 已把 GC-06 标为 P1 `FAIL` | 先向用户提交 A/B 动效强度方案，批准后再改 |
| 浏览器通过不等于微信通过 | 微信环境可能有性能、音频和生命周期差异 | 只标本地工程候选 | 必须做微信开发者工具和真机 |

## 8. 测试与验证

| 命令或操作 | 结果 | 它证明了什么 |
|---|---|---|
| handoff validator/hash 自检 | 已有报告显示 30 层离线合成对 V7 零差 | handoff 自身可重建 V7 |
| r5 browser 采证 | 390×844 零操作录屏 9.866667 秒，console/page/http error 为 0 | r5 Web-Mobile 构建能在 Chrome 实跑 |
| r5 runtime fidelity | t=0、t=9.8、reduced、430 内容区与 V7/离线 composite 零差 | 关键静态状态没有 runtime 样式漂移 |
| r5 失败注入 | 失败态 `loadedFrameCount=0`，恢复态为 30 | 资源加载失败后没有登记半批帧 |
| `npm run verify` | 通过；Cocos 单元测试 26/26 pass | 保护合同、时间轴、资源批次、旧室内领域逻辑和文档链接 |
| 独立 QA r5 复验 | Gate C 总结为 `FAIL`；GC-06 为 P1 `FAIL`，GC-03/GC-09 `BLOCKED`，GC-11 P2 `FAIL` | 证明 r5 不能进入 Gate D，下一步必须先解决可见风链 |

- 没有执行的验证及原因：真实音频波形、微信开发者工具、真机、OLED/LCD 低亮、盲测和 20 秒体感仍未完成。
- 剩余风险：完整 Gate C 当前为 `FAIL`，不能进入 Gate D。
- 验证顺序注意：handoff validator 会重写离线中性合成 PNG，runtime fidelity 脚本会读取它；这两个命令必须顺序执行，不能并行。
- Git/合并/发布状态：当前目录不是 Git 仓库；未提交、未推送、未上传、未发布。

## 9. 下次遇到类似需求，我该怎么想

1. 先问清楚业务问题：用户批准的是哪张画面，当前 Gate 只允许验证什么。
2. 再找到入口和调用链：handoff manifest 到 Cocos Sprite，再到 timeline 和浏览器证据。
3. 重点查看对象或字段：hash、render_order、neutral_opacity、blend、loadedFrameCount、audioAssigned。
4. 可以想到的开发技术：manifest 驱动渲染、runtime 截图对比、资源批次 allSettled、失败注入、减动等价态。
5. 怎么判断简单方案够不够：Gate C 可丢弃样片可以简单；Gate D 必须换成正式资产、交互、音频和真机验证。

## 10. 自测题与参考答案

### 题目 1：为什么这次不能只用一张 V7 整图当背景？

- 参考答案：因为 Gate C 要证明分层微动、减少动态和运行时合成一致；整图只能证明静态像，不能证明风、星、花、人物和猫的独立动效。
- 我的回答：

### 题目 2：r5 从资源加载到显示的调用链是什么？

- 参考答案：`OutdoorGateCScene` 读取 manifest、effect 和 30 个 SpriteFrame；`loadSettledResourceBatch` 等全部加载结果；成功后创建 30 个 Sprite；`OutdoorGateCRig` 按 timeline 更新动效；浏览器脚本采集截图和视频。
- 我的回答：

### 题目 3：`loadedFrameCount` 在失败恢复里为什么重要？

- 参考答案：它能显示当前场景登记了多少帧资源。失败态为 0 说明没有提交半批资源，恢复态为 30 说明完整批次重新挂载成功。
- 我的回答：

### 题目 4：本次最核心的两个技术点是什么？

- 参考答案：一是 manifest 驱动的 30 层 runtime 合成，二是 `Promise.allSettled` 资源批次失败恢复；前者防视觉漂移，后者防加载竞态和资源泄漏。
- 我的回答：

### 题目 5：为什么现在仍不能说 Gate C 通过？

- 参考答案：r5 证明了运行时合成、星花呼吸、减动、性能和资源恢复等子项，但独立 QA 判定风链在正常倍率下不够清晰；同时音频没有真实素材，盲测、微信真机和暗部证据还缺。
- 我的回答：

## 11. 待确认与后续观察

- [x] 独立 QA 按 GC-01 到 GC-13 从头复验 r5，并判定 Gate C 为 `FAIL`。
- [ ] 用户批准风链 A/B 动效强度方案后，再制作下一候选。
- [ ] 用户批准 CC0 或其他可用音频素材后，再接入环境风和音乐渐入。
- [ ] 微信开发者工具和真实手机验证触控、音频、低亮暗部、前后台和性能。
