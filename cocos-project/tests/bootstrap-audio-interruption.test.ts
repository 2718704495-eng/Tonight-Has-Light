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

interface InterruptionWechatApi {
  beginHandler: (() => void) | null;
  endHandler: (() => void) | null;
  removedBeginHandler: (() => void) | null;
  removedEndHandler: (() => void) | null;
  onAudioInterruptionBegin: (handler: () => void) => void;
  offAudioInterruptionBegin: (handler: () => void) => void;
  onAudioInterruptionEnd: (handler: () => void) => void;
  offAudioInterruptionEnd: (handler: () => void) => void;
  getLaunchOptionsSync: () => { readonly query: Readonly<Record<string, string>> };
  showShareMenu: () => void;
  onShareAppMessage: () => void;
  offShareAppMessage: () => void;
  shareCalls: number;
  lastShareOptions: {
    readonly success?: () => void;
    readonly fail?: (error: unknown) => void;
  } | null;
  shareAppMessage: (options: {
    readonly success?: () => void;
    readonly fail?: (error: unknown) => void;
  }) => void;
}

interface PicturebookSceneDouble {
  readonly initializeCalls: Array<Readonly<Record<string, unknown>>>;
  pauseCalls: number;
  resumeCalls: number;
  replayCalls: number;
  reducedMotionCalls: boolean[];
  soundCalls: boolean[];
  musicCalls: boolean[];
  largeTextCalls: boolean[];
  initialize(options: Readonly<Record<string, unknown>>): void;
  pauseAudioForInterruption(): void;
  resumeAudioFromInterruption(): void;
  replay(): void;
  setReducedMotion(enabled: boolean): void;
  setSoundEnabled(enabled: boolean): void;
  setMusicEnabled(enabled: boolean): void;
  setLargeText(enabled: boolean): void;
  destroy(): void;
}

interface BootstrapHarness {
  readonly Bootstrap: new () => Record<string, unknown>;
  readonly wechat: InterruptionWechatApi;
  readonly appCommands: Array<{ readonly type: string }>;
  readonly mountedScenes: PicturebookSceneDouble[];
  readonly persistedSettings: Array<Readonly<Record<string, boolean>>>;
  readonly storedCheckpoints: Array<Readonly<Record<string, unknown>>>;
}

function createSave(): Record<string, unknown> {
  return {
    dataVersion: 2,
    unlockedNightIds: ["night-01"],
    completedNightIds: [],
    recentSafeCheckpoint: null,
    recentAppCheckpoint: { kind: "outdoor-ready", updatedAt: "1970-01-01T00:00:00.000Z" },
    settings: {
      musicEnabled: true,
      ambientEnabled: true,
      feedbackEnabled: true,
      reducedMotion: false,
      largeText: false,
    },
    updatedAt: "1970-01-01T00:00:00.000Z",
  };
}

function createPicturebookSceneDouble(): PicturebookSceneDouble {
  return {
    initializeCalls: [],
    pauseCalls: 0,
    resumeCalls: 0,
    replayCalls: 0,
    reducedMotionCalls: [],
    soundCalls: [],
    musicCalls: [],
    largeTextCalls: [],
    initialize(options) {
      this.initializeCalls.push(options);
    },
    pauseAudioForInterruption() {
      this.pauseCalls += 1;
    },
    resumeAudioFromInterruption() {
      this.resumeCalls += 1;
    },
    replay() {
      this.replayCalls += 1;
    },
    setReducedMotion(enabled) {
      this.reducedMotionCalls.push(enabled);
    },
    setSoundEnabled(enabled) {
      this.soundCalls.push(enabled);
    },
    setMusicEnabled(enabled) {
      this.musicCalls.push(enabled);
    },
    setLargeText(enabled) {
      this.largeTextCalls.push(enabled);
    },
    destroy() {},
  };
}

function compileBootstrapHarness(): BootstrapHarness {
  const mountedScenes: PicturebookSceneDouble[] = [];
  const persistedSettings: Array<Readonly<Record<string, boolean>>> = [];
  const storedCheckpoints: Array<Readonly<Record<string, unknown>>> = [];

  class FakeComponent {
    public node = {
      addComponent: (Constructor: new () => unknown): unknown => {
        const component = new Constructor();
        if (component instanceof PicturebookSceneStub) {
          mountedScenes.push(component.scene);
          return component.scene;
        }
        return component;
      },
    };
  }

  class PicturebookSceneStub extends FakeComponent {
    public readonly scene = createPicturebookSceneDouble();
  }

  class OverlayStub extends FakeComponent {
    public initialize(): void {}
    public refresh(): void {}
  }

  const eventEmitter = {
    on: () => undefined,
    off: () => undefined,
  };
  const wechat: InterruptionWechatApi = {
    beginHandler: null,
    endHandler: null,
    removedBeginHandler: null,
    removedEndHandler: null,
    onAudioInterruptionBegin(handler) {
      this.beginHandler = handler;
    },
    offAudioInterruptionBegin(handler) {
      this.removedBeginHandler = handler;
    },
    onAudioInterruptionEnd(handler) {
      this.endHandler = handler;
    },
    offAudioInterruptionEnd(handler) {
      this.removedEndHandler = handler;
    },
    getLaunchOptionsSync: () => ({ query: {} }),
    showShareMenu: () => undefined,
    onShareAppMessage: () => undefined,
    offShareAppMessage: () => undefined,
    shareCalls: 0,
    lastShareOptions: null,
    shareAppMessage(options) {
      this.shareCalls += 1;
      this.lastShareOptions = options;
    },
  };
  const memoryStorage = new Map<string, string>();
  const ccStub = {
    _decorator: { ccclass: () => (constructor: unknown) => constructor },
    Component: FakeComponent,
    game: eventEmitter,
    Game: { EVENT_HIDE: "game-hide", EVENT_SHOW: "game-show" },
    sys: {
      localStorage: {
        getItem: (key: string) => memoryStorage.get(key) ?? null,
        setItem: (key: string, value: string) => memoryStorage.set(key, value),
        removeItem: (key: string) => memoryStorage.delete(key),
      },
    },
  };
  const appCommands: Array<{ readonly type: string }> = [];
  const defaultAppFlow = {
    phase: "boot",
    overlay: "none",
    overlayBeforePause: null,
    loadingErrorMessage: null,
    shareErrorMessage: null,
    saveErrorMessage: null,
  };
  const localSaveStub = {
    createDefaultSave: () => createSave(),
    loadLocalSave: () => ({ save: createSave(), status: "loaded" }),
    persistLocalSave: () => true,
    storeRecentAppCheckpoint: (
      save: Record<string, unknown>,
      checkpoint: Readonly<Record<string, unknown>>,
    ) => {
      storedCheckpoints.push(checkpoint);
      return { ...save, recentAppCheckpoint: checkpoint };
    },
    updateUserSettings: (
      save: Record<string, unknown>,
      settings: Readonly<Record<string, boolean>>,
    ) => {
      persistedSettings.push(settings);
      return { ...save, settings };
    },
  };
  const appFlowStub = {
    createAppFlowState: () => ({ ...defaultAppFlow }),
    transitionAppFlow: (state: Record<string, unknown>, command: { readonly type: string }) => {
      appCommands.push(command);
      if (command.type === "BOOT_COMPLETE") {
        return { state: { ...state, phase: "outdoor-ready" }, effects: [] };
      }
      if (command.type === "AUDIO_INTERRUPTED" && state.overlay === "none") {
        return { state: { ...state, overlay: "audio-interrupted" }, effects: [] };
      }
      if (command.type === "AUDIO_RESUMED" && state.overlay === "audio-interrupted") {
        return { state: { ...state, overlay: "none" }, effects: [] };
      }
      if (command.type === "CLOSE_SHARE_PREVIEW" && state.overlay === "share-preview") {
        return { state: { ...state, overlay: "none" }, effects: [] };
      }
      if (command.type === "SHARE_FAILED" && state.overlay === "share-preview") {
        return { state: { ...state, overlay: "share-failed" }, effects: [] };
      }
      return { state, effects: [] };
    },
  };
  const sharingStub = {
    createSharePayload: () => ({ title: "share", query: "entry=shared" }),
    resolveLaunchIntent: () => ({ kind: "normal" }),
  };

  const sourcePath = resolve(
    import.meta.dirname,
    "../assets/scripts/cocos/tonight-has-light-bootstrap.ts",
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
    { filename: "tonight-has-light-bootstrap.compiled.cjs" },
  ) as (
    localRequire: (id: string) => unknown,
    module: typeof moduleRecord,
    exports: Record<string, unknown>,
  ) => void;
  evaluate(
    (id) => {
      if (id === "cc") return ccStub;
      if (id.endsWith("/local-save.ts")) return localSaveStub;
      if (id.endsWith("/app-flow.ts")) return appFlowStub;
      if (id.endsWith("/sharing.ts")) return sharingStub;
      if (id.endsWith("/formal-picturebook-0-4-8/formal-picturebook-partial-scene.ts")) {
        return { FormalPicturebookPartialScene: PicturebookSceneStub };
      }
      if (id.endsWith("/outdoor-gate-c-rig.ts")) {
        return { requestsReducedMotionFromSearch: () => false };
      }
      if (id.endsWith("/tonight-has-light-outdoor-functional-overlay.ts")) {
        return { TonightHasLightOutdoorFunctionalOverlay: OverlayStub };
      }
      throw new Error(`Unexpected test import: ${id}`);
    },
    moduleRecord,
    moduleRecord.exports,
  );

  (globalThis as typeof globalThis & { wx?: InterruptionWechatApi }).wx = wechat;
  return {
    Bootstrap: moduleRecord.exports.TonightHasLightBootstrap as BootstrapHarness["Bootstrap"],
    wechat,
    appCommands,
    mountedScenes,
    persistedSettings,
    storedCheckpoints,
  };
}

function callLifecycle(instance: Record<string, unknown>, name: string): void {
  const callback = instance[name];
  assert.equal(typeof callback, "function", `${name} must be callable`);
  (callback as () => void).call(instance);
}

function destroyHarness(bootstrap: Record<string, unknown>): void {
  callLifecycle(bootstrap, "onDestroy");
  delete (globalThis as typeof globalThis & { wx?: InterruptionWechatApi }).wx;
}

test("registers stable WeChat interruption callbacks and removes the same references", () => {
  const harness = compileBootstrapHarness();
  const bootstrap = new harness.Bootstrap();
  callLifecycle(bootstrap, "onLoad");

  assert.equal(typeof harness.wechat.beginHandler, "function");
  assert.equal(typeof harness.wechat.endHandler, "function");

  destroyHarness(bootstrap);
  assert.equal(harness.wechat.removedBeginHandler, harness.wechat.beginHandler);
  assert.equal(harness.wechat.removedEndHandler, harness.wechat.endHandler);
});

test("mounts one 0.4.8 picturebook scene with all persisted accessibility and audio settings", () => {
  const harness = compileBootstrapHarness();
  const bootstrap = new harness.Bootstrap();
  callLifecycle(bootstrap, "onLoad");
  callLifecycle(bootstrap, "start");

  assert.equal(harness.mountedScenes.length, 1);
  assert.equal(harness.mountedScenes[0].initializeCalls.length, 1);
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(harness.mountedScenes[0].initializeCalls[0])
        .filter(([key]) => key !== "bridge"),
    ),
    {
      reducedMotion: false,
      soundEnabled: true,
      musicEnabled: true,
      largeText: false,
      audioInterrupted: false,
    },
  );

  destroyHarness(bootstrap);
});

test("deduplicates WeChat audio interruption begin and end for the picturebook scene", () => {
  const harness = compileBootstrapHarness();
  const bootstrap = new harness.Bootstrap();
  callLifecycle(bootstrap, "onLoad");
  callLifecycle(bootstrap, "start");
  const scene = harness.mountedScenes[0];

  harness.wechat.beginHandler?.();
  harness.wechat.beginHandler?.();
  assert.equal(scene.pauseCalls, 1);
  assert.equal(bootstrap.audioInterruptionActive, true);

  harness.wechat.endHandler?.();
  harness.wechat.endHandler?.();
  assert.equal(scene.resumeCalls, 1);
  assert.equal(bootstrap.audioInterruptionActive, false);
  assert.deepEqual(
    harness.appCommands.filter(({ type }) => type.startsWith("AUDIO_")),
    [{ type: "AUDIO_INTERRUPTED" }, { type: "AUDIO_RESUMED" }],
  );

  destroyHarness(bootstrap);
});

test("does not resume picturebook audio while hidden and resumes once after show", () => {
  const harness = compileBootstrapHarness();
  const bootstrap = new harness.Bootstrap();
  callLifecycle(bootstrap, "onLoad");
  callLifecycle(bootstrap, "start");
  const scene = harness.mountedScenes[0];

  callLifecycle(bootstrap, "handleGameHide");
  harness.wechat.beginHandler?.();
  harness.wechat.endHandler?.();
  assert.equal(scene.pauseCalls, 2, "hide and interruption each pause the idempotent scene gate");
  assert.equal(scene.resumeCalls, 0);

  callLifecycle(bootstrap, "handleGameShow");
  assert.equal(scene.resumeCalls, 1);

  destroyHarness(bootstrap);
});

test("show before interruption end keeps audio paused until the interruption settles", () => {
  const harness = compileBootstrapHarness();
  const bootstrap = new harness.Bootstrap();
  callLifecycle(bootstrap, "onLoad");
  callLifecycle(bootstrap, "start");
  const scene = harness.mountedScenes[0];

  callLifecycle(bootstrap, "handleGameHide");
  harness.wechat.beginHandler?.();
  callLifecycle(bootstrap, "handleGameShow");
  assert.equal(scene.resumeCalls, 0);

  harness.wechat.endHandler?.();
  assert.equal(scene.resumeCalls, 1);

  destroyHarness(bootstrap);
});

test("forwards settings to the current scene without resetting unrelated settings", () => {
  const harness = compileBootstrapHarness();
  const bootstrap = new harness.Bootstrap();
  callLifecycle(bootstrap, "onLoad");
  callLifecycle(bootstrap, "start");
  const scene = harness.mountedScenes[0];

  const updateSettings = bootstrap.updateSettings as (
    settings: Readonly<Record<string, boolean>>,
  ) => Readonly<Record<string, boolean>>;
  const result = updateSettings.call(bootstrap, {
    reducedMotion: true,
    ambientEnabled: false,
    largeText: true,
  });

  assert.deepEqual(result, {
    musicEnabled: true,
    ambientEnabled: false,
    feedbackEnabled: true,
    reducedMotion: true,
    largeText: true,
  });
  assert.deepEqual(scene.reducedMotionCalls, [true]);
  assert.deepEqual(scene.soundCalls, [false]);
  assert.deepEqual(scene.musicCalls, [true]);
  assert.deepEqual(scene.largeTextCalls, [true]);
  assert.deepEqual(harness.persistedSettings.at(-1), result);

  destroyHarness(bootstrap);
});

test("returning outdoors replays Root R4 and stores only an outdoor-safe checkpoint", () => {
  const harness = compileBootstrapHarness();
  const bootstrap = new harness.Bootstrap();
  callLifecycle(bootstrap, "onLoad");
  callLifecycle(bootstrap, "start");
  const scene = harness.mountedScenes[0];

  const returnToOutdoor = bootstrap.returnToOutdoor as () => void;
  returnToOutdoor.call(bootstrap);

  assert.equal(scene.replayCalls, 1);
  assert.equal(harness.storedCheckpoints.length, 1);
  assert.equal(harness.storedCheckpoints[0].kind, "outdoor-ready");
  assert.equal("nightId" in harness.storedCheckpoints[0], false);

  destroyHarness(bootstrap);
});

test("allows only one native share request until its callback settles", () => {
  const harness = compileBootstrapHarness();
  const bootstrap = new harness.Bootstrap();
  callLifecycle(bootstrap, "onLoad");
  bootstrap.appFlow = {
    ...(bootstrap.appFlow as Record<string, unknown>),
    phase: "finished-summary",
    overlay: "share-preview",
  };

  const requestShare = bootstrap.requestWechatShare as () => boolean;
  assert.equal(requestShare.call(bootstrap), true);
  assert.equal(requestShare.call(bootstrap), false);
  assert.equal(harness.wechat.shareCalls, 1);

  harness.wechat.lastShareOptions?.success?.();
  assert.equal((bootstrap.appFlow as Record<string, unknown>).overlay, "none");
  harness.wechat.lastShareOptions?.fail?.(new Error("late callback"));
  assert.equal((bootstrap.appFlow as Record<string, unknown>).overlay, "none");

  bootstrap.appFlow = {
    ...(bootstrap.appFlow as Record<string, unknown>),
    overlay: "share-preview",
  };
  assert.equal(requestShare.call(bootstrap), true);
  assert.equal(harness.wechat.shareCalls, 2);
  harness.wechat.lastShareOptions?.fail?.(new Error("cancelled"));
  assert.equal((bootstrap.appFlow as Record<string, unknown>).overlay, "share-failed");

  destroyHarness(bootstrap);
});

test("closing a share preview releases a missing native callback without accepting it late", () => {
  const harness = compileBootstrapHarness();
  const bootstrap = new harness.Bootstrap();
  callLifecycle(bootstrap, "onLoad");
  bootstrap.appFlow = {
    ...(bootstrap.appFlow as Record<string, unknown>),
    phase: "finished-summary",
    overlay: "share-preview",
  };

  const requestShare = bootstrap.requestWechatShare as () => boolean;
  const sendAppFlow = bootstrap.sendAppFlow as (command: { readonly type: string }) => unknown;
  assert.equal(requestShare.call(bootstrap), true);
  const abandonedAttempt = harness.wechat.lastShareOptions;
  assert.ok(abandonedAttempt);

  sendAppFlow.call(bootstrap, { type: "CLOSE_SHARE_PREVIEW" });
  assert.equal((bootstrap.appFlow as Record<string, unknown>).overlay, "none");

  bootstrap.appFlow = {
    ...(bootstrap.appFlow as Record<string, unknown>),
    overlay: "share-preview",
  };
  assert.equal(requestShare.call(bootstrap), true);
  assert.equal(harness.wechat.shareCalls, 2);
  const currentAttempt = harness.wechat.lastShareOptions;
  assert.notEqual(currentAttempt, abandonedAttempt);

  abandonedAttempt.fail?.(new Error("late callback from abandoned native surface"));
  assert.equal((bootstrap.appFlow as Record<string, unknown>).overlay, "share-preview");

  currentAttempt?.success?.();
  assert.equal((bootstrap.appFlow as Record<string, unknown>).overlay, "none");

  destroyHarness(bootstrap);
});
