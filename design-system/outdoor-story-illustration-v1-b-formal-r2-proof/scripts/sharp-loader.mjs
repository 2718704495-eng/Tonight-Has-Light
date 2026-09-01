import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);

export function loadSharp() {
  const candidates = [
    'sharp',
    process.env.CODEX_WORKSPACE_NODE_MODULES
      ? join(process.env.CODEX_WORKSPACE_NODE_MODULES, 'sharp')
      : null,
    join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'),
  ].filter(Boolean);

  const failures = [];
  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch (error) {
      failures.push(`${candidate}: ${error.code ?? error.message}`);
    }
  }
  throw new Error(`Sharp is required for deterministic export. Tried:\n${failures.join('\n')}`);
}

