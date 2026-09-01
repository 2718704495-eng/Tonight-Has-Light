import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ASSET_IDS,
  H5_SHA256_390,
  MAX_GENERATIONS_PER_PAGE,
  PAGE_IDS,
  REVIEW_EXPORT_OPTIONS,
  REQUIRED_EXPORTS,
  SAFE_BORDER,
  createExportRequest,
} from '../scripts/production-contract.mjs';
import { loadSharp } from '../scripts/sharp-loader.mjs';
import { PACKAGE_ROOT, readJson } from '../scripts/package-utils.mjs';
import { isProductionPngMetadata, validatePage } from '../scripts/validate-page.mjs';
import { validatePackage } from '../scripts/validate-package.mjs';

test('the production contract fixes the home-meal page and review identities', () => {
  assert.deepEqual(PAGE_IDS, [
    'scene_01_home_shot_001',
    'scene_01_home_shot_002',
    'scene_01_home_shot_003',
    'scene_01_home_shot_004',
    'scene_01_home_shot_005',
  ]);
  assert.equal(ASSET_IDS.scene_01_home_shot_001, 'ART-PBOOK-HOME-001');
  assert.equal(ASSET_IDS.scene_01_home_shot_004, 'ART-PBOOK-HOME-004');
  assert.equal(H5_SHA256_390, '569a7b9b71d16d13ad311bdea9a29d6bc93a7dc68c99892faf8c416f38bc1c51');
  assert.deepEqual(REQUIRED_EXPORTS, ['195x422', '360x800', '390x844', '430x932', '430x844-pressure']);
  assert.equal(SAFE_BORDER, '#06265F');
  assert.equal(MAX_GENERATIONS_PER_PAGE, 2);
});

test('review exports use SHOW_ALL containment and only letterbox non-matching aspect ratios', () => {
  assert.deepEqual(REVIEW_EXPORT_OPTIONS['195x422'], { fit: 'contain' });
  assert.deepEqual(REVIEW_EXPORT_OPTIONS['390x844'], { fit: 'contain' });
  for (const exportName of ['360x800', '430x932', '430x844-pressure']) {
    assert.deepEqual(REVIEW_EXPORT_OPTIONS[exportName], { fit: 'contain', background: SAFE_BORDER });
  }
});

test('an export request derives its only valid asset ID and raw filename from page/version', () => {
  const rawR1 = 'design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_001/source/raw/scene_01_home_shot_001-imagegen-r1.png';
  const request = createExportRequest({
    pageId: 'scene_01_home_shot_001',
    candidateVersion: 'r1',
    inputPath: rawR1,
  });
  assert.equal(request.assetId, 'ART-PBOOK-HOME-001');
  assert.equal(request.inputPath, rawR1);
  assert.throws(() => createExportRequest({
    pageId: 'scene_01_home_shot_001',
    assetId: 'ART-PBOOK-HOME-004',
    candidateVersion: 'r1',
    inputPath: rawR1,
  }), /asset ID/i);
  assert.throws(() => createExportRequest({
    pageId: 'scene_01_home_shot_001',
    candidateVersion: 'r2',
    inputPath: rawR1,
  }), /raw input/i);
  assert.throws(() => createExportRequest({
    pageId: 'scene_01_home_shot_001',
    candidateVersion: 'r1',
    inputPath: 'cocos-project/assets/scene_01_home_shot_001-imagegen-r1.png',
  }), /cocos-project/i);
});

test('the Sharp loader resolves a usable renderer without a hard-coded user home', async () => {
  const sharp = await loadSharp();
  assert.equal(typeof sharp, 'function');
  assert.equal(typeof sharp.cache, 'function');
});

test('page validation rejects manifest/provenance drift and requires production PNG metadata', async () => {
  const manifest = await readJson(`${PACKAGE_ROOT}/ritual-manifest.json`);
  const provenance = await readJson(`${PACKAGE_ROOT}/provenance.json`);
  provenance.pages.scene_01_home_shot_001.status = 'TEST-ONLY STATUS DRIFT';
  assert.notEqual(
    manifest.pages.scene_01_home_shot_001.status,
    provenance.pages.scene_01_home_shot_001.status,
  );
  const drift = await validatePage({
    pageId: 'scene_01_home_shot_001',
    manifest,
    provenance,
  });
  assert.equal(drift.status, 'FAIL');
  assert.match(drift.issues.join('\n'), /drift/i);
  assert.equal(isProductionPngMetadata({
    format: 'png', width: 780, height: 1688, depth: 'uchar', space: 'srgb', hasAlpha: false,
  }, { width: 780, height: 1688 }), true);
  assert.equal(isProductionPngMetadata({
    format: 'png', width: 780, height: 1688, depth: 'ushort', space: 'srgb', hasAlpha: false,
  }, { width: 780, height: 1688 }), false);
});

test('package validation recognizes the frozen H1-H4 pages and H5 reference as a home-meal Gate B visual pass', async () => {
  const result = await validatePackage({ stage: 'structure' });
  assert.equal(result.status, 'STRUCTURE VALID / HOME-MEAL GATE B VISUAL PASS');
  assert.equal(result.gateBVisualStatus, 'PASS / HOME-MEAL-RITUAL-V1-A');
  assert.equal(result.pages.scene_01_home_shot_001, 'USER VISUAL PASS / FROZEN');
  assert.equal(result.pages.scene_01_home_shot_002, 'USER VISUAL PASS / FROZEN');
  assert.equal(result.pages.scene_01_home_shot_003, 'USER VISUAL PASS / FROZEN');
  assert.equal(result.pages.scene_01_home_shot_004, 'USER VISUAL PASS / FROZEN');
  assert.equal(result.pages.scene_01_home_shot_005, 'REFERENCE HASH PASS');
});
