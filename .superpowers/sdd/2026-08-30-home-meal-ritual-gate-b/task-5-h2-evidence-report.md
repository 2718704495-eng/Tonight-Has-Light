# Task 5 — HOME H2 连续性证据构建器

日期：2026-08-30  
状态：`ALIGNED / BUILT / VISUAL REVIEW REQUIRED`

## RED → GREEN

- RED（构建器尚不存在，预期失败）：

  ```sh
  node --test design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_002/evidence/build-h2-review-boards.test.mjs
  ```

  结果：`ERR_MODULE_NOT_FOUND`，缺少 `scripts/build-h2-review-boards.mjs`；测试因此正确证明所需生产构建器尚未实现。

- GREEN：运行同一条 `node --test …build-h2-review-boards.test.mjs`，结果 `pass 1 / fail 0`。测试实际运行构建器，验证 H2 `r1` 输入、三段顺序、四个输出、PNG 尺寸／RGBA 元数据／SHA-256 形状、房间锚点与 evidence 边界，并读取写回的 `build-report.json`。

- 确定性复跑：

  ```sh
  node design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/build-h2-review-boards.mjs --page-id scene_01_home_shot_002
  ```

  四张 PNG 的聚合 SHA-256 在复跑前后同为 `754c10c8e9d8471b03468cd05137fcdde0cf1cc4cbd0714770c427f12dfcdd75`。

## 输出与 SHA-256

| Evidence 输出 | 尺寸 | SHA-256 |
|---|---:|---|
| `h1-h2-h5-outerwear-390.png` | 1170×900 | `fd80bd99010fc4925cfc1a7fe37ed0f34bb1ec4696c6405abe2949afd6b9aeff` |
| `h1-h2-h5-outerwear-195.png` | 585×478 | `5019ee0c6862f0ee0f74947f78c8c24529f10cd241b3be550ed99198361051c9` |
| `h2-h5-inner-knit-390.png` | 780×900 | `fd8aaf27033f80ef13ad4c8d469dc87e8e3b8b6ddb3249c6ffc1967ca98dab3d` |
| `h2-room-anchors-390.png` | 390×844 | `11f737e2cea7ce95d6884dc611b036f170c3ade3e5e75ce4259c4a4b27b13821` |
| `build-report.json` | JSON | `bc5db3c46b8e53cdf3614ce2ef0fe941f28112ed991b7f4e978525273f320280` |

## 已验证的证据契约

- 390 与 195 三段均严格为 H1「外衣穿着」→ H2「挂起动作」→ H5「挂起结果」。
- 390 并排板显示 H2 深色针织内搭与 H5 坐姿内搭。
- H2 同屋锚点板标注门框、同一左挂钩、柜／灯与地板方向。
- `build-report.json` 记录每个输入／输出的项目相对路径、尺寸、SHA-256；H2 candidate 为 `r1`。
- 报告明确 `cleanPlate=false`、`userApproved=false`，且中文标签只烘焙在 evidence PNG。

## 自审与边界

- 已视觉检查四张证据板：输入 clean plate 未被写入或覆盖，标签只出现在 evidence；三段次序、内搭并排和同屋锚点均清晰可见。
- 未修改 candidate manifest、ritual manifest、provenance、HASHES 或 shared docs；未调用 imagegen，未触碰 H3/H4/Cocos/build/WeChat/Git/远端。
- 此构建器只产出审核证据，不能关闭 H2 P0/P1、不能标记 Gate B PASS，也不是用户批准；H3 仍须保持阻塞直到主任务取得负责人及独立审查证据。
