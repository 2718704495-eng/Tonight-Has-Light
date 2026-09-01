import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "/Users/wxl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const BUILD_ID = process.env.GATE_C_BUILD_ID ?? "gate-c-v7-20260821-41b0b7b1-showall-navy-r5";
const baseUrl = process.env.GATE_C_BASE_URL ?? "http://127.0.0.1:4173";
const evidenceRoot = resolve(
  "/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/gate-c-cocos-evidence",
  BUILD_ID,
);
await mkdir(evidenceRoot, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--enable-precise-memory-info", "--enable-webgl", "--ignore-gpu-blocklist"],
});
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const consoleErrors = [];
const pageErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => pageErrors.push(error.message));

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.waitForFunction(() => globalThis.__OUTDOOR_GATE_C__?.snapshot().mounted === true);
await page.waitForTimeout(1_000);
const metrics = await page.evaluate(async () => {
  globalThis.__OUTDOOR_GATE_C__.replay();
  const intervals = [];
  await new Promise((resolveFrames) => {
    const start = performance.now();
    let previous = start;
    const capture = (now) => {
      intervals.push(now - previous);
      previous = now;
      if (now - start < 5_000) requestAnimationFrame(capture);
      else resolveFrames();
    };
    requestAnimationFrame(capture);
  });
  const filtered = intervals.slice(1).filter((value) => value > 0 && value < 250);
  const sorted = [...filtered].sort((a, b) => a - b);
  const averageFrameMs = filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
  const percentile = (ratio) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))] ?? 0;
  const gl = document.querySelector("canvas")?.getContext("webgl2")
    ?? document.querySelector("canvas")?.getContext("webgl");
  const rendererInfo = gl?.getExtension("WEBGL_debug_renderer_info");
  return {
    sampledFrames: filtered.length,
    averageFrameMs,
    averageFps: 1_000 / averageFrameMs,
    p95FrameMs: percentile(0.95),
    p99FrameMs: percentile(0.99),
    jsHeapUsedBytes: performance.memory?.usedJSHeapSize ?? null,
    jsHeapTotalBytes: performance.memory?.totalJSHeapSize ?? null,
    renderer: rendererInfo ? gl.getParameter(rendererInfo.UNMASKED_RENDERER_WEBGL) : null,
    snapshot: globalThis.__OUTDOOR_GATE_C__.snapshot(),
  };
});

const report = {
  buildId: BUILD_ID,
  baseUrl,
  browserVersion: browser.version(),
  mode: "headless Chrome default GPU path; no forced SwiftShader and no screenshot/recording",
  target55FpsMet: metrics.averageFps >= 55,
  floor30FpsMet: metrics.averageFps >= 30,
  metrics,
  consoleErrors,
  pageErrors,
};
await writeFile(
  resolve(evidenceRoot, "performance-hardware-path-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
await context.close();
await browser.close();

if (!report.floor30FpsMet || consoleErrors.length > 0 || pageErrors.length > 0) process.exitCode = 1;
console.log(JSON.stringify(report, null, 2));
