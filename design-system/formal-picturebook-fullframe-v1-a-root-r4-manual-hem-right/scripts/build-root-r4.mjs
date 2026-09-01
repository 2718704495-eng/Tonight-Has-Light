import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSharp } from './sharp-loader.mjs';

const sharp = loadSharp();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, '..');
const projectRoot = path.resolve(packageRoot, '../..');
const sourceR2 = path.join(
  projectRoot,
  'design-system/formal-picturebook-fullframe-v1-a-root-r2-wind-hem/source/masters/root_night_slope_v2-wind-hem-master-2x.png',
);
const frame = 'root_night_slope_v4-manual-hem-right';
const masterPath = path.join(packageRoot, 'source/masters', `${frame}-master-2x.png`);
const patchSvgPath = path.join(packageRoot, 'source/masters', `${frame}-manual-patch.svg`);
const roi = { left: 42, top: 1310, width: 360, height: 170 };

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

function patchSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${roi.width}" height="${roi.height}" viewBox="0 0 ${roi.width} ${roi.height}">
  <defs>
    <filter id="soft" x="-15%" y="-15%" width="130%" height="130%">
      <feGaussianBlur stdDeviation="1.2"/>
    </filter>
    <pattern id="knit" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)">
      <path d="M0 5 H9" stroke="#344b5d" stroke-width="0.7" opacity="0.25"/>
    </pattern>
  </defs>

  <!-- Reduce the old screen-left flap without creating a hard rectangle. -->
  <path d="M0 38 C34 22 78 25 118 43 C148 57 166 77 173 99 C126 107 76 107 26 95 C11 80 3 58 0 38Z" fill="#061426" opacity="0.34" filter="url(#soft)"/>
  <path d="M0 74 C45 54 95 64 160 97" fill="none" stroke="#0b1b2d" stroke-width="4.6" opacity="0.46" stroke-linecap="round"/>
  <path d="M8 96 C55 79 108 88 170 122" fill="none" stroke="#20364a" stroke-width="2.8" opacity="0.38" stroke-linecap="round"/>
  <path d="M10 118 C59 98 118 105 185 142" fill="none" stroke="#647780" stroke-width="1.5" opacity="0.28" stroke-linecap="round"/>
  <path d="M34 128 C82 110 135 116 194 149" fill="none" stroke="#07101f" stroke-width="4.2" opacity="0.36" stroke-linecap="round"/>

  <!-- Screen-right lifted hem as one low-contrast cloth surface, not motion lines. -->
  <path d="M132 55
           C162 49 199 54 232 69
           C249 77 263 88 273 101
           C241 97 207 88 174 77
           C153 70 139 63 126 58
           C128 57 130 56 132 55Z"
        fill="#223549" opacity="0.50"/>
  <path d="M132 55
           C162 49 199 54 232 69
           C249 77 263 88 273 101
           C241 97 207 88 174 77
           C153 70 139 63 126 58
           C128 57 130 56 132 55Z"
        fill="url(#knit)" opacity="0.25"/>
  <path d="M131 56 C162 51 199 56 235 73" fill="none" stroke="#7d8788" stroke-width="1.15" stroke-linecap="round" opacity="0.30"/>
  <path d="M140 68 C169 75 204 87 244 103" fill="none" stroke="#091626" stroke-width="2.3" stroke-linecap="round" opacity="0.32"/>
  <path d="M156 74 C171 82 188 91 204 101" fill="none" stroke="#405565" stroke-width="0.9" stroke-linecap="round" opacity="0.18"/>
</svg>`;
}

function oldHemMaskSvg(width, height) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="black"/>
    <path d="M0 30 C38 9 82 8 128 27 C158 40 177 58 190 81 C144 90 92 91 39 84 C15 74 3 54 0 30Z" fill="white"/>
  </svg>`;
}

function oldHemCoverMaskSvg(width, height) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="black"/>
    <path d="M0 2 C40 0 86 4 129 25 C160 40 180 59 192 85 C146 104 86 106 25 94 C9 73 2 38 0 2Z" fill="white"/>
  </svg>`;
}

async function alphaFromSvg(svg, width, height) {
  return sharp(Buffer.from(svg))
    .resize(width, height, { fit: 'fill' })
    .removeAlpha()
    .greyscale()
    .raw()
    .toBuffer();
}

async function makeMirroredHem() {
  const crop = { left: 42, top: 1340, width: 190, height: 92 };
  const maskAlpha = await alphaFromSvg(oldHemMaskSvg(crop.width, crop.height), crop.width, crop.height);
  const cropBuffer = await sharp(sourceR2)
    .extract(crop)
    .removeAlpha()
    .joinChannel(maskAlpha, { raw: { width: crop.width, height: crop.height, channels: 1 } })
    .png()
    .toBuffer();
  const extracted = await sharp(cropBuffer)
    .flop()
    .resize(164, 78, { fit: 'fill' })
    .png()
    .toBuffer();
  return extracted;
}


async function writeExports() {
  const targets = [
    { key: '390x844', width: 390, height: 844, exact: true },
    { key: '195x422', width: 195, height: 422, exact: true },
    { key: '360x800', width: 360, height: 800, exact: false },
    { key: '430x932', width: 430, height: 932, exact: false },
    { key: '430x844-pressure', width: 430, height: 844, exact: false },
  ];
  const outputs = {};
  for (const target of targets) {
    const outputPath = path.join(packageRoot, 'exports', target.key, `${frame}.png`);
    await mkdir(path.dirname(outputPath), { recursive: true });
    const resizeOptions = target.exact
      ? { fit: 'fill' }
      : {
          fit: 'contain',
          position: 'centre',
          background: { r: 6, g: 38, b: 95, alpha: 1 },
        };
    await sharp(masterPath)
      .resize(target.width, target.height, resizeOptions)
      .ensureAlpha(1)
      .withIccProfile('srgb')
      .png({ compressionLevel: 9, adaptiveFiltering: false })
      .toFile(outputPath);
    const metadata = await sharp(outputPath).metadata();
    outputs[target.key] = {
      path: path.relative(projectRoot, outputPath),
      width: metadata.width,
      height: metadata.height,
      sha256: await sha256(outputPath),
    };
  }
  return outputs;
}

async function writeBoards() {
  const evidenceDir = path.join(packageRoot, 'evidence');
  await mkdir(evidenceDir, { recursive: true });
  const r2Full = path.join(projectRoot, 'design-system/formal-picturebook-fullframe-v1-a-root-r2-wind-hem/exports/390x844/root_night_slope_v2-wind-hem.png');
  const r2Small = path.join(projectRoot, 'design-system/formal-picturebook-fullframe-v1-a-root-r2-wind-hem/exports/195x422/root_night_slope_v2-wind-hem.png');
  const r4Full = path.join(packageRoot, 'exports/390x844', `${frame}.png`);
  const r4Small = path.join(packageRoot, 'exports/195x422', `${frame}.png`);
  await sharp({
    create: { width: 852, height: 892, channels: 4, background: { r: 6, g: 38, b: 95, alpha: 1 } },
  })
    .composite([
      { input: r2Full, left: 24, top: 24 },
      { input: r4Full, left: 438, top: 24 },
    ])
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toFile(path.join(evidenceDir, 'root-r2-r4-compare-390.png'));
  await sharp({
    create: { width: 426, height: 446, channels: 4, background: { r: 6, g: 38, b: 95, alpha: 1 } },
  })
    .composite([
      { input: r2Small, left: 12, top: 12 },
      { input: r4Small, left: 219, top: 12 },
    ])
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toFile(path.join(evidenceDir, 'root-r2-r4-compare-195.png'));
  await sharp(masterPath)
    .extract({ left: 40, top: 1260, width: 420, height: 300 })
    .resize(840, 600, { fit: 'fill' })
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toFile(path.join(evidenceDir, 'root-r4-hem-crop-2x.png'));
}

async function writeDiffReport() {
  const r2Raw = await sharp(sourceR2).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const r4Raw = await sharp(masterPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let changedPixels = 0;
  let outsideRoiChanged = 0;
  const bounds = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
  for (let y = 0; y < r2Raw.info.height; y += 1) {
    for (let x = 0; x < r2Raw.info.width; x += 1) {
      const offset = (y * r2Raw.info.width + x) * 4;
      let changed = false;
      for (let channel = 0; channel < 4; channel += 1) {
        if (r2Raw.data[offset + channel] !== r4Raw.data[offset + channel]) {
          changed = true;
          break;
        }
      }
      if (!changed) continue;
      changedPixels += 1;
      bounds.left = Math.min(bounds.left, x);
      bounds.top = Math.min(bounds.top, y);
      bounds.right = Math.max(bounds.right, x);
      bounds.bottom = Math.max(bounds.bottom, y);
      const inside =
        x >= roi.left &&
        x < roi.left + roi.width &&
        y >= roi.top &&
        y < roi.top + roi.height;
      if (!inside) outsideRoiChanged += 1;
    }
  }
  const report = {
    source_r2_master: path.relative(projectRoot, sourceR2),
    r4_master: path.relative(projectRoot, masterPath),
    declared_roi_master_px: roi,
    changed_pixels: changedPixels,
    changed_bounds_master_px: bounds,
    outside_declared_roi_changed_pixels: outsideRoiChanged,
    pass_outside_roi_unchanged: outsideRoiChanged === 0,
    unchanged_policy: 'Pixels outside the declared ROI must be byte-identical to R2.',
  };
  await writeFile(path.join(packageRoot, 'evidence/pixel-diff-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

async function writeManifest(outputs, diffReport) {
  const metadata = await sharp(masterPath).metadata();
  const manifest = {
    candidate_id: 'formal-picturebook-root-wind-hem-v1-a-r4-manual-local-repaint',
    contract_id: 'ROOT-WIND-HEM-V1-A-R4',
    date: '2026-08-30',
    status: 'LOCAL_MANUAL_PATCH_CANDIDATE_AWAITING_USER_VISUAL_APPROVAL',
    source_property: 'ai-assisted-formal-fullframe-r2-plus-manual-local-repaint',
    approval: {
      phrase: '批准 ROOT-WIND-HEM-V1-A-R4：人工局部重绘衣角，不再整体重生成',
      record_path: 'docs/ROOT-WIND-HEM-V1-A-R4-APPROVAL.md',
      record_sha256: await sha256(path.join(projectRoot, 'docs/ROOT-WIND-HEM-V1-A-R4-APPROVAL.md')),
    },
    permissions: {
      cocos: false,
      build: false,
      wechat_preview: false,
      wechat_upload: false,
      review_submission: false,
      public_release: false,
      git_commit_or_push: false,
    },
    source_r2: {
      path: path.relative(projectRoot, sourceR2),
      sha256: await sha256(sourceR2),
    },
    manual_patch: {
      path: path.relative(projectRoot, patchSvgPath),
      sha256: await sha256(patchSvgPath),
      edit_roi_master_px: roi,
      method: 'hand-authored local SVG patch composited into R2; no whole-image regeneration',
    },
    page: {
      page_id: 'root_night_slope_v4_manual_hem_right',
      asset_id: 'ART-OUTDOOR-ROOT-WIND-HEM-003',
      not_in_build: true,
      master_path: path.relative(projectRoot, masterPath),
      master_sha256: await sha256(masterPath),
      width: metadata.width,
      height: metadata.height,
      space: metadata.space,
      channels: metadata.channels,
      depth: metadata.depth,
      exports: Object.fromEntries(Object.entries(outputs).map(([key, value]) => [key, value.sha256])),
    },
    diff_report: {
      path: 'design-system/formal-picturebook-fullframe-v1-a-root-r4-manual-hem-right/evidence/pixel-diff-report.json',
      outside_declared_roi_changed_pixels: diffReport.outside_declared_roi_changed_pixels,
      changed_bounds_master_px: diffReport.changed_bounds_master_px,
    },
    unaffected_frozen_pages: [
      {
        page_id: 'scene_02_stargaze_shot_005',
        sha256: await sha256('design-system/formal-picturebook-fullframe-v1-a-batch1/source/masters/scene_02_stargaze_shot_005-master-2x.png'),
      },
      {
        page_id: 'scene_01_home_shot_005',
        sha256: await sha256('design-system/formal-picturebook-fullframe-v1-a-batch1/source/masters/scene_01_home_shot_005-master-2x.png'),
      },
    ],
  };
  await writeFile(path.join(packageRoot, 'candidate-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

async function writeProvenance() {
  const provenance = {
    asset_id: 'ART-OUTDOOR-ROOT-WIND-HEM-003',
    candidate_id: 'formal-picturebook-root-wind-hem-v1-a-r4-manual-local-repaint',
    purpose: 'manual local repaint of the adult sweater hem direction',
    date: '2026-08-30',
    author: 'Codex main task',
    source: {
      type: 'frozen R2 master',
      path: path.relative(projectRoot, sourceR2),
      sha256: await sha256(sourceR2),
    },
    process: [
      'Declared a master-space ROI for the sweater hem only.',
      'Hand-authored an SVG patch to reduce the old screen-left flap with grass-shadow strokes.',
      'Hand-authored a smaller screen-right lifted hem shape with cloth hatch, seam marks and cold rim highlights.',
      'Composited the patch over R2 and verified outside-ROI byte identity.',
    ],
    rights_boundary: 'No new third-party IP. No whole-frame generation. Not authorized for runtime or WeChat until same-file user approval.',
  };
  await writeFile(path.join(packageRoot, 'provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`);
}

await mkdir(path.dirname(masterPath), { recursive: true });
await writeFile(patchSvgPath, patchSvg());
await sharp(sourceR2)
  .composite([
    { input: Buffer.from(patchSvg()), left: roi.left, top: roi.top },
  ])
  .ensureAlpha(1)
  .withIccProfile('srgb')
  .png({ compressionLevel: 9, adaptiveFiltering: false })
  .toFile(masterPath);

const outputs = await writeExports();
await writeBoards();
const diffReport = await writeDiffReport();
await writeProvenance();
await writeManifest(outputs, diffReport);

process.stdout.write(`${JSON.stringify({
  frame,
  master: {
    path: path.relative(projectRoot, masterPath),
    sha256: await sha256(masterPath),
  },
  patch: {
    path: path.relative(projectRoot, patchSvgPath),
    sha256: await sha256(patchSvgPath),
    roi,
  },
  outputs,
  diffReport,
}, null, 2)}\n`);
