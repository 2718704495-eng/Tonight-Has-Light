import {
  DURATION_OPTIONS,
  NIGHT_IDS,
  SAFE_CHECKPOINT_IDS,
  type LocalSaveV1,
  type LocalSaveV2,
  type NightId,
  type RecentAppCheckpoint,
  type RecentSafeCheckpoint,
  type UserSettingsV1,
  type UserSettingsV2,
} from "../domain/contracts.ts";
import { getNextNightId } from "../content/nights.ts";

// Keep the storage key stable so installed V1 saves are migrated in place.
export const LOCAL_SAVE_KEY = "tonight-has-light.local-save.v1";

export const DEFAULT_USER_SETTINGS: UserSettingsV2 = {
  musicEnabled: true,
  ambientEnabled: true,
  feedbackEnabled: true,
  reducedMotion: false,
  largeText: false,
};

export interface StoragePort {
  readonly getItem: (key: string) => string | null;
  readonly setItem: (key: string, value: string) => void;
  readonly removeItem?: (key: string) => void;
}

export type LoadSaveStatus = "missing" | "valid" | "recovered" | "unavailable";

export interface LoadSaveResult {
  readonly save: LocalSaveV2;
  readonly status: LoadSaveStatus;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function recoverSettingsV1(value: unknown): UserSettingsV1 {
  const settings = isRecord(value) ? value : {};
  return {
    soundEnabled: typeof settings.soundEnabled === "boolean"
      ? settings.soundEnabled
      : true,
    reducedMotion: typeof settings.reducedMotion === "boolean"
      ? settings.reducedMotion
      : DEFAULT_USER_SETTINGS.reducedMotion,
    largeText: typeof settings.largeText === "boolean"
      ? settings.largeText
      : DEFAULT_USER_SETTINGS.largeText,
  };
}

function recoverSettingsV2(value: unknown): UserSettingsV2 {
  const settings = isRecord(value) ? value : {};
  return {
    musicEnabled: typeof settings.musicEnabled === "boolean"
      ? settings.musicEnabled
      : DEFAULT_USER_SETTINGS.musicEnabled,
    ambientEnabled: typeof settings.ambientEnabled === "boolean"
      ? settings.ambientEnabled
      : DEFAULT_USER_SETTINGS.ambientEnabled,
    feedbackEnabled: typeof settings.feedbackEnabled === "boolean"
      ? settings.feedbackEnabled
      : DEFAULT_USER_SETTINGS.feedbackEnabled,
    reducedMotion: typeof settings.reducedMotion === "boolean"
      ? settings.reducedMotion
      : DEFAULT_USER_SETTINGS.reducedMotion,
    largeText: typeof settings.largeText === "boolean"
      ? settings.largeText
      : DEFAULT_USER_SETTINGS.largeText,
  };
}

export function migrateUserSettingsV1(settings: UserSettingsV1): UserSettingsV2 {
  return {
    musicEnabled: settings.soundEnabled,
    ambientEnabled: settings.soundEnabled,
    feedbackEnabled: settings.soundEnabled,
    reducedMotion: settings.reducedMotion,
    largeText: settings.largeText,
  };
}

function readNightIdArray(value: unknown): readonly NightId[] | null {
  if (!Array.isArray(value) || !value.every((item) => NIGHT_IDS.some((id) => id === item))) {
    return null;
  }
  return [...new Set(value)] as NightId[];
}

function readStringArray(value: unknown): readonly string[] | null {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    return null;
  }
  return [...new Set(value)];
}

function readCheckpoint(value: unknown): RecentSafeCheckpoint | null {
  if (!isRecord(value)) return null;

  const nightId = NIGHT_IDS.find((id) => id === value.nightId);
  const checkpoint = SAFE_CHECKPOINT_IDS.find((id) => id === value.checkpoint);
  const durationMinutes = value.durationMinutes === null
    ? null
    : DURATION_OPTIONS.find((duration) => duration === value.durationMinutes) ?? null;
  const ambientInteractionIds = readStringArray(value.completedAmbientInteractionIds);

  if (
    !nightId ||
    !checkpoint ||
    !ambientInteractionIds ||
    typeof value.coreCompleted !== "boolean" ||
    typeof value.activeElapsedMs !== "number" ||
    !Number.isFinite(value.activeElapsedMs) ||
    value.activeElapsedMs < 0 ||
    !isIsoTimestamp(value.updatedAt)
  ) {
    return null;
  }

  const requiresDuration = checkpoint !== "welcome";
  if (requiresDuration && durationMinutes === null) return null;
  if (!requiresDuration && value.durationMinutes !== null) return null;

  const checkpointRequiresCore = ["core-complete", "quiet-stay", "ending"].includes(checkpoint);
  if (checkpointRequiresCore !== value.coreCompleted) return null;

  return {
    nightId,
    checkpoint,
    durationMinutes,
    coreCompleted: value.coreCompleted,
    completedAmbientInteractionIds: ambientInteractionIds,
    activeElapsedMs: Math.floor(value.activeElapsedMs),
    updatedAt: value.updatedAt,
  };
}

function readAppCheckpoint(
  value: unknown,
  unlockedNightIds: readonly NightId[],
): RecentAppCheckpoint | null {
  if (!isRecord(value) || !isIsoTimestamp(value.updatedAt)) return null;
  if (value.kind === "outdoor-ready") {
    return { kind: "outdoor-ready", updatedAt: value.updatedAt };
  }
  if (value.kind !== "night-session") return null;

  const nightId = NIGHT_IDS.find((id) => id === value.nightId);
  if (!nightId || !unlockedNightIds.includes(nightId)) return null;
  return { kind: "night-session", nightId, updatedAt: value.updatedAt };
}

function getSequentialCompletedNightIds(value: readonly NightId[]): readonly NightId[] {
  const completed = new Set(value);
  const sequential: NightId[] = [];
  for (const nightId of NIGHT_IDS) {
    if (!completed.has(nightId)) break;
    sequential.push(nightId);
  }
  return sequential;
}

function deriveUnlockedNightIds(completedNightIds: readonly NightId[]): readonly NightId[] {
  const nextNightId = completedNightIds.length === 0
    ? NIGHT_IDS[0]
    : getNextNightId(completedNightIds[completedNightIds.length - 1] ?? NIGHT_IDS[0]);
  return nextNightId ? [...completedNightIds, nextNightId] : [...NIGHT_IDS];
}

function readNormalizedProgress(value: Record<string, unknown>): {
  readonly unlockedNightIds: readonly NightId[];
  readonly completedNightIds: readonly NightId[];
  readonly recentSafeCheckpoint: RecentSafeCheckpoint | null;
} | null {
  const persistedUnlocked = readNightIdArray(value.unlockedNightIds);
  const persistedCompleted = readNightIdArray(value.completedNightIds);
  if (!persistedUnlocked || !persistedCompleted) return null;

  const completedNightIds = getSequentialCompletedNightIds(persistedCompleted);
  const unlockedNightIds = deriveUnlockedNightIds(completedNightIds);
  const parsedCheckpoint = value.recentSafeCheckpoint === null
    ? null
    : readCheckpoint(value.recentSafeCheckpoint);
  const recentSafeCheckpoint = parsedCheckpoint && unlockedNightIds.includes(parsedCheckpoint.nightId)
    ? parsedCheckpoint
    : null;

  return { unlockedNightIds, completedNightIds, recentSafeCheckpoint };
}

function deriveMigratedAppCheckpoint(
  recentSafeCheckpoint: RecentSafeCheckpoint | null,
  fallbackNow: string,
): RecentAppCheckpoint {
  return recentSafeCheckpoint
    ? {
      kind: "night-session",
      nightId: recentSafeCheckpoint.nightId,
      updatedAt: recentSafeCheckpoint.updatedAt,
    }
    : { kind: "outdoor-ready", updatedAt: fallbackNow };
}

function normalizeParsedSaveV1(
  value: Record<string, unknown>,
  fallbackNow: string,
): LocalSaveV2 | null {
  if (value.schemaVersion !== 1) return null;

  const settings = recoverSettingsV1(value.settings);
  const progress = readNormalizedProgress(value);
  if (!progress) return null;

  const updatedAt = isIsoTimestamp(value.updatedAt) ? value.updatedAt : fallbackNow;
  return {
    schemaVersion: 2,
    ...progress,
    recentAppCheckpoint: deriveMigratedAppCheckpoint(progress.recentSafeCheckpoint, updatedAt),
    settings: migrateUserSettingsV1(settings),
    updatedAt,
  };
}

/** Explicit bridge for callers that already hold an in-memory V1 save. */
export function migrateLocalSaveV1(save: LocalSaveV1, fallbackNow = save.updatedAt): LocalSaveV2 {
  const normalized = normalizeParsedSaveV1(
    save as unknown as Record<string, unknown>,
    fallbackNow,
  );
  return normalized ?? {
    ...createDefaultSave(fallbackNow),
    settings: migrateUserSettingsV1(save.settings),
  };
}

function normalizeParsedSaveV2(
  value: Record<string, unknown>,
  fallbackNow: string,
): LocalSaveV2 | null {
  if (value.schemaVersion !== 2) return null;

  const settings = recoverSettingsV2(value.settings);
  const progress = readNormalizedProgress(value);
  if (!progress) return null;

  const updatedAt = isIsoTimestamp(value.updatedAt) ? value.updatedAt : fallbackNow;
  const parsedAppCheckpoint = readAppCheckpoint(value.recentAppCheckpoint, progress.unlockedNightIds);
  const recentAppCheckpoint = parsedAppCheckpoint
    ?? deriveMigratedAppCheckpoint(progress.recentSafeCheckpoint, updatedAt);

  return {
    schemaVersion: 2,
    ...progress,
    recentAppCheckpoint,
    settings,
    updatedAt,
  };
}

export function createDefaultSave(nowIso: string): LocalSaveV2 {
  return {
    schemaVersion: 2,
    unlockedNightIds: ["night-01"],
    completedNightIds: [],
    recentSafeCheckpoint: null,
    recentAppCheckpoint: { kind: "outdoor-ready", updatedAt: nowIso },
    settings: { ...DEFAULT_USER_SETTINGS },
    updatedAt: nowIso,
  };
}

export function loadLocalSave(storage: StoragePort, nowIso: string): LoadSaveResult {
  let rawValue: string | null;
  try {
    rawValue = storage.getItem(LOCAL_SAVE_KEY);
  } catch {
    return { save: createDefaultSave(nowIso), status: "unavailable" };
  }

  if (rawValue === null) {
    return { save: createDefaultSave(nowIso), status: "missing" };
  }

  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (!isRecord(parsed)) {
      return { save: createDefaultSave(nowIso), status: "recovered" };
    }

    const normalized = parsed.schemaVersion === 1
      ? normalizeParsedSaveV1(parsed, nowIso)
      : normalizeParsedSaveV2(parsed, nowIso);
    if (normalized) {
      const wasNormalized = JSON.stringify(normalized) !== JSON.stringify(parsed);
      return { save: normalized, status: wasNormalized ? "recovered" : "valid" };
    }

    const settingsRecord = isRecord(parsed.settings) ? parsed.settings : null;
    const hasV2AudioField = settingsRecord !== null && [
      "musicEnabled",
      "ambientEnabled",
      "feedbackEnabled",
    ].some((key) => key in settingsRecord);
    const recoverableSettings = parsed.schemaVersion === 1
      || (parsed.schemaVersion !== 2 && !hasV2AudioField)
      ? migrateUserSettingsV1(recoverSettingsV1(parsed.settings))
      : recoverSettingsV2(parsed.settings);
    const recoveredSave = createDefaultSave(nowIso);
    return {
      save: { ...recoveredSave, settings: recoverableSettings },
      status: "recovered",
    };
  } catch {
    return { save: createDefaultSave(nowIso), status: "recovered" };
  }
}

export function persistLocalSave(storage: StoragePort, save: LocalSaveV2): boolean {
  try {
    storage.setItem(LOCAL_SAVE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

export function updateUserSettings(
  save: LocalSaveV2,
  settings: UserSettingsV2,
  nowIso: string,
): LocalSaveV2 {
  return {
    ...save,
    settings: { ...settings },
    updatedAt: nowIso,
  };
}

export function storeRecentCheckpoint(
  save: LocalSaveV2,
  checkpoint: RecentSafeCheckpoint,
  nowIso: string,
): LocalSaveV2 {
  if (!save.unlockedNightIds.includes(checkpoint.nightId)) return save;
  return {
    ...save,
    recentSafeCheckpoint: checkpoint,
    recentAppCheckpoint: {
      kind: "night-session",
      nightId: checkpoint.nightId,
      updatedAt: nowIso,
    },
    updatedAt: nowIso,
  };
}

export function storeRecentAppCheckpoint(
  save: LocalSaveV2,
  checkpoint: RecentAppCheckpoint,
  nowIso: string,
): LocalSaveV2 {
  if (checkpoint.kind === "night-session" && !save.unlockedNightIds.includes(checkpoint.nightId)) {
    return save;
  }
  const shouldClearNightCheckpoint = checkpoint.kind === "outdoor-ready"
    || save.recentSafeCheckpoint?.nightId !== checkpoint.nightId;
  return {
    ...save,
    recentSafeCheckpoint: shouldClearNightCheckpoint ? null : save.recentSafeCheckpoint,
    recentAppCheckpoint: { ...checkpoint, updatedAt: nowIso },
    updatedAt: nowIso,
  };
}

export function completeNight(save: LocalSaveV2, nightId: NightId, nowIso: string): LocalSaveV2 {
  if (!save.unlockedNightIds.includes(nightId)) return save;

  const completedSet = new Set([...save.completedNightIds, nightId]);
  const completedNightIds = getSequentialCompletedNightIds(
    NIGHT_IDS.filter((candidate) => completedSet.has(candidate)),
  );

  return {
    ...save,
    completedNightIds,
    unlockedNightIds: deriveUnlockedNightIds(completedNightIds),
    updatedAt: nowIso,
  };
}

export function selectCurrentNightId(save: LocalSaveV2): NightId {
  const checkpointNightId = save.recentSafeCheckpoint?.nightId;
  if (checkpointNightId && save.unlockedNightIds.includes(checkpointNightId)) {
    return checkpointNightId;
  }
  return save.unlockedNightIds.find((nightId) => !save.completedNightIds.includes(nightId))
    ?? "night-05";
}
