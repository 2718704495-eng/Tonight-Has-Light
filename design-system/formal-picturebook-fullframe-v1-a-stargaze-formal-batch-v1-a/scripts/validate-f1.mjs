import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadSharp } from './sharp-loader.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(SCRIPT_DIR, '..');
const PROJECT_ROOT = resolve(PACKAGE_ROOT, '../..');
const PAGE_ROOT = resolve(PACKAGE_ROOT, 'pages/scene_02_stargaze_shot_001');
const MANIFEST = resolve(PAGE_ROOT, 'candidate-manifest.json');
const REPORT = resolve(PACKAGE_ROOT, 'evidence/root-mechanical-validation.json');
const EXPECTED = Object.freeze({
  master: { width: 780, height: 1688 },
  '195x422': { width: 195, height: 422 },
  '360x800': { width: 360, height: 800 },
  '390x844': { width: 390, height: 844 },
  '430x932': { width: 430, height: 932 },
  '430x844-pressure': { width: 430, height: 844 },
});
const EXPECTED_REFERENCES = Object.freeze({
  'design-system/formal-picturebook-fullframe-v1-a-root-r4-manual-hem/exports/390x844/root_night_slope_v2-wind-hem-r4-manual.png': '23443918a0c892d569a6fd49b55b889d70bb4ed0dc7a6396a0af2bf5fad2306a',
  'design-system/formal-picturebook-fullframe-v1-a-batch1/exports/390x844/scene_02_stargaze_shot_005.png': 'ad3a13c6a4d915f178d03d444874776e2df042f328f998de81a2bfbf0d774d8d',
});

const sha256File = async (path) => createHash('sha256').update(await readFile(path)).digest('hex');
const projectPath = (relativePath) => resolve(PROJECT_ROOT, relativePath);

async function main() {
  const sharp = await loadSharp();
  const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
  const checks = [];
  const issues = [];

  async function checkArtifact(label, artifact, expectedDimensions) {
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

  await checkArtifact('master', manifest.master, EXPECTED.master);
  for (const [name, dimensions] of Object.entries(EXPECTED)) {
    if (name === 'master') continue;
    await checkArtifact(name, manifest.exports[name], dimensions);
  }

  const rawHash = await sha256File(projectPath(manifest.generation.raw_path));
  checks.push({ label: 'raw hash', passed: rawHash === manifest.generation.raw_sha256, actualHash: rawHash });
  if (rawHash !== manifest.generation.raw_sha256) issues.push('raw: hash drift');

  for (const reference of manifest.references) {
    const expectedHash = EXPECTED_REFERENCES[reference.path];
    const actualHash = await sha256File(projectPath(reference.path));
    const passed = expectedHash === reference.sha256 && actualHash === expectedHash;
    checks.push({ label: `reference ${reference.role}`, passed, actualHash, recordedHash: reference.sha256 });
    if (!passed) issues.push(`reference drift: ${reference.path}`);
  }

  const promptPath = projectPath(manifest.generation.prompt_path);
  const promptSha256 = await sha256File(promptPath);
  checks.push({ label: 'production prompt present', passed: true, promptSha256 });

  const borderRgb = [6, 38, 95];
  for (const name of ['360x800', '430x932', '430x844-pressure']) {
    const path = projectPath(manifest.exports[name].path);
    const { data, info } = await sharp(path).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const isBorderPixel = (x, y) => {
      const offset = (y * info.width + x) * info.channels;
      return borderRgb.every((channel, index) => data[offset + index] === channel);
    };
    const fullBorderRows = [];
    const fullBorderColumns = [];
    for (let y = 0; y < info.height; y += 1) {
      if (Array.from({ length: info.width }, (_, x) => isBorderPixel(x, y)).every(Boolean)) fullBorderRows.push(y);
    }
    for (let x = 0; x < info.width; x += 1) {
      if (Array.from({ length: info.height }, (_, y) => isBorderPixel(x, y)).every(Boolean)) fullBorderColumns.push(x);
    }
    const passed = fullBorderRows.length > 0 || fullBorderColumns.length > 0;
    checks.push({ label: `${name} exposed safe border`, passed, fullBorderRows, fullBorderColumns });
    if (!passed) issues.push(`${name}: exposed safe border is not #06265F`);
  }

  const report = {
    candidateId: manifest.candidate_id,
    status: issues.length === 0 ? 'MECHANICAL PASS / VISUAL REVIEW REQUIRED' : 'FAIL',
    promptSha256,
    checks,
    issues,
  };
  if (process.argv.includes('--write')) {
    await mkdir(dirname(REPORT), { recursive: true });
    await writeFile(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (issues.length > 0) process.exitCode = 1;
}

await main();
