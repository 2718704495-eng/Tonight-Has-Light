import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { EXPORT_DIMENSIONS, MASTER_DIMENSIONS, REQUIRED_EXPORTS, REVIEW_EXPORT_OPTIONS, createExportRequest } from './production-contract.mjs';
import { PACKAGE_ROOT, PROJECT_ROOT, assertNonCocosPath, isInside, realPathInside, sha256File } from './package-utils.mjs';
import { loadSharp } from './sharp-loader.mjs';

function pageRoot(pageId) {
  return resolve(PACKAGE_ROOT, 'pages', pageId);
}

function assertOutputPath(outputPath) {
  assertNonCocosPath(outputPath, 'output path');
  if (!isInside(PACKAGE_ROOT, outputPath)) {
    throw new Error(`Output path escapes the isolated production package: ${outputPath}`);
  }
  return outputPath;
}

function serializableMetadata(metadata) {
  return {
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    depth: metadata.depth,
    space: metadata.space,
    hasAlpha: Boolean(metadata.hasAlpha),
  };
}

async function writePng(sharp, inputPath, outputPath, width, height, resizeOptions = {}) {
  await mkdir(dirname(outputPath), { recursive: true });
  await sharp(inputPath)
    .rotate()
    .resize(width, height, { position: 'centre', ...resizeOptions })
    .toColourspace('srgb')
    .png({ compressionLevel: 9, palette: false, force: true })
    .toFile(outputPath);
}

export async function exportPage({ pageId, assetId, inputPath, candidateVersion, referenceHashes = {} }) {
  const request = createExportRequest({ pageId, assetId, inputPath, candidateVersion });
  ({ pageId, assetId, inputPath, candidateVersion } = request);
  const root = pageRoot(pageId);
  const rawDirectory = resolve(root, 'source', 'raw');
  const resolvedInput = isAbsolute(inputPath) ? inputPath : resolve(PROJECT_ROOT, inputPath);
  const raw = await realPathInside(rawDirectory, resolvedInput, 'input path');
  assertNonCocosPath(raw, 'input path');

  const sharp = await loadSharp();
  const inputMetadata = await sharp(raw).metadata();
  const master = assertOutputPath(resolve(root, 'source', 'masters', `${pageId}-${candidateVersion}-master-2x.png`));
  await writePng(sharp, raw, master, MASTER_DIMENSIONS.width, MASTER_DIMENSIONS.height, { fit: 'cover' });

  const exports = {};
  for (const exportName of REQUIRED_EXPORTS) {
    const dimensions = EXPORT_DIMENSIONS[exportName];
    const outputPath = assertOutputPath(resolve(root, 'exports', exportName, `${pageId}.png`));
    await writePng(sharp, master, outputPath, dimensions.width, dimensions.height, REVIEW_EXPORT_OPTIONS[exportName]);
    const outputMetadata = await sharp(outputPath).metadata();
    exports[exportName] = {
      path: relative(PROJECT_ROOT, outputPath),
      sha256: await sha256File(outputPath),
      ...dimensions,
      metadata: serializableMetadata(outputMetadata),
    };
  }

  const masterMetadata = await sharp(master).metadata();
  const metadata = {
    input: serializableMetadata(inputMetadata),
    master: serializableMetadata(masterMetadata),
  };
  const result = {
    pageId,
    assetId,
    candidateVersion,
    raw: { path: relative(PROJECT_ROOT, raw), sha256: await sha256File(raw) },
    master: { path: relative(PROJECT_ROOT, master), sha256: await sha256File(master), metadata: metadata.master },
    exports,
    hashes: { referenceHashes },
    metadata,
  };
  await writeFile(assertOutputPath(resolve(root, 'export-metadata.json')), `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

function parseArguments(argumentsList) {
  const values = {};
  for (let index = 0; index < argumentsList.length; index += 2) {
    const option = argumentsList[index];
    const value = argumentsList[index + 1];
    if (!option?.startsWith('--') || value === undefined) {
      throw new Error('Usage: --page-id <id> --input <raw-png> --candidate-version <r1|r2>');
    }
    values[option.slice(2)] = value;
  }
  return values;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const argumentsMap = parseArguments(process.argv.slice(2));
  const result = await exportPage({
    pageId: argumentsMap['page-id'],
    inputPath: argumentsMap.input,
    candidateVersion: argumentsMap['candidate-version'],
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
