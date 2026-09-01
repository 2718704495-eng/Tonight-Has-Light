import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSharp } from './sharp-loader.mjs';

const sharp = loadSharp();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, '..');
const projectRoot = path.resolve(packageRoot, '../..');
const r2Root = path.join(projectRoot, 'design-system/formal-picturebook-fullframe-v1-a-root-r2-wind-hem');
const evidenceDir = path.join(packageRoot, 'evidence');

await mkdir(evidenceDir, { recursive: true });

async function pair(leftPath, rightPath, width, height, gap, outputName) {
  const output = path.join(evidenceDir, outputName);
  await sharp({
    create: {
      width: width * 2 + gap * 3,
      height: height + gap * 2,
      channels: 4,
      background: { r: 6, g: 38, b: 95, alpha: 1 },
    },
  })
    .composite([
      { input: leftPath, left: gap, top: gap },
      { input: rightPath, left: width + gap * 2, top: gap },
    ])
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toFile(output);
  return output;
}

const r2Master = path.join(r2Root, 'source/masters/root_night_slope_v2-wind-hem-master-2x.png');
const r3Master = path.join(packageRoot, 'source/masters/root_night_slope_v3-wind-hem-right-master-2x.png');
const r2Full = path.join(r2Root, 'exports/390x844/root_night_slope_v2-wind-hem.png');
const r3Full = path.join(packageRoot, 'exports/390x844/root_night_slope_v3-wind-hem-right.png');
const r2Small = path.join(r2Root, 'exports/195x422/root_night_slope_v2-wind-hem.png');
const r3Small = path.join(packageRoot, 'exports/195x422/root_night_slope_v3-wind-hem-right.png');

const full = await pair(r2Full, r3Full, 390, 844, 24, 'root-r2-r3-compare-390.png');
const small = await pair(r2Small, r3Small, 195, 422, 12, 'root-r2-r3-compare-195.png');

const crop = { left: 80, top: 1160, width: 410, height: 360 };
const cropWidth = 615;
const cropHeight = 540;
const r2Crop = await sharp(r2Master).extract(crop).resize(cropWidth, cropHeight).png().toBuffer();
const r3Crop = await sharp(r3Master).extract(crop).resize(cropWidth, cropHeight).png().toBuffer();
const cropBoard = await pair(r2Crop, r3Crop, cropWidth, cropHeight, 24, 'root-r2-r3-hem-crop.png');

process.stdout.write(`${full}\n${small}\n${cropBoard}\n`);

