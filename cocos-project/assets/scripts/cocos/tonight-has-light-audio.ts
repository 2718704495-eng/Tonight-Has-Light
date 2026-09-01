import { _decorator, AudioClip, AudioSource, Component, resources } from "cc";

const { ccclass } = _decorator;

const AUDIO_RESOURCE_PATH = "audio/night-room-loop";
const TARGET_VOLUME = 0.28;
const DEFAULT_FADE_SECONDS = 2.5;
const RESUME_FADE_SECONDS = 0.45;
const FADE_STEP_SECONDS = 1 / 30;

/**
 * Presentation-only audio controller for the first-night room loop.
 *
 * Loading may happen before interaction, but playback is never requested until
 * the app-wide first gesture gate is unlocked. A missing/failed asset remains non-blocking:
 * the complete experience is still understandable while silent.
 */
@ccclass("TonightHasLightAudio")
export class TonightHasLightAudio extends Component {
  private source: AudioSource | null = null;
  private clip: AudioClip | null = null;
  private audioEnabled = true;
  private playbackRequested = false;
  private loaded = false;
  private backgroundPaused = false;
  private fadeElapsedSeconds = 0;
  private fadeDurationSeconds = DEFAULT_FADE_SECONDS;

  public initialize(enabled: boolean): void {
    this.audioEnabled = enabled;
    const source = this.node.addComponent(AudioSource);
    source.playOnAwake = false;
    source.loop = true;
    source.volume = 0;
    this.source = source;

    resources.load(AUDIO_RESOURCE_PATH, AudioClip, (error, clip) => {
      if (error || !clip) {
        // Silence is the designed fallback; do not make audio load a flow blocker.
        return;
      }
      if (!this.isValid || !this.source) {
        resources.release(AUDIO_RESOURCE_PATH, AudioClip);
        return;
      }
      this.clip = clip;
      this.source.clip = clip;
      this.loaded = true;
      if (this.audioEnabled && this.playbackRequested && !this.backgroundPaused) {
        this.startFade(this.fadeDurationSeconds);
      }
    });
  }

  public requestFadeIn(durationMs = 2500): void {
    this.playbackRequested = true;
    this.fadeDurationSeconds = Math.max(0.05, durationMs / 1000);
    if (this.audioEnabled && this.loaded && !this.backgroundPaused) {
      this.startFade(this.fadeDurationSeconds);
    }
  }

  public setEnabled(enabled: boolean): void {
    this.audioEnabled = enabled;
    if (!enabled) {
      this.unschedule(this.advanceFade);
      if (this.source) {
        this.source.volume = 0;
        this.source.pause();
      }
      return;
    }
    if (this.loaded && this.playbackRequested && !this.backgroundPaused) {
      this.startFade(RESUME_FADE_SECONDS);
    }
  }

  public pauseForBackground(): void {
    if (this.backgroundPaused) return;
    this.backgroundPaused = true;
    this.unschedule(this.advanceFade);
    this.source?.pause();
  }

  public resumeFromBackground(): void {
    if (!this.backgroundPaused) return;
    this.backgroundPaused = false;
    if (this.audioEnabled && this.loaded && this.playbackRequested) {
      this.startFade(RESUME_FADE_SECONDS);
    }
  }

  protected onDestroy(): void {
    this.unschedule(this.advanceFade);
    this.source?.stop();
    if (this.source) this.source.clip = null;
    if (this.clip) resources.release(AUDIO_RESOURCE_PATH, AudioClip);
    this.clip = null;
    this.source = null;
  }

  private startFade(durationSeconds: number): void {
    const source = this.source;
    if (!source?.clip) return;

    this.unschedule(this.advanceFade);
    this.fadeElapsedSeconds = 0;
    this.fadeDurationSeconds = Math.max(0.05, durationSeconds);
    source.volume = 0;
    if (!source.playing) source.play();
    this.schedule(this.advanceFade, FADE_STEP_SECONDS);
  }

  private readonly advanceFade = (): void => {
    const source = this.source;
    if (!source || !this.audioEnabled || this.backgroundPaused) {
      this.unschedule(this.advanceFade);
      return;
    }

    this.fadeElapsedSeconds += FADE_STEP_SECONDS;
    const progress = Math.min(1, this.fadeElapsedSeconds / this.fadeDurationSeconds);
    const eased = progress * progress * (3 - 2 * progress);
    source.volume = TARGET_VOLUME * eased;

    if (progress >= 1) {
      source.volume = TARGET_VOLUME;
      this.unschedule(this.advanceFade);
    }
  };
}
