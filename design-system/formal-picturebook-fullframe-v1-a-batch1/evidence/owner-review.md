# Batch 1 Owner Review

> Date: 2026-08-30  
> Candidate: `formal-picturebook-fullframe-v1-a-batch1-r2-r4-root`  
> Status: `ROOT APPROVED / STARGAZE + HOME AWAITING USER / NOT IN COCOS / NOT IN WECHAT / NO GIT`

## Scope

This review covers only the three Batch 1 full-frame clean plates: `root_night_slope_v1`, `scene_02_stargaze_shot_005`, and `scene_01_home_shot_005`.

Chinese text, UI, hotspots, the finale meteor effect, Cocos integration, WeChat upload and Git operations are outside this approval.

## Findings

| Page | Result | Notes |
|---|---|---|
| `root_night_slope_v1` | `PASS / previously user-approved` | Frozen R4 source hash matches `41599f...cdc8`; Batch 1 only references review exports. |
| `scene_02_stargaze_shot_005` | `PASS_WITH_P2_NOTES` | Sky is the first subject, adult and cat are small at the bottom, one broad broken galaxy is present, right house and two flowers stay quiet, and no meteor/UI/text is baked in. P2: important-star count is visually subdued and should be watched during user review. |
| `scene_01_home_shot_005` | `PASS_WITH_P2_NOTES` | The page reads as a bright home with dinner prepared, not a dark reveal or party. Adult-left/cat-right identity remains readable. P2: bottom-right cushion and floor shadows are deep but not black-corner failures. |

## Stop-Line Check

- No unapproved extra pages were generated.
- Root R4 was not rewritten.
- The original three-up board referenced the earlier R1 root export and was `DRIFT / DO NOT USE FOR CURRENT APPROVAL`; the current standard boards use byte-identical approved R4 exports and label every page in Chinese outside the clean plates.
- Stargaze F5 used one targeted repair; no more repair attempts remain for this page.
- Home F5 used one targeted repair; no more repair attempts remain for this page.
- No Cocos, build, WeChat, release or Git permission is granted by this batch.

## Current Decision

The approved R4 root can remain the root-page Gate B baseline. Only stargaze F5 and home F5 still need user visual approval of the same files and hashes. The complete batch must not be marked `PASS` or consumed by runtime code before that approval and a fresh read-only review of the current frozen package.
