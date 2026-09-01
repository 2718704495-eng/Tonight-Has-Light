import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import test from 'node:test';

import { buildH4ReviewBoards } from '../../../scripts/build-h4-review-boards.mjs';
import { PROJECT_ROOT, readPngMetadata } from '../../../scripts/package-utils.mjs';

test('builds deterministic H3 → H4 → H5 and H4 interaction evidence', async () => {
  const report = await buildH4ReviewBoards();
  assert.equal(report.status, 'BUILT / H4 CLEAN-PLATE REVIEW BOARDS ONLY / RESPONSE+UI USE SEPARATE REPORTS');
  assert.equal(report.candidateId, 'home-meal-h4-table-ritual-v1-a-r2');
  assert.deepEqual(report.interactionGeometry, {
    dish: { x: 154, y: 370, width: 136, height: 102 },
    warmWaterCup: { x: 300, y: 371, width: 62, height: 91 },
    minimumEdgeGapPx: 10,
    requiredEdgeGapPx: 8,
    minimumTargetPx: 44,
  });
  assert.equal(report.evidenceBoundary.scope, 'clean-plate-review-boards-only');
  assert.equal(report.evidenceBoundary.responseLayersProducedByThisBuilder, false);
  assert.equal(report.evidenceBoundary.userApproved, false);

  const expected = {
    story390: [1170, 900],
    story195: [585, 478],
    interaction390: [390, 844],
    dish390: [810, 346],
  };
  for (const [key, [width, height]] of Object.entries(expected)) {
    const output = report.outputs[key];
    assert.deepEqual(await readPngMetadata(resolve(PROJECT_ROOT, output.path)), {
      format: 'png', width, height, bitDepth: 8, colorType: 6, hasAlpha: true,
    });
  }
});
