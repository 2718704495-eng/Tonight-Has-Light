---
task_id: "GC-WIND-BLITE-V1"
task_type: "requirement"
title: "Gate C wind-chain B-lite candidate verification"
status: "verified"
completed_at: "2026-08-24"
branch: "not a git repository in this workspace"
commit: "not committed"
---

# GC-WIND-BLITE-V1: Gate C wind-chain B-lite candidate verification

## 一句话结论

B-lite 候选已经把风链中最难看清的四个局部调整到用户批准的数值；独立 QA 确认机器合同、V7 样式边界和运行证据成立，并能裸眼读出“草→人物→猫”，但正式真人与真机证据不足，所以 Gate C 为 `BLOCKED`。

## 1. 先讲业务：这次到底做了什么

- 谁会遇到这个场景：打开《今夜有灯》第一场景、只想安静看夜空和吹风的用户。
- 他想做什么：不用操作也能感到风从草坡传到人物和猫身上。
- 原来是什么情况：Wind A 中远草和近草能看见，但人物发梢、衣角、猫耳、猫尾尖在正常倍率下不够稳定可读。
- 现在是什么情况：B-lite 只加强四个角色局部通道，形成“人物随后、猫最后”的两段响应；独立 QA 未发现未关闭 P0/P1。
- 为什么要改：Gate C 的 GC-06 需要正常速度、无标注也能读出完整风链。
- 验收结果：机器自检、仓库验证、证据包哈希与独立 GC-01..GC-13 复验完成；GC-03/06/09/11/12 因真人、音乐或设备证据缺失而 `BLOCKED`，不能进入 Gate D。

## 2. 再讲底层：程序是怎么做到的

### 2.1 底层原理一句话

本质上是一个固定时间轴采样器按毫秒输出每个部件的风强度，再由 Cocos rig 把这个强度换算成局部旋转和叠光透明度。

### 2.2 调用链

| 顺序 | 谁调用谁 | 传入什么 | 做了什么 | 输出或状态变化 |
|---|---|---|---|---|
| 1 | `OutdoorGateCRig.update` -> `sampleOutdoorGateCTimeline` | 当前 `elapsedMs` 和 `reducedMotion` | 每帧采样风、呼吸、星、花、云 | 得到 `OutdoorGateCVisualSample` |
| 2 | `sampleOutdoorGateCTimeline` -> `OUTDOOR_GATE_C_WIND_CUES` | 六个风通道的 start/peak/end | 用 one-shot envelope 算 0..1 强度 | 四个 B-lite 局部按批准时间峰值出现 |
| 3 | `OutdoorGateCRig.rotation` -> `OUTDOOR_GATE_C_MAX_ROTATION_DEGREES` | 通道名和强度 | 把强度乘以最大角度和统一负向符号 | 形成顺风方向一致的局部旋转 |
| 4 | `OutdoorGateCRig.applyOpacity` -> `windOverlayOpacities` | 每通道 overlay 上限和强度 | 更新局部叠光透明度 | 只增强发梢、衣角、猫耳、猫尾尖可读性 |
| 5 | reduced-motion 分支 | `reducedMotion=true` | 全部自动 transform 和亮度通道清零 | 减动中性态保持静态可理解 |

### 2.3 改动前后对比

- 改动前：人物和猫局部峰值太弱、时间重叠，容易被看成同步轻抖。
- 改动后：人物发梢/衣角在 2.75s/2.92s 达峰，猫耳/尾尖在 3.75s/3.97s 达峰，阶段间隔更清楚。
- 真正发生变化的那一步：`outdoor-gate-c-contract.ts` 中四个角色局部的时间、最大角度和 overlay 上限。

## 3. 相关对象和字段

| 对象/接口/表/事件 | 字段或参数 | 白话含义 | 谁写入/传入 | 谁读取/使用 | 什么时候变化 |
|---|---|---|---|---|---|
| `OUTDOOR_GATE_C_WIND_CUES` | `startMs/peakMs/endMs` | 每个部件什么时候开始、最明显、结束 | 合同常量 | 时间轴采样器 | 构建前固定 |
| `OUTDOOR_GATE_C_MAX_ROTATION_DEGREES` | channel -> degrees | 每个局部最大转多少度 | 合同常量 | Cocos rig | 构建前固定 |
| `OUTDOOR_GATE_C_WIND_OVERLAY_MAX_BY_CHANNEL` | channel -> opacity | 每个局部最多加多少叠光 | 合同常量 | 时间轴采样器和 rig | 构建前固定 |
| `OutdoorGateCVisualSample.wind` | channel -> 0..1 | 当前帧的风强度 | 时间轴采样器 | Cocos rig | 每帧更新 |
| `OutdoorGateCVisualSample.windOverlayOpacity` | channel -> opacity | 当前帧叠光透明度 | 时间轴采样器 | Cocos rig | 每帧更新 |
| `reducedMotion` | boolean | 是否关闭自动动态 | 场景初始化或调试入口 | 时间轴采样器 | 用户或测试切换时 |

## 4. 本次出现的开发技术地图

| 开发知识点 | 所属类别 | 在哪里出现 | 本次起什么作用 | 重要程度 |
|---|---|---|---|---|
| 固定时间轴采样 | 游戏前端 | `sampleOutdoorGateCTimeline` | 用毫秒决定每个局部的运动状态 | 核心 |
| Cocos 节点局部旋转 | 游戏前端 | `OutdoorGateCRig.applyRotation` | 把风强度变成发梢、衣角、猫耳、尾尖旋转 | 核心 |
| ROI 差分 | 测试与质量 | `wind-a-to-blite-roi-delta-report.json` | 证明新差异只出现在四个批准局部附近 | 核心 |
| 减少动态 | 无障碍 | reduced-motion 分支和测试 | 用户开减动时关闭 transform 和亮度变化 | 核心 |
| TypeScript 常量契约 | 编程语言 | `outdoor-gate-c-contract.ts` | 把批准数值集中锁定并被测试读取 | 基础或顺带 |
| Node test | 测试与质量 | `cocos-project/tests/*.test.ts` | 保护时间轴、音频、manifest、分享等回归 | 基础或顺带 |
| 哈希校验 | 工程交付 | `HASHES.sha256` | 保证证据包没有被悄悄替换 | 基础或顺带 |
| 幂等证据脚本 | 工程交付 | `validate-final-evidence.mjs` | 重复运行自检不应改坏证据包哈希 | 基础或顺带 |
| Cocos 构建产物 | 工程交付 | `build/gate-c-v7-...-wind-blite-audio-v1` | 提供可浏览器实跑的候选 | 基础或顺带 |

### 4.1 核心技术

#### 固定时间轴采样

- 先用白话说它是什么：一张按时间走的表，到了某个毫秒就让某个部件开始、达峰、回落。
- 本次具体怎么用：六个风通道都走 `oneShotEnvelope`，B-lite 只改四个角色局部的窗口和峰值。
- 为什么这样用：Gate C 要可复查、可截图、可精确对比，固定采样比随机动画更容易验收。
- 这样做的好处：同一时间点永远输出同一状态，截图、视频、ROI 差分和测试能稳定复现。
- 它的限制或代价：机器能证明数值正确，但不能证明真人一定觉得“自然舒服”。
- 相关字段、函数、接口或文件：`OUTDOOR_GATE_C_WIND_CUES`、`sampleOutdoorGateCTimeline`、`OUTDOOR_GATE_C_DURATION_MS`。
- 证据：仓库 `npm run verify` 通过，B-lite 时间轴测试锁定六通道峰值和 5s 风归零。

#### ROI 差分守住样式边界

- 先用白话说它是什么：只允许新变化出现在被批准的小区域里，其他地方必须完全不动。
- 本次具体怎么用：B-lite 对 Wind A 的动态差异只能落在发梢、衣角、猫耳、尾尖四个 manifest ROI 外扩 8px 内。
- 为什么这样用：用户批准的是“让风链更清楚”，不是重做夜空、草坡、门、花或角色画风。
- 这样做的好处：能把“我觉得没漂”变成可复查的像素证据。
- 它的限制或代价：ROI 差分不能判断观众是否看得见，也不能替代真人测试。
- 相关字段、函数、接口或文件：`wind-a-to-blite-roi-delta-report.json`、四个 `role-peak-*-roi-plus8.png`。
- 证据：报告显示 t0、tail、reduced 与 Wind A 相同，动态新增差异在批准 ROI 外为 0。

### 4.2 基础或顺带用到的知识

- **TypeScript 常量契约**：批准数值集中在合同文件里，测试和运行时代码读取同一来源，减少实现和验收分叉。
- **Cocos 节点 pose 复位**：rig 每帧从冻结 pose 加 delta，避免旋转逐帧累积导致角色越转越偏。
- **减少动态分支**：reduced-motion 直接返回静态样本，确保不把动作缩短成另一种动态。
- **哈希校验**：证据包用 `HASHES.sha256` 保护，便于复验同一批文件；当前证据包索引自身 SHA-256 为 `3c0b3793fe9545ce4e721a8385446fe4c0b2e9d9fe8aff19c4ac717467da3fb9`。
- **幂等证据脚本**：`validate-final-evidence.mjs` 现在保留已有 `generatedAt`，避免 QA 先运行自检、再跑 `shasum -c` 时因为时间戳刷新产生伪失败。
- **浏览器证据**：MP4、截图和 JSON 能证明桌面 Chrome 中的候选行为，但不能代表微信真机。

### 4.3 想过但没有采用的技术

- **整体加大风或加第二阵风**：未采用。它可能让草坡更明显，但草坡已经通过，会增加焦躁和整图在动的风险。
- **新增粒子、Shader、镜头晃动或动态模糊**：未采用。这些会改变 V7 观感和性能边界，不在用户批准范围内。
- **保守备选 B-lite 数值**：未采用。它未获本轮批准，只有推荐版出现重影或角色抖动风险时才能另行请求批准。

## 5. 这个需求能不能做，怎么判断

| 业务目标或限制 | 现有代码/数据是否支持 | 可以使用的技术 | 本次选择 | 判断依据或缺少的前提 |
|---|---|---|---|---|
| 让风链更可读但不改画风 | 支持 | 调整时间轴和局部旋转/overlay | 只改四个角色局部通道 | 现有 manifest 已有独立局部层 |
| 减动仍静态可完成 | 支持 | reduced-motion 分支 | 全部 transform/亮度清零 | 测试覆盖静态样本 |
| 判断观众是否真的看懂 | 需要外部参与者 | 5 人无标签正常倍率观察 | 尚未执行 | 不能由开发者自评代替 |

## 6. 为什么这样实现

- 最关键的实现选择：只调整四个已批准局部通道，不新增资产、节点、特效或镜头。
- 为什么当前方案够用：失败点集中在人物和猫局部可读性，现有分层已经能独立控制这些部件。
- 为什么没有必要做得更复杂：草、星、花、门、音频、适配在本轮不是失败根因，改它们会扩大风险。
- 什么情况下当前方案会不够用：如果真人仍看不出猫在人物之后响应，或者认为角色在抖，就要回到角色分层设计，而不是继续堆数值。

## 7. 风险和容易出错的地方

| 风险或失败场景 | 会发生什么 | 当前怎么保护 | 还需要注意什么 |
|---|---|---|---|
| 未批准样式漂移 | 星空、构图或角色观感被改掉 | V7 endpoint 零差和 ROI 外零差 | QA 仍要独立复验 |
| 运动累积 | 角色局部越来越偏 | rig 从 frozen pose 加 delta | 以后新增通道也要遵守 |
| 减动遗漏 | 开减动仍有草浪或局部抖动 | reduced 分支返回全 0，测试覆盖 | 真机系统偏好仍要测 |
| 机器通过但人看不懂 | GC-06 仍不能 PASS | 保留真人 5 人停止线 | 不能用自检替代人测 |
| Cocos CLI 成功码解释 | 若套用 POSIX `0` 口径，会把官方成功码 `36` 误判为失败 | 同时记录原始 `36`、官方“构建成功”和 Finished/产物实跑证据 | 冻结报告的 `cleanExit=false` 只能理解为“非 POSIX 0”，不能再当风险 |
| 证据脚本非幂等 | QA 复验时自检刷新文件，导致 HASHES 伪失败 | 保留既有 `generatedAt`，并顺序复跑自检与哈希 | 后续证据生成脚本也要避免写入短期时间戳 |

## 8. 测试与验证

| 命令或操作 | 结果 | 它证明了什么 |
|---|---|---|
| `npm --prefix cocos-project run verify` | 31 项测试通过 | Cocos 合同、时间轴、音频、manifest、分享等回归未破 |
| `npm run verify` | docs、prototype、Cocos 全通过 | 项目整体静态验证仍一致 |
| `shasum -c HASHES.sha256` | 证据包全部 OK | 证据文件可复算、未缺失 |
| `node validate-final-evidence.mjs` | `18/18`，重复运行不改坏哈希 | worker evidence 完整性通过，且证据脚本幂等 |
| 查看 `wind-chain-full-frame-25pct-contact-sheet.png` 和 ground crop | 未见 V7 画风漂移 | 新候选视觉仍是批准夜空和草坡 |
| 查看 ROI delta report | ROI 外新增差异为 0 | B-lite 变化限制在四个批准局部 |
| 独立 QA 从 GC-01 到 GC-13 复验 | 8 项 PASS、5 项 BLOCKED，P0/P1 无未关闭项 | 候选没有已知实现失败，但真人与设备证据仍不足 |
| 独立 QA 正常倍率裸眼观察 | 能读出草→人物→猫，未见明显抖动/表演感 | 关闭 Wind A 的已知不可读失败；不能替代 5 人阈值 |
| B-lite 勘误 01 | 5000ms 六风通道归零；全图零差在 t0/t9800/reduced | 修正“保留星云”与“5s 全图中性”的内部矛盾，未改代码或样式 |
| 独立 QA 证据身份增量复验 | 当前主证据 82/82、刺激包 7/7、协议哈希均匹配；媒体与核心报告未变 | 幂等性/状态文字修复不改变原 GC-01..GC-13 结论，无需全量重跑 |

- 没有执行的验证及原因：5 名真人裸眼测试、完整缩略图/20 秒体感、微信真机、OLED/LCD 低亮、10 分钟内存和音乐资产均未完成。
- 剩余风险：Gate C 不能仅凭 worker 自检标 PASS。
- Git/合并/发布状态：当前工作区根目录不是 git 仓库；未提交、未上传、未发布。

## 9. 下次遇到类似需求，我该怎么想

1. 先问清楚什么业务问题：是画面不好看、动效不可读，还是验收证据不足。
2. 再找到哪个入口和调用链：从用户看见的现象追到时间轴、rig、资产层和证据脚本。
3. 重点查看哪些对象或字段：start/peak/end、角度、overlay、reduced-motion、ROI、hash 和 build ID。
4. 可以想到哪些开发技术：固定时间轴、局部 transform、截图/视频证据、ROI 差分、哈希校验。
5. 怎么判断简单方案够不够：如果失败点集中在已有独立层，先做局部数值修正；如果局部修正仍被真人判失败，再回到资产设计。

## 10. 自测题与参考答案

### 题目 1：B-lite 这次真正解决的业务问题是什么？

- 参考答案：解决 Wind A 中人物发梢、衣角、猫耳和猫尾尖在正常倍率下不够可读的问题，让观众更容易感到风从草到人物再到猫。
- 我的回答：

### 题目 2：B-lite 的运行时调用链是什么？

- 参考答案：`OutdoorGateCRig.update` 传入 elapsedMs 给 `sampleOutdoorGateCTimeline`，时间轴根据 `OUTDOOR_GATE_C_WIND_CUES` 算风强度，rig 再用最大角度和 overlay 上限更新对应 Cocos 节点。
- 我的回答：

### 题目 3：为什么要有 `OUTDOOR_GATE_C_WIND_OVERLAY_MAX_BY_CHANNEL`？

- 参考答案：因为每个部件的可读性不同，B-lite 需要让人物局部最多 0.28、猫局部最多 0.32，同时保持远近草 0.22 不变。
- 我的回答：

### 题目 4：ROI 差分在这次验证中证明了什么，不能证明什么？

- 参考答案：它证明新增像素变化只在四个批准局部区域内，不能证明真人一定看得懂或觉得舒服。
- 我的回答：

### 题目 5：为什么不能直接把 B-lite 标成 Gate C PASS？

- 参考答案：因为 worker 自检只证明机器合同和浏览器证据成立，Gate C 还需要独立 QA、人测、真机、低亮和内存等证据。
- 我的回答：

## 11. 待确认与后续观察

- [ ] 5 名未参与实现者看无标签正常倍率 MP4，验证是否至少 4/5 读出“草先动、人物随后、猫最后”。
- [ ] 微信真机验证音频生命周期、低亮可读、性能和 10 分钟内存。
- [ ] 音乐素材批准与 2-3 秒渐入仍需单独处理。
