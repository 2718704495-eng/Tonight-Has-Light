import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import {
  OUTDOOR_GATE_C_HERO_STAR_COUNT,
  OUTDOOR_GATE_C_DURATION_MS,
  OUTDOOR_GATE_C_BREATH_SCALE_Y,
  OUTDOOR_GATE_C_MANIFEST_CONTRACT,
  OUTDOOR_GATE_C_MANUAL_WIND_DURATION_MS,
  OUTDOOR_GATE_C_MAX_ROTATION_DEGREES,
  OUTDOOR_GATE_C_OPENING_GUST_END_MS,
  OUTDOOR_GATE_C_OPENING_GUST_START_MS,
  OUTDOOR_GATE_C_ROTATION_SIGN,
  OUTDOOR_GATE_C_WIND_TRANSLATION_X_PX_BY_CHANNEL,
  OUTDOOR_GATE_C_WIND_CUES,
  type OutdoorGateCWindChannel,
} from "../assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-contract.ts";
import {
  OUTDOOR_GATE_C_FIRST_RECURRING_GUST_GAP_MAX_MS,
  OUTDOOR_GATE_C_FIRST_RECURRING_GUST_GAP_MIN_MS,
  OUTDOOR_GATE_C_RECURRING_GUST_INTERVAL_MAX_MS,
  OUTDOOR_GATE_C_RECURRING_GUST_INTERVAL_MIN_MS,
  OUTDOOR_GATE_C_RECURRING_GUSTS_AFTER_MS,
  OutdoorGateCPersistentScheduler,
  outdoorGateCRecurringGustIntervalMs,
  outdoorGateCRuntimeSampleMs,
  sampleOutdoorGateCPersistentTimeline,
  sampleOutdoorGateCTimeline,
} from "../assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-timeline.ts";
import { computeOutdoorGateCPixelAlignedViewport } from "../assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-viewport.ts";
import { loadSettledResourceBatch } from "../assets/scripts/cocos/outdoor-gate-c/settled-resource-batch.ts";
import {
  OUTDOOR_GATE_C_LAYER_ADAPTER,
  OUTDOOR_GATE_C_EXPECTED_RENDER_ORDER,
  validateOutdoorVisualManifest,
} from "../assets/scripts/cocos/outdoor-gate-c/outdoor-visual-manifest.ts";

const STATIC_STAR_OPACITY_FOR_TEST = 0;

test("waits for late frame outcomes and releases every success before rejecting", async () => {
  let resolveLate: ((value: string) => void) | undefined;
  const released: string[] = [];
  const loading = loadSettledResourceBatch(
    ["early", "failed", "late"],
    async (path) => {
      if (path === "failed") throw new Error("frame failed");
      if (path === "late") return new Promise<string>((resolveLateFrame) => {
        resolveLate = resolveLateFrame;
      });
      return "early-frame";
    },
    (path) => released.push(path),
  );
  let settled = false;
  void loading.finally(() => {
    settled = true;
  }).catch(() => undefined);
  await new Promise((resolveTurn) => setImmediate(resolveTurn));
  assert.equal(settled, false, "batch must not reject before the late frame settles");
  resolveLate?.("late-frame");
  await assert.rejects(loading, /frame failed/);
  assert.deepEqual(released, ["early", "late"]);
});

test("returns a successful frame batch in manifest order without releasing it", async () => {
  const released: string[] = [];
  const loaded = await loadSettledResourceBatch(
    ["slow", "fast"],
    async (path) => {
      if (path === "slow") await new Promise((resolveTurn) => setImmediate(resolveTurn));
      return `${path}-frame`;
    },
    (path) => released.push(path),
  );
  assert.deepEqual(loaded, [
    { path: "slow", resource: "slow-frame" },
    { path: "fast", resource: "fast-frame" },
  ]);
  assert.deepEqual(released, []);
});

function peakTime(channel: OutdoorGateCWindChannel): number {
  let bestTime = 0;
  let bestValue = -1;
  for (let time = 0; time <= OUTDOOR_GATE_C_DURATION_MS; time += 10) {
    const value = sampleOutdoorGateCTimeline(time, false).wind[channel];
    if (value > bestValue) {
      bestTime = time;
      bestValue = value;
    }
  }
  return bestTime;
}

const TRUE_MOTION_LAYER_IDS = [
  "grass_far_accents",
  "grass_near_accents",
  "person_hair_tuft",
  "person_clothes_hem",
  "cat_ears",
  "cat_tail_tip",
] as const;

test("reserves whole-pixel safety bars by scaling only the 430x932 scene root", () => {
  assert.deepEqual(computeOutdoorGateCPixelAlignedViewport(390, 844), {
    scale: 1,
    viewport: { x: 0, y: 0, width: 390, height: 844 },
    rootScale: { x: 1, y: 1 },
    contentRect: { x: 0, y: 0, width: 390, height: 844 },
  });

  const tall = computeOutdoorGateCPixelAlignedViewport(430, 932);
  assert.equal(tall.scale, 430 / 390);
  assert.deepEqual(tall.viewport, { x: 0, y: 0, width: 430, height: 932 });
  assert.equal(tall.rootScale.x, 1);
  assert.ok(Math.abs(tall.rootScale.y - 930 / (844 * (430 / 390))) < 1e-12);
  assert.deepEqual(tall.contentRect, { x: 0, y: 1, width: 430, height: 930 });

  const narrow = computeOutdoorGateCPixelAlignedViewport(360, 800);
  assert.equal(narrow.scale, 360 / 390);
  assert.equal(narrow.viewport.x, 0);
  assert.equal(narrow.viewport.y, 10);
  assert.equal(narrow.viewport.width, 360);
  assert.ok(Math.abs(narrow.viewport.height - (844 * 360) / 390) < 1e-9);
  assert.deepEqual(narrow.rootScale, { x: 1, y: 1 });

  const wide = computeOutdoorGateCPixelAlignedViewport(430, 844);
  assert.deepEqual(wide, {
    scale: 1,
    viewport: { x: 20, y: 0, width: 390, height: 844 },
    rootScale: { x: 1, y: 1 },
    contentRect: { x: 20, y: 0, width: 390, height: 844 },
  });
});

test("defines the approved V7 Gate C manifest boundary", () => {
  assert.equal(OUTDOOR_GATE_C_MANIFEST_CONTRACT.designSize.width, 390);
  assert.equal(OUTDOOR_GATE_C_MANIFEST_CONTRACT.designSize.height, 844);
  assert.equal(OUTDOOR_GATE_C_MANIFEST_CONTRACT.heroStarCount, 10);
  assert.match(OUTDOOR_GATE_C_MANIFEST_CONTRACT.approvedMasterSha256, /^[a-f0-9]{64}$/);
  assert.equal(
    OUTDOOR_GATE_C_MANIFEST_CONTRACT.approvedHandoffHashesSha256,
    "a21c6123f1f5404a9471f9bc637c960be389aada91e0ba56ff34943935df53ee",
  );
  assert.equal(
    OUTDOOR_GATE_C_MANIFEST_CONTRACT.approvedManifestSha256,
    "78501bc24de124018b9567fdf08e34f22667b4127df2c8969c16fc9d0af552cd",
  );
  assert.ok(OUTDOOR_GATE_C_MANIFEST_CONTRACT.requiredLayerIds.includes("human-hair"));
  assert.ok(OUTDOOR_GATE_C_MANIFEST_CONTRACT.requiredLayerIds.includes("cat-tail"));
});

test("adapts every canonical layer to the checked-in UI manifest without dropping a star", () => {
  const manifestPath = resolve(
    import.meta.dirname,
    "../assets/resources/outdoor-gate-c/prototype_layer_manifest.json",
  );
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  assert.deepEqual(validateOutdoorVisualManifest(manifest), []);
  assert.equal(Object.keys(OUTDOOR_GATE_C_LAYER_ADAPTER).length, 13);
  assert.equal(manifest.approved_baseline, "V7");
  assert.equal(manifest.style_changed, false);
  assert.equal(manifest.engineering_layering_only, true);
  assert.equal(manifest.motion_contract_id, "OUTDOOR-MOTION-PHONE-V2-B");
  assert.equal(manifest.asset_package_id, "outdoor-motion-phone-v2-b-assets-r1");
  assert.deepEqual(manifest.motion_layer_contract.ids, TRUE_MOTION_LAYER_IDS);
  assert.equal(manifest.motion_layer_contract.node_neutral_opacity, 1);
  assert.equal(manifest.motion_layer_contract.node_runtime_opacity, 1);
  assert.equal(manifest.motion_layer_contract.baked_static_copy_removed, true);
  assert.deepEqual(manifest.render_order, OUTDOOR_GATE_C_EXPECTED_RENDER_ORDER);
  assert.deepEqual(
    manifest.layers_back_to_front.map((layer: { id: string }) => layer.id),
    OUTDOOR_GATE_C_EXPECTED_RENDER_ORDER,
  );
  assert.equal(
    manifest.layers_back_to_front.filter((layer: { id?: string }) => /^star_\d{2}$/.test(layer.id ?? "")).length,
    OUTDOOR_GATE_C_HERO_STAR_COUNT,
  );
  assert.equal(manifest.layers_back_to_front.length, 30);
  const neutralLayers = manifest.layers_back_to_front.filter(
    (layer: { neutral_opacity: number }) => layer.neutral_opacity !== 0,
  );
  assert.deepEqual(
    neutralLayers.map((layer: { id: string; neutral_opacity: number }) => [layer.id, layer.neutral_opacity]),
    ["scene_clean_plate", ...TRUE_MOTION_LAYER_IDS].map((id) => [id, 1]),
    "the clean plate and six true motion layers must stay opaque at rest",
  );
});

test("keeps legacy V7/R2 layers historical while the B story owns the visible runtime", () => {
  const rigSource = readFileSync(
    resolve(import.meta.dirname, "../assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-rig.ts"),
    "utf8",
  );
  const sceneSource = readFileSync(
    resolve(import.meta.dirname, "../assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-scene.ts"),
    "utf8",
  );

  assert.equal(rigSource.includes("windOverlayOpacities"), false);
  assert.equal(sceneSource.includes("windOverlayOpacities"), false);
  assert.equal(sceneSource.includes("outdoor-illustration-wind-r2"), false);
  assert.equal(sceneSource.includes("OutdoorIllustrationWindPages"), false);
  assert.equal(sceneSource.includes("ILLUSTRATION_WIND_R2"), false);
  assert.equal(sceneSource.includes("prototype_layer_manifest"), false);
  assert.equal(sceneSource.includes("flower_a_glow"), false);
  assert.equal(sceneSource.includes("flower_b_glow"), false);
  assert.ok(sceneSource.includes('"outdoor-story-b-kf-r1-temp"'));
  assert.ok(sceneSource.includes("OutdoorStoryPages"));
  assert.ok(TRUE_MOTION_LAYER_IDS.every((id) => !sceneSource.includes(`"${id}"`)));
});

test("locks the frozen UI handoff inventory and manifest hashes", () => {
  const resourcesRoot = resolve(import.meta.dirname, "../assets/resources/outdoor-gate-c");
  const hashFile = readFileSync(resolve(resourcesRoot, "prototype_handoff_hashes.txt"));
  const manifestFile = readFileSync(resolve(resourcesRoot, "prototype_layer_manifest.json"));
  assert.equal(
    createHash("sha256").update(hashFile).digest("hex"),
    OUTDOOR_GATE_C_MANIFEST_CONTRACT.approvedHandoffHashesSha256,
  );
  assert.equal(
    createHash("sha256").update(manifestFile).digest("hex"),
    OUTDOOR_GATE_C_MANIFEST_CONTRACT.approvedManifestSha256,
  );
});

test("keeps Gate C layer compositing off private Sprite blend fields", () => {
  const sceneSource = readFileSync(
    resolve(import.meta.dirname, "../assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-scene.ts"),
    "utf8",
  );
  assert.equal(sceneSource.includes("_srcBlendFactor"), false);
  assert.equal(sceneSource.includes("_dstBlendFactor"), false);
  assert.ok(sceneSource.includes("computeOutdoorGateCPixelAlignedViewport"));
  assert.ok(sceneSource.includes("root.setScale(presentation.rootScale.x, presentation.rootScale.y, 1)"));
  assert.ok(sceneSource.includes("ResolutionPolicy.SHOW_ALL"));
  assert.ok(sceneSource.includes('new Color("#06265F")'));
  assert.ok(sceneSource.includes("sceneCamera.clearColor = SAFETY_BAR_CLEAR_COLOR"));
});

test("keeps the historical premultiplied Screen effect valid but out of the B runtime", () => {
  const sceneSource = readFileSync(
    resolve(import.meta.dirname, "../assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-scene.ts"),
    "utf8",
  );
  const effectSource = readFileSync(
    resolve(import.meta.dirname, "../assets/resources/outdoor-gate-c/outdoor_screen_sprite.effect"),
    "utf8",
  );
  assert.equal(sceneSource.includes("EffectAsset"), false);
  assert.equal(sceneSource.includes("sprite.customMaterial = screenMaterial"), false);
  assert.equal(sceneSource.includes("layer.blend === \"screen\""), false);
  assert.equal(sceneSource.includes("sprite.srcBlendFactor"), false);
  assert.equal(sceneSource.includes("sprite.dstBlendFactor"), false);
  assert.match(effectSource, /blendSrc:\s*one\b/);
  assert.match(effectSource, /blendDst:\s*one_minus_src_color\b/);
  assert.match(effectSource, /o\.rgb\s*\*=\s*o\.a/);

  const premultipliedScreen = (source: number, alpha: number, destination: number): number => {
    const premultipliedSource = source * alpha;
    return premultipliedSource + destination * (1 - premultipliedSource);
  };
  for (const destination of [0, 0.17, 0.5, 1]) {
    assert.equal(premultipliedScreen(1, 0, destination), destination);
    for (const source of [0, 0.25, 0.75, 1]) {
      const result = premultipliedScreen(source, 0.06, destination);
      assert.ok(result >= destination, "positive-only Screen overlays must never darken V7");
      assert.ok(result <= 1);
    }
  }
});

test("clamps the one-shot sample at a neutral 9.8 second tail frame", () => {
  assert.ok(OUTDOOR_GATE_C_DURATION_MS >= 9_600);
  assert.ok(OUTDOOR_GATE_C_DURATION_MS <= 10_000);
  assert.deepEqual(
    sampleOutdoorGateCTimeline(OUTDOOR_GATE_C_DURATION_MS, false),
    sampleOutdoorGateCTimeline(OUTDOOR_GATE_C_DURATION_MS + 5_000, false),
  );
  assert.notDeepEqual(
    sampleOutdoorGateCTimeline(0, false),
    sampleOutdoorGateCTimeline(OUTDOOR_GATE_C_DURATION_MS, false),
  );
  const tail = sampleOutdoorGateCTimeline(OUTDOOR_GATE_C_DURATION_MS, false);
  assert.deepEqual(Object.values(tail.wind), [0, 0, 0, 0, 0, 0]);
  assert.equal(tail.humanBreath, 0);
  assert.equal(tail.catBreath, 0);
  assert.deepEqual(tail.cloudOffsetX, [0, 0]);
  assert.deepEqual(tail.cloudOpacity, [0, 0]);
  assert.deepEqual(Object.values(tail.windOverlayOpacity), [0, 0, 0, 0, 0, 0]);
  assert.deepEqual(tail.bodyOverlayOpacity, [0, 0]);
  assert.deepEqual(tail.heroStarBrightness, Array.from({ length: 10 }, () => 0));
  assert.deepEqual(tail.flowerBrightness, [0, 0]);
});

test("starts V2-B after a 900ms settle and schedules gusts after approved quiet gaps", () => {
  const scheduler = new OutdoorGateCPersistentScheduler();
  assert.deepEqual(
    [
      OUTDOOR_GATE_C_FIRST_RECURRING_GUST_GAP_MIN_MS,
      OUTDOOR_GATE_C_FIRST_RECURRING_GUST_GAP_MAX_MS,
      OUTDOOR_GATE_C_RECURRING_GUST_INTERVAL_MIN_MS,
      OUTDOOR_GATE_C_RECURRING_GUST_INTERVAL_MAX_MS,
    ],
    [4_500, 6_500, 6_000, 9_000],
  );
  assert.equal(outdoorGateCRuntimeSampleMs(0), OUTDOOR_GATE_C_DURATION_MS);
  assert.equal(outdoorGateCRuntimeSampleMs(899), OUTDOOR_GATE_C_DURATION_MS);
  assert.equal(outdoorGateCRuntimeSampleMs(OUTDOOR_GATE_C_OPENING_GUST_START_MS), 0);
  assert.equal(outdoorGateCRuntimeSampleMs(1_700), 800);
  assert.equal(outdoorGateCRuntimeSampleMs(OUTDOOR_GATE_C_DURATION_MS), OUTDOOR_GATE_C_DURATION_MS);
  assert.equal(outdoorGateCRuntimeSampleMs(10_000), OUTDOOR_GATE_C_DURATION_MS);
  assert.equal(outdoorGateCRuntimeSampleMs(Number.POSITIVE_INFINITY), OUTDOOR_GATE_C_DURATION_MS);
  assert.equal(outdoorGateCRuntimeSampleMs(Number.NaN), OUTDOOR_GATE_C_DURATION_MS);

  for (const time of [0, 899, 900, 2_750, 5_000, OUTDOOR_GATE_C_DURATION_MS]) {
    assert.deepEqual(
      sampleOutdoorGateCPersistentTimeline(time, false, scheduler),
      sampleOutdoorGateCTimeline(time, false),
      "the opening sampler must remain deterministic for the approved V2-B take",
    );
  }

  const starts = scheduler.recurringGustStartsThrough(180_000);
  assert.ok(starts.length >= 10);
  assert.ok(starts[0]! > OUTDOOR_GATE_C_RECURRING_GUSTS_AFTER_MS);
  const visibleQuietGaps = starts.map((start, index) => index === 0
    ? start - OUTDOOR_GATE_C_OPENING_GUST_END_MS
    : start - (starts[index - 1] ?? start) - OUTDOOR_GATE_C_MANUAL_WIND_DURATION_MS);
  assert.equal(visibleQuietGaps[0], outdoorGateCRecurringGustIntervalMs(0));
  assert.ok(
    visibleQuietGaps[0]! >= OUTDOOR_GATE_C_FIRST_RECURRING_GUST_GAP_MIN_MS
    && visibleQuietGaps[0]! <= OUTDOOR_GATE_C_FIRST_RECURRING_GUST_GAP_MAX_MS,
  );
  assert.deepEqual(
    visibleQuietGaps.slice(1),
    visibleQuietGaps.slice(1).map((_, index) => outdoorGateCRecurringGustIntervalMs(index + 1)),
  );
  assert.ok(visibleQuietGaps.slice(1).every((gap) => (
    gap >= OUTDOOR_GATE_C_RECURRING_GUST_INTERVAL_MIN_MS
    && gap <= OUTDOOR_GATE_C_RECURRING_GUST_INTERVAL_MAX_MS
  )));
  assert.ok(
    Math.max(...visibleQuietGaps) <= 9_000,
    "cat-tail end to next far-grass start must never leave more than 9s visibly still",
  );
  assert.ok(new Set(visibleQuietGaps).size > 1, "the schedule must not collapse into a fixed loop");
  assert.deepEqual(
    starts,
    new OutdoorGateCPersistentScheduler().recurringGustStartsThrough(180_000),
    "the same seed must reproduce the same schedule",
  );

  const firstStart = starts[0]!;
  assert.equal(scheduler.runtimeWindSampleMs(firstStart), 0);
  assert.equal(scheduler.runtimeWindSampleMs(firstStart + 800), 800);
  assert.deepEqual(
    sampleOutdoorGateCPersistentTimeline(firstStart + 2_150, false, scheduler).wind,
    sampleOutdoorGateCTimeline(OUTDOOR_GATE_C_OPENING_GUST_START_MS + 2_150, false).wind,
    "a recurring gust must preserve every approved V2-B cue and amplitude",
  );
  assert.deepEqual(
    Object.values(sampleOutdoorGateCPersistentTimeline(7_000, false, scheduler).wind),
    [0, 0, 0, 0, 0, 0],
  );

  const deterministicIntervals = Array.from(
    { length: 24 },
    (_, index) => outdoorGateCRecurringGustIntervalMs(index),
  );
  assert.ok(
    deterministicIntervals[0]! >= OUTDOOR_GATE_C_FIRST_RECURRING_GUST_GAP_MIN_MS
    && deterministicIntervals[0]! <= OUTDOOR_GATE_C_FIRST_RECURRING_GUST_GAP_MAX_MS,
  );
  assert.ok(deterministicIntervals.slice(1).every((interval) => (
    interval >= OUTDOOR_GATE_C_RECURRING_GUST_INTERVAL_MIN_MS
    && interval <= OUTDOOR_GATE_C_RECURRING_GUST_INTERVAL_MAX_MS
  )));
});

test("does not hide a valid recurring gust that starts before the 9.8s take boundary", () => {
  const scheduler = new OutdoorGateCPersistentScheduler(0);
  const firstGapMs = outdoorGateCRecurringGustIntervalMs(0, 0);
  const firstStartMs = OUTDOOR_GATE_C_OPENING_GUST_END_MS + firstGapMs;
  assert.ok(firstStartMs < OUTDOOR_GATE_C_DURATION_MS, "seed zero exercises the boundary overlap");
  assert.equal(scheduler.runtimeWindSampleMs(firstStartMs), 0);
  assert.equal(scheduler.runtimeWindSampleMs(firstStartMs + 800), 800);
  assert.ok(
    sampleOutdoorGateCPersistentTimeline(firstStartMs + 160, false, scheduler)
      .wind["far-grass"] >= 0.18,
  );
});

test("defers automatic wind after a manual or first-touch V2-B gust without resetting runtime time", () => {
  const scheduler = new OutdoorGateCPersistentScheduler();
  const manualWindStartMs = 100;
  const manualWindEndMs = manualWindStartMs + OUTDOOR_GATE_C_MANUAL_WIND_DURATION_MS;
  scheduler.deferAfterManualGust(manualWindEndMs);
  const starts = scheduler.recurringGustStartsThrough(40_000);
  assert.ok(starts.length >= 1);
  const firstGapAfterManualWind = starts[0]!
    - manualWindEndMs;
  assert.equal(firstGapAfterManualWind, outdoorGateCRecurringGustIntervalMs(0));
  assert.ok(
    firstGapAfterManualWind >= OUTDOOR_GATE_C_FIRST_RECURRING_GUST_GAP_MIN_MS
    && firstGapAfterManualWind <= OUTDOOR_GATE_C_FIRST_RECURRING_GUST_GAP_MAX_MS,
  );
  assert.equal(
    scheduler.runtimeWindSampleMs(4_300),
    OUTDOOR_GATE_C_DURATION_MS,
    "the superseded opening tail must not resume after the manual chain",
  );
  assert.deepEqual(
    Object.values(sampleOutdoorGateCPersistentTimeline(4_300, false, scheduler).wind),
    [0, 0, 0, 0, 0, 0],
  );
  assert.equal(scheduler.runtimeWindSampleMs(starts[0]!), 0);
});

test("keeps ambient life asynchronous instead of replaying the whole take every fixed interval", () => {
  const scheduler = new OutdoorGateCPersistentScheduler();
  const atQuietSevenSeconds = sampleOutdoorGateCPersistentTimeline(7_000, false, scheduler);
  const oldLoopEquivalent = sampleOutdoorGateCTimeline(0, false);
  assert.notDeepEqual(atQuietSevenSeconds, oldLoopEquivalent);
  assert.deepEqual(Object.values(atQuietSevenSeconds.wind), [0, 0, 0, 0, 0, 0]);

  const postOpening = sampleOutdoorGateCPersistentTimeline(
    OUTDOOR_GATE_C_DURATION_MS + 3_000,
    false,
    scheduler,
  );
  const originalThreeSecondAmbient = sampleOutdoorGateCTimeline(3_000, false);
  assert.notDeepEqual(
    {
      humanBreath: postOpening.humanBreath,
      catBreath: postOpening.catBreath,
      cloudOffsetX: postOpening.cloudOffsetX,
      heroStarBrightness: postOpening.heroStarBrightness,
      flowerBrightness: postOpening.flowerBrightness,
    },
    {
      humanBreath: originalThreeSecondAmbient.humanBreath,
      catBreath: originalThreeSecondAmbient.catBreath,
      cloudOffsetX: originalThreeSecondAmbient.cloudOffsetX,
      heroStarBrightness: originalThreeSecondAmbient.heroStarBrightness,
      flowerBrightness: originalThreeSecondAmbient.flowerBrightness,
    },
    "ambient channels must not restart together as a second copy of the evidence take",
  );

  const laterSamples = [22_000, 26_000, 31_000, 37_000].map((time) =>
    sampleOutdoorGateCPersistentTimeline(time, false, scheduler));
  assert.ok(laterSamples.some((sample) => sample.humanBreath !== sample.catBreath));
  assert.ok(laterSamples.some((sample) => sample.cloudOffsetX.some((offset) => offset > 0)));
  assert.ok(laterSamples.some((sample) => sample.heroStarBrightness.some((value) => value > 0)));
  assert.ok(laterSamples.some((sample) => sample.flowerBrightness.some((value) => value > 0)));

  const signatures = laterSamples.map((sample) => JSON.stringify({
    humanBreath: sample.humanBreath,
    catBreath: sample.catBreath,
    cloudOffsetX: sample.cloudOffsetX,
    heroStarBrightness: sample.heroStarBrightness,
    flowerBrightness: sample.flowerBrightness,
  }));
  assert.equal(new Set(signatures).size, signatures.length);
});

test("keeps every persistent runtime time static in reduced motion", () => {
  const scheduler = new OutdoorGateCPersistentScheduler();
  for (const time of [0, 2_920, 16_000, 20_000, 60_000, 3_600_000]) {
    const sample = sampleOutdoorGateCPersistentTimeline(time, true, scheduler);
    assert.deepEqual(Object.values(sample.wind), [0, 0, 0, 0, 0, 0]);
    assert.equal(sample.humanBreath, 0);
    assert.equal(sample.catBreath, 0);
    assert.deepEqual(sample.cloudOffsetX, [0, 0]);
    assert.deepEqual(sample.cloudOpacity, [0, 0]);
    assert.deepEqual(Object.values(sample.windOverlayOpacity), [0, 0, 0, 0, 0, 0]);
    assert.deepEqual(sample.bodyOverlayOpacity, [0, 0]);
    assert.deepEqual(sample.heroStarBrightness, Array.from({ length: 10 }, () => 0));
    assert.deepEqual(sample.flowerBrightness, [0, 0]);
  }
});

test("locks the approved OUTDOOR-MOTION-PHONE-V2-B cue table and true-layer transforms", () => {
  const channels = OUTDOOR_GATE_C_WIND_CUES.map((cue) => cue.channel);
  assert.deepEqual(channels, [
    "far-grass",
    "near-grass",
    "human-hair",
    "human-hem",
    "cat-ears",
    "cat-tail",
  ]);

  assert.deepEqual(OUTDOOR_GATE_C_WIND_CUES, [
    { channel: "far-grass", startMs: 0, peakMs: 800, endMs: 2_500, amplitude: 1 },
    { channel: "near-grass", startMs: 300, peakMs: 1_250, endMs: 2_800, amplitude: 1 },
    { channel: "human-hair", startMs: 1_150, peakMs: 1_850, endMs: 3_000, amplitude: 1 },
    { channel: "human-hem", startMs: 1_350, peakMs: 2_150, endMs: 3_250, amplitude: 1 },
    { channel: "cat-ears", startMs: 2_350, peakMs: 2_900, endMs: 3_500, amplitude: 1 },
    { channel: "cat-tail", startMs: 2_550, peakMs: 3_250, endMs: 4_050, amplitude: 1 },
  ]);

  const peaks = channels.map(peakTime);
  assert.deepEqual(peaks, [1_700, 2_150, 2_750, 3_050, 3_800, 4_150]);
  assert.deepEqual(
    peaks.slice(1).map((peak, index) => peak - (peaks[index] ?? peak)),
    [450, 600, 300, 750, 350],
  );

  const expectedAngles = [-2.6, -4.2, -4.6, -5.2, -5.4, -7.6];
  const sampledPeakAngles = channels.map((channel) => {
    const strength = sampleOutdoorGateCTimeline(peakTime(channel), false).wind[channel];
    return OUTDOOR_GATE_C_ROTATION_SIGN * OUTDOOR_GATE_C_MAX_ROTATION_DEGREES[channel] * strength;
  });
  sampledPeakAngles.forEach((angle, index) => {
    assert.ok(Math.abs(angle - (expectedAngles[index] ?? 0)) < 0.001);
    assert.ok(angle < 0, "all wind rotations must use the same clockwise direction");
  });

  assert.equal(OUTDOOR_GATE_C_OPENING_GUST_START_MS, 900);
  assert.equal(OUTDOOR_GATE_C_OPENING_GUST_END_MS, 4_950);
  assert.ok(OUTDOOR_GATE_C_WIND_CUES.every((cue) => cue.endMs <= 4_050));
  assert.ok(
    sampleOutdoorGateCTimeline(OUTDOOR_GATE_C_OPENING_GUST_START_MS + 160, false)
      .wind["far-grass"] >= 0.18,
    "the first true-layer motion must become perceptible within 160ms",
  );
  assert.deepEqual(
    Object.values(sampleOutdoorGateCTimeline(5_000, false).wind),
    [0, 0, 0, 0, 0, 0],
  );

  for (const time of [0, 1_700, 2_750, 3_050, 3_800, 4_150, 5_000]) {
    assert.deepEqual(
      sampleOutdoorGateCTimeline(time, false),
      sampleOutdoorGateCTimeline(time, false),
      "the same elapsed time must always produce the same non-accumulating sample",
    );
  }

  const rigSource = readFileSync(
    resolve(import.meta.dirname, "../assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-rig.ts"),
    "utf8",
  );
  assert.ok(rigSource.includes("pose.rotationZ + deltaDegrees"));
  assert.deepEqual(OUTDOOR_GATE_C_WIND_TRANSLATION_X_PX_BY_CHANNEL, {
    "far-grass": 0,
    "near-grass": 0,
    "human-hair": 0,
    "human-hem": 0,
    "cat-ears": 0,
    "cat-tail": 0,
  });
});

test("keeps human and cat breathing out of phase", () => {
  const samples = [0, 950, 1_900, 2_850, 3_800, 4_750].map((time) =>
    sampleOutdoorGateCTimeline(time, false));
  assert.ok(samples.some((sample) => Math.abs(sample.humanBreath - sample.catBreath) > 0.2));
  assert.ok(samples.every((sample) => sample.humanBreath >= 0 && sample.humanBreath <= 1));
  assert.ok(samples.every((sample) => sample.catBreath >= 0 && sample.catBreath <= 1));

  const humanShoulderTravelPx = 178 * (1 - 0.13) * OUTDOOR_GATE_C_BREATH_SCALE_Y.human;
  const catShoulderTravelPx = 104 * (1 - 0.14) * OUTDOOR_GATE_C_BREATH_SCALE_Y.cat;
  assert.ok(humanShoulderTravelPx > 1.23 && humanShoulderTravelPx < 1.24);
  assert.ok(catShoulderTravelPx > 0.80 && catShoulderTravelPx < 0.81);
  assert.ok(1 + OUTDOOR_GATE_C_BREATH_SCALE_Y.human <= 1.008);
  assert.ok(1 + OUTDOOR_GATE_C_BREATH_SCALE_Y.cat <= 1.009);
});

test("loads ten addressable stars with exactly four frozen one-shot contracts", () => {
  const peaks = [
    { index: 2, start: 2_300, peak: 2_675, end: 3_050, opacity: 0.06 },
    { index: 7, start: 4_650, peak: 5_050, end: 5_450, opacity: 0.05 },
    { index: 0, start: 6_200, peak: 6_625, end: 7_050, opacity: 0.05 },
    { index: 8, start: 8_000, peak: 8_425, end: 8_850, opacity: 0.06 },
  ];
  for (const cue of peaks) {
    const atStart = sampleOutdoorGateCTimeline(cue.start, false).heroStarBrightness;
    const atPeak = sampleOutdoorGateCTimeline(cue.peak, false).heroStarBrightness;
    const atEnd = sampleOutdoorGateCTimeline(cue.end, false).heroStarBrightness;
    assert.equal(atStart.length, OUTDOOR_GATE_C_HERO_STAR_COUNT);
    assert.equal(atStart[cue.index], 0);
    assert.equal(atPeak[cue.index], cue.opacity);
    assert.equal(atEnd[cue.index], 0);
  }
});

test("animates only four one-shot stars and never changes more than two per 100ms", () => {
  const activeIndices = new Set([0, 2, 7, 8]);
  const inactiveIndices = [1, 3, 4, 5, 6, 9];
  const times = Array.from({ length: 99 }, (_, index) => index * 100);

  for (const index of inactiveIndices) {
    const values = times.map((time) => sampleOutdoorGateCTimeline(time, false).heroStarBrightness[index]);
    assert.equal(new Set(values).size, 1);
  }

  for (let time = 0; time < OUTDOOR_GATE_C_DURATION_MS; time += 100) {
    const before = sampleOutdoorGateCTimeline(time, false).heroStarBrightness;
    const after = sampleOutdoorGateCTimeline(time + 100, false).heroStarBrightness;
    const changed = before.filter((value, index) => Math.abs(value - (after[index] ?? value)) > 1e-6);
    assert.ok(changed.length <= 2);
    before.forEach((value, index) => {
      if (!activeIndices.has(index)) assert.equal(value, STATIC_STAR_OPACITY_FOR_TEST);
    });
  }
});

test("gives each flower one bounded brightness window and keeps the door out of the timeline", () => {
  const flowerSamples = Array.from({ length: 99 }, (_, index) =>
    sampleOutdoorGateCTimeline(index * 100, false).flowerBrightness);
  assert.ok(flowerSamples.every(([left, right]) => left >= 0 && left <= 0.05 && right >= 0 && right <= 0.04));
  assert.deepEqual(sampleOutdoorGateCTimeline(1_050, false).flowerBrightness, [0, 0]);
  assert.deepEqual(sampleOutdoorGateCTimeline(1_800, false).flowerBrightness, [0.05, 0]);
  assert.deepEqual(sampleOutdoorGateCTimeline(2_550, false).flowerBrightness, [0, 0]);
  assert.deepEqual(sampleOutdoorGateCTimeline(7_250, false).flowerBrightness, [0, 0.04]);
  assert.deepEqual(sampleOutdoorGateCTimeline(7_950, false).flowerBrightness, [0, 0]);
  assert.ok(!("doorBrightness" in sampleOutdoorGateCTimeline(5_000, false)));
});

test("keeps cloud/body caps while removing legacy transparent wind overlays", () => {
  let maxCloud = 0;
  let maxBody = 0;
  for (let time = 0; time <= OUTDOOR_GATE_C_DURATION_MS; time += 10) {
    const sample = sampleOutdoorGateCTimeline(time, false);
    maxCloud = Math.max(maxCloud, ...sample.cloudOpacity);
    maxBody = Math.max(maxBody, ...sample.bodyOverlayOpacity);
  }
  assert.ok(maxCloud <= 0.10);
  assert.ok(maxBody <= 0.18);
  for (let time = 0; time <= OUTDOOR_GATE_C_DURATION_MS; time += 10) {
    assert.deepEqual(
      Object.values(sampleOutdoorGateCTimeline(time, false).windOverlayOpacity),
      [0, 0, 0, 0, 0, 0],
      "V2-B moves opaque content layers and must not revive a transparent duplicate",
    );
  }
  for (const time of [0, OUTDOOR_GATE_C_DURATION_MS]) {
    const sample = sampleOutdoorGateCTimeline(time, false);
    assert.deepEqual(sample.cloudOpacity, [0, 0]);
    assert.deepEqual(sample.bodyOverlayOpacity, [0, 0]);
    assert.deepEqual(Object.values(sample.windOverlayOpacity), [0, 0, 0, 0, 0, 0]);
  }
});

test("reduced motion holds every automatic transform and brightness channel static", () => {
  assert.equal(sampleOutdoorGateCTimeline(0, true).sceneOpacity, 1);

  for (const time of [0, 1_500, 4_900, 9_700]) {
    const sample = sampleOutdoorGateCTimeline(time, true);
    assert.deepEqual(Object.values(sample.wind), [0, 0, 0, 0, 0, 0]);
    assert.equal(sample.humanBreath, 0);
    assert.equal(sample.catBreath, 0);
    assert.deepEqual(sample.cloudOffsetX, [0, 0]);
    assert.deepEqual(sample.cloudOpacity, [0, 0]);
    assert.deepEqual(sample.bodyOverlayOpacity, [0, 0]);
    assert.deepEqual(Object.values(sample.windOverlayOpacity), [0, 0, 0, 0, 0, 0]);
    assert.deepEqual(sample.heroStarBrightness, Array.from({ length: 10 }, () => 0));
    assert.deepEqual(sample.flowerBrightness, [0, 0]);
  }
});
