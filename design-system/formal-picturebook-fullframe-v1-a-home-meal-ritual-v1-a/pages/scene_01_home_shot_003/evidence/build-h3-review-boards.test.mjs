import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

import { buildH3ReviewBoards } from '../../../scripts/build-h3-review-boards.mjs';
import { readPngMetadata } from '../../../scripts/package-utils.mjs';

const PROJECT_ROOT = resolve(import.meta.dirname, '../../../../..');
const EVIDENCE_ROOT = resolve(import.meta.dirname);

test('builds H2 → H3 → H5 kitchen and dish continuity evidence from actual r1 exports', async () => {
  const report = await buildH3ReviewBoards({ pageId: 'scene_01_home_shot_003' });

  assert.equal(report.status, 'BUILT');
  assert.equal(report.inputs.h3.candidateVersion, 'r1');
  assert.deepEqual(report.sequence, [
    { pageId: 'scene_01_home_shot_002', state: 'outerwear put down' },
    { pageId: 'scene_01_home_shot_003', state: 'serving hot dish in connected kitchen' },
    { pageId: 'scene_01_home_shot_005', state: 'returned to dinner table' },
  ]);
  assert.deepEqual(Object.keys(report.outputs).sort(), [
    'h2H3H5Story195',
    'h2H3H5Story390',
    'h3H5DishContinuity390',
    'h3RoomAnchors390',
  ]);

  const expectedDimensions = {
    h2H3H5Story390: [1170, 900],
    h2H3H5Story195: [585, 478],
    h3RoomAnchors390: [390, 844],
    h3H5DishContinuity390: [780, 360],
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
    assert.match(output.sha256, /^[a-f0-9]{64}$/);
  }

  assert.deepEqual(report.annotations.roomAnchors, [
    'door frame',
    'original main-room window / lamp / low table',
    'wall / floor material',
    'warm light direction',
  ]);
  assert.deepEqual(report.dishContinuity, {
    source: 'H3 actual shallow round plate and hot-dish serving crop',
    futureTarget: 'H4 is a future target only; no H4 image is generated or baked into this evidence.',
    result: 'H5 actual central shallow round plate and finished-dish crop',
  });
  assert.deepEqual(report.evidenceBoundary, {
    cleanPlate: false,
    userApproved: false,
    chineseLabelsBakedInEvidenceOnly: true,
    h4Generated: false,
  });

  const savedReport = JSON.parse(await readFile(resolve(EVIDENCE_ROOT, 'build-report.json'), 'utf8'));
  assert.equal(savedReport.inputs.h3.candidateVersion, 'r1');
  assert.equal(savedReport.evidenceBoundary.cleanPlate, false);
  assert.equal(savedReport.evidenceBoundary.userApproved, false);
  assert.equal(savedReport.evidenceBoundary.h4Generated, false);
  for (const entry of Object.values(savedReport.inputs)) {
    for (const exportRecord of Object.values(entry)) {
      if (exportRecord?.path) {
        assert.match(exportRecord.path, /^design-system\//);
        assert.match(exportRecord.sha256, /^[a-f0-9]{64}$/);
        assert.equal(typeof exportRecord.width, 'number');
        assert.equal(typeof exportRecord.height, 'number');
      }
    }
  }
});
