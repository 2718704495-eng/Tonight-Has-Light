import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  H4_ACTION_WRITES,
  H4_RESPONSE_MS,
  H4_STATES,
  applyH4Action,
} from '../scripts/compose-h4-states.mjs';
import { readJson, readPngMetadata, resolveProjectPath, sha256File } from '../scripts/package-utils.mjs';

test('H4 exposes only the four optional table states and a short static response', () => {
  assert.deepEqual(H4_STATES, ['none', 'ate', 'sipped', 'both']);
  assert.equal(H4_RESPONSE_MS <= 180, true);
  assert.deepEqual(H4_ACTION_WRITES, ['h4State']);
});

test('eat and sip are independent and idempotent', () => {
  assert.equal(applyH4Action('none', 'eat'), 'ate');
  assert.equal(applyH4Action('none', 'sip'), 'sipped');
  assert.equal(applyH4Action('ate', 'eat'), 'ate');
  assert.equal(applyH4Action('sipped', 'sip'), 'sipped');
  assert.equal(applyH4Action('ate', 'sip'), 'both');
  assert.equal(applyH4Action('sipped', 'eat'), 'both');
  assert.equal(applyH4Action('both', 'eat'), 'both');
  assert.equal(applyH4Action('both', 'sip'), 'both');
});

test('unknown H4 state or action is rejected instead of changing story progress', () => {
  assert.throws(() => applyH4Action('completed', 'eat'), /Unknown H4 state/);
  assert.throws(() => applyH4Action('none', 'finish'), /Unknown H4 action/);
});

test('frozen compositor evidence contains editable alpha layers and four hash-bound isolated states', async () => {
  const report = await readJson(resolveProjectPath(
    'design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_004/evidence/h4-response-state-report.json',
  ));

  assert.equal(report.status, 'PASS / H4 RESPONSE STATES BUILT');
  assert.deepEqual(report.stateOrder, H4_STATES);
  assert.deepEqual(report.writes, ['h4State']);
  assert.equal(report.completionEffects.story, false);
  assert.equal(report.completionEffects.night, false);
  assert.equal(report.completionEffects.reward, false);
  assert.equal(report.completionEffects.unlock, false);
  assert.equal(report.validation.changedPixelsOutsideUnionRoi, 0);

  for (const layer of Object.values(report.layers)) {
    const sourcePath = resolveProjectPath(layer.sourceSvgPath);
    const pngPath = resolveProjectPath(layer.pngPath);
    assert.match(await readFile(sourcePath, 'utf8'), /<svg\b/);
    assert.equal(await sha256File(sourcePath), layer.sourceSvgSha256);
    assert.equal(await sha256File(pngPath), layer.pngSha256);
    assert.equal(layer.alphaEncoding, 'straight');
    assert.equal(layer.metadata.width, 390);
    assert.equal(layer.metadata.height, 844);
    assert.equal(layer.metadata.hasAlpha, true);
    assert.equal(layer.nonTargetAlphaPixels, 0);
    assert.equal(layer.checkerboardDetected, false);
    assert.equal(layer.backgroundGhostDetected, false);
    assert.deepEqual(await readPngMetadata(pngPath), layer.metadata);
  }

  for (const state of H4_STATES) {
    const output = report.states[state];
    const outputPath = resolveProjectPath(output.path);
    const metadata = await readPngMetadata(outputPath);
    assert.equal(await sha256File(outputPath), output.sha256);
    assert.equal(metadata.width, 390);
    assert.equal(metadata.height, 844);
    assert.equal(output.changedPixelsOutsideUnionRoi, 0);
  }

  assert.deepEqual(report.states.both.layers, ['ate', 'sipped']);
  assert.notEqual(report.states.ate.sha256, report.states.none.sha256);
  assert.notEqual(report.states.sipped.sha256, report.states.none.sha256);
  assert.notEqual(report.states.both.sha256, report.states.ate.sha256);
  assert.notEqual(report.states.both.sha256, report.states.sipped.sha256);
});

test('ate response avoids duplicate chopsticks and only reduces food inside the dish ROI', async () => {
  const ateSvg = await readFile(
    resolveProjectPath('design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_004/source/response-layers/ate.svg'),
    'utf8',
  );

  assert.doesNotMatch(ateSvg, /chopstick/i);
  assert.doesNotMatch(ateSvg, /stroke="#(?:ff0000|0000ff)"/i);
  assert.match(ateSvg, /reduce-food-portion/);
});
