# STORY-ILLUSTRATION-REDESIGN-V1-B 方向选择

> 日期：2026-08-28  
> 方向：B「无字夜漫画·同一阵风」  
> 当前关键帧候选：`STORY-ILLUSTRATION-REDESIGN-V1-B-KF-R1`  
> 状态：`STYLE DIRECTION ALIGNED / KEYFRAME STORY AND CAMERA APPROVED / FORMAL LAYERED ASSETS BLOCKED / NO BUILD / NO UPLOAD`

## 用户决定与批准边界

用户明确表示更喜欢 B 的风格，并指向参考图。该决定锁定户外首场景的视觉语言：深靛有限色、大块明暗、干笔墨线、克制网点、纸张颗粒，以及“一次只显示一个满屏画格”的无字叙事。

用户在查看三帧确认板后回复“没问题”，因此 KF-R1 的三帧故事、镜头差异和转场方向已批准。仍不批准：参考 PNG 直接入包、未复核正式角色资产、微信构建、上传、提审或发布。参考图和 KF-R1 均为构图／光色／材质探索；正式资产仍需可编辑、可追溯的原创分层重绘。批准记录见 [`STORY-ILLUSTRATION-REDESIGN-V1-B-KF-R1-APPROVAL.md`](./STORY-ILLUSTRATION-REDESIGN-V1-B-KF-R1-APPROVAL.md)。

## 保持不变

- 同一位正常成年人背影在左，同一只普通家猫在右；二者共同仰望，不互看、不看门。
- 自然深蓝星空只保留一条宽淡且有断口的银河；无星座线、极光、任务节点或满屏特效。
- 小屋保持右侧中景；暖门从首帧可点但稳定、不脉冲、不形成发光道路。
- 恰好两朵弱光花，亮度低于门；没有奖励、进度、倒计时或任务提示。
- 室内 `FORMAL-UI-V1.2-A` 继续是整屋明亮暖家，本轮不改。

## KF-R1 三帧

| 帧 | 叙事 | 构图变化 | 单一动作 |
|---|---|---|---|
| B01 坐稳 | 身体终于把重量放下 | 天空占主体的大全景 | 远草刚开始接受风 |
| B02 风经过 | 一阵凉风穿过草与两个角色 | 草高的低机位动作镜头，大草带成为主轮廓 | 远草→近草→发梢／衣角→猫耳／尾尖同向传递 |
| B03 余风 | 什么都没有完成，但夜晚已经发生 | 手与猫尾的地面近景，暖门仍在远处 | 猫尾与两根草尖留下最后余势 |

## 转场语法候选

- B01 停留约 `2.8–4.0s`；B01→B02 使用同一草线匹配的深靛墨块接页，`260–340ms`。
- B02 停留约 `1.2–1.8s`；B02→B03 使用草带遮化，`300–420ms`。
- B03 至少停留 `3.0s`，随后可回到自由赏景，不自动进屋。
- 点门可立即打断视觉转场；减少动态时不切景，只显示经批准的中性静态帧，并仅允许 `≤180ms` 透明度淡化。

## 停止线

- 三帧任何一帧出现人物／猫身份漂移、左右互换、猫拟人、第二条银河、暖门催促、第三朵花、任务图形或均匀黑色贴纸描边，退回重做。
- `195×422` 缩略图中必须仍能读出成年人、普通猫、天空和小屋的层级；三帧大轮廓必须不看说明也明显不同。
- KF-R1 三帧设计已获批准；Gate B 仍因正式分层重绘缺失而保持 `BLOCKED`。不得把生成探索图直接交给 Cocos。

## 参考与探索图身份

- B01 风格参考／定场探索：`design-board/story-illustration-redesign-v1-b/exploration/b01-settle-reference-r1.png`，SHA-256 `fdac7f8edf8a22954a93a3f756ab2c1699c1afe04462bf2fa3ed679ae2794d0c`。
- B02 动作探索：`design-board/story-illustration-redesign-v1-b/exploration/b02-wind-passes-r1.png`，SHA-256 `e0f00f2b573dda25b91f53aa5e04fa72456fa3ed1f784a1087b4238083504727`。
- B03 细节探索：`design-board/story-illustration-redesign-v1-b/exploration/b03-afterwind-detail-r1.png`，SHA-256 `8da6d324520fce5175a1f0546a8cb67e29c041795d002439a5add28a80ea1b67`。

三张均由内置 ImageGen 在用户选定 B 参考图基础上生成，仅用于 Gate B 方向预览，不进入正式微信包。
