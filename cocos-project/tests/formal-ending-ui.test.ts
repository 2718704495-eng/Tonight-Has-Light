import test from "node:test";
import assert from "node:assert/strict";
import {
  FORMAL_ENDING_UI_DEFAULT_FADE_MS,
  FORMAL_ENDING_UI_LARGE_TEXT_SCALE,
  FORMAL_ENDING_UI_MIN_ACTION_GAP_PX,
  FORMAL_ENDING_UI_MIN_TOUCH_TARGET_PX,
  FORMAL_ENDING_UI_REDUCED_MOTION_FADE_MS,
  FORMAL_ENDING_UI_TRANSFORM_DISTANCE_PX,
  deriveFormalEndingUiModel,
} from "../assets/scripts/core/formal-ending-ui.ts";
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

const DEFAULT_SETTINGS = { largeText: false, reducedMotion: false } as const;

function reachNightSession(): AppFlowState {
  let flow = transitionAppFlow(createAppFlowState(), {
    type: "BOOT_COMPLETE",
    sharedWelcome: false,
  }).state;
  flow = transitionAppFlow(flow, { type: "REQUEST_ENTER_HOUSE" }).state;
  flow = transitionAppFlow(flow, { type: "DOOR_TRANSITION_DONE" }).state;
  return transitionAppFlow(flow, { type: "INDOOR_LOADED" }).state;
}

function reachEnding(): NightSessionState {
  let session = createNightSession("night-01", 0);
  session = transitionNightSession(session, { type: "OPEN_NIGHT" }, 0).state;
  session = transitionNightSession(
    session,
    { type: "SELECT_DURATION", durationMinutes: 5 },
    1_000,
  ).state;
  session = transitionNightSession(session, { type: "COMPLETE_CORE_WITH_TAP" }, 2_000).state;
  session = transitionNightSession(session, { type: "COMPLETE_MICRO_SCENE" }, 3_000).state;
  return transitionNightSession(session, { type: "REQUEST_END" }, 4_000).state;
}

function reachFinished(): { readonly session: NightSessionState; readonly flow: AppFlowState } {
  let session = reachEnding();
  session = transitionNightSession(session, { type: "FINISH_NIGHT" }, 5_000).state;
  const flow = transitionAppFlow(reachNightSession(), { type: "NIGHT_FINISHED" }).state;
  return { session, flow };
}

test("maps the approved ending and summary copy to equal semantic choices", () => {
  const ending = deriveFormalEndingUiModel(
    reachEnding(),
    reachNightSession(),
    DEFAULT_SETTINGS,
  );
  assert.equal(ending.visible, true);
  if (!ending.visible) return;
  assert.equal(ending.mode, "ending");
  assert.equal(ending.surface, "wall-note");
  assert.equal(ending.message, "水热了。你也先缓一会儿。");
  assert.deepEqual(ending.actions, [
    { label: "再坐一会儿", semanticAction: "stay-a-while" },
    { label: "今晚到这里", semanticAction: "finish-night" },
  ]);

  const finished = reachFinished();
  const summary = deriveFormalEndingUiModel(
    finished.session,
    finished.flow,
    DEFAULT_SETTINGS,
  );
  assert.equal(summary.visible, true);
  if (!summary.visible) return;
  assert.equal(summary.mode, "summary");
  assert.equal(summary.surface, "wall-note");
  assert.equal(summary.message, "这一夜，先放在这里。");
  assert.deepEqual(summary.actions, [
    { label: "给朋友留一盏灯", semanticAction: "open-share-preview" },
    { label: "回到夜风里", semanticAction: "return-to-outdoor" },
  ]);
});

test("always presents share preview and failure on table paper", () => {
  const finished = reachFinished();
  const previewFlow = transitionAppFlow(finished.flow, { type: "OPEN_SHARE_PREVIEW" }).state;
  const preview = deriveFormalEndingUiModel(
    finished.session,
    previewFlow,
    DEFAULT_SETTINGS,
  );
  assert.equal(preview.visible, true);
  if (!preview.visible) return;
  assert.equal(preview.mode, "share-preview");
  assert.equal(preview.surface, "table-paper");
  assert.equal(preview.message, "有人给你留了一盏灯");
  assert.deepEqual(preview.actions, [
    { label: "发给朋友", semanticAction: "request-wechat-share" },
    { label: "先不分享", semanticAction: "close-share-preview" },
  ]);

  const failedFlow = transitionAppFlow(previewFlow, {
    type: "SHARE_FAILED",
    message: "network unavailable",
  }).state;
  const failed = deriveFormalEndingUiModel(
    finished.session,
    failedFlow,
    { largeText: true, reducedMotion: false },
  );
  assert.equal(failed.visible, true);
  if (!failed.visible) return;
  assert.equal(failed.mode, "share-failed");
  assert.equal(failed.surface, "table-paper");
  assert.equal(failed.message, "这次没有发出去。");
  assert.deepEqual(failed.actions, [
    { label: "再试一次", semanticAction: "retry-wechat-share" },
    { label: "留在今晚", semanticAction: "dismiss-share-failure" },
  ]);
});

test("uses the table-paper equivalent for true 120 percent large text without shrinking", () => {
  const model = deriveFormalEndingUiModel(
    reachEnding(),
    reachNightSession(),
    { largeText: true, reducedMotion: false },
  );
  assert.equal(model.visible, true);
  if (!model.visible) return;
  assert.equal(model.surface, "table-paper");
  assert.deepEqual(model.typography, {
    scale: FORMAL_ENDING_UI_LARGE_TEXT_SCALE,
    overflow: "wrap",
    shrinkToFit: false,
  });
  assert.equal(FORMAL_ENDING_UI_LARGE_TEXT_SCALE, 1.2);
});

test("keeps motion opacity-only and removes even the fade in reduced motion", () => {
  const normal = deriveFormalEndingUiModel(
    reachEnding(),
    reachNightSession(),
    DEFAULT_SETTINGS,
  );
  assert.deepEqual(normal.motion, {
    opacityDurationMs: FORMAL_ENDING_UI_DEFAULT_FADE_MS,
    transformDistancePx: FORMAL_ENDING_UI_TRANSFORM_DISTANCE_PX,
  });
  assert.equal(FORMAL_ENDING_UI_DEFAULT_FADE_MS, 170);
  assert.equal(FORMAL_ENDING_UI_TRANSFORM_DISTANCE_PX, 0);

  const reduced = deriveFormalEndingUiModel(
    reachEnding(),
    reachNightSession(),
    { largeText: false, reducedMotion: true },
  );
  assert.deepEqual(reduced.motion, {
    opacityDurationMs: FORMAL_ENDING_UI_REDUCED_MOTION_FADE_MS,
    transformDistancePx: 0,
  });
  assert.equal(FORMAL_ENDING_UI_REDUCED_MOTION_FADE_MS, 0);
});

test("publishes minimum touch and spacing constraints in every model", () => {
  const visible = deriveFormalEndingUiModel(
    reachEnding(),
    reachNightSession(),
    DEFAULT_SETTINGS,
  );
  const hidden = deriveFormalEndingUiModel(
    createNightSession("night-01", 0),
    createAppFlowState(),
    DEFAULT_SETTINGS,
  );

  for (const model of [visible, hidden]) {
    assert.deepEqual(model.layout, {
      minimumTouchTargetPx: FORMAL_ENDING_UI_MIN_TOUCH_TARGET_PX,
      minimumActionGapPx: FORMAL_ENDING_UI_MIN_ACTION_GAP_PX,
    });
  }
  assert.equal(FORMAL_ENDING_UI_MIN_TOUCH_TARGET_PX, 44);
  assert.equal(FORMAL_ENDING_UI_MIN_ACTION_GAP_PX, 8);
});

test("hides paused, save-error and every unrelated or inconsistent state", () => {
  const ending = reachEnding();
  const nightFlow = reachNightSession();
  const finished = reachFinished();
  const hiddenCases: readonly [NightSessionState, AppFlowState][] = [
    [ending, { ...nightFlow, overlay: "paused", overlayBeforePause: "none" }],
    [ending, { ...nightFlow, overlay: "save-error", saveErrorMessage: "disk full" }],
    [ending, { ...nightFlow, overlay: "settings" }],
    [finished.session, { ...finished.flow, overlay: "paused", overlayBeforePause: "none" }],
    [finished.session, { ...finished.flow, overlay: "save-error", saveErrorMessage: "disk full" }],
    [createNightSession("night-01", 0), nightFlow],
    [ending, finished.flow],
  ];

  for (const [session, flow] of hiddenCases) {
    const model = deriveFormalEndingUiModel(session, flow, DEFAULT_SETTINGS);
    assert.deepEqual(model, {
      visible: false,
      mode: "hidden",
      surface: null,
      message: "",
      actions: [],
      motion: { opacityDurationMs: 170, transformDistancePx: 0 },
      typography: { scale: 1, overflow: "wrap", shrinkToFit: false },
      layout: { minimumTouchTargetPx: 44, minimumActionGapPx: 8 },
    });
  }
});

test("copy contains no task, reward or deprecated navigation language", () => {
  const finished = reachFinished();
  const previewFlow = transitionAppFlow(finished.flow, { type: "OPEN_SHARE_PREVIEW" }).state;
  const failedFlow = transitionAppFlow(previewFlow, {
    type: "SHARE_FAILED",
    message: "network unavailable",
  }).state;
  const models = [
    deriveFormalEndingUiModel(reachEnding(), reachNightSession(), DEFAULT_SETTINGS),
    deriveFormalEndingUiModel(finished.session, finished.flow, DEFAULT_SETTINGS),
    deriveFormalEndingUiModel(finished.session, previewFlow, DEFAULT_SETTINGS),
    deriveFormalEndingUiModel(finished.session, failedFlow, DEFAULT_SETTINGS),
  ];
  const renderedCopy = models.flatMap((model) => [
    model.message,
    ...model.actions.map((action) => action.label),
  ]).join(" ");
  const forbidden = ["回房间", "完成", "通关", "奖励", "领取", "打卡", "分享得"];
  for (const phrase of forbidden) assert.equal(renderedCopy.includes(phrase), false, phrase);
});
