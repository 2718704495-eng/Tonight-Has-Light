import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, '..');
const projectRoot = path.resolve(packageRoot, '../..');
const hashFile = path.join(packageRoot, 'HASHES.sha256');

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (absolute.includes(`${path.sep}superseded${path.sep}`)) continue;
    if (entry.isDirectory()) files.push(...await collectFiles(absolute));
    else if (entry.isFile() && absolute !== hashFile) files.push(absolute);
  }
  return files;
}

const files = (await collectFiles(packageRoot)).sort((a, b) => a.localeCompare(b, 'en'));
const lines = [];
for (const file of files) {
  const digest = createHash('sha256').update(await readFile(file)).digest('hex');
  lines.push(`${digest}  ${path.relative(projectRoot, file)}`);
}
await writeFile(hashFile, `${lines.join('\n')}\n`, 'utf8');
process.stdout.write(`Wrote ${files.length} entries to ${hashFile}\n`);
