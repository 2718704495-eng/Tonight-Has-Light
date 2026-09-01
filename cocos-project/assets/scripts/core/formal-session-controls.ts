import type { AppFlowState } from "./app-flow.ts";
import type { NightSessionState } from "./night-state-machine.ts";
import type { DurationMinutes, UserSettings } from "../domain/contracts.ts";

export const FORMAL_SESSION_CONTROLS_ROOM_REVEAL_DELAY_MS = 650;
export const FORMAL_SESSION_CONTROLS_DEFAULT_FADE_MS = 170;
export const FORMAL_SESSION_CONTROLS_REDUCED_MOTION_FADE_MS = 0;
export const FORMAL_SESSION_CONTROLS_TRANSFORM_DISTANCE_PX = 0;
export const FORMAL_SESSION_CONTROLS_LARGE_TEXT_SCALE = 1.2;
export const FORMAL_SESSION_CONTROLS_MIN_TOUCH_TARGET_PX = 44;
export const FORMAL_SESSION_CONTROLS_MIN_ACTION_GAP_PX = 8;
export const FORMAL_SESSION_CONTROLS_COLLAPSED_TAB_SIZE = [48, 44] as const;
export const FORMAL_SESSION_CONTROLS_DURATION_OPTIONS = [3, 5, 8] as const;
export const FORMAL_SESSION_CONTROLS_DESIGN_HEIGHT = 844;
export const FORMAL_SESSION_CONTROLS_TABLE_BOTTOM_INSET_PX = 18;

export type FormalSessionControlsSubpage = "main" | "sound";

export type FormalSessionControlsMode =
  | "hidden"
  | "duration"
  | "collapsed"
  | "settings"
  | "sound-settings";

export type FormalSessionControlsSurface = "wall-note" | "table-paper";

export type FormalSessionControlsAction =
  | "select-duration"
  | "confirm-duration"
  | "return-to-outdoor"
  | "open-settings"
  | "close-settings"
  | "open-sound-settings"
  | "close-sound-settings"
  | "toggle-ambient"
  | "toggle-music"
  | "toggle-feedback"
  | "toggle-reduced-motion"
  | "toggle-large-text"
  | "open-ending-note";

export interface FormalSessionControlsRow {
  readonly label: string;
  readonly value: string;
  readonly action: FormalSessionControlsAction;
  readonly emphasis: boolean;
}

export interface FormalSessionControlsMotion {
  readonly opacityDurationMs: number;
  readonly transformDistancePx: 0;
}

export interface FormalSessionControlsTypography {
  readonly scale: 1 | 1.2;
  readonly overflow: "wrap";
  readonly shrinkToFit: false;
}

export interface FormalSessionControlsLayout {
  readonly minimumTouchTargetPx: 44;
  readonly minimumActionGapPx: 8;
  readonly collapsedTabSize: readonly [48, 44];
}

interface FormalSessionControlsBase {
  readonly mode: FormalSessionControlsMode;
  readonly roomInputBlocked: boolean;
  readonly motion: FormalSessionControlsMotion;
  readonly typography: FormalSessionControlsTypography;
  readonly layout: FormalSessionControlsLayout;
}

export interface HiddenFormalSessionControlsModel extends FormalSessionControlsBase {
  readonly visible: false;
  readonly mode: "hidden";
  readonly surface: null;
  readonly title: "";
  readonly body: "";
  readonly rows: readonly [];
  readonly selectedDuration: null;
  readonly confirmLabel: "";
}

export interface CollapsedFormalSessionControlsModel extends FormalSessionControlsBase {
  readonly visible: true;
  readonly mode: "collapsed";
  readonly surface: null;
  readonly title: "";
  readonly body: "";
  readonly rows: readonly [];
  readonly selectedDuration: null;
  readonly confirmLabel: "";
}

export interface DurationFormalSessionControlsModel extends FormalSessionControlsBase {
  readonly visible: true;
  readonly mode: "duration";
  readonly surface: FormalSessionControlsSurface;
  readonly title: "今晚想坐多久？";
  readonly body: "只是决定多久后提醒你。没有倒数，随时都可以停下。";
  readonly rows: readonly [];
  readonly selectedDuration: DurationMinutes;
  readonly confirmLabel: string;
}

export interface SettingsFormalSessionControlsModel extends FormalSessionControlsBase {
  readonly visible: true;
  readonly mode: "settings" | "sound-settings";
  readonly surface: FormalSessionControlsSurface;
  readonly title: "停一停" | "声音";
  readonly body: "";
  readonly rows: readonly FormalSessionControlsRow[];
  readonly selectedDuration: null;
  readonly confirmLabel: "";
}

export type FormalSessionControlsModel =
  | HiddenFormalSessionControlsModel
  | CollapsedFormalSessionControlsModel
  | DurationFormalSessionControlsModel
  | SettingsFormalSessionControlsModel;

export function canPerformFormalSessionControlsAction(
  model: FormalSessionControlsModel | null,
  action: FormalSessionControlsAction,
  durationPromptRevealed: boolean,
): boolean {
  if (!model?.visible) return false;
  if (["select-duration", "confirm-duration", "return-to-outdoor"].includes(action)) {
    return model.mode === "duration" && durationPromptRevealed;
  }
  if (action === "open-settings") return model.mode === "collapsed";
  if (action === "close-settings") {
    return model.mode === "settings" || model.mode === "sound-settings";
  }
  if (model.mode !== "settings" && model.mode !== "sound-settings") return false;
  return model.rows.some((row) => row.action === action);
}

export function resolveFormalSessionControlsTableBottom(visibleDesignHeight: number): number {
  const usableHeight = Number.isFinite(visibleDesignHeight) && visibleDesignHeight > 0
    ? Math.min(FORMAL_SESSION_CONTROLS_DESIGN_HEIGHT, visibleDesignHeight)
    : FORMAL_SESSION_CONTROLS_DESIGN_HEIGHT;
  return -usableHeight / 2 + FORMAL_SESSION_CONTROLS_TABLE_BOTTOM_INSET_PX;
}

export interface DeriveFormalSessionControlsInput {
  readonly session: NightSessionState;
  readonly appFlow: AppFlowState;
  readonly settings: UserSettings;
  readonly selectedDuration: DurationMinutes;
  readonly settingsSubpage: FormalSessionControlsSubpage;
}

const LAYOUT: FormalSessionControlsLayout = {
  minimumTouchTargetPx: FORMAL_SESSION_CONTROLS_MIN_TOUCH_TARGET_PX,
  minimumActionGapPx: FORMAL_SESSION_CONTROLS_MIN_ACTION_GAP_PX,
  collapsedTabSize: FORMAL_SESSION_CONTROLS_COLLAPSED_TAB_SIZE,
};

function motionFor(settings: UserSettings): FormalSessionControlsMotion {
  return {
    opacityDurationMs: settings.reducedMotion
      ? FORMAL_SESSION_CONTROLS_REDUCED_MOTION_FADE_MS
      : FORMAL_SESSION_CONTROLS_DEFAULT_FADE_MS,
    transformDistancePx: FORMAL_SESSION_CONTROLS_TRANSFORM_DISTANCE_PX,
  };
}

function typographyFor(settings: UserSettings): FormalSessionControlsTypography {
  return {
    scale: settings.largeText ? FORMAL_SESSION_CONTROLS_LARGE_TEXT_SCALE : 1,
    overflow: "wrap",
    shrinkToFit: false,
  };
}

function surfaceFor(settings: UserSettings): FormalSessionControlsSurface {
  return settings.largeText ? "table-paper" : "wall-note";
}

function onOff(enabled: boolean): "开" | "关" {
  return enabled ? "开" : "关";
}

function canOfferEnding(session: NightSessionState): boolean {
  return session.coreCompleted && ["micro-scene", "quiet-stay"].includes(session.phase);
}

function mainSettingsRows(
  session: NightSessionState,
  settings: UserSettings,
): readonly FormalSessionControlsRow[] {
  const rows: FormalSessionControlsRow[] = [
    {
      label: "声音",
      value: "进入",
      action: "open-sound-settings",
      emphasis: false,
    },
    {
      label: "减少动态",
      value: onOff(settings.reducedMotion),
      action: "toggle-reduced-motion",
      emphasis: false,
    },
    {
      label: "大字模式",
      value: onOff(settings.largeText),
      action: "toggle-large-text",
      emphasis: false,
    },
  ];
  if (canOfferEnding(session)) {
    rows.push({
      label: "看看今晚的留笺",
      value: "",
      action: "open-ending-note",
      emphasis: true,
    });
  }
  return rows;
}

function soundSettingsRows(settings: UserSettings): readonly FormalSessionControlsRow[] {
  return [
    {
      label: "环境声",
      value: onOff(settings.ambientEnabled),
      action: "toggle-ambient",
      emphasis: false,
    },
    {
      label: "音乐",
      value: onOff(settings.musicEnabled),
      action: "toggle-music",
      emphasis: false,
    },
    {
      label: "触碰声",
      value: onOff(settings.feedbackEnabled),
      action: "toggle-feedback",
      emphasis: false,
    },
    {
      label: "回到设置",
      value: "",
      action: "close-sound-settings",
      emphasis: false,
    },
  ];
}

/**
 * Pure contract for FORMAL-SESSION-CONTROLS-V1-A.
 *
 * The duration phase is intentionally distinct from the collapsed room: a
 * default selection is visible, but only the explicit confirm action may send
 * SELECT_DURATION and start activeSinceMs in the NightSession state machine.
 */
export function deriveFormalSessionControlsModel(
  input: DeriveFormalSessionControlsInput,
): FormalSessionControlsModel {
  const { session, appFlow, settings, selectedDuration, settingsSubpage } = input;
  const base = {
    motion: motionFor(settings),
    typography: typographyFor(settings),
    layout: LAYOUT,
  } as const;

  const durationCanBeShown = session.phase === "duration-selection"
    && ["indoor-loading", "night-session"].includes(appFlow.phase)
    && appFlow.overlay === "none";
  if (durationCanBeShown) {
    return {
      ...base,
      visible: true,
      mode: "duration",
      surface: surfaceFor(settings),
      roomInputBlocked: true,
      title: "今晚想坐多久？",
      body: "只是决定多久后提醒你。没有倒数，随时都可以停下。",
      rows: [],
      selectedDuration,
      confirmLabel: `就坐 ${selectedDuration} 分钟`,
    };
  }

  const activeRoomPhase = ["exploring", "core-dragging", "micro-scene", "quiet-stay"]
    .includes(session.phase);
  if (appFlow.phase !== "night-session" || !activeRoomPhase) {
    return {
      ...base,
      visible: false,
      mode: "hidden",
      surface: null,
      roomInputBlocked: false,
      title: "",
      body: "",
      rows: [],
      selectedDuration: null,
      confirmLabel: "",
    };
  }

  if (appFlow.overlay === "settings") {
    const sound = settingsSubpage === "sound";
    return {
      ...base,
      visible: true,
      mode: sound ? "sound-settings" : "settings",
      surface: surfaceFor(settings),
      roomInputBlocked: true,
      title: sound ? "声音" : "停一停",
      body: "",
      rows: sound ? soundSettingsRows(settings) : mainSettingsRows(session, settings),
      selectedDuration: null,
      confirmLabel: "",
    };
  }

  if (appFlow.overlay !== "none") {
    return {
      ...base,
      visible: false,
      mode: "hidden",
      surface: null,
      roomInputBlocked: false,
      title: "",
      body: "",
      rows: [],
      selectedDuration: null,
      confirmLabel: "",
    };
  }

  return {
    ...base,
    visible: true,
    mode: "collapsed",
    surface: null,
    roomInputBlocked: false,
    title: "",
    body: "",
    rows: [],
    selectedDuration: null,
    confirmLabel: "",
  };
}
