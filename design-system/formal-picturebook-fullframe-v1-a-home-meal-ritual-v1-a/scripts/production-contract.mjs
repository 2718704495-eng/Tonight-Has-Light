import { isAbsolute, normalize, resolve } from 'node:path';

import { PROJECT_ROOT } from './package-utils.mjs';

export const PAGE_IDS = Object.freeze([
  'scene_01_home_shot_001',
  'scene_01_home_shot_002',
  'scene_01_home_shot_003',
  'scene_01_home_shot_004',
  'scene_01_home_shot_005',
]);

export const ASSET_IDS = Object.freeze({
  scene_01_home_shot_001: 'ART-PBOOK-HOME-001',
  scene_01_home_shot_002: 'ART-PBOOK-HOME-002',
  scene_01_home_shot_003: 'ART-PBOOK-HOME-003',
  scene_01_home_shot_004: 'ART-PBOOK-HOME-004',
  scene_01_home_shot_005: 'ART-PBOOK-HOME-005',
});

export const H5_SHA256_390 = '569a7b9b71d16d13ad311bdea9a29d6bc93a7dc68c99892faf8c416f38bc1c51';
export const H5_EXPORT_HASHES = Object.freeze({
  '195x422': '674994ba660f8f2ed8a7f605c976e6eb0199ede70ced81e91e092862078ed57e',
  '360x800': '7ac476cf1953dcecebaa84657714c3c63b0d010573bfe36b3f6c5e214d56da62',
  '390x844': H5_SHA256_390,
  '430x932': '99dda84bbac1aa9d688852d2acd40b55b2a4eb12dd059a09604b3264e2d6263a',
  '430x844-pressure': '84b1c9cbfbb8ccb4462a98dbaaedb27b670f8684f793fcf6543d02d6ce607047',
});
export const EXPECTED_SOURCE_HASHES = Object.freeze({
  spec: Object.freeze({
    path: 'docs/superpowers/specs/2026-08-30-home-meal-ritual-v1-a-design.md',
    sha256: '606a48ff905fe49e0114e1f80c0d05f519f26c7cc70aadee3441585822064ed1',
  }),
  approvalRecord: Object.freeze({
    path: 'docs/HOME-MEAL-RITUAL-V1-A-APPROVAL.md',
    sha256: 'a513b6a7bc6b7589c53f6695b9504e93a0b102951af6fb51176cadff45d1079b',
  }),
  executionPlan: Object.freeze({
    path: 'docs/superpowers/plans/2026-08-30-home-meal-ritual-gate-b.md',
    sha256: '98d265d554121f2ee0119752e85dc52cfab8f5e42a87605f20f43092dfbb646a',
  }),
});
export const REQUIRED_EXPORTS = Object.freeze(['195x422', '360x800', '390x844', '430x932', '430x844-pressure']);
export const EXPORT_DIMENSIONS = Object.freeze({
  '195x422': Object.freeze({ width: 195, height: 422 }),
  '360x800': Object.freeze({ width: 360, height: 800 }),
  '390x844': Object.freeze({ width: 390, height: 844 }),
  '430x932': Object.freeze({ width: 430, height: 932 }),
  '430x844-pressure': Object.freeze({ width: 430, height: 844 }),
});
export const SAFE_BORDER = '#06265F';
export const MAX_GENERATIONS_PER_PAGE = 2;
export const MASTER_DIMENSIONS = Object.freeze({ width: 780, height: 1688 });
export const REVIEW_EXPORT_OPTIONS = Object.freeze({
  '195x422': Object.freeze({ fit: 'contain' }),
  '360x800': Object.freeze({ fit: 'contain', background: SAFE_BORDER }),
  '390x844': Object.freeze({ fit: 'contain' }),
  '430x932': Object.freeze({ fit: 'contain', background: SAFE_BORDER }),
  '430x844-pressure': Object.freeze({ fit: 'contain', background: SAFE_BORDER }),
});
const PACKAGE_RELATIVE_PATH = 'design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a';

export function assertPageId(pageId) {
  if (!PAGE_IDS.includes(pageId)) {
    throw new Error(`Unsupported page ID: ${pageId}`);
  }
  return pageId;
}

export function assertCandidateVersion(candidateVersion) {
  if (!['r1', 'r2'].includes(candidateVersion)) {
    throw new Error(`Unsupported candidate version: ${candidateVersion}`);
  }
  return candidateVersion;
}

export function createExportRequest({ pageId, assetId, inputPath, candidateVersion }) {
  assertPageId(pageId);
  assertCandidateVersion(candidateVersion);
  const expectedAssetId = ASSET_IDS[pageId];
  if (assetId !== undefined && assetId !== expectedAssetId) {
    throw new Error(`Asset ID must be ${expectedAssetId} for ${pageId}`);
  }
  if (typeof inputPath !== 'string' || inputPath.length === 0) {
    throw new Error('Raw input path is required');
  }
  if (inputPath.split(/[\\/]/).includes('cocos-project')) {
    throw new Error(`Raw input path must not resolve inside cocos-project: ${inputPath}`);
  }
  const expectedRelativePath = normalize(`${PACKAGE_RELATIVE_PATH}/pages/${pageId}/source/raw/${pageId}-imagegen-${candidateVersion}.png`);
  const normalizedInput = normalize(inputPath);
  const expectedInput = isAbsolute(normalizedInput) ? resolve(PROJECT_ROOT, expectedRelativePath) : expectedRelativePath;
  if (normalizedInput !== expectedInput) {
    throw new Error(`Raw input path must be the exact ${candidateVersion} candidate for ${pageId}`);
  }
  return { pageId, assetId: expectedAssetId, inputPath, candidateVersion };
}
