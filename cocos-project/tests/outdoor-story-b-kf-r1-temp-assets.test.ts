import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const repositoryRoot = resolve(projectRoot, "..");
const importerPath = resolve(
  projectRoot,
  "scripts/import-story-b-kf-r1-temp-assets.mjs",
);
const productionBundleRoot = resolve(
  projectRoot,
  "assets/outdoor-story-b-kf-r1-temp",
);
const approvedSourceRoot = resolve(
  repositoryRoot,
  "design-board/story-illustration-redesign-v1-b/exploration",
);

const sourceFixtures = [
  {
    beat: "B01",
    sourceFile: "b01-settle-reference-r1.png",
    sourceSha256: "fdac7f8edf8a22954a93a3f756ab2c1699c1afe04462bf2fa3ed679ae2794d0c",
    runtimeFile: "b01-settle.png",
  },
  {
    beat: "B02",
    sourceFile: "b02-wind-passes-r1.png",
    sourceSha256: "e0f00f2b573dda25b91f53aa5e04fa72456fa3ed1f784a1087b4238083504727",
    runtimeFile: "b02-wind-passes.png",
  },
  {
    beat: "B03",
    sourceFile: "b03-afterwind-detail-r1.png",
    sourceSha256: "8da6d324520fce5175a1f0546a8cb67e29c041795d002439a5add28a80ea1b67",
    runtimeFile: "b03-afterwind.png",
  },
] as const;

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function json(path: string): any {
  return JSON.parse(readFileSync(path, "utf8"));
}

function pngHeader(path: string): {
  width: number;
  height: number;
  bitDepth: number;
  colorType: number;
} {
  const bytes = readFileSync(path);
  assert.deepEqual(
    [...bytes.subarray(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10],
    `${basename(path)} must be a PNG`,
  );
  assert.equal(bytes.subarray(12, 16).toString("ascii"), "IHDR");
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    bitDepth: bytes[24]!,
    colorType: bytes[25]!,
  };
}

function runImporter(sourceRoot: string, outputRoot: string) {
  return spawnSync(
    process.execPath,
    [
      importerPath,
      "--source-root",
      sourceRoot,
      "--output-root",
      outputRoot,
    ],
    { encoding: "utf8" },
  );
}

test("committed KF-R1 bundle records exact approved sources and opaque 780x1688 runtime PNGs", () => {
  const manifest = json(resolve(productionBundleRoot, "asset-manifest.json"));
  assert.equal(manifest.candidateId, "gate-d-story-b-kf-r1-temp-dev-r1-0.4.7");
  assert.equal(manifest.developerVersion, "0.4.7");
  assert.equal(
    manifest.classification,
    "prototype-only / disposable / ImageGen-exploration / one-0.4.7-developer-upload-only / not-for-review / not-for-release",
  );
  assert.deepEqual(manifest.bundle, {
    name: "outdoor-story-b-kf-r1-temp",
    configId: "outdoor_story_b_kf_r1_temp_experience_subpackage",
    excludedBundles: ["outdoor-illustration-wind-r2"],
  });
  assert.equal(
    manifest.source.property,
    "ImageGen exploration / prototype-only / not-production-art",
  );
  assert.equal(manifest.source.assets.length, 3);

  let totalBytes = 0;
  for (const expected of sourceFixtures) {
    const asset = manifest.source.assets.find((entry: any) => entry.beat === expected.beat);
    assert.ok(asset, `${expected.beat} must be listed`);
    assert.equal(
      asset.sourcePath,
      `design-board/story-illustration-redesign-v1-b/exploration/${expected.sourceFile}`,
    );
    assert.equal(asset.sourceSha256, expected.sourceSha256);
    assert.deepEqual(asset.sourceDimensions, [853, 1844]);
    assert.equal(asset.runtimeFile, expected.runtimeFile);
    assert.deepEqual(asset.runtimeDimensions, [780, 1688]);
    assert.equal(asset.channels, 3);
    assert.equal(asset.hasAlpha, false);

    const runtimePath = resolve(productionBundleRoot, expected.runtimeFile);
    assert.equal(asset.runtimeSha256, sha256(runtimePath));
    assert.equal(asset.runtimeBytes, readFileSync(runtimePath).byteLength);
    assert.deepEqual(pngHeader(runtimePath), {
      width: 780,
      height: 1688,
      bitDepth: 8,
      colorType: 2,
    });
    totalBytes += asset.runtimeBytes;
  }
  assert.equal(manifest.runtimeTotalBytes, totalBytes);
});

test("importer deterministically derives the same three runtime images and complete metadata", () => {
  const temporaryRoot = mkdtempSync(resolve(tmpdir(), "tonight-kf-r1-import-"));
  const firstOutput = resolve(temporaryRoot, "first", "outdoor-story-b-kf-r1-temp");
  const secondOutput = resolve(temporaryRoot, "second", "outdoor-story-b-kf-r1-temp");

  try {
    const first = runImporter(approvedSourceRoot, firstOutput);
    assert.equal(first.status, 0, `${first.stdout}\n${first.stderr}`);
    const second = runImporter(approvedSourceRoot, secondOutput);
    assert.equal(second.status, 0, `${second.stdout}\n${second.stderr}`);

    const firstManifest = json(resolve(firstOutput, "asset-manifest.json"));
    const secondManifest = json(resolve(secondOutput, "asset-manifest.json"));
    assert.deepEqual(firstManifest, secondManifest);
    assert.deepEqual(
      json(resolve(firstOutput, "asset-boundary.json")),
      json(resolve(secondOutput, "asset-boundary.json")),
    );

    for (const expected of sourceFixtures) {
      assert.equal(
        sha256(resolve(firstOutput, expected.runtimeFile)),
        sha256(resolve(secondOutput, expected.runtimeFile)),
      );
      assert.deepEqual(
        json(resolve(firstOutput, `${expected.runtimeFile}.meta`)),
        json(resolve(secondOutput, `${expected.runtimeFile}.meta`)),
      );
    }
    for (const metadata of [
      "asset-manifest.json.meta",
      "asset-boundary.json.meta",
    ]) {
      assert.deepEqual(
        json(resolve(firstOutput, metadata)),
        json(resolve(secondOutput, metadata)),
      );
    }
    assert.deepEqual(json(`${firstOutput}.meta`), json(`${secondOutput}.meta`));
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("importer rejects a changed source hash before creating any bundle output", () => {
  const temporaryRoot = mkdtempSync(resolve(tmpdir(), "tonight-kf-r1-reject-"));
  const sourceRoot = resolve(temporaryRoot, "source");
  const outputRoot = resolve(temporaryRoot, "output", "outdoor-story-b-kf-r1-temp");
  mkdirSync(sourceRoot, { recursive: true });

  try {
    for (const source of sourceFixtures) {
      copyFileSync(
        resolve(approvedSourceRoot, source.sourceFile),
        resolve(sourceRoot, source.sourceFile),
      );
    }
    appendFileSync(resolve(sourceRoot, "b02-wind-passes-r1.png"), Buffer.from([0]));

    const result = runImporter(sourceRoot, outputRoot);
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /B02 source SHA-256 mismatch/i);
    assert.equal(existsSync(outputRoot), false);
    assert.equal(existsSync(`${outputRoot}.meta`), false);
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("bundle boundary permits only local validation and the exact 0.4.7 developer experience path", () => {
  const manifestPath = resolve(productionBundleRoot, "asset-manifest.json");
  const manifest = json(manifestPath);
  const boundary = json(resolve(productionBundleRoot, "asset-boundary.json"));
  assert.equal(boundary.candidateId, "gate-d-story-b-kf-r1-temp-dev-r1-0.4.7");
  assert.equal(boundary.developerVersion, "0.4.7");
  assert.equal(boundary.assetManifestSha256, sha256(manifestPath));
  assert.deepEqual(
    boundary.sourceSha256,
    Object.fromEntries(sourceFixtures.map((entry) => [entry.beat, entry.sourceSha256])),
  );
  assert.deepEqual(
    boundary.runtimeSha256,
    Object.fromEntries(
      sourceFixtures.map((entry) => [
        entry.runtimeFile,
        manifest.source.assets.find((asset: any) => asset.beat === entry.beat).runtimeSha256,
      ]),
    ),
  );
  assert.deepEqual(boundary.allowedUse, [
    "local validation and evidence capture",
    "one WeChat developer upload version 0.4.7",
    "the user may independently promote that exact 0.4.7 developer upload to an experience version",
  ]);
  assert.deepEqual(boundary.forbiddenUse, [
    "formal production asset",
    "reuse in any candidate or version other than the exact 0.4.7 candidate",
    "review submission",
    "release",
    "public release",
  ]);
  assert.deepEqual(boundary.recursiveGuard, {
    scope: "this source directory and every directly or transitively derived build artifact",
    review: "deny",
    release: "deny",
    publicRelease: "deny",
  });
  assert.deepEqual(boundary.inactiveHistoricalPackaging, [
    {
      bundle: "outdoor-illustration-wind-r2",
      runtimeReferenced: false,
      evidenceUse: "forbidden",
    },
  ]);
  assert.equal(
    boundary.release_guard,
    "must recursively reject every file in this directory and every derived artifact from review/release",
  );
});

test("timeline, door hotspots, reduced motion and release lifecycle stay frozen", () => {
  const manifest = json(resolve(productionBundleRoot, "asset-manifest.json"));
  assert.deepEqual(manifest.timeline, {
    B01HoldMs: 3200,
    firstTransitionMs: 300,
    B02HoldMs: 1500,
    secondTransitionMs: 360,
    B03Hold: "infinite",
  });
  assert.deepEqual(manifest.doorHotspots, {
    coordinateSpace: { width: 390, height: 844, origin: "top-left" },
    B01: { x: 291, y: 504, width: 64, height: 72 },
    B02: { x: 326, y: 406, width: 64, height: 72 },
    B03: { x: 277, y: 283, width: 64, height: 72 },
  });
  assert.deepEqual(manifest.reducedMotion, {
    fixedBeat: "B01",
    transitions: false,
  });
  assert.deepEqual(manifest.resourceLifecycle, {
    preload: "load all three runtime frames before mounting the two persistent sprites",
    retain: "retain all three frames through B03 and every in-flight transition",
    release: [
      "release all SpriteFrames after outdoor scene teardown",
      "release every successfully loaded asset after any partial-load failure",
    ],
    forbiddenRuntimeBundle: "outdoor-illustration-wind-r2",
  });
});

test("Cocos metadata registers an independent miniGame subpackage without modifying R2", () => {
  const folderMeta = json(`${productionBundleRoot}.meta`);
  const r2FolderMeta = json(resolve(projectRoot, "assets/outdoor-illustration-wind-r2.meta"));
  assert.notEqual(folderMeta.uuid, r2FolderMeta.uuid);
  assert.equal(folderMeta.userData.isBundle, true);
  assert.equal(folderMeta.userData.bundleName, "outdoor-story-b-kf-r1-temp");
  assert.equal(
    folderMeta.userData.bundleConfigID,
    "outdoor_story_b_kf_r1_temp_experience_subpackage",
  );
  assert.notEqual(folderMeta.userData.bundleConfigID, r2FolderMeta.userData.bundleConfigID);

  const uuids = new Set<string>([folderMeta.uuid]);
  for (const asset of sourceFixtures) {
    const meta = json(resolve(productionBundleRoot, `${asset.runtimeFile}.meta`));
    assert.equal(meta.userData.hasAlpha, false);
    assert.equal(meta.userData.fixAlphaTransparencyArtifacts, false);
    assert.equal(meta.subMetas.f9941.userData.width, 780);
    assert.equal(meta.subMetas.f9941.userData.height, 1688);
    assert.equal(meta.subMetas.f9941.userData.rawWidth, 780);
    assert.equal(meta.subMetas.f9941.userData.rawHeight, 1688);
    assert.equal(uuids.has(meta.uuid), false, `${asset.runtimeFile} needs a new UUID`);
    uuids.add(meta.uuid);
  }

  const builder = json(resolve(projectRoot, "settings/v2/packages/builder.json"));
  const custom = builder.bundleConfig.custom;
  const config = custom.outdoor_story_b_kf_r1_temp_experience_subpackage;
  assert.ok(config);
  assert.equal(config.configs.miniGame.configMode, "fallback");
  assert.deepEqual(config.configs.miniGame.fallbackOptions, {
    isRemote: false,
    compressionType: "subpackage",
  });
  assert.equal(
    custom.outdoor_illustration_wind_r2_experience_subpackage.configs.miniGame
      .fallbackOptions.compressionType,
    "subpackage",
  );
});
