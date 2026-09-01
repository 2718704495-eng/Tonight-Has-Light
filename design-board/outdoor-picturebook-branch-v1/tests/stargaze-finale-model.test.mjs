import test from "node:test";
import assert from "node:assert/strict";

import {
  STARGAZE_FINALE_TIMING,
  getStargazeFinalePhase,
  resolveStargazeFinaleChoice,
} from "../stargaze-finale-model.mjs";

test("流星结尾在 3.15 秒内按批准节拍只经过一次各阶段", () => {
  assert.deepEqual(STARGAZE_FINALE_TIMING, {
    settleMs: 900,
    flightMs: 800,
    tailFadeMs: 450,
    quietMs: 1000,
    choiceRevealMs: 180,
    choicesAtMs: 3150,
  });
  assert.equal(
    STARGAZE_FINALE_TIMING.choicesAtMs,
    STARGAZE_FINALE_TIMING.settleMs
      + STARGAZE_FINALE_TIMING.flightMs
      + STARGAZE_FINALE_TIMING.tailFadeMs
      + STARGAZE_FINALE_TIMING.quietMs,
  );

  assert.equal(getStargazeFinalePhase(0), "settling");
  assert.equal(getStargazeFinalePhase(899), "settling");
  assert.equal(getStargazeFinalePhase(900), "flight");
  assert.equal(getStargazeFinalePhase(1699), "flight");
  assert.equal(getStargazeFinalePhase(1700), "tail-fade");
  assert.equal(getStargazeFinalePhase(2149), "tail-fade");
  assert.equal(getStargazeFinalePhase(2150), "quiet");
  assert.equal(getStargazeFinalePhase(3149), "quiet");
  assert.equal(getStargazeFinalePhase(3150), "choices");
});

test("结尾只有回家和再坐一会儿两个去向", () => {
  assert.deepEqual(resolveStargazeFinaleChoice("home"), {
    type: "branch",
    branchKey: "home",
    frame: 0,
  });
  assert.deepEqual(resolveStargazeFinaleChoice("stay"), {
    type: "hub",
  });
  assert.equal(resolveStargazeFinaleChoice("replay"), null);
});
