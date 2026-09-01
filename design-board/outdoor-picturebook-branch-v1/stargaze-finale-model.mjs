export const STARGAZE_FINALE_TIMING = Object.freeze({
  settleMs: 900,
  flightMs: 800,
  tailFadeMs: 450,
  quietMs: 1000,
  choiceRevealMs: 180,
  choicesAtMs: 3150,
});

export function getStargazeFinalePhase(elapsedMs) {
  const elapsed = Math.max(0, Number(elapsedMs) || 0);
  const flightAt = STARGAZE_FINALE_TIMING.settleMs;
  const tailAt = flightAt + STARGAZE_FINALE_TIMING.flightMs;
  const quietAt = tailAt + STARGAZE_FINALE_TIMING.tailFadeMs;

  if (elapsed < flightAt) return "settling";
  if (elapsed < tailAt) return "flight";
  if (elapsed < quietAt) return "tail-fade";
  if (elapsed < STARGAZE_FINALE_TIMING.choicesAtMs) return "quiet";
  return "choices";
}

export function resolveStargazeFinaleChoice(choice) {
  if (choice === "home") {
    return { type: "branch", branchKey: "home", frame: 0 };
  }
  if (choice === "stay") {
    return { type: "hub" };
  }
  return null;
}
