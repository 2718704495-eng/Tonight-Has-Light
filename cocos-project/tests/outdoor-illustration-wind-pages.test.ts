import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  OUTDOOR_ILLUSTRATION_OPENING_SETTLE_MS,
  OUTDOOR_ILLUSTRATION_TRANSITION_MS,
  OutdoorIllustrationWindPageModel,
  outdoorIllustrationQuietGapMs,
} from "../assets/scripts/cocos/outdoor-gate-c/outdoor-illustration-wind-model.ts";

const r2AssetRoot = resolve(
  import.meta.dirname,
  "../assets/outdoor-illustration-wind-r2",
);

function readR2Json(relativePath: string): any {
  return JSON.parse(readFileSync(resolve(r2AssetRoot, relativePath), "utf8"));
}

function advanceToRest(
  model: OutdoorIllustrationWindPageModel,
  milliseconds: number,
): void {
  model.advance(milliseconds);
  const snapshot = model.snapshot();
  assert.equal(snapshot.transition, null);
}

test("R2 starts after the approved settle and advances F0 through F4 in order", () => {
  const model = new OutdoorIllustrationWindPageModel();
  model.advance(OUTDOOR_ILLUSTRATION_OPENING_SETTLE_MS - 1);
  assert.equal(model.snapshot().currentPage, 0);
  assert.equal(model.snapshot().transition, null);

  model.advance(1);
  assert.deepEqual(model.snapshot().transition?.pages, [0, 1]);
  advanceToRest(model, OUTDOOR_ILLUSTRATION_TRANSITION_MS);
  assert.equal(model.snapshot().currentPage, 1);

  const expectedPages = [2, 3, 4, 0];
  const holds = [575, 625, 675, 800];
  for (let index = 0; index < expectedPages.length; index += 1) {
    model.advance(holds[index]!);
    assert.equal(model.snapshot().transition?.pages[1], expectedPages[index]);
    advanceToRest(model, OUTDOOR_ILLUSTRATION_TRANSITION_MS);
    assert.equal(model.snapshot().currentPage, expectedPages[index]);
  }
});

test("every 140ms transition uses smoothstep complementary opacity without an empty frame", () => {
  const model = new OutdoorIllustrationWindPageModel();
  assert.equal(model.startWind(), true);

  for (const elapsed of [0, 14, 35, 70, 105, 126, 140]) {
    const sample = new OutdoorIllustrationWindPageModel();
    sample.startWind();
    sample.advance(elapsed);
    const transition = sample.snapshot().transition;
    if (elapsed === 140) {
      assert.equal(transition, null);
      assert.equal(sample.snapshot().currentPage, 1);
      continue;
    }
    assert.ok(transition);
    assert.ok(transition.progress >= 0 && transition.progress <= 1);
    assert.ok(Math.abs(transition.fromOpacity + transition.toOpacity - 1) < 1e-9);
    assert.ok(transition.fromOpacity > 0 || transition.toOpacity > 0);
  }
});

test("an interrupted request settles the dominant page and ends on the latest target", () => {
  const model = new OutdoorIllustrationWindPageModel();
  model.requestPage(1);
  model.advance(90);
  model.requestPage(4);
  model.advance(30);
  model.requestPage(2);

  const inFlight = model.snapshot().transition;
  assert.ok(inFlight);
  assert.equal(inFlight.pages[1], 2);
  assert.ok(Math.abs(inFlight.fromOpacity + inFlight.toOpacity - 1) < 1e-9);

  model.advance(OUTDOOR_ILLUSTRATION_TRANSITION_MS);
  assert.equal(model.snapshot().transition, null);
  assert.equal(model.snapshot().currentPage, 2);
});

test("reduced motion fixes F0 and suppresses automatic or manual page changes", () => {
  const model = new OutdoorIllustrationWindPageModel();
  model.advance(OUTDOOR_ILLUSTRATION_OPENING_SETTLE_MS + 70);
  assert.ok(model.snapshot().transition);

  model.setReducedMotion(true);
  assert.equal(model.snapshot().currentPage, 0);
  assert.equal(model.snapshot().transition, null);
  assert.equal(model.startWind(), false);
  model.advance(60_000);
  assert.equal(model.snapshot().currentPage, 0);
  assert.equal(model.snapshot().transition, null);

  model.setReducedMotion(false);
  model.advance(OUTDOOR_ILLUSTRATION_OPENING_SETTLE_MS);
  assert.deepEqual(model.snapshot().transition?.pages, [0, 1]);
});

test("recurring quiet gaps stay deterministic and inside the approved 4.5–6.5s range", () => {
  const firstRun = Array.from({ length: 8 }, (_, index) => outdoorIllustrationQuietGapMs(index));
  const secondRun = Array.from({ length: 8 }, (_, index) => outdoorIllustrationQuietGapMs(index));
  assert.deepEqual(firstRun, secondRun);
  assert.ok(new Set(firstRun).size > 1, "the recurring pause must not become a metronome");
  assert.ok(firstRun.every((gap) => gap >= 4_500 && gap <= 6_500));
});

test("R2-EDGEFIX-01 keeps straight-alpha pages and Cocos transparent-edge repair", () => {
  const manifest = readR2Json("asset-manifest.json");
  assert.equal(manifest.candidate, "OUTDOOR-ILLUSTRATION-WIND-V1-A-R2");
  assert.equal(manifest.engineering_revision, "R2-EDGEFIX-01");
  assert.equal(manifest.alpha_encoding, "straight");
  assert.equal(manifest.runtime_contract.crossfade_ms, 140);
  assert.equal(manifest.runtime_contract.crossfade_easing, "smoothstep");
  assert.equal(manifest.states.length, 5);

  for (let index = 0; index < 5; index += 1) {
    const state = manifest.states[index];
    const meta = readR2Json(`lower-f${index}-390x844.png.meta`);
    assert.equal(state.state, `F${index}`);
    assert.equal(state.alpha_encoding, "straight");
    assert.equal(state.blend, "normal/straight-alpha");
    assert.equal(meta.userData.hasAlpha, true);
    assert.equal(meta.userData.fixAlphaTransparencyArtifacts, true);
    assert.equal(meta.subMetas["6c48a"].userData.minfilter, "linear");
    assert.equal(meta.subMetas["6c48a"].userData.magfilter, "linear");
  }
});
