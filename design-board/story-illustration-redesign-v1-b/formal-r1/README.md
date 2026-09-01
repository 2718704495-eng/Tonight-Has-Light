# STORY-ILLUSTRATION-REDESIGN-V1-B-FORMAL-R1 复核板

## 当前状态

`BLOCKED / AWAITING_USER_SECOND_APPROVAL`

本目录只提供方向 B「无字夜漫画·同一阵风」的可见复核板骨架与机械检查。当前首轮导出已被总控人工判定为 FAIL，不是候选图：页面不请求、不显示这些 PNG，也不生成最终截图或 `HASHES.sha256`。

## 板面包含

- B01／B02／B03 的 390×844 主图位。
- 195×422（宽高各50%）合同缩略，以及只作额外极限观察的 98×211（25%）显示。98×211 不是批准尺寸。
- 360×800、430×932 和 430×844 压力裁切。
- 必需分层、批准五色色票、八项 Yes／No 人工检查。
- 「正式原创重绘／不得使用探索 PNG」边界和「等待用户二次批准」停止线。

## 失败闭锁的候选释放

复核板预期从下列目录读取正式导出：

```text
../../../design-system/outdoor-story-illustration-v1-b/dist/
```

即使 PNG 已存在，如果同目录没有有效的 `FORMAL-REVIEW-MANIFEST.json`，页面仍保持 BLOCKED，并且不为 `<img>` 设置资产 URL。这会防止已判失败的图被误当作新候选。

重绘经主任务预检合格后，资产任务需在 `dist/FORMAL-REVIEW-MANIFEST.json` 明确释放该修订：

```json
{
  "candidate": "STORY-ILLUSTRATION-REDESIGN-V1-B-FORMAL-R1",
  "status": "READY_FOR_FORMAL_REVIEW"
}
```

该状态只允许把图放到复核板上，不代表 Gate PASS，不代表用户已批准。

## 命令

在本目录下运行回归测试：

```bash
node test-review-board.mjs
```

检查默认资产目录并写入 `evidence/visual-metrics.json`：

```bash
node check-visuals.mjs
```

当前阻断态只做 DOM／响应式审计，不截取失败图：

```bash
node capture-board.mjs --audit-only --allow-blocked
```

`--allow-blocked` 仅对 `--audit-only` 有效；阻断态下即使显式传入该参数，脚本也会在截图前退出。页面加载门和单帧捕获在写入 PNG 证据前都会重新比较来源图的 `naturalWidth` / `naturalHeight` 与尺寸合同。

仅当重绘导出已替换、资产自检通过、且上述 manifest 已有效释放时，才执行正式截图：

```bash
node check-visuals.mjs
node capture-board.mjs
```

`capture-board.mjs` 会在 `evidence/screenshots/` 生成全板、三帧主图、三组压力裁切、195×422 合同缩略和 98×211 额外极限缩略证据。截图和最终 `HASHES.sha256` 必须等重绘完成后才生成。

## 文件责任

- `index.html`：复核板结构、BLOCKED 降级态和 manifest 门禁。
- `styles.css`：深靛纸样复核版式、响应式布局和尺寸容器。
- `check-visuals.mjs`：文件存在性、PNG 头、像素尺寸与释放状态检查。
- `capture-board.mjs`：无头浏览器 DOM 审计和有条件截图。
- `test-review-board.mjs`：覆盖缺失、未释放、合法释放、错误尺寸与“未释放图不展示”回归。

本目录不修改设计系统、项目文档或 Cocos；不执行建置、上传、提审、发布、提交或推送。
