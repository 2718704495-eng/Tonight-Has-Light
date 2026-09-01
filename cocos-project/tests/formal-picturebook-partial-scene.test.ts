import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import vm from "node:vm";
import * as assets from "../assets/scripts/cocos/formal-picturebook-0-4-8/formal-picturebook-partial-assets.ts";
import * as debug from "../assets/scripts/cocos/formal-picturebook-0-4-8/formal-picturebook-partial-debug.ts";
import * as model from "../assets/scripts/cocos/formal-picturebook-0-4-8/formal-picturebook-partial-model.ts";
import * as runtime from "../assets/scripts/cocos/formal-picturebook-0-4-8/formal-picturebook-partial-runtime.ts";

const require = createRequire(import.meta.url);
const typescript = require(
  "/Applications/CocosCreator.app/Contents/Resources/app.asar.unpacked/node_modules/typescript/lib/typescript.js",
);

class FakeComponent { public node!: FakeNode; }
class FakeColor {
  public static readonly WHITE = new FakeColor(255, 255, 255, 255);
  public readonly rOrHex: number | string;
  public readonly g: number;
  public readonly b: number;
  public readonly a: number;
  public constructor(
    rOrHex: number | string = 255,
    g = 255,
    b = 255,
    a = 255,
  ) {
    this.rOrHex = rOrHex;
    this.g = g;
    this.b = b;
    this.a = a;
  }
}
class FakeSpriteFrame {
  public readonly id: string;
  public constructor(id = "frame") { this.id = id; }
}
class FakeUITransform extends FakeComponent {
  public width = 0;
  public height = 0;
  public anchorX = 0.5;
  public anchorY = 0.5;
  public setContentSize(width: number, height: number): void { this.width = width; this.height = height; }
  public setAnchorPoint(x: number, y: number): void { this.anchorX = x; this.anchorY = y; }
  public convertToNodeSpaceAR(value: unknown): unknown { return value; }
  public get contentSize(): { readonly width: number; readonly height: number } {
    return { width: this.width, height: this.height };
  }
}
class FakeSprite extends FakeComponent {
  public static readonly SizeMode = { CUSTOM: 2 };
  public spriteFrame: FakeSpriteFrame | null = null;
  public sizeMode = 0;
  public trim = true;
  public color = FakeColor.WHITE;
}
class FakeUIOpacity extends FakeComponent { public opacity = 255; }
class FakeLabel extends FakeComponent {
  public static readonly Overflow = { NONE: 0, CLAMP: 1, SHRINK: 2, RESIZE_HEIGHT: 3 };
  public string = "";
  public fontSize = 0;
  public lineHeight = 0;
  public overflow = FakeLabel.Overflow.NONE;
  public enableWrapText = true;
  public horizontalAlign = 0;
  public verticalAlign = 0;
  public color = FakeColor.WHITE;
  public useSystemFont = false;
  public fontFamily = "Arial";
}
class FakeLabelOutline extends FakeComponent {
  public color = new FakeColor();
  public width = 0;
}
class FakeGraphics extends FakeComponent {
  public fillColor = FakeColor.WHITE;
  public strokeColor = FakeColor.WHITE;
  public lineWidth = 1;
  public readonly commands: string[] = [];
  public clear(): void { this.commands.push("clear"); }
  public moveTo(): void { this.commands.push("moveTo"); }
  public lineTo(): void { this.commands.push("lineTo"); }
  public bezierCurveTo(): void { this.commands.push("bezierCurveTo"); }
  public close(): void { this.commands.push("close"); }
  public fill(): void { this.commands.push("fill"); }
  public stroke(): void { this.commands.push("stroke"); }
}
class FakeCamera extends FakeComponent { public clearColor = new FakeColor(); }
class FakeEventTouch {
  public propagationStopped = false;
  public getUILocation(): { readonly x: number; readonly y: number } { return { x: 0, y: 0 }; }
}
class FakeNode {
  public static readonly EventType = {
    TOUCH_START: "touch-start",
    TOUCH_END: "touch-end",
    TOUCH_CANCEL: "touch-cancel",
  };
  public readonly children: FakeNode[] = [];
  public active = true;
  public layer = 0;
  public parent: FakeNode | null = null;
  public position = { x: 0, y: 0, z: 0 };
  public scale = { x: 1, y: 1, z: 1 };
  public destroyed = false;
  public readonly name: string;
  private readonly components: FakeComponent[] = [];
  private readonly listeners = new Map<string, Array<{ callback: (...args: any[]) => void; target: unknown }>>();
  public constructor(name = "") { this.name = name; }
  public addComponent<T extends FakeComponent>(Type: new () => T): T {
    const component = new Type();
    component.node = this;
    this.components.push(component);
    return component;
  }
  public getComponent<T extends FakeComponent>(Type: new () => T): T | null {
    return this.components.find((component): component is T => component instanceof Type) ?? null;
  }
  public getComponentInChildren<T extends FakeComponent>(Type: new () => T): T | null {
    return this.getComponent(Type)
      ?? this.children.map((child) => child.getComponentInChildren(Type)).find(Boolean)
      ?? null;
  }
  public addChild(child: FakeNode): void { child.parent = this; this.children.push(child); }
  public setPosition(x: number, y: number, z = 0): void { this.position = { x, y, z }; }
  public setScale(x: number, y: number, z = 1): void { this.scale = { x, y, z }; }
  public setSiblingIndex(index: number): void {
    if (!this.parent) return;
    const siblings = this.parent.children;
    const current = siblings.indexOf(this);
    if (current >= 0) siblings.splice(current, 1);
    siblings.splice(index, 0, this);
  }
  public on(event: string, callback: (...args: any[]) => void, target: unknown): void {
    const listeners = this.listeners.get(event) ?? [];
    listeners.push({ callback, target });
    this.listeners.set(event, listeners);
  }
  public off(event: string, callback: (...args: any[]) => void, target: unknown): void {
    const listeners = this.listeners.get(event) ?? [];
    this.listeners.set(
      event,
      listeners.filter((listener) => listener.callback !== callback || listener.target !== target),
    );
  }
  public emit(event: string, ...args: any[]): void {
    for (const listener of [...(this.listeners.get(event) ?? [])]) {
      listener.callback.apply(listener.target, args);
    }
  }
  public destroy(): void { this.destroyed = true; }
  public allNodes(): readonly FakeNode[] { return [this, ...this.children.flatMap((child) => child.allNodes())]; }
}

class FakeAudioGate extends FakeComponent {
  public readonly calls: string[] = [];
  public setChannelEnabled(sound: boolean, music: boolean): void { this.calls.push(`channels:${sound}:${music}`); }
  public pauseForInterruption(): void { this.calls.push("pause"); }
  public resumeFromInterruption(): void { this.calls.push("resume"); }
  public unlockFromUserGesture(): void { this.calls.push("unlock"); }
  public getPlaybackStatus() {
    return {
      ambientPlaying: false,
      musicPlaying: false,
      ambientAssigned: true,
      musicAssigned: false,
      ambientVolume: 0,
      musicVolume: 0,
    };
  }
}

interface Harness {
  readonly Scene: new () => FakeComponent & Record<string, any>;
  readonly bundleNames: string[];
  readonly bundlePaths: string[];
  readonly resourcePaths: string[];
  readonly resolutionCalls: unknown[][];
}

function compileHarness(): Harness {
  const bundleNames: string[] = [];
  const bundlePaths: string[] = [];
  const resourcePaths: string[] = [];
  const resolutionCalls: unknown[][] = [];
  const bundle = {
    load(path: string, _Type: unknown, callback: (error: Error | null, frame: FakeSpriteFrame) => void): void {
      bundlePaths.push(path);
      callback(null, new FakeSpriteFrame(path));
    },
    release(): void {},
  };
  const assetManager = {
    getBundle(): null { return null; },
    loadBundle(name: string, callback: (error: Error | null, value: typeof bundle) => void): void {
      bundleNames.push(name);
      callback(null, bundle);
    },
  };
  const resources = {
    load(path: string, _Type: unknown, callback: (error: Error | null, frame: FakeSpriteFrame) => void): void {
      resourcePaths.push(path);
      callback(null, new FakeSpriteFrame(path));
    },
    release(): void {},
  };
  const cc = {
    _decorator: { ccclass: () => (constructor: unknown) => constructor },
    assetManager,
    AssetManager: class {},
    Camera: FakeCamera,
    Color: FakeColor,
    Component: FakeComponent,
    EventTouch: FakeEventTouch,
    Graphics: FakeGraphics,
    HorizontalTextAlignment: { LEFT: 0, CENTER: 1, RIGHT: 2 },
    Label: FakeLabel,
    LabelOutline: FakeLabelOutline,
    Layers: { Enum: { UI_2D: 1 } },
    Node: FakeNode,
    ResolutionPolicy: { SHOW_ALL: "SHOW_ALL" },
    resources,
    screen: { windowSize: { width: 430, height: 844 } },
    Sprite: FakeSprite,
    SpriteFrame: FakeSpriteFrame,
    sys: { isBrowser: false },
    UIOpacity: FakeUIOpacity,
    UITransform: FakeUITransform,
    Vec3: class {
      public x: number;
      public y: number;
      public z: number;
      public constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    },
    VerticalTextAlignment: { TOP: 0, CENTER: 1, BOTTOM: 2 },
    view: {
      setDesignResolutionSize(...args: unknown[]): void { resolutionCalls.push(args); },
      getVisibleSize(): { readonly width: number; readonly height: number } { return { width: 390, height: 844 }; },
    },
  };
  const sourcePath = resolve(
    import.meta.dirname,
    "../assets/scripts/cocos/formal-picturebook-0-4-8/formal-picturebook-partial-scene.ts",
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
    { filename: "formal-picturebook-partial-scene.compiled.cjs" },
  ) as (localRequire: (id: string) => unknown, module: typeof moduleRecord, exports: Record<string, unknown>) => void;
  evaluate((id) => {
    if (id === "cc") return cc;
    if (id.endsWith("formal-picturebook-partial-assets.ts")) return assets;
    if (id.endsWith("formal-picturebook-partial-debug.ts")) return debug;
    if (id.endsWith("formal-picturebook-partial-model.ts")) return model;
    if (id.endsWith("formal-picturebook-partial-runtime.ts")) return runtime;
    if (id.endsWith("outdoor-gate-c-audio-gate.ts")) return { OutdoorGateCAudioGate: FakeAudioGate };
    throw new Error(`Unexpected test import: ${id}`);
  }, moduleRecord, moduleRecord.exports);
  return {
    Scene: moduleRecord.exports.FormalPicturebookPartialScene as Harness["Scene"],
    bundleNames,
    bundlePaths,
    resourcePaths,
    resolutionCalls,
  };
}

test("scene exports the bootstrap bridge including large text and audio interruption controls", () => {
  const { Scene } = compileHarness();
  const scene = new Scene();
  const methods = [
    "initialize",
    "setReducedMotion",
    "setSoundEnabled",
    "setMusicEnabled",
    "setLargeText",
    "pauseAudioForInterruption",
    "resumeAudioFromInterruption",
    "replay",
  ];
  for (const method of methods) assert.equal(typeof scene[method], "function", method);

  scene.initialize({
    reducedMotion: true,
    soundEnabled: false,
    musicEnabled: true,
    audioInterrupted: true,
    largeText: true,
  });
  assert.equal(scene.state.reducedMotion, true);
  assert.equal(scene.largeText, true);
});

test("initial mount lazily loads only Root R4 from the approved 0.4.8 bundle", async () => {
  const harness = compileHarness();
  const scene = new harness.Scene();
  scene.mountGeneration = 1;
  scene.destroyed = false;
  scene.buildPersistentScene = (): void => {};
  await scene.mountInitial(1);
  assert.deepEqual(harness.bundleNames, ["formal-picturebook-partial-0-4-8"]);
  assert.deepEqual(harness.bundlePaths, ["root/root-wind-hem-r4/spriteFrame"]);
  assert.deepEqual(harness.resourcePaths, []);
});

test("persistent renderer owns exactly two full-frame page Sprites and one independent meteor Graphics", () => {
  const harness = compileHarness();
  const scene = new harness.Scene();
  scene.node = new FakeNode("Host");
  scene.initialize({
    reducedMotion: false,
    soundEnabled: true,
    musicEnabled: true,
    audioInterrupted: false,
    largeText: true,
  });
  scene.buildPersistentScene(
    new FakeSpriteFrame("root/root-wind-hem-r4/spriteFrame"),
  );

  const nodes = scene.node.allNodes();
  const pageNodes = nodes.filter((node) => node.name.startsWith("FormalPageSlot"));
  assert.equal(pageNodes.length, 2);
  for (const node of pageNodes) {
    const transform = node.getComponent(FakeUITransform)!;
    const sprite = node.getComponent(FakeSprite)!;
    assert.deepEqual([transform.width, transform.height], [390, 844]);
    assert.equal(sprite.sizeMode, FakeSprite.SizeMode.CUSTOM);
    assert.equal(sprite.trim, false);
  }
  const meteorNode = nodes.find((node) => node.name === "FormalMeteor");
  assert.ok(meteorNode?.getComponent(FakeGraphics));
  assert.equal(nodes.some((node) => /breeze/i.test(node.name)), false);
  assert.equal(nodes.filter((node) => node.getComponent(FakeAudioGate)).length, 1);
  for (const markerName of [
    "RootInvitationSkyTarget",
    "RootInvitationHomeTarget",
    "StargazeChoiceHomeTarget",
    "StargazeChoiceStayTarget",
    "HomeReturnRootTarget",
  ]) {
    assert.ok(nodes.some((node) => node.name === markerName), markerName);
  }
  for (const label of nodes.map((node) => node.getComponent(FakeLabel)).filter(Boolean)) {
    assert.notEqual(label!.overflow, FakeLabel.Overflow.SHRINK);
    assert.equal(label!.useSystemFont, true);
  }
  assert.deepEqual(scene.h4EatControl.normalPosition, { x: 1, y: -62 });
  assert.deepEqual(scene.h4SipControl.normalPosition, { x: -1.5, y: -62 });
  assert.equal(scene.h4EatControl.baseFontSize, 16);
  assert.equal(scene.h4SipControl.baseFontSize, 16);
  for (const control of [scene.h4EatControl, scene.h4SipControl]) {
    assert.equal(control.label.fontFamily, "Songti SC");
    assert.deepEqual(
      [control.label.color.rOrHex, control.label.color.g, control.label.color.b],
      [246, 226, 188],
    );
    const outline = control.labelNode.getComponent(FakeLabelOutline);
    assert.ok(outline);
    assert.deepEqual([outline.color.rOrHex, outline.color.g, outline.color.b], [38, 23, 15]);
    assert.equal(outline.width, 1.6);
  }
  for (const blockOrControl of [
    scene.rootStargazeControl,
    scene.rootHomeControl,
    scene.nextHint,
    scene.finaleLine1,
    scene.finaleLine2,
    scene.finaleHomeControl,
    scene.finaleStayControl,
    scene.homeReturnRootControl,
  ]) {
    assert.equal(blockOrControl.label.fontFamily, "Kaiti SC");
  }
  assert.equal(scene.finaleLine1.baseFontSize, 16);
  assert.equal(scene.finaleLine2.baseFontSize, 18);
  assert.deepEqual(
    [scene.rootStargazeControl.label.color.rOrHex, scene.rootStargazeControl.label.color.g, scene.rootStargazeControl.label.color.b],
    [229, 223, 208],
  );
  assert.deepEqual(
    [scene.rootHomeControl.label.color.rOrHex, scene.rootHomeControl.label.color.g, scene.rootHomeControl.label.color.b],
    [244, 202, 125],
  );
  assert.deepEqual(
    [scene.finaleHomeControl.label.color.rOrHex, scene.finaleHomeControl.label.color.g, scene.finaleHomeControl.label.color.b],
    [244, 202, 125],
  );
  assert.deepEqual(
    [
      scene.homeReturnRootControl.label.color.rOrHex,
      scene.homeReturnRootControl.label.color.g,
      scene.homeReturnRootControl.label.color.b,
    ],
    [229, 223, 208],
    "H5 return copy sits on a dark floor and must stay pale enough to read",
  );
  assert.equal(
    scene.homeReturnRootControl.labelNode.getComponent(FakeLabelOutline)?.width,
    1.2,
    "H5 return copy needs the outdoor-style outline against the floor texture",
  );
  const paper = nodes.find((node) => node.name === "FormalH4LargeTextTablePaper");
  assert.ok(paper?.getComponent(FakeGraphics));
  assert.equal(paper?.getComponent(FakeSprite), null, "large-text paper is an editable vector, not a stretched old bitmap");
});

test("transparent interaction targets have a real hit surface for canvas touch dispatch", () => {
  const harness = compileHarness();
  const scene = new harness.Scene();
  scene.node = new FakeNode("Host");
  scene.initialize({
    reducedMotion: false,
    soundEnabled: true,
    musicEnabled: true,
    audioInterrupted: false,
    largeText: false,
  });
  scene.buildPersistentScene(
    new FakeSpriteFrame("root/root-wind-hem-r4/spriteFrame"),
  );

  const nodes = scene.node.allNodes();
  for (const markerName of [
    "FormalPageAdvance",
    "RootInvitationSkyTarget",
    "RootInvitationHomeTarget",
    "StargazeChoiceHomeTarget",
    "StargazeChoiceStayTarget",
    "HomeReturnRootTarget",
  ]) {
    const target = nodes.find((node) => node.name === markerName);
    assert.ok(target, markerName);
    const hitSurface = target.getComponent(FakeGraphics);
    assert.ok(hitSurface, `${markerName} must not rely on a renderer-less UITransform for touch hit testing`);
    assert.equal(hitSurface.fillColor.a, 0, `${markerName} hit surface must stay invisible`);
    assert.ok(hitSurface.commands.includes("fill"), `${markerName} hit surface must draw a filled polygon`);
  }
});

test("a child control unlocks audio synchronously even when it stops touch propagation", () => {
  const harness = compileHarness();
  const scene = new harness.Scene();
  scene.node = new FakeNode("Host");
  scene.initialize({
    reducedMotion: false,
    soundEnabled: true,
    musicEnabled: true,
    audioInterrupted: false,
    largeText: false,
  });
  scene.buildPersistentScene(
    new FakeSpriteFrame("root/root-wind-hem-r4/spriteFrame"),
  );

  const target = scene.node.allNodes().find((node: FakeNode) => node.name === "RootInvitationSkyTarget");
  assert.ok(target);
  const event = new FakeEventTouch();
  target.emit(FakeNode.EventType.TOUCH_START, event);

  assert.equal(event.propagationStopped, true);
  assert.deepEqual(scene.audioGate.calls.filter((call: string) => call === "unlock"), ["unlock"]);
});

test("root labels wait 1.5s while both branch targets work from the first frame", async () => {
  const harness = compileHarness();
  const scene = new harness.Scene();
  scene.node = new FakeNode("Host");
  scene.initialize({
    reducedMotion: false,
    soundEnabled: true,
    musicEnabled: true,
    audioInterrupted: false,
    largeText: false,
  });
  scene.mountGeneration = 1;
  await scene.mountInitial(1);

  assert.equal(scene.rootStargazeControl.target.active, true);
  assert.equal(scene.rootHomeControl.target.active, true);
  assert.equal(scene.rootStargazeControl.opacity.opacity, 0);
  assert.equal(scene.rootHomeControl.opacity.opacity, 0);

  scene.tapDebugAction("home");
  await new Promise<void>((resolvePromise) => setImmediate(resolvePromise));
  assert.equal(scene.state.pageId, "home-h1");
  assert.ok(scene.pendingPageTransition);
  assert.deepEqual(scene.pageSlots.map((slot: any) => slot.opacity.opacity), [255, 0]);
  assert.ok(scene.pageSlots.every((slot: any) => slot.sprite.spriteFrame));

  scene.advanceRuntimeMs(160);
  const mid = scene.pageSlots.map((slot: any) => slot.opacity.opacity);
  assert.ok(mid[0] > 0 && mid[1] > 0);
  assert.ok(mid[0] + mid[1] >= 254, "crossfade never exposes a blank safety frame");

  scene.advanceRuntimeMs(160);
  assert.equal(scene.pendingPageTransition, null);
  assert.equal(scene.residency.livePathCount(), 1);
  assert.equal(scene.pageSlots.filter((slot: any) => slot.opacity.opacity === 255).length, 1);
});

test("continue hint uses dark ink in the bright home and light ink under the outdoor sky", async () => {
  const harness = compileHarness();
  const scene = new harness.Scene();
  scene.node = new FakeNode("Host");
  scene.mountGeneration = 1;
  await scene.mountInitial(1);

  let state = model.createFormalPicturebookPartialState(false);
  state = model.reduceFormalPicturebookPartial(state, { type: "ENTER_HOME" }).state;
  state = model.reduceFormalPicturebookPartial(state, { type: "ADVANCE_TIME", deltaMs: 700 }).state;
  scene.state = state;
  scene.renderUi();
  assert.deepEqual(
    [scene.nextHint.label.color.rOrHex, scene.nextHint.label.color.g, scene.nextHint.label.color.b],
    [74, 43, 25],
  );

  state = model.createFormalPicturebookPartialState(false);
  state = model.reduceFormalPicturebookPartial(state, { type: "ENTER_STARGAZE" }).state;
  state = model.reduceFormalPicturebookPartial(state, { type: "ADVANCE_TIME", deltaMs: 700 }).state;
  scene.state = state;
  scene.renderUi();
  assert.deepEqual(
    [scene.nextHint.label.color.rOrHex, scene.nextHint.label.color.g, scene.nextHint.label.color.b],
    [229, 223, 208],
  );
});

test("stale H4 overlay loads are released instead of writing back after destruction", async () => {
  const harness = compileHarness();
  const scene = new harness.Scene();
  scene.transitionGeneration = 7;
  scene.destroyed = false;
  const callbacks: Array<(error: Error | null, frame: FakeSpriteFrame) => void> = [];
  const released: string[] = [];
  const bundle = {
    load(
      _path: string,
      _Type: unknown,
      callback: (error: Error | null, frame: FakeSpriteFrame) => void,
    ): void {
      callbacks.push(callback);
    },
    release(path: string): void { released.push(path); },
  };

  const loading = scene.ensureH4OverlaysLoaded(bundle, 7);
  await Promise.resolve();
  callbacks[0]!(null, new FakeSpriteFrame("ate"));
  await Promise.resolve();
  scene.destroyed = true;
  scene.transitionGeneration = 8;
  callbacks[1]!(null, new FakeSpriteFrame("sipped"));
  await loading;

  assert.deepEqual(released, ["home/h4-ate/spriteFrame", "home/h4-sipped/spriteFrame"]);
  assert.equal(scene.loadedH4Frames.size, 0);
});

test("an early H4 blank tap settles feedback before H5 and overlays fade with the outgoing page", async () => {
  const harness = compileHarness();
  const scene = new harness.Scene();
  scene.node = new FakeNode("Host");
  scene.mountGeneration = 1;
  await scene.mountInitial(1);
  await scene.ensureH4OverlaysLoaded(scene.bundle, scene.transitionGeneration);

  let h4 = model.createFormalPicturebookPartialState(false);
  h4 = model.reduceFormalPicturebookPartial(h4, { type: "ENTER_HOME" }).state;
  for (let index = 0; index < 3; index += 1) {
    h4 = model.reduceFormalPicturebookPartial(h4, { type: "TAP_PAGE" }).state;
  }
  h4 = model.reduceFormalPicturebookPartial(h4, { type: "ADVANCE_TIME", deltaMs: 300 }).state;
  scene.state = h4;
  scene.renderedPageId = "home-h4";
  scene.requestReduction({ type: "H4_EAT" }, "h4-eat");
  assert.ok(scene.pendingFeedbackTransition);

  scene.requestReduction({ type: "TAP_PAGE" }, "page-next");
  await new Promise<void>((resolvePromise) => setImmediate(resolvePromise));
  assert.equal(scene.pageLoading, false);
  assert.equal(scene.pendingFeedbackTransition, null);
  assert.equal(scene.state.pageId, "home-h5");
  assert.ok(scene.pendingPageTransition);
  assert.equal(scene.h4AteOverlay.opacity.opacity, 255);

  scene.advanceRuntimeMs(130);
  assert.ok(scene.h4AteOverlay.opacity.opacity > 0 && scene.h4AteOverlay.opacity.opacity < 255);
  assert.equal(
    scene.h4AteOverlay.opacity.opacity,
    scene.pageSlots[0].opacity.opacity,
    "H4 response layer follows the outgoing full-frame opacity",
  );
  scene.advanceRuntimeMs(130);
  assert.equal(scene.h4AteOverlay.opacity.opacity, 0);
  assert.equal(scene.h4AteOverlay.node.active, false);
});
