# STORY-ILLUSTRATION-REDESIGN-V1-B-FORMAL-R1

状态：`FORMAL REDRAW CANDIDATE / SECOND USER APPROVAL REQUIRED / NOT IN COCOS`。

本目录是 B「无字夜漫画·同一阵风」三拍故事的正式可编辑美术候选。三张 SVG 从空白画布建立人物、普通家猫、自然星空、草坡、小屋和两朵花；不嵌入、不描摹、不裁切任何 ImageGen 探索 PNG。

## 视觉合同

- B01「坐稳」：大片留白夜空压住节奏，人物和猫把重量放在草坡上。
- B02「风经过」：低机位的三条巨大草带从左向右通过人物发梢、衣角和猫耳、猫尾。
- B03「余风」：手与猫尾的地面近景，只有两根草尖还留着同方向余势。
- 五色套色固定为 `palette.json`；唯一明显暖色是稳定门光，两朵花更弱。
- 漫画墨线必须断续且落在实体内部，不能成为贴纸式闭合黑轮廓。
- 一次只显示一个满屏画格，无边框、对白、拟声字、任务或奖励。

## 文件职责

- `src/*.svg`：原创、具名、可编辑分层源；包含四套裁切参考、Pivot 对应组和矢量纹理。
- `layer-manifest.json`：层序、Pivot、混合和适配合同。
- `scripts/export-assets.mjs`：使用固定参数确定性导出 15 张 PNG，并刷新哈希索引。
- `scripts/validate-assets.mjs`：检查源结构、禁用 raster/filter、五色套色、输出尺寸、透明边和哈希覆盖；正式缩略证据固定为 `195×422`。
- `dist/`：供第二次用户可见审批的静态 composite；在批准前禁止复制到 Cocos。

## 命令

当前桌面运行时的 Sharp 位于 Codex 工作区依赖中；脚本会先尝试普通 `sharp`，再尝试该只读运行时路径。

```bash
node design-system/outdoor-story-illustration-v1-b/scripts/export-assets.mjs
node design-system/outdoor-story-illustration-v1-b/scripts/validate-assets.mjs
cd design-system/outdoor-story-illustration-v1-b
shasum -a 256 -c ASSET-HASHES.sha256
```

## 权限与来源边界

- 上游探索图只提供故事、构图、光色和材质语言，登记为 `prototype-only/not-in-build`。
- 本目录不含生成图像素、外部图片、第三方字体、现成角色、Logo 或署名素材。
- `FORMAL-R1` composite 仍需用户对同一 SHA-256 做第二次批准；在此之前 Gate B 保持 `BLOCKED`。
- 本目录不授权 Cocos 集成、微信构建、上传、提审、发布或 Git 操作。
