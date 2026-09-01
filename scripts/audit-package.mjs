#!/usr/bin/env node

import { existsSync, lstatSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';

const MAIN_LIMIT = 4 * 1024 * 1024;
const TOTAL_LIMIT = 20 * 1024 * 1024;
const input = process.argv[2];
if (!input) {
  console.error('Usage: node scripts/audit-package.mjs /absolute/path/to/wechatgame-build');
  process.exit(64);
}

const buildRoot = resolve(process.cwd(), input);
if (!existsSync(buildRoot) || !statSync(buildRoot).isDirectory()) {
  console.error(`Build directory does not exist or is not a directory: ${buildRoot}`);
  process.exit(66);
}

const normalize = (value) => value.split(sep).join('/').replace(/^\.\//, '').replace(/\/$/, '');
const isUnder = (path, root) => path === root || path.startsWith(`${root}/`);
const formatBytes = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MiB (${bytes} bytes)`;

const files = [];
const walk = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = resolve(directory, entry.name);
    if (entry.isSymbolicLink() || lstatSync(absolutePath).isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      walk(absolutePath);
    } else if (entry.isFile()) {
      files.push({
        path: normalize(relative(buildRoot, absolutePath)),
        bytes: statSync(absolutePath).size,
      });
    }
  }
};
walk(buildRoot);

const gameJsonPath = resolve(buildRoot, 'game.json');
let configuredRoots = [];
if (existsSync(gameJsonPath)) {
  try {
    const gameJson = JSON.parse(readFileSync(gameJsonPath, 'utf8'));
    const entries = gameJson.subpackages ?? gameJson.subPackages ?? [];
    configuredRoots = entries
      .map((entry) => normalize(String(entry?.root ?? '')))
      .filter(Boolean);
  } catch (error) {
    console.error(`Cannot parse game.json: ${error.message}`);
    process.exit(65);
  }
}

if (configuredRoots.length === 0) {
  const conventionalRoot = resolve(buildRoot, 'subpackages');
  if (existsSync(conventionalRoot) && statSync(conventionalRoot).isDirectory()) {
    configuredRoots = readdirSync(conventionalRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
      .map((entry) => `subpackages/${entry.name}`);
  }
}

const remoteRoots = ['remote'];
const subpackageTotals = new Map(configuredRoots.map((root) => [root, 0]));
let mainBytes = 0;
let remoteBytes = 0;
let unclassifiedSubpackageBytes = 0;

for (const file of files) {
  if (remoteRoots.some((root) => isUnder(file.path, root))) {
    remoteBytes += file.bytes;
    continue;
  }

  const subpackageRoot = configuredRoots.find((root) => isUnder(file.path, root));
  if (subpackageRoot) {
    subpackageTotals.set(subpackageRoot, subpackageTotals.get(subpackageRoot) + file.bytes);
  } else if (isUnder(file.path, 'subpackages')) {
    unclassifiedSubpackageBytes += file.bytes;
  } else {
    mainBytes += file.bytes;
  }
}

const configuredSubpackageBytes = [...subpackageTotals.values()].reduce((sum, bytes) => sum + bytes, 0);
const uploadedBytes = mainBytes + configuredSubpackageBytes + unclassifiedSubpackageBytes;

console.log(`Package audit: ${buildRoot}`);
console.log(`Main package:      ${formatBytes(mainBytes)} / ${formatBytes(MAIN_LIMIT)}`);
for (const [root, bytes] of [...subpackageTotals.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`Subpackage ${root}: ${formatBytes(bytes)}`);
}
if (unclassifiedSubpackageBytes > 0) {
  console.log(`Unclassified subpackages/: ${formatBytes(unclassifiedSubpackageBytes)}`);
  console.warn('WARNING: files under subpackages/ are not declared in game.json and are counted in uploaded total.');
}
console.log(`Uploaded total:    ${formatBytes(uploadedBytes)} / conservative ${formatBytes(TOTAL_LIMIT)}`);
console.log(`Remote resources:  ${formatBytes(remoteBytes)} (reported separately; not counted as uploaded package)`);

console.log('\nLargest 20 files:');
for (const file of [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 20)) {
  console.log(`${String(file.bytes).padStart(10)}  ${file.path}`);
}

const failures = [];
if (mainBytes > MAIN_LIMIT) {
  failures.push(`main package exceeds conservative 4 MiB budget by ${formatBytes(mainBytes - MAIN_LIMIT)}`);
}
if (uploadedBytes > TOTAL_LIMIT) {
  failures.push(`uploaded total exceeds conservative 20 MiB budget by ${formatBytes(uploadedBytes - TOTAL_LIMIT)}`);
}

if (!existsSync(gameJsonPath)) {
  console.warn('\nWARNING: game.json was not found; subpackage classification used directory conventions only.');
}

if (failures.length > 0) {
  console.error('\nPackage audit FAILED:');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('Re-check current WeChat official limits and the active AppID backend; these are project-internal budgets.');
  process.exit(2);
}

console.log('\nPackage audit PASSED against project-internal budgets.');
console.log('This does not replace WeChat DevTools upload preflight or the current AppID backend limits.');
