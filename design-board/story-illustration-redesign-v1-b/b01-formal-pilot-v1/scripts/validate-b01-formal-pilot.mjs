import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require('/Users/wxl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = resolve(root, '../../..');
const reference = join(projectRoot, 'design-board/story-illustration-redesign-v1-b/exploration/b01-settle-reference-r1.png');
const ora = join(root, 'source/b01-formal-pilot-v1.ora');
const expectedReferenceHash = 'fdac7f8edf8a22954a93a3f756ab2c1699c1afe04462bf2fa3ed679ae2794d0c';

const checks = [];
const check = (condition, label) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  checks.push(label);
};
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');

check(sha256(reference) === expectedReferenceHash, 'approved B01 reference identity');

const dimensions = [
  ['exports/b01-formal-pilot-v1-390x844.png', 390, 844],
  ['exports/b01-formal-pilot-v1-thumbnail-195x422.png', 195, 422],
  ['exports/b01-formal-pilot-v1-360x800.png', 360, 800],
  ['exports/b01-formal-pilot-v1-430x932.png', 430, 932],
  ['exports/b01-formal-pilot-v1-430x844-pressure.png', 430, 844],
  ['exports/safe-area-overlays/b01-formal-pilot-v1-390x844-safe-overlay.png', 390, 844],
  ['exports/safe-area-overlays/b01-formal-pilot-v1-360x800-safe-overlay.png', 360, 800],
  ['exports/safe-area-overlays/b01-formal-pilot-v1-430x932-safe-overlay.png', 430, 932],
  ['exports/safe-area-overlays/b01-formal-pilot-v1-430x844-pressure-safe-overlay.png', 430, 844],
];
for (const [relativePath, width, height] of dimensions) {
  const metadata = await sharp(join(root, relativePath)).metadata();
  check(metadata.width === width && metadata.height === height, `${relativePath} dimensions ${width}x${height}`);
}

const layerManifest = JSON.parse(readFileSync(join(root, 'source/layer-manifest.json'), 'utf8'));
check(layerManifest.renderOrder.length === 17, '17 editable production layers');
check(layerManifest.constraints.milkyWayCount === 1, 'one Milky Way contract');
check(layerManifest.constraints.flowerCount === 2, 'exactly two flowers contract');
check(layerManifest.constraints.uiTextDialogueCount === 0, 'zero UI/text/dialogue contract');

for (const layer of layerManifest.renderOrder) {
  const metadata = await sharp(join(root, layer.file)).metadata();
  check(metadata.width === 780 && metadata.height === 1688, `${layer.id} source dimensions 780x1688`);
}

const oraEntries = execFileSync('unzip', ['-Z1', ora], { encoding: 'utf8' }).trim().split('\n');
check(oraEntries[0] === 'mimetype', 'OpenRaster mimetype is first archive entry');
check(oraEntries.filter((entry) => /^data\/[^/]+\.png$/.test(entry)).length === 17, 'OpenRaster contains 17 layer PNGs');
check(oraEntries.includes('stack.xml') && oraEntries.includes('mergedimage.png') && oraEntries.includes('Thumbnails/thumbnail.png'), 'OpenRaster stack, merged image, and thumbnail');
check(!oraEntries.some((entry) => entry.includes('reference') || entry.includes('exploration')), 'OpenRaster excludes reference/exploration assets');

const exported = await sharp(join(root, 'exports/b01-formal-pilot-v1-390x844.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let transparentPixels = 0;
for (let index = 3; index < exported.data.length; index += 4) {
  if (exported.data[index] !== 255) transparentPixels += 1;
}
check(transparentPixels === 0, '390x844 derivative is fully opaque with no alpha fringe');

execFileSync('shasum', ['-c', 'HASHES.sha256'], { cwd: root, stdio: 'pipe' });
check(true, 'complete HASHES.sha256 verification');

process.stdout.write(`PASS ${checks.length}/${checks.length}\n${checks.join('\n')}\n`);
