# 当前需求—设计—实现追踪表

> 版本：2026-08-28 / V7 + D-lite V4 r10 uploaded 0.4.6 + OUTDOOR-MOTION-PHONE-V1-A phone visual fail + V2-B human visibility fail + Illustration Wind V1-A R2 edgefix r10 + Formal UI V1.2-A + Formal Ending UI V1-A + Formal Session Controls V1-A + Indoor Prototype V1 追踪  
> 总状态：`BLOCKED / 0.4.5 DEVELOPMENT VERSION HISTORICAL / 0.4.6 DEVELOPMENT VERSION UPLOADED / V1-A PHONE MOTION FAIL / V2-B HUMAN VISIBILITY FAIL / ILLUSTRATION WIND R2 EDGEFIX EXPERIENCE CANDIDATE / PHONE HUMAN BLOCKED / RELEASE BLOCKED`。正式 Gate B2／C／D／E 仍未通过；旧 `0.4.5` 只是已上传的历史开发版。2026-08-27 用户批准 `OUTDOOR-ILLUSTRATION-WIND-V1-A-R2 / 大轮廓五幅风页`。2026-08-28 用户指出人物／猫身边黑线后，当前微信候选为 `gate-d-mainflow-v4-r2-edgefix-01-dev-r10-0.4.6`：保持稳定 V7 上景、F0–F4 构图锚定下景、双 Sprite `140ms smoothstep`、首触／自动／慢滑、减动 F0 和转场中可点门，只修 alpha 边缘和 Cocos 导入 meta。运行时仍为 15 Sprite／18 frame；`validate_assets.py` `126/126`，`npm --prefix cocos-project run verify` `133/133`，微信 experience-only validator `PASS`，release guard 按预期失败；微信开发版本 `0.4.6` 已上传成功。上传记录见 [`GATE-D-MAINFLOW-V4-EXPERIENCE-UPLOAD-0-4-6-20260828.md`](./GATE-D-MAINFLOW-V4-EXPERIENCE-UPLOAD-0-4-6-20260828.md)。所有 local-r3／local-r2／旧 local-web、旧 r9 证据在黑边与上传判断上均 `SUPERSEDED / DO NOT CITE`；未设置体验版、未提审、未发布或 Git。
> 发布边界补充：微信验证器会递归扫描构建内每个文件的 R2 路径／内容标记、源 UUID 与精确源哈希；当前 r10 只允许作为 `0.4.6` 开发版与用户自行设置的对应体验版，不允许提审或公开发布。

| ID | 当前需求 | 被替代项 | 静态视觉证据 | 动效/交互证据 | 代码状态 | QA 状态 | 结论/下一步 |
|---|---|---|---|---|---|---|---|
| OE-01 | 第一场景是可独立停留的夜风草坡 | 打开即进室内 | V7 方向图已批准 | B-lite 本地运行时；前 20 秒正式人测仍缺 | `OutdoorGateCScene` 启动挂载 | Gate C 外部证据 `BLOCKED` | 本地主功能已接入，正式验收待 Gate E |
| OE-02 | 普通深蓝星空占主体，仅一条淡而自然的银河并保留呼吸空间 | 发光水彩飘带、霓虹极光 | V7：自然星空与单条淡银河 | B-lite runtime fidelity 子项通过 | Cocos 分层样片接入 | 用户已批准方向 | 正式资产前仍需原创分层重绘 |
| OE-03 | 无星座连线、无平行亮带；银河有暗纹/断口 | 任务地图式连线与均匀亮带 | V7 方向成立 | 仅 8–10 主星可动 | B-lite 样片实现 | 动态密度机器证据通过，真人缺口仍在 | Gate C/E |
| OE-04 | 成年人背影＋普通家猫肩并肩共同仰望 | 软团兽＋灯灵、互看/正面摆拍 | V7 同框已批准；正式角色待原创分层重绘 | 呼吸不同步 | 户外样片实现；室内仍旧 Graphics 壳 | 缩略图盲测留 Gate E | 室内正式角色需用户批准 |
| OE-05 | 风按远草→近草→人物发梢/衣角→猫耳/尾尖传递，并在手机原速裸眼下可直接辨认 | 各层独立循环、同频漂浮、整屏摇晃、窄多边形拼贴暗块、静态底图叠半透明副本，或继续依赖差分图证明手机可见 | V7 上景、构图、材质、配色保持；获批 A「五幅风页」要求上景稳定、下景使用 F0–F4 五幅连续插画；R2 放大草坡、发梢／衣角、猫耳／整条尾巴；人物／猫坐姿、位置和身份锚定，但不声称外轮廓逐像素相同 | V1-A“不太明显”、V2-B“完全看不出来”均由用户判 `FAIL`；R2 edgefix 使用 `140ms smoothstep` 互补交叉淡化，转场中 opacity 合计为 1，减动固定 F0；门在转场中仍可进入暖屋；本轮只修透明边缘，不改风页变化幅度 | 唯一微信候选 `gate-d-mainflow-v4-r2-edgefix-01-dev-r10-0.4.6`；所有 local-r3／local-r2／旧 local-web／窄蒙版／旧 r9 证据在黑边和上传判断上均 superseded；`OutdoorIllustrationWindPages` 使用一份稳定上景与两张常驻风页 Sprite，旧 30 层不再加载，仅 10 星＋2 花透明反馈位于插画上方；非浏览器 debug 守卫与资产边界防止误入 release | 资产 `126/126`；`npm --prefix cocos-project run verify` `133/133`；微信 experience-only validator `PASS`，release guard 按预期失败；微信开发版本 `0.4.6` 已上传。尚无用户设体验版后的手机低亮和真人裸眼结果，探索图不是正式资产 | `0.4.6 DEVELOPMENT UPLOADED / USER EXPERIENCE SETTING PENDING / PHONE HUMAN BLOCKED / PROTOTYPE-ONLY / RELEASE BLOCKED` |
| OE-06 | 两朵花只微光并回应一颗星 | 路径灯/奖励点 | V7 恰好两朵花 | 两花异步微亮；点花触发弱回应 | 户外透明热区已实现 | 需无奖励语义测试 | Gate E |
| OE-07 | 门首秒可点但不催促 | 必须立即进屋/CTA | V7 门为稳定环境暖点 | 门稳定不脉冲 | r8 保留节点命中，全局 fallback 分别使用 Cocos UI 坐标和 raw viewport→设计坐标投影；并预取室内分包、超时可重试 | `120/120`；Web 4 路径点门进暖屋；430×844 专项中旧误触点不进屋、真门点进屋；微信开发版本 `0.4.5` 已上传，体验版设置与真机仍待 | `0.4.5 DEVELOPMENT UPLOADED / PHONE BLOCKED` |
| OE-08 | 零操作仍有完整赏景内容 | 先选时长/先触发教程 | V7 无 UI 画面 | V3 持久异步运行，不再 16 秒整段重播；20 秒体感缺真人结果 | 启动户外，无户外任务 UI | 体感测试留 Gate E | Gate E |
| OE-09 | 首触前视觉风；首触后环境风与音乐渐入 | 启动即播或首屏声音提示 | 静音静态态待正式测 | 环境风已接入；音乐提案待批 | 音频门与分轨设置已实现，音乐/反馈暂无素材 | 微信真机与音乐仍 `BLOCKED` | 音乐需用户批准 |
| OE-10 | 户外互动不写入五夜进度 | 户外作为第零关/第六夜 | 无进度 UI | 独立 AppFlowState | AppFlow + LocalSaveV2 已实现 | 自动测试覆盖 | `ALIGNED` |
| OE-11 | 减动关闭位移、视差、草浪和推进，静态仍成立 | 加速或硬切代替减动 | V7 中性静态态成立 | B-lite 减动子项通过；交互只用亮度等价 | 户外/室内设置即时生效 | 真机无障碍仍待验 | Gate E |
| OE-12 | 360/390/430、安全区、44×44、大字 120% | 固定 390 坐标与 SHRINK | 户外四尺寸证据已有，室内正式 UI 待批 | 热区/设置即时生效 | 室内功能壳按钮最小 44，大字 120%，文本 CLAMP | 正式室内适配仍 `BLOCKED` | 室内 UI 后复测 |
| OE-13 | 旧室内五夜保留在用户主动进门之后 | 删除室内或把户外算第六夜 | 室内旧图仅参考 | 室内状态机可保留 | 点门后才进入 N01；仅 N01 可玩 | 不证明正式视觉通过 | 正式室内视觉待批 |
| UX-TR-01 | 每个插画、页面和场景跳转都要流畅；新画面就绪前保留旧画面 | 硬切、黑帧、白闪、透明空帧、重复跳转、未批准的镜头／光效／遮罩 | 风页内部继续锁定双图 `140ms smoothstep`；R2 只换可见插画幅度，不改转场时长或缓动；其他场景画法不能改变已批准样式 | R2 运行时取消叠化已由纯模型单测覆盖；edgefix 本地 Web 五个转场中点均保持 from/to opacity 互补且合计为 1；减动等待 1.8s 仍固定 F0 | r10 用双 Sprite 常驻页实现风页转场；门请求会重置户外风页并进入既有室内预取/加载链；其他跳转画法若改变观感仍需先另行回报 | `npm --prefix cocos-project run verify` `133/133`；微信 experience-only validator `PASS`；微信开发版本 `0.4.6` 已上传。微信真机帧率、低亮、生命周期和真人可见性尚未验证 | `0.4.6 DEVELOPMENT UPLOADED / PHONE RETEST BLOCKED / RELEASE BLOCKED` |
| GD-01 | 先完成“户外→点门→明亮暖家 N01→收尾”主功能，再做正式外部验收 | 反复发布只有 Gate C 样片或旧 Graphics 室内壳的二维码 | V7/B-lite 不变；暖屋只在 V4 可丢弃候选复现，正式稿仍待原创重绘 | AppFlow、LocalSaveV2、门双坐标命中、室内分包预取／超时重试、壶杯、时长确认、收尾、分享失败恢复和返回户外已收敛；微信分包入口兼容已补；r10 追加 R2 去黑边风页 | 唯一 r10 候选源码 `133/133`；微信本地 experience/package 校验通过；微信开发版本 `0.4.6` 已上传 | 用户仍需设为体验版；手机风页、边缘、点门、低亮、性能、生命周期和正式资产仍待复验 | `0.4.6 DEVELOPMENT UPLOADED / PHONE RETEST BLOCKED / FORMAL D BLOCKED` |
| GD-02 | 户外可长期停留，不机械重播一次性样片 | 固定 16 秒整段循环 | 不改 V7/B-lite 可见样式与单次风链 | 环境通道错峰；20 秒后 8–18 秒阵风 | 持久调度进入微信本地包 | 真机长时与体感仍待测 | `ALIGNED / GATE E BLOCKED` |
| FI-01 | 户外冷静舒心；室内整屋明亮温暖、角落可读，像有人留灯并准备晚饭；采用 A“灯一直为你亮着” | 旧 Graphics、V1 冷蓝室内、V1.1 暗屋黑角、B 亮灯表演、整屏橙滤镜、Bloom／霓虹 | V1.2 A 用户参考图与批准记录；墙顶地与家具均匀暖光、简单晚饭、人物左猫右 | 开门第一帧即亮，不播放黑房亮灯；减动与默认共享同一稳定终态 | V4 可丢弃手机候选已用隔离分包临时复现；不作为正式生产接入 | 本地与独立 Web 复核通过；真机触摸、音频与生命周期待完成 | `DISPOSABLE PREVIEW ALIGNED / FORMAL MASTER BLOCKED` |
| FI-02 | 可丢弃样片以明亮暖家为主体，核心为“壶盖轻响”，含 10 秒环境短句、杯子小剧场和减动等价 | 全屏仪表盘、教程轰炸、奖励分享、在亮房里继续拖无意义小光团 | `FORMAL-UI-V1.2-A` 批准参考图只进入隔离的 V4 一次性体验候选；正式四张 UI 仍待原创重绘 | 壶盖约 600ms、10s 无操作只出短句、杯子可点／4s 自然继续、减动≤200ms交叉淡化 | `prototype/indoor-n01-v1/` 与 `indoor-n01-preview` 分包已实现；r10 使用独立 `phone-preview-v4-r2-edgefix-r10-0.4.6:` 存档；必须等用户确认会话时长后才允许壶杯热区 | 当前源码 `133/133`；微信开发版本 `0.4.6` 已上传，体验版设置与手机复验仍待 | `0.4.6 DEVELOPMENT UPLOADED / PHONE RETEST BLOCKED / FORMAL BLOCKED` |
| FI-03 | 户外设置可找到但不打断零操作赏景；室内设置只在主动点“停一停”后展开 | 首屏常驻 HUD、系统弹窗或完全无可访问入口 | 户外入口仍待定；室内已批准 A“右墙留时笺”，确认后留下 `48×44px` 纸签 | 稳定、不脉冲；设置展开时拦截壶杯热区，减动无位移；核心完成后可打开已批准收尾；纸笺淡出期间继续挡住房间触控 | 本地 Cocos 已接入 `TonightHasLightFormalSessionControls`，确认后进入 collapsed tab，设置 overlay 使用 `BlockInputEvents` 拦截房间热区；户外设置入口仍待定 | [`FORMAL-SESSION-CONTROLS-V1-A`](./FORMAL-SESSION-CONTROLS-V1-A-APPROVAL.md) 身份已冻结；当前源码 `133/133`，0.4.6 已上传为开发版，微信真机可见截图与安全区证据仍缺 | `0.4.6 DEVELOPMENT UPLOADED / PHONE RETEST BLOCKED` |
| FI-04 | 正式人物、猫、房间、灯、壶、文字、图标均原创可编辑且可追溯 | 直接把探索／用户参考图升格为正式资产；用低质矢量冒充视觉通过 | r10 仅消费批准参考的临时压缩衍生图、R2 风页与预裁片；R0/R1 均失败归档 | 历史 `0.4.3`／`0.4.4`／`0.4.5` 体验测试已获临时素材例外；用户已追加授权同一临时暖屋和 R2 edgefix 仅用于 `0.4.6` 体验测试；正式实现仍须原创分层重绘 | 生产运行资产仍为 0；当前临时资源登记为 `prototype-only / disposable / experience-v0.4.3-through-v0.4.6-only / not-for-review / not-for-release` | 资产清单与哈希已登记；release guard 按预期失败；正式许可、原创盲测和截图待后续 | `0.4.6 DISPOSABLE EXPERIENCE BOUNDARY PASS / FORMAL BLOCKED` |
| FI-05 | 样片与正式工程保持可撤销隔离；临时声音只进入 V4 独立分包且只在触碰后播放 | 样片顺手进入后续构建，或越权执行审核／发布 | 批准参考图 SHA-256 `ad65d6...cb36a`；V4/R2 派生资产逐项登记 | 临时 MP3 为确定性合成；静音有视觉等价；运行时增益受限 | `indoor-n01-preview` 与 `outdoor-illustration-wind-r2` 保持独立分包；r10 已按授权上传为开发版本 `0.4.6`；下一正式构建不得默认消费 | r10 experience/package 校验通过，release guard 按预期失败；主任务未设置体验版／未提审／未发布 | `0.4.6 DEVELOPMENT UPLOADED / PHONE RETEST BLOCKED / FORMAL BLOCKED` |
| FI-06 | 收尾 UI 让玩家自然选择“再坐一会儿／今晚到这里”，完成后可固定分享或回到夜风；房间始终明亮且不读成结算／奖励页 | 未获批时直接显示按钮/卡片；新增“回房间”；全屏弹窗、黑幕、暗角、营销分享、进度与奖励词 | 用户已批准 [`FORMAL-ENDING-UI-V1-A`](./FORMAL-ENDING-UI-V1-A-APPROVAL.md)：普通字号“灯下留笺”，120% 大字“桌边暖纸”；设计板索引 SHA `436964fe...e3ead` | 170ms 透明度显现；减动 transform 为 0 且 fade 为 0；现有动作层支持结束、停留、分享、失败恢复和回户外 | `TonightHasLightIndoorN01Preview` 已接入；只消费 `IndoorN01SemanticAction`，使用持久 Sprite/Label/Button 与可编辑 SVG/PNG 资源；关闭分享预览时释放单飞锁并使旧回调失效；r10 保留获批 UI | 当前源码 `133/133`；0.4.6 已上传为开发版，微信真机仍待复验 | `0.4.6 DEVELOPMENT UPLOADED / PHONE RETEST BLOCKED / FORMAL GATE BLOCKED` |
| FI-07 | 进屋后明确确认 3/5/8，默认 5 但不自动开始；不显示倒计时，可回夜风；核心完成后可主动打开已批准收尾；设置含声音、减少动态和大字 | 一次性样片静默采用 5 分钟；强制倒数；直接结束而跳过收尾 UI；常驻大面板 | 用户已批准 [`FORMAL-SESSION-CONTROLS-V1-A`](./FORMAL-SESSION-CONTROLS-V1-A-APPROVAL.md)：普通字号右墙留时笺，120% 大字桌边暖纸；B/C 封存 | 暖屋先完整显示约 650ms；纸笺仅 170ms 透明度显现；减动 transform 为 0；确认后才启动计时；设置展开和纸笺淡出期间阻断房间热区 | `TonightHasLightIndoorN01Preview.show()` 不再发送 `SELECT_DURATION`；`confirm-duration` 才向 `NightSession` 发送选中 `3/5/8`；壶杯互动需 `durationMinutes !== null`；大字使用 `table-paper` 且 `scale=1.2`；已编入 r10 | 批准时设计板索引 SHA `0cc7c8...c4a9b` 已冻结；当前源码 `133/133`；0.4.6 已上传为开发版，微信真机可见证据仍缺 | `0.4.6 DEVELOPMENT UPLOADED / PHONE RETEST BLOCKED / FORMAL BLOCKED` |

FI-06 行为补充：选择“再坐一会儿”会清除已消费的收尾提示并重新开始一个已选 `3/5/8` 分钟周期，避免刷新后立即回弹；到期前不再提示，到期后仅重新开放同一收尾，不显示倒计时。

r3 一次性限制：正式合同仍要求用户进屋后明确选择 `3/5/8` 分钟。`FORMAL-SESSION-CONTROLS-V1-A` 现已在本地源码接入，但历史远端 `0.4.3` 不会被追溯修改，仍自动使用默认 `5` 分钟；该限制只允许存在于本次可丢弃体验版。新的本地正式路径必须等用户确认后才计时，状态为 `HISTORICAL EXCEPTION / NEW LOCAL SOURCE PASS / NEW RUNTIME BLOCKED`。

## 已关闭的 Gate A 分叉

- 入口顺序：户外赏景 → 用户点门 → 室内第一夜。
- 前 20 秒：无标题、按钮、任务、进度或文字操作提示。
- 声音：首次触碰前不主动播放；触碰后环境风响应，音乐渐入。
- 进度：户外不改变五夜完成与解锁。
- 视觉：V7 自然星空＋淡银河＋成年人背影与家猫是唯一方向；旧 V3/V4-B 角色、发光水彩飘带、室内月光灯箱和 Graphics 画面均不是当前首屏。

## 不阻塞 Gate C 的待确认项

- 户外回访短句使用固定一句还是 3–5 句低频轮换。

## Gate B 批准证据

- V7：`/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/gate-b-material-proof/v4b-natural-starry-sky-cartoon-human-cat-v7-390x844.png`
- SHA-256：`7157484b95988b11c1abdf9ddc0d5bb7c2d3bde25dd9d2dfcf6c5ee795847b3d`
- 范围：批准进入可丢弃 Gate C 动态样片；正式入包资产仍需可编辑分层原创重绘。
