import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const bootstrapSource = readFileSync(
  resolve(
    import.meta.dirname,
    "../assets/scripts/cocos/tonight-has-light-bootstrap.ts",
  ),
  "utf8",
);

test("0.4.8 bootstrap mounts the formal partial picturebook with an isolated save namespace", () => {
  assert.match(
    bootstrapSource,
    /import \{ FormalPicturebookPartialScene \} from "\.\/formal-picturebook-0-4-8\/formal-picturebook-partial-scene\.ts";/,
  );
  assert.match(
    bootstrapSource,
    /const FORMAL_PICTUREBOOK_PARTIAL_STORAGE_PREFIX = "formal-picturebook-partial-r1-0\.4\.8:";/,
  );
  assert.match(
    bootstrapSource,
    /this\.node\.addComponent\(FormalPicturebookPartialScene\)/,
  );
});

test("0.4.8 bootstrap does not retain the superseded 0.4.7 or disposable warm-room runtime chain", () => {
  for (const forbidden of [
    "OutdoorGateCScene",
    "outdoor-story-b-kf-r1-temp",
    "phone-preview-story-b-kf-r1-temp-r1-0.4.7:",
    "TonightHasLightIndoorN01Preview",
    "preloadIndoorN01PreviewBundle",
    "startIndoorBundlePrefetch",
    "mountIndoorScene",
  ]) {
    assert.equal(
      bootstrapSource.includes(forbidden),
      false,
      `bootstrap still contains superseded marker: ${forbidden}`,
    );
  }
});

test("0.4.8 bootstrap forwards accessibility, sound and lifecycle settings to the partial scene", () => {
  for (const required of [
    "setReducedMotion(updatedSettings.reducedMotion)",
    "setSoundEnabled(updatedSettings.ambientEnabled)",
    "setMusicEnabled(updatedSettings.musicEnabled)",
    "setLargeText(updatedSettings.largeText)",
    "pauseAudioForInterruption()",
    "resumeAudioFromInterruption()",
    "replay()",
  ]) {
    assert.equal(
      bootstrapSource.includes(required),
      true,
      `bootstrap is missing partial-scene lifecycle marker: ${required}`,
    );
  }
});
