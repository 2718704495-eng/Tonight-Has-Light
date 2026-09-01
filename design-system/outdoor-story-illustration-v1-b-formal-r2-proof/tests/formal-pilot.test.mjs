#!/usr/bin/env node

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const SOURCE = join(ROOT, 'source/b01-settle.svg');
const MANIFEST = join(ROOT, 'source/manifest.json');
const STATUS = join(ROOT, 'STATUS.md');

function pngSize(path) {
  const bytes = readFileSync(path);
  assert.equal(bytes.subarray(1, 4).toString('ascii'), 'PNG', `${path} must be a PNG`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

assert.ok(existsSync(SOURCE), 'missing editable B01 SVG source');
assert.ok(existsSync(MANIFEST), 'missing source manifest');
assert.ok(existsSync(STATUS), 'missing review status');

const svg = readFileSync(SOURCE, 'utf8');
assert.match(svg, /viewBox="0 0 860 1864"/, 'source canvas must be 860×1864');
assert.doesNotMatch(svg, /<image\b|data:image|\.png["')]/i, 'formal source must not embed raster pixels');

const requiredLayers = [
  'layer-sky',
  'layer-milky-way',
  'layer-stars',
  'layer-mountains',
  'layer-house',
  'layer-door-light',
  'layer-far-grass',
  'layer-adult-body',
  'layer-adult-hair',
  'layer-adult-clothing-edge',
  'layer-cat-body',
  'layer-cat-ears',
  'layer-cat-tail',
  'layer-near-grass',
  'layer-flowers',
  'layer-foreground-strokes',
  'layer-paper-grain',
];
for (const id of requiredLayers) {
  assert.match(svg, new RegExp(`id="${id}"`), `missing named layer ${id}`);
}

assert.equal((svg.match(/data-role="main-star"/g) ?? []).length, 9, 'B01 must expose exactly nine future main stars');
assert.equal((svg.match(/data-role="flower"/g) ?? []).length, 2, 'B01 must contain exactly two flowers');
assert.equal((svg.match(/id="milky-way"/g) ?? []).length, 1, 'B01 must contain one Milky Way group');

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
assert.deepEqual(manifest.canvas, { width: 860, height: 1864, logicalWidth: 390, logicalHeight: 844 });
assert.equal(manifest.status, 'REVIEW-BLOCKED');
assert.equal(manifest.productionPolicy.embeddedRaster, false);
assert.equal(manifest.productionPolicy.referencePixelsCopied, false);
assert.deepEqual(manifest.layers.map((layer) => layer.id), requiredLayers);

assert.match(readFileSync(STATUS, 'utf8'), /REVIEW-BLOCKED/, 'status must prevent downstream consumption');

const expectedOutputs = [
  ['dist/390x844/b01-settle.png', 390, 844],
  ['dist/195x422/b01-settle.png', 195, 422],
  ['dist/360x800/b01-settle.png', 360, 800],
  ['dist/430x932/b01-settle.png', 430, 932],
  ['dist/430x844-pressure/b01-settle.png', 430, 844],
];
for (const [relativePath, width, height] of expectedOutputs) {
  const path = join(ROOT, relativePath);
  assert.ok(existsSync(path), `missing deterministic export ${relativePath}`);
  assert.deepEqual(pngSize(path), { width, height }, `${relativePath} dimensions drifted`);
}

console.log('PASS formal B01 source, layers, counts, policy, and deterministic output dimensions');
