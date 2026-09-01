import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import vm from "node:vm";
import * as storyModel from "../assets/scripts/cocos/outdoor-story-b-kf-r1-temp/outdoor-story-model.ts";
import * as storyTransition from "../assets/scripts/cocos/outdoor-story-b-kf-r1-temp/outdoor-story-transition.ts";

const require = createRequire(import.meta.url);
const typescript = require(
  "/Applications/CocosCreator.app/Contents/Resources/app.asar.unpacked/node_modules/typescript/lib/typescript.js",
);

class FakeComponent {
  public node!: FakeNode;
}

class FakeUITransform extends FakeComponent {
  public width = 0;
  public height = 0;
  public anchorX = 0.5;
  public anchorY = 0.5;

  public setContentSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  public setAnchorPoint(x: number, y: number): void {
    this.anchorX = x;
    this.anchorY = y;
  }
}

class FakeSpriteFrame {
  public readonly id: string;

  public constructor(id: string) {
    this.id = id;
  }
}

class FakeSprite extends FakeComponent {
  public static readonly SizeMode = { CUSTOM: 1 };
  public sizeMode = FakeSprite.SizeMode.CUSTOM;
  public trim = false;
  public spriteFrame: FakeSpriteFrame | null = null;
}

class FakeUIOpacity extends FakeComponent {
  public opacity = 255;
}

class FakeColor {
  public static readonly WHITE = new FakeColor(255, 255, 255, 255);

  public readonly rOrHex: number | string;
  public readonly g: number;
  public readonly b: number;
  public a: number;

  public constructor(
    rOrHex: number | string,
    g = 255,
    b = 255,
    a = 255,
  ) {
    this.rOrHex = rOrHex;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  public clone(): FakeColor {
    return new FakeColor(this.rOrHex, this.g, this.b, this.a);
  }
}

type DrawCommand = readonly [string, ...number[]];

class FakeGraphics extends FakeComponent {
  public fillColor = new FakeColor(255, 255, 255, 255);
  public readonly commands: DrawCommand[] = [];
  public readonly fills: FakeColor[] = [];

  public clear(): void {
    this.commands.length = 0;
  }

  public moveTo(x: number, y: number): void {
    this.commands.push(["moveTo", x, y]);
  }

  public lineTo(x: number, y: number): void {
    this.commands.push(["lineTo", x, y]);
  }

  public rect(x: number, y: number, width: number, height: number): void {
    this.commands.push(["rect", x, y, width, height]);
  }

  public close(): void {
    this.commands.push(["close"]);
  }

  public fill(): void {
    this.commands.push(["fill"]);
    this.fills.push(this.fillColor.clone());
  }
}

class FakeMask extends FakeComponent {
  public static readonly Type = { GRAPHICS_STENCIL: 2 };
  public type = 0;
  public subComp: FakeGraphics | null = null;
}

class FakeNode {
  public readonly children: FakeNode[] = [];
  public active = true;
  public layer = 0;
  public parent: FakeNode | null = null;
  public position = { x: 0, y: 0, z: 0 };
  public rotationZ = 0;
  private readonly components: FakeComponent[] = [];

  public readonly name: string;

  public constructor(name = "") {
    this.name = name;
  }

  public addComponent<T extends FakeComponent>(ComponentType: new () => T): T {
    const component = new ComponentType();
    component.node = this;
    this.components.push(component);
    if (component instanceof FakeGraphics) {
      const mask = this.getComponent(FakeMask);
      if (mask) mask.subComp = component;
    } else if (component instanceof FakeMask) {
      component.subComp = this.getComponent(FakeGraphics);
    }
    return component;
  }

  public getComponent<T extends FakeComponent>(ComponentType: new () => T): T | null {
    return this.components.find((component): component is T => component instanceof ComponentType) ?? null;
  }

  public addChild(child: FakeNode): void {
    child.parent = this;
    this.children.push(child);
  }

  public setPosition(x: number, y: number, z = 0): void {
    this.position = { x, y, z };
  }

  public setRotationFromEuler(_x: number, _y: number, z: number): void {
    this.rotationZ = z;
  }

  public allNodes(): readonly FakeNode[] {
    return [this, ...this.children.flatMap((child) => child.allNodes())];
  }
}

interface StoryPagesSnapshot {
  readonly phase: string;
  readonly cancelled: boolean;
  readonly render: {
    readonly currentFrame: string;
    readonly targetFrame: string;
    readonly currentOpacity: number;
    readonly targetOpacity: number;
    readonly maskActive: boolean;
    readonly revealPolygon: readonly { readonly x: number; readonly y: number }[];
    readonly inkBand: {
      readonly opacity: number;
      readonly y: number;
      readonly rotationDegrees: number;
    };
  };
}

interface StoryPagesInstance extends FakeComponent {
  configure: (
    frames: readonly [FakeSpriteFrame, FakeSpriteFrame, FakeSpriteFrame],
    reducedMotion: boolean,
  ) => void;
  replay: () => void;
  setReducedMotion: (enabled: boolean) => void;
  cancelForDoorEntry: () => boolean;
  snapshot: () => StoryPagesSnapshot;
  update: (deltaSeconds: number) => void;
}

function compileStoryPages(): new () => StoryPagesInstance {
  const sourcePath = resolve(
    import.meta.dirname,
    "../assets/scripts/cocos/outdoor-story-b-kf-r1-temp/outdoor-story-pages.ts",
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
    { filename: "outdoor-story-pages.compiled.cjs" },
  ) as (
    localRequire: (id: string) => unknown,
    module: typeof moduleRecord,
    exports: Record<string, unknown>,
  ) => void;
  evaluate(
    (id) => {
      if (id === "cc") {
        return {
          _decorator: { ccclass: () => (constructor: unknown) => constructor },
          Color: FakeColor,
          Component: FakeComponent,
          Graphics: FakeGraphics,
          Layers: { Enum: { UI_2D: 1 } },
          Mask: FakeMask,
          Node: FakeNode,
          Sprite: FakeSprite,
          SpriteFrame: FakeSpriteFrame,
          UIOpacity: FakeUIOpacity,
          UITransform: FakeUITransform,
        };
      }
      if (id.endsWith("outdoor-story-model.ts")) return storyModel;
      if (id.endsWith("outdoor-story-transition.ts")) return storyTransition;
      throw new Error(`Unexpected test import: ${id}`);
    },
    moduleRecord,
    moduleRecord.exports,
  );
  return moduleRecord.exports.OutdoorStoryPages as new () => StoryPagesInstance;
}

function mountStoryPages(reducedMotion = false): {
  readonly pages: StoryPagesInstance;
  readonly root: FakeNode;
} {
  const StoryPages = compileStoryPages();
  const root = new FakeNode("StoryRoot");
  const pages = new StoryPages();
  pages.node = root;
  pages.configure(
    [new FakeSpriteFrame("B01"), new FakeSpriteFrame("B02"), new FakeSpriteFrame("B03")],
    reducedMotion,
  );
  return { pages, root };
}

function advance(pages: StoryPagesInstance, milliseconds: number): void {
  let remaining = milliseconds;
  while (remaining > 0) {
    const step = Math.min(100, remaining);
    pages.update(step / 1_000);
    remaining -= step;
  }
}

function assertNearlyEqual(actual: number, expected: number): void {
  assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} should be nearly ${expected}`);
}

test("the B story renderer keeps exactly two persistent full-screen sprites and one graphics stencil", () => {
  const { pages, root } = mountStoryPages();
  const nodes = root.allNodes();
  assert.equal(nodes.filter((node) => node.getComponent(FakeSprite)).length, 2);
  assert.equal(nodes.filter((node) => node.getComponent(FakeMask)).length, 1);
  assert.equal(nodes.filter((node) => node.getComponent(FakeGraphics)).length, 2);

  const opening = pages.snapshot();
  assert.equal(opening.phase, "settle");
  assert.equal(opening.render.currentFrame, "B01");
  assert.equal(opening.render.currentOpacity, 1);
  assert.equal(opening.render.targetOpacity, 0);
  assert.equal(opening.render.maskActive, false);
  assert.equal(opening.render.inkBand.opacity, 0);
});

test("the ink band restores the approved soft transparent gradient instead of a solid rectangle", () => {
  const { root } = mountStoryPages();
  const inkNode = root.allNodes().find((node) => node.name === "OutdoorStoryInkBand");
  const inkGraphics = inkNode?.getComponent(FakeGraphics);
  assert.ok(inkGraphics);
  assert.ok(inkGraphics.fills.length >= 24);
  assert.ok(inkGraphics.fills[0]!.a <= 12);
  assert.ok(inkGraphics.fills.at(-1)!.a <= 12);
  assert.ok(Math.max(...inkGraphics.fills.map((fill) => fill.a)) >= 230);
  assert.ok(Math.max(...inkGraphics.fills.map((fill) => fill.a)) < 255);
});

test("the first midpoint reveals B02 bottom-up while B01 remains fully opaque", () => {
  const { pages, root } = mountStoryPages();
  advance(pages, 3_350);
  const midpoint = pages.snapshot();

  assert.equal(midpoint.phase, "to-wind");
  assert.equal(midpoint.render.currentFrame, "B01");
  assert.equal(midpoint.render.targetFrame, "B02");
  assert.equal(midpoint.render.currentOpacity, 1);
  assert.equal(midpoint.render.targetOpacity, 1);
  assert.equal(midpoint.render.maskActive, true);
  assert.equal(midpoint.render.revealPolygon.length, 4);
  assertNearlyEqual(midpoint.render.revealPolygon[0]!.x, -195);
  assertNearlyEqual(midpoint.render.revealPolygon[0]!.y, 16.88);
  assertNearlyEqual(midpoint.render.revealPolygon[1]!.x, 195);
  assertNearlyEqual(midpoint.render.revealPolygon[1]!.y, -101.28);
  assertNearlyEqual(midpoint.render.inkBand.opacity, 0.82);
  assertNearlyEqual(midpoint.render.inkBand.rotationDegrees, 4);

  const nodes = root.allNodes();
  const maskNode = nodes.find((node) => node.getComponent(FakeMask));
  assert.ok(maskNode?.active);
  const maskGraphics = maskNode?.getComponent(FakeGraphics);
  assert.deepEqual(maskGraphics?.commands.slice(0, 4), [
    ["moveTo", -195, 16.879999999999995],
    ["lineTo", 195, -101.27999999999997],
    ["lineTo", 195, -422],
    ["lineTo", -195, -422],
  ]);
});

test("the one-shot renderer settles on B03 and only an explicit replay returns to B01", () => {
  const { pages, root } = mountStoryPages();
  advance(pages, 5_360);
  assert.equal(pages.snapshot().phase, "afterwind");
  assert.equal(pages.snapshot().render.currentFrame, "B03");
  assert.equal(pages.snapshot().render.maskActive, false);

  advance(pages, 60_000);
  assert.equal(pages.snapshot().phase, "afterwind");
  assert.equal(pages.snapshot().render.currentFrame, "B03");

  pages.replay();
  assert.equal(pages.snapshot().phase, "settle");
  assert.equal(pages.snapshot().render.currentFrame, "B01");
  assert.equal(root.allNodes().filter((node) => node.getComponent(FakeSprite)).length, 2);
});

test("reduced motion fixes a neutral B01 without running stencil or ink transforms", () => {
  const { pages, root } = mountStoryPages(true);
  advance(pages, 60_000);
  const reduced = pages.snapshot();
  assert.equal(reduced.phase, "settle");
  assert.equal(reduced.render.currentFrame, "B01");
  assert.equal(reduced.render.maskActive, false);
  assert.equal(reduced.render.inkBand.opacity, 0);

  const nodes = root.allNodes();
  const maskNode = nodes.find((node) => node.getComponent(FakeMask));
  const inkNode = nodes.find((node) => node.name === "OutdoorStoryInkBand");
  assert.equal(maskNode?.active, false);
  assert.equal(inkNode?.active, false);

  pages.setReducedMotion(false);
  advance(pages, 3_200);
  assert.equal(pages.snapshot().phase, "to-wind");
});

test("door cancellation is synchronous and later frames cannot resume the story", () => {
  const { pages } = mountStoryPages();
  advance(pages, 3_350);
  assert.equal(pages.cancelForDoorEntry(), true);
  const cancelled = pages.snapshot();
  assert.equal(cancelled.phase, "cancelled");
  assert.equal(cancelled.cancelled, true);
  assert.equal(cancelled.render.maskActive, false);
  assert.equal(cancelled.render.currentOpacity, 1);

  advance(pages, 60_000);
  assert.deepEqual(pages.snapshot(), cancelled);
  assert.equal(pages.cancelForDoorEntry(), false);
});
