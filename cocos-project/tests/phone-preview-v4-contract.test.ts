import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { findPrototypeBuildArtifacts } from "../scripts/prototype-asset-build-guard.mjs";
import { assertNoPrototypeAssetsForRelease } from "../scripts/validate-wechat-motion-runtime-build.mjs";
import {
  prepareWechatExperienceCandidate,
  verifyStoryAssetIntegrity,
} from "../scripts/prepare-wechat-experience-candidate.mjs";
import * as authorization from "../scripts/wechat-experience-authorization.mjs";
import {
  blocksReviewOrRelease,
  WECHAT_EXPERIENCE_BUILD_CONFIG,
  WECHAT_EXPERIENCE_CANDIDATE_ID,
  WECHAT_EXPERIENCE_STORAGE_PREFIX,
  WECHAT_EXPERIENCE_VERSION,
} from "../scripts/wechat-experience-authorization.mjs";

const projectRoot = resolve(import.meta.dirname, "..");

function text(path: string): string {
  return readFileSync(resolve(projectRoot, path), "utf8");
}

function json(path: string): Record<string, unknown> {
  return JSON.parse(text(path)) as Record<string, unknown>;
}

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(resolve(projectRoot, path))).digest("hex");
}

test("the authorized phone candidate is the isolated disposable B KF-R1 0.4.7 build", () => {
  assert.equal(
    WECHAT_EXPERIENCE_CANDIDATE_ID,
    "gate-d-story-b-kf-r1-temp-dev-r1-0.4.7",
  );
  assert.equal(WECHAT_EXPERIENCE_VERSION, "0.4.7");
  assert.equal(
    WECHAT_EXPERIENCE_STORAGE_PREFIX,
    "phone-preview-story-b-kf-r1-temp-r1-0.4.7:",
  );
  assert.equal(
    WECHAT_EXPERIENCE_BUILD_CONFIG,
    "scripts/gate-d-story-b-kf-r1-temp-dev-r1-0-4-7.json",
  );
});

test("R2 prototype assets are denied by a recursive WeChat artifact scan", () => {
  const temporaryRoot = mkdtempSync(resolve(tmpdir(), "tonight-r2-build-guard-"));
  const buildRoot = resolve(temporaryRoot, "build");
  const sourceRoot = resolve(temporaryRoot, "source", "outdoor-illustration-wind-r2");
  mkdirSync(resolve(buildRoot, "assets", "resources", "native"), { recursive: true });
  mkdirSync(sourceRoot, { recursive: true });

  try {
    const prototypeBytes = Buffer.from("prototype-r2-image-bytes");
    writeFileSync(resolve(sourceRoot, "lower-f0.png"), prototypeBytes);
    writeFileSync(
      resolve(sourceRoot, "lower-f0.png.meta"),
      JSON.stringify({ uuid: "11111111-2222-4333-8444-555555555555" }),
    );
    writeFileSync(
      resolve(buildRoot, "assets", "resources", "native", "copied.png"),
      prototypeBytes,
    );
    writeFileSync(
      resolve(
        buildRoot,
        "assets",
        "resources",
        "native",
        "11111111-2222-4333-8444-555555555555.png",
      ),
      Buffer.from("transcoded-r2-image-bytes"),
    );
    writeFileSync(
      resolve(buildRoot, "assets", "resources", "config.json"),
      JSON.stringify({ path: "outdoor-illustration-wind-r2/lower-f0" }),
    );

    const artifacts = findPrototypeBuildArtifacts({
      buildRoot,
      sourceRoot,
      directoryMarker: "outdoor-illustration-wind-r2",
    });
    assert.equal(artifacts.length, 3);
    assert.ok(artifacts.some((entry) => entry.reasons.includes("exact-source-hash")));
    assert.ok(artifacts.some((entry) => entry.reasons.includes("directory-marker-in-content")));
    assert.ok(artifacts.some((entry) => entry.reasons.some((reason) => reason.startsWith("source-uuid:"))));
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("only the exact disposable B KF-R1 manifest and inactive historical R2 packaging are authorized", () => {
  const sourceSha256 = {
    B01: "fdac7f8edf8a22954a93a3f756ab2c1699c1afe04462bf2fa3ed679ae2794d0c",
    B02: "e0f00f2b573dda25b91f53aa5e04fa72456fa3ed1f784a1087b4238083504727",
    B03: "8da6d324520fce5175a1f0546a8cb67e29c041795d002439a5add28a80ea1b67",
  };
  const manifest = {
    candidateId: WECHAT_EXPERIENCE_CANDIDATE_ID,
    developerVersion: WECHAT_EXPERIENCE_VERSION,
    classification: "prototype-only / disposable / one-0.4.7-developer-upload-only / not-for-review / not-for-release",
    bundle: {
      name: "outdoor-story-b-kf-r1-temp",
      excludedBundles: ["outdoor-illustration-wind-r2"],
    },
    source: {
      assets: Object.entries(sourceSha256).map(([beat, sourceSha]) => ({
        beat,
        sourceSha256: sourceSha,
      })),
    },
  };
  const boundary = {
    candidateId: WECHAT_EXPERIENCE_CANDIDATE_ID,
    developerVersion: WECHAT_EXPERIENCE_VERSION,
    classification: manifest.classification,
    assetManifestSha256: "a".repeat(64),
    sourceSha256,
    allowedUse: [
      "one WeChat developer upload version 0.4.7",
      "the user may independently promote that exact 0.4.7 developer upload to an experience version",
    ],
    forbiddenUse: ["review submission", "release", "public release"],
    inactiveHistoricalPackaging: [
      {
        bundle: "outdoor-illustration-wind-r2",
        runtimeReferenced: false,
        evidenceUse: "forbidden",
      },
    ],
  };
  const allows = (authorization as Record<string, unknown>)[
    "allowsStoryBKfR1TemporaryExperience"
  ];
  assert.equal(typeof allows, "function");
  const authorize = allows as (
    boundary: Record<string, unknown>,
    manifestSha256: string,
    manifest: Record<string, unknown>,
    candidateId?: string,
  ) => boolean;

  assert.equal(authorize(boundary, "a".repeat(64), manifest), true);
  assert.equal(
    authorize(boundary, "a".repeat(64), manifest, "gate-d-mainflow-v4-r2-edgefix-01-dev-r10-0.4.6"),
    false,
  );
  assert.equal(
    authorize(
      { ...boundary, sourceSha256: { ...sourceSha256, B02: "0".repeat(64) } },
      "a".repeat(64),
      manifest,
    ),
    false,
  );
  assert.equal(
    authorize(
      {
        ...boundary,
        inactiveHistoricalPackaging: [
          {
            bundle: "outdoor-illustration-wind-r2",
            runtimeReferenced: true,
            evidenceUse: "forbidden",
          },
        ],
      },
      "a".repeat(64),
      manifest,
    ),
    false,
  );
  assert.equal(blocksReviewOrRelease(boundary), true);
});

test("release mode rejects recursively detected B KF-R1 and warm-room prototype artifacts", () => {
  const temporaryRoot = mkdtempSync(resolve(tmpdir(), "tonight-047-release-guard-"));
  const buildRoot = resolve(temporaryRoot, "build");
  const storySourceRoot = resolve(temporaryRoot, "source", "outdoor-story-b-kf-r1-temp");
  const indoorSourceRoot = resolve(temporaryRoot, "source", "indoor-n01-preview");
  mkdirSync(resolve(buildRoot, "nested", "subpackages"), { recursive: true });
  mkdirSync(storySourceRoot, { recursive: true });
  mkdirSync(indoorSourceRoot, { recursive: true });

  try {
    const storyBytes = Buffer.from("temporary-story-b01-bytes");
    const indoorBytes = Buffer.from("temporary-warm-room-bytes");
    writeFileSync(resolve(storySourceRoot, "b01-settle.png"), storyBytes);
    writeFileSync(resolve(indoorSourceRoot, "formal-ui-v1-2-a-preview.jpg"), indoorBytes);
    writeFileSync(
      resolve(buildRoot, "nested", "subpackages", "story-copy.bin"),
      storyBytes,
    );
    writeFileSync(
      resolve(buildRoot, "nested", "subpackages", "indoor-copy.bin"),
      indoorBytes,
    );

    const storyArtifacts = findPrototypeBuildArtifacts({
      buildRoot,
      sourceRoot: storySourceRoot,
      directoryMarker: "outdoor-story-b-kf-r1-temp",
    });
    const indoorArtifacts = findPrototypeBuildArtifacts({
      buildRoot,
      sourceRoot: indoorSourceRoot,
      directoryMarker: "indoor-n01-preview",
    });
    assert.equal(storyArtifacts.length, 1);
    assert.equal(indoorArtifacts.length, 1);
    assert.throws(
      () => assertNoPrototypeAssetsForRelease({
        storyArtifacts,
        indoorArtifacts,
        historicalR2Artifacts: [],
        storyBoundary: { forbiddenUse: ["review submission", "release"] },
        indoorBoundary: { forbiddenUse: ["review submission", "public release"] },
      }),
      /release mode is blocked by recursive prototype asset scan:.*B-KF-R1=1.*indoor-n01-preview=1/,
    );
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("writes a local-only build identity only inside the exact 0.4.7 B KF-R1 WeChat candidate", () => {
  const temporaryRoot = mkdtempSync(resolve(tmpdir(), "tonight-b-kf-r1-build-identity-"));
  const exactRoot = resolve(
    temporaryRoot,
    "gate-d-story-b-kf-r1-temp-dev-r1-0.4.7",
    "wechatgame",
  );
  const staleRoot = resolve(
    temporaryRoot,
    "gate-d-mainflow-v4-r2-edgefix-01-dev-r10-0.4.6",
    "wechatgame",
  );
  mkdirSync(exactRoot, { recursive: true });
  mkdirSync(staleRoot, { recursive: true });
  writeFileSync(resolve(exactRoot, "game.json"), "{}\n");
  writeFileSync(resolve(staleRoot, "game.json"), "{}\n");

  try {
    const result = prepareWechatExperienceCandidate(exactRoot);
    assert.equal(result.identity.candidateId, WECHAT_EXPERIENCE_CANDIDATE_ID);
    assert.equal(result.identity.developerVersion, "0.4.7");
    assert.equal(result.identity.engineeringRevision, "B-KF-R1-TEMP-R1");
    assert.equal(result.identity.bundleName, "outdoor-story-b-kf-r1-temp");
    assert.equal(typeof result.identity.storyAssetManifestSha256, "string");
    assert.deepEqual(result.identity.sourceSha256, {
      B01: "fdac7f8edf8a22954a93a3f756ab2c1699c1afe04462bf2fa3ed679ae2794d0c",
      B02: "e0f00f2b573dda25b91f53aa5e04fa72456fa3ed1f784a1087b4238083504727",
      B03: "8da6d324520fce5175a1f0546a8cb67e29c041795d002439a5add28a80ea1b67",
    });
    assert.equal(result.identity.remoteOperationPerformed, false);
    assert.deepEqual(json(resolve(result.destination)), result.identity);
    assert.throws(
      () => prepareWechatExperienceCandidate(staleRoot),
      /exact .*b-kf-r1-temp-dev-r1-0\.4\.7\/wechatgame candidate/,
    );
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("candidate preparation recomputes every runtime frame instead of trusting manifest hashes", () => {
  const temporaryRoot = mkdtempSync(resolve(tmpdir(), "tonight-b-kf-r1-integrity-"));
  const sourceManifest = json("assets/outdoor-story-b-kf-r1-temp/asset-manifest.json");
  const sourceBoundary = json("assets/outdoor-story-b-kf-r1-temp/asset-boundary.json");
  const runtimeBytes = {
    "b01-settle.png": Buffer.from("fixture-b01"),
    "b02-wind-passes.png": Buffer.from("fixture-b02"),
    "b03-afterwind.png": Buffer.from("fixture-b03"),
  };

  try {
    const runtimeSha256 = Object.fromEntries(
      Object.entries(runtimeBytes).map(([name, bytes]) => [
        name,
        createHash("sha256").update(bytes).digest("hex"),
      ]),
    );
    const manifest = structuredClone(sourceManifest);
    const assets = (manifest.source as Record<string, unknown>).assets as Array<Record<string, unknown>>;
    for (const asset of assets) {
      const runtimeFile = String(asset.runtimeFile);
      asset.runtimeSha256 = runtimeSha256[runtimeFile];
      asset.runtimeBytes = runtimeBytes[runtimeFile].length;
    }
    writeFileSync(resolve(temporaryRoot, "asset-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    const manifestSha256 = createHash("sha256")
      .update(readFileSync(resolve(temporaryRoot, "asset-manifest.json")))
      .digest("hex");
    writeFileSync(
      resolve(temporaryRoot, "asset-boundary.json"),
      `${JSON.stringify({
        ...sourceBoundary,
        assetManifestSha256: manifestSha256,
        runtimeSha256,
      }, null, 2)}\n`,
    );
    for (const [name, bytes] of Object.entries(runtimeBytes)) {
      writeFileSync(resolve(temporaryRoot, name), bytes);
    }

    assert.deepEqual(verifyStoryAssetIntegrity(temporaryRoot).runtimeSha256, runtimeSha256);
    writeFileSync(resolve(temporaryRoot, "b02-wind-passes.png"), "tampered-runtime-frame");
    assert.throws(
      () => verifyStoryAssetIntegrity(temporaryRoot),
      /runtime hash drifted for b02-wind-passes\.png/,
    );
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("warm-room preview assets retain history and add only the exact disposable 0.4.7 candidate", () => {
  const boundary = json("assets/indoor-n01-preview/asset-boundary.json");
  assert.equal(
    boundary.candidateId,
    "gate-d-story-b-kf-r1-temp-dev-r1-0.4.7",
  );
  assert.equal(boundary.supersedes, "gate-d-mainflow-v4-r2-edgefix-01-dev-r10-0.4.6");
  assert.deepEqual(boundary.excludedCandidateIds, [
    "gate-d-mainflow-v4-phone-preview-dev-r9-0.4.6",
  ]);
  assert.equal(
    boundary.classification,
    "prototype-only / disposable / experience-v0.4.3-through-v0.4.7-only / gate-d-story-b-kf-r1-temp-dev-r1-0.4.7-only",
  );
  assert.deepEqual(boundary.allowedUse, [
    "local web-mobile diagnostic build",
    "one disposable WeChat developer preview candidate",
    "one WeChat developer upload version 0.4.3 and its corresponding user-promoted experience version",
    "one WeChat developer upload version 0.4.4 and its corresponding user-promoted experience version",
    "one WeChat developer upload version 0.4.5 and its corresponding user-promoted experience version",
    "one WeChat developer upload version 0.4.6 and its corresponding user-promoted experience version",
    "local OUTDOOR-ILLUSTRATION-WIND-V1-A-R2 / R2-EDGEFIX-01 candidate",
    "one WeChat developer upload version 0.4.7 and its corresponding user-promoted experience version",
    "gate-d-story-b-kf-r1-temp-dev-r1-0.4.7 disposable candidate only",
  ]);
  assert.deepEqual(boundary.forbiddenUse, [
    "formal production asset",
    "review submission",
    "any remote upload or experience version other than 0.4.3, 0.4.4, 0.4.5, 0.4.6 or 0.4.7 unless separately authorized by the user",
    "public release",
  ]);
  assert.equal(
    boundary.derivedBackplateSha256,
    sha256("assets/indoor-n01-preview/formal-ui-v1-2-a-preview.jpg"),
  );
  assert.equal(
    boundary.temporarySoundSha256,
    sha256("assets/indoor-n01-preview/kettle-lid-answer-test-only.mp3"),
  );
  const overlayHashes = boundary.derivedOverlaySha256 as Record<string, string>;
  for (const name of ["kettle-lid-overlay.png", "cat-head-overlay.png", "spare-cup-overlay.png"]) {
    assert.equal(overlayHashes[name], sha256(`assets/indoor-n01-preview/${name}`));
  }

  const folderMeta = json("assets/indoor-n01-preview.meta");
  const userData = folderMeta.userData as Record<string, unknown>;
  assert.equal(userData.isBundle, true);
  assert.equal(userData.bundleConfigID, "indoor_n01_preview_subpackage");
  assert.equal(userData.bundleName, "indoor-n01-preview");

  const builder = json("settings/v2/packages/builder.json");
  const bundleConfig = builder.bundleConfig as Record<string, unknown>;
  const custom = bundleConfig.custom as Record<string, unknown>;
  const previewConfig = custom.indoor_n01_preview_subpackage as Record<string, unknown>;
  const configs = previewConfig.configs as Record<string, unknown>;
  const miniGame = configs.miniGame as Record<string, unknown>;
  const fallback = miniGame.fallbackOptions as Record<string, unknown>;
  assert.equal(fallback.compressionType, "subpackage");
});

test("phone preview keeps approved timings, touch sizes, reduced-motion and audible gain", () => {
  const source = text("assets/scripts/cocos/tonight-has-light-indoor-n01-preview.ts");
  assert.match(source, /candidateId: "gate-d-story-b-kf-r1-temp-dev-r1-0\.4\.7"/);
  assert.match(source, /const RESPONSE_SECONDS = 0\.62;/);
  assert.match(source, /const CAT_REVEAL_SECONDS = 1\.18;/);
  assert.match(source, /const AUTO_RIGHT_CUP_SECONDS = 4;/);
  assert.match(source, /const SETTLE_SECONDS = 1\.18;/);
  assert.match(source, /const EQUIVALENT_FADE_SECONDS = 0\.18;/);
  assert.match(source, /250\.5, 514\.5, 125, 127/);
  assert.match(source, /198, 564, 80, 88/);
  assert.match(source, /if \(reduced\) \{[\s\S]*this\.fade\(this\.cupDownOpacity/);
  assert.match(source, /audioSource\.playOnAwake = false/);
  assert.match(source, /audioSource\.volume = 0\.9/);
  assert.match(source, /playOneShot\(this\.kettleClip, 0\.85\)/);
  assert.doesNotMatch(source, /\bMask\b/);
  assert.match(source, /kettle-lid-overlay\/spriteFrame/);
  assert.match(source, /cat-head-overlay\/spriteFrame/);
  assert.match(source, /spare-cup-overlay\/spriteFrame/);
  assert.doesNotMatch(source, /SpareCupBackplateCover/);
  assert.match(source, /this\.cupDown\.angle = -8/);
  assert.match(source, /to\(0\.38, \{ angle: -12 \}\)/);
  assert.doesNotMatch(source, /LabelShadow/);
  assert.match(source, /label\.enableShadow = true/);
  assert.match(source, /label\.shadowColor = new Color\(45, 17, 5, 235\)/);
  assert.match(source, /public performAction\(action: IndoorN01SemanticAction\): boolean/);
  assert.match(source, /planIndoorN01Action\(action, bridge\.getSession\(\), bridge\.getAppFlow\(\)\)/);
  assert.match(source, /performAction: \(action\) => this\.performAction\(action\)/);
  assert.match(source, /setLargeText: \(enabled\) =>/);
  assert.match(source, /updateSettings\(\{ largeText: enabled \}\)/);
  assert.match(source, /TonightHasLightFormalEndingUi/);
  assert.match(source, /await formalEndingUi\.initialize/);
  assert.match(source, /formalEndingUi: this\.formalEndingUi\?\.getDebugSnapshot\(\) \?\? null/);
  assert.match(source, /session\.endingPromptAvailable && actions\.canRequestEnding/);

  const encodedPeakDbfs = -33.8;
  const runtimePeakDbfs = encodedPeakDbfs + 20 * Math.log10(0.9 * 0.85);
  assert.ok(runtimePeakDbfs >= -38 && runtimePeakDbfs <= -36, String(runtimePeakDbfs));
});

test("approved formal ending UI copy, actions and layout contract are wired", () => {
  const preview = text("assets/scripts/cocos/tonight-has-light-indoor-n01-preview.ts");
  const source = text("assets/scripts/cocos/tonight-has-light-formal-ending-ui.ts");
  const model = text("assets/scripts/core/formal-ending-ui.ts");
  const actions = text("assets/scripts/core/indoor-n01-actions.ts");

  assert.match(source, /ownerNodeStillAlive && rootStillAlive/);

  for (const phrase of [
    "水热了。你也先缓一会儿。",
    "再坐一会儿",
    "今晚到这里",
    "这一夜，先放在这里。",
    "给朋友留一盏灯",
    "回到夜风里",
    "有人给你留了一盏灯",
    "发给朋友",
    "先不分享",
    "这次没有发出去。",
    "再试一次",
    "留在今晚",
  ]) {
    assert.match(model, new RegExp(phrase));
  }

  assert.doesNotMatch(`${source}\n${model}`, /回房间/);
  assert.doesNotMatch(`${source}\n${model}`, /通关|奖励|领取|打卡|分享得/);
  assert.doesNotMatch(actions, /awaiting an approved editable UI/);
  assert.match(source, /Sprite,/);
  assert.match(source, /Label,/);
  assert.match(source, /Button,/);
  assert.match(source, /BlockInputEvents/);
  assert.doesNotMatch(source, /GraphicsComponent|new Graphics/);
  assert.match(source, /formal-ending-ui-v1\/wall-note\/spriteFrame/);
  assert.match(source, /formal-ending-ui-v1\/table-paper\/spriteFrame/);
  assert.match(source, /formal-ending-ui-v1\/action-paper\/spriteFrame/);
  assert.match(source, /const panelWidth = table \? 362 : 230/);
  assert.match(source, /const actionWidth = table \? 326 : 194/);
  assert.match(source, /const actionHeight = model\.typography\.scale === 1\.2 \? 52 : 48/);
  assert.match(source, /actionGapPx: 12/);
  assert.match(model, /FORMAL_ENDING_UI_LARGE_TEXT_SCALE = 1\.2/);
  assert.match(model, /FORMAL_ENDING_UI_DEFAULT_FADE_MS = 170/);
  assert.match(model, /FORMAL_ENDING_UI_REDUCED_MOTION_FADE_MS = 0/);
  assert.match(model, /if \(mode === "share-preview" \|\| mode === "share-failed"\) return "table-paper"/);
  assert.match(preview, /if \(session\.endingPromptAvailable && actions\.canRequestEnding\)/);
  assert.match(preview, /this\.performAction\("request-ending"\)/);
  assert.doesNotMatch(preview, /drawWarmPaper|endingPaperGraphics|FormalEndingUiV1A/);
});

test("approved formal session controls use persistent paper UI and an explicit start", () => {
  const preview = text("assets/scripts/cocos/tonight-has-light-indoor-n01-preview.ts");
  const source = text("assets/scripts/cocos/tonight-has-light-formal-session-controls.ts");
  const model = text("assets/scripts/core/formal-session-controls.ts");
  const ring = text("../design-system/formal-session-controls-v1/selection-ring.svg");

  assert.match(preview, /TonightHasLightFormalSessionControls/);
  assert.match(preview, /await formalSessionControls\.initialize/);
  assert.match(preview, /this\.formalSessionControls\?\.activate\(\)/);
  assert.doesNotMatch(preview, /DISPOSABLE_DURATION_MINUTES/);
  assert.doesNotMatch(preview, /SELECT_DURATION", durationMinutes: DISPOSABLE/);
  assert.match(source, /Sprite,/);
  assert.match(source, /Label,/);
  assert.match(source, /Button,/);
  assert.match(source, /BlockInputEvents/);
  assert.doesNotMatch(source, /GraphicsComponent|new Graphics/);
  assert.match(source, /formal-ending-ui-v1\/wall-note\/spriteFrame/);
  assert.match(source, /formal-ending-ui-v1\/table-paper\/spriteFrame/);
  assert.match(source, /formal-session-controls-v1\/selection-ring\/spriteFrame/);
  assert.equal((ring.match(/<path\b/g) ?? []).length, 2, "the editable selected state is one double ink ring");
  assert.equal((source.match(/DurationSelectionDoubleInkRing/g) ?? []).length, 1);
  assert.match(model, /FORMAL_SESSION_CONTROLS_ROOM_REVEAL_DELAY_MS = 650/);
  assert.match(model, /FORMAL_SESSION_CONTROLS_LARGE_TEXT_SCALE = 1\.2/);
  assert.match(model, /FORMAL_SESSION_CONTROLS_COLLAPSED_TAB_SIZE = \[48, 44\]/);
  assert.match(model, /confirmLabel: `就坐 \$\{selectedDuration\} 分钟`/);
  assert.match(source, /sendAppFlow\(\{ type: "CLOSE_SETTINGS" \}\)/);
  assert.match(source, /return bridge\.openEndingNote\(\)/);
  assert.match(source, /const panelWasVisible = this\.panelGroup\?\.active === true/);
  assert.match(source, /this\.hidePanel\(model\.motion\.opacityDurationMs, panelWasVisible\)/);
  assert.match(source, /if \(releaseShieldWhenHidden\) this\.setShield\(false\)/);
  assert.match(source, /canPerformFormalSessionControlsAction\(/);
  assert.match(source, /resolveFormalSessionControlsTableBottom\(visibleDesignHeight\)/);
  assert.match(preview, /if \(!sys\.isBrowser\) return/);
});

test("0.4.7 history stays isolated from the 0.4.8 picturebook save and resume path", () => {
  const bootstrap = text("assets/scripts/cocos/tonight-has-light-bootstrap.ts");
  const preview = text("assets/scripts/cocos/tonight-has-light-indoor-n01-preview.ts");

  assert.match(
    bootstrap,
    /FORMAL_PICTUREBOOK_PARTIAL_STORAGE_PREFIX = "formal-picturebook-partial-r1-0\.4\.8:"/,
  );
  assert.doesNotMatch(bootstrap, /phone-preview-story-b-kf-r1-temp-r1-0\.4\.7:/);
  assert.match(bootstrap, /getItem: \(key\) => sys\.localStorage\.getItem\(`\$\{FORMAL_PICTUREBOOK_PARTIAL_STORAGE_PREFIX\}\$\{key\}`\)/);
  assert.match(
    bootstrap,
    /setItem: \(key, value\) => sys\.localStorage\.setItem\([\s\S]*?FORMAL_PICTUREBOOK_PARTIAL_STORAGE_PREFIX/,
  );
  assert.doesNotMatch(bootstrap, /localStorage\.clear/);
  assert.match(bootstrap, /requestsReducedMotionFromSearch\(getStartupSearch\(\)\)/);
  assert.match(bootstrap, /\{ \.\.\.this\.save\.settings, reducedMotion: true \}/);
  assert.match(bootstrap, /resumeNightSession: false/);

  // The old preview's recovery rules remain testable as historical evidence,
  // but the current bootstrap must not instantiate that component.
  assert.match(preview, /normalizeInterruptedInteraction/);
  assert.doesNotMatch(preview, /DISPOSABLE_DURATION_MINUTES/);
  assert.doesNotMatch(preview, /SELECT_DURATION", durationMinutes: DISPOSABLE/);
  assert.match(preview, /phase === "core-dragging"/);
  assert.match(preview, /DROP_CORE", targetHit: false/);
  assert.match(preview, /\["quiet-stay", "ending", "finished"\]/);
  assert.match(preview, /phase === "micro-scene"/);
  assert.match(preview, /session\.phase === "paused" \|\| session\.phase === "loading-error"/);
  assert.doesNotMatch(bootstrap, /TonightHasLightIndoorN01Preview|mountIndoorScene/);
});

test("0.4.7 web packaging remains historical and the 0.4.8 bootstrap performs no room swap", () => {
  const source = text("assets/scripts/cocos/tonight-has-light-bootstrap.ts");
  assert.doesNotMatch(source, /mountedView|mountIndoorScene|indoor-n01-preview/);
  assert.match(source, /this\.node\.addComponent\(FormalPicturebookPartialScene\)/);

  const webConfig = json("scripts/gate-d-story-b-kf-r1-temp-web-r1-0-4-7.json");
  assert.equal(
    webConfig.buildPath,
    "project://build/gate-d-story-b-kf-r1-temp-web-r1-0.4.7",
  );
  assert.equal(webConfig.outputName, "web-mobile");
  assert.notEqual(webConfig.buildPath, "project://build/gate-d-mainflow-v3-dev");
});

test("phone preview installs the door target before outdoor assets can finish", () => {
  const source = text("assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-scene.ts");
  const startIndex = source.indexOf("protected start(): void");
  const targetIndex = source.indexOf("this.installPersistentDoorTarget();", startIndex);
  const mountIndex = source.indexOf("this.mountFromManifest(generation)", startIndex);
  assert.ok(startIndex >= 0);
  assert.ok(targetIndex > startIndex);
  assert.ok(mountIndex > targetIndex, "door input must be ready before the async layer load");
  assert.match(source, /private persistentDoorTargets = new Map<OutdoorStoryFrame, Node>\(\)/);
  assert.match(source, /const rect = outdoorStoryDoorHitArea\(frame\)\.rects\[0\]/);
  assert.match(source, /rect\.x \+ rect\.width \/ 2 - DESIGN_WIDTH \/ 2/);
  assert.match(source, /DESIGN_HEIGHT \/ 2 - rect\.y - rect\.height \/ 2/);
  assert.match(source, /this\.syncDoorTargetsFromArea\(this\.activeDoorHitArea\)/);
  assert.doesNotMatch(source, /OUTDOOR_DOOR_TOUCH_REGION|outdoor-illustration-wind-r2/);

  const sceneTargets = source.match(
    /private installInteractionTargets\(root: Node\): void \{([\s\S]*?)\n  \}/,
  )?.[1] ?? "";
  assert.doesNotMatch(sceneTargets, /OutdoorDoorTouchTarget/);
});

test("outdoor door entry has a global touch fallback for WeChat devices", () => {
  const source = text("assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-scene.ts");
  assert.match(source, /this\.installDoorInputFallback\(\);/);
  assert.match(source, /Input\.EventType\.TOUCH_START/);
  assert.match(source, /Input\.EventType\.TOUCH_END/);
  assert.match(source, /const startPoints = new Map<number, OutdoorDoorTouchStart>\(\)/);
  assert.match(source, /const touchId = event\.getID\(\)/);
  assert.match(source, /startPoints\.delete\(touchId\)/);
  assert.match(source, /event\.getUILocation\(\)/);
  assert.match(source, /event\.getLocation\(\)/);
  assert.match(source, /isOutdoorStoryDoorTap\(startPoint\.ui, endPoint\.ui, startPoint\.area\)/);
  assert.match(source, /isOutdoorStoryDoorTapInViewport\([\s\S]*startPoint\.area/);
  assert.match(source, /isOutdoorStoryDoorTap\(startPoint\.ui, endPoint\.ui, endPoint\.area\)/);
  assert.equal(
    (source.match(/area: this\.storyPages\?\.getDoorHitArea\(\) \?\? this\.activeDoorHitArea/g) ?? []).length,
    2,
  );
  assert.match(source, /width: screen\.windowSize\.width/);
  assert.match(source, /height: screen\.windowSize\.height/);
  assert.match(source, /private requestDoorEntry\(\): void/);
  assert.match(source, /DOOR_REQUEST_DEDUPE_MS = 350/);
});
