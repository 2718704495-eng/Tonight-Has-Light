import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSharp } from './sharp-loader.mjs';

const sharp = loadSharp();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, '..');
const projectRoot = path.resolve(packageRoot, '../..');
const r2Master = path.join(projectRoot, 'design-system/formal-picturebook-fullframe-v1-a-root-r2-wind-hem/source/masters/root_night_slope_v2-wind-hem-master-2x.png');
const evidenceDir = path.join(packageRoot, 'evidence');

const roi = { left: 40, top: 1120, width: 540, height: 500 };
const scale = 2;

await mkdir(evidenceDir, { recursive: true });

const clean = await sharp(r2Master)
  .extract(roi)
  .resize(roi.width * scale, roi.height * scale, { kernel: 'nearest' })
  .png()
  .toBuffer();

await sharp(clean).toFile(path.join(evidenceDir, 'r2-hem-roi-clean-2x.png'));

const lines = [];
const labels = [];
for (let x = 0; x <= roi.width; x += 20) {
  const px = x * scale;
  const major = x % 100 === 0;
  lines.push(`<line x1="${px}" y1="0" x2="${px}" y2="${roi.height * scale}" stroke="${major ? '#f4c15c' : '#7fa6cc'}" stroke-width="${major ? 2 : 1}" opacity="${major ? 0.75 : 0.32}"/>`);
  if (major) labels.push(`<text x="${px + 4}" y="18" fill="#f4c15c" font-size="16">x${roi.left + x}</text>`);
}
for (let y = 0; y <= roi.height; y += 20) {
  const py = y * scale;
  const major = y % 100 === 0;
  lines.push(`<line x1="0" y1="${py}" x2="${roi.width * scale}" y2="${py}" stroke="${major ? '#f4c15c' : '#7fa6cc'}" stroke-width="${major ? 2 : 1}" opacity="${major ? 0.75 : 0.32}"/>`);
  if (major) labels.push(`<text x="4" y="${py + 18}" fill="#f4c15c" font-size="16">y${roi.top + y}</text>`);
}

const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${roi.width * scale}" height="${roi.height * scale}">${lines.join('')}${labels.join('')}</svg>`);
await sharp(clean)
  .composite([{ input: overlay, left: 0, top: 0 }])
  .png()
  .toFile(path.join(evidenceDir, 'r2-hem-roi-grid-2x.png'));

process.stdout.write(`${JSON.stringify(roi)}\n`);

