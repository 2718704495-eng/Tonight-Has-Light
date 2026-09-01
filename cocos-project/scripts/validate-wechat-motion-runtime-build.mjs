import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { findPrototypeBuildArtifacts } from "./prototype-asset-build-guard.mjs";
import { verifyStoryAssetIntegrity } from "./prepare-wechat-experience-candidate.mjs";
import {
  allowsStoryBKfR1TemporaryExperience,
  blocksReviewOrRelease,
  WECHAT_EXPERIENCE_BUNDLE_NAME,
  WECHAT_EXPERIENCE_BUILD_CONFIG,
  WECHAT_EXPERIENCE_CANDIDATE_ID,
  WECHAT_EXPERIENCE_ENGINEERING_REVISION,
  WECHAT_EXPERIENCE_IDENTITY_SCHEMA,
  WECHAT_EXPERIENCE_STORAGE_PREFIX,
  WECHAT_EXPERIENCE_VERSION,
} from "./wechat-experience-authorization.mjs";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const storySourceRoot = resolve(projectRoot, "assets/outdoor-story-b-kf-r1-temp");
const storyManifestPath = resolve(storySourceRoot, "asset-manifest.json");
const storyBoundaryPath = resolve(storySourceRoot, "asset-boundary.json");
const indoorSourceRoot = resolve(projectRoot, "assets/indoor-n01-preview");
const indoorBoundaryPath = resolve(indoorSourceRoot, "asset-boundary.json");
const historicalR2SourceRoot = resolve(projectRoot, "assets/outdoor-illustration-wind-r2");

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function readText(path) {
  invariant(existsSync(path), `missing file ${path}`);
  return readFileSync(path, "utf8");
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function requireIncludes(source, needle, label = needle) {
  invariant(source.includes(needle), `missing runtime marker: ${label}`);
}

function requireNotIncludes(source, needle, label = needle) {
  invariant(!source.includes(needle), `forbidden runtime marker present: ${label}`);
}

function normalizedRecord(value) {
  return JSON.stringify(
    Object.fromEntries(Object.entries(value ?? {}).sort(([left], [right]) => left.localeCompare(right))),
  );
}

export function parseWechatBuildValidationMode(args) {
  if (args.includes("--release")) return "release";
  const modeArg = args.find((arg) => arg.startsWith("--mode="));
  if (!modeArg) return "experience";
  const mode = modeArg.slice("--mode=".length);
  invariant(mode === "experience" || mode === "release", "mode must be either experience or release");
  return mode;
}

function validateDeclaredSubpackages(buildRoot, gameJson, settings) {
  const subpackages = settings.assets?.subpackages;
  invariant(Array.isArray(subpackages), "settings assets.subpackages is missing");
  invariant(subpackages.includes("indoor-n01-preview"), "indoor-n01-preview subpackage is missing");
  invariant(subpackages.includes(WECHAT_EXPERIENCE_BUNDLE_NAME), `${WECHAT_EXPERIENCE_BUNDLE_NAME} subpackage is missing`);
  invariant(Array.isArray(gameJson.subpackages) && gameJson.subpackages.length > 0, "game.json subpackages are missing");

  const declaredNames = new Set();
  for (const declaration of gameJson.subpackages) {
    invariant(
      typeof declaration === "object"
        && declaration !== null
        && typeof declaration.name === "string"
        && typeof declaration.root === "string",
      "game.json contains an invalid subpackage declaration",
    );
    const subpackageRoot = resolve(buildRoot, declaration.root);
    const pathFromRoot = relative(buildRoot, subpackageRoot);
    invariant(
      pathFromRoot !== "" && !pathFromRoot.startsWith("..") && !isAbsolute(pathFromRoot),
      `subpackage root escapes the build: ${declaration.name}`,
    );
    readText(resolve(subpackageRoot, "game.js"));
    invariant(
      readText(resolve(subpackageRoot, "index.js")).trim().length > 0,
      `subpackage ${declaration.name} has an empty index.js compatibility entry`,
    );
    declaredNames.add(declaration.name);
  }
  for (const bundleName of subpackages) {
    invariant(declaredNames.has(bundleName), `settings subpackage is absent from game.json: ${bundleName}`);
  }
  return subpackages;
}

function artifactSummary(label, artifacts) {
  const sample = artifacts.slice(0, 3).map((entry) => entry.path).join(", ");
  return `${label}=${artifacts.length}${sample ? ` [${sample}]` : ""}`;
}

export function assertNoPrototypeAssetsForRelease({
  storyArtifacts,
  indoorArtifacts,
  historicalR2Artifacts,
  storyBoundary,
  indoorBoundary,
}) {
  const releaseBlockers = [];
  if (storyArtifacts.length > 0 || blocksReviewOrRelease(storyBoundary)) {
    releaseBlockers.push(artifactSummary("B-KF-R1", storyArtifacts));
  }
  if (indoorArtifacts.length > 0 || blocksReviewOrRelease(indoorBoundary)) {
    releaseBlockers.push(artifactSummary("indoor-n01-preview", indoorArtifacts));
  }
  if (historicalR2Artifacts.length > 0) {
    releaseBlockers.push(artifactSummary("inactive-historical-R2", historicalR2Artifacts));
  }
  invariant(
    releaseBlockers.length === 0,
    `release mode is blocked by recursive prototype asset scan: ${releaseBlockers.join("; ")}`,
  );
}

export function validateWechatMotionRuntimeBuild(buildRootArg, mode = "experience") {
  invariant(mode === "experience" || mode === "release", "mode must be either experience or release");
  const buildRoot = resolve(buildRootArg);
  invariant(existsSync(buildRoot), `build root does not exist: ${buildRoot}`);
  invariant(
    relative(resolve(projectRoot, "build", WECHAT_EXPERIENCE_CANDIDATE_ID), buildRoot) === "wechatgame",
    `build root is not the exact ${WECHAT_EXPERIENCE_CANDIDATE_ID}/wechatgame candidate`,
  );

  const gameJson = readJson(resolve(buildRoot, "game.json"));
  const settings = readJson(resolve(buildRoot, "src/settings.json"));
  const projectConfig = readJson(resolve(buildRoot, "project.config.json"));
  const buildIdentity = readJson(resolve(buildRoot, "build-identity.json"));
  const mainIndex = readText(resolve(buildRoot, "assets/main/index.js"));
  const storyBoundary = readJson(storyBoundaryPath);
  const storyManifest = readJson(storyManifestPath);
  const indoorBoundary = readJson(indoorBoundaryPath);
  const storyAssets = verifyStoryAssetIntegrity();

  invariant(
    buildIdentity.schema === WECHAT_EXPERIENCE_IDENTITY_SCHEMA
      && buildIdentity.candidateId === WECHAT_EXPERIENCE_CANDIDATE_ID
      && buildIdentity.developerVersion === WECHAT_EXPERIENCE_VERSION
      && buildIdentity.engineeringRevision === WECHAT_EXPERIENCE_ENGINEERING_REVISION
      && buildIdentity.storagePrefix === WECHAT_EXPERIENCE_STORAGE_PREFIX
      && buildIdentity.bundleName === WECHAT_EXPERIENCE_BUNDLE_NAME
      && buildIdentity.buildConfig === WECHAT_EXPERIENCE_BUILD_CONFIG
      && buildIdentity.remoteOperationPerformed === false,
    "build-identity.json does not match the exact authorized 0.4.7 B KF-R1 candidate",
  );
  invariant(
    buildIdentity.storyAssetManifestSha256 === storyAssets.manifestSha256
      && normalizedRecord(buildIdentity.sourceSha256) === normalizedRecord(storyAssets.sourceSha256)
      && normalizedRecord(buildIdentity.runtimeSha256) === normalizedRecord(storyAssets.runtimeSha256),
    "build identity B KF-R1 asset hashes do not match the checked-in temporary bundle",
  );
  const buildConfigPath = resolve(projectRoot, WECHAT_EXPERIENCE_BUILD_CONFIG);
  invariant(
    buildIdentity.buildConfigSha256 === sha256(buildConfigPath),
    "build identity config hash does not match the 0.4.7 WeChat build config",
  );
  invariant(
    allowsStoryBKfR1TemporaryExperience(
      storyBoundary,
      storyAssets.manifestSha256,
      storyManifest,
      WECHAT_EXPERIENCE_CANDIDATE_ID,
    ),
    "B KF-R1 temporary asset boundary is not authorized for this exact candidate",
  );

  invariant(gameJson.deviceOrientation === "portrait", "game.json must stay portrait");
  invariant(
    typeof projectConfig.appid === "string" && /^wx[0-9a-f]{16}$/i.test(projectConfig.appid),
    "project.config.json must contain a valid WeChat AppID",
  );
  const subpackages = validateDeclaredSubpackages(buildRoot, gameJson, settings);

  invariant(
    indoorBoundary.candidateId === WECHAT_EXPERIENCE_CANDIDATE_ID
      && indoorBoundary.allowedUse?.includes(
        "one WeChat developer upload version 0.4.7 and its corresponding user-promoted experience version",
      )
      && blocksReviewOrRelease(indoorBoundary),
    "indoor-n01-preview boundary does not contain the exact 0.4.7 disposable exception",
  );

  const storyArtifacts = findPrototypeBuildArtifacts({
    buildRoot,
    sourceRoot: storySourceRoot,
    directoryMarker: WECHAT_EXPERIENCE_BUNDLE_NAME,
  });
  const indoorArtifacts = findPrototypeBuildArtifacts({
    buildRoot,
    sourceRoot: indoorSourceRoot,
    directoryMarker: "indoor-n01-preview",
  });
  const historicalR2Artifacts = findPrototypeBuildArtifacts({
    buildRoot,
    sourceRoot: historicalR2SourceRoot,
    directoryMarker: "outdoor-illustration-wind-r2",
  });

  if (mode === "release") {
    assertNoPrototypeAssetsForRelease({
      storyArtifacts,
      indoorArtifacts,
      historicalR2Artifacts,
      storyBoundary,
      indoorBoundary,
    });
  }

  invariant(storyArtifacts.length > 0, "experience mode requires recursively detected B KF-R1 build artifacts");
  invariant(indoorArtifacts.length > 0, "experience mode requires recursively detected indoor preview build artifacts");
  requireNotIncludes(mainIndex, "outdoor-illustration-wind-r2", "inactive historical R2 bundle runtime reference");
  requireNotIncludes(mainIndex, "OutdoorIllustrationWindPages", "superseded R2 runtime class");
  if (subpackages.includes("outdoor-illustration-wind-r2") || historicalR2Artifacts.length > 0) {
    const inactive = storyBoundary.inactiveHistoricalPackaging?.some((entry) =>
      entry?.bundle === "outdoor-illustration-wind-r2"
      && entry?.runtimeReferenced === false
      && entry?.evidenceUse === "forbidden"
    );
    invariant(inactive, "historical R2 packaging is present without an explicit inactive/no-evidence boundary");
  }

  const requiredRuntimeMarkers = [
    "OutdoorGateCScene",
    "OutdoorStoryPages",
    WECHAT_EXPERIENCE_BUNDLE_NAME,
    "b01-settle/spriteFrame",
    "b02-wind-passes/spriteFrame",
    "b03-afterwind/spriteFrame",
    "cancelForDoorEntry",
    "installPersistentDoorTarget",
    "installDoorInputFallback",
    "preloadIndoorN01PreviewBundle",
    "INDOOR_N01_BUNDLE_LOAD_TIMEOUT_MS",
    "REQUEST_ENTER_HOUSE",
    "TonightHasLightIndoorN01Preview",
    "TonightHasLightFormalSessionControls",
    "FORMAL_SESSION_CONTROLS_ROOM_REVEAL_DELAY_MS",
    "TonightHasLightFormalEndingUi",
    "FORMAL_ENDING_UI_DEFAULT_FADE_MS",
    WECHAT_EXPERIENCE_STORAGE_PREFIX,
    WECHAT_EXPERIENCE_CANDIDATE_ID,
    "indoor-n01-preview",
    "kettle-lid-answer-test-only",
    "SELECT_DURATION",
    "shareInFlight",
    "CLOSE_SHARE_PREVIEW",
    "RETURN_TO_OUTDOOR",
  ];
  for (const marker of requiredRuntimeMarkers) requireIncludes(mainIndex, marker);

  const forbiddenRuntimeMarkers = [
    "URLSearchParams",
    "DISPOSABLE_DURATION_MINUTES",
    "LabelShadow",
    "drawWarmPaper",
    "endingPaperGraphics",
    "phone-preview-v4-r2-edgefix-r10-0.4.6:",
    "gate-d-mainflow-v4-r2-edgefix-01-dev-r10-0.4.6",
  ];
  for (const marker of forbiddenRuntimeMarkers) requireNotIncludes(mainIndex, marker);

  return {
    status: "PASS",
    mode,
    candidateId: WECHAT_EXPERIENCE_CANDIDATE_ID,
    storyArtifacts: storyArtifacts.length,
    indoorArtifacts: indoorArtifacts.length,
    inactiveHistoricalR2Artifacts: historicalR2Artifacts.length,
    remoteOperationPerformed: false,
  };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const [, , buildRootArg, ...options] = process.argv;
  if (!buildRootArg) {
    console.error(
      "Wechat build validation failed: usage: node scripts/validate-wechat-motion-runtime-build.mjs "
        + "<wechatgame-build-root> [--mode=experience|release]",
    );
    process.exit(1);
  }
  try {
    const report = validateWechatMotionRuntimeBuild(
      resolve(process.cwd(), buildRootArg),
      parseWechatBuildValidationMode(options),
    );
    console.log(JSON.stringify(report));
  } catch (error) {
    console.error(`Wechat build validation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
