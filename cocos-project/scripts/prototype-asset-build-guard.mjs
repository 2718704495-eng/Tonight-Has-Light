import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

function listFiles(root) {
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function collectSourceSignatures(sourceRoot) {
  const hashes = new Set();
  const uuids = new Set();
  for (const path of listFiles(sourceRoot)) {
    const buffer = readFileSync(path);
    hashes.add(sha256(buffer));
    if (!path.endsWith(".meta")) continue;
    try {
      const meta = JSON.parse(buffer.toString("utf8"));
      if (typeof meta.uuid === "string" && meta.uuid.length > 0) uuids.add(meta.uuid);
    } catch {
      // Project validation handles invalid metadata. Its exact file hash still
      // remains a forbidden build signature here.
    }
  }
  return { hashes, uuids };
}

export function findPrototypeBuildArtifacts({ buildRoot, sourceRoot, directoryMarker }) {
  const normalizedMarker = directoryMarker.toLowerCase();
  const { hashes: sourceHashes, uuids: sourceUuids } = collectSourceSignatures(sourceRoot);
  const artifacts = [];

  for (const path of listFiles(buildRoot)) {
    const relativePath = relative(buildRoot, path).split("\\").join("/");
    const relativePathLower = relativePath.toLowerCase();
    const buffer = readFileSync(path);
    const reasons = [];

    if (relativePathLower.includes(normalizedMarker)) reasons.push("directory-marker-in-path");
    if (buffer.includes(Buffer.from(directoryMarker, "utf8"))) {
      reasons.push("directory-marker-in-content");
    }
    if (sourceHashes.has(sha256(buffer))) reasons.push("exact-source-hash");
    for (const uuid of sourceUuids) {
      if (
        relativePathLower.includes(uuid.toLowerCase())
        || buffer.includes(Buffer.from(uuid, "utf8"))
      ) {
        reasons.push(`source-uuid:${uuid}`);
        break;
      }
    }

    if (reasons.length > 0) artifacts.push({ path: relativePath, reasons });
  }

  return artifacts;
}
