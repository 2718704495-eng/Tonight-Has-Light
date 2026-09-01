import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadSharp } from './sharp-loader.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(SCRIPT_DIR, '..');
const PROJECT_ROOT = resolve(PACKAGE_ROOT, '../..');

const BOARDS = [
  {
    name: '390',
    width: 390,
    height: 844,
    output: 'evidence/root-f1-f2-f3-f4-f5-board-390x844.png',
    frames: [
      ['ROOT', 'design-system/formal-picturebook-fullframe-v1-a-root-r4-manual-hem/exports/390x844/root_night_slope_v2-wind-hem-r4-manual.png'],
      ['F1', 'design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_001/exports/390x844/scene_02_stargaze_shot_001.png'],
      ['F2', 'design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_002/exports/390x844/scene_02_stargaze_shot_002.png'],
      ['F3', 'design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_003/exports/390x844/scene_02_stargaze_shot_003.png'],
      ['F4', 'design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_004/exports/390x844/scene_02_stargaze_shot_004.png'],
      ['F5', 'design-system/formal-picturebook-fullframe-v1-a-batch1/exports/390x844/scene_02_stargaze_shot_005.png'],
    ],
  },
  {
    name: '195',
    width: 195,
    height: 422,
    output: 'evidence/root-f1-f2-f3-f4-f5-board-195x422.png',
    frames: [
      ['ROOT', 'design-system/formal-picturebook-fullframe-v1-a-root-r4-manual-hem/exports/195x422/root_night_slope_v2-wind-hem-r4-manual.png'],
      ['F1', 'design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_001/exports/195x422/scene_02_stargaze_shot_001.png'],
      ['F2', 'design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_002/exports/195x422/scene_02_stargaze_shot_002.png'],
      ['F3', 'design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_003/exports/195x422/scene_02_stargaze_shot_003.png'],
      ['F4', 'design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_004/exports/195x422/scene_02_stargaze_shot_004.png'],
      ['F5', 'design-system/formal-picturebook-fullframe-v1-a-batch1/exports/195x422/scene_02_stargaze_shot_005.png'],
    ],
  },
];

const sha256File = async (path) => createHash('sha256').update(await readFile(path)).digest('hex');
const projectPath = (relativePath) => resolve(PROJECT_ROOT, relativePath);

async function buildBoard(sharp, board) {
  const gutter = board.name === '390' ? 20 : 12;
  const labelHeight = board.name === '390' ? 52 : 34;
  const canvasWidth = board.frames.length * board.width + (board.frames.length + 1) * gutter;
  const canvasHeight = board.height + labelHeight + gutter * 2;
  const composites = [];
  const sourceHashes = {};

  for (let index = 0; index < board.frames.length; index += 1) {
    const [label, relativePath] = board.frames[index];
    const sourcePath = projectPath(relativePath);
    sourceHashes[relativePath] = await sha256File(sourcePath);
    const left = gutter + index * (board.width + gutter);
    const top = gutter + labelHeight;
    composites.push({ input: sourcePath, left, top });
    const labelSvg = Buffer.from(`<svg width="${board.width}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#06142A"/><text x="50%" y="${board.name === '390' ? 34 : 22}" text-anchor="middle" fill="#E6ECF2" font-family="Arial, sans-serif" font-size="${board.name === '390' ? 24 : 15}">${label}</text></svg>`);
    composites.push({ input: labelSvg, left, top: gutter });
  }

  const outputPath = resolve(PACKAGE_ROOT, board.output);
  await mkdir(dirname(outputPath), { recursive: true });
  await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 3,
      background: '#06142A',
    },
  })
    .composite(composites)
    .removeAlpha()
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);

  return {
    path: `design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/${board.output}`,
    sha256: await sha256File(outputPath),
    source_hashes: sourceHashes,
  };
}

async function main() {
  const sharp = await loadSharp();
  const report = {
    candidateId: 'stargaze-formal-batch-v1-a-f4-r1',
    board390: await buildBoard(sharp, BOARDS[0]),
    board195: await buildBoard(sharp, BOARDS[1]),
  };
  const reportPath = resolve(PACKAGE_ROOT, 'evidence/f4-review-board-report.json');
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

await main();
