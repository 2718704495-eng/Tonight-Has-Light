import test from "node:test";
import assert from "node:assert/strict";

import {
  getPreviewScrollBehavior,
  getPreviewStageSize,
} from "../preview-layout-model.mjs";

test("矮桌面窗口会等比缩小完整 390×844 舞台，而不是上下裁掉背景", () => {
  assert.deepEqual(getPreviewStageSize({ viewportWidth: 1280, viewportHeight: 720 }), {
    width: 310.521,
    height: 672,
    layout: "desktop",
  });
});

test("360/390/430 手机宽度保留完整舞台且不横向溢出", () => {
  assert.deepEqual(getPreviewStageSize({ viewportWidth: 360, viewportHeight: 800 }), {
    width: 344,
    height: 744.451,
    layout: "mobile",
  });
  assert.deepEqual(getPreviewStageSize({ viewportWidth: 390, viewportHeight: 844 }), {
    width: 366,
    height: 792.062,
    layout: "mobile",
  });
  assert.deepEqual(getPreviewStageSize({ viewportWidth: 430, viewportHeight: 932 }), {
    width: 390,
    height: 844,
    layout: "mobile",
  });
});

test("极窄或极矮窗口仍以可用宽高的较小值为准", () => {
  const result = getPreviewStageSize({ viewportWidth: 320, viewportHeight: 568 });
  assert.equal(result.layout, "mobile");
  assert.ok(result.width <= 304);
  assert.ok(result.height <= 536);
  assert.ok(Math.abs(result.width / result.height - 390 / 844) < 0.000002);
});

test("手动或系统减少动态都会关闭自动平滑滚动", () => {
  assert.equal(getPreviewScrollBehavior({ manualReducedMotion: false, systemReducedMotion: false }), "smooth");
  assert.equal(getPreviewScrollBehavior({ manualReducedMotion: true, systemReducedMotion: false }), "auto");
  assert.equal(getPreviewScrollBehavior({ manualReducedMotion: false, systemReducedMotion: true }), "auto");
});
