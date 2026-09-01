import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "/Users/wxl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const baseUrl = process.env.GATE_C_BASE_URL ?? "http://127.0.0.1:4173";
const outputRoot = resolve(
  "/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/gate-c-cocos-evidence",
  process.env.GATE_C_BUILD_ID ?? "gate-c-v7-20260821-41b0b7b1-showall-navy-r5",
  "roi-check",
);
await mkdir(outputRoot, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--enable-webgl", "--ignore-gpu-blocklist", "--use-angle=swiftshader"],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
const consoleErrors = [];
const pageErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => pageErrors.push(error.message));

await page.goto(`${baseUrl}/?reducedMotion=1`, { waitUntil: "networkidle" });
await page.waitForFunction(() => globalThis.__OUTDOOR_GATE_C__?.snapshot().mounted === true);
await page.evaluate(async () => {
  globalThis.__OUTDOOR_GATE_C__.setReducedMotion(true);
  await new Promise((resolveFrame) => requestAnimationFrame(() => requestAnimationFrame(resolveFrame)));
});
const snapshot = await page.evaluate(() => globalThis.__OUTDOOR_GATE_C__.snapshot());
const screenshot = resolve(outputRoot, "premultiplied-screen-neutral.png");
await page.screenshot({ path: screenshot });
const report = { baseUrl, screenshot, snapshot, consoleErrors, pageErrors };
await writeFile(resolve(outputRoot, "capture-report.json"), `${JSON.stringify(report, null, 2)}\n`);
await context.close();
await browser.close();

if (consoleErrors.length > 0 || pageErrors.length > 0) process.exitCode = 1;
console.log(JSON.stringify(report, null, 2));
