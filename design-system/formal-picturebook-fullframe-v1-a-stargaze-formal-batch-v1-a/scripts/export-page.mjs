import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadSharp } from './sharp-loader.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(SCRIPT_DIR, '..');
const PROJECT_ROOT = resolve(PACKAGE_ROOT, '../..');
const SAFE_BORDER = '#06265F';

const PAGE_CONFIG = {
  scene_02_stargaze_shot_002: {
    pageName: '银河深处',
    assetId: 'ART-PBOOK-STAR-002',
    candidateId: 'stargaze-formal-batch-v1-a-f2-r1',
    rawName: 'scene_02_stargaze_shot_002-imagegen-r1.png',
  },
  scene_02_stargaze_shot_003: {
    pageName: '薄云经过',
    assetId: 'ART-PBOOK-STAR-003',
    candidateId: 'stargaze-formal-batch-v1-a-f3-r2',
    rawName: 'scene_02_stargaze_shot_003-imagegen-r2-targeted-repair.png',
    generationCount: 1,
    targetedRepairCount: 1,
  },
  scene_02_stargaze_shot_004: {
    pageName: '云缝重开',
    assetId: 'ART-PBOOK-STAR-004',
    candidateId: 'stargaze-formal-batch-v1-a-f4-r1',
    rawName: 'scene_02_stargaze_shot_004-imagegen-r1.png',
    generationCount: 1,
    targetedRepairCount: 0,
  },
};

const EXPORTS = {
  '195x422': { width: 195, height: 422, fit: 'fill' },
  '360x800': { width: 360, height: 800, fit: 'contain' },
  '390x844': { width: 390, height: 844, fit: 'fill' },
  '430x932': { width: 430, height: 932, fit: 'contain' },
  '430x844-pressure': { width: 430, height: 844, fit: 'contain' },
};

const sha256File = async (path) => createHash('sha256').update(await readFile(path)).digest('hex');
const projectRelative = (absolutePath) => absolutePath.slice(PROJECT_ROOT.length + 1);

async function pngMetadata(sharp, path) {
  const metadata = await sharp(path).metadata();
  return {
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    space: metadata.space,
    depth: metadata.depth,
    hasAlpha: Boolean(metadata.hasAlpha),
  };
}

async function main() {
  const shotId = process.argv[2];
  const config = PAGE_CONFIG[shotId];
  if (!config) {
    throw new Error(`Unknown page config: ${shotId}`);
  }

  const sharp = await loadSharp();
  const pageRoot = resolve(PACKAGE_ROOT, 'pages', shotId);
  const rawPath = resolve(pageRoot, 'source/raw', config.rawName);
  const masterPath = resolve(pageRoot, 'source/masters', `${shotId}-master-2x.png`);
  const promptPath = resolve(pageRoot, 'prompt.md');
  const manifestPath = resolve(pageRoot, 'candidate-manifest.json');
  const exportMetadataPath = resolve(pageRoot, 'export-metadata.json');

  let existingManifest = null;
  try {
    existingManifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  if (existingManifest?.candidate_id !== config.candidateId) {
    existingManifest = null;
  }

  await mkdir(dirname(masterPath), { recursive: true });
  await sharp(rawPath)
    .resize(780, 1688, { fit: 'cover', position: 'centre' })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(masterPath);

  const exportRecords = {};
  for (const [name, exportConfig] of Object.entries(EXPORTS)) {
    const outputPath = resolve(pageRoot, 'exports', name, `${shotId}.png`);
    await mkdir(dirname(outputPath), { recursive: true });
    const pipeline = sharp(masterPath);
    if (exportConfig.fit === 'contain') {
      const scale = Math.min(exportConfig.width / 780, exportConfig.height / 1688);
      const containedWidth = Math.floor(780 * scale);
      const containedHeight = Math.floor(1688 * scale);
      const left = Math.floor((exportConfig.width - containedWidth) / 2);
      const top = Math.floor((exportConfig.height - containedHeight) / 2);
      const contained = await pipeline
        .resize(containedWidth, containedHeight, { fit: 'fill' })
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toBuffer();
      await sharp({
        create: {
          width: exportConfig.width,
          height: exportConfig.height,
          channels: 3,
          background: SAFE_BORDER,
        },
      })
        .composite([{ input: contained, left, top }])
        .flatten({ background: SAFE_BORDER })
        .removeAlpha()
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toFile(outputPath);
    } else {
      await pipeline
        .resize(exportConfig.width, exportConfig.height, { fit: 'fill' })
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toFile(outputPath);
    }
    exportRecords[name] = {
      path: projectRelative(outputPath),
      sha256: await sha256File(outputPath),
      dimensions: { width: exportConfig.width, height: exportConfig.height },
    };
  }

  const references = shotId === 'scene_02_stargaze_shot_004' ? [
    {
      path: 'design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_003/source/masters/scene_02_stargaze_shot_003-master-2x.png',
      sha256: 'd2561098ca35f15b02adb7a74bc7cc61778bbfb789552f57a27dc58685b57745',
      role: 'F3 approved exact master edit target; locked camera, crop, Milky Way, dust-dark rift, established stars, cloud identity, and bottom-edge adult/cat slivers',
    },
  ] : shotId === 'scene_02_stargaze_shot_003' ? [
    {
      path: 'design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_002/exports/390x844/scene_02_stargaze_shot_002.png',
      sha256: '98e267506a5485a93fdefa9759611c0ac4de2120edd5dc61d253a9ff59deee52',
      role: 'F2 approved exact-file sky insert, locked Milky Way arc, observed main star, dust-dark rift, and bottom-edge adult/cat crop',
    },
    {
      path: 'design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_001/exports/390x844/scene_02_stargaze_shot_001.png',
      sha256: '6b2450a1993742545b83958d4f17913fda63a512071f42fa0a148feb4856c26e',
      role: 'F1 approved sequence continuity and stargaze hierarchy',
    },
    {
      path: 'design-system/formal-picturebook-fullframe-v1-a-batch1/exports/390x844/scene_02_stargaze_shot_005.png',
      sha256: 'ad3a13c6a4d915f178d03d444874776e2df042f328f998de81a2bfbf0d774d8d',
      role: 'approved F5 final-sky material, one Milky Way geography, and non-spectacle mood reference',
    },
  ] : [
    {
      path: 'design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_001/exports/390x844/scene_02_stargaze_shot_001.png',
      sha256: '6b2450a1993742545b83958d4f17913fda63a512071f42fa0a148feb4856c26e',
      role: 'F1 approved lower-edge adult/cat gaze bridge, sky hierarchy, and stargaze sequence continuity',
    },
    {
      path: 'design-system/formal-picturebook-fullframe-v1-a-batch1/exports/390x844/scene_02_stargaze_shot_005.png',
      sha256: 'ad3a13c6a4d915f178d03d444874776e2df042f328f998de81a2bfbf0d774d8d',
      role: 'approved F5 Milky Way geography, deep-indigo negative space, and final-sky material reference',
    },
    {
      path: 'design-system/formal-picturebook-fullframe-v1-a-root-r4-manual-hem/exports/390x844/root_night_slope_v2-wind-hem-r4-manual.png',
      sha256: '23443918a0c892d569a6fd49b55b889d70bb4ed0dc7a6396a0af2bf5fad2306a',
      role: 'approved root adult/cat relation, location, house, door, and two-flower geography reference',
    },
  ];

  const preservedLifecycle = {};
  for (const key of [
    'owner_review',
    'independent_review',
    'mechanical_validation',
    'not_in_build',
    'permissions',
    'approval',
  ]) {
    if (existingManifest && Object.hasOwn(existingManifest, key)) {
      preservedLifecycle[key] = existingManifest[key];
    }
  }

  const manifest = {
    schema_version: 1,
    package_id: 'STARGAZE-FORMAL-BATCH-V1-A',
    candidate_id: config.candidateId,
    page: shotId,
    page_name: config.pageName,
    asset_id: config.assetId,
    status: existingManifest?.status ?? 'CANDIDATE_EXPORTED / OWNER_REVIEW_PENDING / NOT_IN_BUILD',
    production_property: 'ai-assisted-formal-fullframe',
    generation: {
      ...(existingManifest?.generation ?? {}),
      tool: 'OpenAI built-in image_gen',
      generation_count: config.generationCount ?? 1,
      targeted_repair_count: config.targetedRepairCount ?? 0,
      raw_path: projectRelative(rawPath),
      raw_sha256: await sha256File(rawPath),
      prompt_path: projectRelative(promptPath),
      prompt_sha256: await sha256File(promptPath),
    },
    references,
    master: {
      path: projectRelative(masterPath),
      sha256: await sha256File(masterPath),
      dimensions: { width: 780, height: 1688 },
      metadata: await pngMetadata(sharp, masterPath),
    },
    exports: exportRecords,
    ...preservedLifecycle,
    runtime_authorized: false,
  };

  const exportMetadata = {
    candidate_id: config.candidateId,
    safe_border: SAFE_BORDER,
    raw: {
      path: manifest.generation.raw_path,
      sha256: manifest.generation.raw_sha256,
      metadata: await pngMetadata(sharp, rawPath),
    },
    master: manifest.master,
    exports: manifest.exports,
  };

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(exportMetadataPath, `${JSON.stringify(exportMetadata, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ status: 'exported', candidateId: config.candidateId, manifest: projectRelative(manifestPath) }, null, 2)}\n`);
}

await main();
