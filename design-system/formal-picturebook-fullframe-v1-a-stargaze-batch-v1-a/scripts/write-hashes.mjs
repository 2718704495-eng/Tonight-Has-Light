import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(SCRIPT_DIR, '..');
const EXCLUDED = new Set(['HASHES.pre-user-approval.sha256', '.DS_Store']);

async function filesUnder(directory) {
  const result = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (EXCLUDED.has(entry.name)) continue;
    const full = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await filesUnder(full));
    if (entry.isFile()) result.push(full);
  }
  return result;
}

const files = await filesUnder(PACKAGE_ROOT);
const lines = [];
for (const file of files) {
  const hash = createHash('sha256').update(await readFile(file)).digest('hex');
  lines.push(`${hash}  ${relative(PACKAGE_ROOT, file)}`);
}
await writeFile(resolve(PACKAGE_ROOT, 'HASHES.pre-user-approval.sha256'), `${lines.join('\n')}\n`);
process.stdout.write(`Wrote ${lines.length} hashes\n`);
