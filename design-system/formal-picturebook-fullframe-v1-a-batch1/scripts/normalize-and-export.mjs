import { createHash } from 'node:crypto';
import { access, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadSharp } from './sharp-loader.mjs';

const sharp = loadSharp();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const batchRoot = path.resolve(scriptDir, '..');
const projectRoot = path.resolve(batchRoot, '../..');
const allowedFrames = new Set([
  'root_night_slope_v1',
  'scene_02_stargaze_shot_005',
  'scene_01_home_shot_005',
]);

function parseArgs(argv) {
  const result = { referenceOnly: false };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--reference-only') result.referenceOnly = true;
    else if (token === '--frame') result.frame = argv[++index];
    else if (token === '--input') result.input = argv[++index];
    else throw new Error(`Unknown argument: ${token}`);
  }
  if (!result.frame || !result.input) {
    throw new Error('Usage: normalize-and-export.mjs --frame <id> --input <path> [--reference-only]');
  }
  if (!allowedFrames.has(result.frame)) throw new Error(`Frame is outside Batch 1: ${result.frame}`);
  return result;
}

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

const args = parseArgs(process.argv.slice(2));
const inputPath = path.resolve(projectRoot, args.input);
await access(inputPath);
if (args.frame === 'root_night_slope_v1') {
  throw new Error('The root page is frozen at approved ROOT-WIND-HEM-V1-A-R4. Use sync-approved-root-r4.mjs to copy its approved exports byte-for-byte.');
}

let masterPath;
if (args.referenceOnly) {
  masterPath = inputPath;
  const metadata = await sharp(masterPath).metadata();
  if (metadata.width !== 780 || metadata.height !== 1688) {
    throw new Error(`Reference-only master must be 780x1688; received ${metadata.width}x${metadata.height}`);
  }
} else {
  masterPath = path.join(batchRoot, 'source/masters', `${args.frame}-master-2x.png`);
  await mkdir(path.dirname(masterPath), { recursive: true });
  await sharp(inputPath)
    .resize(780, 1688, { fit: 'cover', position: 'centre' })
    .ensureAlpha(1)
    .withIccProfile('srgb')
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toFile(masterPath);
}

const targets = [
  { key: '390x844', width: 390, height: 844, exact: true },
  { key: '195x422', width: 195, height: 422, exact: true },
  { key: '360x800', width: 360, height: 800, exact: false },
  { key: '430x932', width: 430, height: 932, exact: false },
  { key: '430x844-pressure', width: 430, height: 844, exact: false },
];
const outputs = {};

for (const target of targets) {
  const outputPath = path.join(batchRoot, 'exports', target.key, `${args.frame}.png`);
  await mkdir(path.dirname(outputPath), { recursive: true });
  const pipeline = sharp(masterPath).resize(target.width, target.height, target.exact
    ? { fit: 'fill' }
    : {
        fit: 'contain',
        position: 'centre',
        background: { r: 6, g: 38, b: 95, alpha: 1 },
      });
  await pipeline
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

const masterMetadata = await sharp(masterPath).metadata();
process.stdout.write(`${JSON.stringify({
  frame: args.frame,
  referenceOnly: args.referenceOnly,
  input: {
    path: path.relative(projectRoot, inputPath),
    sha256: await sha256(inputPath),
  },
  master: {
    path: path.relative(projectRoot, masterPath),
    width: masterMetadata.width,
    height: masterMetadata.height,
    space: masterMetadata.space,
    channels: masterMetadata.channels,
    depth: masterMetadata.depth,
    sha256: await sha256(masterPath),
  },
  outputs,
}, null, 2)}\n`);
