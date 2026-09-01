import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "/Users/wxl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const BUILD_ID = process.env.GATE_C_BUILD_ID ?? "gate-c-v7-20260821-41b0b7b1-showall-navy-r5";
const baseUrl = process.env.GATE_C_BASE_URL ?? "http://127.0.0.1:4173";
const evidenceRoot = resolve(
  "/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/gate-c-cocos-evidence",
  BUILD_ID,
);
const BACKPLATE_NATIVE = "82c02588-b264-4833-a4a7-88525e8ae571.png";
await mkdir(evidenceRoot, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const expectedConsoleErrors = [];
const pageErrors = [];
const requestedUrls = [];
page.on("request", (request) => requestedUrls.push(request.url()));
page.on("console", (message) => {
  if (message.type() === "error") expectedConsoleErrors.push(message.text());
});
page.on("pageerror", (error) => pageErrors.push(error.message));

let abortedAssetRequests = 0;
const failBackplate = async (route) => {
  if (route.request().url().includes(BACKPLATE_NATIVE)) {
    abortedAssetRequests += 1;
    await route.abort("failed");
    return;
  }
  await route.continue();
};
await page.route("**/*", failBackplate);
await page.goto(baseUrl, { waitUntil: "networkidle" });
try {
  await page.waitForFunction(
    () => globalThis.__OUTDOOR_GATE_C__?.snapshot().mountState === "failed",
    undefined,
    { timeout: 15_000 },
  );
} catch (error) {
  await writeFile(
    resolve(evidenceRoot, "mount-failure-injection-diagnostic.json"),
    `${JSON.stringify({ abortedAssetRequests, requestedUrls, error: error.message }, null, 2)}\n`,
  );
  throw error;
}
const failedState = await page.evaluate(() => globalThis.__OUTDOOR_GATE_C__.snapshot());

await page.unroute("**/*", failBackplate);
await page.reload({ waitUntil: "networkidle" });
await page.waitForFunction(
  () => globalThis.__OUTDOOR_GATE_C__?.snapshot().mounted === true,
  undefined,
  { timeout: 15_000 },
);
const recoveredState = await page.evaluate(() => globalThis.__OUTDOOR_GATE_C__.snapshot());

const pass = abortedAssetRequests >= 1
  && failedState.mountState === "failed"
  && failedState.loadedFrameCount === 0
  && typeof failedState.mountError === "string"
  && failedState.mountError.length > 0
  && recoveredState.mountState === "mounted"
  && recoveredState.mountError === null
  && recoveredState.spriteCount === 30
  && recoveredState.loadedFrameCount === 30
  && pageErrors.length === 0;
const report = {
  buildId: BUILD_ID,
  injection: `abort every built V7 backplate request containing ${BACKPLATE_NATIVE} until failed state`,
  abortedAssetRequests,
  failedState,
  recoveredState,
  expectedConsoleErrors,
  pageErrors,
  pass,
};
await writeFile(
  resolve(evidenceRoot, "mount-failure-recovery-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
await context.close();
await browser.close();

if (!pass) process.exitCode = 1;
console.log(JSON.stringify(report, null, 2));
