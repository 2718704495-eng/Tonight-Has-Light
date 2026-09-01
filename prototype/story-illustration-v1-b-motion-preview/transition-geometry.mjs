function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function transitionGeometry(phase, progressValue) {
  const progress = clamp(Number(progressValue) || 0, 0, 1);
  const first = phase === "to-wind";
  const leftEdge = first
    ? clamp(112 - progress * 128, -16, 112)
    : clamp(122 - progress * 134, -16, 122);
  const rightEdge = first
    ? clamp(126 - progress * 128, -2, 126)
    : clamp(102 - progress * 118, -16, 102);
  const translate = 420 - progress * 470;
  const angle = first ? -4 : 4;

  return {
    orientation: "bottom-up-grass-line",
    leftEdge,
    rightEdge,
    clipPath: `polygon(0 ${leftEdge}%, 100% ${rightEdge}%, 100% 100%, 0 100%)`,
    inkTransform: `translate3d(0, ${translate}%, 0) rotate(${angle}deg)`,
    inkOpacity:
      progress === 0 || progress === 1 ? 0 : Math.sin(Math.PI * progress) * 0.82,
  };
}
