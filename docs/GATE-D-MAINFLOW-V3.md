# Gate D-lite 主功能本地候选 V3

## 结论

- 候选：`gate-d-mainflow-v3-dev`
- 状态：`LOCAL BUILD PASS / FORMAL QA BLOCKED / PREVIEW NOT UPLOADED`
- 用户决定：先把 N01 主功能完善，再进行二维码、真人、真机和正式视觉测试。

本候选保持用户批准的 V7/B-lite 角色、构图、材质、配色、夜空结构、光线层级、素材、单次风链 cue、旋转角与亮度上限不变。V2 的固定 16 秒整段重播仅是历史临时实现；V3 按已锁定的持久赏景合同完成工程调度。旧室内画面仍只是本地功能壳，不得当作正式 UI 或外部视觉候选。

## 已完成主功能

- 启动进入户外夜风草坡；固定分享入口只进入无身份、无进度的欢迎态。
- 户外支持点天空、点两朵花、慢滑草地和点门；门从场景可交互首帧可点，互动不写入五夜进度。
- `0–9.8s` 逐值保留获批 B-lite 开场；之后人物/猫呼吸、云、主星和两花错峰运行，不再整段同时重启。
- `20s+` 使用固定种子生成可复验但非固定循环的 `8–18s` 微风间隔；每次仍使用原 B-lite 六段风链。
- 点门后进入室内 N01；3/5/8 分钟默认 5 分钟，但必须显式确认，不显示倒计时，可提前结束。
- 暖光支持拖到水壶、宽松吸附和点击替代；拖出时限制在安全范围，暂停后回到安全位置。
- 核心完成即写入 N01 完成并顺序解锁下一夜；存档失败显示可重试状态，不假装已安全落盘。
- 杯子小剧场支持轻触跳过或 4 秒自然继续；窗雾、围巾为可选互动；收尾保留“再坐一会儿”和“今晚到这里”。
- 分享请求单飞，重复点击不会发出多个原生分享；失败可重试，也可直接“留在今晚”。
- 户外/室内加载失败均可重试，半挂载室内组件会清理；分享回调可跨微信隐藏/恢复正确落位。
- LocalSaveV2 支持 V1 迁移、三路声音设置、外层应用安全点、字段级损坏恢复和顺序解锁。
- 微信系统音频中断使用稳定 Begin/End 回调；与前后台、手动暂停和静音叠加时不越权恢复、不叠播，中断时间不计入室内停留时长。
- 减少动态在任意持续运行时间都关闭自动位移、呼吸、云、星、花和风；手势风与自动风互斥。

## 验证

| 项目 | 结果 |
|---|---|
| `npm run verify` | `75/75 PASS` |
| `npm run validate:wechat-mainflow-build -- build/gate-d-mainflow-v3-dev/wechatgame` | `PASS` |
| Cocos Creator 微信本地构建 | 返回码 `36`；日志到达 `build Task (wechatgame) Finished in (10 s)` |
| AppID 核对 | 构建后与旧项目精确匹配；只记录掩码 `wx49…6f55` |

本地包：`cocos-project/build/gate-d-mainflow-v3-dev/wechatgame`

| 包体项目 | 数值 |
|---|---:|
| 文件数 | 132 |
| 文件总字节数 | 3,802,934 bytes（约 3.63 MiB） |
| `du -sk wechatgame` | 4,112 KiB |
| `du -sk assets` | 2,408 KiB |
| `du -sk assets/main` | 136 KiB |
| `du -sk assets/resources` | 2,108 KiB |

4 MiB 预算按文件实际字节和平台上传口径判断；`du -sk` 是磁盘分配块统计，会包含文件系统块填充，不能拿 4,112 KiB 直接替代上传字节数。

关键 SHA-256：

| 文件 | SHA-256 |
|---|---|
| `scripts/gate-d-mainflow-v3-dev.json` | `5ab8cf5dfb2f3f391cdbc805c62245eb5c9c9c4f7f0afe051f92ff1ef6bffe13` |
| `assets/scripts/cocos/tonight-has-light-bootstrap.ts` | `cea592f40523503352869eef383e7ea57a1979c7a463cbd88595cbfe27a8fcea` |
| `assets/scripts/cocos/tonight-has-light-v0-view.ts` | `4150cc8818da33f6558a869e1e7f63618b13467ee170c36b8ee2960df0d522e5` |
| `assets/scripts/core/app-flow.ts` | `4e2a504c367d71563d18271cd7acdf9d80d619bf2b9246f158c28371616cb268` |
| `assets/scripts/core/night-state-machine.ts` | `bffbcc5e581641ed41029172c7da1e1464369e919a2a9653433ddb1329f3c928` |
| `assets/scripts/core/local-save.ts` | `27d1cb5ab2ee224f4607dd49f6f05b5343c7320754786ee890751827d99dc27f` |
| `assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-timeline.ts` | `315e685abbc142f8a9ec429e850d89e72ca0f1012da22f8bf67fd3fa55dc0aed` |
| `assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-rig.ts` | `a3116468a3dbc225841af0d9f0f3a7924caa8a396a0e272015427c62a926cdcc` |
| `build/gate-d-mainflow-v3-dev/wechatgame/assets/main/index.js` | `db9db83ab2fadc61a04fce7dd080a44fe1c0f7d877ecda77c6de9c1d85222421` |
| `build/gate-d-mainflow-v3-dev/wechatgame/project.config.json` | `04c9250026cbd63b85a85b43914d72090325195161f07334614dd6b4d275aa20` |

## 明确边界

- 未执行微信远程 `preview`、`upload`、体验版设置、审核、发布、Git 提交或 GitHub 推送。
- 未做真人盲测、微信真机低亮、真机来电/锁屏、性能 soak 或正式 Gate E。
- `TonightHasLightV0View` 和户外欢迎/错误覆盖层仍是 local-only Graphics 功能壳。
- 正式室内成年人＋猫动作、暖光物件、房间视觉、门转场、分享卡、户外设置入口、音乐和触碰短音效仍需用户逐项批准。
- 因此 Gate C/E 继续为 `BLOCKED`，正式 Gate D 也不能宣称通过。
