import { createHash } from 'node:crypto';
import { access, copyFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const batchRoot = path.resolve(scriptDir, '..');
const projectRoot = path.resolve(batchRoot, '../..');

const approved = {
  '195x422': {
    source: 'design-system/formal-picturebook-fullframe-v1-a-root-r4-manual-hem/exports/195x422/root_night_slope_v2-wind-hem-r4-manual.png',
    sha256: '6ceac63b51bf9c6e8311aded28c6adf1fe7e6349e864d5f475976b7c09bb9491',
    historicalR1Sha256: '8bcf0f5db8218d6899db88a2d47aa4f1275c4ee5bcb1900924d81023f181d737',
  },
  '390x844': {
    source: 'design-system/formal-picturebook-fullframe-v1-a-root-r4-manual-hem/exports/390x844/root_night_slope_v2-wind-hem-r4-manual.png',
    sha256: '23443918a0c892d569a6fd49b55b889d70bb4ed0dc7a6396a0af2bf5fad2306a',
    historicalR1Sha256: '65b666609bca317ea572ff42d2d92f1e966f1ac91f9b46e0c51b1c8d9a7323fd',
  },
  '360x800': {
    source: 'design-system/formal-picturebook-fullframe-v1-a-root-r4-manual-hem/exports/360x800/root_night_slope_v2-wind-hem-r4-manual.png',
    sha256: '0b24bd86d062b2ad1c7f905b52156c341dad6c220298c816740a7a9687191636',
    historicalR1Sha256: '4bdf3b2247c552a6b3e5883c0b2cd79ed9e1960c5206197e344197a34c15e293',
  },
  '430x932': {
    source: 'design-system/formal-picturebook-fullframe-v1-a-root-r4-manual-hem/exports/430x932/root_night_slope_v2-wind-hem-r4-manual.png',
    sha256: '59877dd4db6b10da3ff0547d542893862b7f957a0b566d287fc5898c00e700fb',
    historicalR1Sha256: '9f112ac6ea8574978f7623dbbc1cd2bf3acf9739dc02901c093e03dfbeae3120',
  },
  '430x844-pressure': {
    source: 'design-system/formal-picturebook-fullframe-v1-a-root-r4-manual-hem/exports/430x844-pressure/root_night_slope_v2-wind-hem-r4-manual.png',
    sha256: 'b475ab37dc5fdc9eb1741eaab2e5fb3de5638ffeabb590729ef99d755e20fc2f',
    historicalR1Sha256: '92403de51a7735c11abb4ab1a419345dca5b8039e9d071b4c2bf31d2f1557326',
  },
};

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

const report = {
  candidate_id: 'formal-picturebook-fullframe-v1-a-batch1-r2-r4-root',
  operation: 'byte-identical copy of approved R4 review exports into the Batch 1 stable export names',
  archived_historical_r1: [],
  synced_r4: [],
};

for (const [folder, contract] of Object.entries(approved)) {
  const source = path.resolve(projectRoot, contract.source);
  const target = path.join(batchRoot, 'exports', folder, 'root_night_slope_v1.png');
  const historical = path.join(batchRoot, 'evidence', 'historical-r1', 'exports', folder, 'root_night_slope_v1.png');
  const sourceDigest = await sha256(source);
  if (sourceDigest !== contract.sha256) throw new Error(`Approved R4 source drift: ${contract.source}`);

  await mkdir(path.dirname(target), { recursive: true });
  if (await exists(target)) {
    const targetDigest = await sha256(target);
    if (targetDigest !== contract.sha256) {
      if (targetDigest !== contract.historicalR1Sha256) {
        throw new Error(`Refusing to replace an unrecognized root export: ${path.relative(projectRoot, target)}`);
      }
      if (!(await exists(historical))) {
        await mkdir(path.dirname(historical), { recursive: true });
        await copyFile(target, historical);
      }
      if (await sha256(historical) !== contract.historicalR1Sha256) {
        throw new Error(`Historical R1 archive drift: ${path.relative(projectRoot, historical)}`);
      }
      report.archived_historical_r1.push({ folder, path: path.relative(projectRoot, historical), sha256: targetDigest });
    }
  }

  await copyFile(source, target);
  const targetDigest = await sha256(target);
  if (targetDigest !== contract.sha256) throw new Error(`R4 copy mismatch: ${path.relative(projectRoot, target)}`);
  report.synced_r4.push({
    folder,
    source: contract.source,
    target: path.relative(projectRoot, target),
    sha256: targetDigest,
  });
}

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
