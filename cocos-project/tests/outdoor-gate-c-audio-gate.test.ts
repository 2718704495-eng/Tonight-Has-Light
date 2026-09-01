import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const typescript = require(
  "/Applications/CocosCreator.app/Contents/Resources/app.asar.unpacked/node_modules/typescript/lib/typescript.js",
);

interface Listener {
  readonly callback: (...args: unknown[]) => void;
  readonly target: unknown;
}

class FakeEmitter {
  private readonly listeners = new Map<string, Listener[]>();

  public on(event: string, callback: (...args: unknown[]) => void, target: unknown): void {
    const listeners = this.listeners.get(event) ?? [];
    listeners.push({ callback, target });
    this.listeners.set(event, listeners);
  }

  public off(event: string, callback: (...args: unknown[]) => void, target: unknown): void {
    const listeners = this.listeners.get(event) ?? [];
    this.listeners.set(
      event,
      listeners.filter((listener) => listener.callback !== callback || listener.target !== target),
    );
  }

  public emit(event: string, ...args: unknown[]): void {
    for (const listener of [...(this.listeners.get(event) ?? [])]) {
      listener.callback.apply(listener.target, args);
    }
  }

  public listenerCount(event: string): number {
    return this.listeners.get(event)?.length ?? 0;
  }
}

class FakeComponent {
  public node!: FakeNode;
  public isValid = true;
}

class FakeAudioClip {
  public readonly duration = 26;
}

class FakeAudioSource extends FakeComponent {
  public static readonly EventType = { STARTED: "audio-started" };
  public clip: FakeAudioClip | null = null;
  public loop = false;
  public playOnAwake = true;
  public volume = 1;
  public currentTime = 0;
  public playing = false;
  public playCalls = 0;
  public pauseCalls = 0;
  public stopCalls = 0;

  public get duration(): number {
    return this.clip?.duration ?? 0;
  }

  public play(): void {
    this.playCalls += 1;
    this.playing = true;
    this.node.emit(FakeAudioSource.EventType.STARTED, this);
  }

  public pause(): void {
    this.pauseCalls += 1;
    this.playing = false;
  }

  public stop(): void {
    this.stopCalls += 1;
    this.playing = false;
  }
}

class FakeNode extends FakeEmitter {
  public static readonly EventType = { TOUCH_START: "node-touch-start" };
  private readonly components: FakeComponent[] = [];

  public addComponent<T extends FakeComponent>(ComponentType: new () => T): T {
    const component = new ComponentType();
    component.node = this;
    this.components.push(component);
    return component;
  }

  public getComponents<T extends FakeComponent>(ComponentType: new () => T): T[] {
    return this.components.filter((component): component is T => component instanceof ComponentType);
  }
}

interface ResourceHarness {
  readonly loadedPaths: string[];
  readonly releasedPaths: string[];
  completeSuccess: (clip?: FakeAudioClip) => void;
  completeFailure: () => void;
}

interface GateHarness {
  readonly Gate: new () => FakeComponent & {
    ambientWindClip: FakeAudioClip | null;
    musicClip: FakeAudioClip | null;
    setEnabled: (enabled: boolean) => void;
    setChannelEnabled: (ambientEnabled: boolean, musicEnabled: boolean) => void;
    pauseForBackground: () => void;
    resumeFromBackground: () => void;
    pauseForInterruption: () => void;
    resumeFromInterruption: () => void;
    unlockFromUserGesture: () => void;
    getProofSnapshot: () => Record<string, unknown>;
  };
  readonly input: FakeEmitter;
  readonly game: FakeEmitter;
  readonly resources: ResourceHarness;
}

function compileGateHarness(): GateHarness {
  const input = new FakeEmitter();
  const game = new FakeEmitter();
  const loadedPaths: string[] = [];
  const releasedPaths: string[] = [];
  let loadCallback: ((error: Error | null, clip: FakeAudioClip | null) => void) | null = null;
  const resources = {
    load(path: string, _type: unknown, callback: typeof loadCallback): void {
      loadedPaths.push(path);
      loadCallback = callback;
    },
    release(path: string): void {
      releasedPaths.push(path);
    },
  };
  const ccStub = {
    _decorator: {
      ccclass: () => (constructor: unknown) => constructor,
      property: () => () => undefined,
    },
    AudioClip: FakeAudioClip,
    AudioSource: FakeAudioSource,
    Component: FakeComponent,
    Node: FakeNode,
    game,
    Game: { EVENT_HIDE: "game-hide", EVENT_SHOW: "game-show" },
    input,
    Input: { EventType: { TOUCH_START: "touch-start" } },
    resources,
    sys: { isBrowser: true },
  };

  const sourcePath = resolve(
    import.meta.dirname,
    "../assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-audio-gate.ts",
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
  const evaluate = vm.runInThisContext(
    `(function (require, module, exports) { ${transpiled}\n })`,
    { filename: "outdoor-gate-c-audio-gate.compiled.cjs" },
  ) as (
    localRequire: (id: string) => unknown,
    module: typeof moduleRecord,
    exports: Record<string, unknown>,
  ) => void;
  evaluate(
    (id) => {
      if (id === "cc") return ccStub;
      throw new Error(`Unexpected test import: ${id}`);
    },
    moduleRecord,
    moduleRecord.exports,
  );

  return {
    Gate: moduleRecord.exports.OutdoorGateCAudioGate as GateHarness["Gate"],
    input,
    game,
    resources: {
      loadedPaths,
      releasedPaths,
      completeSuccess: (clip = new FakeAudioClip()) => {
        assert.ok(loadCallback, "ambient resource load must be pending");
        loadCallback(null, clip);
      },
      completeFailure: () => {
        assert.ok(loadCallback, "ambient resource load must be pending");
        loadCallback(new Error("load failed"), null);
      },
    },
  };
}

function mountGate(
  harness: GateHarness,
  options: { readonly withMusic?: boolean } = {},
): InstanceType<GateHarness["Gate"]> {
  const gate = new harness.Gate();
  gate.node = new FakeNode();
  if (options.withMusic) gate.musicClip = new FakeAudioClip();
  (gate as unknown as { onLoad: () => void }).onLoad();
  return gate;
}

function updateGate(gate: InstanceType<GateHarness["Gate"]>, deltaSeconds: number): void {
  (gate as unknown as { update: (deltaTime: number) => void }).update(deltaSeconds);
}

function finishAmbientFade(gate: InstanceType<GateHarness["Gate"]>): void {
  for (let index = 0; index < 7; index += 1) updateGate(gate, 0.05);
}

function destroyGate(gate: InstanceType<GateHarness["Gate"]>): void {
  (gate as unknown as { onDestroy: () => void }).onDestroy();
  gate.isValid = false;
}

test("preloads one wind source but remains digitally silent until the first touch", () => {
  const harness = compileGateHarness();
  const gate = mountGate(harness);
  assert.deepEqual(harness.resources.loadedPaths, ["audio/outdoor-gate-c/night-breeze-loop-v1"]);
  harness.resources.completeSuccess();

  const beforeTouch = gate.getProofSnapshot();
  assert.equal(beforeTouch.ambientLoadState, "loaded");
  assert.equal(beforeTouch.ambientAssigned, true);
  assert.equal(beforeTouch.musicAssigned, false);
  assert.equal(beforeTouch.unlocked, false);
  assert.equal(beforeTouch.ambientPlaying, false);
  assert.equal(beforeTouch.ambientVolume, 0);
  assert.equal(beforeTouch.ambientPlayRequestCount, 0);
  assert.equal(beforeTouch.musicPlayRequestCount, 0);
  assert.equal(beforeTouch.audioSourceCount, 1);
  assert.equal(harness.input.listenerCount("touch-start"), 1);
  assert.equal(gate.node.listenerCount("node-touch-start"), 1);

  harness.input.emit("touch-start");
  gate.node.emit("node-touch-start");
  const atTouch = gate.getProofSnapshot();
  assert.equal(atTouch.unlocked, true);
  assert.equal(atTouch.ambientPlaying, true);
  assert.equal(atTouch.ambientVolume, 0);
  assert.equal(atTouch.ambientPlayRequestCount, 1);

  const fadeVolumes: number[] = [];
  for (const delta of [0.1, 0.1, 0.1, 0.05]) {
    updateGate(gate, delta);
    fadeVolumes.push(gate.getProofSnapshot().ambientVolume as number);
  }
  assert.ok(fadeVolumes[0]! > 0 && fadeVolumes[0]! < 0.2);
  assert.ok(fadeVolumes[1]! > fadeVolumes[0]!);
  assert.ok(fadeVolumes[2]! > fadeVolumes[1]!);
  assert.equal(fadeVolumes[3], 0.2);

  harness.input.emit("touch-start");
  assert.equal(gate.getProofSnapshot().ambientPlayRequestCount, 1);
  destroyGate(gate);
  assert.equal(harness.input.listenerCount("touch-start"), 0);
  assert.equal(gate.node.listenerCount("node-touch-start"), 0);
  assert.deepEqual(harness.resources.releasedPaths, ["audio/outdoor-gate-c/night-breeze-loop-v1"]);
});

test("node touch fallback followed by the global path unlocks audio only once", () => {
  const harness = compileGateHarness();
  const gate = mountGate(harness);
  harness.resources.completeSuccess();

  gate.node.emit("node-touch-start");
  harness.input.emit("touch-start");

  const snapshot = gate.getProofSnapshot();
  assert.equal(snapshot.unlocked, true);
  assert.equal(snapshot.ambientPlaying, true);
  assert.equal(snapshot.ambientPlayRequestCount, 1);
  assert.equal(snapshot.audioSourceCount, 1);

  destroyGate(gate);
  assert.equal(harness.input.listenerCount("touch-start"), 0);
  assert.equal(gate.node.listenerCount("node-touch-start"), 0);
});

test("an accepted child control can synchronously unlock audio before stopping propagation", () => {
  const harness = compileGateHarness();
  const gate = mountGate(harness);
  harness.resources.completeSuccess();

  gate.unlockFromUserGesture();

  const snapshot = gate.getProofSnapshot();
  assert.equal(snapshot.unlocked, true);
  assert.equal(snapshot.ambientPlaying, true);
  assert.equal(snapshot.ambientPlayRequestCount, 1);
});

test("mute and background recovery reuse one source without overlapping playback", () => {
  const harness = compileGateHarness();
  const gate = mountGate(harness);
  harness.resources.completeSuccess();
  harness.input.emit("touch-start");
  finishAmbientFade(gate);

  gate.setEnabled(false);
  const muted = gate.getProofSnapshot();
  assert.equal(muted.enabledByUser, false);
  assert.equal(muted.ambientPlaying, false);
  assert.equal(muted.ambientVolume, 0);
  gate.setEnabled(false);

  gate.setEnabled(true);
  const unmuted = gate.getProofSnapshot();
  assert.equal(unmuted.ambientPlaying, true);
  assert.equal(unmuted.ambientVolume, 0);
  assert.equal(unmuted.ambientPlayRequestCount, 2);
  finishAmbientFade(gate);
  assert.equal(gate.getProofSnapshot().ambientVolume, 0.2);

  harness.game.emit("game-hide");
  const hidden = gate.getProofSnapshot();
  assert.equal(hidden.backgroundPaused, true);
  assert.equal(hidden.ambientPlaying, false);
  assert.equal(hidden.ambientVolume, 0);
  assert.equal(hidden.backgroundPauseCount, 1);
  harness.game.emit("game-hide");
  assert.equal(gate.getProofSnapshot().backgroundPauseCount, 1);

  harness.game.emit("game-show");
  const restored = gate.getProofSnapshot();
  assert.equal(restored.backgroundPaused, false);
  assert.equal(restored.ambientPlaying, true);
  assert.equal(restored.ambientPlayRequestCount, 3);
  assert.equal(restored.audioSourceCount, 1);
  assert.equal(restored.musicAssigned, false);
  assert.equal(restored.musicPlaying, false);
  assert.equal(restored.backgroundResumeCount, 1);
  harness.game.emit("game-show");
  assert.equal(gate.getProofSnapshot().ambientPlayRequestCount, 3);
  assert.equal(gate.getProofSnapshot().backgroundResumeCount, 1);
});

test("keeps ambient wind and future music on independent user switches", () => {
  const harness = compileGateHarness();
  const gate = mountGate(harness, { withMusic: true });
  harness.resources.completeSuccess();
  harness.input.emit("touch-start");

  let snapshot = gate.getProofSnapshot();
  assert.equal(snapshot.ambientPlaying, true);
  assert.equal(snapshot.musicPlaying, true);
  assert.equal(snapshot.audioSourceCount, 2);

  gate.setChannelEnabled(false, true);
  snapshot = gate.getProofSnapshot();
  assert.equal(snapshot.ambientEnabledByUser, false);
  assert.equal(snapshot.musicEnabledByUser, true);
  assert.equal(snapshot.ambientPlaying, false);
  assert.equal(snapshot.musicPlaying, true);

  gate.setChannelEnabled(true, false);
  snapshot = gate.getProofSnapshot();
  assert.equal(snapshot.ambientEnabledByUser, true);
  assert.equal(snapshot.musicEnabledByUser, false);
  assert.equal(snapshot.ambientPlaying, true);
  assert.equal(snapshot.musicPlaying, false);
});

test("does not unlock or resume through an active system audio interruption", () => {
  const harness = compileGateHarness();
  const gate = mountGate(harness, { withMusic: true });
  harness.resources.completeSuccess();

  gate.pauseForInterruption();
  gate.pauseForInterruption();
  harness.input.emit("touch-start");
  let snapshot = gate.getProofSnapshot();
  assert.equal(snapshot.unlocked, true);
  assert.equal(snapshot.interruptionPaused, true);
  assert.equal(snapshot.ambientPlaying, false);
  assert.equal(snapshot.musicPlaying, false);
  assert.equal(snapshot.ambientPlayRequestCount, 0);
  assert.equal(snapshot.musicPlayRequestCount, 0);
  assert.equal(snapshot.interruptionPauseCount, 1);

  gate.resumeFromInterruption();
  gate.resumeFromInterruption();
  snapshot = gate.getProofSnapshot();
  assert.equal(snapshot.interruptionPaused, false);
  assert.equal(snapshot.ambientPlaying, true);
  assert.equal(snapshot.musicPlaying, true);
  assert.equal(snapshot.ambientPlayRequestCount, 1);
  assert.equal(snapshot.musicPlayRequestCount, 1);
  assert.equal(snapshot.interruptionResumeCount, 1);
});

test("waits for both background and interruption pauses to clear and respects mute", () => {
  const harness = compileGateHarness();
  const gate = mountGate(harness, { withMusic: true });
  harness.resources.completeSuccess();
  harness.input.emit("touch-start");
  finishAmbientFade(gate);

  gate.pauseForBackground();
  gate.pauseForInterruption();
  gate.setChannelEnabled(false, true);
  gate.resumeFromInterruption();
  let snapshot = gate.getProofSnapshot();
  assert.equal(snapshot.backgroundPaused, true);
  assert.equal(snapshot.interruptionPaused, false);
  assert.equal(snapshot.ambientPlaying, false);
  assert.equal(snapshot.musicPlaying, false);

  gate.resumeFromBackground();
  snapshot = gate.getProofSnapshot();
  assert.equal(snapshot.backgroundPaused, false);
  assert.equal(snapshot.ambientEnabledByUser, false);
  assert.equal(snapshot.ambientPlaying, false);
  assert.equal(snapshot.musicPlaying, true);
  assert.equal(snapshot.ambientPlayRequestCount, 1);
  assert.equal(snapshot.musicPlayRequestCount, 2);
  assert.equal(snapshot.audioSourceCount, 2);
});

test("a late successful load is released after destruction and never requests playback", () => {
  const harness = compileGateHarness();
  const gate = mountGate(harness);
  harness.input.emit("touch-start");
  assert.equal(gate.getProofSnapshot().ambientPlayRequestCount, 0);

  destroyGate(gate);
  harness.resources.completeSuccess();
  assert.deepEqual(harness.resources.releasedPaths, ["audio/outdoor-gate-c/night-breeze-loop-v1"]);
});

test("audio load failure remains a silent non-blocking state", () => {
  const harness = compileGateHarness();
  const gate = mountGate(harness);
  harness.resources.completeFailure();
  harness.input.emit("touch-start");
  const failed = gate.getProofSnapshot();
  assert.equal(failed.ambientLoadState, "failed");
  assert.equal(failed.ambientAssigned, false);
  assert.equal(failed.ambientPlaying, false);
  assert.equal(failed.ambientPlayRequestCount, 0);
});
