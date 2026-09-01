import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSharp } from './sharp-loader.mjs';

const sharp = loadSharp();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, '..');
const projectRoot = path.resolve(packageRoot, '../..');
const manifest = JSON.parse(await readFile(path.join(packageRoot, 'candidate-manifest.json'), 'utf8'));
const diff = JSON.parse(await readFile(path.join(packageRoot, 'evidence/pixel-diff-report.json'), 'utf8'));

async function sha256(relativeOrAbsolute) {
  const absolute = path.isAbsolute(relativeOrAbsolute)
    ? relativeOrAbsolute
    : path.join(projectRoot, relativeOrAbsolute);
  return createHash('sha256').update(await readFile(absolute)).digest('hex');
}

assert.equal(manifest.candidate_id, 'formal-picturebook-root-wind-hem-v1-a-r4-manual-local-repaint');
assert.equal(manifest.contract_id, 'ROOT-WIND-HEM-V1-A-R4');
assert.equal(manifest.page.not_in_build, true);
for (const permission of Object.values(manifest.permissions)) assert.equal(permission, false);
assert.equal(await sha256(manifest.approval.record_path), manifest.approval.record_sha256);
assert.equal(await sha256(manifest.source_r2.path), manifest.source_r2.sha256);
assert.equal(await sha256(manifest.manual_patch.path), manifest.manual_patch.sha256);
assert.equal(await sha256(manifest.page.master_path), manifest.page.master_sha256);
assert.deepEqual(manifest.manual_patch.edit_roi_master_px, { left: 42, top: 1310, width: 360, height: 170 });
assert.equal(diff.outside_declared_roi_changed_pixels, 0);
assert.equal(diff.pass_outside_roi_unchanged, true);

const master = await sharp(path.join(projectRoot, manifest.page.master_path)).metadata();
assert.equal(master.width, 780);
assert.equal(master.height, 1688);
assert.equal(master.space, 'srgb');
assert.equal(master.depth, 'uchar');

const sizes = {
  '195x422': [195, 422],
  '390x844': [390, 844],
  '360x800': [360, 800],
  '430x932': [430, 932],
  '430x844-pressure': [430, 844],
};
const frame = 'root_night_slope_v4-manual-hem-right.png';

for (const [folder, [width, height]] of Object.entries(sizes)) {
  const relative = `design-system/formal-picturebook-fullframe-v1-a-root-r4-manual-hem-right/exports/${folder}/${frame}`;
  assert.equal(await sha256(relative), manifest.page.exports[folder]);
  const metadata = await sharp(path.join(projectRoot, relative)).metadata();
  assert.equal(metadata.width, width);
  assert.equal(metadata.height, height);
  if (folder !== '195x422' && folder !== '390x844') {
    const { data, info } = await sharp(path.join(projectRoot, relative)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const indices = [0, info.width - 1, (info.height - 1) * info.width, info.height * info.width - 1];
    const hasSafeBorder = indices.some((index) => {
      const offset = index * 4;
      return data[offset] === 6 && data[offset + 1] === 38 && data[offset + 2] === 95;
    });
    assert(hasSafeBorder, `${folder} does not expose approved #06265F SHOW_ALL border`);
  }
}

for (const frozen of manifest.unaffected_frozen_pages) {
  const masterPath = frozen.page_id === 'scene_02_stargaze_shot_005'
    ? 'design-system/formal-picturebook-fullframe-v1-a-batch1/source/masters/scene_02_stargaze_shot_005-master-2x.png'
    : 'design-system/formal-picturebook-fullframe-v1-a-batch1/source/masters/scene_01_home_shot_005-master-2x.png';
  assert.equal(await sha256(masterPath), frozen.sha256);
}

process.stdout.write('ROOT-WIND-HEM-V1-A-R4 validation PASS\n');
