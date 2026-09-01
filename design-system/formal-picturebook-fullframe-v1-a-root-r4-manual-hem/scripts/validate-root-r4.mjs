import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSharp } from './sharp-loader.mjs';

const sharp = loadSharp();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, '..');
const projectRoot = path.resolve(packageRoot, '../..');
const inputPath = path.join(packageRoot, 'source/input/root_night_slope_v2-wind-hem-r2-source-master-2x.png');
const patchPath = path.join(packageRoot, 'source/manual-patch/root_wind_hem_r4_patch.svg');
const repairMaskPath = path.join(packageRoot, 'source/manual-patch/repair_clone_mask.svg');
const roiPath = path.join(packageRoot, 'source/manual-patch/roi.json');
const repairClonePath = path.join(packageRoot, 'source/manual-patch/repair_clone.json');
const rightHemContractPath = path.join(packageRoot, 'source/manual-patch/right_hem_texture.json');
const rightHemPatchPath = path.join(packageRoot, 'source/manual-patch/right_hem_texture_patch.png');
const masterPath = path.join(packageRoot, 'source/masters/root_night_slope_v2-wind-hem-r4-manual-master-2x.png');
const evidenceDir = path.join(packageRoot, 'evidence');

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

async function raw(file) {
  return sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

function contains(region, x, y) {
  return x >= region.left && x < region.left + region.width && y >= region.top && y < region.top + region.height;
}

function unionBox(box, x, y) {
  if (!box) return { left: x, top: y, right: x + 1, bottom: y + 1 };
  box.left = Math.min(box.left, x);
  box.top = Math.min(box.top, y);
  box.right = Math.max(box.right, x + 1);
  box.bottom = Math.max(box.bottom, y + 1);
  return box;
}

function boxWithin(box, region) {
  return !box || (
    box.left >= region.left
    && box.top >= region.top
    && box.right <= region.left + region.width
    && box.bottom <= region.top + region.height
  );
}

await mkdir(evidenceDir, { recursive: true });

const roiContract = JSON.parse(await readFile(roiPath, 'utf8'));
const repairCloneContract = JSON.parse(await readFile(repairClonePath, 'utf8'));
const rightHemContract = JSON.parse(await readFile(rightHemContractPath, 'utf8'));
const roi = roiContract.approved_edit_roi_master_2x;
const repairDestination = repairCloneContract.destination_master_2x;
const rightHemDestination = rightHemContract.destination_master_2x;
const expectedSourceSha = roiContract.source_baseline.sha256;
assert.equal(await sha256(inputPath), expectedSourceSha, 'R4 input must be the frozen R2 master');

const [source, output, patch, repairMask, rightHemPatch] = await Promise.all([
  raw(inputPath),
  raw(masterPath),
  raw(patchPath),
  raw(repairMaskPath),
  raw(rightHemPatchPath),
]);
assert.equal(source.info.width, 780);
assert.equal(source.info.height, 1688);
assert.equal(output.info.width, source.info.width);
assert.equal(output.info.height, source.info.height);
assert.equal(output.info.channels, source.info.channels);

let changedPixels = 0;
let outsideRoiChangedPixels = 0;
let changedBBox = null;
let maxDelta = 0;
let sumDelta = 0;
let changedChannels = 0;
const guardChanges = {};

for (const [guardName, guard] of Object.entries(roiContract.guard_regions_master_2x)) {
  if (Array.isArray(guard)) {
    guard.forEach((item, index) => {
      guardChanges[`${guardName}_${index + 1}`] = { region: item, changed_pixels: 0 };
    });
  } else {
    guardChanges[guardName] = { region: guard, changed_pixels: 0 };
  }
}

for (let y = 0; y < source.info.height; y += 1) {
  for (let x = 0; x < source.info.width; x += 1) {
    const offset = (y * source.info.width + x) * source.info.channels;
    let pixelMax = 0;
    for (let channel = 0; channel < source.info.channels; channel += 1) {
      const delta = Math.abs(source.data[offset + channel] - output.data[offset + channel]);
      if (delta > 0) {
        sumDelta += delta;
        changedChannels += 1;
        maxDelta = Math.max(maxDelta, delta);
        pixelMax = Math.max(pixelMax, delta);
      }
    }
    if (pixelMax > 0) {
      changedPixels += 1;
      changedBBox = unionBox(changedBBox, x, y);
      if (!contains(roi, x, y)) outsideRoiChangedPixels += 1;
      for (const guard of Object.values(guardChanges)) {
        if (contains(guard.region, x, y)) guard.changed_pixels += 1;
      }
    }
  }
}

let patchAlphaPixels = 0;
let patchAlphaBBox = null;
for (let y = 0; y < patch.info.height; y += 1) {
  for (let x = 0; x < patch.info.width; x += 1) {
    const offset = (y * patch.info.width + x) * patch.info.channels;
    if (patch.data[offset + 3] > 0) {
      patchAlphaPixels += 1;
      patchAlphaBBox = unionBox(patchAlphaBBox, x, y);
    }
  }
}

let repairAlphaPixels = 0;
let repairAlphaBBox = null;
for (let y = 0; y < repairMask.info.height; y += 1) {
  for (let x = 0; x < repairMask.info.width; x += 1) {
    const offset = (y * repairMask.info.width + x) * repairMask.info.channels;
    if (repairMask.data[offset + 3] > 0) {
      repairAlphaPixels += 1;
      repairAlphaBBox = unionBox(repairAlphaBBox, x, y);
    }
  }
}
const repairDestBBox = repairAlphaBBox && {
  left: repairAlphaBBox.left + repairDestination.left,
  top: repairAlphaBBox.top + repairDestination.top,
  right: repairAlphaBBox.right + repairDestination.left,
  bottom: repairAlphaBBox.bottom + repairDestination.top,
};

let rightHemAlphaPixels = 0;
let rightHemAlphaBBox = null;
for (let y = 0; y < rightHemPatch.info.height; y += 1) {
  for (let x = 0; x < rightHemPatch.info.width; x += 1) {
    const offset = (y * rightHemPatch.info.width + x) * rightHemPatch.info.channels;
    if (rightHemPatch.data[offset + 3] > 0) {
      rightHemAlphaPixels += 1;
      rightHemAlphaBBox = unionBox(rightHemAlphaBBox, x, y);
    }
  }
}
const rightHemDestBBox = rightHemAlphaBBox && {
  left: rightHemAlphaBBox.left + rightHemDestination.left,
  top: rightHemAlphaBBox.top + rightHemDestination.top,
  right: rightHemAlphaBBox.right + rightHemDestination.left,
  bottom: rightHemAlphaBBox.bottom + rightHemDestination.top,
};

assert.equal(outsideRoiChangedPixels, 0, 'R4 changed pixels outside the approved ROI');
assert(boxWithin(changedBBox, roi), 'R4 changed bounding box is outside the approved ROI');
assert(boxWithin(patchAlphaBBox, roi), 'Manual patch alpha escapes the approved ROI');
assert(boxWithin(repairDestBBox, roi), 'Clone repair alpha escapes the approved ROI');
assert(boxWithin(rightHemDestBBox, roi), 'Right hem texture alpha escapes the approved ROI');
for (const [guardName, guard] of Object.entries(guardChanges)) {
  assert.equal(guard.changed_pixels, 0, `${guardName} changed`);
}

const sizeTargets = {
  '195x422': [195, 422],
  '390x844': [390, 844],
  '360x800': [360, 800],
  '430x932': [430, 932],
  '430x844-pressure': [430, 844],
};

for (const [folder, [width, height]] of Object.entries(sizeTargets)) {
  const outputPath = path.join(packageRoot, 'exports', folder, 'root_night_slope_v2-wind-hem-r4-manual.png');
  const metadata = await sharp(outputPath).metadata();
  assert.equal(metadata.width, width, `${folder} width`);
  assert.equal(metadata.height, height, `${folder} height`);
}

async function buildCompare(folder, width, height, gap, outputName) {
  const r2Path = path.join(projectRoot, 'design-system/formal-picturebook-fullframe-v1-a-root-r2-wind-hem/exports', folder, 'root_night_slope_v2-wind-hem.png');
  const r4Path = path.join(packageRoot, 'exports', folder, 'root_night_slope_v2-wind-hem-r4-manual.png');
  await sharp({
    create: {
      width: width * 2 + gap * 3,
      height: height + gap * 2,
      channels: 4,
      background: { r: 6, g: 38, b: 95, alpha: 1 },
    },
  })
    .composite([
      { input: r2Path, left: gap, top: gap },
      { input: r4Path, left: width + gap * 2, top: gap },
    ])
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toFile(path.join(evidenceDir, outputName));
}

await buildCompare('390x844', 390, 844, 24, 'root-r2-r4-compare-390.png');
await buildCompare('195x422', 195, 422, 12, 'root-r2-r4-compare-195.png');

const hemCrop = { left: 0, top: 1080, width: 480, height: 360 };
const r2Crop = await sharp(inputPath).extract(hemCrop).resize({ width: 960, height: 720, kernel: 'nearest' }).png().toBuffer();
const r4Crop = await sharp(masterPath).extract(hemCrop).resize({ width: 960, height: 720, kernel: 'nearest' }).png().toBuffer();
await sharp({
  create: {
    width: 960 * 2 + 72,
    height: 720 + 48,
    channels: 4,
    background: { r: 6, g: 38, b: 95, alpha: 1 },
  },
})
  .composite([
    { input: r2Crop, left: 24, top: 24 },
    { input: r4Crop, left: 1008, top: 24 },
  ])
  .png({ compressionLevel: 9, adaptiveFiltering: false })
  .toFile(path.join(evidenceDir, 'root-r2-r4-hem-crop.png'));

const report = {
  candidate_id: 'formal-picturebook-root-wind-hem-v1-a-r4-manual',
  contract_id: 'ROOT-WIND-HEM-V1-A-R4',
  source_sha256: await sha256(inputPath),
  patch_sha256: await sha256(patchPath),
  master_sha256: await sha256(masterPath),
  approved_roi_master_2x: roi,
  changed_pixels: changedPixels,
  changed_pixel_ratio: Number((changedPixels / (780 * 1688)).toFixed(8)),
  changed_bbox: changedBBox,
  outside_roi_changed_pixels: outsideRoiChangedPixels,
  max_channel_delta_0_255: maxDelta,
  mean_delta_per_changed_channel: changedChannels === 0 ? 0 : Number((sumDelta / changedChannels).toFixed(4)),
  patch_alpha_pixels: patchAlphaPixels,
  patch_alpha_bbox: patchAlphaBBox,
  repair_clone_mask_sha256: await sha256(repairMaskPath),
  repair_alpha_pixels: repairAlphaPixels,
  repair_dest_bbox: repairDestBBox,
  right_hem_contract_sha256: await sha256(rightHemContractPath),
  right_hem_source_mask_sha256: await sha256(path.join(packageRoot, rightHemContract.source_mask_path)),
  right_hem_transparent_patch_sha256: await sha256(rightHemPatchPath),
  right_hem_alpha_pixels: rightHemAlphaPixels,
  right_hem_dest_bbox: rightHemDestBBox,
  guard_changes: guardChanges,
  generated_evidence: [
    'evidence/root-r2-r4-compare-390.png',
    'evidence/root-r2-r4-compare-195.png',
    'evidence/root-r2-r4-hem-crop.png'
  ]
};

await writeFile(path.join(evidenceDir, 'r4-diff-metrics.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

const manifest = JSON.parse(await readFile(path.join(packageRoot, 'candidate-manifest.json'), 'utf8'));
const provenance = JSON.parse(await readFile(path.join(packageRoot, 'provenance.json'), 'utf8'));
assert.equal(manifest.candidate_id, report.candidate_id);
assert.equal(manifest.contract_id, report.contract_id);
assert.equal(manifest.status, 'ROOT_PAGE_GATE_B_PASS');
assert.equal(manifest.page.user_visual_approval.status, 'approved');
assert.equal(manifest.page.user_visual_approval.master_sha256, report.master_sha256);
assert.equal(manifest.page.user_visual_approval.export_390x844_sha256, manifest.page.exports['390x844']);
assert.equal(manifest.page.user_visual_approval.export_195x422_sha256, manifest.page.exports['195x422']);
assert.equal(manifest.gate_decision.root_page_gate_b, 'PASS');
assert.equal(manifest.gate_decision.complete_picturebook_gate_b, 'BLOCKED');
assert.equal(manifest.gate_decision.runtime_handoff, 'NOT_AUTHORIZED');
assert.equal(
  manifest.approval.record_sha256,
  await sha256(path.join(projectRoot, manifest.approval.record_path)),
);
assert.equal(
  manifest.approval.pre_visual_approval_hashes_sha256,
  await sha256(path.join(projectRoot, manifest.approval.pre_visual_approval_hashes_path)),
);
assert.equal(manifest.source.sha256, report.source_sha256);
assert.equal(manifest.page.contour_patch_sha256, report.patch_sha256);
assert.equal(manifest.page.right_hem_contract_sha256, report.right_hem_contract_sha256);
assert.equal(manifest.page.right_hem_mask_sha256, report.right_hem_source_mask_sha256);
assert.equal(manifest.page.right_hem_transparent_patch_sha256, report.right_hem_transparent_patch_sha256);
assert.equal(manifest.page.repair_mask_sha256, report.repair_clone_mask_sha256);
assert.equal(manifest.page.master_sha256, report.master_sha256);
assert.equal(manifest.page.diff_metrics_sha256, await sha256(path.join(evidenceDir, 'r4-diff-metrics.json')));
assert.equal(
  manifest.independent_visual_review.sha256,
  await sha256(path.join(packageRoot, 'evidence/independent-visual-review.md')),
);
for (const [permission, allowed] of Object.entries(manifest.permissions)) {
  assert.equal(allowed, false, `manifest permission ${permission} must remain false`);
}
for (const [folder] of Object.entries(sizeTargets)) {
  const outputPath = path.join(packageRoot, 'exports', folder, 'root_night_slope_v2-wind-hem-r4-manual.png');
  assert.equal(manifest.page.exports[folder], await sha256(outputPath), `${folder} manifest hash`);
}
assert.equal(provenance.imagegen_used, false);
assert.equal(provenance.whole_frame_regeneration_used, false);
assert.equal(provenance.source_baseline.sha256, report.source_sha256);
assert.deepEqual(provenance.approved_roi_master_2x, {
  left: roi.left,
  top: roi.top,
  width: roi.width,
  height: roi.height,
});

process.stdout.write('ROOT-WIND-HEM-V1-A-R4 validation PASS\n');
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
