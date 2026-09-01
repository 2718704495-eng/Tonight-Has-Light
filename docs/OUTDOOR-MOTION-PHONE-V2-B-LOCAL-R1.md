# OUTDOOR-MOTION-PHONE-V2-B 本地候选 R1

> 日期：2026-08-27  
> 候选 ID：`outdoor-motion-phone-v2-b-local-r1`  
> 范围：本地源码、Cocos Web 构建和机械证据；未上传微信、未设置体验版、未提审、未发布、未 Git 操作。

## 用户批准

用户已批准 `OUTDOOR-MOTION-PHONE-V2-B：真分层微风`。本候选只实现该批准范围：让风真正作用在六个常驻不透明内容层上，保持 V7 已批准的角色、构图、材质、配色、夜空、门、花和室内体验不变。

## 实现摘要

- 将运行时 `assets/resources/outdoor-gate-c/prototype_scene_clean_plate_390x844.png` 替换为 motion-ready clean plate；六个可动 ROI 内不再烘焙静态副本，ROI 外像素不变。
- 六个风层在中性态保持 `neutral_opacity=1`：`grass_far_accents`、`grass_near_accents`、`person_hair_tuft`、`person_clothes_hem`、`cat_ears`、`cat_tail_tip`。
- 旧透明风叠层合同保持全 0，不再靠半透明副本制造“重影式动效”。
- 风链锁定为远草 → 近草 → 人物发梢 → 衣角 → 猫耳 → 猫尾，峰值角度为 `2.6 / 4.2 / 4.6 / 5.2 / 5.4 / 7.6` 度，所有通道无额外平移。
- 开场先稳定约 `900ms`，首次触碰若空闲则同帧启动完整风链；若自动风刚开始且可读则复用；若落在微弱尾段则在尾段结束后 `<=250ms` 排队一条完整风链。
- 减少动态模式下所有 transform、草浪、云位移和呼吸均为 0，仅保留触碰后的弱亮度等价反馈。
- 候选存档前缀改为 `phone-preview-v4-v2-b-local-r1:`，避免污染历史 `0.4.5` / r8 体验数据。

## 素材与哈希

| 项目 | SHA-256 |
|---|---|
| V7 批准母版 | `7157484b95988b11c1abdf9ddc0d5bb7c2d3bde25dd9d2dfcf6c5ee795847b3d` |
| V2-B motion-ready clean plate（运行时 `scene_clean_plate`） | `d9cfc08a0983b673f897fc6db78ea8e0a7bbb88890444249cffa090ad81888a3` |
| `prototype_layer_manifest.json` | `78501bc24de124018b9567fdf08e34f22667b4127df2c8969c16fc9d0af552cd` |
| `prototype_handoff_hashes.txt` | `a21c6123f1f5404a9471f9bc637c960be389aada91e0ba56ff34943935df53ee` |
| V2-B 素材证据包 `HASHES.sha256` | `758e96ba3c3440ee5b06e41b8bc2c0f11d2ca7e2cf35ca5530581a658355f79d` |
| Web 构建树（相对路径内容哈希） | `e10f0e55e68fd7d880c31dd93b2f0345db2ff8eada46d6b457fd2b14ed1b931f` |
| Web 入口 `index.html` | `4e3989aa1ff33d329f8f1a0c2899f61684d28b93a6a27a1b56175dfa9bdc0a4e` |
| 最终 `run-report.json` | `8d7cde6bb62e6387744108ee5681578041aff67a1aacd1905fb3d45d196e930e` |
| 36.7s 原速视频 | `0e44967c6fcea80a17d85554f47f1a8f69bd453a3bdbb1f61c5f9441203bcb72` |
| 10.1s 减动视频 | `071066d5afcbc06a1d2499596ca4074154039f68268a81bde964b198b0fdae9d` |

## 验证

| 命令 / 证据 | 结果 |
|---|---|
| `npm --prefix cocos-project run verify` | PASS，124/124 tests |
| Cocos Creator Web build `outdoor-motion-phone-v2-b-local-r1-web` | 日志到达 `build Task (web-mobile) Finished`；Creator CLI 退出码 36 按项目既有口径为构建完成 |
| `validate-outdoor-motion-phone-v1-a-web.mjs` 以 V2-B 环境变量运行 | `EVIDENCE_CAPTURED`，`issues: []` |
| Web normal capture | 36.667s，4 次完整风活动，最长可见静默约 `6999.9ms`；1102 帧结构扫描无损坏帧 |
| Web reduced-motion capture | 10.067s；`maximumTransformMotion=0`，六个 transform 风通道全 0 |
| Responsive capture | 360×800、430×932、430×844 截图无机械问题 |
| Web 帧时代理 | 约 `59.48fps`，P95 `17.5ms`，`>250ms=0`；有 1 个 `150ms` 采集长帧，不作微信真机性能证据 |
| 素材交接副本复验 | clean plate＋六个真风 PNG 与 Cocos runtime 逐字节一致，实际存在的 7 个 manifest 文件哈希不匹配为 0 |
| 独立只读 QA | 本地候选 `P0=0 / P1=0`；`LOCAL WEB PASS / REAL PHONE + HUMAN BLOCKED` |

证据目录：

`/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/outdoor-motion-phone-v2-b-local-r1-final-frozen-20260827/`

Web 采集报告明确声明：它是 headless Chrome / SwiftShader 机械证据，不是微信真机、真人裸眼或低亮设备证据。当前不能写成“手机可感知 PASS”。

## 当前结论

`LOCAL SOURCE PASS / FINAL LOCAL WEB MECHANICAL EVIDENCE CAPTURED / PHONE HUMAN BLOCKED / NO UPLOAD`

V2-B 已解决 V1-A 的主要结构问题：风不再依赖透明重影副本，而是驱动六个不透明内容层。下一步若要进入手机体验，需要用户另行授权构建并上传新的微信开发版本；上传后仍需至少用户本人真机确认，以及后续 5 人原速裸眼观察或同等 QA 证据，才能关闭“手机上不明显”的风险。
