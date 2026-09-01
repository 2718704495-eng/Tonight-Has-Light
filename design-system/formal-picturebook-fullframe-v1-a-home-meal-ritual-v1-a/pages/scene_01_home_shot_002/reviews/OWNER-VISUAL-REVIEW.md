# HOME H2 r1 负责人视觉审查

> 日期：2026-08-30  
> 候选：`home-meal-h2-hang-outerwear-v1-a-r1`  
> 页面：`scene_01_home_shot_002`  
> 结论：`PASS FOR INDEPENDENT ZERO-WRITE REVIEW / P0=0 / P1=0 / P2=0 / NO R2`

## 审查文件

- 390×844：`exports/390x844/scene_01_home_shot_002.png`，SHA-256 `ef11fcb38d1e515cb2f8702d7b4ea8734f0f92ac08f24c8e2a18bfad97ccc6dd`。
- 195×422：`exports/195x422/scene_01_home_shot_002.png`，SHA-256 `8419a54d7aea95c00eb638299f4f3a0faec8e41c0a259fce190336b878bf7593`。
- raw r1：`source/raw/scene_01_home_shot_002-imagegen-r1.png`，SHA-256 `c22cf2a24679847715cb7209824f61f9a00be7a5fd96c805c8527cb4a3d4adcb`。
- master r1：`source/masters/scene_01_home_shot_002-r1-master-2x.png`，SHA-256 `992226070e907054a19a257d6f69d40a538df2bc9ab9f1181acee66d7b149916`。

## 二元审查

| 停止线 | 结论 | 证据 |
|---|---|---|
| 同一间屋 | `PASS` | 门框、左墙挂钩板、柜／灯、墙地材质、地板方向与广域暖光可连回已批准 H1/H5；近镜头没有变成新房间。 |
| 外衣连续 | `PASS` | 同一件无标识灰蓝宽松外搭从 H1 穿着、H2 挂起动作到 H5 左挂钩结果，颜色与长度在当前近景暖光下可合理连续。 |
| 内搭连续 | `PASS` | H2 露出的深色针织上衣与 H5 坐姿内搭的深色、领口、袖口与下摆语义一致。 |
| 动作因果 | `PASS` | 抬起的手、外衣肩部和同一挂钩构成单一清晰动作三角；390 与 195 均可读。 |
| 成年人与猫 | `PASS` | 人物是明确成年人、背面／克制四分之三背面、不露脸；猫是普通家猫，在地面四足自然走过，没有叼衣、穿衣或拟人帮忙。 |
| 明亮暖家 | `PASS` | 墙、地板、手、衣物、挂钩、人物、猫和柜体可读；最左窄条深色是批准 H1 继承的夜间门洞，不是室内黑角。 |
| 原创与 clean plate | `PASS` | 没有文字、伪文字、Logo、品牌、多格、边框、UI、奖励光、额外人物或关系说明。 |
| 360/390/430 导出 | `PASS` | 五档导出均为约定尺寸 sRGB 8-bit PNG；430×844-pressure 使用 `#06265F` SHOW_ALL 安全边，无裁掉手／挂钩／猫。 |

## 连续性证据

- `evidence/h1-h2-h5-outerwear-390.png`：H1 穿着 → H2 挂起动作 → H5 挂起结果。
- `evidence/h1-h2-h5-outerwear-195.png`：同一链路的 195 缩略图证据。
- `evidence/h2-h5-inner-knit-390.png`：H2 深色针织内搭 ↔ H5 坐姿内搭。
- `evidence/h2-room-anchors-390.png`：门框、同一左挂钩、柜／灯与地板方向。

## 结论与边界

- `P0=0 / P1=0 / P2=0`；可进入全新独立零写入视觉审查。
- H2 当前不使用定向 `r2` 修复额度；r1 原图、master 与导出继续不可覆盖。
- 本结论不是用户批准，也不自动解锁 H3。只有独立审查也关闭 H2 的 P0/P1 后，才可串行生成 H3。
