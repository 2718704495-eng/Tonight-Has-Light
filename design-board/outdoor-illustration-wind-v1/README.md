# OUTDOOR-ILLUSTRATION-WIND-V1-A 设计板

> 状态：`R2 VISUAL DIRECTION APPROVED / LOCAL DISPOSABLE COCOS AUTHORIZED / NOT FOR WECHAT UPLOAD`

## 打开方式

在项目本地静态服务器下访问：

```text
/design-board/outdoor-illustration-wind-v1/
```

## 当前交付

- `exploration/five-wind-pages-storyboard-r1.png`：R1 五幅风页探索联画，`1774×887`，SHA-256 `b27c8e8416bd89dd5ad5a34c38769d0af34e4836547b8b63d6f47cfdcf08ee8a`。
- `exploration/five-wind-pages-storyboard-r2-stronger.png`：R2 更明显五幅风页探索联画，`1774×887`，SHA-256 `a787d06f170cef4ac675e7a14287b4f8c4cfaef5414248091bfe481abdb1b811`。
- `index.html`：双常驻画面交叉淡化的原速动效板，主预览使用 R2，并保留 R1/R2 对照。
- `styles.css`：设计板样式与手机预览。
- `script.js`：F0–F4 可取消转场、自动播放、逐帧查看与减少动态示意。

## 获批合同

- 方案：`OUTDOOR-ILLUSTRATION-WIND-V1-A / 五幅风页`。
- 风序：F0 安静 → F1 远草 → F2 近草 → F3 人物 → F4 猫与余势。
- 星空、银河、小屋、门、山线与镜头保持稳定；未来正式资产只替换下景完整插画。
- 每次换页用两个预载 Sprite 做 `140ms` smoothstep 交叉淡化；不出现黑帧、白闪、空帧或整屏跳动。
- 首轮安静 `0.9s` 后开始；完整一轮结束先回到 F0，再安静 `4.5s` 复播。正式运行时可在批准范围内取 `4.5–6.5s`。
- 新输入取消并替换旧过渡；点门不得等待过渡结束。
- 减少动态停止自动换帧，只允许 `≤180ms` 透明度反馈。

## R2 改动说明

- R1 问题：变化多集中在草纹细节，手机缩略图里不够明显。
- R2 改动：F2 下半坡草浪形成更大弧线，F3 发梢和衣角更明显，F4 猫尾和耳朵更明显。
- 不变项：星空、银河、小屋、门光、山线、人物／猫坐点、两朵花、冷清舒心情绪和 `140ms` 转场合同均不变。
- 停止线：若看起来像暴风、受惊、任务路线、门在催促，R2 视为失败。

## 资产边界

联画通过内置 imagegen 生成，仅作构图、风态和转场探索。它不得进入正式 Cocos／微信包，不得用作正式人物、猫、关键互动物或发布素材。正式五幅风页仍须原创、可编辑、可追溯重绘，并登记作者、来源、授权、修改版本和 SHA-256。

## 已退回探索

- 首次联画错误生成六格，且人物／小屋锚点漂移：`FAIL / NOT COPIED INTO PROJECT`。
- 单幅 F1 编辑改变人物和小屋整体比例：`FAIL / NOT COPIED INTO PROJECT`。

当前 R2 已由用户批准进入本地可丢弃 Cocos 候选。它仍不是 Gate B/C 最终通过证据，也不是正式生产资产；微信 preview/upload、体验版、提审和发布均需要另行授权。
