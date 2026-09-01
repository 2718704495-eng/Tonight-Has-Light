import type { AppFlowCommand, AppFlowState } from "./app-flow.ts";
import type { NightCommand, NightSessionState } from "./night-state-machine.ts";

export type IndoorN01SemanticAction =
  | "request-ending"
  | "stay-a-while"
  | "finish-night"
  | "open-share-preview"
  | "request-wechat-share"
  | "close-share-preview"
  | "retry-wechat-share"
  | "dismiss-share-failure"
  | "return-to-outdoor";

export type IndoorN01RuntimeEffect = "request-wechat-share" | "return-to-outdoor";

export interface IndoorN01ActionPlan {
  readonly nightCommands: readonly NightCommand[];
  readonly appFlowCommands: readonly AppFlowCommand[];
  readonly runtimeEffect: IndoorN01RuntimeEffect | null;
}

export interface IndoorN01ActionAvailability {
  readonly canRequestEnding: boolean;
  readonly canStayAWhile: boolean;
  readonly canFinishNight: boolean;
  readonly canOpenSharePreview: boolean;
  readonly canRequestWechatShare: boolean;
  readonly canCloseSharePreview: boolean;
  readonly canRetryWechatShare: boolean;
  readonly canDismissShareFailure: boolean;
  readonly canReturnToOutdoor: boolean;
}

const EMPTY_NIGHT_COMMANDS: readonly NightCommand[] = [];
const EMPTY_APP_FLOW_COMMANDS: readonly AppFlowCommand[] = [];

/**
 * Derive the semantic action surface separately from any visual treatment.
 *
 * Keeping their availability here lets the disposable room and the formal
 * ending note consume the same end/share/return rules without reviving the
 * superseded V0 presentation.
 */
export function deriveIndoorN01ActionAvailability(
  session: NightSessionState,
  appFlow: AppFlowState,
): IndoorN01ActionAvailability {
  const nightIsVisible = appFlow.phase === "night-session" && appFlow.overlay === "none";
  const summaryIsVisible = appFlow.phase === "finished-summary" && appFlow.overlay === "none";

  return {
    canRequestEnding: nightIsVisible
      && session.coreCompleted
      && ["micro-scene", "quiet-stay"].includes(session.phase),
    canStayAWhile: nightIsVisible && session.phase === "ending",
    canFinishNight: nightIsVisible && session.phase === "ending" && session.coreCompleted,
    canOpenSharePreview: summaryIsVisible && session.phase === "finished",
    canRequestWechatShare: appFlow.phase === "finished-summary"
      && appFlow.overlay === "share-preview",
    canCloseSharePreview: appFlow.phase === "finished-summary"
      && appFlow.overlay === "share-preview",
    canRetryWechatShare: appFlow.phase === "finished-summary"
      && appFlow.overlay === "share-failed",
    canDismissShareFailure: appFlow.phase === "finished-summary"
      && appFlow.overlay === "share-failed",
    canReturnToOutdoor: ["night-session", "finished-summary"].includes(appFlow.phase)
      && ["none", "paused"].includes(appFlow.overlay),
  };
}

export function planIndoorN01Action(
  action: IndoorN01SemanticAction,
  session: NightSessionState,
  appFlow: AppFlowState,
): IndoorN01ActionPlan | null {
  const available = deriveIndoorN01ActionAvailability(session, appFlow);

  switch (action) {
    case "request-ending":
      return available.canRequestEnding
        ? {
          nightCommands: [{ type: "REQUEST_END" }],
          appFlowCommands: EMPTY_APP_FLOW_COMMANDS,
          runtimeEffect: null,
        }
        : null;
    case "stay-a-while":
      return available.canStayAWhile
        ? {
          nightCommands: [{ type: "STAY_A_WHILE" }],
          appFlowCommands: EMPTY_APP_FLOW_COMMANDS,
          runtimeEffect: null,
        }
        : null;
    case "finish-night":
      return available.canFinishNight
        ? {
          nightCommands: [{ type: "FINISH_NIGHT" }],
          appFlowCommands: EMPTY_APP_FLOW_COMMANDS,
          runtimeEffect: null,
        }
        : null;
    case "open-share-preview":
      return available.canOpenSharePreview
        ? {
          nightCommands: EMPTY_NIGHT_COMMANDS,
          appFlowCommands: [{ type: "OPEN_SHARE_PREVIEW" }],
          runtimeEffect: null,
        }
        : null;
    case "request-wechat-share":
      return available.canRequestWechatShare
        ? {
          nightCommands: EMPTY_NIGHT_COMMANDS,
          appFlowCommands: EMPTY_APP_FLOW_COMMANDS,
          runtimeEffect: "request-wechat-share",
        }
        : null;
    case "close-share-preview":
      return available.canCloseSharePreview
        ? {
          nightCommands: EMPTY_NIGHT_COMMANDS,
          appFlowCommands: [{ type: "CLOSE_SHARE_PREVIEW" }],
          runtimeEffect: null,
        }
        : null;
    case "retry-wechat-share":
      return available.canRetryWechatShare
        ? {
          nightCommands: EMPTY_NIGHT_COMMANDS,
          appFlowCommands: [
            { type: "DISMISS_SHARE_FAILED" },
            { type: "OPEN_SHARE_PREVIEW" },
          ],
          runtimeEffect: "request-wechat-share",
        }
        : null;
    case "dismiss-share-failure":
      return available.canDismissShareFailure
        ? {
          nightCommands: EMPTY_NIGHT_COMMANDS,
          appFlowCommands: [{ type: "DISMISS_SHARE_FAILED" }],
          runtimeEffect: null,
        }
        : null;
    case "return-to-outdoor":
      return available.canReturnToOutdoor
        ? {
          nightCommands: EMPTY_NIGHT_COMMANDS,
          appFlowCommands: EMPTY_APP_FLOW_COMMANDS,
          runtimeEffect: "return-to-outdoor",
        }
        : null;
  }
}
