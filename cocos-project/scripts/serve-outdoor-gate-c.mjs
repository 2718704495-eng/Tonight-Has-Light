import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const BUILD_ID = process.env.GATE_C_BUILD_ID ?? "gate-c-v7-20260821-41b0b7b1-showall-navy-r5";
const PORT = Number(process.env.PORT ?? 4173);
const buildOutputRoot = resolve(import.meta.dirname, "..", "build", BUILD_ID);
const root = existsSync(resolve(buildOutputRoot, "web-mobile", "index.html"))
  ? resolve(buildOutputRoot, "web-mobile")
  : buildOutputRoot;
const mimeByExtension = {
  ".bin": "application/octet-stream",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".wasm": "application/wasm",
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  if (url.pathname === "/favicon.ico") {
    response.writeHead(204).end();
    return;
  }

  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
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
      "Content-Type": mimeByExtension[extname(file)] ?? "application/octet-stream",
    });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404).end("Not found");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Gate C ${BUILD_ID} at http://127.0.0.1:${PORT}`);
});
