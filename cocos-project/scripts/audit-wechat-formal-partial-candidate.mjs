import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  FORMAL_PARTIAL_BUNDLE_NAME,
  FORMAL_PARTIAL_CANDIDATE_ID,
  FORMAL_PARTIAL_VERSION,
} from "./wechat-formal-partial-authorization.mjs";
import {
  verifyFormalPicturebookBuiltRuntime,
  verifyWechatFormalPartialAppIdBinding,
} from "./prepare-wechat-formal-partial-candidate.mjs";

const MAIN_BUDGET_BYTES = 4 * 1024 * 1024;
const TOTAL_BUDGET_BYTES = 20 * 1024 * 1024;
const FULL_APP_ID_PATTERN = /\bwx[0-9a-f]{16}\b/i;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function sha256File(path) {
  return sha256Bytes(readFileSync(path));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function listFiles(root, current = root) {
  const files = [];
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const path = resolve(current, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(root, path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function normalizedRelative(root, path) {
  return relative(root, path).split("\\").join("/");
}

function assertOutsideBuild(buildRoot, path, label) {
  const fromRoot = relative(buildRoot, path);
  assert(
    fromRoot.startsWith("..") || isAbsolute(fromRoot),
    `${label} must stay outside the frozen build root`,
  );
}

export function computeWechatFormalPartialBuildTree(buildRootArg) {
  const buildRoot = resolve(buildRootArg);
  const files = listFiles(buildRoot).sort((left, right) =>
    normalizedRelative(buildRoot, left).localeCompare(normalizedRelative(buildRoot, right), "en")
  );
  const inventory = files.map((path) => ({
    path: normalizedRelative(buildRoot, path),
    bytes: statSync(path).size,
    sha256: sha256File(path),
  }));
  const hashList = inventory.map((file) => `${file.sha256}  ${file.path}`).join("\n") + "\n";
  return {
    inventory,
    hashList,
    buildTreeSha256: sha256Bytes(hashList),
  };
}

function duplicateNames(names) {
  return [...new Set(names.filter((name, index) => names.indexOf(name) !== index))];
}

export function auditWechatFormalPartialCandidate(
  buildRootArg,
  outputDirArg,
  creatorLogArg,
  sourceProjectConfigPathArg,
  assetRootArg = undefined,
) {
  const buildRoot = resolve(buildRootArg);
  const outputDir = resolve(outputDirArg);
  const identity = readJson(resolve(buildRoot, "build-identity.json"));
  assert(identity.candidateId === FORMAL_PARTIAL_CANDIDATE_ID, "candidate identity drifted");
  assert(identity.developerVersion === FORMAL_PARTIAL_VERSION, "developer version drifted");
  assert(identity.bundleName === FORMAL_PARTIAL_BUNDLE_NAME, "bundle identity drifted");

  const appIdBinding = verifyWechatFormalPartialAppIdBinding(
    buildRoot,
    sourceProjectConfigPathArg,
    identity.appIdBinding,
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

  const projectConfig = readJson(resolve(buildRoot, "project.config.json"));
  assert(/^wx[0-9a-f]{16}$/i.test(projectConfig.appid), "registered AppID is missing");
  const gameJson = readJson(resolve(buildRoot, "game.json"));
  const settings = readJson(resolve(buildRoot, "src/settings.json"));
  assert(gameJson.deviceOrientation === "portrait", "game.json deviceOrientation must be portrait");
  assert(Array.isArray(gameJson.subpackages), "game.json subpackages are missing");
  const declaredNames = gameJson.subpackages.map((entry) => String(entry?.name ?? ""));
  const duplicateGameNames = duplicateNames(declaredNames);
  assert(duplicateGameNames.length === 0, `game.json contains duplicate subpackage names: ${duplicateGameNames.join(", ")}`);
  assert(declaredNames.includes(FORMAL_PARTIAL_BUNDLE_NAME), `required subpackage missing: ${FORMAL_PARTIAL_BUNDLE_NAME}`);

  const settingsSubpackages = settings.assets?.subpackages;
  assert(Array.isArray(settingsSubpackages), "settings assets subpackages are missing");
  const duplicateSettingsNames = duplicateNames(settingsSubpackages);
  assert(duplicateSettingsNames.length === 0, `settings.assets.subpackages contains duplicate names: ${duplicateSettingsNames.join(", ")}`);
  assert(
    settingsSubpackages.length === declaredNames.length
      && settingsSubpackages.every((name) => declaredNames.includes(name))
      && declaredNames.every((name) => settingsSubpackages.includes(name)),
    "settings subpackage index does not match game.json",
  );

  const { inventory, hashList, buildTreeSha256 } = computeWechatFormalPartialBuildTree(buildRoot);
  const mainFiles = inventory.filter((file) => !file.path.startsWith("subpackages/"));
  const mainBytes = mainFiles.reduce((sum, file) => sum + file.bytes, 0);
  const totalBytes = inventory.reduce((sum, file) => sum + file.bytes, 0);
  assert(mainBytes <= MAIN_BUDGET_BYTES, "main package exceeds the conservative 4 MiB budget");
  assert(totalBytes <= TOTAL_BUDGET_BYTES, "total package exceeds the conservative 20 MiB budget");

  const subpackages = {};
  for (const declaration of gameJson.subpackages) {
    const name = String(declaration.name);
    const prefix = String(declaration.root).replace(/^\.\//, "").replace(/\/?$/, "/");
    const packageFiles = inventory.filter((file) => file.path.startsWith(prefix));
    assert(packageFiles.length > 0, `subpackage ${name} is empty`);
    assert(packageFiles.some((file) => file.path === `${prefix}game.js`), `${name} game.js missing`);
    assert(packageFiles.some((file) => file.path === `${prefix}index.js`), `${name} index.js missing`);
    subpackages[name] = {
      root: prefix,
      files: packageFiles.length,
      bytes: packageFiles.reduce((sum, file) => sum + file.bytes, 0),
      role: name === FORMAL_PARTIAL_BUNDLE_NAME ? "formal-partial-runtime" : "historical-runtime-ineligible",
      runtimeEvidenceEligible: name === FORMAL_PARTIAL_BUNDLE_NAME,
    };
  }

  const creatorLogPath = resolve(creatorLogArg);
  const creatorLog = readFileSync(creatorLogPath, "utf8");
  const optionsMatch = creatorLog.match(/Start build task, options:\s*(\{[^\n]+\})/);
  assert(optionsMatch, "Creator build options are absent from the supplied log");
  const creatorOptions = JSON.parse(optionsMatch[1]);
  assert(
    creatorOptions.buildPath === `project://build/${FORMAL_PARTIAL_CANDIDATE_ID}`,
    "Creator log belongs to a different build path",
  );
  assert(creatorLog.includes("build Task (wechatgame) Finished"), "Creator log does not contain a successful completion marker");

  const importantPaths = [
    "assets/main/index.js",
    "build-identity.json",
    "game.json",
    "project.config.json",
    "src/settings.json",
  ];
  const importantHashes = Object.fromEntries(
    importantPaths.map((path) => [path, inventory.find((file) => file.path === path)?.sha256]),
  );
  for (const [path, hash] of Object.entries(importantHashes)) {
    assert(/^[0-9a-f]{64}$/.test(String(hash)), `important hash missing for ${path}`);
  }
  const report = {
    status: "PASS",
    candidateId: identity.candidateId,
    developerVersion: identity.developerVersion,
    engineeringRevision: identity.engineeringRevision,
    appIdBinding: {
      sourceProjectConfigSha256: appIdBinding.sourceProjectConfigSha256,
      sourceProjectConfigPathSha256: appIdBinding.sourceProjectConfigPathSha256,
      targetProjectConfigSha256: appIdBinding.targetProjectConfigSha256,
      appIdSha256: appIdBinding.appIdSha256,
    },
    buildRoot,
    fileCount: inventory.length,
    mainPackage: { files: mainFiles.length, bytes: mainBytes, budgetBytes: MAIN_BUDGET_BYTES, pass: true },
    totalPackage: { bytes: totalBytes, budgetBytes: TOTAL_BUDGET_BYTES, pass: true },
    subpackages,
    hiddenBranches: Array.isArray(identity.hiddenBranches) ? identity.hiddenBranches : [],
    formalBuiltRuntime: {
      subpackageConfigSha256: built.subpackageConfigSha256,
      assets: built.builtRuntimeAssets,
    },
    importantHashes,
    buildTreeSha256,
    creatorBuild: {
      logPath: creatorLogPath,
      logSha256: sha256File(creatorLogPath),
      platform: creatorOptions.platform,
      buildPath: creatorOptions.buildPath,
      outputName: creatorOptions.outputName,
      completed: true,
    },
    remoteOperationPerformed: false,
  };

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(resolve(outputDir, "WECHAT_BUILD_HASHES.sha256"), hashList, "utf8");
  writeFileSync(resolve(outputDir, "wechat-package-audit.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}

export function createWechatFormalPartialUploadReceipt({
  buildRoot: buildRootArg,
  preflightAuditPath: preflightAuditPathArg,
  cliLogPath: cliLogPathArg,
  remoteLogPath: remoteLogPathArg,
  infoOutputPath: infoOutputPathArg,
  uploadDescription,
  outputPath: outputPathArg,
  cliExitCode,
}) {
  const buildRoot = resolve(buildRootArg);
  const preflightAuditPath = resolve(preflightAuditPathArg);
  const cliLogPath = resolve(cliLogPathArg);
  const remoteLogPath = resolve(remoteLogPathArg);
  const infoOutputPath = resolve(infoOutputPathArg);
  const outputPath = resolve(outputPathArg);
  assertOutsideBuild(buildRoot, preflightAuditPath, "preflight audit");
  assertOutsideBuild(buildRoot, cliLogPath, "CLI upload log");
  assertOutsideBuild(buildRoot, remoteLogPath, "WeChat remote log");
  assertOutsideBuild(buildRoot, infoOutputPath, "WeChat info output");
  assertOutsideBuild(buildRoot, outputPath, "upload receipt");
  for (const [label, path] of [
    ["preflight audit", preflightAuditPath],
    ["CLI upload log", cliLogPath],
    ["WeChat remote log", remoteLogPath],
    ["WeChat info output", infoOutputPath],
  ]) {
    assert(existsSync(path), `${label} is missing: ${path}`);
  }

  const preflight = readJson(preflightAuditPath);
  assert(preflight.status === "PASS", "preflight package audit did not pass");
  assert(preflight.candidateId === FORMAL_PARTIAL_CANDIDATE_ID, "preflight candidate identity drifted");
  assert(preflight.developerVersion === FORMAL_PARTIAL_VERSION, "preflight developer version drifted");
  assert(resolve(preflight.buildRoot) === buildRoot, "preflight audit belongs to another build root");
  assert(/^[0-9a-f]{64}$/.test(String(preflight.buildTreeSha256)), "preflight build tree hash is missing");
  assert(typeof uploadDescription === "string" && uploadDescription.length > 0, "upload description is required");
  assert(!uploadDescription.includes("\n"), "upload description must stay on one line");
  assert(uploadDescription.includes(FORMAL_PARTIAL_VERSION), "upload description does not bind the developer version");
  assert(uploadDescription.includes(preflight.buildTreeSha256), "upload description does not bind the full frozen tree hash");
  assert(uploadDescription.includes("不提审") && uploadDescription.includes("不发布"), "upload description must preserve the no-review/no-release boundary");

  const cliLog = readFileSync(cliLogPath, "utf8");
  const remoteLog = readFileSync(remoteLogPath, "utf8");
  assert(!FULL_APP_ID_PATTERN.test(cliLog), "CLI upload log contains an unredacted AppID");
  assert(!FULL_APP_ID_PATTERN.test(remoteLog), "WeChat remote log contains an unredacted AppID");
  assert(cliExitCode === 0, "WeChat CLI upload exit code is not zero");
  assert(/✔\s*upload/i.test(cliLog), "WeChat CLI upload success marker is missing");
  const normalizedRemoteHeader = [
    "type=UPLOAD",
    `project=${buildRoot}`,
    `version=${FORMAL_PARTIAL_VERSION}`,
    `desc=${uploadDescription}`,
    `infoOutput=${infoOutputPath}`,
    `preflightBuildTreeSha256=${preflight.buildTreeSha256}`,
  ].join("\n");
  const remoteLines = remoteLog.split(/\r?\n/);
  assert(
    remoteLog.includes(normalizedRemoteHeader),
    !remoteLines.includes(`project=${buildRoot}`)
      ? "WeChat remote log does not bind the exact build root"
      : !remoteLines.includes(`infoOutput=${infoOutputPath}`)
        ? "WeChat remote log does not bind the exact info output"
        : "WeChat remote log does not bind the exact description and frozen tree",
  );
  assert(
    (remoteLog.match(/^type=UPLOAD$/gm) ?? []).length === 1,
    "WeChat remote log must contain exactly one normalized upload task",
  );
  const uploadBlockPattern = new RegExp(
    [
      escapeRegExp(normalizedRemoteHeader),
      String.raw`[\s\S]*?`,
      String.raw`upload cos step2 startCosUpload cost\s+\d+`,
      String.raw`[\s\S]*?`,
      String.raw`upload cos step3 commitTask[^\n]*\bcost\s+\d+`,
    ].join(""),
    "i",
  );
  assert(uploadBlockPattern.test(remoteLog), "WeChat remote log is not one complete 0.4.8 upload task");

  const infoOutput = readJson(infoOutputPath);
  const uploadTotalBytes = Number(infoOutput?.size?.total);
  const uploadPackages = infoOutput?.size?.packages;
  assert(Number.isSafeInteger(uploadTotalBytes) && uploadTotalBytes > 0, "WeChat info output total size is invalid");
  assert(Array.isArray(uploadPackages), "WeChat info output package list is missing");
  const packageNames = uploadPackages.map((entry) => String(entry?.name ?? ""));
  assert(duplicateNames(packageNames).length === 0, "WeChat info output contains duplicate package names");
  const expectedPackageBytes = new Map([
    ["main", Number(preflight.mainPackage?.bytes)],
    ...Object.entries(preflight.subpackages ?? {}).map(([name, value]) => [
      `/subpackages/${name}/`,
      Number(value?.bytes),
    ]),
  ]);
  const expectedNames = ["TOTAL", ...expectedPackageBytes.keys()];
  assert(
    packageNames.length === expectedNames.length
      && expectedNames.every((name) => packageNames.includes(name)),
    "WeChat info output package inventory does not match the preflight candidate",
  );
  const totalRow = uploadPackages.find((entry) => entry.name === "TOTAL");
  assert(Number(totalRow?.size) === uploadTotalBytes, "WeChat info output TOTAL row is inconsistent");
  let packageSum = 0;
  for (const [name, preflightBytes] of expectedPackageBytes) {
    const entry = uploadPackages.find((candidate) => candidate.name === name);
    const uploadBytes = Number(entry?.size);
    assert(Number.isSafeInteger(uploadBytes) && uploadBytes > 0, `WeChat info output size is invalid for ${name}`);
    const tolerance = Math.max(name === "main" ? 128 * 1024 : 8 * 1024, Math.ceil(preflightBytes * 0.02));
    assert(
      uploadBytes <= preflightBytes && preflightBytes - uploadBytes <= tolerance,
      `WeChat info output size drifted too far from preflight for ${name}`,
    );
    const cliPackagePattern = new RegExp(`${escapeRegExp(name)}[\\s\\S]{0,160}?\\b${uploadBytes}\\b`);
    assert(cliPackagePattern.test(cliLog), `CLI package evidence does not match info output for ${name}`);
    packageSum += uploadBytes;
  }
  assert(packageSum === uploadTotalBytes, "WeChat info output total does not equal the package sum");
  assert(
    uploadTotalBytes <= Number(preflight.totalPackage?.bytes)
      && Number(preflight.totalPackage?.bytes) - uploadTotalBytes <= 256 * 1024,
    "WeChat info output total size drifted too far from preflight",
  );
  const startCosUploadCompleted = true;
  const commitTaskCompleted = true;

  const postUpload = computeWechatFormalPartialBuildTree(buildRoot);
  assert(
    postUpload.buildTreeSha256 === preflight.buildTreeSha256,
    "post-upload build tree hash differs from the frozen pre-upload tree",
  );
  const receipt = {
    schema: "tonight-has-light.wechat-formal-picturebook-partial-upload-receipt.v2",
    status: "PASS",
    candidateId: FORMAL_PARTIAL_CANDIDATE_ID,
    developerVersion: FORMAL_PARTIAL_VERSION,
    operation: "wechat-devtools upload",
    cli: {
      exitCode: cliExitCode,
      uploadMarker: true,
      logSha256: sha256File(cliLogPath),
    },
    remoteChain: {
      startCosUploadCompleted,
      commitTaskCompleted,
    },
    binding: {
      buildRoot,
      buildRootSha256: sha256Bytes(buildRoot),
      uploadDescription,
      infoOutputPath,
      infoOutputSha256: sha256File(infoOutputPath),
      uploadTotalBytes,
      packageSizes: Object.fromEntries(
        uploadPackages.map((entry) => [String(entry.name), Number(entry.size)]),
      ),
    },
    remoteLogSha256: sha256File(remoteLogPath),
    preflightAuditSha256: sha256File(preflightAuditPath),
    preUploadBuildTreeSha256: preflight.buildTreeSha256,
    postUploadBuildTreeSha256: postUpload.buildTreeSha256,
    buildTreeUnchanged: true,
    notPerformed: [
      "set experience version",
      "submit for review",
      "public release",
      "Git commit",
      "Git push",
    ],
  };
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(receipt, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  return receipt;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const [, , buildRoot, outputDir, creatorLog, sourceProjectConfigPath] = process.argv;
  if (!buildRoot || !outputDir || !creatorLog || !sourceProjectConfigPath) {
    console.error(
      "Usage: node scripts/audit-wechat-formal-partial-candidate.mjs "
        + "<wechatgame-build-root> <output-dir> <creator-build-log> "
        + "<existing-source-project.config.json>",
    );
    process.exit(1);
  }
  try {
    console.log(JSON.stringify(auditWechatFormalPartialCandidate(
      buildRoot,
      outputDir,
      creatorLog,
      sourceProjectConfigPath,
    ), null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
