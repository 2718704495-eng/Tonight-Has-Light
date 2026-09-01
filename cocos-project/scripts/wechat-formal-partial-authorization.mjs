export const FORMAL_PARTIAL_CANDIDATE_ID =
  "gate-d-formal-picturebook-partial-dev-r1-0.4.8";
export const FORMAL_PARTIAL_WEB_CANDIDATE_ID =
  "gate-d-formal-picturebook-partial-web-r1-0.4.8";
export const FORMAL_PARTIAL_VERSION = "0.4.8";
export const FORMAL_PARTIAL_STORAGE_PREFIX =
  "formal-picturebook-partial-r1-0.4.8:";
export const FORMAL_PARTIAL_BUNDLE_NAME =
  "formal-picturebook-partial-0-4-8";
export const FORMAL_PARTIAL_ASSET_PACKAGE_ID =
  "formal-picturebook-partial-0-4-8-assets-r1";
export const FORMAL_PARTIAL_ENGINEERING_REVISION =
  "FORMAL-PICTUREBOOK-PARTIAL-R1";
export const FORMAL_PARTIAL_IDENTITY_SCHEMA =
  "tonight-has-light.wechat-formal-picturebook-partial.v1";
export const FORMAL_PARTIAL_BUILD_CONFIG =
  "scripts/gate-d-formal-picturebook-partial-dev-r1-0-4-8.json";
export const FORMAL_PARTIAL_WEB_BUILD_CONFIG =
  "scripts/gate-d-formal-picturebook-partial-web-r1-0-4-8.json";

export const FORMAL_PARTIAL_REQUIRED_PAGE_IDS = Object.freeze([
  "root",
  "stargaze-f1",
  "stargaze-f2",
  "stargaze-f3",
  "stargaze-f4",
  "stargaze-f5",
  "home-h1",
  "home-h2",
  "home-h3",
  "home-h4",
  "home-h5",
  "home-h4-ate",
  "home-h4-sipped",
]);

export const FORMAL_PARTIAL_ALLOWED_USE =
  "one WeChat developer upload version 0.4.8";
export const FORMAL_PARTIAL_USER_PROMOTION_USE =
  "the user may independently promote that exact developer upload to an experience version";

function lowercaseString(value) {
  return String(value ?? "").toLowerCase();
}

function includesAll(value, markers) {
  const source = lowercaseString(value);
  return markers.every((marker) => source.includes(marker));
}

function arrayStrings(value) {
  return Array.isArray(value) ? value.map(String) : [];
}

function hasRequiredRecords(records, requiredIds) {
  if (!Array.isArray(records)) return false;
  const approvedIds = new Set(
    records
      .filter((record) => record?.approved !== false)
      .map((record) => String(record?.id ?? "")),
  );
  return records.length === requiredIds.length
    && approvedIds.size === requiredIds.length
    && requiredIds.every((id) => approvedIds.has(id));
}

function hidesOnlyBreeze(value) {
  const branches = arrayStrings(value);
  return branches.length === 1 && branches[0] === "breeze";
}

function acceptedAssetPackageId(value) {
  return value === FORMAL_PARTIAL_CANDIDATE_ID
    || value === FORMAL_PARTIAL_ASSET_PACKAGE_ID;
}

function allAssetsAreFormal(records) {
  return Array.isArray(records)
    && records.every((record) =>
      (record?.classification === "ai-assisted-formal-fullframe"
        || record?.classification === "ai-assisted-formal-fullframe-overlay"
        || record?.sourceProperty === "ai-assisted-formal-fullframe"
        || record?.sourceProperty === "approved-manual-local-repaint-fullframe"
        || record?.sourceProperty === "approved-editable-response-layer")
      && typeof record?.runtimePath === "string"
      && record.runtimePath.length > 0
    );
}

function classificationBlocksReviewAndRelease(classification) {
  const value = lowercaseString(classification);
  return value.includes("0.4.8")
    && value.includes("not-for-review")
    && (value.includes("not-for-release") || value.includes("not-for-public-release"));
}

export function blocksFormalPicturebookPartialReviewOrRelease(boundary) {
  return [
    ...arrayStrings(boundary?.forbidden),
    ...arrayStrings(boundary?.forbiddenUse),
  ].some((entry) => /review submission|public release|\brelease\b/i.test(entry));
}

export function allowsFormalPicturebookPartialExperience(
  boundary,
  manifestSha256,
  manifest,
  candidateId = FORMAL_PARTIAL_CANDIDATE_ID,
) {
  const allowed = arrayStrings(boundary?.allowedUse);
  return candidateId === FORMAL_PARTIAL_CANDIDATE_ID
    && acceptedAssetPackageId(boundary?.candidateId)
    && boundary?.developerVersion === FORMAL_PARTIAL_VERSION
    && (boundary?.bundleName === undefined || boundary?.bundleName === FORMAL_PARTIAL_BUNDLE_NAME)
    && boundary?.assetManifestSha256 === manifestSha256
    && manifest?.schema === "tonight-has-light.formal-picturebook-partial-0-4-8.v1"
    && acceptedAssetPackageId(manifest?.candidateId)
    && manifest?.developerVersion === FORMAL_PARTIAL_VERSION
    && manifest?.bundle?.name === FORMAL_PARTIAL_BUNDLE_NAME
    && manifest?.bundle?.configId === "formal_picturebook_partial_0_4_8_subpackage"
    && classificationBlocksReviewAndRelease(boundary?.classification)
    && allAssetsAreFormal(manifest?.assets)
    && hasRequiredRecords(manifest?.assets, FORMAL_PARTIAL_REQUIRED_PAGE_IDS)
    && hidesOnlyBreeze(manifest?.hiddenBranches)
    && hidesOnlyBreeze(boundary?.hiddenBranches)
    && allowed.includes(FORMAL_PARTIAL_ALLOWED_USE)
    && allowed.includes(FORMAL_PARTIAL_USER_PROMOTION_USE)
    && blocksFormalPicturebookPartialReviewOrRelease(boundary);
}
