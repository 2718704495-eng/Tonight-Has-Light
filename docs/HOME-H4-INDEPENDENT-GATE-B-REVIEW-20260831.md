# HOME-H4-TABLE-RITUAL-V1-A-R2 独立 Gate B 复核

- 日期：2026-08-31
- 候选：`home-meal-h4-table-ritual-v1-a-r2`
- 范围：H4 无字底图、`none / ate / sipped / both` 四态、安静中文 UI、120% 大字、减少动态和四尺寸证据
- 审查方式：全新独立零写入审查；本记录由主任务按审查回执转录，审查任务 `writeOperations=0`
- 最终结论：`PASS / P0=0 / P1=0 / P2=0 / READY FOR USER VISUAL REVIEW`

## 精确候选

- clean / none：`bbb02106fb4f5a820d1199eb61c7b10b5065028461bfdd6bf813276abe796533`
- ate：`0a356ea97cc91afecc93c8c9a607583d63a40db0a6e0226ec224be4a47a450b5`
- sipped：`710a4b4f54641e0880639147807120594b7e43302e74ce5d97c4784614cf841e`
- both：`69a9ab2b2982cd83beec6430c9684940f2b9924c5a15beb29615eeaaf722a530`
- 四态 UI 对照板：`2bf247ef9f877f7048669dbab1d350073aaf4b2ca967f452b71875f4f1b67158`
- 120% 大字：`05a964b9adbbeb7fad87ecc64903701349509f294a54ed08a345bcbf608a4b30`
- 减少动态：`fe04e56e8053bbab1d793771ad3d8425494deb51e2dfa3471668b4ff58f8acd5`
- 冻结包清单 `HASHES.sha256`：`2a79ad7c6ffcf590cea5b98ccfded4bc328dfa978b7dc03eb67b4f0718b304d6`

## 结论证据

- 视觉：普通字号是贴近菜与温水杯的低权重画中文字，不形成任务卡、奖励、勾选或进度；最终四态无棕色补丁、突兀白杯或重复筷子。`ate` 只减少少量菜品，筷子保持原位；`sipped` 保持同一只杯的材质与大小，只轻移并降低水线。
- 适配：360、390、430×932 与 430×844 压力态无裁字或热区漂移；最小触控区 `83×170px`，逻辑间距 `9px`，360 宽实算 `8.31px`。
- 大字与减动：120% 使用真实 `19.2px / 16.8px` 字号且不允许 SHRINK；减动位移、缩放和旋转均为 0，只保留 `150ms` 交叉淡化。
- 对比度：最终像素采样最低 `10.84:1`。
- 状态：两项操作仅写 `h4State`，不写 night、story completion、reward 或 unlock；空白点击仍可前往 H5。
- 只读测试：H4 state/UI 两份合同测试 `6/6 PASS`。
- 冻结：`HASHES.sha256` 复算 `162/162 OK`；candidate / ritual / provenance 的 `138` 个路径／哈希绑定 `0 mismatch / 0 missing`。

## 边界

本结论只允许把上述精确文件交给用户做 H4 视觉批准。它不等于用户批准，不解锁 Cocos、build、微信上传、提审、发布、Git 或远端写入。
