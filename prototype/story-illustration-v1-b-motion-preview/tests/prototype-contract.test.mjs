import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function source(file) {
  return readFile(resolve(root, file), "utf8");
}

test("preview declares all three approved exploration frames and the bright-room return", async () => {
  const html = await source("index.html");
  assert.match(html, /b01-settle-reference-r1\.png/);
  assert.match(html, /b02-wind-passes-r1\.png/);
  assert.match(html, /b03-afterwind-detail-r1\.png/);
  assert.match(html, /concept-bright-home-dinner-exploration-v1-2\.png/);
  assert.match(html, /id="doorHit"/);
  assert.match(html, /id="windAudio"/);
});

test("scene contains no task, reward, countdown, or progress HUD", async () => {
  const html = await source("index.html");
  const scene = html.match(/<section id="storyScene"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.ok(scene.length > 0, "storyScene section must exist");
  assert.doesNotMatch(scene, /任务|奖励|进度|倒计时|下一步/);
  assert.doesNotMatch(scene, /<h[1-6]|<p\b|class="hud/);
});

test("motion uses only transform, opacity, and clipping and has a reduced-motion path", async () => {
  const css = await source("styles.css");
  const app = await source("app.mjs");
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /--room-transition:\s*160ms/);
  assert.doesNotMatch(app, /style\.(?:width|height|top|left|margin|padding)\s*=/);
  assert.match(app, /cancel\("door"\)/);
  assert.match(app, /setReducedMotion/);
});

test("the in-page reduced-motion control also shortens room entry to 160ms", async () => {
  const css = await source("styles.css");
  const app = await source("app.mjs");
  assert.match(
    css,
    /\.story-scene\.is-reduced-motion[\s\S]*?--room-transition:\s*160ms/,
  );
  assert.match(
    app,
    /scene\.classList\.toggle\("is-reduced-motion",\s*value\)/,
  );
});

test("horizontal replay gestures remain available while vertical page scrolling is preserved", async () => {
  const css = await source("styles.css");
  assert.match(css, /touch-action:\s*pan-y/);
  assert.doesNotMatch(css, /touch-action:\s*pan-x\s+pan-y/);
});

test("visual QA can freeze an exact timeline millisecond without changing production state", async () => {
  const app = await source("app.mjs");
  assert.match(app, /new URLSearchParams\(window\.location\.search\)/);
  assert.match(app, /freezeFrame/);
  assert.match(app, /debugElapsed/);
});

test("audio gate exposes locked, playing, and blocked diagnostics", async () => {
  const app = await source("app.mjs");
  assert.match(app, /scene\.dataset\.audio = "locked"/);
  assert.match(app, /scene\.dataset\.audio = "playing"/);
  assert.match(app, /scene\.dataset\.audio = "blocked"/);
});

test("prototype labels exploration assets as disposable and never production-ready", async () => {
  const html = await source("index.html");
  const readme = await source("README.md");
  assert.match(html, /本地可丢弃体验样片/);
  assert.match(readme, /prototype-only/);
  assert.match(readme, /不得进入 Cocos|DO NOT COCOS/);
  assert.match(readme, /不得上传|NO UPLOAD/);
});
