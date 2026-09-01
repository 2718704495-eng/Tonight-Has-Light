import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { relative, resolve } from "node:path";
import process from "node:process";
import {
  WECHAT_EXPERIENCE_CANDIDATE_ID,
  WECHAT_EXPERIENCE_VERSION,
} from "./wechat-experience-authorization.mjs";

const MAIN_BUDGET_BYTES = 4 * 1024 * 1024;
const TOTAL_BUDGET_BYTES = 20 * 1024 * 1024;
const REQUIRED_SUBPACKAGES = Object.freeze([
  "indoor-n01-preview",
  "outdoor-story-b-kf-r1-temp",
  "night-02",
  "night-03",
  "night-04",
  "night-05",
]);
const OPTIONAL_INACTIVE_SUBPACKAGE = "outdoor-illustration-wind-r2";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function sha256File(path) {
  return sha256Bytes(readFileSync(path));
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

function maskedAppId(appid) {
  return `${appid.slice(0, 4)}…${appid.slice(-4)}`;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function duplicateNames(names) {
  return [...new Set(names.filter((name, index) => names.indexOf(name) !== index))];
}

export function auditWechatExperienceCandidate(buildRootArg, outputDirArg, creatorLogArg) {
  const buildRoot = resolve(buildRootArg);
  const outputDir = resolve(outputDirArg);
  const identity = readJson(resolve(buildRoot, "build-identity.json"));
  assert(identity.candidateId === WECHAT_EXPERIENCE_CANDIDATE_ID, "candidate identity drifted");
  assert(identity.developerVersion === WECHAT_EXPERIENCE_VERSION, "developer version drifted");

  const projectConfig = readJson(resolve(buildRoot, "project.config.json"));
  assert(/^wx[0-9a-f]{16}$/i.test(projectConfig.appid), "registered AppID is missing");
  const gameJson = readJson(resolve(buildRoot, "game.json"));
  const settings = readJson(resolve(buildRoot, "src/settings.json"));
  assert(Array.isArray(gameJson.subpackages), "game.json subpackages are missing");
  assert(
    gameJson.subpackages.length === 6 || gameJson.subpackages.length === 7,
    "0.4.7 must declare six required subpackages and at most one inactive historical package",
  );
  assert(
    gameJson.subpackages.every((declaration) => typeof declaration?.name === "string"),
    "game.json subpackage names are invalid",
  );
  const declaredNames = gameJson.subpackages.map((declaration) => declaration.name);
  const duplicateGameNames = duplicateNames(declaredNames);
  assert(
    duplicateGameNames.length === 0,
    `game.json contains duplicate subpackage names: ${duplicateGameNames.join(", ")}`,
  );
  for (const requiredName of REQUIRED_SUBPACKAGES) {
    assert(declaredNames.includes(requiredName), `required subpackage missing: ${requiredName}`);
  }
  const unknown = declaredNames.filter((name) =>
    !REQUIRED_SUBPACKAGES.includes(name) && name !== OPTIONAL_INACTIVE_SUBPACKAGE
  );
  assert(unknown.length === 0, `unknown subpackage: ${unknown.join(", ")}`);

  const files = listFiles(buildRoot).sort((left, right) =>
    normalizedRelative(buildRoot, left).localeCompare(normalizedRelative(buildRoot, right), "en")
  );
  const inventory = files.map((path) => ({
    path: normalizedRelative(buildRoot, path),
    bytes: statSync(path).size,
    sha256: sha256File(path),
  }));
  const hashList = inventory.map((file) => `${file.sha256}  ${file.path}`).join("\n") + "\n";
  const mainFiles = inventory.filter((file) => !file.path.startsWith("subpackages/"));
  const mainBytes = mainFiles.reduce((sum, file) => sum + file.bytes, 0);
  const totalBytes = inventory.reduce((sum, file) => sum + file.bytes, 0);

  const subpackages = {};
  for (const declaration of gameJson.subpackages) {
    const prefix = declaration.root.replace(/^\.\//, "").replace(/\/?$/, "/");
    const packageFiles = inventory.filter((file) => file.path.startsWith(prefix));
    assert(packageFiles.length > 0, `subpackage ${declaration.name} is empty`);
    const gameJs = packageFiles.find((file) => file.path === `${prefix}game.js`);
    const indexJs = packageFiles.find((file) => file.path === `${prefix}index.js`);
    assert(gameJs, `${declaration.name} game.js missing`);
    assert(indexJs, `${declaration.name} index.js missing`);
    assert(gameJs.bytes > 0, `${declaration.name} game.js is empty`);
    assert(indexJs.bytes > 0, `${declaration.name} index.js is empty`);
    subpackages[declaration.name] = {
      root: prefix,
      files: packageFiles.length,
      bytes: packageFiles.reduce((sum, file) => sum + file.bytes, 0),
      gameJs: true,
      indexJs: true,
      role: declaration.name === OPTIONAL_INACTIVE_SUBPACKAGE
        ? "optional-inactive-historical"
        : "required",
      runtimeEvidenceEligible: declaration.name !== OPTIONAL_INACTIVE_SUBPACKAGE,
    };
  }

  const settingsSubpackages = settings.assets?.subpackages;
  assert(Array.isArray(settingsSubpackages), "settings assets subpackages are missing");
  assert(
    settingsSubpackages.every((name) => typeof name === "string"),
    "settings.assets.subpackages names are invalid",
  );
  const duplicateSettingsNames = duplicateNames(settingsSubpackages);
  assert(
    duplicateSettingsNames.length === 0,
    `settings.assets.subpackages contains duplicate names: ${duplicateSettingsNames.join(", ")}`,
  );
  assert(
    settingsSubpackages.length === declaredNames.length
      && settingsSubpackages.every((name) => declaredNames.includes(name))
      && declaredNames.every((name) => settingsSubpackages.includes(name)),
    "settings subpackage index does not match game.json",
  );
  const optionalInactive = declaredNames.includes(OPTIONAL_INACTIVE_SUBPACKAGE)
    ? [OPTIONAL_INACTIVE_SUBPACKAGE]
    : [];
  assert(mainBytes <= MAIN_BUDGET_BYTES, "main package exceeds the conservative 4 MiB budget");
  assert(totalBytes <= TOTAL_BUDGET_BYTES, "total package exceeds the conservative 20 MiB budget");

  const creatorLogPath = resolve(creatorLogArg);
  const creatorLog = readFileSync(creatorLogPath, "utf8");
  const optionsMatch = creatorLog.match(/Start build task, options:\s*(\{[^\n]+\})/);
  assert(optionsMatch, "Creator build options are absent from the supplied log");
  const creatorOptions = JSON.parse(optionsMatch[1]);
  assert(
    creatorOptions.buildPath === `project://build/${WECHAT_EXPERIENCE_CANDIDATE_ID}`,
    "Creator log belongs to a different build path",
  );
  assert(
    creatorLog.includes("build Task (wechatgame) Finished"),
    "Creator log does not contain a successful completion marker",
  );

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
  const report = {
    status: "PASS",
    candidateId: identity.candidateId,
    developerVersion: identity.developerVersion,
    engineeringRevision: identity.engineeringRevision,
    appIdMasked: maskedAppId(projectConfig.appid),
    buildRoot,
    fileCount: inventory.length,
    mainPackage: {
      files: mainFiles.length,
      bytes: mainBytes,
      budgetBytes: MAIN_BUDGET_BYTES,
      pass: true,
    },
    totalPackage: {
      bytes: totalBytes,
      budgetBytes: TOTAL_BUDGET_BYTES,
      pass: true,
    },
    subpackageCount: gameJson.subpackages.length,
    subpackageRoles: {
      required: [...REQUIRED_SUBPACKAGES],
      optionalInactive,
      unknown,
    },
    subpackages,
    importantHashes,
    buildTreeSha256: sha256Bytes(hashList),
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
  writeFileSync(
    resolve(outputDir, "wechat-package-audit.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );
  return report;
}

const [, , buildRoot, outputDir, creatorLog] = process.argv;
if (!buildRoot || !outputDir || !creatorLog) {
  throw new Error(
    "Usage: node scripts/audit-wechat-experience-candidate.mjs "
      + "<wechatgame-build-root> <output-dir> <creator-build-log>",
  );
}
console.log(JSON.stringify(auditWechatExperienceCandidate(buildRoot, outputDir, creatorLog), null, 2));
