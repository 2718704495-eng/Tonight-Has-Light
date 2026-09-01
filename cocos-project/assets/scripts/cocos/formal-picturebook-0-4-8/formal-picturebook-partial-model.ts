import type { FormalPicturebookPageId } from "./formal-picturebook-partial-assets.ts";

export const FORMAL_PICTUREBOOK_PAGE_TRANSITION_MS = 260;
export const FORMAL_PICTUREBOOK_BRANCH_TRANSITION_MS = 320;
export const FORMAL_PICTUREBOOK_REDUCED_TRANSITION_MS = 150;
export const FORMAL_PICTUREBOOK_H4_FEEDBACK_MS = 180;
export const FORMAL_PICTUREBOOK_H4_ACTION_REVEAL_DELAY_MS = 300;
export const FORMAL_PICTUREBOOK_ROOT_INVITATION_DELAY_MS = 1_500;

const NORMAL_METEOR_HOLD_MS = 900;
const NORMAL_METEOR_MOVE_MS = 800;
const NORMAL_METEOR_TAIL_MS = 450;
const METEOR_QUIET_MS = 1_000;
const FINALE_COPY_FADE_MS = 180;
const REDUCED_METEOR_STATIC_MS = 180;

export type FormalPicturebookBranch = "root" | "stargaze" | "home";
export type FormalPicturebookH4State = "none" | "ate" | "sipped" | "both";
export type FormalPicturebookAvailableAction =
  | "stargaze"
  | "home"
  | "next"
  | "eat"
  | "sip"
  | "finale-home"
  | "finale-stay"
  | "return-root";

export interface FormalPicturebookPartialState {
  readonly branch: FormalPicturebookBranch;
  readonly pageId: FormalPicturebookPageId;
  readonly reducedMotion: boolean;
  readonly elapsedMs: number;
  readonly rootInvitationsVisible: boolean;
  readonly finaleElapsedMs: number;
  readonly finaleChoicesVisible: boolean;
  readonly h4State: FormalPicturebookH4State;
  readonly h4ActionsVisible: boolean;
  readonly availableActions: readonly FormalPicturebookAvailableAction[];
  /** The partial picturebook never writes indoor-night completion. */
  readonly completed: false;
}

export type FormalPicturebookTransitionKind = "page" | "branch" | "feedback";

export interface FormalPicturebookTransition {
  readonly kind: FormalPicturebookTransitionKind;
  readonly durationMs: number;
}

export interface FormalPicturebookReduction {
  readonly state: FormalPicturebookPartialState;
  readonly transition: FormalPicturebookTransition | null;
}

export type FormalPicturebookPartialAction =
  | { readonly type: "ADVANCE_TIME"; readonly deltaMs: number }
  | { readonly type: "ENTER_STARGAZE" }
  | { readonly type: "ENTER_HOME" }
  | { readonly type: "TAP_PAGE" }
  | { readonly type: "H4_EAT" }
  | { readonly type: "H4_SIP" }
  | { readonly type: "FINALE_HOME" }
  | { readonly type: "FINALE_STAY" }
  | { readonly type: "RETURN_ROOT" }
  | { readonly type: "SET_REDUCED_MOTION"; readonly enabled: boolean }
  | { readonly type: "REPLAY" };

export type FormalPicturebookMeteorPhase =
  | "hold"
  | "meteor"
  | "tail"
  | "reduced-static"
  | "quiet"
  | "copy"
  | "choices";

export interface FormalPicturebookMeteorSample {
  readonly phase: FormalPicturebookMeteorPhase;
  readonly meteorVisible: boolean;
  readonly meteorProgress: number;
  readonly meteorOpacity: number;
  readonly copyOpacity: number;
  readonly choicesVisible: boolean;
  readonly moves: boolean;
}

const STARGAZE_PAGES = [
  "stargaze-f1",
  "stargaze-f2",
  "stargaze-f3",
  "stargaze-f4",
  "stargaze-f5",
] as const satisfies readonly FormalPicturebookPageId[];

const HOME_PAGES = [
  "home-h1",
  "home-h2",
  "home-h3",
  "home-h4",
  "home-h5",
] as const satisfies readonly FormalPicturebookPageId[];

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothStep(value: number): number {
  const progress = clamp01(value);
  return progress * progress * (3 - 2 * progress);
}

function transition(
  state: FormalPicturebookPartialState,
  kind: FormalPicturebookTransitionKind,
): FormalPicturebookTransition {
  const durationMs = state.reducedMotion
    ? FORMAL_PICTUREBOOK_REDUCED_TRANSITION_MS
    : kind === "branch"
      ? FORMAL_PICTUREBOOK_BRANCH_TRANSITION_MS
      : kind === "feedback"
        ? FORMAL_PICTUREBOOK_H4_FEEDBACK_MS
        : FORMAL_PICTUREBOOK_PAGE_TRANSITION_MS;
  return { kind, durationMs };
}

function actionsFor(
  pageId: FormalPicturebookPageId,
  finaleChoicesVisible: boolean,
  h4ActionsVisible: boolean,
): readonly FormalPicturebookAvailableAction[] {
  if (pageId === "root") return ["stargaze", "home"];
  if (pageId === "stargaze-f5") {
    return finaleChoicesVisible ? ["finale-home", "finale-stay"] : [];
  }
  if (pageId === "home-h4") return h4ActionsVisible ? ["eat", "sip", "next"] : ["next"];
  if (pageId === "home-h5") return ["return-root"];
  return ["next"];
}

function stateForPage(
  previous: FormalPicturebookPartialState,
  branch: FormalPicturebookBranch,
  pageId: FormalPicturebookPageId,
): FormalPicturebookPartialState {
  return {
    ...previous,
    branch,
    pageId,
    elapsedMs: 0,
    rootInvitationsVisible: pageId === "root" ? false : previous.rootInvitationsVisible,
    finaleElapsedMs: 0,
    finaleChoicesVisible: false,
    h4State: pageId === "root" || pageId === "home-h1" || pageId === "stargaze-f1"
      ? "none"
      : previous.h4State,
    h4ActionsVisible: false,
    availableActions: actionsFor(pageId, false, false),
  };
}

export function createFormalPicturebookPartialState(
  reducedMotion: boolean,
): FormalPicturebookPartialState {
  return {
    branch: "root",
    pageId: "root",
    reducedMotion,
    elapsedMs: 0,
    rootInvitationsVisible: false,
    finaleElapsedMs: 0,
    finaleChoicesVisible: false,
    h4State: "none",
    h4ActionsVisible: false,
    availableActions: ["stargaze", "home"],
    completed: false,
  };
}

export function sampleFormalPicturebookMeteor(
  elapsedMs: number,
  reducedMotion: boolean,
): FormalPicturebookMeteorSample {
  const elapsed = Math.max(0, elapsedMs);
  if (elapsed < NORMAL_METEOR_HOLD_MS) {
    return {
      phase: "hold",
      meteorVisible: false,
      meteorProgress: 0,
      meteorOpacity: 0,
      copyOpacity: 0,
      choicesVisible: false,
      moves: false,
    };
  }

  if (reducedMotion) {
    const staticEnd = NORMAL_METEOR_HOLD_MS + REDUCED_METEOR_STATIC_MS;
    const quietEnd = staticEnd + METEOR_QUIET_MS;
    const copyEnd = quietEnd + FINALE_COPY_FADE_MS;
    if (elapsed < staticEnd) {
      const progress = (elapsed - NORMAL_METEOR_HOLD_MS) / REDUCED_METEOR_STATIC_MS;
      return {
        phase: "reduced-static",
        meteorVisible: true,
        meteorProgress: 0.56,
        meteorOpacity: smoothStep(1 - Math.abs(progress * 2 - 1)),
        copyOpacity: 0,
        choicesVisible: false,
        moves: false,
      };
    }
    if (elapsed < quietEnd) {
      return {
        phase: "quiet",
        meteorVisible: false,
        meteorProgress: 0.56,
        meteorOpacity: 0,
        copyOpacity: 0,
        choicesVisible: false,
        moves: false,
      };
    }
    if (elapsed < copyEnd) {
      return {
        phase: "copy",
        meteorVisible: false,
        meteorProgress: 0.56,
        meteorOpacity: 0,
        copyOpacity: smoothStep((elapsed - quietEnd) / FINALE_COPY_FADE_MS),
        choicesVisible: false,
        moves: false,
      };
    }
    return {
      phase: "choices",
      meteorVisible: false,
      meteorProgress: 0.56,
      meteorOpacity: 0,
      copyOpacity: 1,
      choicesVisible: true,
      moves: false,
    };
  }

  const meteorEnd = NORMAL_METEOR_HOLD_MS + NORMAL_METEOR_MOVE_MS;
  const tailEnd = meteorEnd + NORMAL_METEOR_TAIL_MS;
  const quietEnd = tailEnd + METEOR_QUIET_MS;
  const copyEnd = quietEnd + FINALE_COPY_FADE_MS;
  if (elapsed < meteorEnd) {
    return {
      phase: "meteor",
      meteorVisible: true,
      meteorProgress: smoothStep((elapsed - NORMAL_METEOR_HOLD_MS) / NORMAL_METEOR_MOVE_MS),
      meteorOpacity: 1,
      copyOpacity: 0,
      choicesVisible: false,
      moves: true,
    };
  }
  if (elapsed < tailEnd) {
    return {
      phase: "tail",
      meteorVisible: true,
      meteorProgress: 1,
      meteorOpacity: 1 - smoothStep((elapsed - meteorEnd) / NORMAL_METEOR_TAIL_MS),
      copyOpacity: 0,
      choicesVisible: false,
      moves: false,
    };
  }
  if (elapsed < quietEnd) {
    return {
      phase: "quiet",
      meteorVisible: false,
      meteorProgress: 1,
      meteorOpacity: 0,
      copyOpacity: 0,
      choicesVisible: false,
      moves: false,
    };
  }
  if (elapsed < copyEnd) {
    return {
      phase: "copy",
      meteorVisible: false,
      meteorProgress: 1,
      meteorOpacity: 0,
      copyOpacity: smoothStep((elapsed - quietEnd) / FINALE_COPY_FADE_MS),
      choicesVisible: false,
      moves: false,
    };
  }
  return {
    phase: "choices",
    meteorVisible: false,
    meteorProgress: 1,
    meteorOpacity: 0,
    copyOpacity: 1,
    choicesVisible: true,
    moves: false,
  };
}

export function reduceFormalPicturebookPartial(
  state: FormalPicturebookPartialState,
  action: FormalPicturebookPartialAction,
): FormalPicturebookReduction {
  switch (action.type) {
    case "ADVANCE_TIME": {
      const deltaMs = Number.isFinite(action.deltaMs) ? Math.max(0, action.deltaMs) : 0;
      if (deltaMs === 0) return { state, transition: null };
      const elapsedMs = state.elapsedMs + deltaMs;
      if (state.pageId === "root") {
        const rootInvitationsVisible = elapsedMs >= FORMAL_PICTUREBOOK_ROOT_INVITATION_DELAY_MS;
        return {
          state: { ...state, elapsedMs, rootInvitationsVisible },
          transition: null,
        };
      }
      if (state.pageId === "stargaze-f5") {
        const finaleElapsedMs = state.finaleElapsedMs + deltaMs;
        const finaleChoicesVisible = sampleFormalPicturebookMeteor(
          finaleElapsedMs,
          state.reducedMotion,
        ).choicesVisible;
        return {
          state: {
            ...state,
            elapsedMs,
            finaleElapsedMs,
            finaleChoicesVisible,
            availableActions: actionsFor(state.pageId, finaleChoicesVisible, false),
          },
          transition: null,
        };
      }
      if (state.pageId === "home-h4") {
        const h4ActionsVisible = elapsedMs >= FORMAL_PICTUREBOOK_H4_ACTION_REVEAL_DELAY_MS;
        return {
          state: {
            ...state,
            elapsedMs,
            h4ActionsVisible,
            availableActions: actionsFor(state.pageId, false, h4ActionsVisible),
          },
          transition: null,
        };
      }
      return { state: { ...state, elapsedMs }, transition: null };
    }
    case "ENTER_STARGAZE": {
      if (state.pageId !== "root") return { state, transition: null };
      return {
        state: stateForPage(state, "stargaze", "stargaze-f1"),
        transition: transition(state, "branch"),
      };
    }
    case "ENTER_HOME": {
      if (state.pageId !== "root") return { state, transition: null };
      return {
        state: stateForPage(state, "home", "home-h1"),
        transition: transition(state, "branch"),
      };
    }
    case "TAP_PAGE": {
      const pages = state.branch === "stargaze"
        ? STARGAZE_PAGES
        : state.branch === "home"
          ? HOME_PAGES
          : null;
      if (!pages || state.pageId === "stargaze-f5" || state.pageId === "home-h5") {
        return { state, transition: null };
      }
      const index = pages.indexOf(state.pageId as never);
      const nextPage = pages[index + 1];
      if (!nextPage) return { state, transition: null };
      return {
        state: stateForPage(state, state.branch, nextPage),
        transition: transition(state, "page"),
      };
    }
    case "H4_EAT":
    case "H4_SIP": {
      if (state.pageId !== "home-h4" || !state.h4ActionsVisible) {
        return { state, transition: null };
      }
      const ate = state.h4State === "ate" || state.h4State === "both" || action.type === "H4_EAT";
      const sipped = state.h4State === "sipped" || state.h4State === "both" || action.type === "H4_SIP";
      const h4State: FormalPicturebookH4State = ate && sipped
        ? "both"
        : ate
          ? "ate"
          : "sipped";
      if (h4State === state.h4State) return { state, transition: null };
      return {
        state: { ...state, h4State },
        transition: transition(state, "feedback"),
      };
    }
    case "FINALE_HOME": {
      if (state.pageId !== "stargaze-f5" || !state.finaleChoicesVisible) {
        return { state, transition: null };
      }
      return {
        state: stateForPage(state, "home", "home-h1"),
        transition: transition(state, "branch"),
      };
    }
    case "FINALE_STAY": {
      if (state.pageId !== "stargaze-f5" || !state.finaleChoicesVisible) {
        return { state, transition: null };
      }
      return {
        state: stateForPage(state, "root", "root"),
        transition: transition(state, "branch"),
      };
    }
    case "RETURN_ROOT": {
      if (state.pageId !== "home-h5") return { state, transition: null };
      return {
        state: stateForPage(state, "root", "root"),
        transition: transition(state, "branch"),
      };
    }
    case "SET_REDUCED_MOTION": {
      if (state.reducedMotion === action.enabled) return { state, transition: null };
      const finaleChoicesVisible = state.pageId === "stargaze-f5"
        ? sampleFormalPicturebookMeteor(state.finaleElapsedMs, action.enabled).choicesVisible
        : state.finaleChoicesVisible;
      return {
        state: {
          ...state,
          reducedMotion: action.enabled,
          finaleChoicesVisible,
          availableActions: actionsFor(
            state.pageId,
            finaleChoicesVisible,
            state.h4ActionsVisible,
          ),
        },
        transition: null,
      };
    }
    case "REPLAY": {
      return {
        state: createFormalPicturebookPartialState(state.reducedMotion),
        transition: state.pageId === "root" ? null : transition(state, "branch"),
      };
    }
  }
}
