# 今夜有灯

> **当前状态：** 用户已批准 `STORY-GAMEPLAY-REPLAN-V1-A-R1：文字入画与完整夜晚结构`，正式主线为 16 状态的“一盏灯接住一盏灯”。新任务先读 [`docs/HANDOFF-2026-09-01-STORY-R2.md`](docs/HANDOFF-2026-09-01-STORY-R2.md)，再按 `AGENTS.md` 与 `docs/PROJECT-MEMORY.md` 执行。旧微信版本、旧 Graphics 室内壳和短换图流程只作历史诊断。

一款面向下班后短暂过渡的原创微信小游戏。当前交付包含完整需求、三案视觉对比、五夜高保真可玩原型、可编辑角色与资产包，以及可由 Cocos Creator 3.8.8 直接运行的第一夜正式 V0 可见切片。

## 立即查看

在当前目录启动静态预览：

```bash
npm run preview
```

然后打开：

- `http://127.0.0.1:4173/design-board/story-gameplay-replan-v1-a-r2/`：当前 16 状态可丢弃浏览器证明，等待最终人工复核；不是正式运行时资产。
- `http://127.0.0.1:4173/design-board/`：历史室内三案参考，不代表当前户外 Gate B。
- `http://127.0.0.1:4173/prototype/`：历史“月光灯箱”五夜流程回归参考。
- `http://127.0.0.1:4173/cocos-project/build/web-mobile/`：历史室内第一夜 V0，本地逻辑/音频回归参考。
- `http://127.0.0.1:4173/prototype/?from=lamp`：匿名分享落地态。
- `http://127.0.0.1:4173/prototype/?state=load-error`：资源失败降级态。
- `http://127.0.0.1:4173/prototype/?state=resume`：前后台恢复态。
- `http://127.0.0.1:4173/prototype/?state=settings`：暂停设置、大字与减少动态状态。
- `http://127.0.0.1:4173/prototype/?state=share-preview`：固定分享预览状态。

浏览器原型不依赖框架、远程字体、远程图片或第三方脚本。声音由 Web Audio 在首次触碰后本地生成，仅用于竖切片验证。

## 目录

```text
assets/exploration/  三套无角色的光色与材质探索图，仅作参考
assets/final/        可编辑角色圣经、角色、Logo、图标与互动物 SVG
assets/asset-register.csv  实际素材来源、状态、版本与 SHA-256 台账
design-board/        三案可视化对比板
prototype/           可玩的高保真浏览器竖切片
cocos-project/       Cocos Creator 3.8.8 TypeScript 第一夜正式 V0 与五夜领域层
docs/                角色、五夜内容、资产治理与验收材料
scripts/             非破坏性交付检查
```

## 验证

```bash
npm run verify
```

该命令检查文档一致性、浏览器交付结构、无外链约束、五夜内容与无障碍入口，并运行 Cocos 工程的项目结构、最小场景挂载、领域类型及状态机回归测试。

## Cocos 接线

正式工程位于 `cocos-project/`，已提供 `assets/scenes/main.scene`、Canvas、GameRoot、`TonightHasLightBootstrap` 与运行时挂载的 `TonightHasLightV0View`。第一夜支持选时长、首次触碰、拖光/点壶、扶杯小剧场、安静停留和双按钮收尾；首次用 Cocos Creator 3.8.8 打开时，按 `cocos-project/docs/EDITOR_SETUP.md` 等待资源导入并确认竖屏启动场景和微信小游戏构建面板。

当前检查点不包含密钥，也未授权推送远程仓库、微信构建／上传、体验版设置、提审或公开发布。
