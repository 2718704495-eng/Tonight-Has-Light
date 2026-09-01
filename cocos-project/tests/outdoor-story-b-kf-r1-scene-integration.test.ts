import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import vm from "node:vm";
import * as doorInput from "../assets/scripts/cocos/outdoor-gate-c/outdoor-door-input.ts";
import { outdoorStoryDoorHitArea } from "../assets/scripts/cocos/outdoor-story-b-kf-r1-temp/outdoor-story-transition.ts";

const require = createRequire(import.meta.url);
const typescript = require(
  "/Applications/CocosCreator.app/Contents/Resources/app.asar.unpacked/node_modules/typescript/lib/typescript.js",
);

interface Listener {
  readonly callback: (...args: any[]) => void;
  readonly target: unknown;
}

class FakeEmitter {
  private readonly listeners = new Map<string, Listener[]>();

  public on(event: string, callback: (...args: any[]) => void, target: unknown): void {
    const listeners = this.listeners.get(event) ?? [];
    listeners.push({ callback, target });
    this.listeners.set(event, listeners);
  }

  public off(event: string, callback: (...args: any[]) => void, target: unknown): void {
    this.listeners.set(
      event,
      (this.listeners.get(event) ?? []).filter(
        (listener) => listener.callback !== callback || listener.target !== target,
      ),
    );
  }

  public emit(event: string, ...args: any[]): void {
    for (const listener of [...(this.listeners.get(event) ?? [])]) {
      listener.callback.apply(listener.target, args);
    }
  }
}

class FakeComponent {
  public node: any = null;
}

class FakeColor {
  public constructor(_value?: unknown, _g?: number, _b?: number, _a?: number) {}
}

class FakeJsonAsset {
  public json: unknown;

  public constructor(json: unknown = null) {
    this.json = json;
  }
}

class FakeEffectAsset {}
class FakeSpriteFrame {
  public readonly id: string;

  public constructor(id = "frame") {
    this.id = id;
  }
}
class FakeMaterial {
  public initialize(_options: unknown): void {}
  public destroy(): void {}
}
class FakeNode {}
class FakeSprite {}
class FakeUIOpacity {}
class FakeUITransform {}
class FakeVec3 {}
class FakeCamera {}

interface FakeBundle {
  readonly loadedPaths: string[];
  load: (
    path: string,
    type: unknown,
    callback: (error: Error | null, asset: FakeSpriteFrame | null) => void,
  ) => void;
  release: (path: string, type: unknown) => void;
}

interface SceneHarness {
  readonly Scene: new () => FakeComponent & Record<string, any>;
  readonly input: FakeEmitter;
  readonly loadedBundleNames: string[];
  readonly loadedBundlePaths: string[];
  readonly loadedResourcePaths: string[];
}

function compileSceneHarness(): SceneHarness {
  const input = new FakeEmitter();
  const loadedBundleNames: string[] = [];
  const loadedBundlePaths: string[] = [];
  const loadedResourcePaths: string[] = [];
  const bundle: FakeBundle = {
    loadedPaths: loadedBundlePaths,
    load(path, _type, callback): void {
      loadedBundlePaths.push(path);
      callback(null, new FakeSpriteFrame(path));
    },
    release(): void {},
  };
  const assetManager = {
    getBundle(): null {
      return null;
    },
    loadBundle(name: string, callback: (error: Error | null, value: FakeBundle) => void): void {
      loadedBundleNames.push(name);
      callback(null, bundle);
    },
  };
  const resources = {
    load(path: string, Type: unknown, callback: (error: Error | null, asset: any) => void): void {
      loadedResourcePaths.push(path);
      if (Type === FakeJsonAsset) {
        callback(null, new FakeJsonAsset({ layers_back_to_front: [], render_order: [] }));
      } else if (Type === FakeEffectAsset) {
        callback(null, new FakeEffectAsset());
      } else {
        callback(null, new FakeSpriteFrame(path));
      }
    },
    release(): void {},
  };
  const ccStub = {
    _decorator: { ccclass: () => (constructor: unknown) => constructor },
    assetManager,
    AssetManager: class {},
    Camera: FakeCamera,
    Color: FakeColor,
    Component: FakeComponent,
    EffectAsset: FakeEffectAsset,
    EventTouch: class {},
    input,
    Input: {
      EventType: {
        TOUCH_START: "touch-start",
        TOUCH_END: "touch-end",
        TOUCH_CANCEL: "touch-cancel",
      },
    },
    JsonAsset: FakeJsonAsset,
    Layers: { Enum: { UI_2D: 1 } },
    Material: FakeMaterial,
    Node: FakeNode,
    ResolutionPolicy: { SHOW_ALL: 1 },
    resources,
    screen: { windowSize: { width: 390, height: 844 } },
    Sprite: FakeSprite,
    SpriteFrame: FakeSpriteFrame,
    sys: { isBrowser: false },
    UITransform: FakeUITransform,
    UIOpacity: FakeUIOpacity,
    Vec3: FakeVec3,
    view: { setDesignResolutionSize(): void {} },
  };
  const sourcePath = resolve(
    import.meta.dirname,
    "../assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-scene.ts",
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
    { filename: "outdoor-gate-c-scene.compiled.cjs" },
  ) as (
    localRequire: (id: string) => unknown,
    module: typeof moduleRecord,
    exports: Record<string, unknown>,
  ) => void;
  evaluate(
    (id) => {
      if (id === "cc") return ccStub;
      if (id.endsWith("outdoor-gate-c-contract.ts")) {
        return { OUTDOOR_GATE_C_HERO_STAR_COUNT: 10 };
      }
      if (id.endsWith("outdoor-story-pages.ts")) return { OutdoorStoryPages: class {} };
      if (id.endsWith("outdoor-story-transition.ts")) {
        return { outdoorStoryDoorHitArea };
      }
      if (id.endsWith("outdoor-door-input.ts")) return doorInput;
      if (id.endsWith("outdoor-gate-c-audio-gate.ts")) return { OutdoorGateCAudioGate: class {} };
      if (id.endsWith("outdoor-gate-c-rig.ts")) return { OutdoorGateCRig: class {} };
      if (id.endsWith("outdoor-gate-c-viewport.ts")) {
        return { computeOutdoorGateCPixelAlignedViewport: () => ({ rootScale: { x: 1, y: 1 } }) };
      }
      if (id.endsWith("outdoor-slow-swipe.ts")) {
        return { classifyOutdoorSlowSwipe: () => ({ accepted: false, direction: "right" }) };
      }
      if (id.endsWith("settled-resource-batch.ts")) {
        return {
          loadSettledResourceBatch: async (
            paths: readonly string[],
            loader: (path: string) => Promise<unknown>,
          ) => Promise.all(paths.map(async (path) => ({ path, resource: await loader(path) }))),
        };
      }
      if (id.endsWith("outdoor-visual-manifest.ts")) {
        return {
          resourcePathForLayer: () => "unused",
          validateOutdoorVisualManifest: () => [],
        };
      }
      throw new Error(`Unexpected test import: ${id}`);
    },
    moduleRecord,
    moduleRecord.exports,
  );
  return {
    Scene: moduleRecord.exports.OutdoorGateCScene as SceneHarness["Scene"],
    input,
    loadedBundleNames,
    loadedBundlePaths,
    loadedResourcePaths,
  };
}

function touch(id: number, point: { readonly x: number; readonly y: number }): Record<string, any> {
  return {
    getID: () => id,
    getUILocation: () => point,
    getLocation: () => point,
  };
}

test("the outdoor mount loads only the isolated B/KF-R1 story bundle and its three frames", async () => {
  const harness = compileSceneHarness();
  const scene = new harness.Scene();
  scene.mountGeneration = 1;
  scene.destroyed = false;
  scene.buildPersistentScene = (): void => {};

  await scene.mountFromManifest(1);

  assert.deepEqual(harness.loadedBundleNames, ["outdoor-story-b-kf-r1-temp"]);
  assert.deepEqual(harness.loadedBundlePaths, [
    "b01-settle/spriteFrame",
    "b02-wind-passes/spriteFrame",
    "b03-afterwind/spriteFrame",
  ]);
  assert.deepEqual(
    harness.loadedResourcePaths,
    [],
    "the B path must not load the old V7 overlay manifest or screen material",
  );
});

test("door entry cancels the story before either bridge callback and remains deduplicated", () => {
  const harness = compileSceneHarness();
  const scene = new harness.Scene();
  const order: string[] = [];
  scene.storyPages = {
    cancelForDoorEntry(): boolean {
      order.push("cancel");
      return true;
    },
  };
  scene.bridge = {
    onInteraction(): void {
      order.push("interaction");
    },
    onEnterDoor(): void {
      order.push("enter");
    },
  };

  scene.requestDoorEntry();
  scene.requestDoorEntry();
  assert.deepEqual(order, ["cancel", "interaction", "enter"]);
});

test("scene replay and reduced-motion settings delegate to the one-shot story", () => {
  const harness = compileSceneHarness();
  const scene = new harness.Scene();
  const calls: string[] = [];
  scene.storyPages = {
    replay(): void {
      calls.push("story-replay");
    },
    setReducedMotion(enabled: boolean): void {
      calls.push(`story-reduced:${enabled}`);
    },
  };
  scene.rig = {
    replay(): void {
      calls.push("rig-replay");
    },
    setReducedMotion(enabled: boolean): void {
      calls.push(`rig-reduced:${enabled}`);
    },
  };

  scene.replay();
  scene.setReducedMotion(true);
  assert.deepEqual(calls, [
    "rig-replay",
    "story-replay",
    "rig-reduced:true",
    "story-reduced:true",
  ]);
});

test("one accepted slow swipe resets the existing story clock instead of stacking a page runner", () => {
  const harness = compileSceneHarness();
  const scene = new harness.Scene();
  const calls: string[] = [];
  const storyIdentity = {
    replay(): void {
      calls.push("story-replay");
    },
  };
  scene.storyPages = storyIdentity;
  scene.rig = {
    startGestureWind(direction: string): boolean {
      calls.push(`rig-wind:${direction}`);
      return true;
    },
  };
  scene.bridge = { onInteraction: (id: string) => calls.push(`interaction:${id}`) };

  assert.equal(scene.requestStoryReplay("left"), true);
  assert.equal(scene.storyPages, storyIdentity);
  assert.deepEqual(calls, ["story-replay", "rig-wind:left", "interaction:grass-swipe"]);
});

test("the WeChat fallback follows the active B02 door instead of the legacy V7 region", () => {
  const harness = compileSceneHarness();
  const scene = new harness.Scene();
  let entered = 0;
  scene.storyPages = {
    getDoorHitArea: () => outdoorStoryDoorHitArea("B02"),
    cancelForDoorEntry: () => true,
  };
  scene.bridge = { onEnterDoor: () => { entered += 1; } };
  scene.installDoorInputFallback();

  const point = { x: 358, y: 402 };
  harness.input.emit("touch-start", touch(7, point));
  harness.input.emit("touch-end", touch(7, point));
  assert.equal(entered, 1);
});

test("a tap that starts on a visible door survives a page boundary before touch-end", () => {
  const harness = compileSceneHarness();
  const scene = new harness.Scene();
  let activeArea = outdoorStoryDoorHitArea("B01");
  let entered = 0;
  scene.storyPages = {
    getDoorHitArea: () => activeArea,
    cancelForDoorEntry: () => true,
  };
  scene.bridge = { onEnterDoor: () => { entered += 1; } };
  scene.installDoorInputFallback();

  const b01Point = { x: 323, y: 304 };
  harness.input.emit("touch-start", touch(9, b01Point));
  activeArea = outdoorStoryDoorHitArea("B02");
  harness.input.emit("touch-end", touch(9, b01Point));
  assert.equal(entered, 1);
});
