export const STORY_TIMING = Object.freeze({
  settleHold: 3_200,
  firstTransition: 300,
  windHold: 1_500,
  secondTransition: 360,
});

function smoothstep(value) {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function resting(phase, frame) {
  return {
    phase,
    from: frame,
    to: frame,
    progress: 0,
    resting: true,
  };
}

export function snapshotAt(elapsedMs, { reducedMotion = false } = {}) {
  if (reducedMotion) return resting("settle", 0);

  const elapsed = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0);
  const firstStart = STORY_TIMING.settleHold;
  const windStart = firstStart + STORY_TIMING.firstTransition;
  const secondStart = windStart + STORY_TIMING.windHold;
  const afterwindStart = secondStart + STORY_TIMING.secondTransition;

  if (elapsed < firstStart) return resting("settle", 0);
  if (elapsed < windStart) {
    return {
      phase: "to-wind",
      from: 0,
      to: 1,
      progress: smoothstep((elapsed - firstStart) / STORY_TIMING.firstTransition),
      resting: false,
    };
  }
  if (elapsed < secondStart) return resting("wind", 1);
  if (elapsed < afterwindStart) {
    return {
      phase: "to-afterwind",
      from: 1,
      to: 2,
      progress: smoothstep((elapsed - secondStart) / STORY_TIMING.secondTransition),
      resting: false,
    };
  }
  return resting("afterwind", 2);
}

export function createStoryPlayback({ startedAt = 0, reducedMotion = false } = {}) {
  let origin = startedAt;
  let reduced = Boolean(reducedMotion);
  let cancelledReason = null;

  return {
    snapshot(now) {
      if (cancelledReason) {
        return {
          ...resting("cancelled", 0),
          reason: cancelledReason,
        };
      }
      return snapshotAt(now - origin, { reducedMotion: reduced });
    },

    replay(now) {
      origin = now;
      cancelledReason = null;
    },

    cancel(reason = "cancelled") {
      cancelledReason = reason;
    },

    setReducedMotion(value, now) {
      reduced = Boolean(value);
      origin = now;
      cancelledReason = null;
    },

    isCancelled() {
      return cancelledReason !== null;
    },
  };
}

