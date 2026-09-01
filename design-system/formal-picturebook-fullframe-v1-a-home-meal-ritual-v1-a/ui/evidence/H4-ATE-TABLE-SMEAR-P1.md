# H4 ate/both 第三轮复核

状态：`RESOLVED / HISTORICAL P1 / SUPERSEDED INPUTS`。

> 本文件记录被拦截的历史失败，不描述当前候选。当前唯一候选与最终 UI 证据见 `README.md`、`build-report.json` 和 `OWNER-UI-REVIEW.md`。

复现：以 100% 查看：

- `pages/scene_01_home_shot_004/exports/states/scene_01_home_shot_004-ate-390x844.png`
- `pages/scene_01_home_shot_004/exports/states/scene_01_home_shot_004-both-390x844.png`

在原筷子位置约 `x=128–255, y=443–497` 可见宽大的棕色模糊矩形／擦除带。它横跨木桌纹理并延伸到盘子左下方，和 clean plate 的细颗粒、干笔墨线、桌板明暗方向不一致；用户会先看见修补痕迹，而不是“菜少了一点”。

身份：

- `ate.svg` SHA-256 `8de5c1260611879b15d7d226fb4f70e06f46d47ebe46f9cb47955a295913d183`
- `ate-layer-390x844.png` SHA-256 `bb18ee91fb8f43737a439d921ffa0befb9d80a10041cd148c294b816ff0c439c`
- `ate state` SHA-256 `5da6b5295a21db26463bee4c61cdb25dbc1b36e7bdedea43ea7c5c3e62b1aea1`
- `both state` SHA-256 `4d5af8519961ee0d6465a29b561d901e3e3e895b8ea32956303713c47bbbf48b`

关闭条件：只在原筷子细窄轮廓范围内修复，补回连续的同桌木纹、颗粒与光向；100% 和 195×422 均无规则矩形、色带、模糊块或第二双筷子，再重新生成 UI standard／120%／reduced／四尺寸证据。

## 第四轮增量复核

第四轮 `ate` SHA-256 `bde769f65987933403502a6cb00bfbe2995cd0119233aa876b16157364d79054`，`both` SHA-256 `a1efaaef7f25a29157da9508b29bc73ec0f7070c18c6392c34c8069c473e9b87`。规则矩形边界有所弱化，但 `x=132–267, y=430–502` 仍形成大块高亮金棕涂抹，像桌面洒汁或修补斑，木纹方向与 clean plate 不连续；100% 裸眼依旧先看到补丁。结论保持 `FAIL / P1`。

## 第五轮增量复核

第五轮 `ate` SHA-256 `dc2f6a25c8789cb4df29ee8dc7a2c99f4904115c77f04d8e4e82e4a8f194fe1e`，`both` SHA-256 `7d39c50f330561b660d242841a1fe636df0787080ab23305a81071b5184f137b`。桌面大涂抹已经消失，但原桌面筷子 `x=140–250, y=462–476` 与新盘沿筷子 `x=170–273, y=440–459` 同时存在，重新读成两双筷子。结论仍为 `FAIL / P1`。

## 最终关闭

最终裁决保留同一双筷子的桌面手柄，只让右端连续搭到盘沿；不擦除桌纹，不复制整双。当前 `ate` 为 `0a356ea97cc91afecc93c8c9a607583d63a40db0a6e0226ec224be4a47a450b5`，`both` 为 `69a9ab2b2982cd83beec6430c9684940f2b9924c5a15beb29615eeaaf722a530`。负责人和独立复核确认 100% 与缩略图无棕色补丁、突兀白杯或重复筷子；本 UI 支线随后重生成全部最终证据。
