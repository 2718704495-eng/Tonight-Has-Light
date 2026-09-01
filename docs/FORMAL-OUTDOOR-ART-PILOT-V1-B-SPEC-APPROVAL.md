# FORMAL-OUTDOOR-ART-PILOT-V1-B 规格批准记录

> 日期：2026-08-29  
> 用户原话：`批准 FORMAL-OUTDOOR-ART-PILOT-V1-B 规格，开始单帧样板`

## 批准对象

- 设计规格：[`2026-08-29-ai-assisted-formal-layered-art-design.md`](./superpowers/specs/2026-08-29-ai-assisted-formal-layered-art-design.md)
- 规格 SHA-256：`9361b12390fac6a76a8f82e3c5017dc4d9184cfd41f645ba34be7b877fe742e4`
- 实施计划：[`2026-08-29-formal-outdoor-art-pilot-v1-b.md`](./superpowers/plans/2026-08-29-formal-outdoor-art-pilot-v1-b.md)
- 唯一候选 ID：`formal-outdoor-art-pilot-v1-b-r1`
- 唯一画面：`root_night_slope_v1` 草坡入口。

## 当前允许

1. 使用内置 ImageGen 新生成一张原创 B 夜漫画母版，并在负责人肉眼预审后最多进行一次定向母版修正。
2. 从同一接受母版建立真实、可编辑、可追溯的 20 层 straight-alpha PNG、OpenRaster 源包、manifest、provenance 和多尺寸证据。
3. 使用确定性本地脚本做色彩配置归一、SHOW_ALL 派生、alpha／bbox／pivot／重建检查和哈希冻结；不得借脚本重新设计画面。
4. 完成独立只读审查后，把同一冻结候选交给用户进行可见正式资产批准。

## 当前不允许

- 直接裁切、描摹、上采样、改名或嵌入任何旧探索图、联系表、B01 参考、`0.4.6` 或 `0.4.7` 像素作为正式层。
- 把一个完整 flatten 隐藏在底层，再用空层或装饰层伪造“20 层”。
- 扩产其余三路绘本画面、F5 流星正式资产或室内正式资产。
- 修改 Cocos、创建 Prefab／Scene／Asset Bundle、生成构建、操作微信、提交审核、发布或执行 Git。

## 当前状态

`SPEC APPROVED / SINGLE-FRAME PRODUCTION AUTHORIZED / ARTWORK IN PROGRESS / NO COCOS / NO BUILD / NO WECHAT / NO GIT`

本批准只解除“规格待审阅”停止线；正式画面、分层资产和 Gate B 尚未通过。样板未通过用户对同一候选与哈希的可见批准前，不得扩产或交给 Cocos。
