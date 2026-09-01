import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import vm from "node:vm";
import * as outdoorGateCContract from "../assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-contract.ts";
import * as outdoorGateCTimeline from "../assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-timeline.ts";

const require = createRequire(import.meta.url);
const typescript = require(
  "/Applications/CocosCreator.app/Contents/Resources/app.asar.unpacked/node_modules/typescript/lib/typescript.js",
);

type ReducedMotionQueryParser = (search?: string | null) => boolean;

interface RigHarness {
  readonly parse: ReducedMotionQueryParser;
  readonly createRig: () => {
    node: {
      emit: (event: string) => void;
      listenerCount: (event: string) => number;
    };
    heroStarOpacities: Array<{ opacity: number }>;
    flowerOpacities: Array<{ opacity: number }>;
    startGestureWind: (direction: "left" | "right") => boolean;
    isGestureWindActive: () => boolean;
    isAutomaticWindActive: () => boolean;
    getRuntimeElapsedMs: () => number;
    getMotionSnapshot: () => {
      wind: Record<string, number>;
      windOverlayOpacity: Record<string, number>;
    };
    pulseFlower: (index: 0 | 1) => void;
    pulseSky: () => void;
    replay: () => void;
    setReducedMotion: (enabled: boolean) => void;
    update: (deltaTime: number) => void;
    onLoad: () => void;
    onDestroy: () => void;
  };
  readonly createOpacity: () => { opacity: number };
  readonly dispatchTouchStart: () => void;
  readonly touchListenerCount: () => number;
}

function compileRigWithoutBrowserGlobals(): RigHarness {
  const touchListeners = new Set<() => void>();
  const sourcePath = resolve(
    import.meta.dirname,
    "../assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-rig.ts",
  );
  const transpiled = typescript.transpileModule(readFileSync(sourcePath, "utf8"), {
    compilerOptions: {
      experimentalDecorators: true,
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2022,
      useDefineForClassFields: false,
    },
  }).outputText;
  const moduleRecord: { exports: Record<string, unknown> } = { exports: {} };
  const propertyDecorator = (...args: unknown[]) => {
    if (args.length >= 2) return undefined;
    return () => undefined;
  };
  class StubUIOpacity {
    public opacity = 0;
  }
  class StubNode {
    public static readonly EventType = { TOUCH_START: "node-touch-start" };
    private readonly listeners = new Map<string, Set<() => void>>();

    public on(event: string, listener: () => void): void {
      const listeners = this.listeners.get(event) ?? new Set<() => void>();
      listeners.add(listener);
      this.listeners.set(event, listeners);
    }

    public off(event: string, listener: () => void): void {
      this.listeners.get(event)?.delete(listener);
    }

    public emit(event: string): void {
      for (const listener of Array.from(this.listeners.get(event) ?? [])) listener();
    }

    public listenerCount(event: string): number {
      return this.listeners.get(event)?.size ?? 0;
    }
  }
  class StubComponent {
    public readonly node = new StubNode();
  }
  const ccStub = {
    _decorator: {
      ccclass: () => (constructor: unknown) => constructor,
      property: propertyDecorator,
    },
    Component: StubComponent,
    Node: StubNode,
    UIOpacity: StubUIOpacity,
    Vec3: class {},
    input: {
      on: (event: string, listener: () => void) => {
        if (event === "touch-start") touchListeners.add(listener);
      },
      off: (event: string, listener: () => void) => {
        if (event === "touch-start") touchListeners.delete(listener);
      },
    },
    Input: { EventType: { TOUCH_START: "touch-start" } },
  };
  const context = vm.createContext({});
  assert.equal(
    vm.runInContext("typeof URLSearchParams", context),
    "undefined",
    "the harness must match the WeChat runtime that exposed this regression",
  );
  const evaluate = vm.runInContext(
    `(function (require, module, exports) { ${transpiled}\n })`,
    context,
    { filename: "outdoor-gate-c-rig.compiled.cjs" },
  ) as (
    localRequire: (id: string) => unknown,
    module: typeof moduleRecord,
    exports: Record<string, unknown>,
  ) => void;
  evaluate(
    (id) => {
      if (id === "cc") return ccStub;
      if (id.endsWith("outdoor-gate-c-contract.ts")) return outdoorGateCContract;
      if (id.endsWith("outdoor-gate-c-timeline.ts")) return outdoorGateCTimeline;
      if (id.endsWith("outdoor-slow-swipe.ts")) return {};
      throw new Error(`Unexpected test import: ${id}`);
    },
    moduleRecord,
    moduleRecord.exports,
  );

  const parser = moduleRecord.exports.requestsReducedMotionFromSearch;
  const Rig = moduleRecord.exports.OutdoorGateCRig as new () => ReturnType<RigHarness["createRig"]>;
  assert.equal(typeof parser, "function", "the query parser must be exported for direct regression coverage");
  assert.equal(typeof Rig, "function", "the rig must remain constructible in the runtime harness");
  return {
    parse: parser as ReducedMotionQueryParser,
    createRig: () => new Rig(),
    createOpacity: () => new StubUIOpacity(),
    dispatchTouchStart: () => {
      for (const listener of Array.from(touchListeners)) listener();
    },
    touchListenerCount: () => touchListeners.size,
  };
}

test("parses reduced-motion startup queries without URLSearchParams", () => {
  const parse = compileRigWithoutBrowserGlobals().parse;
  const corpus: Array<string | null | undefined> = [
    undefined,
    null,
    "",
    "?",
    "?reducedMotion=1",
    "reducedMotion=1",
    "?motion=reduced",
    "?ignored=hello+world&motion=reduced",
    "?reduced%4Dotion=1",
    "?motion=reduc%65d",
    "?reducedMotion=0&motion=reduced",
    "?reducedMotion=0&reducedMotion=1",
    "?motion=full&motion=reduced",
    "?reducedMotion=1&reducedMotion=0",
    "?reducedMotion&motion",
    "?reducedMotion=1+",
    "?motion=+reduced",
    "?reducedMotion=1%26motion%3Dreduced",
    "?reducedMotion=1#fragment",
    "?%E0%A4%A=1&motion=reduced",
    "?reducedMotion=%",
    "?__proto__=1&constructor=reduced",
    "??reducedMotion=1",
  ];

  for (const search of corpus) {
    const reference = new URLSearchParams(search ?? "");
    const expected = reference.get("reducedMotion") === "1" || reference.get("motion") === "reduced";
    assert.equal(parse(search), expected, `query mismatch for ${JSON.stringify(search)}`);
  }
});

test("manual wind never resets the main clock, stacks, or exceeds interaction brightness caps", () => {
  const harness = compileRigWithoutBrowserGlobals();
  const rig = harness.createRig();
  rig.update(0.1);
  const elapsedBeforeGesture = rig.getRuntimeElapsedMs();

  assert.equal(rig.startGestureWind("left"), true);
  assert.equal(rig.isGestureWindActive(), true);
  assert.equal(rig.startGestureWind("right"), false, "an active manual chain cannot stack");
  assert.equal(rig.getRuntimeElapsedMs(), elapsedBeforeGesture, "manual wind cannot replay the main clock");
  for (let index = 0; index < 8; index += 1) rig.update(0.1);
  assert.ok(
    rig.getMotionSnapshot().wind["far-grass"]! > 0.999,
    "a leftward swipe reuses the same approved clockwise gust instead of reversing the scene",
  );

  rig.flowerOpacities = [harness.createOpacity(), harness.createOpacity()];
  rig.heroStarOpacities = Array.from({ length: 10 }, () => harness.createOpacity());
  rig.pulseFlower(0);
  rig.pulseFlower(1);
  rig.pulseSky();
  assert.ok(rig.flowerOpacities[0]!.opacity <= Math.round(0.05 * 255));
  assert.ok(rig.flowerOpacities[1]!.opacity <= Math.round(0.04 * 255));
  assert.ok(
    Math.max(...rig.heroStarOpacities.map((opacity) => opacity.opacity))
    <= Math.round(0.06 * 255),
  );

  rig.setReducedMotion(true);
  assert.equal(rig.isGestureWindActive(), false, "enabling reduced motion cancels transform wind");
  assert.equal(rig.startGestureWind("right"), true);
  assert.equal(rig.startGestureWind("left"), false, "reduced feedback also cannot stack");
  const reducedSnapshot = rig.getMotionSnapshot();
  assert.deepEqual(Object.values(reducedSnapshot.wind), [0, 0, 0, 0, 0, 0]);
  assert.deepEqual(
    Object.values(reducedSnapshot.windOverlayOpacity),
    [0, 0, 0, 0, 0, 0],
    "reduced motion cannot revive the superseded transparent wind overlays",
  );
});

test("an idle first touch starts one V2-B visual wind in the same frame", () => {
  const harness = compileRigWithoutBrowserGlobals();
  const rig = harness.createRig();
  rig.onLoad();
  assert.equal(harness.touchListenerCount(), 1);
  assert.equal(rig.node.listenerCount("node-touch-start"), 1);

  const elapsedBeforeTouch = rig.getRuntimeElapsedMs();
  rig.node.emit("node-touch-start");
  assert.equal(rig.isGestureWindActive(), true);
  assert.equal(rig.getRuntimeElapsedMs(), elapsedBeforeTouch);

  rig.update(0.1);
  rig.update(0.06);
  const visibleResponse = rig.getMotionSnapshot();
  assert.ok(
    visibleResponse.wind["far-grass"]! >= 0.18,
    "first touch must produce a perceptible far-grass response within 160ms",
  );
  assert.deepEqual(
    Object.values(visibleResponse.windOverlayOpacity),
    [0, 0, 0, 0, 0, 0],
    "the perceptible response must come from the opaque subject layer, not a fading duplicate",
  );

  harness.dispatchTouchStart();
  assert.equal(rig.isGestureWindActive(), true, "first touch visual wind cannot stack");

  rig.replay();
  assert.equal(rig.isGestureWindActive(), false, "replay must clear a partial first-touch chain");
  assert.equal(rig.getRuntimeElapsedMs(), 0);

  rig.onDestroy();
  assert.equal(harness.touchListenerCount(), 0);
  assert.equal(rig.node.listenerCount("node-touch-start"), 0);
});

test("does not consume the one-time first-touch response when visual wind is rejected", () => {
  const harness = compileRigWithoutBrowserGlobals();
  const rig = harness.createRig();
  rig.onLoad();

  const acceptedStart = rig.startGestureWind.bind(rig);
  rig.startGestureWind = () => false;
  harness.dispatchTouchStart();
  assert.equal(rig.isGestureWindActive(), false);

  rig.startGestureWind = acceptedStart;
  harness.dispatchTouchStart();
  assert.equal(
    rig.isGestureWindActive(),
    true,
    "a rejected attempt must leave the first-touch visual response available",
  );
  rig.onDestroy();
});

test("rejects a manual chain while the approved automatic gust is active", () => {
  const rig = compileRigWithoutBrowserGlobals().createRig();
  for (let index = 0; index < 10; index += 1) rig.update(0.1);

  assert.equal(rig.isAutomaticWindActive(), true);
  assert.equal(rig.startGestureWind("left"), false);
  assert.equal(rig.isGestureWindActive(), false);
});

test("first touch reuses a newly started automatic chain without stacking", () => {
  const harness = compileRigWithoutBrowserGlobals();
  const rig = harness.createRig();
  rig.onLoad();
  for (let index = 0; index < 17; index += 1) rig.update(0.1);

  assert.equal(rig.isAutomaticWindActive(), true);
  harness.dispatchTouchStart();
  assert.equal(rig.isGestureWindActive(), false, "an existing wind is already the audio-synced visual response");

  for (let index = 0; index < 50; index += 1) rig.update(0.1);
  harness.dispatchTouchStart();
  assert.equal(rig.isGestureWindActive(), false, "later touches cannot replay the one-time unlock wind");
  rig.onDestroy();
});

test("a first touch in the sub-1px tail queues one complete chain within 250ms", () => {
  const harness = compileRigWithoutBrowserGlobals();
  const rig = harness.createRig();
  rig.onLoad();

  for (let index = 0; index < 48; index += 1) rig.update(0.1);
  const beforeTouch = rig.getMotionSnapshot();
  assert.equal(rig.isAutomaticWindActive(), true);
  assert.ok(
    Math.max(...Object.values(beforeTouch.wind).map(Math.abs)) <= 0.18,
    "the probe must land in the approved sub-1px tail window",
  );

  harness.dispatchTouchStart();
  assert.equal(
    rig.isGestureWindActive(),
    true,
    "an accepted queued first-touch chain counts as active and blocks stacking",
  );
  assert.deepEqual(
    rig.getMotionSnapshot().wind,
    beforeTouch.wind,
    "queuing must not jump or stack on top of the settling automatic chain",
  );

  let waitedForQueuedStartMs = 0;
  while (rig.isAutomaticWindActive() && waitedForQueuedStartMs <= 250) {
    rig.update(0.01);
    waitedForQueuedStartMs += 10;
  }
  assert.equal(rig.isGestureWindActive(), true);
  assert.equal(rig.isAutomaticWindActive(), false, "the completed opening gust must not resume");
  assert.ok(
    waitedForQueuedStartMs <= outdoorGateCContract.OUTDOOR_GATE_C_FIRST_TOUCH_QUEUE_MAX_DELAY_MS,
    "the full queued chain must start within 250ms of the old tail settling",
  );
  rig.update(0.01);
  assert.ok(
    rig.getMotionSnapshot().wind["far-grass"]! > 0,
    "the queued complete chain must start no later than 250ms after the old tail settles",
  );
  for (let elapsedMs = 10; elapsedMs < 160; elapsedMs += 10) rig.update(0.01);
  assert.ok(rig.getMotionSnapshot().wind["far-grass"]! >= 0.18);
  rig.onDestroy();
});

test("effective motion exposes all six first-touch peaks in the approved order", () => {
  const harness = compileRigWithoutBrowserGlobals();
  const rig = harness.createRig();
  rig.onLoad();
  for (let index = 0; index < 62; index += 1) rig.update(0.1);
  harness.dispatchTouchStart();

  const peaks = [
    { channel: "far-grass", relativeMs: 800 },
    { channel: "near-grass", relativeMs: 1_250 },
    { channel: "human-hair", relativeMs: 1_850 },
    { channel: "human-hem", relativeMs: 2_150 },
    { channel: "cat-ears", relativeMs: 2_900 },
    { channel: "cat-tail", relativeMs: 3_250 },
  ] as const;
  let previousMs = 0;
  for (const peak of peaks) {
    let remainingMs = peak.relativeMs - previousMs;
    while (remainingMs > 0) {
      const stepMs = Math.min(100, remainingMs);
      rig.update(stepMs / 1_000);
      remainingMs -= stepMs;
    }
    const snapshot = rig.getMotionSnapshot();
    assert.ok(snapshot.wind[peak.channel]! > 0.999);
    assert.equal(snapshot.windOverlayOpacity[peak.channel], 0);
    previousMs = peak.relativeMs;
  }
  rig.onDestroy();
});

test("answers a flower touch with exactly one bounded star after about 350ms", () => {
  const harness = compileRigWithoutBrowserGlobals();
  const rig = harness.createRig();
  rig.heroStarOpacities = Array.from({ length: 10 }, () => harness.createOpacity());

  rig.pulseFlower(0);
  assert.equal(rig.heroStarOpacities[2]!.opacity, 0);
  for (let index = 0; index < 4; index += 1) rig.update(0.1);

  const lit = rig.heroStarOpacities
    .map((opacity, index) => ({ index, opacity: opacity.opacity }))
    .filter(({ opacity }) => opacity > 0);
  assert.deepEqual(lit.map(({ index }) => index), [2]);
  assert.ok(lit[0]!.opacity <= Math.round(0.06 * 255));
});
