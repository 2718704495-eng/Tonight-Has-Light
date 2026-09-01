#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

function collect(directory) {
  const files = [];
  for (const entry of readdirSync(directory).sort()) {
    if (entry === '.DS_Store' || entry === 'HASHES.sha256') continue;
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) files.push(...collect(path));
    else files.push(path);
  }
  return files;
}

if (!existsSync(ROOT)) throw new Error('proof root missing');
const lines = collect(ROOT)
  .map((path) => `${createHash('sha256').update(readFileSync(path)).digest('hex')}  ${relative(ROOT, path)}`)
  .sort();
writeFileSync(join(ROOT, 'HASHES.sha256'), `${lines.join('\n')}\n`);
console.log(`WROTE ${lines.length} deterministic file hashes`);

