import {
  outdoorStoryPointHitsDoor,
  type OutdoorStoryDoorHitArea,
} from "../outdoor-story-b-kf-r1-temp/outdoor-story-transition.ts";

export interface OutdoorDoorUiPoint {
  readonly x: number;
  readonly y: number;
}

export interface OutdoorDoorViewport {
  readonly width: number;
  readonly height: number;
}

const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;

/**
 * Invisible input-only region around the approved warm house.
 *
 * Coordinates are in the 390 x 844 Cocos UI space, whose origin is at the
 * bottom-left. The bottom edge intentionally stays above the nearby glowing
 * flower so that its optional interaction remains independent.
 */
export const OUTDOOR_DOOR_TOUCH_REGION = Object.freeze({
  left: 251,
  right: 383,
  bottom: 151,
  top: 272,
});

export const OUTDOOR_DOOR_MAX_TAP_TRAVEL_PX = 18;

function isFinitePoint(point: OutdoorDoorUiPoint): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

function isInsideDoorRegion(point: OutdoorDoorUiPoint): boolean {
  return isFinitePoint(point)
    && point.x >= OUTDOOR_DOOR_TOUCH_REGION.left
    && point.x <= OUTDOOR_DOOR_TOUCH_REGION.right
    && point.y >= OUTDOOR_DOOR_TOUCH_REGION.bottom
    && point.y <= OUTDOOR_DOOR_TOUCH_REGION.top;
}

export function isOutdoorDoorTap(
  start: OutdoorDoorUiPoint,
  end: OutdoorDoorUiPoint,
): boolean {
  if (!isInsideDoorRegion(start) || !isInsideDoorRegion(end)) return false;
  return Math.hypot(end.x - start.x, end.y - start.y) <= OUTDOOR_DOOR_MAX_TAP_TRAVEL_PX;
}

export function projectOutdoorViewportPointToDesign(
  point: OutdoorDoorUiPoint,
  viewport: OutdoorDoorViewport,
): OutdoorDoorUiPoint {
  if (!isFinitePoint(point) || !Number.isFinite(viewport.width) || !Number.isFinite(viewport.height)) {
    return { x: Number.NaN, y: Number.NaN };
  }
  const scale = Math.min(viewport.width / DESIGN_WIDTH, viewport.height / DESIGN_HEIGHT);
  if (!Number.isFinite(scale) || scale <= 0) return { x: Number.NaN, y: Number.NaN };
  const contentWidth = DESIGN_WIDTH * scale;
  const contentHeight = DESIGN_HEIGHT * scale;
  return {
    x: (point.x - (viewport.width - contentWidth) / 2) / scale,
    y: (point.y - (viewport.height - contentHeight) / 2) / scale,
  };
}

export function isOutdoorDoorTapInViewport(
  start: OutdoorDoorUiPoint,
  end: OutdoorDoorUiPoint,
  viewport: OutdoorDoorViewport,
): boolean {
  return isOutdoorDoorTap(
    projectOutdoorViewportPointToDesign(start, viewport),
    projectOutdoorViewportPointToDesign(end, viewport),
  );
}

function cocosUiPointToStoryDesign(point: OutdoorDoorUiPoint): OutdoorDoorUiPoint {
  return {
    x: point.x,
    y: DESIGN_HEIGHT - point.y,
  };
}

/**
 * Hit-tests one exact B/KF-R1 painted-door set. Story door rectangles use a
 * top-left origin, while Cocos UI touch locations use a bottom-left origin.
 * Keeping the conversion here prevents consumers from accidentally using the
 * enclosing diagnostic bounds and turning the empty gap between two doors
 * into a live target during a transition.
 */
export function isOutdoorStoryDoorTap(
  start: OutdoorDoorUiPoint,
  end: OutdoorDoorUiPoint,
  area: OutdoorStoryDoorHitArea,
): boolean {
  if (!isFinitePoint(start) || !isFinitePoint(end)) return false;
  if (Math.hypot(end.x - start.x, end.y - start.y) > OUTDOOR_DOOR_MAX_TAP_TRAVEL_PX) {
    return false;
  }
  return outdoorStoryPointHitsDoor(cocosUiPointToStoryDesign(start), area)
    && outdoorStoryPointHitsDoor(cocosUiPointToStoryDesign(end), area);
}

export function isOutdoorStoryDoorTapInViewport(
  start: OutdoorDoorUiPoint,
  end: OutdoorDoorUiPoint,
  viewport: OutdoorDoorViewport,
  area: OutdoorStoryDoorHitArea,
): boolean {
  return isOutdoorStoryDoorTap(
    projectOutdoorViewportPointToDesign(start, viewport),
    projectOutdoorViewportPointToDesign(end, viewport),
    area,
  );
}
