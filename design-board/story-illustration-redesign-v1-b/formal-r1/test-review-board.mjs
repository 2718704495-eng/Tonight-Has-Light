import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const root = dirname(fileURLToPath(import.meta.url));
const checker = join(root, "check-visuals.mjs");
const capture = join(root, "capture-board.mjs");
const temp = mkdtempSync(join(tmpdir(), "formal-r1-board-test-"));
let browserFixture = null;

const frames = ["b01-settle.png", "b02-wind-passes.png", "b03-afterwind.png"];
const variants = [
  ["390x844", 390, 844],
  ["thumbnail-195x422", 195, 422],
  ["360x800", 360, 800],
  ["430x932", 430, 932],
  ["430x844-pressure", 430, 844],
];

const reviewManifest = {
  candidate: "STORY-ILLUSTRATION-REDESIGN-V1-B-FORMAL-R1",
  status: "READY_FOR_FORMAL_REVIEW",
};

function pngHeader(width, height) {
  const bytes = Buffer.alloc(33);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes, 0);
  bytes.writeUInt32BE(13, 8);
  bytes.write("IHDR", 12, "ascii");
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  bytes[24] = 8;
  bytes[25] = 6;
  return bytes;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([length, typeBytes, data, checksum]);
}

function pngImage(width, height) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const rows = Buffer.alloc((width * 4 + 1) * height);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(rows)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function makeFixture(assetRoot, { wrongDimension = false, reviewReady = false, browserDecodable = false } = {}) {
  for (const [variant, width, height] of variants) {
    for (const frame of frames) {
      const path = join(assetRoot, variant, frame);
      mkdirSync(dirname(path), { recursive: true });
      const useWrongDimension = wrongDimension && variant === "390x844" && frame === "b02-wind-passes.png";
      const actualWidth = useWrongDimension ? width - 1 : width;
      const bytes = browserDecodable
        ? pngImage(actualWidth, height)
        : pngHeader(actualWidth, height);
      writeFileSync(path, bytes);
    }
  }
  if (reviewReady) {
    writeFileSync(join(assetRoot, "FORMAL-REVIEW-MANIFEST.json"), `${JSON.stringify(reviewManifest, null, 2)}\n`);
  }
}

function runChecker(assetRoot, output) {
  return spawnSync(process.execPath, [checker, "--asset-root", assetRoot, "--output", output], {
    cwd: root,
    encoding: "utf8",
  });
}

try {
  const missingRoot = join(temp, "missing-assets");
  const missingOutput = join(temp, "missing.json");
  const missing = runChecker(missingRoot, missingOutput);
  assert.equal(missing.status, 2, `missing assets must exit 2, got ${missing.status}\n${missing.stderr}`);
  const missingReport = JSON.parse(readFileSync(missingOutput, "utf8"));
  assert.equal(missingReport.status, "BLOCKED");
  assert.equal(missingReport.summary.expected, 15);
  assert.equal(missingReport.summary.present, 0);
  assert.equal(missingReport.summary.missing, 15);
  assert.equal(missingReport.reviewManifest.valid, false);

  const unreleasedRoot = join(temp, "unreleased-assets");
  const unreleasedOutput = join(temp, "unreleased.json");
  makeFixture(unreleasedRoot);
  const unreleased = runChecker(unreleasedRoot, unreleasedOutput);
  assert.equal(unreleased.status, 2, `unreleased assets must exit 2, got ${unreleased.status}\n${unreleased.stderr}`);
  const unreleasedReport = JSON.parse(readFileSync(unreleasedOutput, "utf8"));
  assert.equal(unreleasedReport.status, "BLOCKED");
  assert.equal(unreleasedReport.summary.present, 15);
  assert.equal(unreleasedReport.summary.missing, 0);
  assert.equal(unreleasedReport.reviewManifest.present, false);
  assert.equal(unreleasedReport.reviewManifest.valid, false);

  const readyRoot = join(temp, "ready-assets");
  const readyOutput = join(temp, "ready.json");
  makeFixture(readyRoot, { reviewReady: true });
  const ready = runChecker(readyRoot, readyOutput);
  assert.equal(ready.status, 0, `complete assets must exit 0, got ${ready.status}\n${ready.stderr}`);
  const readyReport = JSON.parse(readFileSync(readyOutput, "utf8"));
  assert.equal(readyReport.status, "READY_FOR_VISUAL_REVIEW");
  assert.equal(readyReport.gate, "BLOCKED");
  assert.equal(readyReport.approval, "AWAITING_USER_SECOND_APPROVAL");
  assert.equal(readyReport.summary.present, 15);
  assert.equal(readyReport.summary.invalidDimensions, 0);
  assert.equal(readyReport.reviewManifest.valid, true);
  assert.equal(readyReport.manualChecks.length, 8);
  assert.ok(readyReport.manualChecks.every((item) => item.result === null));

  const invalidRoot = join(temp, "invalid-assets");
  const invalidOutput = join(temp, "invalid.json");
  makeFixture(invalidRoot, { wrongDimension: true, reviewReady: true });
  const invalid = runChecker(invalidRoot, invalidOutput);
  assert.equal(invalid.status, 1, `invalid dimensions must exit 1, got ${invalid.status}\n${invalid.stderr}`);
  const invalidReport = JSON.parse(readFileSync(invalidOutput, "utf8"));
  assert.equal(invalidReport.status, "FAIL");
  assert.equal(invalidReport.summary.invalidDimensions, 1);

  console.log("PASS check-visuals: missing, unreleased, ready, and invalid-dimension contracts");

  const auditOutput = join(temp, "blocked-board-audit.json");
  browserFixture = mkdtempSync(join(root, ".formal-r1-test-"));
  makeFixture(browserFixture, { browserDecodable: true });
  const browserFixtureBase = `/design-board/story-illustration-redesign-v1-b/formal-r1/${basename(browserFixture)}/`;
  const audit = spawnSync(process.execPath, [
    capture,
    "--audit-only",
    "--allow-blocked",
    "--asset-base",
    browserFixtureBase,
    "--output",
    auditOutput,
  ], { cwd: root, encoding: "utf8" });
  assert.equal(audit.status, 0, `blocked board audit must exit 0 when explicitly allowed\n${audit.stderr}`);
  const auditReport = JSON.parse(readFileSync(auditOutput, "utf8"));
  assert.equal(auditReport.assetStatus, "BLOCKED");
  assert.equal(auditReport.displaySlots, 18);
  assert.equal(auditReport.loadedSlots, 0);
  assert.equal(auditReport.blockedSlots, 18);
  assert.equal(auditReport.reviewManifest.present, false);
  assert.equal(auditReport.reviewManifest.valid, false);
  assert.equal(auditReport.manualChecks, 8);
  assert.equal(auditReport.contractThumbnail.label, "195×422 · 合同缩略 / 50%");
  assert.equal(auditReport.extremeThumbnail.label, "98×211 · 额外极限缩略 / 25%");

  const forbiddenScreenshotDir = join(temp, "blocked-screenshots");
  const forbiddenCaptureOutput = join(temp, "blocked-capture.json");
  const forbiddenCapture = spawnSync(process.execPath, [
    capture,
    "--allow-blocked",
    "--asset-base",
    browserFixtureBase,
    "--output",
    forbiddenCaptureOutput,
    "--screenshots",
    forbiddenScreenshotDir,
  ], { cwd: root, encoding: "utf8" });
  assert.equal(forbiddenCapture.status, 2, `BLOCKED art must never produce screenshots\n${forbiddenCapture.stderr}`);
  assert.equal(existsSync(forbiddenScreenshotDir), false);

  const releasedAuditOutput = join(temp, "released-board-audit.json");
  writeFileSync(join(browserFixture, "FORMAL-REVIEW-MANIFEST.json"), `${JSON.stringify(reviewManifest, null, 2)}\n`);
  const releasedAudit = spawnSync(process.execPath, [
    capture,
    "--audit-only",
    "--asset-base",
    browserFixtureBase,
    "--output",
    releasedAuditOutput,
  ], { cwd: root, encoding: "utf8" });
  assert.equal(releasedAudit.status, 0, `released board audit must exit 0\n${releasedAudit.stderr}`);
  const releasedAuditReport = JSON.parse(readFileSync(releasedAuditOutput, "utf8"));
  assert.equal(releasedAuditReport.assetStatus, "READY_FOR_VISUAL_REVIEW");
  assert.equal(releasedAuditReport.loadedSlots, 18);
  assert.equal(releasedAuditReport.blockedSlots, 0);
  assert.equal(releasedAuditReport.reviewManifest.valid, true);

  writeFileSync(join(browserFixture, "390x844/b02-wind-passes.png"), pngImage(389, 844));
  const wrongSizeScreenshotDir = join(temp, "wrong-size-screenshots");
  const wrongSizeCaptureOutput = join(temp, "wrong-size-capture.json");
  const wrongSizeCapture = spawnSync(process.execPath, [
    capture,
    "--asset-base",
    browserFixtureBase,
    "--output",
    wrongSizeCaptureOutput,
    "--screenshots",
    wrongSizeScreenshotDir,
  ], { cwd: root, encoding: "utf8" });
  assert.equal(wrongSizeCapture.status, 2, `dimension-invalid art must stop before screenshots\n${wrongSizeCapture.stderr}`);
  assert.equal(existsSync(wrongSizeScreenshotDir), false);

  console.log("PASS board DOM: manifest and dimension gates stop invalid screenshots, release valid art, and keep thumbnail labels unambiguous");
} finally {
  if (browserFixture) rmSync(browserFixture, { recursive: true, force: true });
  rmSync(temp, { recursive: true, force: true });
}
