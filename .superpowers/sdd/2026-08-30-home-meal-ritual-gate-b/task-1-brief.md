# 任务 1 简报：B0 隔离生产容器与交叉校验管线

## 唯一合同

- 只执行 [`docs/superpowers/plans/2026-08-30-home-meal-ritual-gate-b.md`](../../../docs/superpowers/plans/2026-08-30-home-meal-ritual-gate-b.md) 的“任务 1”。
- 计划 SHA-256：`98d265d554121f2ee0119752e85dc52cfab8f5e42a87605f20f43092dfbb646a`。
- 写入所有权仅限：
  - `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/**`
  - `.superpowers/sdd/2026-08-30-home-meal-ritual-gate-b/task-1-report.md`
- 你不是唯一在工作区工作的员工；不得回退、覆盖或格式化他人修改。不得写入 docs、design-board、cocos-project 或其他既有资产目录。
- 不得生成 H1 图片，不得调用 imagegen，不得启动 H2–H4，不得使用 Git，不得构建、上传或联网写入，也不得再派子任务。

## TDD 顺序（不可跳过）

1. 先创建 `tests/production-contract.test.mjs`，包含冻结计划列出的精确 PAGE_IDS、ASSET_IDS、H5 哈希、REQUIRED_EXPORTS、SAFE_BORDER 和 MAX_GENERATIONS 断言。
2. 在合同模块不存在时运行该测试，保存正确的非零失败证据。
3. 再实现最小合同、清单、来源、Sharp 加载器、确定性导出、页面／包校验和哈希脚本。
4. 运行测试与 `validate-package.mjs --stage structure`，结构阶段只能报告 H1–H4 `BLOCKED / NO ART`、H5 `REFERENCE HASH PASS`，不能报告 Gate B 视觉 PASS。

## 必须建立的生产结构

- 根文件：`README.md`、`STATUS.md`、`ritual-manifest.json`、`provenance.json`、`HASHES.sha256`。
- 引用：`references/approved-h5.json`，只引用、不复制或修改 H5。
- 页面目录：`pages/scene_01_home_shot_001..004/`，其中 H4 预留 `source/response-layers/` 与 `exports/states/`。
- UI：`ui/`。
- 脚本：`sharp-loader.mjs`、`export-page.mjs`、`compose-h4-states.mjs`、`build-review-boards.mjs`、`validate-page.mjs`、`validate-package.mjs`、`write-hashes.mjs`。
- 测试：`production-contract.test.mjs`、`h4-state-contract.test.mjs`。
- 证据：`evidence/`、`reviews/`。

## 冻结接口与值

- 页面 ID 恰好为 `scene_01_home_shot_001..005`；资产 ID 恰好为 `ART-PBOOK-HOME-001..005`。
- `exportPage(...) -> {raw, master, exports, hashes, metadata}`。
- `validatePage(...) -> {status, checks, issues}`。
- 五种导出：`195x422`、`360x800`、`390x844`、`430x932`、`430x844-pressure`。
- 安全边色：`#06265F`；每页最大生成次数：`2`。
- H5 390 SHA-256：`569a7b9b71d16d13ad311bdea9a29d6bc93a7dc68c99892faf8c416f38bc1c51`。
- 规格当前 SHA-256：`606a48ff905fe49e0114e1f80c0d05f519f26c7cc70aadee3441585822064ed1`。
- 批准记录当前 SHA-256：`a513b6a7bc6b7589c53f6695b9504e93a0b102951af6fb51176cadff45d1079b`。
- 计划 SHA-256：`98d265d554121f2ee0119752e85dc52cfab8f5e42a87605f20f43092dfbb646a`。

## 导出与验证约束

- 导出器只接受合同内精确 page ID、`r1|r2` 和位于对应页面 `source/raw/` 的输入。
- 原始候选不可覆盖；接受母版为 `780×1688`、sRGB、8-bit、无损 PNG，并生成全部五尺寸。
- 必须拒绝任何解析后位于 `cocos-project` 的输入／输出路径。
- 页面和包校验必须重新计算 prompt、raw、master、全部导出、规格、批准记录、计划与 H5 哈希，并交叉检查 manifest ↔ provenance；不能相信文件内自报 `PASS`。
- 未有艺术资产时，H1–H4 保持 `BLOCKED / NO ART`。
- `HASHES.sha256` 由确定性脚本生成，不包含自己，不跟随临时系统文件。

## 报告要求

在 `task-1-report.md` 记录：

- RED 测试的命令、退出码与关键错误；
- GREEN 测试／结构校验命令、退出码与摘要；
- 完整写入文件列表；
- 已知限制或停止项；
- 声明 `NO H1 ART / NO COCOS / NO BUILD / NO WECHAT / NO GIT`。
