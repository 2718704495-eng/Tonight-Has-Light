---
task_id: "2026-08-24-wechat-motion-runtime-v3"
task_type: "bug"
title: "微信预览包听得到风但画面停住的动效运行时修复"
status: "verified"
completed_at: "2026-08-24"
branch: "not-a-git-repo"
commit: "not-committed"
---

# 2026-08-24-wechat-motion-runtime-v3：微信预览包听得到风但画面停住的动效运行时修复

## 一句话结论

v2 二维码里的视觉时钟会在约 9.8 秒后永久停住；v3 本地包已改为持续计时并按 16 秒间隔重复同一个已批准 B-lite 动效 take，且新增了构建产物闸门防止旧逻辑再次进包。

## 1. 先讲业务：这次到底做了什么

- 谁会遇到这个场景：扫码体验《今夜有灯》Gate C 微信预览的人。
- 他想做什么：打开夜风草坡，听到风，也看到草、人物、猫、星和花的轻微呼吸。
- 原来是什么情况：用户真机反馈风声正常，但画面看起来不会动。
- 现在是什么情况：v3 本地包里的视觉运行时不再 9.8 秒硬停，后续会重复同一个 B-lite 赏景 take。
- 为什么要改：Gate C 要求零操作也能有完整可观看内容，不能只有音频循环。
- 验收结果：`npm run verify` 33/33 PASS；新增构建闸门对 v2 FAIL、对 v3 PASS；v3 本地构建完成，尚未生成新微信二维码。

## 2. 再讲底层：程序是怎么做到的

### 2.1 底层原理一句话

本质上是让 Cocos 组件每帧继续累加真实运行时间，再把真实时间映射到 0–9.8 秒的已批准样片时间，而不是把时间永久夹死在 9.8 秒尾帧。

### 2.2 调用链

| 顺序 | 谁调用谁 | 传入什么 | 做了什么 | 输出或状态变化 |
|---|---|---|---|---|
| 1 | 微信小游戏运行 Cocos 包 | `wechatgame/assets/main/index.js` | 启动 `OutdoorGateCScene` 与 `OutdoorGateCRig` | 场景和动效组件进入运行 |
| 2 | Cocos 生命周期调用 `OutdoorGateCRig.update(deltaTime)` | 每帧 `deltaTime` | v3 持续累加 `elapsedMs` | 保留真实运行时间 |
| 3 | `applyCurrentSample()` 调用 `sampleElapsedMs()` | 当前 `elapsedMs` | 用 `outdoorGateCRuntimeSampleMs()` 映射到循环样片时间 | 9.8 秒尾帧后等待，再在 16 秒处回到 0 秒 |
| 4 | `sampleOutdoorGateCTimeline()` | 样片时间和减动状态 | 计算风、呼吸、云、星、花的数值 | 输出本帧视觉 sample |
| 5 | rig 应用到节点和透明度 | sample 中的旋转、位移、透明度 | 调用 `setRotationFromEuler`、`setPosition`、`setScale`、`UIOpacity.opacity` | 真实画面发生轻微变化 |

### 2.3 改动前后对比

- 改动前：v2 包里的 `update` 把 `elapsedMs` clamp 到 `OUTDOOR_GATE_C_DURATION_MS`，超过约 9.8 秒后再也不会回到风链开头。
- 改动后：v3 包里的 `update` 持续累加时间，并由 `sampleElapsedMs()` 做循环映射。
- 真正发生变化的那一步：构建产物 `assets/main/index.js` 中 `OutdoorGateCRig` 的运行时计时方式。

## 3. 相关对象和字段

| 对象/接口/事件 | 字段或参数 | 白话含义 | 谁写入/传入 | 谁读取/使用 | 什么时候变化 |
|---|---|---|---|---|---|
| `OutdoorGateCRig` | `elapsedMs` | 真实运行了多久 | `update(deltaTime)` | `sampleElapsedMs()` | 每帧增加 |
| `outdoorGateCRuntimeSampleMs` | `elapsedMs` | 把真实时间折回样片时间 | `sampleElapsedMs()` | `sampleOutdoorGateCTimeline()` | 每帧计算 |
| `sampleOutdoorGateCTimeline` | `reducedMotion` | 是否关闭自动位移和亮度变化 | 启动参数或调试 API | 时间轴采样函数 | 启动或设置变化 |
| `UIOpacity.opacity` | `0..255` | 星、花、overlay 的显示强度 | `applyOpacity()` | Cocos UI 渲染 | 每帧按 sample 更新 |
| `project.config.json` | `appid` | 微信项目身份 | v3 AppID 本地副本 | 微信开发者工具 | 只在隔离副本中存在 |

## 4. 本次出现的开发技术地图

| 开发知识点 | 所属类别 | 在哪里出现 | 本次起什么作用 | 重要程度 |
|---|---|---|---|---|
| Cocos 生命周期 `update` | 前端/游戏引擎 | `OutdoorGateCRig` | 每帧驱动画面变化 | 核心 |
| 运行时采样映射 | 游戏动效 | `outdoorGateCRuntimeSampleMs` | 让有限样片可以在预览里重复出现 | 核心 |
| 构建产物断言 | 测试与交付 | `validate-wechat-motion-runtime-build.mjs` | 防止源码正确但微信包仍旧 | 核心 |
| SHA-256 身份记录 | 工程与交付 | V3 报告 | 确认交付的是同一个包 | 基础或顺带 |
| AppID 隔离副本 | 安全与权限 | `wechat-appid-preview-v3-local` | 使用用户已有 AppID 但不污染冻结包 | 基础或顺带 |
| Cocos Creator CLI | 构建 | v3 本地构建 | 生成微信小游戏 `wechatgame` 包 | 基础或顺带 |

### 4.1 核心技术

#### 运行时采样映射

- 先用白话说它是什么：真实时间一直往前走，但画面只使用已批准的 9.8 秒片段；映射函数负责决定当前播放片段里的哪一帧。
- 本次具体怎么用：9.8 秒后保持安静，到 16 秒时把 sample 时间折回 0 秒，再重复同一 B-lite take。
- 为什么这样用：它不改变已批准的风、星、花、呼吸数值，只解决手机预览长时间停住的问题。
- 这样做的好处：用户不会在扫码后错过前 9.8 秒就只看到静帧。
- 它的限制或代价：这仍是 Gate C 可丢弃样片，不等于正式无限户外系统；正式版需要更自然的长期随机微风。
- 相关字段、函数、接口或文件：`outdoor-gate-c-rig.ts`、`outdoor-gate-c-timeline.ts`。
- 证据：v3 包内包含 `this.sampleElapsedMs()` 和循环采样路径，且不再包含 9.8 秒硬停片段。

#### 构建产物断言

- 先用白话说它是什么：不只看源码，也直接检查发给手机的包里有没有正确逻辑。
- 本次具体怎么用：新增 `validate-wechat-motion-runtime-build.mjs`，对 v2 预览包报错，对 v3 包通过。
- 为什么这样用：这次问题正是“源码和预览包不一致”，单元测试无法证明二维码里的代码是新的。
- 这样做的好处：下次生成二维码前可以先拦住旧构建。
- 它的限制或代价：它是字符串级断言，只适合检查明确的构建回归；不能替代真机录屏和裸眼测试。
- 相关字段、函数、接口或文件：`package.json` 的 `validate:wechat-motion-runtime-build`、`assets/main/index.js`。
- 证据：v2 闸门 FAIL；v3 泛用包和 v3 AppID 本地副本均 PASS。

### 4.2 基础或顺带用到的知识

- **Cocos `update(deltaTime)`**：它是组件每帧生命周期回调，本次用来驱动视觉时间轴；官方文档列出了 `update` 生命周期。
- **`UIOpacity` 与节点 transform**：它们在这里分别控制亮度和位置/旋转/缩放，是 Gate C 微动的落地点。
- **微信小游戏构建包**：Cocos 构建后生成 `wechatgame` 目录，里面包含 `game.json`、`project.config.json` 和脚本资源。
- **AppID 掩码记录**：完整 AppID 只放本地配置，文档只记录 `wx49...6f55` 这种掩码，避免泄露。
- **Cocos CLI 退出码 `36`**：本项目已按官方命令行发布文档确认它是构建成功码，不能按普通 POSIX 0/非 0 直接判失败。

### 4.3 想过但没有采用的技术

- **加大动效幅度或改画风**：未采用。那属于可见样式变化，需要用户另行批准；本次根因是运行时包旧，不是 B-lite 数值本身。
- **直接上传新预览二维码**：未采用。微信 `preview` 是外部提交，需要用户单独授权。

## 5. 这个需求能不能做，怎么判断

| 业务目标或限制 | 现有代码/数据是否支持 | 可以使用的技术 | 本次选择 | 判断依据或缺少的前提 |
|---|---|---|---|---|
| 手机上长期看得到轻微动效 | 支持，源码已有循环采样 | 重新构建并验证包内运行时 | 生成 v3 本地包 | Cocos `update` 每帧调用，v3 包已通过构建产物断言 |
| 不改变 V7/B-lite 风格 | 支持 | 只同步运行时逻辑 | 不改资产和数值 | v3 相对 v2 泛用包仅 `assets/main/index.js` 不同 |
| 生成新二维码 | 技术上支持 | 微信 `preview` | 本轮未执行 | 需要用户明确授权 |

## 6. 为什么这样实现

- 最关键的实现选择：修构建和运行时采样，不改风的幅度和画面素材。
- 为什么当前方案够用：用户反馈的是“画面不动”，证据显示 v2 包在 9.8 秒后硬停。
- 为什么没有必要做得更复杂：当前只是 Gate C 预览包缺陷，不需要引入正式长期天气系统。
- 什么情况下当前方案会不够用：如果 v3 真机仍完全不动，就要继续查微信真机渲染、帧率、低功耗或节点 transform 应用。

## 7. 风险和容易出错的地方

| 风险或失败场景 | 会发生什么 | 当前怎么保护 | 还需要注意什么 |
|---|---|---|---|
| 源码正确但预览包仍旧 | 手机表现和本地判断不一致 | 构建产物闸门直接检查 `assets/main/index.js` | 生成二维码前必须跑 |
| 把音频正常当作视觉正常 | 漏掉画面停帧 | 分开检查音频和视觉时间轴 | 真机 QA 要录屏 |
| 未授权执行微信 `preview` | 发生外部提交越界 | v3 只生成本地包 | 等用户授权 |
| 泄露完整 AppID | 文档暴露敏感配置 | 只写掩码 | 不把 `project.config.json` 内容贴进报告 |

## 8. 测试与验证

| 命令或操作 | 结果 | 它证明了什么 |
|---|---|---|
| `npm run validate:wechat-motion-runtime-build -- build/...preview-v2/wechatgame` | FAIL | v2 包确实缺少循环采样并硬停 |
| `npm run verify` | 33/33 PASS | 项目结构、类型检查和 Cocos 单元测试通过 |
| Cocos Creator CLI 构建 v3 | 成功码 `36`，到达 `build Task (wechatgame) Finished` | v3 本地微信包生成成功 |
| `npm run validate:wechat-motion-runtime-build -- build/...motion-runtime-v3/wechatgame` | PASS | v3 包内包含循环动效运行时 |
| v3 与 v2 泛用包目录 diff | 仅 `assets/main/index.js` 不同 | 没有改视觉资产、音频或配置 |

- 没有执行的验证及原因：未执行 v3 微信 `preview` 和真机扫码，因为需要用户单独授权；未做 OLED/LCD 低亮和 10 分钟 soak，因为本轮只处理动效停帧缺陷。
- 剩余风险：v3 真机仍需扫码录屏确认；Gate C 总状态仍是 `BLOCKED`。
- Git/合并/发布状态：当前目录不是 git 仓库；未提交、未推送、未上传、未审核、未发布。

## 9. 下次遇到类似需求，我该怎么想

1. 先问清楚什么业务问题：用户听到/看到/操作到的具体差异是什么。
2. 再找到哪个入口和调用链：从预览包中的最终 JS 反查到源码组件和时间轴。
3. 重点查看哪些对象或字段：`elapsedMs`、采样函数、减动状态、构建包 `assets/main/index.js`。
4. 可以想到哪些开发技术：生命周期回调、运行时采样、构建产物断言、包体差异、真机录屏。
5. 怎么判断简单方案够不够：如果包内逻辑已经错，先让包和源码一致；只有包正确但真机仍错，才扩大到渲染或设备层排查。

## 10. 自测题与参考答案

### 题目 1：为什么风声正常不能证明画面动效正常？

- 参考答案：音频由 `OutdoorGateCAudioGate` 独立循环，视觉由 `OutdoorGateCRig.update` 和时间轴采样驱动；v2 正是音频继续响，但视觉时间停在 9.8 秒尾帧。
- 我的回答：

### 题目 2：v2 画面为什么会长期不动？

- 参考答案：v2 构建包把 `elapsedMs` clamp 到约 9.8 秒，超过后 `sampleOutdoorGateCTimeline()` 一直收到尾帧时间，输出中性静态状态。
- 我的回答：

### 题目 3：v3 修复里最关键的字段或函数关系是什么？

- 参考答案：`update(deltaTime)` 写入持续增长的 `elapsedMs`，`sampleElapsedMs()` 调用 `outdoorGateCRuntimeSampleMs()` 折回样片时间，再交给 `sampleOutdoorGateCTimeline()` 生成本帧动效数值。
- 我的回答：

### 题目 4：为什么要检查构建产物而不是只跑单元测试？

- 参考答案：这次单元测试和源码可以是正确的，但二维码里的旧包仍然错误；构建产物断言直接检查手机会运行的 `assets/main/index.js`。
- 我的回答：

### 题目 5：为什么本次没有直接加大风或换画面？

- 参考答案：加大风或换画面属于样式变化，需要用户批准；本次根因是运行时停帧，修时间轴和构建包即可，不应掩盖成视觉改版。
- 我的回答：

## 11. 待确认与后续观察

- [ ] 用户授权后生成 v3 微信预览二维码。
- [ ] 用 v3 二维码做真机录屏，确认 16 秒后动效会重复出现。
- [ ] 继续补 Gate C 的真人、低亮、性能、生命周期和音乐证据。
