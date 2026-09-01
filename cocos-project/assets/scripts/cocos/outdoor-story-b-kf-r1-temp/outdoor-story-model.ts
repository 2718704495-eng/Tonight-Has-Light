export const OUTDOOR_STORY_TIMING = Object.freeze({
  settleHoldMs: 3_200,
  firstTransitionMs: 300,
  windHoldMs: 1_500,
  secondTransitionMs: 360,
});

export type OutdoorStoryFrame = "B01" | "B02" | "B03";

export type OutdoorStoryTransitionPhase = "to-wind" | "to-afterwind";

export type OutdoorStoryPhase =
  | "settle"
  | OutdoorStoryTransitionPhase
  | "wind"
  | "afterwind"
  | "cancelled";

export interface OutdoorStorySnapshot {
  readonly elapsedMs: number;
  readonly phase: OutdoorStoryPhase;
  readonly fromFrame: OutdoorStoryFrame;
  readonly toFrame: OutdoorStoryFrame;
  readonly transitionProgress: number;
  readonly fromOpacity: number;
  readonly toOpacity: number;
  readonly resting: boolean;
  readonly reducedMotion: boolean;
  readonly cancelled: boolean;
  readonly entryRequest: "door" | null;
}

export interface OutdoorStorySnapshotOptions {
  readonly reducedMotion?: boolean;
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function safeElapsedMs(value: number): number {
  if (Number.isNaN(value) || value <= 0) return 0;
  if (!Number.isFinite(value)) return Number.MAX_SAFE_INTEGER;
  return Math.min(value, Number.MAX_SAFE_INTEGER);
}

function restingSnapshot(
  elapsedMs: number,
  phase: "settle" | "wind" | "afterwind",
  frame: OutdoorStoryFrame,
  reducedMotion: boolean,
): OutdoorStorySnapshot {
  return {
    elapsedMs,
    phase,
    fromFrame: frame,
    toFrame: frame,
    transitionProgress: 0,
    fromOpacity: 1,
    toOpacity: 0,
    resting: true,
    reducedMotion,
    cancelled: false,
    entryRequest: null,
  };
}

function transitionSnapshot(
  elapsedMs: number,
  phase: OutdoorStoryTransitionPhase,
  fromFrame: OutdoorStoryFrame,
  toFrame: OutdoorStoryFrame,
  rawProgress: number,
): OutdoorStorySnapshot {
  const progress = outdoorStorySmoothstep(rawProgress);
  return {
    elapsedMs,
    phase,
    fromFrame,
    toFrame,
    transitionProgress: progress,
    fromOpacity: 1 - progress,
    toOpacity: progress,
    resting: false,
    reducedMotion: false,
    cancelled: false,
    entryRequest: null,
  };
}

export function outdoorStorySmoothstep(value: number): number {
  const progress = clamp01(value);
  return progress * progress * (3 - 2 * progress);
}

/**
 * Samples the approved one-shot B01 -> B02 -> B03 story. Time alone can
 * never request room entry, and B03 has no wraparound branch.
 */
export function outdoorStorySnapshotAt(
  elapsedMs: number,
  options: OutdoorStorySnapshotOptions = {},
): OutdoorStorySnapshot {
  if (options.reducedMotion) {
    return restingSnapshot(0, "settle", "B01", true);
  }

  const elapsed = safeElapsedMs(elapsedMs);
  const firstTransitionStart = OUTDOOR_STORY_TIMING.settleHoldMs;
  const windStart = firstTransitionStart + OUTDOOR_STORY_TIMING.firstTransitionMs;
  const secondTransitionStart = windStart + OUTDOOR_STORY_TIMING.windHoldMs;
  const afterwindStart = secondTransitionStart + OUTDOOR_STORY_TIMING.secondTransitionMs;

  if (elapsed < firstTransitionStart) {
    return restingSnapshot(elapsed, "settle", "B01", false);
  }
  if (elapsed < windStart) {
    return transitionSnapshot(
      elapsed,
      "to-wind",
      "B01",
      "B02",
      (elapsed - firstTransitionStart) / OUTDOOR_STORY_TIMING.firstTransitionMs,
    );
  }
  if (elapsed < secondTransitionStart) {
    return restingSnapshot(elapsed, "wind", "B02", false);
  }
  if (elapsed < afterwindStart) {
    return transitionSnapshot(
      elapsed,
      "to-afterwind",
      "B02",
      "B03",
      (elapsed - secondTransitionStart) / OUTDOOR_STORY_TIMING.secondTransitionMs,
    );
  }
  return restingSnapshot(elapsed, "afterwind", "B03", false);
}

/**
 * Mutable clock wrapper around the pure sampler. It owns no timers or
 * callbacks, so cancelling it synchronously prevents every later advance
 * from changing the visible page. Explicit replay is the only reset path.
 */
export class OutdoorStoryPlaybackModel {
  private elapsedMs = 0;
  private reducedMotion = false;
  private cancelledSnapshot: OutdoorStorySnapshot | null = null;

  public advance(deltaMs: number): OutdoorStorySnapshot {
    if (this.cancelledSnapshot || this.reducedMotion) return this.snapshot();
    const delta = Number.isFinite(deltaMs) && deltaMs > 0 ? deltaMs : 0;
    this.elapsedMs = Math.min(Number.MAX_SAFE_INTEGER, this.elapsedMs + delta);
    return this.snapshot();
  }

  public snapshot(): OutdoorStorySnapshot {
    return this.cancelledSnapshot ?? outdoorStorySnapshotAt(this.elapsedMs, {
      reducedMotion: this.reducedMotion,
    });
  }

  public replay(): OutdoorStorySnapshot {
    this.elapsedMs = 0;
    this.cancelledSnapshot = null;
    return this.snapshot();
  }

  public setReducedMotion(enabled: boolean): OutdoorStorySnapshot {
    if (this.cancelledSnapshot) return this.cancelledSnapshot;
    const next = Boolean(enabled);
    if (next !== this.reducedMotion) {
      this.reducedMotion = next;
      this.elapsedMs = 0;
    }
    return this.snapshot();
  }

  public requestDoorEntry(): boolean {
    return this.cancel("door");
  }

  public cancel(reason: "door" | "cancelled" = "cancelled"): boolean {
    if (this.cancelledSnapshot) return false;
    const visible = this.snapshot();
    const frame = visible.toOpacity > visible.fromOpacity
      ? visible.toFrame
      : visible.fromFrame;
    this.cancelledSnapshot = {
      elapsedMs: visible.elapsedMs,
      phase: "cancelled",
      fromFrame: frame,
      toFrame: frame,
      transitionProgress: 0,
      fromOpacity: 1,
      toOpacity: 0,
      resting: true,
      reducedMotion: visible.reducedMotion,
      cancelled: true,
      entryRequest: reason === "door" ? "door" : null,
    };
    return true;
  }
}
