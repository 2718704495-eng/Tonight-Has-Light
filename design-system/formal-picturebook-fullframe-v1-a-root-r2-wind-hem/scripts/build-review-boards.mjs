import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSharp } from './sharp-loader.mjs';

const sharp = loadSharp();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, '..');
const projectRoot = path.resolve(packageRoot, '../..');
const oldBatchRoot = path.join(projectRoot, 'design-system/formal-picturebook-fullframe-v1-a-batch1');
const frameR1 = 'root_night_slope_v1.png';
const frameR2 = 'root_night_slope_v2-wind-hem.png';
const evidenceDir = path.join(packageRoot, 'evidence');

await mkdir(evidenceDir, { recursive: true });

async function build(folder, width, height, gap, filename) {
  const oldPath = path.join(oldBatchRoot, 'exports', folder, frameR1);
  const newPath = path.join(packageRoot, 'exports', folder, frameR2);
  const boardWidth = width * 2 + gap * 3;
  const boardHeight = height + gap * 2;
  const output = path.join(evidenceDir, filename);
  await sharp({
    create: {
      width: boardWidth,
      height: boardHeight,
      channels: 4,
      background: { r: 6, g: 38, b: 95, alpha: 1 },
    },
  })
    .composite([
      { input: oldPath, left: gap, top: gap },
      { input: newPath, left: width + gap * 2, top: gap },
    ])
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toFile(output);
  return output;
}

const full = await build('390x844', 390, 844, 24, 'root-r1-r2-compare-390.png');
const small = await build('195x422', 195, 422, 12, 'root-r1-r2-compare-195.png');
process.stdout.write(`${full}\n${small}\n`);

