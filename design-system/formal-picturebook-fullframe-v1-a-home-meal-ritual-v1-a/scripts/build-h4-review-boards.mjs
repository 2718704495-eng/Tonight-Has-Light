import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { PACKAGE_ROOT, PROJECT_ROOT, sha256File } from './package-utils.mjs';
import { loadSharp } from './sharp-loader.mjs';

const H3_ID = 'scene_01_home_shot_003';
const H4_ID = 'scene_01_home_shot_004';
const H5_ID = 'scene_01_home_shot_005';
const H4_ROOT = resolve(PACKAGE_ROOT, 'pages', H4_ID);
const EVIDENCE_ROOT = resolve(H4_ROOT, 'evidence');
const SAFE_BORDER = '#06265F';

const PATHS = {
  h3_390: resolve(PACKAGE_ROOT, 'pages', H3_ID, 'exports/390x844', `${H3_ID}.png`),
  h3_195: resolve(PACKAGE_ROOT, 'pages', H3_ID, 'exports/195x422', `${H3_ID}.png`),
  h4_390: resolve(H4_ROOT, 'exports/390x844', `${H4_ID}.png`),
  h4_195: resolve(H4_ROOT, 'exports/195x422', `${H4_ID}.png`),
  h5_390: resolve(PROJECT_ROOT, 'design-system/formal-picturebook-fullframe-v1-a-home-f5-wide-room-v1-a-r1/exports/390x844/scene_01_home_shot_005.png'),
  h5_195: resolve(PROJECT_ROOT, 'design-system/formal-picturebook-fullframe-v1-a-home-f5-wide-room-v1-a-r1/exports/195x422/scene_01_home_shot_005.png'),
};

function relativePath(filePath) {
  return filePath.slice(PROJECT_ROOT.length + 1);
}

function svg(width, height, body) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <style>
      .title { font-family: 'PingFang SC', 'Noto Sans CJK SC', sans-serif; font-size: 17px; font-weight: 700; fill: #fff7df; }
      .label { font-family: 'PingFang SC', 'Noto Sans CJK SC', sans-serif; font-size: 14px; font-weight: 700; fill: #fff7df; }
      .note { font-family: 'PingFang SC', 'Noto Sans CJK SC', sans-serif; font-size: 13px; font-weight: 700; fill: #06265F; }
    </style>${body}</svg>`);
}

function header(width, text, height = 56) {
  return svg(width, height, `<rect width="${width}" height="${height}" fill="${SAFE_BORDER}"/><text class="title" x="16" y="35">${text}</text>`);
}

async function record(sharp, filePath) {
  const metadata = await sharp(filePath).metadata();
  return {
    path: relativePath(filePath),
    sha256: await sha256File(filePath),
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
  };
}

async function writePng(sharp, outputPath, pipeline) {
  await mkdir(dirname(outputPath), { recursive: true });
  await pipeline.png({ compressionLevel: 9, palette: false, force: true }).toFile(outputPath);
  return record(sharp, outputPath);
}

async function triptych(sharp, paths, width, height, outputPath, label) {
  const headerHeight = 56;
  const boardWidth = width * 3;
  return writePng(sharp, outputPath, sharp({
    create: { width: boardWidth, height: height + headerHeight, channels: 4, background: SAFE_BORDER },
  }).composite([
    { input: header(boardWidth, label, headerHeight), top: 0, left: 0 },
    { input: paths[0], top: headerHeight, left: 0 },
    { input: paths[1], top: headerHeight, left: width },
    { input: paths[2], top: headerHeight, left: width * 2 },
  ]));
}

async function interactionBoard(sharp, outputPath) {
  const overlay = svg(390, 844, `<g fill="none" stroke="#fff7df" stroke-width="2">
    <rect x="154" y="370" width="136" height="102" rx="12"/>
    <rect x="300" y="371" width="62" height="91" rx="12"/>
  </g>
  <rect x="158" y="376" width="88" height="24" rx="5" fill="#fff7df" fill-opacity="0.96"/><text class="note" x="166" y="393">菜品热区</text>
  <rect x="295" y="465" width="88" height="24" rx="5" fill="#fff7df" fill-opacity="0.96"/><text class="note" x="303" y="482">温水热区</text>
  <path d="M290 417 L300 417" stroke="#fff7df" stroke-width="3"/><text class="label" x="247" y="445">间距 ≥ 8px</text>`);
  return writePng(sharp, outputPath, sharp(PATHS.h4_390).composite([{ input: overlay, top: 0, left: 0 }]));
}

async function dishContinuityBoard(sharp, outputPath) {
  const h3 = await sharp(PATHS.h3_390).extract({ left: 188, top: 330, width: 190, height: 215 }).resize(250, 250, { fit: 'cover' }).png().toBuffer();
  const h4 = await sharp(PATHS.h4_390).extract({ left: 125, top: 325, width: 250, height: 230 }).resize(250, 250, { fit: 'cover' }).png().toBuffer();
  const h5 = await sharp(PATHS.h5_390).extract({ left: 135, top: 470, width: 220, height: 220 }).resize(250, 250, { fit: 'cover' }).png().toBuffer();
  const labels = svg(810, 40, `<text class="label" x="54" y="27">H3 盛入浅圆盘</text><text class="label" x="319" y="27">H4 饭桌近景</text><text class="label" x="584" y="27">H5 完成饭桌</text>`);
  return writePng(sharp, outputPath, sharp({
    create: { width: 810, height: 346, channels: 4, background: SAFE_BORDER },
  }).composite([
    { input: header(810, 'H3 → H4 → H5 菜品、器皿与饭桌连续性', 56), top: 0, left: 0 },
    { input: labels, top: 56, left: 0 },
    { input: h3, top: 96, left: 15 },
    { input: h4, top: 96, left: 280 },
    { input: h5, top: 96, left: 545 },
  ]));
}

export async function buildH4ReviewBoards() {
  const sharp = await loadSharp();
  const outputPaths = {
    story390: resolve(EVIDENCE_ROOT, 'h3-h4-h5-story-390.png'),
    story195: resolve(EVIDENCE_ROOT, 'h3-h4-h5-story-195.png'),
    interaction390: resolve(EVIDENCE_ROOT, 'h4-interaction-neighborhoods-390.png'),
    dish390: resolve(EVIDENCE_ROOT, 'h3-h4-h5-dish-continuity-390.png'),
  };
  const outputs = {
    story390: await triptych(sharp, [PATHS.h3_390, PATHS.h4_390, PATHS.h5_390], 390, 844, outputPaths.story390, 'H3 厨房盛菜 → H4 饭桌近景 → H5 暖家全景｜390 证据'),
    story195: await triptych(sharp, [PATHS.h3_195, PATHS.h4_195, PATHS.h5_195], 195, 422, outputPaths.story195, 'H3 厨房盛菜 → H4 饭桌近景 → H5 暖家全景｜195 缩略证据'),
    interaction390: await interactionBoard(sharp, outputPaths.interaction390),
    dish390: await dishContinuityBoard(sharp, outputPaths.dish390),
  };
  const inputs = Object.fromEntries(await Promise.all(Object.entries(PATHS).map(async ([key, filePath]) => [key, await record(sharp, filePath)])));
  const report = {
    schemaVersion: 1,
    status: 'BUILT / H4 CLEAN-PLATE REVIEW BOARDS ONLY / RESPONSE+UI USE SEPARATE REPORTS',
    deterministic: true,
    candidateId: 'home-meal-h4-table-ritual-v1-a-r2',
    inputs,
    outputs,
    interactionGeometry: {
      dish: { x: 154, y: 370, width: 136, height: 102 },
      warmWaterCup: { x: 300, y: 371, width: 62, height: 91 },
      minimumEdgeGapPx: 10,
      requiredEdgeGapPx: 8,
      minimumTargetPx: 44,
    },
    evidenceBoundary: {
      scope: 'clean-plate-review-boards-only',
      cleanPlateModified: false,
      chineseLabelsBakedInEvidenceOnly: true,
      responseLayersProducedByThisBuilder: false,
      responseStateReport: 'design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_004/evidence/h4-response-state-report.json',
      quietUiBuildReport: 'design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/ui/evidence/build-report.json',
      userApproved: false,
    },
  };
  await writeFile(resolve(EVIDENCE_ROOT, 'build-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.stdout.write(`${JSON.stringify(await buildH4ReviewBoards(), null, 2)}\n`);
}
