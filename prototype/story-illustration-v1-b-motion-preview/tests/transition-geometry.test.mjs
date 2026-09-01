import assert from "node:assert/strict";
import test from "node:test";

import { transitionGeometry } from "../transition-geometry.mjs";

test("both transitions reveal from the lower grass edge rather than a vertical split", () => {
  for (const phase of ["to-wind", "to-afterwind"]) {
    const geometry = transitionGeometry(phase, 0.5);
    assert.equal(geometry.orientation, "bottom-up-grass-line");
    assert.match(
      geometry.clipPath,
      /^polygon\(0 [-\d.]+%, 100% [-\d.]+%, 100% 100%, 0 100%\)$/,
    );
    assert.ok(geometry.leftEdge > 0 && geometry.leftEdge < 100);
    assert.ok(geometry.rightEdge > 0 && geometry.rightEdge < 100);
    assert.ok(Math.abs(geometry.leftEdge - geometry.rightEdge) >= 10);
    assert.match(geometry.inkTransform, /^translate3d\(0, [-\d.]+%, 0\) rotate\(/);
  }
});

test("transition geometry fully covers the frame at progress one", () => {
  for (const phase of ["to-wind", "to-afterwind"]) {
    const geometry = transitionGeometry(phase, 1);
    assert.ok(geometry.leftEdge <= 0);
    assert.ok(geometry.rightEdge <= 0);
    assert.equal(geometry.inkOpacity, 0);
  }
});
