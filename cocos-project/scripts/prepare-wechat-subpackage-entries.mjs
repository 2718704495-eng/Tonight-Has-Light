import {
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import {
  isAbsolute,
  relative,
  resolve,
} from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const COMPATIBILITY_ENTRY = 'require("./game.js");\n';

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function assertInsideBuild(buildRoot, candidate, label) {
  const pathFromRoot = relative(buildRoot, candidate);
  if (pathFromRoot === "" || (!pathFromRoot.startsWith("..") && !isAbsolute(pathFromRoot))) return;
  throw new Error(`${label} is outside the build root: ${candidate}`);
}

/**
 * Cocos 3.8.8 emits `game.js` for WeChat Asset Bundle subpackages. Current
 * WeChat DevTools advanced compilation has also probed `index.js` before an
 * upload, so every declared subpackage receives a tiny non-destructive alias.
 * Existing index entries are preserved verbatim.
 */
export function ensureWechatSubpackageEntries(buildRootArg) {
  const buildRoot = resolve(buildRootArg);
  const gameJsonPath = resolve(buildRoot, "game.json");
  if (!existsSync(gameJsonPath)) throw new Error(`missing game.json: ${gameJsonPath}`);

  const gameJson = readJson(gameJsonPath);
  if (!Array.isArray(gameJson.subpackages)) {
    throw new Error("game.json must declare a subpackages array");
  }

  const created = [];
  const preserved = [];
  for (const entry of gameJson.subpackages) {
    if (
      typeof entry !== "object"
      || entry === null
      || typeof entry.name !== "string"
      || entry.name.length === 0
      || typeof entry.root !== "string"
      || entry.root.length === 0
    ) {
      throw new Error("game.json contains an invalid subpackage declaration");
    }

    const subpackageRoot = resolve(buildRoot, entry.root);
    assertInsideBuild(buildRoot, subpackageRoot, `subpackage ${entry.name}`);
    const cocosEntry = resolve(subpackageRoot, "game.js");
    const compatibilityEntry = resolve(subpackageRoot, "index.js");
    assertInsideBuild(buildRoot, cocosEntry, `subpackage ${entry.name} game.js`);
    assertInsideBuild(buildRoot, compatibilityEntry, `subpackage ${entry.name} index.js`);
    if (!existsSync(cocosEntry)) {
      throw new Error(`subpackage ${entry.name} is missing game.js`);
    }

    if (existsSync(compatibilityEntry)) {
      if (readFileSync(compatibilityEntry).byteLength === 0) {
        throw new Error(`subpackage ${entry.name} has an empty index.js`);
      }
      preserved.push(entry.name);
      continue;
    }

    writeFileSync(compatibilityEntry, COMPATIBILITY_ENTRY, { flag: "wx" });
    created.push(entry.name);
  }

  return { created, preserved };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const buildRoot = process.argv[2];
  if (!buildRoot) {
    console.error("usage: node scripts/prepare-wechat-subpackage-entries.mjs <wechatgame-build-root>");
    process.exit(1);
  }
  try {
    const result = ensureWechatSubpackageEntries(buildRoot);
    console.log(JSON.stringify({ status: "PASS", ...result }));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
