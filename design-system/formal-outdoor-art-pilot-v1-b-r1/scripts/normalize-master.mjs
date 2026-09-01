import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadSharp } from './sharp-loader.mjs';

const sharp = loadSharp();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pilotRoot = path.resolve(scriptDir, '..');
const inputPath = process.argv[2] ?? path.join(
  pilotRoot,
  'source/raw/root_night_slope_v1-imagegen-r1.png',
);
const sourceDir = path.join(pilotRoot, 'source');
const evidenceDir = path.join(pilotRoot, 'evidence/preflight');
const masterPath = path.join(sourceDir, 'root_night_slope_v1-master-2x.png');
const phonePath = path.join(evidenceDir, 'root_night_slope_v1-390x844.png');
const thumbnailPath = path.join(evidenceDir, 'root_night_slope_v1-195x422.png');

await mkdir(sourceDir, { recursive: true });
await mkdir(evidenceDir, { recursive: true });

// This is intentionally normalization-only: centered cover crop, deterministic
// dimensions, sRGB metadata, and no retouching, repainting, or segmentation.
await sharp(inputPath)
  .resize(780, 1688, { fit: 'cover', position: 'centre' })
  .ensureAlpha(1)
  .withIccProfile('srgb')
  .png({ compressionLevel: 9, adaptiveFiltering: false })
  .toFile(masterPath);

await sharp(masterPath)
  .resize(390, 844, { fit: 'fill' })
  .ensureAlpha(1)
  .png({ compressionLevel: 9, adaptiveFiltering: false })
  .toFile(phonePath);

await sharp(masterPath)
  .resize(195, 422, { fit: 'fill' })
  .ensureAlpha(1)
  .png({ compressionLevel: 9, adaptiveFiltering: false })
  .toFile(thumbnailPath);

const [master, phone, thumbnail] = await Promise.all([
  sharp(masterPath).metadata(),
  sharp(phonePath).metadata(),
  sharp(thumbnailPath).metadata(),
]);

process.stdout.write(`${JSON.stringify({
  inputPath,
  master: { path: masterPath, width: master.width, height: master.height, space: master.space },
  phone: { path: phonePath, width: phone.width, height: phone.height },
  thumbnail: { path: thumbnailPath, width: thumbnail.width, height: thumbnail.height },
}, null, 2)}\n`);
