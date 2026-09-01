export const NIGHT_IDS = [
  "night-01",
  "night-02",
  "night-03",
  "night-04",
  "night-05",
] as const;

export type NightId = (typeof NIGHT_IDS)[number];

export const DURATION_OPTIONS = [3, 5, 8] as const;

export type DurationMinutes = (typeof DURATION_OPTIONS)[number];

export const ASSET_BUNDLE_IDS = [
  "main",
  "night-02",
  "night-03",
  "night-04",
  "night-05",
] as const;

export type AssetBundleId = (typeof ASSET_BUNDLE_IDS)[number];

export const SAFE_CHECKPOINT_IDS = [
  "welcome",
  "duration-selected",
  "room-ready",
  "core-complete",
  "quiet-stay",
  "ending",
] as const;

export type SafeCheckpointId = (typeof SAFE_CHECKPOINT_IDS)[number];

export interface RitualDefinition {
  readonly id: string;
  readonly prompt: string;
  readonly accessibilityAction: string;
}

export interface AmbientInteractionDefinition {
  readonly id: string;
  readonly prompt: string;
  readonly completionHint: string;
}

export interface NightDefinition {
  readonly id: NightId;
  readonly sequence: 1 | 2 | 3 | 4 | 5;
  readonly title: string;
  readonly assetBundle: AssetBundleId;
  readonly coreRitual: RitualDefinition;
  readonly ambientInteractions: readonly [
    AmbientInteractionDefinition,
    AmbientInteractionDefinition,
  ];
  readonly durationModes: readonly [3, 5, 8];
  readonly endingLines: readonly [string, ...string[]];
}

/** Persisted settings used by schema version 1. */
export interface UserSettingsV1 {
  readonly soundEnabled: boolean;
  readonly reducedMotion: boolean;
  readonly largeText: boolean;
}

/**
 * Current settings contract. Audio tracks are independent so muting feedback
 * never has to mute the room ambience or music as a side effect.
 */
export interface UserSettingsV2 {
  readonly musicEnabled: boolean;
  readonly ambientEnabled: boolean;
  readonly feedbackEnabled: boolean;
  readonly reducedMotion: boolean;
  readonly largeText: boolean;
}

/** Current runtime settings alias. */
export type UserSettings = UserSettingsV2;

export interface RecentSafeCheckpoint {
  readonly nightId: NightId;
  readonly checkpoint: SafeCheckpointId;
  readonly durationMinutes: DurationMinutes | null;
  readonly coreCompleted: boolean;
  readonly completedAmbientInteractionIds: readonly string[];
  readonly activeElapsedMs: number;
  readonly updatedAt: string;
}

export interface LocalSaveV1 {
  readonly schemaVersion: 1;
  readonly unlockedNightIds: readonly NightId[];
  readonly completedNightIds: readonly NightId[];
  readonly recentSafeCheckpoint: RecentSafeCheckpoint | null;
  readonly settings: UserSettingsV1;
  readonly updatedAt: string;
}

export type RecentAppCheckpoint =
  | {
    readonly kind: "outdoor-ready";
    readonly updatedAt: string;
  }
  | {
    readonly kind: "night-session";
    readonly nightId: NightId;
    readonly updatedAt: string;
  };

export interface LocalSaveV2 {
  readonly schemaVersion: 2;
  readonly unlockedNightIds: readonly NightId[];
  readonly completedNightIds: readonly NightId[];
  readonly recentSafeCheckpoint: RecentSafeCheckpoint | null;
  readonly recentAppCheckpoint: RecentAppCheckpoint;
  readonly settings: UserSettingsV2;
  readonly updatedAt: string;
}

/** Current runtime save alias. */
export type LocalSave = LocalSaveV2;

export interface AssetRecord {
  readonly id: string;
  readonly path: string;
  readonly kind: "image" | "audio" | "font" | "animation" | "data";
  readonly assetBundle: AssetBundleId;
  readonly author: string;
  readonly source: string;
  readonly license: string;
  readonly generationProcess: string;
  readonly humanEditVersion: string;
}

export function isNightId(value: unknown): value is NightId {
  return typeof value === "string" && NIGHT_IDS.some((nightId) => nightId === value);
}

export function isDurationMinutes(value: unknown): value is DurationMinutes {
  return typeof value === "number" && DURATION_OPTIONS.some((duration) => duration === value);
}

export function isSafeCheckpointId(value: unknown): value is SafeCheckpointId {
  return typeof value === "string" && SAFE_CHECKPOINT_IDS.some((checkpoint) => checkpoint === value);
}
