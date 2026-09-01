# SDD ledger — plan: docs/superpowers/plans/2026-08-30-home-meal-ritual-gate-b.md

## 冻结身份

- 执行计划 SHA-256：`98d265d554121f2ee0119752e85dc52cfab8f5e42a87605f20f43092dfbb646a`
- 当前规格 SHA-256：`606a48ff905fe49e0114e1f80c0d05f519f26c7cc70aadee3441585822064ed1`
- 规格获批内容 SHA-256：`b42f1ddbc256f8306410378d3981e0f003ef69a173626287cd811d8cc6de8a74`
- Gate A 批准记录 SHA-256：`a513b6a7bc6b7589c53f6695b9504e93a0b102951af6fb51176cadff45d1079b`
- H5 390 基准 SHA-256：`569a7b9b71d16d13ad311bdea9a29d6bc93a7dc68c99892faf8c416f38bc1c51`
- Root R4 390 身份／外衣参考 SHA-256：`23443918a0c892d569a6fd49b55b889d70bb4ed0dc7a6396a0af2bf5fad2306a`
- 用户本轮批准：`批准 HOME-MEAL-RITUAL-V1-A Gate B 生产计划，开始 H1 单帧探针`
- H1 授权记录 SHA-256：`def904ebf65aa710f6da2151a1f7dd66f26762390621d15d1b4999b703493129`
- 当前授权范围：`H1 USER VISUAL PASS/FROZEN；H2/H3 OWNER+INDEPENDENT PASS、已分别冻结、USER APPROVAL PENDING；仅限本地 Gate B 设计生产`
- 明确禁止：`H4 / Cocos / build / WeChat / Git / remote write`

## 工具裁决

- 工作区不是 Git 仓库，且冻结计划明确禁止创建仓库、提交或工作树。`sdd-workspace`／`task-brief` 的 Git 前提不成立。
- 不修改已批准计划来迎合工具。用本隔离生产根、前后文件清单和 SHA-256 快照替代工作树／提交边界。
- 手工任务简报只抄录冻结计划的任务边界，不产生新产品或样式决定。
- 判断错误的代价：若误启 Git、提前启动 H4，或把 H2/H3 未经用户批准当成冻结视觉，会越过当前授权并污染批准证据链；因此严格停在 H3 双审与用户逐帧批准之前。

## 共享接口矩阵

| 任务 | 输入 | 输出 | 写入所有权 | 状态 |
|---|---|---|---|---|
| 1 / B0 管线 | 冻结计划、规格、H5 引用 | 隔离生产根、合同测试、导出器、校验器、结构报告 | 单一管线员工：仅新生产根与任务报告 | `COMPLETED` |
| 2 / H1 提示词 | H5、Root R4、获批 H1 英文请求 | prompt、候选清单、安全复核、来源记录 | 主负责人 | `COMPLETED` |
| 3 / H1 候选 | 冻结 prompt、两张本地参考、B0 管线 | r1＋唯一 r2、五尺寸导出、对照证据、审查与预批准哈希 | 主负责人；独立员工只读审查 | `USER VISUAL PASS / FROZEN` |
| 4 / H2 候选 | H1 冻结视觉、H5 左墙挂钩与同一人物/猫 | r1、五尺寸导出、对照证据、负责人及独立零写入审查 | 主负责人；独立员工只读审查 | `OWNER+INDEPENDENT PASS / USER APPROVAL PENDING` |
| 5 / H3 候选 | H2 连续性、H5 饭桌菜品、相连厨房锚点 | r1、五尺寸导出、动作/空间/菜品连续性证据与双审 | 主负责人；独立员工只读审查 | `OWNER+INDEPENDENT PASS / USER APPROVAL PENDING` |
| 6 / H4 候选 | 用户分别批准 H2/H3 后才可开始 | 饭桌近景与两项可选互动视觉 | 未授权 | `BLOCKED` |

## 2026-08-31 用户批准同步

- 用户原句：`批准 HOME-H2-HANG-OUTERWEAR-V1-A-R1 与 HOME-H3-SERVE-HOT-DISH-V1-A-R1：H2/H3 单帧视觉通过`。
- H2 `home-meal-h2-hang-outerwear-v1-a-r1`：390×844 SHA-256 `ef11fcb38d1e515cb2f8702d7b4ea8734f0f92ac08f24c8e2a18bfad97ccc6dd`；预批准清单自身 SHA-256 `9b5b908aa26561ce51bacae789b971c4b604502f60736cad8976cf6c6cc36f1e`。
- H3 `home-meal-h3-serve-hot-dish-v1-a-r1`：390×844 SHA-256 `c582fa5e9ad5c0f465e307472ccfc6791ed78b2d1e81663669df9151819aab72`；预批准清单自身 SHA-256 `91d967150073566f1d9c34302bb3197a26fdf4ac2d45201a0fa13a9303eeb4ec`。
- 状态：H2/H3 `USER VISUAL PASS / FROZEN`；H4 `AUTHORIZED / LOCAL GATE B PRODUCTION NEXT / NO ART YET`。批准记录：`docs/HOME-H2-H3-VISUAL-APPROVAL-20260831.md`。
- 决策边界：仅解锁 H4 本地 Gate B 生产；不授权 Cocos、build、WeChat、Git 或 remote write。H4 生产不得反向修改 H1/H2/H3/H5。

## 任务日志

- 2026-08-30：重新计算计划、规格、H5、Root R4 哈希，全部与冻结值一致。
- 2026-08-30：开始任务 1；生成前不得写入 H1 图像资产。
- 2026-08-30：管线员工在 RED 后发现手工任务简报误抄了规格哈希；冻结计划只要求复算当前规格，裁决以磁盘实际值 `606a48ff905fe49e0114e1f80c0d05f519f26c7cc70aadee3441585822064ed1` 为准并修正简报。计划本身及其哈希不变。
- 2026-08-30：独立零写入审查判定 B0 `NOT READY FOR H1 GENERATION`：P0=1（五档导出错误使用 cover 而非 SHOW_ALL `#06265F`）；P1=4（assetId、raw 版本、Sharp 解析、PNG 元数据）；P2=2（NO ART 扫描过窄、空 H4 测试）。返回原管线员工按 TDD 修复；H1 继续阻塞。
- 2026-08-30：管线员工完成 RED→GREEN 修复；负责人复跑 6/6、结构校验和包哈希均通过。原独立审查员工再次零写入复验：`READY FOR H1 GENERATION / P0=0 / P1=0 / P2=1`；P2 仅为 `node -e` 导入 CLI guard 复用毛刺，不影响批准的 H1 命令路径。
- 2026-08-30：冻结 H1 prompt `HOME-H1-ARRIVAL-PROMPT-V1-A`，SHA-256 `cdc045d79e35cb5e7135b4e2da32fd268058818c7a182817351e73dcf378a0dc`；七项提示词安全检查全 PASS；候选清单在生成前保持 `generationCount=0 / repairCount=0`。prompt-ready 包哈希清单自身 SHA-256 `1cb32dc7c3db202fc3e1997c83770e435dc5279847189aaad24dc4cff2ca5df4`。
- 2026-08-30：H1 r1 raw SHA-256 `0173347aef71b01889afe6ddd39c1e8759484c18b3861b22ad22f8dde16ba3aa`，原始尺寸 `853×1844`。负责人预检：房间／暖光／猫／空挂钩／壶／两杯／米饭／汤／空中央盘均满足；唯一 P1 是人物误穿深色针织内搭而非灰蓝外搭。按计划允许一次定点 r2；修复提示词 SHA-256 `df4eea642a401db1afdee5c6f5ac0a66e5280c61436f57cebd2923caf9af4158`，只改衣服。
- 2026-08-30：唯一 r2 已生成并耗尽 H1 生成额度。r2 raw SHA-256 `800d229c307f39c5ab99e15a6a0e6aa1fd29232f305ebddca7acd58227a77e6c`；390 导出 SHA-256 `b68c2dfd7bcf40a9d3bd77320faecdbeff517e2b2f7f160abbf4a7d4c6a836fe`；195 导出 SHA-256 `037523e90281531145a6ae47633e6ec87e883df943e1853ef13f910296acd982`。页面校验为 `REVIEW REQUIRED` 且无机械问题；SHOW_ALL 压力尺寸角像素已抽核为 `#06265F`，未裁图。下一步只做证据板与视觉审查，不再生成。
- 2026-08-30：负责人视觉审查与全新独立零写入审查均为 `P0=0 / P1=0 / P2=0 / READY FOR USER VISUAL APPROVAL`。证据板确定性测试通过；发现并按 TDD 修复两处只影响验证链的状态推进缺陷：漂移测试不再复用合法状态，结构验证允许“已出图待审＋后续页无图”的合法部分阶段。最终生产测试 7/7，证据测试 1/1，结构验证通过；H1 像素及哈希未改变。
- 历史记录（H2 审查前）：H1 预批准清单自身 SHA-256 `efdedf0f7cb9da15ca492b24a4d5e631dfe642b5733a379d7902fba052cbdcf4`；包含预批准快照后的当前包清单自身 SHA-256 `45b94d1bd0e3774c9261d3492420259475c3221e2b96e018b6ffe19a86374172`，全部 `shasum -c` 通过。当时 H2-H4 继续阻塞，等待用户批准同一 H1 390 文件和 SHA-256；该历史状态已由 H2 审查同步替代。
- 历史记录（H2 审查前）：2026-08-30 用户原句 `批准 HOME-H1-ARRIVAL-V1-A-R2：H1 单帧视觉通过`；批准候选 `home-meal-h1-arrival-v1-a-r2` 的 390×844 SHA-256 为 `b68c2dfd7bcf40a9d3bd77320faecdbeff517e2b2f7f160abbf4a7d4c6a836fe`，批准前清单自身 SHA-256 为 `efdedf0f7cb9da15ca492b24a4d5e631dfe642b5733a379d7902fba052cbdcf4`，批准记录 SHA-256 为 `b3f6baca9190fa278e680613b58c37f25aac017f62e72ee54f3f104878fac4f6`。当时 H1 状态为 `USER VISUAL PASS/FROZEN`；H2 P0/P1 关闭前不得生成 H3。该历史停止线已由下条 H2 同步替代；H4、Cocos、build、WeChat、Git 继续 `BLOCKED`。
- 历史记录（H3 双审前）：2026-08-30 H2 `home-meal-h2-hang-outerwear-v1-a-r1` 完成负责人及独立零写入视觉审查，双方均 `P0=0 / P1=0 / P2=0`，独立审查 `writeOperations=0`；最左深色区确认是 H1 继承的夜间门洞，不是室内黑角。390×844 SHA-256 `ef11fcb38d1e515cb2f8702d7b4ea8734f0f92ac08f24c8e2a18bfad97ccc6dd`，195×422 SHA-256 `8419a54d7aea95c00eb638299f4f3a0faec8e41c0a259fce190336b878bf7593`。当时 H2 内部停止线关闭并解锁 H3 严格串行生产；该阶段已由下一条 H3 双审完成记录替代。H4、Cocos、build、WeChat、Git、远端写入继续 `BLOCKED`。
- 2026-08-30：H3 `home-meal-h3-serve-hot-dish-v1-a-r1` 完成负责人及全新独立零写入视觉审查，双方均 `P0=0 / P1=0 / P2=0`，独立审查 `writeOperations=0`；相连厨房、盛菜动作、H3→H5 浅圆盘菜品连续、猫远离热源、明亮暖家和 430 pressure `#06265F` 均通过，证据板明确未生成 H4。390×844 SHA-256 `c582fa5e9ad5c0f465e307472ccfc6791ed78b2d1e81663669df9151819aab72`，195×422 SHA-256 `ce8e04691102079b2cea11b02c4e51cf52a752c3902433a07dd0481b0822b4c2`。H2/H3 预批准清单自身 SHA-256 分别为 `9b5b908aa26561ce51bacae789b971c4b604502f60736cad8976cf6c6cc36f1e`、`91d967150073566f1d9c34302bb3197a26fdf4ac2d45201a0fa13a9303eeb4ec`，内部项目复算全部 OK。H2/H3 均 `USER APPROVAL PENDING`；H4、Cocos、build、WeChat、Git、远端写入继续 `BLOCKED`。
