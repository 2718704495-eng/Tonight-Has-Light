import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSharp } from './sharp-loader.mjs';

const sharp = loadSharp();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, '..');
const projectRoot = path.resolve(packageRoot, '../..');
const r2 = path.join(projectRoot, 'design-system/formal-picturebook-fullframe-v1-a-root-r2-wind-hem/source/masters/root_night_slope_v2-wind-hem-master-2x.png');
const r3 = path.join(packageRoot, 'source/masters/root_night_slope_v3-wind-hem-right-master-2x.png');

async function raw(file) {
  return sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
}

const [a, b] = await Promise.all([raw(r2), raw(r3)]);
if (a.info.width !== b.info.width || a.info.height !== b.info.height || a.info.channels !== b.info.channels) {
  throw new Error('R2 and R3 normalized masters must have identical dimensions and channels');
}

const width = a.info.width;
const height = a.info.height;
const channels = a.info.channels;
const regions = {
  full_frame: { left: 0, top: 0, width, height },
  upper_sky_outside_edit: { left: 0, top: 0, width, height: 1120 },
  hem_and_character_context: { left: 80, top: 1160, width: 410, height: 360 },
};

function measure(region) {
  let sum = 0;
  let changed = 0;
  let count = 0;
  for (let y = region.top; y < region.top + region.height; y += 1) {
    for (let x = region.left; x < region.left + region.width; x += 1) {
      const base = (y * width + x) * channels;
      let pixelMax = 0;
      for (let c = 0; c < channels; c += 1) {
        const delta = Math.abs(a.data[base + c] - b.data[base + c]);
        sum += delta;
        pixelMax = Math.max(pixelMax, delta);
        count += 1;
      }
      if (pixelMax >= 8) changed += 1;
    }
  }
  return {
    mean_absolute_channel_delta_0_255: Number((sum / count).toFixed(4)),
    pixels_with_any_channel_delta_gte_8_ratio: Number((changed / (region.width * region.height)).toFixed(6)),
  };
}

const report = {
  note: 'Diagnostic only. No predeclared pass threshold; semantic hem direction remains a human visual decision.',
  r2: path.relative(projectRoot, r2),
  r3: path.relative(projectRoot, r3),
  dimensions: { width, height, channels },
  regions: Object.fromEntries(Object.entries(regions).map(([name, region]) => [name, { ...region, ...measure(region) }])),
};

const output = path.join(packageRoot, 'evidence/r2-r3-drift-metrics.json');
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
process.stdout.write(`${await readFile(output, 'utf8')}`);

