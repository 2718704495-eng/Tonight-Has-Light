import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadSharp } from './sharp-loader.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(SCRIPT_DIR, '..');
const PROJECT_ROOT = resolve(PACKAGE_ROOT, '../..');
const EXPECTED = Object.freeze({
  master: { width: 780, height: 1688 },
  '195x422': { width: 195, height: 422 },
  '360x800': { width: 360, height: 800 },
  '390x844': { width: 390, height: 844 },
  '430x932': { width: 430, height: 932 },
  '430x844-pressure': { width: 430, height: 844 },
});

const sha256File = async (path) => createHash('sha256').update(await readFile(path)).digest('hex');
const projectPath = (relativePath) => resolve(PROJECT_ROOT, relativePath);

async function checkArtifact(sharp, checks, issues, label, artifact, expectedDimensions) {
  const path = projectPath(artifact.path);
  const actualHash = await sha256File(path);
  const metadata = await sharp(path).metadata();
  const hashPass = actualHash === artifact.sha256;
  const dimensionsPass = metadata.width === expectedDimensions.width && metadata.height === expectedDimensions.height;
  const formatPass = metadata.format === 'png' && metadata.depth === 'uchar' && metadata.space === 'srgb';
  checks.push({
    label,
    hashPass,
    dimensionsPass,
    formatPass,
    actualHash,
    metadata: {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      space: metadata.space,
      depth: metadata.depth,
      hasAlpha: Boolean(metadata.hasAlpha),
    },
  });
  if (!hashPass) issues.push(`${label}: hash drift`);
  if (!dimensionsPass) issues.push(`${label}: dimension drift`);
  if (!formatPass) issues.push(`${label}: expected 8-bit sRGB PNG`);
}

async function main() {
  const shotId = process.argv[2];
  if (!shotId) throw new Error('Usage: node validate-page.mjs <shot_id> [--write]');

  const sharp = await loadSharp();
  const pageRoot = resolve(PACKAGE_ROOT, 'pages', shotId);
  const manifestPath = resolve(pageRoot, 'candidate-manifest.json');
  const reportPath = resolve(PACKAGE_ROOT, 'evidence', `${shotId}-mechanical-validation.json`);
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const checks = [];
  const issues = [];

  await checkArtifact(sharp, checks, issues, 'master', manifest.master, EXPECTED.master);
  for (const [name, dimensions] of Object.entries(EXPECTED)) {
    if (name === 'master') continue;
    await checkArtifact(sharp, checks, issues, name, manifest.exports[name], dimensions);
  }

  const rawHash = await sha256File(projectPath(manifest.generation.raw_path));
  checks.push({
    label: 'raw hash',
    passed: rawHash === manifest.generation.raw_sha256,
    actualHash: rawHash,
    recordedHash: manifest.generation.raw_sha256,
  });
  if (rawHash !== manifest.generation.raw_sha256) issues.push('raw: hash drift');

  const promptHash = await sha256File(projectPath(manifest.generation.prompt_path));
  checks.push({
    label: 'prompt hash',
    passed: promptHash === manifest.generation.prompt_sha256,
    actualHash: promptHash,
    recordedHash: manifest.generation.prompt_sha256,
  });
  if (promptHash !== manifest.generation.prompt_sha256) issues.push('prompt: hash drift');

  for (const reference of manifest.references) {
    const actualHash = await sha256File(projectPath(reference.path));
    const passed = actualHash === reference.sha256;
    checks.push({ label: `reference ${reference.role}`, passed, actualHash, recordedHash: reference.sha256 });
    if (!passed) issues.push(`reference drift: ${reference.path}`);
  }

  const borderRgb = [6, 38, 95];
  for (const name of ['360x800', '430x932', '430x844-pressure']) {
    const path = projectPath(manifest.exports[name].path);
    const { data, info } = await sharp(path).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const isBorderPixel = (x, y) => {
      const offset = (y * info.width + x) * info.channels;
      return borderRgb.every((channel, index) => data[offset + index] === channel);
    };
    const edgeSamples = [
      [0, 0],
      [info.width - 1, 0],
      [0, info.height - 1],
      [info.width - 1, info.height - 1],
    ];
    const passed = edgeSamples.every(([x, y]) => isBorderPixel(x, y));
    checks.push({ label: `${name} safe-corner border`, passed });
    if (!passed) issues.push(`${name}: exposed safe border corner is not #06265F`);
  }

  const report = {
    candidateId: manifest.candidate_id,
    page: manifest.page,
    status: issues.length === 0
      ? (manifest.approval?.user_visual_approval
        ? 'MECHANICAL PASS / USER VISUAL PASS FROZEN'
        : 'MECHANICAL PASS / VISUAL REVIEW REQUIRED')
      : 'FAIL',
    checks,
    issues,
  };
  if (process.argv.includes('--write')) {
    await mkdir(dirname(reportPath), { recursive: true });
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (issues.length > 0) process.exitCode = 1;
}

await main();
