import test from "node:test";
import assert from "node:assert/strict";
import {
  deriveIndoorN01ActionAvailability,
  planIndoorN01Action,
} from "../assets/scripts/core/indoor-n01-actions.ts";
import {
  createAppFlowState,
  transitionAppFlow,
  type AppFlowState,
} from "../assets/scripts/core/app-flow.ts";
import {
  createNightSession,
  transitionNightSession,
  type NightSessionState,
} from "../assets/scripts/core/night-state-machine.ts";

function reachNightSession(): AppFlowState {
  let flow = transitionAppFlow(createAppFlowState(), {
    type: "BOOT_COMPLETE",
    sharedWelcome: false,
  }).state;
  flow = transitionAppFlow(flow, { type: "REQUEST_ENTER_HOUSE" }).state;
  flow = transitionAppFlow(flow, { type: "DOOR_TRANSITION_DONE" }).state;
  return transitionAppFlow(flow, { type: "INDOOR_LOADED" }).state;
}

function reachQuietStay(): NightSessionState {
  let session = createNightSession("night-01", 0);
  session = transitionNightSession(session, { type: "OPEN_NIGHT" }, 0).state;
  session = transitionNightSession(
    session,
    { type: "SELECT_DURATION", durationMinutes: 5 },
    1_000,
  ).state;
  session = transitionNightSession(session, { type: "COMPLETE_CORE_WITH_TAP" }, 2_000).state;
  return transitionNightSession(session, { type: "COMPLETE_MICRO_SCENE" }, 3_000).state;
}

test("exposes the complete quiet-ending action chain without choosing a visual style", () => {
  let flow = reachNightSession();
  let session = reachQuietStay();

  let availability = deriveIndoorN01ActionAvailability(session, flow);
  assert.equal(availability.canRequestEnding, true);
  assert.equal(availability.canFinishNight, false);
  assert.deepEqual(planIndoorN01Action("request-ending", session, flow)?.nightCommands, [
    { type: "REQUEST_END" },
  ]);

  session = transitionNightSession(session, { type: "REQUEST_END" }, 4_000).state;
  availability = deriveIndoorN01ActionAvailability(session, flow);
  assert.equal(availability.canStayAWhile, true);
  assert.equal(availability.canFinishNight, true);

  const stayPlan = planIndoorN01Action("stay-a-while", session, flow);
  assert.deepEqual(stayPlan?.nightCommands, [{ type: "STAY_A_WHILE" }]);
  const stayed = transitionNightSession(session, stayPlan!.nightCommands[0]!, 5_000).state;
  assert.equal(stayed.phase, "quiet-stay");

  session = transitionNightSession(stayed, { type: "REQUEST_END" }, 6_000).state;
  const finishPlan = planIndoorN01Action("finish-night", session, flow);
  assert.deepEqual(finishPlan?.nightCommands, [{ type: "FINISH_NIGHT" }]);
  session = transitionNightSession(session, finishPlan!.nightCommands[0]!, 7_000).state;
  flow = transitionAppFlow(flow, { type: "NIGHT_FINISHED" }).state;

  assert.equal(session.phase, "finished");
  assert.equal(flow.phase, "finished-summary");
  assert.deepEqual(
    planIndoorN01Action("open-share-preview", session, flow)?.appFlowCommands,
    [{ type: "OPEN_SHARE_PREVIEW" }],
  );
});

test("plans share retry as one ordered semantic action and blocks invalid shortcuts", () => {
  let session = reachQuietStay();
  let flow = reachNightSession();

  assert.equal(planIndoorN01Action("finish-night", session, flow), null);
  assert.equal(planIndoorN01Action("request-wechat-share", session, flow), null);

  session = transitionNightSession(session, { type: "REQUEST_END" }, 4_000).state;
  session = transitionNightSession(session, { type: "FINISH_NIGHT" }, 5_000).state;
  flow = transitionAppFlow(flow, { type: "NIGHT_FINISHED" }).state;
  flow = transitionAppFlow(flow, { type: "OPEN_SHARE_PREVIEW" }).state;
  flow = transitionAppFlow(flow, { type: "SHARE_FAILED", message: "分享没有发出去" }).state;

  const retry = planIndoorN01Action("retry-wechat-share", session, flow);
  assert.deepEqual(retry, {
    nightCommands: [],
    appFlowCommands: [
      { type: "DISMISS_SHARE_FAILED" },
      { type: "OPEN_SHARE_PREVIEW" },
    ],
    runtimeEffect: "request-wechat-share",
  });
  assert.equal(
    deriveIndoorN01ActionAvailability(session, flow).canReturnToOutdoor,
    false,
    "share failure must be resolved before navigation",
  );
});

test("keeps night completion and app summary transition as one guarded chain", () => {
  let session = reachQuietStay();
  let flow = reachNightSession();

  const ending = planIndoorN01Action("request-ending", session, flow);
  assert.deepEqual(ending?.nightCommands, [{ type: "REQUEST_END" }]);
  session = transitionNightSession(session, ending!.nightCommands[0]!, 4_000).state;

  const finish = planIndoorN01Action("finish-night", session, flow);
  assert.deepEqual(finish?.nightCommands, [{ type: "FINISH_NIGHT" }]);
  session = transitionNightSession(session, finish!.nightCommands[0]!, 5_000).state;
  assert.equal(session.phase, "finished");

  flow = transitionAppFlow(flow, { type: "NIGHT_FINISHED" }).state;
  assert.equal(flow.phase, "finished-summary");
  assert.equal(planIndoorN01Action("finish-night", session, flow), null);
  assert.equal(
    deriveIndoorN01ActionAvailability(session, flow).canOpenSharePreview,
    true,
  );
});

test("allows leaving an unfinished night without marking it complete", () => {
  const flow = reachNightSession();
  let session = createNightSession("night-01", 0);
  session = transitionNightSession(session, { type: "OPEN_NIGHT" }, 0).state;
  session = transitionNightSession(
    session,
    { type: "SELECT_DURATION", durationMinutes: 5 },
    1_000,
  ).state;

  const plan = planIndoorN01Action("return-to-outdoor", session, flow);
  assert.equal(plan?.runtimeEffect, "return-to-outdoor");
  assert.equal(session.coreCompleted, false);
});
