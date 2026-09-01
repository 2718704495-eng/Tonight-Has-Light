import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, '..');
const projectRoot = path.resolve(packageRoot, '../..');
const outputPath = path.join(packageRoot, 'HASHES.sha256');

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (full === outputPath) continue;
    if (entry.isDirectory()) {
      files.push(...await listFiles(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function hashBuffer(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

const files = (await listFiles(packageRoot)).sort((a, b) => a.localeCompare(b));
const lines = [];
for (const file of files) {
  const relative = path.relative(projectRoot, file);
  lines.push(`${hashBuffer(await readFile(file))}  ${relative}`);
}
await writeFile(outputPath, `${lines.join('\n')}\n`);
process.stdout.write(`${path.relative(projectRoot, outputPath)}\n`);
