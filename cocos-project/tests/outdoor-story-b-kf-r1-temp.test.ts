import test from "node:test";
import assert from "node:assert/strict";

let modelModule: any = null;
let transitionModule: any = null;
let loadError: unknown = null;

try {
  [modelModule, transitionModule] = await Promise.all([
    import("../assets/scripts/cocos/outdoor-story-b-kf-r1-temp/outdoor-story-model.ts"),
    import("../assets/scripts/cocos/outdoor-story-b-kf-r1-temp/outdoor-story-transition.ts"),
  ]);
} catch (error) {
  loadError = error;
}

function productionModules(): { model: any; transition: any } {
  assert.ok(
    modelModule && transitionModule,
    `outdoor B story production modules must exist: ${String(loadError)}`,
  );
  return { model: modelModule, transition: transitionModule };
}

test("the three-beat story changes only at the approved millisecond boundaries", () => {
  const { model } = productionModules();
  const cases = [
    { elapsedMs: 0, phase: "settle", from: "B01", to: "B01", resting: true },
    { elapsedMs: 3_199, phase: "settle", from: "B01", to: "B01", resting: true },
    { elapsedMs: 3_200, phase: "to-wind", from: "B01", to: "B02", resting: false },
    { elapsedMs: 3_499, phase: "to-wind", from: "B01", to: "B02", resting: false },
    { elapsedMs: 3_500, phase: "wind", from: "B02", to: "B02", resting: true },
    { elapsedMs: 4_999, phase: "wind", from: "B02", to: "B02", resting: true },
    { elapsedMs: 5_000, phase: "to-afterwind", from: "B02", to: "B03", resting: false },
    { elapsedMs: 5_359, phase: "to-afterwind", from: "B02", to: "B03", resting: false },
    { elapsedMs: 5_360, phase: "afterwind", from: "B03", to: "B03", resting: true },
  ];

  for (const expected of cases) {
    const actual = model.outdoorStorySnapshotAt(expected.elapsedMs);
    assert.equal(actual.phase, expected.phase, `${expected.elapsedMs}ms phase`);
    assert.equal(actual.fromFrame, expected.from, `${expected.elapsedMs}ms from frame`);
    assert.equal(actual.toFrame, expected.to, `${expected.elapsedMs}ms to frame`);
    assert.equal(actual.resting, expected.resting, `${expected.elapsedMs}ms resting state`);
  }
});

test("smoothstep transition opacity stays complementary and never exposes an empty frame", () => {
  const { model } = productionModules();
  assert.equal(model.outdoorStorySmoothstep(-1), 0);
  assert.equal(model.outdoorStorySmoothstep(0), 0);
  assert.equal(model.outdoorStorySmoothstep(0.25), 0.15625);
  assert.equal(model.outdoorStorySmoothstep(0.5), 0.5);
  assert.equal(model.outdoorStorySmoothstep(0.75), 0.84375);
  assert.equal(model.outdoorStorySmoothstep(1), 1);
  assert.equal(model.outdoorStorySmoothstep(2), 1);

  for (const elapsedMs of [3_200, 3_225, 3_350, 3_499, 5_000, 5_090, 5_180, 5_359]) {
    const snapshot = model.outdoorStorySnapshotAt(elapsedMs);
    assert.ok(snapshot.transitionProgress >= 0 && snapshot.transitionProgress < 1);
    assert.ok(Math.abs(snapshot.fromOpacity + snapshot.toOpacity - 1) < 1e-12);
    assert.ok(snapshot.fromOpacity > 0 || snapshot.toOpacity > 0);
  }
});

test("B03 stays indefinitely without looping or inventing a room-entry request", () => {
  const { model } = productionModules();
  for (const elapsedMs of [5_360, 60_000, 3_600_000, Number.MAX_SAFE_INTEGER]) {
    const snapshot = model.outdoorStorySnapshotAt(elapsedMs);
    assert.equal(snapshot.phase, "afterwind");
    assert.equal(snapshot.fromFrame, "B03");
    assert.equal(snapshot.toFrame, "B03");
    assert.equal(snapshot.entryRequest, null);
  }
});

test("replay returns to B01 and reduced motion keeps the neutral B01 frame", () => {
  const { model } = productionModules();
  const playback = new model.OutdoorStoryPlaybackModel();

  playback.advance(20_000);
  assert.equal(playback.snapshot().phase, "afterwind");
  playback.replay();
  assert.equal(playback.snapshot().phase, "settle");
  assert.equal(playback.snapshot().fromFrame, "B01");

  playback.setReducedMotion(true);
  playback.advance(100_000);
  assert.deepEqual(
    {
      phase: playback.snapshot().phase,
      fromFrame: playback.snapshot().fromFrame,
      toFrame: playback.snapshot().toFrame,
      reducedMotion: playback.snapshot().reducedMotion,
    },
    { phase: "settle", fromFrame: "B01", toFrame: "B01", reducedMotion: true },
  );

  playback.setReducedMotion(false);
  playback.advance(3_200);
  assert.equal(playback.snapshot().phase, "to-wind");
});

test("a door request cancels immediately, is idempotent, and cannot be followed by a late page change", () => {
  const { model } = productionModules();
  const playback = new model.OutdoorStoryPlaybackModel();

  playback.advance(3_400);
  assert.equal(playback.snapshot().phase, "to-wind");
  assert.equal(playback.requestDoorEntry(), true);
  const cancelled = playback.snapshot();
  assert.equal(cancelled.phase, "cancelled");
  assert.equal(cancelled.cancelled, true);
  assert.equal(cancelled.entryRequest, "door");
  assert.equal(cancelled.fromFrame, cancelled.toFrame);

  assert.equal(playback.requestDoorEntry(), false);
  playback.advance(1_000_000);
  playback.setReducedMotion(true);
  assert.deepEqual(playback.snapshot(), cancelled);

  playback.replay();
  assert.equal(playback.snapshot().phase, "settle");
  assert.equal(playback.snapshot().entryRequest, null);
});

test("approved grass-line and ink-band geometry is emitted as renderer-independent data", () => {
  const { transition } = productionModules();
  const first = transition.outdoorStoryTransitionGeometry("to-wind", 0.5);
  assert.equal(first.orientation, "bottom-up-grass-line");
  assert.deepEqual(first.revealEdge, {
    leftYPercent: 48,
    rightYPercent: 62,
  });
  assert.deepEqual(first.revealPolygon, [
    { xPercent: 0, yPercent: 48 },
    { xPercent: 100, yPercent: 62 },
    { xPercent: 100, yPercent: 100 },
    { xPercent: 0, yPercent: 100 },
  ]);
  assert.deepEqual(first.inkBand, {
    xPercent: -15,
    yPercent: 0,
    widthPercent: 130,
    heightPercent: 24,
    translateYPercent: 185,
    angleDegrees: -4,
    opacity: 0.82,
  });

  const second = transition.outdoorStoryTransitionGeometry("to-afterwind", 0.5);
  assert.deepEqual(second.revealEdge, {
    leftYPercent: 55,
    rightYPercent: 43,
  });
  assert.equal(second.inkBand.angleDegrees, 4);

  for (const phase of ["to-wind", "to-afterwind"]) {
    const start = transition.outdoorStoryTransitionGeometry(phase, -1);
    const end = transition.outdoorStoryTransitionGeometry(phase, 2);
    assert.equal(start.inkBand.opacity, 0);
    assert.equal(end.inkBand.opacity, 0);
    assert.ok(end.revealEdge.leftYPercent <= 0);
    assert.ok(end.revealEdge.rightYPercent <= 0);
  }
});

test("each frame has a safe 390x844 door target and transitions use the exact union of both targets", () => {
  const { transition } = productionModules();
  const expected = {
    B01: { x: 291, y: 504, width: 64, height: 72 },
    B02: { x: 326, y: 406, width: 64, height: 72 },
    B03: { x: 277, y: 283, width: 64, height: 72 },
  };

  for (const frame of ["B01", "B02", "B03"]) {
    const area = transition.outdoorStoryDoorHitArea(frame);
    assert.deepEqual(area.rects, [expected[frame]]);
    assert.deepEqual(area.bounds, expected[frame]);
    assert.ok(area.bounds.width >= 44 && area.bounds.height >= 44);
    assert.ok(area.bounds.x >= 0 && area.bounds.y >= 0);
    assert.ok(area.bounds.x + area.bounds.width <= 390);
    assert.ok(area.bounds.y + area.bounds.height <= 844);
  }

  const firstTransition = transition.outdoorStoryDoorHitArea("B01", "B02");
  assert.deepEqual(firstTransition.rects, [expected.B01, expected.B02]);
  assert.deepEqual(firstTransition.bounds, { x: 291, y: 406, width: 99, height: 170 });
  assert.equal(transition.outdoorStoryPointHitsDoor({ x: 323, y: 540 }, firstTransition), true);
  assert.equal(transition.outdoorStoryPointHitsDoor({ x: 362, y: 442 }, firstTransition), true);
  assert.equal(
    transition.outdoorStoryPointHitsDoor({ x: 330, y: 490 }, firstTransition),
    false,
    "the enclosing bounds must not turn the gap between two painted doors into a target",
  );

  const secondTransition = transition.outdoorStoryDoorHitArea("B02", "B03");
  assert.deepEqual(secondTransition.rects, [expected.B02, expected.B03]);
  assert.equal(transition.outdoorStoryPointHitsDoor({ x: 309, y: 319 }, secondTransition), true);
  assert.equal(transition.outdoorStoryPointHitsDoor({ x: 20, y: 20 }, secondTransition), false);
});
