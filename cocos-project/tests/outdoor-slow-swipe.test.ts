import test from "node:test";
import assert from "node:assert/strict";
import {
  OUTDOOR_SLOW_SWIPE_CONTRACT,
  classifyOutdoorSlowSwipe,
  type OutdoorSlowSwipeCandidate,
} from "../assets/scripts/cocos/outdoor-gate-c/outdoor-slow-swipe.ts";

function candidate(
  overrides: Partial<OutdoorSlowSwipeCandidate> = {},
): OutdoorSlowSwipeCandidate {
  return {
    deltaX: 64,
    deltaY: 6,
    maxAbsVerticalDisplacementPx: 8,
    durationMs: 420,
    maxSegmentSpeedPxPerSecond: 210,
    nowMs: 10_000,
    lastAcceptedAtMs: null,
    windActive: false,
    ...overrides,
  };
}

test("accepts only slow, clearly horizontal swipes and preserves direction", () => {
  assert.deepEqual(classifyOutdoorSlowSwipe(candidate()), {
    accepted: true,
    direction: "right",
  });
  assert.deepEqual(classifyOutdoorSlowSwipe(candidate({ deltaX: -64 })), {
    accepted: true,
    direction: "left",
  });

  assert.equal(
    classifyOutdoorSlowSwipe(candidate({ deltaX: 40 })).accepted,
    false,
    "short movement must not trigger wind",
  );
  assert.deepEqual(
    classifyOutdoorSlowSwipe(candidate({
      deltaX: 60,
      deltaY: 48,
      maxAbsVerticalDisplacementPx: 52,
    })),
    { accepted: false, reason: "not-horizontal" },
  );
});

test("rejects quick flicks even if the user pauses before the final sample", () => {
  assert.deepEqual(
    classifyOutdoorSlowSwipe(candidate({ durationMs: 100, maxSegmentSpeedPxPerSecond: 640 })),
    { accepted: false, reason: "too-short" },
  );
  assert.deepEqual(
    classifyOutdoorSlowSwipe(candidate({
      durationMs: 800,
      maxSegmentSpeedPxPerSecond: 640,
    })),
    { accepted: false, reason: "too-fast" },
  );
});

test("enforces cooldown and rejects a second wind while one is active", () => {
  assert.deepEqual(
    classifyOutdoorSlowSwipe(candidate({ windActive: true })),
    { accepted: false, reason: "active" },
  );
  assert.deepEqual(
    classifyOutdoorSlowSwipe(candidate({
      lastAcceptedAtMs: 10_000 - OUTDOOR_SLOW_SWIPE_CONTRACT.cooldownMs + 1,
    })),
    { accepted: false, reason: "cooldown" },
  );
  assert.equal(
    classifyOutdoorSlowSwipe(candidate({
      lastAcceptedAtMs: 10_000 - OUTDOOR_SLOW_SWIPE_CONTRACT.cooldownMs,
    })).accepted,
    true,
  );
});
