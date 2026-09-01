import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, relative, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const repositoryRoot = resolve(projectRoot, "..");
const importerPath = resolve(
  projectRoot,
  "scripts/import-formal-picturebook-partial-0-4-8-assets.mjs",
);
const productionBundleRoot = resolve(
  projectRoot,
  "assets/formal-picturebook-partial-0-4-8",
);
const builderConfigPath = resolve(projectRoot, "settings/v2/packages/builder.json");

const approvedAssets = [
  {
    id: "root",
    runtimePath: "root/root-wind-hem-r4.png",
    cocosPath: "root/root-wind-hem-r4/spriteFrame",
    sourcePath:
      "design-system/formal-picturebook-fullframe-v1-a-root-r4-manual-hem/exports/390x844/root_night_slope_v2-wind-hem-r4-manual.png",
    sourceSha256: "23443918a0c892d569a6fd49b55b889d70bb4ed0dc7a6396a0af2bf5fad2306a",
    approvalPath: "docs/ROOT-WIND-HEM-V1-A-R4-APPROVAL.md",
    approvalSha256: "15f9a7e8ceefa973d79073091fda31502c65a3a67ab91f05d2b2c6e612a91cd5",
    hasAlpha: true,
  },
  ...[
    ["stargaze-f1", "1", "001", "6b2450a1993742545b83958d4f17913fda63a512071f42fa0a148feb4856c26e", "docs/STARGAZE-F1-FORMAL-V1-A-R1-APPROVAL.md", "8734a1faea6914ac3f18191cd56a05445bae71af36c6b4193ad31ffd0ccf20a9", true],
    ["stargaze-f2", "2", "002", "98e267506a5485a93fdefa9759611c0ac4de2120edd5dc61d253a9ff59deee52", "docs/STARGAZE-F2-FORMAL-V1-A-R1-APPROVAL.md", "3bd650ae45aad106120554b68571e2700d8853f8252db6e813dcd23d934e6592", false],
    ["stargaze-f3", "3", "003", "ae9cc70c56be5b8f83e985058d7ab40bc71a0aa0f5f32819bb2706f0111244ec", "docs/STARGAZE-F3-FORMAL-V1-A-R2-APPROVAL.md", "900f459898f6e3c8dfffea8c9e2e9c069542e5320b51967db534eccf8e98e37e", false],
    ["stargaze-f4", "4", "004", "0973fec9fc18cfdb7422dcef32941a1fb071f84c95154cb10fd1d5279bda1ae9", "docs/STARGAZE-F4-FORMAL-V1-A-R1-APPROVAL.md", "70a6ca2a57a5ba9c3d6e42f50623e1705d33c62e02580c715206d58f847e3a67", false],
  ].map(([id, frame, shot, sourceSha256, approvalPath, approvalSha256, hasAlpha]) => ({
    id,
    runtimePath: `stargaze/f${frame}.png`,
    cocosPath: `stargaze/f${frame}/spriteFrame`,
    sourcePath:
      `design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_${shot}/exports/390x844/scene_02_stargaze_shot_${shot}.png`,
    sourceSha256,
    approvalPath,
    approvalSha256,
    hasAlpha,
  })),
  {
    id: "stargaze-f5",
    runtimePath: "stargaze/f5.png",
    cocosPath: "stargaze/f5/spriteFrame",
    sourcePath:
      "design-system/formal-picturebook-fullframe-v1-a-batch1/exports/390x844/scene_02_stargaze_shot_005.png",
    sourceSha256: "ad3a13c6a4d915f178d03d444874776e2df042f328f998de81a2bfbf0d774d8d",
    approvalPath: "docs/STARGAZE-F5-FORMAL-V1-A-APPROVAL.md",
    approvalSha256: "5cdc66434662d3d6801b1d24c2f675728f986a9138d2e7abd370bc7f12391f94",
    hasAlpha: true,
  },
  ...[
    ["home-h1", "1", "001", "b68c2dfd7bcf40a9d3bd77320faecdbeff517e2b2f7f160abbf4a7d4c6a836fe", "docs/HOME-H1-ARRIVAL-V1-A-R2-APPROVAL.md", "b3f6baca9190fa278e680613b58c37f25aac017f62e72ee54f3f104878fac4f6"],
    ["home-h2", "2", "002", "ef11fcb38d1e515cb2f8702d7b4ea8734f0f92ac08f24c8e2a18bfad97ccc6dd", "docs/HOME-H2-H3-VISUAL-APPROVAL-20260831.md", "8c6ff2e17d67233c3a95049a114f50f12123b81ab8e128d2814dbf6ceb37dbb5"],
    ["home-h3", "3", "003", "c582fa5e9ad5c0f465e307472ccfc6791ed78b2d1e81663669df9151819aab72", "docs/HOME-H2-H3-VISUAL-APPROVAL-20260831.md", "8c6ff2e17d67233c3a95049a114f50f12123b81ab8e128d2814dbf6ceb37dbb5"],
    ["home-h4", "4", "004", "bbb02106fb4f5a820d1199eb61c7b10b5065028461bfdd6bf813276abe796533", "docs/HOME-H4-TABLE-RITUAL-V1-A-R2-APPROVAL.md", "9337f3315a8c623597aa29da7f8edbdb3540b89bd72dd29767145663cc846579"],
  ].map(([id, frame, shot, sourceSha256, approvalPath, approvalSha256]) => ({
    id,
    runtimePath: `home/h${frame}.png`,
    cocosPath: `home/h${frame}/spriteFrame`,
    sourcePath:
      `design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_${shot}/exports/390x844/scene_01_home_shot_${shot}.png`,
    sourceSha256,
    approvalPath,
    approvalSha256,
    hasAlpha: false,
  })),
  {
    id: "home-h5",
    runtimePath: "home/h5.png",
    cocosPath: "home/h5/spriteFrame",
    sourcePath:
      "design-system/formal-picturebook-fullframe-v1-a-home-f5-wide-room-v1-a-r1/exports/390x844/scene_01_home_shot_005.png",
    sourceSha256: "569a7b9b71d16d13ad311bdea9a29d6bc93a7dc68c99892faf8c416f38bc1c51",
    approvalPath: "docs/HOME-F5-WIDE-ROOM-V1-A-R1-APPROVAL.md",
    approvalSha256: "e3b9d7d7d7ed05756fd0b5fd80e4a6dcaf710bdb6b466838af138b38b5cd7106",
    hasAlpha: true,
  },
  {
    id: "home-h4-ate",
    runtimePath: "home/h4-ate.png",
    cocosPath: "home/h4-ate/spriteFrame",
    sourcePath:
      "design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_004/exports/states/ate-layer-390x844.png",
    sourceSha256: "e8a5a5bc5506a152e5834639600897362597c17eba5c60b0f1477d70f11199ab",
    approvalPath: "docs/HOME-H4-TABLE-RITUAL-V1-A-R2-APPROVAL.md",
    approvalSha256: "9337f3315a8c623597aa29da7f8edbdb3540b89bd72dd29767145663cc846579",
    hasAlpha: true,
  },
  {
    id: "home-h4-sipped",
    runtimePath: "home/h4-sipped.png",
    cocosPath: "home/h4-sipped/spriteFrame",
    sourcePath:
      "design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_004/exports/states/sipped-layer-390x844.png",
    sourceSha256: "7236e4d62713c55dd60f2598797ab3b1622c04523410fed39af3dfcdf6a3511f",
    approvalPath: "docs/HOME-H4-TABLE-RITUAL-V1-A-R2-APPROVAL.md",
    approvalSha256: "9337f3315a8c623597aa29da7f8edbdb3540b89bd72dd29767145663cc846579",
    hasAlpha: true,
  },
] as const;

const approvedH4States = {
  ate: {
    sourcePath:
      "design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_004/exports/states/scene_01_home_shot_004-ate-390x844.png",
    sha256: "0a356ea97cc91afecc93c8c9a607583d63a40db0a6e0226ec224be4a47a450b5",
    layers: ["home-h4-ate"],
  },
  sipped: {
    sourcePath:
      "design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_004/exports/states/scene_01_home_shot_004-sipped-390x844.png",
    sha256: "710a4b4f54641e0880639147807120594b7e43302e74ce5d97c4784614cf841e",
    layers: ["home-h4-sipped"],
  },
  both: {
    sourcePath:
      "design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_004/exports/states/scene_01_home_shot_004-both-390x844.png",
    sha256: "69a9ab2b2982cd83beec6430c9684940f2b9924c5a15beb29615eeaaf722a530",
    layers: ["home-h4-ate", "home-h4-sipped"],
  },
} as const;

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function json(path: string): any {
  return JSON.parse(readFileSync(path, "utf8"));
}

function pngHeader(path: string) {
  const bytes = readFileSync(path);
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(bytes.subarray(12, 16).toString("ascii"), "IHDR");
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    bitDepth: bytes[24],
    colorType: bytes[25],
  };
}

function runImporter(outputRoot: string) {
  return spawnSync(
    process.execPath,
    [importerPath, "--repository-root", repositoryRoot, "--output-root", outputRoot],
    { encoding: "utf8" },
  );
}

function fileHashes(root: string): Record<string, string> {
  const result: Record<string, string> = {};
  const visit = (directory: string) => {
    for (const name of readdirSync(directory).sort()) {
      const path = resolve(directory, name);
      if (statSync(path).isDirectory()) visit(path);
      else result[relative(root, path)] = sha256(path);
    }
  };
  visit(root);
  return result;
}

function assertBundle(root: string) {
  const manifest = json(resolve(root, "asset-manifest.json"));
  assert.equal(manifest.schema, "tonight-has-light.formal-picturebook-partial-0-4-8.v1");
  assert.equal(manifest.developerVersion, "0.4.8");
  assert.deepEqual(manifest.bundle, {
    name: "formal-picturebook-partial-0-4-8",
    configId: "formal_picturebook_partial_0_4_8_subpackage",
  });
  assert.deepEqual(manifest.hiddenBranches, ["breeze"]);
  assert.equal(manifest.assets.length, approvedAssets.length);

  let totalBytes = 0;
  for (const expected of approvedAssets) {
    const entry = manifest.assets.find((asset: any) => asset.id === expected.id);
    assert.ok(entry, `${expected.id} must be in the asset manifest`);
    assert.equal(entry.runtimePath, expected.runtimePath);
    assert.equal(entry.cocosPath, expected.cocosPath);
    assert.equal(entry.sourcePath, expected.sourcePath);
    assert.equal(entry.sourceSha256, expected.sourceSha256);
    assert.deepEqual(entry.approval, {
      path: expected.approvalPath,
      sha256: expected.approvalSha256,
    });
    assert.equal(entry.runtimeSha256, expected.sourceSha256, `${expected.id} must be copied byte-for-byte`);
    assert.deepEqual(entry.dimensions, [390, 844]);
    assert.equal(entry.hasAlpha, expected.hasAlpha);

    const runtimePath = resolve(root, expected.runtimePath);
    assert.equal(sha256(runtimePath), expected.sourceSha256);
    assert.deepEqual(pngHeader(runtimePath), {
      width: 390,
      height: 844,
      bitDepth: 8,
      colorType: expected.hasAlpha ? 6 : 2,
    });
    totalBytes += readFileSync(runtimePath).byteLength;
  }
  assert.equal(manifest.runtimeTotalBytes, totalBytes);

  assert.deepEqual(manifest.h4StateValidation, {
    baseAssetId: "home-h4",
    overlays: {
      ate: "home-h4-ate",
      sipped: "home-h4-sipped",
      both: ["home-h4-ate", "home-h4-sipped"],
    },
    approvedStates: Object.fromEntries(
      Object.entries(approvedH4States).map(([state, value]) => [state, {
        sourcePath: value.sourcePath,
        sourceSha256: value.sha256,
        layers: value.layers,
        pixelMismatchCount: 0,
      }]),
    ),
  });

  const boundary = json(resolve(root, "asset-boundary.json"));
  assert.deepEqual(boundary.hiddenBranches, ["breeze"]);
  assert.equal(boundary.developerVersion, "0.4.8");
  assert.deepEqual(boundary.allowedUse, [
    "local build and validation for WeChat developer version 0.4.8",
    "one WeChat developer upload version 0.4.8",
    "the user may independently promote that exact developer upload to an experience version",
  ]);
  assert.deepEqual(boundary.forbiddenUse, [
    "WeChat review submission",
    "public release",
    "reuse in any candidate or version other than 0.4.8",
  ]);
}

test("importer creates deterministic byte-identical approved 0.4.8 picturebook assets", () => {
  const temporaryRoot = mkdtempSync(resolve(tmpdir(), "tonight-formal-pbook-048-"));
  const first = resolve(temporaryRoot, "first", "formal-picturebook-partial-0-4-8");
  const second = resolve(temporaryRoot, "second", "formal-picturebook-partial-0-4-8");
  try {
    const firstRun = runImporter(first);
    assert.equal(firstRun.status, 0, `${firstRun.stdout}\n${firstRun.stderr}`);
    const secondRun = runImporter(second);
    assert.equal(secondRun.status, 0, `${secondRun.stdout}\n${secondRun.stderr}`);
    assertBundle(first);
    assert.deepEqual(fileHashes(first), fileHashes(second));
    assert.equal(sha256(`${first}.meta`), sha256(`${second}.meta`));
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("committed 0.4.8 bundle keeps approved pixels, traceability, and fixed Cocos UUIDs", () => {
  assertBundle(productionBundleRoot);
  const expectedMetaFiles = [
    "asset-boundary.json.meta",
    "asset-manifest.json.meta",
    "root.meta",
    "root/root-wind-hem-r4.png.meta",
    "stargaze.meta",
    ...[1, 2, 3, 4, 5].map((frame) => `stargaze/f${frame}.png.meta`),
    "home.meta",
    ...[1, 2, 3, 4, 5].map((frame) => `home/h${frame}.png.meta`),
    "home/h4-ate.png.meta",
    "home/h4-sipped.png.meta",
  ];
  for (const metaPath of expectedMetaFiles) {
    const meta = json(resolve(productionBundleRoot, metaPath));
    assert.match(meta.uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  }
  const bundleMeta = json(`${productionBundleRoot}.meta`);
  assert.equal(bundleMeta.userData.bundleName, "formal-picturebook-partial-0-4-8");
  assert.equal(bundleMeta.userData.bundleConfigID, "formal_picturebook_partial_0_4_8_subpackage");
});

test("H4 transparent overlays independently reproduce every approved response state", async () => {
  const { loadSharp } = await import(
    "../../design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/sharp-loader.mjs"
  );
  const sharp = await loadSharp();
  const basePath = resolve(productionBundleRoot, "home/h4.png");

  for (const overlay of ["home/h4-ate.png", "home/h4-sipped.png"]) {
    const { data, info } = await sharp(resolve(productionBundleRoot, overlay))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    assert.equal(info.channels, 4);
    let transparent = 0;
    let visible = 0;
    for (let offset = 3; offset < data.length; offset += 4) {
      if (data[offset] === 0) transparent += 1;
      else visible += 1;
    }
    assert.ok(transparent > 0, `${basename(overlay)} must have transparent pixels`);
    assert.ok(visible > 0, `${basename(overlay)} must have visible pixels`);
  }

  for (const state of Object.values(approvedH4States)) {
    const composited = await sharp(basePath)
      .composite(state.layers.map((id) => ({
        input: resolve(productionBundleRoot, approvedAssets.find((asset) => asset.id === id)!.runtimePath),
        blend: "over",
      })))
      .ensureAlpha()
      .raw()
      .toBuffer();
    const approved = await sharp(resolve(repositoryRoot, state.sourcePath))
      .ensureAlpha()
      .raw()
      .toBuffer();
    assert.equal(Buffer.compare(composited, approved), 0, `${state.sourcePath} must match runtime composition pixel-for-pixel`);
  }
});

test("builder assigns the formal partial bundle to the miniGame fallback subpackage", () => {
  const custom = json(builderConfigPath).bundleConfig.custom;
  assert.deepEqual(custom.formal_picturebook_partial_0_4_8_subpackage, {
    displayName: "Formal Picturebook Partial 0.4.8",
    configs: {
      native: { preferredOptions: { isRemote: false, compressionType: "merge_dep" } },
      web: {
        preferredOptions: { isRemote: false, compressionType: "merge_dep" },
        fallbackOptions: { compressionType: "merge_dep" },
      },
      miniGame: {
        fallbackOptions: { isRemote: false, compressionType: "subpackage" },
        configMode: "fallback",
      },
    },
  });
});
