# STORY-ILLUSTRATION-REDESIGN-V1-B local motion proof

Status: `LOCAL BROWSER MOTION PASS / AUDIO HUMAN-GESTURE BLOCKED / FORMAL ART BLOCKED / prototype-only / DISPOSABLE / DO NOT COCOS / NO UPLOAD`.

This browser-only sample validates the user-approved B three-beat story and transition rhythm:

1. B01 rests for 3.2 seconds.
2. A 300ms ink-and-grass-line reveal moves to B02.
3. B02 holds for 1.5 seconds.
4. A 360ms grass-band reveal moves to B03.
5. B03 rests indefinitely; there is no automatic loop or automatic room entry.

The outdoor PNGs are the user-approved KF-R1 ImageGen exploration references. The indoor PNG is the approved `FORMAL-UI-V1.2-A` exploration reference. They are used here only to judge story timing and must not be copied into Cocos, a WeChat package, an experience build, review submission, or release.

The door is available from the first frame and immediately cancels any in-progress transition. The room transition is a local interaction proof only. First touch unlocks the existing wind sample. A slow horizontal swipe replays from B01 while vertical page scrolling remains available. Reduced motion fixes B01, removes transform motion, and keeps room entry to an opacity transition no longer than 160ms.

Run locally from the repository root:

```bash
npm run preview
```

Open:

```text
http://127.0.0.1:4173/prototype/story-illustration-v1-b-motion-preview/
```

Verify:

```bash
npm run verify:story-motion
```

Verification on 2026-08-28:

- `15/15` model and contract tests passed.
- The timeline boundary set contains no missing image, empty frame, black frame, or white flash.
- Browser checks passed at `360×800`, `390×844`, `430×932`; no horizontal overflow was observed.
- Clicking the door during either transition cancels the outdoor sequence and reaches the bright-room proof.
- Reduced motion stays on B01 and does not run the two outdoor reveal transitions.
- The in-page reduced-motion control applies `160ms` room opacity and removes room transform motion; the real browser computed style was `0.16s, 0.16s` and `transform: none`.
- The scene reserves horizontal gestures for replay with `touch-action: pan-y`, while vertical page scrolling remains available.
- Browser console error count was `0`.
- Automated browser input could not satisfy the browser's trusted user-gesture requirement for audio playback, so this proof does not claim audio playback PASS. A person must tap the scene once to check the wind sample.

No Cocos code, WeChat build, upload, review submission, publication, Git commit, or push is authorized by this artifact.
