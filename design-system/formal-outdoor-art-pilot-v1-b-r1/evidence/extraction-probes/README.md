# 透明分层探针

> 当前状态：`FAIL / TRUE ALPHA NOT PRODUCED / DO NOT USE AS A PRODUCTION LAYER`

## 探针

- 目标层：`10_adult_body`
- 输入：探针调用时的 RGB 归一母版 `504076c6245805bc5b214d984173c0ff6cf377b34f7fb6e0c4813fc7cdc190a5`；随后仅增加全不透明 Alpha 通道，当前正式 RGBA 母版身份为 `5c84ce815ba011cd9be570889c768573e80c3d55d6b59fb2bd211301f86c74e3`，二者可见 RGB 字节零差。
- 请求：保持完整画布与人物可见像素，只输出真实透明背景的成人层。
- 返回文件：`10_adult_body-transparent-probe-rgb-checkerboard-FAIL.png`
- 返回 SHA-256：`8c324ec2bd023f732c533c9984831a99ac6c7c18f7a5068374ff454782dd0af2`
- 实际元数据：`853×1844`、3 个 RGB 通道、`hasAlpha=false`。

## 失败原因

返回图把透明棋盘格直接画入 RGB 像素，并且残留了背景幽灵，不是 straight-alpha PNG。它不能进入 `source/extractions/`，不能进入 ORA，也不能通过 chroma key、自动分割或整图兜底伪装成规格要求的真实语义层。

按照已批准的停止线，本探针失败后不继续量产其余 19 层。冻结母版仍是有效的本地视觉样板候选，但 20 层正式包保持 `BLOCKED`，等待具备真实图层／Alpha 编辑能力的生产方法或用户批准新的资产合同。
