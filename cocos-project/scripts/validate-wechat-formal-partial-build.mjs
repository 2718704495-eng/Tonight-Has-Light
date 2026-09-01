import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  FORMAL_PARTIAL_BUILD_CONFIG,
  FORMAL_PARTIAL_BUNDLE_NAME,
  FORMAL_PARTIAL_CANDIDATE_ID,
  FORMAL_PARTIAL_STORAGE_PREFIX,
  FORMAL_PARTIAL_VERSION,
} from "./wechat-formal-partial-authorization.mjs";
import {
  verifyFormalPicturebookAssetIntegrity,
  verifyFormalPicturebookBuiltRuntime,
  verifyWechatFormalPartialAppIdBinding,
} from "./prepare-wechat-formal-partial-candidate.mjs";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const defaultBuildConfigPath = resolve(projectRoot, FORMAL_PARTIAL_BUILD_CONFIG);

const REQUIRED_RUNTIME_MARKERS = Object.freeze([
  "FormalPicturebookPartialScene",
  FORMAL_PARTIAL_BUNDLE_NAME,
  FORMAL_PARTIAL_STORAGE_PREFIX,
  "root-r4",
  "root/root-wind-hem-r4/spriteFrame",
  "RootInvitationSky",
  "RootInvitationHome",
  "FORMAL_PICTUREBOOK_BREEZE_HIDDEN=true",
  "stargaze-f1",
  "stargaze-f2",
  "stargaze-f3",
  "stargaze-f4",
  "stargaze-f5",
  "stargaze-finale-meteor",
  "StargazeChoiceHome",
  "StargazeChoiceStay",
  "home-h1",
  "home-h2",
  "home-h3",
  "home-h4",
  "home-h4-ate",
  "home-h4-sipped",
  "home-h5",
  "HomeReturnRoot",
  "H4_EAT",
  "H4_SIP",
  "setLargeText",
]);

const FORBIDDEN_RUNTIME_MARKERS = Object.freeze([
  "OutdoorStoryPages",
  "B01",
  "B02",
  "B03",
  "OutdoorIllustrationWind",
  "gate-d-story-b-kf-r1-temp-dev-r1-0.4.7",
  "phone-preview-story-b-kf-r1-temp-r1-0.4.7:",
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readText(path) {
  assert(existsSync(path), `missing file ${path}`);
  return readFileSync(path, "utf8");
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function parseMode(options) {
  const modeArg = options.find((option) => option.startsWith("--mode="));
  if (!modeArg) return "experience";
  const mode = modeArg.slice("--mode=".length);
  assert(mode === "experience" || mode === "release", "mode must be either experience or release");
  return mode;
}

function requireIncludes(source, needle) {
  assert(source.includes(needle), `missing runtime marker: ${needle}`);
}

function requireNotIncludes(source, needle) {
  assert(!source.includes(needle), `forbidden runtime marker present: ${needle}`);
}

function subpackageNames(gameJson) {
  return Array.isArray(gameJson.subpackages)
    ? gameJson.subpackages.map((entry) => String(entry?.name ?? ""))
    : [];
}

export function validateWechatFormalPartialBuild(
  buildRootArg,
  mode = "experience",
  assetRootArg = undefined,
  sourceProjectConfigPathArg = undefined,
) {
  assert(mode === "experience" || mode === "release", "mode must be either experience or release");
  if (mode === "release") {
    throw new Error("0.4.8 partial experience is not authorized for review or release");
  }

  const buildRoot = resolve(buildRootArg);
  const identity = readJson(resolve(buildRoot, "build-identity.json"));
  assert(identity.candidateId === FORMAL_PARTIAL_CANDIDATE_ID, "candidate identity drifted");
  assert(identity.developerVersion === FORMAL_PARTIAL_VERSION, "developer version drifted");
  assert(identity.bundleName === FORMAL_PARTIAL_BUNDLE_NAME, "formal picturebook bundle identity drifted");
  assert(identity.buildConfig === FORMAL_PARTIAL_BUILD_CONFIG, "build config identity drifted");
  assert(identity.buildConfigSha256 === sha256(defaultBuildConfigPath), "build config hash drifted");

  const assets = verifyFormalPicturebookAssetIntegrity(assetRootArg);
  assert(
    identity.formalAssetManifestSha256 === assets.manifestSha256,
    "asset manifest hash drifted",
  );
  assert(
    JSON.stringify(identity.runtimeSha256) === JSON.stringify(assets.runtimeSha256),
    "runtime asset hash binding drifted",
  );
  assert(
    Array.isArray(identity.hiddenBranches)
      && identity.hiddenBranches.length === 1
      && identity.hiddenBranches[0] === "breeze",
    "build identity hiddenBranches must be exactly [\"breeze\"]",
  );
  const built = verifyFormalPicturebookBuiltRuntime(buildRoot, assetRootArg);
  assert(
    identity.builtSubpackageConfigSha256 === built.subpackageConfigSha256,
    "built subpackage config hash drifted",
  );
  assert(
    JSON.stringify(identity.builtRuntimeAssets) === JSON.stringify(built.builtRuntimeAssets),
    "built runtime asset binding drifted",
  );
  verifyWechatFormalPartialAppIdBinding(
    buildRoot,
    sourceProjectConfigPathArg,
    identity.appIdBinding,
  );

  const gameJson = readJson(resolve(buildRoot, "game.json"));
  assert(gameJson.deviceOrientation === "portrait", "game.json deviceOrientation must be portrait");
  const names = subpackageNames(gameJson);
  assert(names.includes(FORMAL_PARTIAL_BUNDLE_NAME), `required subpackage missing: ${FORMAL_PARTIAL_BUNDLE_NAME}`);

  const mainIndex = readText(resolve(buildRoot, "assets", "main", "index.js"));
  for (const marker of REQUIRED_RUNTIME_MARKERS) requireIncludes(mainIndex, marker);
  for (const marker of FORBIDDEN_RUNTIME_MARKERS) requireNotIncludes(mainIndex, marker);

  return {
    status: "PASS",
    mode,
    candidateId: FORMAL_PARTIAL_CANDIDATE_ID,
    developerVersion: FORMAL_PARTIAL_VERSION,
    bundleName: FORMAL_PARTIAL_BUNDLE_NAME,
    remoteOperationPerformed: false,
  };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const [, , buildRootArg, sourceProjectConfigPathArg, ...options] = process.argv;
  if (!buildRootArg || !sourceProjectConfigPathArg) {
    console.error(
      "Wechat formal partial validation failed: usage: node scripts/validate-wechat-formal-partial-build.mjs "
        + "<wechatgame-build-root> <existing-source-project.config.json> "
        + "[--mode=experience|release]",
    );
    process.exit(1);
  }
  try {
    const report = validateWechatFormalPartialBuild(
      resolve(process.cwd(), buildRootArg),
      parseMode(options),
      undefined,
      resolve(process.cwd(), sourceProjectConfigPathArg),
    );
    console.log(JSON.stringify(report));
  } catch (error) {
    console.error(`Wechat formal partial validation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
