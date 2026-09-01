export interface OutdoorGateCViewportResult {
  readonly scale: number;
  readonly viewport: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
  readonly rootScale: {
    readonly x: number;
    readonly y: number;
  };
  readonly contentRect: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
}

const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;
const NEAR_MATCH_EPSILON_PX = 0.001;
const ENGINE_NEAR_MATCH_TOLERANCE_PX = 2;

function engineViewportSize(containerSize: number, contentSize: number): number {
  const slack = containerSize - contentSize;
  return Math.abs(slack) < ENGINE_NEAR_MATCH_TOLERANCE_PX ? containerSize : contentSize;
}

function rootScaleForWholePixelBars(containerSize: number, contentSize: number): number {
  const slack = containerSize - contentSize;
  if (slack <= NEAR_MATCH_EPSILON_PX || slack >= ENGINE_NEAR_MATCH_TOLERANCE_PX) return 1;
  const wholePixelBar = Math.max(1, Math.round(slack / 2));
  return (containerSize - wholePixelBar * 2) / contentSize;
}

function normalizeNearInteger(value: number): number {
  const rounded = Math.round(value);
  return Math.abs(value - rounded) < 1e-9 ? rounded : value;
}

/**
 * Mirrors SHOW_ALL. When Cocos expands a sub-2px letterbox to the full viewport,
 * it returns a root-only correction that preserves one whole safety pixel on
 * both sides while leaving every ordinary SHOW_ALL case untouched.
 */
export function computeOutdoorGateCPixelAlignedViewport(
  containerWidth: number,
  containerHeight: number,
): OutdoorGateCViewportResult {
  const scale = Math.min(containerWidth / DESIGN_WIDTH, containerHeight / DESIGN_HEIGHT);
  const rawWidth = DESIGN_WIDTH * scale;
  const rawHeight = DESIGN_HEIGHT * scale;
  const rootScaleX = rootScaleForWholePixelBars(containerWidth, rawWidth);
  const rootScaleY = rootScaleForWholePixelBars(containerHeight, rawHeight);
  const contentWidth = normalizeNearInteger(rawWidth * rootScaleX);
  const contentHeight = normalizeNearInteger(rawHeight * rootScaleY);
  const viewportWidth = engineViewportSize(containerWidth, rawWidth);
  const viewportHeight = engineViewportSize(containerHeight, rawHeight);
  return {
    scale,
    viewport: {
      x: Math.round((containerWidth - viewportWidth) / 2),
      y: Math.round((containerHeight - viewportHeight) / 2),
      width: viewportWidth,
      height: viewportHeight,
    },
    rootScale: {
      x: rootScaleX,
      y: rootScaleY,
    },
    contentRect: {
      x: normalizeNearInteger((containerWidth - contentWidth) / 2),
      y: normalizeNearInteger((containerHeight - contentHeight) / 2),
      width: contentWidth,
      height: contentHeight,
    },
  };
}
