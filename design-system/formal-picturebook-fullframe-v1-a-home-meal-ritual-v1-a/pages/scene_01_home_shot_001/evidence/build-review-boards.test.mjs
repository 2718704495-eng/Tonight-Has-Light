import assert from 'node:assert/strict';
import test from 'node:test';

import { buildReviewBoards } from '../../../scripts/build-review-boards.mjs';

test('builds deterministic continuity boards from the accepted H1 r2 candidate only', async () => {
  const report = await buildReviewBoards({ pageId: 'scene_01_home_shot_001' });

  assert.equal(report.status, 'BUILT');
  assert.equal(report.inputs.h1.candidateVersion, 'r2');
  assert.deepEqual(Object.keys(report.outputs).sort(), [
    'continuityCheck390',
    'h1H5SideBySide195',
    'h1H5SideBySide390',
    'landmarks390',
  ]);
});
