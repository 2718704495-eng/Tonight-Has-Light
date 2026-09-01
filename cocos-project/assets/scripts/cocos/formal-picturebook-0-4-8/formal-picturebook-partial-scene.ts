import {
  _decorator,
  assetManager,
  AssetManager,
  Camera,
  Color,
  Component,
  EventTouch,
  Graphics,
  HorizontalTextAlignment,
  Label,
  LabelOutline,
  Layers,
  Node,
  ResolutionPolicy,
  screen,
  Sprite,
  SpriteFrame,
  sys,
  UIOpacity,
  UITransform,
  Vec3,
  VerticalTextAlignment,
  view,
} from "cc";
import { OutdoorGateCAudioGate } from "../outdoor-gate-c/outdoor-gate-c-audio-gate.ts";
import {
  FORMAL_PICTUREBOOK_PARTIAL_BUNDLE_NAME,
  FORMAL_PICTUREBOOK_PARTIAL_RESOURCE_PATHS,
  formalPicturebookResourcePath,
  type FormalPicturebookPageId,
} from "./formal-picturebook-partial-assets.ts";
import {
  FORMAL_PICTUREBOOK_PARTIAL_CONTRACT_MARKERS,
  installFormalPicturebookPartialDebugApi,
  type FormalPicturebookPartialDebugActionId,
  type FormalPicturebookPartialDebugSnapshot,
  type FormalPicturebookPartialMountState,
} from "./formal-picturebook-partial-debug.ts";
import {
  FORMAL_PICTUREBOOK_BRANCH_TRANSITION_MS,
  FORMAL_PICTUREBOOK_PAGE_TRANSITION_MS,
  FORMAL_PICTUREBOOK_REDUCED_TRANSITION_MS,
  createFormalPicturebookPartialState,
  reduceFormalPicturebookPartial,
  sampleFormalPicturebookMeteor,
  type FormalPicturebookPartialAction,
  type FormalPicturebookPartialState,
  type FormalPicturebookTransition,
} from "./formal-picturebook-partial-model.ts";
import {
  FORMAL_PICTUREBOOK_DESIGN_SIZE,
  FORMAL_PICTUREBOOK_HIT_AREAS,
  FORMAL_PICTUREBOOK_SAFETY_COLOR_HEX,
  FORMAL_PICTUREBOOK_UI_COPY,
  FormalPicturebookDoublePageResidency,
  formalPicturebookCopyTone,
  formalPicturebookDelayedFade,
  formalPicturebookMeteorSegment,
  formalPicturebookTypography,
  formalPicturebookViewport,
  type FormalPicturebookRect,
} from "./formal-picturebook-partial-runtime.ts";

const { ccclass } = _decorator;

const DESIGN_WIDTH = FORMAL_PICTUREBOOK_DESIGN_SIZE.width;
const DESIGN_HEIGHT = FORMAL_PICTUREBOOK_DESIGN_SIZE.height;
const MAX_FRAME_DELTA_MS = 100;
const NEXT_HINT_DELAY_MS = 700;
const OUTDOOR_LIGHT_COPY_COLOR = new Color(229, 223, 208, 238);
const OUTDOOR_WARM_COPY_COLOR = new Color(244, 202, 125, 245);
const INDOOR_COPY_COLOR = new Color(74, 43, 25, 245);
const H4_COPY_COLOR = new Color(246, 226, 188, 255);
const OUTDOOR_OUTLINE_COLOR = new Color(9, 25, 50, 220);
const H4_OUTLINE_COLOR = new Color(38, 23, 15, 255);
const METEOR_COLOR = { r: 255, g: 244, b: 195 } as const;

/** Required build marker: 0.4.8 deliberately has no “吹吹风” branch. */
export const FORMAL_PICTUREBOOK_BREEZE_HIDDEN = true;

type FormalPicturebookInteractionId =
  | "root-stargaze"
  | "root-home"
  | "page-next"
  | "h4-eat"
  | "h4-sip"
  | "finale-home"
  | "finale-stay"
  | "home-return-root";

export interface FormalPicturebookPartialSceneBridge {
  readonly onInteraction?: (interactionId: FormalPicturebookInteractionId) => void;
  readonly onLoadFailed?: (message: string) => void;
}

export interface FormalPicturebookPartialSceneOptions {
  readonly reducedMotion: boolean;
  readonly soundEnabled: boolean;
  readonly musicEnabled: boolean;
  readonly audioInterrupted: boolean;
  readonly largeText?: boolean;
  readonly bridge?: FormalPicturebookPartialSceneBridge;
}

interface PageSlot {
  readonly node: Node;
  readonly sprite: Sprite;
  readonly opacity: UIOpacity;
}

interface OverlaySlot extends PageSlot {
  readonly resourcePath: string;
}

interface TextControl {
  readonly target: Node;
  readonly labelNode: Node;
  readonly label: Label;
  readonly opacity: UIOpacity;
  readonly baseFontSize: number;
  readonly normalPosition: { readonly x: number; readonly y: number };
}

interface TextBlock {
  readonly node: Node;
  readonly label: Label;
  readonly opacity: UIOpacity;
  readonly baseFontSize: number;
  readonly outline: LabelOutline;
}

interface PendingPageTransition {
  readonly transition: FormalPicturebookTransition;
  readonly targetPageId: FormalPicturebookPageId;
  readonly targetSlot: 0 | 1;
  elapsedMs: number;
}

interface PendingFeedbackTransition {
  readonly transition: FormalPicturebookTransition;
  readonly fromAteOpacity: number;
  readonly fromSippedOpacity: number;
  readonly toAteOpacity: number;
  readonly toSippedOpacity: number;
  elapsedMs: number;
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

function loadBundleFrame(bundle: AssetManager.Bundle, path: string): Promise<SpriteFrame> {
  return new Promise((resolve, reject) => {
    bundle.load(path, SpriteFrame, (error, frame) => {
      if (error || !frame) reject(error ?? new Error(`Missing formal picturebook asset: ${path}`));
      else resolve(frame);
    });
  });
}

function smoothStep(progress: number): number {
  const value = Math.max(0, Math.min(1, progress));
  return value * value * (3 - 2 * value);
}

function opacityByte(progress: number): number {
  return Math.max(0, Math.min(255, Math.round(progress * 255)));
}

function cocosCenter(rect: FormalPicturebookRect): { readonly x: number; readonly y: number } {
  return {
    x: rect.x + rect.width / 2 - DESIGN_WIDTH / 2,
    y: DESIGN_HEIGHT / 2 - rect.y - rect.height / 2,
  };
}

@ccclass("FormalPicturebookPartialScene")
export class FormalPicturebookPartialScene extends Component {
  private state: FormalPicturebookPartialState = createFormalPicturebookPartialState(false);
  private largeText = false;
  private initialSoundEnabled = true;
  private initialMusicEnabled = true;
  private initialAudioInterrupted = false;
  private bridge: FormalPicturebookPartialSceneBridge | null = null;
  private mountState: FormalPicturebookPartialMountState = "loading";
  private mountError: string | null = null;
  private destroyed = false;
  private mountGeneration = 0;
  private transitionGeneration = 0;
  private pageLoading = false;
  private bundle: AssetManager.Bundle | null = null;
  private sceneRoot: Node | null = null;
  private audioGate: OutdoorGateCAudioGate | null = null;
  private pageSlots: readonly [PageSlot, PageSlot] | null = null;
  private residency = new FormalPicturebookDoublePageResidency();
  private loadedPageFrames = new Map<string, SpriteFrame>();
  private renderedPageId: FormalPicturebookPageId = "root";
  private pendingPageTransition: PendingPageTransition | null = null;
  private pendingFeedbackTransition: PendingFeedbackTransition | null = null;
  private h4AteOverlay: OverlaySlot | null = null;
  private h4SippedOverlay: OverlaySlot | null = null;
  private loadedH4Frames = new Map<string, SpriteFrame>();
  private tablePaperNode: Node | null = null;
  private meteorGraphics: Graphics | null = null;
  private interactionCleanups: Array<() => void> = [];
  private debugCleanup: (() => void) | null = null;
  private rootStargazeControl: TextControl | null = null;
  private rootHomeControl: TextControl | null = null;
  private pageAdvanceTarget: Node | null = null;
  private nextHint: TextBlock | null = null;
  private h4EatControl: TextControl | null = null;
  private h4SipControl: TextControl | null = null;
  private finaleLine1: TextBlock | null = null;
  private finaleLine2: TextBlock | null = null;
  private finaleHomeControl: TextControl | null = null;
  private finaleStayControl: TextControl | null = null;
  private homeReturnRootControl: TextControl | null = null;

  public initialize(options: boolean | FormalPicturebookPartialSceneOptions): void {
    const normalized: FormalPicturebookPartialSceneOptions = typeof options === "boolean"
      ? {
        reducedMotion: options,
        soundEnabled: true,
        musicEnabled: true,
        audioInterrupted: false,
        largeText: false,
      }
      : options;
    this.state = reduceFormalPicturebookPartial(this.state, {
      type: "SET_REDUCED_MOTION",
      enabled: normalized.reducedMotion,
    }).state;
    this.largeText = normalized.largeText ?? false;
    this.initialSoundEnabled = normalized.soundEnabled;
    this.initialMusicEnabled = normalized.musicEnabled;
    this.initialAudioInterrupted = normalized.audioInterrupted;
    this.bridge = normalized.bridge ?? null;
    this.audioGate?.setChannelEnabled(normalized.soundEnabled, normalized.musicEnabled);
    if (normalized.audioInterrupted) this.audioGate?.pauseForInterruption();
    else this.audioGate?.resumeFromInterruption();
    this.renderUi();
  }

  protected start(): void {
    const camera = this.node.parent?.getComponentInChildren(Camera);
    if (camera) camera.clearColor = new Color(FORMAL_PICTUREBOOK_SAFETY_COLOR_HEX);
    view.setDesignResolutionSize(DESIGN_WIDTH, DESIGN_HEIGHT, ResolutionPolicy.SHOW_ALL);
    this.installDebugApi();
    const generation = ++this.mountGeneration;
    void this.mountInitial(generation).catch((error: unknown) => {
      this.handleMountFailure(error, generation);
    });
  }

  protected update(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;
    this.advanceRuntimeMs(Math.min(deltaSeconds * 1_000, MAX_FRAME_DELTA_MS));
  }

  protected onDestroy(): void {
    this.destroyed = true;
    this.mountState = "destroyed";
    this.mountGeneration += 1;
    this.transitionGeneration += 1;
    this.debugCleanup?.();
    this.debugCleanup = null;
    for (const cleanup of this.interactionCleanups.splice(0)) cleanup();
    this.releaseAllFrames();
    this.sceneRoot?.destroy();
    this.sceneRoot = null;
    this.audioGate = null;
    this.pageSlots = null;
    this.h4AteOverlay = null;
    this.h4SippedOverlay = null;
    this.tablePaperNode = null;
    this.meteorGraphics = null;
    this.bridge = null;
  }

  public replay(): void {
    this.requestReduction({ type: "REPLAY" }, null);
  }

  public setReducedMotion(enabled: boolean): void {
    this.state = reduceFormalPicturebookPartial(this.state, {
      type: "SET_REDUCED_MOTION",
      enabled,
    }).state;
    if (this.pendingPageTransition) {
      this.pendingPageTransition = {
        ...this.pendingPageTransition,
        transition: {
          ...this.pendingPageTransition.transition,
          durationMs: 150,
        },
        elapsedMs: Math.min(this.pendingPageTransition.elapsedMs, 150),
      };
    }
    if (this.pendingFeedbackTransition) {
      this.pendingFeedbackTransition = {
        ...this.pendingFeedbackTransition,
        transition: {
          ...this.pendingFeedbackTransition.transition,
          durationMs: 150,
        },
        elapsedMs: Math.min(this.pendingFeedbackTransition.elapsedMs, 150),
      };
    }
    this.renderUi();
  }

  public setSoundEnabled(enabled: boolean): void {
    this.initialSoundEnabled = enabled;
    this.audioGate?.setChannelEnabled(enabled, this.initialMusicEnabled);
  }

  public setMusicEnabled(enabled: boolean): void {
    this.initialMusicEnabled = enabled;
    this.audioGate?.setChannelEnabled(this.initialSoundEnabled, enabled);
  }

  public setLargeText(enabled: boolean): void {
    this.largeText = enabled;
    this.renderUi();
  }

  public pauseAudioForInterruption(): void {
    this.initialAudioInterrupted = true;
    this.audioGate?.pauseForInterruption();
  }

  public resumeAudioFromInterruption(): void {
    this.initialAudioInterrupted = false;
    this.audioGate?.resumeFromInterruption();
  }

  private async mountInitial(generation: number): Promise<void> {
    const bundle = await loadAssetBundle(FORMAL_PICTUREBOOK_PARTIAL_BUNDLE_NAME);
    const rootPath = formalPicturebookResourcePath("root");
    const rootFrame = await loadBundleFrame(bundle, rootPath);
    if (!this.isCurrentMount(generation)) {
      bundle.release(rootPath, SpriteFrame);
      return;
    }
    this.bundle = bundle;
    this.loadedPageFrames.set(rootPath, rootFrame);
    this.residency.installInitial(rootPath);
    this.buildPersistentScene(rootFrame);
    this.mountState = "mounted";
    this.renderUi();
  }

  private isCurrentMount(generation: number): boolean {
    return !this.destroyed && generation === this.mountGeneration;
  }

  private handleMountFailure(error: unknown, generation: number): void {
    if (!this.isCurrentMount(generation)) return;
    this.mountState = "failed";
    this.mountError = error instanceof Error ? error.message : String(error);
    console.error(`[FormalPicturebookPartialScene] mount failed: ${this.mountError}`, error);
    this.bridge?.onLoadFailed?.("绘本页面暂时没有准备好");
    this.releaseAllFrames();
  }

  private buildPersistentScene(rootFrame: SpriteFrame): void {
    if (this.sceneRoot) return;
    const root = new Node("FormalPicturebookPartialRoot");
    root.layer = Layers.Enum.UI_2D;
    root.active = false;
    const transform = root.addComponent(UITransform);
    transform.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
    transform.setAnchorPoint(0.5, 0.5);
    const presentation = formalPicturebookViewport(screen.windowSize.width, screen.windowSize.height);
    root.setScale(presentation.rootScale.x, presentation.rootScale.y, 1);
    this.node.addChild(root);
    this.sceneRoot = root;

    const first = this.createPageSlot(root, "FormalPageSlot0", rootFrame, 255);
    const second = this.createPageSlot(root, "FormalPageSlot1", null, 0);
    second.node.active = false;
    this.pageSlots = [first, second];

    this.h4AteOverlay = this.createOverlaySlot(
      root,
      "FormalH4AteOverlay",
      FORMAL_PICTUREBOOK_PARTIAL_RESOURCE_PATHS.h4Feedback.ate,
    );
    this.h4SippedOverlay = this.createOverlaySlot(
      root,
      "FormalH4SippedOverlay",
      FORMAL_PICTUREBOOK_PARTIAL_RESOURCE_PATHS.h4Feedback.sipped,
    );

    this.tablePaperNode = this.createH4LargeTextPaper(root);

    const meteorNode = new Node("FormalMeteor");
    meteorNode.layer = Layers.Enum.UI_2D;
    meteorNode.addComponent(UITransform).setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
    this.meteorGraphics = meteorNode.addComponent(Graphics);
    root.addChild(meteorNode);

    this.buildInteractionLayer(root);
    const audioGate = root.addComponent(OutdoorGateCAudioGate);
    audioGate.setChannelEnabled(this.initialSoundEnabled, this.initialMusicEnabled);
    if (this.initialAudioInterrupted) audioGate.pauseForInterruption();
    this.audioGate = audioGate;
    root.active = true;
  }

  private createPageSlot(
    parent: Node,
    name: string,
    frame: SpriteFrame | null,
    opacity: number,
  ): PageSlot {
    const node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    const transform = node.addComponent(UITransform);
    transform.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
    transform.setAnchorPoint(0.5, 0.5);
    const sprite = node.addComponent(Sprite);
    sprite.spriteFrame = frame;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.trim = false;
    const uiOpacity = node.addComponent(UIOpacity);
    uiOpacity.opacity = opacity;
    parent.addChild(node);
    return { node, sprite, opacity: uiOpacity };
  }

  private createOverlaySlot(parent: Node, name: string, resourcePath: string): OverlaySlot {
    const slot = this.createPageSlot(parent, name, null, 0);
    slot.node.active = false;
    return { ...slot, resourcePath };
  }

  private createH4LargeTextPaper(parent: Node): Node {
    const node = new Node("FormalH4LargeTextTablePaper");
    node.layer = Layers.Enum.UI_2D;
    node.addComponent(UITransform).setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = new Color(217, 175, 104, 209);
    graphics.strokeColor = new Color(106, 58, 32, 115);
    graphics.lineWidth = 1.1;
    graphics.moveTo(-40, -46);
    graphics.bezierCurveTo(-20, -40, 4, -42, 26, -39);
    graphics.bezierCurveTo(49, -37, 79, -39, 110, -42);
    graphics.bezierCurveTo(138, -45, 170, -43, 188, -49);
    graphics.lineTo(186, -96);
    graphics.bezierCurveTo(155, -99, 125, -95, 97, -98);
    graphics.bezierCurveTo(67, -101, 38, -97, 8, -99);
    graphics.bezierCurveTo(-14, -100, -31, -95, -45, -93);
    graphics.close();
    graphics.fill();
    graphics.stroke();
    graphics.strokeColor = new Color(251, 233, 200, 61);
    graphics.lineWidth = 0.7;
    graphics.moveTo(-29, -60);
    graphics.bezierCurveTo(16, -55, 64, -60, 177, -57);
    graphics.stroke();
    graphics.moveTo(-35, -81);
    graphics.bezierCurveTo(32, -86, 96, -78, 180, -85);
    graphics.stroke();
    node.active = false;
    parent.addChild(node);
    return node;
  }

  private buildInteractionLayer(root: Node): void {
    this.pageAdvanceTarget = this.createTarget(root, "FormalPageAdvance", FORMAL_PICTUREBOOK_HIT_AREAS.page);
    this.bindTap(this.pageAdvanceTarget, () => this.requestReduction({ type: "TAP_PAGE" }, "page-next"), false);

    this.nextHint = this.createTextBlock(root, "FormalNextHint", "轻触，继续", 13, 330, 30);
    this.nextHint.node.setPosition(0, -374);

    this.rootStargazeControl = this.createTextControl(
      root,
      "RootInvitationSky",
      FORMAL_PICTUREBOOK_HIT_AREAS.root.stargaze,
      FORMAL_PICTUREBOOK_UI_COPY.root.stargaze,
      15,
      OUTDOOR_LIGHT_COPY_COLOR,
      { x: 115, y: 215 },
      () => this.requestReduction({ type: "ENTER_STARGAZE" }, "root-stargaze"),
    );
    this.rootHomeControl = this.createTextControl(
      root,
      "RootInvitationHome",
      FORMAL_PICTUREBOOK_HIT_AREAS.root.home,
      FORMAL_PICTUREBOOK_UI_COPY.root.home,
      14,
      OUTDOOR_WARM_COPY_COLOR,
      { x: 0, y: -30 },
      () => this.requestReduction({ type: "ENTER_HOME" }, "root-home"),
    );

    this.h4EatControl = this.createTextControl(
      root,
      "FormalH4Eat",
      FORMAL_PICTUREBOOK_HIT_AREAS.h4.eat,
      FORMAL_PICTUREBOOK_UI_COPY.h4.eat,
      16,
      H4_COPY_COLOR,
      { x: 1, y: -62 },
      () => this.requestReduction({ type: "H4_EAT" }, "h4-eat"),
      "Songti SC",
      H4_OUTLINE_COLOR,
      1.6,
    );
    this.h4SipControl = this.createTextControl(
      root,
      "FormalH4Sip",
      FORMAL_PICTUREBOOK_HIT_AREAS.h4.sip,
      FORMAL_PICTUREBOOK_UI_COPY.h4.sip,
      16,
      H4_COPY_COLOR,
      { x: -1.5, y: -62 },
      () => this.requestReduction({ type: "H4_SIP" }, "h4-sip"),
      "Songti SC",
      H4_OUTLINE_COLOR,
      1.6,
    );

    this.finaleLine1 = this.createTextBlock(
      root,
      "FormalFinaleLine1",
      FORMAL_PICTUREBOOK_UI_COPY.finale.line1,
      16,
      350,
      34,
    );
    this.finaleLine1.node.setPosition(0, -267);
    this.finaleLine2 = this.createTextBlock(
      root,
      "FormalFinaleLine2",
      FORMAL_PICTUREBOOK_UI_COPY.finale.line2,
      18,
      350,
      38,
    );
    this.finaleLine2.node.setPosition(0, -304);
    this.finaleHomeControl = this.createTextControl(
      root,
      "StargazeChoiceHome",
      FORMAL_PICTUREBOOK_HIT_AREAS.finale.home,
      FORMAL_PICTUREBOOK_UI_COPY.finale.home,
      14,
      OUTDOOR_WARM_COPY_COLOR,
      { x: 0, y: 0 },
      () => this.requestReduction({ type: "FINALE_HOME" }, "finale-home"),
    );
    this.finaleStayControl = this.createTextControl(
      root,
      "StargazeChoiceStay",
      FORMAL_PICTUREBOOK_HIT_AREAS.finale.stay,
      FORMAL_PICTUREBOOK_UI_COPY.finale.stay,
      14,
      OUTDOOR_LIGHT_COPY_COLOR,
      { x: 0, y: 0 },
      () => this.requestReduction({ type: "FINALE_STAY" }, "finale-stay"),
    );

    this.homeReturnRootControl = this.createTextControl(
      root,
      "HomeReturnRoot",
      FORMAL_PICTUREBOOK_HIT_AREAS.homeH5.returnRoot,
      FORMAL_PICTUREBOOK_UI_COPY.homeH5.returnRoot,
      13,
      OUTDOOR_LIGHT_COPY_COLOR,
      { x: 0, y: 0 },
      () => this.requestReduction({ type: "RETURN_ROOT" }, "home-return-root"),
    );
  }

  private createTarget(parent: Node, name: string, rect: FormalPicturebookRect): Node {
    const center = cocosCenter(rect);
    const node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    node.addComponent(UITransform).setContentSize(Math.max(44, rect.width), Math.max(44, rect.height));
    const hitSurface = node.addComponent(Graphics);
    const width = Math.max(44, rect.width);
    const height = Math.max(44, rect.height);
    hitSurface.fillColor = new Color(255, 255, 255, 0);
    hitSurface.moveTo(-width / 2, -height / 2);
    hitSurface.lineTo(width / 2, -height / 2);
    hitSurface.lineTo(width / 2, height / 2);
    hitSurface.lineTo(-width / 2, height / 2);
    hitSurface.close();
    hitSurface.fill();
    node.setPosition(center.x, center.y);
    parent.addChild(node);
    return node;
  }

  private createTextControl(
    parent: Node,
    name: string,
    rect: FormalPicturebookRect,
    copy: string,
    baseFontSize: number,
    color: Color,
    labelPosition: { readonly x: number; readonly y: number },
    onTap: () => void,
    fontFamily = "Kaiti SC",
    outlineColor = OUTDOOR_OUTLINE_COLOR,
    outlineWidth = 1.2,
  ): TextControl {
    const target = this.createTarget(parent, `${name}Target`, rect);
    const labelNode = new Node(`${name}Label`);
    labelNode.layer = Layers.Enum.UI_2D;
    labelNode.addComponent(UITransform).setContentSize(Math.max(88, rect.width), Math.max(44, rect.height));
    labelNode.setPosition(labelPosition.x, labelPosition.y);
    const label = labelNode.addComponent(Label);
    label.string = copy;
    label.color = color;
    label.useSystemFont = true;
    label.fontFamily = fontFamily;
    label.horizontalAlign = HorizontalTextAlignment.CENTER;
    label.verticalAlign = VerticalTextAlignment.CENTER;
    label.overflow = Label.Overflow.CLAMP;
    label.enableWrapText = true;
    const outline = labelNode.addComponent(LabelOutline);
    outline.color = outlineColor;
    outline.width = outlineWidth;
    const opacity = labelNode.addComponent(UIOpacity);
    target.addChild(labelNode);
    const control: TextControl = {
      target,
      labelNode,
      label,
      opacity,
      baseFontSize,
      normalPosition: labelPosition,
    };
    this.bindTap(target, onTap, true);
    return control;
  }

  private createTextBlock(
    parent: Node,
    name: string,
    copy: string,
    baseFontSize: number,
    width: number,
    height: number,
  ): TextBlock {
    const node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    node.addComponent(UITransform).setContentSize(width, height);
    const label = node.addComponent(Label);
    label.string = copy;
    label.color = OUTDOOR_LIGHT_COPY_COLOR;
    label.useSystemFont = true;
    label.fontFamily = "Kaiti SC";
    label.horizontalAlign = HorizontalTextAlignment.CENTER;
    label.verticalAlign = VerticalTextAlignment.CENTER;
    label.overflow = Label.Overflow.CLAMP;
    label.enableWrapText = true;
    const outline = node.addComponent(LabelOutline);
    outline.color = OUTDOOR_OUTLINE_COLOR;
    outline.width = 1.2;
    const opacity = node.addComponent(UIOpacity);
    parent.addChild(node);
    return { node, label, opacity, baseFontSize, outline };
  }

  private bindTap(node: Node, onTap: () => void, stopPropagation: boolean): void {
    let pressedInside = false;
    const start = (event: EventTouch): void => {
      this.audioGate?.unlockFromUserGesture();
      if (stopPropagation) event.propagationStopped = true;
      pressedInside = this.isTouchInside(node, event);
    };
    const end = (event: EventTouch): void => {
      if (stopPropagation) event.propagationStopped = true;
      const shouldTap = pressedInside && this.isTouchInside(node, event);
      pressedInside = false;
      if (shouldTap) onTap();
    };
    const cancel = (): void => { pressedInside = false; };
    node.on(Node.EventType.TOUCH_START, start, this);
    node.on(Node.EventType.TOUCH_END, end, this);
    node.on(Node.EventType.TOUCH_CANCEL, cancel, this);
    this.interactionCleanups.push(() => {
      node.off(Node.EventType.TOUCH_START, start, this);
      node.off(Node.EventType.TOUCH_END, end, this);
      node.off(Node.EventType.TOUCH_CANCEL, cancel, this);
    });
  }

  private isTouchInside(node: Node, event: EventTouch): boolean {
    const transform = node.getComponent(UITransform);
    if (!transform) return false;
    const location = event.getUILocation();
    const local = transform.convertToNodeSpaceAR(new Vec3(location.x, location.y, 0));
    return Math.abs(local.x) <= transform.contentSize.width / 2
      && Math.abs(local.y) <= transform.contentSize.height / 2;
  }

  private requestReduction(
    action: FormalPicturebookPartialAction,
    interactionId: FormalPicturebookInteractionId | null,
  ): void {
    if (this.mountState !== "mounted" || this.pageLoading || this.pendingPageTransition) return;
    if (this.pendingFeedbackTransition) {
      if (action.type !== "TAP_PAGE") return;
      this.renderFeedbackTransition(1);
      this.pendingFeedbackTransition = null;
    }
    const reduction = reduceFormalPicturebookPartial(this.state, action);
    if (reduction.state === this.state && !reduction.transition) return;
    if (interactionId) this.bridge?.onInteraction?.(interactionId);
    if (!reduction.transition) {
      this.state = reduction.state;
      this.renderUi();
      return;
    }
    if (reduction.transition.kind === "feedback") {
      const fromAte = this.h4AteOverlay?.opacity.opacity ?? 0;
      const fromSipped = this.h4SippedOverlay?.opacity.opacity ?? 0;
      this.state = reduction.state;
      this.pendingFeedbackTransition = {
        transition: reduction.transition,
        fromAteOpacity: fromAte,
        fromSippedOpacity: fromSipped,
        toAteOpacity: this.state.h4State === "ate" || this.state.h4State === "both" ? 255 : 0,
        toSippedOpacity: this.state.h4State === "sipped" || this.state.h4State === "both" ? 255 : 0,
        elapsedMs: 0,
      };
      this.renderUi();
      return;
    }
    void this.beginPageTransition(reduction.state, reduction.transition);
  }

  private async beginPageTransition(
    targetState: FormalPicturebookPartialState,
    transition: FormalPicturebookTransition,
  ): Promise<void> {
    const bundle = this.bundle;
    const slots = this.pageSlots;
    if (!bundle || !slots) return;
    this.pageLoading = true;
    this.renderUi();
    const generation = ++this.transitionGeneration;
    const targetPath = formalPicturebookResourcePath(targetState.pageId);
    const preparation = this.residency.prepare(targetPath);
    if (preparation.releaseBeforeLoad) this.releasePagePath(preparation.releaseBeforeLoad);
    let targetFrame: SpriteFrame | null = null;
    try {
      targetFrame = await loadBundleFrame(bundle, targetPath);
      if (targetState.pageId === "home-h4") {
        await this.ensureH4OverlaysLoaded(bundle, generation);
      }
      if (!this.isCurrentTransition(generation)) {
        bundle.release(targetPath, SpriteFrame);
        return;
      }
      this.residency.markPrepared(preparation.targetSlot, targetPath);
      this.loadedPageFrames.set(targetPath, targetFrame);
      const targetSlot = slots[preparation.targetSlot];
      targetSlot.sprite.spriteFrame = targetFrame;
      targetSlot.opacity.opacity = 0;
      targetSlot.node.active = true;
      targetSlot.node.setSiblingIndex(1);
      const currentReducedMotion = this.state.reducedMotion;
      const effectiveTargetState = targetState.reducedMotion === currentReducedMotion
        ? targetState
        : { ...targetState, reducedMotion: currentReducedMotion };
      const effectiveTransition: FormalPicturebookTransition = {
        ...transition,
        durationMs: currentReducedMotion
          ? FORMAL_PICTUREBOOK_REDUCED_TRANSITION_MS
          : transition.kind === "branch"
            ? FORMAL_PICTUREBOOK_BRANCH_TRANSITION_MS
            : FORMAL_PICTUREBOOK_PAGE_TRANSITION_MS,
      };
      this.state = effectiveTargetState;
      this.pendingPageTransition = {
        transition: effectiveTransition,
        targetPageId: effectiveTargetState.pageId,
        targetSlot: preparation.targetSlot,
        elapsedMs: 0,
      };
      this.pageLoading = false;
      this.renderUi();
    } catch (error: unknown) {
      if (targetFrame) bundle.release(targetPath, SpriteFrame);
      if (!this.isCurrentTransition(generation)) return;
      this.pageLoading = false;
      const aborted = this.residency.abortPrepared();
      if (aborted) this.releasePagePath(aborted);
      this.bridge?.onLoadFailed?.("下一页暂时没有准备好");
      console.error("[FormalPicturebookPartialScene] page transition failed", error);
      this.renderUi();
    }
  }

  private isCurrentTransition(generation: number): boolean {
    return !this.destroyed && generation === this.transitionGeneration;
  }

  private async ensureH4OverlaysLoaded(
    bundle: AssetManager.Bundle,
    generation: number,
  ): Promise<void> {
    const paths = [
      FORMAL_PICTUREBOOK_PARTIAL_RESOURCE_PATHS.h4Feedback.ate,
      FORMAL_PICTUREBOOK_PARTIAL_RESOURCE_PATHS.h4Feedback.sipped,
    ] as const;
    if (!this.isCurrentTransition(generation)) return;
    const missing = paths.filter((path) => !this.loadedH4Frames.has(path));
    const loaded: Array<{ readonly path: string; readonly frame: SpriteFrame }> = [];
    try {
      for (const path of missing) {
        loaded.push({ path, frame: await loadBundleFrame(bundle, path) });
      }
    } catch (error: unknown) {
      for (const item of loaded) bundle.release(item.path, SpriteFrame);
      throw error;
    }
    if (!this.isCurrentTransition(generation)) {
      for (const item of loaded) bundle.release(item.path, SpriteFrame);
      return;
    }
    for (const item of loaded) this.loadedH4Frames.set(item.path, item.frame);
    if (this.h4AteOverlay) {
      this.h4AteOverlay.sprite.spriteFrame = this.loadedH4Frames.get(paths[0]) ?? null;
      this.h4AteOverlay.node.active = true;
    }
    if (this.h4SippedOverlay) {
      this.h4SippedOverlay.sprite.spriteFrame = this.loadedH4Frames.get(paths[1]) ?? null;
      this.h4SippedOverlay.node.active = true;
    }
  }

  private advanceRuntimeMs(milliseconds: number): void {
    let remaining = Number.isFinite(milliseconds) ? Math.max(0, milliseconds) : 0;
    if (remaining === 0 || this.mountState !== "mounted" || this.pageLoading) return;

    if (this.pendingPageTransition) {
      const pending = this.pendingPageTransition;
      const available = Math.max(0, pending.transition.durationMs - pending.elapsedMs);
      const consumed = Math.min(remaining, available);
      pending.elapsedMs += consumed;
      remaining -= consumed;
      const progress = pending.transition.durationMs <= 0
        ? 1
        : smoothStep(pending.elapsedMs / pending.transition.durationMs);
      this.renderPageTransition(progress);
      if (pending.elapsedMs >= pending.transition.durationMs) this.commitPageTransition();
      else return;
    }

    if (this.pendingFeedbackTransition) {
      const pending = this.pendingFeedbackTransition;
      const available = Math.max(0, pending.transition.durationMs - pending.elapsedMs);
      const consumed = Math.min(remaining, available);
      pending.elapsedMs += consumed;
      remaining -= consumed;
      const progress = pending.transition.durationMs <= 0
        ? 1
        : smoothStep(pending.elapsedMs / pending.transition.durationMs);
      this.renderFeedbackTransition(progress);
      if (pending.elapsedMs >= pending.transition.durationMs) this.pendingFeedbackTransition = null;
      else return;
    }

    if (remaining > 0) {
      this.state = reduceFormalPicturebookPartial(this.state, {
        type: "ADVANCE_TIME",
        deltaMs: remaining,
      }).state;
    }
    this.renderUi();
  }

  private renderPageTransition(progress: number): void {
    const slots = this.pageSlots;
    const pending = this.pendingPageTransition;
    if (!slots || !pending) return;
    const outgoingSlot = pending.targetSlot === 0 ? 1 : 0;
    slots[pending.targetSlot].opacity.opacity = opacityByte(progress);
    const outgoingOpacity = opacityByte(1 - progress);
    slots[outgoingSlot].opacity.opacity = outgoingOpacity;
    if (this.renderedPageId === "home-h4" && pending.targetPageId !== "home-h4") {
      if (this.h4AteOverlay) {
        this.h4AteOverlay.opacity.opacity = this.state.h4State === "ate" || this.state.h4State === "both"
          ? outgoingOpacity
          : 0;
      }
      if (this.h4SippedOverlay) {
        this.h4SippedOverlay.opacity.opacity = this.state.h4State === "sipped" || this.state.h4State === "both"
          ? outgoingOpacity
          : 0;
      }
    }
  }

  private commitPageTransition(): void {
    const pending = this.pendingPageTransition;
    const slots = this.pageSlots;
    if (!pending || !slots) return;
    const result = this.residency.commit();
    const outgoingSlot = result.activeSlot === 0 ? 1 : 0;
    slots[result.activeSlot].opacity.opacity = 255;
    slots[result.activeSlot].node.active = true;
    slots[outgoingSlot].opacity.opacity = 0;
    slots[outgoingSlot].sprite.spriteFrame = null;
    slots[outgoingSlot].node.active = false;
    if (result.releaseAfterCommit) this.releasePagePath(result.releaseAfterCommit);
    const previousRenderedPage = this.renderedPageId;
    this.renderedPageId = pending.targetPageId;
    this.pendingPageTransition = null;
    if (previousRenderedPage === "home-h4" && this.renderedPageId !== "home-h4") {
      this.releaseH4Overlays();
    }
    this.renderUi();
  }

  private renderFeedbackTransition(progress: number): void {
    const pending = this.pendingFeedbackTransition;
    if (!pending) return;
    if (this.h4AteOverlay) {
      this.h4AteOverlay.opacity.opacity = Math.round(
        pending.fromAteOpacity + (pending.toAteOpacity - pending.fromAteOpacity) * progress,
      );
    }
    if (this.h4SippedOverlay) {
      this.h4SippedOverlay.opacity.opacity = Math.round(
        pending.fromSippedOpacity + (pending.toSippedOpacity - pending.fromSippedOpacity) * progress,
      );
    }
  }

  private renderUi(): void {
    const hiddenForTransition = this.mountState !== "mounted"
      || this.pageLoading
      || this.pendingPageTransition !== null;
    const typography = formalPicturebookTypography(this.largeText);
    const controls = [
      this.rootStargazeControl,
      this.rootHomeControl,
      this.h4EatControl,
      this.h4SipControl,
      this.finaleHomeControl,
      this.finaleStayControl,
      this.homeReturnRootControl,
    ].filter((control): control is TextControl => control !== null);
    for (const control of controls) {
      control.label.fontSize = Math.round(control.baseFontSize * typography.scale);
      control.label.lineHeight = Math.round(control.baseFontSize * 1.45 * typography.scale);
      control.label.overflow = Label.Overflow.CLAMP;
      control.label.enableWrapText = true;
      control.labelNode.setPosition(control.normalPosition.x, control.normalPosition.y);
    }
    for (const block of [this.nextHint, this.finaleLine1, this.finaleLine2]) {
      if (!block) continue;
      block.label.fontSize = Math.round(block.baseFontSize * typography.scale);
      block.label.lineHeight = Math.round(block.baseFontSize * 1.5 * typography.scale);
      block.label.overflow = Label.Overflow.CLAMP;
      block.label.enableWrapText = true;
    }

    const rootInteractive = !hiddenForTransition && this.state.pageId === "root";
    const rootReady = rootInteractive && this.state.rootInvitationsVisible;
    const rootFade = formalPicturebookDelayedFade(this.state.elapsedMs, 1_500);
    for (const control of [this.rootStargazeControl, this.rootHomeControl]) {
      if (!control) continue;
      control.target.active = rootInteractive;
      control.opacity.opacity = rootReady ? opacityByte(rootFade * 0.86) : 0;
    }

    const h4Ready = !hiddenForTransition
      && this.state.pageId === "home-h4"
      && this.state.h4ActionsVisible;
    const h4Fade = formalPicturebookDelayedFade(this.state.elapsedMs, 300);
    this.setControlActive(this.h4EatControl, h4Ready, h4Ready ? opacityByte(h4Fade * 0.96) : 0);
    this.setControlActive(this.h4SipControl, h4Ready, h4Ready ? opacityByte(h4Fade * 0.96) : 0);
    if (this.tablePaperNode) this.tablePaperNode.active = h4Ready && typography.h4Surface === "table-paper";

    const finaleSample = this.state.pageId === "stargaze-f5"
      ? sampleFormalPicturebookMeteor(this.state.finaleElapsedMs, this.state.reducedMotion)
      : null;
    for (const line of [this.finaleLine1, this.finaleLine2]) {
      if (!line) continue;
      line.node.active = !hiddenForTransition && finaleSample !== null;
      line.opacity.opacity = finaleSample ? opacityByte(finaleSample.copyOpacity) : 0;
    }
    const finaleReady = !hiddenForTransition && (finaleSample?.choicesVisible ?? false);
    this.setControlActive(this.finaleHomeControl, finaleReady, finaleReady ? 240 : 0);
    this.setControlActive(this.finaleStayControl, finaleReady, finaleReady ? 240 : 0);

    const homeReturnReady = !hiddenForTransition && this.state.pageId === "home-h5";
    this.setControlActive(this.homeReturnRootControl, homeReturnReady, homeReturnReady ? 220 : 0);

    if (this.pageAdvanceTarget) {
      const pageAllowsAdvance = this.state.availableActions.includes("next");
      this.pageAdvanceTarget.active = !hiddenForTransition && pageAllowsAdvance;
    }
    if (this.nextHint) {
      const showNext = !hiddenForTransition
        && this.state.availableActions.includes("next")
        && this.state.pageId !== "home-h4"
        && this.state.elapsedMs >= NEXT_HINT_DELAY_MS;
      this.nextHint.node.active = showNext;
      this.nextHint.opacity.opacity = showNext ? 176 : 0;
      this.nextHint.label.color = formalPicturebookCopyTone(this.state.pageId) === "indoor-dark"
        ? INDOOR_COPY_COLOR
        : OUTDOOR_LIGHT_COPY_COLOR;
      this.nextHint.outline.width = formalPicturebookCopyTone(this.state.pageId) === "indoor-dark"
        ? 0
        : 1.2;
    }
    this.renderMeteor(finaleSample);
  }

  private setControlActive(control: TextControl | null, active: boolean, opacity: number): void {
    if (!control) return;
    control.target.active = active;
    control.opacity.opacity = opacity;
  }

  private renderMeteor(sample: ReturnType<typeof sampleFormalPicturebookMeteor> | null): void {
    const graphics = this.meteorGraphics;
    if (!graphics) return;
    graphics.clear();
    if (!sample || this.state.pageId !== "stargaze-f5") return;
    const segment = formalPicturebookMeteorSegment(sample);
    if (!segment) return;
    graphics.strokeColor = new Color(
      METEOR_COLOR.r,
      METEOR_COLOR.g,
      METEOR_COLOR.b,
      opacityByte(segment.opacity),
    );
    graphics.lineWidth = this.state.reducedMotion ? 1.4 : 1.8;
    graphics.moveTo(segment.tail.x, segment.tail.y);
    graphics.lineTo(segment.head.x, segment.head.y);
    graphics.stroke();
  }

  private releasePagePath(path: string): void {
    if (!this.loadedPageFrames.has(path)) return;
    this.bundle?.release(path, SpriteFrame);
    this.loadedPageFrames.delete(path);
  }

  private releaseH4Overlays(): void {
    for (const path of this.loadedH4Frames.keys()) this.bundle?.release(path, SpriteFrame);
    this.loadedH4Frames.clear();
    if (this.h4AteOverlay) {
      this.h4AteOverlay.sprite.spriteFrame = null;
      this.h4AteOverlay.opacity.opacity = 0;
      this.h4AteOverlay.node.active = false;
    }
    if (this.h4SippedOverlay) {
      this.h4SippedOverlay.sprite.spriteFrame = null;
      this.h4SippedOverlay.opacity.opacity = 0;
      this.h4SippedOverlay.node.active = false;
    }
  }

  private releaseAllFrames(): void {
    for (const path of this.loadedPageFrames.keys()) this.bundle?.release(path, SpriteFrame);
    this.loadedPageFrames.clear();
    this.releaseH4Overlays();
    this.residency.reset();
    this.bundle = null;
  }

  private installDebugApi(): void {
    this.debugCleanup = installFormalPicturebookPartialDebugApi(sys.isBrowser, {
      snapshot: () => this.getDebugSnapshot(),
      tapAction: (actionId) => this.tapDebugAction(actionId),
      setReducedMotion: (enabled) => this.setReducedMotion(enabled),
      setLargeText: (enabled) => this.setLargeText(enabled),
      advanceTime: (milliseconds) => this.advanceRuntimeMs(milliseconds),
    });
  }

  private tapDebugAction(actionId: FormalPicturebookPartialDebugActionId): void {
    const actions: Record<FormalPicturebookPartialDebugActionId, readonly [FormalPicturebookPartialAction, FormalPicturebookInteractionId]> = {
      stargaze: [{ type: "ENTER_STARGAZE" }, "root-stargaze"],
      home: [{ type: "ENTER_HOME" }, "root-home"],
      next: [{ type: "TAP_PAGE" }, "page-next"],
      "h4-eat": [{ type: "H4_EAT" }, "h4-eat"],
      "h4-sip": [{ type: "H4_SIP" }, "h4-sip"],
      "finale-home": [{ type: "FINALE_HOME" }, "finale-home"],
      "finale-stay": [{ type: "FINALE_STAY" }, "finale-stay"],
      "return-root": [{ type: "RETURN_ROOT" }, "home-return-root"],
    };
    const [action, interaction] = actions[actionId];
    this.requestReduction(action, interaction);
  }

  private getDebugSnapshot(): FormalPicturebookPartialDebugSnapshot {
    const audio = this.audioGate?.getPlaybackStatus() ?? {
      ambientPlaying: false,
      musicPlaying: false,
      ambientAssigned: false,
      musicAssigned: false,
      ambientVolume: 0,
      musicVolume: 0,
    };
    const transition = this.pendingPageTransition
      ? {
        kind: this.pendingPageTransition.transition.kind,
        durationMs: this.pendingPageTransition.transition.durationMs,
        elapsedMs: this.pendingPageTransition.elapsedMs,
        targetPageId: this.pendingPageTransition.targetPageId,
      }
      : null;
    const meteor = this.state.pageId === "stargaze-f5"
      ? sampleFormalPicturebookMeteor(this.state.finaleElapsedMs, this.state.reducedMotion)
      : null;
    return {
      mounted: this.mountState === "mounted",
      mountState: this.mountState,
      pageId: this.state.pageId,
      branch: this.state.branch,
      transition,
      meteor,
      h4: this.state.h4State,
      reducedMotion: this.state.reducedMotion,
      largeText: this.largeText,
      audio,
      livePagePaths: this.residency.snapshot().slotPaths.filter((path): path is string => path !== null),
      contractMarkers: FORMAL_PICTUREBOOK_PARTIAL_CONTRACT_MARKERS,
    };
  }
}
