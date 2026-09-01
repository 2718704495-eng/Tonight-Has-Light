# FORMAL-OUTDOOR-ART-PILOT-V1-B 设计规格

> 日期：2026-08-29  
> 路线：B「AI 辅助正式分层例外」  
> 当前状态：`ALIGNED / ARTWORK BLOCKED FOR SPEC REVIEW / NO COCOS / NO BUILD / NO WECHAT / NO GIT`

## 1. 目标

先制作一张能够同时通过手机肉眼审美和工程分层审计的正式草坡入口样板，验证 AI 辅助位图流程是否能保持用户已批准的 B 夜漫画品质。成功标准不是“文件可以拆层”，而是拆层后的合成图仍然好看、自然、原创且可追溯。

第一张选择 `root_night_slope_v1`，因为它是第一屏和三条支线的共同入口，也最容易暴露成人／猫解剖、银河结构、草坡笔触、暖门层级、两朵花、缩略图焦点和透明边问题。F5 流星末页排在它之后；F5 人物较小，不足以单独证明角色画法可批量复用。

## 2. 候选身份与输出

- 版本：`FORMAL-OUTDOOR-ART-PILOT-V1-B`。
- 候选 ID：`formal-outdoor-art-pilot-v1-b-r1`。
- 逻辑画布：`390×844`。
- 正式源画布：`780×1688`，sRGB，8-bit RGBA。
- 源包：OpenRaster `.ora`，每个生产层同时保留独立无损 PNG。
- 审查导出：`390×844`、`195×422`、`360×800`、`430×932`、`430×844-pressure`。
- 适配只做等比 `SHOW_ALL` 预览，安全边使用已批准的 `#06265F`；不得拉伸或重新构图。

OpenRaster 适合作为开放源包，因为其图层以 PNG 保存；运行时仍导出独立 PNG。Cocos 后续可将 PNG 导入 SpriteFrame，并使用透明边修复、Auto Atlas 与纹理压缩；这些工程能力不构成本 Gate 的 Cocos 授权。

参考：

- [Krita OpenRaster 说明](https://docs.krita.org/sl/general_concepts/file_formats/file_ora.html)
- [Cocos Creator 3.8 图像资源](https://docs.cocos.com/creator/3.8/manual/en/asset/image.html)
- [Cocos Creator Auto Atlas](https://docs.cocos.com/creator/3.8/manual/en/asset/auto-atlas.html)
- [Cocos Creator 纹理压缩](https://docs.cocos.com/creator/3.8/manual/en/asset/compress-texture.html)

## 3. 生产流程

### 3.1 正式母版生成

1. 使用当前批准的 B 风格与草坡构图作为参考，但生成一张新的、完整的 `root_night_slope_v1` 候选；不直接裁切或重命名探索图。
2. 提示词只描述项目合同，不使用现成 IP、品牌、真人或艺术家姓名。
3. 第一轮只生成一张主候选；负责人在 100% 与 25% 下检查后，最多允许一次定向编辑。若仍未达到品质线，候选记为 `FAIL`，停止切层，不靠结构测试掩盖画面问题。
4. 母版必须先形成无文字、无按钮、无调试框的 clean plate。

### 3.2 正式分层

母版通过负责人肉眼预审后，建立以下最小生产层。允许一个层由多个内部编辑层组成，但 manifest 中必须能追溯到运行时角色：

1. `01_sky_base`
2. `02_milky_way_and_dust_rifts`
3. `03_star_dust_baked`
4. `04_hero_stars_01_10`
5. `05_distant_hills`
6. `06_house_body`
7. `07_door_warm_light`
8. `08_far_grass`
9. `09_near_grass`
10. `10_adult_body`
11. `11_adult_hair_edge`
12. `12_adult_clothes_edge`
13. `13_cat_body`
14. `14_cat_ears`
15. `15_cat_tail`
16. `16_flower_left`
17. `17_flower_right`
18. `18_flower_glows`
19. `19_foreground_grass_occlusion`
20. `20_shared_paper_grain`

所有局部层使用 straight alpha；保留未裁切逻辑矩形、原始 bbox、锚点、pivot、设计坐标和至少 4px 的透明出血。人物、猫、草、花和门必须提供边缘 ROI 检查，禁止黑边、矩形暗框和贴纸轮廓。

### 3.3 UI 与交互分离

以下内容只出现在独立预览层，不进入插画 clean plate：

- `看看星空`
- `吹吹风`
- `回家`
- 一次底部低权重提示
- 热区与安全区调试标注

流星、F5 文案、结尾选择和室内 UI 均不属于本样板。

## 4. 来源与可追溯性

每个候选包必须保存：

- 输入参考文件的路径与 SHA-256；
- 完整生成提示词、负面约束、生成日期、工具与原始输出；
- 每一次局部编辑的目标、保留项和输出 SHA-256；
- 分层方法、遮挡修复说明和 alpha 处理方式；
- ORA、独立 PNG、flatten export、manifest 与证据图的 SHA-256；
- 外部素材清单；默认要求为 `0`。若存在外部素材，必须登记作者、来源、许可证和商用／修改权限。

`source_property` 必须准确写成 `ai-assisted-formal-pilot`，不得伪写为 `human-painted` 或 `fully-manual-original`。

## 5. 视觉验收

以下 12 项全部满足才可把样板交给用户批准；任一失败即停止扩产：

1. 候选 ID、批准记录、范围和 SHA-256 一致。
2. 390×844 与 195×422 均保持成熟深靛漫画画味，不退化为程序矢量或纸片拼贴。
3. AI 来源透明，未把探索图直接升格或隐藏生成过程。
4. 成年人读得出自然坐姿、肩背重量、骨盆／腿和衣物连接。
5. 普通家猫读得出颈胸、背、后肢、爪、尾根和自然比例，不拟人。
6. 星空只有一条宽淡断口银河、8–10 主星和大面积深蓝留白。
7. 缩略图第一读依次为天空、共同看天的成年人＋猫、右侧暖门。
8. 透明边无黑线、暗框、贴纸边或半透明 RGB 污染。
9. manifest 重建合成与提交给用户的 flatten 母版一致；差异必须为零或有明确、可复查的颜色管理解释。
10. 插画内无中文、伪中文、Logo、水印、页码、按钮或任务标记。
11. 无现成 IP、品牌、真人相似或艺术家仿写；来源与许可完整。
12. 360／390／430 与 430×844 压力态均不裁掉人物、猫、门、两花或银河主形。

## 6. 工程约束与预算

- Gate B 只登记未来运行时角色，不创建 Prefab、Scene 或 Asset Bundle。
- 记录每个 PNG 的像素尺寸、透明 bbox 和磁盘字节数，为后续 atlas／分包决策提供输入。
- 禁止把 15 幅全做成无约束的 2×整屏 PNG；本样板通过后必须先基于实际字节和层复用率制定批量预算。
- 后续 Cocos 消费时必须使用新的 bundle、candidate ID、manifest 和存档前缀；历史 `outdoor-story-b-kf-r1-temp`、`outdoor-illustration-wind-r2`、`0.4.6` 和 `0.4.7` 均列入禁止来源。

## 7. 失败与停止处理

- 主候选或一次定向修正仍不达标：标记 `FAIL / SUPERSEDED / DO NOT COCOS`，保留审计证据，不扩产。
- 分层合成与母版不一致：回到分层步骤修复，不通过修改母版掩盖差异。
- 出现角色／猫解剖漂移、星空结构漂移或明显相似性风险：停止并重新生成单帧，不延续到其他画面。
- 包体或层数风险只记录为 Gate C 输入，不以降低当前画质的方式提前解决。

## 8. 权限与后续 Gate

本规格只覆盖 Gate B 单帧样板。本轮不修改 Cocos，不构建，不操作微信，不提交或推送 Git。

样板通过负责人审查后，提交给用户进行正式资产可见批准。只有用户批准同一候选与哈希后，才能决定是否扩到草坡入口其他状态、三条五幅支线和 F5 独立流星；Cocos 仍需新的 Gate C 计划与授权。
