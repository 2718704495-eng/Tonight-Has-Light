#!/usr/bin/env node

import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSharp } from './sharp-loader.mjs';

const sharp = loadSharp();
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const PROJECT = resolve(ROOT, '../..');
const SOURCE = join(ROOT, 'source/b01-settle.svg');
const APPROVED_REFERENCE = join(
  PROJECT,
  'design-board/story-illustration-redesign-v1-b/exploration/b01-settle-reference-r1.png',
);
const NAVY = { r: 6, g: 24, b: 47, alpha: 1 };

const targets = [
  { directory: '390x844', width: 390, height: 844 },
  { directory: '195x422', width: 195, height: 422 },
  { directory: '360x800', width: 360, height: 800 },
  { directory: '430x932', width: 430, height: 932 },
  { directory: '430x844-pressure', width: 430, height: 844 },
];

function safeOverlay(width, height) {
  const side = Math.round(width * 0.04);
  const top = Math.round(height * 0.065);
  const bottom = Math.round(height * 0.045);
  const safeWidth = width - side * 2;
  const safeHeight = height - top - bottom;
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect x="${side}" y="${top}" width="${safeWidth}" height="${safeHeight}"
        fill="none" stroke="#D3A05B" stroke-width="2" stroke-dasharray="8 6" opacity="0.88"/>
      <path d="M${side} ${top + 10}v-10h10 M${width - side - 10} ${top}h10v10
        M${side} ${height - bottom - 10}v10h10 M${width - side - 10} ${height - bottom}h10v-10"
        fill="none" stroke="#F0D19A" stroke-width="2" opacity="0.95"/>
    </svg>
  `);
}

async function render(source, width, height) {
  return sharp(source, { density: 144 })
    .resize(width, height, {
      fit: 'contain',
      position: 'centre',
      background: NAVY,
      kernel: sharp.kernel.lanczos3,
      withoutEnlargement: false,
    })
    .flatten({ background: NAVY })
    .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
    .withMetadata({ icc: 'srgb' })
    .toBuffer();
}

async function main() {
  const source = readFileSync(SOURCE);
  for (const target of targets) {
    const directory = join(ROOT, 'dist', target.directory);
    mkdirSync(directory, { recursive: true });
    const png = await render(source, target.width, target.height);
    await sharp(png).toFile(join(directory, 'b01-settle.png'));

    const evidenceDirectory = join(ROOT, 'evidence', 'safe-area');
    mkdirSync(evidenceDirectory, { recursive: true });
    await sharp(png)
      .composite([{ input: safeOverlay(target.width, target.height), blend: 'over' }])
      .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
      .toFile(join(evidenceDirectory, `${target.directory}.png`));
  }

  const formal = readFileSync(join(ROOT, 'dist/390x844/b01-settle.png'));
  const reference = await sharp(APPROVED_REFERENCE)
    .resize(390, 844, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();
  const header = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="56">
      <rect width="800" height="56" fill="#06182F"/>
      <text x="18" y="35" fill="#91A5AA" font-family="Arial, sans-serif" font-size="18" letter-spacing="1">APPROVED DIRECTION / REFERENCE ONLY</text>
      <text x="422" y="35" fill="#D3A05B" font-family="Arial, sans-serif" font-size="18" letter-spacing="1">FORMAL B01 R2 PROOF</text>
    </svg>
  `);
  mkdirSync(join(ROOT, 'evidence'), { recursive: true });
  await sharp({ create: { width: 800, height: 900, channels: 4, background: NAVY } })
    .composite([
      { input: header, left: 0, top: 0 },
      { input: reference, left: 0, top: 56 },
      { input: formal, left: 410, top: 56 },
    ])
    .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
    .toFile(join(ROOT, 'evidence/approved-vs-formal.png'));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

