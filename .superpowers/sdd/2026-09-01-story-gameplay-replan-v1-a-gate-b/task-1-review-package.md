# Task 1 Review Package

## Scope

All files in `design-board/story-gameplay-replan-v1-a-r2/` are new in Task 1. Because `/Users/wxl/Desktop/小程序` is not a Git repository, there is no base/head commit diff. Treat every listed file below as the complete added-file diff and read it in full. Do not inspect or modify unrelated files.

## Frozen added files

```text
ab236f3b9d1ba740585dd901fb7993c6e74c30d2ad2cca7f9636d05ca41f020d  README.md
d16829834a1f59aae03fcdaf60c380059893adfbf8f381b26487a6ccb41fe400  storyboard-project/bible/character_bible.md
228e7cb74afe6e972d3e97da466a13b3025b4d5ebace6c6752931f06b6d7e839  storyboard-project/bible/continuity_rules.md
3fcdd5baf67e9ac47aeb5ae3ce21fef4ced04a965dcdfd9bcf49ee2acd98eb77  storyboard-project/bible/visual_style_bible.md
f37d73f7dfe3b43b0729a70dec7ba63248993562df0059638a948004e625469d  storyboard-project/reviews/gate_b_checklist.md
556bf992d863514e9ea6b64fe4c5f2f06bef040799d168074caa4a4a08e1c1ee  storyboard-project/scenes/evening_session.yaml
cb5274ce58a32d8c5e5d79e8e8ea0b39e58210f7f875bf3262730ad5aa5b1ae8  storyboard-project/shots/story_nodes.yaml
1a8510e8cf0e95b7ce08847b5a880b9d257c70104e99b4f2a88d6caa08ca63ff  tests/storyboard-contract.test.mjs
```

Package root: `/Users/wxl/Desktop/小程序/design-board/story-gameplay-replan-v1-a-r2`

## Boundary checks

- Approved R1 HTML remains SHA-256 `760a0cba95d715c97cc3814b58be7206bf89727bb221036fec7e39f0fe554836`.
- No Cocos, build, WeChat, Git or remote operation occurred.
- Implementer report: `/Users/wxl/Desktop/小程序/.superpowers/sdd/2026-09-01-story-gameplay-replan-v1-a-gate-b/task-1-report.md`.
- Task brief: `/Users/wxl/Desktop/小程序/.superpowers/sdd/2026-09-01-story-gameplay-replan-v1-a-gate-b/task-1-brief.md`.

## Fix round 1 scope

- Open finding: direct-home meteor observation vantage appeared to contradict the one physical outdoor meteor source.
- Changed files: `continuity_rules.md`, `story_nodes.yaml`, `storyboard-contract.test.mjs`, and the derived `HASHES.sha256`.
- Required re-review: confirm the finding is addressed and that the fix introduces no new breakage in these files.

## Fix round 2 scope

- Remaining finding: the shared final node carried a direct-home-only mutation and the first regression test did not model the two routes.
- Changed files: `story_nodes.yaml`, `storyboard-contract.test.mjs`, and the derived `HASHES.sha256`.
- Intended result: `DOOR_MATCH_CUT` sets window only from `none`, preserves `outside`, and `LEAVE_THE_LIGHT` only preserves the incoming value.
