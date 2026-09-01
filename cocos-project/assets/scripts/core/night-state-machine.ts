import { getNightDefinition } from "../content/nights.ts";
import type {
  DurationMinutes,
  NightId,
  RecentSafeCheckpoint,
  SafeCheckpointId,
} from "../domain/contracts.ts";

export type NightPhase =
  | "welcome"
  | "duration-selection"
  | "exploring"
  | "core-dragging"
  | "micro-scene"
  | "quiet-stay"
  | "ending"
  | "finished"
  | "paused"
  | "loading-error";

export type MicroSceneStatus = "not-started" | "playing" | "completed" | "skipped";

export interface NightSessionState {
  readonly nightId: NightId;
  readonly phase: NightPhase;
  readonly safeCheckpoint: SafeCheckpointId;
  readonly durationMinutes: DurationMinutes | null;
  readonly coreCompleted: boolean;
  readonly completedAmbientInteractionIds: readonly string[];
  readonly availableAmbientInteractionIds: readonly string[];
  readonly microSceneStatus: MicroSceneStatus;
  readonly activeElapsedMs: number;
  readonly activeSinceMs: number | null;
  readonly endingPromptAvailable: boolean;
  readonly pauseReason: "manual" | "background" | "audio-interruption" | null;
  readonly loadingErrorMessage: string | null;
}

export type NightCommand =
  | { readonly type: "OPEN_NIGHT" }
  | { readonly type: "SELECT_DURATION"; readonly durationMinutes: DurationMinutes }
  /** @deprecated Audio is unlocked by the first outdoor gesture. */
  | { readonly type: "FIRST_TOUCH" }
  | { readonly type: "BEGIN_CORE_DRAG" }
  | { readonly type: "DROP_CORE"; readonly targetHit: boolean }
  | { readonly type: "COMPLETE_CORE_WITH_TAP" }
  | { readonly type: "COMPLETE_AMBIENT"; readonly interactionId: string }
  | { readonly type: "COMPLETE_MICRO_SCENE" }
  | { readonly type: "SKIP_MICRO_SCENE" }
  | { readonly type: "TICK" }
  | { readonly type: "REQUEST_END" }
  | { readonly type: "STAY_A_WHILE" }
  | { readonly type: "FINISH_NIGHT" }
  | {
    readonly type: "PAUSE";
    readonly reason: "manual" | "background" | "audio-interruption";
  }
  | { readonly type: "RESUME" }
  | { readonly type: "FAIL_LOADING"; readonly message: string }
  | { readonly type: "RETRY_LOADING" };

export type NightEffect =
  | { readonly type: "PLAY_MICRO_SCENE" }
  | { readonly type: "SHOW_ENDING_PROMPT" }
  | { readonly type: "NIGHT_COMPLETED"; readonly nightId: NightId };

export interface NightTransition {
  readonly state: NightSessionState;
  readonly effects: readonly NightEffect[];
}

const MINUTE_MS = 60_000;

function isActivelyTimedPhase(phase: NightPhase): boolean {
  return ["exploring", "core-dragging", "micro-scene", "quiet-stay"].includes(phase);
}

function elapsedAt(state: NightSessionState, nowMs: number): number {
  if (state.activeSinceMs === null) return state.activeElapsedMs;
  return state.activeElapsedMs + Math.max(0, nowMs - state.activeSinceMs);
}

function endingPromptIsAvailable(
  durationMinutes: DurationMinutes | null,
  activeElapsedMs: number,
): boolean {
  return durationMinutes !== null && activeElapsedMs >= durationMinutes * MINUTE_MS;
}

function phaseForCheckpoint(checkpoint: SafeCheckpointId): NightPhase {
  switch (checkpoint) {
    case "welcome":
      // Once AppFlow is already inside, the current contract has no second
      // indoor welcome step. A persisted pre-duration safe point resumes at
      // the duration selector instead of making the user enter twice.
      return "duration-selection";
    case "duration-selected":
      // V1 saves may still contain this checkpoint from the old indoor
      // first-touch gate. Resume it as a ready room instead of asking twice.
      return "exploring";
    case "room-ready":
      return "exploring";
    case "core-complete":
    case "quiet-stay":
      return "quiet-stay";
    case "ending":
      return "ending";
  }
}

function transitionToCoreComplete(state: NightSessionState): NightTransition {
  return {
    state: {
      ...state,
      phase: "micro-scene",
      safeCheckpoint: "core-complete",
      coreCompleted: true,
      microSceneStatus: "playing",
    },
    // Completion is persisted at the successful ritual, not delayed until the
    // user chooses to leave the ending screen.
    effects: [
      { type: "NIGHT_COMPLETED", nightId: state.nightId },
      { type: "PLAY_MICRO_SCENE" },
    ],
  };
}

function resumeFromSafeCheckpoint(state: NightSessionState, nowMs: number): NightSessionState {
  const phase = phaseForCheckpoint(state.safeCheckpoint);
  const microSceneStatus = state.microSceneStatus === "playing" ? "skipped" : state.microSceneStatus;
  return {
    ...state,
    phase,
    microSceneStatus,
    activeSinceMs: isActivelyTimedPhase(phase) ? nowMs : null,
    pauseReason: null,
    loadingErrorMessage: null,
  };
}

export function createNightSession(
  nightId: NightId,
  nowMs: number,
  checkpoint: RecentSafeCheckpoint | null = null,
): NightSessionState {
  const night = getNightDefinition(nightId);
  const availableAmbientInteractionIds = night.ambientInteractions.map((interaction) => interaction.id);

  if (!checkpoint || checkpoint.nightId !== nightId) {
    return {
      nightId,
      phase: "welcome",
      safeCheckpoint: "welcome",
      durationMinutes: null,
      coreCompleted: false,
      completedAmbientInteractionIds: [],
      availableAmbientInteractionIds,
      microSceneStatus: "not-started",
      activeElapsedMs: 0,
      activeSinceMs: null,
      endingPromptAvailable: false,
      pauseReason: null,
      loadingErrorMessage: null,
    };
  }

  const phase = phaseForCheckpoint(checkpoint.checkpoint);
  const completedAmbientInteractionIds = checkpoint.completedAmbientInteractionIds.filter((id) =>
    availableAmbientInteractionIds.includes(id),
  );
  const activeElapsedMs = Math.max(0, checkpoint.activeElapsedMs);

  return {
    nightId,
    phase,
    safeCheckpoint: checkpoint.checkpoint,
    durationMinutes: checkpoint.durationMinutes,
    coreCompleted: checkpoint.coreCompleted,
    completedAmbientInteractionIds,
    availableAmbientInteractionIds,
    microSceneStatus: checkpoint.coreCompleted ? "skipped" : "not-started",
    activeElapsedMs,
    activeSinceMs: isActivelyTimedPhase(phase) ? nowMs : null,
    endingPromptAvailable: endingPromptIsAvailable(checkpoint.durationMinutes, activeElapsedMs),
    pauseReason: null,
    loadingErrorMessage: null,
  };
}

export function transitionNightSession(
  state: NightSessionState,
  command: NightCommand,
  nowMs: number,
): NightTransition {
  switch (command.type) {
    case "OPEN_NIGHT":
      if (state.phase !== "welcome") return { state, effects: [] };
      return { state: { ...state, phase: "duration-selection" }, effects: [] };

    case "SELECT_DURATION":
      if (state.phase !== "duration-selection") return { state, effects: [] };
      return {
        state: {
          ...state,
          phase: "exploring",
          safeCheckpoint: "room-ready",
          durationMinutes: command.durationMinutes,
          activeSinceMs: nowMs,
        },
        effects: [],
      };

    case "FIRST_TOUCH":
      // Kept as a harmless compatibility command while the old local-only
      // presentation shell is removed. The global gesture gate lives outside
      // the night session.
      return { state, effects: [] };

    case "BEGIN_CORE_DRAG":
      if (state.phase !== "exploring" || state.coreCompleted) return { state, effects: [] };
      return { state: { ...state, phase: "core-dragging" }, effects: [] };

    case "DROP_CORE":
      if (state.phase !== "core-dragging") return { state, effects: [] };
      if (!command.targetHit) {
        return { state: { ...state, phase: "exploring" }, effects: [] };
      }
      return transitionToCoreComplete(state);

    case "COMPLETE_CORE_WITH_TAP":
      if (state.phase !== "exploring" || state.coreCompleted) return { state, effects: [] };
      return transitionToCoreComplete(state);

    case "COMPLETE_AMBIENT": {
      if (!isActivelyTimedPhase(state.phase)) return { state, effects: [] };
      if (!state.availableAmbientInteractionIds.includes(command.interactionId)) {
        return { state, effects: [] };
      }
      if (state.completedAmbientInteractionIds.includes(command.interactionId)) {
        return { state, effects: [] };
      }
      return {
        state: {
          ...state,
          completedAmbientInteractionIds: [
            ...state.completedAmbientInteractionIds,
            command.interactionId,
          ],
        },
        effects: [],
      };
    }

    case "COMPLETE_MICRO_SCENE":
    case "SKIP_MICRO_SCENE":
      if (state.phase !== "micro-scene") return { state, effects: [] };
      return {
        state: {
          ...state,
          phase: "quiet-stay",
          safeCheckpoint: "quiet-stay",
          microSceneStatus: command.type === "COMPLETE_MICRO_SCENE" ? "completed" : "skipped",
        },
        effects: [],
      };

    case "TICK": {
      if (
        !isActivelyTimedPhase(state.phase) ||
        !state.coreCompleted ||
        state.endingPromptAvailable ||
        state.durationMinutes === null
      ) {
        return { state, effects: [] };
      }
      const activeElapsedMs = elapsedAt(state, nowMs);
      if (!endingPromptIsAvailable(state.durationMinutes, activeElapsedMs)) {
        return { state, effects: [] };
      }
      return {
        state: {
          ...state,
          activeElapsedMs,
          activeSinceMs: isActivelyTimedPhase(state.phase) ? nowMs : null,
          endingPromptAvailable: true,
        },
        effects: [{ type: "SHOW_ENDING_PROMPT" }],
      };
    }

    case "REQUEST_END":
      if (!state.coreCompleted || !["micro-scene", "quiet-stay"].includes(state.phase)) {
        return { state, effects: [] };
      }
      return {
        state: {
          ...state,
          phase: "ending",
          safeCheckpoint: "ending",
          activeElapsedMs: elapsedAt(state, nowMs),
          activeSinceMs: null,
          microSceneStatus: state.microSceneStatus === "playing" ? "skipped" : state.microSceneStatus,
        },
        effects: [],
      };

    case "STAY_A_WHILE":
      if (state.phase !== "ending") return { state, effects: [] };
      return {
        state: {
          ...state,
          phase: "quiet-stay",
          safeCheckpoint: "quiet-stay",
          activeElapsedMs: 0,
          activeSinceMs: nowMs,
          endingPromptAvailable: false,
        },
        effects: [],
      };

    case "FINISH_NIGHT":
      if (state.phase !== "ending" || !state.coreCompleted) return { state, effects: [] };
      return {
        state: { ...state, phase: "finished", activeSinceMs: null },
        effects: [],
      };

    case "PAUSE":
      if (["paused", "finished", "loading-error"].includes(state.phase)) {
        return { state, effects: [] };
      }
      return {
        state: {
          ...state,
          phase: "paused",
          activeElapsedMs: elapsedAt(state, nowMs),
          activeSinceMs: null,
          pauseReason: command.reason,
        },
        effects: [],
      };

    case "RESUME":
      if (state.phase !== "paused") return { state, effects: [] };
      return { state: resumeFromSafeCheckpoint(state, nowMs), effects: [] };

    case "FAIL_LOADING":
      return {
        state: {
          ...state,
          phase: "loading-error",
          activeElapsedMs: elapsedAt(state, nowMs),
          activeSinceMs: null,
          loadingErrorMessage: command.message,
        },
        effects: [],
      };

    case "RETRY_LOADING":
      if (state.phase !== "loading-error") return { state, effects: [] };
      return { state: resumeFromSafeCheckpoint(state, nowMs), effects: [] };
  }
}

export function createRecentCheckpoint(
  state: NightSessionState,
  nowMs: number,
  nowIso: string,
): RecentSafeCheckpoint {
  const activeElapsedMs = elapsedAt(state, nowMs);
  return {
    nightId: state.nightId,
    checkpoint: state.safeCheckpoint,
    durationMinutes: state.safeCheckpoint === "welcome" ? null : state.durationMinutes,
    coreCompleted: ["core-complete", "quiet-stay", "ending"].includes(state.safeCheckpoint),
    completedAmbientInteractionIds: [...state.completedAmbientInteractionIds],
    activeElapsedMs,
    updatedAt: nowIso,
  };
}
