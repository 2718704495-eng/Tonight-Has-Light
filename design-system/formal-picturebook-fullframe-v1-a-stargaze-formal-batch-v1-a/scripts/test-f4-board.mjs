import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(SCRIPT_DIR, '..');
const PROJECT_ROOT = resolve(PACKAGE_ROOT, '../..');
const F4_390 = 'design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_004/exports/390x844/scene_02_stargaze_shot_004.png';
const F4_195 = 'design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_004/exports/195x422/scene_02_stargaze_shot_004.png';

const sha256File = async (path) => createHash('sha256').update(await readFile(path)).digest('hex');

const result = spawnSync(process.execPath, [resolve(SCRIPT_DIR, 'build-stargaze-board.mjs')], {
  cwd: PACKAGE_ROOT,
  encoding: 'utf8',
});
if (result.status !== 0) {
  throw new Error(`F4 board build failed (${result.status}):\n${result.stdout}${result.stderr}`);
}

const report = JSON.parse(await readFile(resolve(PACKAGE_ROOT, 'evidence/f4-review-board-report.json'), 'utf8'));
if (report.candidateId !== 'stargaze-formal-batch-v1-a-f4-r1') {
  throw new Error(`wrong board candidate: ${report.candidateId}`);
}
if (!report.board390.source_hashes[F4_390]) throw new Error('390 board omits F4');
if (!report.board195.source_hashes[F4_195]) throw new Error('195 board omits F4');
if (Object.keys(report.board390.source_hashes).length !== 6) throw new Error('390 board must contain ROOT/F1/F2/F3/F4/F5');
if (Object.keys(report.board195.source_hashes).length !== 6) throw new Error('195 board must contain ROOT/F1/F2/F3/F4/F5');

for (const board of [report.board390, report.board195]) {
  const actual = await sha256File(resolve(PROJECT_ROOT, board.path));
  if (actual !== board.sha256) throw new Error(`board hash mismatch: ${board.path}`);
}

process.stdout.write('PASS: F4 appears between F3 and F5 on both review boards\n');
