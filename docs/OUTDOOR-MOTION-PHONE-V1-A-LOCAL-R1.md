# OUTDOOR-MOTION-PHONE-V1-A local r1

> Date: 2026-08-26  
> Candidate: `outdoor-motion-phone-v1-a-local-r1`  
> Status: `LOCAL MECHANICAL PASS / FRONT-SURFACE OBSERVED / WECHAT PHONE VISUAL PENDING / NOT UPLOADED / NOT RELEASED`

## Scope

This candidate implements the user-approved `OUTDOOR-MOTION-PHONE-V1-A / 可感知微风`.

Changed:

- Local wind peaks: `2.2 / 3.6 / 3.8 / 4.2 / 4.5 / 6.5` degrees.
- Breath scale: human `0.6%`, cat `0.7%`.
- First touch starts one visual wind chain when no approved automatic wind is already active.
- A manual/first-touch wind defers the next automatic gust without resetting runtime time.
- Quiet gaps: first recurring gust `8-12s` after the previous wind ends; later gaps `9-14s`.
- Web evidence now uses the same first-touch fallback shape as runtime input, plus stable keyframe candidates checked against the approved clean plate.

Unchanged:

- V7 composition, characters, material, palette, galaxy, house, flowers and door level.
- Indoor warm-room prototype boundary, N01 kettle/cup flow and approved ending UI.
- Audio first-touch gate.
- Reduced motion: all wind, breath and cloud transforms stay at `0`.
- No camera shake, whole-screen shake, galaxy/house/horizon movement, particles, Bloom, 3D light or new task UI.

## Evidence

- Web build: `cocos-project/build/outdoor-motion-phone-v1-a-local-r1-web/web-mobile/index.html`.
- WeChat local build: `cocos-project/build/outdoor-motion-phone-v1-a-local-r1-wechat/wechatgame/`.
- Evidence folder: `/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/outdoor-motion-phone-v1-a-local-r1-stable-capture/`.
- Report SHA-256: `e97215e41ea37411845433909236d2e0f0e3f8258e5bb6544cc68f971ab77fb8`.
- Evidence script SHA-256: `3abed5116bba2688b76a8fca6c919d97b6d2b7e9b499ecb65db10fff6ebcff94`.
- Web `index.html` SHA-256: `4e3989aa1ff33d329f8f1a0c2899f61684d28b93a6a27a1b56175dfa9bdc0a4e`.
- WeChat `assets/main/index.js` SHA-256: `305897cdc0c0f95cff23fe2afc0fd8fef9284f1d05cd30cf95e993f76b9c28b9`.
- WeChat local build size: about `4,856 KB`, `165` files.

Key report results:

- 36.633s Web sample captured four wind intervals: about `0.77-4.72s`, `6.27-10.22s`, `20.02-23.97s`, and `34.47-36.55s`.
- First touch at about `6.2s` unlocked audio and started the ambient channel; the first-touch visual wind exposed all six channels.
- Maximum observed wind quiet gap was about `10.50s`, below the `14s` local evidence limit.
- All six first-touch channels reached expected activity: far grass `0.999`, near grass `0.999`, human hair `0.997`, human hem `0.999`, cat ears `0.996`, cat tail `0.999`.
- Scene graph invariants at 5s and 10s passed: `OutdoorScene` and `scene_clean_plate` stayed centered, unscaled and unrotated.
- Encoded Web video structure scan was clear (`artifactFrameCount=0`), but visual PASS is still not claimed without human/device review.
- Reduced-motion touch sample kept `maximumTransformMotion = 0`.
- `360x800`, `390x844`, and `430x932` mounted with `30` outdoor sprites and no recorded page/network errors.

Validation:

- `node --check scripts/validate-outdoor-motion-phone-v1-a-web.mjs`: passed.
- `node scripts/validate-outdoor-motion-phone-v1-a-web.mjs build/outdoor-motion-phone-v1-a-local-r1-web .../outdoor-motion-phone-v1-a-local-r1-stable-capture`: `EVIDENCE_CAPTURED`, issues `[]`.
- `npm run verify`: `104/104` tests passed.
- Cocos Web build reached `build Task (web-mobile) Finished`.
- Cocos WeChat local build reached `build Task (wechatgame) Finished`; no upload was attempted.
- Independent final source/build/evidence review found no local P0/P1 blocker; it kept WeChat phone visual acceptance as `PENDING`.

## Release boundary

This candidate has not been uploaded to WeChat, set as an experience version, submitted for review, released, committed or pushed. Any upload, preview, version, review, release or remote operation still requires separate user authorization.

Current evidence is local Web/build evidence plus front-surface browser observation. It does not replace WeChat phone visual confirmation, low-brightness OLED/LCD checks, lifecycle checks, 10-minute soak or formal Gate E participant testing.
