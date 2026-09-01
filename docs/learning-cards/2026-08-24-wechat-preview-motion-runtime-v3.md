# 学习卡：微信预览包有风声但画面不动

状态：verified locally / real-device preview pending  
任务类型：Bug 修复与交付边界修正  
日期：2026-08-24

## 业务故事

用户扫码 v2 微信预览后，风声可以听到，但画面看起来不会动。这个反馈说明 AppID、二维码、资源加载和首触声音链路都已经通了；问题集中在视觉时间轴。

修复前，画面只按 Gate C 的 9.8 秒一次性样片播放。超过 9.8 秒后，程序永久停在所有风、云、星、花和呼吸都归零的中性尾帧。手机扫码、等待、再点出声音时，就很容易看到“有声音但画面不动”。

修复后，首轮 0–9.8 秒仍完全使用已批准 B-lite 样片；9.8–16 秒保持安静；16 秒后重复同一套 B-lite 微风。这样不改画风、不加新动作，但手机预览不会凝固。

## 底层原理一句话

把“证据用的一次性样片时间”保留下来，再给手机运行时套一层循环取样时间，让运行时不会一直取 9.8 秒尾帧。

## 调用链

1. Cocos 每帧调用 `OutdoorGateCRig.update(deltaTime)`。
2. `update()` 累加真实运行时间 `elapsedMs`，不再 clamp 到 9.8 秒。
3. `OutdoorGateCRig.applyCurrentSample()` 调用 `outdoorGateCRuntimeSampleMs(elapsedMs)`，把真实时间映射为样片取样时间。
4. `sampleOutdoorGateCTimeline(sampleMs, reducedMotion)` 返回风、呼吸、云、星、花和透明度数值。
5. Rig 把这些数值写到对应 Cocos 节点的 rotation、position、scale 和 `UIOpacity`。
6. 调试 API 同时暴露 `runtimeElapsedMs` 和 `elapsedMs`，便于 QA 区分“手机实际跑了多久”和“当前取样片哪一帧”。

## 数据关系

| 字段或函数 | 谁写入 | 谁读取 | 作用 |
|---|---|---|---|
| `elapsedMs` | `OutdoorGateCRig.update()` | `getRuntimeElapsedMs()`、`sampleElapsedMs()` | 真实运行时间 |
| `outdoorGateCRuntimeSampleMs()` | 纯函数 | `OutdoorGateCRig`、单元测试 | 把真实运行时间转成 0–9.8 秒样片时间 |
| `OUTDOOR_GATE_C_RUNTIME_REPEAT_INTERVAL_MS` | 时间轴模块 | 取样函数、测试 | 锁定 16 秒重复间隔 |
| `sampleOutdoorGateCTimeline()` | 时间轴模块 | Rig、测试 | 保持已批准 B-lite one-shot 合同 |
| `runtimeElapsedMs` | 调试 API | QA | 判断手机是否仍在推进时间 |

## 开发技术地图

核心技术：

- Cocos 组件生命周期：`update(deltaTime)` 是画面每帧推进的入口。
- 时间轴取样：用纯函数把时间映射为视觉状态，保证动效不累积漂移。
- 交付边界：Gate C 证据样片和手机可持续预览不是同一个时长需求。

基础或顺带知识：

- `Number.isFinite()`：防止异常时间值把取样带成 `NaN`。
- 取模 `%`：把长时间运行折回到固定循环周期。
- `UIOpacity` 和节点 transform：Cocos 里实际承载星光、花光、呼吸和风摆动的字段。
- 单元测试：用断言锁住 0–9.8 秒不变、9.8–16 秒安静、16 秒后重复。
- 微信小游戏构建：本轮只生成本地包，不自动提交预览或审核。

未采用：

- 加大风的振幅：会改变用户批准的 B-lite 动效样式。
- 改资源或重绘角色：问题不在美术资产。
- 自动提交新二维码：属于外部操作，需要用户明确授权。

## 验证证据

- `npm run verify`：33/33 PASS，保护项目结构、类型检查、音频首触、URL 查询兼容、时间轴和分享逻辑。
- Cocos 微信构建：到达 `build Task (wechatgame) Finished`，返回码 `36` 按已确认 Cocos 3.8 口径为成功。
- v3 与 v2 构建差异：仅 `assets/main/index.js` 不同，说明没有替换资源或平台配置。
- 生成代码检查：不含 `URLSearchParams`，包含 `outdoorGateCRuntimeSampleMs`、`runtimeElapsedMs` 和 16 秒重复时钟。

未完成证据：

- v3 尚未提交微信预览服务。
- v3 尚未由用户真机扫码确认画面持续微动。
- Gate C 仍缺真人、低亮、真机生命周期、10 分钟内存和音乐证据。

## 自测题

1. 为什么 v2 会出现“风声有，但画面不动”？

我的回答：

参考答案：因为 v2 视觉时间轴在 9.8 秒后永久 clamp 到中性尾帧，所有可见动态通道都归零；声音首触链路独立，所以风声仍能播放。

2. v3 为什么不直接修改 `sampleOutdoorGateCTimeline()`？

我的回答：

参考答案：`sampleOutdoorGateCTimeline()` 是已批准 B-lite Gate C one-shot 合同的一部分；直接改它会影响旧证据和样式边界。v3 只在运行时增加取样映射。

3. 16 秒重复间隔保护了什么体验？

我的回答：

参考答案：它让手机预览先完整播放一次 B-lite take，然后保留安静间隔，再重复同一套微风，避免画面永久静止，同时不新增动作风格。

4. 为什么 v3 不能直接宣称 Gate C PASS？

我的回答：

参考答案：本地测试和构建只证明代码与本地包成立；Gate C 仍缺微信真机扫码、真人风链、低亮、生命周期、内存和音乐等证据。

5. 这次为什么不需要用户重新批准 UI 样式？

我的回答：

参考答案：修复没有改变角色、构图、配色、资源、动效参数或 B-lite 单次 take，只改变手机运行时是否重复取同一已批准 take；但提交新微信预览仍需要用户单独授权。
