import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadSharp } from './sharp-loader.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(SCRIPT_DIR, '..');
const PAGE_ID = 'scene_02_stargaze_shot_001';
const PAGE_ROOT = resolve(PACKAGE_ROOT, 'pages', PAGE_ID);
const EXPECTED = Object.freeze({
  master: { width: 780, height: 1688 },
  '195x422': { width: 195, height: 422 },
  '360x800': { width: 360, height: 800 },
  '390x844': { width: 390, height: 844 },
  '430x932': { width: 430, height: 932 },
  '430x844-pressure': { width: 430, height: 844 },
});
const sha256File = async (path) => createHash('sha256').update(await readFile(path)).digest('hex');

async function main() {
  const sharp = await loadSharp();
  const metadataPath = resolve(PAGE_ROOT, 'export-metadata.json');
  const record = JSON.parse(await readFile(metadataPath, 'utf8'));
  const checks = [];
  const issues = [];

  async function check(label, artifact, dimensions) {
    const path = resolve(PACKAGE_ROOT, '..', '..', artifact.path);
    const metadata = await sharp(path).metadata();
    const actualHash = await sha256File(path);
    const dimensionsPass = metadata.width === dimensions.width && metadata.height === dimensions.height;
    const formatPass = metadata.format === 'png' && metadata.depth === 'uchar' && metadata.space === 'srgb';
    const hashPass = actualHash === artifact.sha256;
    checks.push({ label, dimensionsPass, formatPass, hashPass, metadata, actualHash });
    if (!dimensionsPass) issues.push(`${label}: dimensions drift`);
    if (!formatPass) issues.push(`${label}: expected 8-bit sRGB PNG`);
    if (!hashPass) issues.push(`${label}: hash drift`);
  }

  await check('master', record.master, EXPECTED.master);
  for (const [name, dimensions] of Object.entries(EXPECTED)) {
    if (name === 'master') continue;
    await check(name, record.exports[name], dimensions);
  }

  const safeBorderRgb = [6, 38, 95];
  for (const name of ['360x800', '430x932', '430x844-pressure']) {
    const path = resolve(PACKAGE_ROOT, '..', '..', record.exports[name].path);
    const { data, info } = await sharp(path).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const corners = [
      [0, 0],
      [info.width - 1, 0],
      [0, info.height - 1],
      [info.width - 1, info.height - 1],
    ];
    const colors = corners.map(([x, y]) => {
      const offset = (y * info.width + x) * info.channels;
      return [data[offset], data[offset + 1], data[offset + 2]];
    });
    const passed = colors.every((color) => color.every((channel, index) => channel === safeBorderRgb[index]));
    checks.push({ label: `${name} safe-border corners`, passed, colors });
    if (!passed) issues.push(`${name}: exposed safe border is not #06265F`);
  }

  const result = { status: issues.length === 0 ? 'MECHANICAL PASS / VISUAL REVIEW REQUIRED' : 'FAIL', checks, issues };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (issues.length > 0) process.exitCode = 1;
}

await main();
