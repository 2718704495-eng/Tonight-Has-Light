import {
  _decorator,
  assetManager,
  AssetManager,
  Camera,
  Color,
  Component,
  EventTouch,
  input,
  Input,
  Layers,
  Node,
  ResolutionPolicy,
  screen,
  SpriteFrame,
  sys,
  UITransform,
  UIOpacity,
  Vec3,
  view,
} from "cc";
import {
  isOutdoorStoryDoorTap,
  isOutdoorStoryDoorTapInViewport,
  type OutdoorDoorUiPoint,
} from "./outdoor-door-input.ts";
import { OutdoorGateCAudioGate } from "./outdoor-gate-c-audio-gate.ts";
import { OutdoorGateCRig } from "./outdoor-gate-c-rig.ts";
import { computeOutdoorGateCPixelAlignedViewport } from "./outdoor-gate-c-viewport.ts";
import {
  classifyOutdoorSlowSwipe,
  type OutdoorSwipeDirection,
} from "./outdoor-slow-swipe.ts";
import { loadSettledResourceBatch } from "./settled-resource-batch.ts";
import {
  OutdoorStoryPages,
  type OutdoorStoryPagesSnapshot,
} from "../outdoor-story-b-kf-r1-temp/outdoor-story-pages.ts";
import type { OutdoorStoryFrame } from "../outdoor-story-b-kf-r1-temp/outdoor-story-model.ts";
import {
  outdoorStoryDoorHitArea,
  type OutdoorStoryDoorHitArea,
  type OutdoorStoryRect,
} from "../outdoor-story-b-kf-r1-temp/outdoor-story-transition.ts";

const { ccclass } = _decorator;
const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;
export const OUTDOOR_STORY_B_KF_R1_TEMP_BUNDLE_NAME = "outdoor-story-b-kf-r1-temp";
const OUTDOOR_STORY_B_KF_R1_TEMP_RESOURCES = [
  "b01-settle/spriteFrame",
  "b02-wind-passes/spriteFrame",
  "b03-afterwind/spriteFrame",
] as const;
const OUTDOOR_STORY_FRAMES = ["B01", "B02", "B03"] as const;
const SAFETY_BAR_CLEAR_COLOR = new Color("#06265F");
const DOOR_REQUEST_DEDUPE_MS = 350;

type MountState = "loading" | "mounted" | "failed" | "destroyed";
type OutdoorGateCInteractionId = "flower-a" | "flower-b" | "sky" | "grass-swipe" | "door";

export interface OutdoorGateCSceneBridge {
  readonly onInteraction?: (interactionId: OutdoorGateCInteractionId) => void;
  readonly onEnterDoor?: () => void;
  readonly onLoadFailed?: (message: string) => void;
}

export interface OutdoorGateCSceneOptions {
  readonly reducedMotion: boolean;
  readonly soundEnabled: boolean;
  readonly musicEnabled: boolean;
  readonly audioInterrupted: boolean;
  readonly bridge?: OutdoorGateCSceneBridge;
}

interface OutdoorGateCDebugApi {
  readonly replay: () => void;
  readonly setReducedMotion: (enabled: boolean) => void;
  readonly replayStory: () => void;
  readonly pulseSky: () => void;
  readonly pulseFlower: (index: 0 | 1) => void;
  readonly snapshot: () => {
    readonly mounted: boolean;
    readonly mountState: MountState;
    readonly mountError: string | null;
    readonly reducedMotion: boolean;
    readonly audioUnlocked: boolean;
    readonly audioAssigned: boolean;
    readonly ambientAssigned: boolean;
    readonly musicAssigned: boolean;
    readonly ambientPlaying: boolean;
    readonly musicPlaying: boolean;
    readonly ambientVolume: number;
    readonly musicVolume: number;
    readonly runtimeElapsedMs: number;
    readonly elapsedMs: number;
    readonly spriteCount: number;
    readonly loadedFrameCount: number;
    readonly layerOpacities: Readonly<Record<string, number>>;
    readonly story: OutdoorStoryPagesSnapshot | null;
    readonly motion: ReturnType<OutdoorGateCRig["getMotionSnapshot"]> | null;
  };
}

type DebugGlobal = typeof globalThis & {
  __OUTDOOR_GATE_C__?: OutdoorGateCDebugApi;
};

interface OutdoorDoorTouchStart {
  readonly ui: OutdoorDoorUiPoint;
  readonly viewport: OutdoorDoorUiPoint;
  readonly area: OutdoorStoryDoorHitArea;
}

function loadAssetBundle(name: string): Promise<AssetManager.Bundle> {
  const cached = assetManager.getBundle(name);
  if (cached) return Promise.resolve(cached);
  return new Promise((resolve, reject) => {
    assetManager.loadBundle(name, (error, bundle) => {
      if (error || !bundle) reject(error ?? new Error(`Missing bundle: ${name}`));
      else resolve(bundle);
    });
  });
}

function loadBundleSpriteFrame(
  bundle: AssetManager.Bundle,
  path: string,
): Promise<SpriteFrame> {
  return new Promise((resolve, reject) => {
    bundle.load(path, SpriteFrame, (error, asset) => {
      if (error || !asset) reject(error ?? new Error(`Missing bundle asset: ${path}`));
      else resolve(asset);
    });
  });
}

function interactionNowMs(): number {
  const now = globalThis.performance?.now?.();
  return typeof now === "number" && Number.isFinite(now) ? now : Date.now();
}

@ccclass("OutdoorGateCScene")
export class OutdoorGateCScene extends Component {
  private initialReducedMotion = false;
  private outdoorRoot: Node | null = null;
  private rig: OutdoorGateCRig | null = null;
  private audioGate: OutdoorGateCAudioGate | null = null;
  private spriteCount = 0;
  private mountState: MountState = "loading";
  private mountError: string | null = null;
  private destroyed = false;
  private mountGeneration = 0;
  private loadedStoryFramePaths: string[] = [];
  private storyBundle: AssetManager.Bundle | null = null;
  private debugApi: OutdoorGateCDebugApi | null = null;
  private bridge: OutdoorGateCSceneBridge | null = null;
  private initialSoundEnabled = true;
  private initialMusicEnabled = true;
  private initialAudioInterrupted = false;
  private interactionCleanups: Array<() => void> = [];
  private persistentDoorTargets = new Map<OutdoorStoryFrame, Node>();
  private activeDoorHitArea: OutdoorStoryDoorHitArea = outdoorStoryDoorHitArea("B01");
  private lastDoorRequestAtMs = Number.NEGATIVE_INFINITY;
  private storyPages: OutdoorStoryPages | null = null;

  public initialize(options: boolean | OutdoorGateCSceneOptions): void {
    const normalized = typeof options === "boolean"
      ? {
        reducedMotion: options,
        soundEnabled: true,
        musicEnabled: true,
        audioInterrupted: false,
        bridge: undefined,
      }
      : options;
    this.initialReducedMotion = normalized.reducedMotion;
    this.initialSoundEnabled = normalized.soundEnabled;
    this.initialMusicEnabled = normalized.musicEnabled;
    this.initialAudioInterrupted = normalized.audioInterrupted;
    this.bridge = normalized.bridge ?? null;
    this.rig?.setReducedMotion(normalized.reducedMotion);
    this.storyPages?.setReducedMotion(normalized.reducedMotion);
    this.audioGate?.setChannelEnabled(normalized.soundEnabled, normalized.musicEnabled);
    if (normalized.audioInterrupted) this.audioGate?.pauseForInterruption();
    else this.audioGate?.resumeFromInterruption();
  }

  protected start(): void {
    const sceneCamera = this.node.parent?.getComponentInChildren(Camera);
    if (sceneCamera) sceneCamera.clearColor = SAFETY_BAR_CLEAR_COLOR;
    view.setDesignResolutionSize(DESIGN_WIDTH, DESIGN_HEIGHT, ResolutionPolicy.SHOW_ALL);
    this.installPersistentDoorTarget();
    this.installDoorInputFallback();
    this.installDebugApi();
    const generation = ++this.mountGeneration;
    void this.mountFromManifest(generation).catch((error: unknown) => {
      this.handleMountFailure(error, generation);
    });
  }

  protected onDestroy(): void {
    this.destroyed = true;
    this.mountState = "destroyed";
    this.mountGeneration += 1;
    const debugGlobal = globalThis as DebugGlobal;
    if (debugGlobal.__OUTDOOR_GATE_C__ === this.debugApi) {
      delete debugGlobal.__OUTDOOR_GATE_C__;
    }
    this.clearInteractionTargets();
    for (const target of this.persistentDoorTargets.values()) target.destroy();
    this.persistentDoorTargets.clear();
    this.outdoorRoot?.destroy();
    this.releaseLoadedResources();
    this.storyPages = null;
    this.debugApi = null;
    this.outdoorRoot = null;
    this.rig = null;
    this.audioGate = null;
    this.bridge = null;
  }

  public replay(): void {
    this.rig?.replay();
    this.storyPages?.replay();
  }

  public setReducedMotion(enabled: boolean): void {
    this.initialReducedMotion = enabled;
    this.rig?.setReducedMotion(enabled);
    this.storyPages?.setReducedMotion(enabled);
  }

  public setSoundEnabled(enabled: boolean): void {
    this.initialSoundEnabled = enabled;
    this.audioGate?.setChannelEnabled(enabled, this.initialMusicEnabled);
  }

  public setMusicEnabled(enabled: boolean): void {
    this.initialMusicEnabled = enabled;
    this.audioGate?.setChannelEnabled(this.initialSoundEnabled, enabled);
  }

  public pauseAudioForInterruption(): void {
    this.initialAudioInterrupted = true;
    this.audioGate?.pauseForInterruption();
  }

  public resumeAudioFromInterruption(): void {
    this.initialAudioInterrupted = false;
    this.audioGate?.resumeFromInterruption();
  }

  private async mountFromManifest(generation: number): Promise<void> {
    const storyBundle = await loadAssetBundle(OUTDOOR_STORY_B_KF_R1_TEMP_BUNDLE_NAME);
    const loadedStoryFrames = await loadSettledResourceBatch(
      OUTDOOR_STORY_B_KF_R1_TEMP_RESOURCES,
      (path) => loadBundleSpriteFrame(storyBundle, path),
      (path) => storyBundle.release(path, SpriteFrame),
    );
    if (!this.isCurrentMount(generation)) {
      for (const loaded of loadedStoryFrames) storyBundle.release(loaded.path, SpriteFrame);
      this.releaseLoadedResources();
      return;
    }
    const frames = loadedStoryFrames.map((loaded) => loaded.resource);
    const b01 = frames[0];
    const b02 = frames[1];
    const b03 = frames[2];
    if (!b01 || !b02 || !b03) throw new Error("Outdoor B/KF-R1 story frames are incomplete");
    this.storyBundle = storyBundle;
    this.loadedStoryFramePaths.push(...loadedStoryFrames.map((loaded) => loaded.path));
    this.buildPersistentScene([b01, b02, b03]);
    this.mountState = "mounted";
  }

  private isCurrentMount(generation: number): boolean {
    return !this.destroyed && generation === this.mountGeneration;
  }

  private handleMountFailure(error: unknown, generation: number): void {
    if (!this.isCurrentMount(generation)) return;
    this.mountState = "failed";
    this.mountError = error instanceof Error ? error.message : String(error);
    this.outdoorRoot?.destroy();
    this.outdoorRoot = null;
    console.error(`[OutdoorGateCScene] mount failed: ${this.mountError}`, error);
    this.bridge?.onLoadFailed?.("夜空资源暂时没有准备好");
    this.releaseLoadedResources();
  }

  private releaseLoadedResources(): void {
    const storyBundle = this.storyBundle;
    if (storyBundle) {
      for (const path of this.loadedStoryFramePaths) storyBundle.release(path, SpriteFrame);
    }
    this.loadedStoryFramePaths = [];
    this.storyBundle = null;
  }

  private buildPersistentScene(
    storyFrames: readonly [SpriteFrame, SpriteFrame, SpriteFrame],
  ): void {
    if (this.outdoorRoot) return;

    const root = new Node("OutdoorScene");
    root.layer = Layers.Enum.UI_2D;
    root.active = false;
    const rootTransform = root.addComponent(UITransform);
    rootTransform.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
    rootTransform.setAnchorPoint(0.5, 0.5);
    const presentation = computeOutdoorGateCPixelAlignedViewport(
      screen.windowSize.width,
      screen.windowSize.height,
    );
    root.setScale(presentation.rootScale.x, presentation.rootScale.y, 1);
    const sceneOpacity = root.addComponent(UIOpacity);
    sceneOpacity.opacity = 255;
    this.node.addChild(root);
    this.outdoorRoot = root;

    const rig = root.addComponent(OutdoorGateCRig);
    rig.sceneOpacity = sceneOpacity;
    // The three approved temporary story frames own the complete picture.
    // Old V7 star/flower overlays do not align across these compositions, so
    // their arrays intentionally remain empty while interaction semantics stay.
    rig.heroStarOpacities = [];
    rig.flowerOpacities = [];
    rig.reducedMotionOverride = this.initialReducedMotion;
    this.storyPages = this.buildStoryLayer(root, storyFrames);
    this.storyPages.node.setSiblingIndex(0);

    const audioGate = root.addComponent(OutdoorGateCAudioGate);
    audioGate.setChannelEnabled(this.initialSoundEnabled, this.initialMusicEnabled);
    if (this.initialAudioInterrupted) audioGate.pauseForInterruption();
    this.rig = rig;
    this.audioGate = audioGate;
    this.spriteCount = 2;
    this.installInteractionTargets(root);
    for (const target of this.persistentDoorTargets.values()) {
      target.setSiblingIndex(this.node.children.length - 1);
    }
    root.active = true;
  }

  private installInteractionTargets(root: Node): void {
    const sky = this.createInteractionTarget(root, "OutdoorSkyTouchTarget", 0, 112, 330, 450);
    this.bindTap(sky, () => {
      this.bridge?.onInteraction?.("sky");
      this.rig?.pulseSky();
    }, false);

    const grass = this.createInteractionTarget(root, "OutdoorGrassSwipeTarget", 0, -342, 390, 176);
    this.bindSlowSwipe(grass, (direction) => this.requestStoryReplay(direction));

    const flowerA = this.createInteractionTarget(root, "OutdoorFlowerATouchTarget", -123, -357, 64, 64);
    this.bindTap(flowerA, () => {
      this.bridge?.onInteraction?.("flower-a");
      this.rig?.pulseFlower(0);
    }, false);

    const flowerB = this.createInteractionTarget(root, "OutdoorFlowerBTouchTarget", 126, -304, 64, 64);
    this.bindTap(flowerB, () => {
      this.bridge?.onInteraction?.("flower-b");
      this.rig?.pulseFlower(1);
    }, false);

  }

  private requestStoryReplay(direction: OutdoorSwipeDirection): boolean {
    if (this.storyPages) {
      // Replay resets the single playback clock; it never creates another
      // page component or concurrent transition.
      this.storyPages.replay();
      this.rig?.startGestureWind(direction);
    } else if (!this.rig?.startGestureWind(direction)) {
      return false;
    }
    this.bridge?.onInteraction?.("grass-swipe");
    return true;
  }

  private installPersistentDoorTarget(): void {
    if (this.persistentDoorTargets.size > 0) return;
    const presentation = computeOutdoorGateCPixelAlignedViewport(
      screen.windowSize.width,
      screen.windowSize.height,
    );
    for (const frame of OUTDOOR_STORY_FRAMES) {
      const rect = outdoorStoryDoorHitArea(frame).rects[0];
      if (!rect) throw new Error(`Outdoor story door rect missing for ${frame}`);
      const door = this.createStoryDoorTarget(frame, rect);
      door.setScale(presentation.rootScale.x, presentation.rootScale.y, 1);
      this.bindTap(door, () => this.requestDoorEntry(), false);
      this.persistentDoorTargets.set(frame, door);
    }
    this.syncDoorTargetsFromArea(this.activeDoorHitArea);
  }

  private createStoryDoorTarget(frame: OutdoorStoryFrame, rect: OutdoorStoryRect): Node {
    return this.createInteractionTarget(
      this.node,
      `OutdoorDoorTouchTarget${frame}`,
      rect.x + rect.width / 2 - DESIGN_WIDTH / 2,
      DESIGN_HEIGHT / 2 - rect.y - rect.height / 2,
      rect.width,
      rect.height,
    );
  }

  private syncDoorTargets(snapshot: OutdoorStoryPagesSnapshot): void {
    this.activeDoorHitArea = snapshot.doorHitArea;
    this.syncDoorTargetsFromArea(snapshot.doorHitArea);
  }

  private syncDoorTargetsFromArea(area: OutdoorStoryDoorHitArea): void {
    const activeFrames = new Set<OutdoorStoryFrame>();
    for (const frame of OUTDOOR_STORY_FRAMES) {
      const frameRect = outdoorStoryDoorHitArea(frame).rects[0];
      if (frameRect && area.rects.some((rect) => (
        rect.x === frameRect.x
        && rect.y === frameRect.y
        && rect.width === frameRect.width
        && rect.height === frameRect.height
      ))) {
        activeFrames.add(frame);
      }
    }
    for (const [frame, target] of this.persistentDoorTargets) {
      target.active = activeFrames.has(frame);
    }
  }

  /**
   * Cocos node hit-testing is retained above, while this input-level path is a
   * deliberate WeChat-device fallback. The first-touch audio path already
   * proves that global minigame touch events arrive even when a transparent UI
   * node is not dispatched consistently on a device.
   */
  private installDoorInputFallback(): void {
    const startPoints = new Map<number, OutdoorDoorTouchStart>();
    const start = (event: EventTouch): void => {
      const touchId = event.getID();
      if (touchId === null) return;
      const uiLocation = event.getUILocation();
      const viewportLocation = event.getLocation();
      startPoints.set(touchId, {
        ui: { x: uiLocation.x, y: uiLocation.y },
        viewport: { x: viewportLocation.x, y: viewportLocation.y },
        area: this.storyPages?.getDoorHitArea() ?? this.activeDoorHitArea,
      });
    };
    const end = (event: EventTouch): void => {
      const touchId = event.getID();
      if (touchId === null) return;
      const startPoint = startPoints.get(touchId);
      startPoints.delete(touchId);
      if (!startPoint) return;
      const uiLocation = event.getUILocation();
      const viewportLocation = event.getLocation();
      const endPoint: OutdoorDoorTouchStart = {
        ui: { x: uiLocation.x, y: uiLocation.y },
        viewport: { x: viewportLocation.x, y: viewportLocation.y },
        area: this.storyPages?.getDoorHitArea() ?? this.activeDoorHitArea,
      };
      const viewport = { width: screen.windowSize.width, height: screen.windowSize.height };
      const shouldEnter = isOutdoorStoryDoorTap(startPoint.ui, endPoint.ui, startPoint.area)
        || isOutdoorStoryDoorTapInViewport(
          startPoint.viewport,
          endPoint.viewport,
          viewport,
          startPoint.area,
        )
        || isOutdoorStoryDoorTap(startPoint.ui, endPoint.ui, endPoint.area)
        || isOutdoorStoryDoorTapInViewport(
          startPoint.viewport,
          endPoint.viewport,
          viewport,
          endPoint.area,
        );
      if (shouldEnter) this.requestDoorEntry();
    };
    const cancel = (event: EventTouch): void => {
      const touchId = event.getID();
      if (touchId === null) startPoints.clear();
      else startPoints.delete(touchId);
    };
    input.on(Input.EventType.TOUCH_START, start, this);
    input.on(Input.EventType.TOUCH_END, end, this);
    input.on(Input.EventType.TOUCH_CANCEL, cancel, this);
    this.interactionCleanups.push(() => {
      input.off(Input.EventType.TOUCH_START, start, this);
      input.off(Input.EventType.TOUCH_END, end, this);
      input.off(Input.EventType.TOUCH_CANCEL, cancel, this);
      startPoints.clear();
    });
  }

  private requestDoorEntry(): void {
    const nowMs = interactionNowMs();
    if (nowMs - this.lastDoorRequestAtMs < DOOR_REQUEST_DEDUPE_MS) return;
    this.lastDoorRequestAtMs = nowMs;
    if (this.storyPages && !this.storyPages.cancelForDoorEntry()) return;
    this.bridge?.onInteraction?.("door");
    this.bridge?.onEnterDoor?.();
  }

  private clearInteractionTargets(): void {
    for (const cleanup of this.interactionCleanups.splice(0)) cleanup();
  }

  private createInteractionTarget(
    parent: Node,
    name: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ): Node {
    const node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    node.addComponent(UITransform).setContentSize(Math.max(width, 44), Math.max(height, 44));
    node.setPosition(x, y);
    parent.addChild(node);
    return node;
  }

  private bindTap(node: Node, onTap: () => void, stopPropagation: boolean): void {
    let pressedInside = false;
    const start = (event: EventTouch): void => {
      if (stopPropagation) event.propagationStopped = true;
      pressedInside = this.isTouchInside(node, event);
    };
    const end = (event: EventTouch): void => {
      if (stopPropagation) event.propagationStopped = true;
      const shouldTap = pressedInside && this.isTouchInside(node, event);
      pressedInside = false;
      if (shouldTap) onTap();
    };
    const cancel = (): void => {
      pressedInside = false;
    };
    node.on(Node.EventType.TOUCH_START, start, this);
    node.on(Node.EventType.TOUCH_END, end, this);
    node.on(Node.EventType.TOUCH_CANCEL, cancel, this);
    this.interactionCleanups.push(() => {
      node.off(Node.EventType.TOUCH_START, start, this);
      node.off(Node.EventType.TOUCH_END, end, this);
      node.off(Node.EventType.TOUCH_CANCEL, cancel, this);
    });
  }

  private bindSlowSwipe(
    node: Node,
    onSwipe: (direction: OutdoorSwipeDirection) => boolean,
  ): void {
    let startPosition: Vec3 | null = null;
    let previousPosition: Vec3 | null = null;
    let startedAtMs = 0;
    let previousAtMs = 0;
    let maxSegmentSpeedPxPerSecond = 0;
    let maxAbsVerticalDisplacementPx = 0;
    let lastAcceptedAtMs: number | null = null;
    let triggered = false;
    const start = (event: EventTouch): void => {
      startPosition = this.touchPosition(node, event);
      previousPosition = startPosition?.clone() ?? null;
      startedAtMs = interactionNowMs();
      previousAtMs = startedAtMs;
      maxSegmentSpeedPxPerSecond = 0;
      maxAbsVerticalDisplacementPx = 0;
      triggered = false;
    };
    const move = (event: EventTouch): void => {
      if (!startPosition || !previousPosition || triggered) return;
      const position = this.touchPosition(node, event);
      if (!position) return;
      const nowMs = interactionNowMs();
      const segmentDurationMs = nowMs - previousAtMs;
      const segmentDistance = Math.hypot(
        position.x - previousPosition.x,
        position.y - previousPosition.y,
      );
      const segmentSpeed = segmentDurationMs > 0
        ? segmentDistance / segmentDurationMs * 1_000
        : Number.POSITIVE_INFINITY;
      maxSegmentSpeedPxPerSecond = Math.max(maxSegmentSpeedPxPerSecond, segmentSpeed);
      maxAbsVerticalDisplacementPx = Math.max(
        maxAbsVerticalDisplacementPx,
        Math.abs(position.y - startPosition.y),
      );

      const result = classifyOutdoorSlowSwipe({
        deltaX: position.x - startPosition.x,
        deltaY: position.y - startPosition.y,
        maxAbsVerticalDisplacementPx,
        durationMs: nowMs - startedAtMs,
        maxSegmentSpeedPxPerSecond,
        nowMs,
        lastAcceptedAtMs,
        // Story replay resets one clock instead of stacking another sequence.
        // The gesture's own accepted/cooldown state prevents duplicate starts.
        windActive: this.storyPages
          ? false
          : ((this.rig?.isGestureWindActive() ?? false)
            || (this.rig?.isAutomaticWindActive() ?? false)),
      });
      if (result.accepted && onSwipe(result.direction)) {
        triggered = true;
        lastAcceptedAtMs = nowMs;
      }
      previousPosition = position;
      previousAtMs = nowMs;
    };
    const end = (): void => {
      startPosition = null;
      previousPosition = null;
      triggered = false;
    };
    node.on(Node.EventType.TOUCH_START, start, this);
    node.on(Node.EventType.TOUCH_MOVE, move, this);
    node.on(Node.EventType.TOUCH_END, end, this);
    node.on(Node.EventType.TOUCH_CANCEL, end, this);
    this.interactionCleanups.push(() => {
      node.off(Node.EventType.TOUCH_START, start, this);
      node.off(Node.EventType.TOUCH_MOVE, move, this);
      node.off(Node.EventType.TOUCH_END, end, this);
      node.off(Node.EventType.TOUCH_CANCEL, end, this);
    });
  }

  private touchPosition(node: Node, event: EventTouch): Vec3 | null {
    const transform = node.getComponent(UITransform);
    if (!transform) return null;
    const location = event.getUILocation();
    return transform.convertToNodeSpaceAR(new Vec3(location.x, location.y, 0));
  }

  private isTouchInside(node: Node, event: EventTouch): boolean {
    const transform = node.getComponent(UITransform);
    if (!transform) return false;
    const size = transform.contentSize;
    const local = this.touchPosition(node, event);
    return !!local && Math.abs(local.x) <= size.width / 2 && Math.abs(local.y) <= size.height / 2;
  }

  private buildStoryLayer(
    parent: Node,
    frames: readonly [SpriteFrame, SpriteFrame, SpriteFrame],
  ): OutdoorStoryPages {
    const layerRoot = new Node("OutdoorStoryBKFR1TempLayer");
    layerRoot.layer = Layers.Enum.UI_2D;
    const transform = layerRoot.addComponent(UITransform);
    transform.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
    transform.setAnchorPoint(0.5, 0.5);
    layerRoot.setPosition(0, 0, 0);
    parent.addChild(layerRoot);
    const pages = layerRoot.addComponent(OutdoorStoryPages);
    pages.configure(frames, this.initialReducedMotion, (snapshot) => {
      this.syncDoorTargets(snapshot);
    });
    return pages;
  }

  private installDebugApi(): void {
    if (!sys.isBrowser) return;
    const api: OutdoorGateCDebugApi = {
      replay: () => this.replay(),
      setReducedMotion: (enabled) => this.setReducedMotion(enabled),
      replayStory: () => this.storyPages?.replay(),
      pulseSky: () => this.rig?.pulseSky(),
      pulseFlower: (index) => this.rig?.pulseFlower(index),
      snapshot: () => ({
        mounted: this.mountState === "mounted",
        mountState: this.mountState,
        mountError: this.mountError,
        reducedMotion: this.rig?.isReducedMotionEnabled() ?? this.initialReducedMotion,
        audioUnlocked: this.audioGate?.isUnlocked() ?? false,
        audioAssigned: this.audioGate?.hasAssignedAudio() ?? false,
        ambientAssigned: this.audioGate?.getPlaybackStatus().ambientAssigned ?? false,
        musicAssigned: this.audioGate?.getPlaybackStatus().musicAssigned ?? false,
        ambientPlaying: this.audioGate?.getPlaybackStatus().ambientPlaying ?? false,
        musicPlaying: this.audioGate?.getPlaybackStatus().musicPlaying ?? false,
        ambientVolume: this.audioGate?.getPlaybackStatus().ambientVolume ?? 0,
        musicVolume: this.audioGate?.getPlaybackStatus().musicVolume ?? 0,
        runtimeElapsedMs: this.rig?.getRuntimeElapsedMs() ?? 0,
        elapsedMs: this.rig?.getElapsedMs() ?? 0,
        spriteCount: this.spriteCount,
        loadedFrameCount: this.loadedStoryFramePaths.length,
        layerOpacities: {},
        story: this.storyPages?.snapshot() ?? null,
        motion: this.rig?.getMotionSnapshot() ?? null,
      }),
    };
    this.debugApi = api;
    (globalThis as DebugGlobal).__OUTDOOR_GATE_C__ = api;
  }
}
