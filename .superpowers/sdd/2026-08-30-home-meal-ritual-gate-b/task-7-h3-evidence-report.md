# Task 7 — HOME H3 连续性证据构建器

日期：2026-08-30  
状态：`ALIGNED / BUILT / VISUAL REVIEW REQUIRED`

## RED → GREEN

- RED（构建器尚不存在，预期失败）：

  ```sh
  node --test design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_003/evidence/build-h3-review-boards.test.mjs
  ```

  结果：`ERR_MODULE_NOT_FOUND`，缺少 `scripts/build-h3-review-boards.mjs`；失败原因正是所需生产构建器尚未实现。

- GREEN：运行同一命令，结果 `pass 1 / fail 0`。测试实际调用构建器，并对生成的四张 PNG 逐一验证尺寸、RGBA PNG 元数据与 SHA-256 形状；同时读取写回的 `build-report.json`，验证 H3 candidate `r1`、H2→H3→H5 页序、同屋锚点、菜品证据和 H4 未生成边界。

- 确定性复跑：

  ```sh
  node design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/build-h3-review-boards.mjs --page-id scene_01_home_shot_003
  ```

  连续两次生成后，四张 PNG 与 `build-report.json` 的五个 SHA-256 完全一致。

## 输出与 SHA-256

| Evidence 输出 | 尺寸 | SHA-256 |
|---|---:|---|
| `h2-h3-h5-story-390.png` | 1170×900 | `5e7e5bea81812970899c8339f832e20b46dc018b58289a9bd57c1da9fe5c0885` |
| `h2-h3-h5-story-195.png` | 585×478 | `53138e9564168da2a45a1d4f6fcea359f32306b60446435954e62379a29f2484` |
| `h3-room-anchors-390.png` | 390×844 | `e163e5addd0292bd3d929ba44db63d8398b02fbe56bb23737886ad2312384da7` |
| `h3-h5-dish-continuity-390.png` | 780×360 | `9d3a40e071f9c18b9da8c20b80ce599d31ec4ac838abfa43d214a736d14481ff` |
| `build-report.json` | JSON | `86960906f720b50a835ca0e91d789978f1e54a92e90681de3f566d1fd74977e7` |

## 已验证的证据契约

- 390 与 195 三段均严格为 H2「已放下外衣」→ H3「厨房盛菜」→ H5「回到饭桌」。三幅均由实际 r1／获批导出直接复合，未重绘 clean plate。
- H3 同屋锚点板在实际 H3 390 上标示门框、原主屋窗／灯／低桌、墙／地材料与暖光方向。
- 菜品连续性板使用实际 H3 浅圆盘／盛菜动作 crop 与实际 H5 中央浅圆盘／成菜 crop。中间区域明确写明「H4：未来目标／未生成 H4 图像／不伪造中间画面」；H4 没有被读取、生成或烘焙。
- `build-report.json` 为每个 H2、H3、H5 的 390／195 输入及每个输出记录项目相对路径、尺寸、格式与 SHA-256；H3 candidate 固定为 `r1`。
- 报告明确 `cleanPlate=false`、`userApproved=false`、`h4Generated=false`；中文标签只烘焙在 evidence PNG，绝不写入 H2/H3/H5 clean plate。

## 可见自审与边界

- 已逐张查看四张生成证据：三段动作次序、195 可读性、主屋锚点和菜品 crop 均可辨；H4 显示的是纯证据文字卡，不是伪造图像。
- 未修改 candidate manifest、ritual manifest、provenance、HASHES 或 shared docs；未调用 imagegen，未触碰 H4、Cocos、build、WeChat、Git 或远端。
- 本构建器仅提供 H3 连续性审查证据，不能关闭 H3 P0/P1、不能把 Gate B 标成 `PASS`，也不是用户批准。H3 仍须完成独立零写入审查并单独冻结／请求用户批准；H4 继续 `BLOCKED`。

## 主任务后续事项

- 项目 `AGENTS.md` 要求已验证的实现创建学习卡；由于本子任务的文件所有权仅允许 H3 evidence 和本报告，未越权创建学习卡。主任务应在汇总完整 Gate B 交付、审查与残余风险后统一处理该项目级文档。
