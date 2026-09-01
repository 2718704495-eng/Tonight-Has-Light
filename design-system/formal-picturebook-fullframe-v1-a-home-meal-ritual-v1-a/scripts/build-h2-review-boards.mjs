import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { PACKAGE_ROOT, PROJECT_ROOT, readJson, sha256File } from './package-utils.mjs';
import { loadSharp } from './sharp-loader.mjs';

const PAGE_ID = 'scene_01_home_shot_002';
const H1_PAGE_ID = 'scene_01_home_shot_001';
const H5_PAGE_ID = 'scene_01_home_shot_005';
const H2_EVIDENCE = resolve(PACKAGE_ROOT, 'pages', PAGE_ID, 'evidence');
const H2_CANDIDATE = resolve(PACKAGE_ROOT, 'pages', PAGE_ID, 'candidate-manifest.json');
const H2_EXPORT_METADATA = resolve(PACKAGE_ROOT, 'pages', PAGE_ID, 'export-metadata.json');
const H1_390 = resolve(PACKAGE_ROOT, 'pages', H1_PAGE_ID, 'exports', '390x844', `${H1_PAGE_ID}.png`);
const H1_195 = resolve(PACKAGE_ROOT, 'pages', H1_PAGE_ID, 'exports', '195x422', `${H1_PAGE_ID}.png`);
const H2_390 = resolve(PACKAGE_ROOT, 'pages', PAGE_ID, 'exports', '390x844', `${PAGE_ID}.png`);
const H2_195 = resolve(PACKAGE_ROOT, 'pages', PAGE_ID, 'exports', '195x422', `${PAGE_ID}.png`);
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

async function buildInnerKnitBoard(sharp, outputPath) {
  return writePng(sharp, outputPath, sharp({
    create: { width: 780, height: 900, channels: 4, background: SAFE_BORDER },
  }).composite([
    { input: header(780, 'H2 深色针织内搭（左）↔ H5 坐姿内搭（右）｜390 证据', 56), top: 0, left: 0 },
    { input: H2_390, top: 56, left: 0 },
    { input: H5_390, top: 56, left: 390 },
  ]));
}

async function buildRoomAnchorBoard(sharp, outputPath) {
  const annotations = svg(390, 844, `<g fill="none" stroke="#fff7df" stroke-width="2" stroke-dasharray="5 4">
    <rect x="2" y="68" width="62" height="568"/><rect x="91" y="175" width="82" height="72"/>
    <rect x="210" y="416" width="164" height="196"/><path d="M234 778 L330 702" marker-end="url(#arrow)"/>
  </g><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#fff7df"/></marker></defs>
  ${annotation(8, 72, 56, '门框')}${annotation(72, 151, 92, '同一左挂钩')}
  ${annotation(226, 392, 70, '柜 / 灯')}${annotation(222, 789, 116, '地板方向 ↗')}`);
  return writePng(sharp, outputPath, sharp(H2_390).composite([{ input: annotations, top: 0, left: 0 }]));
}

function assertH2R1(candidate, exportMetadata) {
  if (candidate.pageId !== PAGE_ID || candidate.candidateId !== 'home-meal-h2-hang-outerwear-v1-a-r1') {
    throw new Error('H2 evidence accepts only scene_01_home_shot_002 r1.');
  }
  if (exportMetadata.pageId !== PAGE_ID || exportMetadata.candidateVersion !== 'r1') {
    throw new Error('H2 evidence requires exported r1 metadata.');
  }
  if (exportMetadata.exports?.['390x844']?.path !== relativePath(H2_390) || exportMetadata.exports?.['195x422']?.path !== relativePath(H2_195)) {
    throw new Error('H2 r1 review export paths do not match the fixed continuity inputs.');
  }
}

export async function buildH2ReviewBoards({ pageId = PAGE_ID } = {}) {
  if (pageId !== PAGE_ID) throw new Error(`This evidence builder only accepts ${PAGE_ID}.`);

  const sharp = await loadSharp();
  const [candidate, exportMetadata] = await Promise.all([readJson(H2_CANDIDATE), readJson(H2_EXPORT_METADATA)]);
  assertH2R1(candidate, exportMetadata);

  const outputPaths = {
    h1H2H5Outerwear390: resolve(H2_EVIDENCE, 'h1-h2-h5-outerwear-390.png'),
    h1H2H5Outerwear195: resolve(H2_EVIDENCE, 'h1-h2-h5-outerwear-195.png'),
    h2H5InnerKnit390: resolve(H2_EVIDENCE, 'h2-h5-inner-knit-390.png'),
    h2RoomAnchors390: resolve(H2_EVIDENCE, 'h2-room-anchors-390.png'),
  };
  const outputs = {
    h1H2H5Outerwear390: await buildTriptych(sharp, [H1_390, H2_390, H5_390], 390, 844, outputPaths.h1H2H5Outerwear390, 'H1 外衣穿着 → H2 挂起动作 → H5 挂起结果｜390 证据'),
    h1H2H5Outerwear195: await buildTriptych(sharp, [H1_195, H2_195, H5_195], 195, 422, outputPaths.h1H2H5Outerwear195, 'H1 外衣穿着 → H2 挂起动作 → H5 挂起结果｜195 缩略证据'),
    h2H5InnerKnit390: await buildInnerKnitBoard(sharp, outputPaths.h2H5InnerKnit390),
    h2RoomAnchors390: await buildRoomAnchorBoard(sharp, outputPaths.h2RoomAnchors390),
  };
  const inputs = {
    h1: { approved: true, export390: await imageRecord(sharp, H1_390), export195: await imageRecord(sharp, H1_195) },
    h2: { candidateVersion: 'r1', export390: await imageRecord(sharp, H2_390), export195: await imageRecord(sharp, H2_195) },
    h5: { approved: true, export390: await imageRecord(sharp, H5_390), export195: await imageRecord(sharp, H5_195) },
  };
  const report = {
    schemaVersion: 1,
    status: 'BUILT / VISUAL REVIEW REQUIRED',
    deterministic: true,
    pageId,
    inputs,
    sequence: [
      { pageId: H1_PAGE_ID, state: 'outerwear worn' },
      { pageId: PAGE_ID, state: 'outerwear hanging action' },
      { pageId: H5_PAGE_ID, state: 'outerwear hanging result' },
    ],
    annotations: {
      roomAnchors: ['door frame', 'same left hook', 'cabinet / lamp', 'floor direction'],
    },
    outputs,
    evidenceBoundary: {
      cleanPlate: false,
      userApproved: false,
      chineseLabelsBakedInEvidenceOnly: true,
    },
    notes: [
      'The 390 and 195 triptychs read H1 outerwear worn → H2 hanging action → H5 hanging result.',
      'Chinese labels are baked only into evidence boards, never into any H1, H2, or H5 clean plate.',
      'This is continuity evidence, not a clean plate, Gate B visual PASS, or user approval.',
    ],
  };
  await writeFile(resolve(H2_EVIDENCE, 'build-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  return { status: 'BUILT', inputs, sequence: report.sequence, annotations: report.annotations, outputs, evidenceBoundary: report.evidenceBoundary };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pageIdIndex = process.argv.indexOf('--page-id');
  const pageId = pageIdIndex === -1 ? PAGE_ID : process.argv[pageIdIndex + 1];
  process.stdout.write(`${JSON.stringify(await buildH2ReviewBoards({ pageId }), null, 2)}\n`);
}
