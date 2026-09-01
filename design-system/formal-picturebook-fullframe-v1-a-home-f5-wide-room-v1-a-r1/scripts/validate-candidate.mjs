import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSharp } from '../../formal-picturebook-fullframe-v1-a-batch1/scripts/sharp-loader.mjs';

const sharp = loadSharp();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const candidateRoot = path.resolve(scriptDir, '..');
const projectRoot = path.resolve(candidateRoot, '../..');
const manifest = JSON.parse(await readFile(path.join(candidateRoot, 'candidate-manifest.json'), 'utf8'));
const provenance = JSON.parse(await readFile(path.join(candidateRoot, 'provenance.json'), 'utf8'));
const report = JSON.parse(await readFile(path.join(candidateRoot, 'evidence/build-report.json'), 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function sha256(relativePath) {
  return createHash('sha256').update(await readFile(path.resolve(projectRoot, relativePath))).digest('hex');
}

async function assertFile(relativePath, expectedHash, expectedSize) {
  assert(await sha256(relativePath) === expectedHash, `Hash mismatch: ${relativePath}`);
  if (expectedSize) {
    const info = await sharp(path.resolve(projectRoot, relativePath)).metadata();
    assert(info.width === expectedSize[0] && info.height === expectedSize[1], `Size mismatch: ${relativePath}`);
    assert(info.depth === 'uchar', `Expected 8-bit image: ${relativePath}`);
    if (info.channels === 4) assert((await sharp(path.resolve(projectRoot, relativePath)).stats()).isOpaque === true, `Transparent pixel found: ${relativePath}`);
  }
}

assert(manifest.contract_id === 'HOME-F5-WIDE-ROOM-V1-A', 'Contract drift.');
assert(manifest.candidate_id === 'formal-picturebook-home-f5-wide-room-v1-a-r1', 'Candidate identity drift.');
assert(manifest.status === 'HOME_F5_GATE_B_VISUAL_PASS', 'Candidate must remain the approved Home F5 visual baseline.');
assert(manifest.current_visual_baseline === true && manifest.batch1_replacement_eligible === true, 'Approved visual-baseline flags drift.');
assert(provenance.candidate_id === manifest.candidate_id && provenance.status === manifest.status, 'Manifest/provenance drift.');
for (const permissions of [manifest.permissions, provenance.permissions]) {
  for (const [key, value] of Object.entries(permissions)) {
    if (key === 'batch1_replace') assert(value === true, 'Approved Home F5 must remain eligible for Batch 1 design-package replacement.');
    else assert(value === false, `Permission ${key} must remain false.`);
  }
}

await assertFile(manifest.approval.path, manifest.approval.sha256);
await assertFile(manifest.user_visual_approval.record_path, manifest.user_visual_approval.record_sha256);
await assertFile(manifest.user_visual_approval.preapproval_hash_manifest_path, manifest.user_visual_approval.preapproval_hash_manifest_sha256);
assert(manifest.user_visual_approval.approved_390x844_sha256 === manifest.review_exports['390x844'].sha256, 'Approved 390 export drift.');
assert(manifest.user_visual_approval.approved_195x422_sha256 === manifest.review_exports['195x422'].sha256, 'Approved 195 export drift.');
await assertFile(manifest.prompt.path, manifest.prompt.sha256);
await assertFile(manifest.generation.raw_path, manifest.generation.raw_sha256, [853, 1844]);
await assertFile(manifest.normalization.master_path, manifest.normalization.master_sha256, [780, 1688]);
assert(JSON.stringify(manifest.normalization.crop) === JSON.stringify({ left: 48, top: 0, width: 748, height: 1618 }), 'Locked crop drift.');
assert(manifest.generation.generation_count === 1, 'Exactly one full-frame generation is permitted.');
const rawPngs = (await readdir(path.join(candidateRoot, 'source/raw'))).filter((name) => name.endsWith('.png'));
assert(rawPngs.length === 1, 'Candidate raw directory must contain exactly one generated PNG.');

const exportSizes = {
  '390x844': [390, 844],
  '195x422': [195, 422],
  '360x800': [360, 800],
  '430x932': [430, 932],
  '430x844-pressure': [430, 844]
};
for (const [key, dimensions] of Object.entries(exportSizes)) {
  const item = manifest.review_exports[key];
  await assertFile(item.path, item.sha256, dimensions);
  assert(report.exports[key].sha256 === item.sha256, `Build report export drift: ${key}`);
}

const frozen = {
  'design-system/formal-picturebook-fullframe-v1-a-root-r4-manual-hem/source/masters/root_night_slope_v2-wind-hem-r4-manual-master-2x.png': manifest.frozen_unchanged.root_r4_master_sha256,
  'design-system/formal-picturebook-fullframe-v1-a-batch1/source/masters/scene_02_stargaze_shot_005-master-2x.png': manifest.frozen_unchanged.stargaze_f5_master_sha256,
  'design-system/formal-picturebook-fullframe-v1-a-batch1/source/masters/scene_01_home_shot_005-master-2x.png': manifest.frozen_unchanged.old_home_f5_master_sha256
};
for (const [relativePath, hash] of Object.entries(frozen)) await assertFile(relativePath, hash);

const boardSizes = { '390x844': [840, 944], '195x422': [450, 506] };
for (const [key, dimensions] of Object.entries(boardSizes)) {
  const board = report.boards[key];
  await assertFile(board.path, board.sha256, dimensions);
  assert(board.sources.candidate.sha256 === manifest.review_exports[key].sha256, `Board candidate source drift: ${key}`);
}

process.stdout.write(`${JSON.stringify({
  status: 'PASS',
  candidate_id: manifest.candidate_id,
  gate_status: manifest.status,
  checks: [
    'approval and prompt hashes',
    'single generated raw',
    'locked deterministic crop',
    'master and five export dimensions/hashes/opacity',
    'old/new review-board source hashes',
    'frozen Root R4, Stargaze F5, and historical Home F5 hashes',
    'local Batch 1 replacement eligible; all implementation and remote permissions false'
  ]
}, null, 2)}\n`);
