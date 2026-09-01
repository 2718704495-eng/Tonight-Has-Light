import { pathToFileURL } from 'node:url';

import { ASSET_IDS, EXPECTED_SOURCE_HASHES, EXPORT_DIMENSIONS, H5_EXPORT_HASHES, H5_SHA256_390, PAGE_IDS, REQUIRED_EXPORTS } from './production-contract.mjs';
import { PACKAGE_ROOT, fileExists, readJson, readPngMetadata, resolveProjectPath, sha256File } from './package-utils.mjs';
import { validatePage } from './validate-page.mjs';

const REQUIRED_SOURCE_KEYS = ['spec', 'approvalRecord', 'executionPlan'];

function appendCheck(checks, issues, name, passed, detail = undefined) {
  checks.push({ name, passed, detail });
  if (!passed) issues.push(name);
}

async function validateHashRecord(record, expected, checks, issues, name) {
  const shapeMatches = record?.path === expected.path && record?.sha256 === expected.sha256;
  appendCheck(checks, issues, `${name} recorded baseline`, shapeMatches);
  if (!shapeMatches) return;
  const sourcePath = resolveProjectPath(record.path);
  const actualHash = await sha256File(sourcePath);
  appendCheck(checks, issues, `${name} recomputed hash`, actualHash === expected.sha256, actualHash);
}

function permissionsAreLocalOnly(permissions) {
  return permissions?.localGateBDesignProduction === true
    && Object.entries(permissions).every(([key, value]) => key === 'localGateBDesignProduction' || value === false);
}

async function validateH5Reference(reference, checks, issues) {
  for (const exportName of REQUIRED_EXPORTS) {
    const artifact = reference.exports?.[exportName];
    const expectedDimensions = EXPORT_DIMENSIONS[exportName];
    const shapeMatches = artifact?.width === expectedDimensions.width
      && artifact?.height === expectedDimensions.height
      && typeof artifact?.path === 'string'
      && typeof artifact?.sha256 === 'string';
    appendCheck(checks, issues, `H5 ${exportName} reference record`, shapeMatches && artifact.sha256 === H5_EXPORT_HASHES[exportName]);
    if (!shapeMatches) continue;
    const filePath = resolveProjectPath(artifact.path);
    appendCheck(checks, issues, `H5 ${exportName} exists`, await fileExists(filePath));
    if (!(await fileExists(filePath))) continue;
    const actualHash = await sha256File(filePath);
    appendCheck(checks, issues, `H5 ${exportName} hash`, actualHash === artifact.sha256, actualHash);
    const metadata = await readPngMetadata(filePath);
    appendCheck(
      checks,
      issues,
      `H5 ${exportName} dimensions`,
      metadata.width === expectedDimensions.width && metadata.height === expectedDimensions.height,
      metadata,
    );
  }
  appendCheck(checks, issues, 'H5 canonical 390 frozen hash', reference.exports?.['390x844']?.sha256 === H5_SHA256_390);
}

function validateManifestProvenance(manifest, provenance, checks, issues) {
  const manifestIds = Object.keys(manifest.pageIdentityMap ?? {}).sort();
  appendCheck(checks, issues, 'manifest page IDs are exact', JSON.stringify(manifestIds) === JSON.stringify([...PAGE_IDS].sort()));
  for (const pageId of PAGE_IDS) {
    const manifestPage = manifest.pages?.[pageId];
    const provenancePage = provenance.pages?.[pageId];
    const identityMatches = manifest.pageIdentityMap?.[pageId] === ASSET_IDS[pageId]
      && manifestPage?.assetId === ASSET_IDS[pageId]
      && provenancePage?.assetId === ASSET_IDS[pageId];
    appendCheck(checks, issues, `${pageId} asset identity`, identityMatches);
    const statusAndHashesMatch = manifestPage?.status === provenancePage?.status
      && JSON.stringify(manifestPage?.artifacts ?? null) === JSON.stringify(provenancePage?.artifacts ?? null);
    appendCheck(checks, issues, `${pageId} manifest ↔ provenance status/hash`, statusAndHashesMatch);
  }
}

export async function validatePackage({ stage = 'structure' } = {}) {
  const checks = [];
  const issues = [];
  const manifest = await readJson(`${PACKAGE_ROOT}/ritual-manifest.json`);
  const provenance = await readJson(`${PACKAGE_ROOT}/provenance.json`);
  const h5Reference = await readJson(`${PACKAGE_ROOT}/references/approved-h5.json`);
  validateManifestProvenance(manifest, provenance, checks, issues);

  for (const key of REQUIRED_SOURCE_KEYS) {
    await validateHashRecord(manifest.sourceHashes?.[key], EXPECTED_SOURCE_HASHES[key], checks, issues, `${key} (manifest)`);
    await validateHashRecord(provenance.sourceHashes?.[key], EXPECTED_SOURCE_HASHES[key], checks, issues, `${key} (provenance)`);
  }
  appendCheck(checks, issues, 'manifest permissions are local Gate B only', permissionsAreLocalOnly(manifest.permissions));
  appendCheck(checks, issues, 'provenance permissions are local Gate B only', permissionsAreLocalOnly(provenance.permissions));
  await validateH5Reference(h5Reference, checks, issues);

  const pages = {};
  for (const pageId of PAGE_IDS) {
    pages[pageId] = await validatePage({ pageId, manifest, provenance });
    for (const issue of pages[pageId].issues) issues.push(`${pageId}: ${issue}`);
  }
  const productionPageStatuses = PAGE_IDS.slice(0, 4).map((pageId) => pages[pageId].status);
  const partialPagesValid = productionPageStatuses.every((status) => (
    status === 'BLOCKED / NO ART'
      || status === 'REVIEW REQUIRED'
      || status === 'USER VISUAL PASS / FROZEN'
  ));
  const blockedPages = productionPageStatuses.every((status) => status === 'BLOCKED / NO ART');
  const approvedPages = productionPageStatuses.every((status) => status === 'USER VISUAL PASS / FROZEN');
  const homeMealGateBPass = approvedPages && pages.scene_01_home_shot_005.status === 'REFERENCE HASH PASS';
  appendCheck(checks, issues, 'H1–H4 have mechanically valid partial-stage states', partialPagesValid);
  appendCheck(checks, issues, 'H5 is REFERENCE HASH PASS', pages.scene_01_home_shot_005.status === 'REFERENCE HASH PASS');

  if (stage !== 'structure' && stage !== 'final') {
    issues.push(`Unsupported validation stage: ${stage}`);
  }
  if (stage === 'final' && blockedPages) {
    issues.push('Final validation cannot run while H1–H4 have no art');
  }
  const valid = issues.length === 0;
  return {
    stage,
    status: valid
      ? (homeMealGateBPass
        ? (stage === 'final'
          ? 'FINAL ARTIFACTS VALID / HOME-MEAL GATE B VISUAL PASS'
          : 'STRUCTURE VALID / HOME-MEAL GATE B VISUAL PASS')
        : (stage === 'final'
          ? 'FINAL ARTIFACTS VALID / GATE B USER APPROVAL REQUIRED'
          : 'STRUCTURE VALID / GATE B VISUAL BLOCKED'))
      : 'FAIL',
    gateBVisualStatus: homeMealGateBPass
      ? 'PASS / HOME-MEAL-RITUAL-V1-A'
      : (blockedPages
        ? 'BLOCKED / NO ART OR USER APPROVAL'
        : 'BLOCKED / USER VISUAL APPROVAL REQUIRED'),
    pages: Object.fromEntries(PAGE_IDS.map((pageId) => [pageId, pages[pageId].status])),
    checks,
    issues,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const stageIndex = process.argv.indexOf('--stage');
  const stage = stageIndex === -1 ? 'structure' : process.argv[stageIndex + 1];
  const result = await validatePackage({ stage });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.status === 'FAIL') process.exitCode = 1;
}
