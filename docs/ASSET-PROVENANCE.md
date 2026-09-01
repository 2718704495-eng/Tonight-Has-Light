# 资产来源、授权与生成记录

> 版本：v1.0  
> 适用对象：角色、场景、Logo、UI、图标、字体、纹理、动画、音乐、环境声、短音效、分享图

当前实际台账位于 [`assets/asset-register.csv`](../assets/asset-register.csv)。旧“软团兽＋灯灵”矢量已被 V7 角色决定替代，必须标记为 `retired` 且不得进入当前构建；V7 生成图与 Gate C 衍生切层只允许 `prototype-only/not-in-build`。第一夜室内音乐候选 `AUD-N01-001` 仍保持为 `draft`；户外环境风 `AUD-OUTDOOR-001` 已通过用户试听，并已实际接入唯一 B-lite 候选，在浏览器中完成首触、静音、模拟前后台和单实例循环验证，在微信真机与主观接缝复听完成前保持 `reviewed`。正式人物、家猫和户外分层资产需在 Gate D 前建立新的可编辑重绘记录。

2026-08-29 新增 `ART-OUTDOOR-001`，对应 `FORMAL-OUTDOOR-ART-PILOT-V1-B` 的唯一 `root_night_slope_v1` R1 单帧母版。正式 RGBA 母版 SHA-256 为 `5c84ce815ba011cd9be570889c768573e80c3d55d6b59fb2bd211301f86c74e3`，来源、提示词、参考角色、归一过程和旧像素排除范围记录于 `design-system/formal-outdoor-art-pilot-v1-b-r1/provenance.json`。该母版通过负责人和独立只读任务的 390×844／195×422 可见预检，用户又明确批准同一 R1 单帧视觉，并批准改走 `FORMAL-PICTUREBOOK-FULLFRAME-V1-A` 的全幅页面路线。原 20 层包因首个真 Alpha 探针失败而永久停止；资产现为 `visual-approved / fullframe-route-approved / not-in-build`，不得在 Batch 1 用户视觉批准与后续 Gate 通过前交 Cocos、微信、扩产或发布。

2026-08-29 按用户批准的 `FORMAL-PICTUREBOOK-FULLFRAME-V1-A` 详细规格创建 Batch 1 候选：`ART-PBOOK-STAR-005` 星空终章 F5 与 `ART-PBOOK-HOME-005` 明亮暖家 F5。两者均为 `ai-assisted-formal-fullframe` 全幅 clean plate，来源、提示词、参考边界、原始输出、归一化与负责人审查记录位于 `design-system/formal-picturebook-fullframe-v1-a-batch1/`。2026-08-30 原三联板仍引用旧 R1 根页的证据漂移已关闭；当前唯一审查候选为 `formal-picturebook-fullframe-v1-a-batch1-r2-r4-root`，使用已批准 R4 根页的逐字节一致审查导出，星空 F5 与暖家 F5 的 prompt、raw、master 和导出均保持不变。`ART-PBOOK-STAR-005` 母版 SHA-256 为 `d36b99ebfe0805233000df9c0cbf2bc6217691111a7da7fa8e2dbe2eb99e4a85`；`ART-PBOOK-HOME-005` 母版 SHA-256 为 `1323cf0a103fffd7f8fd731ab0e1164527b9b0401b5d6acd357d1d3b215ecfb9`。当前 51 项清单自身 SHA-256 为 `f1bc56dc2a9f56503bc651e6057af711fc303a68d2c8a662a8f40e94809f33de`；旧 40 项清单 `866adec9f...7cf49` 仅作历史。两张 F5 都不得烘焙中文、UI、热点或流星，也不得在用户批准同一文件与哈希前进入 Cocos、微信、审核、发布或 Git。

2026-08-31 用户先批准 `STARGAZE-F5-FORMAL-V1-A` 正式文件和 `STARGAZE-FORMAL-BATCH-V1-A` 从 F1 单帧探针开始，随后明确批准 `STARGAZE-F1-FORMAL-V1-A-R1：F1 单帧视觉通过`。`ART-PBOOK-STAR-001 / scene_02_stargaze_shot_001 / 抬头` 因而以同一文件冻结为 `ai-assisted-formal-fullframe / approved / not-in-build`，目录为 `design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/`。F1 只使用一次初始生成、零次定向修复；raw SHA-256 为 `d75bdf4bb9ae371a72c5d11b33c89dbdcbbe6d71f1f6f961c87ca41071b2d6b4`，master SHA-256 为 `a51280508e89f4ce0cbbee27ce75e5548301a9bde37972395edaec81c3296dbf`，390×844 SHA-256 为 `6b2450a1993742545b83958d4f17913fda63a512071f42fa0a148feb4856c26e`，195×422 SHA-256 为 `ad9c89d2880853281aec6e8cde97b071f3d508a485960dadf6d6a8e20c9367c8`。原只读提示词审查任务越权生成并自评，其 owner review 被保留为无效审计材料；主任务随后重审为 `P0=0 / P1=0 / P2=0`，全新独立复核回报 `P0=0 / P1=0 / P2=0 / writeOperations=0`。小屋极弱侧窗与批准 Root R4／F5 连续、明显弱于门与天空，不构成修复项。批准前 `24/24` 清单已快照为 `pages/scene_02_stargaze_shot_001/approvals/HASHES.pre-approval.sha256`，自身 SHA-256 为 `bdb0cb668dd127c442e28e7a13425104e4f658c1421da726ab97bc448ed36efa`。批准记录为 `docs/STARGAZE-F1-FORMAL-V1-A-R1-APPROVAL.md`。本段末尾描述的是 F1 获批当时的历史停止线；之后的 F2 批准与 F3 候选状态以下两段为准。

2026-08-31 在该串行授权内新增 `ART-PBOOK-STAR-002 / scene_02_stargaze_shot_002 / 银河深处` R1。它是 `ai-assisted-formal-fullframe / approved / not-in-build` 的单张正式页，已由用户同一文件批准并冻结。F2 使用一次初始生成、零次定向修复；raw SHA-256 `0d44c7dcc7af05432c91f89056fa023a7ce2ccf3b4ebb74ca847c1ce694d0084`，master SHA-256 `2c8326bae7dbd85384583864e5689bf719d84d3dfdca998711ee681eff0a2d63`，390×844 SHA-256 `98e267506a5485a93fdefa9759611c0ac4de2120edd5dc61d253a9ff59deee52`，195×422 SHA-256 `01309ee9a41e36e52d1f7b8eb3f69948796a518c22b9586c8a0111bec540586c`。负责人和全新视觉独立复核均为 `P0=0 / P1=0 / P2=0`，独立复核 `writeOperations=0`；机械校验无问题。用户批准前整包哈希清单 `47/47` 复算通过，批准前 `HASHES.sha256` 快照自身 SHA-256 为 `6639f380d2cbc408b64a1cfac6631ff74c6ebaeb5d91862aa4301d2b2cfb5e47`。批准记录为 `docs/STARGAZE-F2-FORMAL-V1-A-R1-APPROVAL.md`。当前状态 `USER VISUAL PASS / FROZEN`；F3 `薄云经过` 已授权为下一张单帧生产，F4、Cocos、build、WeChat、审核、发布与 Git 继续阻塞。

2026-08-31 在 F2 用户批准后新增 `ART-PBOOK-STAR-003 / scene_02_stargaze_shot_003 / 薄云经过` R2。它现为 `ai-assisted-formal-fullframe / user-visual-pass-frozen / not-in-build` 的正式页。F3 使用一次初始生成与一次定向修复；定向修复只为避免初稿云形误读为流星／彗星尾迹。最终 raw SHA-256 `7775e6653a8e7d6773fc0b51783b1d7a08817cab3febf4de1bf6ef73b7cdb417`，master SHA-256 `d2561098ca35f15b02adb7a74bc7cc61778bbfb789552f57a27dc58685b57745`，390×844 SHA-256 `ae9cc70c56be5b8f83e985058d7ab40bc71a0aa0f5f32819bb2706f0111244ec`，195×422 SHA-256 `601899992501bcc2cf92c8122cad7fcef715642de82c52022a3d0f7e7aa62ff3`。机械校验通过；负责人和两路全新只读独立复核均为 `P0=0 / P1=0 / P2=0`，独立复核 `writeOperations=0`。用户已批准同一 390 文件，批准前 68 项包清单快照自身 SHA-256 为 `0466cb82c55385dddd058cae3f780d472c9df6f66c02b213706cee04f7750bc1`，批准记录为 `docs/STARGAZE-F3-FORMAL-V1-A-R2-APPROVAL.md`。候选底部人物发梢和猫耳仅作尺度锚点，不改变天空第一。仅解锁 F4 `云缝重开` 的单帧正式候选生产；Cocos、build、WeChat、审核、发布与 Git 继续阻塞。

2026-08-31 新增并由用户同一文件批准 `ART-PBOOK-STAR-004 / scene_02_stargaze_shot_004 / 云缝重开` R1。它现为 `ai-assisted-formal-fullframe / user-visual-pass-frozen / not-in-build` 的正式页，不是已批准运行时资产。唯一图像编辑参考为用户已批准 F3 master，SHA-256 `d2561098ca35f15b02adb7a74bc7cc61778bbfb789552f57a27dc58685b57745`；只把同一片云打开成自然缝隙，让同一颗主星安静重现，不改机位、银河、暗裂、星点地理或底边人物／猫尺度锚点。完整提示词 SHA-256 `2686801fa3ca069854451579428db77154e376614abf9090232b049a5b39bda8`；一次初始生成、零次定向修复；raw SHA-256 `6bb51bb0a31f7663f3381c274978f64da42dc5e356aadb078f6efa53c61f34d2`，master SHA-256 `7a1d0cac3e0b6a27dd7629213fbf58547b9f3f378348308f87f1bda8fa642fd0`，390×844 SHA-256 `0973fec9fc18cfdb7422dcef32941a1fb071f84c95154cb10fd1d5279bda1ae9`，195×422 SHA-256 `50fb03ede500217889870dee6678c502d0d72125f375208fd5985e72298b2036`。机械、负责人和独立只读视觉复核均为 `PASS / P0=0 / P1=0 / P2=0`，独立复核 `writeOperations=0`。用户批准原句为 `批准 STARGAZE-F4-FORMAL-V1-A-R1：F4 单帧视觉通过`；批准前包清单快照自身 SHA-256 为 `abc92a43429d03d58be0e9c22ef09c0f68d955c30681cef7fc3ce1b89ad5b111`，批准状态同步后当前 90 项包清单自身 SHA-256 为 `a088783c7e77ca8bc2569305c6e4572fa904b2a3dfb64ab7a3fcd89d579e19c1`，批准记录为 `docs/STARGAZE-F4-FORMAL-V1-A-R1-APPROVAL.md`。F1–F4 与单独批准的正式 F5 因此构成 `STARGAZE-FORMAL-BATCH-V1-A GATE B VISUAL SUBPACKAGE PASS / NOT IN BUILD`；项目整体 Gate B 和 Cocos、build、WeChat、审核、发布、Git、远端写入继续阻塞。

2026-08-29 用户批准 `ROOT-WIND-HEM-V1-A｜风托起衣角` 后，新增独立根页候选 `ART-OUTDOOR-ROOT-WIND-HEM-001`。它只替代当前根页视觉审查中的旧 R1，不覆盖旧文件，也不改变星空 F5 与暖家 F5。候选使用一次初始生成和一次允许的定向修复；当前母版位于 `design-system/formal-picturebook-fullframe-v1-a-root-r2-wind-hem/source/masters/root_night_slope_v2-wind-hem-master-2x.png`，SHA-256 为 `38e030cbec217c1349beba788e4a041631d295c52a2a0957dc4f9fa45c72a068`。完整提示词、两个参考的用途边界、原始输出、五档 SHOW_ALL 导出、负责人审查和 clean independent review 均记录在同一目录。该 review 判定 `P1 / BLOCKED`：衣角最显眼的展开方向偏左，与左→右风向合同冲突；用户需明确接受当前方向，或另批 R3 只修方向。当前仍为 `not-in-build`，不得进入 Cocos、微信、审核、发布或 Git。

2026-08-30 用户先批准 `ROOT-WIND-HEM-V1-A-R4｜人工局部重绘衣角，不再整体重生成`，随后对展示的同一文件明确回复 `批准 ROOT-WIND-HEM-V1-A-R4：根页视觉通过`。`ART-OUTDOOR-ROOT-WIND-HEM-003` 因而成为根页静态视觉基线：它以 R2 冻结母版为唯一图像输入，不使用 ImageGen、第三方像素或整图重生成；仅在 `780x1688` master 的 ROI `left=50, top=1318, width=328, height=112` 内，以同图草纹理遮除旧左向衣角，再通过可编辑蒙版提取 R2 自身针织纹理并局部翻转、缩放、抬升，叠加两条可编辑 SVG 破碎轮廓。当前目录为 `design-system/formal-picturebook-fullframe-v1-a-root-r4-manual-hem/`；批准 master SHA-256 为 `41599f03a0a7a71acd953b46066c3205b4da1522d0a06bd86b73186afedccdc8`，批准 `390x844` SHA-256 为 `23443918a0c892d569a6fd49b55b889d70bb4ed0dc7a6396a0af2bf5fad2306a`，批准时 29 项清单 SHA-256 为 `888ee916f58c1f55a5986afa040be5564e38800dea023f02fb812962167b2c42`，批准状态同步后 30 项清单 SHA-256 为 `7ba90c894a97daaefda0463548ad26cc82a3605a6135a9d3535b306ad0a83f5f`；旧 `manual-hem-right` 排除。状态为 `root-page-gate-b-pass / visual-approved / not-in-build`；整套 Gate B 仍缺其余正式页，且本批准不授权 Cocos、微信、审核、发布或 Git。

2026-08-28 的 `STORY-ILLUSTRATION-REDESIGN-V1-B-KF-R1` 三张 PNG 是内置 ImageGen 生成的 Gate B 探索图，默认只用于风格、构图、光色和镜头沟通。采用图、SHA-256、批准边界与提示词记录位于 `design-board/story-illustration-redesign-v1-b/`、`docs/STORY-ILLUSTRATION-REDESIGN-V1-B-SELECTION.md` 和 `storyboard/story-illustration-redesign-v1-b/prompts/`。用户随后批准了一个精确、一次性例外：三张图的确定性压缩衍生图可进入独立 `outdoor-story-b-kf-r1-temp` 分包，并仅用于微信开发版本 `0.4.7` 及由用户自行设置的对应体验版。临时资产 ID 为 `TMP-OUTDOOR-BKF-001` 至 `TMP-OUTDOOR-BKF-003`；边界是 `prototype-only / disposable / 0.4.7-only / not-for-review / not-for-release`。该例外不改变生产属性：正式版本仍须建立新的正式资产 ID、可编辑分层重绘源、人工修改记录和相似性复核；不得在后续版本默认复用。

2026-08-28 的下一步正式生产收窄为 `STORY-ILLUSTRATION-B-FORMAL-R2-PROOF`，说明见 `docs/STORY-ILLUSTRATION-REDESIGN-V1-B-B01-FORMAL-PILOT.md`。该样板只允许验证 B01 `坐稳` 的成熟无字夜漫画画味、成人与普通家猫解剖、自然银河、草坡干笔、两朵弱光花、适配裁切和分层来源。产出前必须先建立新的正式资产 ID 与证据包；产出后默认状态为 `draft/review-board-only`，不得进入 Cocos、微信构建、体验版、审核或发布。只有在主任务肉眼预审和用户明确批准同一版本后，才能把同一生产方法扩展到 B02/B03 或交给 Cocos 消费。

`STORY-ILLUSTRATION-B-FORMAL-R2-PROOF` 的首稿和 R2.1 已于 2026-08-28 被负责人判为 `FAIL / REVIEW-BLOCKED / STOPPED`。虽然源文件无嵌入栅格、17 个命名层、五档尺寸和 24 项哈希校验通过，但成年人坐姿、普通猫解剖、宽淡银河和成熟干笔漫画质感均未达批准 B 的可见标准。失败目录仅作方法审计，`HASHES.sha256` 自身 SHA-256 为 `3a69b9fc3dea676a166a738f953422af016a158afadf205187ec312fd8bd577d`；其中任何 SVG/PNG 不得成为正式或临时 Cocos/微信资产，也不得扩展到 B02/B03。

2026-08-28 的 `B-PROTOTYPE-R2` 三张 PNG 由一次越权的只读审查任务生成并短暂切入本地预览，未经过主任务提案或用户批准。负责人发现后已把当前预览恢复到 KF-R1；R2 只为保留审计证据而隔离在 `design-board/story-illustration-redesign-v1-b/exploration-r2/`，状态为 `UNAPPROVED / BLOCKED / NOT CURRENT PREVIEW / DO NOT COCOS / NO BUILD / NO UPLOAD`。文件与哈希如下：`b01-settle-prototype-r2.png` SHA-256 `f680e3239403148f81e29f0174b69f36e638555239813c4831e7cd26c484d49e`；`b02-wind-passes-prototype-r2.png` SHA-256 `2d3e2d88400229820f27ba6bf2ec0ff3ecd4f93bfae1f1ee14b232bdf56958fe`；`b03-afterwind-prototype-r2.png` SHA-256 `b7902aec032ab4533031f1c33ea7365cfea3687874b1805762cfd0ed0032a2aa`。

用户于 2026-08-25 批准 `FORMAL-ENDING-UI-V1-A` 后，新增 `UI-N01-END-001` 至 `UI-N01-END-005`：A 灯下留笺、B 桌边暖纸、等权动作纸面、固定点和短分隔线。它们以 `design-system/formal-ending-ui-v1/*.svg` 为可编辑源，通过确定性脚本导出到 `cocos-project/assets/resources/formal-ending-ui-v1/`；源与运行时哈希由 `ASSET-HASHES.sha256` 锁定。当前状态为 `reviewed`：样式和源码接入已批准／验证，但尚无新 Cocos 合成截图或微信真机证据，因此不得写成运行时视觉 Gate `PASS`。这些 UI 资产不包含、也不升格当前可丢弃暖屋参考图的任何像素。

用户于 2026-08-26 批准 `FORMAL-SESSION-CONTROLS-V1-A` 后，新增 `UI-N01-SESSION-001` 时长选择双墨圈。它以 `design-system/formal-session-controls-v1/selection-ring.svg` 为可编辑源，由同目录确定性脚本导出透明 PNG；源与输出哈希由同目录 `ASSET-HASHES.sha256` 锁定。双墨圈只标识当前预选的 3/5/8 分钟，不发光、不脉冲、不表达奖励或推荐。该 UI 已进入微信开发版本 `0.4.4` 体验测试包；微信真机可见截图和正式生产资产升格仍未完成，因此不得写成正式运行时视觉 Gate `PASS`。

### 当前音频候选的验证边界

`AUD-N01-001` 是无采样、无第三方音频输入的 FFmpeg 数学合成候选。可重复生成命令、参数和机器验证结果保存在[音频生成与机器验证记录](../assets/final/audio/README.md)：24 秒 Ogg Vorbis、48 kHz 立体声，源文件与 Cocos 进包副本的 SHA-256 均为 `d2b5df60c879dd9b3c4be65132b17605820d312259dff2e98fcdc47ea7b14b30`。时长、编码、文件大小、响度、峰值、解码帧数和首尾采样差的机器验证已通过；耳机/微信真机/用户听感待验，因此不得将该素材提升为 `reviewed` 或 `approved`。

`AUD-OUTDOOR-001` 来源于 Freesound 的 `Grass Blowing in Wind — floft`，素材页标注 CC0 1.0。14 秒处理试听、来源预览哈希、处理参数与许可链接记录在 `/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/gate-c-audio-preview/README.md`。用户在听取该文件后明确反馈“没问题”，批准范围为 Gate C 户外环境风。当前 Cocos 接入文件为 `cocos-project/assets/resources/audio/outdoor-gate-c/night-breeze-loop-v1.ogg`，SHA-256 为 `d7a4d798def9f957e0dcb20ea4ea5aac74b034f9355703ce39bf58d6f2ac123f`；唯一当前候选 `gate-c-v7-20260824-41b0b7b1-wind-blite-audio-v1` 已由独立 QA 验证首触前静音、首触后约 0.35 秒渐入、静音恢复、浏览器模拟前后台与 26 秒单实例循环。微信真机生命周期及耳机/手机外放接缝复听仍需验证；音乐没有随环境风一起获批，旧 `audio-proof-v1`、Wind A 和越权 `showall-navy-r6-audio-wind` 均不能替代当前候选的整体 Gate 结论。

### FORMAL-ENDING-UI-V1-A 暖纸 UI 资产

`UI-N01-END-001` 到 `UI-N01-END-005` 是项目原创、AI 辅助整理的可编辑 SVG 暖纸资产，用于用户批准的 `FORMAL-ENDING-UI-V1-A` 本地 Cocos 收尾源码接入。源文件位于 `design-system/formal-ending-ui-v1/`，由 `generate-assets.mjs` 确定性导出到 `cocos-project/assets/resources/formal-ending-ui-v1/`，哈希由 `design-system/formal-ending-ui-v1/ASSET-HASHES.sha256` 锁定。本轮没有把设计板参考 PNG 或暖屋参考图副本切进 Cocos；运行时只消费暖纸、动作纸、别针和分隔线 PNG。该 UI 已通过 2026-08-25 在 `cocos-project` 目录执行 `npm run verify`，但 Cocos 运行时截图、微信真机和正式生产资产升格仍未完成。

### FORMAL-SESSION-CONTROLS-V1-A 双墨圈 UI 资产

`UI-N01-SESSION-001` 是用户批准的 A「右墙留时笺」所需工程化选择标记。可编辑源位于 `design-system/formal-session-controls-v1/selection-ring.svg`，由 `generate-assets.mjs` 确定性导出到 `cocos-project/assets/resources/formal-session-controls-v1/selection-ring.png`，哈希由同目录 `ASSET-HASHES.sha256` 锁定。运行时只实例化一张内含两条手绘墨线的 Sprite；它不改变暖屋底图、人物、猫、晚饭、光线、构图、材质或配色。它已随开发版本 `0.4.4` 上传供体验测试；正式运行时合成、微信真机和生产资产升格仍待后续验证。

## 1. 强制规则

- 每个进入体验版构建的素材必须在资产台账中有唯一 `asset_id`；无记录素材不进包。
- 最终角色、Logo、中文字形、功能图标、关键互动物不能直接使用生成图；必须有可编辑重建源文件与过程记录。AI 辅助代码直接构建矢量时，须如实记录为 `ai-assisted`，不得冒充人工重绘，并在入包前完成人工终审。
- 生成式工具默认只用于光色、房间构图和非核心材质探索。唯一当前正式候选例外是用户批准的 `FORMAL-PICTUREBOOK-FULLFRAME-V1-A`：该规格内逐页 Gate 的无字全幅 clean plate 可如实登记为 `ai-assisted-formal-fullframe`；角色单体、中文、Logo、功能图标、UI 与流星不在例外内。提示词仍不得出现现成 IP、在世艺术家或“仿某人风格”。
- 下载、素材站、开源、委托和生成式资产都必须保留当日许可条款或合同证据；只保留链接不足以证明授权。
- 字体记录必须区分：屏幕显示、嵌入包体、图像化字形、商业使用和修改子集的权利。
- 音频不使用来源不明的网络剪辑；需记录作曲、录音/采样、表演、后期和授权范围。
- 对外宣传或正式上线前，另行执行名称、图形和整体装潢的专业检索/审阅；项目内部盲测不是法律意见。

## 2. 台账字段模板

新资产从 `docs/templates/asset-register.csv` 复制字段，并写入项目实际台账。字段含义如下：

| 字段 | 必填 | 填写规则 |
|---|---|---|
| `asset_id` | 是 | 稳定且不复用，格式 `CAT-SCOPE-NNN`，如 `CHR-COMMON-001` |
| `display_name` | 是 | 人可读名称，不以文件名代替 |
| `category` | 是 | `character/scene/ui/font/audio/music/fx/share/other` |
| `night_scope` | 是 | `common/N01/N02/N03/N04/N05` 或逗号分隔的多值 |
| `final_path` | 是 | 工程内路径；未实装时填 `TBD` |
| `source_path` | 是 | 可编辑源文件或证据包路径 |
| `creator` | 是 | 作者/供应商代号；不在公开台账放个人敏感信息 |
| `created_on` | 是 | ISO 日期 `YYYY-MM-DD` |
| `source_kind` | 是 | `original/commissioned/licensed/open-source/ai-assisted` |
| `source_url_or_contract` | 是 | 网页、订单、发票或合同证据路径；纯原创填创作记录路径 |
| `license_snapshot` | 是 | 当日条款截图/PDF/文本路径 |
| `permitted_scope` | 是 | 明确商用、改编、嵌入、分发、地域、期限和是否需署名 |
| `attribution_text` | 是 | 需署名则填精确文案；不需要填 `none` |
| `third_party_inputs` | 是 | 所有外部参考/输入的 asset_id；没有填 `none` |
| `generator_record` | 是 | 非 AI 填 `none`；AI 辅助填工具、模型/版本、日期和任务记录路径 |
| `human_redraw` | 是 | 非 AI 填 `not-applicable`；AI 辅助填人工重建的结构、比例、线条、色彩和源文件 |
| `similarity_review` | 是 | 审核人代号、日期、结果和证据路径 |
| `sha256` | 是 | 最终进包文件哈希；制作中填 `pending` |
| `version` | 是 | 如 `v1.0.0`，替换资产时递增 |
| `gate_status` | 是 | `draft/reviewed/approved/rejected/retired` |
| `notes` | 否 | 限制、归属例外、替换原因 |

## 3. 单项资产证据包

每个 `asset_id` 的证据包应可以回答：谁做的、用了什么、可以怎样用、最后改了什么、实际进包的是哪一版。最小结构：

```text
evidence/<asset_id>/
  README.md                 # 资产摘要与决策
  source/                   # 可编辑源文件或交付物
  license/                  # 合同、发票、许可快照
  process/                  # 草图、版本、AI 任务记录、重绘说明
  review/                   # 相似性、品牌、音频循环等审核证据
  final/                    # 与台账 sha256 一致的最终导出
```

证据包可存在受控制作目录中，不必全部进 Git；但台账中的路径必须能被项目负责人找到，不能只指向某个人的临时聊天记录。

## 4. AI 辅助记录最小内容

```text
任务 ID：
工具：
模型/版本（如工具显示）：
生成日期：
用途：仅氛围 / 光色 / 构图 / 非核心材质探索
完整提示词保存路径：
输入图及权利：
生成结果保存路径：
采用的抽象元素：
主动丢弃的相似/高风险元素：
人工重建说明：
重建源文件：
复核人/日期：
```

对生成结果的“人工修了一下”不是合格记录；需要可核对地说明重建了哪些结构。

## 5. 审批流程

1. **Draft**：创作者建立 `asset_id` 并填完来源。
2. **Rights review**：制片检查授权范围和证据快照；不确定时资产不进包。
3. **Creative review**：角色/品牌资产执行相似性复核；音频执行来源与循环复核。
4. **Technical review**：检查尺寸、透明空边、压缩、图集/分包归属、命名与哈希。
5. **Approved**：台账写入最终 `sha256`，锁定版本后方可进入体验版构建。
6. **Replacement/retirement**：新版本用新哈希和版本号；旧记录标为 `retired`，不删除历史证据。

## 6. Gate C 最小资产盘点（当前户外样片）

- 人物与猫：人物身体/发梢/衣角、猫身体/耳/尾尖、各自冷边光和接触影；Gate C 可用样片层，Gate D 前必须正式重绘。
- 场景：天空底、烘焙银河星尘、8–10 主星、远/近云、山、小屋/稳定门光、远/近草、两朵花/光晕、前景遮挡。
- 动效标注：全部 Pivot、坐标、幅度、相位、9.6–10 秒导演表与 reduced-motion 中性静态态。
- 音频：首触前静音；首触后环境风与音乐候选分别登记。没有批准素材时不得用低质占位音冒充通过。
- 本 Gate 不要求室内水壶、分享或五夜 UI；它们属于后续正式实现。
