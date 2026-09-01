import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { chromium } from "/Users/wxl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const [
  ,
  ,
  baseUrl,
  outputArgument,
  expectedIndoorCandidateId = "gate-d-mainflow-v4-phone-preview-dev-r3",
  expectedBuildId = "gate-d-mainflow-v4-phone-preview-web-r3",
  evidenceCandidateId = expectedBuildId,
] = process.argv;
if (!baseUrl || !outputArgument) {
  throw new Error(
    "Usage: node scripts/validate-phone-preview-r3-web.mjs "
      + "<url> <output-dir> [indoor-candidate-id] [build-id] [evidence-candidate-id]",
  );
}

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

async function waitForOutdoor(page) {
  await page.waitForFunction(() => {
    const api = globalThis.__OUTDOOR_GATE_C__;
    return api?.snapshot?.().mounted === true;
  }, undefined, { timeout: 20_000 });
}

async function waitForIndoor(page) {
  await page.waitForFunction((candidateId) => {
    const api = globalThis.__INDOOR_N01_PHONE_PREVIEW__;
    return api?.snapshot?.().candidateId === candidateId
      && api.snapshot().assetsLoaded === true;
  }, expectedIndoorCandidateId, { timeout: 20_000 });
}

async function indoorSnapshot(page) {
  return page.evaluate(() => globalThis.__INDOOR_N01_PHONE_PREVIEW__?.snapshot?.() ?? null);
}

async function reachEnding(page, width, height) {
  const point = doorPoint(width, height);
  await page.mouse.click(point.x, point.y);
  await waitForIndoor(page);
  const requiresDurationConfirmation = await page.evaluate(() => (
    globalThis.__INDOOR_N01_PHONE_PREVIEW__?.snapshot?.().formalSessionControls?.mode === "duration"
  ));
  if (requiresDurationConfirmation) {
    await page.waitForFunction(() => (
      globalThis.__INDOOR_N01_PHONE_PREVIEW__?.snapshot?.()
        .formalSessionControls?.durationPromptRevealed === true
    ), undefined, { timeout: 5_000 });
    const durationConfirmed = await page.evaluate(() => {
      const api = globalThis.__INDOOR_N01_PHONE_PREVIEW__;
      return api?.performSessionControlAction?.("select-duration", 5) === true
        && api.performSessionControlAction("confirm-duration") === true;
    });
    if (!durationConfirmed) throw new Error("The explicit five-minute duration was not accepted");
    await page.waitForFunction(() => (
      globalThis.__INDOOR_N01_PHONE_PREVIEW__?.snapshot?.().formalSessionControls?.mode
        === "collapsed"
    ), undefined, { timeout: 5_000 });
  }
  await page.evaluate(() => globalThis.__INDOOR_N01_PHONE_PREVIEW__.tapKettle());
  await page.waitForFunction(() => {
    const beat = globalThis.__INDOOR_N01_PHONE_PREVIEW__?.snapshot?.().beat;
    return beat === "cat" || beat === "righting" || beat === "settled";
  }, undefined, { timeout: 5_000 });
  await page.evaluate(() => globalThis.__INDOOR_N01_PHONE_PREVIEW__.tapCup());
  await page.waitForFunction(() => (
    globalThis.__INDOOR_N01_PHONE_PREVIEW__?.snapshot?.().beat === "settled"
  ), undefined, { timeout: 5_000 });
  const requested = await page.evaluate(() => (
    globalThis.__INDOOR_N01_PHONE_PREVIEW__.performAction("request-ending")
  ));
  if (!requested) throw new Error("The ending action was not accepted");
  await page.waitForFunction(() => {
    const ending = globalThis.__INDOOR_N01_PHONE_PREVIEW__?.snapshot?.().formalEndingUi;
    return ending?.visible === true && ending.mode === "ending" && ending.surface === "wall-note";
  }, undefined, { timeout: 5_000 });
  await page.waitForTimeout(240);
}

async function runViewport(browser, width, height, { reducedMotion = false, fullFlow = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  const warnings = [];
  const requestFailures = [];
  const ignoredConsoleErrors = [];
  page.on("console", (message) => {
    if (
      message.type() === "error"
      && message.text() === "Failed to load resource: the server responded with a status of 404 (File not found)"
    ) {
      // Chrome does not include the URL in this console line. The response
      // listener below records every non-favicon HTTP failure with its URL.
      ignoredConsoleErrors.push(message.text());
    } else if (message.type() === "error") errors.push(message.text());
    if (message.type() === "warning") warnings.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("requestfailed", (request) => requestFailures.push({
    url: request.url(),
    reason: request.failure()?.errorText ?? "unknown",
  }));
  page.on("response", (response) => {
    const url = response.url();
    if (response.status() >= 400 && !url.endsWith("/favicon.ico")) {
      errors.push(`http ${response.status()}: ${url}`);
    }
  });

  const suffix = reducedMotion ? "?reducedMotion=1" : "";
  await page.goto(`${baseUrl}${suffix}`, { waitUntil: "networkidle", timeout: 30_000 });
  await waitForOutdoor(page);
  const label = `${width}x${height}${reducedMotion ? "-reduced" : ""}`;
  await page.screenshot({ path: resolve(outputDir, `${label}-outdoor.png`) });
  await reachEnding(page, width, height);
  await page.screenshot({ path: resolve(outputDir, `${label}-ending-a.png`) });

  await page.evaluate(() => globalThis.__INDOOR_N01_PHONE_PREVIEW__.setLargeText(true));
  await page.waitForFunction(() => {
    const ending = globalThis.__INDOOR_N01_PHONE_PREVIEW__?.snapshot?.().formalEndingUi;
    return ending?.visible === true && ending.largeText === true && ending.surface === "table-paper";
  });
  await page.waitForTimeout(240);
  await page.screenshot({ path: resolve(outputDir, `${label}-ending-b-large.png`) });
  const largeSnapshot = await indoorSnapshot(page);

  const states = { endingLarge: largeSnapshot };
  if (fullFlow) {
    await page.evaluate(() => globalThis.__INDOOR_N01_PHONE_PREVIEW__.setLargeText(false));
    const finished = await page.evaluate(() => (
      globalThis.__INDOOR_N01_PHONE_PREVIEW__.performAction("finish-night")
    ));
    if (!finished) throw new Error("The finish-night action was not accepted");
    await page.waitForFunction(() => (
      globalThis.__INDOOR_N01_PHONE_PREVIEW__?.snapshot?.().formalEndingUi?.mode === "summary"
    ));
    await page.waitForTimeout(240);
    await page.screenshot({ path: resolve(outputDir, `${label}-summary-a.png`) });

    await page.evaluate(() => globalThis.__INDOOR_N01_PHONE_PREVIEW__.performAction("open-share-preview"));
    await page.waitForFunction(() => (
      globalThis.__INDOOR_N01_PHONE_PREVIEW__?.snapshot?.().formalEndingUi?.mode === "share-preview"
    ));
    await page.waitForTimeout(240);
    await page.screenshot({ path: resolve(outputDir, `${label}-share-preview-b.png`) });

    await page.evaluate(() => globalThis.__INDOOR_N01_PHONE_PREVIEW__.performAction("request-wechat-share"));
    await page.waitForFunction(() => (
      globalThis.__INDOOR_N01_PHONE_PREVIEW__?.snapshot?.().formalEndingUi?.mode === "share-failed"
    ));
    await page.waitForTimeout(240);
    await page.screenshot({ path: resolve(outputDir, `${label}-share-failed-b.png`) });

    await page.evaluate(() => globalThis.__INDOOR_N01_PHONE_PREVIEW__.performAction("dismiss-share-failure"));
    await page.waitForFunction(() => (
      globalThis.__INDOOR_N01_PHONE_PREVIEW__?.snapshot?.().formalEndingUi?.mode === "summary"
    ));
    await page.evaluate(() => globalThis.__INDOOR_N01_PHONE_PREVIEW__.performAction("return-to-outdoor"));
    await waitForOutdoor(page);
    await page.screenshot({ path: resolve(outputDir, `${label}-returned-outdoor.png`) });
    states.returnedOutdoor = await page.evaluate(() => globalThis.__OUTDOOR_GATE_C__.snapshot());
  }

  const result = {
    viewport: { width, height },
    reducedMotion,
    errors,
    warnings,
    requestFailures,
    ignoredConsoleErrors,
    states,
  };
  await context.close();
  return result;
}

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--enable-webgl", "--ignore-gpu-blocklist", "--use-angle=swiftshader"],
});
try {
  const results = [];
  results.push(await runViewport(browser, 390, 844, { fullFlow: true }));
  results.push(await runViewport(browser, 360, 800));
  results.push(await runViewport(browser, 430, 932));
  results.push(await runViewport(browser, 390, 844, { reducedMotion: true }));
  const errorCount = results.reduce((sum, result) => sum + result.errors.length, 0);
  const reduced = results.find((result) => result.reducedMotion)?.states.endingLarge?.formalEndingUi;
  const reducedMotionPass = reduced?.reducedMotion === true && reduced.opacityDurationMs === 0;
  const report = {
    candidateId: evidenceCandidateId,
    build: expectedBuildId,
    indoorPreviewCandidateId: expectedIndoorCandidateId,
    result: errorCount === 0 && reducedMotionPass ? "PASS" : "FAIL",
    errorCount,
    reducedMotionPass,
    results,
  };
  await writeFile(resolve(outputDir, "run-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  if (errorCount !== 0) throw new Error(`Web smoke captured ${errorCount} runtime errors`);
  if (!reducedMotionPass) {
    throw new Error("Reduced-motion ending UI did not resolve to an immediate opacity-only state");
  }
  console.log(`PASS: ${results.length} Web smoke paths, ${errorCount} runtime errors.`);
} finally {
  await browser.close();
}
