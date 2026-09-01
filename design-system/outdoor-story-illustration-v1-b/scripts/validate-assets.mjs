#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const SOURCE_FILES = [
  'src/b01-settle.svg',
  'src/b02-wind-passes.svg',
  'src/b03-afterwind.svg',
];

const REQUIRED_GROUPS = [
  'sky',
  'milky_way',
  'main_stars',
  'mountains',
  'house',
  'door_light',
  'far_grass',
  'person_body',
  'person_hair',
  'person_moving_part',
  'cat_body',
  'cat_ear',
  'cat_tail',
  'near_grass',
  'flower_left',
  'flower_right',
  'foreground_occlusion',
  'paper_texture',
];

const REQUIRED_PROJECT_FILES = [
  'README.md',
  'palette.json',
  'layer-manifest.json',
  'scripts/export-assets.mjs',
  ...SOURCE_FILES,
];

const OUTPUTS = {
  '390x844': [390, 844],
  '360x800': [360, 800],
  '430x932': [430, 932],
  '430x844-pressure': [430, 844],
  'thumbnail-195x422': [195, 422],
};

const errors = [];
const passes = [];

function fail(message) {
  errors.push(message);
}

function pass(message) {
  passes.push(message);
}

function readJson(relPath) {
  const absPath = join(ROOT, relPath);
  if (!existsSync(absPath)) {
    fail(`missing required file: ${relPath}`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(absPath, 'utf8'));
  } catch (error) {
    fail(`invalid JSON in ${relPath}: ${error.message}`);
    return null;
  }
}

function pngDimensions(filePath) {
  const data = readFileSync(filePath);
  const signature = '89504e470d0a1a0a';
  if (data.length < 24 || data.subarray(0, 8).toString('hex') !== signature) {
    throw new Error('not a PNG');
  }
  return [data.readUInt32BE(16), data.readUInt32BE(20)];
}

function hashFile(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function collectFiles(directory) {
  if (!existsSync(directory)) return [];
  const result = [];
  for (const entry of readdirSync(directory)) {
    const absPath = join(directory, entry);
    if (statSync(absPath).isDirectory()) result.push(...collectFiles(absPath));
    else result.push(absPath);
  }
  return result;
}

function validateRequiredFiles() {
  for (const relPath of REQUIRED_PROJECT_FILES) {
    if (!existsSync(join(ROOT, relPath))) fail(`missing required file: ${relPath}`);
  }
}

function validatePalette() {
  const palette = readJson('palette.json');
  if (!palette) return null;
  const expected = ['#06182F', '#173B57', '#4E7380', '#91A5AA', '#D3A05B'];
  const actual = Object.values(palette.colors ?? {}).map((value) => String(value).toUpperCase());
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`palette colors must be exactly ${expected.join(', ')}`);
  } else {
    pass('palette uses the approved five-color order');
  }
  if (palette.colorSpace !== 'sRGB IEC61966-2.1') {
    fail('palette colorSpace must be sRGB IEC61966-2.1');
  }
  return new Set(expected);
}

function validateSvg(relPath, allowedColors) {
  const absPath = join(ROOT, relPath);
  if (!existsSync(absPath)) return;
  const source = readFileSync(absPath, 'utf8');
  if (!/viewBox=["']0 0 860 1864["']/.test(source)) {
    fail(`${relPath}: viewBox must be 0 0 860 1864`);
  }
  for (const group of REQUIRED_GROUPS) {
    const matcher = new RegExp(`<g\\b[^>]*\\bid=["']${group}["']`, 'g');
    const count = [...source.matchAll(matcher)].length;
    if (count !== 1) fail(`${relPath}: expected exactly one group id="${group}", found ${count}`);
  }
  const starCount = [...source.matchAll(/<g\b[^>]*\bid=["']star_(?:0[1-9]|10)["']/g)].length;
  if (starCount < 8 || starCount > 10) {
    fail(`${relPath}: main_stars must contain 8-10 named star groups, found ${starCount}`);
  }
  if (/<image\b/i.test(source) || /data:image\//i.test(source)) {
    fail(`${relPath}: embedded or linked raster images are forbidden`);
  }
  if (/\b(?:href|xlink:href)=["'][^"']+\.(?:png|jpe?g|webp|gif)/i.test(source)) {
    fail(`${relPath}: external raster references are forbidden`);
  }
  if (/<text\b/i.test(source)) fail(`${relPath}: visible text is forbidden in the wordless scene`);
  if (/<filter\b|filter=["']/i.test(source)) {
    fail(`${relPath}: SVG filters are forbidden; use editable vector texture only`);
  }
  const usedColors = new Set((source.match(/#[0-9a-fA-F]{6}/g) ?? []).map((c) => c.toUpperCase()));
  if (allowedColors) {
    for (const color of usedColors) {
      if (!allowedColors.has(color)) fail(`${relPath}: unapproved color ${color}`);
    }
  }
  const requiredGuides = ['safe_360x800', 'safe_390x844', 'safe_430x932', 'safe_430x844_pressure'];
  for (const guide of requiredGuides) {
    if (!new RegExp(`\\bid=["']${guide}["']`).test(source)) {
      fail(`${relPath}: missing non-export guide ${guide}`);
    }
  }
  pass(`${relPath}: required editable layer structure is present`);
}

function validateManifest() {
  const manifest = readJson('layer-manifest.json');
  if (!manifest) return;
  if (manifest.version !== 'STORY-ILLUSTRATION-REDESIGN-V1-B-FORMAL-R1') {
    fail('layer-manifest.json: incorrect version');
  }
  for (const shot of ['B01', 'B02', 'B03']) {
    const item = manifest.shots?.find((candidate) => candidate.id === shot);
    if (!item) {
      fail(`layer-manifest.json: missing shot ${shot}`);
      continue;
    }
    const layerIds = new Set((item.layers ?? []).map((layer) => layer.id));
    for (const group of REQUIRED_GROUPS) {
      if (!layerIds.has(group)) fail(`layer-manifest.json: ${shot} missing layer ${group}`);
    }
    for (const layer of item.layers ?? []) {
      if (!Number.isFinite(layer.renderOrder)) fail(`layer-manifest.json: ${shot}/${layer.id} missing renderOrder`);
      if (!Array.isArray(layer.pivot) || layer.pivot.length !== 2) fail(`layer-manifest.json: ${shot}/${layer.id} missing pivot`);
      if (layer.blend !== 'normal') fail(`layer-manifest.json: ${shot}/${layer.id} blend must be normal`);
    }
  }
  if (manifest.sourceCanvas?.width !== 860 || manifest.sourceCanvas?.height !== 1864) {
    fail('layer-manifest.json: source canvas must be 860x1864');
  }
  if (manifest.prototypeInputsAllowed !== false) {
    fail('layer-manifest.json: prototypeInputsAllowed must be false');
  }
  pass('layer-manifest.json describes the formal three-shot source');
}

function validateOutputs() {
  let outputCount = 0;
  for (const [directory, dimensions] of Object.entries(OUTPUTS)) {
    for (const fileName of ['b01-settle.png', 'b02-wind-passes.png', 'b03-afterwind.png']) {
      const relPath = `dist/${directory}/${fileName}`;
      const absPath = join(ROOT, relPath);
      if (!existsSync(absPath)) {
        fail(`missing exported PNG: ${relPath}`);
        continue;
      }
      outputCount += 1;
      try {
        const actual = pngDimensions(absPath);
        if (actual[0] !== dimensions[0] || actual[1] !== dimensions[1]) {
          fail(`${relPath}: expected ${dimensions.join('x')}, got ${actual.join('x')}`);
        }
      } catch (error) {
        fail(`${relPath}: ${error.message}`);
      }
    }
  }
  if (outputCount === 15) pass('all 15 required PNG exports have the correct dimensions');
}

function validateHashes() {
  const hashPath = join(ROOT, 'ASSET-HASHES.sha256');
  if (!existsSync(hashPath)) {
    fail('missing required file: ASSET-HASHES.sha256');
    return;
  }
  const lines = readFileSync(hashPath, 'utf8').split(/\r?\n/).filter(Boolean);
  const entries = new Map();
  for (const line of lines) {
    const match = line.match(/^([0-9a-f]{64})  (.+)$/);
    if (!match) {
      fail(`ASSET-HASHES.sha256: malformed line ${line}`);
      continue;
    }
    entries.set(match[2], match[1]);
  }
  const expectedFiles = collectFiles(ROOT)
    .filter((filePath) => !filePath.endsWith('ASSET-HASHES.sha256'))
    .filter((filePath) => !filePath.includes('/.DS_Store'))
    .map((filePath) => relative(ROOT, filePath))
    .sort();
  for (const relPath of expectedFiles) {
    if (!entries.has(relPath)) {
      fail(`ASSET-HASHES.sha256: missing entry for ${relPath}`);
      continue;
    }
    const actual = hashFile(join(ROOT, relPath));
    if (actual !== entries.get(relPath)) fail(`ASSET-HASHES.sha256: checksum mismatch for ${relPath}`);
  }
  for (const relPath of entries.keys()) {
    if (!expectedFiles.includes(relPath)) fail(`ASSET-HASHES.sha256: stale entry ${relPath}`);
  }
  if (expectedFiles.length > 0 && expectedFiles.length === entries.size) {
    pass(`hash index covers ${entries.size} artifacts`);
  }
}

validateRequiredFiles();
const allowedColors = validatePalette();
for (const sourceFile of SOURCE_FILES) validateSvg(sourceFile, allowedColors);
validateManifest();
validateOutputs();
validateHashes();

for (const message of passes) console.log(`PASS ${message}`);
if (errors.length > 0) {
  for (const message of errors) console.error(`FAIL ${message}`);
  console.error(`\nFORMAL-R1 validation failed with ${errors.length} issue(s).`);
  process.exit(1);
}

console.log(`\nFORMAL-R1 validation passed (${passes.length} checks).`);
