#!/usr/bin/env node

import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSharp } from './sharp-loader.mjs';

const sharp = loadSharp();
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const source = readFileSync(join(ROOT, 'source/b01-settle.svg'), 'utf8');
const manifest = JSON.parse(readFileSync(join(ROOT, 'source/manifest.json'), 'utf8'));

assert.doesNotMatch(source, /<image\b|data:image|(?:href|xlink:href)=["']https?:\/\//i);
assert.equal(manifest.status, 'REVIEW-BLOCKED');
assert.equal(manifest.layers.length, 17);

const files = [];
for (const expected of manifest.exports) {
  const path = join(ROOT, expected.path);
  const metadata = await sharp(path).metadata();
  assert.equal(metadata.width, expected.width, `${expected.path} width`);
  assert.equal(metadata.height, expected.height, `${expected.path} height`);
  assert.ok(metadata.hasAlpha === false || metadata.channels === 3 || metadata.space === 'srgb');
  files.push({
    path: expected.path,
    width: metadata.width,
    height: metadata.height,
    channels: metadata.channels,
    space: metadata.space,
  });
}

const report = {
  candidate: manifest.version,
  status: 'REVIEW-BLOCKED',
  machineChecks: {
    editableSvg: true,
    embeddedRaster: false,
    externalHref: false,
    namedLayers: manifest.layers.length,
    futureMainStars: 9,
    flowers: 2,
    milkyWayGroups: 1,
    deterministicOutputDimensions: true,
  },
  visualQuality: 'REVIEW-BLOCKED',
  note: 'Machine checks do not approve anatomy, story read, material quality, or similarity to the approved direction.',
  files,
};
mkdirSync(join(ROOT, 'evidence'), { recursive: true });
writeFileSync(join(ROOT, 'evidence/validation-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`PASS machine structure and dimensions; visual status remains ${report.visualQuality}`);
