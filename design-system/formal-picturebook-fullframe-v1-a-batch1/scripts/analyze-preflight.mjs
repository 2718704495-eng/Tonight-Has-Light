import { stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const batchRoot = path.resolve(scriptDir, '..');
const projectRoot = path.resolve(batchRoot, '../..');
const pages = [
  {
    page_id: 'root_night_slope_v1',
    master_path: 'design-system/formal-picturebook-fullframe-v1-a-root-r4-manual-hem/source/masters/root_night_slope_v2-wind-hem-r4-manual-master-2x.png',
    master_sha256: '41599f03a0a7a71acd953b46066c3205b4da1522d0a06bd86b73186afedccdc8',
  },
  {
    page_id: 'scene_02_stargaze_shot_005',
    master_path: 'design-system/formal-picturebook-fullframe-v1-a-batch1/source/masters/scene_02_stargaze_shot_005-master-2x.png',
    master_sha256: 'd36b99ebfe0805233000df9c0cbf2bc6217691111a7da7fa8e2dbe2eb99e4a85',
  },
  {
    page_id: 'scene_01_home_shot_005',
    master_path: 'design-system/formal-picturebook-fullframe-v1-a-batch1/source/masters/scene_01_home_shot_005-master-2x.png',
    master_sha256: '1323cf0a103fffd7f8fd731ab0e1164527b9b0401b5d6acd357d1d3b215ecfb9',
  },
];
const decodedBytesPerPage = 780 * 1688 * 4;
const report = {
  candidate_id: 'formal-picturebook-fullframe-v1-a-batch1-r2-r4-root',
  status: 'STATIC_SOURCE_PREFLIGHT_ONLY_NOT_RUNTIME_PASS',
  measured_at: '2026-08-30',
  master_dimensions: '780x1688 RGBA budget assumption',
  decoded_bytes_per_page: decodedBytesPerPage,
  decoded_mib_per_page: Number((decodedBytesPerPage / 1024 / 1024).toFixed(3)),
  two_page_transition_decoded_mib: Number((decodedBytesPerPage * 2 / 1024 / 1024).toFixed(3)),
  three_page_all_resident_decoded_mib: Number((decodedBytesPerPage * 3 / 1024 / 1024).toFixed(3)),
  pages: [],
  boundary: 'No Cocos build, texture compression, atlas, bundle, phone memory or WeChat package claim is made by this static calculation.',
};
for (const page of pages) {
  const file = path.resolve(projectRoot, page.master_path);
  const info = await stat(file);
  report.pages.push({ ...page, png_bytes: info.size });
}
report.total_three_master_png_bytes = report.pages.reduce((sum, page) => sum + page.png_bytes, 0);
const output = path.join(batchRoot, 'evidence/package-memory-preflight.json');
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
