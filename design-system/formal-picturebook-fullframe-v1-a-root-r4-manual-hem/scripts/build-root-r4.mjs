import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSharp } from './sharp-loader.mjs';

const sharp = loadSharp();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, '..');
const projectRoot = path.resolve(packageRoot, '../..');
const frame = 'root_night_slope_v2-wind-hem-r4-manual';
const inputPath = path.join(packageRoot, 'source/input/root_night_slope_v2-wind-hem-r2-source-master-2x.png');
const patchPath = path.join(packageRoot, 'source/manual-patch/root_wind_hem_r4_patch.svg');
const repairMaskPath = path.join(packageRoot, 'source/manual-patch/repair_clone_mask.svg');
const rightHemMaskPath = path.join(packageRoot, 'source/manual-patch/right_hem_source_mask.svg');
const rightHemPatchPath = path.join(packageRoot, 'source/manual-patch/right_hem_texture_patch.png');
const rightHemContractPath = path.join(packageRoot, 'source/manual-patch/right_hem_texture.json');
const masterPath = path.join(packageRoot, 'source/masters/root_night_slope_v2-wind-hem-r4-manual-master-2x.png');
const buildReportPath = path.join(packageRoot, 'evidence/build-report.json');

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

await mkdir(path.dirname(masterPath), { recursive: true });
const rightHemContract = JSON.parse(await readFile(rightHemContractPath, 'utf8'));
const rightHemSourceRect = rightHemContract.source_rect_master_2x;
const rightHemTransform = rightHemContract.transform;
const rightHemDestination = rightHemContract.destination_master_2x;
const repairClone = await sharp(inputPath)
  .extract({ left: 0, top: 1420, width: 105, height: 82 })
  .modulate({ brightness: 0.95, saturation: 0.96 })
  .ensureAlpha(1)
  .composite([{ input: await sharp(repairMaskPath).blur(2.6).png().toBuffer(), blend: 'dest-in' }])
  .png({ compressionLevel: 9, adaptiveFiltering: false })
  .toBuffer();

const sourceHem = await sharp(inputPath)
  .extract(rightHemSourceRect)
  .ensureAlpha(1)
  .composite([{ input: await sharp(rightHemMaskPath).blur(rightHemTransform.mask_blur_sigma).png().toBuffer(), blend: 'dest-in' }])
  .png({ compressionLevel: 9, adaptiveFiltering: false })
  .toBuffer();

const rightHem = await sharp(sourceHem)
  .flop()
  .resize({ width: rightHemTransform.width, height: rightHemTransform.height, fit: 'fill' })
  .rotate(rightHemTransform.rotate_degrees, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .modulate({ brightness: rightHemTransform.brightness, saturation: rightHemTransform.saturation })
  .png({ compressionLevel: 9, adaptiveFiltering: false })
  .toBuffer();
await sharp(rightHem).toFile(rightHemPatchPath);

await sharp(inputPath)
  .ensureAlpha(1)
  .composite([
    { input: repairClone, left: 58, top: 1334 },
    { input: rightHem, left: rightHemDestination.left, top: rightHemDestination.top },
    { input: patchPath, left: 0, top: 0 },
  ])
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
const report = {
  candidate_id: 'formal-picturebook-root-wind-hem-v1-a-r4-manual',
  contract_id: 'ROOT-WIND-HEM-V1-A-R4',
  build_id: 'root-r4-manual-hem-local-svg-patch-20260830',
  input: {
    path: path.relative(projectRoot, inputPath),
    sha256: await sha256(inputPath),
  },
  patch: {
    path: path.relative(projectRoot, patchPath),
    sha256: await sha256(patchPath),
  },
  right_hem_texture: {
    contract_path: path.relative(projectRoot, rightHemContractPath),
    contract_sha256: await sha256(rightHemContractPath),
    source_rect_master_2x: rightHemSourceRect,
    source_mask_path: path.relative(projectRoot, rightHemMaskPath),
    source_mask_sha256: await sha256(rightHemMaskPath),
    transparent_patch_path: path.relative(projectRoot, rightHemPatchPath),
    transparent_patch_sha256: await sha256(rightHemPatchPath),
    transform: rightHemTransform,
    destination_master_2x: rightHemDestination,
  },
  repair_clone: {
    source_rect_master_2x: { left: 0, top: 1420, width: 105, height: 82 },
    destination_master_2x: { left: 58, top: 1334 },
    mask_path: path.relative(projectRoot, repairMaskPath),
    mask_sha256: await sha256(repairMaskPath),
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
};

await writeFile(buildReportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
