import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const evidenceDir = join(root, "evidence");
const baseUrl = process.env.SESSION_CONTROLS_BASE_URL
  || "http://127.0.0.1:4181/design-board/formal-session-controls-v1/";
const chromePath = process.env.CHROME_PATH
  || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const cases = [
  ["a-duration-390x844", 390, 844, "a-duration"],
  ["a-ready-390x844", 390, 844, "a-ready"],
  ["a-settings-390x844", 390, 844, "a-settings"],
  ["b-tags-390x844", 390, 844, "b-tags"],
  ["c-drawer-390x844", 390, 844, "c-drawer"],
  ["large-duration-360x800", 360, 800, "large-duration"],
  ["a-duration-430x932", 430, 932, "a-duration"],
  ["a-duration-430x844-pressure", 430, 844, "a-duration"],
  ["a-duration-reduced-390x844", 390, 844, "a-duration", true],
];

function startChrome() {
  const profile = mkdtempSync(join(tmpdir(), "session-controls-cdp-"));
  const child = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });

  const endpoint = new Promise((resolve, reject) => {
    let stderr = "";
    const timer = setTimeout(() => reject(new Error(`Chrome endpoint timeout\n${stderr}`)), 10000);
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (!match) return;
      clearTimeout(timer);
      resolve(match[1]);
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Chrome exited before DevTools was ready (${code})\n${stderr}`));
    });
  });
  return { child, endpoint, profile };
}

function cdpClient(url) {
  const socket = new WebSocket(url);
  let nextId = 0;
  const pending = new Map();
  const waiters = new Map();
  const opened = new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
      return;
    }
    const queue = waiters.get(message.method);
    if (queue?.length) queue.shift()(message.params);
  });
  const send = (method, params = {}) => {
    const id = ++nextId;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  };
  const once = (method, timeoutMs = 10000) => new Promise((resolve, reject) => {
    const queue = waiters.get(method) || [];
    let timer;
    const done = (payload) => {
      clearTimeout(timer);
      resolve(payload);
    };
    queue.push(done);
    waiters.set(method, queue);
    timer = setTimeout(() => {
      const current = waiters.get(method) || [];
      const index = current.indexOf(done);
      if (index >= 0) current.splice(index, 1);
      reject(new Error(`Timed out waiting for ${method}`));
    }, timeoutMs);
  });
  return { socket, opened, send, once };
}

async function newTarget(browserEndpoint) {
  const endpoint = new URL(browserEndpoint);
  const response = await fetch(`http://${endpoint.host}/json/new?${encodeURIComponent("about:blank")}`, {
    method: "PUT",
  });
  if (!response.ok) throw new Error(`Unable to create Chrome target: ${response.status}`);
  return response.json();
}

async function capture(browserEndpoint, [name, width, height, view, reducedMotion = false]) {
  const target = await newTarget(browserEndpoint);
  const client = cdpClient(target.webSocketDebuggerUrl);
  await client.opened;
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    screenWidth: width,
    screenHeight: height,
    deviceScaleFactor: 1,
    mobile: true,
    screenOrientation: { type: "portraitPrimary", angle: 0 },
  });
  await client.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await client.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: reducedMotion ? "reduce" : "no-preference" }],
  });
  const loaded = client.once("Page.loadEventFired");
  await client.send("Page.navigate", { url: `${baseUrl}?view=${view}&clean=1` });
  await loaded;
  await client.send("Runtime.evaluate", {
    expression: `Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      ...Array.from(document.images).map((image) => image.complete ? Promise.resolve() : new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
      }))
    ]).then(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 240)))))`,
    awaitPromise: true,
  });
  const metricsResult = await client.send("Runtime.evaluate", {
    expression: `({
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      documentWidth: document.documentElement.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    })`,
    returnByValue: true,
  });
  const metrics = metricsResult.result.value;
  if (metrics.innerWidth !== width || metrics.innerHeight !== height || metrics.horizontalOverflow) {
    throw new Error(`${name} viewport mismatch: ${JSON.stringify(metrics)}`);
  }
  if (metrics.reducedMotion !== reducedMotion) {
    throw new Error(`${name} reduced-motion mismatch: ${JSON.stringify(metrics)}`);
  }
  const screenshot = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  writeFileSync(join(evidenceDir, `${name}.png`), Buffer.from(screenshot.data, "base64"));
  client.socket.close();
  return { name, width, height, reducedMotion, ...metrics };
}

const chrome = startChrome();
try {
  const endpoint = await chrome.endpoint;
  const results = [];
  for (const item of cases) results.push(await capture(endpoint, item));
  writeFileSync(join(evidenceDir, "viewport-metrics.json"), `${JSON.stringify(results, null, 2)}\n`);
  results.forEach(({ name, width, height, reducedMotion }) => {
    console.log(`PASS ${name}: ${width}x${height}, reduced=${reducedMotion}`);
  });
} finally {
  chrome.child.kill("SIGTERM");
  rmSync(chrome.profile, { recursive: true, force: true });
}
