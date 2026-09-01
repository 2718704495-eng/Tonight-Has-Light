# Screenshot evidence

本目录保存 `FORMAL-ENDING-UI-V1` 浏览器设计板的本地截图证据。它们只用于主任务审查，不是 Cocos／微信资产，也不代表用户已批准。

2026-08-25 14:36 左右曾用 Chrome `--window-size` 直接采集过一组错误图片：其 CSS layout viewport 仍约为 `500px`，只是把输出裁到目标像素，导致右侧界面被裁。那些文件已被同名覆盖，不计入任何响应式结论。

当前 PNG 均由 `../capture-evidence.mjs` 通过 Chrome DevTools Protocol 生成：

- `Emulation.setDeviceMetricsOverride` 强制 `innerWidth/innerHeight` 精确等于文件名尺寸；
- `viewport-metrics.json` 记录每张图的 CSS viewport、VisualViewport、文档尺寸、横向溢出与减动媒体状态；
- `a-ending-reduced-390x844.png` 额外使用 `Emulation.setEmulatedMedia` 强制 `prefers-reduced-motion: reduce`；
- `a-ending-430x844-pressure.png` 与 `b-large-430x844-pressure.png` 是宽而矮的压力尺寸；
- 脚本在尺寸不等、横向溢出或减动状态不符时直接失败，不写成通过证据。

目录上级的 `HASHES.sha256` 覆盖设计源文件、采证脚本、metrics 和当前 PNG；该索引明确不包含自身哈希。
