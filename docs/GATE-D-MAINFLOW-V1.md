# Gate D-lite 主功能本地候选 V1

> 状态更新：`SUPERSEDED BY V2 / DO NOT USE AS CURRENT TEST CANDIDATE`。当前主功能本地候选见 [`GATE-D-MAINFLOW-V2.md`](./GATE-D-MAINFLOW-V2.md)。V1 保留为历史记录，不得用于新的二维码、真机或 Gate 结论。

## 结论

- 候选：`gate-d-mainflow-v1-local`
- 状态：`LOCAL BUILD PASS / QA NOT RUN / PREVIEW NOT UPLOADED`
- 范围：先按用户最新决定补齐主功能竖切片，再做后续真机和视觉测试。

本候选不改变 V7/B-lite 的角色、构图、材质、配色、夜空结构、光线层级、图像资源、音频资源或已批准自动动效参数。

## 已实现

- 启动后仍进入户外 V7 夜风草坡。
- 首次触碰仍由 `OutdoorGateCAudioGate` 解锁并播放已批准环境风。
- 户外新增透明热区：点天空、点两朵花、慢滑草地、点门。
- 点天空与点花只触发短促弱亮度反馈；慢滑草地重播已批准 B-lite 风链。
- 点门后销毁户外场景组件，进入室内第一夜的 `duration-selection`，不再展示旧室内欢迎页。
- 室内第一夜继续复用旧 V0 可玩逻辑：3/5/8 分钟、首次触碰、拖/点暖光到水壶、杯子小剧场、安静收束、本地存档与固定分享 payload。

## 边界

- 旧室内 `TonightHasLightV0View` 仍是临时 Graphics 功能壳，不是正式 UI 或正式角色资产。
- 未执行微信远程 `preview`、`upload`、体验版设置、审核或发布。
- 未做真人盲测、真机低亮、真机生命周期、性能 soak 或正式 Gate E。
- 当前 Gate C 仍因外部证据缺口保持 `BLOCKED`；本候选只是用户授权的主功能优先实现，不等于 Gate C 通过。

## 关键文件

| 文件 | 用途 |
|---|---|
| `cocos-project/assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-scene.ts` | 户外透明交互热区与门事件 |
| `cocos-project/assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-rig.ts` | 花/天空弱反馈与慢滑生风入口 |
| `cocos-project/assets/scripts/cocos/tonight-has-light-bootstrap.ts` | 户外到室内第一夜接线 |
| `cocos-project/assets/scripts/cocos/tonight-has-light-audio.ts` | 避免私有字段与 Cocos `Component.enabled` 冲突 |
| `cocos-project/scripts/gate-d-mainflow-v1-local.json` | 本地微信构建配置 |
| `cocos-project/scripts/validate-wechat-motion-runtime-build.mjs` | 兼容压缩后的等价累计时间写法 |

## 验证

| 命令 | 结果 |
|---|---|
| `npm run verify` | `33/33 PASS` |
| Cocos Creator 微信本地构建 | 返回码 `36`；日志到达 `build Task (wechatgame) Finished` |
| `npm run validate:wechat-motion-runtime-build -- build/gate-d-mainflow-v1-local/wechatgame` | `PASS` |

本地包：`cocos-project/build/gate-d-mainflow-v1-local/wechatgame`

关键 SHA-256：

| 文件 | SHA-256 |
|---|---|
| `scripts/gate-d-mainflow-v1-local.json` | `63fa6d59274e21ee998cf31aa39780b083b6388c3ee839fb75acc5aa43161299` |
| `assets/scripts/cocos/tonight-has-light-bootstrap.ts` | `d6980d146ac213bdd8280acef59ea2198907a46133e59426aa2b2341756b7f2d` |
| `assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-scene.ts` | `8b9a29b9dc1ecf95cdce05e9b463b6d50a3cd608143748bf50af78444c3a4335` |
| `assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-rig.ts` | `377c0300c15ad2870965086655d243f74fb62c7ea3c96cee72c814dd8084f540` |
| `assets/scripts/cocos/tonight-has-light-audio.ts` | `a21c5dce7aa6169e781e5949c23ea6dea87afac3958a6d0dfe86199594db3a37` |
| `scripts/validate-wechat-motion-runtime-build.mjs` | `2325d7efeb26cc20f1e9ad12268249558cc5f8dba4dce342b63537cd3763d272` |
| `build/gate-d-mainflow-v1-local/wechatgame/assets/main/index.js` | `0e18ea925a91b9996d91e3b4a962bfc77920f2c96e0a61b29e37b959694dfa15` |
