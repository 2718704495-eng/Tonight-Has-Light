# OUTDOOR-ILLUSTRATION-WIND-V1-A-R2 批准记录

> 批准日期：2026-08-27  
> 批准人：用户  
> 方案：`OUTDOOR-ILLUSTRATION-WIND-V1-A-R2 / 大轮廓五幅风页`  
> 状态：`VISUAL DIRECTION APPROVED / LOCAL COCOS IMPLEMENTATION AUTHORIZED / NO WECHAT UPLOAD`

## 用户批准原文

```text
是的这种感觉很好，批准 OUTDOOR-ILLUSTRATION-WIND-V1-A-R2：大轮廓五幅风页
```

## 批准身份

- R2 探索联画：`design-board/outdoor-illustration-wind-v1/exploration/five-wind-pages-storyboard-r2-stronger.png`
- R2 探索联画 SHA-256：`a787d06f170cef4ac675e7a14287b4f8c4cfaef5414248091bfe481abdb1b811`
- 批准时设计板索引：`design-board/outdoor-illustration-wind-v1/HASHES.sha256`
- 设计板索引 SHA-256：`eadf25e781d868cfec15b4b797addb88f1f7b190f258916fe336721c0386161b`
- 批准时 R2 提案 SHA-256：`82b831b7cc3a6b33fdc44d7fb70670a0ffecedd019c3caecde17c1817d66d674`
- 批准时 R2 详细幅度说明 SHA-256：`c41cf031189e90936520e566d7b597254860c636fca5c2d9e66851d255968064`
- 批准状态回写后提案 SHA-256：`c8e3ddcbcde2faeace7f7968f06342c9f9c042d8cdc220bf987855ea84e48a8d`
- 批准状态回写后幅度说明 SHA-256：`f81952fabfe837123f7f2b18b3ea3ee4704c9ee262d3541db142794b7ceb5e89`

## 获批范围

- R2 的下半场大轮廓作为当前唯一风页方向：F2 整片草浪、F3 发梢／衣角、F4 猫耳／整条猫尾必须在手机比例下可辨。
- V7 上景、单条淡银河、山线、右侧小屋、稳定门光、两朵花、人物／猫坐点与凉爽舒心的情绪不变。
- 允许作为独立、可丢弃的本地 Cocos 候选实现：一份稳定上景＋五幅锚点锁定下景，由预加载双 Sprite 以 `140ms smoothstep` 交叉淡化。
- 允许本地 Web 构建、截图／录屏和 360／390／430 宽度回归；门在任意风页和转场期间仍必须立即可点。
- 减少动态关闭自动换页，固定 F0 中性稳态；仅允许 `≤180ms` 透明度／亮度反馈。

## 资产与外部操作边界

- 这次批准的是可见方向和本地动态验证，不是 imagegen 联画的正式生产资产许可。
- 联画中的白色面板线不得进入运行画面；上景必须只保留一份，不能在换页时跳动。
- 本地候选和证据必须继续标记 `prototype-only / disposable / not-for-review / not-for-release`。
- 不授权微信 `preview`／`upload`、设置体验版、提审、发布、Git 提交或远程推送。如需手机体验，须在唯一新候选通过本地和独立 QA 后另行授权。
