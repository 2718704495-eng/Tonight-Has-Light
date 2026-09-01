import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, readJson, sha256File } from '../scripts/package-utils.mjs';

test('H4 quiet UI evidence is read-only, hash-bound, and uses warm table paper for 120 percent text', async () => {
  const uiDir = join(PACKAGE_ROOT, 'ui');
  const evidenceDir = join(uiDir, 'evidence');
  const report = await readJson(join(evidenceDir, 'build-report.json'));
  const contract = await readJson(join(uiDir, 'home-meal-ui-contract.json'));

  assert.equal(report.status, 'PASS / UI OWNER EVIDENCE BUILT / USER VISUAL APPROVAL PENDING');
  assert.equal(contract.status, 'PASS / H4 RESPONSE+QUIET UI READY FOR USER VISUAL REVIEW');
  assert.equal(contract.tokens.typography.largeScale, 1.2);
  assert.equal(contract.tokens.typography.shrinkAllowed, false);
  assert.equal(contract.scenes.scene_01_home_shot_004.layout.largeModePaper, 'table-edge-warm-paper');
  assert.equal(contract.tokens.motion.maxStateCrossfadeMs <= 180, true);

  for (const file of report.generatedFiles) {
    assert.equal(await sha256File(join(evidenceDir, file)), report.outputHashes[file], `${file} must match the owner evidence report`);
  }

  const stateDir = join(PACKAGE_ROOT, 'pages/scene_01_home_shot_004/exports/states');
  for (const state of ['none', 'ate', 'sipped', 'both']) {
    assert.equal(
      await sha256File(join(stateDir, `scene_01_home_shot_004-${state}-390x844.png`)),
      report.inputHashes.h4States[state],
      `${state} must match the frozen H4 state input`,
    );
  }

  const largeSource = await readFile(join(uiDir, 'source/h4-large-table-paper.svg'), 'utf8');
  assert.match(largeSource, /data-role="large-table-paper"/);
  assert.match(largeSource, /吃一点/);
  assert.match(largeSource, /喝口温水/);

  const normalSource = await readFile(join(uiDir, 'source/h4-quiet-actions.svg'), 'utf8');
  assert.doesNotMatch(normalSource, /data-role="large-table-paper"/);
});
