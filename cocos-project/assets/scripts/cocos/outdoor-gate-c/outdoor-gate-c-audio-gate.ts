import {
  _decorator,
  AudioClip,
  AudioSource,
  Component,
  Node,
  game,
  Game,
  input,
  Input,
  resources,
  sys,
} from "cc";

const { ccclass, property } = _decorator;

const AMBIENT_WIND_RESOURCE_PATH = "audio/outdoor-gate-c/night-breeze-loop-v1";
const AMBIENT_FADE_SECONDS = 0.35;
const AMBIENT_VOLUME = 0.2;
const MUSIC_FADE_SECONDS = 2.5;
const MUSIC_VOLUME = 0.12;
const MAX_FADE_DELTA_SECONDS = 0.1;

type AmbientLoadState = "loading" | "loaded" | "failed" | "destroyed";

export interface OutdoorGateCAudioProofSnapshot {
  readonly ambientResourcePath: string;
  readonly ambientLoadState: AmbientLoadState;
  readonly ambientAssigned: boolean;
  readonly musicAssigned: boolean;
  readonly unlocked: boolean;
  /** Backwards-compatible aggregate used by the frozen Gate C proof. */
  readonly enabledByUser: boolean;
  readonly ambientEnabledByUser: boolean;
  readonly musicEnabledByUser: boolean;
  readonly backgroundPaused: boolean;
  readonly interruptionPaused: boolean;
  readonly ambientPlaying: boolean;
  readonly musicPlaying: boolean;
  readonly ambientVolume: number;
  readonly musicVolume: number;
  readonly ambientCurrentTime: number;
  readonly ambientDuration: number;
  readonly ambientPlayRequestCount: number;
  readonly musicPlayRequestCount: number;
  readonly backgroundPauseCount: number;
  readonly backgroundResumeCount: number;
  readonly interruptionPauseCount: number;
  readonly interruptionResumeCount: number;
  readonly audioSourceCount: number;
}

interface OutdoorGateCAudioProofApi {
  readonly snapshot: () => OutdoorGateCAudioProofSnapshot;
  readonly setEnabled: (enabled: boolean) => void;
  readonly setChannelEnabled: (ambientEnabled: boolean, musicEnabled: boolean) => void;
  readonly pauseForBackground: () => void;
  readonly resumeFromBackground: () => void;
  readonly pauseForInterruption: () => void;
  readonly resumeFromInterruption: () => void;
}

type AudioProofGlobal = typeof globalThis & {
  __OUTDOOR_GATE_C_AUDIO_PROOF__?: OutdoorGateCAudioProofApi;
};

function smoothStep(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

@ccclass("OutdoorGateCAudioGate")
export class OutdoorGateCAudioGate extends Component {
  @property(AudioClip)
  public ambientWindClip: AudioClip | null = null;

  @property(AudioClip)
  public musicClip: AudioClip | null = null;

  private ambientSource: AudioSource | null = null;
  private musicSource: AudioSource | null = null;
  private ambientLoadState: AmbientLoadState = "loading";
  private ownsAmbientClip = false;
  private destroyed = false;
  private unlocked = false;
  private ambientEnabledByUser = true;
  private musicEnabledByUser = true;
  private backgroundPaused = false;
  private interruptionPaused = false;
  private ambientStartPending = false;
  private musicStartPending = false;
  private ambientFadeActive = false;
  private ambientFadeElapsed = 0;
  private musicFadeActive = false;
  private musicFadeElapsed = 0;
  private ambientPlayRequestCount = 0;
  private musicPlayRequestCount = 0;
  private backgroundPauseCount = 0;
  private backgroundResumeCount = 0;
  private interruptionPauseCount = 0;
  private interruptionResumeCount = 0;
  private proofApi: OutdoorGateCAudioProofApi | null = null;

  protected onLoad(): void {
    const ambientSource = this.node.addComponent(AudioSource);
    ambientSource.loop = true;
    ambientSource.playOnAwake = false;
    ambientSource.volume = 0;
    this.ambientSource = ambientSource;

    if (this.ambientWindClip) {
      ambientSource.clip = this.ambientWindClip;
      this.ambientLoadState = "loaded";
    } else {
      this.loadAmbientWind();
    }

    if (this.musicClip) {
      const musicSource = this.node.addComponent(AudioSource);
      musicSource.clip = this.musicClip;
      musicSource.loop = true;
      musicSource.playOnAwake = false;
      musicSource.volume = 0;
      this.musicSource = musicSource;
    }

    this.node.on(AudioSource.EventType.STARTED, this.handleAudioStarted, this);
    this.node.on(Node.EventType.TOUCH_START, this.handleTouch, this);
    input.on(Input.EventType.TOUCH_START, this.handleTouch, this);
    game.on(Game.EVENT_HIDE, this.handleGameHide, this);
    game.on(Game.EVENT_SHOW, this.handleGameShow, this);
    this.installProofApi();
  }

  protected update(deltaTime: number): void {
    const safeDelta = Math.max(0, Math.min(deltaTime, MAX_FADE_DELTA_SECONDS));
    this.advanceAmbientFade(safeDelta);
    this.advanceMusicFade(safeDelta);
  }

  protected onDestroy(): void {
    this.destroyed = true;
    this.ambientLoadState = "destroyed";
    this.node.off(AudioSource.EventType.STARTED, this.handleAudioStarted, this);
    this.node.off(Node.EventType.TOUCH_START, this.handleTouch, this);
    input.off(Input.EventType.TOUCH_START, this.handleTouch, this);
    game.off(Game.EVENT_HIDE, this.handleGameHide, this);
    game.off(Game.EVENT_SHOW, this.handleGameShow, this);

    const proofGlobal = globalThis as AudioProofGlobal;
    if (proofGlobal.__OUTDOOR_GATE_C_AUDIO_PROOF__ === this.proofApi) {
      delete proofGlobal.__OUTDOOR_GATE_C_AUDIO_PROOF__;
    }

    this.ambientFadeActive = false;
    this.musicFadeActive = false;
    this.ambientSource?.stop();
    this.musicSource?.stop();
    if (this.ambientSource) this.ambientSource.clip = null;
    if (this.musicSource) this.musicSource.clip = null;
    if (this.ownsAmbientClip) {
      resources.release(AMBIENT_WIND_RESOURCE_PATH, AudioClip);
    }

    this.ambientWindClip = null;
    this.musicClip = null;
    this.ambientSource = null;
    this.musicSource = null;
    this.proofApi = null;
  }

  public setEnabled(enabled: boolean): void {
    this.setChannelEnabled(enabled, enabled);
  }

  public setChannelEnabled(ambientEnabled: boolean, musicEnabled: boolean): void {
    const ambientChanged = this.ambientEnabledByUser !== ambientEnabled;
    const musicChanged = this.musicEnabledByUser !== musicEnabled;
    if (!ambientChanged && !musicChanged) return;

    this.ambientEnabledByUser = ambientEnabled;
    this.musicEnabledByUser = musicEnabled;
    if (ambientChanged) {
      if (ambientEnabled) this.startAmbientWind();
      else this.pauseAmbientAudio();
    }
    if (musicChanged) {
      if (musicEnabled) this.startMusic();
      else this.pauseMusicAudio();
    }
  }

  public pauseForBackground(): void {
    if (this.backgroundPaused) return;
    this.backgroundPaused = true;
    this.backgroundPauseCount += 1;
    this.pauseAllAudio();
  }

  public resumeFromBackground(): void {
    if (!this.backgroundPaused) return;
    this.backgroundPaused = false;
    this.backgroundResumeCount += 1;
    this.startAvailableAudio();
  }

  public pauseForInterruption(): void {
    if (this.interruptionPaused) return;
    this.interruptionPaused = true;
    this.interruptionPauseCount += 1;
    this.pauseAllAudio();
  }

  public resumeFromInterruption(): void {
    if (!this.interruptionPaused) return;
    this.interruptionPaused = false;
    this.interruptionResumeCount += 1;
    this.startAvailableAudio();
  }

  public isUnlocked(): boolean {
    return this.unlocked;
  }

  public unlockFromUserGesture(): void {
    this.handleTouch();
  }

  public hasAssignedAudio(): boolean {
    return this.ambientWindClip !== null || this.musicClip !== null;
  }

  public getPlaybackStatus(): {
    readonly ambientPlaying: boolean;
    readonly musicPlaying: boolean;
    readonly ambientAssigned: boolean;
    readonly musicAssigned: boolean;
    readonly ambientVolume: number;
    readonly musicVolume: number;
  } {
    return {
      ambientPlaying: this.ambientSource?.playing ?? false,
      musicPlaying: this.musicSource?.playing ?? false,
      ambientAssigned: this.ambientWindClip !== null,
      musicAssigned: this.musicClip !== null,
      ambientVolume: this.ambientSource?.volume ?? 0,
      musicVolume: this.musicSource?.volume ?? 0,
    };
  }

  public getProofSnapshot(): OutdoorGateCAudioProofSnapshot {
    return {
      ambientResourcePath: AMBIENT_WIND_RESOURCE_PATH,
      ambientLoadState: this.ambientLoadState,
      ambientAssigned: this.ambientWindClip !== null,
      musicAssigned: this.musicClip !== null,
      unlocked: this.unlocked,
      enabledByUser: this.ambientEnabledByUser && this.musicEnabledByUser,
      ambientEnabledByUser: this.ambientEnabledByUser,
      musicEnabledByUser: this.musicEnabledByUser,
      backgroundPaused: this.backgroundPaused,
      interruptionPaused: this.interruptionPaused,
      ambientPlaying: this.ambientSource?.playing ?? false,
      musicPlaying: this.musicSource?.playing ?? false,
      ambientVolume: this.ambientSource?.volume ?? 0,
      musicVolume: this.musicSource?.volume ?? 0,
      ambientCurrentTime: this.ambientSource?.currentTime ?? 0,
      ambientDuration: this.ambientSource?.duration ?? 0,
      ambientPlayRequestCount: this.ambientPlayRequestCount,
      musicPlayRequestCount: this.musicPlayRequestCount,
      backgroundPauseCount: this.backgroundPauseCount,
      backgroundResumeCount: this.backgroundResumeCount,
      interruptionPauseCount: this.interruptionPauseCount,
      interruptionResumeCount: this.interruptionResumeCount,
      audioSourceCount: this.node.getComponents(AudioSource).length,
    };
  }

  private loadAmbientWind(): void {
    resources.load(AMBIENT_WIND_RESOURCE_PATH, AudioClip, (error, clip) => {
      if (error || !clip) {
        if (!this.destroyed) this.ambientLoadState = "failed";
        return;
      }
      if (this.destroyed || !this.isValid || !this.ambientSource) {
        resources.release(AMBIENT_WIND_RESOURCE_PATH, AudioClip);
        return;
      }

      this.ownsAmbientClip = true;
      this.ambientWindClip = clip;
      this.ambientSource.clip = clip;
      this.ambientLoadState = "loaded";
      this.startAvailableAudio();
    });
  }

  private readonly handleTouch = (): void => {
    if (!this.unlocked) this.unlocked = true;
    this.startAvailableAudio();
  };

  private readonly handleGameHide = (): void => {
    this.pauseForBackground();
  };

  private readonly handleGameShow = (): void => {
    this.resumeFromBackground();
  };

  private readonly handleAudioStarted = (source: AudioSource): void => {
    if (source === this.ambientSource) {
      this.ambientStartPending = false;
      if (!this.canPlayAmbient()) {
        source.volume = 0;
        source.pause();
        return;
      }
      this.ambientFadeElapsed = 0;
      this.ambientFadeActive = true;
      source.volume = 0;
      return;
    }

    if (source === this.musicSource) {
      this.musicStartPending = false;
      if (!this.canPlayMusic()) {
        source.volume = 0;
        source.pause();
        return;
      }
      this.musicFadeElapsed = 0;
      this.musicFadeActive = true;
      source.volume = 0;
    }
  };

  private canPlayCommon(): boolean {
    return this.unlocked
      && !this.backgroundPaused
      && !this.interruptionPaused
      && !this.destroyed;
  }

  private canPlayAmbient(): boolean {
    return this.canPlayCommon() && this.ambientEnabledByUser;
  }

  private canPlayMusic(): boolean {
    return this.canPlayCommon() && this.musicEnabledByUser;
  }

  private startAvailableAudio(): void {
    if (!this.canPlayCommon()) return;
    this.startAmbientWind();
    this.startMusic();
  }

  private startAmbientWind(): void {
    const source = this.ambientSource;
    if (!this.canPlayAmbient() || !source?.clip || source.playing || this.ambientStartPending) return;
    source.volume = 0;
    this.ambientFadeActive = false;
    this.ambientStartPending = true;
    this.ambientPlayRequestCount += 1;
    source.play();
  }

  private startMusic(): void {
    const source = this.musicSource;
    if (!this.canPlayMusic() || !source?.clip || source.playing || this.musicStartPending) return;
    source.volume = 0;
    this.musicFadeActive = false;
    this.musicStartPending = true;
    this.musicPlayRequestCount += 1;
    source.play();
  }

  private pauseAllAudio(): void {
    this.pauseAmbientAudio();
    this.pauseMusicAudio();
  }

  private pauseAmbientAudio(): void {
    this.ambientFadeActive = false;
    this.ambientStartPending = false;
    if (this.ambientSource) {
      this.ambientSource.volume = 0;
      this.ambientSource.pause();
    }
  }

  private pauseMusicAudio(): void {
    this.musicFadeActive = false;
    this.musicStartPending = false;
    if (this.musicSource) {
      this.musicSource.volume = 0;
      this.musicSource.pause();
    }
  }

  private advanceAmbientFade(deltaTime: number): void {
    const source = this.ambientSource;
    if (!this.ambientFadeActive || !source || !this.canPlayAmbient()) return;
    this.ambientFadeElapsed = Math.min(
      AMBIENT_FADE_SECONDS,
      this.ambientFadeElapsed + deltaTime,
    );
    source.volume = AMBIENT_VOLUME * smoothStep(this.ambientFadeElapsed / AMBIENT_FADE_SECONDS);
    if (this.ambientFadeElapsed >= AMBIENT_FADE_SECONDS) {
      source.volume = AMBIENT_VOLUME;
      this.ambientFadeActive = false;
    }
  }

  private advanceMusicFade(deltaTime: number): void {
    const source = this.musicSource;
    if (!this.musicFadeActive || !source || !this.canPlayMusic()) return;
    this.musicFadeElapsed = Math.min(MUSIC_FADE_SECONDS, this.musicFadeElapsed + deltaTime);
    source.volume = MUSIC_VOLUME * smoothStep(this.musicFadeElapsed / MUSIC_FADE_SECONDS);
    if (this.musicFadeElapsed >= MUSIC_FADE_SECONDS) {
      source.volume = MUSIC_VOLUME;
      this.musicFadeActive = false;
    }
  }

  private installProofApi(): void {
    if (!sys.isBrowser) return;
    const api: OutdoorGateCAudioProofApi = {
      snapshot: () => this.getProofSnapshot(),
      setEnabled: (enabled) => this.setEnabled(enabled),
      setChannelEnabled: (ambientEnabled, musicEnabled) => {
        this.setChannelEnabled(ambientEnabled, musicEnabled);
      },
      pauseForBackground: () => this.pauseForBackground(),
      resumeFromBackground: () => this.resumeFromBackground(),
      pauseForInterruption: () => this.pauseForInterruption(),
      resumeFromInterruption: () => this.resumeFromInterruption(),
    };
    this.proofApi = api;
    (globalThis as AudioProofGlobal).__OUTDOOR_GATE_C_AUDIO_PROOF__ = api;
  }
}
