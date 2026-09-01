# HOME H3 r1 负责人视觉审查

> 日期：2026-08-30  
> 候选：`home-meal-h3-serve-hot-dish-v1-a-r1`  
> 页面：`scene_01_home_shot_003`  
> 结论：`PASS FOR INDEPENDENT ZERO-WRITE REVIEW / P0=0 / P1=0 / P2=0 / NO R2`

## 审查文件

- 390×844：`exports/390x844/scene_01_home_shot_003.png`，SHA-256 `c582fa5e9ad5c0f465e307472ccfc6791ed78b2d1e81663669df9151819aab72`。
- 195×422：`exports/195x422/scene_01_home_shot_003.png`，SHA-256 `ce8e04691102079b2cea11b02c4e51cf52a752c3902433a07dd0481b0822b4c2`。
- raw r1：`source/raw/scene_01_home_shot_003-imagegen-r1.png`，SHA-256 `b334f18f51db7b9244ef42fa25f3557cefa69dd71c7869001d66eccac709da7a`。
- master r1：`source/masters/scene_01_home_shot_003-r1-master-2x.png`，SHA-256 `c6c58dc5b2103ba022ea137bc5f70bd29d0a61b854800f7a86e322143a7445f9`。

## 二元审查

| 停止线 | 结论 | 证据 |
|---|---|---|
| 同一间屋／相连厨房 | `PASS` | 左门洞完整露出既有主屋窗、柜灯与低桌边；墙地材料、木作、地板方向和广域暖光保持同一住宅轴线，没有变成独立陌生厨房。 |
| 人物连续 | `PASS` | 同一匿名成年人保持 H2 已露出的深色针织内搭、深色长裤和平底鞋；背面／克制四分之三背面，不露脸、不新增身份信息。 |
| 盛菜动作 | `PASS` | 一手抬起壶盖／锅盖，另一手从锅中把暖赭色热食盛入浅圆盘；手、盖、锅、食物与盘的因果在 390 与 195 均可读，未出现多手或器具穿插。 |
| 饭菜连续 | `PASS` | H3 使用浅圆盘承接暖赭色菜肴，能够自然发展为获批 H5 饭桌中央浅圆盘成菜；证据板没有伪造 H4 中间图。 |
| 猫与热源安全 | `PASS` | 普通家猫四足停留在地面通道，位于人物脚侧并与灶台、锅及热食保持明显距离；不帮忙、不叼物、不拟人。 |
| 明亮暖家 | `PASS` | 厨房、门洞、墙、地面、人物、猫、锅、盘和木柜均可辨；深色橱柜和人物衣物仍有边缘与材质，不形成不可读黑角。 |
| 原创与 clean plate | `PASS` | 无文字、伪文字、Logo、品牌、多格、边框、UI、奖励光、额外人物或关系说明；保持 B 夜漫画／干笔纸纹与低饱和暖棕室内语言。 |
| 360/390/430 导出 | `PASS` | 五档导出均为约定尺寸 sRGB 8-bit PNG；430×844-pressure 使用 `#06265F` SHOW_ALL 安全边，无裁掉人物手部、锅、盘、猫或主屋锚点。 |

## 连续性证据

- `evidence/h2-h3-h5-story-390.png`，SHA-256 `5e7e5bea81812970899c8339f832e20b46dc018b58289a9bd57c1da9fe5c0885`：H2 已放下外衣 → H3 厨房盛菜 → H5 回到饭桌。
- `evidence/h2-h3-h5-story-195.png`，SHA-256 `53138e9564168da2a45a1d4f6fcea359f32306b60446435954e62379a29f2484`：同一链路的 195 缩略图证据。
- `evidence/h3-room-anchors-390.png`，SHA-256 `e163e5addd0292bd3d929ba44db63d8398b02fbe56bb23737886ad2312384da7`：门框、原主屋窗／灯／低桌、墙地材料和暖光方向。
- `evidence/h3-h5-dish-continuity-390.png`，SHA-256 `9d3a40e071f9c18b9da8c20b80ce599d31ec4ac838abfa43d214a736d14481ff`：H3 浅圆盘盛菜与 H5 中央浅圆盘成菜；中间只标注 H4 未来目标，未生成或伪造 H4 图像。

## 结论与边界

- `P0=0 / P1=0 / P2=0`；可进入全新独立零写入视觉审查。
- H3 不使用可选定向 `r2` 修复额度；r1 原图、master 与导出不可覆盖。
- 本结论不是用户批准，不解锁 H4。只有 H3 独立审查也关闭 P0/P1，才可把 H2、H3 分别冻结并提交用户视觉批准。
- 未执行 H4、Cocos、build、WeChat、Git 或远端写入。
