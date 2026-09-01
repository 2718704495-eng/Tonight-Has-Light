import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

import { buildH2ReviewBoards } from '../../../scripts/build-h2-review-boards.mjs';
import { readPngMetadata } from '../../../scripts/package-utils.mjs';

const PROJECT_ROOT = resolve(import.meta.dirname, '../../../../..');
const EVIDENCE_ROOT = resolve(import.meta.dirname);

test('builds H1 → H2 → H5 garment continuity evidence from the actual r1 exports', async () => {
  const report = await buildH2ReviewBoards({ pageId: 'scene_01_home_shot_002' });

  assert.equal(report.status, 'BUILT');
  assert.equal(report.inputs.h2.candidateVersion, 'r1');
  assert.deepEqual(report.sequence, [
    { pageId: 'scene_01_home_shot_001', state: 'outerwear worn' },
    { pageId: 'scene_01_home_shot_002', state: 'outerwear hanging action' },
    { pageId: 'scene_01_home_shot_005', state: 'outerwear hanging result' },
  ]);
  assert.deepEqual(Object.keys(report.outputs).sort(), [
    'h1H2H5Outerwear195',
    'h1H2H5Outerwear390',
    'h2H5InnerKnit390',
    'h2RoomAnchors390',
  ]);

  const expectedDimensions = {
    h1H2H5Outerwear390: [1170, 900],
    h1H2H5Outerwear195: [585, 478],
    h2H5InnerKnit390: [780, 900],
    h2RoomAnchors390: [390, 844],
  };
  for (const [key, [width, height]] of Object.entries(expectedDimensions)) {
    const output = report.outputs[key];
    const outputPath = resolve(PROJECT_ROOT, output.path);
    assert.deepEqual([output.width, output.height], [width, height]);
    assert.deepEqual(await readPngMetadata(outputPath), {
      format: 'png',
      width,
      height,
      bitDepth: 8,
      colorType: 6,
      hasAlpha: true,
    });
    assert.equal(output.sha256.length, 64);
  }

  assert.deepEqual(report.annotations.roomAnchors, [
    'door frame',
    'same left hook',
    'cabinet / lamp',
    'floor direction',
  ]);
  assert.deepEqual(report.evidenceBoundary, {
    cleanPlate: false,
    userApproved: false,
    chineseLabelsBakedInEvidenceOnly: true,
  });

  const savedReport = JSON.parse(await readFile(resolve(EVIDENCE_ROOT, 'build-report.json'), 'utf8'));
  assert.equal(savedReport.inputs.h2.candidateVersion, 'r1');
  assert.equal(savedReport.evidenceBoundary.cleanPlate, false);
  assert.equal(savedReport.evidenceBoundary.userApproved, false);
});
