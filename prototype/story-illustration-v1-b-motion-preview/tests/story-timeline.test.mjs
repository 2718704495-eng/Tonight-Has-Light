import assert from "node:assert/strict";
import test from "node:test";

import {
  STORY_TIMING,
  createStoryPlayback,
  snapshotAt,
} from "../story-timeline.mjs";

test("zero-input playback follows the approved three-beat timing", () => {
  assert.deepEqual(snapshotAt(0), {
    phase: "settle",
    from: 0,
    to: 0,
    progress: 0,
    resting: true,
  });
  assert.equal(snapshotAt(STORY_TIMING.settleHold - 1).phase, "settle");

  const firstMid = snapshotAt(STORY_TIMING.settleHold + STORY_TIMING.firstTransition / 2);
  assert.equal(firstMid.phase, "to-wind");
  assert.equal(firstMid.from, 0);
  assert.equal(firstMid.to, 1);
  assert.ok(firstMid.progress > 0 && firstMid.progress < 1);

  const windStart = STORY_TIMING.settleHold + STORY_TIMING.firstTransition;
  assert.equal(snapshotAt(windStart).phase, "wind");
  assert.equal(snapshotAt(windStart + STORY_TIMING.windHold - 1).phase, "wind");

  const secondMid = snapshotAt(
    windStart + STORY_TIMING.windHold + STORY_TIMING.secondTransition / 2,
  );
  assert.equal(secondMid.phase, "to-afterwind");
  assert.equal(secondMid.from, 1);
  assert.equal(secondMid.to, 2);
  assert.ok(secondMid.progress > 0 && secondMid.progress < 1);

  const afterwindStart =
    windStart + STORY_TIMING.windHold + STORY_TIMING.secondTransition;
  assert.deepEqual(snapshotAt(afterwindStart + 60_000), {
    phase: "afterwind",
    from: 2,
    to: 2,
    progress: 0,
    resting: true,
  });
});

test("reduced motion remains on the neutral settle frame", () => {
  assert.deepEqual(snapshotAt(100_000, { reducedMotion: true }), {
    phase: "settle",
    from: 0,
    to: 0,
    progress: 0,
    resting: true,
  });
});

test("door cancellation wins and prevents late transitions", () => {
  const playback = createStoryPlayback({ startedAt: 1_000 });
  assert.equal(playback.snapshot(4_400).phase, "to-wind");
  playback.cancel("door");
  assert.deepEqual(playback.snapshot(90_000), {
    phase: "cancelled",
    from: 0,
    to: 0,
    progress: 0,
    resting: true,
    reason: "door",
  });
});

test("slow swipe replay resets the clock to B01", () => {
  const playback = createStoryPlayback({ startedAt: 0 });
  assert.equal(playback.snapshot(10_000).phase, "afterwind");
  playback.replay(12_000);
  assert.equal(playback.snapshot(12_000).phase, "settle");
  assert.equal(playback.snapshot(15_199).phase, "settle");
  assert.equal(playback.snapshot(15_200).phase, "to-wind");
});

