import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const bootstrap = readFileSync(
  resolve(import.meta.dirname, "../assets/scripts/cocos/tonight-has-light-bootstrap.ts"),
  "utf8",
);
const indoorPreview = readFileSync(
  resolve(import.meta.dirname, "../assets/scripts/cocos/tonight-has-light-indoor-n01-preview.ts"),
  "utf8",
);
const sessionControls = readFileSync(
  resolve(import.meta.dirname, "../assets/scripts/cocos/tonight-has-light-formal-session-controls.ts"),
  "utf8",
);

test("the historical 0.4.7 warm-room loader remains bounded and retryable", () => {
  assert.match(
    indoorPreview,
    /export const INDOOR_N01_BUNDLE_LOAD_TIMEOUT_MS = 12_000/,
  );
  assert.match(indoorPreview, /let indoorBundleLoadInFlight: Promise<AssetManager\.Bundle> \| null = null/);
  assert.match(indoorPreview, /setTimeout\(\(\) => \{/);
  assert.match(indoorPreview, /房间加载得有点慢，请再试一次/);
  assert.match(indoorPreview, /try \{\s+assetManager\.loadBundle/);
  assert.match(indoorPreview, /catch \(error\) \{[\s\S]*?clearTimeout\(timeout\);[\s\S]*?reject\(error\);/);
  assert.match(indoorPreview, /indoorBundleLoadInFlight = null/);
  assert.match(
    indoorPreview,
    /export function preloadIndoorN01PreviewBundle\(\): Promise<void>/,
  );
});

test("the 0.4.8 bootstrap cannot re-enter the superseded warm-room loading chain", () => {
  assert.doesNotMatch(bootstrap, /TonightHasLightIndoorN01Preview/);
  assert.doesNotMatch(bootstrap, /preloadIndoorN01PreviewBundle/);
  assert.doesNotMatch(bootstrap, /startIndoorBundlePrefetch|mountIndoorScene|INDOOR_LOADED/);
  assert.match(bootstrap, /FormalPicturebookPartialScene/);
  assert.match(bootstrap, /resumeNightSession: false/);
});

test("the 0.4.8 bootstrap leaves the historical indoor duration clock disconnected", () => {
  assert.doesNotMatch(bootstrap, /nightTickAccumulatorSeconds/);
  assert.doesNotMatch(bootstrap, /type: "TICK"/);
  assert.doesNotMatch(bootstrap, /SELECT_DURATION/);
  assert.match(sessionControls, /send\(\{ type: "SELECT_DURATION", durationMinutes: this\.selectedDuration \}\)/);
});

test("the warm room waits for explicit duration confirmation before starting the stay clock", () => {
  const initializeBody = indoorPreview.match(
    /public async initialize\(bridge: TonightHasLightV0Bridge\): Promise<void> \{([\s\S]*?)\n  \}\n\n  public show/,
  )?.[1] ?? "";
  const showBody = indoorPreview.match(
    /public show\(\): void \{([\s\S]*?)\n  \}\n\n  public refresh/,
  )?.[1] ?? "";

  assert.doesNotMatch(initializeBody, /SELECT_DURATION/);
  assert.doesNotMatch(showBody, /bridge\.send\(\{ type: "SELECT_DURATION"|normalizeDisposableSession/);
  assert.match(showBody, /this\.normalizeInterruptedInteraction\(\)/);
  assert.match(showBody, /this\.root\.active = true/);
  assert.match(showBody, /this\.formalSessionControls\?\.activate\(\)/);
  assert.ok(
    showBody.indexOf("this.root.active = true") < showBody.indexOf("formalSessionControls?.activate"),
    "the warm room should be visible before its delayed paper reveal is activated",
  );
  assert.match(sessionControls, /send\(\{ type: "SELECT_DURATION", durationMinutes: this\.selectedDuration \}\)/);
  assert.match(indoorPreview, /this\.startRoomInteractionIfReady\(\)/);
});
