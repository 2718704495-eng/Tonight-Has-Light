# HOME H4 r2 clean plate 负责人视觉审查

> 日期：2026-08-31  
> 候选：`home-meal-h4-table-ritual-v1-a-r2`  
> 页面：`scene_01_home_shot_004`  
> 结论：`PASS FOR INDEPENDENT CLEAN-PLATE REVIEW / P0=0 / P1=0 / P2=0 / RESPONSE LAYERS STILL BLOCKED`

## 审查文件

- 390×844：`exports/390x844/scene_01_home_shot_004.png`，SHA-256 `bbb02106fb4f5a820d1199eb61c7b10b5065028461bfdd6bf813276abe796533`。
- 195×422：`exports/195x422/scene_01_home_shot_004.png`，SHA-256 `269a8f7243959fe785d264064a5f57a356f3768471456a9b0e877c31acd8b35a`。
- raw r1：`source/raw/scene_01_home_shot_004-imagegen-r1.png`，SHA-256 `e4a140f5fcae20b24afd87a475e3a76fa1ad4dc5e3c6cb77d9ab243fe5848ea8`。
- targeted repair raw r2：`source/raw/scene_01_home_shot_004-imagegen-r2.png`，SHA-256 `ce09961a330d76870660ba1128635b9e2d0296f5b3e7ec30bae7bed4fb63a7ba`。
- master r2：`source/masters/scene_01_home_shot_004-r2-master-2x.png`，SHA-256 `e8d85bcbdd3c680e5b39a7fcd49a1403e087a89ca4e739b706cbd560139c9d8f`。

## 定点修复裁决

r1 已满足同屋、饭菜、猫、材质和光线要求，但人物在零交互状态已经拿起杯子，使“喝口温水”在用户点击前发生，并妨碍后续独立杯子状态。按已批准生产计划只使用一次定点修复：r2 将恰好两只杯都放回桌面，人物手自然停在近杯旁。没有追加第三次生成；r2 为本页唯一审查候选。

## 二元审查

| 停止线 | 结论 | 证据 |
|---|---|---|
| H3→H4→H5 故事节拍 | `PASS` | 390 与 195 三联板依次读为“厨房盛菜→饭桌靠近→回到暖家全景”；H4 明显拉近桌面而非复制 H5 或另起房间。 |
| 菜品／器皿连续 | `PASS` | 暖赭热菜、浅圆盘、饭、汤、壶与恰好两只杯能从 H3 结果自然过渡到 H5 完成饭桌；无凭空新增主菜。 |
| 人物连续与匿名 | `PASS` | 同一成年人体态、深色针织内搭和后侧视角；只有耳侧与脸部暗轮廓，没有五官、身份、性别或关系说明。 |
| 猫连续 | `PASS` | 普通四足家猫自然趴在桌边地面坐垫，未穿衣、未拟人、未上桌、未遮挡菜品或杯子。 |
| 明亮暖家 | `PASS` | 墙、窗、地板、两侧木柜、桌面、人物边缘、猫轮廓与全部饭菜均可辨；深色来自针织衫和猫毛，不形成房间黑角或黑房亮灯表演。 |
| 非任务感 | `PASS` | clean plate 无文字、按钮、卡片、进度、奖励或发光圈；人物手停在杯旁，筷子在桌面，两项动作都尚未发生。 |
| 独立交互邻域 | `PASS` | 菜品候选热区 `136×102`，右侧温水杯候选热区 `62×91`，最近边缘间距 `10px`；均大于 `44×44` 且满足 `≥8px`。实际 UI 尚未绘制。 |
| 360/390/430 导出 | `PASS` | 五档导出为约定尺寸 sRGB 8-bit PNG；430×844-pressure 使用 `#06265F` SHOW_ALL 安全边，没有裁掉人物手、菜、杯、猫或窗。 |
| 正式资产边界 | `PASS` | 只有无字全幅 clean plate 使用 `ai-assisted-formal-fullframe` 例外；中文和 ate/sipped 响应层尚未生成，也未烘焙进图片。 |

## 连续性证据

- `evidence/h3-h4-h5-story-390.png`，SHA-256 `71ed1867b44421a987b77526b74c2bbdab545a1a37b566b4bb3da3db1776fbee`。
- `evidence/h3-h4-h5-story-195.png`，SHA-256 `bb9342f21a7450fc2cc875eaecb2d9f168869a1ad6770e39a8fcec540656ec9b`。
- `evidence/h4-interaction-neighborhoods-390.png`，SHA-256 `95be9a2423cc997f3d93653fee84b330182db6a21f889b4d085e7f5d9b3ce606`；中文与方框只在证据板中，不是 clean plate。
- `evidence/h3-h4-h5-dish-continuity-390.png`，SHA-256 `eba708c6c81fec3a78d1669c2340b6d2781a250ea9caa5cb9f70dd7e27d44cee`。

## 结论与边界

- `P0=0 / P1=0 / P2=0`；可进入全新独立零写入 clean-plate 视觉审查。
- r1 与 r2 已用完本页“一次初始＋一次定点修复”额度；不得继续抽卡或覆盖 raw。
- `ate.svg`、`sipped.svg`、四状态、中文 UI、大字和浏览器板仍保持 `BLOCKED`，直到独立审查也关闭 clean plate 的 P0/P1。
- 未执行 Cocos、build、WeChat、Git 或远端写入。
