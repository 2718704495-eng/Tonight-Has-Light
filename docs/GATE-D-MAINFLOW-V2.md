# Gate D-lite 主功能本地候选 V2

> 历史候选：已被 [`GATE-D-MAINFLOW-V3.md`](./GATE-D-MAINFLOW-V3.md) 替代，不得作为当前构建、二维码或后续测试输入。

## 结论

- 候选：`gate-d-mainflow-v2-dev`
- 状态：`LOCAL BUILD PASS / FORMAL QA BLOCKED / PREVIEW NOT UPLOADED`
- 范围：按用户最新决定，先把主功能竖切片补完整，再做二维码、真人、真机和正式视觉测试。

本候选不改变 V7/B-lite 的角色、构图、材质、配色、夜空结构、光线层级、图像资源、环境风资源或已批准自动动效参数。旧室内画面只是本地功能壳，不得当作正式 UI 或外部视觉候选。

## 已实现

- 启动后进入户外 V7 夜风草坡；共享入口先显示固定欢迎，不继承发送者身份或进度。
- 户外透明热区：点天空、点两朵花、慢滑草地、点门。慢滑使用低速水平手势识别，独立触发一次可读风，不重置主时钟、不叠加强风。
- 点门后进入室内第一夜 N01；户外不写入五夜完成进度。
- 3/5/8 分钟选择位于进屋后、核心互动前；默认 5 分钟，但必须显式确认，不显示倒计时。
- 室内 N01 功能壳支持暖光拖拽到水壶、点击暖光再点水壶替代、杯子小剧场轻触跳过或 4 秒自然继续、窗雾与围巾可选互动、安静收束。
- 核心互动完成时立即写入 N01 完成并解锁下一夜；主动退出未完成前只回到户外，不误记完成。
- 设置支持音乐、环境声、触碰反馈、减少动态和大字；当前实际接入的是环境风，音乐与短音效还没有批准素材。
- 暂停、加载失败、分享预览、分享失败、音频中断和后台恢复都有本地功能路径。
- LocalSaveV2 支持 V1 迁移、分轨声音设置、外层应用安全点、字段级损坏恢复和顺序解锁。
- 修复了设置/手动暂停后切后台再回来时，音频先于画面恢复的生命周期回归。

## 边界

- 未执行微信远程 `preview`、`upload`、体验版设置、审核、发布或 GitHub 推送。
- 未做真人盲测、微信真机低亮、真机生命周期、性能 soak、正式 Gate E。
- 当前 Gate C/E 仍为 `BLOCKED`；V2 只是主功能本地开发候选，不等于 Gate C 或正式 Gate D 通过。
- 旧室内 `TonightHasLightV0View` 仍是临时 Graphics 功能壳；正式室内成年人＋猫动作、暖光物件、房间视觉、门转场、分享卡视觉、音乐和短音效都需要用户另行批准。
- 分享落地当前覆盖冷启动分享入口；前台已打开游戏时再从分享卡回来的处理需要单独产品裁决。

## 关键文件

| 文件 | 用途 |
|---|---|
| `cocos-project/assets/scripts/core/app-flow.ts` | 外层启动、共享欢迎、户外、点门、室内加载、结束页和覆盖层状态 |
| `cocos-project/assets/scripts/core/night-state-machine.ts` | 室内 N01 时长、核心仪式、小剧场、安静停留、完成与暂停 |
| `cocos-project/assets/scripts/core/local-save.ts` | LocalSaveV2、V1 迁移、应用安全点和字段级恢复 |
| `cocos-project/assets/scripts/cocos/tonight-has-light-bootstrap.ts` | AppFlow、室内状态机、存档、音频、微信分享和生命周期接线 |
| `cocos-project/assets/scripts/cocos/tonight-has-light-v0-view.ts` | 本地室内 N01 功能壳与设置/分享/暂停覆盖层 |
| `cocos-project/assets/scripts/cocos/outdoor-gate-c/outdoor-slow-swipe.ts` | 慢滑生风手势分类 |
| `cocos-project/assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-scene.ts` | 户外透明热区、点花、点天空、点门和慢滑绑定 |
| `cocos-project/assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-rig.ts` | B-lite 户外动效运行时与手势风反馈 |
| `cocos-project/scripts/gate-d-mainflow-v2-dev.json` | 本地微信构建配置 |
| `cocos-project/scripts/sync-wechat-appid-from-existing-project.mjs` | 构建后同步旧 AppID 到本地包，只输出掩码 |

## 验证

| 项目 | 结果 |
|---|---|
| `npm run verify` | `62/62 PASS` |
| `npm run validate:wechat-motion-runtime-build -- build/gate-d-mainflow-v2-dev/wechatgame` | `PASS` |
| Cocos Creator 微信本地构建 | 返回码 `36`；日志到达 `build Task (wechatgame) Finished` |
| AppID 核对 | 构建后同步为旧 AppID，文档只记录掩码 `wx49…6f55` |

本地包：`cocos-project/build/gate-d-mainflow-v2-dev/wechatgame`

包体：

| 项目 | 数值 |
|---|---:|
| 文件数 | 132 |
| 文件总字节数 | 3,791,235 bytes |
| `du -sk wechatgame` | 4,100 KiB |
| `du -sk assets` | 2,396 KiB |
| `du -sk assets/main` | 124 KiB |
| `du -sk assets/resources` | 2,108 KiB |

关键 SHA-256：

| 文件 | SHA-256 |
|---|---|
| `scripts/gate-d-mainflow-v2-dev.json` | `ea8ea4e396916e90fdc3d6addbb79056a3fcb446f47692b3a7734e642a19b77e` |
| `assets/scripts/cocos/tonight-has-light-bootstrap.ts` | `f9061025347c0e50f5c76ea560e28384c349b5d8859f2d2c879187c7f5a6d61e` |
| `assets/scripts/cocos/tonight-has-light-v0-view.ts` | `ee2b06cc4ee25186da4a601fcf4f6fdd3b86569ac66acd1ac3c208aa9a086ab9` |
| `assets/scripts/core/app-flow.ts` | `3d3af73c424d0a5abb491eede0c52d3e330fdb457f392fe3e32c1d8022c55cd7` |
| `assets/scripts/core/night-state-machine.ts` | `8be2dcbacda8a0bb7442ea3156ce19e70e8b2ee11b05421d3bd21aa5943ec0ba` |
| `assets/scripts/core/local-save.ts` | `27d1cb5ab2ee224f4607dd49f6f05b5343c7320754786ee890751827d99dc27f` |
| `assets/scripts/cocos/outdoor-gate-c/outdoor-slow-swipe.ts` | `da17b286ecbb8bbac77ba1be51b0cc91d7e6d7b2f301f9aca4e013ddd8aca5cd` |
| `assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-scene.ts` | `738a5628e88e758b0dc11dbf19ad80ea67a023f3bf0ae121015e73ecda13b31d` |
| `assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-rig.ts` | `4753924f6f198dd12ad8024a036398cb55a6338ad5d7299badc58940a80e48d9` |
| `scripts/validate-project.mjs` | `b3e95e7fc32c302bb05b7df790c5fd91fc5c05807997ff48a3c0dd104beeacb5` |
| `tsconfig.cocos-check.json` | `10c7ecb9f77387e17b694bc954e8f5a8056283dab3e538e3ed27ba33207ce8ac` |
| `build/gate-d-mainflow-v2-dev/wechatgame/assets/main/index.js` | `1ef70535f06ef4f5624214ddf4f1e992b1232d1080ad140a6aae103c39a4dd09` |
| `build/gate-d-mainflow-v2-dev/wechatgame/project.config.json` | `04c9250026cbd63b85a85b43914d72090325195161f07334614dd6b4d275aa20` |
