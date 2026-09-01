import type {
  FormalPicturebookBranch,
  FormalPicturebookH4State,
  FormalPicturebookMeteorSample,
  FormalPicturebookTransitionKind,
} from "./formal-picturebook-partial-model.ts";
import type { FormalPicturebookPageId } from "./formal-picturebook-partial-assets.ts";

export const FORMAL_PICTUREBOOK_PARTIAL_CONTRACT_MARKERS = [
  "FORMAL_PICTUREBOOK_BREEZE_HIDDEN=true",
  "root-r4",
  "stargaze-finale-meteor",
  "home-h4-ate",
  "home-h4-sipped",
] as const;

export type FormalPicturebookPartialDebugActionId =
  | "stargaze"
  | "home"
  | "next"
  | "h4-eat"
  | "h4-sip"
  | "finale-home"
  | "finale-stay"
  | "return-root";

export type FormalPicturebookPartialMountState = "loading" | "mounted" | "failed" | "destroyed";

export interface FormalPicturebookPartialDebugTransition {
  readonly kind: FormalPicturebookTransitionKind;
  readonly durationMs: number;
  readonly elapsedMs: number;
  readonly targetPageId: FormalPicturebookPageId;
}

export interface FormalPicturebookPartialDebugAudio {
  readonly ambientPlaying: boolean;
  readonly musicPlaying: boolean;
  readonly ambientAssigned: boolean;
  readonly musicAssigned: boolean;
  readonly ambientVolume: number;
  readonly musicVolume: number;
}

export interface FormalPicturebookPartialDebugSnapshot {
  readonly mounted: boolean;
  readonly mountState: FormalPicturebookPartialMountState;
  readonly pageId: FormalPicturebookPageId;
  readonly branch: FormalPicturebookBranch;
  readonly transition: FormalPicturebookPartialDebugTransition | null;
  readonly meteor: FormalPicturebookMeteorSample | null;
  readonly h4: FormalPicturebookH4State;
  readonly reducedMotion: boolean;
  readonly largeText: boolean;
  readonly audio: FormalPicturebookPartialDebugAudio;
  readonly livePagePaths: readonly string[];
  readonly contractMarkers: typeof FORMAL_PICTUREBOOK_PARTIAL_CONTRACT_MARKERS;
}

export interface FormalPicturebookPartialDebugApi {
  readonly snapshot: () => FormalPicturebookPartialDebugSnapshot;
  readonly tapAction: (actionId: FormalPicturebookPartialDebugActionId) => void;
  readonly setReducedMotion: (enabled: boolean) => void;
  readonly setLargeText: (enabled: boolean) => void;
  readonly advanceTime: (milliseconds: number) => void;
}

export interface FormalPicturebookPartialDebugController extends FormalPicturebookPartialDebugApi {}

export type FormalPicturebookPartialDebugGlobal = typeof globalThis & {
  __FORMAL_PICTUREBOOK_PARTIAL__?: FormalPicturebookPartialDebugApi;
};

/** Installs a non-visual deterministic driver only in browser evidence builds. */
export function installFormalPicturebookPartialDebugApi(
  browserEnvironment: boolean,
  controller: FormalPicturebookPartialDebugController,
  target: FormalPicturebookPartialDebugGlobal = globalThis as FormalPicturebookPartialDebugGlobal,
): () => void {
  if (!browserEnvironment) return () => {};
  const api: FormalPicturebookPartialDebugApi = {
    snapshot: () => controller.snapshot(),
    tapAction: (actionId) => controller.tapAction(actionId),
    setReducedMotion: (enabled) => controller.setReducedMotion(enabled),
    setLargeText: (enabled) => controller.setLargeText(enabled),
    advanceTime: (milliseconds) => controller.advanceTime(milliseconds),
  };
  target.__FORMAL_PICTUREBOOK_PARTIAL__ = api;
  return () => {
    if (target.__FORMAL_PICTUREBOOK_PARTIAL__ === api) {
      delete target.__FORMAL_PICTUREBOOK_PARTIAL__;
    }
  };
}
