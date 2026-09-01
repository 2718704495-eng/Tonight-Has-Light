import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, resolve } from "node:path";
import {
  FORMAL_PARTIAL_ASSET_PACKAGE_ID,
  FORMAL_PARTIAL_BUNDLE_NAME,
  FORMAL_PARTIAL_CANDIDATE_ID,
  FORMAL_PARTIAL_STORAGE_PREFIX,
  FORMAL_PARTIAL_VERSION,
  allowsFormalPicturebookPartialExperience,
  blocksFormalPicturebookPartialReviewOrRelease,
} from "../scripts/wechat-formal-partial-authorization.mjs";
import {
  prepareWechatFormalPartialCandidate,
  verifyFormalPicturebookAssetIntegrity,
} from "../scripts/prepare-wechat-formal-partial-candidate.mjs";
import {
  validateWechatFormalPartialBuild,
} from "../scripts/validate-wechat-formal-partial-build.mjs";
import {
  auditWechatFormalPartialCandidate,
} from "../scripts/audit-wechat-formal-partial-candidate.mjs";
import * as formalPartialAudit from "../scripts/audit-wechat-formal-partial-candidate.mjs";
import {
  sanitizeWechatFormalPartialMainBundle,
} from "../scripts/sanitize-wechat-formal-partial-main-bundle.mjs";

const projectRoot = resolve(import.meta.dirname, "..");

const PAGE_IDS = [
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
] as const;

function sha256Bytes(bytes: Buffer | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function deterministicUuid(value: string): string {
  const hex = createHash("sha256").update(value).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function compressUuid(uuid: string): string {
  const hex = uuid.replaceAll("-", "");
  return hex.slice(0, 2) + Buffer.from(hex.slice(2), "hex").toString("base64").replace(/=+$/, "");
}

function makeAssetRoot(options: { readonly includeBoundaryRuntimeSha256?: boolean } = {}) {
  const includeBoundaryRuntimeSha256 = options.includeBoundaryRuntimeSha256 ?? true;
  const root = mkdtempSync(resolve(tmpdir(), "tonight-formal-partial-assets-"));
  const assets = PAGE_IDS.map((id) => {
    const runtimePath = id === "root"
      ? "root/root-wind-hem-r4.png"
      : id.startsWith("stargaze")
        ? `stargaze/${id.replace("stargaze-f", "f")}.png`
        : `home/${id.replace("home-", "")}.png`;
    const bytes = Buffer.from(`formal-partial-runtime-${id}`);
    mkdirSync(resolve(root, runtimePath, ".."), { recursive: true });
    writeFileSync(resolve(root, runtimePath), bytes);
    const uuid = deterministicUuid(id);
    writeJson(`${resolve(root, runtimePath)}.meta`, {
      uuid,
      subMetas: {
        f9941: { uuid: `${uuid}@f9941` },
      },
    });
    return {
      id,
      branch: id.startsWith("stargaze") ? "stargaze" : id.startsWith("home") ? "home" : "root",
      sourceProperty: id === "root"
        ? "approved-manual-local-repaint-fullframe"
        : id === "home-h4-ate" || id === "home-h4-sipped"
          ? "approved-editable-response-layer"
          : "ai-assisted-formal-fullframe",
      approved: true,
      runtimePath,
      cocosPath: runtimePath.replace(/\.png$/, "/spriteFrame"),
      runtimeSha256: sha256Bytes(bytes),
    };
  });
  const manifest = {
    schema: "tonight-has-light.formal-picturebook-partial-0-4-8.v1",
    candidateId: FORMAL_PARTIAL_ASSET_PACKAGE_ID,
    developerVersion: FORMAL_PARTIAL_VERSION,
    bundle: {
      name: FORMAL_PARTIAL_BUNDLE_NAME,
      configId: "formal_picturebook_partial_0_4_8_subpackage",
    },
    assets,
    hiddenBranches: ["breeze"],
  };
  writeJson(resolve(root, "asset-manifest.json"), manifest);
  const manifestSha256 = sha256Bytes(readFileSync(resolve(root, "asset-manifest.json")));
  const boundary: Record<string, unknown> = {
    candidateId: FORMAL_PARTIAL_ASSET_PACKAGE_ID,
    developerVersion: FORMAL_PARTIAL_VERSION,
    classification: "user-approved formal picturebook / exact-byte runtime copies / WeChat developer 0.4.8 partial experience only / not-for-review / not-for-public-release",
    assetManifestSha256: manifestSha256,
    allowedUse: [
      "one WeChat developer upload version 0.4.8",
      "the user may independently promote that exact developer upload to an experience version",
    ],
    forbiddenUse: ["review submission", "public release", "release"],
    hiddenBranches: ["breeze"],
  };
  if (includeBoundaryRuntimeSha256) {
    boundary.runtimeSha256 = Object.fromEntries([
      ...assets.map((asset) => [asset.runtimePath, asset.runtimeSha256]),
    ]);
  }
  writeJson(resolve(root, "asset-boundary.json"), boundary);
  return root;
}

function makeBuildRoot(assetRoot: string) {
  const root = mkdtempSync(resolve(tmpdir(), "tonight-formal-partial-build-"));
  const candidateRoot = resolve(root, FORMAL_PARTIAL_CANDIDATE_ID, "wechatgame");
  mkdirSync(resolve(candidateRoot, "assets", "main"), { recursive: true });
  mkdirSync(resolve(candidateRoot, "src"), { recursive: true });
  mkdirSync(resolve(candidateRoot, "subpackages", FORMAL_PARTIAL_BUNDLE_NAME), { recursive: true });
  writeJson(resolve(candidateRoot, "project.config.json"), { appid: "wx0123456789abcdef" });
  const sourceProjectConfig = resolve(root, "existing-registered-project.config.json");
  writeJson(sourceProjectConfig, {
    appid: "wx0123456789abcdef",
    projectname: "existing-registered-wechat-game",
  });
  writeJson(resolve(candidateRoot, "game.json"), {
    deviceOrientation: "portrait",
    subpackages: [
      { name: FORMAL_PARTIAL_BUNDLE_NAME, root: `subpackages/${FORMAL_PARTIAL_BUNDLE_NAME}` },
    ],
  });
  writeJson(resolve(candidateRoot, "src", "settings.json"), {
    assets: { subpackages: [FORMAL_PARTIAL_BUNDLE_NAME] },
  });
  const mainIndex = [
    "FormalPicturebookPartialScene",
    FORMAL_PARTIAL_BUNDLE_NAME,
    FORMAL_PARTIAL_STORAGE_PREFIX,
    "root-r4",
    "root/root-wind-hem-r4/spriteFrame",
    "RootInvitationSky",
    "RootInvitationHome",
    "FORMAL_PICTUREBOOK_BREEZE_HIDDEN=true",
    "stargaze-f1",
    "stargaze-f2",
    "stargaze-f3",
    "stargaze-f4",
    "stargaze-f5",
    "stargaze-finale-meteor",
    "StargazeChoiceHome",
    "StargazeChoiceStay",
    "home-h1",
    "home-h2",
    "home-h3",
    "home-h4",
    "home-h4-ate",
    "home-h4-sipped",
    "home-h5",
    "HomeReturnRoot",
    "H4_EAT",
    "H4_SIP",
    "setLargeText",
  ].join("\n");
  writeFileSync(resolve(candidateRoot, "assets", "main", "index.js"), mainIndex, "utf8");
  writeFileSync(
    resolve(candidateRoot, "subpackages", FORMAL_PARTIAL_BUNDLE_NAME, "game.js"),
    "globalThis.__formalPartial = true;\n",
    "utf8",
  );
  writeFileSync(
    resolve(candidateRoot, "subpackages", FORMAL_PARTIAL_BUNDLE_NAME, "index.js"),
    "require('./game.js');\n",
    "utf8",
  );
  const manifest = JSON.parse(readFileSync(resolve(assetRoot, "asset-manifest.json"), "utf8"));
  const builtBundleRoot = resolve(candidateRoot, "subpackages", FORMAL_PARTIAL_BUNDLE_NAME);
  const uuids: string[] = [];
  const paths: Record<string, [string, number, number]> = {};
  for (const record of manifest.assets) {
    const meta = JSON.parse(readFileSync(resolve(assetRoot, `${record.runtimePath}.meta`), "utf8"));
    const spriteUuid = `${compressUuid(meta.uuid)}@f9941`;
    const uuidIndex = uuids.push(spriteUuid) - 1;
    paths[String(uuidIndex)] = [record.cocosPath, 3, 1];
    const nativePath = resolve(builtBundleRoot, "native", meta.uuid.slice(0, 2), `${meta.uuid}.png`);
    const importPath = resolve(builtBundleRoot, "import", meta.uuid.slice(0, 2), `${meta.uuid}@f9941.json`);
    mkdirSync(resolve(nativePath, ".."), { recursive: true });
    mkdirSync(resolve(importPath, ".."), { recursive: true });
    writeFileSync(nativePath, readFileSync(resolve(assetRoot, record.runtimePath)));
    writeJson(importPath, [1, [`${compressUuid(meta.uuid)}@6c48a`], ["_textureSource"], ["cc.SpriteFrame"]]);
  }
  writeJson(resolve(builtBundleRoot, "config.json"), {
    name: FORMAL_PARTIAL_BUNDLE_NAME,
    importBase: "import",
    nativeBase: "native",
    uuids,
    paths,
  });
  const creatorLog = resolve(root, "creator-build.log");
  writeFileSync(
    creatorLog,
    [
      `Start build task, options: ${JSON.stringify({
        platform: "wechatgame",
        buildPath: `project://build/${FORMAL_PARTIAL_CANDIDATE_ID}`,
        outputName: "wechatgame",
      })}`,
      "build Task (wechatgame) Finished",
      "",
    ].join("\n"),
    "utf8",
  );
  return {
    root,
    buildRoot: candidateRoot,
    creatorLog,
    outputDir: resolve(root, "audit"),
    assetRoot,
    sourceProjectConfig,
  };
}

test("authorizes only the exact 0.4.8 formal picturebook partial developer candidate", () => {
  assert.equal(FORMAL_PARTIAL_CANDIDATE_ID, "gate-d-formal-picturebook-partial-dev-r1-0.4.8");
  assert.equal(FORMAL_PARTIAL_VERSION, "0.4.8");
  assert.equal(FORMAL_PARTIAL_STORAGE_PREFIX, "formal-picturebook-partial-r1-0.4.8:");
  assert.equal(FORMAL_PARTIAL_BUNDLE_NAME, "formal-picturebook-partial-0-4-8");

  const manifest = {
    schema: "tonight-has-light.formal-picturebook-partial-0-4-8.v1",
    candidateId: FORMAL_PARTIAL_ASSET_PACKAGE_ID,
    developerVersion: FORMAL_PARTIAL_VERSION,
    bundle: {
      name: FORMAL_PARTIAL_BUNDLE_NAME,
      configId: "formal_picturebook_partial_0_4_8_subpackage",
    },
    assets: PAGE_IDS.map((id) => ({
      id,
      sourceProperty: id === "root"
        ? "approved-manual-local-repaint-fullframe"
        : id === "home-h4-ate" || id === "home-h4-sipped"
          ? "approved-editable-response-layer"
          : "ai-assisted-formal-fullframe",
      approved: true,
      runtimePath: `${id}.png`,
    })),
    hiddenBranches: ["breeze"],
  };
  const boundary = {
    candidateId: FORMAL_PARTIAL_ASSET_PACKAGE_ID,
    developerVersion: FORMAL_PARTIAL_VERSION,
    classification: "user-approved formal picturebook / exact-byte runtime copies / WeChat developer 0.4.8 partial experience only / not-for-review / not-for-public-release",
    assetManifestSha256: "a".repeat(64),
    allowedUse: [
      "one WeChat developer upload version 0.4.8",
      "the user may independently promote that exact developer upload to an experience version",
    ],
    forbiddenUse: ["review submission", "public release"],
    hiddenBranches: ["breeze"],
  };

  assert.equal(allowsFormalPicturebookPartialExperience(boundary, "a".repeat(64), manifest), true);
  assert.equal(
    allowsFormalPicturebookPartialExperience(
      boundary,
      "a".repeat(64),
      { ...manifest, hiddenBranches: undefined },
    ),
    false,
    "the manifest must explicitly hide only the breeze branch",
  );
  assert.equal(
    allowsFormalPicturebookPartialExperience(
      { ...boundary, hiddenBranches: undefined },
      "a".repeat(64),
      manifest,
    ),
    false,
    "the boundary must explicitly hide only the breeze branch",
  );
  assert.equal(
    allowsFormalPicturebookPartialExperience(
      { ...boundary, hiddenBranches: ["breeze", "unapproved-extra"] },
      "a".repeat(64),
      manifest,
    ),
    false,
    "the hidden branch declaration must not silently grow",
  );
  assert.equal(
    allowsFormalPicturebookPartialExperience(boundary, "a".repeat(64), manifest, "gate-d-story-b-kf-r1-temp-dev-r1-0.4.7"),
    false,
  );
  assert.equal(blocksFormalPicturebookPartialReviewOrRelease(boundary), true);
});

test("prepares build identity only for the exact 0.4.8 candidate and recomputes runtime hashes", () => {
  const assetRoot = makeAssetRoot();
  const fixture = makeBuildRoot(assetRoot);
  const wrongRoot = resolve(fixture.root, "gate-d-story-b-kf-r1-temp-dev-r1-0.4.7", "wechatgame");
  mkdirSync(wrongRoot, { recursive: true });
  writeJson(resolve(wrongRoot, "game.json"), {});
  try {
    const result = prepareWechatFormalPartialCandidate(
      fixture.buildRoot,
      assetRoot,
      undefined,
      fixture.sourceProjectConfig,
    );
    assert.equal(result.identity.candidateId, FORMAL_PARTIAL_CANDIDATE_ID);
    assert.equal(result.identity.developerVersion, FORMAL_PARTIAL_VERSION);
    assert.equal(result.identity.storagePrefix, FORMAL_PARTIAL_STORAGE_PREFIX);
    assert.equal(result.identity.bundleName, FORMAL_PARTIAL_BUNDLE_NAME);
    assert.equal(result.identity.remoteOperationPerformed, false);
    assert.equal(basename(result.destination), "build-identity.json");
    assert.equal(Object.keys(result.identity.runtimeSha256).length, PAGE_IDS.length);

    writeFileSync(resolve(assetRoot, "stargaze", "f2.png"), "tampered", "utf8");
    assert.throws(
      () => verifyFormalPicturebookAssetIntegrity(assetRoot),
      /runtime hash drifted for stargaze\/f2\.png/,
    );
    assert.throws(
      () => prepareWechatFormalPartialCandidate(
        wrongRoot,
        assetRoot,
        undefined,
        fixture.sourceProjectConfig,
      ),
      /exact gate-d-formal-picturebook-partial-dev-r1-0\.4\.8\/wechatgame candidate/,
    );
  } finally {
    rmSync(assetRoot, { recursive: true, force: true });
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("prepares real-structured boundaries that omit the optional runtime hash map", () => {
  const assetRoot = makeAssetRoot({ includeBoundaryRuntimeSha256: false });
  const fixture = makeBuildRoot(assetRoot);
  try {
    const verified = verifyFormalPicturebookAssetIntegrity(assetRoot);
    assert.equal(Object.keys(verified.runtimeSha256).length, PAGE_IDS.length);
    assert.equal(
      prepareWechatFormalPartialCandidate(
        fixture.buildRoot,
        assetRoot,
        undefined,
        fixture.sourceProjectConfig,
      ).identity.remoteOperationPerformed,
      false,
    );
  } finally {
    rmSync(assetRoot, { recursive: true, force: true });
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("binds the registered AppID to one explicit existing source config without storing the AppID", () => {
  const assetRoot = makeAssetRoot();
  const fixture = makeBuildRoot(assetRoot);
  try {
    const result = prepareWechatFormalPartialCandidate(
      fixture.buildRoot,
      assetRoot,
      undefined,
      fixture.sourceProjectConfig,
    );
    const binding = result.identity.appIdBinding;
    assert.equal(binding.sourceProjectConfigSha256, sha256Bytes(readFileSync(fixture.sourceProjectConfig)));
    assert.equal(
      binding.targetProjectConfigSha256,
      sha256Bytes(readFileSync(resolve(fixture.buildRoot, "project.config.json"))),
    );
    assert.match(binding.appIdSha256, /^[0-9a-f]{64}$/);
    assert.equal(JSON.stringify(result.identity).includes("wx0123456789abcdef"), false);

    writeJson(fixture.sourceProjectConfig, {
      appid: "wx0123456789abcdef",
      projectname: "source-config-drifted-after-binding",
    });
    assert.throws(
      () => validateWechatFormalPartialBuild(
        fixture.buildRoot,
        "experience",
        assetRoot,
        fixture.sourceProjectConfig,
      ),
      /source project config hash drifted/,
    );
  } finally {
    rmSync(assetRoot, { recursive: true, force: true });
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("binds all 13 approved records to the actual Cocos subpackage paths and native bytes", () => {
  const assetRoot = makeAssetRoot();
  const fixture = makeBuildRoot(assetRoot);
  try {
    const result = prepareWechatFormalPartialCandidate(
      fixture.buildRoot,
      assetRoot,
      undefined,
      fixture.sourceProjectConfig,
    );
    assert.equal(Object.keys(result.identity.builtRuntimeAssets).length, PAGE_IDS.length);
    assert.equal(
      validateWechatFormalPartialBuild(
        fixture.buildRoot,
        "experience",
        assetRoot,
        fixture.sourceProjectConfig,
      ).status,
      "PASS",
    );

    const rootBinding = result.identity.builtRuntimeAssets.root;
    assert.equal(rootBinding.cocosPath, "root/root-wind-hem-r4/spriteFrame");
    writeFileSync(resolve(fixture.buildRoot, rootBinding.builtNativePath), "tampered-built-native", "utf8");
    assert.throws(
      () => validateWechatFormalPartialBuild(
        fixture.buildRoot,
        "experience",
        assetRoot,
        fixture.sourceProjectConfig,
      ),
      /built native hash drifted for root/,
    );
  } finally {
    rmSync(assetRoot, { recursive: true, force: true });
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("validates 0.4.8 runtime markers and rejects superseded outdoor story runtime", () => {
  const assetRoot = makeAssetRoot();
  const fixture = makeBuildRoot(assetRoot);
  try {
    prepareWechatFormalPartialCandidate(
      fixture.buildRoot,
      assetRoot,
      undefined,
      fixture.sourceProjectConfig,
    );
    assert.equal(
      validateWechatFormalPartialBuild(
        fixture.buildRoot,
        "experience",
        assetRoot,
        fixture.sourceProjectConfig,
      ).status,
      "PASS",
    );
    assert.throws(
      () => validateWechatFormalPartialBuild(
        fixture.buildRoot,
        "release",
        assetRoot,
        fixture.sourceProjectConfig,
      ),
      /0\.4\.8 partial experience is not authorized for review or release/,
    );
    writeFileSync(
      resolve(fixture.buildRoot, "assets", "main", "index.js"),
      "OutdoorStoryPages\noutdoor-story-b-kf-r1-temp\nB01\n",
      "utf8",
    );
    assert.throws(
      () => validateWechatFormalPartialBuild(
        fixture.buildRoot,
        "experience",
        assetRoot,
        fixture.sourceProjectConfig,
      ),
      /missing runtime marker: FormalPicturebookPartialScene|forbidden runtime marker present/,
    );
  } finally {
    rmSync(assetRoot, { recursive: true, force: true });
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("validator permits Cocos historical bundle names while still rejecting old runtime code", () => {
  const assetRoot = makeAssetRoot();
  const fixture = makeBuildRoot(assetRoot);
  try {
    prepareWechatFormalPartialCandidate(
      fixture.buildRoot,
      assetRoot,
      undefined,
      fixture.sourceProjectConfig,
    );
    const mainIndexPath = resolve(fixture.buildRoot, "assets", "main", "index.js");
    writeFileSync(
      mainIndexPath,
      `${readFileSync(mainIndexPath, "utf8")}\noutdoor-story-b-kf-r1-temp\noutdoor-illustration-wind-r2\n`,
      "utf8",
    );
    assert.equal(
      validateWechatFormalPartialBuild(
        fixture.buildRoot,
        "experience",
        assetRoot,
        fixture.sourceProjectConfig,
      ).status,
      "PASS",
      "Cocos can retain historical bundle-name strings without making them active runtime branches",
    );
    writeFileSync(
      mainIndexPath,
      `${readFileSync(mainIndexPath, "utf8")}\nOutdoorStoryPages\n`,
      "utf8",
    );
    assert.throws(
      () => validateWechatFormalPartialBuild(
        fixture.buildRoot,
        "experience",
        assetRoot,
        fixture.sourceProjectConfig,
      ),
      /forbidden runtime marker present: OutdoorStoryPages/,
    );
  } finally {
    rmSync(assetRoot, { recursive: true, force: true });
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("sanitizer removes unused superseded Cocos modules from the WeChat virtual main bundle", () => {
  const assetRoot = makeAssetRoot();
  const fixture = makeBuildRoot(assetRoot);
  try {
    const mainIndexPath = resolve(fixture.buildRoot, "assets", "main", "index.js");
    writeFileSync(
      mainIndexPath,
      [
        'System.register("chunks:///_virtual/main",["./formal-picturebook-partial-scene.ts","./outdoor-door-input.ts","./outdoor-gate-c-audio-gate.ts","./outdoor-gate-c-scene.ts","./outdoor-gate-c-viewport.ts","./outdoor-illustration-wind-model.ts","./outdoor-story-model.ts","./outdoor-story-pages.ts","./outdoor-story-transition.ts","./tonight-has-light-indoor-n01-preview.ts"],(function(){return{setters:[null,null,null,null,null,null,null,null,null,null],execute:function(){}}}));',
        'System.register("chunks:///_virtual/formal-picturebook-partial-scene.ts",[],(function(){return{execute:function(){FormalPicturebookPartialScene;formal-picturebook-partial-0-4-8;RootInvitationSky;RootInvitationHome;stargaze-finale-meteor;HomeReturnRoot;}}}));',
        'System.register("chunks:///_virtual/outdoor-door-input.ts",["./outdoor-story-transition.ts"],(function(){return{execute:function(){}}}));',
        'System.register("chunks:///_virtual/outdoor-gate-c-audio-gate.ts",[],(function(){return{execute:function(){}}}));',
        'System.register("chunks:///_virtual/outdoor-gate-c-scene.ts",["./outdoor-story-pages.ts"],(function(){return{execute:function(){OutdoorStoryPages;B01;B02;B03;}}}));',
        'System.register("chunks:///_virtual/outdoor-gate-c-viewport.ts",[],(function(){return{execute:function(){}}}));',
        'System.register("chunks:///_virtual/outdoor-illustration-wind-model.ts",[],(function(){return{execute:function(){OutdoorIllustrationWind;}}}));',
        'System.register("chunks:///_virtual/outdoor-story-model.ts",[],(function(){return{execute:function(){B01;B02;B03;}}}));',
        'System.register("chunks:///_virtual/outdoor-story-pages.ts",[],(function(){return{execute:function(){OutdoorStoryPages;B01;B02;}}}));',
        'System.register("chunks:///_virtual/outdoor-story-transition.ts",[],(function(){return{execute:function(){B01;B02;B03;}}}));',
        'System.register("chunks:///_virtual/tonight-has-light-indoor-n01-preview.ts",[],(function(){return{execute:function(){gate-d-story-b-kf-r1-temp-dev-r1-0.4.7;}}}));',
      ].join("\n"),
      "utf8",
    );

    const report = sanitizeWechatFormalPartialMainBundle(fixture.buildRoot, fixture.outputDir);
    assert.equal(report.status, "PASS");
    assert.deepEqual(report.removedModuleIds.sort(), [
      "outdoor-door-input.ts",
      "outdoor-gate-c-scene.ts",
      "outdoor-illustration-wind-model.ts",
      "outdoor-story-model.ts",
      "outdoor-story-pages.ts",
      "outdoor-story-transition.ts",
      "tonight-has-light-indoor-n01-preview.ts",
    ].sort());
    const sanitized = readFileSync(mainIndexPath, "utf8");
    assert.match(sanitized, /formal-picturebook-partial-scene[.]ts/);
    assert.match(sanitized, /outdoor-gate-c-audio-gate[.]ts/);
    assert.match(sanitized, /outdoor-gate-c-viewport[.]ts/);
    assert.doesNotMatch(sanitized, /OutdoorStoryPages|B01|B02|B03|OutdoorIllustrationWind|gate-d-story-b-kf-r1-temp-dev-r1-0[.]4[.]7/);
  } finally {
    rmSync(assetRoot, { recursive: true, force: true });
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("sanitizer rejects a lookalike candidate directory whose basename is not exact", () => {
  const fakeRoot = resolve(
    tmpdir(),
    `prefix-${FORMAL_PARTIAL_CANDIDATE_ID}`,
    "wechatgame",
  );
  assert.throws(
    () => sanitizeWechatFormalPartialMainBundle(fakeRoot),
    /build root must be the exact/,
  );
});

test("validator rejects fixture self-certification when identity is not bound to assets or build config", () => {
  const assetRoot = makeAssetRoot();
  const fixture = makeBuildRoot(assetRoot);
  try {
    prepareWechatFormalPartialCandidate(
      fixture.buildRoot,
      assetRoot,
      undefined,
      fixture.sourceProjectConfig,
    );
    const identityPath = resolve(fixture.buildRoot, "build-identity.json");
    const identity = JSON.parse(readFileSync(identityPath, "utf8"));
    writeJson(identityPath, {
      ...identity,
      formalAssetManifestSha256: "0".repeat(64),
      buildConfigSha256: "1".repeat(64),
    });

    assert.throws(
      () => validateWechatFormalPartialBuild(
        fixture.buildRoot,
        "experience",
        assetRoot,
        fixture.sourceProjectConfig,
      ),
      /asset manifest hash drifted|build config hash drifted/,
    );
  } finally {
    rmSync(assetRoot, { recursive: true, force: true });
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("validator requires the explicit breeze-hidden marker without banning formal breeze audio paths", () => {
  const assetRoot = makeAssetRoot();
  const fixture = makeBuildRoot(assetRoot);
  try {
    prepareWechatFormalPartialCandidate(
      fixture.buildRoot,
      assetRoot,
      undefined,
      fixture.sourceProjectConfig,
    );
    const mainIndexPath = resolve(fixture.buildRoot, "assets", "main", "index.js");
    const withoutHiddenFlag = readFileSync(mainIndexPath, "utf8")
      .replace("FORMAL_PICTUREBOOK_BREEZE_HIDDEN=true\n", "")
      + "audio/breeze-night-wind.mp3\n";
    writeFileSync(mainIndexPath, withoutHiddenFlag, "utf8");
    assert.throws(
      () => validateWechatFormalPartialBuild(
        fixture.buildRoot,
        "experience",
        assetRoot,
        fixture.sourceProjectConfig,
      ),
      /missing runtime marker: FORMAL_PICTUREBOOK_BREEZE_HIDDEN=true/,
    );
  } finally {
    rmSync(assetRoot, { recursive: true, force: true });
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("audits package budgets, subpackage presence and build provenance without remote operation", () => {
  const assetRoot = makeAssetRoot();
  const fixture = makeBuildRoot(assetRoot);
  try {
    prepareWechatFormalPartialCandidate(
      fixture.buildRoot,
      assetRoot,
      undefined,
      fixture.sourceProjectConfig,
    );
    const report = auditWechatFormalPartialCandidate(
      fixture.buildRoot,
      fixture.outputDir,
      fixture.creatorLog,
      fixture.sourceProjectConfig,
      assetRoot,
    );
    assert.equal(report.status, "PASS");
    assert.equal(report.candidateId, FORMAL_PARTIAL_CANDIDATE_ID);
    assert.equal(report.developerVersion, FORMAL_PARTIAL_VERSION);
    assert.equal(report.mainPackage.budgetBytes, 4 * 1024 * 1024);
    assert.equal(report.totalPackage.budgetBytes, 20 * 1024 * 1024);
    assert.equal(report.subpackages[FORMAL_PARTIAL_BUNDLE_NAME]?.runtimeEvidenceEligible, true);
    assert.equal(report.hiddenBranches.includes("breeze"), true);
    assert.equal(report.remoteOperationPerformed, false);
    assert.match(report.buildTreeSha256, /^[0-9a-f]{64}$/);
    assert.equal(JSON.stringify(report).includes("wx0123456789abcdef"), false);
  } finally {
    rmSync(assetRoot, { recursive: true, force: true });
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("audits non-formal subpackages as historical runtime ineligible and keeps important hashes complete", () => {
  const assetRoot = makeAssetRoot();
  const fixture = makeBuildRoot(assetRoot);
  try {
    const historicalName = "outdoor-story-b-kf-r1-temp";
    mkdirSync(resolve(fixture.buildRoot, "subpackages", historicalName), { recursive: true });
    writeFileSync(resolve(fixture.buildRoot, "subpackages", historicalName, "game.js"), "globalThis.__historical = true;\n", "utf8");
    writeFileSync(resolve(fixture.buildRoot, "subpackages", historicalName, "index.js"), "require('./game.js');\n", "utf8");
    writeJson(resolve(fixture.buildRoot, "game.json"), {
      deviceOrientation: "portrait",
      subpackages: [
        { name: FORMAL_PARTIAL_BUNDLE_NAME, root: `subpackages/${FORMAL_PARTIAL_BUNDLE_NAME}` },
        { name: historicalName, root: `subpackages/${historicalName}` },
      ],
    });
    writeJson(resolve(fixture.buildRoot, "src", "settings.json"), {
      assets: { subpackages: [FORMAL_PARTIAL_BUNDLE_NAME, historicalName] },
    });

    prepareWechatFormalPartialCandidate(
      fixture.buildRoot,
      assetRoot,
      undefined,
      fixture.sourceProjectConfig,
    );
    const report = auditWechatFormalPartialCandidate(
      fixture.buildRoot,
      fixture.outputDir,
      fixture.creatorLog,
      fixture.sourceProjectConfig,
      assetRoot,
    );
    assert.equal(report.subpackages[historicalName]?.role, "historical-runtime-ineligible");
    assert.equal(report.subpackages[historicalName]?.runtimeEvidenceEligible, false);
    for (const [path, hash] of Object.entries(report.importantHashes)) {
      assert.match(String(hash), /^[0-9a-f]{64}$/, `important hash missing for ${path}`);
    }
  } finally {
    rmSync(assetRoot, { recursive: true, force: true });
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("creates an upload receipt only when the tree is unchanged and the remote COS commit completed", () => {
  const assetRoot = makeAssetRoot();
  const fixture = makeBuildRoot(assetRoot);
  try {
    prepareWechatFormalPartialCandidate(
      fixture.buildRoot,
      assetRoot,
      undefined,
      fixture.sourceProjectConfig,
    );
    const audit = auditWechatFormalPartialCandidate(
      fixture.buildRoot,
      fixture.outputDir,
      fixture.creatorLog,
      fixture.sourceProjectConfig,
      assetRoot,
    );
    const cliLog = resolve(fixture.root, "wechat-cli-upload.log");
    const remoteLog = resolve(fixture.root, "wechat-devtools-remote.log");
    const infoOutputPath = resolve(fixture.root, "wechat-upload-info.json");
    const receiptPath = resolve(fixture.root, "upload-receipt.json");
    const uploadDescription = `今夜有灯 ${FORMAL_PARTIAL_VERSION} 最终部分体验版 tree=${audit.buildTreeSha256}；不提审不发布`;
    const packageRows = [
      { name: "TOTAL", size: audit.totalPackage.bytes },
      { name: "main", size: audit.mainPackage.bytes },
      ...Object.entries(audit.subpackages).map(([name, value]) => ({
        name: `/subpackages/${name}/`,
        size: value.bytes,
      })),
    ];
    writeJson(infoOutputPath, {
      size: {
        total: audit.totalPackage.bytes,
        packages: packageRows,
      },
    });
    writeFileSync(
      cliLog,
      ["uploading", "✔ upload", ...packageRows.map((row) => `${row.name} ${row.size}`), ""].join("\n"),
      "utf8",
    );
    writeFileSync(
      remoteLog,
      [
        "type=UPLOAD",
        `project=${fixture.buildRoot}`,
        "version=0.4.8",
        `desc=${uploadDescription}`,
        `infoOutput=${infoOutputPath}`,
        `preflightBuildTreeSha256=${audit.buildTreeSha256}`,
        "upload cos step2 startCosUpload cost 1234",
        "upload cos step3 commitTask async_<redacted> cost 456",
        "",
      ].join("\n"),
      "utf8",
    );

    const createReceipt = (formalPartialAudit as Record<string, unknown>)[
      "createWechatFormalPartialUploadReceipt"
    ];
    assert.equal(typeof createReceipt, "function");
    const receipt = (createReceipt as Function)({
      buildRoot: fixture.buildRoot,
      preflightAuditPath: resolve(fixture.outputDir, "wechat-package-audit.json"),
      cliLogPath: cliLog,
      remoteLogPath: remoteLog,
      infoOutputPath,
      uploadDescription,
      outputPath: receiptPath,
      cliExitCode: 0,
    });
    assert.equal(receipt.preUploadBuildTreeSha256, audit.buildTreeSha256);
    assert.equal(receipt.postUploadBuildTreeSha256, audit.buildTreeSha256);
    assert.deepEqual(receipt.remoteChain, {
      startCosUploadCompleted: true,
      commitTaskCompleted: true,
    });

    writeFileSync(resolve(fixture.buildRoot, "tree-mutated-after-audit.txt"), "drift", "utf8");
    assert.throws(
      () => (createReceipt as Function)({
        buildRoot: fixture.buildRoot,
        preflightAuditPath: resolve(fixture.outputDir, "wechat-package-audit.json"),
        cliLogPath: cliLog,
        remoteLogPath: remoteLog,
        infoOutputPath,
        uploadDescription,
        outputPath: receiptPath,
        cliExitCode: 0,
      }),
      /post-upload build tree hash differs from the frozen pre-upload tree/,
    );
  } finally {
    rmSync(assetRoot, { recursive: true, force: true });
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("rejects a superficial CLI success when commitTask evidence is absent", () => {
  const assetRoot = makeAssetRoot();
  const fixture = makeBuildRoot(assetRoot);
  try {
    prepareWechatFormalPartialCandidate(
      fixture.buildRoot,
      assetRoot,
      undefined,
      fixture.sourceProjectConfig,
    );
    auditWechatFormalPartialCandidate(
      fixture.buildRoot,
      fixture.outputDir,
      fixture.creatorLog,
      fixture.sourceProjectConfig,
      assetRoot,
    );
    const cliLog = resolve(fixture.root, "wechat-cli-upload.log");
    const remoteLog = resolve(fixture.root, "wechat-devtools-remote.log");
    const infoOutputPath = resolve(fixture.root, "wechat-upload-info.json");
    const preflight = JSON.parse(readFileSync(resolve(fixture.outputDir, "wechat-package-audit.json"), "utf8"));
    const uploadDescription = `今夜有灯 ${FORMAL_PARTIAL_VERSION} 最终部分体验版 tree=${preflight.buildTreeSha256}；不提审不发布`;
    writeJson(infoOutputPath, {
      size: {
        total: preflight.totalPackage.bytes,
        packages: [
          { name: "TOTAL", size: preflight.totalPackage.bytes },
          { name: "main", size: preflight.mainPackage.bytes },
          ...Object.entries(preflight.subpackages).map(([name, value]: [string, any]) => ({
            name: `/subpackages/${name}/`,
            size: value.bytes,
          })),
        ],
      },
    });
    writeFileSync(cliLog, `✔ upload\nTOTAL ${preflight.totalPackage.bytes}\nmain ${preflight.mainPackage.bytes}\n`, "utf8");
    writeFileSync(
      remoteLog,
      [
        "type=UPLOAD",
        `project=${fixture.buildRoot}`,
        "version=0.4.8",
        `desc=${uploadDescription}`,
        `infoOutput=${infoOutputPath}`,
        `preflightBuildTreeSha256=${preflight.buildTreeSha256}`,
        "upload cos step2 startCosUpload cost 1234",
        "",
      ].join("\n"),
      "utf8",
    );
    const createReceipt = (formalPartialAudit as Record<string, unknown>)[
      "createWechatFormalPartialUploadReceipt"
    ] as Function;
    assert.throws(
      () => createReceipt({
        buildRoot: fixture.buildRoot,
        preflightAuditPath: resolve(fixture.outputDir, "wechat-package-audit.json"),
        cliLogPath: cliLog,
        remoteLogPath: remoteLog,
        infoOutputPath,
        uploadDescription,
        outputPath: resolve(fixture.root, "upload-receipt.json"),
        cliExitCode: 0,
      }),
      /not one complete 0.4.8 upload task/,
    );
  } finally {
    rmSync(assetRoot, { recursive: true, force: true });
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("rejects remote upload evidence assembled from different task fragments", () => {
  const assetRoot = makeAssetRoot();
  const fixture = makeBuildRoot(assetRoot);
  try {
    prepareWechatFormalPartialCandidate(
      fixture.buildRoot,
      assetRoot,
      undefined,
      fixture.sourceProjectConfig,
    );
    auditWechatFormalPartialCandidate(
      fixture.buildRoot,
      fixture.outputDir,
      fixture.creatorLog,
      fixture.sourceProjectConfig,
      assetRoot,
    );
    const cliLog = resolve(fixture.root, "wechat-cli-upload.log");
    const remoteLog = resolve(fixture.root, "wechat-devtools-remote.log");
    const infoOutputPath = resolve(fixture.root, "wechat-upload-info.json");
    const preflight = JSON.parse(readFileSync(resolve(fixture.outputDir, "wechat-package-audit.json"), "utf8"));
    const uploadDescription = `今夜有灯 ${FORMAL_PARTIAL_VERSION} 最终部分体验版 tree=${preflight.buildTreeSha256}；不提审不发布`;
    writeJson(infoOutputPath, {
      size: {
        total: preflight.totalPackage.bytes,
        packages: [
          { name: "TOTAL", size: preflight.totalPackage.bytes },
          { name: "main", size: preflight.mainPackage.bytes },
          ...Object.entries(preflight.subpackages).map(([name, value]: [string, any]) => ({
            name: `/subpackages/${name}/`,
            size: value.bytes,
          })),
        ],
      },
    });
    writeFileSync(cliLog, `✔ upload\nTOTAL ${preflight.totalPackage.bytes}\nmain ${preflight.mainPackage.bytes}\n`, "utf8");
    writeFileSync(
      remoteLog,
      [
        "upload cos step2 startCosUpload cost 1234",
        "upload cos step3 commitTask async_<redacted> cost 456",
        "type=UPLOAD",
        `project=${fixture.buildRoot}`,
        "version=0.4.8",
        `desc=${uploadDescription}`,
        `infoOutput=${infoOutputPath}`,
        `preflightBuildTreeSha256=${preflight.buildTreeSha256}`,
        "",
      ].join("\n"),
      "utf8",
    );
    const createReceipt = (formalPartialAudit as Record<string, unknown>)[
      "createWechatFormalPartialUploadReceipt"
    ] as Function;
    assert.throws(
      () => createReceipt({
        buildRoot: fixture.buildRoot,
        preflightAuditPath: resolve(fixture.outputDir, "wechat-package-audit.json"),
        cliLogPath: cliLog,
        remoteLogPath: remoteLog,
        infoOutputPath,
        uploadDescription,
        outputPath: resolve(fixture.root, "upload-receipt.json"),
        cliExitCode: 0,
      }),
      /not one complete 0.4.8 upload task/,
    );
  } finally {
    rmSync(assetRoot, { recursive: true, force: true });
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("upload receipt binds project, info output, package sizes, tree hash, and sanitized logs", () => {
  const assetRoot = makeAssetRoot();
  const fixture = makeBuildRoot(assetRoot);
  try {
    prepareWechatFormalPartialCandidate(
      fixture.buildRoot,
      assetRoot,
      undefined,
      fixture.sourceProjectConfig,
    );
    const audit = auditWechatFormalPartialCandidate(
      fixture.buildRoot,
      fixture.outputDir,
      fixture.creatorLog,
      fixture.sourceProjectConfig,
      assetRoot,
    );
    const preflightAuditPath = resolve(fixture.outputDir, "wechat-package-audit.json");
    const cliLogPath = resolve(fixture.root, "wechat-cli-upload.log");
    const remoteLogPath = resolve(fixture.root, "wechat-devtools-remote.log");
    const infoOutputPath = resolve(fixture.root, "wechat-upload-info.json");
    const outputPath = resolve(fixture.root, "upload-receipt.json");
    const uploadDescription = `今夜有灯 ${FORMAL_PARTIAL_VERSION} 最终部分体验版 tree=${audit.buildTreeSha256}；不提审不发布`;
    const packageRows = [
      { name: "TOTAL", size: audit.totalPackage.bytes },
      { name: "main", size: audit.mainPackage.bytes },
      ...Object.entries(audit.subpackages).map(([name, value]) => ({
        name: `/subpackages/${name}/`,
        size: value.bytes,
      })),
    ];
    const writeHappyEvidence = () => {
      writeJson(infoOutputPath, { size: { total: audit.totalPackage.bytes, packages: packageRows } });
      writeFileSync(
        cliLogPath,
        ["✔ upload", ...packageRows.map((row) => `${row.name} ${row.size}`), ""].join("\n"),
        "utf8",
      );
      writeFileSync(
        remoteLogPath,
        [
          "type=UPLOAD",
          `project=${fixture.buildRoot}`,
          `version=${FORMAL_PARTIAL_VERSION}`,
          `desc=${uploadDescription}`,
          `infoOutput=${infoOutputPath}`,
          `preflightBuildTreeSha256=${audit.buildTreeSha256}`,
          "upload cos step2 startCosUpload cost 1234",
          "upload cos step3 commitTask async_<redacted> cost 456",
          "",
        ].join("\n"),
        "utf8",
      );
    };
    const createReceipt = (formalPartialAudit as Record<string, unknown>)[
      "createWechatFormalPartialUploadReceipt"
    ] as Function;
    const args = {
      buildRoot: fixture.buildRoot,
      preflightAuditPath,
      cliLogPath,
      remoteLogPath,
      infoOutputPath,
      uploadDescription,
      outputPath,
      cliExitCode: 0,
    };

    writeHappyEvidence();
    writeFileSync(remoteLogPath, readFileSync(remoteLogPath, "utf8").replace(
      `project=${fixture.buildRoot}`,
      `project=${fixture.buildRoot}-other`,
    ), "utf8");
    assert.throws(() => createReceipt(args), /does not bind the exact build root/);

    writeHappyEvidence();
    writeFileSync(remoteLogPath, readFileSync(remoteLogPath, "utf8").replace(
      `infoOutput=${infoOutputPath}`,
      `infoOutput=${infoOutputPath}.other`,
    ), "utf8");
    assert.throws(() => createReceipt(args), /does not bind the exact info output/);

    writeHappyEvidence();
    const mismatched = structuredClone(JSON.parse(readFileSync(infoOutputPath, "utf8")));
    mismatched.size.packages.find((entry: any) => entry.name === "main").size -= 1;
    writeJson(infoOutputPath, mismatched);
    assert.throws(() => createReceipt(args), /CLI package evidence does not match info output/);

    writeHappyEvidence();
    writeFileSync(cliLogPath, `${readFileSync(cliLogPath, "utf8")}Using AppID: wx0123456789abcdef\n`, "utf8");
    assert.throws(() => createReceipt(args), /contains an unredacted AppID/);

    writeHappyEvidence();
    writeFileSync(remoteLogPath, `${readFileSync(remoteLogPath, "utf8")}wx0123456789abcdef\n`, "utf8");
    assert.throws(() => createReceipt(args), /contains an unredacted AppID/);
  } finally {
    rmSync(assetRoot, { recursive: true, force: true });
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("package scripts and build configs point at the 0.4.8 formal partial candidates", () => {
  const packageJson = JSON.parse(readFileSync(resolve(projectRoot, "package.json"), "utf8"));
  assert.equal(
    packageJson.scripts["prepare:wechat-formal-partial-candidate"],
    "node scripts/prepare-wechat-formal-partial-candidate.mjs",
  );
  assert.equal(
    packageJson.scripts["sanitize:wechat-formal-partial-main"],
    "node scripts/sanitize-wechat-formal-partial-main-bundle.mjs",
  );
  assert.equal(
    packageJson.scripts["validate:wechat-formal-partial-build"],
    "node scripts/validate-wechat-formal-partial-build.mjs",
  );
  assert.equal(
    packageJson.scripts["audit:wechat-formal-partial-candidate"],
    "node scripts/audit-wechat-formal-partial-candidate.mjs",
  );
  assert.equal(
    packageJson.scripts["receipt:wechat-formal-partial-upload"],
    "node scripts/validate-wechat-formal-partial-upload-receipt.mjs",
  );

  const devConfig = JSON.parse(readFileSync(resolve(projectRoot, "scripts/gate-d-formal-picturebook-partial-dev-r1-0-4-8.json"), "utf8"));
  assert.equal(devConfig.platform, "wechatgame");
  assert.equal(devConfig.buildPath, `project://build/${FORMAL_PARTIAL_CANDIDATE_ID}`);
  assert.equal(devConfig.outputName, "wechatgame");
  assert.equal(devConfig.packages.wechatgame.orientation, "portrait");

  const webConfig = JSON.parse(readFileSync(resolve(projectRoot, "scripts/gate-d-formal-picturebook-partial-web-r1-0-4-8.json"), "utf8"));
  assert.equal(webConfig.platform, "web-mobile");
  assert.equal(webConfig.buildPath, "project://build/gate-d-formal-picturebook-partial-web-r1-0.4.8");
  assert.equal(webConfig.outputName, "web-mobile");
});
