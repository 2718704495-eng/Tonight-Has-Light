import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadSharp } from './sharp-loader.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(SCRIPT_DIR, '..');
const PROJECT_ROOT = resolve(PACKAGE_ROOT, '../..');
const PAGE_ID = 'scene_02_stargaze_shot_001';
const PAGE_ROOT = resolve(PACKAGE_ROOT, 'pages', PAGE_ID);
const RAW = resolve(PAGE_ROOT, 'source', 'raw', `${PAGE_ID}-imagegen-r1.png`);
const MASTER = resolve(PAGE_ROOT, 'source', 'masters', `${PAGE_ID}-r1-master-2x.png`);
const SAFE_BORDER = '#06265F';
const EXPORTS = Object.freeze({
  '195x422': { width: 195, height: 422 },
  '360x800': { width: 360, height: 800 },
  '390x844': { width: 390, height: 844 },
  '430x932': { width: 430, height: 932 },
  '430x844-pressure': { width: 430, height: 844 },
});

const sha256File = async (path) => createHash('sha256').update(await readFile(path)).digest('hex');
const serializable = (metadata) => ({
  format: metadata.format,
  width: metadata.width,
  height: metadata.height,
  depth: metadata.depth,
  space: metadata.space,
  hasAlpha: Boolean(metadata.hasAlpha),
});

async function main() {
  const sharp = await loadSharp();
  const rawMetadata = await sharp(RAW).metadata();
  await mkdir(dirname(MASTER), { recursive: true });
  await sharp(RAW)
    .rotate()
    .resize(780, 1688, { fit: 'cover', position: 'centre' })
    .toColourspace('srgb')
    .png({ compressionLevel: 9, palette: false, force: true })
    .toFile(MASTER);

  const outputRecords = {};
  for (const [name, dimensions] of Object.entries(EXPORTS)) {
    const output = resolve(PAGE_ROOT, 'exports', name, `${PAGE_ID}.png`);
    await mkdir(dirname(output), { recursive: true });
    await sharp(MASTER)
      .resize(dimensions.width, dimensions.height, {
        fit: 'contain',
        position: 'centre',
        background: SAFE_BORDER,
      })
      .toColourspace('srgb')
      .png({ compressionLevel: 9, palette: false, force: true })
      .toFile(output);
    const metadata = await sharp(output).metadata();
    outputRecords[name] = {
      path: relative(PROJECT_ROOT, output),
      sha256: await sha256File(output),
      metadata: serializable(metadata),
    };
  }

  const result = {
    pageId: PAGE_ID,
    assetId: 'ART-PBOOK-STAR-001',
    candidateVersion: 'r1',
    safeBorder: SAFE_BORDER,
    raw: {
      path: relative(PROJECT_ROOT, RAW),
      sha256: await sha256File(RAW),
      metadata: serializable(rawMetadata),
    },
    master: {
      path: relative(PROJECT_ROOT, MASTER),
      sha256: await sha256File(MASTER),
      metadata: serializable(await sharp(MASTER).metadata()),
    },
    exports: outputRecords,
  };
  await writeFile(resolve(PAGE_ROOT, 'export-metadata.json'), `${JSON.stringify(result, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

await main();
