import {
  _decorator,
  assetManager,
  Asset,
  AssetManager,
  AudioClip,
  AudioSource,
  Color,
  Component,
  Constructor,
  EventTouch,
  GraphicsComponent as Graphics,
  HorizontalTextAlignment,
  Label,
  Layers,
  Node,
  Sprite,
  SpriteFrame,
  sys,
  tween,
  Tween,
  UIOpacity,
  UITransform,
  Vec2,
  Vec3,
  VerticalTextAlignment,
} from "cc";
import type { TonightHasLightV0Bridge } from "./tonight-has-light-v0-view.ts";
import {
  deriveIndoorN01ActionAvailability,
  planIndoorN01Action,
  type IndoorN01ActionAvailability,
  type IndoorN01SemanticAction,
} from "../core/indoor-n01-actions.ts";
import {
  TonightHasLightFormalEndingUi,
  type FormalEndingUiDebugSnapshot,
} from "./tonight-has-light-formal-ending-ui.ts";
import {
  TonightHasLightFormalSessionControls,
  type FormalSessionControlsDebugSnapshot,
} from "./tonight-has-light-formal-session-controls.ts";
import type { FormalSessionControlsAction } from "../core/formal-session-controls.ts";
import type { DurationMinutes } from "../domain/contracts.ts";

const { ccclass } = _decorator;

const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;
const BUNDLE_NAME = "indoor-n01-preview";
const BACKPLATE_PATH = "formal-ui-v1-2-a-preview/spriteFrame";
const KETTLE_SOUND_PATH = "kettle-lid-answer-test-only";
const LID_OVERLAY_PATH = "kettle-lid-overlay/spriteFrame";
const CAT_OVERLAY_PATH = "cat-head-overlay/spriteFrame";
const CUP_OVERLAY_PATH = "spare-cup-overlay/spriteFrame";
export const INDOOR_N01_BUNDLE_LOAD_TIMEOUT_MS = 12_000;
const RESPONSE_SECONDS = 0.62;
const CAT_REVEAL_SECONDS = 1.18;
const AUTO_RIGHT_CUP_SECONDS = 4;
const SETTLE_SECONDS = 1.18;
const EQUIVALENT_FADE_SECONDS = 0.18;

type PreviewBeat = "waiting" | "kettle" | "cat" | "righting" | "settled";
type Cleanup = () => void;

interface DebugSnapshot {
  readonly candidateId: "gate-d-story-b-kf-r1-temp-dev-r1-0.4.7";
  readonly bundleName: typeof BUNDLE_NAME;
  readonly beat: PreviewBeat;
  readonly assetsLoaded: boolean;
  readonly reducedMotion: boolean;
  readonly kettleTargetSize: readonly [125, 127];
  readonly cupTargetSize: readonly [80, 88];
  readonly formalEndingUi: FormalEndingUiDebugSnapshot | null;
  readonly formalSessionControls: FormalSessionControlsDebugSnapshot | null;
  readonly actions: IndoorN01ActionAvailability;
}

interface IndoorPreviewDebugApi {
  readonly tapKettle: () => void;
  readonly tapCup: () => void;
  readonly setLargeText: (enabled: boolean) => void;
  readonly performAction: (action: IndoorN01SemanticAction) => boolean;
  readonly performSessionControlAction: (
    action: FormalSessionControlsAction,
    duration?: DurationMinutes,
  ) => boolean;
  readonly snapshot: () => DebugSnapshot;
}

type PreviewDebugGlobal = typeof globalThis & {
  __INDOOR_N01_PHONE_PREVIEW__?: IndoorPreviewDebugApi;
};

let indoorBundleLoadInFlight: Promise<AssetManager.Bundle> | null = null;

function loadBundle(name: string): Promise<AssetManager.Bundle> {
  const cached = assetManager.getBundle(name);
  if (cached) return Promise.resolve(cached);
  if (indoorBundleLoadInFlight) return indoorBundleLoadInFlight;

  let settled = false;
  const request = new Promise<AssetManager.Bundle>((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error("房间加载得有点慢，请再试一次"));
    }, INDOOR_N01_BUNDLE_LOAD_TIMEOUT_MS);
    try {
      assetManager.loadBundle(name, (error, bundle) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (error || !bundle) reject(error ?? new Error(`Missing bundle: ${name}`));
        else resolve(bundle);
      });
    } catch (error) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(error);
    }
  });
  let tracked: Promise<AssetManager.Bundle>;
  tracked = request.then(
    (bundle) => {
      if (indoorBundleLoadInFlight === tracked) indoorBundleLoadInFlight = null;
      return bundle;
    },
    (error: unknown) => {
      if (indoorBundleLoadInFlight === tracked) indoorBundleLoadInFlight = null;
      throw error;
    },
  );
  indoorBundleLoadInFlight = tracked;
  return tracked;
}

export function preloadIndoorN01PreviewBundle(): Promise<void> {
  return loadBundle(BUNDLE_NAME).then(() => undefined);
}

function loadBundleAsset<T extends Asset>(
  bundle: AssetManager.Bundle,
  path: string,
  type: Constructor<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    bundle.load(path, type, (error, asset) => {
      if (error || !asset) reject(error ?? new Error(`Missing asset: ${path}`));
      else resolve(asset);
    });
  });
}

function canvasX(x: number): number {
  return x - DESIGN_WIDTH / 2;
}

function canvasY(y: number): number {
  return DESIGN_HEIGHT / 2 - y;
}

/**
 * Disposable phone-preview presentation for the approved INDOOR-N01 sample.
 *
 * The backplate and synthesized sound in its Asset Bundle are explicitly
 * prototype-only. They must never be promoted to review or production assets.
 * The component keeps the prototype beats on the approved backplate. The
 * approved FORMAL-ENDING-UI-V1-A surface is a separate persistent Sprite/Label
 * component, so this disposable room never turns its Graphics beat into UI.
 */
@ccclass("TonightHasLightIndoorN01Preview")
export class TonightHasLightIndoorN01Preview extends Component {
  private bridge: TonightHasLightV0Bridge | null = null;
  private bundle: AssetManager.Bundle | null = null;
  private backplate: SpriteFrame | null = null;
  private kettleClip: AudioClip | null = null;
  private audioSource: AudioSource | null = null;
  private root: Node | null = null;
  private storyLabel: Label | null = null;
  private storyOpacity: UIOpacity | null = null;
  private idleSteamOpacity: UIOpacity | null = null;
  private responseSteamOpacity: UIOpacity | null = null;
  private lidOverlay: Node | null = null;
  private catOverlay: Node | null = null;
  private catOverlayOpacity: UIOpacity | null = null;
  private cupDown: Node | null = null;
  private cupDownOpacity: UIOpacity | null = null;
  private cupUp: Node | null = null;
  private cupUpOpacity: UIOpacity | null = null;
  private formalEndingUi: TonightHasLightFormalEndingUi | null = null;
  private formalSessionControls: TonightHasLightFormalSessionControls | null = null;
  private formalEndingWasVisible = false;
  private roomInteractionStarted = false;
  private cleanups: Cleanup[] = [];
  private beat: PreviewBeat = "waiting";
  private destroyed = false;
  private assetsLoaded = false;
  private sequenceGeneration = 0;
  private lastReplayAtMs = Number.NEGATIVE_INFINITY;
  private debugApi: IndoorPreviewDebugApi | null = null;

  public async initialize(bridge: TonightHasLightV0Bridge): Promise<void> {
    this.bridge = bridge;

    const bundle = await loadBundle(BUNDLE_NAME);
    this.bundle = bundle;
    const [backplate, kettleClip, lidFrame, catFrame, cupFrame] = await Promise.all([
      loadBundleAsset(bundle, BACKPLATE_PATH, SpriteFrame),
      loadBundleAsset(bundle, KETTLE_SOUND_PATH, AudioClip),
      loadBundleAsset(bundle, LID_OVERLAY_PATH, SpriteFrame),
      loadBundleAsset(bundle, CAT_OVERLAY_PATH, SpriteFrame),
      loadBundleAsset(bundle, CUP_OVERLAY_PATH, SpriteFrame),
    ]);
    if (this.destroyed || !this.isValid) {
      bundle.releaseAll();
      assetManager.removeBundle(bundle);
      throw new Error("Indoor preview was cancelled while loading");
    }

    this.backplate = backplate;
    this.kettleClip = kettleClip;
    this.buildPersistentRoom(backplate, lidFrame, catFrame, cupFrame);
    const roomRoot = this.root;
    if (!roomRoot) throw new Error("Indoor room root was not created");
    const formalEndingUi = roomRoot.addComponent(TonightHasLightFormalEndingUi);
    this.formalEndingUi = formalEndingUi;
    await formalEndingUi.initialize({
      getSession: () => {
        if (!this.bridge) throw new Error("Indoor bridge is unavailable");
        return this.bridge.getSession();
      },
      getAppFlow: () => {
        if (!this.bridge) throw new Error("Indoor bridge is unavailable");
        return this.bridge.getAppFlow();
      },
      getSettings: () => {
        if (!this.bridge) throw new Error("Indoor bridge is unavailable");
        return this.bridge.getSettings();
      },
      performAction: (action) => this.performAction(action),
    });
    const formalSessionControls = roomRoot.addComponent(TonightHasLightFormalSessionControls);
    this.formalSessionControls = formalSessionControls;
    await formalSessionControls.initialize({
      getSession: () => {
        if (!this.bridge) throw new Error("Indoor bridge is unavailable");
        return this.bridge.getSession();
      },
      getAppFlow: () => {
        if (!this.bridge) throw new Error("Indoor bridge is unavailable");
        return this.bridge.getAppFlow();
      },
      getSettings: () => {
        if (!this.bridge) throw new Error("Indoor bridge is unavailable");
        return this.bridge.getSettings();
      },
      send: (command) => {
        this.bridge?.send(command);
        this.refresh();
      },
      sendAppFlow: (command) => {
        this.bridge?.sendAppFlow(command);
        this.refresh();
      },
      updateSettings: (settings) => {
        if (!this.bridge) throw new Error("Indoor bridge is unavailable");
        const updated = this.bridge.updateSettings(settings);
        this.refresh();
        return updated;
      },
      openEndingNote: () => this.performAction("request-ending"),
      returnToOutdoor: () => this.bridge?.returnToOutdoor(),
    });
    this.assetsLoaded = true;
    this.installDebugApi();
  }

  public show(): void {
    // Showing the warm room does not start the stay clock. The approved paper
    // first lets the user explicitly confirm 3/5/8 minutes; SELECT_DURATION is
    // the sole transition that starts activeSinceMs.
    this.normalizeInterruptedInteraction();
    if (this.root) this.root.active = true;
    this.formalSessionControls?.activate();
    this.refresh();
  }

  public refresh(): void {
    const bridge = this.bridge;
    if (!bridge) return;
    const session = bridge.getSession();
    this.formalSessionControls?.refresh();
    this.startRoomInteractionIfReady();
    if (session.phase === "paused" || session.phase === "loading-error") {
      this.audioSource?.stop();
      this.syncFormalEndingUi();
      return;
    }
    if (["quiet-stay", "ending", "finished"].includes(session.phase) && this.beat !== "settled") {
      this.enterSettledState(false);
    }
    const actions = deriveIndoorN01ActionAvailability(
      session,
      bridge.getAppFlow(),
    );
    if (session.endingPromptAvailable && actions.canRequestEnding) {
      this.performAction("request-ending");
      return;
    }
    this.syncFormalEndingUi();
  }

  /**
   * Semantic action surface for the approved FORMAL-ENDING-UI-V1-A note.
   * Visual state stays in the persistent warm-room root; only the note copy
   * and target labels change as the app flow moves through ending and share.
   */
  public performAction(action: IndoorN01SemanticAction): boolean {
    const bridge = this.bridge;
    if (!bridge) return false;
    const plan = planIndoorN01Action(action, bridge.getSession(), bridge.getAppFlow());
    if (!plan) return false;

    for (const command of plan.nightCommands) bridge.send(command);
    for (const command of plan.appFlowCommands) bridge.sendAppFlow(command);

    if (plan.runtimeEffect === "request-wechat-share") {
      const requested = bridge.requestWechatShare();
      this.refresh();
      return requested;
    }
    if (plan.runtimeEffect === "return-to-outdoor") {
      bridge.returnToOutdoor();
      return true;
    }
    this.refresh();
    return true;
  }

  protected onDestroy(): void {
    this.destroyed = true;
    this.sequenceGeneration += 1;
    this.unscheduleAllCallbacks();
    this.stopPresentationTweens();
    for (const cleanup of this.cleanups.splice(0)) cleanup();
    this.audioSource?.stop();
    if (this.audioSource) this.audioSource.clip = null;
    this.root?.destroy();
    const debugGlobal = globalThis as PreviewDebugGlobal;
    if (debugGlobal.__INDOOR_N01_PHONE_PREVIEW__ === this.debugApi) {
      delete debugGlobal.__INDOOR_N01_PHONE_PREVIEW__;
    }
    this.debugApi = null;
    this.root = null;
    this.backplate = null;
    this.kettleClip = null;
    this.audioSource = null;
    this.formalEndingUi = null;
    this.formalSessionControls = null;
    this.formalEndingWasVisible = false;
    this.roomInteractionStarted = false;
    this.bridge = null;
    if (this.bundle) {
      this.bundle.releaseAll();
      assetManager.removeBundle(this.bundle);
      this.bundle = null;
    }
  }

  private normalizeInterruptedInteraction(): void {
    const bridge = this.bridge;
    if (!bridge) return;
    const phase = bridge.getSession().phase;
    if (phase === "core-dragging") {
      bridge.send({ type: "DROP_CORE", targetHit: false });
    }
  }

  private startRoomInteractionIfReady(): void {
    if (this.roomInteractionStarted || !this.bridge) return;
    const session = this.bridge.getSession();
    const appFlow = this.bridge.getAppFlow();
    const activeRoomPhase = ["exploring", "core-dragging", "micro-scene", "quiet-stay"]
      .includes(session.phase);
    if (
      appFlow.phase !== "night-session"
      || appFlow.overlay !== "none"
      || !activeRoomPhase
      || session.durationMinutes === null
    ) return;
    this.roomInteractionStarted = true;
    if (this.beat === "waiting") this.scheduleOnce(this.revealIdleWhisper, 10);
  }

  private buildPersistentRoom(
    frame: SpriteFrame,
    lidFrame: SpriteFrame,
    catFrame: SpriteFrame,
    cupFrame: SpriteFrame,
  ): void {
    const root = new Node("IndoorN01PhonePreview");
    root.layer = Layers.Enum.UI_2D;
    root.active = false;
    const rootTransform = root.addComponent(UITransform);
    rootTransform.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
    rootTransform.setAnchorPoint(0.5, 0.5);
    this.node.addChild(root);
    this.root = root;

    const background = this.makeSprite("ApprovedWarmRoomBackplate", frame, root, 0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    background.setSiblingIndex(0);

    const audioNode = new Node("KettleLidAnswerTestOnlyAudio");
    root.addChild(audioNode);
    const audioSource = audioNode.addComponent(AudioSource);
    audioSource.playOnAwake = false;
    audioSource.loop = false;
    audioSource.volume = 0.9;
    audioSource.clip = this.kettleClip;
    this.audioSource = audioSource;

    this.buildSteam(root);
    this.lidOverlay = this.makeCropSprite(
      "KettleLidOverlay",
      lidFrame,
      root,
      211,
      498,
      52,
      31,
    );
    this.catOverlay = this.makeCropSprite(
      "CatHeadOverlay",
      catFrame,
      root,
      198,
      584,
      50,
      72,
    );
    this.catOverlayOpacity = this.catOverlay.addComponent(UIOpacity);
    this.catOverlayOpacity.opacity = 0;

    this.buildCupState(root, cupFrame);
    this.buildStoryLabel(root);

    const kettleTarget = this.makeTarget("KettleHotspot", root, 250.5, 514.5, 125, 127);
    this.bindTap(kettleTarget, () => this.handleKettleTap());
    const cupTarget = this.makeTarget("CupHotspot", root, 198, 564, 80, 88);
    this.bindTap(cupTarget, () => this.handleCupTap());

    this.restoreVisibleBeatFromSession();
  }

  private restoreVisibleBeatFromSession(): void {
    const phase = this.bridge?.getSession().phase;
    if (!phase) return;
    if (["quiet-stay", "ending", "finished"].includes(phase)) {
      this.enterSettledState(false);
    } else if (phase === "micro-scene") {
      this.beat = "cat";
      this.showCatBeat(false);
      const generation = ++this.sequenceGeneration;
      this.scheduleOnce(() => {
        if (generation === this.sequenceGeneration) this.rightCup();
      }, AUTO_RIGHT_CUP_SECONDS);
    }
  }

  private buildSteam(parent: Node): void {
    const idle = new Node("IdleSteam");
    idle.layer = Layers.Enum.UI_2D;
    parent.addChild(idle);
    const idleTransform = idle.addComponent(UITransform);
    idleTransform.setContentSize(70, 72);
    idle.setPosition(canvasX(240), canvasY(474));
    const idleGraphics = idle.addComponent(Graphics);
    idleGraphics.lineWidth = 1.15;
    idleGraphics.strokeColor = new Color(255, 244, 219, 120);
    idleGraphics.moveTo(-2, -24);
    idleGraphics.bezierCurveTo(-10, -12, 7, -7, -1, 7);
    idleGraphics.bezierCurveTo(-5, 15, 2, 22, 6, 28);
    idleGraphics.stroke();
    this.idleSteamOpacity = idle.addComponent(UIOpacity);
    this.idleSteamOpacity.opacity = 72;

    const response = new Node("ResponseSteam");
    response.layer = Layers.Enum.UI_2D;
    parent.addChild(response);
    const responseTransform = response.addComponent(UITransform);
    responseTransform.setContentSize(92, 82);
    response.setPosition(canvasX(239), canvasY(470));
    const graphics = response.addComponent(Graphics);
    graphics.lineWidth = 1.35;
    graphics.strokeColor = new Color(255, 244, 219, 190);
    for (const offset of [-16, 0, 16]) {
      graphics.moveTo(offset, -28);
      graphics.bezierCurveTo(offset - 12, -15, offset + 10, -8, offset - 2, 6);
      graphics.bezierCurveTo(offset - 8, 15, offset + 5, 23, offset + 8, 32);
      graphics.stroke();
    }
    this.responseSteamOpacity = response.addComponent(UIOpacity);
    this.responseSteamOpacity.opacity = 0;
  }

  private buildCupState(parent: Node, frame: SpriteFrame): void {
    this.cupDown = this.makeCropSprite("SpareCupDown", frame, parent, 177, 523, 30, 37);
    // Preserve the approved backplate intact. The disposable beat is only a
    // subtle overlay sampled from those same pixels; no approximate colour
    // patch may cover or repaint the table.
    this.cupDown.angle = -8;
    this.cupDownOpacity = this.cupDown.addComponent(UIOpacity);
    this.cupDownOpacity.opacity = 255;
    this.cupUp = this.makeCropSprite("SpareCupUp", frame, parent, 177, 523, 30, 37);
    this.cupUp.angle = 0;
    this.cupUpOpacity = this.cupUp.addComponent(UIOpacity);
    this.cupUpOpacity.opacity = 0;
  }

  private buildStoryLabel(parent: Node): void {
    const node = new Node("IndoorStoryCopy");
    node.layer = Layers.Enum.UI_2D;
    parent.addChild(node);
    node.setPosition(0, -340);
    const transform = node.addComponent(UITransform);
    transform.setContentSize(334, 92);
    const label = node.addComponent(Label);
    label.string = "";
    label.fontSize = this.bridge?.getSettings().largeText ? 22 : 18;
    label.lineHeight = this.bridge?.getSettings().largeText ? 32 : 27;
    label.color = new Color("#FFF3D7");
    label.horizontalAlign = HorizontalTextAlignment.CENTER;
    label.verticalAlign = VerticalTextAlignment.CENTER;
    label.enableWrapText = true;
    label.overflow = Label.Overflow.CLAMP;
    label.enableShadow = true;
    label.shadowColor = new Color(45, 17, 5, 235);
    label.shadowOffset = new Vec2(0, -2);
    label.shadowBlur = 8;
    const opacity = node.addComponent(UIOpacity);
    opacity.opacity = 0;
    this.storyLabel = label;
    this.storyOpacity = opacity;
  }

  private syncFormalEndingUi(): void {
    const visible = this.formalEndingUi?.refresh() ?? false;
    if (visible === this.formalEndingWasVisible) return;
    this.formalEndingWasVisible = visible;
    const reduced = this.bridge?.getSettings().reducedMotion ?? false;
    if (!this.storyOpacity) return;
    const target = visible ? 0 : this.beat === "settled" ? 255 : this.storyOpacity.opacity;
    if (reduced) {
      Tween.stopAllByTarget(this.storyOpacity);
      this.storyOpacity.opacity = target;
    } else {
      this.fade(this.storyOpacity, target, EQUIVALENT_FADE_SECONDS);
    }
  }

  private handleKettleTap(): void {
    const bridge = this.bridge;
    if (!bridge || !this.canUseRoomInteraction()) return;
    if (this.beat === "kettle" || this.beat === "cat" || this.beat === "righting") return;
    if (this.beat === "settled") {
      const now = Date.now();
      if (now - this.lastReplayAtMs < 1400) return;
      this.lastReplayAtMs = now;
      this.playKettleFeedback();
      return;
    }

    this.unschedule(this.revealIdleWhisper);
    this.unschedule(this.hideTransientStory);
    const generation = ++this.sequenceGeneration;
    this.beat = "kettle";
    this.showStory("水正在热着。", false);
    this.playKettleFeedback();

    if (bridge.getSession().phase === "exploring") {
      bridge.send({ type: "COMPLETE_CORE_WITH_TAP" });
    }
    this.scheduleOnce(() => {
      if (generation !== this.sequenceGeneration || this.beat !== "kettle") return;
      this.beat = "cat";
      this.showCatBeat(true);
      this.scheduleOnce(() => {
        if (generation === this.sequenceGeneration && this.beat === "cat") this.rightCup();
      }, AUTO_RIGHT_CUP_SECONDS);
    }, CAT_REVEAL_SECONDS);
  }

  private handleCupTap(): void {
    if (!this.canUseRoomInteraction() || this.beat !== "cat") return;
    this.sequenceGeneration += 1;
    this.rightCup();
  }

  private canUseRoomInteraction(): boolean {
    const bridge = this.bridge;
    if (!bridge) return false;
    const session = bridge.getSession();
    return bridge.getAppFlow().phase === "night-session"
      && bridge.getAppFlow().overlay === "none"
      && session.durationMinutes !== null
      && ["exploring", "micro-scene", "quiet-stay"].includes(session.phase);
  }

  private playKettleFeedback(): void {
    if (this.bridge?.getSettings().feedbackEnabled && this.kettleClip && this.audioSource) {
      this.audioSource.stop();
      this.audioSource.playOneShot(this.kettleClip, 0.85);
    }

    const reduced = this.bridge?.getSettings().reducedMotion ?? false;
    this.fade(this.idleSteamOpacity, 0, EQUIVALENT_FADE_SECONDS);
    this.fade(this.responseSteamOpacity, 215, EQUIVALENT_FADE_SECONDS);
    this.scheduleOnce(() => {
      this.fade(this.responseSteamOpacity, 0, EQUIVALENT_FADE_SECONDS);
      this.fade(this.idleSteamOpacity, 72, EQUIVALENT_FADE_SECONDS);
    }, RESPONSE_SECONDS);
    if (!reduced && this.lidOverlay) {
      const lid = this.lidOverlay;
      const rest = lid.position.clone();
      Tween.stopAllByTarget(lid);
      tween(lid)
        .to(0.14, { position: new Vec3(rest.x, rest.y + 2, rest.z), angle: 1.4 })
        .to(RESPONSE_SECONDS - 0.14, { position: rest, angle: 0 })
        .start();
    }
  }

  private showCatBeat(animate: boolean): void {
    const reduced = this.bridge?.getSettings().reducedMotion ?? false;
    this.fade(this.catOverlayOpacity, 255, EQUIVALENT_FADE_SECONDS);
    if (animate && !reduced && this.catOverlay) {
      const cat = this.catOverlay;
      const rest = cat.position.clone();
      Tween.stopAllByTarget(cat);
      tween(cat)
        .to(0.38, { position: new Vec3(rest.x - 2, rest.y + 1, rest.z), angle: -1.1 })
        .to(0.5, { position: rest, angle: 0 })
        .start();
    }
    if (this.cupDown) {
      Tween.stopAllByTarget(this.cupDown);
      if (animate && !reduced) {
        tween(this.cupDown).to(0.38, { angle: -12 }).start();
      } else if (!reduced) {
        this.cupDown.angle = -12;
      }
    }
  }

  private rightCup(): void {
    if (this.beat !== "cat") return;
    const generation = ++this.sequenceGeneration;
    this.beat = "righting";
    const reduced = this.bridge?.getSettings().reducedMotion ?? false;
    if (reduced) {
      this.fade(this.cupDownOpacity, 0, EQUIVALENT_FADE_SECONDS);
      this.fade(this.cupUpOpacity, 255, EQUIVALENT_FADE_SECONDS);
    } else if (this.cupDown) {
      const cup = this.cupDown;
      Tween.stopAllByTarget(cup);
      tween(cup).to(0.56, { angle: 0 }).start();
    }
    this.scheduleOnce(() => {
      if (generation !== this.sequenceGeneration || this.beat !== "righting") return;
      this.enterSettledState(true);
    }, SETTLE_SECONDS);
  }

  private enterSettledState(completeSession: boolean): void {
    this.sequenceGeneration += 1;
    this.beat = "settled";
    if (this.bridge?.getSettings().reducedMotion) {
      if (this.cupDownOpacity) this.cupDownOpacity.opacity = 0;
      if (this.cupUpOpacity) this.cupUpOpacity.opacity = 255;
    } else if (this.cupDown) {
      this.cupDown.angle = 0;
    }
    this.showStory("水热了。\n你也先缓一会儿。", true);
    if (completeSession && this.bridge?.getSession().phase === "micro-scene") {
      this.bridge.send({ type: "COMPLETE_MICRO_SCENE" });
    }
    this.syncFormalEndingUi();
  }

  private readonly revealIdleWhisper = (): void => {
    if (this.beat === "waiting") this.showStory("壶里的水，正轻轻响着。", false);
  };

  private readonly hideTransientStory = (): void => {
    if (this.beat !== "settled") this.fade(this.storyOpacity, 0, EQUIVALENT_FADE_SECONDS);
  };

  private showStory(message: string, persistent: boolean): void {
    if (!this.storyLabel || !this.storyOpacity) return;
    this.unschedule(this.hideTransientStory);
    this.storyLabel.string = message;
    this.fade(this.storyOpacity, 255, EQUIVALENT_FADE_SECONDS);
    if (!persistent) this.scheduleOnce(this.hideTransientStory, 4.2);
  }

  private fade(opacity: UIOpacity | null, target: number, duration: number): void {
    if (!opacity) return;
    Tween.stopAllByTarget(opacity);
    tween(opacity).to(Math.min(EQUIVALENT_FADE_SECONDS, duration), { opacity: target }).start();
  }

  private stopPresentationTweens(): void {
    for (const target of [
      this.storyOpacity,
      this.idleSteamOpacity,
      this.responseSteamOpacity,
      this.catOverlayOpacity,
      this.cupDownOpacity,
      this.cupUpOpacity,
      this.lidOverlay,
      this.catOverlay,
      this.cupDown,
    ]) {
      if (target) Tween.stopAllByTarget(target);
    }
  }

  private makeSprite(
    name: string,
    frame: SpriteFrame,
    parent: Node,
    x: number,
    y: number,
    width: number,
    height: number,
  ): Node {
    const node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    parent.addChild(node);
    node.setPosition(x, y);
    const transform = node.addComponent(UITransform);
    transform.setContentSize(width, height);
    transform.setAnchorPoint(0.5, 0.5);
    const sprite = node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.trim = false;
    sprite.spriteFrame = frame;
    return node;
  }

  private makeCropSprite(
    name: string,
    frame: SpriteFrame,
    parent: Node,
    left: number,
    top: number,
    width: number,
    height: number,
  ): Node {
    return this.makeSprite(
      name,
      frame,
      parent,
      canvasX(left + width / 2),
      canvasY(top + height / 2),
      width,
      height,
    );
  }

  private makeTarget(
    name: string,
    parent: Node,
    screenCenterX: number,
    screenCenterY: number,
    width: number,
    height: number,
  ): Node {
    const target = new Node(name);
    target.layer = Layers.Enum.UI_2D;
    parent.addChild(target);
    target.setPosition(canvasX(screenCenterX), canvasY(screenCenterY));
    const transform = target.addComponent(UITransform);
    transform.setContentSize(Math.max(44, width), Math.max(44, height));
    transform.setAnchorPoint(0.5, 0.5);
    return target;
  }

  private bindTap(node: Node, callback: () => void): void {
    const handler = (event: EventTouch): void => {
      if (this.isTouchInside(node, event)) callback();
    };
    node.on(Node.EventType.TOUCH_END, handler, this);
    this.cleanups.push(() => node.off(Node.EventType.TOUCH_END, handler, this));
  }

  private isTouchInside(node: Node, event: EventTouch): boolean {
    const transform = node.getComponent(UITransform);
    if (!transform) return false;
    const location = event.getUILocation();
    const local = transform.convertToNodeSpaceAR(new Vec3(location.x, location.y, 0));
    const size = transform.contentSize;
    return Math.abs(local.x) <= size.width / 2 && Math.abs(local.y) <= size.height / 2;
  }

  private installDebugApi(): void {
    // Keep the evidence hook available to local Web QA without exposing it in
    // the WeChat runtime surface.
    if (!sys.isBrowser) return;
    const api: IndoorPreviewDebugApi = {
      tapKettle: () => this.handleKettleTap(),
      tapCup: () => this.handleCupTap(),
      setLargeText: (enabled) => {
        this.bridge?.updateSettings({ largeText: enabled });
        this.refresh();
      },
      performAction: (action) => this.performAction(action),
      performSessionControlAction: (action, duration) =>
        this.formalSessionControls?.performAction(action, duration ?? null) ?? false,
      snapshot: () => {
        const bridge = this.bridge;
        if (!bridge) throw new Error("Indoor preview bridge is unavailable");
        return {
          candidateId: "gate-d-story-b-kf-r1-temp-dev-r1-0.4.7",
          bundleName: BUNDLE_NAME,
          beat: this.beat,
          assetsLoaded: this.assetsLoaded,
          reducedMotion: bridge.getSettings().reducedMotion,
          kettleTargetSize: [125, 127],
          cupTargetSize: [80, 88],
          formalEndingUi: this.formalEndingUi?.getDebugSnapshot() ?? null,
          formalSessionControls: this.formalSessionControls?.getDebugSnapshot() ?? null,
          actions: deriveIndoorN01ActionAvailability(
            bridge.getSession(),
            bridge.getAppFlow(),
          ),
        };
      },
    };
    this.debugApi = api;
    (globalThis as PreviewDebugGlobal).__INDOOR_N01_PHONE_PREVIEW__ = api;
  }
}
