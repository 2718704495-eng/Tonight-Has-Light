export type OutdoorSwipeDirection = "left" | "right";

export const OUTDOOR_SLOW_SWIPE_CONTRACT = {
  minHorizontalDistancePx: 48,
  minDurationMs: 240,
  maxSpeedPxPerSecond: 280,
  horizontalDominanceRatio: 1.6,
  cooldownMs: 4_200,
} as const;

export interface OutdoorSlowSwipeCandidate {
  readonly deltaX: number;
  readonly deltaY: number;
  readonly maxAbsVerticalDisplacementPx: number;
  readonly durationMs: number;
  readonly maxSegmentSpeedPxPerSecond: number;
  readonly nowMs: number;
  readonly lastAcceptedAtMs: number | null;
  readonly windActive: boolean;
}

export type OutdoorSlowSwipeResult =
  | {
    readonly accepted: true;
    readonly direction: OutdoorSwipeDirection;
  }
  | {
    readonly accepted: false;
    readonly reason:
      | "invalid"
      | "active"
      | "cooldown"
      | "too-short"
      | "too-fast"
      | "not-horizontal";
  };

/**
 * Pure semantic classifier for the optional "slowly brush the grass" gesture.
 * It deliberately rejects quick flicks and vertical scrolling attempts.
 */
export function classifyOutdoorSlowSwipe(
  candidate: OutdoorSlowSwipeCandidate,
): OutdoorSlowSwipeResult {
  const values = [
    candidate.deltaX,
    candidate.deltaY,
    candidate.maxAbsVerticalDisplacementPx,
    candidate.durationMs,
    candidate.maxSegmentSpeedPxPerSecond,
    candidate.nowMs,
  ];
  if (!values.every(Number.isFinite) || candidate.durationMs <= 0) {
    return { accepted: false, reason: "invalid" };
  }
  if (candidate.windActive) return { accepted: false, reason: "active" };
  if (
    candidate.lastAcceptedAtMs !== null
    && candidate.nowMs - candidate.lastAcceptedAtMs < OUTDOOR_SLOW_SWIPE_CONTRACT.cooldownMs
  ) {
    return { accepted: false, reason: "cooldown" };
  }

  const horizontalDistance = Math.abs(candidate.deltaX);
  if (
    horizontalDistance < OUTDOOR_SLOW_SWIPE_CONTRACT.minHorizontalDistancePx
    || candidate.durationMs < OUTDOOR_SLOW_SWIPE_CONTRACT.minDurationMs
  ) {
    return { accepted: false, reason: "too-short" };
  }

  const averageSpeed = horizontalDistance / candidate.durationMs * 1_000;
  if (
    averageSpeed > OUTDOOR_SLOW_SWIPE_CONTRACT.maxSpeedPxPerSecond
    || candidate.maxSegmentSpeedPxPerSecond > OUTDOOR_SLOW_SWIPE_CONTRACT.maxSpeedPxPerSecond
  ) {
    return { accepted: false, reason: "too-fast" };
  }

  const verticalDistance = Math.max(
    Math.abs(candidate.deltaY),
    Math.abs(candidate.maxAbsVerticalDisplacementPx),
  );
  if (
    horizontalDistance
    < verticalDistance * OUTDOOR_SLOW_SWIPE_CONTRACT.horizontalDominanceRatio
  ) {
    return { accepted: false, reason: "not-horizontal" };
  }

  return {
    accepted: true,
    direction: candidate.deltaX < 0 ? "left" : "right",
  };
}
