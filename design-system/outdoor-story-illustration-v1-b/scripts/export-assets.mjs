#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSharp } from './sharp-loader.mjs';

const sharp = loadSharp();
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const SHOTS = [
  { source: 'src/b01-settle.svg', output: 'b01-settle.png', id: 'B01' },
  { source: 'src/b02-wind-passes.svg', output: 'b02-wind-passes.png', id: 'B02' },
  { source: 'src/b03-afterwind.svg', output: 'b03-afterwind.png', id: 'B03' },
];

const TARGETS = [
  { directory: '390x844', width: 390, height: 844 },
  { directory: '360x800', width: 360, height: 800 },
  { directory: '430x932', width: 430, height: 932 },
  { directory: '430x844-pressure', width: 430, height: 844 },
  { directory: 'thumbnail-195x422', width: 195, height: 422 },
];

function collectFiles(directory) {
  const files = [];
  if (!existsSync(directory)) return files;
  for (const entry of readdirSync(directory)) {
    const absPath = join(directory, entry);
    if (statSync(absPath).isDirectory()) files.push(...collectFiles(absPath));
    else files.push(absPath);
  }
  return files;
}

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function bleedTransparentRgb(raw, width, height, radius) {
  let source = Buffer.from(raw);
  const stride = width * 4;
  const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (let step = 0; step < radius; step += 1) {
    const next = Buffer.from(source);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = y * stride + x * 4;
        if (source[offset + 3] !== 0) continue;
        for (const [dx, dy] of neighbors) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const neighbor = ny * stride + nx * 4;
          if (source[neighbor + 3] === 0) continue;
          next[offset] = source[neighbor];
          next[offset + 1] = source[neighbor + 1];
          next[offset + 2] = source[neighbor + 2];
          break;
        }
      }
    }
    source = next;
  }
  return source;
}

async function exportPng(svgBuffer, target, outputPath) {
  const { data, info } = await sharp(svgBuffer, { density: 144 })
    .resize(target.width, target.height, {
      fit: 'cover',
      position: 'centre',
      kernel: sharp.kernel.lanczos3,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bled = bleedTransparentRgb(data, info.width, info.height, 4);
  await sharp(bled, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({
      compressionLevel: 9,
      adaptiveFiltering: false,
      palette: true,
      colours: 64,
      dither: 0.5,
      effort: 10,
    })
    .withMetadata({ icc: 'srgb' })
    .toFile(outputPath);
}

async function main() {
  const manifest = {
    version: 'STORY-ILLUSTRATION-REDESIGN-V1-B-FORMAL-R1',
    deterministic: true,
    inputPolicy: 'editable-svg-only-no-raster',
    alphaMode: 'straight',
    edgeRgbBleedPixels: 4,
    resampling: 'lanczos3-cover-center',
    png: { palette: true, colours: 64, dither: 0.5, compressionLevel: 9 },
    outputs: [],
  };

  for (const target of TARGETS) {
    const outputDirectory = join(ROOT, 'dist', target.directory);
    mkdirSync(outputDirectory, { recursive: true });
    for (const shot of SHOTS) {
      const sourcePath = join(ROOT, shot.source);
      if (!existsSync(sourcePath)) throw new Error(`Missing formal source: ${shot.source}`);
      const outputPath = join(outputDirectory, shot.output);
      await exportPng(readFileSync(sourcePath), target, outputPath);
      manifest.outputs.push({
        shot: shot.id,
        path: relative(ROOT, outputPath),
        width: target.width,
        height: target.height,
        sha256: sha256(outputPath),
      });
    }
  }

  const manifestPath = join(ROOT, 'dist', 'export-manifest.json');
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const files = collectFiles(ROOT)
    .filter((filePath) => !filePath.endsWith('ASSET-HASHES.sha256'))
    .filter((filePath) => !filePath.endsWith('.DS_Store'))
    .sort((a, b) => relative(ROOT, a).localeCompare(relative(ROOT, b)));
  const hashIndex = files.map((filePath) => `${sha256(filePath)}  ${relative(ROOT, filePath)}`).join('\n');
  writeFileSync(join(ROOT, 'ASSET-HASHES.sha256'), `${hashIndex}\n`);
  console.log(`Exported ${manifest.outputs.length} PNGs and indexed ${files.length} artifacts.`);
}

await main();
