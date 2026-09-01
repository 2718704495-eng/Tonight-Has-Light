# Cocos Creator 3.8.8 首次导入检查

此目录已经采用本机 Cocos Creator 3.8.8 的 `empty-2d` 工程格式，并提供可直接运行的 `assets/scenes/main.scene`：Canvas、Camera、GameRoot 和 `TonightHasLightBootstrap` 组件已经随工程提交。`TonightHasLightBootstrap` 会在运行时挂载 `TonightHasLightV0View`，用 Graphics、Label 与 UITransform 绘制“月光灯箱”第一夜完整可见流程，不需要在编辑器中手工接 UI 节点。

## 首次打开

1. 使用 Cocos Creator 3.8.8 打开 `cocos-project`，等待 `library/` 与 `temp/` 完成生成。
2. 打开 `assets/scenes/main.scene`，确认 Canvas 设计分辨率为 `390 × 844`，Canvas 下存在 `GameRoot`。
3. 确认 `GameRoot` 上挂载 `TonightHasLightBootstrap`，脚本引用没有 Missing。
4. 确认 `main.scene` 为启动场景；构建方向选择竖屏。
5. 运行预览后应直接看到“今夜有灯 / 第一夜 · 水快开了”，并可依次完成时长选择、首次触碰、拖光或点壶、杯子小剧场与双按钮收尾。
6. UI 层只通过 `send(command)` 驱动状态；Graphics 仅负责表现，状态机仍是行为真源。

## 微信小游戏构建

- 构建平台选择“微信小游戏”，不要在工程中保存 AppSecret。
- 第一夜与公共代码留在主包；`night-02` 至 `night-05` 已配置为四个 Asset Bundle，并在小游戏平台使用 `subpackage`。
- AppID、体验版上传和审核均是外部操作，本工程未填写或执行。
- 首次构建前，在当前 AppID 后台重新确认包体上限，并检查构建面板中四个夜晚仍显示为分包。

## 生命周期与恢复

- `Game.EVENT_HIDE` 会保存最近安全节点并暂停活跃时长。
- `Game.EVENT_SHOW` 仅自动恢复由后台导致的暂停；手动暂停不会自动关闭。
- 拖拽中退后台会回到 `room-ready`，核心动作重新开始；核心完成后的小剧场若被中断，会按“已跳过”进入安静停留，不撤销完成状态。
- 损坏存档会重建线性进度；只有三个布尔设置完整可验证时才予以保留。

## 验证

在 Node.js 24 和本机 Creator 3.8.8 已安装的环境中运行：

```bash
npm run verify
```

可用无界面命令验证真实 Cocos Web Mobile 构建：

```bash
/Applications/CocosCreator.app/Contents/MacOS/CocosCreator \
  --project /absolute/path/to/cocos-project \
  --build "platform=web-mobile;debug=true;md5Cache=false"
```

Creator 3.8.8 的 CLI 在当前机器上可能以退出码 36 结束；应同时核对构建日志出现 `build Task (web-mobile) Finished`、产物目录已刷新，并进行浏览器运行时冒烟。工程已经显式启用 `graphics` 2D 子模块；关闭它会造成构建通过但 Graphics assembler 在运行时为空。

当前 V0 已接入项目原创的 24 秒环境声候选：只在首次触碰触发后由 `AudioSource` 循环播放，并用 2.5 秒平滑渐入；静音、前后台暂停恢复和加载失败静默降级均已接好。该素材仍为 `draft`，耳机、手机外放、微信真机与目标用户听感未验收，不应视为发布批准。此工程不会自动启动 GUI、上传体验版或提交代码。
