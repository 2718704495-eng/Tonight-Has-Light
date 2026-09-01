import test from "node:test";
import assert from "node:assert/strict";
import {
  LOCAL_SAVE_KEY,
  completeNight,
  createDefaultSave,
  loadLocalSave,
  persistLocalSave,
  storeRecentCheckpoint,
  storeRecentAppCheckpoint,
  type StoragePort,
} from "../assets/scripts/core/local-save.ts";
import type { RecentSafeCheckpoint } from "../assets/scripts/domain/contracts.ts";

class MemoryStorage implements StoragePort {
  private readonly values = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const NOW = "2026-08-21T12:00:00.000Z";
const LATER = "2026-08-21T12:03:00.000Z";

function createQuietStayCheckpoint(nightId: "night-01" | "night-02"): RecentSafeCheckpoint {
  return {
    nightId,
    checkpoint: "quiet-stay",
    durationMinutes: 5,
    coreCompleted: true,
    completedAmbientInteractionIds: [],
    activeElapsedMs: 180_000,
    updatedAt: NOW,
  };
}

test("round-trips a valid V2 local save without recovery", () => {
  const storage = new MemoryStorage();
  const save = storeRecentAppCheckpoint(
    {
      ...createDefaultSave(NOW),
      settings: {
        musicEnabled: false,
        ambientEnabled: true,
        feedbackEnabled: false,
        reducedMotion: true,
        largeText: true,
      },
    },
    { kind: "night-session", nightId: "night-01", updatedAt: NOW },
    NOW,
  );

  assert.equal(persistLocalSave(storage, save), true);
  const loaded = loadLocalSave(storage, NOW);

  assert.equal(loaded.status, "valid");
  assert.deepEqual(loaded.save, save);
  assert.equal(loaded.save.schemaVersion, 2);
});

test("migrates V1 sound settings to all three V2 audio tracks", () => {
  for (const soundEnabled of [false, true]) {
    const storage = new MemoryStorage();
    storage.setItem(
      LOCAL_SAVE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        unlockedNightIds: ["night-01"],
        completedNightIds: [],
        recentSafeCheckpoint: null,
        settings: { soundEnabled, reducedMotion: true, largeText: false },
        updatedAt: NOW,
      }),
    );

    const loaded = loadLocalSave(storage, NOW);

    assert.equal(loaded.status, "recovered", `V1 ${soundEnabled} should migrate`);
    assert.equal(loaded.save.schemaVersion, 2);
    assert.deepEqual(loaded.save.settings, {
      musicEnabled: soundEnabled,
      ambientEnabled: soundEnabled,
      feedbackEnabled: soundEnabled,
      reducedMotion: true,
      largeText: false,
    });
    assert.deepEqual(loaded.save.recentAppCheckpoint, {
      kind: "outdoor-ready",
      updatedAt: NOW,
    });
  }
});

test("migrates a V1 room checkpoint to the outer night-session checkpoint", () => {
  const storage = new MemoryStorage();
  const checkpoint = createQuietStayCheckpoint("night-01");
  storage.setItem(
    LOCAL_SAVE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      unlockedNightIds: ["night-01"],
      completedNightIds: [],
      recentSafeCheckpoint: checkpoint,
      settings: { soundEnabled: true, reducedMotion: false, largeText: false },
      updatedAt: NOW,
    }),
  );

  const loaded = loadLocalSave(storage, NOW);

  assert.equal(loaded.status, "recovered");
  assert.deepEqual(loaded.save.recentSafeCheckpoint, checkpoint);
  assert.deepEqual(loaded.save.recentAppCheckpoint, {
    kind: "night-session",
    nightId: "night-01",
    updatedAt: NOW,
  });
});

test("preserves verifiable V2 settings while rebuilding corrupt progress", () => {
  const storage = new MemoryStorage();
  storage.setItem(
    LOCAL_SAVE_KEY,
    JSON.stringify({
      schemaVersion: 2,
      unlockedNightIds: "corrupt",
      completedNightIds: ["night-05"],
      recentSafeCheckpoint: { checkpoint: "not-a-checkpoint" },
      recentAppCheckpoint: { kind: "night-session", nightId: "night-05", updatedAt: NOW },
      settings: {
        musicEnabled: false,
        ambientEnabled: true,
        feedbackEnabled: false,
        reducedMotion: true,
        largeText: true,
      },
    }),
  );

  const loaded = loadLocalSave(storage, NOW);

  assert.equal(loaded.status, "recovered");
  assert.deepEqual(loaded.save.unlockedNightIds, ["night-01"]);
  assert.deepEqual(loaded.save.completedNightIds, []);
  assert.deepEqual(loaded.save.recentAppCheckpoint, {
    kind: "outdoor-ready",
    updatedAt: NOW,
  });
  assert.deepEqual(loaded.save.settings, {
    musicEnabled: false,
    ambientEnabled: true,
    feedbackEnabled: false,
    reducedMotion: true,
    largeText: true,
  });
});

test("preserves each valid V2 setting and defaults only damaged fields", () => {
  const storage = new MemoryStorage();
  storage.setItem(
    LOCAL_SAVE_KEY,
    JSON.stringify({
      schemaVersion: 2,
      unlockedNightIds: "corrupt",
      completedNightIds: [],
      settings: {
        musicEnabled: false,
        ambientEnabled: "corrupt",
        feedbackEnabled: false,
        reducedMotion: true,
        largeText: null,
      },
    }),
  );

  const loaded = loadLocalSave(storage, NOW);

  assert.equal(loaded.status, "recovered");
  assert.deepEqual(loaded.save.settings, {
    musicEnabled: false,
    ambientEnabled: true,
    feedbackEnabled: false,
    reducedMotion: true,
    largeText: false,
  });
});

test("repairs an invalid V2 app checkpoint from the valid room checkpoint", () => {
  const storage = new MemoryStorage();
  const checkpoint = createQuietStayCheckpoint("night-01");
  storage.setItem(
    LOCAL_SAVE_KEY,
    JSON.stringify({
      ...createDefaultSave(NOW),
      recentSafeCheckpoint: checkpoint,
      recentAppCheckpoint: { kind: "door-transition", updatedAt: NOW },
    }),
  );

  const loaded = loadLocalSave(storage, NOW);

  assert.equal(loaded.status, "recovered");
  assert.deepEqual(loaded.save.recentAppCheckpoint, {
    kind: "night-session",
    nightId: "night-01",
    updatedAt: NOW,
  });
});

test("unlocks nights only after sequential completion", () => {
  const initial = createDefaultSave(NOW);
  const invalidJump = completeNight(initial, "night-02", NOW);
  assert.deepEqual(invalidJump, initial);

  const afterFirst = completeNight(initial, "night-01", NOW);
  assert.deepEqual(afterFirst.completedNightIds, ["night-01"]);
  assert.deepEqual(afterFirst.unlockedNightIds, ["night-01", "night-02"]);

  const afterSecond = completeNight(afterFirst, "night-02", NOW);
  assert.deepEqual(afterSecond.completedNightIds, ["night-01", "night-02"]);
  assert.deepEqual(afterSecond.unlockedNightIds, ["night-01", "night-02", "night-03"]);
});

test("keeps the completed night checkpoint until the user explicitly leaves it", () => {
  const checkpoint = createQuietStayCheckpoint("night-01");
  const inQuietStay = storeRecentCheckpoint(createDefaultSave(NOW), checkpoint, NOW);

  const completed = completeNight(inQuietStay, "night-01", LATER);
  assert.deepEqual(completed.completedNightIds, ["night-01"]);
  assert.deepEqual(completed.recentSafeCheckpoint, checkpoint);
  assert.deepEqual(completed.recentAppCheckpoint, {
    kind: "night-session",
    nightId: "night-01",
    updatedAt: NOW,
  });

  const returnedOutdoor = storeRecentAppCheckpoint(
    completed,
    { kind: "outdoor-ready", updatedAt: LATER },
    LATER,
  );
  assert.equal(returnedOutdoor.recentSafeCheckpoint, null);
  assert.deepEqual(returnedOutdoor.recentAppCheckpoint, {
    kind: "outdoor-ready",
    updatedAt: LATER,
  });
});

test("starting the next unlocked night clears the previous night's safe checkpoint", () => {
  const completed = completeNight(
    storeRecentCheckpoint(
      createDefaultSave(NOW),
      createQuietStayCheckpoint("night-01"),
      NOW,
    ),
    "night-01",
    LATER,
  );

  const nextNight = storeRecentAppCheckpoint(
    completed,
    { kind: "night-session", nightId: "night-02", updatedAt: LATER },
    LATER,
  );
  assert.equal(nextNight.recentSafeCheckpoint, null);
  assert.deepEqual(nextNight.recentAppCheckpoint, {
    kind: "night-session",
    nightId: "night-02",
    updatedAt: LATER,
  });
});
