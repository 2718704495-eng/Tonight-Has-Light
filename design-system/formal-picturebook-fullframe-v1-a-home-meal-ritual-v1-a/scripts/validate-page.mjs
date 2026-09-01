import { pathToFileURL } from 'node:url';

import { EXPORT_DIMENSIONS, REQUIRED_EXPORTS, assertPageId } from './production-contract.mjs';
import { PACKAGE_ROOT, fileExists, hasUnexpectedFiles, readJson, resolveProjectPath, sha256File } from './package-utils.mjs';
import { loadSharp } from './sharp-loader.mjs';

export function isProductionPngMetadata(metadata, expectedDimensions) {
  return metadata?.format === 'png'
    && metadata.width === expectedDimensions.width
    && metadata.height === expectedDimensions.height
    && metadata.depth === 'uchar'
    && metadata.space === 'srgb'
    && typeof metadata.hasAlpha === 'boolean';
}

async function checkArtifact(artifact, expectedDimensions, checks, issues, label, { requireRecordedMetadata = false } = {}) {
  if (!artifact?.path || !artifact?.sha256) {
    issues.push(`${label} is missing a path or SHA-256`);
    return;
  }
  const filePath = resolveProjectPath(artifact.path);
  if (!(await fileExists(filePath))) {
    issues.push(`${label} is missing: ${artifact.path}`);
    return;
  }
  const actualHash = await sha256File(filePath);
  checks.push({ name: `${label} hash`, passed: actualHash === artifact.sha256, actual: actualHash });
  if (actualHash !== artifact.sha256) issues.push(`${label} hash differs from its recorded hash`);
  if (expectedDimensions) {
    const sharp = await loadSharp();
    const metadata = await sharp(filePath).metadata();
    const validMetadata = isProductionPngMetadata(metadata, expectedDimensions);
    checks.push({ name: `${label} PNG metadata`, passed: validMetadata, actual: metadata });
    if (!validMetadata) issues.push(`${label} must be an 8-bit sRGB PNG with the contracted dimensions`);
    if (requireRecordedMetadata) {
      const recordedAlpha = artifact.metadata?.hasAlpha;
      const alphaMatches = typeof recordedAlpha === 'boolean' && recordedAlpha === Boolean(metadata.hasAlpha);
      checks.push({ name: `${label} recorded alpha`, passed: alphaMatches, actual: { recordedAlpha, actual: Boolean(metadata.hasAlpha) } });
      if (!alphaMatches) issues.push(`${label} is missing or drifting from its recorded alpha metadata`);
    }
  }
}

function isNoArtRecord(page) {
  return page.status === 'BLOCKED / NO ART' && !page.artifacts;
}

export async function validatePage({ pageId, manifest, provenance }) {
  assertPageId(pageId);
  const page = manifest.pages?.[pageId];
  const provenancePage = provenance.pages?.[pageId];
  const checks = [];
  const issues = [];
  if (!page || !provenancePage) {
    return { status: 'FAIL', checks, issues: [`Missing manifest or provenance record for ${pageId}`] };
  }
  const identityMatches = page.assetId === provenancePage.assetId && page.status === provenancePage.status;
  checks.push({ name: 'manifest ↔ provenance page identity/status', passed: identityMatches });
  if (!identityMatches) issues.push('manifest and provenance page records drift');

  if (isNoArtRecord(page)) {
    const pageRoot = resolveProjectPath(`design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/${pageId}`);
    const unexpectedSource = await hasUnexpectedFiles(`${pageRoot}/source`);
    const unexpectedExports = await hasUnexpectedFiles(`${pageRoot}/exports`);
    const unexpectedDirectArtifacts = (await Promise.all([
      fileExists(`${pageRoot}/prompt.md`),
      fileExists(`${pageRoot}/candidate-manifest.json`),
      fileExists(`${pageRoot}/export-metadata.json`),
    ])).some(Boolean);
    const noArt = !unexpectedSource && !unexpectedExports && !unexpectedDirectArtifacts;
    checks.push({ name: 'no prompt/raw/master/export/metadata artifacts are present', passed: noArt });
    if (!noArt) issues.push('production artifacts exist while the page is marked BLOCKED / NO ART');
    return { status: issues.length === 0 ? 'BLOCKED / NO ART' : 'FAIL', checks, issues };
  }

  if (page.status === 'REFERENCE HASH PASS') {
    await checkArtifact(page.artifacts?.canonical390, EXPORT_DIMENSIONS['390x844'], checks, issues, 'H5 canonical 390 export');
    return { status: issues.length === 0 ? 'REFERENCE HASH PASS' : 'FAIL', checks, issues };
  }

  const artifacts = page.artifacts;
  await checkArtifact(artifacts?.prompt, null, checks, issues, 'prompt');
  await checkArtifact(artifacts?.raw, null, checks, issues, 'raw candidate');
  await checkArtifact(artifacts?.master, { width: 780, height: 1688 }, checks, issues, 'master candidate', { requireRecordedMetadata: true });
  for (const exportName of REQUIRED_EXPORTS) {
    await checkArtifact(
      artifacts?.exports?.[exportName],
      EXPORT_DIMENSIONS[exportName],
      checks,
      issues,
      `${exportName} export`,
      { requireRecordedMetadata: true },
    );
  }
  if (issues.length > 0) return { status: 'FAIL', checks, issues };
  return {
    status: page.status === 'USER VISUAL PASS / FROZEN'
      ? 'USER VISUAL PASS / FROZEN'
      : 'REVIEW REQUIRED',
    checks,
    issues,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pageIdIndex = process.argv.indexOf('--page-id');
  const pageId = process.argv[pageIdIndex + 1];
  if (pageIdIndex === -1 || !pageId) throw new Error('Usage: --page-id <page-id>');
  const manifest = await readJson(`${PACKAGE_ROOT}/ritual-manifest.json`);
  const provenance = await readJson(`${PACKAGE_ROOT}/provenance.json`);
  const result = await validatePage({ pageId, manifest, provenance });
  process.stdout.write(`${JSON.stringify({ pageId, ...result }, null, 2)}\n`);
  if (result.status === 'FAIL') process.exitCode = 1;
}
