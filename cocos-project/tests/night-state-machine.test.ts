import test from "node:test";
import assert from "node:assert/strict";
import {
  createNightSession,
  createRecentCheckpoint,
  transitionNightSession,
  type NightCommand,
  type NightSessionState,
} from "../assets/scripts/core/night-state-machine.ts";

function send(
  state: NightSessionState,
  command: NightCommand,
  nowMs: number,
): ReturnType<typeof transitionNightSession> {
  return transitionNightSession(state, command, nowMs);
}

test("supports the complete first-night ritual without failure pressure", () => {
  let state = createNightSession("night-01", 0);

  state = send(state, { type: "OPEN_NIGHT" }, 0).state;
  state = send(state, { type: "SELECT_DURATION", durationMinutes: 5 }, 1_000).state;
  assert.equal(state.phase, "exploring");
  assert.equal(state.safeCheckpoint, "room-ready");

  state = send(state, { type: "COMPLETE_AMBIENT", interactionId: "wipe-window-mist" }, 2_000).state;
  state = send(state, { type: "BEGIN_CORE_DRAG" }, 3_000).state;
  state = send(state, { type: "DROP_CORE", targetHit: false }, 4_000).state;
  assert.equal(state.phase, "exploring");
  assert.equal(state.coreCompleted, false);

  state = send(state, { type: "BEGIN_CORE_DRAG" }, 5_000).state;
  const completedCore = send(state, { type: "DROP_CORE", targetHit: true }, 6_000);
  state = completedCore.state;
  assert.equal(state.phase, "micro-scene");
  assert.equal(state.coreCompleted, true);
  assert.deepEqual(completedCore.effects, [
    { type: "NIGHT_COMPLETED", nightId: "night-01" },
    { type: "PLAY_MICRO_SCENE" },
  ]);

  state = send(state, { type: "SKIP_MICRO_SCENE" }, 7_000).state;
  state = send(state, { type: "REQUEST_END" }, 8_000).state;
  assert.equal(state.phase, "ending");

  const finished = send(state, { type: "FINISH_NIGHT" }, 9_000);
  assert.equal(finished.state.phase, "finished");
  assert.deepEqual(finished.effects, []);
});

test("uses duration only for a hidden ending prompt and still allows an early ending", () => {
  let state = createNightSession("night-01", 0);
  state = send(state, { type: "OPEN_NIGHT" }, 0).state;
  state = send(state, { type: "SELECT_DURATION", durationMinutes: 3 }, 1_000).state;
  state = send(state, { type: "COMPLETE_CORE_WITH_TAP" }, 2_000).state;
  state = send(state, { type: "COMPLETE_MICRO_SCENE" }, 3_000).state;

  const before = send(state, { type: "TICK" }, 180_999);
  assert.equal(before.state.endingPromptAvailable, false);
  assert.deepEqual(before.effects, []);

  const eligible = send(before.state, { type: "TICK" }, 181_000);
  assert.equal(eligible.state.endingPromptAvailable, true);
  assert.deepEqual(eligible.effects, [{ type: "SHOW_ENDING_PROMPT" }]);

  const earlyEnd = send(state, { type: "REQUEST_END" }, 4_000);
  assert.equal(earlyEnd.state.phase, "ending");
});

test("staying a while dismisses the ending and waits one chosen duration before offering it again", () => {
  for (const durationMinutes of [3, 5, 8] as const) {
    let state = createNightSession("night-01", 0);
    state = send(state, { type: "OPEN_NIGHT" }, 0).state;
    state = send(state, { type: "SELECT_DURATION", durationMinutes }, 1_000).state;
    state = send(state, { type: "COMPLETE_CORE_WITH_TAP" }, 2_000).state;
    state = send(state, { type: "COMPLETE_MICRO_SCENE" }, 3_000).state;
    const firstEligibleAt = 1_000 + durationMinutes * 60_000;
    state = send(state, { type: "TICK" }, firstEligibleAt).state;
    state = send(state, { type: "REQUEST_END" }, firstEligibleAt + 1_000).state;

    const stayStartedAt = firstEligibleAt + 2_000;
    state = send(state, { type: "STAY_A_WHILE" }, stayStartedAt).state;
    assert.equal(state.phase, "quiet-stay");
    assert.equal(state.endingPromptAvailable, false);
    assert.equal(state.activeElapsedMs, 0);

    const before = send(
      state,
      { type: "TICK" },
      stayStartedAt + durationMinutes * 60_000 - 1,
    );
    assert.equal(before.state.endingPromptAvailable, false);
    assert.deepEqual(before.effects, []);

    const eligibleAgain = send(
      before.state,
      { type: "TICK" },
      stayStartedAt + durationMinutes * 60_000,
    );
    assert.equal(eligibleAgain.state.endingPromptAvailable, true);
    assert.deepEqual(eligibleAgain.effects, [{ type: "SHOW_ENDING_PROMPT" }]);
  }
});

test("a stayed-awhile reminder keeps its remaining time across save and pause recovery", () => {
  let state = createNightSession("night-01", 0);
  state = send(state, { type: "OPEN_NIGHT" }, 0).state;
  state = send(state, { type: "SELECT_DURATION", durationMinutes: 5 }, 1_000).state;
  state = send(state, { type: "COMPLETE_CORE_WITH_TAP" }, 2_000).state;
  state = send(state, { type: "COMPLETE_MICRO_SCENE" }, 3_000).state;
  state = send(state, { type: "REQUEST_END" }, 4_000).state;
  state = send(state, { type: "STAY_A_WHILE" }, 5_000).state;

  const checkpoint = createRecentCheckpoint(
    state,
    65_000,
    "2026-08-25T12:00:00.000Z",
  );
  let restored = createNightSession("night-01", 1_000_000, checkpoint);
  assert.equal(restored.phase, "quiet-stay");
  assert.equal(restored.activeElapsedMs, 60_000);
  assert.equal(restored.endingPromptAvailable, false);

  restored = send(restored, { type: "PAUSE", reason: "background" }, 1_060_000).state;
  assert.equal(restored.activeElapsedMs, 120_000);
  restored = send(restored, { type: "RESUME" }, 2_000_000).state;

  const before = send(restored, { type: "TICK" }, 2_179_999);
  assert.equal(before.state.endingPromptAvailable, false);
  const eligible = send(before.state, { type: "TICK" }, 2_180_000);
  assert.equal(eligible.state.endingPromptAvailable, true);
  assert.deepEqual(eligible.effects, [{ type: "SHOW_ENDING_PROMPT" }]);
});

test("does not offer an ending before the core ritual is complete", () => {
  let state = createNightSession("night-01", 0);
  state = send(state, { type: "OPEN_NIGHT" }, 0).state;
  state = send(state, { type: "SELECT_DURATION", durationMinutes: 3 }, 1_000).state;

  const elapsedWithoutCore = send(state, { type: "TICK" }, 181_000);

  assert.equal(elapsedWithoutCore.state.endingPromptAvailable, false);
  assert.deepEqual(elapsedWithoutCore.effects, []);
});

test("restores a backgrounded drag to the last safe room checkpoint", () => {
  let state = createNightSession("night-01", 0);
  state = send(state, { type: "OPEN_NIGHT" }, 0).state;
  state = send(state, { type: "SELECT_DURATION", durationMinutes: 5 }, 1_000).state;
  state = send(state, { type: "BEGIN_CORE_DRAG" }, 2_000).state;
  state = send(state, { type: "PAUSE", reason: "background" }, 3_000).state;

  const checkpoint = createRecentCheckpoint(state, 600_000, "2026-08-21T12:00:00.000Z");
  const restored = createNightSession("night-01", 600_000, checkpoint);

  assert.equal(restored.phase, "exploring");
  assert.equal(restored.safeCheckpoint, "room-ready");
  assert.equal(restored.coreCompleted, false);
  assert.equal(restored.activeElapsedMs, 2_000);
});

test("returns a backgrounded duration selector to the selector without a second welcome", () => {
  let state = createNightSession("night-01", 0);
  state = send(state, { type: "OPEN_NIGHT" }, 0).state;
  assert.equal(state.phase, "duration-selection");

  state = send(state, { type: "PAUSE", reason: "background" }, 1_000).state;
  const resumed = send(state, { type: "RESUME" }, 2_000).state;
  assert.equal(resumed.phase, "duration-selection");
  assert.equal(resumed.durationMinutes, null);

  const checkpoint = createRecentCheckpoint(state, 2_000, "2026-08-24T09:00:00.000Z");
  const relaunched = createNightSession("night-01", 3_000, checkpoint);
  assert.equal(relaunched.phase, "duration-selection");
  assert.equal(relaunched.durationMinutes, null);
});

test("keeps the legacy indoor first-touch command as a no-op", () => {
  let state = createNightSession("night-01", 0);
  state = send(state, { type: "OPEN_NIGHT" }, 0).state;
  state = send(state, { type: "SELECT_DURATION", durationMinutes: 5 }, 1_000).state;

  const afterFirstTouch = send(state, { type: "FIRST_TOUCH" }, 2_000);

  assert.equal(afterFirstTouch.state, state);
  assert.deepEqual(afterFirstTouch.effects, []);
});

test("does not count a system audio interruption as active stay time", () => {
  let state = createNightSession("night-01", 0);
  state = send(state, { type: "OPEN_NIGHT" }, 0).state;
  state = send(state, { type: "SELECT_DURATION", durationMinutes: 3 }, 1_000).state;
  state = send(state, { type: "PAUSE", reason: "audio-interruption" }, 31_000).state;
  assert.equal(state.phase, "paused");
  assert.equal(state.pauseReason, "audio-interruption");
  assert.equal(state.activeElapsedMs, 30_000);

  state = send(state, { type: "RESUME" }, 151_000).state;
  assert.equal(state.phase, "exploring");
  const afterAnotherSecond = send(state, { type: "PAUSE", reason: "manual" }, 152_000).state;
  assert.equal(afterAnotherSecond.activeElapsedMs, 31_000);
});
