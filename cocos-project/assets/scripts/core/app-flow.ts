export type AppFlowPhase =
  | "boot"
  | "shared-welcome"
  | "outdoor-ready"
  | "door-transition"
  | "indoor-loading"
  | "night-session"
  | "finished-summary";

export type AppFlowOverlay =
  | "none"
  | "settings"
  | "paused"
  | "loading-error"
  | "share-preview"
  | "share-failed"
  | "save-error"
  | "audio-interrupted";

type RestorableOverlay = Exclude<AppFlowOverlay, "paused">;

export interface AppFlowState {
  readonly phase: AppFlowPhase;
  readonly overlay: AppFlowOverlay;
  /** The overlay to restore when the app returns from the background. */
  readonly overlayBeforePause: RestorableOverlay | null;
  readonly loadingErrorMessage: string | null;
  readonly shareErrorMessage: string | null;
  readonly saveErrorMessage: string | null;
}

export type AppFlowCommand =
  | {
    readonly type: "BOOT_COMPLETE";
    readonly sharedWelcome: boolean;
    readonly resumeNightSession?: boolean;
  }
  | { readonly type: "DISMISS_SHARED_WELCOME" }
  | { readonly type: "REQUEST_ENTER_HOUSE" }
  | { readonly type: "OUTDOOR_LOAD_FAILED"; readonly message: string }
  | { readonly type: "RETRY_OUTDOOR_LOAD" }
  | { readonly type: "DOOR_TRANSITION_DONE" }
  | { readonly type: "INDOOR_LOADED" }
  | { readonly type: "INDOOR_LOAD_FAILED"; readonly message: string }
  | { readonly type: "RETRY_INDOOR_LOAD" }
  | { readonly type: "APP_HIDE" }
  | { readonly type: "APP_SHOW" }
  | { readonly type: "OPEN_SETTINGS" }
  | { readonly type: "CLOSE_SETTINGS" }
  | { readonly type: "OPEN_SHARE_PREVIEW" }
  | { readonly type: "CLOSE_SHARE_PREVIEW" }
  | { readonly type: "SHARE_FAILED"; readonly message: string }
  | { readonly type: "DISMISS_SHARE_FAILED" }
  | { readonly type: "SAVE_FAILED"; readonly message: string }
  | { readonly type: "SAVE_SUCCEEDED" }
  | { readonly type: "AUDIO_INTERRUPTED" }
  | { readonly type: "AUDIO_RESUMED" }
  | { readonly type: "NIGHT_FINISHED" }
  | { readonly type: "RETURN_TO_OUTDOOR" };

export type AppFlowEffect =
  | { readonly type: "START_DOOR_TRANSITION" }
  | { readonly type: "LOAD_OUTDOOR_SCENE" }
  | { readonly type: "LOAD_INDOOR_NIGHT" }
  | { readonly type: "SUSPEND_APP" }
  | { readonly type: "RESUME_APP" };

export interface AppFlowTransition {
  readonly state: AppFlowState;
  readonly effects: readonly AppFlowEffect[];
}

const NO_EFFECTS: readonly AppFlowEffect[] = [];

function unchanged(state: AppFlowState): AppFlowTransition {
  return { state, effects: NO_EFFECTS };
}

function canOpenSettings(phase: AppFlowPhase): boolean {
  return ["shared-welcome", "outdoor-ready", "night-session", "finished-summary"].includes(
    phase,
  );
}

function canInterruptAudio(phase: AppFlowPhase): boolean {
  // The outdoor scene remains fully usable in silence while the system owns
  // audio. Its approved artwork has no interruption panel yet, so blocking the
  // door behind an invisible overlay would be worse than continuing visually.
  return phase === "night-session";
}

export function createAppFlowState(): AppFlowState {
  return {
    phase: "boot",
    overlay: "none",
    overlayBeforePause: null,
    loadingErrorMessage: null,
    shareErrorMessage: null,
    saveErrorMessage: null,
  };
}

export function transitionAppFlow(
  state: AppFlowState,
  command: AppFlowCommand,
): AppFlowTransition {
  switch (command.type) {
    case "BOOT_COMPLETE":
      if (state.phase !== "boot") return unchanged(state);
      return {
        state: {
          ...state,
          phase: command.sharedWelcome
            ? "shared-welcome"
            : command.resumeNightSession
              ? "indoor-loading"
              : "outdoor-ready",
        },
        effects: !command.sharedWelcome && command.resumeNightSession
          ? [{ type: "LOAD_INDOOR_NIGHT" }]
          : NO_EFFECTS,
      };

    case "DISMISS_SHARED_WELCOME":
      if (state.phase !== "shared-welcome" || state.overlay !== "none") {
        return unchanged(state);
      }
      return {
        state: { ...state, phase: "outdoor-ready" },
        effects: NO_EFFECTS,
      };

    case "REQUEST_ENTER_HOUSE":
      if (state.phase !== "outdoor-ready" || state.overlay !== "none") {
        return unchanged(state);
      }
      return {
        state: { ...state, phase: "door-transition" },
        effects: [{ type: "START_DOOR_TRANSITION" }],
      };

    case "OUTDOOR_LOAD_FAILED":
      if (!["shared-welcome", "outdoor-ready"].includes(state.phase)) {
        return unchanged(state);
      }
      if (state.overlay === "none") {
        return {
          state: {
            ...state,
            overlay: "loading-error",
            loadingErrorMessage: command.message,
          },
          effects: NO_EFFECTS,
        };
      }
      if (state.overlay === "paused" && state.overlayBeforePause === "none") {
        return {
          state: {
            ...state,
            overlayBeforePause: "loading-error",
            loadingErrorMessage: command.message,
          },
          effects: NO_EFFECTS,
        };
      }
      return unchanged(state);

    case "RETRY_OUTDOOR_LOAD":
      if (
        !["shared-welcome", "outdoor-ready"].includes(state.phase)
        || state.overlay !== "loading-error"
      ) {
        return unchanged(state);
      }
      return {
        state: {
          ...state,
          overlay: "none",
          loadingErrorMessage: null,
        },
        effects: [{ type: "LOAD_OUTDOOR_SCENE" }],
      };

    case "DOOR_TRANSITION_DONE":
      if (state.phase !== "door-transition" || state.overlay !== "none") {
        return unchanged(state);
      }
      return {
        state: { ...state, phase: "indoor-loading" },
        effects: [{ type: "LOAD_INDOOR_NIGHT" }],
      };

    case "INDOOR_LOADED":
      if (state.phase !== "indoor-loading") return unchanged(state);
      if (
        state.overlay !== "none" &&
        !(state.overlay === "paused" && state.overlayBeforePause === "none")
      ) {
        return unchanged(state);
      }
      return {
        state: {
          ...state,
          phase: "night-session",
          loadingErrorMessage: null,
        },
        effects: NO_EFFECTS,
      };

    case "INDOOR_LOAD_FAILED":
      if (state.phase !== "indoor-loading") return unchanged(state);
      if (state.overlay === "none") {
        return {
          state: {
            ...state,
            overlay: "loading-error",
            loadingErrorMessage: command.message,
          },
          effects: NO_EFFECTS,
        };
      }
      if (state.overlay === "paused" && state.overlayBeforePause === "none") {
        return {
          state: {
            ...state,
            overlayBeforePause: "loading-error",
            loadingErrorMessage: command.message,
          },
          effects: NO_EFFECTS,
        };
      }
      return unchanged(state);

    case "RETRY_INDOOR_LOAD":
      if (state.phase !== "indoor-loading" || state.overlay !== "loading-error") {
        return unchanged(state);
      }
      return {
        state: {
          ...state,
          overlay: "none",
          loadingErrorMessage: null,
        },
        effects: [{ type: "LOAD_INDOOR_NIGHT" }],
      };

    case "APP_HIDE": {
      if (state.overlay === "paused") return unchanged(state);
      const interruptedDoorTransition = state.phase === "door-transition";
      return {
        state: {
          ...state,
          phase: interruptedDoorTransition ? "outdoor-ready" : state.phase,
          overlay: "paused",
          overlayBeforePause: interruptedDoorTransition ? "none" : state.overlay,
        },
        effects: [{ type: "SUSPEND_APP" }],
      };
    }

    case "APP_SHOW":
      if (state.overlay !== "paused") return unchanged(state);
      return {
        state: {
          ...state,
          overlay: state.overlayBeforePause ?? "none",
          overlayBeforePause: null,
        },
        effects: [{ type: "RESUME_APP" }],
      };

    case "OPEN_SETTINGS":
      if (state.overlay !== "none" || !canOpenSettings(state.phase)) {
        return unchanged(state);
      }
      return {
        state: { ...state, overlay: "settings" },
        effects: NO_EFFECTS,
      };

    case "CLOSE_SETTINGS":
      if (state.overlay !== "settings") return unchanged(state);
      return {
        state: { ...state, overlay: "none" },
        effects: NO_EFFECTS,
      };

    case "OPEN_SHARE_PREVIEW":
      if (state.phase !== "finished-summary" || state.overlay !== "none") {
        return unchanged(state);
      }
      return {
        state: { ...state, overlay: "share-preview" },
        effects: NO_EFFECTS,
      };

    case "CLOSE_SHARE_PREVIEW":
      if (state.overlay === "paused" && state.overlayBeforePause === "share-preview") {
        return {
          state: { ...state, overlayBeforePause: "none" },
          effects: NO_EFFECTS,
        };
      }
      if (state.overlay !== "share-preview") return unchanged(state);
      return {
        state: { ...state, overlay: "none" },
        effects: NO_EFFECTS,
      };

    case "SHARE_FAILED":
      if (state.overlay === "paused" && state.overlayBeforePause === "share-preview") {
        return {
          state: {
            ...state,
            overlayBeforePause: "share-failed",
            shareErrorMessage: command.message,
          },
          effects: NO_EFFECTS,
        };
      }
      if (state.overlay !== "share-preview") return unchanged(state);
      return {
        state: {
          ...state,
          overlay: "share-failed",
          shareErrorMessage: command.message,
        },
        effects: NO_EFFECTS,
      };

    case "DISMISS_SHARE_FAILED":
      if (state.overlay !== "share-failed") return unchanged(state);
      return {
        state: {
          ...state,
          overlay: "none",
          shareErrorMessage: null,
        },
        effects: NO_EFFECTS,
      };

    case "SAVE_FAILED":
      if (!["night-session", "finished-summary"].includes(state.phase)) {
        return unchanged(state);
      }
      if (state.overlay === "none") {
        return {
          state: {
            ...state,
            overlay: "save-error",
            saveErrorMessage: command.message,
          },
          effects: NO_EFFECTS,
        };
      }
      if (state.overlay === "paused" && state.overlayBeforePause === "none") {
        return {
          state: {
            ...state,
            overlayBeforePause: "save-error",
            saveErrorMessage: command.message,
          },
          effects: NO_EFFECTS,
        };
      }
      return unchanged(state);

    case "SAVE_SUCCEEDED":
      if (state.overlay === "save-error") {
        return {
          state: { ...state, overlay: "none", saveErrorMessage: null },
          effects: NO_EFFECTS,
        };
      }
      if (state.overlay === "paused" && state.overlayBeforePause === "save-error") {
        return {
          state: { ...state, overlayBeforePause: "none", saveErrorMessage: null },
          effects: NO_EFFECTS,
        };
      }
      return unchanged(state);

    case "AUDIO_INTERRUPTED":
      if (state.overlay !== "none" || !canInterruptAudio(state.phase)) {
        return unchanged(state);
      }
      return {
        state: { ...state, overlay: "audio-interrupted" },
        effects: NO_EFFECTS,
      };

    case "AUDIO_RESUMED":
      if (state.overlay === "paused" && state.overlayBeforePause === "audio-interrupted") {
        return {
          state: { ...state, overlayBeforePause: "none" },
          effects: NO_EFFECTS,
        };
      }
      if (state.overlay !== "audio-interrupted") return unchanged(state);
      return {
        state: { ...state, overlay: "none" },
        effects: NO_EFFECTS,
      };

    case "NIGHT_FINISHED":
      if (state.phase !== "night-session" || state.overlay !== "none") {
        return unchanged(state);
      }
      return {
        state: { ...state, phase: "finished-summary" },
        effects: NO_EFFECTS,
      };

    case "RETURN_TO_OUTDOOR":
      if (
        !["night-session", "finished-summary"].includes(state.phase) ||
        !["none", "paused"].includes(state.overlay)
      ) {
        return unchanged(state);
      }
      return {
        state: {
          ...state,
          phase: "outdoor-ready",
          overlay: "none",
          overlayBeforePause: null,
          loadingErrorMessage: null,
          shareErrorMessage: null,
          saveErrorMessage: null,
        },
        effects: NO_EFFECTS,
      };
  }
}
