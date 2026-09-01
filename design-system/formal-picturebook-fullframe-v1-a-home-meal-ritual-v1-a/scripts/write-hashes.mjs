import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

import { PACKAGE_ROOT } from './package-utils.mjs';

const EXCLUDED_NAMES = new Set(['HASHES.sha256', '.DS_Store']);

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (EXCLUDED_NAMES.has(entry.name)) continue;
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await filesUnder(fullPath));
    if (entry.isFile()) result.push(fullPath);
  }
  return result;
}

export async function buildHashManifest() {
  const files = await filesUnder(PACKAGE_ROOT);
  const lines = await Promise.all(files.map(async (filePath) => {
    const digest = createHash('sha256').update(await readFile(filePath)).digest('hex');
    return `${digest}  ${relative(PACKAGE_ROOT, filePath)}`;
  }));
  return `${lines.join('\n')}\n`;
}

export async function writeHashManifest() {
  const contents = await buildHashManifest();
  await writeFile(join(PACKAGE_ROOT, 'HASHES.sha256'), contents);
  return contents;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const contents = await buildHashManifest();
  if (process.argv.includes('--stdout')) {
    process.stdout.write(contents);
  } else {
    await writeHashManifest();
    process.stdout.write('HASHES.sha256 written\n');
  }
}
