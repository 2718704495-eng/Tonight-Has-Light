export function envelopeProgress(now, startedAt, duration) {
  if (!Number.isFinite(duration) || duration <= 0) return 1;
  const raw = (now - startedAt) / duration;
  return Math.max(0, Math.min(1, raw));
}

