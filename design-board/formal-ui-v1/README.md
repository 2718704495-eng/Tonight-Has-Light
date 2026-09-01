# Formal UI V1 设计对照板

> 状态：`BLOCKED / AWAITING USER APPROVAL`  
> 用途：正式室内 N01 的构图、UI、门转场与分享承载方式比较  
> 禁止用途：直接切图入包、冒充正式角色／场景资产、替代真人或微信真机验收

打开 `index.html` 即可查看。需要通过本地服务器预览时，在本目录运行：

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

## 资产边界

| 文件 | SHA-256 | 来源／用途 | 状态 |
|---|---|---|---|
| `assets/v7-approved-reference.png` | `7157484b95988b11c1abdf9ddc0d5bb7c2d3bde25dd9d2dfcf6c5ee795847b3d` | 用户已批准 V7 的本地只读副本；只校准风格连续性 | prototype-only |
| `assets/concept-a-window-table-exploration.png` | `36d9c0409ba8cf3ad2c29258be7de0289ce88ba61985e1c076d5a0cc70316e2b` | imagegen 构图／光色探索；窗边小桌 | generated exploration-only |
| `assets/concept-b-open-door-exploration.png` | `5216dc0b118860a9986f36b2f3659a18fc07b9ce28c04e7caca06787a7501efe` | imagegen 构图／光色探索；半开门廊 | generated exploration-only |

原始生成文件分别为：

- `/Users/wxl/.codex/generated_images/01a02259-fb9a-7c32-a943-30c3c5c47a30/exec-c952edf9-5b1d-4405-a719-562625b5ba29.png`
- `/Users/wxl/.codex/generated_images/01a02259-fb9a-7c32-a943-30c3c5c47a30/exec-665c4de0-fa1c-4af0-9875-e4b964d808be.png`

## 可复现的规范化探索提示词

下面保存的是本轮版本化、可复现的规范化提示词；它保留实际生成时的设计语义，但不是服务端逐字日志。提示词不使用艺术家或现成 IP 名称，生成结果一律需要人工原创重绘。

### `INDOOR-N01-A-V1 / 窗边小桌`

```text
Create one exploration-only vertical 390×844 composition for an original quiet nighttime WeChat mini game. It must feel continuous with an approved natural deep-navy outdoor night: soft gouache and dyed-paper layers, subtle grain, low saturation, no photorealism. Inside a modest room, place one normal-proportioned gender-neutral cartoon adult at lower left in three-quarter back view and one ordinary domestic cat at lower right; both quietly face a low table. Put a kettle and two plain cups on the table, with one cup able to be placed upside down for a later micro-scene. A tall window on the left reveals sparse natural stars and only one faint, broad, broken galaxy; no moon, constellation lines, neon aurora or decorative light ribbon. Keep most of the room in cool deep blue. Add one original simple wooden-arm paper-shade lamp whose small warm pool can visually move toward the kettle; the lamp is an object, not a magical character. Clear focus order: cold window night → adult and cat → kettle-side warm light. Generous negative space, readable at 25% scale, adult and cat share material and lighting. No UI, text, logo, tutorial, reward, progress, famous IP, childlike proportions, dressed or anthropomorphic cat, recognizable designer lamp, ornate themed inn, bloom, particle rain or task-map cues.
```

### `INDOOR-N01-B-V1 / 半开门廊`

```text
Create one exploration-only vertical 390×844 composition for the same original quiet nighttime WeChat mini game, using the same soft gouache and dyed-paper material, deep navy palette, normal-proportioned gender-neutral adult and ordinary domestic cat. Show the indoor room from just beyond a half-open door: a narrow slice of the approved natural outdoor night remains visible at the left doorway, while the adult and cat sit calmly near a low table with a kettle and two plain cups. The open door must feel like spatial continuity, never a glowing level entrance or call-to-action; no path light, arrow, pulse or exaggerated beam. Keep the warm kettle light small and stable, with cool outdoor air visually fading at the threshold. Use foreground doorframe and restrained depth, but keep the adult, cat and kettle readable at 25% scale. No UI, text, logo, moon, multiple galaxies, neon, magical creature, famous IP, childlike figure, dressed or anthropomorphic cat, photorealism, reward cues or task-map composition.
```

## 浏览器自检

| 证据 | SHA-256 | 结果 |
|---|---|---|
| `evidence/formal-ui-v1-desktop-full.png` | `d11f5d2efca80b6a5e1ce31bfbdfb2fecc2e0aba8720b7a3f5cd98006fad765e` | A/B、四张 390×844 UI、动效与决策包同屏 |
| `evidence/formal-ui-v1-ab-focus.png` | `d8e8c072c30b5965468bdac1e77c805d40dfdb9368783f1c94f6e21e56cc432f` | A/B 室内方向的聚焦对照 |
| `evidence/formal-ui-v1-key-screens.png` | `d3f56288818a790187916f82e4987de9dd4aea34c9e7c8342ec0fc3205b7eac0` | 推荐 A 的四张 390×844 关键屏 |
| `evidence/board-360x800.png` | `5483c4af1a11718aa4fd4859270a4f17302d96cc11e900aa8289a3edc3478fbc` | 无水平溢出 |
| `evidence/board-390x844.png` | `54a4116fe613ee5bb040c859830241f2b43c001abab14009bc99398fce7ac9db` | 无水平溢出 |
| `evidence/board-430x932.png` | `f6f5c3044b0c30fbc5670048d44aedfba9b7c0efda10099d05e9b5ccf299c9a3` | 无水平溢出 |

`HASHES.sha256` 的路径均相对本目录。三种宽度的图片加载失败均为 0；展示板中的关键 UI 按钮最小边为 44px。正式 Cocos 适配、低亮、SafeArea、大字和减动仍须在获批资产接入后复验。
