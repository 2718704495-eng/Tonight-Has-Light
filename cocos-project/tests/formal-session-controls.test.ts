import test from "node:test";
import assert from "node:assert/strict";
import {
  canPerformFormalSessionControlsAction,
  FORMAL_SESSION_CONTROLS_COLLAPSED_TAB_SIZE,
  FORMAL_SESSION_CONTROLS_DEFAULT_FADE_MS,
  FORMAL_SESSION_CONTROLS_LARGE_TEXT_SCALE,
  FORMAL_SESSION_CONTROLS_MIN_ACTION_GAP_PX,
  FORMAL_SESSION_CONTROLS_MIN_TOUCH_TARGET_PX,
  FORMAL_SESSION_CONTROLS_REDUCED_MOTION_FADE_MS,
  FORMAL_SESSION_CONTROLS_ROOM_REVEAL_DELAY_MS,
  FORMAL_SESSION_CONTROLS_TRANSFORM_DISTANCE_PX,
  deriveFormalSessionControlsModel,
  resolveFormalSessionControlsTableBottom,
} from "../assets/scripts/core/formal-session-controls.ts";
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
import { planIndoorN01Action } from "../assets/scripts/core/indoor-n01-actions.ts";
import type { UserSettings } from "../assets/scripts/domain/contracts.ts";

const DEFAULT_SETTINGS: UserSettings = {
  ambientEnabled: true,
  musicEnabled: true,
  feedbackEnabled: true,
  reducedMotion: false,
  largeText: false,
};

function reachNightSession(): AppFlowState {
  let flow = transitionAppFlow(createAppFlowState(), {
    type: "BOOT_COMPLETE",
    sharedWelcome: false,
  }).state;
  flow = transitionAppFlow(flow, { type: "REQUEST_ENTER_HOUSE" }).state;
  flow = transitionAppFlow(flow, { type: "DOOR_TRANSITION_DONE" }).state;
  return transitionAppFlow(flow, { type: "INDOOR_LOADED" }).state;
}

function reachDurationSelection(): NightSessionState {
  const session = createNightSession("night-01", 0);
  return transitionNightSession(session, { type: "OPEN_NIGHT" }, 100).state;
}

function reachExploring(): NightSessionState {
  return transitionNightSession(
    reachDurationSelection(),
    { type: "SELECT_DURATION", durationMinutes: 5 },
    1_000,
  ).state;
}

test("default five minutes remains a visual choice until explicit confirmation", () => {
  const session = reachDurationSelection();
  const model = deriveFormalSessionControlsModel({
    session,
    appFlow: reachNightSession(),
    settings: DEFAULT_SETTINGS,
    selectedDuration: 5,
    settingsSubpage: "main",
  });

  assert.equal(session.phase, "duration-selection");
  assert.equal(session.durationMinutes, null);
  assert.equal(session.activeSinceMs, null);
  assert.equal(model.mode, "duration");
  if (model.mode !== "duration") return;
  assert.equal(model.surface, "wall-note");
  assert.equal(model.roomInputBlocked, true);
  assert.equal(model.selectedDuration, 5);
  assert.equal(model.title, "今晚想坐多久？");
  assert.equal(model.body, "只是决定多久后提醒你。没有倒数，随时都可以停下。");
  assert.equal(model.confirmLabel, "就坐 5 分钟");

  const confirmed = transitionNightSession(
    session,
    { type: "SELECT_DURATION", durationMinutes: 5 },
    1_234,
  ).state;
  assert.equal(confirmed.phase, "exploring");
  assert.equal(confirmed.durationMinutes, 5);
  assert.equal(confirmed.activeSinceMs, 1_234);
  const collapsed = deriveFormalSessionControlsModel({
    session: confirmed,
    appFlow: reachNightSession(),
    settings: DEFAULT_SETTINGS,
    selectedDuration: 5,
    settingsSubpage: "main",
  });
  assert.equal(collapsed.mode, "collapsed");
  assert.equal(collapsed.roomInputBlocked, false);
});

test("uses right-wall paper normally and table paper for true 120 percent large text", () => {
  const session = reachDurationSelection();
  const flow = reachNightSession();
  const normal = deriveFormalSessionControlsModel({
    session,
    appFlow: flow,
    settings: DEFAULT_SETTINGS,
    selectedDuration: 5,
    settingsSubpage: "main",
  });
  const large = deriveFormalSessionControlsModel({
    session,
    appFlow: flow,
    settings: { ...DEFAULT_SETTINGS, largeText: true },
    selectedDuration: 5,
    settingsSubpage: "main",
  });

  assert.equal(normal.mode, "duration");
  assert.equal(normal.surface, "wall-note");
  assert.equal(normal.typography.scale, 1);
  assert.equal(large.mode, "duration");
  assert.equal(large.surface, "table-paper");
  assert.deepEqual(large.typography, {
    scale: FORMAL_SESSION_CONTROLS_LARGE_TEXT_SCALE,
    overflow: "wrap",
    shrinkToFit: false,
  });
  assert.equal(FORMAL_SESSION_CONTROLS_LARGE_TEXT_SCALE, 1.2);
});

test("keeps the 650 ms room prelude and uses only an opacity fade", () => {
  const session = reachDurationSelection();
  const flow = reachNightSession();
  const normal = deriveFormalSessionControlsModel({
    session,
    appFlow: flow,
    settings: DEFAULT_SETTINGS,
    selectedDuration: 5,
    settingsSubpage: "main",
  });
  const reduced = deriveFormalSessionControlsModel({
    session,
    appFlow: flow,
    settings: { ...DEFAULT_SETTINGS, reducedMotion: true },
    selectedDuration: 5,
    settingsSubpage: "main",
  });

  assert.equal(FORMAL_SESSION_CONTROLS_ROOM_REVEAL_DELAY_MS, 650);
  assert.deepEqual(normal.motion, {
    opacityDurationMs: FORMAL_SESSION_CONTROLS_DEFAULT_FADE_MS,
    transformDistancePx: FORMAL_SESSION_CONTROLS_TRANSFORM_DISTANCE_PX,
  });
  assert.deepEqual(reduced.motion, {
    opacityDurationMs: FORMAL_SESSION_CONTROLS_REDUCED_MOTION_FADE_MS,
    transformDistancePx: 0,
  });
  assert.equal(FORMAL_SESSION_CONTROLS_DEFAULT_FADE_MS, 170);
  assert.equal(FORMAL_SESSION_CONTROLS_REDUCED_MOTION_FADE_MS, 0);
  assert.equal(FORMAL_SESSION_CONTROLS_TRANSFORM_DISTANCE_PX, 0);
});

test("collapsed tab stays unobtrusive while expanded settings block the room", () => {
  const session = reachExploring();
  const flow = reachNightSession();
  const collapsed = deriveFormalSessionControlsModel({
    session,
    appFlow: flow,
    settings: DEFAULT_SETTINGS,
    selectedDuration: 5,
    settingsSubpage: "main",
  });
  assert.equal(collapsed.mode, "collapsed");
  assert.equal(collapsed.roomInputBlocked, false);
  assert.deepEqual(collapsed.layout, {
    minimumTouchTargetPx: FORMAL_SESSION_CONTROLS_MIN_TOUCH_TARGET_PX,
    minimumActionGapPx: FORMAL_SESSION_CONTROLS_MIN_ACTION_GAP_PX,
    collapsedTabSize: FORMAL_SESSION_CONTROLS_COLLAPSED_TAB_SIZE,
  });
  assert.deepEqual(FORMAL_SESSION_CONTROLS_COLLAPSED_TAB_SIZE, [48, 44]);
  assert.equal(FORMAL_SESSION_CONTROLS_MIN_TOUCH_TARGET_PX, 44);
  assert.equal(FORMAL_SESSION_CONTROLS_MIN_ACTION_GAP_PX, 8);

  const settingsFlow = transitionAppFlow(flow, { type: "OPEN_SETTINGS" }).state;
  const settings = deriveFormalSessionControlsModel({
    session,
    appFlow: settingsFlow,
    settings: DEFAULT_SETTINGS,
    selectedDuration: 5,
    settingsSubpage: "main",
  });
  assert.equal(settings.mode, "settings");
  assert.equal(settings.roomInputBlocked, true);
  assert.deepEqual(settings.rows.map(({ label, value }) => ({ label, value })), [
    { label: "声音", value: "进入" },
    { label: "减少动态", value: "关" },
    { label: "大字模式", value: "关" },
  ]);

  const sound = deriveFormalSessionControlsModel({
    session,
    appFlow: settingsFlow,
    settings: DEFAULT_SETTINGS,
    selectedDuration: 5,
    settingsSubpage: "sound",
  });
  assert.equal(sound.mode, "sound-settings");
  assert.deepEqual(sound.rows.map(({ label, value }) => ({ label, value })), [
    { label: "环境声", value: "开" },
    { label: "音乐", value: "开" },
    { label: "触碰声", value: "开" },
    { label: "回到设置", value: "" },
  ]);
});

test("offers the approved ending note only after core completion and after closing settings", () => {
  const flow = reachNightSession();
  const settingsFlow = transitionAppFlow(flow, { type: "OPEN_SETTINGS" }).state;
  const exploring = reachExploring();
  const before = deriveFormalSessionControlsModel({
    session: exploring,
    appFlow: settingsFlow,
    settings: DEFAULT_SETTINGS,
    selectedDuration: 5,
    settingsSubpage: "main",
  });
  assert.equal(before.rows.some((row) => row.action === "open-ending-note"), false);

  const completed = transitionNightSession(
    exploring,
    { type: "COMPLETE_CORE_WITH_TAP" },
    2_000,
  ).state;
  const after = deriveFormalSessionControlsModel({
    session: completed,
    appFlow: settingsFlow,
    settings: DEFAULT_SETTINGS,
    selectedDuration: 5,
    settingsSubpage: "main",
  });
  assert.equal(after.rows.at(-1)?.label, "看看今晚的留笺");
  assert.equal(after.rows.at(-1)?.action, "open-ending-note");
  assert.equal(planIndoorN01Action("request-ending", completed, settingsFlow), null);

  const closed = transitionAppFlow(settingsFlow, { type: "CLOSE_SETTINGS" }).state;
  assert.notEqual(planIndoorN01Action("request-ending", completed, closed), null);
});

test("guards every action by the currently visible surface and reveal state", () => {
  const session = reachDurationSelection();
  const flow = reachNightSession();
  const duration = deriveFormalSessionControlsModel({
    session,
    appFlow: flow,
    settings: DEFAULT_SETTINGS,
    selectedDuration: 5,
    settingsSubpage: "main",
  });
  assert.equal(canPerformFormalSessionControlsAction(duration, "confirm-duration", false), false);
  assert.equal(canPerformFormalSessionControlsAction(duration, "confirm-duration", true), true);
  assert.equal(canPerformFormalSessionControlsAction(duration, "toggle-large-text", true), false);

  const exploring = reachExploring();
  const collapsed = deriveFormalSessionControlsModel({
    session: exploring,
    appFlow: flow,
    settings: DEFAULT_SETTINGS,
    selectedDuration: 5,
    settingsSubpage: "main",
  });
  assert.equal(canPerformFormalSessionControlsAction(collapsed, "open-settings", true), true);
  assert.equal(canPerformFormalSessionControlsAction(collapsed, "confirm-duration", true), false);

  const settingsFlow = transitionAppFlow(flow, { type: "OPEN_SETTINGS" }).state;
  const settings = deriveFormalSessionControlsModel({
    session: exploring,
    appFlow: settingsFlow,
    settings: DEFAULT_SETTINGS,
    selectedDuration: 5,
    settingsSubpage: "main",
  });
  assert.equal(canPerformFormalSessionControlsAction(settings, "toggle-large-text", true), true);
  assert.equal(canPerformFormalSessionControlsAction(settings, "toggle-ambient", true), false);
  assert.equal(canPerformFormalSessionControlsAction(settings, "open-ending-note", true), false);

  const sound = deriveFormalSessionControlsModel({
    session: exploring,
    appFlow: settingsFlow,
    settings: DEFAULT_SETTINGS,
    selectedDuration: 5,
    settingsSubpage: "sound",
  });
  assert.equal(canPerformFormalSessionControlsAction(sound, "toggle-ambient", true), true);
  assert.equal(canPerformFormalSessionControlsAction(sound, "toggle-large-text", true), false);
});

test("keeps table paper above the bottom edge under 430 by 844 fixed-width pressure", () => {
  assert.equal(resolveFormalSessionControlsTableBottom(844), -404);
  const pressureVisibleHeight = 844 * 390 / 430;
  const pressureBottom = resolveFormalSessionControlsTableBottom(pressureVisibleHeight);
  assert.ok(Math.abs(pressureBottom - (-pressureVisibleHeight / 2 + 18)) < 0.001);
  assert.ok(pressureBottom > -404, "the table paper must move upward instead of being cropped");
  assert.equal(resolveFormalSessionControlsTableBottom(Number.NaN), -404);
});

test("accepts a duration confirmation only once under rapid repeated input", () => {
  const selection = reachDurationSelection();
  const first = transitionNightSession(
    selection,
    { type: "SELECT_DURATION", durationMinutes: 5 },
    2_000,
  ).state;
  const repeated = transitionNightSession(
    first,
    { type: "SELECT_DURATION", durationMinutes: 8 },
    2_001,
  ).state;
  assert.equal(first.phase, "exploring");
  assert.equal(repeated, first);
  assert.equal(repeated.durationMinutes, 5);
  assert.equal(repeated.activeSinceMs, 2_000);
});
