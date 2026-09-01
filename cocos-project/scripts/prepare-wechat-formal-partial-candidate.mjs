import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { isAbsolute, relative } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  FORMAL_PARTIAL_BUILD_CONFIG,
  FORMAL_PARTIAL_BUNDLE_NAME,
  FORMAL_PARTIAL_CANDIDATE_ID,
  FORMAL_PARTIAL_ENGINEERING_REVISION,
  FORMAL_PARTIAL_IDENTITY_SCHEMA,
  FORMAL_PARTIAL_REQUIRED_PAGE_IDS,
  FORMAL_PARTIAL_STORAGE_PREFIX,
  FORMAL_PARTIAL_VERSION,
  allowsFormalPicturebookPartialExperience,
} from "./wechat-formal-partial-authorization.mjs";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const defaultBuildConfigPath = resolve(projectRoot, FORMAL_PARTIAL_BUILD_CONFIG);
const defaultAssetRoot = resolve(projectRoot, "assets", FORMAL_PARTIAL_BUNDLE_NAME);
const WECHAT_APP_ID_PATTERN = /^wx[0-9a-f]{16}$/i;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function sha256Text(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertInside(root, path, label) {
  const fromRoot = relative(root, path);
  assert(fromRoot && !fromRoot.startsWith("..") && !isAbsolute(fromRoot), `${label} must stay inside build root`);
}

function compressUuid(uuid) {
  const hex = uuid.replaceAll("-", "");
  return hex.slice(0, 2)
    + Buffer.from(hex.slice(2), "hex").toString("base64").replace(/=+$/, "");
}

function exactBreezeHidden(value) {
  return Array.isArray(value) && value.length === 1 && value[0] === "breeze";
}

export function verifyWechatFormalPartialAppIdBinding(
  buildRootArg,
  sourceProjectConfigPathArg,
  expectedBinding = undefined,
) {
  const buildRoot = resolve(buildRootArg);
  assert(sourceProjectConfigPathArg, "an explicit existing source project.config.json is required");
  const sourceProjectConfigPath = resolve(sourceProjectConfigPathArg);
  const targetProjectConfigPath = resolve(buildRoot, "project.config.json");
  assert(existsSync(sourceProjectConfigPath), `source project config is missing: ${sourceProjectConfigPath}`);
  assert(existsSync(targetProjectConfigPath), `target project config is missing: ${targetProjectConfigPath}`);
  assert(sourceProjectConfigPath !== targetProjectConfigPath, "source project config must be independent from the target build");

  const sourceProjectConfig = readJson(sourceProjectConfigPath);
  const targetProjectConfig = readJson(targetProjectConfigPath);
  assert(
    typeof sourceProjectConfig.appid === "string" && WECHAT_APP_ID_PATTERN.test(sourceProjectConfig.appid),
    "source project config does not contain a valid registered AppID",
  );
  assert(
    typeof targetProjectConfig.appid === "string" && WECHAT_APP_ID_PATTERN.test(targetProjectConfig.appid),
    "target project config does not contain a valid registered AppID",
  );
  assert(
    targetProjectConfig.appid === sourceProjectConfig.appid,
    "target AppID does not match the explicit source project config",
  );

  const binding = {
    schema: "tonight-has-light.wechat-appid-source-binding.v1",
    sourceProjectConfigSha256: sha256(sourceProjectConfigPath),
    sourceProjectConfigPathSha256: sha256Text(sourceProjectConfigPath),
    targetProjectConfigSha256: sha256(targetProjectConfigPath),
    appIdSha256: sha256Text(sourceProjectConfig.appid),
  };
  if (expectedBinding !== undefined) {
    assert(
      expectedBinding?.sourceProjectConfigSha256 === binding.sourceProjectConfigSha256,
      "source project config hash drifted",
    );
    assert(
      expectedBinding?.sourceProjectConfigPathSha256 === binding.sourceProjectConfigPathSha256,
      "source project config path binding drifted",
    );
    assert(
      expectedBinding?.targetProjectConfigSha256 === binding.targetProjectConfigSha256,
      "target project config hash drifted",
    );
    assert(expectedBinding?.appIdSha256 === binding.appIdSha256, "bound AppID drifted");
  }
  return binding;
}

function formalBundleDeclaration(buildRoot) {
  const gameJson = readJson(resolve(buildRoot, "game.json"));
  const matches = Array.isArray(gameJson.subpackages)
    ? gameJson.subpackages.filter((entry) => entry?.name === FORMAL_PARTIAL_BUNDLE_NAME)
    : [];
  assert(matches.length === 1, `game.json must declare exactly one ${FORMAL_PARTIAL_BUNDLE_NAME} subpackage`);
  const subpackageRoot = resolve(buildRoot, String(matches[0].root ?? ""));
  assertInside(buildRoot, subpackageRoot, "formal picturebook subpackage");
  return subpackageRoot;
}

export function verifyFormalPicturebookBuiltRuntime(
  buildRootArg,
  assetRootArg = defaultAssetRoot,
) {
  const buildRoot = resolve(buildRootArg);
  const assetRoot = resolve(assetRootArg);
  const manifest = readJson(resolve(assetRoot, "asset-manifest.json"));
  const subpackageRoot = formalBundleDeclaration(buildRoot);
  const configPath = resolve(subpackageRoot, "config.json");
  assert(existsSync(configPath), "formal picturebook subpackage config.json is missing");
  const config = readJson(configPath);
  assert(config.name === FORMAL_PARTIAL_BUNDLE_NAME, "formal picturebook subpackage config name drifted");
  assert(Array.isArray(config.uuids), "formal picturebook subpackage uuids are missing");
  assert(config.paths && typeof config.paths === "object", "formal picturebook subpackage paths are missing");
  assert(config.importBase === "import", "formal picturebook import base drifted");
  assert(config.nativeBase === "native", "formal picturebook native base drifted");

  const builtRuntimeAssets = {};
  for (const record of manifest.assets ?? []) {
    const id = String(record?.id ?? "");
    const runtimePath = String(record?.runtimePath ?? "");
    const cocosPath = String(record?.cocosPath ?? "");
    assert(id && runtimePath && cocosPath, `formal picturebook build record is incomplete: ${id}`);
    const metaPath = resolve(assetRoot, `${runtimePath}.meta`);
    assert(existsSync(metaPath), `Cocos source meta is missing for ${id}`);
    const meta = readJson(metaPath);
    assert(UUID_PATTERN.test(String(meta.uuid ?? "")), `Cocos source UUID is invalid for ${id}`);
    assert(meta.subMetas?.f9941?.uuid === `${meta.uuid}@f9941`, `spriteFrame UUID drifted for ${id}`);
    const compressedSpriteUuid = `${compressUuid(meta.uuid)}@f9941`;
    const uuidIndex = config.uuids.indexOf(compressedSpriteUuid);
    assert(uuidIndex >= 0, `built subpackage UUID mapping is missing for ${id}`);
    const pathRecord = config.paths[String(uuidIndex)];
    assert(Array.isArray(pathRecord) && pathRecord[0] === cocosPath, `built Cocos path mapping drifted for ${id}`);

    const nativePath = resolve(subpackageRoot, "native", meta.uuid.slice(0, 2), `${meta.uuid}.png`);
    const importPath = resolve(subpackageRoot, "import", meta.uuid.slice(0, 2), `${meta.uuid}@f9941.json`);
    assertInside(buildRoot, nativePath, `built native ${id}`);
    assertInside(buildRoot, importPath, `built import ${id}`);
    assert(existsSync(nativePath), `built native file is missing for ${id}`);
    assert(existsSync(importPath), `built spriteFrame import is missing for ${id}`);
    const builtNativeSha256 = sha256(nativePath);
    assert(builtNativeSha256 === record.runtimeSha256, `built native hash drifted for ${id}`);
    builtRuntimeAssets[id] = {
      cocosPath,
      sourceUuid: meta.uuid,
      builtNativePath: relative(buildRoot, nativePath).split("\\").join("/"),
      builtNativeSha256,
      builtImportPath: relative(buildRoot, importPath).split("\\").join("/"),
      builtImportSha256: sha256(importPath),
    };
  }
  assert(
    Object.keys(builtRuntimeAssets).length === FORMAL_PARTIAL_REQUIRED_PAGE_IDS.length,
    "built formal picturebook asset count must be exactly 13",
  );
  return {
    subpackageConfigSha256: sha256(configPath),
    builtRuntimeAssets,
  };
}

function verifyRuntimeRecord(assetRoot, record, kind) {
  const id = String(record?.id ?? "");
  const runtimePath = String(record?.runtimePath ?? "");
  assert(runtimePath, `${kind} runtime path is missing: ${id}`);
  const absoluteRuntimePath = resolve(assetRoot, runtimePath);
  const fromRoot = relative(assetRoot, absoluteRuntimePath);
  assert(fromRoot && !fromRoot.startsWith("..") && !isAbsolute(fromRoot), `${kind} runtime file must stay inside bundle: ${id}`);
  const actual = sha256(absoluteRuntimePath);
  assert(record?.runtimeSha256 === actual, `runtime hash drifted for ${runtimePath}`);
  return [runtimePath, actual];
}

export function verifyFormalPicturebookAssetIntegrity(assetRootArg = defaultAssetRoot) {
  const assetRoot = resolve(assetRootArg);
  const manifestPath = resolve(assetRoot, "asset-manifest.json");
  const boundaryPath = resolve(assetRoot, "asset-boundary.json");
  const manifest = readJson(manifestPath);
  const boundary = readJson(boundaryPath);
  const manifestSha256 = sha256(manifestPath);
  if (!allowsFormalPicturebookPartialExperience(boundary, manifestSha256, manifest)) {
    throw new Error("formal picturebook partial manifest/boundary is not authorized for the exact 0.4.8 candidate");
  }
  assert(exactBreezeHidden(manifest.hiddenBranches), "asset manifest hiddenBranches must be exactly [\"breeze\"]");
  assert(exactBreezeHidden(boundary.hiddenBranches), "asset boundary hiddenBranches must be exactly [\"breeze\"]");

  const assetRecords = Array.isArray(manifest.assets) ? manifest.assets : [];
  const assetIds = new Set(assetRecords.map((record) => String(record?.id ?? "")));
  for (const id of FORMAL_PARTIAL_REQUIRED_PAGE_IDS) {
    assert(assetIds.has(id), `required formal picturebook asset missing: ${id}`);
  }

  const runtimeSha256 = {};
  for (const record of assetRecords) {
    const [file, actual] = verifyRuntimeRecord(assetRoot, record, "formal picturebook");
    if (boundary.runtimeSha256 !== undefined) {
      assert(boundary.runtimeSha256?.[file] === actual, `boundary runtime hash drifted for ${file}`);
    }
    runtimeSha256[file] = actual;
  }

  return {
    manifestSha256,
    runtimeSha256,
    assetIds: [...assetIds],
    hiddenBranches: Array.isArray(manifest.hiddenBranches) ? manifest.hiddenBranches.map(String) : [],
  };
}

export function prepareWechatFormalPartialCandidate(
  buildRootArg,
  assetRootArg = defaultAssetRoot,
  buildConfigPathArg = defaultBuildConfigPath,
  sourceProjectConfigPathArg = undefined,
) {
  const buildRoot = resolve(buildRootArg);
  if (!existsSync(resolve(buildRoot, "game.json"))) {
    throw new Error(`missing WeChat game.json: ${buildRoot}`);
  }
  if (basename(buildRoot) !== "wechatgame" || basename(dirname(buildRoot)) !== FORMAL_PARTIAL_CANDIDATE_ID) {
    throw new Error(
      `build root must be the exact ${FORMAL_PARTIAL_CANDIDATE_ID}/wechatgame candidate`,
    );
  }

  const assets = verifyFormalPicturebookAssetIntegrity(assetRootArg);
  const built = verifyFormalPicturebookBuiltRuntime(buildRoot, assetRootArg);
  const appIdBinding = verifyWechatFormalPartialAppIdBinding(
    buildRoot,
    sourceProjectConfigPathArg,
  );
  const identity = {
    schema: FORMAL_PARTIAL_IDENTITY_SCHEMA,
    candidateId: FORMAL_PARTIAL_CANDIDATE_ID,
    developerVersion: FORMAL_PARTIAL_VERSION,
    engineeringRevision: FORMAL_PARTIAL_ENGINEERING_REVISION,
    storagePrefix: FORMAL_PARTIAL_STORAGE_PREFIX,
    bundleName: FORMAL_PARTIAL_BUNDLE_NAME,
    buildConfig: FORMAL_PARTIAL_BUILD_CONFIG,
    buildConfigSha256: sha256(buildConfigPathArg),
    formalAssetManifestSha256: assets.manifestSha256,
    requiredAssetIds: [...FORMAL_PARTIAL_REQUIRED_PAGE_IDS],
    hiddenBranches: assets.hiddenBranches,
    runtimeSha256: assets.runtimeSha256,
    builtSubpackageConfigSha256: built.subpackageConfigSha256,
    builtRuntimeAssets: built.builtRuntimeAssets,
    appIdBinding,
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
  const sourceProjectConfigPath = process.argv[3];
  if (!buildRoot || !sourceProjectConfigPath) {
    throw new Error(
      "Usage: node scripts/prepare-wechat-formal-partial-candidate.mjs "
        + "<wechatgame-build-root> <existing-source-project.config.json>",
    );
  }
  const result = prepareWechatFormalPartialCandidate(
    buildRoot,
    defaultAssetRoot,
    defaultBuildConfigPath,
    sourceProjectConfigPath,
  );
  console.log(JSON.stringify({ status: "PASS", ...result }, null, 2));
}
