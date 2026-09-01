import type { AppFlowState } from "./app-flow.ts";
import type {
  IndoorN01SemanticAction,
} from "./indoor-n01-actions.ts";
import type { NightSessionState } from "./night-state-machine.ts";

export const FORMAL_ENDING_UI_DEFAULT_FADE_MS = 170;
export const FORMAL_ENDING_UI_REDUCED_MOTION_FADE_MS = 0;
export const FORMAL_ENDING_UI_TRANSFORM_DISTANCE_PX = 0;
export const FORMAL_ENDING_UI_LARGE_TEXT_SCALE = 1.2;
export const FORMAL_ENDING_UI_MIN_TOUCH_TARGET_PX = 44;
export const FORMAL_ENDING_UI_MIN_ACTION_GAP_PX = 8;

export type FormalEndingUiMode =
  | "hidden"
  | "ending"
  | "summary"
  | "share-preview"
  | "share-failed";

export type FormalEndingUiSurface = "wall-note" | "table-paper";

export interface FormalEndingUiSettings {
  readonly largeText: boolean;
  readonly reducedMotion: boolean;
}

export interface FormalEndingUiAction {
  readonly label: string;
  readonly semanticAction: IndoorN01SemanticAction;
}

export interface FormalEndingUiMotion {
  readonly opacityDurationMs: number;
  readonly transformDistancePx: 0;
}

export interface FormalEndingUiTypography {
  readonly scale: 1 | 1.2;
  readonly overflow: "wrap";
  readonly shrinkToFit: false;
}

export interface FormalEndingUiLayout {
  readonly minimumTouchTargetPx: 44;
  readonly minimumActionGapPx: 8;
}

interface FormalEndingUiBase {
  readonly mode: FormalEndingUiMode;
  readonly motion: FormalEndingUiMotion;
  readonly typography: FormalEndingUiTypography;
  readonly layout: FormalEndingUiLayout;
}

export interface HiddenFormalEndingUiModel extends FormalEndingUiBase {
  readonly visible: false;
  readonly mode: "hidden";
  readonly surface: null;
  readonly message: "";
  readonly actions: readonly [];
}

export interface VisibleFormalEndingUiModel extends FormalEndingUiBase {
  readonly visible: true;
  readonly mode: Exclude<FormalEndingUiMode, "hidden">;
  readonly surface: FormalEndingUiSurface;
  readonly message: string;
  readonly actions: readonly [FormalEndingUiAction, FormalEndingUiAction];
}

export type FormalEndingUiModel =
  | HiddenFormalEndingUiModel
  | VisibleFormalEndingUiModel;

interface FormalEndingUiContent {
  readonly message: string;
  readonly actions: readonly [FormalEndingUiAction, FormalEndingUiAction];
}

const CONTENT_BY_MODE: Readonly<
  Record<Exclude<FormalEndingUiMode, "hidden">, FormalEndingUiContent>
> = {
  ending: {
    message: "水热了。你也先缓一会儿。",
    actions: [
      { label: "再坐一会儿", semanticAction: "stay-a-while" },
      { label: "今晚到这里", semanticAction: "finish-night" },
    ],
  },
  summary: {
    message: "这一夜，先放在这里。",
    actions: [
      { label: "给朋友留一盏灯", semanticAction: "open-share-preview" },
      { label: "回到夜风里", semanticAction: "return-to-outdoor" },
    ],
  },
  "share-preview": {
    message: "有人给你留了一盏灯",
    actions: [
      { label: "发给朋友", semanticAction: "request-wechat-share" },
      { label: "先不分享", semanticAction: "close-share-preview" },
    ],
  },
  "share-failed": {
    message: "这次没有发出去。",
    actions: [
      { label: "再试一次", semanticAction: "retry-wechat-share" },
      { label: "留在今晚", semanticAction: "dismiss-share-failure" },
    ],
  },
};

function deriveMode(
  session: NightSessionState,
  appFlow: AppFlowState,
): FormalEndingUiMode {
  if (appFlow.phase === "night-session" && appFlow.overlay === "none") {
    return session.phase === "ending" ? "ending" : "hidden";
  }

  if (appFlow.phase !== "finished-summary" || session.phase !== "finished") {
    return "hidden";
  }

  switch (appFlow.overlay) {
    case "none":
      return "summary";
    case "share-preview":
      return "share-preview";
    case "share-failed":
      return "share-failed";
    default:
      return "hidden";
  }
}

function motionFor(settings: FormalEndingUiSettings): FormalEndingUiMotion {
  return {
    opacityDurationMs: settings.reducedMotion
      ? FORMAL_ENDING_UI_REDUCED_MOTION_FADE_MS
      : FORMAL_ENDING_UI_DEFAULT_FADE_MS,
    transformDistancePx: FORMAL_ENDING_UI_TRANSFORM_DISTANCE_PX,
  };
}

function typographyFor(settings: FormalEndingUiSettings): FormalEndingUiTypography {
  return {
    scale: settings.largeText ? FORMAL_ENDING_UI_LARGE_TEXT_SCALE : 1,
    overflow: "wrap",
    shrinkToFit: false,
  };
}

const LAYOUT: FormalEndingUiLayout = {
  minimumTouchTargetPx: FORMAL_ENDING_UI_MIN_TOUCH_TARGET_PX,
  minimumActionGapPx: FORMAL_ENDING_UI_MIN_ACTION_GAP_PX,
};

function surfaceFor(
  mode: Exclude<FormalEndingUiMode, "hidden">,
  largeText: boolean,
): FormalEndingUiSurface {
  if (mode === "share-preview" || mode === "share-failed") return "table-paper";
  return largeText ? "table-paper" : "wall-note";
}

/**
 * Builds the approved ending presentation without depending on Cocos nodes.
 * Inconsistent, paused and unrelated overlay states deliberately produce a
 * hidden model so recovery UI remains the only active interaction surface.
 */
export function deriveFormalEndingUiModel(
  session: NightSessionState,
  appFlow: AppFlowState,
  settings: FormalEndingUiSettings,
): FormalEndingUiModel {
  const mode = deriveMode(session, appFlow);
  const base = {
    motion: motionFor(settings),
    typography: typographyFor(settings),
    layout: LAYOUT,
  } as const;

  if (mode === "hidden") {
    return {
      ...base,
      visible: false,
      mode,
      surface: null,
      message: "",
      actions: [],
    };
  }

  const content = CONTENT_BY_MODE[mode];
  return {
    ...base,
    visible: true,
    mode,
    surface: surfaceFor(mode, settings.largeText),
    message: content.message,
    actions: content.actions,
  };
}
