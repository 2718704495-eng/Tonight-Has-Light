import { _decorator, Component, game, Game, sys } from "cc";
import type { LocalSave, UserSettings } from "../domain/contracts.ts";
import {
  createDefaultSave,
  loadLocalSave,
  persistLocalSave,
  storeRecentAppCheckpoint,
  updateUserSettings,
  type LoadSaveStatus,
  type StoragePort,
} from "../core/local-save.ts";
import {
  createAppFlowState,
  transitionAppFlow,
  type AppFlowCommand,
  type AppFlowEffect,
  type AppFlowState,
  type AppFlowTransition,
} from "../core/app-flow.ts";
import {
  createSharePayload,
  resolveLaunchIntent,
  type LaunchIntent,
  type SharePayload,
} from "../core/sharing.ts";
import { FormalPicturebookPartialScene } from "./formal-picturebook-0-4-8/formal-picturebook-partial-scene.ts";
import { requestsReducedMotionFromSearch } from "./outdoor-gate-c/outdoor-gate-c-rig.ts";
import { TonightHasLightOutdoorFunctionalOverlay } from "./tonight-has-light-outdoor-functional-overlay.ts";

const { ccclass } = _decorator;
const FORMAL_PICTUREBOOK_PARTIAL_STORAGE_PREFIX = "formal-picturebook-partial-r1-0.4.8:";

interface WechatLaunchOptions {
  readonly query?: unknown;
}

interface WechatGameApi {
  readonly getLaunchOptionsSync?: () => WechatLaunchOptions;
  readonly showShareMenu?: (options: {
    readonly withShareTicket: boolean;
    readonly menus: readonly string[];
  }) => void;
  readonly onShareAppMessage?: (handler: () => SharePayload) => void;
  readonly offShareAppMessage?: (handler: () => SharePayload) => void;
  readonly shareAppMessage?: (options: SharePayload & {
    readonly success?: () => void;
    readonly fail?: (error: unknown) => void;
  }) => void;
  readonly onAudioInterruptionBegin?: (handler: () => void) => void;
  readonly offAudioInterruptionBegin?: (handler: () => void) => void;
  readonly onAudioInterruptionEnd?: (handler: () => void) => void;
  readonly offAudioInterruptionEnd?: (handler: () => void) => void;
}

type WechatGlobal = typeof globalThis & { readonly wx?: WechatGameApi };

function getWechatApi(): WechatGameApi | null {
  return (globalThis as WechatGlobal).wx ?? null;
}

function getStartupSearch(): string | null {
  const locationValue = (globalThis as typeof globalThis & {
    readonly location?: { readonly search?: string };
  }).location;
  return locationValue?.search ?? null;
}

function createCocosStoragePort(): StoragePort {
  return {
    // 0.4.8 is an isolated picturebook and cannot inherit or overwrite saves
    // from the superseded phone-preview chain.
    getItem: (key) => sys.localStorage.getItem(`${FORMAL_PICTUREBOOK_PARTIAL_STORAGE_PREFIX}${key}`),
    setItem: (key, value) => sys.localStorage.setItem(
      `${FORMAL_PICTUREBOOK_PARTIAL_STORAGE_PREFIX}${key}`,
      value,
    ),
    removeItem: (key) => sys.localStorage.removeItem(
      `${FORMAL_PICTUREBOOK_PARTIAL_STORAGE_PREFIX}${key}`,
    ),
  };
}

@ccclass("TonightHasLightBootstrap")
export class TonightHasLightBootstrap extends Component {
  private readonly storage = createCocosStoragePort();
  private save: LocalSave = createDefaultSave(new Date(0).toISOString());
  private appFlow: AppFlowState = createAppFlowState();
  private loadStatus: LoadSaveStatus = "missing";
  private launchIntent: LaunchIntent = { kind: "normal" };
  private lastPersistSucceeded = true;
  private picturebookScene: FormalPicturebookPartialScene | null = null;
  private outdoorOverlay: TonightHasLightOutdoorFunctionalOverlay | null = null;
  private appHidden = false;
  private audioInterruptionActive = false;
  private shareInFlight = false;
  private shareAttemptToken = 0;
  private destroyed = false;
  private wechatApi: WechatGameApi | null = null;
  private pendingBootEffects: readonly AppFlowEffect[] = [];
  private readonly shareHandler = (): SharePayload => createSharePayload();

  protected onLoad(): void {
    const nowMs = Date.now();
    const loadResult = loadLocalSave(this.storage, new Date(nowMs).toISOString());
    this.save = loadResult.save;
    this.loadStatus = loadResult.status;
    if (requestsReducedMotionFromSearch(getStartupSearch())) {
      // This URL query is a temporary QA override and is intentionally not
      // persisted into a later launch without the query.
      this.save = updateUserSettings(
        this.save,
        { ...this.save.settings, reducedMotion: true },
        new Date(nowMs).toISOString(),
      );
    }

    const wechat = getWechatApi();
    this.wechatApi = wechat;
    this.launchIntent = resolveLaunchIntent(wechat?.getLaunchOptionsSync?.().query);
    wechat?.showShareMenu?.({ withShareTicket: false, menus: ["shareAppMessage"] });
    wechat?.onShareAppMessage?.(this.shareHandler);
    wechat?.onAudioInterruptionBegin?.(this.handleWechatAudioInterruptionBegin);
    wechat?.onAudioInterruptionEnd?.(this.handleWechatAudioInterruptionEnd);

    game.on(Game.EVENT_HIDE, this.handleGameHide, this);
    game.on(Game.EVENT_SHOW, this.handleGameShow, this);

    const boot = transitionAppFlow(this.appFlow, {
      type: "BOOT_COMPLETE",
      sharedWelcome: this.launchIntent.kind === "shared-welcome",
      // Old indoor checkpoints are deliberately ignored in this partial build.
      // Root R4 is always the safe visual entry.
      resumeNightSession: false,
    });
    this.appFlow = boot.state;
    this.pendingBootEffects = boot.effects;
  }

  protected start(): void {
    this.mountPicturebookScene();
    this.runAppEffects(this.pendingBootEffects);
    this.pendingBootEffects = [];
  }

  protected onDestroy(): void {
    this.destroyed = true;
    this.shareInFlight = false;
    this.shareAttemptToken += 1;
    game.off(Game.EVENT_HIDE, this.handleGameHide, this);
    game.off(Game.EVENT_SHOW, this.handleGameShow, this);
    this.wechatApi?.offShareAppMessage?.(this.shareHandler);
    this.wechatApi?.offAudioInterruptionBegin?.(this.handleWechatAudioInterruptionBegin);
    this.wechatApi?.offAudioInterruptionEnd?.(this.handleWechatAudioInterruptionEnd);
    this.wechatApi = null;
    this.picturebookScene = null;
    this.outdoorOverlay = null;
  }

  public getSave(): LocalSave {
    return this.save;
  }

  public getLoadStatus(): LoadSaveStatus {
    return this.loadStatus;
  }

  public getSettings(): UserSettings {
    return this.save.settings;
  }

  public getLaunchIntent(): LaunchIntent {
    return this.launchIntent;
  }

  public getLastPersistSucceeded(): boolean {
    return this.lastPersistSucceeded;
  }

  public getSharePayload(): SharePayload {
    return createSharePayload();
  }

  public getAppFlow(): AppFlowState {
    return this.appFlow;
  }

  public requestWechatShare(): boolean {
    if (this.appFlow.overlay !== "share-preview" || this.shareInFlight) return false;
    const wechat = getWechatApi();
    if (!wechat?.shareAppMessage) {
      this.sendAppFlow({ type: "SHARE_FAILED", message: "请在微信中打开后再分享" });
      return false;
    }
    const payload = createSharePayload();
    const attemptToken = ++this.shareAttemptToken;
    this.shareInFlight = true;
    const settle = (command: AppFlowCommand): void => {
      if (!this.shareInFlight || attemptToken !== this.shareAttemptToken) return;
      this.shareInFlight = false;
      this.sendAppFlow(command);
    };
    try {
      wechat.shareAppMessage({
        ...payload,
        success: () => settle({ type: "CLOSE_SHARE_PREVIEW" }),
        fail: () => settle({ type: "SHARE_FAILED", message: "分享没有发出去" }),
      });
      return true;
    } catch {
      settle({ type: "SHARE_FAILED", message: "分享没有发出去" });
      return false;
    }
  }

  public retryPersist(): boolean {
    this.lastPersistSucceeded = persistLocalSave(this.storage, this.save);
    if (this.lastPersistSucceeded) this.sendAppFlow({ type: "SAVE_SUCCEEDED" });
    return this.lastPersistSucceeded;
  }

  public sendAppFlow(command: AppFlowCommand): AppFlowTransition {
    const previousAppFlow = this.appFlow;
    const transition = transitionAppFlow(previousAppFlow, command);
    if (
      this.shareInFlight
      && this.hostsSharePreview(previousAppFlow)
      && !this.hostsSharePreview(transition.state)
    ) {
      this.shareInFlight = false;
      this.shareAttemptToken += 1;
    }
    this.appFlow = transition.state;
    this.runAppEffects(transition.effects);
    this.outdoorOverlay?.refresh();
    return transition;
  }

  private hostsSharePreview(state: AppFlowState): boolean {
    return state.overlay === "share-preview"
      || (state.overlay === "paused" && state.overlayBeforePause === "share-preview");
  }

  public updateSettings(settings: Readonly<Partial<UserSettings>>): UserSettings {
    const updatedSettings: UserSettings = {
      musicEnabled: settings.musicEnabled ?? this.save.settings.musicEnabled,
      ambientEnabled: settings.ambientEnabled ?? this.save.settings.ambientEnabled,
      feedbackEnabled: settings.feedbackEnabled ?? this.save.settings.feedbackEnabled,
      reducedMotion: settings.reducedMotion ?? this.save.settings.reducedMotion,
      largeText: settings.largeText ?? this.save.settings.largeText,
    };
    const nowIso = new Date().toISOString();
    this.save = updateUserSettings(this.save, updatedSettings, nowIso);
    this.lastPersistSucceeded = persistLocalSave(this.storage, this.save);
    this.picturebookScene?.setReducedMotion(updatedSettings.reducedMotion);
    this.picturebookScene?.setSoundEnabled(updatedSettings.ambientEnabled);
    this.picturebookScene?.setMusicEnabled(updatedSettings.musicEnabled);
    this.picturebookScene?.setLargeText(updatedSettings.largeText);
    return updatedSettings;
  }

  public dismissSharedWelcome(): void {
    this.sendAppFlow({ type: "DISMISS_SHARED_WELCOME" });
  }

  public returnToOutdoor(): void {
    this.picturebookScene?.replay();
    const nowIso = new Date().toISOString();
    this.save = storeRecentAppCheckpoint(
      this.save,
      { kind: "outdoor-ready", updatedAt: nowIso },
      nowIso,
    );
    this.lastPersistSucceeded = persistLocalSave(this.storage, this.save);
  }

  private readonly handleGameHide = (): void => {
    this.appHidden = true;
    this.picturebookScene?.pauseAudioForInterruption();
    this.sendAppFlow({ type: "APP_HIDE" });
  };

  private readonly handleGameShow = (): void => {
    this.appHidden = false;
    this.sendAppFlow({ type: "APP_SHOW" });
    if (!this.audioInterruptionActive) this.picturebookScene?.resumeAudioFromInterruption();
  };

  private readonly handleWechatAudioInterruptionBegin = (): void => {
    if (this.destroyed || this.audioInterruptionActive) return;
    this.audioInterruptionActive = true;
    this.picturebookScene?.pauseAudioForInterruption();
    this.sendAppFlow({ type: "AUDIO_INTERRUPTED" });
  };

  private readonly handleWechatAudioInterruptionEnd = (): void => {
    if (this.destroyed || !this.audioInterruptionActive) return;
    this.audioInterruptionActive = false;
    this.sendAppFlow({ type: "AUDIO_RESUMED" });
    if (!this.appHidden) this.picturebookScene?.resumeAudioFromInterruption();
  };

  private mountPicturebookScene(): void {
    if (this.picturebookScene) return;
    const scene = this.node.addComponent(FormalPicturebookPartialScene);
    scene.initialize({
      reducedMotion: this.save.settings.reducedMotion,
      soundEnabled: this.save.settings.ambientEnabled,
      musicEnabled: this.save.settings.musicEnabled,
      largeText: this.save.settings.largeText,
      audioInterrupted: this.audioInterruptionActive,
      bridge: {
        onLoadFailed: (message) => {
          this.sendAppFlow({ type: "OUTDOOR_LOAD_FAILED", message });
          this.mountOutdoorFunctionalOverlay();
        },
      },
    });
    this.picturebookScene = scene;
    if (this.appFlow.phase === "shared-welcome") this.mountOutdoorFunctionalOverlay();
  }

  private runAppEffects(effects: readonly AppFlowEffect[]): void {
    for (const effect of effects) {
      if (effect.type === "LOAD_OUTDOOR_SCENE") this.retryPicturebookScene();
    }
  }

  private retryPicturebookScene(): void {
    this.picturebookScene?.destroy();
    this.picturebookScene = null;
    this.mountPicturebookScene();
    this.outdoorOverlay?.refresh();
  }

  private mountOutdoorFunctionalOverlay(): void {
    if (this.outdoorOverlay) {
      this.outdoorOverlay.refresh();
      return;
    }
    const overlay = this.node.addComponent(TonightHasLightOutdoorFunctionalOverlay);
    overlay.initialize({
      getAppFlow: () => this.getAppFlow(),
      dismissSharedWelcome: () => this.dismissSharedWelcome(),
      retryCurrentLoad: () => this.sendAppFlow({ type: "RETRY_OUTDOOR_LOAD" }),
    });
    this.outdoorOverlay = overlay;
  }
}
