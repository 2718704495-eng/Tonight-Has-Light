import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadSharp } from './sharp-loader.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(SCRIPT_DIR, '..');
const PROJECT_ROOT = resolve(PACKAGE_ROOT, '../..');
const output = resolve(PACKAGE_ROOT, 'evidence', 'root-f1-f5-comparison-195.png');
const items = [
  {
    label: '根页 R4',
    path: resolve(PROJECT_ROOT, 'design-system/formal-picturebook-fullframe-v1-a-root-r4-manual-hem/exports/195x422/root_night_slope_v2-wind-hem-r4-manual.png'),
  },
  {
    label: 'F1 抬头',
    path: resolve(PACKAGE_ROOT, 'pages/scene_02_stargaze_shot_001/exports/195x422/scene_02_stargaze_shot_001.png'),
  },
  {
    label: 'F5 世界很大',
    path: resolve(PROJECT_ROOT, 'design-system/formal-picturebook-fullframe-v1-a-batch1/exports/195x422/scene_02_stargaze_shot_005.png'),
  },
];

const sharp = await loadSharp();
const width = 625;
const height = 458;
const composites = items.map((item, index) => ({ input: item.path, left: 10 + index * 205, top: 28 }));
const labelSvg = `<svg width="${width}" height="28" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#061a3c"/>${items.map((item, index) => `<text x="${10 + index * 205}" y="20" fill="#eee8dc" font-size="15" font-family="PingFang SC, sans-serif">${item.label}</text>`).join('')}</svg>`;
await mkdir(dirname(output), { recursive: true });
await sharp({ create: { width, height, channels: 3, background: '#061a3c' } })
  .composite([{ input: Buffer.from(labelSvg), left: 0, top: 0 }, ...composites])
  .png({ compressionLevel: 9 })
  .toFile(output);
process.stdout.write(`${output}\n`);
