# Formal UI V1.1 / 暖屋修订设计板

> 状态：`BLOCKED / AWAITING USER APPROVAL`  
> 当前 Gate：Gate B2 正式可见体验提案  
> 用途：把用户最新决定“外面安静舒心，屋内温馨暖心；灯光照亮黑暗”转成可见的冷暖视觉链、室内光线合同、四张关键屏和 0.9 秒门转场说明  
> 禁止用途：直接切图入包、声称用户已批准、替代正式分层母版、Cocos 运行时、真人盲测或微信真机验收

打开 `index.html` 即可查看。需要本地服务器时，在本目录运行：

```bash
python3 -m http.server 4174 --bind 127.0.0.1
```

## V1.1 变更摘要

- 户外 V7 保持不变：自然深蓝星空、夜风草坡、成年人背影＋普通家猫、右侧小屋与两朵弱光花均不在本轮改动范围。
- V1 冷蓝“窗边小桌”只在 Before/After 中保留一张小图，作为“室内与户外同温度、没有明显进屋”的问题证据；旧 `design-board/formal-ui-v1/` 不删除、不覆盖。
- `INDOOR-N01-A-V1.1 / 暖灯窗边小桌` 替代 V1 方案 A，作为本轮待批准方向；人物在左、猫在右，四张关键屏全部使用新暖屋探索图作底。
- 光线层级锁定为：`纸灯／壶边暖光第一 → 人物＋猫第二 → 窗外冷夜第三`。
- 正式原创重绘目标：暖区约 40%–50%，窗外冷区约 25%–30%，深暗区约 20%–30%；禁止橙色洗屏、纯白过曝、Bloom 和粒子堆光。
- 页面上的暖屋图使用非破坏性 CSS 显示校色（轻降饱和、轻压亮度、暗角分区），用于表达未来重绘目标；没有改写源 PNG，也不把显示效果声称为正式资产。
- 0.9 秒门转场改为：门光回应 → 暖纸层掠过 → 室内灯先照亮壶和桌 → 暖边落到人物肩背与猫耳背。无镜头推进；减少动态为 180ms 交叉淡化。
- SafeArea、44×44 最小热区、相邻 8px、大字真实 120%、拖拽轻触替代与减少动态规则保持不变。

## 当前资产来源与边界

| 文件 | SHA-256 | 来源／用途 | 状态 |
|---|---|---|---|
| `assets/v7-approved-reference.png` | `7157484b95988b11c1abdf9ddc0d5bb7c2d3bde25dd9d2dfcf6c5ee795847b3d` | 已批准 V7 的本地只读副本；只校准户外连续性 | `prototype-only / approved direction` |
| `assets/concept-a-warm-room-exploration-v1-1.png` | `3d6407f3dda86391aa8c7ab62bd35cb30752741344280890f20909b5fd2454c5` | imagegen 光色／空间探索；V1.1 暖灯窗边小桌 | `generated exploration-only / awaiting approval` |
| `assets/concept-a-window-table-exploration.png` | `36d9c0409ba8cf3ad2c29258be7de0289ce88ba61985e1c076d5a0cc70316e2b` | V1 冷蓝方案 A；仅用于 Before 问题对照 | `superseded for proposal / comparison-only` |

新暖屋探索图的原始生成文件：

`/Users/wxl/.codex/generated_images/01a02259-fb9a-7c32-a943-30c3c5c47a30/exec-7e8af71b-4214-4cbf-ad23-2e023c99347a.png`

所有生成图都只允许帮助判断构图、光色、材质与空间比例。正式人物、猫、灯、壶、杯、中文、Logo、图标和关键互动物必须以可编辑分层形式原创重绘，记录作者、来源、许可、版本和 SHA-256；不得照搬生成图细节或现成 IP。

目录中其他继承或被否决的探索图不属于 V1.1 当前候选，不在主板展示、不在本节当前资产清单或 `HASHES.sha256` 中，也不得交给实现消费。

## 可复现的规范化探索提示词

以下文本是本轮设计语义的 normalized / reproducible 摘要，不是服务端逐字、逐字节日志。它不使用艺术家或现成 IP 名称。

### `INDOOR-N01-A-V1.1 / 暖灯窗边小桌`

```text
Create one exploration-only vertical 390×844 composition for an original quiet nighttime WeChat mini game. Continue from an approved calm natural deep-navy outdoor night, but make the indoor emotional temperature clearly warmer and more heartfelt: darkness remains around the room while one original paper-shade lamp genuinely illuminates the kettle edge, low wooden table, a normal-proportioned gender-neutral cartoon adult seen from behind at lower left, and one ordinary domestic cat at lower right. Use soft gouache and dyed-paper layers with subtle grain, low saturation and shared material/lighting across room, adult, cat and objects; no photorealism.

Lock the visual focus order: (1) paper lamp and kettle-side warm light, (2) adult and cat receiving only a thin warm rim, (3) the cool outdoor night through the left window. Target the formal-redraw area balance as approximately 40–50% warm zone, 25–30% cool window zone, and 20–30% deep shadow/negative space. Warm light must feel localized and believable, not an orange full-screen wash. Preserve texture and dark-side detail on the lamp, kettle and character backs; no clipped white highlights, bloom, volumetric beam or particle glow.

Keep the adult on the left and the ordinary cat on the right, both calm, weighted and non-performative beside a low table with a kettle and two plain cups. The window shows sparse natural stars and only one faint, broad, broken galaxy; no moon, constellation line, neon aurora or decorative light ribbon. The lamp must be an original simple paper-and-wood household object, never a magical character or recognizable designer lamp. Generous breathing space and readable silhouettes at 25% scale.

No UI, text, logo, tutorial, reward, progress, existing IP, childlike proportions, named character, dressed or anthropomorphic cat, fantasy inn styling, exaggerated orange grading, bloom, task-map cues or baked typography. Final production assets must be manually redrawn as editable traceable layers.
```

## 明确被替代的范围

- 被替代：V1 方案 A 的“室内大面积继续冷蓝、仅壶边一小点暖光”光色解释；原图仍保留用于追溯。
- 未替代：获批户外 V7、人物左／猫右与角色类型、水粉纸绘／染色纸层、N01 功能链、设置时机、3/5/8 时长规则、杯子小剧场、固定分享语气、SafeArea、大字、静音和减少动态规则。
- 未批准：V1.1 探索图本身、正式分层资产、Cocos 视觉接入、音乐、微信预览、上传、审核或发布。

## 预期浏览器证据与验证边界

完成截图后，`evidence/` 记录：桌面全板、三幅冷暖视觉链、Before/After、四张关键屏，以及 360×800、390×844、430×932 三种页面视口。`HASHES.sha256` 只纳入本轮有效证据；继承的 V1 截图不会成为 V1.1 通过证据。

浏览器检查只能证明提案板无水平溢出、图片加载、文本与 44×44 展示热区正确。正式 Cocos 的 360/390/430 游戏画面、微信 SafeArea、20% OLED／60% LCD 暗部、大字 120%、减少动态 180ms、静音等价、性能与生命周期仍须在用户批准正式母版并接入候选后独立复验。
