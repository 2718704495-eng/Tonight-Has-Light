import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const DEFAULT_REPOSITORY_ROOT = resolve(PROJECT_ROOT, "..");
const BUNDLE_NAME = "formal-picturebook-partial-0-4-8";
const BUNDLE_CONFIG_ID = "formal_picturebook_partial_0_4_8_subpackage";
const DEVELOPER_VERSION = "0.4.8";
const CANDIDATE_ID = "formal-picturebook-partial-0-4-8-assets-r1";
const DEFAULT_OUTPUT_ROOT = resolve(PROJECT_ROOT, "assets", BUNDLE_NAME);
const CLASSIFICATION =
  "user-approved formal picturebook / exact-byte runtime copies / WeChat developer 0.4.8 partial experience only / not-for-review / not-for-public-release";

const H4_APPROVAL = Object.freeze({
  path: "docs/HOME-H4-TABLE-RITUAL-V1-A-R2-APPROVAL.md",
  sha256: "9337f3315a8c623597aa29da7f8edbdb3540b89bd72dd29767145663cc846579",
});

const SOURCE_ASSETS = Object.freeze([
  {
    id: "root",
    runtimePath: "root/root-wind-hem-r4.png",
    cocosPath: "root/root-wind-hem-r4/spriteFrame",
    sourcePath:
      "design-system/formal-picturebook-fullframe-v1-a-root-r4-manual-hem/exports/390x844/root_night_slope_v2-wind-hem-r4-manual.png",
    sourceSha256: "23443918a0c892d569a6fd49b55b889d70bb4ed0dc7a6396a0af2bf5fad2306a",
    approval: {
      path: "docs/ROOT-WIND-HEM-V1-A-R4-APPROVAL.md",
      sha256: "15f9a7e8ceefa973d79073091fda31502c65a3a67ab91f05d2b2c6e612a91cd5",
    },
    hasAlpha: true,
    requiresTransparency: false,
    sourceProperty: "approved-manual-local-repaint-fullframe",
  },
  {
    id: "stargaze-f1",
    runtimePath: "stargaze/f1.png",
    cocosPath: "stargaze/f1/spriteFrame",
    sourcePath:
      "design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_001/exports/390x844/scene_02_stargaze_shot_001.png",
    sourceSha256: "6b2450a1993742545b83958d4f17913fda63a512071f42fa0a148feb4856c26e",
    approval: {
      path: "docs/STARGAZE-F1-FORMAL-V1-A-R1-APPROVAL.md",
      sha256: "8734a1faea6914ac3f18191cd56a05445bae71af36c6b4193ad31ffd0ccf20a9",
    },
    hasAlpha: true,
    requiresTransparency: false,
    sourceProperty: "ai-assisted-formal-fullframe",
  },
  {
    id: "stargaze-f2",
    runtimePath: "stargaze/f2.png",
    cocosPath: "stargaze/f2/spriteFrame",
    sourcePath:
      "design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_002/exports/390x844/scene_02_stargaze_shot_002.png",
    sourceSha256: "98e267506a5485a93fdefa9759611c0ac4de2120edd5dc61d253a9ff59deee52",
    approval: {
      path: "docs/STARGAZE-F2-FORMAL-V1-A-R1-APPROVAL.md",
      sha256: "3bd650ae45aad106120554b68571e2700d8853f8252db6e813dcd23d934e6592",
    },
    hasAlpha: false,
    requiresTransparency: false,
    sourceProperty: "ai-assisted-formal-fullframe",
  },
  {
    id: "stargaze-f3",
    runtimePath: "stargaze/f3.png",
    cocosPath: "stargaze/f3/spriteFrame",
    sourcePath:
      "design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_003/exports/390x844/scene_02_stargaze_shot_003.png",
    sourceSha256: "ae9cc70c56be5b8f83e985058d7ab40bc71a0aa0f5f32819bb2706f0111244ec",
    approval: {
      path: "docs/STARGAZE-F3-FORMAL-V1-A-R2-APPROVAL.md",
      sha256: "900f459898f6e3c8dfffea8c9e2e9c069542e5320b51967db534eccf8e98e37e",
    },
    hasAlpha: false,
    requiresTransparency: false,
    sourceProperty: "ai-assisted-formal-fullframe",
  },
  {
    id: "stargaze-f4",
    runtimePath: "stargaze/f4.png",
    cocosPath: "stargaze/f4/spriteFrame",
    sourcePath:
      "design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_004/exports/390x844/scene_02_stargaze_shot_004.png",
    sourceSha256: "0973fec9fc18cfdb7422dcef32941a1fb071f84c95154cb10fd1d5279bda1ae9",
    approval: {
      path: "docs/STARGAZE-F4-FORMAL-V1-A-R1-APPROVAL.md",
      sha256: "70a6ca2a57a5ba9c3d6e42f50623e1705d33c62e02580c715206d58f847e3a67",
    },
    hasAlpha: false,
    requiresTransparency: false,
    sourceProperty: "ai-assisted-formal-fullframe",
  },
  {
    id: "stargaze-f5",
    runtimePath: "stargaze/f5.png",
    cocosPath: "stargaze/f5/spriteFrame",
    sourcePath:
      "design-system/formal-picturebook-fullframe-v1-a-batch1/exports/390x844/scene_02_stargaze_shot_005.png",
    sourceSha256: "ad3a13c6a4d915f178d03d444874776e2df042f328f998de81a2bfbf0d774d8d",
    approval: {
      path: "docs/STARGAZE-F5-FORMAL-V1-A-APPROVAL.md",
      sha256: "5cdc66434662d3d6801b1d24c2f675728f986a9138d2e7abd370bc7f12391f94",
    },
    hasAlpha: true,
    requiresTransparency: false,
    sourceProperty: "ai-assisted-formal-fullframe",
  },
  {
    id: "home-h1",
    runtimePath: "home/h1.png",
    cocosPath: "home/h1/spriteFrame",
    sourcePath:
      "design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_001/exports/390x844/scene_01_home_shot_001.png",
    sourceSha256: "b68c2dfd7bcf40a9d3bd77320faecdbeff517e2b2f7f160abbf4a7d4c6a836fe",
    approval: {
      path: "docs/HOME-H1-ARRIVAL-V1-A-R2-APPROVAL.md",
      sha256: "b3f6baca9190fa278e680613b58c37f25aac017f62e72ee54f3f104878fac4f6",
    },
    hasAlpha: false,
    requiresTransparency: false,
    sourceProperty: "ai-assisted-formal-fullframe",
  },
  {
    id: "home-h2",
    runtimePath: "home/h2.png",
    cocosPath: "home/h2/spriteFrame",
    sourcePath:
      "design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_002/exports/390x844/scene_01_home_shot_002.png",
    sourceSha256: "ef11fcb38d1e515cb2f8702d7b4ea8734f0f92ac08f24c8e2a18bfad97ccc6dd",
    approval: {
      path: "docs/HOME-H2-H3-VISUAL-APPROVAL-20260831.md",
      sha256: "8c6ff2e17d67233c3a95049a114f50f12123b81ab8e128d2814dbf6ceb37dbb5",
    },
    hasAlpha: false,
    requiresTransparency: false,
    sourceProperty: "ai-assisted-formal-fullframe",
  },
  {
    id: "home-h3",
    runtimePath: "home/h3.png",
    cocosPath: "home/h3/spriteFrame",
    sourcePath:
      "design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_003/exports/390x844/scene_01_home_shot_003.png",
    sourceSha256: "c582fa5e9ad5c0f465e307472ccfc6791ed78b2d1e81663669df9151819aab72",
    approval: {
      path: "docs/HOME-H2-H3-VISUAL-APPROVAL-20260831.md",
      sha256: "8c6ff2e17d67233c3a95049a114f50f12123b81ab8e128d2814dbf6ceb37dbb5",
    },
    hasAlpha: false,
    requiresTransparency: false,
    sourceProperty: "ai-assisted-formal-fullframe",
  },
  {
    id: "home-h4",
    runtimePath: "home/h4.png",
    cocosPath: "home/h4/spriteFrame",
    sourcePath:
      "design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_004/exports/390x844/scene_01_home_shot_004.png",
    sourceSha256: "bbb02106fb4f5a820d1199eb61c7b10b5065028461bfdd6bf813276abe796533",
    approval: H4_APPROVAL,
    hasAlpha: false,
    requiresTransparency: false,
    sourceProperty: "ai-assisted-formal-fullframe",
  },
  {
    id: "home-h5",
    runtimePath: "home/h5.png",
    cocosPath: "home/h5/spriteFrame",
    sourcePath:
      "design-system/formal-picturebook-fullframe-v1-a-home-f5-wide-room-v1-a-r1/exports/390x844/scene_01_home_shot_005.png",
    sourceSha256: "569a7b9b71d16d13ad311bdea9a29d6bc93a7dc68c99892faf8c416f38bc1c51",
    approval: {
      path: "docs/HOME-F5-WIDE-ROOM-V1-A-R1-APPROVAL.md",
      sha256: "e3b9d7d7d7ed05756fd0b5fd80e4a6dcaf710bdb6b466838af138b38b5cd7106",
    },
    hasAlpha: true,
    requiresTransparency: false,
    sourceProperty: "ai-assisted-formal-fullframe",
  },
  {
    id: "home-h4-ate",
    runtimePath: "home/h4-ate.png",
    cocosPath: "home/h4-ate/spriteFrame",
    sourcePath:
      "design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_004/exports/states/ate-layer-390x844.png",
    sourceSha256: "e8a5a5bc5506a152e5834639600897362597c17eba5c60b0f1477d70f11199ab",
    approval: H4_APPROVAL,
    hasAlpha: true,
    requiresTransparency: true,
    sourceProperty: "approved-editable-response-layer",
  },
  {
    id: "home-h4-sipped",
    runtimePath: "home/h4-sipped.png",
    cocosPath: "home/h4-sipped/spriteFrame",
    sourcePath:
      "design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_004/exports/states/sipped-layer-390x844.png",
    sourceSha256: "7236e4d62713c55dd60f2598797ab3b1622c04523410fed39af3dfcdf6a3511f",
    approval: H4_APPROVAL,
    hasAlpha: true,
    requiresTransparency: true,
    sourceProperty: "approved-editable-response-layer",
  },
]);

const H4_STATES = Object.freeze({
  ate: {
    sourcePath:
      "design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_004/exports/states/scene_01_home_shot_004-ate-390x844.png",
    sourceSha256: "0a356ea97cc91afecc93c8c9a607583d63a40db0a6e0226ec224be4a47a450b5",
    layers: ["home-h4-ate"],
  },
  sipped: {
    sourcePath:
      "design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_004/exports/states/scene_01_home_shot_004-sipped-390x844.png",
    sourceSha256: "710a4b4f54641e0880639147807120594b7e43302e74ce5d97c4784614cf841e",
    layers: ["home-h4-sipped"],
  },
  both: {
    sourcePath:
      "design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_004/exports/states/scene_01_home_shot_004-both-390x844.png",
    sourceSha256: "69a9ab2b2982cd83beec6430c9684940f2b9924c5a15beb29615eeaaf722a530",
    layers: ["home-h4-ate", "home-h4-sipped"],
  },
});

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function sha256File(path) {
  return sha256Bytes(readFileSync(path));
}

function stableUuid(key) {
  const bytes = createHash("sha256").update(`tonight-has-light:${key}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function readPngHeader(bytes, label) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 26 || !signature.every((value, index) => bytes[index] === value)) {
    throw new Error(`${label} is not a valid PNG`);
  }
  if (bytes.subarray(12, 16).toString("ascii") !== "IHDR") {
    throw new Error(`${label} has no PNG IHDR header`);
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    bitDepth: bytes[24],
    colorType: bytes[25],
  };
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function directoryMeta(key) {
  return {
    ver: "1.1.0",
    importer: "directory",
    imported: true,
    uuid: stableUuid(`directory:${key}`),
    files: [],
    subMetas: {},
    userData: {},
  };
}

function jsonMeta(key) {
  return {
    ver: "2.0.1",
    importer: "json",
    imported: true,
    uuid: stableUuid(`json:${key}`),
    files: [".json"],
    subMetas: {},
    userData: {},
  };
}

function imageMeta(asset) {
  const uuid = stableUuid(`image:${asset.runtimePath}`);
  const textureUuid = `${uuid}@6c48a`;
  const displayName = basename(asset.runtimePath, ".png");
  return {
    ver: "1.0.27",
    importer: "image",
    imported: true,
    uuid,
    files: [".json", ".png"],
    subMetas: {
      "6c48a": {
        importer: "texture",
        uuid: textureUuid,
        displayName,
        id: "6c48a",
        name: "texture",
        userData: {
          wrapModeS: "clamp-to-edge",
          wrapModeT: "clamp-to-edge",
          imageUuidOrDatabaseUri: uuid,
          isUuid: true,
          visible: false,
          minfilter: "linear",
          magfilter: "linear",
          mipfilter: "none",
          anisotropy: 0,
        },
        ver: "1.0.22",
        imported: true,
        files: [".json"],
        subMetas: {},
      },
      f9941: {
        importer: "sprite-frame",
        uuid: `${uuid}@f9941`,
        displayName,
        id: "f9941",
        name: "spriteFrame",
        userData: {
          trimThreshold: 1,
          rotated: false,
          offsetX: 0,
          offsetY: 0,
          trimX: 0,
          trimY: 0,
          width: 390,
          height: 844,
          rawWidth: 390,
          rawHeight: 844,
          borderTop: 0,
          borderBottom: 0,
          borderLeft: 0,
          borderRight: 0,
          packable: false,
          pixelsToUnit: 100,
          pivotX: 0.5,
          pivotY: 0.5,
          meshType: 0,
          vertices: {
            rawPosition: [-195, -422, 0, 195, -422, 0, -195, 422, 0, 195, 422, 0],
            indexes: [0, 1, 2, 2, 1, 3],
            uv: [0, 844, 390, 844, 0, 0, 390, 0],
            nuv: [0, 0, 1, 0, 0, 1, 1, 1],
            minPos: [-195, -422, 0],
            maxPos: [195, 422, 0],
          },
          isUuid: true,
          imageUuidOrDatabaseUri: textureUuid,
          atlasUuid: "",
          trimType: "none",
        },
        ver: "1.0.12",
        imported: true,
        files: [".json"],
        subMetas: {},
      },
    },
    userData: {
      type: "sprite-frame",
      fixAlphaTransparencyArtifacts: false,
      hasAlpha: asset.hasAlpha,
      redirect: textureUuid,
    },
  };
}

function bundleMeta() {
  return {
    ver: "1.2.0",
    importer: "directory",
    imported: true,
    uuid: stableUuid(`bundle:${BUNDLE_NAME}`),
    files: [],
    subMetas: {},
    userData: {
      isBundle: true,
      bundleConfigID: BUNDLE_CONFIG_ID,
      bundleName: BUNDLE_NAME,
      priority: 9,
    },
  };
}

function parseArguments(args) {
  let repositoryRoot = DEFAULT_REPOSITORY_ROOT;
  let outputRoot = DEFAULT_OUTPUT_ROOT;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--repository-root") {
      if (!args[index + 1]) throw new Error("--repository-root requires a path");
      repositoryRoot = resolve(args[index + 1]);
      index += 1;
      continue;
    }
    if (argument === "--output-root") {
      if (!args[index + 1]) throw new Error("--output-root requires a path");
      outputRoot = resolve(args[index + 1]);
      index += 1;
      continue;
    }
    throw new Error(`unknown argument: ${argument}`);
  }
  return { repositoryRoot, outputRoot };
}

function validatePngSource(repositoryRoot, asset) {
  const absolutePath = resolve(repositoryRoot, asset.sourcePath);
  const bytes = readFileSync(absolutePath);
  const actualSha256 = sha256Bytes(bytes);
  if (actualSha256 !== asset.sourceSha256) {
    throw new Error(`${asset.id} source SHA-256 mismatch: expected ${asset.sourceSha256}, got ${actualSha256}`);
  }
  const header = readPngHeader(bytes, asset.id);
  const expectedColorType = asset.hasAlpha ? 6 : 2;
  if (
    header.width !== 390 ||
    header.height !== 844 ||
    header.bitDepth !== 8 ||
    header.colorType !== expectedColorType
  ) {
    throw new Error(
      `${asset.id} PNG contract mismatch: expected 390x844 8-bit colorType=${expectedColorType}, got ${header.width}x${header.height} bitDepth=${header.bitDepth} colorType=${header.colorType}`,
    );
  }
  const approvalPath = resolve(repositoryRoot, asset.approval.path);
  const approvalSha256 = sha256File(approvalPath);
  if (approvalSha256 !== asset.approval.sha256) {
    throw new Error(
      `${asset.id} approval SHA-256 mismatch: expected ${asset.approval.sha256}, got ${approvalSha256}`,
    );
  }
  return { ...asset, absolutePath, bytes };
}

async function loadSharp(repositoryRoot) {
  const loaderPath = resolve(
    repositoryRoot,
    "design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/scripts/sharp-loader.mjs",
  );
  const module = await import(pathToFileURL(loaderPath).href);
  return module.loadSharp();
}

async function validateTransparentOverlay(sharp, source) {
  if (!source.requiresTransparency) return null;
  const { data, info } = await sharp(source.absolutePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.width !== 390 || info.height !== 844 || info.channels !== 4) {
    throw new Error(`${source.id} decoded alpha contract mismatch`);
  }
  let transparentPixels = 0;
  let visiblePixels = 0;
  for (let offset = 3; offset < data.length; offset += 4) {
    if (data[offset] === 0) transparentPixels += 1;
    else visiblePixels += 1;
  }
  if (transparentPixels === 0 || visiblePixels === 0) {
    throw new Error(`${source.id} must contain both transparent and visible pixels`);
  }
  return { transparentPixels, visiblePixels, channels: info.channels, hasAlpha: true };
}

async function validateH4States(repositoryRoot, sharp, sourcesById) {
  const base = sourcesById.get("home-h4");
  const approvedStates = {};
  for (const [stateName, state] of Object.entries(H4_STATES)) {
    const approvedPath = resolve(repositoryRoot, state.sourcePath);
    const actualSha256 = sha256File(approvedPath);
    if (actualSha256 !== state.sourceSha256) {
      throw new Error(
        `H4 ${stateName} approved state SHA-256 mismatch: expected ${state.sourceSha256}, got ${actualSha256}`,
      );
    }
    const composited = await sharp(base.absolutePath)
      .composite(
        state.layers.map((id) => ({ input: sourcesById.get(id).absolutePath, blend: "over" })),
      )
      .ensureAlpha()
      .raw()
      .toBuffer();
    const approved = await sharp(approvedPath).ensureAlpha().raw().toBuffer();
    let pixelMismatchCount = 0;
    for (let offset = 0; offset < approved.length; offset += 4) {
      if (
        approved[offset] !== composited[offset] ||
        approved[offset + 1] !== composited[offset + 1] ||
        approved[offset + 2] !== composited[offset + 2] ||
        approved[offset + 3] !== composited[offset + 3]
      ) {
        pixelMismatchCount += 1;
      }
    }
    if (pixelMismatchCount !== 0) {
      throw new Error(`H4 ${stateName} runtime composition differs at ${pixelMismatchCount} pixels`);
    }
    approvedStates[stateName] = {
      sourcePath: state.sourcePath,
      sourceSha256: state.sourceSha256,
      layers: state.layers,
      pixelMismatchCount,
    };
  }
  return {
    baseAssetId: "home-h4",
    overlays: {
      ate: "home-h4-ate",
      sipped: "home-h4-sipped",
      both: ["home-h4-ate", "home-h4-sipped"],
    },
    approvedStates,
  };
}

export async function importFormalPicturebookPartial048Assets({
  repositoryRoot = DEFAULT_REPOSITORY_ROOT,
  outputRoot = DEFAULT_OUTPUT_ROOT,
} = {}) {
  const resolvedRepositoryRoot = resolve(repositoryRoot);
  const resolvedOutputRoot = resolve(outputRoot);
  const validatedSources = SOURCE_ASSETS.map((asset) =>
    validatePngSource(resolvedRepositoryRoot, asset),
  );
  const sourcesById = new Map(validatedSources.map((source) => [source.id, source]));
  const sharp = await loadSharp(resolvedRepositoryRoot);
  const alphaReports = Object.fromEntries(
    (
      await Promise.all(
        validatedSources
          .filter((source) => source.requiresTransparency)
          .map(async (source) => [source.id, await validateTransparentOverlay(sharp, source)]),
      )
    ),
  );
  const h4StateValidation = await validateH4States(
    resolvedRepositoryRoot,
    sharp,
    sourcesById,
  );

  const outputParent = dirname(resolvedOutputRoot);
  mkdirSync(outputParent, { recursive: true });
  const stagingRoot = mkdtempSync(resolve(outputParent, `.${basename(resolvedOutputRoot)}-staging-`));

  try {
    for (const directory of ["root", "stargaze", "home"]) {
      mkdirSync(resolve(stagingRoot, directory), { recursive: true });
      writeJson(resolve(stagingRoot, `${directory}.meta`), directoryMeta(directory));
    }

    const runtimeAssets = validatedSources.map((source) => {
      const runtimePath = resolve(stagingRoot, source.runtimePath);
      copyFileSync(source.absolutePath, runtimePath);
      const runtimeSha256 = sha256File(runtimePath);
      if (runtimeSha256 !== source.sourceSha256) {
        throw new Error(`${source.id} byte-copy verification failed`);
      }
      writeJson(`${runtimePath}.meta`, imageMeta(source));
      return {
        id: source.id,
        sourceProperty: source.sourceProperty,
        sourcePath: source.sourcePath,
        sourceSha256: source.sourceSha256,
        approval: source.approval,
        runtimePath: source.runtimePath,
        cocosPath: source.cocosPath,
        runtimeSha256,
        runtimeBytes: source.bytes.byteLength,
        dimensions: [390, 844],
        bitDepth: 8,
        channels: source.hasAlpha ? 4 : 3,
        hasAlpha: source.hasAlpha,
        ...(source.hasAlpha ? { alpha: alphaReports[source.id] } : {}),
      };
    });

    const manifest = {
      schema: "tonight-has-light.formal-picturebook-partial-0-4-8.v1",
      candidateId: CANDIDATE_ID,
      developerVersion: DEVELOPER_VERSION,
      classification: CLASSIFICATION,
      bundle: { name: BUNDLE_NAME, configId: BUNDLE_CONFIG_ID },
      derivation: {
        operation: "byte-for-byte copy",
        resize: false,
        recompress: false,
        metadataRewrite: false,
      },
      assets: runtimeAssets,
      hiddenBranches: ["breeze"],
      runtimeTotalBytes: runtimeAssets.reduce((sum, asset) => sum + asset.runtimeBytes, 0),
      h4StateValidation,
      excludedInputs: [
        "all design-board exploration images",
        "STORY-ILLUSTRATION-REDESIGN-V1-B B01-B03 temporary images",
        "OUTDOOR-ILLUSTRATION-WIND V1/R2 five-wind-page images",
        "all superseded candidates",
      ],
    };
    const manifestPath = resolve(stagingRoot, "asset-manifest.json");
    writeJson(manifestPath, manifest);
    writeJson(
      resolve(stagingRoot, "asset-manifest.json.meta"),
      jsonMeta("asset-manifest"),
    );

    const boundary = {
      schema: "tonight-has-light.formal-picturebook-partial-0-4-8.boundary.v1",
      candidateId: CANDIDATE_ID,
      developerVersion: DEVELOPER_VERSION,
      classification: CLASSIFICATION,
      assetManifestSha256: sha256File(manifestPath),
      hiddenBranches: ["breeze"],
      allowedUse: [
        "local build and validation for WeChat developer version 0.4.8",
        "one WeChat developer upload version 0.4.8",
        "the user may independently promote that exact developer upload to an experience version",
      ],
      forbiddenUse: [
        "WeChat review submission",
        "public release",
        "reuse in any candidate or version other than 0.4.8",
      ],
      h4BothState:
        "activate home/h4-ate/spriteFrame and home/h4-sipped/spriteFrame together; no third bitmap",
      guard:
        "bind every upload receipt to the final 0.4.8 build tree; deny review submission and public release",
    };
    writeJson(resolve(stagingRoot, "asset-boundary.json"), boundary);
    writeJson(
      resolve(stagingRoot, "asset-boundary.json.meta"),
      jsonMeta("asset-boundary"),
    );

    if (existsSync(resolvedOutputRoot)) {
      rmSync(resolvedOutputRoot, { recursive: true, force: true });
    }
    renameSync(stagingRoot, resolvedOutputRoot);
    writeJson(`${resolvedOutputRoot}.meta`, bundleMeta());

    return {
      outputRoot: resolvedOutputRoot,
      assetCount: runtimeAssets.length,
      runtimeTotalBytes: manifest.runtimeTotalBytes,
      assetManifestSha256: boundary.assetManifestSha256,
    };
  } catch (error) {
    rmSync(stagingRoot, { recursive: true, force: true });
    throw error;
  }
}

async function main() {
  const result = await importFormalPicturebookPartial048Assets(
    parseArguments(process.argv.slice(2)),
  );
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
