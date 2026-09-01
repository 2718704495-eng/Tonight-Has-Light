import { createHash } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSharp } from './sharp-loader.mjs';

const sharp = loadSharp();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, '..');
const projectRoot = path.resolve(packageRoot, '../..');
const frame = 'root_night_slope_v2-wind-hem';
const inputPath = path.join(packageRoot, 'source/raw', `${frame}-imagegen-r2.png`);
const masterPath = path.join(packageRoot, 'source/masters', `${frame}-master-2x.png`);

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

await mkdir(path.dirname(masterPath), { recursive: true });
await sharp(inputPath)
  .resize(780, 1688, { fit: 'cover', position: 'centre' })
  .ensureAlpha(1)
  .withIccProfile('srgb')
  .png({ compressionLevel: 9, adaptiveFiltering: false })
  .toFile(masterPath);

const targets = [
  { key: '390x844', width: 390, height: 844, exact: true },
  { key: '195x422', width: 195, height: 422, exact: true },
  { key: '360x800', width: 360, height: 800, exact: false },
  { key: '430x932', width: 430, height: 932, exact: false },
  { key: '430x844-pressure', width: 430, height: 844, exact: false },
];
const outputs = {};

for (const target of targets) {
  const outputPath = path.join(packageRoot, 'exports', target.key, `${frame}.png`);
  await mkdir(path.dirname(outputPath), { recursive: true });
  const resizeOptions = target.exact
    ? { fit: 'fill' }
    : {
        fit: 'contain',
        position: 'centre',
        background: { r: 6, g: 38, b: 95, alpha: 1 },
      };
  await sharp(masterPath)
    .resize(target.width, target.height, resizeOptions)
    .ensureAlpha(1)
    .withIccProfile('srgb')
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toFile(outputPath);
  const metadata = await sharp(outputPath).metadata();
  outputs[target.key] = {
    path: path.relative(projectRoot, outputPath),
    width: metadata.width,
    height: metadata.height,
    sha256: await sha256(outputPath),
  };
}

const metadata = await sharp(masterPath).metadata();
process.stdout.write(`${JSON.stringify({
  frame,
  input: {
    path: path.relative(projectRoot, inputPath),
    sha256: await sha256(inputPath),
  },
  master: {
    path: path.relative(projectRoot, masterPath),
    width: metadata.width,
    height: metadata.height,
    space: metadata.space,
    channels: metadata.channels,
    depth: metadata.depth,
    sha256: await sha256(masterPath),
  },
  outputs,
}, null, 2)}\n`);

