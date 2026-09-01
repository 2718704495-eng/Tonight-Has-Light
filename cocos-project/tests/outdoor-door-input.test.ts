import test from "node:test";
import assert from "node:assert/strict";
import {
  OUTDOOR_DOOR_MAX_TAP_TRAVEL_PX,
  OUTDOOR_DOOR_TOUCH_REGION,
  isOutdoorDoorTap,
  isOutdoorDoorTapInViewport,
  isOutdoorStoryDoorTap,
  isOutdoorStoryDoorTapInViewport,
  projectOutdoorViewportPointToDesign,
} from "../assets/scripts/cocos/outdoor-gate-c/outdoor-door-input.ts";
import {
  outdoorStoryDoorHitArea,
} from "../assets/scripts/cocos/outdoor-story-b-kf-r1-temp/outdoor-story-transition.ts";

function viewportPointFromDesign(
  designPoint: { readonly x: number; readonly y: number },
  viewport: { readonly width: number; readonly height: number },
): { readonly x: number; readonly y: number } {
  const scale = Math.min(viewport.width / 390, viewport.height / 844);
  return {
    x: (viewport.width - 390 * scale) / 2 + designPoint.x * scale,
    y: (viewport.height - 844 * scale) / 2 + designPoint.y * scale,
  };
}

function assertNearlyEqual(actual: number, expected: number): void {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} should be nearly ${expected}`);
}

test("the invisible outdoor door region covers the warm house without stealing the nearby flower", () => {
  assert.deepEqual(OUTDOOR_DOOR_TOUCH_REGION, {
    left: 251,
    right: 383,
    bottom: 151,
    top: 272,
  });

  assert.equal(isOutdoorDoorTap({ x: 317, y: 204 }, { x: 317, y: 204 }), true);
  assert.equal(isOutdoorDoorTap({ x: 270, y: 155 }, { x: 270, y: 155 }), true);
  assert.equal(isOutdoorDoorTap({ x: 370, y: 250 }, { x: 370, y: 250 }), true);

  // The right-hand glowing flower is centred around (321, 118). It remains
  // independent, including the top edge of its 64px interaction target.
  assert.equal(isOutdoorDoorTap({ x: 321, y: 118 }, { x: 321, y: 118 }), false);
  assert.equal(isOutdoorDoorTap({ x: 321, y: 150 }, { x: 321, y: 150 }), false);
  assert.equal(isOutdoorDoorTap({ x: 195, y: 80 }, { x: 195, y: 80 }), false);
  assert.equal(isOutdoorDoorTap({ x: 195, y: 600 }, { x: 195, y: 600 }), false);
});

test("the global WeChat fallback accepts taps but rejects swipes across the house", () => {
  assert.equal(OUTDOOR_DOOR_MAX_TAP_TRAVEL_PX, 18);
  assert.equal(isOutdoorDoorTap({ x: 310, y: 190 }, { x: 324, y: 198 }), true);
  assert.equal(isOutdoorDoorTap({ x: 310, y: 190 }, { x: 329, y: 190 }), false);
  assert.equal(isOutdoorDoorTap({ x: 250, y: 190 }, { x: 260, y: 190 }), false);
  assert.equal(isOutdoorDoorTap({ x: 310, y: 190 }, { x: 390, y: 190 }), false);
});

test("the WeChat fallback also accepts SHOW_ALL viewport-space phone taps", () => {
  const viewports = [
    { width: 360, height: 800 },
    { width: 430, height: 932 },
    { width: 430, height: 844 },
  ] as const;

  for (const viewport of viewports) {
    const start = viewportPointFromDesign({ x: 317, y: 211.5 }, viewport);
    const end = viewportPointFromDesign({ x: 323, y: 214 }, viewport);
    const miss = viewportPointFromDesign({ x: 180, y: 211.5 }, viewport);
    assert.equal(isOutdoorDoorTapInViewport(start, end, viewport), true);
    assert.equal(isOutdoorDoorTapInViewport(miss, miss, viewport), false);
    const projected = projectOutdoorViewportPointToDesign(start, viewport);
    assertNearlyEqual(projected.x, 317);
    assertNearlyEqual(projected.y, 211.5);
  }
});

test("viewport-space fallback never treats raw pixels as design coordinates", () => {
  const viewport = { width: 430, height: 844 } as const;
  const rawPoint = { x: 260, y: 200 } as const;

  // Raw (260, 200) happens to overlap the 390-wide design region numerically,
  // but SHOW_ALL adds a 20px horizontal bar, so its real design x is 240 and
  // must remain outside the door.
  assert.equal(isOutdoorDoorTap(rawPoint, rawPoint), true);
  const projected = projectOutdoorViewportPointToDesign(rawPoint, viewport);
  assertNearlyEqual(projected.x, 240);
  assert.equal(isOutdoorDoorTapInViewport(rawPoint, rawPoint, viewport), false);
});

test("the B story door fallback follows each painted door instead of one legacy house region", () => {
  const b01 = outdoorStoryDoorHitArea("B01");
  const b02 = outdoorStoryDoorHitArea("B02");
  const b03 = outdoorStoryDoorHitArea("B03");

  // Door areas are authored in top-left design coordinates. Runtime touch
  // locations use the Cocos bottom-left UI convention.
  assert.equal(isOutdoorStoryDoorTap({ x: 323, y: 304 }, { x: 323, y: 304 }, b01), true);
  assert.equal(isOutdoorStoryDoorTap({ x: 358, y: 402 }, { x: 358, y: 402 }, b02), true);
  assert.equal(isOutdoorStoryDoorTap({ x: 309, y: 525 }, { x: 309, y: 525 }, b03), true);

  assert.equal(isOutdoorStoryDoorTap({ x: 358, y: 402 }, { x: 358, y: 402 }, b01), false);
  assert.equal(isOutdoorStoryDoorTap({ x: 309, y: 525 }, { x: 309, y: 525 }, b02), false);
  assert.equal(isOutdoorStoryDoorTap({ x: 323, y: 304 }, { x: 323, y: 304 }, b03), false);
});

test("a B story transition accepts either painted door but not the empty gap between them", () => {
  const transition = outdoorStoryDoorHitArea("B01", "B02");

  assert.equal(isOutdoorStoryDoorTap({ x: 323, y: 304 }, { x: 323, y: 304 }, transition), true);
  assert.equal(isOutdoorStoryDoorTap({ x: 358, y: 402 }, { x: 358, y: 402 }, transition), true);
  assert.equal(isOutdoorStoryDoorTap({ x: 340, y: 353 }, { x: 340, y: 353 }, transition), false);
  assert.equal(
    isOutdoorStoryDoorTap({ x: 323, y: 304 }, { x: 342, y: 304 }, transition),
    false,
    "door fallback must keep the existing 18px tap-travel limit",
  );
});

test("the B story exact-union fallback survives SHOW_ALL viewport projection", () => {
  const transition = outdoorStoryDoorHitArea("B02", "B03");
  const viewports = [
    { width: 360, height: 800 },
    { width: 430, height: 932 },
    { width: 430, height: 844 },
  ] as const;

  for (const viewport of viewports) {
    const b02 = viewportPointFromDesign({ x: 358, y: 402 }, viewport);
    const b03 = viewportPointFromDesign({ x: 309, y: 525 }, viewport);
    const miss = viewportPointFromDesign({ x: 200, y: 420 }, viewport);
    assert.equal(isOutdoorStoryDoorTapInViewport(b02, b02, viewport, transition), true);
    assert.equal(isOutdoorStoryDoorTapInViewport(b03, b03, viewport, transition), true);
    assert.equal(isOutdoorStoryDoorTapInViewport(miss, miss, viewport, transition), false);
  }
});
