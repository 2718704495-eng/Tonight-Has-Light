import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(SCRIPT_DIR, '..');
const PROJECT_ROOT = resolve(PACKAGE_ROOT, '../..');
const SHOT_ID = 'scene_02_stargaze_shot_004';

const APPROVED_ANCHORS = Object.freeze({
  'F1 390': {
    path: 'design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_001/exports/390x844/scene_02_stargaze_shot_001.png',
    sha256: '6b2450a1993742545b83958d4f17913fda63a512071f42fa0a148feb4856c26e',
  },
  'F2 390': {
    path: 'design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_002/exports/390x844/scene_02_stargaze_shot_002.png',
    sha256: '98e267506a5485a93fdefa9759611c0ac4de2120edd5dc61d253a9ff59deee52',
  },
  'F3 390': {
    path: 'design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_003/exports/390x844/scene_02_stargaze_shot_003.png',
    sha256: 'ae9cc70c56be5b8f83e985058d7ab40bc71a0aa0f5f32819bb2706f0111244ec',
  },
  'F4 390': {
    path: 'design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_004/exports/390x844/scene_02_stargaze_shot_004.png',
    sha256: '0973fec9fc18cfdb7422dcef32941a1fb071f84c95154cb10fd1d5279bda1ae9',
  },
  'F5 390': {
    path: 'design-system/formal-picturebook-fullframe-v1-a-batch1/exports/390x844/scene_02_stargaze_shot_005.png',
    sha256: 'ad3a13c6a4d915f178d03d444874776e2df042f328f998de81a2bfbf0d774d8d',
  },
});

const sha256File = async (path) => createHash('sha256').update(await readFile(path)).digest('hex');

async function assertApprovedAnchorsUnchanged() {
  for (const [label, anchor] of Object.entries(APPROVED_ANCHORS)) {
    const actual = await sha256File(resolve(PROJECT_ROOT, anchor.path));
    if (actual !== anchor.sha256) {
      throw new Error(`${label} drifted: expected ${anchor.sha256}, got ${actual}`);
    }
  }
}

await assertApprovedAnchorsUnchanged();

const exportResult = spawnSync(process.execPath, [resolve(SCRIPT_DIR, 'export-page.mjs'), SHOT_ID], {
  cwd: PACKAGE_ROOT,
  encoding: 'utf8',
});
if (exportResult.status !== 0) {
  throw new Error(`F4 export failed (${exportResult.status}):\n${exportResult.stdout}${exportResult.stderr}`);
}

const manifestPath = resolve(PACKAGE_ROOT, 'pages', SHOT_ID, 'candidate-manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (manifest.candidate_id !== 'stargaze-formal-batch-v1-a-f4-r1') {
  throw new Error(`wrong F4 candidate id: ${manifest.candidate_id}`);
}
if (manifest.asset_id !== 'ART-PBOOK-STAR-004') {
  throw new Error(`wrong F4 asset id: ${manifest.asset_id}`);
}
if (manifest.generation.targeted_repair_count !== 0) {
  throw new Error(`new F4 R1 must have zero targeted repairs, got ${manifest.generation.targeted_repair_count}`);
}
if (manifest.runtime_authorized !== false) {
  throw new Error('F4 export must remain outside runtime authorization');
}
if (manifest.status !== 'user-visual-pass-frozen / not-in-build') {
  throw new Error(`F4 re-export erased review lifecycle status: ${manifest.status}`);
}
if (manifest.owner_review?.decision !== 'ROOT_OWNER_PASS_FOR_USER_SAME_FILE_VISUAL_REVIEW') {
  throw new Error('F4 re-export erased the root-owner review record');
}
if (manifest.independent_review?.decision !== 'PASS_FOR_USER_SAME_FILE_VISUAL_REVIEW') {
  throw new Error('F4 re-export erased the independent visual review record');
}
const approval = manifest.approval?.user_visual_approval;
if (
  approval?.phrase !== '批准 STARGAZE-F4-FORMAL-V1-A-R1：F4 单帧视觉通过'
  || approval?.approved_390x844_sha256 !== '0973fec9fc18cfdb7422dcef32941a1fb071f84c95154cb10fd1d5279bda1ae9'
  || approval?.approved_master_sha256 !== '7a1d0cac3e0b6a27dd7629213fbf58547b9f3f378348308f87f1bda8fa642fd0'
  || approval?.pre_approval_hash_manifest_sha256 !== 'abc92a43429d03d58be0e9c22ef09c0f68d955c30681cef7fc3ce1b89ad5b111'
) {
  throw new Error('F4 re-export erased or changed the exact-file user approval');
}

const validationResult = spawnSync(process.execPath, [resolve(SCRIPT_DIR, 'validate-page.mjs'), SHOT_ID], {
  cwd: PACKAGE_ROOT,
  encoding: 'utf8',
});
if (validationResult.status !== 0) {
  throw new Error(`F4 mechanical validation failed (${validationResult.status}):\n${validationResult.stdout}${validationResult.stderr}`);
}
const validation = JSON.parse(validationResult.stdout);
if (validation.status !== 'MECHANICAL PASS / USER VISUAL PASS FROZEN') {
  throw new Error(`F4 validation ignored the frozen user approval: ${validation.status}`);
}

for (const [name, dimensions] of Object.entries({
  '195x422': [195, 422],
  '360x800': [360, 800],
  '390x844': [390, 844],
  '430x932': [430, 932],
  '430x844-pressure': [430, 844],
})) {
  const record = manifest.exports[name];
  if (!record || record.dimensions.width !== dimensions[0] || record.dimensions.height !== dimensions[1]) {
    throw new Error(`missing or wrong F4 ${name} export record`);
  }
  await access(resolve(PROJECT_ROOT, record.path));
  const actual = await sha256File(resolve(PROJECT_ROOT, record.path));
  if (actual !== record.sha256) throw new Error(`F4 ${name} export hash mismatch`);
}

await assertApprovedAnchorsUnchanged();
process.stdout.write('PASS: F4 re-export preserves approved F1/F2/F3/F4/F5 pixels and exact-file approval\n');
