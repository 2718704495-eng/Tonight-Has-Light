import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { chromium } from "/Users/wxl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const require = createRequire(import.meta.url);
const sharp = require(
  "/Users/wxl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp",
);

const [, , baseUrlArgument, outputArgument, candidateArgument] = process.argv;
if (!baseUrlArgument || !outputArgument) {
  throw new Error(
    "Usage: node scripts/validate-outdoor-illustration-wind-r2-web.mjs <url> <output-dir> [candidate-id]",
  );
}

const CANDIDATE = candidateArgument ?? "OUTDOOR-ILLUSTRATION-WIND-V1-A-R2/local-r3";
const baseUrl = baseUrlArgument.endsWith("/") ? baseUrlArgument : `${baseUrlArgument}/`;
const outputDir = resolve(outputArgument);
await mkdir(outputDir, { recursive: true });

function doorPoint(width, height) {
  const scale = Math.min(width / 390, height / 844);
  const offsetX = (width - 390 * scale) / 2;
  const offsetY = (height - 844 * scale) / 2;
  return {
    x: offsetX + 317 * scale,
    y: offsetY + (844 - 211.5) * scale,
  };
}

async function imageMetric(leftBuffer, rightBuffer) {
  const width = 98;
  const height = 211;
  const [left, right] = await Promise.all([
    sharp(leftBuffer).resize(width, height, { fit: "fill" }).removeAlpha().raw().toBuffer(),
    sharp(rightBuffer).resize(width, height, { fit: "fill" }).removeAlpha().raw().toBuffer(),
  ]);
  let upperTotal = 0;
  let upperSamples = 0;
  let lowerTotal = 0;
  let lowerSamples = 0;
  const upperEnd = Math.floor(height * 0.66);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 3;
      for (let channel = 0; channel < 3; channel += 1) {
        const delta = Math.abs(left[offset + channel] - right[offset + channel]);
        if (y < upperEnd) {
          upperTotal += delta;
          upperSamples += 1;
        } else {
          lowerTotal += delta;
          lowerSamples += 1;
        }
      }
    }
  }
  return {
    upperMeanAbsoluteDelta: upperTotal / upperSamples,
    lowerMeanAbsoluteDelta: lowerTotal / lowerSamples,
  };
}

async function imageRegionMeanDelta(leftBuffer, rightBuffer, region) {
  const [left, right] = await Promise.all([
    sharp(leftBuffer).extract(region).removeAlpha().raw().toBuffer(),
    sharp(rightBuffer).extract(region).removeAlpha().raw().toBuffer(),
  ]);
  let total = 0;
  for (let index = 0; index < left.length; index += 1) {
    total += Math.abs(left[index] - right[index]);
  }
  return total / left.length;
}

async function installDiagnostics(page, diagnostics) {
  page.on("console", (message) => {
    const text = message.text();
    const locationUrl = message.location().url ?? "";
    if (
      message.type() === "error"
      && !text.includes("favicon.ico")
      && !locationUrl.endsWith("/favicon.ico")
    ) {
      diagnostics.consoleErrors.push(text);
    }
  });
  page.on("pageerror", (error) => diagnostics.pageErrors.push(String(error)));
  page.on("requestfailed", (request) => diagnostics.requestFailures.push({
    url: request.url(),
    reason: request.failure()?.errorText ?? "unknown",
  }));
  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().endsWith("/favicon.ico")) {
      diagnostics.httpErrors.push(`${response.status()}: ${response.url()}`);
    }
  });
}

async function waitForOutdoor(page) {
  await page.waitForFunction(
    () => globalThis.__OUTDOOR_GATE_C__?.snapshot?.().mounted === true,
    undefined,
    { timeout: 45_000 },
  );
}

async function requestSettledPage(page, target) {
  const accepted = await page.evaluate((pageIndex) => {
    const api = globalThis.__OUTDOOR_GATE_C__;
    api?.replay?.();
    return pageIndex === 0 ? true : api?.requestIllustrationPage?.(pageIndex) === true;
  }, target);
  if (!accepted) throw new Error(`R2 debug request rejected F${target}`);
  await page.waitForFunction((pageIndex) => {
    const snapshot = globalThis.__OUTDOOR_GATE_C__?.snapshot?.().illustrationWind;
    return snapshot?.currentPage === pageIndex && snapshot.transition === null;
  }, target, { timeout: 4_000 });
  return page.evaluate(() => globalThis.__OUTDOOR_GATE_C__.snapshot().illustrationWind);
}

async function captureViewport(browser, width, height) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const diagnostics = {
    consoleErrors: [],
    pageErrors: [],
    requestFailures: [],
    httpErrors: [],
  };
  await installDiagnostics(page, diagnostics);
  try {
    await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 30_000 });
    await waitForOutdoor(page);
    const buffers = {};
    const snapshots = {};
    for (const target of [0, 1, 2, 3, 4]) {
      snapshots[`F${target}`] = await requestSettledPage(page, target);
      buffers[`F${target}`] = await page.screenshot({
        path: resolve(outputDir, `${width}x${height}-f${target}.png`),
      });
    }
    const metrics = {
      f0ToF2: await imageMetric(buffers.F0, buffers.F2),
      f0ToF4: await imageMetric(buffers.F0, buffers.F4),
    };
    return { width, height, snapshots, metrics, diagnostics };
  } finally {
    await context.close();
  }
}

async function captureTransitionMidpoints(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 30_000 });
    await waitForOutdoor(page);
    const results = {};
    for (const [from, to] of [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]]) {
      await requestSettledPage(page, from);
      const accepted = await page.evaluate((target) => (
        globalThis.__OUTDOOR_GATE_C__?.requestIllustrationPage?.(target) === true
      ), to);
      if (!accepted) throw new Error(`R2 transition probe F${from}->F${to} was rejected`);
      await page.waitForTimeout(70);
      const snapshot = await page.evaluate(
        () => globalThis.__OUTDOOR_GATE_C__.snapshot().illustrationWind,
      );
      await page.screenshot({
        path: resolve(outputDir, `390x844-transition-f${from}-f${to}-midpoint.png`),
      });
      results[`F${from}-F${to}`] = snapshot;
    }
    return results;
  } finally {
    await context.close();
  }
}

async function captureReducedMotion(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}?reducedMotion=1`, { waitUntil: "networkidle", timeout: 30_000 });
    await waitForOutdoor(page);
    await page.mouse.click(195, 390);
    await page.waitForTimeout(1_800);
    const snapshot = await page.evaluate(
      () => globalThis.__OUTDOOR_GATE_C__.snapshot().illustrationWind,
    );
    await page.screenshot({ path: resolve(outputDir, "390x844-reduced-f0.png") });
    return snapshot;
  } finally {
    await context.close();
  }
}

async function captureDoorDuringTransition(browser) {
  const width = 390;
  const height = 844;
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  try {
    await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 30_000 });
    await waitForOutdoor(page);
    const accepted = await page.evaluate(() => {
      const api = globalThis.__OUTDOOR_GATE_C__;
      api.replay();
      return api.requestIllustrationPage(4);
    });
    if (!accepted) throw new Error("R2 door probe transition was rejected");
    const point = doorPoint(width, height);
    await page.mouse.click(point.x, point.y);
    await page.waitForFunction(
      () => globalThis.__INDOOR_N01_PHONE_PREVIEW__?.snapshot?.().assetsLoaded === true,
      undefined,
      { timeout: 20_000 },
    );
    const snapshot = await page.evaluate(
      () => globalThis.__INDOOR_N01_PHONE_PREVIEW__.snapshot(),
    );
    await page.screenshot({ path: resolve(outputDir, "390x844-door-during-transition-indoor.png") });
    return {
      assetsLoaded: snapshot.assetsLoaded,
      beat: snapshot.beat,
      formalSessionControls: snapshot.formalSessionControls,
    };
  } finally {
    await context.close();
  }
}

async function captureAmbientInteractions(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 30_000 });
    await waitForOutdoor(page);
    await page.evaluate(() => globalThis.__OUTDOOR_GATE_C__.replay());
    const neutral = await page.screenshot();

    await page.evaluate(() => globalThis.__OUTDOOR_GATE_C__.pulseSky());
    await page.waitForTimeout(120);
    const skySnapshot = await page.evaluate(() => globalThis.__OUTDOOR_GATE_C__.snapshot());
    const sky = await page.screenshot({
      path: resolve(outputDir, "390x844-sky-feedback.png"),
    });

    await page.waitForTimeout(700);
    const flowerNeutral = await page.screenshot();
    await page.evaluate(() => globalThis.__OUTDOOR_GATE_C__.pulseFlower(0));
    await page.waitForTimeout(30);
    const flowerSnapshot = await page.evaluate(() => globalThis.__OUTDOOR_GATE_C__.snapshot());
    const flower = await page.screenshot({
      path: resolve(outputDir, "390x844-flower-feedback.png"),
    });

    return {
      spriteCount: skySnapshot.spriteCount,
      loadedFrameCount: skySnapshot.loadedFrameCount,
      skyOpacity: skySnapshot.layerOpacities.star_02 ?? 0,
      flowerOpacity: flowerSnapshot.layerOpacities.flower_a_glow ?? 0,
      skyRoiMeanDelta: await imageRegionMeanDelta(neutral, sky, {
        left: 25,
        top: 137,
        width: 45,
        height: 45,
      }),
      flowerRoiMeanDelta: await imageRegionMeanDelta(flowerNeutral, flower, {
        left: 45,
        top: 752,
        width: 54,
        height: 54,
      }),
    };
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--enable-webgl", "--ignore-gpu-blocklist", "--use-angle=swiftshader"],
});

try {
  const responsive = {};
  for (const [width, height] of [[390, 844], [360, 800], [430, 932], [430, 844]]) {
    responsive[`${width}x${height}`] = await captureViewport(browser, width, height);
  }
  const transitions = await captureTransitionMidpoints(browser);
  const reducedMotion = await captureReducedMotion(browser);
  const doorDuringTransition = await captureDoorDuringTransition(browser);
  const ambientInteractions = await captureAmbientInteractions(browser);
  const issues = [];
  for (const [label, result] of Object.entries(responsive)) {
    for (const key of ["f0ToF2", "f0ToF4"]) {
      const metric = result.metrics[key];
      if (metric.upperMeanAbsoluteDelta > 0.05) {
        issues.push(`${label}/${key}: stable upper scene drifted (${metric.upperMeanAbsoluteDelta})`);
      }
      if (metric.lowerMeanAbsoluteDelta < 1) {
        issues.push(`${label}/${key}: lower-page difference is too small (${metric.lowerMeanAbsoluteDelta})`);
      }
    }
    for (const [kind, values] of Object.entries(result.diagnostics)) {
      if (values.length > 0) issues.push(`${label}: ${kind}=${JSON.stringify(values)}`);
    }
  }
  for (const [label, transition] of Object.entries(transitions)) {
    if (!transition.transition || Math.abs(transition.opacitySum - 1) > 1 / 255) {
      issues.push(`${label}: 140ms transition did not retain two complementary visible pages`);
    }
  }
  if (
    reducedMotion.currentPage !== 0
    || reducedMotion.transition !== null
    || reducedMotion.reducedMotion !== true
  ) {
    issues.push("reduced motion did not remain on the neutral F0 page");
  }
  if (!doorDuringTransition.assetsLoaded) {
    issues.push("door did not reach the warm room during a wind-page transition");
  }
  if (ambientInteractions.spriteCount !== 15 || ambientInteractions.loadedFrameCount !== 18) {
    issues.push(
      `R2 runtime loaded legacy hidden layers (${ambientInteractions.spriteCount} sprites / ${ambientInteractions.loadedFrameCount} frames)`,
    );
  }
  if (ambientInteractions.skyOpacity <= 0 || ambientInteractions.skyRoiMeanDelta <= 0.005) {
    issues.push("sky feedback is not visibly composited above the R2 illustration");
  }
  if (ambientInteractions.flowerOpacity <= 0 || ambientInteractions.flowerRoiMeanDelta <= 0.005) {
    issues.push("flower feedback is not visibly composited above the R2 illustration");
  }
  const report = {
    candidate: CANDIDATE,
    generatedAt: new Date().toISOString(),
    baseUrl,
    result: issues.length === 0 ? "PASS" : "FAIL",
    issues,
    responsive,
    transition: transitions["F0-F1"],
    transitions,
    reducedMotion,
    doorDuringTransition,
    ambientInteractions,
    caveat: "Local Web mechanical evidence only; not WeChat-device or human visibility evidence.",
  };
  await writeFile(
    resolve(outputDir, "r2-web-validation-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  if (issues.length > 0) throw new Error(issues.join("\n"));
  console.log("PASS: R2 five pages, all transition midpoints, ambient feedback, reduced motion and door transition");
} finally {
  await browser.close();
}
