# FORMAL-OUTDOOR-ART-PILOT-V1-B R1 状态

`MASTER VISUAL PREFLIGHT PASS / TRUE-ALPHA EXTRACTION PROBE FAIL / FORMAL LAYER PACKAGE STOPPED / DO NOT EXPAND / DO NOT COCOS / NO BUILD / NO WECHAT / NO GIT`

## 可保留成果

- 新原创单帧母版：`source/root_night_slope_v1-master-2x.png`
- 母版 SHA-256：`5c84ce815ba011cd9be570889c768573e80c3d55d6b59fb2bd211301f86c74e3`
- 负责人在 780×1688、390×844 与 195×422 下完成视觉预检；一次定向母版修正额度未使用。
- 来源、提示词、归一方法和旧资产排除范围已写入 `provenance.json`。

## 当前停止线

规格要求每个生产层必须是 full-canvas straight-alpha PNG，并由 20 层真实重建冻结母版。首个高风险 `10_adult_body` 探针返回的是无 Alpha 的 RGB 图片，透明棋盘格被烘焙进像素，同时残留背景幽灵。该结果不能进入正式层，也不能通过自动抠图、色键、整图底层或空层来规避。

因此本候选只能作为“可见单帧样板”，不能声明为正式分层资产；不继续消耗其余 19 个抽层调用，不制作 ORA、manifest 或伪造的重建 PASS。恢复生产需要具备真实图层／Alpha 编辑能力的人工位图流程，或由用户批准一个新的、更诚实的资产合同。
