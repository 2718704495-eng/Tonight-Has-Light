import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { promisify } from "node:util";
import { chromium } from "/Users/wxl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const BUILD_ID = process.env.GATE_C_BUILD_ID ?? "gate-c-v7-20260821-41b0b7b1-showall-navy-r5";
const projectRoot = resolve(import.meta.dirname, "..");
const buildOutputRoot = resolve(projectRoot, "build", BUILD_ID);
const buildRoot = existsSync(resolve(buildOutputRoot, "web-mobile", "index.html"))
  ? resolve(buildOutputRoot, "web-mobile")
  : buildOutputRoot;
const evidenceRoot = resolve(
  "/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/gate-c-cocos-evidence",
  BUILD_ID,
);
const baseUrl = process.env.GATE_C_BASE_URL ?? "http://127.0.0.1:4173";
const execFile = promisify(execFileCallback);

await mkdir(evidenceRoot, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: [
    "--enable-precise-memory-info",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--use-angle=swiftshader",
  ],
});

const browserVersion = browser.version();
const consoleEvents = [];
const pageErrors = [];
const failedResponses = [];

function observe(page, label) {
  page.on("console", (message) => {
    consoleEvents.push({ label, type: message.type(), text: message.text() });
  });
  page.on("pageerror", (error) => {
    pageErrors.push({ label, message: error.message, stack: error.stack ?? "" });
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failedResponses.push({ label, status: response.status(), url: response.url() });
    }
  });
}

async function waitForMount(page) {
  try {
    await page.waitForFunction(
      () => globalThis.__OUTDOOR_GATE_C__?.snapshot().mounted === true,
      undefined,
      { timeout: 15_000 },
    );
  } catch (error) {
    const bodyText = await page.locator("body").innerText().catch(() => "");
    throw new Error(
      [
        `Outdoor Gate C did not mount: ${error.message}`,
        `body=${bodyText.slice(0, 500)}`,
        `console=${JSON.stringify(consoleEvents.slice(-20))}`,
        `pageErrors=${JSON.stringify(pageErrors.slice(-10))}`,
        `failedResponses=${JSON.stringify(failedResponses.slice(-20))}`,
      ].join("\n"),
    );
  }
}

async function snapshot(page) {
  return page.evaluate(() => globalThis.__OUTDOOR_GATE_C__?.snapshot());
}

async function domEvidence(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const bounds = canvas?.getBoundingClientRect();
    return {
      visibleText: document.body.innerText.trim(),
      canvasBounds: bounds
        ? { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }
        : null,
    };
  });
}

async function startCdpRecording(page) {
  const session = await page.context().newCDPSession(page);
  const frameRoot = await mkdtemp(join(tmpdir(), "gate-c-cdp-frames-"));
  const frames = [];
  const pendingWrites = [];
  session.on("Page.screencastFrame", (event) => {
    const index = frames.length;
    const path = join(frameRoot, `${String(index).padStart(6, "0")}.jpg`);
    frames.push({ path, timestamp: event.metadata.timestamp ?? Date.now() / 1_000 });
    pendingWrites.push(writeFile(path, Buffer.from(event.data, "base64")));
    void session
      .send("Page.screencastFrameAck", { sessionId: event.sessionId })
      .catch(() => undefined);
  });
  await session.send("Page.startScreencast", {
    format: "jpeg",
    quality: 92,
    maxWidth: 390,
    maxHeight: 844,
    everyNthFrame: 1,
  });

  return async (outputPath) => {
    await session.send("Page.stopScreencast");
    await Promise.all(pendingWrites);
    await session.detach();
    if (frames.length < 100) {
      throw new Error(`CDP screencast captured only ${frames.length} frames`);
    }

    const concatPath = join(frameRoot, "frames.ffconcat");
    const concatLines = ["ffconcat version 1.0"];
    for (let index = 0; index < frames.length - 1; index += 1) {
      const frame = frames[index];
      const next = frames[index + 1];
      const duration = Math.min(0.1, Math.max(0.001, next.timestamp - frame.timestamp));
      concatLines.push(`file '${frame.path}'`, `duration ${duration.toFixed(6)}`);
    }
    concatLines.push(`file '${frames.at(-1).path}'`);
    await writeFile(concatPath, `${concatLines.join("\n")}\n`);
    await execFile("/opt/homebrew/bin/ffmpeg", [
      "-y",
      "-hide_banner",
      "-loglevel", "error",
      "-f", "concat",
      "-safe", "0",
      "-i", concatPath,
      "-vf", "fps=30",
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      outputPath,
    ]);
    const { stdout } = await execFile("/opt/homebrew/bin/ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration,size",
      "-of", "json",
      outputPath,
    ]);
    const probe = JSON.parse(stdout).format;
    const durationSeconds = Number(probe.duration);
    if (durationSeconds < 9.6 || durationSeconds > 10.0) {
      throw new Error(`Encoded Gate C video duration ${durationSeconds}s is outside 9.6-10.0s`);
    }
    return {
      capture: "CDP Page.startScreencast",
      encoder: "/opt/homebrew/bin/ffmpeg",
      frameCount: frames.length,
      durationSeconds,
      bytes: Number(probe.size),
      path: outputPath,
    };
  };
}

async function recordNormalSample() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  observe(page, "normal-390x844");
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await waitForMount(page);
  const stopRecording = await startCdpRecording(page);
  await page.evaluate(() => {
    globalThis.__OUTDOOR_GATE_C__.replay();
  });
  await page.screenshot({ path: join(evidenceRoot, "normal-390x844-t0000.png") });
  await page.waitForFunction(() => globalThis.__OUTDOOR_GATE_C__.snapshot().elapsedMs >= 4_900);
  await page.screenshot({ path: join(evidenceRoot, "normal-390x844-t4900.png") });
  await page.waitForFunction(() => globalThis.__OUTDOOR_GATE_C__.snapshot().elapsedMs >= 9_800);
  await page.screenshot({ path: join(evidenceRoot, "normal-390x844-t9800.png") });
  await page.waitForTimeout(30);
  const videoPath = join(evidenceRoot, "normal-390x844-zero-operation.mp4");
  const videoEvidence = await stopRecording(videoPath);
  const terminalSnapshot = await snapshot(page);
  await page.waitForTimeout(350);
  const stableSnapshot = await snapshot(page);
  const dom = await domEvidence(page);
  await page.close();
  await context.close();
  return { terminalSnapshot, stableSnapshot, videoEvidence, dom };
}

async function capturePerformance() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  observe(page, "performance-390x844");
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await waitForMount(page);
  const evidence = await page.evaluate(async () => {
    globalThis.__OUTDOOR_GATE_C__.replay();
    const intervals = [];
    await new Promise((resolveFrames) => {
      const start = performance.now();
      let previous = start;
      const capture = (now) => {
        if (now !== start) intervals.push(now - previous);
        previous = now;
        if (now - start < 5_000) requestAnimationFrame(capture);
        else resolveFrames();
      };
      requestAnimationFrame(capture);
    });
    const filtered = intervals.filter((value) => value > 0 && value < 250);
    const sorted = [...filtered].sort((a, b) => a - b);
    const averageMs = filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
    const percentile = (ratio) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))] ?? 0;
    const memory = performance.memory;
    return {
      sampledFrames: filtered.length,
      averageFrameMs: averageMs,
      averageFps: 1_000 / averageMs,
      p95FrameMs: percentile(0.95),
      p99FrameMs: percentile(0.99),
      jsHeapUsedBytes: memory?.usedJSHeapSize ?? null,
      jsHeapTotalBytes: memory?.totalJSHeapSize ?? null,
    };
  });
  await context.close();
  return evidence;
}

async function captureViewport(width, height) {
  const label = `responsive-${width}x${height}`;
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  observe(page, label);
  await page.goto(`${baseUrl}/?reducedMotion=1`, { waitUntil: "networkidle" });
  await waitForMount(page);
  await page.evaluate(() => globalThis.__OUTDOOR_GATE_C__.setReducedMotion(true));
  await page.screenshot({ path: join(evidenceRoot, `${label}-neutral.png`) });
  const state = await snapshot(page);
  const dom = await domEvidence(page);
  await context.close();
  return { state, dom };
}

async function captureReducedMotion() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  observe(page, "reduced-390x844");
  await page.goto(`${baseUrl}/?reducedMotion=1`, { waitUntil: "networkidle" });
  await waitForMount(page);
  await page.waitForTimeout(1_000);
  const before = await snapshot(page);
  await page.waitForTimeout(1_000);
  const after = await snapshot(page);
  await page.screenshot({ path: join(evidenceRoot, "reduced-390x844.png") });
  await context.close();
  return { before, after };
}

async function captureAudioGate() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  observe(page, "audio-gate-390x844");
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await waitForMount(page);
  await page.waitForFunction(() => globalThis.__OUTDOOR_GATE_C__.snapshot().ambientAssigned === true);
  const beforeTouch = await snapshot(page);
  await page.touchscreen.tap(195, 422);
  await page.waitForFunction(() => globalThis.__OUTDOOR_GATE_C__.snapshot().ambientPlaying === true);
  await page.waitForFunction(() => globalThis.__OUTDOOR_GATE_C__.snapshot().ambientVolume > 0);
  const afterTouch = await snapshot(page);
  await context.close();
  return { beforeTouch, afterTouch };
}

async function captureRecovery() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  observe(page, "reload-recovery-390x844");
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await waitForMount(page);
  await page.waitForTimeout(500);
  const beforeReload = await snapshot(page);
  const session = await context.newCDPSession(page);
  let backgroundLike;
  try {
    await session.send("Page.setWebLifecycleState", { state: "frozen" });
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
    await session.send("Page.setWebLifecycleState", { state: "active" });
    await page.waitForTimeout(100);
    backgroundLike = { supported: true, afterResume: await snapshot(page) };
  } catch (error) {
    backgroundLike = { supported: false, error: error.message };
  } finally {
    await session.detach().catch(() => undefined);
  }
  await page.reload({ waitUntil: "networkidle" });
  await waitForMount(page);
  const afterReload = await snapshot(page);
  await context.close();
  return { beforeReload, backgroundLike, afterReload };
}

async function walkFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(path));
    else files.push(path);
  }
  return files;
}

async function buildManifest() {
  const files = await walkFiles(buildRoot);
  const manifest = [];
  for (const file of files.sort()) {
    const bytes = await readFile(file);
    const fileStat = await stat(file);
    manifest.push({
      path: relative(buildRoot, file),
      bytes: fileStat.size,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    });
  }
  return manifest;
}

function neutralLayerViolation(state, label) {
  if (!state || state.spriteCount !== 30) return `${label}: expected 30 mounted sprites`;
  const nonNeutral = Object.entries(state.layerOpacities).filter(([id, opacity]) =>
    opacity !== (id === "scene_clean_plate" ? 1 : 0));
  return nonNeutral.length === 0
    ? null
    : `${label}: non-neutral layer opacity ${JSON.stringify(nonNeutral)}`;
}

function motionIsReducedEquivalent(motion) {
  return motion
    && Object.values(motion.wind).every((value) => value === 0)
    && motion.humanBreath === 0
    && motion.catBreath === 0
    && motion.cloudOffsetX.every((value) => value === 0)
    && motion.cloudOpacity.every((value) => value === 0)
    && Object.values(motion.windOverlayOpacity).every((value) => value === 0)
    && motion.bodyOverlayOpacity.every((value) => value === 0)
    && motion.heroStarBrightness.every((value) => value === 0)
    && motion.flowerBrightness.every((value) => value === 0);
}

let result;
try {
  const normal = await recordNormalSample();
  const [narrow, wide, wideShort, reducedMotion, audioGate, recovery, performanceEvidence, files] = await Promise.all([
    captureViewport(360, 800),
    captureViewport(430, 932),
    captureViewport(430, 844),
    captureReducedMotion(),
    captureAudioGate(),
    captureRecovery(),
    capturePerformance(),
    buildManifest(),
  ]);
  result = {
    buildId: BUILD_ID,
    baseUrl,
    browserVersion,
    normal,
    responsive: { "360x800": narrow, "430x932": wide, "430x844": wideShort },
    reducedMotion,
    audioGate,
    recovery,
    performanceEvidence,
    consoleErrors: consoleEvents.filter((event) => event.type === "error"),
    consoleWarnings: consoleEvents.filter((event) => event.type === "warning"),
    pageErrors,
    failedResponses,
    buildFiles: files,
  };
  const violations = [];
  for (const [label, state] of [
    ["normal tail", normal.terminalSnapshot],
    ["normal stable tail", normal.stableSnapshot],
    ["reduced before", reducedMotion.before],
    ["reduced after", reducedMotion.after],
  ]) {
    const violation = neutralLayerViolation(state, label);
    if (violation) violations.push(violation);
  }
  if (normal.terminalSnapshot.elapsedMs !== 9_800 || normal.stableSnapshot.elapsedMs !== 9_800) {
    violations.push("normal timeline did not clamp and hold at 9800ms");
  }
  if (!motionIsReducedEquivalent(normal.terminalSnapshot.motion)) {
    violations.push("normal 9800ms tail is not the neutral transform/opacity state");
  }
  if (!motionIsReducedEquivalent(reducedMotion.before.motion)
      || !motionIsReducedEquivalent(reducedMotion.after.motion)) {
    violations.push("reduced motion exposed a transform or overlay channel");
  }
  if (audioGate.beforeTouch.audioUnlocked
      || !audioGate.beforeTouch.audioAssigned
      || !audioGate.beforeTouch.ambientAssigned
      || audioGate.beforeTouch.musicAssigned
      || audioGate.beforeTouch.ambientPlaying
      || audioGate.beforeTouch.musicPlaying) {
    violations.push("zero-touch audio state was not silent with assigned ambient wind");
  }
  if (!audioGate.afterTouch.audioUnlocked
      || !audioGate.afterTouch.audioAssigned
      || !audioGate.afterTouch.ambientAssigned
      || audioGate.afterTouch.musicAssigned
      || !audioGate.afterTouch.ambientPlaying
      || audioGate.afterTouch.musicPlaying
      || audioGate.afterTouch.ambientVolume <= 0) {
    violations.push("first-touch ambient wind did not start cleanly");
  }
  if (normal.dom.visibleText !== "") violations.push("normal sample contains visible UI text");
  for (const [label, viewport] of Object.entries(result.responsive)) {
    if (!viewport.state?.mounted || viewport.state.spriteCount !== 30) {
      violations.push(`${label}: persistent 30-Sprite scene did not mount`);
    }
    if (viewport.dom.visibleText !== "") violations.push(`${label}: visible UI text is not allowed`);
  }
  if (performanceEvidence.averageFps < 30) violations.push("average FPS fell below the 30fps floor");
  if (!recovery.backgroundLike.supported || !recovery.backgroundLike.afterResume?.mounted) {
    violations.push("background-like freeze/active recovery did not complete");
  }
  if (!recovery.afterReload?.mounted) violations.push("reload recovery did not remount Gate C");
  result.contractViolations = violations;
  await writeFile(join(evidenceRoot, "run-report.json"), `${JSON.stringify(result, null, 2)}\n`);
  await writeFile(
    join(evidenceRoot, "build-asset-manifest.json"),
    `${JSON.stringify({ buildId: BUILD_ID, files }, null, 2)}\n`,
  );
} finally {
  await browser.close();
}

if (
  result.consoleErrors.length > 0 ||
  result.pageErrors.length > 0 ||
  result.failedResponses.length > 0 ||
  result.contractViolations.length > 0
) process.exitCode = 1;
console.log(JSON.stringify(result, null, 2));
