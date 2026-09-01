import { spawn } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const boardRoot = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(boardRoot, "../../..");
const defaultOutput = join(boardRoot, "evidence/capture-metrics.json");
const defaultScreenshotDir = join(boardRoot, "evidence/screenshots");
const defaultChrome = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const frames = ["B01", "B02", "B03"];
const variants = [
  ["390x844", 390, 844],
  ["360x800", 360, 800],
  ["430x932", 430, 932],
  ["430x844-pressure", 430, 844],
  ["contract-50pct", 195, 422],
  ["thumbnail-25pct", 98, 211],
];

function usage() {
  console.log(`Usage: node capture-board.mjs [options]

Options:
  --audit-only              Inspect DOM state without screenshots
  --allow-blocked           Permit audit-only inspection of the explicit BLOCKED fallback
  --asset-base <url-path>   Override the board's asset base (test/diagnostic only)
  --output <json>           Metrics output path
  --screenshots <dir>       Screenshot output directory
  --chrome <path>           Chrome executable path`);
}

function parseArgs(argv) {
  const options = {
    auditOnly: false,
    allowBlocked: false,
    assetBase: null,
    output: defaultOutput,
    screenshots: defaultScreenshotDir,
    chrome: defaultChrome,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") {
      usage();
      process.exit(0);
    }
    if (argument === "--audit-only") {
      options.auditOnly = true;
      continue;
    }
    if (argument === "--allow-blocked") {
      options.allowBlocked = true;
      continue;
    }
    if (!["--asset-base", "--output", "--screenshots", "--chrome"].includes(argument)) {
      throw new Error(`Unknown argument: ${argument}`);
    }
    const value = argv[index + 1];
    if (!value) throw new Error(`Missing value for ${argument}`);
    if (argument === "--asset-base") options.assetBase = value;
    if (argument === "--output") options.output = resolve(value);
    if (argument === "--screenshots") options.screenshots = resolve(value);
    if (argument === "--chrome") options.chrome = resolve(value);
    index += 1;
  }
  return options;
}

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function startStaticServer() {
  const server = createServer((request, response) => {
    try {
      const url = new URL(request.url || "/", "http://127.0.0.1");
      const pathname = decodeURIComponent(url.pathname);
      let path = resolve(projectRoot, `.${pathname}`);
      const outsideRoot = path !== projectRoot && !path.startsWith(`${projectRoot}${sep}`);
      if (outsideRoot) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      if (existsSync(path) && statSync(path).isDirectory()) path = join(path, "index.html");
      if (!existsSync(path) || !statSync(path).isFile()) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
        return;
      }
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": contentTypes[extname(path).toLowerCase()] || "application/octet-stream",
      });
      createReadStream(path).pipe(response);
    } catch (error) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" }).end(String(error));
    }
  });
  return new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to resolve static server address"));
        return;
      }
      resolvePromise({ server, origin: `http://127.0.0.1:${address.port}` });
    });
  });
}

function startChrome(chromePath) {
  if (!existsSync(chromePath)) throw new Error(`Chrome executable not found: ${chromePath}`);
  const profile = mkdtempSync(join(tmpdir(), "formal-r1-board-cdp-"));
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
  const endpoint = new Promise((resolvePromise, reject) => {
    let stderr = "";
    const timer = setTimeout(() => reject(new Error(`Chrome endpoint timeout\n${stderr}`)), 10000);
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (!match) return;
      clearTimeout(timer);
      resolvePromise(match[1]);
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Chrome exited before DevTools was ready (${code})\n${stderr}`));
    });
  });
  return { child, endpoint, profile };
}

function cdpClient(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  let nextId = 0;
  const pending = new Map();
  const waiters = new Map();
  const opened = new Promise((resolvePromise, reject) => {
    socket.addEventListener("open", resolvePromise, { once: true });
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
    return new Promise((resolvePromise, reject) => {
      pending.set(id, { resolve: resolvePromise, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  };
  const once = (method, timeoutMs = 10000) => new Promise((resolvePromise, reject) => {
    const queue = waiters.get(method) || [];
    let timer;
    const done = (payload) => {
      clearTimeout(timer);
      resolvePromise(payload);
    };
    queue.push(done);
    waiters.set(method, queue);
    timer = setTimeout(() => {
      const current = waiters.get(method) || [];
      const position = current.indexOf(done);
      if (position >= 0) current.splice(position, 1);
      reject(new Error(`Timed out waiting for ${method}`));
    }, timeoutMs);
  });
  return { socket, opened, send, once };
}

async function newTarget(browserEndpoint) {
  const endpoint = new URL(browserEndpoint);
  const response = await fetch(`http://${endpoint.host}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" });
  if (!response.ok) throw new Error(`Unable to create Chrome target: ${response.status}`);
  return response.json();
}

async function openPage(browserEndpoint, url, width, height) {
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
  const loaded = client.once("Page.loadEventFired");
  await client.send("Page.navigate", { url });
  await loaded;
  await client.send("Runtime.evaluate", {
    expression: `new Promise((resolve, reject) => {
      const started = Date.now();
      const check = () => {
        if (document.documentElement.dataset.assetScanComplete === 'true') return resolve(true);
        if (Date.now() - started > 12000) return reject(new Error('asset scan timeout'));
        setTimeout(check, 25);
      };
      check();
    })`,
    awaitPromise: true,
  });
  return client;
}

function boardUrl(origin, options, extra = {}) {
  const url = new URL("/design-board/story-illustration-redesign-v1-b/formal-r1/", origin);
  if (options.assetBase) url.searchParams.set("assetBase", options.assetBase);
  Object.entries(extra).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.href;
}

async function auditBoard(browserEndpoint, origin, options) {
  const client = await openPage(browserEndpoint, boardUrl(origin, options), 390, 844);
  try {
    const result = await client.send("Runtime.evaluate", {
      expression: `({
        ...window.__formalR1Board,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        documentHeight: document.documentElement.scrollHeight,
        title: document.title,
        statusText: document.getElementById('board-status').textContent.trim()
      })`,
      returnByValue: true,
    });
    return result.result.value;
  } finally {
    client.socket.close();
  }
}

async function capturePreview(browserEndpoint, origin, options, frame, variant, width, height, naturalWidth, naturalHeight) {
  const client = await openPage(
    browserEndpoint,
    boardUrl(origin, options, { preview: frame, variant, clean: "1" }),
    width,
    height,
  );
  try {
    const metricsResult = await client.send("Runtime.evaluate", {
      expression: `({
        ...window.__formalR1Capture,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        documentHeight: document.documentElement.scrollHeight
      })`,
      returnByValue: true,
    });
    const metrics = metricsResult.result.value;
    const dimensionsValid = metrics.naturalWidth === naturalWidth && metrics.naturalHeight === naturalHeight;
    const viewportValid = !metrics.horizontalOverflow
      && metrics.innerWidth === width
      && metrics.innerHeight === height;
    if (!metrics.loaded || !dimensionsValid || !viewportValid) {
      return {
        name: null,
        screenshotWritten: false,
        dimensionsValid,
        viewportValid,
        expectedNaturalWidth: naturalWidth,
        expectedNaturalHeight: naturalHeight,
        ...metrics,
      };
    }
    const screenshot = await client.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
    });
    const name = `${frame.toLowerCase()}-${variant}.png`;
    writeFileSync(join(options.screenshots, name), Buffer.from(screenshot.data, "base64"));
    return { name, screenshotWritten: true, dimensionsValid, viewportValid, ...metrics };
  } finally {
    client.socket.close();
  }
}

async function captureOverview(browserEndpoint, origin, options) {
  const client = await openPage(browserEndpoint, boardUrl(origin, options), 1440, 1200);
  try {
    const layout = await client.send("Page.getLayoutMetrics");
    const width = Math.ceil(layout.cssContentSize.width);
    const height = Math.ceil(layout.cssContentSize.height);
    const screenshot = await client.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width, height, scale: 1 },
    });
    const name = "formal-r1-review-board-full.png";
    writeFileSync(join(options.screenshots, name), Buffer.from(screenshot.data, "base64"));
    return { name, width, height };
  } finally {
    client.socket.close();
  }
}

function writeReport(path, report) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`);
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    usage();
    return 64;
  }

  const staticServer = await startStaticServer();
  const chrome = startChrome(options.chrome);
  try {
    const browserEndpoint = await chrome.endpoint;
    const audit = await auditBoard(browserEndpoint, staticServer.origin, options);
    const report = {
      schemaVersion: 1,
      candidate: "STORY-ILLUSTRATION-REDESIGN-V1-B-FORMAL-R1",
      gate: "BLOCKED",
      approval: "AWAITING_USER_SECOND_APPROVAL",
      auditOnly: options.auditOnly,
      assetStatus: audit.assetStatus,
      reviewManifest: audit.reviewManifest,
      displaySlots: audit.displaySlots,
      loadedSlots: audit.loadedSlots,
      blockedSlots: audit.blockedSlots,
      manualChecks: audit.manualChecks,
      contractThumbnail: audit.contractThumbnail,
      extremeThumbnail: audit.extremeThumbnail,
      viewport: {
        width: audit.innerWidth,
        height: audit.innerHeight,
        documentWidth: audit.documentWidth,
        documentHeight: audit.documentHeight,
        horizontalOverflow: audit.horizontalOverflow,
      },
      statusText: audit.statusText,
      screenshots: [],
    };

    if (audit.assetStatus === "BLOCKED" && !(options.auditOnly && options.allowBlocked)) {
      writeReport(options.output, report);
      console.error(`BLOCKED ${audit.blockedSlots}/${audit.displaySlots} board slots are unreleased; screenshots were not created`);
      return 2;
    }

    if (audit.horizontalOverflow) {
      writeReport(options.output, report);
      console.error(`FAIL board has horizontal overflow at ${audit.innerWidth}x${audit.innerHeight}`);
      return 1;
    }

    if (!options.auditOnly) {
      mkdirSync(options.screenshots, { recursive: true });
      report.screenshots.push(await captureOverview(browserEndpoint, staticServer.origin, options));
      for (const [variant, width, height] of variants) {
        for (const frame of frames) {
          const naturalWidth = ["contract-50pct", "thumbnail-25pct"].includes(variant) ? 195 : width;
          const naturalHeight = ["contract-50pct", "thumbnail-25pct"].includes(variant) ? 422 : height;
          const captured = await capturePreview(
            browserEndpoint,
            staticServer.origin,
            options,
            frame,
            variant,
            width,
            height,
            naturalWidth,
            naturalHeight,
          );
          if (!captured.loaded) {
            writeReport(options.output, report);
            console.error(`BLOCKED ${frame} ${variant} did not load formal art`);
            return 2;
          }
          if (!captured.dimensionsValid) {
            writeReport(options.output, report);
            console.error(`FAIL ${frame} ${variant} source dimensions: expected ${naturalWidth}x${naturalHeight}, got ${captured.naturalWidth}x${captured.naturalHeight}`);
            return 1;
          }
          if (!captured.viewportValid) {
            writeReport(options.output, report);
            console.error(`FAIL ${frame} ${variant} viewport mismatch: ${JSON.stringify(captured)}`);
            return 1;
          }
          report.screenshots.push(captured);
          console.log(`${captured.loaded ? "CAPTURED" : "BLOCKED_CAPTURE"} ${frame} ${variant} ${width}x${height}`);
        }
      }
    }

    writeReport(options.output, report);
    console.log(`${audit.assetStatus} board audit: ${audit.loadedSlots}/${audit.displaySlots} slots loaded; manual checks=${audit.manualChecks}`);
    return 0;
  } finally {
    chrome.child.kill("SIGTERM");
    rmSync(chrome.profile, { recursive: true, force: true });
    await new Promise((resolvePromise) => staticServer.server.close(resolvePromise));
  }
}

process.exitCode = await main();
