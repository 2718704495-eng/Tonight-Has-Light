import { writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadSharp } from '../../scripts/sharp-loader.mjs';

const sourceDir = dirname(fileURLToPath(import.meta.url));
const uiDir = resolve(sourceDir, '..');
const packageDir = resolve(uiDir, '..');
const evidenceDir = join(uiDir, 'evidence');
const pagesDir = join(packageDir, 'pages');

const WARM = [246, 226, 188];
const INK = [38, 23, 15];

function linear(value) {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(rgb) {
  return (0.2126 * linear(rgb[0])) + (0.7152 * linear(rgb[1])) + (0.0722 * linear(rgb[2]));
}

function contrast(a, b) {
  const high = Math.max(luminance(a), luminance(b));
  const low = Math.min(luminance(a), luminance(b));
  return (high + 0.05) / (low + 0.05);
}

function distance(a, b) {
  return Math.sqrt(((a[0] - b[0]) ** 2) + ((a[1] - b[1]) ** 2) + ((a[2] - b[2]) ** 2));
}

async function raw(sharp, path, width, height) {
  return sharp(path)
    .resize(width, height, { fit: 'contain', background: '#06265F' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
}

async function sample(sharp, item) {
  const [base, composite] = await Promise.all([
    raw(sharp, item.base, item.width, item.height),
    raw(sharp, item.composite, item.width, item.height),
  ]);
  let bestWarm = null;
  let bestInk = null;
  for (let index = 0; index < composite.data.length; index += 3) {
    const changed = Math.max(
      Math.abs(composite.data[index] - base.data[index]),
      Math.abs(composite.data[index + 1] - base.data[index + 1]),
      Math.abs(composite.data[index + 2] - base.data[index + 2]),
    );
    if (changed < 3) continue;
    const rgb = [composite.data[index], composite.data[index + 1], composite.data[index + 2]];
    const pixel = index / 3;
    const point = { x: pixel % item.width, y: Math.floor(pixel / item.width), rgb };
    const warmDistance = distance(rgb, WARM);
    const inkDistance = distance(rgb, INK);
    if (!bestWarm || warmDistance < bestWarm.distance) bestWarm = { ...point, distance: warmDistance };
    if (!bestInk || inkDistance < bestInk.distance) bestInk = { ...point, distance: inkDistance };
  }
  if (!bestWarm || !bestInk) throw new Error(`No changed text pixels found for ${item.id}`);
  const ratio = contrast(bestWarm.rgb, bestInk.rgb);
  return {
    id: item.id,
    viewport: `${item.width}x${item.height}`,
    warmFillSample: bestWarm,
    darkOutlineSample: bestInk,
    ratio: Number(ratio.toFixed(2)),
    required: 4.5,
    pass: ratio >= 4.5,
  };
}

async function main() {
  const sharp = await loadSharp();
  const h1 = join(pagesDir, 'scene_01_home_shot_001/exports/390x844/scene_01_home_shot_001.png');
  const h2 = join(pagesDir, 'scene_01_home_shot_002/exports/390x844/scene_01_home_shot_002.png');
  const h4None = join(pagesDir, 'scene_01_home_shot_004/exports/states/scene_01_home_shot_004-none-390x844.png');
  const h4Both = join(pagesDir, 'scene_01_home_shot_004/exports/states/scene_01_home_shot_004-both-390x844.png');
  const items = [
    { id: 'H1-standard', width: 390, height: 844, base: h1, composite: join(evidenceDir, 'h1-standard-390x844.png') },
    { id: 'H1-large-120', width: 390, height: 844, base: h1, composite: join(evidenceDir, 'h1-large-390x844.png') },
    { id: 'H2-standard', width: 390, height: 844, base: h2, composite: join(evidenceDir, 'h2-standard-390x844.png') },
    { id: 'H2-large-120', width: 390, height: 844, base: h2, composite: join(evidenceDir, 'h2-large-390x844.png') },
    { id: 'H4-standard-360', width: 360, height: 800, base: h4None, composite: join(evidenceDir, 'h4-none-standard-360x800.png') },
    { id: 'H4-standard-390', width: 390, height: 844, base: h4None, composite: join(evidenceDir, 'h4-none-standard-390x844.png') },
    { id: 'H4-standard-430', width: 430, height: 932, base: h4None, composite: join(evidenceDir, 'h4-none-standard-430x932.png') },
    { id: 'H4-standard-430-pressure', width: 430, height: 844, base: h4None, composite: join(evidenceDir, 'h4-none-standard-430x844-pressure.png') },
    { id: 'H4-large-120', width: 390, height: 844, base: h4None, composite: join(evidenceDir, 'h4-none-large-390x844.png') },
    { id: 'H4-reduced-both', width: 390, height: 844, base: h4Both, composite: join(evidenceDir, 'h4-both-reduced-390x844.png') },
  ];
  const samples = [];
  for (const item of items) samples.push(await sample(sharp, item));
  const report = {
    status: samples.every((entry) => entry.pass) ? 'PASS' : 'FAIL',
    method: 'Read the final rendered PNG and its matching clean/state frame, retain pixels changed by the editable text overlay, then sample the nearest actual warm-fill and dark-outline pixels and calculate WCAG 2 sRGB relative-luminance contrast.',
    note: 'The dark outline is the immediate adjacent color around the warm glyph fill. Invisible hit targets do not rely on a non-text boundary.',
    minimumRatio: Math.min(...samples.map((entry) => entry.ratio)),
    samples,
  };
  await writeFile(join(evidenceDir, 'pixel-contrast-report.json'), `${JSON.stringify(report, null, 2)}\n`);
}

await main();
