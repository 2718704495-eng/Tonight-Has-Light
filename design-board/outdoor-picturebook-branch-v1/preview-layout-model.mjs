const STAGE_WIDTH = 390;
const STAGE_HEIGHT = 844;
const MOBILE_BREAKPOINT = 760;

function roundToThousandth(value) {
  return Number(value.toFixed(3));
}

export function getPreviewScrollBehavior({ manualReducedMotion, systemReducedMotion }) {
  return manualReducedMotion || systemReducedMotion ? "auto" : "smooth";
}

export function getPreviewStageSize({ viewportWidth, viewportHeight }) {
  const safeViewportWidth = Math.max(1, Number(viewportWidth) || STAGE_WIDTH);
  const safeViewportHeight = Math.max(1, Number(viewportHeight) || STAGE_HEIGHT);
  const isMobileLayout = safeViewportWidth <= MOBILE_BREAKPOINT;
  const horizontalInset = isMobileLayout ? (safeViewportWidth <= 380 ? 16 : 24) : 48;
  const verticalInset = isMobileLayout ? 32 : 48;
  const widthFromViewport = Math.max(1, safeViewportWidth - horizontalInset);
  const widthFromHeight = Math.max(1, safeViewportHeight - verticalInset) * STAGE_WIDTH / STAGE_HEIGHT;
  const width = Math.min(STAGE_WIDTH, widthFromViewport, widthFromHeight);
  const height = width * STAGE_HEIGHT / STAGE_WIDTH;

  return {
    width: roundToThousandth(width),
    height: roundToThousandth(height),
    layout: isMobileLayout ? "mobile" : "desktop",
  };
}
