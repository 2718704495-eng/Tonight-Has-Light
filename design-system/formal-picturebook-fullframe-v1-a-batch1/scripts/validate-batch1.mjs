import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadSharp } from './sharp-loader.mjs';

const sharp = loadSharp();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const batchRoot = path.resolve(scriptDir, '..');
const projectRoot = path.resolve(batchRoot, '../..');
const allowPending = process.argv.includes('--allow-pending');
const candidateId = 'formal-picturebook-fullframe-v1-a-batch1-r2-r4-root';
const expectedStatus = 'ROOT_AND_STAR_F5_APPROVED_HOME_AWAITING_USER';
const requiredExports = new Map([
  ['195x422', [195, 422]],
  ['390x844', [390, 844]],
  ['360x800', [360, 800]],
  ['430x932', [430, 932]],
  ['430x844-pressure', [430, 844]],
]);
const expectedPages = {
  root_night_slope_v1: {
    assetId: 'ART-OUTDOOR-ROOT-WIND-HEM-003',
    status: 'user-approved',
    master: '41599f03a0a7a71acd953b46066c3205b4da1522d0a06bd86b73186afedccdc8',
    exports: {
      '195x422': '6ceac63b51bf9c6e8311aded28c6adf1fe7e6349e864d5f475976b7c09bb9491',
      '390x844': '23443918a0c892d569a6fd49b55b889d70bb4ed0dc7a6396a0af2bf5fad2306a',
      '360x800': '0b24bd86d062b2ad1c7f905b52156c341dad6c220298c816740a7a9687191636',
      '430x932': '59877dd4db6b10da3ff0547d542893862b7f957a0b566d287fc5898c00e700fb',
      '430x844-pressure': 'b475ab37dc5fdc9eb1741eaab2e5fb3de5638ffeabb590729ef99d755e20fc2f',
    },
  },
  scene_02_stargaze_shot_005: {
    assetId: 'ART-PBOOK-STAR-005',
    status: 'user-approved',
    prompt: '1293b31c68d18bc45364cc51c2dcbeca03be623fd2367e7c4ce1538d6be025f7',
    initialRaw: '48e5c602dd4691a0fe07599c8151b349a33875f5dbf6eea7fcd7c0edec0fac58',
    raw: 'e30ec218506fc95d5c6cbfd13d0d6553e151600fdc4ba769e4c4382db245abc6',
    master: 'd36b99ebfe0805233000df9c0cbf2bc6217691111a7da7fa8e2dbe2eb99e4a85',
    exports: {
      '195x422': 'bdbc05c3fccd5ea265141bcbbc26ac47c2b6f59ffde40efcf87c78c0b9c9ebe5',
      '390x844': 'ad3a13c6a4d915f178d03d444874776e2df042f328f998de81a2bfbf0d774d8d',
      '360x800': 'e1be7fde0407d009d2c98570892c03534929624e4d935e0a41c3f2ef30813aba',
      '430x932': '5fa8fd64267a59221581a62cd06e5aed59b7cc50cd828be6950b9cbb9c82c98b',
      '430x844-pressure': 'f9b27b9095887c71ece9b285c4e96577c36867b4b8bc5896068d6ddc0b9c62b4',
    },
  },
  scene_01_home_shot_005: {
    assetId: 'ART-PBOOK-HOME-005',
    status: 'awaiting-user',
    prompt: 'f67bc3f4d61b113a2f8bc80491c2c873ee5dccd59bab27f0946eeba310da26ac',
    initialRaw: 'dc17a5139dbe200e75a646c9ffbd4c9322a5897aa647bcc614f9395fdb4b0051',
    raw: '96c7be0ca55998952ca35e6e6bc88b83db16b3d9215ab4fdd0ce3c94e639351f',
    master: '1323cf0a103fffd7f8fd731ab0e1164527b9b0401b5d6acd357d1d3b215ecfb9',
    exports: {
      '195x422': '691d50bca77e7ac2121cce956f6e8714777f31109195e916c97798dfb21a367a',
      '390x844': '2b53b8c47d1670228d407736ec0ca6a5ddef7d460f926d9fddbad8981cd77662',
      '360x800': 'e888fa1f0d9e0ead4eda6e7563be0efeaf4765713b3e68c6414db95ef9692d7c',
      '430x932': 'c292712ba07adb51afae13f28507db5e64c01b889369611f3a9f7c74a57ad5e6',
      '430x844-pressure': '5dc9aba2cb11a17334f597cda6cead021ba0784900e09961029a29ab86a979b0',
    },
  },
};

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

async function mustExist(relativePath) {
  const absolute = path.resolve(projectRoot, relativePath);
  await access(absolute);
  return absolute;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertPermissionsFalse(permissions, label) {
  const required = ['cocos', 'build', 'wechat', 'upload', 'review', 'release', 'git'];
  for (const permission of required) assert(permissions?.[permission] === false, `${label} permission ${permission} must remain false.`);
  for (const [permission, value] of Object.entries(permissions ?? {})) assert(value === false, `${label} permission ${permission} must remain false.`);
}

async function assertHash(relativePath, expectedDigest, label) {
  const absolute = await mustExist(relativePath);
  assert(await sha256(absolute) === expectedDigest, `${label} SHA-256 mismatch.`);
  return absolute;
}

async function assertImage(relativePath, expectedDigest, dimensions, label) {
  const absolute = await assertHash(relativePath, expectedDigest, label);
  const metadata = await sharp(absolute).metadata();
  assert(metadata.width === dimensions[0] && metadata.height === dimensions[1], `${label} has wrong dimensions.`);
  return absolute;
}

const manifest = JSON.parse(await readFile(path.join(batchRoot, 'batch-manifest.json'), 'utf8'));
const provenance = JSON.parse(await readFile(path.join(batchRoot, 'provenance.json'), 'utf8'));
assert(manifest.candidate_id === candidateId, 'Manifest candidate ID is not the frozen R4-root review candidate.');
assert(provenance.candidate_id === candidateId, 'Provenance candidate ID is not the frozen R4-root review candidate.');
assert(manifest.status === expectedStatus && provenance.status === expectedStatus, 'Candidate status drift.');
assert(manifest.batch_id === provenance.batch_id, 'Batch ID drift between manifest and provenance.');
assertPermissionsFalse(manifest.permissions, 'Manifest');
assertPermissionsFalse(provenance.permissions, 'Provenance');

await assertHash(manifest.approved_spec.approval_path, manifest.approved_spec.approval_sha256, 'Spec approval record');
await assertHash(manifest.approved_spec.implementation_plan_path, manifest.approved_spec.implementation_plan_sha256, 'Implementation plan');
assert(provenance.approved_spec.approval_record_sha256 === manifest.approved_spec.approval_sha256, 'Spec approval provenance drift.');
assert(provenance.approved_spec.implementation_plan_path === manifest.approved_spec.implementation_plan_path, 'Implementation-plan path drift.');
assert(provenance.approved_spec.implementation_plan_sha256 === manifest.approved_spec.implementation_plan_sha256, 'Implementation-plan hash drift.');

assert(manifest.approved_root.contract_id === 'ROOT-WIND-HEM-V1-A-R4', 'Approved root contract drift.');
assert(manifest.approved_root.asset_id === expectedPages.root_night_slope_v1.assetId, 'Approved root asset drift.');
assert(manifest.approved_root.master_sha256 === expectedPages.root_night_slope_v1.master, 'Approved root master record drift.');
assert(provenance.approved_root.approved_master_sha256 === manifest.approved_root.master_sha256, 'Approved root provenance drift.');
await assertHash(manifest.approved_root.approval_path, manifest.approved_root.approval_sha256, 'R4 approval record');
assert(provenance.approved_root.approval_record_sha256 === manifest.approved_root.approval_sha256, 'R4 approval record provenance drift.');

const r4ManifestPath = await mustExist(manifest.approved_root.candidate_manifest_path);
const r4Manifest = JSON.parse(await readFile(r4ManifestPath, 'utf8'));
assert(r4Manifest.candidate_id === manifest.approved_root.candidate_id, 'R4 candidate identity drift.');
assert(r4Manifest.contract_id === manifest.approved_root.contract_id, 'R4 contract identity drift.');
assert(r4Manifest.status === 'ROOT_PAGE_GATE_B_PASS', 'R4 root is no longer Gate B PASS.');
assert(r4Manifest.page.asset_id === manifest.approved_root.asset_id, 'R4 asset identity drift.');
assert(r4Manifest.page.master_sha256 === manifest.approved_root.master_sha256, 'R4 candidate master drift.');
assert(r4Manifest.page.user_visual_approval.status === 'approved', 'R4 user approval is missing.');
assert(r4Manifest.page.user_visual_approval.export_390x844_sha256 === manifest.approved_root.export_390x844_sha256, 'R4 390 approval drift.');
assert(r4Manifest.page.user_visual_approval.export_195x422_sha256 === manifest.approved_root.export_195x422_sha256, 'R4 195 approval drift.');
for (const value of Object.values(r4Manifest.permissions)) assert(value === false, 'R4 source-package permission must remain false.');

assert(manifest.pages.length === 3, 'Batch 1 must contain exactly three pages.');
assert(new Set(manifest.pages.map((page) => page.page_id)).size === 3, 'Page IDs must be unique.');
const report = { status: 'PASS', candidate_id: candidateId, allowPending, pages: [], cross_checks: [] };

for (const [pageId, contract] of Object.entries(expectedPages)) {
  const page = manifest.pages.find((item) => item.page_id === pageId);
  const provenancePage = provenance.pages.find((item) => item.page_id === pageId);
  assert(page && provenancePage, `Missing manifest/provenance entry for ${pageId}.`);
  assert(page.asset_id === contract.assetId && provenancePage.asset_id === contract.assetId, `${pageId} asset ID drift.`);
  assert(page.status === contract.status && provenancePage.status === contract.status, `${pageId} status drift.`);
  assert(page.not_in_build === true, `${pageId} must remain not_in_build.`);

  const masterRelative = pageId === 'root_night_slope_v1' ? page.canonical_source_path : page.master_path;
  const masterPath = await assertHash(masterRelative, contract.master, `${pageId} master`);
  const metadata = await sharp(masterPath).metadata();
  assert(metadata.width === 780 && metadata.height === 1688, `${pageId} master is not 780x1688.`);
  assert(metadata.depth === 'uchar', `${pageId} master is not 8-bit.`);
  assert(metadata.channels === 3 || metadata.channels === 4, `${pageId} master must be RGB or RGBA.`);
  if (metadata.channels === 4) assert((await sharp(masterPath).stats()).isOpaque === true, `${pageId} master has transparent pixels.`);

  if (pageId === 'root_night_slope_v1') {
    assert(page.current_visual_version === 'ROOT-WIND-HEM-V1-A-R4', 'Root visual version drift.');
    assert(provenancePage.master_sha256 === contract.master, 'Root provenance master drift.');
    const rootReference = provenance.references.find((entry) => entry.asset_id === contract.assetId);
    assert(rootReference?.sha256 === contract.master, 'Current R4 reference missing from provenance.');
  } else {
    assert(page.prompt_sha256 === contract.prompt && provenancePage.prompt_sha256 === contract.prompt, `${pageId} prompt-record drift.`);
    await assertHash(page.prompt_path, contract.prompt, `${pageId} prompt`);
    assert(page.generation.initial_raw_sha256 === contract.initialRaw, `${pageId} initial-raw record drift.`);
    assert(provenancePage.initial_raw_sha256 === contract.initialRaw, `${pageId} initial-raw provenance drift.`);
    await assertHash(page.generation.initial_raw_path, contract.initialRaw, `${pageId} initial raw`);
    assert(page.generation.accepted_raw_sha256 === contract.raw && page.raw_sha256 === contract.raw, `${pageId} accepted-raw record drift.`);
    assert(provenancePage.raw_sha256 === contract.raw, `${pageId} accepted-raw provenance drift.`);
    await assertHash(page.raw_path, contract.raw, `${pageId} accepted raw`);
    assert(page.master_sha256 === contract.master && provenancePage.master_sha256 === contract.master, `${pageId} master provenance drift.`);
    assert(page.generation.targeted_repair_count === 1 && provenancePage.targeted_repair_count === 1, `${pageId} repair count drift.`);
  }

  const exports = {};
  for (const [folder, dimensions] of requiredExports) {
    const relative = page.review_exports?.[folder]?.path ?? `design-system/formal-picturebook-fullframe-v1-a-batch1/exports/${folder}/${pageId}.png`;
    await assertImage(relative, contract.exports[folder], dimensions, `${pageId} ${folder}`);
    if (pageId === 'root_night_slope_v1') {
      assert(page.review_exports[folder].sha256 === contract.exports[folder], `Root ${folder} manifest hash drift.`);
      const source = page.review_exports[folder].approved_source_path;
      await assertHash(source, contract.exports[folder], `Root approved ${folder} source`);
    }
    exports[folder] = { path: relative, sha256: contract.exports[folder] };
  }
  report.pages.push({ page_id: pageId, asset_id: contract.assetId, status: contract.status, master_sha256: contract.master, exports });
}

const oldR1Reference = provenance.references.find((entry) => entry.asset_id === 'ART-OUTDOOR-001');
assert(oldR1Reference, 'Historical ART-OUTDOOR-001 prompt reference is missing.');
await assertHash(oldR1Reference.path, oldR1Reference.sha256, 'Historical R1 prompt reference');

const boardReportPath = await mustExist(manifest.review_artifacts.source_report_path);
const boardReport = JSON.parse(await readFile(boardReportPath, 'utf8'));
assert(boardReport.candidate_id === candidateId, 'Review-board source report candidate drift.');
const boardContracts = {
  full: { path: manifest.review_artifacts.full_board_path, dimensions: [1266, 1022], exportFolder: '390x844' },
  thumbnail: { path: manifest.review_artifacts.thumbnail_board_path, dimensions: [633, 538], exportFolder: '195x422' },
};
for (const [key, contract] of Object.entries(boardContracts)) {
  const board = boardReport.boards[key];
  assert(board.path === contract.path, `${key} review-board path drift.`);
  assert(board.width === contract.dimensions[0] && board.height === contract.dimensions[1], `${key} review-board report dimensions drift.`);
  await assertImage(board.path, board.sha256, contract.dimensions, `${key} review board`);
  assert(board.sources.length === 3, `${key} review board must contain exactly three sources.`);
  for (const source of board.sources) {
    const pageContract = expectedPages[source.page_id];
    assert(pageContract, `${key} review board includes an unknown page.`);
    assert(source.status === pageContract.status, `${key} review-board status drift for ${source.page_id}.`);
    assert(source.sha256 === pageContract.exports[contract.exportFolder], `${key} review-board source hash drift for ${source.page_id}.`);
    await assertHash(source.path, source.sha256, `${key} review-board source ${source.page_id}`);
  }
}

const preflightPath = 'design-system/formal-picturebook-fullframe-v1-a-batch1/evidence/package-memory-preflight.json';
const preflight = JSON.parse(await readFile(await mustExist(preflightPath), 'utf8'));
assert(preflight.candidate_id === candidateId, 'Memory preflight candidate drift.');
assert(preflight.pages.find((page) => page.page_id === 'root_night_slope_v1')?.master_sha256 === expectedPages.root_night_slope_v1.master, 'Memory preflight still references an old root.');

if (!allowPending) assert(manifest.pages.every((page) => page.status !== 'pending-generation'), 'Full validation cannot contain pending pages.');
report.cross_checks.push('approved R4 manifest + approval record', 'spec approval + implementation plan', 'prompt + initial raw + accepted raw + master', '390/195 review-board source hashes', 'all runtime and remote permissions false');
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
