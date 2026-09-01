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

async function sha256(relativeOrAbsolute) {
  const absolute = path.isAbsolute(relativeOrAbsolute)
    ? relativeOrAbsolute
    : path.join(projectRoot, relativeOrAbsolute);
  return createHash('sha256').update(await readFile(absolute)).digest('hex');
}

assert.equal(manifest.candidate_id, 'formal-picturebook-root-wind-hem-v1-a-r3');
assert.equal(manifest.contract_id, 'ROOT-WIND-HEM-V1-A-R3');
assert.equal(manifest.status, 'BLOCKED_SINGLE_EDIT_FAILED');
assert.equal(manifest.source_property, 'ai-assisted-formal-fullframe');
for (const permission of Object.values(manifest.permissions)) assert.equal(permission, false);
assert.equal(manifest.page.not_in_build, true);
assert.equal(manifest.page.direction_edit_count, 1);
assert.equal(manifest.page.additional_generation_count, 0);
assert.equal(await sha256(manifest.approval.record_path), manifest.approval.record_sha256);
assert.equal(await sha256(manifest.input_r2.path), manifest.input_r2.sha256);
assert.equal(await sha256(manifest.page.prompt_path), manifest.page.prompt_sha256);
assert.equal(await sha256(manifest.page.raw_path), manifest.page.raw_sha256);
assert.equal(await sha256(manifest.page.master_path), manifest.page.master_sha256);
assert.equal(await sha256(manifest.page.owner_review_path), manifest.page.owner_review_sha256);
assert.equal(await sha256(manifest.page.independent_review_path), manifest.page.independent_review_sha256);
assert.equal(await sha256(manifest.page.excluded_review_record_path), manifest.page.excluded_review_record_sha256);

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
const frame = 'root_night_slope_v3-wind-hem-right.png';

for (const [folder, [width, height]] of Object.entries(sizes)) {
  const relative = `design-system/formal-picturebook-fullframe-v1-a-root-r3-wind-hem-right/exports/${folder}/${frame}`;
  assert.equal(await sha256(relative), manifest.page.exports[folder]);
  const metadata = await sharp(path.join(projectRoot, relative)).metadata();
  assert.equal(metadata.width, width);
  assert.equal(metadata.height, height);
}

for (const frozen of manifest.unaffected_frozen_pages) {
  const frozenPath = frozen.page_id === 'scene_02_stargaze_shot_005'
    ? 'design-system/formal-picturebook-fullframe-v1-a-batch1/source/masters/scene_02_stargaze_shot_005-master-2x.png'
    : 'design-system/formal-picturebook-fullframe-v1-a-batch1/source/masters/scene_01_home_shot_005-master-2x.png';
  assert.equal(await sha256(frozenPath), frozen.sha256);
}

process.stdout.write('ROOT-WIND-HEM-V1-A-R3 blocked-evidence validation PASS\n');
