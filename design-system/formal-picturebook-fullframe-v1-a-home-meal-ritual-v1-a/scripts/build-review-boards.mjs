import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { PACKAGE_ROOT, PROJECT_ROOT, readJson, sha256File } from './package-utils.mjs';
import { loadSharp } from './sharp-loader.mjs';

const PAGE_ID = 'scene_01_home_shot_001';
const H1_EVIDENCE = resolve(PACKAGE_ROOT, 'pages', PAGE_ID, 'evidence');
const H1_CANDIDATE = resolve(PACKAGE_ROOT, 'pages', PAGE_ID, 'candidate-manifest.json');
const H1_390 = resolve(PACKAGE_ROOT, 'pages', PAGE_ID, 'exports', '390x844', `${PAGE_ID}.png`);
const H1_195 = resolve(PACKAGE_ROOT, 'pages', PAGE_ID, 'exports', '195x422', `${PAGE_ID}.png`);
const H5_390 = resolve(PROJECT_ROOT, 'design-system/formal-picturebook-fullframe-v1-a-home-f5-wide-room-v1-a-r1/exports/390x844/scene_01_home_shot_005.png');
const H5_195 = resolve(PROJECT_ROOT, 'design-system/formal-picturebook-fullframe-v1-a-home-f5-wide-room-v1-a-r1/exports/195x422/scene_01_home_shot_005.png');
const ROOT_R4_390 = resolve(PROJECT_ROOT, 'design-system/formal-picturebook-fullframe-v1-a-root-r4-manual-hem/exports/390x844/root_night_slope_v2-wind-hem-r4-manual.png');
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
  return { path: relativePath(filePath), sha256: await sha256File(filePath), width: metadata.width, height: metadata.height, format: metadata.format };
}

async function writePng(sharp, outputPath, pipeline) {
  await mkdir(dirname(outputPath), { recursive: true });
  await pipeline.png({ compressionLevel: 9, palette: false, force: true }).toFile(outputPath);
  return imageRecord(sharp, outputPath);
}

async function buildSideBySide(sharp, leftPath, rightPath, width, height, outputPath, label) {
  const boardWidth = width * 2;
  const headerHeight = 56;
  return writePng(sharp, outputPath, sharp({ create: { width: boardWidth, height: height + headerHeight, channels: 4, background: SAFE_BORDER } }).composite([
    { input: header(boardWidth, label, headerHeight), top: 0, left: 0 },
    { input: leftPath, top: headerHeight, left: 0 },
    { input: rightPath, top: headerHeight, left: width },
  ]));
}

async function buildLandmarkBoard(sharp, outputPath) {
  const annotations = svg(390, 844, `<g fill="none" stroke="#fff7df" stroke-width="2" stroke-dasharray="5 4">
    <rect x="0" y="179" width="25" height="500"/><rect x="43" y="235" width="72" height="46"/>
    <rect x="102" y="503" width="230" height="168"/><rect x="244" y="197" width="124" height="210"/>
    <path d="M167 112 L167 500"/><path d="M250 785 L318 708" marker-end="url(#arrow)"/>
  </g><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#fff7df"/></marker></defs>
  ${annotation(8, 183, 72, '左门槛')}${annotation(38, 216, 72, '空挂钩')}${annotation(116, 646, 50, '桌')}
  ${annotation(268, 199, 57, '右窗')}${annotation(174, 120, 58, '墙角')}${annotation(222, 789, 104, '地板方向 →')}`);
  return writePng(sharp, outputPath, sharp(H1_390).composite([{ input: annotations, top: 0, left: 0 }]));
}

async function buildContinuityBoard(sharp, outputPath) {
  const root = await sharp(ROOT_R4_390).resize(240, 520, { fit: 'contain', background: SAFE_BORDER }).png().toBuffer();
  const h1 = await sharp(H1_390).resize(240, 520, { fit: 'contain', background: SAFE_BORDER }).png().toBuffer();
  const h5 = await sharp(H5_390).resize(240, 520, { fit: 'contain', background: SAFE_BORDER }).png().toBuffer();
  const h1Table = await sharp(H1_390).extract({ left: 75, top: 430, width: 290, height: 280 }).resize(360, 350, { fit: 'contain', background: SAFE_BORDER }).png().toBuffer();
  const h5Table = await sharp(H5_390).extract({ left: 75, top: 420, width: 290, height: 280 }).resize(360, 350, { fit: 'contain', background: SAFE_BORDER }).png().toBuffer();
  return writePng(sharp, outputPath, sharp({ create: { width: 780, height: 1086, channels: 4, background: SAFE_BORDER } }).composite([
    { input: header(780, '外搭与饭桌连续性检查（证据，不是 clean plate）'), top: 0, left: 0 },
    { input: root, top: 82, left: 0 }, { input: h1, top: 82, left: 270 }, { input: h5, top: 82, left: 540 },
    { input: svg(780, 34, '<text class="small" x="12" y="22">Root R4 外搭</text><text class="small" x="282" y="22">H1 r2：灰蓝外搭；不应显示深色内搭</text><text class="small" x="552" y="22">H5：左挂钩结果</text>'), top: 604, left: 0 },
    { input: h1Table, top: 670, left: 15 }, { input: h5Table, top: 670, left: 405 },
    { input: svg(780, 66, '<text class="small" x="16" y="23">H1 桌面：壶／恰好两杯／饭／汤／空盘</text><text class="small" x="406" y="23">H5 桌面：最终热菜</text><text class="small" x="16" y="51">检查：H1 不得提前出现最终热菜</text>'), top: 1020, left: 0 },
  ]));
}

function assertH1R2(candidate) {
  if (candidate.pageId !== PAGE_ID || candidate.generation?.acceptedVersionForReview !== 'r2') throw new Error('Continuity evidence accepts only scene_01_home_shot_001 r2.');
  if (candidate.reviewExports?.['390x844']?.path !== relativePath(H1_390) || candidate.reviewExports?.['195x422']?.path !== relativePath(H1_195)) {
    throw new Error('H1 r2 review export paths do not match the fixed continuity inputs.');
  }
}

export async function buildReviewBoards({ pageId = PAGE_ID } = {}) {
  if (pageId !== PAGE_ID) throw new Error(`This evidence builder only accepts ${PAGE_ID}.`);
  const sharp = await loadSharp();
  const candidate = await readJson(H1_CANDIDATE);
  assertH1R2(candidate);
  const outputPaths = {
    h1H5SideBySide390: resolve(H1_EVIDENCE, 'h1-h5-side-by-side-390.png'),
    h1H5SideBySide195: resolve(H1_EVIDENCE, 'h1-h5-side-by-side-195.png'),
    landmarks390: resolve(H1_EVIDENCE, 'h1-landmarks-390.png'),
    continuityCheck390: resolve(H1_EVIDENCE, 'h1-continuity-check-390.png'),
  };
  const outputs = {
    h1H5SideBySide390: await buildSideBySide(sharp, H1_390, H5_390, 390, 844, outputPaths.h1H5SideBySide390, 'H1 r2（左）↔ 批准 H5（右）｜390 对照'),
    h1H5SideBySide195: await buildSideBySide(sharp, H1_195, H5_195, 195, 422, outputPaths.h1H5SideBySide195, 'H1 r2（左）↔ 批准 H5（右）｜195 对照'),
    landmarks390: await buildLandmarkBoard(sharp, outputPaths.landmarks390),
    continuityCheck390: await buildContinuityBoard(sharp, outputPaths.continuityCheck390),
  };
  const inputs = {
    h1: { candidateVersion: 'r2', export390: await imageRecord(sharp, H1_390), export195: await imageRecord(sharp, H1_195) },
    h5: { approved: true, export390: await imageRecord(sharp, H5_390), export195: await imageRecord(sharp, H5_195) },
    rootR4: { approved: true, export390: await imageRecord(sharp, ROOT_R4_390) },
  };
  const report = {
    schemaVersion: 1,
    status: 'BUILT / VISUAL REVIEW REQUIRED',
    deterministic: true,
    pageId,
    inputs,
    outputs,
    notes: [
      'H1 uses the candidate manifest’s accepted r2 export only; r1 is not consumed.',
      'Chinese labels are baked only into evidence boards, never into any clean plate.',
      'This is continuity evidence, not a Gate B visual PASS or user approval.',
    ],
  };
  await writeFile(resolve(H1_EVIDENCE, 'build-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  return { status: 'BUILT', inputs, outputs };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pageIdIndex = process.argv.indexOf('--page-id');
  const pageId = pageIdIndex === -1 ? PAGE_ID : process.argv[pageIdIndex + 1];
  process.stdout.write(`${JSON.stringify(await buildReviewBoards({ pageId }), null, 2)}\n`);
}
