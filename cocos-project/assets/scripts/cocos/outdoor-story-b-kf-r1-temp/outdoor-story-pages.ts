import {
  _decorator,
  Color,
  Component,
  Graphics,
  Layers,
  Mask,
  Node,
  Sprite,
  SpriteFrame,
  UIOpacity,
  UITransform,
} from "cc";
import {
  OutdoorStoryPlaybackModel,
  type OutdoorStoryFrame,
  type OutdoorStorySnapshot,
} from "./outdoor-story-model.ts";
import {
  OUTDOOR_STORY_DESIGN_SIZE,
  outdoorStoryDoorHitArea,
  outdoorStoryTransitionGeometry,
  type OutdoorStoryDoorHitArea,
} from "./outdoor-story-transition.ts";

const { ccclass } = _decorator;
const DESIGN_WIDTH = OUTDOOR_STORY_DESIGN_SIZE.width;
const DESIGN_HEIGHT = OUTDOOR_STORY_DESIGN_SIZE.height;
const INK_BAND_WIDTH = DESIGN_WIDTH * 1.3;
const INK_BAND_HEIGHT = DESIGN_HEIGHT * 0.24;
const INK_BAND_BASE_Y = DESIGN_HEIGHT / 2 - INK_BAND_HEIGHT / 2;
const INK_BAND_GRADIENT_SLICES = 32;

interface InkBandColorStop {
  readonly position: number;
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

// Mirrors the approved browser proof's transparent indigo ink wash. The
// parent UIOpacity still supplies the animated 0 -> 0.82 -> 0 envelope.
const INK_BAND_COLOR_STOPS: readonly InkBandColorStop[] = [
  { position: 0, r: 6, g: 24, b: 47, a: 0 },
  { position: 0.04, r: 6, g: 24, b: 47, a: 0 },
  { position: 0.19, r: 6, g: 24, b: 47, a: 133 },
  { position: 0.49, r: 6, g: 24, b: 47, a: 240 },
  { position: 0.82, r: 23, g: 59, b: 87, a: 140 },
  { position: 0.96, r: 23, g: 59, b: 87, a: 0 },
  { position: 1, r: 23, g: 59, b: 87, a: 0 },
];

interface StorySpriteSlot {
  readonly node: Node;
  readonly sprite: Sprite;
  readonly opacity: UIOpacity;
}

interface StoryRenderPoint {
  readonly x: number;
  readonly y: number;
}

export interface OutdoorStoryPagesRenderSnapshot {
  readonly currentFrame: OutdoorStoryFrame;
  readonly targetFrame: OutdoorStoryFrame;
  readonly currentOpacity: number;
  readonly targetOpacity: number;
  readonly maskActive: boolean;
  readonly revealPolygon: readonly StoryRenderPoint[];
  readonly inkBand: {
    readonly opacity: number;
    readonly y: number;
    readonly rotationDegrees: number;
  };
}

export interface OutdoorStoryPagesSnapshot extends OutdoorStorySnapshot {
  readonly render: OutdoorStoryPagesRenderSnapshot;
  readonly doorHitArea: OutdoorStoryDoorHitArea;
}

export type OutdoorStoryPagesListener = (snapshot: OutdoorStoryPagesSnapshot) => void;

function frameFor(
  frames: readonly [SpriteFrame, SpriteFrame, SpriteFrame],
  frame: OutdoorStoryFrame,
): SpriteFrame {
  if (frame === "B01") return frames[0];
  if (frame === "B02") return frames[1];
  return frames[2];
}

function centeredPoint(xPercent: number, yPercent: number): StoryRenderPoint {
  return {
    x: xPercent / 100 * DESIGN_WIDTH - DESIGN_WIDTH / 2,
    y: DESIGN_HEIGHT / 2 - yPercent / 100 * DESIGN_HEIGHT,
  };
}

function interpolateInkBandColor(position: number): Color {
  const normalized = Math.max(0, Math.min(1, position));
  let left = INK_BAND_COLOR_STOPS[0]!;
  let right = INK_BAND_COLOR_STOPS.at(-1)!;
  for (let index = 1; index < INK_BAND_COLOR_STOPS.length; index += 1) {
    const candidate = INK_BAND_COLOR_STOPS[index]!;
    if (normalized <= candidate.position) {
      right = candidate;
      left = INK_BAND_COLOR_STOPS[index - 1]!;
      break;
    }
  }
  const span = right.position - left.position;
  const progress = span > 0 ? (normalized - left.position) / span : 0;
  const channel = (from: number, to: number): number =>
    Math.round(from + (to - from) * progress);
  return new Color(
    channel(left.r, right.r),
    channel(left.g, right.g),
    channel(left.b, right.b),
    channel(left.a, right.a),
  );
}

function paintInkBand(graphics: Graphics): void {
  const sliceHeight = INK_BAND_HEIGHT / INK_BAND_GRADIENT_SLICES;
  for (let index = 0; index < INK_BAND_GRADIENT_SLICES; index += 1) {
    const topProgress = index / INK_BAND_GRADIENT_SLICES;
    const sampleProgress = (index + 0.5) / INK_BAND_GRADIENT_SLICES;
    graphics.fillColor = interpolateInkBandColor(sampleProgress);
    graphics.rect(
      -INK_BAND_WIDTH / 2,
      INK_BAND_HEIGHT / 2 - (topProgress * INK_BAND_HEIGHT) - sliceHeight,
      INK_BAND_WIDTH,
      sliceHeight + 0.25,
    );
    graphics.fill();
  }
}

@ccclass("OutdoorStoryPages")
export class OutdoorStoryPages extends Component {
  private readonly playback = new OutdoorStoryPlaybackModel();
  private frames: readonly [SpriteFrame, SpriteFrame, SpriteFrame] | null = null;
  private currentSlot: StorySpriteSlot | null = null;
  private targetSlot: StorySpriteSlot | null = null;
  private maskNode: Node | null = null;
  private maskGraphics: Graphics | null = null;
  private inkNode: Node | null = null;
  private inkOpacity: UIOpacity | null = null;
  private listener: OutdoorStoryPagesListener | null = null;
  private configured = false;
  private renderSnapshot: OutdoorStoryPagesRenderSnapshot = {
    currentFrame: "B01",
    targetFrame: "B01",
    currentOpacity: 1,
    targetOpacity: 0,
    maskActive: false,
    revealPolygon: [],
    inkBand: { opacity: 0, y: INK_BAND_BASE_Y, rotationDegrees: 0 },
  };

  public configure(
    frames: readonly [SpriteFrame, SpriteFrame, SpriteFrame],
    reducedMotion: boolean,
    listener: OutdoorStoryPagesListener | null = null,
  ): void {
    this.frames = [frames[0], frames[1], frames[2]];
    this.listener = listener;
    if (!this.currentSlot) this.buildPersistentNodes();
    this.playback.setReducedMotion(reducedMotion);
    this.configured = true;
    this.applySnapshot(this.playback.snapshot());
  }

  protected update(deltaTime: number): void {
    if (!this.configured) return;
    const safeDeltaSeconds = Math.max(0, Math.min(deltaTime, 0.1));
    this.applySnapshot(this.playback.advance(safeDeltaSeconds * 1_000));
  }

  protected onDestroy(): void {
    if (this.currentSlot) this.currentSlot.sprite.spriteFrame = null;
    if (this.targetSlot) this.targetSlot.sprite.spriteFrame = null;
    this.frames = null;
    this.currentSlot = null;
    this.targetSlot = null;
    this.maskNode = null;
    this.maskGraphics = null;
    this.inkNode = null;
    this.inkOpacity = null;
    this.listener = null;
    this.configured = false;
  }

  public replay(): void {
    this.applySnapshot(this.playback.replay());
  }

  public setReducedMotion(enabled: boolean): void {
    this.applySnapshot(this.playback.setReducedMotion(enabled));
  }

  public cancelForDoorEntry(): boolean {
    const cancelled = this.playback.requestDoorEntry();
    if (cancelled) this.applySnapshot(this.playback.snapshot());
    return cancelled;
  }

  public snapshot(): OutdoorStoryPagesSnapshot {
    const story = this.playback.snapshot();
    return {
      ...story,
      render: this.renderSnapshot,
      doorHitArea: outdoorStoryDoorHitArea(story.fromFrame, story.toFrame),
    };
  }

  public getDoorHitArea(): OutdoorStoryDoorHitArea {
    return this.snapshot().doorHitArea;
  }

  private buildPersistentNodes(): void {
    const frames = this.frames;
    if (!frames) throw new Error("Outdoor story frames must be assigned before building nodes");
    this.node.layer = Layers.Enum.UI_2D;
    const rootTransform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    rootTransform.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
    rootTransform.setAnchorPoint(0.5, 0.5);

    const current = this.createStorySprite("OutdoorStoryCurrent", frames[0]);
    this.node.addChild(current.node);

    const maskNode = new Node("OutdoorStoryRevealMask");
    maskNode.layer = Layers.Enum.UI_2D;
    const maskTransform = maskNode.addComponent(UITransform);
    maskTransform.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
    maskTransform.setAnchorPoint(0.5, 0.5);
    const maskGraphics = maskNode.addComponent(Graphics);
    maskGraphics.fillColor = new Color(255, 255, 255, 0);
    const mask = maskNode.addComponent(Mask);
    mask.type = Mask.Type.GRAPHICS_STENCIL;
    const target = this.createStorySprite("OutdoorStoryTarget", frames[0]);
    maskNode.addChild(target.node);
    this.node.addChild(maskNode);

    const inkNode = new Node("OutdoorStoryInkBand");
    inkNode.layer = Layers.Enum.UI_2D;
    const inkTransform = inkNode.addComponent(UITransform);
    inkTransform.setContentSize(INK_BAND_WIDTH, INK_BAND_HEIGHT);
    inkTransform.setAnchorPoint(0.5, 0.5);
    const inkGraphics = inkNode.addComponent(Graphics);
    paintInkBand(inkGraphics);
    const inkOpacity = inkNode.addComponent(UIOpacity);
    inkOpacity.opacity = 0;
    this.node.addChild(inkNode);

    this.currentSlot = current;
    this.targetSlot = target;
    this.maskNode = maskNode;
    this.maskGraphics = maskGraphics;
    this.inkNode = inkNode;
    this.inkOpacity = inkOpacity;
    maskNode.active = false;
    inkNode.active = false;
  }

  private createStorySprite(name: string, frame: SpriteFrame): StorySpriteSlot {
    const node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    const transform = node.addComponent(UITransform);
    transform.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
    transform.setAnchorPoint(0.5, 0.5);
    const sprite = node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.trim = false;
    sprite.spriteFrame = frame;
    const opacity = node.addComponent(UIOpacity);
    opacity.opacity = 255;
    return { node, sprite, opacity };
  }

  private applySnapshot(snapshot: OutdoorStorySnapshot): void {
    const frames = this.frames;
    const current = this.currentSlot;
    const target = this.targetSlot;
    const maskNode = this.maskNode;
    const maskGraphics = this.maskGraphics;
    const inkNode = this.inkNode;
    const inkOpacity = this.inkOpacity;
    if (!frames || !current || !target || !maskNode || !maskGraphics || !inkNode || !inkOpacity) {
      return;
    }

    current.sprite.spriteFrame = frameFor(frames, snapshot.fromFrame);
    current.opacity.opacity = 255;
    target.sprite.spriteFrame = frameFor(frames, snapshot.toFrame);
    target.opacity.opacity = 255;

    if (snapshot.resting || snapshot.reducedMotion || snapshot.cancelled) {
      maskGraphics.clear();
      maskNode.active = false;
      inkOpacity.opacity = 0;
      inkNode.active = false;
      inkNode.setPosition(0, INK_BAND_BASE_Y, 0);
      inkNode.setRotationFromEuler(0, 0, 0);
      this.renderSnapshot = {
        currentFrame: snapshot.fromFrame,
        targetFrame: snapshot.fromFrame,
        currentOpacity: 1,
        targetOpacity: 0,
        maskActive: false,
        revealPolygon: [],
        inkBand: { opacity: 0, y: INK_BAND_BASE_Y, rotationDegrees: 0 },
      };
      this.listener?.(this.snapshot());
      return;
    }

    if (snapshot.phase !== "to-wind" && snapshot.phase !== "to-afterwind") {
      throw new Error(`Outdoor story non-resting phase is invalid: ${snapshot.phase}`);
    }
    const geometry = outdoorStoryTransitionGeometry(snapshot.phase, snapshot.transitionProgress);
    const revealPolygon = geometry.revealPolygon.map((point) =>
      centeredPoint(point.xPercent, point.yPercent)
    );
    maskGraphics.clear();
    const first = revealPolygon[0];
    if (!first) throw new Error("Outdoor story reveal polygon is empty");
    maskGraphics.moveTo(first.x, first.y);
    for (const point of revealPolygon.slice(1)) maskGraphics.lineTo(point.x, point.y);
    maskGraphics.close();
    maskGraphics.fill();
    maskNode.active = true;

    const inkY = INK_BAND_BASE_Y
      - geometry.inkBand.translateYPercent / 100 * INK_BAND_HEIGHT;
    const inkRotation = -geometry.inkBand.angleDegrees;
    inkNode.setPosition(0, inkY, 0);
    inkNode.setRotationFromEuler(0, 0, inkRotation);
    inkOpacity.opacity = Math.round(geometry.inkBand.opacity * 255);
    inkNode.active = geometry.inkBand.opacity > 0;
    this.renderSnapshot = {
      currentFrame: snapshot.fromFrame,
      targetFrame: snapshot.toFrame,
      currentOpacity: 1,
      targetOpacity: 1,
      maskActive: true,
      revealPolygon,
      inkBand: {
        opacity: geometry.inkBand.opacity,
        y: inkY,
        rotationDegrees: inkRotation,
      },
    };
    this.listener?.(this.snapshot());
  }
}
