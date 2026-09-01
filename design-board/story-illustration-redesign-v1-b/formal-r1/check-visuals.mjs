import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const boardRoot = dirname(fileURLToPath(import.meta.url));
const defaultAssetRoot = resolve(boardRoot, "../../../design-system/outdoor-story-illustration-v1-b/dist");
const defaultOutput = join(boardRoot, "evidence/visual-metrics.json");
const expectedCandidate = "STORY-ILLUSTRATION-REDESIGN-V1-B-FORMAL-R1";
const reviewManifestName = "FORMAL-REVIEW-MANIFEST.json";

const frames = [
  { id: "B01", file: "b01-settle.png", title: "坐稳" },
  { id: "B02", file: "b02-wind-passes.png", title: "风经过" },
  { id: "B03", file: "b03-afterwind.png", title: "余风" },
];

const variants = [
  { directory: "390x844", expected: [[390, 844]], label: "390×844 主图" },
  { directory: "thumbnail-195x422", expected: [[195, 422]], label: "195×422 合同缩略 / 50%" },
  { directory: "360x800", expected: [[360, 800]], label: "360×800" },
  { directory: "430x932", expected: [[430, 932]], label: "430×932" },
  { directory: "430x844-pressure", expected: [[430, 844]], label: "430×844 压力裁切" },
];

const manualChecks = [
  ["adult-cat-identity", "成年人＋普通家猫身份稳定"],
  ["shared-gaze", "共同仰望方向稳定"],
  ["single-milky-way", "恰好一条宽淡断口银河"],
  ["stable-warm-door", "右侧中景暖门稳定且不催促"],
  ["exactly-two-flowers", "恰好两朵弱光花"],
  ["material-continuity", "干笔、网点与纸张颗粒连续"],
  ["no-black-halo", "无矩形黑边、贴纸晕边或透明接缝"],
  ["no-task-map-language", "无任务地图、奖励、进度或引导语言"],
].map(([id, label]) => ({ id, label, result: null, note: "等待逐帧人工 Yes/No 复核" }));

function usage() {
  console.log("Usage: node check-visuals.mjs [--asset-root <dist>] [--output <json>]");
}

function parseArgs(argv) {
  const options = { assetRoot: defaultAssetRoot, output: defaultOutput };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") {
      usage();
      process.exit(0);
    }
    if (argument !== "--asset-root" && argument !== "--output") {
      throw new Error(`Unknown argument: ${argument}`);
    }
    const value = argv[index + 1];
    if (!value) throw new Error(`Missing value for ${argument}`);
    if (argument === "--asset-root") options.assetRoot = resolve(value);
    if (argument === "--output") options.output = resolve(value);
    index += 1;
  }
  return options;
}

function readPngDimensions(path) {
  const bytes = readFileSync(path);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(signature) || bytes.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error("not a PNG with an IHDR header");
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), bytes: bytes.length };
}

function dimensionsMatch(actual, accepted) {
  return accepted.some(([width, height]) => actual.width === width && actual.height === height);
}

function inspectReviewManifest(assetRoot) {
  const path = join(assetRoot, reviewManifestName);
  const entry = {
    path: relative(boardRoot, path),
    present: existsSync(path),
    valid: false,
    candidate: null,
    status: null,
    error: null,
  };
  if (!entry.present) {
    entry.error = `missing ${reviewManifestName}`;
    return entry;
  }
  try {
    const payload = JSON.parse(readFileSync(path, "utf8"));
    entry.candidate = payload.candidate ?? null;
    entry.status = payload.status ?? null;
    entry.valid = payload.candidate === expectedCandidate && payload.status === "READY_FOR_FORMAL_REVIEW";
    if (!entry.valid) entry.error = "manifest candidate/status does not release this revision for formal review";
  } catch (error) {
    entry.error = error instanceof Error ? error.message : String(error);
  }
  return entry;
}

function inspectAssets(assetRoot) {
  const assets = [];
  for (const variant of variants) {
    for (const frame of frames) {
      const path = join(assetRoot, variant.directory, frame.file);
      const entry = {
        frame: frame.id,
        title: frame.title,
        variant: variant.directory,
        variantLabel: variant.label,
        path: relative(boardRoot, path),
        expectedDimensions: variant.expected.map(([width, height]) => `${width}x${height}`),
        present: existsSync(path),
        validDimensions: false,
        actualDimensions: null,
        bytes: null,
        error: null,
      };
      if (entry.present) {
        try {
          const dimensions = readPngDimensions(path);
          entry.actualDimensions = `${dimensions.width}x${dimensions.height}`;
          entry.bytes = dimensions.bytes;
          entry.validDimensions = dimensionsMatch(dimensions, variant.expected);
          if (!entry.validDimensions) entry.error = "unexpected dimensions";
        } catch (error) {
          entry.error = error instanceof Error ? error.message : String(error);
        }
      } else {
        entry.error = "missing asset";
      }
      assets.push(entry);
    }
  }
  return assets;
}

function writeReport(output, report) {
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
}

let options;
try {
  options = parseArgs(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  usage();
  process.exit(64);
}

const assets = inspectAssets(options.assetRoot);
const reviewManifest = inspectReviewManifest(options.assetRoot);
const present = assets.filter((asset) => asset.present).length;
const missing = assets.length - present;
const invalidDimensions = assets.filter((asset) => asset.present && !asset.validDimensions).length;
const status = !reviewManifest.valid
  ? "BLOCKED"
  : invalidDimensions > 0
    ? "FAIL"
    : missing > 0
      ? "BLOCKED"
      : "READY_FOR_VISUAL_REVIEW";
const report = {
  schemaVersion: 1,
  candidate: expectedCandidate,
  status,
  gate: "BLOCKED",
  approval: "AWAITING_USER_SECOND_APPROVAL",
  meaning: status === "READY_FOR_VISUAL_REVIEW"
    ? "The explicit review manifest is valid and all expected raster exports are present and dimensionally valid; eight visible checks still require human Yes/No review."
    : !reviewManifest.valid
      ? "Formal art is deliberately hidden until the designated review manifest explicitly releases the redrawn revision. Existing unreleased exports are not candidates."
      : "The formal review board cannot be visually accepted while released exports are missing or invalid.",
  assetRoot: relative(boardRoot, options.assetRoot),
  reviewManifest,
  summary: {
    expected: assets.length,
    present,
    missing,
    invalidDimensions,
  },
  assets,
  manualChecks,
};

writeReport(options.output, report);

if (status === "READY_FOR_VISUAL_REVIEW") {
  console.log(`READY_FOR_VISUAL_REVIEW ${present}/${assets.length} assets; manual checks remain unset`);
  process.exit(0);
}

if (status === "BLOCKED") {
  const reason = reviewManifest.valid
    ? `${missing}/${assets.length} expected assets missing`
    : `${reviewManifestName} absent or invalid; unreleased art remains hidden`;
  console.error(`BLOCKED ${reason}; report: ${options.output}`);
  process.exit(2);
}

console.error(`FAIL ${invalidDimensions} asset(s) have invalid PNG headers or dimensions; report: ${options.output}`);
process.exit(1);
