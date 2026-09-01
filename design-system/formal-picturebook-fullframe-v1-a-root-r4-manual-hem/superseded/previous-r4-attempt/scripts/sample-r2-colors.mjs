import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSharp } from './sharp-loader.mjs';

const sharp = loadSharp();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, '..');
const projectRoot = path.resolve(packageRoot, '../..');
const input = path.join(projectRoot, 'design-system/formal-picturebook-fullframe-v1-a-root-r2-wind-hem/source/masters/root_night_slope_v2-wind-hem-master-2x.png');
const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });

function pixel(x, y) {
  const offset = (y * info.width + x) * info.channels;
  return Array.from(data.subarray(offset, offset + 3));
}

function average(left, top, width, height) {
  const sum = [0, 0, 0];
  let count = 0;
  for (let y = top; y < top + height; y += 1) {
    for (let x = left; x < left + width; x += 1) {
      const value = pixel(x, y);
      sum[0] += value[0];
      sum[1] += value[1];
      sum[2] += value[2];
      count += 1;
    }
  }
  return sum.map((value) => Math.round(value / count));
}

const samples = {
  garment_mid_box: average(220, 1320, 24, 24),
  garment_shadow_box: average(175, 1360, 24, 24),
  garment_lower_box: average(240, 1370, 24, 18),
  garment_highlight_pixels: [[216, 1362], [236, 1388], [285, 1390]].map(([x, y]) => ({ x, y, rgb: pixel(x, y) })),
  grass_dark_box: average(60, 1350, 28, 28),
  grass_mid_box: average(70, 1400, 28, 28),
  grass_light_pixels: [[63, 1385], [80, 1412], [110, 1428], [145, 1430]].map(([x, y]) => ({ x, y, rgb: pixel(x, y) })),
};

process.stdout.write(`${JSON.stringify(samples, null, 2)}\n`);

