import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSharp } from './sharp-loader.mjs';

const sharp = loadSharp();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, '..');
const projectRoot = path.resolve(packageRoot, '../..');
const r2Master = path.join(projectRoot, 'design-system/formal-picturebook-fullframe-v1-a-root-r2-wind-hem/source/masters/root_night_slope_v2-wind-hem-master-2x.png');
const frame = 'root_night_slope_v4-manual-hem-right';
const masterPath = path.join(packageRoot, 'source/masters', `${frame}-master-2x.png`);
const patchPngPath = path.join(packageRoot, 'patches/hem-patch.png');
const patchSvgPath = path.join(packageRoot, 'patches/hem-patch.svg');
const roi = { left: 80, top: 1320, width: 300, height: 140 };

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

await mkdir(path.dirname(masterPath), { recursive: true });

// Step 1: clone a nearby strip of the same R2 grass, darkened to the old flap's depth.
const cleanupSource = await sharp(r2Master)
  .extract({ left: 20, top: 1420, width: 150, height: 100 })
  .modulate({ brightness: 0.7, saturation: 0.9 })
  .ensureAlpha(1)
  .png()
  .toBuffer();

const cleanupMaskSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100">
  <path d="M12 45 C35 31 63 24 88 31 C109 35 128 47 140 60 L137 82 C118 95 91 96 65 87 C41 79 23 65 12 51 Z" fill="white"/>
</svg>`);
const cleanupMask = await sharp(cleanupMaskSvg).blur(2.2).png().toBuffer();

const cleanup = await sharp(cleanupSource)
  .composite([{ input: cleanupMask, blend: 'dest-in' }])
  .png()
  .toBuffer();

const linework = await readFile(patchSvgPath);
const transparent = await sharp({
  create: {
    width: roi.width,
    height: roi.height,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([
    { input: cleanup, left: 0, top: 20 },
    { input: linework, left: 0, top: 0 },
  ])
  .png({ compressionLevel: 9, adaptiveFiltering: false })
  .toBuffer();

await sharp(transparent).toFile(patchPngPath);

await sharp(r2Master)
  .composite([{ input: transparent, left: roi.left, top: roi.top }])
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
  const options = target.exact
    ? { fit: 'fill' }
    : { fit: 'contain', position: 'centre', background: { r: 6, g: 38, b: 95, alpha: 1 } };
  await sharp(masterPath)
    .resize(target.width, target.height, options)
    .ensureAlpha(1)
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

const masterMetadata = await sharp(masterPath).metadata();
process.stdout.write(`${JSON.stringify({
  frame,
  input: { path: path.relative(projectRoot, r2Master), sha256: await sha256(r2Master) },
  roi,
  editable_patch: { path: path.relative(projectRoot, patchSvgPath), sha256: await sha256(patchSvgPath) },
  raster_patch: { path: path.relative(projectRoot, patchPngPath), sha256: await sha256(patchPngPath) },
  master: {
    path: path.relative(projectRoot, masterPath),
    width: masterMetadata.width,
    height: masterMetadata.height,
    sha256: await sha256(masterPath),
  },
  outputs,
}, null, 2)}\n`);
