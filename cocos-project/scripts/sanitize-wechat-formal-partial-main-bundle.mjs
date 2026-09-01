import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  FORMAL_PARTIAL_CANDIDATE_ID,
  FORMAL_PARTIAL_VERSION,
} from "./wechat-formal-partial-authorization.mjs";

const DENIED_MODULE_IDS = Object.freeze([
  "outdoor-door-input.ts",
  "outdoor-gate-c-scene.ts",
  "outdoor-illustration-wind-model.ts",
  "outdoor-story-model.ts",
  "outdoor-story-pages.ts",
  "outdoor-story-transition.ts",
  "tonight-has-light-indoor-n01-preview.ts",
]);

const REQUIRED_RETAINED_MARKERS = Object.freeze([
  "FormalPicturebookPartialScene",
  "formal-picturebook-partial-0-4-8",
  "RootInvitationSky",
  "RootInvitationHome",
  "stargaze-finale-meteor",
  "HomeReturnRoot",
]);

const FORBIDDEN_MARKERS = Object.freeze([
  "OutdoorStoryPages",
  "B01",
  "B02",
  "B03",
  "OutdoorIllustrationWind",
  "gate-d-story-b-kf-r1-temp-dev-r1-0.4.7",
  "phone-preview-story-b-kf-r1-temp-r1-0.4.7:",
]);

const MAIN_REGISTER_PREFIX = 'System.register("chunks:///_virtual/main"';
const MODULE_REGISTER_PREFIX = 'System.register("chunks:///_virtual/';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function readText(path) {
  assert(existsSync(path), `missing file ${path}`);
  return readFileSync(path, "utf8");
}

function moduleIdFromRegister(chunk) {
  const match = chunk.match(/^System[.]register[(]"chunks:[/][/][/]_virtual[/]([^"]+)"/);
  return match?.[1] ?? null;
}

function splitVirtualRegisterChunks(source) {
  const starts = [];
  let offset = 0;
  while (true) {
    const next = source.indexOf(MODULE_REGISTER_PREFIX, offset);
    if (next < 0) break;
    starts.push(next);
    offset = next + MODULE_REGISTER_PREFIX.length;
  }
  if (starts.length === 0) {
    return [{ prefix: source, chunks: [], suffix: "" }];
  }
  const chunks = [];
  const prefix = source.slice(0, starts[0]);
  for (let index = 0; index < starts.length; index += 1) {
    const start = starts[index];
    const end = starts[index + 1] ?? source.length;
    chunks.push(source.slice(start, end));
  }
  return [{ prefix, chunks, suffix: "" }];
}

function parseMainDependencies(mainChunk) {
  const match = mainChunk.match(
    /^System[.]register[(]"chunks:[/][/][/]_virtual[/]main",\[(?<deps>[^\]]*)\],[(]function[(][)]\{return\{setters:\[(?<setters>[^\]]*)\],execute:function[(][)]\{\}\}\}\)[)][;]/s,
  );
  assert(match?.groups, "Cocos virtual main register shape is unsupported");
  const deps = [];
  const depText = match.groups.deps.trim();
  if (depText) {
    for (const dep of depText.split(",")) {
      const clean = dep.trim();
      const depMatch = clean.match(/^"([^"]+)"$/);
      assert(depMatch, `unsupported main dependency entry: ${clean}`);
      deps.push(depMatch[1]);
    }
  }
  const setters = match.groups.setters.trim()
    ? match.groups.setters.split(",").map((entry) => entry.trim())
    : [];
  assert(
    deps.length === setters.length,
    `virtual main dependency/setter count mismatch: ${deps.length}/${setters.length}`,
  );
  return deps;
}

function dependencyToModuleId(dependency) {
  return dependency.replace(/^[.][/]/, "");
}

function rebuildMainChunk(dependencies) {
  const deps = dependencies.map((dependency) => JSON.stringify(dependency)).join(",");
  const setters = dependencies.map(() => "null").join(",");
  return `${MAIN_REGISTER_PREFIX},[${deps}],(function(){return{setters:[${setters}],execute:function(){}}}));\n`;
}

function assertNoForbiddenMarkers(source) {
  for (const marker of FORBIDDEN_MARKERS) {
    assert(!source.includes(marker), `forbidden runtime marker remains after sanitize: ${marker}`);
  }
}

function assertRetainedMarkers(source) {
  for (const marker of REQUIRED_RETAINED_MARKERS) {
    assert(source.includes(marker), `required formal runtime marker missing after sanitize: ${marker}`);
  }
}

export function sanitizeWechatFormalPartialMainBundle(buildRootArg, outputDirArg = undefined) {
  const buildRoot = resolve(buildRootArg);
  assert(
    basename(buildRoot) === "wechatgame"
      && basename(dirname(buildRoot)) === FORMAL_PARTIAL_CANDIDATE_ID,
    `build root must be the exact ${FORMAL_PARTIAL_CANDIDATE_ID}/wechatgame candidate`,
  );
  const mainIndexPath = resolve(buildRoot, "assets", "main", "index.js");
  const before = readText(mainIndexPath);
  assertRetainedMarkers(before);

  const [{ prefix, chunks, suffix }] = splitVirtualRegisterChunks(before);
  assert(chunks.length > 0, "no Cocos virtual modules found in main index");
  const denied = new Set(DENIED_MODULE_IDS);
  const removedModuleIds = [];
  const retainedChunks = [];
  const removedDependencies = [];

  for (const chunk of chunks) {
    const id = moduleIdFromRegister(chunk);
    assert(id, "unable to parse Cocos virtual module id");
    if (id === "main") {
      const dependencies = parseMainDependencies(chunk);
      const filteredDependencies = dependencies.filter((dependency) => {
        const keep = !denied.has(dependencyToModuleId(dependency));
        if (!keep) removedDependencies.push(dependency);
        return keep;
      });
      retainedChunks.push(rebuildMainChunk(filteredDependencies));
    } else if (denied.has(id)) {
      removedModuleIds.push(id);
    } else {
      retainedChunks.push(chunk);
    }
  }

  assert(
    removedModuleIds.length === DENIED_MODULE_IDS.length,
    `expected to remove ${DENIED_MODULE_IDS.length} obsolete modules, removed ${removedModuleIds.length}: ${removedModuleIds.join(", ")}`,
  );
  const after = `${prefix}${retainedChunks.join("")}${suffix}`;
  assertRetainedMarkers(after);
  assertNoForbiddenMarkers(after);
  writeFileSync(mainIndexPath, after, "utf8");

  const report = {
    schema: "tonight-has-light.wechat-formal-partial-main-bundle-sanitize.v1",
    status: "PASS",
    candidateId: FORMAL_PARTIAL_CANDIDATE_ID,
    developerVersion: FORMAL_PARTIAL_VERSION,
    buildRoot,
    mainIndexPath,
    beforeSha256: sha256Text(before),
    afterSha256: sha256Text(after),
    removedModuleIds,
    removedDependencies,
    retainedModuleCount: retainedChunks.length,
    forbiddenMarkersRemaining: false,
    remoteOperationPerformed: false,
  };

  if (outputDirArg) {
    const outputDir = resolve(outputDirArg);
    mkdirSync(outputDir, { recursive: true });
    const reportPath = resolve(outputDir, "wechat-main-index-sanitize-report.json");
    writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    report.reportPath = reportPath;
    report.reportSha256 = sha256File(reportPath);
  }

  return report;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const [, , buildRootArg, outputDirArg] = process.argv;
  if (!buildRootArg) {
    console.error(
      "Usage: node scripts/sanitize-wechat-formal-partial-main-bundle.mjs "
        + "<wechatgame-build-root> [output-dir]",
    );
    process.exit(1);
  }
  try {
    const report = sanitizeWechatFormalPartialMainBundle(
      resolve(process.cwd(), buildRootArg),
      outputDirArg ? resolve(process.cwd(), outputDirArg) : undefined,
    );
    console.log(JSON.stringify({
      status: report.status,
      candidateId: report.candidateId,
      developerVersion: report.developerVersion,
      removedModuleIds: report.removedModuleIds,
      removedDependencies: report.removedDependencies,
      beforeSha256: report.beforeSha256,
      afterSha256: report.afterSha256,
      reportPath: report.reportPath ? relative(process.cwd(), report.reportPath) : undefined,
      remoteOperationPerformed: false,
    }));
  } catch (error) {
    console.error(`Wechat formal partial sanitize failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
