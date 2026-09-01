export const OUTDOOR_ILLUSTRATION_PAGE_COUNT = 5;
export const OUTDOOR_ILLUSTRATION_TRANSITION_MS = 140;
export const OUTDOOR_ILLUSTRATION_OPENING_SETTLE_MS = 900;
export const OUTDOOR_ILLUSTRATION_QUIET_GAP_MIN_MS = 4_500;
export const OUTDOOR_ILLUSTRATION_QUIET_GAP_MAX_MS = 6_500;

const OUTDOOR_ILLUSTRATION_PAGE_HOLD_MS = [0, 575, 625, 675, 800] as const;
const OUTDOOR_ILLUSTRATION_SCHEDULE_SEED = 0x52325750;

export type OutdoorIllustrationPageIndex = 0 | 1 | 2 | 3 | 4;

export interface OutdoorIllustrationTransitionSnapshot {
  readonly id: number;
  readonly pages: readonly [OutdoorIllustrationPageIndex, OutdoorIllustrationPageIndex];
  readonly progress: number;
  readonly fromOpacity: number;
  readonly toOpacity: number;
}

export interface OutdoorIllustrationWindPageSnapshot {
  readonly currentPage: OutdoorIllustrationPageIndex;
  readonly reducedMotion: boolean;
  readonly transition: OutdoorIllustrationTransitionSnapshot | null;
  readonly holdRemainingMs: number;
}

interface TransitionState {
  readonly id: number;
  readonly from: OutdoorIllustrationPageIndex;
  readonly to: OutdoorIllustrationPageIndex;
  elapsedMs: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(value: number): number {
  const progress = clamp01(value);
  return progress * progress * (3 - 2 * progress);
}

function deterministicUnit(seed: number, index: number): number {
  let value = (seed ^ Math.imul(index + 1, 0x9e3779b9)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d) >>> 0;
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b) >>> 0;
  value ^= value >>> 16;
  return (value >>> 0) / 0x1_0000_0000;
}

function pageIndex(value: number): OutdoorIllustrationPageIndex {
  const normalized = Math.max(0, Math.min(
    OUTDOOR_ILLUSTRATION_PAGE_COUNT - 1,
    Math.floor(Number.isFinite(value) ? value : 0),
  ));
  return normalized as OutdoorIllustrationPageIndex;
}

export function outdoorIllustrationQuietGapMs(index: number): number {
  const safeIndex = Math.max(0, Math.floor(Number.isFinite(index) ? index : 0));
  return OUTDOOR_ILLUSTRATION_QUIET_GAP_MIN_MS + Math.round(
    deterministicUnit(OUTDOOR_ILLUSTRATION_SCHEDULE_SEED, safeIndex)
      * (OUTDOOR_ILLUSTRATION_QUIET_GAP_MAX_MS - OUTDOOR_ILLUSTRATION_QUIET_GAP_MIN_MS),
  );
}

/**
 * Pure, persistent page scheduler for the approved R2 illustration wind.
 * Rendering owns two resident sprites; this model only describes which two
 * pages they carry and complementary smoothstep opacity during a transition.
 */
export class OutdoorIllustrationWindPageModel {
  private currentPage: OutdoorIllustrationPageIndex = 0;
  private transitionState: TransitionState | null = null;
  private holdRemainingMs = OUTDOOR_ILLUSTRATION_OPENING_SETTLE_MS;
  private reducedMotion = false;
  private quietGapIndex = 0;
  private nextTransitionId = 1;

  public advance(deltaMs: number): void {
    if (this.reducedMotion) return;
    let remainingMs = Math.max(0, Number.isFinite(deltaMs) ? deltaMs : 0);
    let guard = 0;

    while (guard < 32) {
      guard += 1;
      const transition = this.transitionState;
      if (transition) {
        const availableMs = OUTDOOR_ILLUSTRATION_TRANSITION_MS - transition.elapsedMs;
        if (remainingMs < availableMs) {
          transition.elapsedMs += remainingMs;
          return;
        }

        transition.elapsedMs = OUTDOOR_ILLUSTRATION_TRANSITION_MS;
        remainingMs -= availableMs;
        this.currentPage = transition.to;
        this.transitionState = null;
        this.holdRemainingMs = this.currentPage === 0
          ? outdoorIllustrationQuietGapMs(this.quietGapIndex++)
          : OUTDOOR_ILLUSTRATION_PAGE_HOLD_MS[this.currentPage];
        if (remainingMs === 0) return;
        continue;
      }

      if (!Number.isFinite(this.holdRemainingMs)) return;
      if (remainingMs < this.holdRemainingMs) {
        this.holdRemainingMs -= remainingMs;
        return;
      }

      remainingMs -= this.holdRemainingMs;
      this.holdRemainingMs = 0;
      this.beginTransition(pageIndex((this.currentPage + 1) % OUTDOOR_ILLUSTRATION_PAGE_COUNT));
      if (remainingMs === 0) return;
    }

    throw new Error("Outdoor illustration wind page scheduler exceeded its safety guard");
  }

  /** Starts a complete wind chain only while the scene is resting on F0. */
  public startWind(): boolean {
    if (this.reducedMotion || this.transitionState || this.currentPage !== 0) return false;
    this.holdRemainingMs = 0;
    this.beginTransition(1);
    return true;
  }

  /**
   * Debug/manual target used by visual QA. A rapid third request cannot fit
   * three pages in two sprites, so it first keeps the currently dominant page
   * and immediately retargets the other resident sprite.
   */
  public requestPage(target: number): boolean {
    if (this.reducedMotion) return false;
    const normalizedTarget = pageIndex(target);
    if (this.transitionState) {
      const progress = smoothstep(
        this.transitionState.elapsedMs / OUTDOOR_ILLUSTRATION_TRANSITION_MS,
      );
      this.currentPage = progress >= 0.5
        ? this.transitionState.to
        : this.transitionState.from;
      this.transitionState = null;
    }
    if (normalizedTarget === this.currentPage) return false;
    this.holdRemainingMs = 0;
    this.beginTransition(normalizedTarget);
    return true;
  }

  public setReducedMotion(enabled: boolean): void {
    if (this.reducedMotion === enabled) return;
    this.reducedMotion = enabled;
    this.currentPage = 0;
    this.transitionState = null;
    this.holdRemainingMs = enabled
      ? Number.POSITIVE_INFINITY
      : OUTDOOR_ILLUSTRATION_OPENING_SETTLE_MS;
  }

  public reset(): void {
    this.currentPage = 0;
    this.transitionState = null;
    this.holdRemainingMs = this.reducedMotion
      ? Number.POSITIVE_INFINITY
      : OUTDOOR_ILLUSTRATION_OPENING_SETTLE_MS;
    this.quietGapIndex = 0;
  }

  public snapshot(): OutdoorIllustrationWindPageSnapshot {
    const transition = this.transitionState;
    if (!transition) {
      return {
        currentPage: this.currentPage,
        reducedMotion: this.reducedMotion,
        transition: null,
        holdRemainingMs: this.holdRemainingMs,
      };
    }

    const progress = smoothstep(
      transition.elapsedMs / OUTDOOR_ILLUSTRATION_TRANSITION_MS,
    );
    return {
      currentPage: this.currentPage,
      reducedMotion: this.reducedMotion,
      transition: {
        id: transition.id,
        pages: [transition.from, transition.to],
        progress,
        fromOpacity: 1 - progress,
        toOpacity: progress,
      },
      holdRemainingMs: this.holdRemainingMs,
    };
  }

  private beginTransition(target: OutdoorIllustrationPageIndex): void {
    this.transitionState = {
      id: this.nextTransitionId++,
      from: this.currentPage,
      to: target,
      elapsedMs: 0,
    };
  }
}
