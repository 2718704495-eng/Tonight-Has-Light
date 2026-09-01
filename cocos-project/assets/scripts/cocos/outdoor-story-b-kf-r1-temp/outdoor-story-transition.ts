import type {
  OutdoorStoryFrame,
  OutdoorStoryTransitionPhase,
} from "./outdoor-story-model";

export const OUTDOOR_STORY_DESIGN_SIZE = Object.freeze({
  width: 390,
  height: 844,
});

export interface OutdoorStoryPercentPoint {
  readonly xPercent: number;
  readonly yPercent: number;
}

export interface OutdoorStoryTransitionGeometry {
  readonly orientation: "bottom-up-grass-line";
  readonly revealEdge: {
    readonly leftYPercent: number;
    readonly rightYPercent: number;
  };
  readonly revealPolygon: readonly OutdoorStoryPercentPoint[];
  readonly inkBand: {
    readonly xPercent: number;
    readonly yPercent: number;
    readonly widthPercent: number;
    readonly heightPercent: number;
    readonly translateYPercent: number;
    readonly angleDegrees: number;
    readonly opacity: number;
  };
}

export interface OutdoorStoryRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface OutdoorStoryPoint {
  readonly x: number;
  readonly y: number;
}

export interface OutdoorStoryDoorHitArea {
  /** Exact set union; consumers should hit-test these rects, not `bounds`. */
  readonly rects: readonly OutdoorStoryRect[];
  /** Enclosing bounds for diagnostics and optional layout visualization. */
  readonly bounds: OutdoorStoryRect;
}

const DOOR_HIT_RECTS: Readonly<Record<OutdoorStoryFrame, OutdoorStoryRect>> = {
  B01: { x: 291, y: 504, width: 64, height: 72 },
  B02: { x: 326, y: 406, width: 64, height: 72 },
  B03: { x: 277, y: 283, width: 64, height: 72 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function progress01(value: number): number {
  const numeric = Number(value);
  return clamp(Number.isNaN(numeric) ? 0 : numeric, 0, 1);
}

function copyRect(rect: OutdoorStoryRect): OutdoorStoryRect {
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
}

function enclosingBounds(rects: readonly OutdoorStoryRect[]): OutdoorStoryRect {
  const left = Math.min(...rects.map((rect) => rect.x));
  const top = Math.min(...rects.map((rect) => rect.y));
  const right = Math.max(...rects.map((rect) => rect.x + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

/**
 * Pure-data equivalent of the approved browser `transition-geometry.mjs`.
 * It deliberately contains no CSS strings or Cocos objects.
 */
export function outdoorStoryTransitionGeometry(
  phase: OutdoorStoryTransitionPhase,
  progressValue: number,
): OutdoorStoryTransitionGeometry {
  const progress = progress01(progressValue);
  const first = phase === "to-wind";
  const leftYPercent = first
    ? clamp(112 - progress * 128, -16, 112)
    : clamp(122 - progress * 134, -16, 122);
  const rightYPercent = first
    ? clamp(126 - progress * 128, -2, 126)
    : clamp(102 - progress * 118, -16, 102);
  const translateYPercent = 420 - progress * 470;
  const angleDegrees = first ? -4 : 4;
  const opacity = progress === 0 || progress === 1
    ? 0
    : Math.sin(Math.PI * progress) * 0.82;

  return {
    orientation: "bottom-up-grass-line",
    revealEdge: { leftYPercent, rightYPercent },
    revealPolygon: [
      { xPercent: 0, yPercent: leftYPercent },
      { xPercent: 100, yPercent: rightYPercent },
      { xPercent: 100, yPercent: 100 },
      { xPercent: 0, yPercent: 100 },
    ],
    inkBand: {
      xPercent: -15,
      yPercent: 0,
      widthPercent: 130,
      heightPercent: 24,
      translateYPercent,
      angleDegrees,
      opacity,
    },
  };
}

/**
 * Door rectangles use top-left 390x844 design coordinates. During a page
 * transition the active area is the exact set union of both painted doors.
 */
export function outdoorStoryDoorHitArea(
  fromFrame: OutdoorStoryFrame,
  toFrame: OutdoorStoryFrame = fromFrame,
): OutdoorStoryDoorHitArea {
  const fromRect = copyRect(DOOR_HIT_RECTS[fromFrame]);
  const rects = fromFrame === toFrame
    ? [fromRect]
    : [fromRect, copyRect(DOOR_HIT_RECTS[toFrame])];
  return {
    rects,
    bounds: enclosingBounds(rects),
  };
}

export function outdoorStoryPointHitsDoor(
  point: OutdoorStoryPoint,
  area: OutdoorStoryDoorHitArea,
): boolean {
  return area.rects.some((rect) => (
    point.x >= rect.x
    && point.x <= rect.x + rect.width
    && point.y >= rect.y
    && point.y <= rect.y + rect.height
  ));
}
