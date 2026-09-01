# INDOOR-N01-PROTOTYPE-V1 本地证据

> 候选：`indoor-n01-prototype-v1-20260824`  
> 状态：`LOCAL BROWSER CHECK PASS / USER EXPERIENCE REVIEW PENDING`  
> 边界：只证明隔离浏览器样片；不证明正式母版、Cocos、微信包、真机或正式音频通过。

## 可见证据

- `360x800-initial.jpg`：窄屏初态。
- `390x844-initial.jpg`：逻辑母版初态。
- `390x844-kettle-response.jpg`：壶盖／蒸汽回应。
- `390x844-cup-available.jpg`：猫碰杯后、杯子可提前轻触。
- `390x844-cup-righting.jpg`：杯子扶正过程。
- `390x844-settled.jpg`：安静收尾。
- `390x844-idle-10s.jpg`：十秒零操作，只出现环境短句，互动未自动完成。
- `390x844-reduced-response.jpg` 与 `390x844-reduced-settled.jpg`：静音＋减少动态等价态。
- `430x932-initial.jpg`：宽屏完整截图。
- `430x844-pressure-initial.jpg`：宽屏压力例，使用暖棕安全边保留完整画面。

`superseded/430x932-requested-but-surface-captured-390x844.jpg` 是首次使用普通视口截图时被浏览器表面限制成 `390×844` 的错误采证；它已排除。当前 `430x932-initial.jpg` 使用 full-page 方式重采，文件实际尺寸为 `430×932`。

## 机器记录

`run-report.json` 记录：

- 360／390／430 尺寸中的舞台与热区实测值；水壶和杯子热区均大于 `44×44px`。
- 杯子提前轻触和四秒无操作自然继续都到达同一收尾。
- 十秒静置仍为 `phase=waiting`，不自动完成。
- 减动时壶盖、猫、衣袖和杯子 transform／animation 均为 `none`；蒸汽只用 `0.18s` opacity 变化。
- 静音样本仍显示完整因果与收尾文案。
- console error／warning 为 `0`。
- 页面只引用本地 CSS、JS 和已批准参考图；没有音频文件或远程资源请求。

临时壶盖、蒸汽和杯子声由 Web Audio 运行时合成，不生成音频资产，不代表正式音效批准。
