import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { PACKAGE_ROOT, PROJECT_ROOT, readJson, sha256File } from './package-utils.mjs';
import { loadSharp } from './sharp-loader.mjs';

const PAGE_ID = 'scene_01_home_shot_003';
const H2_PAGE_ID = 'scene_01_home_shot_002';
const H5_PAGE_ID = 'scene_01_home_shot_005';
const EVIDENCE_ROOT = resolve(PACKAGE_ROOT, 'pages', PAGE_ID, 'evidence');
const H3_CANDIDATE = resolve(PACKAGE_ROOT, 'pages', PAGE_ID, 'candidate-manifest.json');
const H3_EXPORT_METADATA = resolve(PACKAGE_ROOT, 'pages', PAGE_ID, 'export-metadata.json');
const H2_390 = resolve(PACKAGE_ROOT, 'pages', H2_PAGE_ID, 'exports', '390x844', `${H2_PAGE_ID}.png`);
const H2_195 = resolve(PACKAGE_ROOT, 'pages', H2_PAGE_ID, 'exports', '195x422', `${H2_PAGE_ID}.png`);
const H3_390 = resolve(PACKAGE_ROOT, 'pages', PAGE_ID, 'exports', '390x844', `${PAGE_ID}.png`);
const H3_195 = resolve(PACKAGE_ROOT, 'pages', PAGE_ID, 'exports', '195x422', `${PAGE_ID}.png`);
const H5_390 = resolve(PROJECT_ROOT, 'design-system/formal-picturebook-fullframe-v1-a-home-f5-wide-room-v1-a-r1/exports/390x844/scene_01_home_shot_005.png');
const H5_195 = resolve(PROJECT_ROOT, 'design-system/formal-picturebook-fullframe-v1-a-home-f5-wide-room-v1-a-r1/exports/195x422/scene_01_home_shot_005.png');
const SAFE_BORDER = '#06265F';

function relativePath(filePath) {
  return filePath.slice(PROJECT_ROOT.length + 1);
}

function svg(width, height, body) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <style>
      .label { font-family: 'PingFang SC', 'Noto Sans CJK SC', sans-serif; font-size: 17px; font-weight: 700; fill: #fff7df; }
      .small { font-family: 'PingFang SC', 'Noto Sans CJK SC', sans-serif; font-size: 14px; font-weight: 700; fill: #fff7df; }
      .note { font-family: 'PingFang SC', 'Noto Sans CJK SC', sans-serif; font-size: 13px; font-weight: 600; fill: #06265F; }
    </style>${body}</svg>`);
}

function header(width, text, height = 56) {
  return svg(width, height, `<rect width="${width}" height="${height}" fill="${SAFE_BORDER}"/><text class="label" x="16" y="35">${text}</text>`);
}

function annotation(x, y, width, text) {
  return `<rect x="${x}" y="${y}" width="${width}" height="24" rx="4" fill="#fff7df" fill-opacity="0.96"/><text class="note" x="${x + 7}" y="${y + 17}">${text}</text>`;
}

async function imageRecord(sharp, filePath) {
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
  return imageRecord(sharp, outputPath);
}

async function buildTriptych(sharp, paths, width, height, outputPath, label) {
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

async function buildRoomAnchorBoard(sharp, outputPath) {
  const annotations = svg(390, 844, `<g fill="none" stroke="#fff7df" stroke-width="2" stroke-dasharray="5 4">
    <rect x="1" y="58" width="105" height="300"/><rect x="14" y="170" width="90" height="245"/>
    <path d="M138 52 L382 52 L382 718 L138 718 Z"/><path d="M44 764 L334 500" marker-end="url(#arrow)"/>
  </g><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#fff7df"/></marker></defs>
  ${annotation(8, 62, 62, '门框')}${annotation(8, 145, 175, '原主屋窗 / 灯 / 低桌')}
  ${annotation(184, 68, 128, '墙 / 地材料')}${annotation(46, 771, 122, '暖光方向 ↗')}`);
  return writePng(sharp, outputPath, sharp(H3_390).composite([{ input: annotations, top: 0, left: 0 }]));
}

async function buildDishContinuityBoard(sharp, outputPath) {
  const headerHeight = 56;
  const h3Crop = await sharp(H3_390).extract({ left: 198, top: 350, width: 174, height: 190 }).resize(220, 240, { fit: 'cover' }).png().toBuffer();
  const h5Crop = await sharp(H5_390).extract({ left: 155, top: 500, width: 175, height: 170 }).resize(220, 240, { fit: 'cover' }).png().toBuffer();
  const labels = svg(780, 304, `<text class="small" x="32" y="25">H3 实际：浅圆盘／盛菜动作</text>
    <rect x="280" y="47" width="220" height="190" rx="8" fill="#fff7df" fill-opacity="0.96"/>
    <text class="note" x="306" y="106">H4：未来目标</text><text class="note" x="298" y="132">未生成 H4 图像</text><text class="note" x="306" y="158">不伪造中间画面</text>
    <text class="small" x="542" y="25">H5 实际：中央浅圆盘／成菜</text>`);
  return writePng(sharp, outputPath, sharp({
    create: { width: 780, height: 360, channels: 4, background: SAFE_BORDER },
  }).composite([
    { input: header(780, 'H3 → H4（未来目标）→ H5 菜品连续性｜390 证据', headerHeight), top: 0, left: 0 },
    { input: h3Crop, top: 96, left: 30 },
    { input: h5Crop, top: 96, left: 530 },
    { input: labels, top: 56, left: 0 },
  ]));
}

function assertH3R1(candidate, exportMetadata) {
  if (candidate.pageId !== PAGE_ID || candidate.candidateId !== 'home-meal-h3-serve-hot-dish-v1-a-r1') {
    throw new Error('H3 evidence accepts only scene_01_home_shot_003 r1.');
  }
  if (candidate.generation?.acceptedVersionForReview !== 'r1' || exportMetadata.pageId !== PAGE_ID || exportMetadata.candidateVersion !== 'r1') {
    throw new Error('H3 evidence requires exported r1 metadata.');
  }
  if (exportMetadata.exports?.['390x844']?.path !== relativePath(H3_390) || exportMetadata.exports?.['195x422']?.path !== relativePath(H3_195)) {
    throw new Error('H3 r1 review export paths do not match the fixed continuity inputs.');
  }
}

export async function buildH3ReviewBoards({ pageId = PAGE_ID } = {}) {
  if (pageId !== PAGE_ID) throw new Error(`This evidence builder only accepts ${PAGE_ID}.`);

  const sharp = await loadSharp();
  const [candidate, exportMetadata] = await Promise.all([readJson(H3_CANDIDATE), readJson(H3_EXPORT_METADATA)]);
  assertH3R1(candidate, exportMetadata);

  const outputPaths = {
    h2H3H5Story390: resolve(EVIDENCE_ROOT, 'h2-h3-h5-story-390.png'),
    h2H3H5Story195: resolve(EVIDENCE_ROOT, 'h2-h3-h5-story-195.png'),
    h3RoomAnchors390: resolve(EVIDENCE_ROOT, 'h3-room-anchors-390.png'),
    h3H5DishContinuity390: resolve(EVIDENCE_ROOT, 'h3-h5-dish-continuity-390.png'),
  };
  const outputs = {
    h2H3H5Story390: await buildTriptych(sharp, [H2_390, H3_390, H5_390], 390, 844, outputPaths.h2H3H5Story390, 'H2 已放下外衣 → H3 厨房盛菜 → H5 回到饭桌｜390 证据'),
    h2H3H5Story195: await buildTriptych(sharp, [H2_195, H3_195, H5_195], 195, 422, outputPaths.h2H3H5Story195, 'H2 已放下外衣 → H3 厨房盛菜 → H5 回到饭桌｜195 缩略证据'),
    h3RoomAnchors390: await buildRoomAnchorBoard(sharp, outputPaths.h3RoomAnchors390),
    h3H5DishContinuity390: await buildDishContinuityBoard(sharp, outputPaths.h3H5DishContinuity390),
  };
  const inputs = {
    h2: { export390: await imageRecord(sharp, H2_390), export195: await imageRecord(sharp, H2_195) },
    h3: { candidateVersion: 'r1', export390: await imageRecord(sharp, H3_390), export195: await imageRecord(sharp, H3_195) },
    h5: { export390: await imageRecord(sharp, H5_390), export195: await imageRecord(sharp, H5_195) },
  };
  const sequence = [
    { pageId: H2_PAGE_ID, state: 'outerwear put down' },
    { pageId: PAGE_ID, state: 'serving hot dish in connected kitchen' },
    { pageId: H5_PAGE_ID, state: 'returned to dinner table' },
  ];
  const annotations = {
    roomAnchors: ['door frame', 'original main-room window / lamp / low table', 'wall / floor material', 'warm light direction'],
  };
  const dishContinuity = {
    source: 'H3 actual shallow round plate and hot-dish serving crop',
    futureTarget: 'H4 is a future target only; no H4 image is generated or baked into this evidence.',
    result: 'H5 actual central shallow round plate and finished-dish crop',
  };
  const evidenceBoundary = {
    cleanPlate: false,
    userApproved: false,
    chineseLabelsBakedInEvidenceOnly: true,
    h4Generated: false,
  };
  const report = {
    schemaVersion: 1,
    status: 'BUILT / VISUAL REVIEW REQUIRED',
    deterministic: true,
    pageId,
    inputs,
    sequence,
    annotations,
    dishContinuity,
    outputs,
    evidenceBoundary,
    notes: [
      'The 390 and 195 triptychs read H2 outerwear put down → H3 kitchen serving → H5 returned to the dinner table.',
      'The dish board uses actual crops from H3 and H5 only; H4 remains a future target and no H4 image is generated.',
      'Chinese labels are baked only into evidence boards, never into H2, H3, or H5 clean plates.',
      'This is continuity evidence, not a clean plate, Gate B visual PASS, or user approval.',
    ],
  };
  await writeFile(resolve(EVIDENCE_ROOT, 'build-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  return { status: 'BUILT', inputs, sequence, annotations, dishContinuity, outputs, evidenceBoundary };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pageIdIndex = process.argv.indexOf('--page-id');
  const pageId = pageIdIndex === -1 ? PAGE_ID : process.argv[pageIdIndex + 1];
  process.stdout.write(`${JSON.stringify(await buildH3ReviewBoards({ pageId }), null, 2)}\n`);
}
