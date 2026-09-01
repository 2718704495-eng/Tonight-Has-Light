# HOME-MEAL-RITUAL-V1-A 需求—设计—实现追踪

> 日期：2026-08-31  
> 当前 Gate：B  
> 总状态：`PASS / GATE A PASS / HOME-MEAL GATE B VISUAL PASS / H1-H4 USER VISUAL PASS-FROZEN / H5 REFERENCE HASH PASS / PROJECT GATE C-D BLOCKED`

| ID | 当前需求 | 来源／决定 | 被替代项 | 静态视觉证据 | 动效／交互证据 | 代码消费者 | QA 证据 | 状态 | 负责人／下一步 |
|---|---|---|---|---|---|---|---|---|---|
| HMR-01 | 回家支线保持五幅，顺序为归家全景→放外衣→厨房→饭桌近景→暖家全景 | 用户 2026-08-30 批准 | 旧看门／起身／走坡／跨门 001–004 | 书面规格 §4；H5 批准图 | 无 | 未来 `HomeArrivalStory` | 需 Gate B 五幅板 | `PASS`（Gate A） | 主任务维护合同 |
| HMR-02 | 第二、第三幅使用近景，最后回到第一幅空间机位 | 用户澄清＋批准 | 五幅均用相近远景 | H1 r2 与 H5 390／195 同屋对照；H2 外衣连续性板；H3 `390`/`195` 的 H2→H3→H5 叙事板、同屋锚点板；书面规格 §4 | H4→H5 420ms 匹配淡变合同 | 未来双 Sprite 页面层 | H1/H2/H3/H4 负责人及独立审查均无未关闭 P0/P1/P2；H2/H3/H4 独立审查 `writeOperations=0` | `PASS`（H1-H4 USER VISUAL PASS/FROZEN；H5 HASH PASS） | 批准记录见 H1、H2/H3 与 H4 三份批准文档；运行时仍未授权 |
| HMR-03 | 外搭、内搭、挂钩与菜品跨页连续 | H5 批准图＋角色圣经 | 突然换装、新增时尚道具或热菜凭空出现 | Root R4→H1 r2→H2 r1→H5 外衣板；H2→H3→H5 叙事板；H3 浅圆盘盛菜→H4 饭桌状态→H5 中央浅圆盘成菜板 | 无 | 无 | H1/H2/H3/H4 负责人及独立审查均无未关闭 P0/P1/P2；H3/H4 连续性板通过 | `PASS`（H1-H4 用户视觉通过并冻结） | 不得修改 H1/H2/H3/H4/H5 |
| HMR-04 | 饭桌提供“吃一点”“喝口温水”，任一／两者／跳过均可 | 用户批准 | 强制顺序、奖励或完成门槛 | H4 clean plate `bbb02106...6533`；四状态板 `h4-response-states-2x2.png`；UI 板 `h4-standard-state-board.png` | `≤180ms` 静态交叉淡化合同；`none/ate/sipped/both` 只写 `h4State` | 未来 H4 页面模型 | H4 state/UI 只读测试 `6/6 PASS`；几何、像素对比和减动样张通过；独立复核 `P0/P1/P2=0/0/0` | `PASS`（H4 USER VISUAL PASS/FROZEN） | 批准记录 `docs/HOME-H4-TABLE-RITUAL-V1-A-R2-APPROVAL.md` |
| HMR-05 | H5 逐像素保持批准暖家全景 | 用户视觉批准 | 重绘、调色、裁切或压暗 H5 | SHA-256 `569a7b9b...1c51` | 无 | 未来只读 SpriteFrame | 哈希与像素对比 | `PASS`（Gate B 基线） | 所有后续任务消费同一文件 |
| HMR-06 | 回家故事与 NightSession 进度隔离 | 项目合同＋技术审查 | 点壶／翻页即完成夜晚 | 无 | 书面规格 §8 | 未来 `AppFlow`／`HomeArrivalStory` | 需状态机回归 | `BLOCKED`（Gate D） | 视觉通过后写实现计划 |
| HMR-07 | 全程静音可理解、减动零位移、120% 大字不 SHRINK | 项目无障碍合同 | 靠声音／镜头缩放／缩字完成 | H4 普通、大字、360/390/430 与减动样张；120% 大字使用桌边暖纸 | 减动仅 `150ms` opacity/crossfade，transform 为 `0` | 未来 UI／页面转场层 | 几何 PASS；像素对比最小 `10.84:1`；用户视觉通过；运行时证据仍缺 | `PASS`（Gate B）／`BLOCKED`（Gate E） | 等项目 Gate B/C 与新的实现授权 |

## Gate 结论

- 当前 Gate：B
- 总状态：`PASS / HOME-MEAL-RITUAL-V1-A GATE B VISUAL PASS / H1-H4 USER VISUAL PASS-FROZEN / H5 REFERENCE HASH PASS`
- P0：0
- P1：0
- 可进入下一 Gate：该子包自身已具备后续实现输入资格，但整个项目仍缺其他正式绘本页，且没有新的 Cocos／build／WeChat／Git／远端写入授权，因此当前不进入实现。
- 唯一当前生产计划：[`2026-08-30-home-meal-ritual-gate-b.md`](./superpowers/plans/2026-08-30-home-meal-ritual-gate-b.md)，SHA-256 `98d265d554121f2ee0119752e85dc52cfab8f5e42a87605f20f43092dfbb646a`。
- 现有证据：H1 390 SHA-256 `b68c2dfd7bcf40a9d3bd77320faecdbeff517e2b2f7f160abbf4a7d4c6a836fe`，预批准清单 `efdedf0f7cb9da15ca492b24a4d5e631dfe642b5733a379d7902fba052cbdcf4`；H2 390 SHA-256 `ef11fcb38d1e515cb2f8702d7b4ea8734f0f92ac08f24c8e2a18bfad97ccc6dd`，预批准清单 `9b5b908aa26561ce51bacae789b971c4b604502f60736cad8976cf6c6cc36f1e`；H3 390 SHA-256 `c582fa5e9ad5c0f465e307472ccfc6791ed78b2d1e81663669df9151819aab72`，预批准清单 `91d967150073566f1d9c34302bb3197a26fdf4ac2d45201a0fa13a9303eeb4ec`；H4 clean plate `bbb02106fb4f5a820d1199eb61c7b10b5065028461bfdd6bf813276abe796533`，预批准清单 `e38d96750c277145285f2e20d3bc52df57728e847a85a447ac02d7704a6f47b0`，批准记录 `9337f3315a8c623597aa29da7f8edbdb3540b89bd72dd29767145663cc846579`。
- 权限：`H1/H2/H3/H4 USER VISUAL PASS/FROZEN / H5 REFERENCE HASH PASS / NO COCOS / NO BUILD / NO WECHAT / NO GIT / NO REMOTE WRITE`。
