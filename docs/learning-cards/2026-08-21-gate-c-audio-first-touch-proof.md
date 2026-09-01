---
task_id: "2026-08-21-gate-c-audio-first-touch-proof"
task_type: "requirement"
title: "Gate C environment wind first-touch audio proof"
status: "verified"
completed_at: "2026-08-21"
branch: "not-a-git-repository"
commit: "not-committed"
---

# 2026-08-21-gate-c-audio-first-touch-proof：Gate C environment wind first-touch audio proof

## 一句话结论

夜风草坡的环境风已按“首次触碰前静音、触碰后再播放”的合同接入并通过浏览器证据验证；这只证明音频链路，不代表 Gate C 视觉通过。

## 1. 先讲业务：这次到底做了什么

- 谁会遇到这个场景：第一次进入夜风草坡、还没有触碰屏幕的玩家。
- 他想做什么：先安静看夜景，不被突然自动播放声音打扰。
- 原来是什么情况：r5 视觉样片没有接入用户已试听认可的真实环境风。
- 现在是什么情况：`AUD-OUTDOOR-001` 的 26 秒 OGG 循环进入 Cocos 资源；首触前保持静音，首触后环境风渐入。
- 为什么要改：微信小游戏环境里自动播放声音不可靠，也和产品“先安静”目标冲突。
- 验收结果：`npm run verify` 通过；`audio-proof-v1` 的浏览器证据通过；微信真机、耳机/外放主观复听和音乐仍待确认。

## 2. 再讲底层：程序是怎么做到的

### 2.1 底层原理一句话

本质上是在场景里挂一个音频门控组件：先加载音频但不播放，等玩家第一次触碰后再调用 `AudioSource.play()` 并把音量从 0 渐入。

### 2.2 调用链

| 顺序 | 谁调用谁 | 传入什么 | 做了什么 | 输出或状态变化 |
|---|---|---|---|---|
| 1 | `OutdoorGateCScene` 创建 `OutdoorGateCAudioGate` | Cocos 节点 | 挂载一个持久音频组件 | 场景具备音频门控 |
| 2 | `OutdoorGateCAudioGate.onLoad` 调用 `resources.load` | `audio/outdoor-gate-c/night-breeze-loop-v1` | 预加载环境风 OGG | `ambientLoadState=loaded`，但不播放 |
| 3 | Cocos 输入系统触发 `TOUCH_START` | 玩家首触事件 | 设置 `unlocked=true`，启动可用音频 | `ambientPlayRequestCount=1` |
| 4 | `AudioSource.STARTED` 回调 | 启动后的音源 | 将音量归零并开启渐入 | 0.35 秒内到目标音量 0.2 |
| 5 | 静音或后台事件 | 设置或生命周期事件 | 暂停音频并归零 | 恢复时复用同一个 `AudioSource` |

### 2.3 改动前后对比

- 改动前：视觉样片证明里 `audioAssigned=false`，只能证明门控结构，不能证明真实风声。
- 改动后：`ambientAssigned=true`，首触前 `ambientPlaying=false / ambientVolume=0`，首触后单一音源播放并渐入。
- 真正发生变化的那一步：`OutdoorGateCAudioGate` 从占位门控变成加载 `night-breeze-loop-v1.ogg` 的真实门控。

## 3. 相关对象和字段

| 对象/接口/事件 | 字段或参数 | 白话含义 | 谁写入/传入 | 谁读取/使用 | 什么时候变化 |
|---|---|---|---|---|---|
| `AUD-OUTDOOR-001` | `sha256` | 进包 OGG 的身份 | 资产台账 | 主任务、QA | 替换音频文件时变化 |
| `OutdoorGateCAudioGate` | `unlocked` | 是否已经首次触碰 | `handleTouch` | `canPlay` | 第一次触碰后为 true |
| `OutdoorGateCAudioGate` | `enabledByUser` | 用户是否开启声音 | `setEnabled` | `canPlay`、测试 | 静音开关变化时 |
| `OutdoorGateCAudioGate` | `backgroundPaused` | 是否处于后台暂停 | `pauseForBackground` / `resumeFromBackground` | `canPlay` | 前后台切换时 |
| `AudioSource` | `volume` | 实际播放音量 | 渐入和暂停逻辑 | Cocos 音频系统、证据脚本 | 触碰、静音、恢复时 |
| `Input.EventType.TOUCH_START` | 事件 | 首次触碰入口 | Cocos 输入系统 | 音频门控组件 | 玩家触碰屏幕时 |

## 4. 本次出现的开发技术地图

| 开发知识点 | 所属类别 | 在哪里出现 | 本次起什么作用 | 重要程度 |
|---|---|---|---|---|
| Cocos `AudioSource` | 前端/游戏引擎 | `outdoor-gate-c-audio-gate.ts` | 播放和暂停环境风 | 核心 |
| 首触解锁门控 | 交互/平台兼容 | `TOUCH_START` 监听 | 避免首屏自动播放 | 核心 |
| 异步资源加载 | 前端/并发 | `resources.load` 回调 | 处理加载成功、失败、销毁后返回 | 核心 |
| 生命周期暂停恢复 | 前端/游戏生命周期 | `Game.EVENT_HIDE/SHOW` | 防止后台叠播或继续播放 | 核心 |
| 资产来源台账 | 工程质量/授权 | `asset-register.csv`、`ASSET-PROVENANCE.md` | 记录 CC0 来源、哈希和批准范围 | 核心 |
| Node test mock | 测试 | `outdoor-gate-c-audio-gate.test.ts` | 模拟 Cocos 输入、音源和资源加载 | 基础或顺带 |
| SHA-256 校验 | 工程质量 | `HASHES.sha256` 和 OGG 哈希 | 防止证据和文件错位 | 基础或顺带 |
| ffprobe | 媒体验证 | OGG 编码检查 | 确认时长、采样率、声道和码率 | 基础或顺带 |

### 4.1 核心技术

#### 首触音频门控

- 先用白话说它是什么：不是一进页面就播放，而是先把声音准备好，等用户碰一下屏幕后才开声。
- 本次具体怎么用：`onLoad` 预加载 OGG，`TOUCH_START` 才设置 `unlocked=true` 并启动 `AudioSource`。
- 为什么这样用：符合产品“先安静”的体验，也更贴近移动端音频播放限制。
- 这样做的好处：首屏不会突然响；静音下仍能看完整画面；首触后反馈明确。
- 它的限制或代价：微信真机仍需单独验证，浏览器证明不能替代平台证明。
- 相关字段、函数、接口或文件：`unlocked`、`canPlay`、`startAvailableAudio`、`outdoor-gate-c-audio-gate.ts`。
- 证据：`chrome-audio-proof-report.json` 中首触前播放请求为 0，首触后单次播放并渐入。

#### 异步加载和生命周期保护

- 先用白话说它是什么：音频文件可能晚到、加载失败，页面也可能突然切后台，代码必须在这些乱序情况下保持安静和可恢复。
- 本次具体怎么用：加载失败进入 silent non-blocking；销毁后加载成功会释放资源；后台暂停会把音量归零，回来后复用一个音源。
- 为什么这样用：音频不能阻塞赏景，也不能因为后台恢复产生叠播。
- 这样做的好处：单元测试能覆盖竞态；浏览器证据能证明没有重复 AudioSource。
- 它的限制或代价：真实微信后台、锁屏、来电等仍未覆盖。
- 相关字段、函数、接口或文件：`ambientLoadState`、`pauseForBackground`、`resumeFromBackground`、`onDestroy`。
- 证据：Cocos 单元测试 30/30 通过，音频专项覆盖加载失败、销毁后加载成功、静音和恢复。

### 4.2 基础或顺带用到的知识

- **Smoothstep 渐入**：用一个平滑曲线把音量从 0 推到 0.2，避免突然开声。
- **哈希校验**：用 SHA-256 证明台账、证据和实际 OGG 指向同一版文件。
- **浏览器证据边界**：Chrome 的 `pagehide/pageshow` 只能证明浏览器模拟生命周期，不等于微信真机。
- **证据污染隔离**：越权 `showall-navy-r6-audio-wind` 被记录为 `unauthorized intermediate / superseded`，不能混入 Gate 结论。

### 4.3 想过但没有采用的技术

- **启动即自动播放风声**：未采用。它可能符合“先听见风”的直觉，但和当前首触合同及移动端限制冲突。
- **直接引用 14 秒试听 MP3**：未采用。试听文件只用于用户听感确认，运行时使用 26 秒 OGG 循环。

## 5. 这个需求能不能做，怎么判断

| 业务目标或限制 | 现有代码/数据是否支持 | 可以使用的技术 | 本次选择 | 判断依据或缺少的前提 |
|---|---|---|---|---|
| 首触前不能出声 | 支持 | 预加载但不播放 | `TOUCH_START` 解锁 | 证据显示播放请求为 0 |
| 首触后要有风声反馈 | 支持 | `AudioSource.play()` + 渐入 | 0.35 秒环境风渐入 | 浏览器样本到 431ms 达 0.2 |
| 不得进入 Gate D | 支持 | 文档停止线 | Gate C 仍为 `FAIL` | GC-06 风链裸眼可读性仍失败 |

## 6. 为什么这样实现

- 最关键的实现选择：只接入用户批准的环境风，不接入未批准音乐。
- 为什么当前方案够用：Gate C 只需要证明真实环境风门控和循环，不需要完整混音系统。
- 为什么没有必要做得更复杂：正式版的 3–4 个轻风变化和音乐分轨还没有进入当前 Gate。
- 什么情况下当前方案会不够用：进入 Gate D 或正式体验版时，需要微信真机生命周期、多个风样本和最终混音。

## 7. 风险和容易出错的地方

| 风险或失败场景 | 会发生什么 | 当前怎么保护 | 还需要注意什么 |
|---|---|---|---|
| 资源加载晚于首触 | 用户触碰后没有立即播放 | 加载成功后再次调用 `startAvailableAudio` | 弱网真机还要测 |
| 销毁后加载成功 | 已销毁节点持有资源 | 回调中释放资源并不播放 | 后续改动要保留测试 |
| 后台恢复叠播 | 同时出现多个风声 | 复用单个 `AudioSource`，证据计数为 1 | 微信真机仍待测 |
| 证据污染 | 把越权 r6 当通过证据 | 文档明确排除 r6 | 后续构建前清理试听 MP3 |

## 8. 测试与验证

| 命令或操作 | 结果 | 它证明了什么 |
|---|---|---|
| 在 `cocos-project` 运行 `npm run verify` | 通过，30 个 Cocos 测试全过 | 工程结构、领域类型、旧逻辑与音频门控回归通过 |
| `ffprobe night-breeze-loop-v1.ogg` | Vorbis，48kHz，2 声道，26.000 秒 | 运行时音频文件格式和时长符合记录 |
| `shasum -c HASHES.sha256` | OK | 音频证明目录内证据未错位 |
| 浏览器音频证明 | PASS | 首触前静音、首触后渐入、静音恢复、模拟前后台和循环边界成立 |

- 没有执行的验证及原因：微信真机、耳机/手机外放主观接缝复听、最终音乐混音未在本轮授权范围内完成。
- 剩余风险：`cocos-project/assets/resources/audio/night-breeze-audition-v1.mp3` 仍在 resources 下，后续构建前应授权清理或移出资源包。
- Git/合并/发布状态：当前目录不是 Git 仓库；未提交、未推送、未上传体验版。

## 9. 下次遇到类似需求，我该怎么想

1. 先问清楚业务问题：声音什么时候能响，什么时候必须安静。
2. 再找到入口和调用链：场景创建、资源加载、用户输入、音源播放、生命周期。
3. 重点查看对象或字段：`unlocked`、`enabledByUser`、`backgroundPaused`、`ambientPlayRequestCount`、资产哈希。
4. 可以想到哪些开发技术：音频门控、异步加载保护、生命周期暂停、证据哈希、浏览器和真机分层验证。
5. 怎么判断简单方案够不够：Gate C 只需单风声证明；正式版才需要多风样本、音乐分轨和真机矩阵。

## 10. 自测题与参考答案

### 题目 1：为什么首触前不能直接播放风声？

- 参考答案：产品上要先安静看夜景，技术上移动端自动播放也不可靠，所以先加载但不播放，等用户触碰后再开声。
- 我的回答：

### 题目 2：用户第一次触碰后，调用链怎么走？

- 参考答案：Cocos 输入触发 `TOUCH_START`，`OutdoorGateCAudioGate` 设置 `unlocked=true`，调用 `startAvailableAudio`，再让 `AudioSource` 播放并通过 `STARTED` 回调进入渐入。
- 我的回答：

### 题目 3：哪些字段共同决定音频能不能播放？

- 参考答案：`unlocked` 必须为 true，`enabledByUser` 必须为 true，`backgroundPaused` 必须为 false，组件不能销毁，且音源要有 clip。
- 我的回答：

### 题目 4：这次最核心的测试保护了什么？

- 参考答案：保护首触前播放请求为 0、首触后只请求一次、静音和恢复不叠播、加载失败不阻塞、销毁后加载成功会释放资源。
- 我的回答：

### 题目 5：为什么 `audio-proof-v1` 不能让 Gate C 通过？

- 参考答案：它只证明环境风音频链路；Gate C 的视觉风链 GC-06 仍在正常倍率下不可稳定裸眼识别，且盲测、低亮和微信真机仍缺证据。
- 我的回答：

## 11. 待确认与后续观察

- [ ] 微信真机生命周期、锁屏、来电或系统抢占后是否不叠播。
- [ ] 耳机和手机外放是否听不到明显 26 秒循环接缝。
- [ ] 音乐素材批准后，2–3 秒音乐渐入是否与环境风并存且不抢焦。
- [ ] 后续构建前清理或移出不应进包的试听 MP3。
