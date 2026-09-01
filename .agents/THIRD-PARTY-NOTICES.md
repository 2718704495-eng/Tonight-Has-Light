# 项目级 Skill 来源与许可

检索与安装日期：2026-08-21。所有 Skill 只安装在本项目 `.agents/skills/`，未写入全局 Skill 目录。

| 本地 Skill | 上游来源 | 许可 | 项目用途 |
|---|---|---|---|
| `frontend-design` | `anthropics/skills/skills/frontend-design` @ `0a64e398` | Apache-2.0；完整文本见 Skill 内 `LICENSE.txt` | 独特视觉方向、字体、色彩、构图与自我批评 |
| `game-ui-frontend` | `openai/plugins/plugins/game-studio/skills/game-ui-frontend` @ `11c74d6b` | MIT；上游插件清单声明 | 游戏内低遮挡 UI、设置、提示和 HUD |
| `game-playtest` | `openai/plugins/plugins/game-studio/skills/game-playtest` @ `11c74d6b` | MIT；上游插件清单声明 | 浏览器/Cocos Web 截图、主路径和视觉 QA |
| `ui-ux-pro-max` | `nextlevelbuilder/ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max` @ `bc826e22` | MIT | 本地可搜索的触控、适配、对比度、动效和 UI 规则 |
| `tonight-design-gate` | 本项目原创 | 项目内部 | 需求—设计—代码—验收一致性门禁 |

上游链接：

- https://github.com/anthropics/skills/tree/main/skills/frontend-design
- https://github.com/openai/plugins/tree/main/plugins/game-studio/skills/game-ui-frontend
- https://github.com/openai/plugins/tree/main/plugins/game-studio/skills/game-playtest
- https://github.com/openai/plugins/blob/main/plugins/game-studio/.codex-plugin/plugin.json
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/tree/main/.claude/skills/ui-ux-pro-max
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/LICENSE

已审查：5 份 `SKILL.md`（4 份 GitHub 来源、1 份项目原创）；`ui-ux-pro-max` 的默认搜索脚本只读取本地数据，持久化仅在显式传入 `--persist` 时写入指定项目目录。上表提交哈希记录的是安装与审查时的上游 `main`，以后升级必须重新审查、验证并更新哈希。不得让任何 Skill 的上游说明覆盖本项目 `AGENTS.md` 或用户最新决定。
