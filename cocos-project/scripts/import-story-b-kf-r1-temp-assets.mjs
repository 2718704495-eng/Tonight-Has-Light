import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const REPOSITORY_ROOT = resolve(PROJECT_ROOT, "..");

const CANDIDATE_ID = "gate-d-story-b-kf-r1-temp-dev-r1-0.4.7";
const DEVELOPER_VERSION = "0.4.7";
const BUNDLE_NAME = "outdoor-story-b-kf-r1-temp";
const BUNDLE_CONFIG_ID = "outdoor_story_b_kf_r1_temp_experience_subpackage";
const CLASSIFICATION =
  "prototype-only / disposable / ImageGen-exploration / one-0.4.7-developer-upload-only / not-for-review / not-for-release";

const DEFAULT_SOURCE_ROOT = resolve(
  REPOSITORY_ROOT,
  "design-board/story-illustration-redesign-v1-b/exploration",
);
const DEFAULT_OUTPUT_ROOT = resolve(PROJECT_ROOT, "assets", BUNDLE_NAME);

const SOURCE_ASSETS = [
  {
    beat: "B01",
    sourceFile: "b01-settle-reference-r1.png",
    sourcePath:
      "design-board/story-illustration-redesign-v1-b/exploration/b01-settle-reference-r1.png",
    sourceSha256: "fdac7f8edf8a22954a93a3f756ab2c1699c1afe04462bf2fa3ed679ae2794d0c",
    runtimeFile: "b01-settle.png",
    uuid: "b38c12f8-141a-471e-acd9-a97441080c76",
  },
  {
    beat: "B02",
    sourceFile: "b02-wind-passes-r1.png",
    sourcePath:
      "design-board/story-illustration-redesign-v1-b/exploration/b02-wind-passes-r1.png",
    sourceSha256: "e0f00f2b573dda25b91f53aa5e04fa72456fa3ed1f784a1087b4238083504727",
    runtimeFile: "b02-wind-passes.png",
    uuid: "4655477e-b8a8-44bd-b0ed-b921f48d95d8",
  },
  {
    beat: "B03",
    sourceFile: "b03-afterwind-detail-r1.png",
    sourcePath:
      "design-board/story-illustration-redesign-v1-b/exploration/b03-afterwind-detail-r1.png",
    sourceSha256: "8da6d324520fce5175a1f0546a8cb67e29c041795d002439a5add28a80ea1b67",
    runtimeFile: "b03-afterwind.png",
    uuid: "c5838259-545a-46da-ac9c-c609fcc54843",
  },
];

const META_UUIDS = {
  bundle: "7949d8ce-d922-4759-8d02-79ae4496b3a9",
  manifest: "85250360-0bdf-4361-a8b5-e1bc22f2e81e",
  boundary: "9ad8c978-10ac-4a28-ad39-90b053726115",
};

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function sha256File(path) {
  return sha256Bytes(readFileSync(path));
}

function readPngHeader(bytes, label) {
  const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 26 || !pngSignature.every((value, index) => bytes[index] === value)) {
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

function parseArguments(args) {
  let sourceRoot = DEFAULT_SOURCE_ROOT;
  let outputRoot = DEFAULT_OUTPUT_ROOT;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--source-root") {
      const value = args[index + 1];
      if (!value) throw new Error("--source-root requires a path");
      sourceRoot = resolve(value);
      index += 1;
      continue;
    }
    if (argument === "--output-root") {
      const value = args[index + 1];
      if (!value) throw new Error("--output-root requires a path");
      outputRoot = resolve(value);
      index += 1;
      continue;
    }
    throw new Error(`unknown argument: ${argument}`);
  }
  return { sourceRoot, outputRoot };
}

function validateAllSources(sourceRoot) {
  return SOURCE_ASSETS.map((asset) => {
    const absolutePath = resolve(sourceRoot, asset.sourceFile);
    const bytes = readFileSync(absolutePath);
    const actualSha256 = sha256Bytes(bytes);
    if (actualSha256 !== asset.sourceSha256) {
      throw new Error(
        `${asset.beat} source SHA-256 mismatch: expected ${asset.sourceSha256}, got ${actualSha256}`,
      );
    }
    const header = readPngHeader(bytes, `${asset.beat} source`);
    if (
      header.width !== 853 ||
      header.height !== 1844 ||
      header.bitDepth !== 8 ||
      header.colorType !== 2
    ) {
      throw new Error(
        `${asset.beat} source PNG contract mismatch: expected 853x1844 8-bit RGB, got ${header.width}x${header.height} bitDepth=${header.bitDepth} colorType=${header.colorType}`,
      );
    }
    return { ...asset, absolutePath };
  });
}

function runFfmpeg(sourcePath, destinationPath) {
  const ffmpeg = process.env.TONIGHT_FFMPEG_PATH || "ffmpeg";
  const result = spawnSync(
    ffmpeg,
    [
      "-nostdin",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      sourcePath,
      "-map_metadata",
      "-1",
      "-vf",
      "scale=780:1688:force_original_aspect_ratio=increase:flags=lanczos,crop=780:1688:(in_w-out_w)/2:(in_h-out_h)/2,format=rgb24",
      "-frames:v",
      "1",
      "-c:v",
      "png",
      "-pix_fmt",
      "rgb24",
      "-pred",
      "mixed",
      "-compression_level",
      "9",
      "-threads",
      "1",
      "-y",
      destinationPath,
    ],
    { encoding: "utf8" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`FFmpeg failed for ${basename(sourcePath)}: ${result.stderr.trim()}`);
  }
}

function imageMeta(uuid, displayName) {
  const textureUuid = `${uuid}@6c48a`;
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
          width: 780,
          height: 1688,
          rawWidth: 780,
          rawHeight: 1688,
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
            rawPosition: [-390, -844, 0, 390, -844, 0, -390, 844, 0, 390, 844, 0],
            indexes: [0, 1, 2, 2, 1, 3],
            uv: [0, 1688, 780, 1688, 0, 0, 780, 0],
            nuv: [0, 0, 1, 0, 0, 1, 1, 1],
            minPos: [-390, -844, 0],
            maxPos: [390, 844, 0],
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
      hasAlpha: false,
      redirect: textureUuid,
    },
  };
}

function jsonMeta(uuid) {
  return {
    ver: "2.0.1",
    importer: "json",
    imported: true,
    uuid,
    files: [".json"],
    subMetas: {},
    userData: {},
  };
}

function bundleMeta() {
  return {
    ver: "1.2.0",
    importer: "directory",
    imported: true,
    uuid: META_UUIDS.bundle,
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

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function importStoryBKfR1TempAssets({
  sourceRoot = DEFAULT_SOURCE_ROOT,
  outputRoot = DEFAULT_OUTPUT_ROOT,
} = {}) {
  const validatedSources = validateAllSources(resolve(sourceRoot));
  const resolvedOutputRoot = resolve(outputRoot);
  const outputParent = dirname(resolvedOutputRoot);
  mkdirSync(outputParent, { recursive: true });
  const stagingRoot = mkdtempSync(
    resolve(outputParent, `.${basename(resolvedOutputRoot)}-staging-`),
  );

  try {
    const runtimeAssets = validatedSources.map((asset) => {
      const runtimePath = resolve(stagingRoot, asset.runtimeFile);
      runFfmpeg(asset.absolutePath, runtimePath);
      const runtimeBytes = readFileSync(runtimePath);
      const header = readPngHeader(runtimeBytes, `${asset.beat} runtime`);
      if (
        header.width !== 780 ||
        header.height !== 1688 ||
        header.bitDepth !== 8 ||
        header.colorType !== 2
      ) {
        throw new Error(
          `${asset.beat} runtime PNG contract mismatch: expected 780x1688 8-bit RGB, got ${header.width}x${header.height} bitDepth=${header.bitDepth} colorType=${header.colorType}`,
        );
      }
      writeJson(
        resolve(stagingRoot, `${asset.runtimeFile}.meta`),
        imageMeta(asset.uuid, basename(asset.runtimeFile, ".png")),
      );
      return {
        beat: asset.beat,
        sourcePath: asset.sourcePath,
        sourceSha256: asset.sourceSha256,
        sourceDimensions: [853, 1844],
        runtimeFile: asset.runtimeFile,
        runtimeSha256: sha256Bytes(runtimeBytes),
        runtimeDimensions: [780, 1688],
        runtimeBytes: runtimeBytes.byteLength,
        channels: 3,
        hasAlpha: false,
      };
    });

    const manifest = {
      schema: "tonight-has-light.outdoor-story-b-kf-r1-temp.v1",
      candidateId: CANDIDATE_ID,
      developerVersion: DEVELOPER_VERSION,
      classification: CLASSIFICATION,
      bundle: {
        name: BUNDLE_NAME,
        configId: BUNDLE_CONFIG_ID,
        excludedBundles: ["outdoor-illustration-wind-r2"],
      },
      source: {
        property: "ImageGen exploration / prototype-only / not-production-art",
        assets: runtimeAssets,
      },
      derivation: {
        operation: "cover/center",
        resize: "FFmpeg libswscale Lanczos",
        output: "780x1688 RGB PNG without alpha",
        pngCompressionLevel: 9,
        metadataCopied: false,
      },
      runtimeTotalBytes: runtimeAssets.reduce((total, asset) => total + asset.runtimeBytes, 0),
      timeline: {
        B01HoldMs: 3200,
        firstTransitionMs: 300,
        B02HoldMs: 1500,
        secondTransitionMs: 360,
        B03Hold: "infinite",
      },
      doorHotspots: {
        coordinateSpace: { width: 390, height: 844, origin: "top-left" },
        B01: { x: 291, y: 504, width: 64, height: 72 },
        B02: { x: 326, y: 406, width: 64, height: 72 },
        B03: { x: 277, y: 283, width: 64, height: 72 },
      },
      reducedMotion: {
        fixedBeat: "B01",
        transitions: false,
      },
      resourceLifecycle: {
        preload: "load all three runtime frames before mounting the two persistent sprites",
        retain: "retain all three frames through B03 and every in-flight transition",
        release: [
          "release all SpriteFrames after outdoor scene teardown",
          "release every successfully loaded asset after any partial-load failure",
        ],
        forbiddenRuntimeBundle: "outdoor-illustration-wind-r2",
      },
    };
    const manifestPath = resolve(stagingRoot, "asset-manifest.json");
    writeJson(manifestPath, manifest);
    writeJson(
      resolve(stagingRoot, "asset-manifest.json.meta"),
      jsonMeta(META_UUIDS.manifest),
    );

    const boundary = {
      candidateId: CANDIDATE_ID,
      developerVersion: DEVELOPER_VERSION,
      classification: CLASSIFICATION,
      assetManifestSha256: sha256File(manifestPath),
      sourceSha256: Object.fromEntries(
        runtimeAssets.map((asset) => [asset.beat, asset.sourceSha256]),
      ),
      runtimeSha256: Object.fromEntries(
        runtimeAssets.map((asset) => [asset.runtimeFile, asset.runtimeSha256]),
      ),
      allowedUse: [
        "local validation and evidence capture",
        "one WeChat developer upload version 0.4.7",
        "the user may independently promote that exact 0.4.7 developer upload to an experience version",
      ],
      forbiddenUse: [
        "formal production asset",
        "reuse in any candidate or version other than the exact 0.4.7 candidate",
        "review submission",
        "release",
        "public release",
      ],
      recursiveGuard: {
        scope: "this source directory and every directly or transitively derived build artifact",
        review: "deny",
        release: "deny",
        publicRelease: "deny",
      },
      inactiveHistoricalPackaging: [
        {
          bundle: "outdoor-illustration-wind-r2",
          runtimeReferenced: false,
          evidenceUse: "forbidden",
        },
      ],
      release_guard:
        "must recursively reject every file in this directory and every derived artifact from review/release",
    };
    writeJson(resolve(stagingRoot, "asset-boundary.json"), boundary);
    writeJson(
      resolve(stagingRoot, "asset-boundary.json.meta"),
      jsonMeta(META_UUIDS.boundary),
    );

    if (existsSync(resolvedOutputRoot)) {
      rmSync(resolvedOutputRoot, { recursive: true, force: true });
    }
    renameSync(stagingRoot, resolvedOutputRoot);
    writeJson(`${resolvedOutputRoot}.meta`, bundleMeta());

    return {
      outputRoot: resolvedOutputRoot,
      runtimeAssets,
      runtimeTotalBytes: manifest.runtimeTotalBytes,
      assetManifestSha256: boundary.assetManifestSha256,
    };
  } catch (error) {
    rmSync(stagingRoot, { recursive: true, force: true });
    throw error;
  }
}

function main() {
  const result = importStoryBKfR1TempAssets(parseArguments(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
