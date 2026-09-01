import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  allowsStoryBKfR1TemporaryExperience,
  WECHAT_EXPERIENCE_BUNDLE_NAME,
  WECHAT_EXPERIENCE_BUILD_CONFIG,
  WECHAT_EXPERIENCE_CANDIDATE_ID,
  WECHAT_EXPERIENCE_ENGINEERING_REVISION,
  WECHAT_EXPERIENCE_IDENTITY_SCHEMA,
  WECHAT_EXPERIENCE_SOURCE_SHA256,
  WECHAT_EXPERIENCE_STORAGE_PREFIX,
  WECHAT_EXPERIENCE_VERSION,
} from "./wechat-experience-authorization.mjs";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const buildConfigPath = resolve(projectRoot, WECHAT_EXPERIENCE_BUILD_CONFIG);
const storyAssetRoot = resolve(
  projectRoot,
  "assets/outdoor-story-b-kf-r1-temp",
);

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function verifyStoryAssetIntegrity(assetRootArg = storyAssetRoot) {
  const assetRoot = resolve(assetRootArg);
  const manifestPath = resolve(assetRoot, "asset-manifest.json");
  const boundaryPath = resolve(assetRoot, "asset-boundary.json");
  const manifest = readJson(manifestPath);
  const boundary = readJson(boundaryPath);
  const manifestSha256 = sha256(manifestPath);
  if (!allowsStoryBKfR1TemporaryExperience(
    boundary,
    manifestSha256,
    manifest,
    WECHAT_EXPERIENCE_CANDIDATE_ID,
  )) {
    throw new Error("B KF-R1 asset manifest/boundary is not authorized for the exact 0.4.7 candidate");
  }

  const records = Array.isArray(manifest?.source?.assets)
    ? manifest.source.assets
    : [];
  if (records.length !== 3) {
    throw new Error("B KF-R1 asset manifest must contain exactly B01, B02 and B03");
  }
  const runtimeSha256 = {};
  const seenBeats = new Set();
  for (const record of records) {
    const beat = String(record?.beat ?? "");
    const runtimeFile = String(record?.runtimeFile ?? "");
    if (!Object.hasOwn(WECHAT_EXPERIENCE_SOURCE_SHA256, beat) || seenBeats.has(beat)) {
      throw new Error(`invalid or duplicate B KF-R1 beat: ${beat}`);
    }
    seenBeats.add(beat);
    if (record?.sourceSha256 !== WECHAT_EXPERIENCE_SOURCE_SHA256[beat]) {
      throw new Error(`source hash drifted for ${beat}`);
    }
    if (!runtimeFile || basename(runtimeFile) !== runtimeFile) {
      throw new Error(`runtime file must stay inside the temporary bundle: ${runtimeFile}`);
    }
    const actualRuntimeSha256 = sha256(resolve(assetRoot, runtimeFile));
    if (
      record?.runtimeSha256 !== actualRuntimeSha256
      || boundary?.runtimeSha256?.[runtimeFile] !== actualRuntimeSha256
    ) {
      throw new Error(`runtime hash drifted for ${runtimeFile}`);
    }
    runtimeSha256[runtimeFile] = actualRuntimeSha256;
  }

  return {
    manifestSha256,
    sourceSha256: { ...WECHAT_EXPERIENCE_SOURCE_SHA256 },
    runtimeSha256,
  };
}

export function prepareWechatExperienceCandidate(buildRootArg) {
  const buildRoot = resolve(buildRootArg);
  if (!existsSync(resolve(buildRoot, "game.json"))) {
    throw new Error(`missing WeChat game.json: ${buildRoot}`);
  }
  if (basename(buildRoot) !== "wechatgame" || basename(dirname(buildRoot)) !== WECHAT_EXPERIENCE_CANDIDATE_ID) {
    throw new Error(
      `build root must be the exact ${WECHAT_EXPERIENCE_CANDIDATE_ID}/wechatgame candidate`,
    );
  }
  const storyAssets = verifyStoryAssetIntegrity();
  const identity = {
    schema: WECHAT_EXPERIENCE_IDENTITY_SCHEMA,
    candidateId: WECHAT_EXPERIENCE_CANDIDATE_ID,
    developerVersion: WECHAT_EXPERIENCE_VERSION,
    engineeringRevision: WECHAT_EXPERIENCE_ENGINEERING_REVISION,
    storagePrefix: WECHAT_EXPERIENCE_STORAGE_PREFIX,
    bundleName: WECHAT_EXPERIENCE_BUNDLE_NAME,
    buildConfig: WECHAT_EXPERIENCE_BUILD_CONFIG,
    buildConfigSha256: sha256(buildConfigPath),
    storyAssetManifestSha256: storyAssets.manifestSha256,
    sourceSha256: storyAssets.sourceSha256,
    runtimeSha256: storyAssets.runtimeSha256,
    remoteOperationPerformed: false,
  };
  const destination = resolve(buildRoot, "build-identity.json");
  const temporary = `${destination}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(identity, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  renameSync(temporary, destination);
  return { destination, identity };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const buildRoot = process.argv[2];
  if (!buildRoot) {
    throw new Error(
      "Usage: node scripts/prepare-wechat-experience-candidate.mjs <wechatgame-build-root>",
    );
  }
  const result = prepareWechatExperienceCandidate(buildRoot);
  console.log(JSON.stringify({ status: "PASS", ...result }, null, 2));
}
