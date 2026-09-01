import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { copyFile, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import {
  dirname,
  extname,
  join,
  resolve,
  sep,
} from "node:path";
import { performance as nodePerformance } from "node:perf_hooks";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const SCRIPT_ID = process.env.OUTDOOR_MOTION_VALIDATOR_ID
  ?? "validate-outdoor-motion-phone-v1-a-web/v1";
const CANDIDATE_ID = process.env.OUTDOOR_MOTION_CANDIDATE_ID
  ?? "outdoor-motion-phone-v1-a-local-r1";
const NORMAL_CAPTURE_MS = 36_500;
const NORMAL_REQUIRED_VIDEO_SECONDS = 35;
const FIRST_TOUCH_AT_RUNTIME_MS = Number(
  process.env.OUTDOOR_MOTION_FIRST_TOUCH_AT_MS ?? 6_200,
);
const FIRST_TOUCH_CHAIN_WINDOW_MS = 6_000;
const REDUCED_CAPTURE_MS = 10_000;
const REDUCED_TOUCH_AT_RUNTIME_MS = 2_000;
const RESPONSIVE_MOTION_CAPTURE_MS = 4_300;
const WIND_ACTIVITY_THRESHOLD = 0.005;
const MAX_VISIBLE_WIND_GAP_MS = Number(
  process.env.OUTDOOR_MOTION_MAX_VISIBLE_WIND_GAP_MS ?? 14_000,
);
const STABLE_FRAME_CANDIDATE_COUNT = 7;
const STABLE_FRAME_MIN_SSIM = 0.82;
const STABLE_FRAME_MIN_PSNR_DB = 28;
const APPROVED_CLEAN_PLATE_SHA256 = process.env.OUTDOOR_MOTION_REFERENCE_SHA256
  ?? "681100007ea50d912136f85e072df6b77cee0aaf9fc9350ecf2e1da1c32ae95f";
const APPROVED_V7_SOURCE_SHA256 = "7157484b95988b11c1abdf9ddc0d5bb7c2d3bde25dd9d2dfcf6c5ee795847b3d";
const WIND_CHANNELS = [
  "far-grass",
  "near-grass",
  "human-hair",
  "human-hem",
  "cat-ears",
  "cat-tail",
];
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const execFile = promisify(execFileCallback);

const [, , targetArgument, outputArgument] = process.argv;
if (!targetArgument || !outputArgument) {
  throw new Error([
    "Usage:",
    "  node scripts/validate-outdoor-motion-phone-v1-a-web.mjs <web-build-url-or-dir> <output-dir>",
    "Examples:",
    "  node scripts/validate-outdoor-motion-phone-v1-a-web.mjs http://127.0.0.1:4173 /tmp/motion-evidence",
    "  node scripts/validate-outdoor-motion-phone-v1-a-web.mjs build/outdoor-motion-phone-v1-a-local-r1-web /tmp/motion-evidence",
  ].join("\n"));
}

const outputDir = resolve(outputArgument);
await mkdir(outputDir, { recursive: true });

function finiteNumber(value, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function percentile(sortedValues, ratio) {
  if (sortedValues.length === 0) return null;
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil(sortedValues.length * ratio) - 1),
  );
  return sortedValues[index];
}

function summarizeFrameGaps(frameGaps) {
  const gaps = frameGaps.filter((value) => Number.isFinite(value) && value > 0);
  const sorted = [...gaps].sort((left, right) => left - right);
  const totalMs = gaps.reduce((sum, value) => sum + value, 0);
  const averageFrameMs = gaps.length > 0 ? totalMs / gaps.length : null;
  return {
    method: "requestAnimationFrame gap approximation while CDP capture is active",
    caveat: "This is a local Web proxy affected by headless capture overhead; it is not WeChat-device FPS evidence.",
    sampledFrameGaps: gaps.length,
    sampledDurationMs: totalMs,
    averageFrameMs,
    approximateAverageFps: averageFrameMs && averageFrameMs > 0 ? 1_000 / averageFrameMs : null,
    p50FrameMs: percentile(sorted, 0.5),
    p95FrameMs: percentile(sorted, 0.95),
    p99FrameMs: percentile(sorted, 0.99),
    maximumFrameMs: sorted.at(-1) ?? null,
    over100MsCount: gaps.filter((value) => value > 100).length,
    over250MsCount: gaps.filter((value) => value > 250).length,
  };
}

function withQueryParameter(baseUrl, name, value) {
  const url = new URL(baseUrl);
  url.searchParams.set(name, value);
  return url.href;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function mimeForPath(path) {
  return {
    ".bin": "application/octet-stream",
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".mp3": "audio/mpeg",
    ".ogg": "audio/ogg",
    ".png": "image/png",
    ".wasm": "application/wasm",
  }[extname(path).toLowerCase()] ?? "application/octet-stream";
}

async function resolveBuildRoot(argument) {
  const initial = resolve(argument);
  const initialStat = await stat(initial).catch(() => null);
  if (!initialStat) throw new Error(`Web build target does not exist: ${initial}`);
  if (initialStat.isFile()) {
    if (initial.endsWith(`${sep}index.html`) || initial.endsWith("/index.html")) {
      return dirname(initial);
    }
    throw new Error(`Web build file must be index.html: ${initial}`);
  }
  if (!initialStat.isDirectory()) throw new Error(`Web build target is not a directory: ${initial}`);

  const nested = resolve(initial, "web-mobile");
  if (existsSync(resolve(nested, "index.html"))) return nested;
  if (existsSync(resolve(initial, "index.html"))) return initial;
  throw new Error(`No index.html or web-mobile/index.html under: ${initial}`);
}

async function startLocalBuildServer(argument) {
  const root = await resolveBuildRoot(argument);
  const server = createServer(async (request, response) => {
    const requestUrl = new URL(
      request.url ?? "/",
      `http://${request.headers.host ?? "127.0.0.1"}`,
    );
    if (requestUrl.pathname === "/favicon.ico") {
      response.writeHead(204).end();
      return;
    }

    let decodedPath;
    try {
      decodedPath = decodeURIComponent(requestUrl.pathname);
    } catch {
      response.writeHead(400).end("Bad request");
      return;
    }
    const pathname = decodedPath === "/" ? "/index.html" : decodedPath;
    const file = resolve(root, `.${pathname}`);
    if (file !== root && !file.startsWith(`${root}${sep}`)) {
      response.writeHead(403).end("Forbidden");
      return;
    }

    try {
      const fileStat = await stat(file);
      if (!fileStat.isFile()) throw new Error("Not a file");
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Length": fileStat.size,
        "Content-Type": mimeForPath(file),
      });
      createReadStream(file).pipe(response);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });

  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Local Web build server did not expose a TCP port");
  }
  return {
    baseUrl: `http://127.0.0.1:${address.port}/`,
    buildRoot: root,
    close: () => new Promise((resolveClose, rejectClose) => {
      server.close((error) => (error ? rejectClose(error) : resolveClose()));
    }),
  };
}

async function resolveTarget(argument) {
  if (isHttpUrl(argument)) {
    return {
      baseUrl: new URL(argument).href,
      buildRoot: null,
      close: async () => undefined,
    };
  }
  return startLocalBuildServer(argument);
}

async function loadPlaywrightChromium() {
  const candidates = [
    process.env.PLAYWRIGHT_MODULE,
    "playwright",
    "/Users/wxl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs",
  ].filter(Boolean);
  const errors = [];
  for (const candidate of candidates) {
    try {
      const loaded = await import(candidate);
      if (loaded.chromium) return loaded.chromium;
      errors.push(`${candidate}: module has no chromium export`);
    } catch (error) {
      errors.push(`${candidate}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(`Unable to load Playwright:\n${errors.join("\n")}`);
}

function executableFromEnvironment(name, candidates) {
  const configured = process.env[name];
  if (configured) return configured;
  return candidates.find((candidate) => existsSync(candidate)) ?? candidates.at(-1);
}

async function sha256File(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

async function prepareCleanPlateReferences() {
  const sourcePath = resolve(
    process.env.OUTDOOR_MOTION_CLEAN_PLATE
      ?? resolve(
        projectRoot,
        "assets/resources/outdoor-gate-c/prototype_scene_clean_plate_390x844.png",
      ),
  );
  const sourceSha256 = await sha256File(sourcePath);
  if (sourceSha256 !== APPROVED_CLEAN_PLATE_SHA256) {
    throw new Error(
      `Approved clean plate hash mismatch: expected ${APPROVED_CLEAN_PLATE_SHA256}, got ${sourceSha256}`,
    );
  }
  const referenceRoot = resolve(outputDir, "stable-frame-references");
  await mkdir(referenceRoot, { recursive: true });
  const reference390 = resolve(referenceRoot, "approved-clean-plate-390x844.png");
  await copyFile(sourcePath, reference390);

  const ffmpeg = executableFromEnvironment("FFMPEG_PATH", [
    "/opt/homebrew/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "ffmpeg",
  ]);
  const references = {
    "390x844": {
      path: reference390,
      width: 390,
      height: 844,
      sha256: sourceSha256,
      derivation: "byte-for-byte approved scene_clean_plate",
    },
  };
  for (const [width, height] of [[360, 800], [430, 932], [430, 844]]) {
    const outputPath = resolve(referenceRoot, `approved-clean-plate-${width}x${height}.png`);
    await execFile(ffmpeg, [
      "-y",
      "-hide_banner",
      "-loglevel", "error",
      "-i", sourcePath,
      "-vf",
      `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=0x06265F`,
      "-frames:v", "1",
      outputPath,
    ]);
    references[`${width}x${height}`] = {
      path: outputPath,
      width,
      height,
      sha256: await sha256File(outputPath),
      derivation: "approved clean plate scaled with SHOW_ALL and #06265F safety bars",
    };
  }
  return {
    approvedV7SourceSha256: APPROVED_V7_SOURCE_SHA256,
    approvedCleanPlateSha256: APPROVED_CLEAN_PLATE_SHA256,
    sourcePath,
    references,
  };
}

function parseFrameMetricOutput(stderr) {
  const candidateDimensions = stderr.match(
    /Input #0[\s\S]*?Stream #0:0[^\n]*?\b(\d{2,5})x(\d{2,5})\b/,
  );
  const referenceDimensions = stderr.match(
    /Input #1[\s\S]*?Stream #1:0[^\n]*?\b(\d{2,5})x(\d{2,5})\b/,
  );
  const ssimMatch = stderr.match(/SSIM [^\n]*?All:([0-9.]+)/);
  const psnrMatch = stderr.match(/PSNR [^\n]*?average:([0-9.]+|inf)/);
  return {
    candidateDimensions: candidateDimensions
      ? { width: Number(candidateDimensions[1]), height: Number(candidateDimensions[2]) }
      : null,
    referenceDimensions: referenceDimensions
      ? { width: Number(referenceDimensions[1]), height: Number(referenceDimensions[2]) }
      : null,
    ssimAll: ssimMatch ? Number(ssimMatch[1]) : null,
    psnrAverageDb: psnrMatch
      ? (psnrMatch[1] === "inf" ? Number.POSITIVE_INFINITY : Number(psnrMatch[1]))
      : null,
  };
}

async function scoreFrameAgainstCleanPlate(candidatePath, reference) {
  const ffmpeg = executableFromEnvironment("FFMPEG_PATH", [
    "/opt/homebrew/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "ffmpeg",
  ]);
  const { stderr } = await execFile(ffmpeg, [
    "-hide_banner",
    "-i", candidatePath,
    "-i", reference.path,
    "-filter_complex",
    "[0:v]split=2[c0][c1];[1:v]split=2[r0][r1];[c0][r0]ssim[s];[c1][r1]psnr[p]",
    "-map", "[s]",
    "-map", "[p]",
    "-f", "null",
    "-",
  ], { maxBuffer: 10 * 1024 * 1024 });
  const metrics = parseFrameMetricOutput(stderr);
  const dimensionsMatch = metrics.candidateDimensions?.width === reference.width
    && metrics.candidateDimensions?.height === reference.height
    && metrics.referenceDimensions?.width === reference.width
    && metrics.referenceDimensions?.height === reference.height;
  const structureComplete = dimensionsMatch
    && (metrics.ssimAll ?? Number.NEGATIVE_INFINITY) >= STABLE_FRAME_MIN_SSIM
    && (metrics.psnrAverageDb ?? Number.NEGATIVE_INFINITY) >= STABLE_FRAME_MIN_PSNR_DB;
  return {
    ...metrics,
    dimensionsMatch,
    structureComplete,
    thresholds: {
      minimumSsimAll: STABLE_FRAME_MIN_SSIM,
      minimumPsnrAverageDb: STABLE_FRAME_MIN_PSNR_DB,
      requiredDimensions: { width: reference.width, height: reference.height },
    },
  };
}

function stableCandidateOrder(left, right) {
  if (left.metrics.structureComplete !== right.metrics.structureComplete) {
    return left.metrics.structureComplete ? -1 : 1;
  }
  const ssimDifference = finiteNumber(right.metrics.ssimAll, Number.NEGATIVE_INFINITY)
    - finiteNumber(left.metrics.ssimAll, Number.NEGATIVE_INFINITY);
  if (ssimDifference !== 0) return ssimDifference;
  return finiteNumber(right.metrics.psnrAverageDb, Number.NEGATIVE_INFINITY)
    - finiteNumber(left.metrics.psnrAverageDb, Number.NEGATIVE_INFINITY);
}

function selectionSlug(value) {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
}

function observePage(page, label) {
  const observation = {
    label,
    console: [],
    pageErrors: [],
    requestFailures: [],
    failedResponses: [],
  };
  page.on("console", (message) => {
    observation.console.push({
      type: message.type(),
      text: message.text(),
      location: message.location(),
    });
  });
  page.on("pageerror", (error) => {
    observation.pageErrors.push({ message: error.message, stack: error.stack ?? "" });
  });
  page.on("requestfailed", (request) => {
    observation.requestFailures.push({
      url: request.url(),
      method: request.method(),
      reason: request.failure()?.errorText ?? "unknown",
    });
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      observation.failedResponses.push({ status: response.status(), url: response.url() });
    }
  });
  return observation;
}

function actionableObservationErrors(observation) {
  const genericFaviconConsoleError =
    "Failed to load resource: the server responded with a status of 404 (File not found)";
  return [
    ...observation.pageErrors.map((entry) => `pageerror: ${entry.message}`),
    ...observation.requestFailures
      .filter((entry) => !entry.url.endsWith("/favicon.ico"))
      .map((entry) => `requestfailed: ${entry.url} (${entry.reason})`),
    ...observation.failedResponses
      .filter((entry) => !entry.url.endsWith("/favicon.ico"))
      .map((entry) => `http ${entry.status}: ${entry.url}`),
    ...observation.console
      .filter((entry) => entry.type === "error" && entry.text !== genericFaviconConsoleError)
      .map((entry) => `console: ${entry.text}`),
  ];
}

async function waitForOutdoor(page) {
  try {
    await page.waitForFunction(
      () => globalThis.__OUTDOOR_GATE_C__?.snapshot?.().mounted === true,
      undefined,
      { timeout: 20_000 },
    );
  } catch (error) {
    const diagnostics = await page.evaluate(() => ({
      bodyText: document.body?.innerText?.slice(0, 500) ?? "",
      hasApi: Boolean(globalThis.__OUTDOOR_GATE_C__),
      snapshot: globalThis.__OUTDOOR_GATE_C__?.snapshot?.() ?? null,
    })).catch(() => null);
    throw new Error(
      `Outdoor scene did not mount: ${error instanceof Error ? error.message : String(error)}\n`
      + `diagnostics=${JSON.stringify(diagnostics)}`,
    );
  }
}

async function waitForRuntime(page, runtimeElapsedMs, extraTimeoutMs = 20_000) {
  await page.waitForFunction(
    (targetMs) => (
      (globalThis.__OUTDOOR_GATE_C__?.snapshot?.().runtimeElapsedMs ?? -1) >= targetMs
    ),
    runtimeElapsedMs,
    { polling: 50, timeout: runtimeElapsedMs + extraTimeoutMs },
  );
}

async function compactSnapshotAtPage(page) {
  return page.evaluate(() => {
    const snapshot = globalThis.__OUTDOOR_GATE_C__?.snapshot?.();
    if (!snapshot) return null;
    return {
      pagePerformanceMs: performance.now(),
      capturedAtIso: new Date().toISOString(),
      mounted: snapshot.mounted,
      mountState: snapshot.mountState,
      mountError: snapshot.mountError,
      reducedMotion: snapshot.reducedMotion,
      runtimeElapsedMs: snapshot.runtimeElapsedMs,
      elapsedMs: snapshot.elapsedMs,
      spriteCount: snapshot.spriteCount,
      loadedFrameCount: snapshot.loadedFrameCount,
      audioUnlocked: snapshot.audioUnlocked,
      audioAssigned: snapshot.audioAssigned,
      ambientAssigned: snapshot.ambientAssigned,
      musicAssigned: snapshot.musicAssigned,
      ambientPlaying: snapshot.ambientPlaying,
      musicPlaying: snapshot.musicPlaying,
      ambientVolume: snapshot.ambientVolume,
      musicVolume: snapshot.musicVolume,
      motion: snapshot.motion,
    };
  });
}

async function captureSceneGraphInvariant(page, label) {
  return page.evaluate(async (captureLabel) => {
    const approximate = (value, expected, tolerance = 0.001) => (
      typeof value === "number" && Math.abs(value - expected) <= tolerance
    );
    const vector = (value) => value
      ? { x: value.x, y: value.y, z: value.z }
      : null;
    const findNode = (node, name) => {
      if (!node) return null;
      if (node.name === name) return node;
      for (const child of node.children ?? []) {
        const match = findNode(child, name);
        if (match) return match;
      }
      return null;
    };
    try {
      const cc = await globalThis.System?.import?.("cc");
      const scene = cc?.director?.getScene?.();
      if (!scene) {
        return { label: captureLabel, supported: false, reason: "Cocos scene graph unavailable" };
      }
      const outdoor = findNode(scene, "OutdoorScene");
      const cleanPlate = findNode(scene, "scene_clean_plate");
      const canvasBounds = document.querySelector("canvas")?.getBoundingClientRect();
      const nodeState = (node) => node ? {
        name: node.name,
        activeInHierarchy: node.activeInHierarchy,
        position: vector(node.position),
        scale: vector(node.scale),
        eulerAngles: vector(node.eulerAngles),
        worldPosition: vector(node.worldPosition),
        worldScale: vector(node.worldScale),
      } : null;
      const outdoorState = nodeState(outdoor);
      const cleanPlateState = nodeState(cleanPlate);
      const checks = {
        outdoorFound: Boolean(outdoor),
        cleanPlateFound: Boolean(cleanPlate),
        canvasIs390x844: approximate(canvasBounds?.width, 390, 0.01)
          && approximate(canvasBounds?.height, 844, 0.01),
        outdoorLocalPositionZero: approximate(outdoorState?.position?.x, 0)
          && approximate(outdoorState?.position?.y, 0),
        outdoorScaleOne: approximate(outdoorState?.scale?.x, 1)
          && approximate(outdoorState?.scale?.y, 1),
        outdoorRotationZero: approximate(outdoorState?.eulerAngles?.z, 0),
        outdoorWorldCenter: approximate(outdoorState?.worldPosition?.x, 195, 0.01)
          && approximate(outdoorState?.worldPosition?.y, 422, 0.01),
        cleanPlateLocalPositionZero: approximate(cleanPlateState?.position?.x, 0)
          && approximate(cleanPlateState?.position?.y, 0),
        cleanPlateScaleOne: approximate(cleanPlateState?.scale?.x, 1)
          && approximate(cleanPlateState?.scale?.y, 1),
        cleanPlateRotationZero: approximate(cleanPlateState?.eulerAngles?.z, 0),
        cleanPlateWorldCenter: approximate(cleanPlateState?.worldPosition?.x, 195, 0.01)
          && approximate(cleanPlateState?.worldPosition?.y, 422, 0.01),
      };
      return {
        label: captureLabel,
        supported: true,
        pagePerformanceMs: performance.now(),
        runtimeElapsedMs: globalThis.__OUTDOOR_GATE_C__?.snapshot?.().runtimeElapsedMs ?? null,
        canvasBounds: canvasBounds ? {
          x: canvasBounds.x,
          y: canvasBounds.y,
          width: canvasBounds.width,
          height: canvasBounds.height,
        } : null,
        outdoor: outdoorState,
        cleanPlate: cleanPlateState,
        checks,
        allChecksPass: Object.values(checks).every(Boolean),
        interpretation:
          "Constant OutdoorScene/clean-plate transforms distinguish runtime stability from WebGL readback artifacts.",
      };
    } catch (error) {
      return {
        label: captureLabel,
        supported: false,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  }, label);
}

async function startPageSampler(page) {
  await page.evaluate(() => {
    const previous = globalThis.__OUTDOOR_MOTION_PHONE_V1_A_EVIDENCE__;
    if (previous?.active) {
      previous.active = false;
      if (previous.rafId) cancelAnimationFrame(previous.rafId);
    }
    const state = {
      active: true,
      rafId: 0,
      previousFrameAtMs: null,
      lastSnapshotAtMs: Number.NEGATIVE_INFINITY,
      frameGapsMs: [],
      samples: [],
    };
    const compact = (snapshot, now) => ({
      pagePerformanceMs: now,
      runtimeElapsedMs: snapshot.runtimeElapsedMs,
      elapsedMs: snapshot.elapsedMs,
      reducedMotion: snapshot.reducedMotion,
      audioUnlocked: snapshot.audioUnlocked,
      ambientPlaying: snapshot.ambientPlaying,
      ambientVolume: snapshot.ambientVolume,
      motion: snapshot.motion,
    });
    const sample = (now) => {
      if (!state.active) return;
      if (state.previousFrameAtMs !== null) {
        state.frameGapsMs.push(now - state.previousFrameAtMs);
      }
      state.previousFrameAtMs = now;
      if (now - state.lastSnapshotAtMs >= 40) {
        const snapshot = globalThis.__OUTDOOR_GATE_C__?.snapshot?.();
        if (snapshot) state.samples.push(compact(snapshot, now));
        state.lastSnapshotAtMs = now;
      }
      state.rafId = requestAnimationFrame(sample);
    };
    globalThis.__OUTDOOR_MOTION_PHONE_V1_A_EVIDENCE__ = state;
    state.rafId = requestAnimationFrame(sample);
  });
}

async function stopPageSampler(page) {
  return page.evaluate(() => {
    const state = globalThis.__OUTDOOR_MOTION_PHONE_V1_A_EVIDENCE__;
    if (!state) return { samples: [], frameGapsMs: [] };
    state.active = false;
    if (state.rafId) cancelAnimationFrame(state.rafId);
    return {
      samples: state.samples,
      frameGapsMs: state.frameGapsMs,
    };
  });
}

async function takeClockAnchor(page) {
  const nodeBeforeMs = nodePerformance.now();
  const pagePerformanceMs = await page.evaluate(() => performance.now());
  const nodeAfterMs = nodePerformance.now();
  return {
    pagePerformanceMs,
    nodePerformanceMs: (nodeBeforeMs + nodeAfterMs) / 2,
    roundTripMs: nodeAfterMs - nodeBeforeMs,
  };
}

async function replayAndSnapshot(page) {
  return page.evaluate(() => {
    globalThis.__OUTDOOR_GATE_C__.replay();
    const snapshot = globalThis.__OUTDOOR_GATE_C__.snapshot();
    return {
      pagePerformanceMs: performance.now(),
      runtimeElapsedMs: snapshot.runtimeElapsedMs,
      elapsedMs: snapshot.elapsedMs,
      reducedMotion: snapshot.reducedMotion,
      audioUnlocked: snapshot.audioUnlocked,
      ambientPlaying: snapshot.ambientPlaying,
      ambientVolume: snapshot.ambientVolume,
      motion: snapshot.motion,
    };
  });
}

async function recordTouch(page, label, x, y) {
  const before = await compactSnapshotAtPage(page);
  const requestedAtNodePerformanceMs = nodePerformance.now();
  const requestedAtIso = new Date().toISOString();
  await page.touchscreen.tap(x, y);
  const completedAtNodePerformanceMs = nodePerformance.now();
  const after = await compactSnapshotAtPage(page);
  let webFallback = null;
  let effectiveAfter = after;
  if (!after?.audioUnlocked) {
    const fallbackBefore = await compactSnapshotAtPage(page);
    const fallbackRequestedAtNodePerformanceMs = nodePerformance.now();
    await page.mouse.click(x, y);
    const fallbackCompletedAtNodePerformanceMs = nodePerformance.now();
    const fallbackAfter = await compactSnapshotAtPage(page);
    webFallback = {
      reason: "Playwright touchscreen.tap did not synchronously reach the Cocos Web input bridge",
      method: "mouse.click Web tap surrogate",
      requestedAtNodePerformanceMs: fallbackRequestedAtNodePerformanceMs,
      completedAtNodePerformanceMs: fallbackCompletedAtNodePerformanceMs,
      automationRoundTripMs:
        fallbackCompletedAtNodePerformanceMs - fallbackRequestedAtNodePerformanceMs,
      before: fallbackBefore,
      after: fallbackAfter,
    };
    effectiveAfter = fallbackAfter;
  }
  return {
    label,
    pointCssPx: { x, y },
    primaryMethod: "Playwright touchscreen.tap",
    requestedAtIso,
    requestedAtNodePerformanceMs,
    completedAtNodePerformanceMs,
    automationRoundTripMs: completedAtNodePerformanceMs - requestedAtNodePerformanceMs,
    before,
    after,
    webFallback,
    effectiveAfter,
  };
}

async function waitForTouchAudioState(page, input) {
  const startedAtNodePerformanceMs = nodePerformance.now();
  let reached = false;
  try {
    await page.waitForFunction(() => {
      const snapshot = globalThis.__OUTDOOR_GATE_C__?.snapshot?.();
      return snapshot?.audioUnlocked === true && snapshot?.ambientPlaying === true;
    }, undefined, { polling: 25, timeout: 2_000 });
    reached = true;
  } catch {
    reached = false;
  }
  input.audioState = {
    reached,
    waitedMs: nodePerformance.now() - startedAtNodePerformanceMs,
    settled: await compactSnapshotAtPage(page),
  };
  return input;
}

function ffconcatPath(path) {
  return path.replaceAll("'", "'\\''");
}

async function startScreencast(page, label) {
  const session = await page.context().newCDPSession(page);
  const frameRoot = await mkdtemp(join(tmpdir(), `outdoor-motion-${label}-`));
  const frames = [];
  const pendingWrites = [];
  const startedAtNodePerformanceMs = nodePerformance.now();
  session.on("Page.screencastFrame", (event) => {
    const index = frames.length;
    const path = join(frameRoot, `${String(index).padStart(6, "0")}.jpg`);
    frames.push({
      index,
      path,
      cdpTimestampSeconds: finiteNumber(event.metadata.timestamp, null),
      receivedAtNodePerformanceMs: nodePerformance.now(),
    });
    pendingWrites.push(writeFile(path, Buffer.from(event.data, "base64")));
    void session.send("Page.screencastFrameAck", { sessionId: event.sessionId }).catch(() => undefined);
  });
  await session.send("Page.startScreencast", {
    format: "jpeg",
    quality: 94,
    maxWidth: 430,
    maxHeight: 932,
    everyNthFrame: 1,
  });
  return {
    label,
    session,
    frameRoot,
    frames,
    pendingWrites,
    startedAtNodePerformanceMs,
  };
}

async function stopAndEncodeScreencast(recorder, videoPath, minimumDurationSeconds) {
  const stoppedAtNodePerformanceMs = nodePerformance.now();
  await recorder.session.send("Page.stopScreencast");
  await Promise.all(recorder.pendingWrites);
  await recorder.session.detach();
  const frames = recorder.frames;
  if (frames.length < 2) {
    throw new Error(`${recorder.label}: CDP screencast captured only ${frames.length} frames`);
  }

  const concatPath = join(recorder.frameRoot, "frames.ffconcat");
  const concatLines = ["ffconcat version 1.0"];
  for (let index = 0; index < frames.length - 1; index += 1) {
    const current = frames[index];
    const next = frames[index + 1];
    const cdpGapSeconds = current.cdpTimestampSeconds !== null
      && next.cdpTimestampSeconds !== null
      ? next.cdpTimestampSeconds - current.cdpTimestampSeconds
      : Number.NaN;
    const nodeGapSeconds = (
      next.receivedAtNodePerformanceMs - current.receivedAtNodePerformanceMs
    ) / 1_000;
    const durationSeconds = Number.isFinite(cdpGapSeconds) && cdpGapSeconds > 0
      ? cdpGapSeconds
      : Math.max(0.001, nodeGapSeconds);
    concatLines.push(
      `file '${ffconcatPath(current.path)}'`,
      `duration ${Math.max(0.001, durationSeconds).toFixed(6)}`,
    );
  }
  const finalFrame = frames.at(-1);
  const finalHoldSeconds = Math.max(
    1 / 30,
    (stoppedAtNodePerformanceMs - finalFrame.receivedAtNodePerformanceMs) / 1_000,
  );
  concatLines.push(
    `file '${ffconcatPath(finalFrame.path)}'`,
    `duration ${finalHoldSeconds.toFixed(6)}`,
    `file '${ffconcatPath(finalFrame.path)}'`,
  );
  await writeFile(concatPath, `${concatLines.join("\n")}\n`);

  const ffmpeg = executableFromEnvironment("FFMPEG_PATH", [
    "/opt/homebrew/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "ffmpeg",
  ]);
  const ffprobe = executableFromEnvironment("FFPROBE_PATH", [
    "/opt/homebrew/bin/ffprobe",
    "/usr/local/bin/ffprobe",
    "ffprobe",
  ]);
  await execFile(ffmpeg, [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-f", "concat",
    "-safe", "0",
    "-i", concatPath,
    "-vf", "fps=30",
    "-an",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    videoPath,
  ]);
  const { stdout } = await execFile(ffprobe, [
    "-v", "error",
    "-show_entries", "format=duration,size:stream=width,height,avg_frame_rate,nb_frames",
    "-of", "json",
    videoPath,
  ]);
  const probe = JSON.parse(stdout);
  const durationSeconds = Number(probe.format?.duration);
  if (!Number.isFinite(durationSeconds) || durationSeconds < minimumDurationSeconds) {
    throw new Error(
      `${recorder.label}: encoded duration ${durationSeconds}s is below ${minimumDurationSeconds}s`,
    );
  }
  return {
    method: "Chrome DevTools Page.startScreencast; timestamp-preserving ffconcat; 30fps CFR delivery",
    frameCount: frames.length,
    recordingWallDurationMs: stoppedAtNodePerformanceMs - recorder.startedAtNodePerformanceMs,
    encodedDurationSeconds: durationSeconds,
    bytes: Number(probe.format?.size),
    video: {
      path: videoPath,
      width: Number(probe.streams?.[0]?.width),
      height: Number(probe.streams?.[0]?.height),
      averageFrameRate: probe.streams?.[0]?.avg_frame_rate ?? null,
      frameCount: Number(probe.streams?.[0]?.nb_frames),
    },
    frames,
    frameRoot: recorder.frameRoot,
  };
}

function sampleNearestRuntime(samples, targetRuntimeElapsedMs) {
  return samples.reduce((best, sample) => (
    !best
      || Math.abs(sample.runtimeElapsedMs - targetRuntimeElapsedMs)
        < Math.abs(best.runtimeElapsedMs - targetRuntimeElapsedMs)
      ? sample
      : best
  ), null);
}

function channelActivity(sample, channel) {
  const wind = Math.abs(finiteNumber(sample.motion?.wind?.[channel]));
  const overlay = Math.abs(finiteNumber(sample.motion?.windOverlayOpacity?.[channel]));
  const effectiveWind = Math.abs(finiteNumber(sample.motion?.effectiveWind?.[channel]));
  const effectiveOverlay = Math.abs(
    finiteNumber(sample.motion?.effectiveWindOverlayOpacity?.[channel]),
  );
  return Math.max(wind, overlay, effectiveWind, effectiveOverlay);
}

function totalWindActivity(sample) {
  return Math.max(...WIND_CHANNELS.map((channel) => channelActivity(sample, channel)));
}

function channelPeak(samples, channel, startPagePerformanceMs, endPagePerformanceMs) {
  const withinWindow = samples.filter((sample) => (
    sample.pagePerformanceMs >= startPagePerformanceMs
    && sample.pagePerformanceMs <= endPagePerformanceMs
  ));
  return withinWindow.reduce((best, sample) => {
    const activity = channelActivity(sample, channel);
    return !best || activity > best.activity ? { sample, activity } : best;
  }, null);
}

function findWindEpisodes(samples) {
  const ordered = [...samples].sort((left, right) => left.pagePerformanceMs - right.pagePerformanceMs);
  const episodes = [];
  let current = null;
  for (const sample of ordered) {
    const activity = totalWindActivity(sample);
    const active = activity >= WIND_ACTIVITY_THRESHOLD;
    if (active) {
      if (!current || sample.pagePerformanceMs - current.lastPagePerformanceMs > 250) {
        if (current) episodes.push(current);
        current = {
          startPagePerformanceMs: sample.pagePerformanceMs,
          endPagePerformanceMs: sample.pagePerformanceMs,
          startRuntimeElapsedMs: sample.runtimeElapsedMs,
          endRuntimeElapsedMs: sample.runtimeElapsedMs,
          lastPagePerformanceMs: sample.pagePerformanceMs,
          peakActivity: activity,
          peakSample: sample,
        };
      } else {
        current.endPagePerformanceMs = sample.pagePerformanceMs;
        current.endRuntimeElapsedMs = sample.runtimeElapsedMs;
        current.lastPagePerformanceMs = sample.pagePerformanceMs;
        if (activity > current.peakActivity) {
          current.peakActivity = activity;
          current.peakSample = sample;
        }
      }
    } else if (current && sample.pagePerformanceMs - current.lastPagePerformanceMs > 160) {
      episodes.push(current);
      current = null;
    }
  }
  if (current) episodes.push(current);
  return episodes.map(({ lastPagePerformanceMs: _last, ...episode }) => episode);
}

function framesNearestPageTime(frames, anchor, pagePerformanceMs, count) {
  const targetNodePerformanceMs = anchor.nodePerformanceMs
    + (pagePerformanceMs - anchor.pagePerformanceMs);
  return frames
    .map((frame) => ({
      frame,
      deltaMs: Math.abs(frame.receivedAtNodePerformanceMs - targetNodePerformanceMs),
    }))
    .sort((left, right) => left.deltaMs - right.deltaMs)
    .slice(0, count)
    .sort((left, right) => (
      left.frame.receivedAtNodePerformanceMs - right.frame.receivedAtNodePerformanceMs
    ));
}

async function extractFramePng(frame, outputPath) {
  const ffmpeg = executableFromEnvironment("FFMPEG_PATH", [
    "/opt/homebrew/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "ffmpeg",
  ]);
  await execFile(ffmpeg, [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-i", frame.path,
    "-frames:v", "1",
    outputPath,
  ]);
}

async function materializeSelection({
  recording,
  anchor,
  sample,
  kind,
  outputName,
  reference,
  channel = null,
  activity = null,
}) {
  if (!sample) return null;
  const matches = framesNearestPageTime(
    recording.frames,
    anchor,
    sample.pagePerformanceMs,
    STABLE_FRAME_CANDIDATE_COUNT,
  );
  if (matches.length === 0) return null;
  const outputPath = resolve(outputDir, outputName);
  await rm(outputPath, { force: true });
  const candidateRoot = resolve(
    outputDir,
    "stable-keyframe-candidates",
    selectionSlug(`${kind}-${channel ?? "scene"}-${sample.runtimeElapsedMs.toFixed(0)}`),
  );
  await mkdir(candidateRoot, { recursive: true });
  const candidates = [];
  for (const [candidateIndex, match] of matches.entries()) {
    const candidatePath = resolve(
      candidateRoot,
      `candidate-${String(candidateIndex + 1).padStart(2, "0")}-cdp-${String(match.frame.index).padStart(6, "0")}.jpg`,
    );
    await copyFile(match.frame.path, candidatePath);
    candidates.push({
      candidateIndex: candidateIndex + 1,
      path: candidatePath,
      sha256: await sha256File(candidatePath),
      sourceCdpFrameIndex: match.frame.index,
      sourceFrameDeltaMs: match.deltaMs,
      metrics: await scoreFrameAgainstCleanPlate(candidatePath, reference),
    });
  }
  const ranked = [...candidates].sort(stableCandidateOrder);
  const selected = ranked.find((candidate) => candidate.metrics.structureComplete) ?? null;
  if (selected) await extractFramePng({ path: selected.path }, outputPath);
  return {
    kind,
    channel,
    activity,
    status: selected ? "STABLE_FRAME_SELECTED" : "CAPTURE_ARTIFACT",
    visualEvidence: selected ? "REVIEW_REQUIRED" : "NOT_VISUAL_EVIDENCE",
    outputPath: selected ? outputPath : null,
    runtimeElapsedMs: sample.runtimeElapsedMs,
    sampleElapsedMs: sample.elapsedMs,
    pagePerformanceMs: sample.pagePerformanceMs,
    candidateSource:
      "Seven consecutive-nearby CDP screencast frames around the target runtime; candidates are retained.",
    selectionPolicy: {
      candidateCountRequested: STABLE_FRAME_CANDIDATE_COUNT,
      minimumSsimAll: STABLE_FRAME_MIN_SSIM,
      minimumPsnrAverageDb: STABLE_FRAME_MIN_PSNR_DB,
      requiredDimensions: { width: reference.width, height: reference.height },
      ranking: "eligible structure-complete frames first; highest full-frame SSIM; PSNR tie-break",
      reason: selected
        ? "Selected the highest-ranked structure-complete frame against the approved clean plate."
        : "No candidate met the predeclared full-frame structure thresholds; no keyframe was emitted.",
    },
    reference,
    selectedCandidate: selected,
    candidates,
  };
}

async function captureStablePageScreenshot(page, {
  label,
  outputName,
  reference,
}) {
  const outputPath = resolve(outputDir, outputName);
  await rm(outputPath, { force: true });
  const candidateRoot = resolve(
    outputDir,
    "stable-keyframe-candidates",
    selectionSlug(label),
  );
  await mkdir(candidateRoot, { recursive: true });
  const candidates = [];
  for (let index = 0; index < STABLE_FRAME_CANDIDATE_COUNT; index += 1) {
    await page.evaluate(() => new Promise((resolveFrame) => requestAnimationFrame(() => resolveFrame())));
    const candidatePath = resolve(
      candidateRoot,
      `candidate-${String(index + 1).padStart(2, "0")}.png`,
    );
    const capturedAt = await compactSnapshotAtPage(page);
    await page.screenshot({ path: candidatePath });
    candidates.push({
      candidateIndex: index + 1,
      path: candidatePath,
      sha256: await sha256File(candidatePath),
      pagePerformanceMs: capturedAt?.pagePerformanceMs ?? null,
      runtimeElapsedMs: capturedAt?.runtimeElapsedMs ?? null,
      metrics: await scoreFrameAgainstCleanPlate(candidatePath, reference),
    });
  }
  const ranked = [...candidates].sort(stableCandidateOrder);
  const selected = ranked.find((candidate) => candidate.metrics.structureComplete) ?? null;
  if (selected) await copyFile(selected.path, outputPath);
  return {
    kind: "live-page-stable-screenshot",
    label,
    status: selected ? "STABLE_FRAME_SELECTED" : "CAPTURE_ARTIFACT",
    visualEvidence: selected ? "REVIEW_REQUIRED" : "NOT_VISUAL_EVIDENCE",
    outputPath: selected ? outputPath : null,
    candidateSource:
      "Seven consecutive requestAnimationFrame-aligned page screenshots at the target state; candidates are retained.",
    selectionPolicy: {
      candidateCountRequested: STABLE_FRAME_CANDIDATE_COUNT,
      minimumSsimAll: STABLE_FRAME_MIN_SSIM,
      minimumPsnrAverageDb: STABLE_FRAME_MIN_PSNR_DB,
      requiredDimensions: { width: reference.width, height: reference.height },
      ranking: "eligible structure-complete frames first; highest full-frame SSIM; PSNR tie-break",
      reason: selected
        ? "Selected the highest-ranked structure-complete frame against the approved SHOW_ALL reference."
        : "No candidate met the predeclared full-frame structure thresholds; no screenshot was emitted.",
    },
    reference,
    selectedCandidate: selected,
    candidates,
  };
}

function parsePerFrameMetricLog(text, field) {
  return text.trim().split("\n").filter(Boolean).map((line) => {
    const frameMatch = line.match(/\bn:(\d+)/);
    const valueMatch = line.match(new RegExp(`\\b${field}:([0-9.]+|inf)`));
    return {
      frame: frameMatch ? Number(frameMatch[1]) : null,
      value: valueMatch
        ? (valueMatch[1] === "inf" ? Number.POSITIVE_INFINITY : Number(valueMatch[1]))
        : null,
    };
  }).filter((entry) => entry.frame !== null && entry.value !== null);
}

async function inspectVideoCaptureArtifacts(videoPath, durationSeconds, reference, label) {
  const ffmpeg = executableFromEnvironment("FFMPEG_PATH", [
    "/opt/homebrew/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "ffmpeg",
  ]);
  const metricsRoot = resolve(outputDir, "video-structure-metrics");
  await mkdir(metricsRoot, { recursive: true });
  const ssimPath = resolve(metricsRoot, `${selectionSlug(label)}-ssim.log`);
  const psnrPath = resolve(metricsRoot, `${selectionSlug(label)}-psnr.log`);
  await rm(ssimPath, { force: true });
  await rm(psnrPath, { force: true });
  await execFile(ffmpeg, [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-i", videoPath,
    "-framerate", "30",
    "-loop", "1",
    "-i", reference.path,
    "-filter_complex",
    `[0:v]split=2[v0][v1];[1:v]split=2[r0][r1];[v0][r0]ssim=stats_file=${ssimPath}[s];[v1][r1]psnr=stats_file=${psnrPath}[p]`,
    "-map", "[s]",
    "-map", "[p]",
    "-t", durationSeconds.toFixed(3),
    "-f", "null",
    "-",
  ], { maxBuffer: 10 * 1024 * 1024 });
  const ssim = parsePerFrameMetricLog(await readFile(ssimPath, "utf8"), "All");
  const psnr = parsePerFrameMetricLog(await readFile(psnrPath, "utf8"), "psnr_avg");
  const psnrByFrame = new Map(psnr.map((entry) => [entry.frame, entry.value]));
  const frames = ssim.map((entry) => ({
    frame: entry.frame,
    ssimAll: entry.value,
    psnrAverageDb: psnrByFrame.get(entry.frame) ?? null,
    structureComplete: entry.value >= STABLE_FRAME_MIN_SSIM
      && (psnrByFrame.get(entry.frame) ?? Number.NEGATIVE_INFINITY) >= STABLE_FRAME_MIN_PSNR_DB,
  }));
  const artifactFrames = frames.filter((entry) => !entry.structureComplete);
  return {
    status: artifactFrames.length === 0
      ? "STRUCTURE_SCAN_CLEAR_REVIEW_REQUIRED"
      : "CAPTURE_ARTIFACT",
    visualEvidence: artifactFrames.length === 0 ? "REVIEW_REQUIRED" : "NOT_VISUAL_EVIDENCE",
    method:
      "Every encoded frame compared against the approved clean plate using FFmpeg SSIM and PSNR.",
    thresholds: {
      minimumSsimAll: STABLE_FRAME_MIN_SSIM,
      minimumPsnrAverageDb: STABLE_FRAME_MIN_PSNR_DB,
      requiredDimensions: { width: reference.width, height: reference.height },
    },
    reference,
    frameCountScored: frames.length,
    minimumSsimAll: frames.length > 0 ? Math.min(...frames.map((entry) => entry.ssimAll)) : null,
    minimumPsnrAverageDb: frames.length > 0
      ? Math.min(...frames.map((entry) => entry.psnrAverageDb ?? Number.POSITIVE_INFINITY))
      : null,
    artifactFrameCount: artifactFrames.length,
    artifactFrames,
    metricLogs: { ssimPath, psnrPath },
  };
}

async function cleanupRecording(recording) {
  const root = recording?.frameRoot;
  if (!root) return;
  const safePrefix = resolve(tmpdir(), "outdoor-motion-");
  if (!resolve(root).startsWith(safePrefix)) {
    throw new Error(`Refusing to clean unexpected frame directory: ${root}`);
  }
  await rm(root, { recursive: true, force: true });
}

async function captureNormal(browser, baseUrl, reference) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  const observation = observePage(page, "normal-390x844");
  let encodedRecording = null;
  try {
    await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 30_000 });
    await waitForOutdoor(page);
    await startPageSampler(page);
    const anchor = await takeClockAnchor(page);
    const recorder = await startScreencast(page, "normal-390x844");
    const replaySnapshot = await replayAndSnapshot(page);

    let invariantAt5s;
    let input;
    if (FIRST_TOUCH_AT_RUNTIME_MS <= 5_000) {
      await waitForRuntime(page, FIRST_TOUCH_AT_RUNTIME_MS);
      input = await recordTouch(page, "first-touch-runtime-probe", 195, 422);
      await waitForTouchAudioState(page, input);
      await waitForRuntime(page, 5_000);
      invariantAt5s = await captureSceneGraphInvariant(page, "normal-runtime-5s");
    } else {
      await waitForRuntime(page, 5_000);
      invariantAt5s = await captureSceneGraphInvariant(page, "normal-runtime-5s");
      await waitForRuntime(page, FIRST_TOUCH_AT_RUNTIME_MS);
      input = await recordTouch(page, "first-touch-runtime-probe", 195, 422);
      await waitForTouchAudioState(page, input);
    }
    await waitForRuntime(page, 10_000);
    const invariantAt10s = await captureSceneGraphInvariant(page, "normal-runtime-10s");
    await waitForRuntime(page, NORMAL_CAPTURE_MS);
    const endingSnapshot = await compactSnapshotAtPage(page);
    const sampled = await stopPageSampler(page);
    const videoPath = resolve(outputDir, "normal-390x844-36s.mp4");
    encodedRecording = await stopAndEncodeScreencast(
      recorder,
      videoPath,
      NORMAL_REQUIRED_VIDEO_SECONDS,
    );
    const videoStructure = await inspectVideoCaptureArtifacts(
      videoPath,
      encodedRecording.encodedDurationSeconds,
      reference,
      "normal-390x844-36s",
    );

    const samples = [replaySnapshot, ...sampled.samples, endingSnapshot]
      .filter(Boolean)
      .sort((left, right) => left.pagePerformanceMs - right.pagePerformanceMs);
    const inputPagePerformanceMs = input.effectiveAfter?.pagePerformanceMs
      ?? input.after?.pagePerformanceMs
      ?? input.before?.pagePerformanceMs
      ?? replaySnapshot.pagePerformanceMs + FIRST_TOUCH_AT_RUNTIME_MS;
    const touchWindowEndMs = inputPagePerformanceMs + FIRST_TOUCH_CHAIN_WINDOW_MS;
    const channelPeaks = Object.fromEntries(WIND_CHANNELS.map((channel) => [
      channel,
      channelPeak(samples, channel, inputPagePerformanceMs - 100, touchWindowEndMs),
    ]));
    const episodes = findWindEpisodes(samples);
    const firstTouchEpisode = episodes.find((episode) => (
      episode.startPagePerformanceMs >= inputPagePerformanceMs - 200
      && episode.startPagePerformanceMs <= inputPagePerformanceMs + 2_000
    )) ?? null;
    const recurringSearchAfterMs = firstTouchEpisode
      ? firstTouchEpisode.endPagePerformanceMs + 7_000
      : inputPagePerformanceMs + FIRST_TOUCH_CHAIN_WINDOW_MS + 7_000;
    const recurringEpisode = episodes.find((episode) => (
      episode.startPagePerformanceMs >= recurringSearchAfterMs
    )) ?? null;

    const selections = [];
    for (const [kind, targetMs, outputName] of [
      ["start", 0, "normal-390x844-start.png"],
      ["middle", 17_500, "normal-390x844-middle.png"],
      ["end", 35_000, "normal-390x844-end.png"],
    ]) {
      selections.push(await materializeSelection({
        recording: encodedRecording,
        anchor,
        sample: sampleNearestRuntime(samples, targetMs),
        kind,
        outputName,
        reference,
      }));
    }
    for (const channel of WIND_CHANNELS) {
      const peak = channelPeaks[channel];
      selections.push(await materializeSelection({
        recording: encodedRecording,
        anchor,
        sample: peak?.sample ?? null,
        kind: "first-touch-channel-peak",
        channel,
        activity: peak?.activity ?? null,
        outputName: `normal-390x844-channel-${channel}-peak.png`,
        reference,
      }));
    }
    selections.push(await materializeSelection({
      recording: encodedRecording,
      anchor,
      sample: recurringEpisode?.peakSample ?? null,
      kind: "recurring-gust-peak",
      activity: recurringEpisode?.peakActivity ?? null,
      outputName: "normal-390x844-recurring-gust-peak.png",
      reference,
    }));

    const gapsBetweenEpisodesMs = episodes.slice(1).map((episode, index) => (
      episode.startPagePerformanceMs - episodes[index].endPagePerformanceMs
    ));
    if (episodes.length > 0) {
      gapsBetweenEpisodesMs.push(
        endingSnapshot.pagePerformanceMs - episodes.at(-1).endPagePerformanceMs,
      );
    }
    const maximumVisibleWindGapMs = gapsBetweenEpisodesMs.length > 0
      ? Math.max(...gapsBetweenEpisodesMs)
      : null;
    const issues = [];
    if (!input.audioState?.settled?.audioUnlocked || !input.audioState?.settled?.ambientPlaying) {
      issues.push("First touch did not unlock and start the ambient channel in the captured Web run.");
    }
    if (!firstTouchEpisode) {
      issues.push("No distinct visual-wind episode was exposed by the runtime snapshot after the 6.2s first touch.");
    }
    if (!recurringEpisode) {
      issues.push("No post-touch recurring visual-wind episode was exposed within the >=35s capture.");
    }
    for (const channel of WIND_CHANNELS) {
      if ((channelPeaks[channel]?.activity ?? 0) < WIND_ACTIVITY_THRESHOLD) {
        issues.push(`No active first-touch peak was exposed for ${channel}.`);
      }
    }
    if (maximumVisibleWindGapMs !== null && maximumVisibleWindGapMs > MAX_VISIBLE_WIND_GAP_MS) {
      issues.push(
        `Detected visual-wind gap ${maximumVisibleWindGapMs.toFixed(1)}ms exceeds ${MAX_VISIBLE_WIND_GAP_MS}ms.`,
      );
    }
    for (const selection of selections.filter(Boolean)) {
      if (selection.status !== "STABLE_FRAME_SELECTED") {
        issues.push(`${selection.kind}/${selection.channel ?? "scene"}: all keyframe candidates were capture artifacts.`);
      }
    }
    if (videoStructure.status === "CAPTURE_ARTIFACT") {
      issues.push(
        `Encoded normal video contains ${videoStructure.artifactFrameCount} structurally incomplete capture frame(s); video is NOT_VISUAL_EVIDENCE.`,
      );
    }
    for (const invariant of [invariantAt5s, invariantAt10s]) {
      if (!invariant.supported || !invariant.allChecksPass) {
        issues.push(`${invariant.label}: scene graph invariant unavailable or changed.`);
      }
    }
    issues.push(...actionableObservationErrors(observation));

    const runtimeEvidence = {
      capture: "normal-390x844",
      candidateIdExpected: CANDIDATE_ID,
      replaySnapshot,
      endingSnapshot,
      input,
      samplerIntervalTargetMs: 40,
      windActivityThreshold: WIND_ACTIVITY_THRESHOLD,
      samples,
      episodes,
      firstTouchEpisode,
      recurringEpisode,
      channelPeaks,
      sceneGraphInvariants: [invariantAt5s, invariantAt10s],
      videoStructure,
    };
    await writeFile(
      resolve(outputDir, "normal-390x844-runtime-snapshots.json"),
      `${JSON.stringify(runtimeEvidence, null, 2)}\n`,
    );
    await writeFile(
      resolve(outputDir, "normal-390x844-keyframes.json"),
      `${JSON.stringify(selections.filter(Boolean), null, 2)}\n`,
    );
    return {
      viewport: { width: 390, height: 844 },
      durationRequiredSeconds: NORMAL_REQUIRED_VIDEO_SECONDS,
      recording: {
        ...encodedRecording,
        frames: undefined,
        frameRoot: undefined,
        structure: videoStructure,
      },
      input,
      frameTimingApproximation: summarizeFrameGaps(sampled.frameGapsMs),
      episodes,
      firstTouchEpisode,
      recurringEpisode,
      maximumVisibleWindGapMs,
      sceneGraphInvariants: [invariantAt5s, invariantAt10s],
      keyframes: selections.filter(Boolean),
      observation,
      issues,
    };
  } finally {
    await context.close();
    await cleanupRecording(encodedRecording);
  }
}

function reducedTransformMaximum(samples) {
  let maximum = 0;
  for (const sample of samples) {
    for (const channel of WIND_CHANNELS) {
      maximum = Math.max(
        maximum,
        Math.abs(finiteNumber(sample.motion?.wind?.[channel])),
        Math.abs(finiteNumber(sample.motion?.effectiveWind?.[channel])),
      );
    }
    maximum = Math.max(
      maximum,
      Math.abs(finiteNumber(sample.motion?.humanBreath)),
      Math.abs(finiteNumber(sample.motion?.catBreath)),
      ...((sample.motion?.cloudOffsetX ?? []).map((value) => Math.abs(finiteNumber(value)))),
    );
  }
  return maximum;
}

async function captureReducedMotion(browser, baseUrl, reference) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  const observation = observePage(page, "reduced-motion-390x844");
  let encodedRecording = null;
  try {
    await page.goto(withQueryParameter(baseUrl, "reducedMotion", "1"), {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    await waitForOutdoor(page);
    await page.evaluate(() => globalThis.__OUTDOOR_GATE_C__.setReducedMotion(true));
    await startPageSampler(page);
    const anchor = await takeClockAnchor(page);
    const recorder = await startScreencast(page, "reduced-390x844");
    const replaySnapshot = await replayAndSnapshot(page);
    await waitForRuntime(page, REDUCED_TOUCH_AT_RUNTIME_MS);
    const input = await recordTouch(page, "reduced-motion-first-touch", 195, 422);
    await waitForTouchAudioState(page, input);
    await waitForRuntime(page, REDUCED_CAPTURE_MS);
    const endingSnapshot = await compactSnapshotAtPage(page);
    const sampled = await stopPageSampler(page);
    const videoPath = resolve(outputDir, "reduced-motion-390x844-10s.mp4");
    encodedRecording = await stopAndEncodeScreencast(recorder, videoPath, 8);
    const videoStructure = await inspectVideoCaptureArtifacts(
      videoPath,
      encodedRecording.encodedDurationSeconds,
      reference,
      "reduced-motion-390x844-10s",
    );
    const samples = [replaySnapshot, ...sampled.samples, endingSnapshot]
      .filter(Boolean)
      .sort((left, right) => left.pagePerformanceMs - right.pagePerformanceMs);
    const maximumTransformMotion = reducedTransformMaximum(samples);
    const selections = [];
    for (const [kind, targetMs, outputName] of [
      ["reduced-start", 0, "reduced-motion-390x844-start.png"],
      ["reduced-middle", 5_000, "reduced-motion-390x844-middle.png"],
      ["reduced-end", 9_500, "reduced-motion-390x844-end.png"],
    ]) {
      selections.push(await materializeSelection({
        recording: encodedRecording,
        anchor,
        sample: sampleNearestRuntime(samples, targetMs),
        kind,
        outputName,
        reference,
      }));
    }

    const issues = [];
    if (!samples.every((sample) => sample.reducedMotion === true)) {
      issues.push("Reduced-motion capture exposed at least one sample with reducedMotion=false.");
    }
    if (maximumTransformMotion > 0.000001) {
      issues.push(`Reduced-motion transform channel maximum was ${maximumTransformMotion}.`);
    }
    for (const selection of selections.filter(Boolean)) {
      if (selection.status !== "STABLE_FRAME_SELECTED") {
        issues.push(`${selection.kind}: all keyframe candidates were capture artifacts.`);
      }
    }
    if (videoStructure.status === "CAPTURE_ARTIFACT") {
      issues.push(
        `Encoded reduced-motion video contains ${videoStructure.artifactFrameCount} structurally incomplete capture frame(s); video is NOT_VISUAL_EVIDENCE.`,
      );
    }
    issues.push(...actionableObservationErrors(observation));
    await writeFile(
      resolve(outputDir, "reduced-motion-390x844-runtime-snapshots.json"),
      `${JSON.stringify({
        capture: "reduced-motion-390x844",
        replaySnapshot,
        endingSnapshot,
        input,
        samples,
        maximumTransformMotion,
        videoStructure,
      }, null, 2)}\n`,
    );
    await writeFile(
      resolve(outputDir, "reduced-motion-390x844-keyframes.json"),
      `${JSON.stringify(selections.filter(Boolean), null, 2)}\n`,
    );
    return {
      viewport: { width: 390, height: 844 },
      recording: {
        ...encodedRecording,
        frames: undefined,
        frameRoot: undefined,
        structure: videoStructure,
      },
      input,
      maximumTransformMotion,
      frameTimingApproximation: summarizeFrameGaps(sampled.frameGapsMs),
      keyframes: selections.filter(Boolean),
      observation,
      issues,
    };
  } finally {
    await context.close();
    await cleanupRecording(encodedRecording);
  }
}

async function captureResponsiveViewport(browser, baseUrl, width, height, reference) {
  const label = `responsive-${width}x${height}`;
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  const observation = observePage(page, label);
  try {
    await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 30_000 });
    await waitForOutdoor(page);
    const initial = await replayAndSnapshot(page);
    const startScreenshot = await captureStablePageScreenshot(page, {
      label: `${label}-start`,
      outputName: `${label}-start.png`,
      reference,
    });
    await waitForRuntime(page, 1_000);
    const input = await recordTouch(page, `${label}-first-touch`, width / 2, height / 2);
    await waitForRuntime(page, RESPONSIVE_MOTION_CAPTURE_MS);
    const motion = await compactSnapshotAtPage(page);
    const motionScreenshot = await captureStablePageScreenshot(page, {
      label: `${label}-motion`,
      outputName: `${label}-motion.png`,
      reference,
    });
    const canvas = await page.evaluate(() => {
      const bounds = document.querySelector("canvas")?.getBoundingClientRect();
      return bounds
        ? { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }
        : null;
    });
    const issues = [];
    if (!motion?.mounted) issues.push(`${label}: outdoor scene was not mounted at motion capture.`);
    for (const screenshot of [startScreenshot, motionScreenshot]) {
      if (screenshot.status !== "STABLE_FRAME_SELECTED") {
        issues.push(`${screenshot.label}: all screenshot candidates were capture artifacts.`);
      }
    }
    issues.push(...actionableObservationErrors(observation));
    return {
      viewport: { width, height },
      canvas,
      initial,
      input,
      motion,
      screenshots: {
        start: startScreenshot,
        motion: motionScreenshot,
      },
      observation,
      issues,
    };
  } finally {
    await context.close();
  }
}

async function main() {
  const target = await resolveTarget(targetArgument);
  const chromium = await loadPlaywrightChromium();
  const chromeExecutable = executableFromEnvironment("CHROME_EXECUTABLE", [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ]);
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: chromeExecutable,
      headless: true,
      args: [
        "--enable-precise-memory-info",
        "--enable-webgl",
        "--ignore-gpu-blocklist",
        "--use-angle=swiftshader",
      ],
    });
    const cleanPlateReferences = await prepareCleanPlateReferences();
    const reference390 = cleanPlateReferences.references["390x844"];
    const normal = await captureNormal(browser, target.baseUrl, reference390);
    const reducedMotion = await captureReducedMotion(browser, target.baseUrl, reference390);
    const responsive = {};
    for (const [width, height] of [[360, 800], [430, 932], [430, 844]]) {
      responsive[`${width}x${height}`] = await captureResponsiveViewport(
        browser,
        target.baseUrl,
        width,
        height,
        cleanPlateReferences.references[`${width}x${height}`],
      );
    }
    const issues = [
      ...normal.issues.map((issue) => `normal: ${issue}`),
      ...reducedMotion.issues.map((issue) => `reduced: ${issue}`),
      ...Object.entries(responsive).flatMap(([label, evidence]) => (
        evidence.issues.map((issue) => `${label}: ${issue}`)
      )),
    ];
    const report = {
      scriptId: SCRIPT_ID,
      candidateIdExpected: CANDIDATE_ID,
      generatedAt: new Date().toISOString(),
      target: {
        argument: targetArgument,
        baseUrl: target.baseUrl,
        buildRoot: target.buildRoot,
      },
      browser: {
        version: browser.version(),
        executable: chromeExecutable,
        viewportDeviceScaleFactor: 1,
        rendering: "headless Chrome with SwiftShader for deterministic local Web capture",
      },
      status: issues.length === 0 ? "EVIDENCE_CAPTURED" : "BLOCKED",
      visualAcceptance: "NOT_CLAIMED_REQUIRES_UNANNOTATED_HUMAN_REVIEW",
      wechatDeviceAcceptance: "NOT_RUN",
      captureArtifactPolicy: {
        knownRisk:
          "Headless Chrome WebGL double-buffer readback can yield a zoomed/cropped half-frame even when the Cocos scene graph is stable.",
        stableKeyframeRule:
          "Each target uses seven retained candidates; only a dimension-complete candidate meeting the predeclared clean-plate SSIM and PSNR thresholds may be emitted as a reviewable keyframe.",
        videoRule:
          "Every encoded frame is scanned. Any structurally incomplete frame marks the whole video CAPTURE_ARTIFACT / NOT_VISUAL_EVIDENCE.",
        runtimeInvariantRule:
          "OutdoorScene and scene_clean_plate transforms are independently sampled at normal runtime 5s and 10s; invariant values support artifact diagnosis but never replace visible evidence.",
      },
      scope: {
        normal390x844VideoAtLeast35Seconds: true,
        firstTouchAtRuntimeMs: FIRST_TOUCH_AT_RUNTIME_MS,
        recurringGustSearch: true,
        reducedMotionVideo: true,
        responsiveSpotChecks: ["360x800", "430x932", "430x844"],
        doesNotSubstituteDebugValuesForVisibleEvidence: true,
      },
      thresholds: {
        windActivityThresholdForFrameSelectionOnly: WIND_ACTIVITY_THRESHOLD,
        maximumVisibleWindGapMs: MAX_VISIBLE_WIND_GAP_MS,
        stableFrameCandidateCount: STABLE_FRAME_CANDIDATE_COUNT,
        stableFrameMinimumSsimAll: STABLE_FRAME_MIN_SSIM,
        stableFrameMinimumPsnrAverageDb: STABLE_FRAME_MIN_PSNR_DB,
        note:
          "Runtime values select actual recorded frames and detect missing episodes; only artifact-screened screenshots/video can be reviewed as visual evidence.",
      },
      references: cleanPlateReferences,
      normal,
      reducedMotion,
      responsive,
      issues,
    };
    await writeFile(resolve(outputDir, "input-events.json"), `${JSON.stringify({
      normal: normal.input,
      reducedMotion: reducedMotion.input,
      responsive: Object.fromEntries(
        Object.entries(responsive).map(([label, evidence]) => [label, evidence.input]),
      ),
    }, null, 2)}\n`);
    await writeFile(resolve(outputDir, "runtime-errors.json"), `${JSON.stringify({
      normal: normal.observation,
      reducedMotion: reducedMotion.observation,
      responsive: Object.fromEntries(
        Object.entries(responsive).map(([label, evidence]) => [label, evidence.observation]),
      ),
    }, null, 2)}\n`);
    await writeFile(resolve(outputDir, "frame-timing.json"), `${JSON.stringify({
      normal: normal.frameTimingApproximation,
      reducedMotion: reducedMotion.frameTimingApproximation,
    }, null, 2)}\n`);
    await writeFile(resolve(outputDir, "run-report.json"), `${JSON.stringify(report, null, 2)}\n`);

    if (issues.length > 0) {
      process.exitCode = 1;
      console.error(`BLOCKED: captured evidence with ${issues.length} mechanical issue(s).`);
      for (const issue of issues) console.error(`- ${issue}`);
    } else {
      console.log([
        `EVIDENCE_CAPTURED: ${outputDir}`,
        "Visual PASS is intentionally not claimed; review the normal/reduced videos and keyframes at 100% and 25%.",
      ].join("\n"));
    }
  } finally {
    await browser?.close();
    await target.close();
  }
}

try {
  await main();
} catch (error) {
  const fatal = {
    scriptId: SCRIPT_ID,
    candidateIdExpected: CANDIDATE_ID,
    generatedAt: new Date().toISOString(),
    status: "BLOCKED",
    error: error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack ?? "" }
      : { name: "UnknownError", message: String(error), stack: "" },
  };
  await writeFile(resolve(outputDir, "fatal-error.json"), `${JSON.stringify(fatal, null, 2)}\n`);
  throw error;
}
