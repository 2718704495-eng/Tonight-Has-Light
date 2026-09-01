# Formal UI V1.2 / 明亮暖家设计板

> 状态：`ALIGNED / A USER APPROVED · PRODUCTION MASTER BLOCKED`  
> 当前 Gate：Gate B2 正式可见体验提案  
> 用户最新合同：户外安静舒心；回家时整个房间明亮温暖、角落不能黑，桌上有为你准备的简单晚饭  
> 禁止用途：把探索图或用户参考图直接切入 Cocos、声称正式资产或玩法已批准、替代正式分层母版、真人盲测或微信真机验收

打开 `index.html` 即可查看。需要本地服务器时，在本目录运行：

```bash
python3 -m http.server 4175 --bind 127.0.0.1
```

## V1.2 取代关系

- V1.1 的“暗部 55%–65%、一小团局部暖光、四周保留黑暗”已被用户明确撤销，状态为 `SUPERSEDED`。
- V1.2 不展示暗沉主画面：墙、天花、地板、家具、人物、猫和桌上晚饭都应处在可读的广域暖光中，角落不能压黑。
- 明亮是场景语义，不是提高屏幕刺激：正式稿仍须保留纸纹、灯罩和灯芯细节，纯白灼点、Bloom、霓虹和整屏橙色滤镜为 0。
- 户外 V7 不变；室内人物始终在左、普通家猫始终在右，晚饭只是一顿朴素家常饭，不是宴会或奖励。

## A/B 只比较到家方式

| 方案 | 到家节奏 | 最终状态 | 当前状态 |
|---|---|---|---|
| A「灯一直为你亮着」 | 开门第一帧即看见整屋明亮、晚饭已备 | 唯一明亮暖家最终态 | `USER APPROVED FOR EDITABLE MASTER` |
| B「进门后整屋亮起」 | 从极短低亮进入帧，在最多 0.55 秒内到达最终态 | 与 A 完全相同、无黑角 | `NOT APPROVED / HISTORY ONLY` |

用户于 2026-08-24 明确批准 A；批准记录见 `../../docs/FORMAL-UI-V1-2-A-APPROVAL.md`。B 仅保留在本板中作为决策追溯，不得进入当前母版、动效或 Cocos。

## 玩法影响与停止线

整屋明亮后，原核心动作“把一小团光拖到壶边”的视觉因果变弱：用户会合理地问“房间已经这么亮，为什么还需要这团光？”因此核心玩法状态为 `BLOCKED`，不得直接进入代码。

- 待批替代 A：轻触门，或零操作后自然见到已经亮着的家；核心回到掀开饭罩、热饭／热壶或等水开的小剧场。
- 历史备选 B：进入短暂低亮态，第一次轻触让整屋在 0.55 秒内亮到最终态。该方向未获批准，不得进入当前母版或构建。

当前核心玩法尚未获批准，不能由 UI、开发或 QA 自行选定。

## 明亮方法与研究结论

- 感知上的“房间明亮”可以通过墙面和天花的广域、均匀或间接光，以及地板和家具的可读中间调来表达；屏幕不需要用刺眼纯白或过曝热点证明亮度。
- 建议色彩角色：蜂蜜奶油、暖纸白、浅木、低饱和陶土；窗外冷蓝只用于对比和空间纵深。
- 正式稿只保留两类光源角色：`广域环境／间接光` 与 `一处桌侧实用灯`。探索图中出现的多余第三灯具只属于生成探索残留，必须删除，不能照搬入正式资产。
- 探索图右侧相框也属于生成探索残留；正式稿不得画可识别人像、合影或暗示具体关系的照片，可改为空白纸纹、抽象植物印刷或直接移除。
- 桌面层级是“朴素晚饭与热壶 → 人物＋猫 → 窗外冷夜”；不得把食物画成奢华宴席、庆祝或奖励。

## 当前资产来源

| 文件 | SHA-256 | 来源／用途 | 状态 |
|---|---|---|---|
| `approvals/formal-ui-v1-2-a-user-approved-reference-2026-08-24.png` | `ad65d6fa811487fe5bd69726f1c5bf9d4b4c983d517c360b7087ff42f89cb36a` | 用户随 A 批准语句提供；本轮批准方向参考 | `user-approved visual reference / internal only / not production` |
| `superseded/flat-svg-draft-r0/` | 见目录内 `HASHES.sha256` | 首张无嵌入 raster 的可编辑 SVG 研究草稿 | `FAIL / SUPERSEDED / DO NOT USE` |
| `superseded/vector-redraw-r1/` | SVG `4d2e32989ebff9daab2a90803082c98a2f97fe8799755c874a589a5c13916c3d` | 第二次原创语义分层矢量重画与 390／25% 截图 | `FAIL / SUPERSEDED / DO NOT USE` |
| `assets/concept-bright-home-dinner-exploration-v1-2.png` | `076ea53dcbc7a5e6c2d4920a9a21adfaf60c4e7880c7864cd5d28baf04adf347` | imagegen 编辑探索；明亮暖家、晚饭与广域暖光 | `tool-produced / generated exploration-only / approved direction, not asset` |
| `assets/v7-approved-reference.png` | `7157484b95988b11c1abdf9ddc0d5bb7c2d3bde25dd9d2dfcf6c5ee795847b3d` | 已批准 V7 的本地只读副本；只校准户外连续性 | `prototype-only / approved direction` |

生成图只帮助判断构图、光色、空间比例和晚饭语义。正式人物、普通家猫、食物、灯、壶、杯、家具、中文、Logo、图标和关键互动物必须原创分层重绘，登记作者、来源、许可、版本和 SHA-256；不能把该 PNG 或其中细节直接入包。

## Normalized/reproducible prompt (root-authored; not byte-exact server log)

```text
Edit existing vertical 390×844 window-table composition into a bright, fully welcoming warm home at night. Preserve camera and staging: normal-proportioned gender-neutral adult seated LEFT in three-quarter back view, ordinary undressed house cat seated RIGHT, low wooden table and kettle, window LEFT. Emotional target: outside is quiet/calm cool deep-navy night; inside feels like coming home late and discovering the whole home has been left brightly and warmly lit for you, with a simple dinner already prepared. Not a dim moody room; no black corners. Walls, ceiling, floor, chair, rug, adult, cat and table all readable under broad honey-cream ambient illumination. Use an original simple ceiling pendant plus gentle indirect wall light and one small practical table-side lamp; final formal redraw should keep only two light-source roles and remove redundant third lamp. Cool outdoor window is secondary. Table: two simple bowls, one small steaming soup/porridge dish, modest staple food, kettle and cups; no luxury feast, party decoration, birthday cake, crowd or text. Original polished soft gouache and dyed-paper layered illustration, handmade paper grain, no existing IP or artist name. Bright in scene semantics but comfortable screen luminance: no clipped pure-white bulb, harsh hotspot, bloom, neon, full orange filter, stage spotlight or crushed black. Visual hierarchy: warmly lit whole room and prepared meal → adult+cat → cool window. No UI/logo/watermark/task/reward/magic/extra characters/moon/constellation/medical claims.
```

该提示词是 root 编写的规范化、可复现语义记录，不是服务端逐字节日志。工具产出资产 SHA-256 为 `076ea53dcbc7a5e6c2d4920a9a21adfaf60c4e7880c7864cd5d28baf04adf347`。

## 用户批准时的浏览器证据与边界

| 证据 | SHA-256 | 结果 |
|---|---|---|
| `evidence/formal-ui-v1-2-desktop-full.png` | `281e4eea41bfe90ca5333935c675d1b47d41042ec14c19d6507da9bb4a9a8708` | 1440 px 完整设计板 |
| `evidence/formal-ui-v1-2-ab-focus.png` | `5f3c7b13bf3a1c8b5eb0b1d6ebbeba861c8daaa624f1ff5d066bf0374710d055` | A／B 到家方式同终态对照 |
| `evidence/formal-ui-v1-2-key-screens.png` | `14f9fbb281f382abc783ea161145b7f5537c633bc9dd37d1e362e44e7d128708` | 时长、轻触／无操作、收尾、分享 |
| `evidence/board-360x800.png` | `17656ad12e5314553f41fe2583df91b2dde176ac8a48c4730f3553d5549c4c43` | 360×800 响应式页面 |
| `evidence/board-390x844.png` | `50bfbc566aa6ccfb875f03ef964d65a5e469ec021681cf42bc45d7d86dc2ceb0` | 390×844 响应式页面 |
| `evidence/board-430x932.png` | `dc269128fad68a155b2ae223ecca6ac44553f36fd4457c46b5eb5b7a1cb07559` | 430×932 响应式页面 |

这些截图记录用户批准前看到的 A/B 提案板，并由 `approvals/HASHES.pre-approval.sha256` 冻结。批准后页面状态文字已同步为 A 已批准，因此旧截图不得冒充当前页面回归；历史索引中的 `index.html` 与 `README.md` 哈希也不会匹配当前状态文件，这是预期的版本差异，当前版本由根 `HASHES.sha256` 管理。批准前本地 Playwright 使用系统 Chrome 实测：1440、360、390、430 均无横向溢出；13 张图片加载失败为 0；浏览器 console warning／error 为 0；按钮最小宽高均为 44 px。提案板理论色票对比为：主文字／暖纸 13.31:1、次级文字／页面 5.49:1、主按钮 9.49:1、夜蓝强调／页面 9.13:1。该检查只证明提案板的资源、响应式布局、文字和展示热区正确；不能替代正式 Cocos 的 360/390/430 游戏画面、SafeArea、最终纹理像素、低亮／过曝、动态大字、减少动态、静音、性能或生命周期验收。

当前 `HASHES.sha256` 同时纳入批准证据、批准前证据截图，以及 R0/R1 两个失败草稿的独立子索引，避免任何失败候选被重新包装为当前母版。V1/V1.1 不进入本轮链。
