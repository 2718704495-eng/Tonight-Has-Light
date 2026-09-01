# OUTDOOR-ILLUSTRATION-WIND-V1-A-R2 Stronger Wind Pages

Status: `VISUAL DIRECTION APPROVED / LOCAL COCOS IMPLEMENTATION AUTHORIZED / PROTOTYPE ASSET ONLY / NO WECHAT`

Date: 2026-08-27

Detailed amplitude and stop-line brief: [`OUTDOOR-ILLUSTRATION-WIND-V1-A R2 可见度修订`](./OUTDOOR-ILLUSTRATION-WIND-V1-A-R2-VISUAL-REVISION.md).

## User Feedback

R1 showed the approved five-page illustration approach, but the visible change was still too small on phone scale. The main issue was that most of the difference sat in fine grass texture, so the user could not feel a larger page-to-page change.

## Research And Design Rule

For phone-sized visual states, the important difference must be readable by silhouette and broad shape, not only by texture detail. This R2 therefore enlarges lower-half shape changes while preserving the approved upper scene and emotional tone.

## Versioned Prompt

Prompt ID: `OUTDOOR-ILLUSTRATION-WIND-V1-A-R2-STRONGER-WIND-PROMPT`

Source image: `design-board/outdoor-illustration-wind-v1/exploration/five-wind-pages-storyboard-r1.png`

Generated exploration: `design-board/outdoor-illustration-wind-v1/exploration/five-wind-pages-storyboard-r2-stronger.png`

Generated exploration SHA-256: `a787d06f170cef4ac675e7a14287b4f8c4cfaef5414248091bfe481abdb1b811`

Dimensions: `1774x887`

## Changed In R2

- F2 foreground grass now forms a broad visible curved wave across the lower third.
- F3 adult hair silhouette and sweater hem are more clearly swept by wind while the seated body anchor stays fixed.
- F4 cat tail arcs outward/up more clearly, with subtle ear response while the cat remains calm and seated.
- 25% thumbnail target is raised: F0, F2 and F4 should be distinguishable without reading labels.

## Must Remain Unchanged

- Natural deep blue sky, single faint broken Milky Way, right-mid cottage, stable door light, mountains and camera framing.
- Adult and cat identity, sitting positions, calm mood and shared skyward gaze.
- Two weak glowing flowers near the pair.
- No task-map marks, arrows, star trails, extra objects, storm cues, startled body language or pulsing door.
- Transition contract remains `140ms smoothstep` crossfade with cancellation cleanup.

## Cost And Risk

- Runtime cost remains one preloaded five-frame contact sheet in the browser board. If approved for Cocos later, implementation may use five full outdoor illustration states with two resident sprites for crossfade.
- R2 is still imagegen exploration and is not a production asset. Formal Cocos or WeChat usage still requires original editable layered artwork and an asset record.
- Visual risk is stronger lower-scene movement. Stop if users read it as storm, panic, task progress, or a different scene.
- The current contact sheet still contains panel divider lines and does not prove pixel-identical upper-scene locking. The browser board is only for judging amplitude and transition feel; the formal handoff must use one stable upper layer plus five anchor-locked lower illustrations.

## Approval And Stop Line

The user approved this exact R2 direction on 2026-08-27. The approval record is [`OUTDOOR-ILLUSTRATION-WIND-V1-A-R2-APPROVAL`](./OUTDOOR-ILLUSTRATION-WIND-V1-A-R2-APPROVAL.md). Local disposable Cocos implementation and Web evidence are now authorized. The exploration contact sheet itself is still not a production asset: implementation must remove panel dividers, keep one stable upper scene, and use five anchor-locked lower states. WeChat preview/upload, experience-version changes, review, release and Git operations remain unauthorized.
