import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSharp } from '../../formal-picturebook-fullframe-v1-a-batch1/scripts/sharp-loader.mjs';

const sharp = loadSharp();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const candidateRoot = path.resolve(scriptDir, '..');
const projectRoot = path.resolve(candidateRoot, '../..');

const candidateId = 'formal-picturebook-home-f5-wide-room-v1-a-r1';
const pageId = 'scene_01_home_shot_005';
const rawPath = path.join(candidateRoot, 'source/raw/scene_01_home_shot_005-wide-room-imagegen-r1.png');
const masterPath = path.join(candidateRoot, 'source/masters/scene_01_home_shot_005-wide-room-master-2x.png');
const old390 = path.join(projectRoot, 'design-system/formal-picturebook-fullframe-v1-a-batch1/exports/390x844/scene_01_home_shot_005.png');
const old195 = path.join(projectRoot, 'design-system/formal-picturebook-fullframe-v1-a-batch1/exports/195x422/scene_01_home_shot_005.png');
const crop = { left: 48, top: 0, width: 748, height: 1618 };
const safeBorder = { r: 6, g: 38, b: 95, alpha: 1 };

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

async function metadata(file) {
  const info = await sharp(file).metadata();
  return {
    width: info.width,
    height: info.height,
    space: info.space,
    channels: info.channels,
    depth: info.depth,
    hasAlpha: info.hasAlpha,
  };
}

const rawMetadata = await metadata(rawPath);
if (rawMetadata.width !== 853 || rawMetadata.height !== 1844) {
  throw new Error(`Unexpected raw dimensions: ${rawMetadata.width}x${rawMetadata.height}`);
}

await mkdir(path.dirname(masterPath), { recursive: true });
await sharp(rawPath)
  .extract(crop)
  .resize(780, 1688, { fit: 'fill' })
  .ensureAlpha(1)
  .withIccProfile('srgb')
  .png({ compressionLevel: 9, adaptiveFiltering: false })
  .toFile(masterPath);

const targets = [
  { key: '390x844', width: 390, height: 844, exact: true },
  { key: '195x422', width: 195, height: 422, exact: true },
  { key: '360x800', width: 360, height: 800, exact: false },
  { key: '430x932', width: 430, height: 932, exact: false },
  { key: '430x844-pressure', width: 430, height: 844, exact: false },
];
const exports = {};

for (const target of targets) {
  const outputPath = path.join(candidateRoot, 'exports', target.key, `${pageId}.png`);
  await mkdir(path.dirname(outputPath), { recursive: true });
  const resize = target.exact
    ? { fit: 'fill' }
    : { fit: 'contain', position: 'centre', background: safeBorder };
  await sharp(masterPath)
    .resize(target.width, target.height, resize)
    .ensureAlpha(1)
    .withIccProfile('srgb')
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toFile(outputPath);
  exports[target.key] = {
    path: path.relative(projectRoot, outputPath),
    ...await metadata(outputPath),
    sha256: await sha256(outputPath),
  };
}

function labelSvg(width, height, leftText, rightText, fontSize) {
  const cellWidth = (width - 40) / 2;
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#F0DFBC"/>
      <text x="${cellWidth / 2}" y="${Math.round(height * 0.62)}" text-anchor="middle"
        font-family="PingFang SC, Noto Sans CJK SC, sans-serif" font-size="${fontSize}" font-weight="600" fill="#2E1B12">${leftText}</text>
      <text x="${20 + cellWidth + cellWidth / 2}" y="${Math.round(height * 0.62)}" text-anchor="middle"
        font-family="PingFang SC, Noto Sans CJK SC, sans-serif" font-size="${fontSize}" font-weight="600" fill="#2E1B12">${rightText}</text>
    </svg>
  `);
}

async function buildBoard({ key, cellWidth, cellHeight, headerHeight, fontSize, oldPath, newPath }) {
  const gutter = 20;
  const boardWidth = cellWidth * 2 + gutter * 3;
  const boardHeight = cellHeight + headerHeight + gutter * 2;
  const outputPath = path.join(candidateRoot, 'evidence', `home-f5-old-vs-wide-room-${key}.png`);
  await mkdir(path.dirname(outputPath), { recursive: true });
  const base = {
    create: {
      width: boardWidth,
      height: boardHeight,
      channels: 4,
      background: '#F0DFBC',
    },
  };
  await sharp(base)
    .composite([
      { input: labelSvg(boardWidth, headerHeight, '旧版：餐桌近景', '新版候选：整间屋子', fontSize), left: 0, top: 0 },
      { input: oldPath, left: gutter, top: headerHeight + gutter },
      { input: newPath, left: gutter * 2 + cellWidth, top: headerHeight + gutter },
    ])
    .withIccProfile('srgb')
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toFile(outputPath);
  return {
    path: path.relative(projectRoot, outputPath),
    ...await metadata(outputPath),
    sha256: await sha256(outputPath),
    sources: {
      old: { path: path.relative(projectRoot, oldPath), sha256: await sha256(oldPath) },
      candidate: exports[key],
    },
  };
}

const boards = {
  '390x844': await buildBoard({
    key: '390x844',
    cellWidth: 390,
    cellHeight: 844,
    headerHeight: 60,
    fontSize: 22,
    oldPath: old390,
    newPath: path.resolve(projectRoot, exports['390x844'].path),
  }),
  '195x422': await buildBoard({
    key: '195x422',
    cellWidth: 195,
    cellHeight: 422,
    headerHeight: 44,
    fontSize: 14,
    oldPath: old195,
    newPath: path.resolve(projectRoot, exports['195x422'].path),
  }),
};

const report = {
  schema_version: 1,
  candidate_id: candidateId,
  page_id: pageId,
  generated_on: '2026-08-30',
  deterministic_normalization: {
    crop,
    rationale: 'Remove most of the heavy dark threshold while retaining a thin entry edge and the widest readable room composition. No pixels were generated or painted during normalization.',
    master_resize: '780x1688 fill from locked crop',
    review_exports: 'SHOW_ALL for stress sizes; exact fill for 390x844 and 195x422',
    safe_border: '#06265F',
  },
  raw: {
    path: path.relative(projectRoot, rawPath),
    ...rawMetadata,
    sha256: await sha256(rawPath),
  },
  master: {
    path: path.relative(projectRoot, masterPath),
    ...await metadata(masterPath),
    sha256: await sha256(masterPath),
  },
  exports,
  boards,
};

const reportPath = path.join(candidateRoot, 'evidence/build-report.json');
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
