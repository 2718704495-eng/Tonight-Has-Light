export const WECHAT_EXPERIENCE_CANDIDATE_ID =
  "gate-d-story-b-kf-r1-temp-dev-r1-0.4.7";
export const WECHAT_EXPERIENCE_WEB_CANDIDATE_ID =
  "gate-d-story-b-kf-r1-temp-web-r1-0.4.7";
export const WECHAT_EXPERIENCE_VERSION = "0.4.7";
export const WECHAT_EXPERIENCE_STORAGE_PREFIX =
  "phone-preview-story-b-kf-r1-temp-r1-0.4.7:";
export const WECHAT_EXPERIENCE_BUNDLE_NAME = "outdoor-story-b-kf-r1-temp";
export const WECHAT_EXPERIENCE_ENGINEERING_REVISION = "B-KF-R1-TEMP-R1";
export const WECHAT_EXPERIENCE_ALLOWED_USE =
  "one WeChat developer upload version 0.4.7";
export const WECHAT_EXPERIENCE_USER_PROMOTION_USE =
  "the user may independently promote that exact 0.4.7 developer upload to an experience version";
export const WECHAT_EXPERIENCE_SOURCE_SHA256 = Object.freeze({
  B01: "fdac7f8edf8a22954a93a3f756ab2c1699c1afe04462bf2fa3ed679ae2794d0c",
  B02: "e0f00f2b573dda25b91f53aa5e04fa72456fa3ed1f784a1087b4238083504727",
  B03: "8da6d324520fce5175a1f0546a8cb67e29c041795d002439a5add28a80ea1b67",
});
export const WECHAT_EXPERIENCE_IDENTITY_SCHEMA =
  "tonight-has-light.wechat-experience-candidate.v1";
export const WECHAT_EXPERIENCE_BUILD_CONFIG =
  "scripts/gate-d-story-b-kf-r1-temp-dev-r1-0-4-7.json";

function hasDisposableClassification(value) {
  const classification = String(value ?? "").toLowerCase();
  return ["prototype-only", "disposable", "not-for-review", "not-for-release"]
    .every((marker) => classification.includes(marker));
}

function sourceHashesMatch(value) {
  return Object.entries(WECHAT_EXPERIENCE_SOURCE_SHA256)
    .every(([beat, expected]) => value?.[beat] === expected);
}

export function allowsStoryBKfR1TemporaryExperience(
  boundary,
  manifestSha256,
  manifest,
  candidateId = WECHAT_EXPERIENCE_CANDIDATE_ID,
) {
  const allowed = Array.isArray(boundary?.allowedUse)
    ? boundary.allowedUse.map(String)
    : [];
  const manifestSourceHashes = Object.fromEntries(
    Array.isArray(manifest?.source?.assets)
      ? manifest.source.assets.map((asset) => [String(asset?.beat), asset?.sourceSha256])
      : [],
  );
  const inactiveR2 = Array.isArray(boundary?.inactiveHistoricalPackaging)
    ? boundary.inactiveHistoricalPackaging
    : [];
  return candidateId === WECHAT_EXPERIENCE_CANDIDATE_ID
    && boundary?.candidateId === WECHAT_EXPERIENCE_CANDIDATE_ID
    && boundary?.developerVersion === WECHAT_EXPERIENCE_VERSION
    && boundary?.assetManifestSha256 === manifestSha256
    && manifest?.candidateId === WECHAT_EXPERIENCE_CANDIDATE_ID
    && manifest?.developerVersion === WECHAT_EXPERIENCE_VERSION
    && manifest?.bundle?.name === WECHAT_EXPERIENCE_BUNDLE_NAME
    && manifest?.bundle?.excludedBundles?.includes("outdoor-illustration-wind-r2")
    && hasDisposableClassification(boundary?.classification)
    && hasDisposableClassification(manifest?.classification)
    && sourceHashesMatch(boundary?.sourceSha256)
    && sourceHashesMatch(manifestSourceHashes)
    && allowed.includes(WECHAT_EXPERIENCE_ALLOWED_USE)
    && allowed.includes(WECHAT_EXPERIENCE_USER_PROMOTION_USE)
    && blocksReviewOrRelease(boundary)
    && inactiveR2.some((entry) =>
      entry?.bundle === "outdoor-illustration-wind-r2"
      && entry?.runtimeReferenced === false
      && entry?.evidenceUse === "forbidden"
    );
}

// Historical compatibility export. It deliberately cannot authorize the new
// candidate; the 0.4.7 validator consumes allowsStoryBKfR1TemporaryExperience.
export function allowsR2EdgefixExperience() {
  return false;
}

export function blocksReviewOrRelease(boundary) {
  const forbidden = [
    ...(Array.isArray(boundary?.forbidden) ? boundary.forbidden : []),
    ...(Array.isArray(boundary?.forbiddenUse) ? boundary.forbiddenUse : []),
  ].map(String);
  return forbidden.some((entry) => /review submission|release/i.test(entry));
}
