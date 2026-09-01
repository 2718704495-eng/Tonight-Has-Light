import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSharp } from './sharp-loader.mjs';

const sharp = loadSharp();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const batchRoot = path.resolve(scriptDir, '..');
const projectRoot = path.resolve(batchRoot, '../..');
const evidenceDir = path.join(batchRoot, 'evidence');
const candidateId = 'formal-picturebook-fullframe-v1-a-batch1-r2-r4-root';
const background = { r: 6, g: 25, b: 61, alpha: 1 };

const pages = [
  {
    page: 'root_night_slope_v1',
    title: '根页｜风托起衣角',
    hint: '已批准 · 看右向衣角与天空主次',
    status: 'user-approved',
  },
  {
    page: 'scene_02_stargaze_shot_005',
    title: '看星空 F5｜世界很大',
    hint: '待确认 · 星空是否足够动人',
    status: 'awaiting-user',
  },
  {
    page: 'scene_01_home_shot_005',
    title: '回家 F5｜灯一直亮着',
    hint: '待确认 · 暖屋是否明亮暖心',
    status: 'awaiting-user',
  },
];

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

function escapeXml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function textOverlay({ width, height, titleSize, hintSize, headerTitle, headerSubtitle, pageWidth, gutter, headerHeight, pageHeight }) {
  const labels = pages.map((page, index) => {
    const x = gutter + index * (pageWidth + gutter);
    const titleY = headerHeight + pageHeight + Math.round(titleSize * 1.45);
    const hintY = titleY + Math.round(hintSize * 1.65);
    return `
      <text x="${x}" y="${titleY}" class="page-title">${escapeXml(page.title)}</text>
      <text x="${x}" y="${hintY}" class="page-hint">${escapeXml(page.hint)}</text>`;
  }).join('');
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <style>
        text { font-family: "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif; }
        .header { fill: #F4E9CF; font-size: ${titleSize}px; font-weight: 600; letter-spacing: 0.5px; }
        .subhead { fill: #9FB6D7; font-size: ${hintSize}px; font-weight: 400; }
        .page-title { fill: #F4E9CF; font-size: ${titleSize}px; font-weight: 600; }
        .page-hint { fill: #9FB6D7; font-size: ${hintSize}px; font-weight: 400; }
      </style>
      <text x="${gutter}" y="${Math.round(headerHeight * 0.42)}" class="header">${escapeXml(headerTitle)}</text>
      <text x="${gutter}" y="${Math.round(headerHeight * 0.73)}" class="subhead">${escapeXml(headerSubtitle)}</text>
      ${labels}
    </svg>
  `);
}

async function buildBoard({ folder, pageWidth, pageHeight, gutter, headerHeight, footerHeight, titleSize, hintSize, filename }) {
  const width = pageWidth * pages.length + gutter * (pages.length + 1);
  const height = headerHeight + pageHeight + footerHeight;
  const sources = [];
  const composites = [];

  for (const [index, page] of pages.entries()) {
    const input = path.join(batchRoot, 'exports', folder, `${page.page}.png`);
    const digest = await sha256(input);
    sources.push({
      page_id: page.page,
      status: page.status,
      path: path.relative(projectRoot, input),
      sha256: digest,
    });
    composites.push({
      input,
      left: gutter + index * (pageWidth + gutter),
      top: headerHeight,
    });
  }

  composites.push({
    input: textOverlay({
      width,
      height,
      titleSize,
      hintSize,
      headerTitle: '第一批当前审查板｜R4 根页＋两张 F5',
      headerSubtitle: '文字仅用于审查说明，不会写入正式插画底图',
      pageWidth,
      gutter,
      headerHeight,
      pageHeight,
    }),
    left: 0,
    top: 0,
  });

  const output = path.join(evidenceDir, filename);
  await sharp({ create: { width, height, channels: 4, background } })
    .composite(composites)
    .withIccProfile('srgb')
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toFile(output);

  return {
    path: path.relative(projectRoot, output),
    width,
    height,
    sha256: await sha256(output),
    sources,
  };
}

await mkdir(evidenceDir, { recursive: true });
const full = await buildBoard({
  folder: '390x844',
  pageWidth: 390,
  pageHeight: 844,
  gutter: 24,
  headerHeight: 84,
  footerHeight: 94,
  titleSize: 22,
  hintSize: 15,
  filename: 'review-board-3up.png',
});
const thumbnail = await buildBoard({
  folder: '195x422',
  pageWidth: 195,
  pageHeight: 422,
  gutter: 12,
  headerHeight: 50,
  footerHeight: 66,
  titleSize: 12,
  hintSize: 9,
  filename: 'review-board-3up-195.png',
});

const report = {
  schema_version: 1,
  candidate_id: candidateId,
  generated_on: '2026-08-30',
  text_scope: 'Chinese labels and review hints exist only on the review boards; page exports and clean plates remain text-free.',
  boards: { full, thumbnail },
};
const reportPath = path.join(evidenceDir, 'review-board-source-hashes.json');
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({ report: path.relative(projectRoot, reportPath), ...report }, null, 2)}\n`);
