# HOME-H4-TABLE-RITUAL-V1-A-R2 用户视觉批准记录

> 日期：2026-08-31  
> Gate：B／回家晚饭仪式 H4 饭桌互动  
> 用户原句：`批准 HOME-H4-TABLE-RITUAL-V1-A-R2：H4 饭桌互动视觉通过`  
> 状态：`H4 USER VISUAL PASS / FROZEN / HOME-MEAL-RITUAL-V1-A GATE B VISUAL PASS / NO COCOS / NO BUILD / NO WECHAT / NO GIT / NO REMOTE WRITE`

## 1. 批准身份

- 合同：`HOME-MEAL-RITUAL-V1-A`
- 候选：`home-meal-h4-table-ritual-v1-a-r2`
- 页面：`scene_01_home_shot_004`
- 资产 ID：`ART-PBOOK-HOME-004`
- 390×844 clean plate：`design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_004/exports/390x844/scene_01_home_shot_004.png`
- clean plate SHA-256：`bbb02106fb4f5a820d1199eb61c7b10b5065028461bfdd6bf813276abe796533`
- `none` SHA-256：`bbb02106fb4f5a820d1199eb61c7b10b5065028461bfdd6bf813276abe796533`
- `ate` SHA-256：`0a356ea97cc91afecc93c8c9a607583d63a40db0a6e0226ec224be4a47a450b5`
- `sipped` SHA-256：`710a4b4f54641e0880639147807120594b7e43302e74ce5d97c4784614cf841e`
- `both` SHA-256：`69a9ab2b2982cd83beec6430c9684940f2b9924c5a15beb29615eeaaf722a530`
- 四态视觉板 SHA-256：`2bf247ef9f877f7048669dbab1d350073aaf4b2ca967f452b71875f4f1b67158`
- 120% 大字暖纸样张 SHA-256：`05a964b9adbbeb7fad87ecc64903701349509f294a54ed08a345bcbf608a4b30`
- 减少动态样张 SHA-256：`fe04e56e8053bbab1d793771ad3d8425494deb51e2dfa3471668b4ff58f8acd5`
- 批准前哈希清单：`design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_004/approvals/HASHES.pre-approval.sha256`
- 批准前清单自身 SHA-256：`e38d96750c277145285f2e20d3bc52df57728e847a85a447ac02d7704a6f47b0`
- 独立零写入复核：`docs/HOME-H4-INDEPENDENT-GATE-B-REVIEW-20260831.md`，SHA-256 `c2a3b53354e8c9b964b4dcac7d2cef5dee14dcb54c62b587ea39721b74dfaa59`

## 2. 已批准视觉与交互合同

- H4 锁定同一暖家饭桌近景、匿名成年人、普通家猫、深色壶、恰好两只杯、饭、汤与 H3 端来的暖赭浅盘热菜。
- 默认只显示低权重画中文字 `吃一点` 与 `喝口温水`；两项均为可选、顺序不限，点击空白处仍可继续到 H5。
- `ate` 只让浅盘中的食物减少少量，筷子保持原位；`sipped` 只轻移同一只杯并降低水线；`both` 只组合这两种结果，不增加第三种反馈。
- 120% 大字使用桌边暖纸，不缩字；减少动态时 transform 为 `0`，只允许不超过 `180ms` 的交叉淡化。
- 状态只写 `h4State`，不得写入今晚完成、奖励、解锁或五夜进度。
- 负责人和独立零写入复核最终均无未关闭缺陷：`P0=0 / P1=0 / P2=0`。

## 3. 本批准的 Gate 影响

- H1、H2、H3、H4 已全部获得用户视觉批准并冻结；H5 继续消费已批准 `HOME-F5-WIDE-ROOM-V1-A-R1` 精确哈希。
- 因此 `HOME-MEAL-RITUAL-V1-A` 这一个五镜视觉子包可以记为 `GATE B VISUAL PASS`。
- 这不是整个《今夜有灯》正式绘本 Gate B 通过；星空与吹风等尚未逐页完成的正式全幅页仍保持 `BLOCKED`。

## 4. 明确不授权

- 不授权 Cocos、运行时代码、构建、微信 `preview`／`upload`、体验版设置、提审、发布、Git 提交／推送或任何远端写入。
- 不允许修改本记录绑定的 H4 像素、反馈语义、中文 UI、H1–H3 或 H5；后续运行时只能消费逐字节一致的批准资产与独立 UI／状态层。
- 旧棕色补丁、突兀白杯、重复筷子及旧 `ate=49e052…`／`both=fdc1da…` 候选均为 `SUPERSEDED / DO NOT USE`。
