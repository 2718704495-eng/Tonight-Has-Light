# 当前合同速查

## 产品

- 目标用户：下班后疲惫、此刻不想再完成任务的人。
- 目标感受：凉快、舒服、可以先坐一会儿；不是兴奋、成就或被治愈。
- 单次时长：室内体验约 3–8 分钟；户外可以无限停留。
- 禁止：失败、评分、倒计时、签到、奖励、排行、广告、付费、医疗或助眠承诺。

## 2026-09-01 当前故事与玩法主线

- 用户原句：`批准 STORY-GAMEPLAY-REPLAN-V1-A-R1：文字入画与完整夜晚结构`。当前主线为 `STORY-GAMEPLAY-REPLAN-V1-A-R1 / 一盏灯接住一盏灯`，主题句是“天上的光会经过，家里的灯会等着”。批准记录为 `docs/STORY-GAMEPLAY-REPLAN-V1-A-R1-APPROVAL.md`，当前状态同步 SHA-256 `df215e7a452ab3a211cffcdd38e1412c8b6079854c3f06bcc9f0264a9b107c72`；唯一当前 Gate B 生产计划为 `docs/superpowers/plans/2026-09-01-story-gameplay-replan-v1-a-gate-b.md`，SHA-256 `937cf1e8b4e896b12dda06309c87608cda03a32dc55939384b32d901574f2f9c`。新任务最短入口为 `docs/HANDOFF-2026-09-01-STORY-R2.md`。
- 正式合同为 16 个状态：Root 夜风草坡→风留下痕迹／抬头→眼睛适应→云遮星→陪云走→星回来→星空大全景→一次流星→流星后选择→门光匹配切→明亮归家→厨房先回应→做饭端菜→饭桌吃／温水→留灯收束。获批 R1 历史样片合并展示 14 节点；独立 R2 现已补齐 F2 `EYES_ADJUST` 与独立 `KITCHEN_CALL`，并把合法单颗流星防重播、猫／外衣／饭菜等后果回声和完整结束／返回接入同一共享状态机。R2 目录为 `design-board/story-gameplay-replan-v1-a-r2/`，12 项包清单自身 SHA-256 `09594ad120ff052086aecf18da2ab9c6e4543752bac723e02e838e99e03c6dd1`，17/17 自动验证通过，状态为 `READY FOR FINAL HUMAN REVIEW / PROTOTYPE-ONLY`，不是正式资产或运行时实现。
- 每个有效节点必须具备“前置状态→事件或玩家动作→世界／角色回应→后续仍可见的结果”。风留下的花瓣／草籽、流星观看位置、外衣、饭菜、杯子、猫的回应和留灯选择必须进入后续画面；连续点击只换图不再算玩法。
- 文字必须进入手机画面：户外使用深蓝墨片、室内使用浅暖纸，每幕只保留低权重地点／时刻、短标题和两到三行情境旁白；事件发生后改写正文，不显示页码、任务、成功、奖励、连续天数、倒计时或完成率。
- 直接回家与先看星空都能完成本晚；直接回家时，同一颗流星在 H5 窗边补足。草坡、流星后与暖家收束都可无限停留。
- `0.4.8` 只保留为“短、选择无后果、故事感不足”的历史诊断与上传事实；不得继续补丁、加循环或把它当成当前产品方向。
- 浏览器 R1/R2 的 CSS 草、云、暖光、蒸汽、拖放、流星探索层与临时声音均是 `prototype-only`。R2 用户可见复核通过后，下一生产停止线才是高风险真 Alpha 探针，以及云／星／猫、手绘流星＋反光、暖屋生活状态三组正式素材探针。未逐项获同一文件／哈希批准前，不得进入 Cocos、构建或微信。用户本轮只例外授权一次本地 Git 检查点；远程 push 仍未授权。

## 第一场景

- 当前入口：自然星空下的夜风草坡。
- 角色：性别表达克制的卡通成年人背影＋普通家猫，背面或四分之三背面，肩并肩共同仰望。
- 小屋：右侧中景，暖门从第一秒可点；它是完整夜晚的“直接回家”路线入口，不是任务关卡或跳过故事的捷径，约 1.5 秒后才出现低权重画中邀请。
- 夜空：普通深蓝星空占主体，一条宽而淡、带暗纹和断口的自然银河；无发光丝带、无连线，8–10 颗主星。除 `STARGAZE-SKY-FINALE-V1-A` 在“看星空” F5 上一次、恰好一颗的独立流星收束外，禁止额外流星、循环或流星雨。
- 地面：两朵微光小花；风从远草到近草，再传到人物发梢/衣角和猫耳/尾尖。
- 当前提示：无标题、任务、进度或选关菜单；场景稳定约 1.5 秒后，在天空、草尖／花、暖门对应位置显示 `看看星空`、`吹吹风`、`回家`。这替代“前 20 秒完全无操作提示”，零操作仍可无限停留。
- 当前互动：点天空、草尖／两朵弱光小花附近、暖门分别进入看星空、让风经过、直接回家；之后使用观察、按住、慢滑、拖放、轻触等价和生活选择组成完整夜晚，不允许连续点击任意位置只换图。无奖励与进度。
- 声音：首次触碰前视觉风；首次触碰后环境风先响应。音乐只有另行获批后才可在 2–3 秒渐入；静音时全部因果仍可理解。

### 2026-08-29 根页风托衣角合同

- 用户批准 `ROOT-WIND-HEM-V1-A｜风托起衣角`。根页采用天空约 `72%–78%` 的天空主导构图；角色、小屋与草坡作为下方安静锚点。
- 成年人的宽松针织上衣下摆由画面左→右的夜风托起，形成在 `195×422` 仍可辨认的宽缓弧形；肩背、腰胯、坐骨和屈膝保持有重量，禁止整个人漂浮、披风化、速度线或镜头震动。
- 草带、衣角、少量发梢、猫耳和尾尖同向但不同重量；B 夜漫画、普通家猫、右侧暖门、恰好两朵弱光花和一条宽淡断口银河保持不变。
- 旧 R1、旧 Batch 1、R2 与 R3 保留为不可修改历史证据；星空 F5 不重做。用户于 2026-08-30 明确指出旧暖家 F5“房间视角太少”，批准 `HOME-F5-WIDE-ROOM-V1-A` 在原额度外重新构图一次，并已对同一 R1 文件批准 `暖家全景视觉通过`。批准的 390×844 SHA-256 为 `569a7b9b71d16d13ad311bdea9a29d6bc93a7dc68c99892faf8c416f38bc1c51`；它是当前暖家 F5 视觉基线，可同步进设计资产包，但尚未授权 Cocos 或运行时。R3 未获得用户视觉通过，不得交给运行时；R2 仅作为 R4 的冻结底图。
- 本批准不授权 Cocos、构建、微信、上传、提审、发布或 Git。
- R2 经全新零写入独立视觉复核判定 `P1 / BLOCKED`：衣角最显眼处向画面左侧展开，与本节左→右风向冲突；R2 现为冻结历史，不得写成视觉 PASS 或交给运行时。
- 2026-08-30 用户已批准 `ROOT-WIND-HEM-V1-A-R3｜只修衣角方向`。R3 已按 R2 母版执行唯一一次定点修图，但负责人复核为 `FAIL / BLOCKED`：衣角仍向画面左侧展开，`195×422` 不可稳定读出右向风，且人物、猫和天空出现超出“只修衣角方向”的可见漂移；全新 visual-only 独立复核在明确零写入下同样返回 `BLOCKED / P1`。按合同停止，不得静默追加变体；R3 不授权 Cocos、构建、微信或 Git。下一步需用户裁决接受现有左向衣角，或批准新的 R4 人工局部重绘路线。
- 2026-08-30 用户先批准 `ROOT-WIND-HEM-V1-A-R4｜人工局部重绘衣角，不再整体重生成`，随后对展示的同一文件回复 `批准 ROOT-WIND-HEM-V1-A-R4：根页视觉通过`。唯一根页视觉基线目录为 `design-system/formal-picturebook-fullframe-v1-a-root-r4-manual-hem/`；批准 master SHA-256 `41599f03a0a7a71acd953b46066c3205b4da1522d0a06bd86b73186afedccdc8`，批准 `390x844` SHA-256 `23443918a0c892d569a6fd49b55b889d70bb4ed0dc7a6396a0af2bf5fad2306a`，批准时 29 项清单 SHA-256 `888ee916f58c1f55a5986afa040be5564e38800dea023f02fb812962167b2c42`，批准状态同步后 30 项清单 SHA-256 `7ba90c894a97daaefda0463548ad26cc82a3605a6135a9d3535b306ad0a83f5f`。R2 master 是唯一图像来源，只在衣角与紧邻草尖 ROI 内使用同图草纹理修复、可编辑蒙版提取的 R2 针织纹理、局部翻转／缩放／抬升和 SVG 破碎轮廓；无 ImageGen／整图重生成，ROI 外逐像素零差异。人物身体、猫、天空、银河、山、小屋、门、两花、构图、材质、配色、光线和镜头冻结；旧 `manual-hem-right` 排除。状态为 `ROOT PAGE GATE B PASS / NOT IN BUILD`；整套绘本 Gate B 仍未完成，本批准不授权 Cocos、构建、微信、提审、发布或 Git。

### 2026-08-29 三路互动绘本当前合同

- 2026-08-31 用户批准 `STARGAZE-F5-FORMAL-V1-A` 正式同文件：390×844 SHA-256 `ad3a13c6a4d915f178d03d444874776e2df042f328f998de81a2bfbf0d774d8d`，master SHA-256 `d36b99ebfe0805233000df9c0cbf2bc6217691111a7da7fa8e2dbe2eb99e4a85`。F5 不得重新生成、重画、调色或烘焙流星／中文。
- `STARGAZE-FORMAL-BATCH-V1-A` 已按 F1→F2→F3→F4 串行完成，F1 `抬头`、F2 `银河深处`、F3 `薄云经过`、F4 `云缝重开` 与单独批准的正式 F5 均获同一文件视觉批准并冻结。F1 R1 390×844 SHA-256 `6b2450a1993742545b83958d4f17913fda63a512071f42fa0a148feb4856c26e`、master `a51280508e89f4ce0cbbee27ce75e5548301a9bde37972395edaec81c3296dbf`；F2 R1 390×844 `98e267506a5485a93fdefa9759611c0ac4de2120edd5dc61d253a9ff59deee52`、master `2c8326bae7dbd85384583864e5689bf719d84d3dfdca998711ee681eff0a2d63`、批准前清单 `6639f380d2cbc408b64a1cfac6631ff74c6ebaeb5d91862aa4301d2b2cfb5e47`；F3 R2 390×844 `ae9cc70c56be5b8f83e985058d7ab40bc71a0aa0f5f32819bb2706f0111244ec`、master `d2561098ca35f15b02adb7a74bc7cc61778bbfb789552f57a27dc58685b57745`、批准前清单 `0466cb82c55385dddd058cae3f780d472c9df6f66c02b213706cee04f7750bc1`；F4 R1 390×844 `0973fec9fc18cfdb7422dcef32941a1fb071f84c95154cb10fd1d5279bda1ae9`、master `7a1d0cac3e0b6a27dd7629213fbf58547b9f3f378348308f87f1bda8fa642fd0`、批准前 89 项包清单快照 `abc92a43429d03d58be0e9c22ef09c0f68d955c30681cef7fc3ce1b89ad5b111`。F4 使用一次初始生成、零次修复，审查为 `P0=0 / P1=0 / P2=0 / writeOperations=0`；批准记录为 `docs/STARGAZE-F4-FORMAL-V1-A-R1-APPROVAL.md`。星空五幅视觉子包状态为 `GATE B VISUAL SUBPACKAGE PASS / NOT IN BUILD`；不授权 Cocos、build、WeChat、Git 或远端写入。
- F1 必须是根页 R4 与 F5 之间的镜头桥接：24mm 低机位仰拍，天空约 `85%`，人物左／普通家猫右的完整坐姿可读；比根页更仰望、比 F5 更有地面与人物存在感，天空始终是第一视觉层级。不烘焙中文、UI、流星或热区。
- F1 生成任务的原始角色分派为只读提示词审查，但该任务越界生成并自评。其生成图、提示词、raw 与导出因可追溯而保留；该任务写入的 owner review 证据无效，不得作为独立 PASS。主任务已完成同一文件重审，全新审查者已以 `writeOperations=0` 完成独立复核；有效证据为包内 `reviews/ROOT-OWNER-VISUAL-REVIEW.md` 与 `reviews/INDEPENDENT-VISUAL-REVIEW.md`。

- 用户先判定 `0.4.7` 自动三拍“现在还是没故事感”，随后批准 `OUTDOOR-PICTUREBOOK-BRANCH-V1-A`、`STARGAZE-SKY-FOCUS-V1-A` 与 `STARGAZE-SKY-FINALE-V1-A`。浏览器候选 `STARGAZE-SKY-FINALE-V1-A-GATE-B-R2` 只修复矮视口把完整舞台裁出可视区的问题，画内样式未变；用户已在同一 R2 网页上回复“没问题”。用户又批准 R1 单帧视觉、全幅正式插画页路线及其详细规格，并要求开始 Batch 1。Batch 1 根页现使用已批准 `ROOT-WIND-HEM-V1-A-R4` 的逐字节一致导出，星空 F5 保持不变。旧暖家 F5 因“房间视角太少”被用户否决为当前视觉方向；用户批准并最终通过 `HOME-F5-WIDE-ROOM-V1-A-R1` 32–35mm 整屋重构。批准基线目录为 `design-system/formal-picturebook-fullframe-v1-a-home-f5-wide-room-v1-a-r1/`，390×844 SHA-256 `569a7b9b71d16d13ad311bdea9a29d6bc93a7dc68c99892faf8c416f38bc1c51`；全新零写入独立审查为 `P0=0 / P1=0 / P2=1`，P2 只要求后续不得把底部门槛与地板继续压暗。当前总状态为 `GATE A PASS / WRITTEN SPEC USER APPROVED / HOME-MEAL GATE B VISUAL PASS / ROOT R4 USER VISUAL PASS / HOME F5 WIDE-ROOM R1 USER VISUAL PASS / STARGAZE F1-F5 USER VISUAL PASS-FROZEN / STARGAZE GATE B VISUAL SUBPACKAGE PASS / PROJECT GATE B REMAINING FORMAL PAGES BLOCKED / NO COCOS / NO BUILD / NO WECHAT / NO GIT / NO REMOTE WRITE`。
- 分支固定为：天空＋`看看星空`→看星空五幅→F5 单颗流星收束→`回家` 进既有回家支线第 1 幅／`再坐一会儿` 回草坡；草尖／花＋`吹吹风`→吹吹风→逐页点击→回草坡；暖门＋`回家`→回家→逐页点击→`FORMAL-UI-V1.2-A` 明亮暖家。
- 回家支线必须先讲完逐页回家故事，不能把门恢复为一次普通跳转。户外支线不写入室内五夜完成或解锁进度。

### 2026-08-30 H1 用户视觉批准

### 2026-08-31 H2/H3 用户视觉批准

- 用户原句：`批准 HOME-H2-HANG-OUTERWEAR-V1-A-R1 与 HOME-H3-SERVE-HOT-DISH-V1-A-R1：H2/H3 单帧视觉通过`。
- H2 `home-meal-h2-hang-outerwear-v1-a-r1` 与 H3 `home-meal-h3-serve-hot-dish-v1-a-r1` 均锁定为 `USER VISUAL PASS / FROZEN`；批准记录为 `docs/HOME-H2-H3-VISUAL-APPROVAL-20260831.md`。
- H2 390×844 SHA-256 `ef11fcb38d1e515cb2f8702d7b4ea8734f0f92ac08f24c8e2a18bfad97ccc6dd`，预批准清单自身 SHA-256 `9b5b908aa26561ce51bacae789b971c4b604502f60736cad8976cf6c6cc36f1e`；H3 390×844 SHA-256 `c582fa5e9ad5c0f465e307472ccfc6791ed78b2d1e81663669df9151819aab72`，预批准清单自身 SHA-256 `91d967150073566f1d9c34302bb3197a26fdf4ac2d45201a0fa13a9303eeb4ec`。
- 本决定仅解锁 H4 本地 Gate B 生产；不授权 Cocos、build、WeChat、Git 或 remote write。
- 用户原句 `批准 HOME-H4-TABLE-RITUAL-V1-A-R2：H4 饭桌互动视觉通过`。H4 `home-meal-h4-table-ritual-v1-a-r2` clean plate、可编辑 `ate/sipped` 反馈层、四状态与安静中文 UI 均锁定为 `USER VISUAL PASS / FROZEN`，最终 `P0/P1/P2=0/0/0`。clean plate SHA-256 `bbb02106fb4f5a820d1199eb61c7b10b5065028461bfdd6bf813276abe796533`；最终 `ate=0a356ea97cc91afecc93c8c9a607583d63a40db0a6e0226ec224be4a47a450b5`、`sipped=710a4b4f54641e0880639147807120594b7e43302e74ce5d97c4784614cf841e`、`both=69a9ab2b2982cd83beec6430c9684940f2b9924c5a15beb29615eeaaf722a530`；四态 UI 板 SHA-256 `2bf247ef9f877f7048669dbab1d350073aaf4b2ca967f452b71875f4f1b67158`。批准前清单 SHA-256 `e38d96750c277145285f2e20d3bc52df57728e847a85a447ac02d7704a6f47b0`；批准记录 `docs/HOME-H4-TABLE-RITUAL-V1-A-R2-APPROVAL.md` SHA-256 `9337f3315a8c623597aa29da7f8edbdb3540b89bd72dd29767145663cc846579`。本批准使 `HOME-MEAL-RITUAL-V1-A` 五镜视觉子包通过；后续 Cocos/build/WeChat/Git/remote write 均继续 `BLOCKED`。

- 用户原句：`批准 HOME-H1-ARRIVAL-V1-A-R2：H1 单帧视觉通过`。批准候选为 `home-meal-h1-arrival-v1-a-r2`，390×844 SHA-256 `b68c2dfd7bcf40a9d3bd77320faecdbeff517e2b2f7f160abbf4a7d4c6a836fe`；批准前清单自身 SHA-256 `efdedf0f7cb9da15ca492b24a4d5e631dfe642b5733a379d7902fba052cbdcf4`；批准记录 SHA-256 `b3f6baca9190fa278e680613b58c37f25aac017f62e72ee54f3f104878fac4f6`。
- H1 状态锁定为 `USER VISUAL PASS/FROZEN`。H2 `home-meal-h2-hang-outerwear-v1-a-r1` 已完成负责人及独立零写入视觉审查，双方均 `P0=0 / P1=0 / P2=0`，独立审查 `writeOperations=0`；390×844 SHA-256 `ef11fcb38d1e515cb2f8702d7b4ea8734f0f92ac08f24c8e2a18bfad97ccc6dd`，195×422 SHA-256 `8419a54d7aea95c00eb638299f4f3a0faec8e41c0a259fce190336b878bf7593`，预批准清单自身 SHA-256 `9b5b908aa26561ce51bacae789b971c4b604502f60736cad8976cf6c6cc36f1e`。最左深色区判定为 H1 继承的夜间门洞，不是室内黑角。H2 现为 `USER VISUAL PASS / FROZEN`。
- H3 `home-meal-h3-serve-hot-dish-v1-a-r1` 已完成负责人及独立零写入视觉审查，双方均 `P0=0 / P1=0 / P2=0`，独立审查 `writeOperations=0`；390×844 SHA-256 `c582fa5e9ad5c0f465e307472ccfc6791ed78b2d1e81663669df9151819aab72`，195×422 SHA-256 `ce8e04691102079b2cea11b02c4e51cf52a752c3902433a07dd0481b0822b4c2`，独立审查 SHA-256 `45b8140ec89f4cd84ad3a97ce6d669016b18f331c2807abdfa5af8647c1b6f6e`，预批准清单自身 SHA-256 `91d967150073566f1d9c34302bb3197a26fdf4ac2d45201a0fa13a9303eeb4ec`。独立审查确认相连厨房、盛菜动作、H3→H5 浅圆盘菜品连续、猫远离热源、明亮暖家、430 压力态安全边 `#06265F`，且无 H4 伪图。H2/H3/H4 现均为 `USER VISUAL PASS / FROZEN`；HOME-MEAL 五镜视觉子包通过，项目 Gate B 其他正式页、Cocos、build、WeChat、Git、远端写入继续 `BLOCKED`。
- 场景稳定约 `1.5s` 后才显示三条“画中邀请”；文字自然落在对应画中位置，不做卡片、边框、HUD、工具栏或选关菜单。提示不闪烁、不脉冲、不催促。
- 触碰人物或其他空白处时，底部只低权重提示一次：`天空、草尖和亮着的门，都可以轻轻碰一碰。`
- 三个实际触控区均不得小于 `44×44px`，相邻边缘至少 `8px`；暖门与天空范围重叠时门优先。减少动态时提示只允许不超过 `200ms` 的透明度显现；120% 大字不 `SHRINK`，静音仍可理解全部分支因果。
- `0.4.7` 的 `B01→B02→B03` 自动播放、旧“点花／天空只做一次局部反馈、慢滑生风、点门立即进屋”和“前 20 秒完全无提示”均被替代。`0.4.7` 当前状态是 `STORY-FEEL USER FAIL / HISTORICAL EXPERIENCE EVIDENCE / SUPERSEDED FOR CURRENT DIRECTION`；其上传、构建和测试不能证明新分支已设计或实现。
- Gate B 可见候选 `STARGAZE-SKY-FINALE-V1-A-GATE-B-R2` 已由用户确认；流星收尾、完整背景、固定文案、双出口和减动的可见子项为 `PASS`。历史探索图仍不是正式资产；后续正式全幅页必须逐张可追溯、逐张批准，正式资产批准前不得交给 Cocos 或微信构建。
- 当前可点击设计板位于 `design-board/outdoor-picturebook-branch-v1/`，三条支线各五幅、每次点击只翻一幅，分支页按等比 `cover` 铺满。“吹吹风”和“回家”仍是 Gate B 探索输入；“看星空”已切到 r3 并实现 F5 一次性流星收束和双出口。用户批准时的 31 项清单已冻结为 `approvals/HASHES.pre-approval.sha256`，该清单自身 SHA-256 为 `cb5aa845eb1e6fdd0bacd6891c0f408c4b130d16b08f58735725a233e6cdc9a0`；状态同步后当前 32 项清单自身 SHA-256 为 `a77ffb02c2c919516266f5ee58ed24c4fe6f3758a3a2c090d897422e58f8d9b8`。R1 的 `2f8a2306…cc5cd` 只代表已被完整舞台展示修复替代的旧布局。
- 批准记录：`docs/OUTDOOR-PICTUREBOOK-BRANCH-V1-A-APPROVAL.md`；Gate A 批准时 SHA-256 `69bc0671337bf609da657b90a0a362fcc3b0d89d79f52ea128332f7c03e135a0`，状态同步后当前文件 SHA-256 `1be0ea9b50ff3bec51e7683d49c69855fe0a4583084ea9b4fd46871c4b5ee712`。
- 历史 `FORMAL-OUTDOOR-ART-PILOT-V1-B` 的 R1 母版 SHA-256 为 `5c84ce815ba011cd9be570889c768573e80c3d55d6b59fb2bd211301f86c74e3`，候选清单自身 SHA-256 为 `500d4b07e2978318f3e59118cd1a8ad497ceed94289ed2e068b3a4539a43d22b`，14/14 复算通过。其首个 `10_adult_body` 探针返回 `hasAlpha=false` 的 RGB 棋盘格，因此 20 层方案永久停止；禁止自动抠图、色键、隐藏 flatten 或空层兜底。用户现已明确批准同一 R1 单帧视觉、`FORMAL-PICTUREBOOK-FULLFRAME-V1-A` 详细规格和 Batch 1：每页一张正式全幅 clean plate，中文／热区／选择与 F5 单颗流星独立。全幅页可以是 RGB 或全不透明 RGBA，只有透明流星位图层必须验证真 Alpha。批准输入规格 SHA-256 `69db50589d6658e9397f27013e658430d6457aec1c1cea316fd7915f59c11663`；`STARGAZE-FORMAL-BATCH-V1-A` F1/F2/F3/F4 与正式 F5 均已用户同一文件批准并冻结，星空视觉子包为 `GATE B VISUAL SUBPACKAGE PASS / NOT IN BUILD`。未批准 Cocos、构建、微信或 Git。

### 2026-08-29 “看星空”当前合同

- `STARGAZE-SKY-FOCUS-V1-A`：F1“抬头”与 F5“世界很大”天空约占 85%，人物／猫仅作底部小比例尺度与陪伴锚点；F2“银河深处”、F3“薄云经过”、F4“云缝重开”是星空细节特写，细画单条宽淡断口银河、尘埃暗裂、星尘疏密、深蓝留白和同一主星的遮露。旧 r2 的人物／猫反应主导构图被替代。
- `STARGAZE-SKY-FINALE-V1-A`：F5 保持无流星、无文字 clean plate；到达 F5 后仅播一次 `0.9s` 静置 → `0.8s` 单颗流星从右上向人物猫上方划过 → `0.45s` 尾迹淡去 → `1s` 静置 → `180ms` 文案显现。
- 固定文案：`一颗流星，刚刚从夜里经过。` 与 `回家，还是再坐一会儿？`。`回家` 进入 `scene_01_home` 第 1 幅，不直进室内；`再坐一会儿` 回 `root_night_slope_v1`，不记完成或奖励。
- 减动时 transform／位移为 0；只用一道静态流星痕做 `≤180ms` 交叉淡化，随后保留 `1s` 静置与 `180ms` 文案显现。
- 批准记录：`docs/STARGAZE-SKY-FOCUS-V1-A-APPROVAL.md` 与 `docs/STARGAZE-SKY-FINALE-V1-A-APPROVAL.md`；当前收尾批准记录 SHA-256 `d8871ff88147f307ea33d9ceeabe607f2bbebce0b24d07513fc2b9a73b8d0d8e`。R2 可见候选已批准，但正式分层资产、Cocos、构建、微信或 Git 没有因此获得授权。

### 2026-08-28 故事化视觉改版停止线（历史）

- 用户已判定 `OUTDOOR-ILLUSTRATION-WIND-V1-A-R2` 的换图观感仍差、变化节奏太慢且缺少故事感；R2 与远端开发版 `0.4.6` 只保留为历史体验证据，不再是下一候选的视觉基线。
- 新方向允许比较“插画叙事”和“漫画分镜”等更大画面变化，但人物＋普通猫、夜风草坡、自然深蓝星空、右侧暖屋、无任务压力，以及室内 `FORMAL-UI-V1.2-A` 明亮暖家情绪继续有效。
- 用户于 2026-08-28 明确选择 B 方向参考图，版本登记为 `STORY-ILLUSTRATION-REDESIGN-V1-B / 无字夜漫画·同一阵风`。当前只锁定户外视觉语言：深靛有限色、大块明暗、干笔墨线、克制网点与一屏一拍的无字叙事；参考图 SHA-256 为 `fdac7f8edf8a22954a93a3f756ab2c1699c1afe04462bf2fa3ed679ae2794d0c`。它不是正式入包资产，也不批准 Cocos 改造、构建或上传。
- 用户在查看 B 三帧确认板后回复“没问题”，`STORY-ILLUSTRATION-REDESIGN-V1-B-KF-R1` 的“坐稳→风经过→余风细节”、镜头差异和转场方向已获批准。批准身份为 `design-board/story-illustration-redesign-v1-b/approvals/HASHES.pre-approval.sha256`，其 SHA-256 为 `e6441eca8a901458fcd3ed40a03590c70403d073cdf4f8d1140d5887906add52`。
- 两轮代码绘制 SVG 正式稿因人物／猫解剖、草坡、银河与漫画质感未达到批准图，已由负责人标记 `FAIL / SUPERSEDED / DO NOT REVIEW / DO NOT COCOS`。不得为了可编辑性降低视觉标准；正式分层资产继续 `BLOCKED`。
- 本地浏览器可丢弃样片 `story-illustration-v1-b-motion-preview-local-r1` 使用 KF-R1 三张探索图，验证 `B01 3200ms → 300ms 草线墨带 → B02 1500ms → 360ms 草带 → B03 无限停留`、门中断和减动。用户随后在阅读完整中文临时手机方案后回复“没问题，继续”，主任务将其冻结为精确例外：同三张探索图可进入独立 Cocos 临时分包，并上传一次微信开发版 `0.4.7`。唯一候选 `gate-d-story-b-kf-r1-temp-dev-r1-0.4.7` 已于 2026-08-29 用最终修正版上传，存档前缀 `phone-preview-story-b-kf-r1-temp-r1-0.4.7:`。最终安全边保持已批准 `#06265F`；中间 `#020B13` 漂移已关闭。用户最新故事感反馈已把该候选降为 `FAIL / HISTORICAL EXPERIENCE EVIDENCE`，不再要求将它设为当前体验版复测目标。该例外不把探索图升格为正式资产，不授权提审、发布、Git 或后续版本复用。证明、授权与最终证据见 `docs/STORY-ILLUSTRATION-REDESIGN-V1-B-LOCAL-MOTION-PROOF.md`、`docs/STORY-ILLUSTRATION-B-KF-R1-TEMP-PHONE-EXCEPTION-PROPOSAL.md` 和 `docs/STORY-B-KF-R1-TEMP-PHONE-0.4.7-FINAL-EVIDENCE.md`。
- 一次只读审查任务越权生成并切换了 `B-PROTOTYPE-R2` 三张未批准探索图。负责人发现后已恢复 KF-R1；R2 仅隔离保存在 `design-board/story-illustration-redesign-v1-b/exploration-r2/`，状态为 `UNAPPROVED / BLOCKED / NOT CURRENT PREVIEW / DO NOT COCOS`，不得在用户批准前展示或消费。

## 室内与进度

- 用户主动点击暖门后先进入“回家”绘本支线；完成逐页回家故事后，才进入室内第一夜“水快开了”。
- 用户已明确批准 `HOME-MEAL-RITUAL-V1-A` 五幅生活叙事：H1 门内归家全景，H2 拉近并把无标识灰蓝外搭放到批准 H5 左墙挂钩，H3 去相连厨房完成一份简单热食并保留主屋空间锚点，H4 在饭桌近景可选 `吃一点`／`喝口温水`，H5 回到逐字节一致的 `HOME-F5-WIDE-ROOM-V1-A-R1` 全景饭桌。Gate A 为 `PASS`；中文书面规格已获用户确认。唯一当前 Gate B 生产计划为 `docs/superpowers/plans/2026-08-30-home-meal-ritual-gate-b.md`，SHA-256 `98d265d554121f2ee0119752e85dc52cfab8f5e42a87605f20f43092dfbb646a`。H1/H2/H3/H4 均已获得用户视觉批准并冻结，H5 为批准哈希引用，因此 `HOME-MEAL-RITUAL-V1-A` 五镜视觉子包为 `GATE B VISUAL PASS`；批准记录分别见 `docs/HOME-H1-ARRIVAL-V1-A-R2-APPROVAL.md`、`docs/HOME-H2-H3-VISUAL-APPROVAL-20260831.md` 与 `docs/HOME-H4-TABLE-RITUAL-V1-A-R2-APPROVAL.md`。项目整体 Gate B 的其他正式页、Cocos、build、WeChat、Git、远端写入继续 `BLOCKED`。两个只读审查任务越权写出的 `gate-b-production.md` 已封存为 `SUPERSEDED / DO NOT EXECUTE`，不得作为审查证据或生产入口。
- 放下外衣与做饭是叙事镜头，不是待办、正确操作或完成条件；饭桌上的吃饭／温水可成为低压力互动，但不得出现步骤、评分、奖励、疗效暗示或“完成后才配休息”。
- 户外互动不写入五夜完成或解锁进度。
- 室内五夜内容继续有效，但旧“打开即进屋”的入口规则已被替代。
- 当前室内情绪原则：户外是安静、清凉、舒心；室内是明亮、温暖、暖心。房间应像深夜回家时灯一直亮着，餐桌、壶杯和家的秩序已经在等待；人物完成一份简单热食后回到饭桌。墙面、天花、地板、家具、人物和猫都处在可读暖光里，角落不能黑。
- 明亮感来自广域均匀暖光、墙顶地反射和生活细节，不来自纯白灼点、Bloom、整屏橙滤镜、奖励式闪光或保留暗沉黑角。用户提到的生日惊喜是“灯亮起来打败黑暗”的情绪参考，第一版不默认加入群像、派对、彩带或具体关系。
- 用户已于 2026-08-24 明确批准 `FORMAL-UI-V1.2-A / 灯一直为你亮着` 进入可编辑正式母版阶段；室内从开门第一帧就是稳定明亮的暖家，不播放黑房亮灯表演。批准记录见 `docs/FORMAL-UI-V1-2-A-APPROVAL.md`，用户参考图 SHA-256 为 `ad65d6fa811487fe5bd69726f1c5bf9d4b4c983d517c360b7087ff42f89cb36a`。B“进门后整屋亮起”未获批准，不得进入当前母版、动效或构建。原“拖一小团暖光到壶边”与整屋已亮存在因果冲突，继续标记为 `DRIFT / BLOCKED`，不得直接作为正式室内核心互动接入。
- 用户已于 2026-08-26 批准 `FORMAL-SESSION-CONTROLS-V1-A / 右墙留时笺`，并指定 120% 大字使用“桌边暖纸”；批准记录见 `docs/FORMAL-SESSION-CONTROLS-V1-A-APPROVAL.md`。本地 Cocos 源码已接入并通过 `115/115`；用户随后明确授权上传代码，唯一 r4 候选已上传为微信开发版本 `0.4.4`，但体验版设置、微信真机可见确认和正式 runtime Gate 仍为 `PENDING/BLOCKED`。进屋后暖屋先完整显示约 `650ms`，留时笺再以约 `170ms` 透明度显现；提供 `3/5/8` 分钟，默认选中 `5`，但必须由用户明确确认后才开始 NightSession，不显示倒计时，可低权重返回夜风。
- 确认后只保留 `48×44px` 的“停一停”纸签；设置含声音、减少动态和大字，展开期间拦截壶杯等房间热区；核心完成后增加“看看今晚的留笺”，打开已批准 `FORMAL-ENDING-UI-V1-A` 而不直接完成今晚。减少动态时 transform 为 `0`，120% 大字不 SHRINK。A 已完成本地 Cocos 源码接线并通过 `115/115` 自动测试，并随用户授权的唯一 r4 候选进入微信开发版本 `0.4.4`。B/C 样式、体验版设置、提审、公开发布和 Git 操作均未获授权；Cocos runtime 合成截图与微信真机继续 `BLOCKED`。

## 室内可丢弃互动样片

- 用户已于 2026-08-24 批准 `INDOOR-N01-PROTOTYPE-V1 / 壶盖轻响`；原批准只允许本地浏览器可丢弃样片。用户随后要求发布一版手机游玩测试，因此最新范围追加了下一节所述的 V4 单一开发预览例外。合同见 `docs/INDOOR-N01-PROTOTYPE-V1.md`；本地浏览器机器检查 `PASS`。用户于 2026-08-25 确认暖屋整体“设计感可以”，视觉设计感子项 `PASS`；微信真机轻响音量和杯子小剧场节奏仍为 `BLOCKED`。
- 样片首帧必须仍是整屋明亮暖家。轻触壶／壶盖／蒸汽宽松区后，蒸汽由一缕变三缕，壶盖轻回应并在约 `600ms` 内完成；`10s` 无操作只显示“壶里的水，正轻轻响着。”，不自动完成。
- 核心完成后播放杯子小剧场：人物拿起倒扣备用杯，猫闻一下再轻碰；用户可点杯子提前继续，`4s` 无操作则人物自然翻正，最后显示“水热了。你也先缓一会儿。”
- 减动时壶盖、杯子、人物和猫的 transform 动画全部为 `0`，只用不超过 `200ms` 的静态状态交叉淡化；静音时仍能理解全部因果。
- 除下一节 V4 一次性开发版本／体验版测试例外外，参考 PNG、样片叠层、临时声音与样片逻辑禁止进入其他 Cocos／微信包、远程部署或发布产物。正式母版、正式玩法、音乐、室内环境音、正式触碰音效、审核和线上发布均没有因此获批。

## 2026-08-25 手机开发版与体验版临时例外

- 首轮候选 `gate-d-mainflow-v4-phone-preview-dev` 已因独立 QA 发现 P1 而作废；`gate-d-mainflow-v4-phone-preview-dev-r2` 已完成本地回归、独立复核（`P0=0 / P1=0 / P2=0`）并按授权上传为开发版本 `0.4.2`，随后由用户设为体验版。用户真机反馈“只能看到户外场景”后，源码完成门触控兜底、统一室内时长检查、收尾／分享／失败恢复／返回户外动作链，并接入获批 `FORMAL-ENDING-UI-V1-A`。
- 用户随后明确要求“不玩试玩的版本，直接上传，然后我设为体验版”。这条最新决定把同一 r2 构建的允许范围扩展到一次微信 `upload`、开发版本 `0.4.2`，以及由用户亲自在后台设置的对应体验版；此前“禁止 upload／体验版”的限制已被替代。
- 用户又明确授权门入口修复版使用同一临时暖屋素材构建并上传微信开发版本 `0.4.3`，不提审、不发布；批准 `FORMAL-ENDING-UI-V1-A` 后要求“继续完成线上”。主任务已说明将其执行为生成并上传 `0.4.3` 供用户自行设体验版，用户未反对。当前唯一候选是 `gate-d-mainflow-v4-phone-preview-dev-r3`，Web 诊断候选是 `gate-d-mainflow-v4-phone-preview-web-r3`；本地 build/Web QA 为 `PASS`，远端微信开发版本 `0.4.3` 已上传成功，用户设置体验版仍为 `PENDING`。
- 2026-08-25 用户真机反馈远端 `0.4.3` “风声有，但画面不会动”。该远端版本子项为 `FAIL / P1 / DO NOT RELEASE`。2026-08-26 用户已批准并本地实现 `OUTDOOR-MOTION-PHONE-V1-A / 可感知微风`：首触风声音画同步、六个局部通道峰值 `2.2° / 3.6° / 3.8° / 4.2° / 4.5° / 6.5°`、人物／猫呼吸 `0.6% / 0.7%`、首次后续阵风为上一阵风结束后 `8–12s`，之后为 `9–14s` 非固定阵风；不允许整屏／相机／银河共同摇晃。批准记录为 `docs/OUTDOOR-MOTION-PHONE-V1-A-APPROVAL.md`，本地候选记录为 `docs/OUTDOOR-MOTION-PHONE-V1-A-LOCAL-R1.md`，36.633s Web 冻结报告 SHA-256 `e97215e41ea37411845433909236d2e0f0e3f8258e5bb6544cc68f971ab77fb8`。用户随后澄清只需上传代码，负责人已将包含该动效的唯一 r4 候选上传为微信开发版本 `0.4.4`；体验版设置、真机可见动效、低亮、生命周期和性能仍待验证。
- 该例外不改变参考图的生产属性：它仍不是正式 Cocos／微信资产，只允许保留历史 `0.4.2` 体验记录，并进入 `0.4.3` 与 `0.4.4` 开发版／由用户设置的对应体验版。当前资源边界必须标为 `prototype-only / disposable / experience-v0.4.3-and-v0.4.4-only / not-for-review / not-for-release`；不得由主任务设置体验版，不得提交审核、发布线上版、进入后续正式构建、Git 提交或推送。
- 已上传 `0.4.2` 包内旧 `asset-boundary` 只作历史非运行时元数据；新 r3 候选使用独立 `phone-preview-v4-r3:` 存档前缀与当前 `0.4.3` 资源边界，不能用旧 r2 包或证据替代。
- 户外 V7/B-lite/D-lite V3 可见样式必须逐项保持；室内只工程化复现 `FORMAL-UI-V1.2-A` 和 `INDOOR-N01-PROTOTYPE-V1`，不允许借手机预览新增或修改样式。
- 历史 r3 候选制作时正式时长选择 UI 尚未批准，因此进入室内后自动使用默认 `5` 分钟；这是只属于远端 `0.4.3` 的受控测试限制。`FORMAL-SESSION-CONTROLS-V1-A` 现已批准，但不会追溯改变旧包；新的本地正式路径必须由用户明确确认 `3/5/8` 后才计时。
- 2026-08-26 用户澄清“发布”指更新微信开发版代码、供其继续设为体验版，并明确要求“你把代码上传即可”。该最新决定仅新增一次微信开发版 `0.4.4` upload 及用户自行设置的对应体验版，不授权主任务代设体验版、提审、正式发布或 Git 操作。唯一新候选为 `gate-d-mainflow-v4-phone-preview-dev-r4-0.4.4`，使用隔离存档前缀 `phone-preview-v4-r4-0.4.4:`；它可消费同一临时暖屋素材用于 `0.4.4` 内部体验，但资产仍为 prototype-only / not-for-review / not-for-release。新包必须包含已批准 `OUTDOOR-MOTION-PHONE-V1-A` 与 `FORMAL-SESSION-CONTROLS-V1-A`，不改角色、构图、材质、配色、夜空、暖屋或收尾样式。
- 2026-08-26 用户对 `0.4.4` 体验链的真机反馈为“能听到风声，但仍留在开局星空页，没有跳转”，该主链结论为 `FAIL`。用户随后明确授权将 `gate-d-mainflow-v4-phone-preview-dev-r8-0.4.5` 上传为微信开发版本 `0.4.5`，并允许同一临时暖屋素材仅用于 `0.4.5` 体验测试；不提审、不发布。r8 隔离存档前缀为 `phone-preview-v4-r8-0.4.5:`，保留 Cocos UI 坐标命中，另将 raw viewport 坐标投影回 390×844 后再判门区；户外期间静默预取室内分包，12 秒超时可重试；微信构建的 5 个 Cocos `game.js` 分包均补非破坏性 `index.js` 兼容入口。`npm run verify` 为 `120/120`；Web 4 路径为 0 runtime error；430×844 专项中旧误触点保持户外，真门点进暖屋；微信本地 experience validator 与包体预算通过。r5/r6/r7 均为 `SUPERSEDED / DO NOT CITE`。0.4.5 已上传为微信开发版；一次并行只读审查任务与负责人先后对同一冻结包产生了两份成功回执，包体逐项一致，不代表两个候选。主任务未设置体验版、未提审、未发布；手机主链仍 `BLOCKED`，等待用户设为体验版后复测。
- 2026-08-27 用户对微信 `0.4.5` 真机反馈“动态效果还是不太明显”。该反馈覆盖 V1-A 的机械差分结论，因此 V1-A 手机可感知度为 `FAIL / P1`。根因锁定为：完整静态人物／猫／草仍烘焙在 `scene_clean_plate` 中，六个风节点只是峰值透明度 `0.30–0.40` 的局部副本，代表性局部峰值位移约 `0.30–2.87px`，手机上更像淡重影而非主体运动；立即首触也未保证在自动风尾段补一条完整风链。用户现已明确批准 `OUTDOOR-MOTION-PHONE-V2-B / 真分层微风` 进入本地实现与证据阶段；批准记录为 `docs/OUTDOOR-MOTION-PHONE-V2-B-APPROVAL.md`，获批提案 SHA-256 为 `9202f4e1e5f28a5cf4281fdc865ab65b49ffce76ceba4b94b39622a5d7bfedfa`。只允许 motion-ready clean plate、六个常驻不透明真实内容层、B 表时序／幅度、首触完整风链、减动和本地证据；不得改变 V7 构图、角色、材质、配色、夜空、门、花、暖屋或 UI，不得复用／覆盖 r8／`0.4.5`，不得上传、设置体验版、提审、发布或 Git 操作。
- `OUTDOOR-MOTION-PHONE-V2-B` 已完成唯一本地候选 `outdoor-motion-phone-v2-b-local-r1`：运行时 clean plate 与六个常驻不透明真层已按 B 表接入，`npm run verify` 为 `124/124`，Web 构建树 SHA-256 `e10f0e55e68fd7d880c31dd93b2f0345db2ff8eada46d6b457fd2b14ed1b931f`。唯一最终机械证据为 `/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/outdoor-motion-phone-v2-b-local-r1-final-frozen-20260827/`，报告 `EVIDENCE_CAPTURED / issues: []`。当前状态只是 `LOCAL SOURCE PASS / FINAL LOCAL WEB MECHANICAL EVIDENCE CAPTURED / PHONE HUMAN BLOCKED / NO UPLOAD`；未授权上传，Web 数值与差分不得代替用户本人、低亮真机和 5 人原速裸眼结论。
- 2026-08-27 用户进一步对 V2-B 的可见效果明确反馈“完全看不出来”。该真人判断覆盖本地 Web 机械证据，故 V2-B 手机／真人可感知性立即记为 `FAIL / SUPERSEDED FOR NEXT MOTION CANDIDATE / NO UPLOAD`；不得继续以调大角度、局部旋转或差分图证明可见。用户随后明确批准 `OUTDOOR-ILLUSTRATION-WIND-V1-A / 五幅风页`，批准记录为 [`OUTDOOR-ILLUSTRATION-WIND-V1-A-APPROVAL`](../../../../docs/OUTDOOR-ILLUSTRATION-WIND-V1-A-APPROVAL.md)，当前规范化提案 SHA-256 为 `585a29660f2ab86f6a8b32180b791c97411ac0180325737b358a28ec56943026`；批准时记录旧 SHA 仅作审计历史。当前锁定 V7 上景完全稳定，下景使用 F0–F4 五幅完整草坡＋人物＋猫插画；F0→F1→F2→F3→F4→F0 每次跳转统一使用预加载双 Sprite 和 `140ms smoothstep` 交叉淡化，不得出现黑帧、白闪、透明空帧、上景／门光跳变或接缝穿帮。每幅停留时长按获批提案执行；首次稳定约 `0.8s` 后播放，之后安静 `4.5–6.5s` 再播放。减少动态关闭自动风页，只允许 `≤180ms` opacity／brightness 反馈。用户的“每个跳转要有流畅转场”同时约束户外→室内等其他页面／场景：不得硬切或暴露加载空帧；具体转场画法若会改变已批准观感，仍需另行回报用户。当前范围仅为制作和展示故事板、25% 对照、减动静态稿和浏览器转场视觉预览；必须先由用户看过故事板，才可进入本地 Cocos。本轮不改 Cocos／微信运行时代码、不跑 Cocos 测试、不生成 Cocos／微信构建，也不包含微信预览／上传、设置体验版、提审、发布或 Git 操作。
- 2026-08-27 用户已明确批准 `OUTDOOR-ILLUSTRATION-WIND-V1-A-R2 / 大轮廓五幅风页`。R2 只放大下半场轮廓变化：F2 草坡大弧线、F3 发梢和衣角、F4 猫耳和整条猫尾；星空、银河、小屋、门光、山线、人物／猫坐姿与间距、两朵花、清凉舒心情绪和 `140ms smoothstep` 转场合同不变。批准记录为 `docs/OUTDOOR-ILLUSTRATION-WIND-V1-A-R2-APPROVAL.md`，探索联画 SHA-256 `a787d06f170cef4ac675e7a14287b4f8c4cfaef5414248091bfe481abdb1b811`。当日工程收口候选为 `outdoor-illustration-wind-r2-local-r3-web`：一份稳定上景＋五幅构图锚定下景，双 Sprite `140ms smoothstep` 交叉淡化，首触／自动／慢滑触发，减动固定 F0，门在转场中仍可进入暖屋。“锚定”只承诺坐姿、位置和身份不漂移，发梢、衣角、猫耳和整条猫尾是获批变化，不声称角色逐像素相同。最终工程收口不改样式或时序：不再加载／绘制被不透明插画遮挡的旧 30 层，仅把 10 星＋2 花透明反馈绘制在风页上方，浏览器 QA API 不安装到非浏览器环境，销毁前清空 R2 SpriteFrame。运行时从 33 Sprite／36 frame 降为 15 Sprite／18 frame；天空与花反馈 ROI 像素差分分别为 `0.064362` 与 `0.226566`。`npm run verify` 为 `130/130`，资产机械检查 `99 PASS`；本地 Web 四尺寸、转场中点、减动、转场点门与完整主链均通过，4 路径为 0 runtime error。构建树 SHA-256 `4ac6a6ce366a7858a4db77e8948024b669cc38e1d6dd0753733fb0d4d7cc8640`，最终证据 `/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/outdoor-illustration-wind-r2-local-r3-20260827/`。所有 `local-r2`、旧 `local-web` 和窄蒙版证据均 `SUPERSEDED / DO NOT CITE`。运行时风页仍是 imagegen 探索衍生，状态为 `LOCAL WEB MECHANICAL PASS / PHONE HUMAN BLOCKED / PROTOTYPE-ONLY / NO WECHAT`；不得执行微信 preview/upload、体验版、提审、发布或 Git 操作。该 `local-r3` 已被下条 `local-r4-edgefix` 替代，不得再用于黑边判断。
- 2026-08-28 用户指出 R2 运行画面的人物／猫周围出现矩形深色接缝。当前唯一边缘修复候选升级为 `outdoor-illustration-wind-r2-edgefix-01-local-r4-web`，工程修订号 `R2-EDGEFIX-01`。修复只把五张下景页统一为 straight-alpha（源 RGB＋既有批准遮罩）并启用 Cocos `fixAlphaTransparencyArtifacts`；角色、构图、材质、配色、五幅轮廓、停留时长和 `140ms smoothstep` 均不变。资产检查 `126/126`、`npm run verify` `131/131`、本地 Web 四尺寸／F0–F4／五个转场中点／天空与花反馈／减动／转场点门均通过；五张页的半透明边缘源 RGB mismatch 均为 `0`。证据在 `/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/outdoor-illustration-wind-r2-edgefix-01-local-r4-20260828/`，索引 SHA-256 为 `28e336de303731b6f9d0b17f35c73478d75fc5cba7c4aa38df79ed44cfd6d53b`。旧 `local-r3` 及更早证据不得再用于黑边判断。该候选仍是 `PHONE HUMAN BLOCKED / PROTOTYPE-ONLY / NO WECHAT`；用户若仍认为原画自带深蓝勾边太重，必须作为新的可见样式变更另行提案和批准，不能把它混入本次工程修复。
- 2026-08-28 用户随后明确授权上传这一版。唯一微信候选 `gate-d-mainflow-v4-r2-edgefix-01-dev-r10-0.4.6` 已上传为微信开发版本 `0.4.6`；微信 CLI exit `0` 并返回 `✔ upload`。规范化 198 文件相对路径清单的构建树 SHA-256 为 `6617135fbc157d932aac287d21482d47e5af92b90dcf97c8fe724994fccdf15b`；源码验证 `133/133`、资产验证 `126/126`、experience validator PASS，release guard 按预期阻止临时素材提审／发布。用户仍需自行在微信后台设为体验版并做真机复测；主任务未设置体验版、未提审、未公开发布、未提交或推送 Git。旧 r9、local-r4 和更早证据不得冒充该远端开发版。
- R2 发布边界是硬停止线：微信构建验证器必须递归扫描整个构建树，并以目录／内容标记、源 UUID 与精确源哈希识别 R2 文件；只检查 `main/index.js` 不足以通过。当前 local-r3 诊断构建被该守卫命中 22 个痕迹，因此不得作为微信 preview/upload、体验版、提审或发布输入。
- 完整边界见 `docs/GATE-D-MAINFLOW-V4-PHONE-PREVIEW.md`。旧 `gate-d-mainflow-v3-dev` 二维码只含旧 Graphics 室内壳，不得作为 V4 暖屋测试证据。

## 2026-08-25 主功能与获批收尾 UI 更新

- 当前源码已新增与画面解耦的 N01 收尾动作合同，覆盖请求收尾、再停留、完成今晚、打开/关闭固定分享、分享失败重试/留在今晚和返回户外；启动组件统一检查室内会话时长。
- 用户已于 2026-08-25 批准 `FORMAL-ENDING-UI-V1-A / 灯下留笺`，并指定 `120%` 大字使用 B“桌边暖纸”。普通字号默认右墙窄纸笺，大字自动改用底部宽暖纸；房间不压暗，两个动作等权。批准记录为 `docs/FORMAL-ENDING-UI-V1-A-APPROVAL.md`，设计板索引 SHA-256 `436964fe60c5e552e1c930aacc65e8954df0a837d8ef71b2b9ed40bdbbbe3ead`。
- 本地 Cocos 消费既有动作合同显示收尾、摘要、分享预览和失败恢复；禁止新增“回房间”、结算/奖励/营销分享语义，不得扩展 `TonightHasLightV0View`。
- r3 工程只把已批准功能与样式装入唯一 `0.4.3` 一次性候选，不改变 V7/B-lite 户外、暖屋底图、角色、材质、配色、光线或壶盖/杯子时序；本地 build/Web QA `PASS`，远端 upload 已执行成功，不代表体验版设置、审核或发布。

## 当前停止线

- 当前户外需求合同为 `OUTDOOR-PICTUREBOOK-BRANCH-V1-A` Gate A `PASS`；根页为 `ROOT PAGE GATE B PASS`，`STARGAZE-FORMAL-BATCH-V1-A` 的 F1–F5 与 `HOME-MEAL-RITUAL-V1-A` 的 H1–H5 两个五镜视觉子包均为 `GATE B VISUAL PASS / NOT IN BUILD`。项目 Gate B 整体仍为 `ROOT PAGE PASS / STARGAZE SUBPACKAGE PASS / HOME-MEAL SUBPACKAGE PASS / FULLFRAME SPEC APPROVED / REMAINING FORMAL PAGES BLOCKED`；“吹吹风”等其他正式全幅页和独立 UI／流星效果资产获得同一文件／哈希批准前，不能进入 Cocos 动态样片或微信构建，远端写入也不授权。
- `FORMAL-OUTDOOR-ART-PILOT-V1-B` 的 20 层试验已因真 Alpha 探针失败而停止，禁止用 flatten 伪层绕过。其后继 `FORMAL-PICTUREBOOK-FULLFRAME-V1-A` 详细规格已获批准；`STARGAZE-FORMAL-BATCH-V1-A` F1 R1、F2 R1、F3 R2、F4 R1 与正式 F5 均已获同一文件视觉批准并冻结。F4 使用一次生成、零次修复；负责人、机械和独立只读复核均为 `P0=0 / P1=0 / P2=0`，独立复核 `writeOperations=0`，批准前 89 项包清单快照 SHA-256 为 `abc92a43429d03d58be0e9c22ef09c0f68d955c30681cef7fc3ce1b89ad5b111`。
- `0.4.7` 自动三拍已因用户故事感真人反馈判为 `FAIL / HISTORICAL EXPERIENCE EVIDENCE / SUPERSEDED FOR CURRENT DIRECTION`；它的上传成功、`173/173`、本地截图或历史授权均不能恢复为当前实现许可。
- 当前正式星空串行生产已完成并冻结 F1–F5 全部 clean plate。F4 `云缝重开` R1 的精确 390×844 SHA-256 为 `0973fec9fc18cfdb7422dcef32941a1fb071f84c95154cb10fd1d5279bda1ae9`，批准记录为 `docs/STARGAZE-F4-FORMAL-V1-A-R1-APPROVAL.md`；星空视觉子包已通过，但不授权修改 Cocos／微信运行时代码，也不授权 Cocos／微信构建、`preview`、`upload`、体验版设置、提审、公开发布、Git 提交或 Git 推送。
- V7、B/KF-R1、B-lite、五幅风页与旧 Cocos V0 均只按各自历史批准范围保留；它们不能覆盖最新三路分支合同，也不能拼接为 Gate B/C/D 的通过证据。生成探索图和旧 Graphics 仍不是正式生产资产。
- 已批准的成年人＋普通猫、自然深蓝星空、右侧暖屋、两朵弱光花、首触音频边界和室内 `FORMAL-UI-V1.2-A`／会话控制／收尾语义继续有效；任何新可见画法仍需在 Gate B 单独批准。
